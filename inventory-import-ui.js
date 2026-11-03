'use strict';

(() => {
  const STORAGE_KEY = 'nightreign.relic.owned.v1';
  let ownedRelics = [];
  let unreadCount = 0;
  let lastUnreadFolder = null;
  let activeOwnedOffset = 0;
  let ownedEffectGroupsByType = {
    normal: [[], [], []],
    deep: [[], [], []]
  };
  let activeOwnedEffectGroup = 0;
  let activeOwnedEffectCategory = '';
  let running = false;
  let currentPhase = 'idle'; // 'idle' | 'recording' | 'analyzing'
  let progressStats = { recordedCount: 0, analyzedCount: 0, totalRecorded: 0, expectedTotal: 0 };
  let recordedSessionInfo = { hasRecordedSession: false, recordedCount: 0, recordedAt: null };

  function normalizeLocalOwnedRelic(r) {
    if (!r || typeof r !== 'object' || typeof UNIQUE_RELICS === 'undefined') return r;
    const hasPenalties = Array.isArray(r.penalties) && r.penalties.some(Boolean);
    if (hasPenalties) return r;
    const trueUniques = UNIQUE_RELICS.filter(item => !item.isShop);
    const shopRelics = UNIQUE_RELICS.filter(item => item.isShop);
    let u = null;
    if (r.isUnique && r.name) {
      u = trueUniques.find(item => item.name === r.name || item.name.split('/').map(s => s.trim()).includes(r.name));
    }
    if (!u && !/景色|昏景/.test(r.name || '') && Array.isArray(r.effects) && r.effects.length >= 2) {
      const sortedKey = [...r.effects].sort().join('|');
      u = trueUniques.find(item => item.effects.length === r.effects.length && [...item.effects].sort().join('|') === sortedKey);
    }
    if (u) {
      return {
        ...r,
        name: u.name,
        isUnique: true,
        isShop: false,
        type: 'normal',
        color: u.color || r.color || '赤',
        size: ['', '小', '中', '大'][u.effects.length] || '大',
        effects: [...u.effects],
        effectIds: [...u.effectIds],
        penalties: [null, null, null]
      };
    }

    if (Array.isArray(r.effects) && r.effects.length > 0) {
      const sortedKey = [...r.effects].sort().join('|');
      const candidates = shopRelics.filter(item => item.effects.length === r.effects.length && [...item.effects].sort().join('|') === sortedKey);
      const shopMatch = candidates.find(item => !r.color || item.color === r.color) || candidates[0] || null;
      if (shopMatch) {
        return {
          ...r,
          name: (!r.name || r.name === '通常遺物' || r.name === '深層遺物') ? shopMatch.name : r.name,
          isUnique: false,
          isShop: true,
          shopName: shopMatch.shop || r.shopName || '',
          shopNote: shopMatch.note || r.shopNote || '',
          type: 'normal',
          color: r.color || shopMatch.color || '赤',
          size: ['', '小', '中', '大'][shopMatch.effects.length] || '大',
          effects: [...shopMatch.effects],
          effectIds: [...shopMatch.effectIds],
          penalties: [null, null, null]
        };
      }
    }
    return r;
  }

  function loadLocalOwned() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) ownedRelics = parsed.map(normalizeLocalOwnedRelic);
        else if (parsed && Array.isArray(parsed.relics)) {
          ownedRelics = parsed.relics.map(normalizeLocalOwnedRelic);
          unreadCount = Number(parsed.unreadCount || 0);
          lastUnreadFolder = parsed.lastUnreadFolder || null;
        }
      }
    } catch {}
  }

  function saveLocalOwned() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
        relics: ownedRelics,
        unreadCount,
        lastUnreadFolder
      }));
    } catch {}
  }

  loadLocalOwned();

  async function syncFromDesktop() {
    if (!window.relicDesktop || typeof window.relicDesktop.loadOwnedRelics !== 'function') return;
    try {
      const data = await window.relicDesktop.loadOwnedRelics();
      if (data && Array.isArray(data.relics) && (data.relics.length > 0 || ownedRelics.length === 0)) {
        ownedRelics = data.relics.map(normalizeLocalOwnedRelic);
        unreadCount = Number(data.unreadCount || 0);
        lastUnreadFolder = data.lastUnreadFolder || null;
        saveLocalOwned();
        updateHeaderCounts();
      } else if (ownedRelics.length > 0 && (!data || !data.relics?.length)) {
        await window.relicDesktop.saveOwnedRelics({ relics: ownedRelics, unreadCount, lastUnreadFolder });
      }
    } catch {}
  }

  // Add button to .editor-top-actions
  const editorTop = document.querySelector('.editor-top');
  let actionWrap = editorTop?.querySelector('.editor-top-actions');
  if (editorTop && !actionWrap) {
    actionWrap = document.createElement('div');
    actionWrap.className = 'editor-top-actions';
    editorTop.append(actionWrap);
  }
  if (actionWrap && window.relicDesktop) {
    const scanBtn = document.createElement('button');
    scanBtn.id = 'inventory-import-open';
    scanBtn.type = 'button';
    scanBtn.title = 'ゲーム内の「遺物儀式」一覧から所持している遺物をすべて読み込んで、理想遺物で選択できるようにします';
    scanBtn.textContent = `💎 所持遺物を読み込む（${ownedRelics.length}件）`;
    actionWrap.append(scanBtn);
  }

  // Create Scan Dialog
  const scanDialog = document.createElement('dialog');
  scanDialog.id = 'inventory-import-dialog';
  scanDialog.innerHTML = `
    <div class="dialog-head">
      <div>
        <p class="eyebrow">OWNED RELIC RECORDER & ANALYZER</p>
        <h2>所持遺物を一気撮り録画＆アプリ内分析</h2>
      </div>
      <button id="inventory-import-close" class="icon-button" type="button" aria-label="閉じる" title="閉じてもアプリ内バックグラウンド分析はそのまま継続します">×</button>
    </div>
    <p class="preset-import-help">
      <strong>① 一気撮り録画（高速キャプチャ）</strong>と<strong>② アプリ内バックグラウンド分析</strong>の2段階方式です。<br>
      最初に全遺物の画面だけを一気に撮影（録画）し、<strong>撮影が終わった瞬間にゲーム画面とマウス・キーボードを即座に解放</strong>します。その後のOCR分析はすべてアプリ内部のバックグラウンドで行われるため、<strong>他のPC作業やブラウザ・ゲーム操作を一切邪魔しません</strong>（通常／深層も遺物名「景色／昏景」や効果から自動判別します）。
    </p>
    <div class="preset-import-options">
      <label for="inventory-import-mode">取り込み方式
        <select id="inventory-import-mode">
          <option value="auto">⚡ 自動で全遺物を一気撮り録画 → アプリ内で分析（推奨：撮影後すぐPC操作自由）</option>
          <option value="passive">🎥 自分で操作して裏で録画 → アプリ内で分析（マウス・キーボード操作ロックなし）</option>
          <option value="video">🎬 録画した動画ファイル（.mp4 / .webm / .mkv 等）からアプリ内で分析</option>
        </select>
      </label>
    </div>
    <div id="inventory-import-window-group" class="preset-import-window-row">
      <label for="inventory-import-window">対象ウィンドウ
        <select id="inventory-import-window"></select>
      </label>
      <button id="inventory-import-refresh" type="button">ウィンドウを再取得</button>
    </div>
    <div id="inventory-import-video-group" class="preset-import-window-row" hidden>
      <label for="inventory-import-video-file">遺物一覧を録画した動画ファイル
        <input id="inventory-import-video-file" type="file" accept="video/*,.mp4,.webm,.mkv,.mov,.avi">
      </label>
    </div>
    <div class="preset-import-options">
      <label id="inventory-import-scope-wrap" for="inventory-import-scope">録画・取り込み範囲
        <select id="inventory-import-scope">
          <option value="all">すべて（所持している全遺物を順番に録画）</option>
          <option value="favorites">お気に入りのみ（★マークの遺物だけ録画）</option>
          <option value="filtered">現在のフィルター通過分のみ（明るい遺物だけ録画）</option>
        </select>
      </label>
      <label>
        <input id="inventory-import-merge" type="checkbox" checked>
        <span>既存の読み込み済み遺物リストに追加・統合する（重複は自動除外）</span>
      </label>
      <label id="inventory-import-top-wrap">
        <input id="inventory-import-top" type="checkbox" checked>
        <span>開始時に一覧の一番上までスクロールしてから一気撮りする</span>
      </label>
    </div>
    <div id="inventory-import-phase-box" class="inventory-phase-banner" hidden>
      <div class="inventory-phase-head">
        <strong id="inventory-import-phase-title">待機中</strong>
        <span id="inventory-import-phase-count"></span>
      </div>
      <div class="inventory-progress-track">
        <div id="inventory-import-progress-fill" class="inventory-progress-fill" style="width: 0%"></div>
      </div>
      <small id="inventory-import-phase-hint"></small>
    </div>
    <div class="preset-import-actions">
      <button id="inventory-import-start" class="primary" type="button">🎥 一気撮り録画＆アプリ内分析を開始</button>
      <button id="inventory-import-stop" type="button" disabled>⏹️ 録画を完了して分析へ（F8）</button>
      <button id="inventory-reanalyze-recorded" class="subtle" type="button" title="前回録画した全遺物の画像データを使って、ゲームを開かずにアプリ内で再分析します">🔁 前回の録画データを再分析</button>
      <button id="inventory-reanalyze-unread" class="subtle" type="button" title="保存済みの未読(unread)データを再解析して所持遺物に追加します">🔄 未読(unread)を再解析</button>
      <button id="inventory-open-unread" class="subtle" type="button" title="未読(unread)の画像・JSON保存フォルダを開きます">📂 未読フォルダ</button>
    </div>
    <p id="inventory-import-status" role="status"></p>
    <pre id="inventory-import-log"></pre>
  `;
  document.body.append(scanDialog);

  // Create Owned Relic Picker Dialog (for selecting into Normal 1-3 / Deep 1-3)
  const pickerDialog = document.createElement('dialog');
  pickerDialog.id = 'owned-relic-picker';
  pickerDialog.innerHTML = `
    <div class="dialog-head">
      <div>
        <p class="eyebrow" id="owned-picker-eyebrow">OWNED RELICS</p>
        <h2 id="owned-picker-title">所持遺物を選ぶ</h2>
      </div>
      <div class="owned-picker-head-actions">
        <button id="owned-picker-scan-open" class="subtle" type="button">💎 ゲームから読み込む</button>
        <button id="close-owned-picker" class="icon-button" type="button" aria-label="所持遺物選択を閉じる">×</button>
      </div>
    </div>
    <div class="owned-effect-filter-panel">
      <div class="owned-effect-filter-head">
        <span class="owned-effect-filter-label">効果で絞り込み（最大3つ・順不同）</span>
        <div class="owned-effect-filter-actions">
          <button type="button" id="owned-filter-from-slot" class="subtle" title="現在開いている遺物枠にセットされている効果を効果1〜3へコピーします">現在の枠から読込</button>
          <button type="button" id="owned-filter-clear-all" class="subtle" disabled>効果をすべて外す</button>
        </div>
      </div>
      <div id="owned-effect-groups" class="slots owned-effect-slots-row"></div>
    </div>
    <div class="owned-search-and-selects">
      <label class="search-box owned-search-box">
        <span>⌕</span>
        <input id="owned-search" type="search" placeholder="効果名・デメリット・遺物名・読みを検索（スペース区切りでAND検索）" autocomplete="off">
      </label>
      <select id="owned-color-filter" aria-label="遺物の色">
        <option value="">すべての色</option>
        <option value="赤">赤（燃える）</option>
        <option value="青">青（滴る）</option>
        <option value="黄">黄（輝く）</option>
        <option value="緑">緑（静まる）</option>
      </select>
      <select id="owned-size-filter" aria-label="遺物の大きさ">
        <option value="">すべての大きさ</option>
        <option value="大">大（3枠）</option>
        <option value="中">中（2枠）</option>
        <option value="小">小（1枠）</option>
      </select>
      <select id="owned-genre-filter" aria-label="遺物のジャンル">
        <option value="">すべてのジャンル</option>
        <option value="gacha">ガチャ産のみ</option>
        <option value="shop">店売り遺物のみ</option>
        <option value="unique">固有遺物のみ</option>
        <option value="no-fixed">固有・店売りを除く</option>
      </select>
    </div>
    <div class="picker-filters owned-picker-filters">
      <label class="unique-color-filter"><input id="owned-match-vessel" type="checkbox" checked> 盃の色に合う遺物のみ</label>
      <label class="unique-color-filter"><input id="owned-only-favorite" type="checkbox"> ★ お気に入りのみ</label>
      <label class="unique-color-filter"><input id="owned-only-character" type="checkbox" checked> キャラ固有は選択中のキャラのみ</label>
      <span id="owned-result-count"></span>
    </div>
    <div id="owned-results" class="owned-results-grid"></div>
  `;
  document.body.append(pickerDialog);

  const effectFilterDialog = document.createElement('dialog');
  effectFilterDialog.id = 'owned-effect-filter-dialog';
  effectFilterDialog.innerHTML = `
    <div class="dialog-head">
      <div>
        <p class="eyebrow" id="owned-eff-eyebrow">NORMAL RELIC</p>
        <h2 id="owned-eff-dialog-title">効果を選ぶ</h2>
      </div>
      <button class="icon-button" id="owned-eff-close" type="button" aria-label="効果選択を閉じる">×</button>
    </div>
    <div id="owned-eff-slot-tabs" class="owned-eff-slot-tabs" role="tablist" aria-label="効果枠の切替"></div>
    <label class="search-box">
      <span>⌕</span>
      <input id="owned-eff-search" aria-label="効果名を検索" placeholder="効果名・読みを検索（例：攻撃力、ふうろう）" type="search" autocomplete="off">
    </label>
    <div class="picker-filters">
      <select aria-label="効果カテゴリ" id="owned-eff-category"></select>
      <label><input type="checkbox" id="owned-eff-owned-only"> 所持している効果のみ</label>
      <label><input type="checkbox" id="owned-eff-char-only" checked> キャラ固有は選択中のキャラのみ</label>
    </div>
    <p id="owned-eff-result-count"></p>
    <div id="owned-eff-list"></div>
    <div class="dialog-footer">
      <span>クリックで効果をセットします（効果1〜3は順不同で検索されます）。</span>
      <button class="subtle" type="button" id="owned-eff-clear-group">この枠の効果を外す</button>
    </div>
  `;
  document.body.append(effectFilterDialog);

  const el = id => document.getElementById(id);

  function resolveOwnedRelicSlots(r, type) {
    const ids = [0, 1, 2].map(j => {
      const id = r.effectIds?.[j];
      if (id && typeof lookup !== 'undefined' && lookup.has(id) && lookup.get(id).type === type) return id;
      const effName = r.effects?.[j];
      if (!effName || typeof EFFECTS === 'undefined') return null;
      const found = EFFECTS.find(e => e.type === type && e.name === effName);
      return found ? found.id : null;
    });
    const pens = [0, 1, 2].map(j => {
      if (type !== 'deep') return null;
      const effObj = ids[j] && typeof lookup !== 'undefined' ? lookup.get(ids[j]) : null;
      return effObj?.hasPenalty ? (r.penalties?.[j] || null) : null;
    });
    return { ids, pens };
  }

  function isOwnedRelicMatchedAtOffset(r, offset) {
    if (!r || typeof slots === 'undefined') return false;
    const type = offset < 9 ? 'normal' : 'deep';
    if ((r.type || 'normal') !== type) return false;
    const curIds = [slots[offset] || null, slots[offset + 1] || null, slots[offset + 2] || null];
    if (!curIds.some(Boolean)) return false;
    const curPens = type === 'deep' && typeof penaltySlots !== 'undefined'
      ? [penaltySlots[offset - 9] || null, penaltySlots[offset - 8] || null, penaltySlots[offset - 7] || null]
      : [null, null, null];
    const { ids, pens } = resolveOwnedRelicSlots(r, type);
    if (!ids.some(Boolean)) return false;

    const exact = [0, 1, 2].every(j => ids[j] === curIds[j] && (type !== 'deep' || pens[j] === curPens[j]));
    if (exact) return true;

    const pairKey = (id, pen) => `${id || ''}__${type === 'deep' ? (pen || '') : ''}`;
    const targetPairs = [0, 1, 2].map(j => pairKey(ids[j], pens[j])).sort();
    const currentPairs = [0, 1, 2].map(j => pairKey(curIds[j], curPens[j])).sort();
    return targetPairs.every((k, j) => k === currentPairs[j]);
  }

  function findMatchedOwnedRelic(offset) {
    const type = offset < 9 ? 'normal' : 'deep';
    const cardIdx = (offset % 9) / 3;
    const vessel = typeof VESSELS !== 'undefined' && typeof vesselId !== 'undefined'
      ? VESSELS.find(v => v.id === vesselId)
      : null;
    const slotColor = vessel ? vessel[type]?.[cardIdx] : null;

    const matches = ownedRelics.filter(r => isOwnedRelicMatchedAtOffset(r, offset));
    if (!matches.length) return null;
    if (slotColor && slotColor !== '白') {
      const colorMatch = matches.find(r => r.color === slotColor);
      if (colorMatch) return colorMatch;
    }
    return matches[0];
  }
  window.isOwnedRelicAtOffset = offset => Boolean(findMatchedOwnedRelic(offset));

  function updateHeaderCounts() {
    const btn = el('inventory-import-open');
    if (btn) {
      if (running && currentPhase === 'recording') {
        const tot = progressStats.expectedTotal ? `/${progressStats.expectedTotal}` : '';
        btn.textContent = `🎥 遺物を一気撮り中 (${progressStats.recordedCount}${tot}件)…`;
      } else if (running && currentPhase === 'analyzing') {
        btn.textContent = `🔄 アプリ内分析中 (${progressStats.analyzedCount}/${progressStats.totalRecorded || '?'}・計${ownedRelics.length}件)`;
      } else {
        btn.textContent = `💎 所持遺物を読み込む（${ownedRelics.length}件）`;
      }
    }
    document.querySelectorAll('.owned-relic-trigger').forEach(trigger => {
      const offset = Number(trigger.dataset.openOwned || 0);
      const type = offset < 9 ? 'normal' : 'deep';
      const count = ownedRelics.filter(r => (r.type || 'normal') === type).length;
      const matched = findMatchedOwnedRelic(offset);
      trigger.classList.toggle('is-owned-active', Boolean(matched));
      if (matched) {
        trigger.dataset.ownedColor = matched.color || '';
        trigger.textContent = count > 0 ? `✓ 所持遺物 (${count}) ▾` : '✓ 所持遺物 ▾';
        trigger.title = `所持遺物を選択中：${matched.name || (type === 'deep' ? '深層遺物' : '通常遺物')}（${matched.color || '不明'}）— クリックで変更`;
      } else {
        delete trigger.dataset.ownedColor;
        trigger.textContent = count > 0 ? `所持遺物 (${count}) ▾` : '所持遺物 ▾';
        trigger.title = '読み込んだ所持遺物から選択してセットします';
      }
      const card = trigger.closest('.relic-card');
      if (card) {
        card.classList.toggle('is-owned-relic', Boolean(matched));
      }
    });
  }

  function updatePhaseBanner() {
    const box = el('inventory-import-phase-box');
    if (!box) return;
    if (!running && currentPhase === 'idle') {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const titleEl = el('inventory-import-phase-title');
    const countEl = el('inventory-import-phase-count');
    const fillEl = el('inventory-import-progress-fill');
    const hintEl = el('inventory-import-phase-hint');

    if (currentPhase === 'recording') {
      box.dataset.phase = 'recording';
      const mode = el('inventory-import-mode')?.value || 'auto';
      titleEl.textContent = mode === 'passive'
        ? '🎥 ステップ1：バックグラウンド録画中（ゲーム内で遺物を選択してください）'
        : mode === 'video'
          ? '🎬 ステップ1：動画ファイルから遺物フレームを高速抽出中…'
          : '🎥 ステップ1：全遺物を高速一気撮り録画中…';
      const tot = progressStats.expectedTotal;
      countEl.textContent = tot ? `${progressStats.recordedCount} / ${tot} 件` : `${progressStats.recordedCount} 件撮影済み`;
      const pct = tot > 0 ? Math.min(100, Math.round((progressStats.recordedCount / tot) * 100)) : 35;
      fillEl.style.width = `${pct}%`;
      hintEl.textContent = mode === 'passive'
        ? 'マウス・キーボードロックは一切ありません。撮り終えたら「録画を完了して分析へ（F8）」を押してください。'
        : 'OCRを行わず画面キャプチャのみ高速で行っています。完了またはF8キー押下ですぐにPC操作が解放されます。';
    } else if (currentPhase === 'analyzing') {
      box.dataset.phase = 'analyzing';
      titleEl.textContent = '🔓 ステップ2：アプリ内でバックグラウンド分析中（PC操作自由！）';
      const tot = Math.max(1, progressStats.totalRecorded || progressStats.recordedCount || 1);
      const pct = Math.min(100, Math.round((progressStats.analyzedCount / tot) * 100));
      countEl.textContent = `${progressStats.analyzedCount} / ${tot} 件 (${pct}%)`;
      fillEl.style.width = `${pct}%`;
      hintEl.textContent = 'ゲーム画面の制御は完了しました！このダイアログを閉じて他のPC作業やブラウザ・ゲーム操作をしていて大丈夫です。';
    }
  }

  async function refreshRecordedSessionInfo() {
    if (!window.relicDesktop?.recordedInventoryInfo) return;
    try {
      const info = await window.relicDesktop.recordedInventoryInfo();
      if (info) recordedSessionInfo = info;
    } catch {}
    updateScanButtons();
  }

  function updateScanButtons() {
    const mode = el('inventory-import-mode')?.value || 'auto';
    const hasWindow = Boolean(el('inventory-import-window')?.value);
    const hasVideo = Boolean(el('inventory-import-video-file')?.files?.length);

    if (el('inventory-import-window-group')) el('inventory-import-window-group').hidden = mode === 'video';
    if (el('inventory-import-video-group')) el('inventory-import-video-group').hidden = mode !== 'video';
    if (el('inventory-import-top-wrap')) el('inventory-import-top-wrap').hidden = mode !== 'auto';
    if (el('inventory-import-scope-wrap')) el('inventory-import-scope-wrap').hidden = mode === 'video';

    const canStart = mode === 'video' ? hasVideo : hasWindow;
    const startBtn = el('inventory-import-start');
    if (startBtn) {
      startBtn.disabled = running || !canStart;
      startBtn.textContent = mode === 'passive'
        ? '🎥 裏で録画を開始（操作ロックなし）'
        : mode === 'video'
          ? '🎬 動画から一括抽出＆アプリ内分析を開始'
          : '🎥 一気撮り録画＆アプリ内分析を開始';
    }

    const stopBtn = el('inventory-import-stop');
    if (stopBtn) {
      stopBtn.disabled = !running;
      stopBtn.textContent = currentPhase === 'recording'
        ? '⏹️ 録画を完了して分析へ進む（F8）'
        : '⏹️ アプリ内分析を停止・途中保存';
    }

    const reanalyzeRecBtn = el('inventory-reanalyze-recorded');
    if (reanalyzeRecBtn) {
      reanalyzeRecBtn.disabled = running || !recordedSessionInfo.hasRecordedSession;
      reanalyzeRecBtn.textContent = recordedSessionInfo.hasRecordedSession
        ? `🔁 前回の録画を再分析（${recordedSessionInfo.recordedCount}件）`
        : '🔁 前回の録画を再分析';
    }

    for (const id of ['inventory-import-mode', 'inventory-import-window', 'inventory-import-refresh', 'inventory-import-video-file', 'inventory-import-scope', 'inventory-import-merge', 'inventory-import-top', 'inventory-reanalyze-unread']) {
      if (el(id)) el(id).disabled = running;
    }
    updatePhaseBanner();
    updateHeaderCounts();
  }

  async function refreshWindows() {
    if (!window.relicDesktop?.filterWindows) return;
    try {
      const windows = await window.relicDesktop.filterWindows();
      const select = el('inventory-import-window');
      select.replaceChildren(...windows.map(w => new Option(w.name, w.id)));
      if (!windows.length && (el('inventory-import-mode')?.value || 'auto') !== 'video') {
        el('inventory-import-status').textContent = 'ゲームのウィンドウが見つかりませんでした。ナイトレインを起動してから「ウィンドウを再取得」を押すか、「動画ファイルから分析」を選択してください。';
      }
    } catch (error) {
      el('inventory-import-status').textContent = error.message || 'ウィンドウ一覧の取得に失敗しました。';
    }
    updateScanButtons();
  }

  function appendScanLog(text) {
    const logEl = el('inventory-import-log');
    if (!logEl) return;
    logEl.textContent += text + '\n';
    logEl.scrollTop = logEl.scrollHeight;
  }

  function openScanDialog() {
    if (pickerDialog.open) pickerDialog.close();
    scanDialog.showModal();
    refreshRecordedSessionInfo();
    if (!running) {
      el('inventory-import-status').textContent = `現在の保存済み所持遺物：${ownedRelics.length} 件（通常：${ownedRelics.filter(r => r.type === 'normal').length} 件 ／ 深層：${ownedRelics.filter(r => r.type === 'deep').length} 件${unreadCount ? ` ／ 未読：${unreadCount} 件` : ''}）`;
      refreshWindows();
    } else {
      updateScanButtons();
    }
  }

  // Extract unique relic panel frames from a video file using offscreen <video> + <canvas>
  async function extractRelicFramesFromVideo(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = url;

      const cleanup = () => {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
          URL.revokeObjectURL(url);
        } catch {}
      };

      video.onerror = () => {
        cleanup();
        reject(new Error('動画ファイルの読み込みに失敗しました。対応形式（.mp4 / .webm 等）か確認してください。'));
      };

      video.onloadedmetadata = async () => {
        try {
          const duration = Number(video.duration || 0);
          if (!duration || !Number.isFinite(duration)) {
            throw new Error('動画の長さを取得できませんでした。');
          }
          const fullCanvas = document.createElement('canvas');
          fullCanvas.width = 2560;
          fullCanvas.height = 1440;
          const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true });

          const sigCanvas = document.createElement('canvas');
          sigCanvas.width = 32;
          sigCanvas.height = 16;
          const sigCtx = sigCanvas.getContext('2d', { willReadFrequently: true });

          const panelCanvas = document.createElement('canvas');
          panelCanvas.width = 1105;
          panelCanvas.height = 305;
          const panelCtx = panelCanvas.getContext('2d');

          const computeSig = () => {
            sigCtx.drawImage(fullCanvas, 1430, 1020, 620, 260, 0, 0, 32, 16);
            const rgba = sigCtx.getImageData(0, 0, 32, 16).data;
            const gray = new Uint8Array(32 * 16);
            for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
              gray[j] = Math.round(rgba[i] * 0.299 + rgba[i + 1] * 0.587 + rgba[i + 2] * 0.114);
            }
            return gray;
          };
          const diffSig = (a, b) => {
            if (!a || !b) return 999;
            let sum = 0;
            for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
            return sum / a.length;
          };
          const countIconsOnCanvas = () => {
            const rgba = fullCtx.getImageData(1444, 1074, 5, 239).data;
            const clusters = [];
            for (let y = 0; y < 239; y++) {
              let sum = 0;
              for (let x = 0; x < 5; x++) {
                const idx = (y * 5 + x) * 4;
                sum += Math.round(rgba[idx] * 0.299 + rgba[idx + 1] * 0.587 + rgba[idx + 2] * 0.114);
              }
              if (sum / 5 <= 100) continue;
              if (!clusters.length || y - clusters.at(-1).at(-1) > 30) clusters.push([]);
              clusters.at(-1).push(y);
            }
            return clusters.filter(g => g.length >= 3 && g.at(-1) - g[0] >= 12).length;
          };

          const frames = [];
          const recordedSigs = [];
          let prevSig = null;
          const stepSec = 0.12;
          const totalSteps = Math.ceil(duration / stepSec);
          progressStats.expectedTotal = null;

          for (let step = 0; step <= totalSteps; step++) {
            if (!running) break;
            const t = Math.min(duration, step * stepSec);
            await new Promise(res => {
              const onSeek = () => {
                video.removeEventListener('seeked', onSeek);
                res();
              };
              video.addEventListener('seeked', onSeek);
              video.currentTime = t;
            });

            fullCtx.drawImage(video, 0, 0, 2560, 1440);
            const curSig = computeSig();
            const settled = prevSig && diffSig(curSig, prevSig) < 1.4;
            prevSig = curSig;
            if (!settled) continue;
            if (!recordedSigs.every(s => diffSig(curSig, s) >= 2.0)) continue;

            const icons = countIconsOnCanvas();
            if (icons < 1 || icons > 3) continue;

            recordedSigs.push(curSig);
            panelCtx.drawImage(fullCanvas, 1280, 1015, 1105, 305, 0, 0, 1105, 305);
            const blob = await new Promise(r => panelCanvas.toBlob(r, 'image/png'));
            const ab = await blob.arrayBuffer();
            frames.push({
              index: frames.length + 1,
              timestampSec: t,
              gridId: `video@${t.toFixed(1)}s`,
              panelPng: new Uint8Array(ab)
            });
            progressStats.recordedCount = frames.length;
            updateScanButtons();
          }

          cleanup();
          resolve(frames);
        } catch (err) {
          cleanup();
          reject(err);
        }
      };
    });
  }

  async function runImportRequest(requestPayload) {
    if (running || !window.relicDesktop?.startInventoryImport) return;
    running = true;
    currentPhase = requestPayload.captureMode === 'reanalyze-recorded' ? 'analyzing' : 'recording';
    progressStats = { recordedCount: 0, analyzedCount: 0, totalRecorded: 0, expectedTotal: 0 };
    updateScanButtons();
    el('inventory-import-log').textContent = '';

    const mergeExisting = Boolean(el('inventory-import-merge')?.checked);
    if (!mergeExisting) {
      ownedRelics = [];
      saveLocalOwned();
      updateHeaderCounts();
    }

    try {
      let finalRequest = { ...requestPayload, mergeExisting };
      if (requestPayload.captureMode === 'video') {
        const file = el('inventory-import-video-file')?.files?.[0];
        if (!file) throw new Error('動画ファイルを選択してください。');
        appendScanLog(`🎬 動画ファイル「${file.name}」から遺物フレームを高速抽出しています…`);
        el('inventory-import-status').textContent = '動画ファイルから各遺物のフレームを抽出しています…';
        const videoFrames = await extractRelicFramesFromVideo(file);
        appendScanLog(`📸 動画から ${videoFrames.length} 件のユニークな遺物フレームを抽出しました！アプリ内分析を開始します…`);
        finalRequest = {
          captureMode: 'video-frames',
          videoFrames,
          mergeExisting,
          scope: 'all'
        };
      }

      const result = await window.relicDesktop.startInventoryImport(finalRequest);
      if (result && Array.isArray(result.relics)) {
        ownedRelics = result.relics;
        unreadCount = Number(result.unreadCount || 0);
        lastUnreadFolder = result.unreadFolder || lastUnreadFolder;
        saveLocalOwned();
        updateHeaderCounts();
      }
      el('inventory-import-status').textContent =
        `完了：今回 ${result.scannedCount} 件の遺物を分析・保存しました（録画: ${result.recordedCount || result.scannedCount} 件 ／ 未読: ${result.unreadCount} 件 ／ 合計保存: ${ownedRelics.length} 件）。`;
      if (typeof notify === 'function') {
        notify(`所持遺物のアプリ内分析が完了しました（+${result.scannedCount} 件 ／ 合計 ${ownedRelics.length} 件）。`);
      }
    } catch (error) {
      await syncFromDesktop();
      el('inventory-import-status').textContent = `${error.message || '処理が中断されました。'}（現在までの保存件数：${ownedRelics.length} 件）`;
    } finally {
      running = false;
      currentPhase = 'idle';
      await refreshRecordedSessionInfo();
      updateScanButtons();
    }
  }

  async function startScan() {
    const mode = el('inventory-import-mode')?.value || 'auto';
    const windowId = el('inventory-import-window')?.value;
    const scope = el('inventory-import-scope')?.value || 'all';
    const scrollToTopFirst = Boolean(el('inventory-import-top')?.checked);
    if (mode !== 'video' && !windowId) return;

    el('inventory-import-status').textContent = mode === 'passive'
      ? 'バックグラウンド録画を開始します… ゲーム内で遺物を順番に選択してください。'
      : mode === 'video'
        ? '動画ファイルを解析しています…'
        : '準備中… ゲーム画面（「遺物儀式」の遺物一覧）を表示してお待ちください。撮影完了後すぐにPC操作が解放されます。';

    await runImportRequest({
      windowId,
      captureMode: mode,
      scope,
      scrollToTopFirst
    });
  }

  function getCurrentOwnedEffectGroups(typeOverride) {
    const type = typeOverride || (activeOwnedOffset < 9 ? 'normal' : 'deep');
    if (!ownedEffectGroupsByType[type]) {
      ownedEffectGroupsByType[type] = [[], [], []];
    }
    return ownedEffectGroupsByType[type];
  }

  function matchesOwnedEffectGroups(r, groups) {
    if (!Array.isArray(groups)) return true;
    const activeGroups = groups.filter(g => Array.isArray(g) && g.length > 0);
    if (!activeGroups.length) return true;
    const relicEffects = Array.isArray(r.effects) ? r.effects : [];
    function assign(index, used) {
      if (index === activeGroups.length) return true;
      return relicEffects.some((effName, pos) => {
        if (!effName || used.has(pos) || !activeGroups[index].includes(effName)) return false;
        const next = new Set(used);
        next.add(pos);
        return assign(index + 1, next);
      });
    }
    return assign(0, new Set());
  }

  function renderOwnedEffectFilterSlots() {
    const container = el('owned-effect-groups');
    if (!container) return;
    const type = activeOwnedOffset < 9 ? 'normal' : 'deep';
    container.classList.toggle('deep', type === 'deep');
    const groups = getCurrentOwnedEffectGroups(type);
    const hasAny = groups.some(g => g.length > 0);
    if (el('owned-filter-clear-all')) {
      el('owned-filter-clear-all').disabled = !hasAny;
    }
    const hasCurrentSlotEffects = typeof slots !== 'undefined' && [0, 1, 2].some(j => Boolean(slots[activeOwnedOffset + j]));
    if (el('owned-filter-from-slot')) {
      el('owned-filter-from-slot').disabled = !hasCurrentSlotEffects;
    }

    container.innerHTML = groups.map((group, idx) => {
      const effName = group[0] || null;
      const effObj = effName && typeof EFFECTS !== 'undefined'
        ? (EFFECTS.find(e => e.type === type && e.name === effName) || EFFECTS.find(e => e.name === effName))
        : null;
      const tip = effObj && typeof tooltipAttrs === 'function' ? tooltipAttrs(effObj) : '';
      const penMark = effObj && typeof penaltyMark === 'function' ? penaltyMark(effObj) : '';
      const oddsBadge = effObj && typeof effectOddsBadge === 'function' ? effectOddsBadge(effObj, type) : '';

      return `
        <div class="effect-entry">
          <div class="effect-line">
            <button class="slot ${effName ? 'filled' : ''}" type="button" data-owned-open-group="${idx}" ${tip} aria-label="所持遺物フィルター 効果${idx + 1}${effName ? '：' + escapeHtml(effName) : 'を選ぶ'}">
              <span class="slot-number">${idx + 1}</span>
              <span class="slot-text">
                <span class="effect-name">
                  <span class="effect-label">${effName ? escapeHtml(effName) : '- - -'}</span>
                  ${penMark}
                  ${oddsBadge}
                </span>
              </span>
              ${effName ? '' : '<span class="plus">＋</span>'}
            </button>
            ${effName ? `
              <div class="effect-actions">
                <button class="effect-remove" type="button" data-owned-reset-group="${idx}" aria-label="効果${idx + 1}を外す" title="この枠の効果を外す">×</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function getAvailableEffectsForOwnedPicker(type) {
    if (typeof EFFECTS === 'undefined') return [];
    const byName = new Map();
    for (const e of EFFECTS) {
      if (e.type !== type) continue;
      if (!byName.has(e.name)) byName.set(e.name, e);
    }
    const families = new Map();
    for (const effect of byName.values()) {
      const key = effect.category + ':' + effect.name.normalize('NFKC').replace(/\+\d+$/, '');
      if (!families.has(key)) families.set(key, []);
      families.get(key).push(effect);
    }
    const tier = effect => Number(effect.name.normalize('NFKC').match(/\+(\d+)$/)?.[1] || 0);
    return [...families.values()].flatMap(f => f.sort((a, b) => tier(a) - tier(b)));
  }

  function renderOwnedEffectFilterDialog() {
    if (!effectFilterDialog.open) return;
    const type = activeOwnedOffset < 9 ? 'normal' : 'deep';
    const groups = getCurrentOwnedEffectGroups(type);
    const activeList = groups[activeOwnedEffectGroup] || [];
    const currentSelectedName = activeList[0] || null;

    if (el('owned-eff-eyebrow')) {
      el('owned-eff-eyebrow').textContent = type === 'normal' ? 'NORMAL RELIC FILTER' : 'DEEP RELIC FILTER';
    }
    if (el('owned-eff-dialog-title')) {
      el('owned-eff-dialog-title').textContent = `${type === 'normal' ? '通常' : '深層'}遺物フィルター · 効果 ${activeOwnedEffectGroup + 1}`;
    }
    if (el('owned-eff-slot-tabs')) {
      el('owned-eff-slot-tabs').innerHTML = [0, 1, 2].map(idx => {
        const selectedName = (groups[idx] || [])[0] || '';
        const isCurrent = idx === activeOwnedEffectGroup;
        return `<button type="button" class="owned-eff-slot-tab ${isCurrent ? 'is-active' : ''}" role="tab" aria-selected="${isCurrent}" data-owned-eff-tab="${idx}"><span>効果 ${idx + 1}</span><small>${selectedName ? escapeHtml(selectedName) : '未指定'}</small></button>`;
      }).join('');
    }
    if (el('owned-eff-clear-group')) {
      el('owned-eff-clear-group').disabled = !currentSelectedName;
    }

    const ownedCountsByEffect = new Map();
    for (const r of ownedRelics) {
      if ((r.type || 'normal') !== type) continue;
      for (const effName of new Set((r.effects || []).filter(Boolean))) {
        ownedCountsByEffect.set(effName, (ownedCountsByEffect.get(effName) || 0) + 1);
      }
    }

    const allEffects = getAvailableEffectsForOwnedPicker(type);
    const catSelect = el('owned-eff-category');
    if (catSelect) {
      const categories = [...new Set(allEffects.map(e => e.category))];
      if (catSelect.dataset.loadedType !== type) {
        catSelect.replaceChildren(
          new Option('すべてのカテゴリ', ''),
          ...categories.map(c => new Option(c, c))
        );
        catSelect.dataset.loadedType = type;
        catSelect.value = activeOwnedEffectCategory && categories.includes(activeOwnedEffectCategory) ? activeOwnedEffectCategory : '';
      }
      activeOwnedEffectCategory = catSelect.value || '';
    }

    const currentChar = typeof $ === 'function' && $('character') ? $('character').value : '';
    const onlyOwned = Boolean(el('owned-eff-owned-only')?.checked);
    const onlyChar = Boolean(el('owned-eff-char-only')?.checked);
    const qRaw = el('owned-eff-search')?.value || '';
    const words = (typeof normalizeReadingSearch === 'function' ? normalizeReadingSearch(qRaw) : qRaw.toLowerCase())
      .replace(/上昇/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const filtered = allEffects.filter(effect => {
      if (activeOwnedEffectCategory && effect.category !== activeOwnedEffectCategory) return false;
      if (onlyOwned && !(ownedCountsByEffect.get(effect.name) > 0)) return false;
      if (onlyChar && currentChar && effect.character && effect.character !== currentChar) return false;
      if (words.length) {
        const reading = (typeof EFFECT_READINGS !== 'undefined' && EFFECT_READINGS.effects?.[effect.id]) || '';
        const hay = (typeof normalizeReadingSearch === 'function'
          ? normalizeReadingSearch(`${effect.name} ${effect.category} ${reading}`)
          : `${effect.name} ${effect.category}`.toLowerCase()
        ).replace(/上昇/g, '');
        if (!words.every(w => hay.includes(w))) return false;
      }
      return true;
    });

    if (el('owned-eff-result-count')) {
      el('owned-eff-result-count').textContent = `${filtered.length} 件の効果`;
    }

    const otherGroups = groups
      .map((g, idx) => ({ g, idx }))
      .filter(item => item.idx !== activeOwnedEffectGroup && Array.isArray(item.g) && item.g.length > 0);

    const listEl = el('owned-eff-list');
    if (!listEl) return;
    if (!filtered.length) {
      listEl.innerHTML = '<p class="empty">該当する効果がありません。<br>検索語やカテゴリを変更してください。</p>';
      return;
    }

    listEl.innerHTML = filtered.map(effect => {
      const isSelected = currentSelectedName === effect.name;
      const ownedCnt = ownedCountsByEffect.get(effect.name) || 0;
      const tip = typeof tooltipAttrs === 'function' ? tooltipAttrs(effect) : '';
      const penMark = typeof penaltyMark === 'function' ? penaltyMark(effect) : '';
      const ownedBadge = `<span class="slot-effect-odds owned-count-badge ${ownedCnt > 0 ? 'has-owned' : 'is-zero'}" title="現在読み込まれている所持遺物のうち、この効果を持つ遺物の数">所持 ${ownedCnt}件</span>`;
      let conflictBadge = '';
      if (window.LedgerForge?.getConflictReason && window.RelicOddsData?.nameToId) {
        for (const other of otherGroups) {
          if (other.g.every(otherName => Boolean(window.LedgerForge.getConflictReason(effect.name, otherName, window.RelicOddsData.nameToId)))) {
            const c = window.LedgerForge.getConflictReason(effect.name, other.g[0], window.RelicOddsData.nameToId);
            if (c) {
              conflictBadge = `<span class="slot-conflict-badge" title="${escapeHtml(c.message)}">効果${other.idx + 1}と競合（${escapeHtml(c.label)}）</span>`;
              break;
            }
          }
        }
      }
      return `
        <div class="result-row">
          <button class="result ${isSelected ? 'is-selected' : ''}${conflictBadge ? ' is-conflicting' : ''}" type="button" ${tip} data-owned-pick-effect="${escapeHtml(effect.name)}">
            <span>
              <span class="effect-name">
                <span class="effect-label">${escapeHtml(effect.name)}</span>
                ${penMark}
                ${ownedBadge}
                ${conflictBadge}
              </span>
              <small>${escapeHtml(effect.category)}${effect.uniqueOnly ? ' · 固有遺物' : ''}${effect.type === 'deep' && !effect.hasPenalty ? ' · デメリットなし' : ''}</small>
            </span>
            <b>${isSelected ? '✓' : '＋'}</b>
          </button>
        </div>
      `;
    }).join('');
  }

  function openOwnedEffectFilterDialog(groupIdx) {
    activeOwnedEffectGroup = Number(groupIdx) || 0;
    if (el('owned-eff-search')) el('owned-eff-search').value = '';
    if (!effectFilterDialog.open) {
      effectFilterDialog.showModal();
    }
    renderOwnedEffectFilterDialog();
    el('owned-eff-search')?.focus();
  }

  function renderOwnedPickerResults() {
    const type = activeOwnedOffset < 9 ? 'normal' : 'deep';
    renderOwnedEffectFilterSlots();
    const effectGroups = getCurrentOwnedEffectGroups(type);
    const allFilteredEffects = new Set(effectGroups.flat());
    const cardIdx = Math.floor((activeOwnedOffset % 9) / 3);
    const vessel = typeof VESSELS !== 'undefined' ? VESSELS.find(v => v.id === vesselId) : null;
    const slotVesselColor = vessel ? vessel[type][cardIdx] : null;
    const matchVessel = el('owned-match-vessel')?.checked && slotVesselColor;
    const colorFilter = el('owned-color-filter')?.value || '';
    const sizeFilter = el('owned-size-filter')?.value || '';
    const genreFilter = el('owned-genre-filter')?.value || '';
    const onlyFav = Boolean(el('owned-only-favorite')?.checked);
    const onlyChar = Boolean(el('owned-only-character')?.checked);
    const currentChar = typeof $ === 'function' && $('character') ? $('character').value : '';
    const terms = (typeof normalizeReadingSearch === 'function'
      ? normalizeReadingSearch(el('owned-search')?.value || '')
      : (el('owned-search')?.value || '').toLowerCase()
    ).trim().split(/\s+/).filter(Boolean);

    const filtered = ownedRelics.filter(r => {
      if ((r.type || 'normal') !== type) return false;
      if (genreFilter === 'gacha' && (r.isUnique || r.isShop)) return false;
      if (genreFilter === 'shop' && !r.isShop) return false;
      if (genreFilter === 'unique' && !r.isUnique) return false;
      if (genreFilter === 'no-fixed' && (r.isUnique || r.isShop)) return false;
      if (matchVessel && slotVesselColor !== '白' && r.color !== slotVesselColor) return false;
      if (colorFilter && r.color !== colorFilter) return false;
      if (sizeFilter && r.size !== sizeFilter) return false;
      if (onlyFav && !r.favorite) return false;
      if (!matchesOwnedEffectGroups(r, effectGroups)) return false;
      const effectObjs = (r.effectIds || []).map(id => typeof lookup !== 'undefined' ? lookup.get(id) : null).filter(Boolean);
      if (onlyChar && currentChar) {
        if (effectObjs.some(e => e.character && e.character !== currentChar)) return false;
      }
      if (terms.length) {
        const readings = (r.effectIds || []).map(id => (typeof EFFECT_READINGS !== 'undefined' && EFFECT_READINGS.effects?.[id]) || '').join(' ');
        const shopInfo = r.isShop ? `店売り遺物 ${r.shopName || ''} ${r.shopNote || ''}` : (r.isUnique ? '固有遺物' : 'ガチャ');
        const haystack = typeof normalizeReadingSearch === 'function'
          ? normalizeReadingSearch(`${r.name || ''} ${r.color || ''} ${shopInfo} ${(r.effects || []).join(' ')} ${(r.penalties || []).filter(Boolean).join(' ')} ${readings}`)
          : `${r.name || ''} ${shopInfo} ${(r.effects || []).join(' ')} ${(r.penalties || []).filter(Boolean).join(' ')}`.toLowerCase();
        if (!terms.every(t => haystack.includes(t))) return false;
      }
      return true;
    });

    el('owned-result-count').textContent = `${filtered.length} / ${ownedRelics.filter(r => (r.type || 'normal') === type).length} 件`;
    const container = el('owned-results');
    if (!ownedRelics.length) {
      container.innerHTML = window.relicDesktop
        ? `
        <div class="empty">
          <span class="empty-symbol">💎</span>
          まだ所持遺物が読み込まれていません。<br>
          右上の「💎 ゲームから読み込む」ボタンから、ゲーム内の所持遺物をスキャンしてください。
        </div>`
        : `
        <div class="empty">
          <span class="empty-symbol">💎</span>
          まだ所持遺物が読み込まれていません。<br>
          PC版アプリで書き出したバックアップJSONを右上の「📂 バックアップを読込」（または画面下部の「バックアップを読み込む」）から読み込むと、所持遺物をスマホ・ブラウザでも検索・選択できます。
        </div>`;
      return;
    }
    if (!filtered.length) {
      container.innerHTML = `<p class="empty">条件に一致する所持遺物がありません。<br>効果1〜3や検索語・フィルター条件を変更してください。</p>`;
      return;
    }

    container.innerHTML = filtered.map((r, idx) => {
      const isSelected = isOwnedRelicMatchedAtOffset(r, activeOwnedOffset);

      const effectLinesHtml = [0, 1, 2].map(j => {
        const effName = r.effects?.[j];
        if (!effName) return '';
        const effObj = typeof lookup !== 'undefined' && r.effectIds?.[j] ? lookup.get(r.effectIds[j]) : null;
        const penName = type === 'deep' ? (r.penalties?.[j] || null) : null;
        const isMatchedEff = allFilteredEffects.has(effName);
        return `
          <div class="owned-card-effect-item ${isMatchedEff ? 'is-filter-matched' : ''}">
            <span class="owned-card-effect-row">
              <span class="owned-card-effect-num">${j + 1}</span>
              <span class="owned-card-effect-main" ${effObj && typeof tooltipAttrs === 'function' ? tooltipAttrs(effObj) : ''}>${escapeHtml(effName)}</span>
            </span>
            ${penName ? `<span class="owned-card-penalty">▼ ${escapeHtml(penName)}</span>` : ''}
          </div>
        `;
      }).join('');

      const badgeSub = r.isUnique ? '固有' : r.isShop ? '店売り' : (r.size || '大');
      const genreTagHtml = r.isUnique
        ? ' <small class="owned-genre-tag is-unique">固有遺物</small>'
        : r.isShop
          ? ` <small class="owned-genre-tag is-shop" title="${escapeHtml((r.shopName || '') + (r.shopNote ? ' / ' + r.shopNote : ''))}">店売り遺物${r.shopName ? `・${escapeHtml(r.shopName)}` : ''}</small>`
          : '';
      return `
        <button class="unique-card owned-relic-card ${isSelected ? 'selected' : ''}" type="button" data-apply-owned="${escapeHtml(r.id || String(idx))}">
          <span class="owned-card-badge gem-${escapeHtml(r.color || '赤')}">
            <strong>${escapeHtml(r.color || '赤')}</strong>
            <small>${escapeHtml(badgeSub)}${r.favorite ? ' ★' : ''}</small>
          </span>
          <span class="unique-card-body">
            <strong class="owned-card-title">${escapeHtml(r.name || (type === 'deep' ? '深層遺物' : '通常遺物'))}${genreTagHtml}${r.favorite ? ' <span class="owned-fav-star">★</span>' : ''}${isSelected ? ' <small class="owned-selected-pill">装備中</small>' : ''}</strong>
            <span class="owned-card-effects-list">${effectLinesHtml}</span>
          </span>
        </button>
      `;
    }).join('');
  }

  function openOwnedPicker(offset) {
    activeOwnedOffset = offset;
    const type = offset < 9 ? 'normal' : 'deep';
    const cardNum = (offset % 9) / 3 + 1;
    const vessel = typeof VESSELS !== 'undefined' ? VESSELS.find(v => v.id === vesselId) : null;
    const slotColor = vessel ? vessel[type][cardNum - 1] : null;

    el('owned-picker-eyebrow').textContent = type === 'normal' ? 'OWNED NORMAL RELICS' : 'OWNED DEEP RELICS';
    el('owned-picker-title').textContent = `${type === 'normal' ? '通常' : '深層'}遺物 ${cardNum}${slotColor ? `（盃：${slotColor}）` : ''} · 所持遺物を選ぶ`;
    el('owned-match-vessel').disabled = !vesselId;
    el('owned-match-vessel').checked = Boolean(vesselId);
    renderOwnedPickerResults();
    pickerDialog.showModal();
    el('owned-search')?.focus();
  }

  function applyOwnedRelic(relicId) {
    const r = ownedRelics.find((item, idx) => (item.id || String(idx)) === relicId);
    if (!r) return;
    const type = activeOwnedOffset < 9 ? 'normal' : 'deep';
    const { ids: resolvedIds, pens } = resolveOwnedRelicSlots(r, type);

    slots.splice(activeOwnedOffset, 3, ...resolvedIds);
    if (type === 'deep') {
      const pBase = activeOwnedOffset - 9;
      for (let j = 0; j < 3; j++) {
        penaltySlots[pBase + j] = pens[j];
      }
    }
    if (typeof draft === 'function') draft();
    pickerDialog.close();
    if (typeof notify === 'function') {
      notify(`所持遺物「${r.effects.join(' ／ ')}」をセットしました。`);
    }
  }

  // Event Listeners
  if (el('inventory-import-open')) {
    el('inventory-import-open').onclick = openScanDialog;
  }
  el('inventory-import-close').onclick = () => {
    scanDialog.close();
  };
  scanDialog.addEventListener('cancel', ev => {
    if (running && currentPhase === 'recording') {
      ev.preventDefault();
      window.relicDesktop?.stopInventoryImport?.('stop-recording');
    }
  });
  el('inventory-import-mode').onchange = () => {
    updateScanButtons();
  };
  el('inventory-import-video-file').onchange = () => {
    updateScanButtons();
  };
  el('inventory-import-refresh').onclick = refreshWindows;
  el('inventory-import-window').onchange = updateScanButtons;
  el('inventory-import-start').onclick = startScan;
  el('inventory-import-stop').onclick = () => {
    const mode = currentPhase === 'recording' ? 'stop-recording' : 'abort-all';
    window.relicDesktop?.stopInventoryImport?.(mode);
  };
  el('inventory-reanalyze-recorded').onclick = async () => {
    el('inventory-import-status').textContent = '前回の録画データを読み込んでアプリ内分析を開始します…';
    await runImportRequest({
      captureMode: 'reanalyze-recorded',
      scope: 'all'
    });
  };
  el('inventory-reanalyze-unread').onclick = async () => {
    if (!window.relicDesktop?.reanalyzeUnreadInventory) return;
    try {
      const res = await window.relicDesktop.reanalyzeUnreadInventory();
      if (res && Array.isArray(res.relics)) {
        ownedRelics = res.relics;
        unreadCount = Number(res.remainingUnread || 0);
        saveLocalOwned();
        updateHeaderCounts();
      }
      el('inventory-import-status').textContent = `未読データの再解析完了：新たに ${res.promotedCount} 件の遺物を認識・追加しました（残り未読：${res.remainingUnread} 件 ／ 合計保存：${ownedRelics.length} 件）。`;
      if (res.promotedCount > 0 && typeof notify === 'function') {
        notify(`${res.promotedCount} 件の未読遺物を所持遺物に昇格しました！`);
      }
    } catch (error) {
      el('inventory-import-status').textContent = error.message || '再解析に失敗しました。';
    }
  };
  el('inventory-open-unread').onclick = () => {
    if (lastUnreadFolder && window.relicDesktop?.openPathInExplorer) {
      window.relicDesktop.openPathInExplorer(lastUnreadFolder);
    } else if (window.relicDesktop?.openSessionFolder) {
      window.relicDesktop.openSessionFolder();
    }
  };

  if (!window.relicDesktop && el('owned-picker-scan-open')) {
    el('owned-picker-scan-open').textContent = '📂 バックアップを読込';
  }
  el('owned-picker-scan-open').onclick = () => {
    if (window.relicDesktop) {
      openScanDialog();
    } else {
      document.getElementById('import-file')?.click();
    }
  };
  el('close-owned-picker').onclick = () => {
    if (effectFilterDialog.open) effectFilterDialog.close();
    pickerDialog.close();
  };
  for (const id of ['owned-search', 'owned-color-filter', 'owned-size-filter', 'owned-genre-filter', 'owned-match-vessel', 'owned-only-favorite', 'owned-only-character']) {
    el(id)?.addEventListener(id === 'owned-search' ? 'input' : 'change', renderOwnedPickerResults);
  }

  el('owned-filter-from-slot')?.addEventListener('click', () => {
    const type = activeOwnedOffset < 9 ? 'normal' : 'deep';
    const curIds = [slots[activeOwnedOffset], slots[activeOwnedOffset + 1], slots[activeOwnedOffset + 2]];
    const names = curIds.map(id => {
      if (!id || typeof lookup === 'undefined') return [];
      const eff = lookup.get(id);
      return eff && eff.name ? [eff.name] : [];
    });
    if (!names.some(arr => arr.length > 0)) {
      if (typeof notify === 'function') notify('現在の遺物枠にはまだ効果がセットされていません。');
      return;
    }
    ownedEffectGroupsByType[type] = names;
    renderOwnedPickerResults();
  });

  el('owned-filter-clear-all')?.addEventListener('click', () => {
    const type = activeOwnedOffset < 9 ? 'normal' : 'deep';
    ownedEffectGroupsByType[type] = [[], [], []];
    renderOwnedPickerResults();
  });

  el('owned-effect-groups')?.addEventListener('click', ev => {
    const type = activeOwnedOffset < 9 ? 'normal' : 'deep';
    const groups = getCurrentOwnedEffectGroups(type);
    const resetBtn = ev.target.closest('button[data-owned-reset-group]');
    if (resetBtn) {
      ev.stopPropagation();
      const gIdx = Number(resetBtn.dataset.ownedResetGroup);
      groups[gIdx] = [];
      renderOwnedPickerResults();
      return;
    }
    const openBtn = ev.target.closest('button[data-owned-open-group]');
    if (openBtn) {
      openOwnedEffectFilterDialog(Number(openBtn.dataset.ownedOpenGroup));
    }
  });

  el('owned-eff-close')?.addEventListener('click', () => effectFilterDialog.close());
  el('owned-eff-clear-group')?.addEventListener('click', () => {
    const type = activeOwnedOffset < 9 ? 'normal' : 'deep';
    const groups = getCurrentOwnedEffectGroups(type);
    groups[activeOwnedEffectGroup] = [];
    renderOwnedPickerResults();
    effectFilterDialog.close();
  });
  el('owned-eff-slot-tabs')?.addEventListener('click', ev => {
    const btn = ev.target.closest('button[data-owned-eff-tab]');
    if (!btn) return;
    activeOwnedEffectGroup = Number(btn.dataset.ownedEffTab) || 0;
    renderOwnedEffectFilterDialog();
  });
  for (const id of ['owned-eff-search', 'owned-eff-category', 'owned-eff-owned-only', 'owned-eff-char-only']) {
    el(id)?.addEventListener(id === 'owned-eff-search' ? 'input' : 'change', renderOwnedEffectFilterDialog);
  }
  el('owned-eff-list')?.addEventListener('click', ev => {
    const btn = ev.target.closest('button[data-owned-pick-effect]');
    if (!btn) return;
    const effName = btn.dataset.ownedPickEffect;
    const type = activeOwnedOffset < 9 ? 'normal' : 'deep';
    const groups = getCurrentOwnedEffectGroups(type);
    groups[activeOwnedEffectGroup] = [effName];
    renderOwnedPickerResults();
    effectFilterDialog.close();
  });

  document.addEventListener('click', ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    if (btn.dataset.openOwned !== undefined) {
      openOwnedPicker(Number(btn.dataset.openOwned));
      return;
    }
    if (btn.dataset.applyOwned !== undefined) {
      applyOwnedRelic(btn.dataset.applyOwned);
    }
  });

  if (window.relicDesktop?.onInventoryImportProgress) {
    window.relicDesktop.onInventoryImportProgress(payload => {
      if (!payload) return;
      if (payload.type === 'log' && payload.message) {
        appendScanLog(payload.message);
      } else if (payload.type === 'phase') {
        currentPhase = payload.phase || currentPhase;
        if (payload.recordedCount !== undefined) progressStats.recordedCount = payload.recordedCount;
        if (payload.totalRecorded !== undefined) progressStats.totalRecorded = payload.totalRecorded;
        if (payload.expectedTotal !== undefined) progressStats.expectedTotal = payload.expectedTotal;
        if (payload.analyzedCount !== undefined) progressStats.analyzedCount = payload.analyzedCount;
        updateScanButtons();
      } else if (payload.type === 'recorded') {
        currentPhase = 'recording';
        progressStats.recordedCount = payload.recordedCount || progressStats.recordedCount;
        if (payload.expectedTotal !== undefined) progressStats.expectedTotal = payload.expectedTotal;
        el('inventory-import-status').textContent =
          `🎥 一気撮り録画中：${progressStats.recordedCount}${progressStats.expectedTotal ? ` / ${progressStats.expectedTotal}` : ''} 件を撮影しました（撮影完了後すぐにPC操作が解放されます）`;
        updateScanButtons();
      } else if (payload.type === 'recording-complete') {
        currentPhase = 'analyzing';
        progressStats.recordedCount = payload.recordedCount || progressStats.recordedCount;
        progressStats.totalRecorded = payload.recordedCount || progressStats.totalRecorded;
        progressStats.analyzedCount = 0;
        el('inventory-import-status').textContent =
          `🔓 録画完了（全 ${progressStats.totalRecorded} 件）！PC操作ロックを解除しました。アプリ内でバックグラウンド分析中です…`;
        if (typeof notify === 'function') {
          notify(`📸 全 ${progressStats.totalRecorded} 件の録画が完了し、PC操作を解放しました！裏でアプリ内分析を進めます。`);
        }
        updateScanButtons();
      } else if (payload.type === 'relic' && payload.relic) {
        currentPhase = 'analyzing';
        if (payload.analyzedCount !== undefined) progressStats.analyzedCount = payload.analyzedCount;
        if (payload.totalRecorded !== undefined) progressStats.totalRecorded = payload.totalRecorded;
        const keyOf = r => `${r.type}|${r.color}|${(r.effects || []).join(',')}|${(r.penalties || []).join(',')}`;
        const newKey = keyOf(payload.relic);
        if (!ownedRelics.some(r => keyOf(r) === newKey)) {
          ownedRelics.push(payload.relic);
        }
        saveLocalOwned();
        updateScanButtons();
        if (pickerDialog.open) renderOwnedPickerResults();
        el('inventory-import-status').textContent =
          `🔄 アプリ内分析中（PC操作自由）：${progressStats.analyzedCount}/${progressStats.totalRecorded || '?'} 件完了 ｜ 成功 ${payload.scannedCount} 件 ／ 未読 ${payload.unreadCount} 件（合計保存：${ownedRelics.length} 件）`;
      } else if (payload.type === 'unread') {
        currentPhase = 'analyzing';
        if (payload.analyzedCount !== undefined) progressStats.analyzedCount = payload.analyzedCount;
        if (payload.totalRecorded !== undefined) progressStats.totalRecorded = payload.totalRecorded;
        unreadCount = payload.unreadCount || unreadCount + 1;
        if (payload.unreadFolder) lastUnreadFolder = payload.unreadFolder;
        saveLocalOwned();
        updateScanButtons();
        el('inventory-import-status').textContent =
          `🔄 アプリ内分析中（PC操作自由）：${progressStats.analyzedCount}/${progressStats.totalRecorded || '?'} 件完了 ｜ 成功 ${payload.scannedCount} 件 ／ 未読 ${payload.unreadCount} 件（未読画像を自動保存）`;
      }
    });
  }

  // Hook into render() so button counts stay updated when cards re-render
  const origRender = window.render;
  if (typeof origRender === 'function') {
    window.render = function (...args) {
      const res = origRender.apply(this, args);
      updateHeaderCounts();
      return res;
    };
  }

  window.addEventListener('relic-owned-imported', () => {
    loadLocalOwned();
    updateHeaderCounts();
    if (pickerDialog.open) renderOwnedPickerResults();
  });

  syncFromDesktop();
  refreshRecordedSessionInfo();
  updateHeaderCounts();
})();
