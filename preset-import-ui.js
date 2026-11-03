'use strict';

if (window.relicDesktop && typeof window.relicDesktop.startPresetImport === 'function') (() => {
  const editorTop = document.querySelector('.editor-top');
  if (!editorTop) return;

  const actionWrap = document.createElement('div');
  actionWrap.className = 'editor-top-actions';
  actionWrap.innerHTML = '<button id="preset-import-open" type="button" title="ゲーム内のプリセット一覧からマイセットを自動読み取りして保存します">📥 ゲームからマイセット取り込み</button>';
  editorTop.append(actionWrap);

  const buildMenuHead = document.querySelector('#build-menu .build-menu-head');
  if (buildMenuHead) {
    const quickBtn = document.createElement('button');
    quickBtn.type = 'button';
    quickBtn.className = 'subtle';
    quickBtn.id = 'preset-import-menu-open';
    quickBtn.textContent = '📥 ゲームから取込';
    buildMenuHead.append(quickBtn);
  }

  const dialog = document.createElement('dialog');
  dialog.id = 'preset-import-dialog';
  dialog.innerHTML = `
    <div class="dialog-head">
      <div>
        <p class="eyebrow">PRESET IMPORT</p>
        <h2>ゲームからマイセットを自動登録</h2>
      </div>
      <button id="preset-import-close" class="icon-button" type="button" aria-label="閉じる">×</button>
    </div>
    <p class="preset-import-help">
      ゲーム内で「プリセット一覧」（または「遺物儀式」画面）を開いた状態で実行してください。<br>
      3秒後にゲーム画面へフォーカスし、マイセット名・キャラクター・盃・通常遺物（1〜3）・深層遺物（1〜3）とデメリット効果を自動で読み取って「保存した構成」に登録します。実行中は <strong>F8キー</strong> でいつでも緊急停止できます。
    </p>
    <div class="preset-import-window-row">
      <label for="preset-import-window">対象ウィンドウ
        <select id="preset-import-window"></select>
      </label>
      <button id="preset-import-refresh" type="button">ウィンドウを再取得</button>
    </div>
    <div class="preset-import-options">
      <label>
        <input id="preset-import-overwrite" type="checkbox" checked>
        <span>同じキャラクターに同名の構成がある場合は上書き更新する</span>
      </label>
      <label>
        <input id="preset-import-include-current" type="checkbox">
        <span>一括取り込み時に先頭の「現在の配置」も含める</span>
      </label>
    </div>
    <div class="preset-import-actions">
      <button id="preset-import-start-single" class="primary" type="button">現在選択中の1件を取り込む</button>
      <button id="preset-import-start-all" type="button">一覧を上から順番に一括取り込み</button>
      <button id="preset-import-stop" type="button" disabled>停止（F8）</button>
    </div>
    <p id="preset-import-status" role="status"></p>
    <pre id="preset-import-log"></pre>
  `;
  document.body.append(dialog);

  const el = id => document.getElementById(id);
  let running = false;
  let importedCountInRun = 0;
  let lastImportedBuildId = null;

  function updateButtons() {
    const hasWindow = Boolean(el('preset-import-window')?.value);
    el('preset-import-start-single').disabled = running || !hasWindow;
    el('preset-import-start-all').disabled = running || !hasWindow;
    el('preset-import-stop').disabled = !running;
    el('preset-import-window').disabled = running;
    el('preset-import-refresh').disabled = running;
    el('preset-import-overwrite').disabled = running;
    el('preset-import-include-current').disabled = running;
  }

  async function refreshWindows() {
    try {
      const windows = await window.relicDesktop.filterWindows();
      const select = el('preset-import-window');
      select.replaceChildren(...windows.map(w => new Option(w.name, w.id)));
      if (!windows.length) {
        el('preset-import-status').textContent = 'ゲームのウィンドウが見つかりませんでした。ゲームを起動してから「ウィンドウを再取得」を押してください。';
      }
    } catch (error) {
      el('preset-import-status').textContent = error.message || 'ウィンドウ一覧の取得に失敗しました。';
    }
    updateButtons();
  }

  function appendLog(text) {
    const logEl = el('preset-import-log');
    if (!logEl) return;
    logEl.textContent += text + '\n';
    logEl.scrollTop = logEl.scrollHeight;
  }

  function applyImportedBuildToPlanner(incomingBuild, { overwriteSameName = true, loadIntoEditor = false } = {}) {
    if (!incomingBuild || typeof validBuild !== 'function') return null;
    const candidate = {
      id: incomingBuild.id || crypto.randomUUID(),
      name: String(incomingBuild.name || 'マイセット').trim().slice(0, 80) || 'マイセット',
      character: incomingBuild.character || ($('character') ? $('character').value : '追跡者'),
      vessel: incomingBuild.vessel || null,
      slots: Array.isArray(incomingBuild.slots) ? incomingBuild.slots.slice(0, 18) : Array(18).fill(null),
      penalties: Array.isArray(incomingBuild.penalties) ? incomingBuild.penalties.slice(0, 9) : Array(9).fill(null),
      damage: typeof defaultDamageSettings === 'function' ? defaultDamageSettings() : undefined,
      updatedAt: incomingBuild.updatedAt || new Date().toISOString()
    };

    if (!validBuild(candidate)) {
      appendLog(`⚠️ 「${candidate.name}」の一部の効果データを検証できなかったためスキップしました。`);
      return null;
    }

    if (overwriteSameName) {
      const existingIdx = saved.findIndex(b => b.character === candidate.character && b.name === candidate.name);
      if (existingIdx !== -1) {
        candidate.id = saved[existingIdx].id;
        candidate.damage = saved[existingIdx].damage || candidate.damage;
        saved.splice(existingIdx, 1);
      }
    }

    saved.unshift(candidate);
    persist();

    if (loadIntoEditor) {
      currentId = candidate.id;
      vesselId = candidate.vessel || null;
      slots = [...candidate.slots];
      penaltySlots = candidate.penalties ? [...candidate.penalties] : Array(9).fill(null);
      if ($('character')) $('character').value = candidate.character;
      if ($('name')) $('name').value = candidate.name;
      if (typeof setBuildDamageSettings === 'function') setBuildDamageSettings(candidate.damage);
      draft(true);
      dirty = false;
      updateSaveState();
    } else {
      renderSaved();
    }

    return candidate;
  }

  async function runImport(mode) {
    if (running) return;
    const windowId = el('preset-import-window')?.value;
    if (!windowId) return;

    running = true;
    importedCountInRun = 0;
    lastImportedBuildId = null;
    updateButtons();

    el('preset-import-log').textContent = '';
    el('preset-import-status').textContent = '準備中… ゲーム画面を表示してお待ちください。';

    const overwriteSameName = Boolean(el('preset-import-overwrite')?.checked);
    const includeCurrent = Boolean(el('preset-import-include-current')?.checked);
    const defaultCharacter = $('character') ? $('character').value : '追跡者';

    try {
      const result = await window.relicDesktop.startPresetImport({
        windowId,
        mode,
        includeCurrent,
        defaultCharacter
      });

      if (lastImportedBuildId) {
        const targetBuild = saved.find(b => b.id === lastImportedBuildId);
        if (targetBuild) {
          currentId = targetBuild.id;
          vesselId = targetBuild.vessel || null;
          slots = [...targetBuild.slots];
          penaltySlots = targetBuild.penalties ? [...targetBuild.penalties] : Array(9).fill(null);
          if ($('character')) $('character').value = targetBuild.character;
          if ($('name')) $('name').value = targetBuild.name;
          if (typeof setBuildDamageSettings === 'function') setBuildDamageSettings(targetBuild.damage);
          draft(true);
          dirty = false;
          updateSaveState();
        }
      }

      const count = result?.builds?.length ?? importedCountInRun;
      el('preset-import-status').textContent = `${count} 件のマイセットを「保存した構成」に取り込みました。`;
      if (typeof notify === 'function') {
        notify(`${count} 件のマイセットを取り込みました。`);
      }
    } catch (error) {
      el('preset-import-status').textContent = error.message || '取り込み中にエラーが発生しました。';
    } finally {
      running = false;
      updateButtons();
    }
  }

  function openImportDialog() {
    if (typeof closeBuildMenu === 'function') closeBuildMenu();
    dialog.showModal();
    if (!running) {
      el('preset-import-status').textContent = '';
      refreshWindows();
    }
  }

  el('preset-import-open').onclick = openImportDialog;
  if (el('preset-import-menu-open')) {
    el('preset-import-menu-open').onclick = openImportDialog;
  }
  el('preset-import-refresh').onclick = refreshWindows;
  el('preset-import-window').onchange = updateButtons;
  el('preset-import-start-single').onclick = () => runImport('single');
  el('preset-import-start-all').onclick = () => runImport('all');
  el('preset-import-stop').onclick = () => window.relicDesktop.stopPresetImport();
  el('preset-import-close').onclick = () => {
    if (!running) dialog.close();
  };
  dialog.addEventListener('cancel', event => {
    if (running) {
      event.preventDefault();
      window.relicDesktop.stopPresetImport();
    }
  });

  window.relicDesktop.onPresetImportProgress(payload => {
    if (!payload) return;
    if (payload.type === 'log' && payload.message) {
      appendLog(payload.message);
    } else if (payload.type === 'preset' && payload.build) {
      const overwriteSameName = Boolean(el('preset-import-overwrite')?.checked);
      const savedBuild = applyImportedBuildToPlanner(payload.build, {
        overwriteSameName,
        loadIntoEditor: true
      });
      if (savedBuild) {
        importedCountInRun++;
        lastImportedBuildId = savedBuild.id;
        const progressText = payload.total ? `（${importedCountInRun}/${payload.total}件）` : `（${importedCountInRun}件）`;
        el('preset-import-status').textContent = `取り込み中${progressText}：${savedBuild.name}（${savedBuild.character}）`;
      }
    }
  });
})();
