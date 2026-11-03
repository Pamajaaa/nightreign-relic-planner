'use strict';

if (window.relicDesktop && typeof window.relicDesktop.recorderList === 'function') (() => {
  const el = id => document.getElementById(id);
  const escapeHtml = str => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  function toFileUrl(filePath) {
    if (!filePath) return '';
    const norm = String(filePath).replace(/\\/g, '/');
    return encodeURI('file:///' + norm.replace(/^\/+/, '')).replace(/#/g, '%23');
  }

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '00:00';
    const total = Math.floor(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  // 1. Setup Top Tabs (#planner-tab, #automation-tab, #recorder-tab)
  const nav = document.querySelector('.app-tabs');
  const plannerPane = el('planner-pane');
  const automationPane = el('automation-pane');

  const recorderPane = document.createElement('section');
  recorderPane.id = 'recorder-pane';
  recorderPane.hidden = true;
  if (plannerPane) {
    plannerPane.after(recorderPane);
  } else {
    document.querySelector('main')?.append(recorderPane);
  }

  if (nav) {
    nav.hidden = false;
    const plannerTab = el('planner-tab');
    const automationTab = el('automation-tab');
    if (plannerTab) plannerTab.textContent = '理想遺物';
    if (automationTab) {
      automationTab.textContent = '自動リセマラ';
      automationTab.setAttribute('aria-selected', 'false');
    }
    const recorderTab = document.createElement('button');
    recorderTab.id = 'recorder-tab';
    recorderTab.type = 'button';
    recorderTab.setAttribute('role', 'tab');
    recorderTab.setAttribute('aria-controls', 'recorder-pane');
    recorderTab.setAttribute('aria-selected', 'false');
    recorderTab.innerHTML = 'ボス戦自動録画・再生 <span id="recorder-tab-badge" class="recorder-tab-badge" hidden></span>';

    const verBadge = el('app-version-badge');
    if (verBadge) nav.insertBefore(recorderTab, verBadge);
    else nav.append(recorderTab);

    // Eco Black Screen (monitor standby without turning off DisplayPort HPD)
    const blackoutBtn = document.createElement('button');
    blackoutBtn.id = 'eco-blackout-btn';
    blackoutBtn.type = 'button';
    blackoutBtn.className = 'subtle eco-blackout-btn';
    blackoutBtn.title = 'モニターの物理電源を切らずに画面を真っ黒にします（DisplayPort切断による復帰不能を防ぎます）';
    blackoutBtn.textContent = '画面を暗くする（省電力）';
    if (verBadge) nav.insertBefore(blackoutBtn, verBadge);
    else nav.append(blackoutBtn);

    let blackoutOverlay = el('eco-blackout-overlay');
    if (!blackoutOverlay) {
      blackoutOverlay = document.createElement('div');
      blackoutOverlay.id = 'eco-blackout-overlay';
      blackoutOverlay.className = 'eco-blackout-overlay';
      blackoutOverlay.hidden = true;
      blackoutOverlay.innerHTML = `
        <div id="eco-blackout-hint" class="eco-blackout-hint">
          <p>省電力ブラックスクリーン中（裏ガチャ・監視はそのまま稼働中）</p>
          <small>マウスを大きく動かすか、クリック・任意のキーを押すと元の画面に戻ります</small>
        </div>
      `;
      document.body.append(blackoutOverlay);
    }

    let blackoutEnteredAt = 0;
    let lastMousePos = null;
    let hintHideTimer = null;

    const exitBlackout = () => {
      if (typeof window.relicDesktop?.setEcoBlackout === 'function') {
        window.relicDesktop.setEcoBlackout(false).catch(() => {});
      }
      if (blackoutOverlay.hidden) return;
      blackoutOverlay.hidden = true;
      clearTimeout(hintHideTimer);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };

    const enterBlackout = async () => {
      if (typeof window.relicDesktop?.setEcoBlackout === 'function') {
        const res = await window.relicDesktop.setEcoBlackout(true).catch(() => null);
        if (res && res.active) return;
      }
      blackoutOverlay.hidden = false;
      blackoutEnteredAt = Date.now();
      lastMousePos = null;
      const hint = el('eco-blackout-hint');
      if (hint) {
        hint.classList.remove('is-faded');
        clearTimeout(hintHideTimer);
        hintHideTimer = setTimeout(() => {
          hint.classList.add('is-faded');
        }, 3000);
      }
      try {
        await document.documentElement.requestFullscreen();
      } catch {}
    };

    if (typeof window.relicDesktop?.onEcoBlackoutClosed === 'function') {
      window.relicDesktop.onEcoBlackoutClosed(() => {
        blackoutOverlay.hidden = true;
      });
    }

    blackoutBtn.addEventListener('click', enterBlackout);
    blackoutOverlay.addEventListener('mousedown', () => {
      if (Date.now() - blackoutEnteredAt > 400) exitBlackout();
    });
    blackoutOverlay.addEventListener('mousemove', ev => {
      if (Date.now() - blackoutEnteredAt < 1200) {
        lastMousePos = { x: ev.clientX, y: ev.clientY };
        return;
      }
      if (!lastMousePos) {
        lastMousePos = { x: ev.clientX, y: ev.clientY };
        return;
      }
      const dist = Math.hypot(ev.clientX - lastMousePos.x, ev.clientY - lastMousePos.y);
      if (dist > 45) {
        exitBlackout();
      }
    });
    window.addEventListener('keydown', ev => {
      if (!blackoutOverlay.hidden && Date.now() - blackoutEnteredAt > 300) {
        ev.preventDefault();
        exitBlackout();
      }
    }, true);
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && !blackoutOverlay.hidden && Date.now() - blackoutEnteredAt > 800) {
        blackoutOverlay.hidden = true;
      }
    });

    const switchMainTab = (mode, scrollTarget = null) => {
      const isRecorder = mode === 'recorder';
      if (plannerPane) plannerPane.hidden = isRecorder;
      if (automationPane) automationPane.hidden = false;
      recorderPane.hidden = !isRecorder;

      if (plannerTab) plannerTab.setAttribute('aria-selected', String(mode === 'planner'));
      if (automationTab) automationTab.setAttribute('aria-selected', String(mode === 'automation'));
      recorderTab.setAttribute('aria-selected', String(isRecorder));

      if (isRecorder) {
        refreshRecorderLibrary();
        refreshRecorderWindows();
      } else if (scrollTarget) {
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    plannerTab?.addEventListener('click', () => switchMainTab('planner', plannerPane));
    automationTab?.addEventListener('click', () => switchMainTab('automation', automationPane));
    recorderTab.addEventListener('click', () => switchMainTab('recorder'));
  }

  // 2. Build Recorder & Player UI inside #recorder-pane
  recorderPane.innerHTML = `
    <div class="recorder-top-bar">
      <div class="recorder-top-head">
        <div>
          <p class="eyebrow">BOSS BATTLE AUTO RECORDER & PLAYER</p>
          <h2>ボス戦自動録画（1日目の夜・2日目の夜・夜の王）＆プレイヤー</h2>
        </div>
        <div id="recorder-status-banner" class="recorder-status-banner">
          <span class="recorder-status-dot"></span>
          <span id="recorder-status-text">自動監視：オフ（開始ボタンを押すと裏でボス戦を自動検知して録画します）</span>
        </div>
      </div>

      <div class="recorder-controls-row">
        <label for="recorder-window">対象ゲーム画面
          <select id="recorder-window"></select>
        </label>
        <button type="button" id="recorder-window-refresh" class="subtle">再取得</button>
        <label title="オンにするとPCのゲーム音声も一緒に録画します">
          <input type="checkbox" id="recorder-audio-toggle" checked>
          <span>ゲーム音声も録音する</span>
        </label>
        <button type="button" id="recorder-monitor-toggle" class="recorder-btn-monitor">自動監視・自動録画を開始</button>
        <button type="button" id="recorder-manual-btn" class="recorder-btn-manual" title="手動で今すぐ録画を開始／停止して保存します">今すぐ手動録画</button>
      </div>

      <div id="recorder-live-override" class="recorder-live-override" hidden>
        <strong>現在録画中のボス情報（自動判別・手動修正可）：</strong>
        <label>フェーズ
          <select id="recorder-live-phase">
            <option value="1日目の夜">1日目の夜</option>
            <option value="2日目の夜">2日目の夜</option>
            <option value="夜の王" selected>夜の王</option>
          </select>
        </label>
        <label>ボス名
          <input type="text" id="recorder-live-boss" list="recorder-boss-datalist" placeholder="ボス名（自動判別中…）">
        </label>
        <span id="recorder-live-timer" class="recorder-time-readout">00:00</span>
      </div>

      <div class="recorder-folder-bar">
        <div>保存先（ボス名ごとに自動でフォルダ分けされます）：<span id="recorder-folder-path" class="recorder-folder-path"></span></div>
        <div class="recorder-folder-actions">
          <button type="button" id="recorder-choose-folder" class="subtle">保存先を変更</button>
          <button type="button" id="recorder-open-folder" class="subtle">保存フォルダを開く</button>
        </div>
      </div>
    </div>

    <datalist id="recorder-boss-datalist"></datalist>

    <div class="recorder-main-grid">
      <div class="recorder-player-card">
        <div id="recorder-video-viewport" class="recorder-video-viewport">
          <video id="recorder-video" playsinline></video>
          <div id="recorder-video-placeholder" class="recorder-video-placeholder">
            <strong>録画データを選択するとここで再生できます</strong>
            <p>右側のリストから録画を選ぶか、「自動監視・自動録画を開始」をオンにしてナイトレインをプレイすると、「1日目の夜」「2日目の夜」「夜の王」の3戦だけをボス名別のフォルダに自動保存します。</p>
          </div>
        </div>

        <div class="recorder-player-controls-wrap">
          <div id="recorder-timeline-container" class="recorder-timeline-container" aria-label="動画シークバー">
            <div class="recorder-timeline-track">
              <div id="recorder-timeline-ab" class="recorder-timeline-ab" hidden></div>
              <div id="recorder-timeline-fill" class="recorder-timeline-fill"></div>
              <div id="recorder-timeline-markers" class="recorder-timeline-markers"></div>
              <div id="recorder-timeline-thumb" class="recorder-timeline-thumb"></div>
            </div>
            <div id="recorder-seek-hover-tip" class="recorder-seek-hover-tip" hidden>00:00</div>
          </div>

          <div class="recorder-transport-bar">
            <div class="recorder-transport-left">
              <button type="button" id="recorder-play-btn" class="recorder-ctrl-btn is-primary" title="再生 / 一時停止 (Space / K)">▶</button>
              <button type="button" id="recorder-back-10" class="recorder-ctrl-btn" title="10秒戻す (J)">⏪ 10s</button>
              <button type="button" id="recorder-back-5" class="recorder-ctrl-btn" title="5秒戻す (←)">◀ 5s</button>
              <button type="button" id="recorder-fwd-5" class="recorder-ctrl-btn" title="5秒進める (→)">5s ▶</button>
              <button type="button" id="recorder-fwd-10" class="recorder-ctrl-btn" title="10秒進める (L)">10s ⏩</button>
              <button type="button" id="recorder-frame-prev" class="recorder-ctrl-btn" title="1コマ戻す (,)">⏮ 1コマ</button>
              <button type="button" id="recorder-frame-next" class="recorder-ctrl-btn" title="1コマ進める (.)">1コマ ⏭</button>
              <span class="recorder-time-readout">
                <span id="recorder-time-current">00:00</span> / <span id="recorder-time-total">00:00</span>
              </span>
              <span class="recorder-volume-group">
                <button type="button" id="recorder-mute-btn" class="recorder-ctrl-btn" title="ミュート切替 (M)">🔊</button>
                <input type="range" id="recorder-player-volume" min="0" max="100" step="5" value="90" aria-label="プレイヤー音量">
              </span>
            </div>

            <div class="recorder-transport-right">
              <button type="button" id="recorder-add-bookmark" class="recorder-ctrl-btn" title="現在の再生位置にブックマークを追加 (B)">位置を記録</button>
              <button type="button" id="recorder-ab-loop" class="recorder-ctrl-btn" title="特定の区間（ボスの大技など）をA-Bリピート再生します">区間ループ</button>
              <select id="recorder-speed-select" class="recorder-speed-select" aria-label="再生速度" title="再生速度">
                <option value="0.25">0.25x (超スロー)</option>
                <option value="0.5">0.5x (スロー)</option>
                <option value="0.75">0.75x</option>
                <option value="1" selected>1.0x (標準)</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x (倍速)</option>
              </select>
              <button type="button" id="recorder-pip-btn" class="recorder-ctrl-btn" title="ピクチャーインピクチャー（小窓表示）">小窓</button>
              <button type="button" id="recorder-fullscreen-btn" class="recorder-ctrl-btn" title="全画面表示 (F)">⛶</button>
            </div>
          </div>

          <div class="recorder-shortcut-hint">
            <span>ショートカット：<b>Space/K</b> 再生・停止 ｜ <b>←/→</b> ±5秒 ｜ <b>J/L</b> ±10秒 ｜ <b>, / .</b> 1コマ送り ｜ <b>B</b> 位置記録 ｜ <b>F</b> 全画面</span>
          </div>
        </div>

        <div id="recorder-meta-panel" class="recorder-meta-panel" hidden>
          <div class="recorder-meta-row">
            <label>ボス名（フォルダ）
              <input type="text" id="recorder-edit-boss" list="recorder-boss-datalist" placeholder="ボス名">
            </label>
            <label>フェーズ
              <select id="recorder-edit-phase">
                <option value="1日目の夜">1日目の夜</option>
                <option value="2日目の夜">2日目の夜</option>
                <option value="夜の王">夜の王</option>
              </select>
            </label>
            <label>勝敗
              <select id="recorder-edit-outcome">
                <option value="勝利">勝利</option>
                <option value="敗北">敗北</option>
              </select>
            </label>
            <label style="flex:1;min-width:160px;">メモ
              <input type="text" id="recorder-edit-memo" placeholder="メモ（使用キャラ・ビルド・反省点など）" style="width:100%;">
            </label>
            <button type="button" id="recorder-save-meta" class="subtle">変更を保存</button>
          </div>
          <div id="recorder-bookmarks-bar" class="recorder-bookmarks-bar"></div>
        </div>
      </div>

      <aside class="recorder-library-card">
        <div class="recorder-library-head">
          <h3>ボス別録画ライブラリ</h3>
          <span id="recorder-total-count" style="font-size:12px;color:var(--muted);">0 件</span>
        </div>

        <div id="recorder-boss-folders" class="recorder-boss-folders"></div>

        <div id="recorder-phase-tabs" class="recorder-phase-tabs">
          <button type="button" class="recorder-phase-tab is-active" data-phase-filter="">すべて</button>
          <button type="button" class="recorder-phase-tab" data-phase-filter="1日目の夜">1日目の夜</button>
          <button type="button" class="recorder-phase-tab" data-phase-filter="2日目の夜">2日目の夜</button>
          <button type="button" class="recorder-phase-tab" data-phase-filter="夜の王">夜の王</button>
        </div>

        <div class="recorder-library-filters">
          <input type="search" id="recorder-search" placeholder="ボス名・メモ・日時で検索…" autocomplete="off">
          <select id="recorder-outcome-filter" aria-label="勝敗フィルター">
            <option value="">すべての勝敗</option>
            <option value="勝利">勝利のみ</option>
            <option value="敗北">敗北のみ</option>
          </select>
        </div>

        <div id="recorder-video-list" class="recorder-video-list"></div>
      </aside>
    </div>
  `;

  // State
  let recorderSettings = { outputDir: '', audioEnabled: true };
  let bossCatalog = [];
  let recordings = [];
  let activeVideoId = null;
  let selectedBossFilter = '';
  let selectedPhaseFilter = '';
  let abLoopStart = null;
  let abLoopEnd = null;

  // Monitoring & Recording State
  let isMonitoring = false;
  let isRecordingBattle = false;
  let isManualRecording = false;
  let captureStream = null;
  let hiddenCaptureVideo = null;
  let offscreenCanvas = null;
  let activeMediaRecorder = null;
  let activeChunks = [];
  let segmentStartMs = 0;
  let battleStartMs = 0;
  let monitorIntervalId = null;
  let liveTimerIntervalId = null;
  let analyzingFrame = false;

  // Detection state machine
  let currentExpeditionDay = '1日目の夜';
  let nightBannerSeenAtMs = 0;
  let consecutiveBossBarHits = 0;
  let consecutiveNoBossBarMisses = 0;
  let bestDetectedBoss = null; // { bossName, defaultPhase, confidence }
  let detectedOutcome = null;

  const videoEl = el('recorder-video');

  async function refreshRecorderWindows() {
    if (typeof window.relicDesktop?.filterWindows !== 'function') return;
    try {
      const wins = await window.relicDesktop.filterWindows();
      const sel = el('recorder-window');
      if (!sel) return;
      const prev = sel.value;
      sel.innerHTML = '';
      if (!wins.length) {
        sel.add(new Option('ゲームウィンドウが見つかりません', ''));
        return;
      }
      for (const w of wins) {
        sel.add(new Option(w.name, w.id));
      }
      const nightreignWin = wins.find(w => /nightreign/i.test(w.name));
      if (prev && wins.some(w => w.id === prev)) sel.value = prev;
      else if (nightreignWin) sel.value = nightreignWin.id;
    } catch {}
  }

  async function refreshRecorderLibrary() {
    try {
      const data = await window.relicDesktop.recorderList();
      if (!data) return;
      recorderSettings = data.settings || recorderSettings;
      bossCatalog = data.catalog || [];
      recordings = data.recordings || [];

      if (el('recorder-folder-path')) el('recorder-folder-path').textContent = recorderSettings.outputDir || '';
      if (el('recorder-audio-toggle')) el('recorder-audio-toggle').checked = recorderSettings.audioEnabled !== false;

      const dl = el('recorder-boss-datalist');
      if (dl && !dl.children.length && bossCatalog.length) {
        dl.innerHTML = bossCatalog.map(b => `<option value="${escapeHtml(b.name)}">${escapeHtml(b.defaultPhase)}</option>`).join('');
      }

      renderBossFolders();
      renderVideoList();
    } catch {}
  }

  function renderBossFolders() {
    const container = el('recorder-boss-folders');
    if (!container) return;
    const countsByBoss = new Map();
    for (const r of recordings) {
      countsByBoss.set(r.bossName, (countsByBoss.get(r.bossName) || 0) + 1);
    }
    if (selectedBossFilter && !countsByBoss.has(selectedBossFilter)) {
      selectedBossFilter = '';
    }

    const pills = [
      `<button type="button" class="recorder-boss-pill ${selectedBossFilter === '' ? 'is-active' : ''}" data-boss-folder="">すべて <small>${recordings.length}</small></button>`
    ];
    for (const [bossName, cnt] of countsByBoss.entries()) {
      const active = selectedBossFilter === bossName ? 'is-active' : '';
      pills.push(`
        <button type="button" class="recorder-boss-pill ${active}" data-boss-folder="${escapeHtml(bossName)}">
          <span>${escapeHtml(bossName)}</span>
          <small>${cnt}</small>
        </button>
      `);
    }
    container.innerHTML = pills.join('');
  }

  function renderVideoList() {
    const listEl = el('recorder-video-list');
    if (!listEl) return;
    const q = (el('recorder-search')?.value || '').trim().toLowerCase();
    const outcomeFilter = el('recorder-outcome-filter')?.value || '';

    const filtered = recordings.filter(r => {
      if (selectedBossFilter && r.bossName !== selectedBossFilter) return false;
      if (selectedPhaseFilter && r.phase !== selectedPhaseFilter) return false;
      if (outcomeFilter && r.outcome !== outcomeFilter) return false;
      if (q) {
        const hay = `${r.bossName} ${r.phase} ${r.outcome} ${r.memo || ''} ${r.fileName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (el('recorder-total-count')) {
      el('recorder-total-count').textContent = `${filtered.length} / ${recordings.length} 件`;
    }

    if (!filtered.length) {
      listEl.innerHTML = `<p class="empty" style="padding:24px 12px;text-align:center;">該当する録画データがありません。<br>自動監視をオンにしてボスと戦うか、条件を変更してください。</p>`;
      return;
    }

    listEl.innerHTML = filtered.map(r => {
      const isPlaying = r.id === activeVideoId;
      const phaseClass = r.phase === '1日目の夜' ? 'phase-day1' : r.phase === '2日目の夜' ? 'phase-day2' : 'phase-lord';
      const outcomeClass = r.outcome === '敗北' ? 'is-loss' : 'is-win';
      const outcomeIcon = r.outcome === '敗北' ? '敗北' : '勝利';
      const dateStr = new Date(r.createdAt).toLocaleString('ja-JP', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const durText = r.durationSec > 0 ? formatTime(r.durationSec) : '--:--';
      const bmCount = Array.isArray(r.bookmarks) && r.bookmarks.length ? ` · 記録${r.bookmarks.length}` : '';

      return `
        <div class="recorder-video-item ${isPlaying ? 'is-playing' : ''}" data-play-video="${escapeHtml(r.id)}">
          <div class="recorder-item-top">
            <span class="recorder-item-badges">
              <span class="recorder-phase-badge ${phaseClass}">${escapeHtml(r.phase)}</span>
              <span class="recorder-outcome-badge ${outcomeClass}">${outcomeIcon}</span>
            </span>
            <span style="font-family:Consolas,monospace;font-size:12px;color:#d8e2df;">${durText}${bmCount}</span>
          </div>
          <div class="recorder-item-boss">${escapeHtml(r.bossName)}</div>
          ${r.memo ? `<div style="font-size:11.5px;color:#b8ebc5;">${escapeHtml(r.memo)}</div>` : ''}
          <div class="recorder-item-meta">
            <span>${escapeHtml(dateStr)} · ${formatBytes(r.sizeBytes)}</span>
            <span class="recorder-item-actions">
              <button type="button" class="subtle" data-reveal-video="${escapeHtml(r.id)}" title="エクスプローラーでこの動画ファイルを表示">場所を開く</button>
              <button type="button" class="subtle" data-delete-video="${escapeHtml(r.id)}" title="この録画データを削除">削除</button>
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  function loadVideoIntoPlayer(id) {
    const rec = recordings.find(r => r.id === id);
    if (!rec) return;
    activeVideoId = rec.id;
    abLoopStart = null;
    abLoopEnd = null;
    updateAbLoopUi();

    if (el('recorder-video-placeholder')) el('recorder-video-placeholder').hidden = true;
    if (el('recorder-meta-panel')) el('recorder-meta-panel').hidden = false;

    el('recorder-edit-boss').value = rec.bossName || '';
    el('recorder-edit-phase').value = rec.phase || '夜の王';
    el('recorder-edit-outcome').value = rec.outcome || '勝利';
    el('recorder-edit-memo').value = rec.memo || '';

    videoEl.src = toFileUrl(rec.filePath);
    videoEl.playbackRate = Number(el('recorder-speed-select')?.value || 1);
    videoEl.play().catch(() => {});

    renderBookmarksForActiveVideo();
    renderVideoList();
  }

  function getEffectiveDuration() {
    const d = videoEl.duration;
    if (Number.isFinite(d) && d > 0) return d;
    const rec = recordings.find(r => r.id === activeVideoId);
    return rec?.durationSec || 0;
  }

  function renderBookmarksForActiveVideo() {
    const rec = recordings.find(r => r.id === activeVideoId);
    const bar = el('recorder-bookmarks-bar');
    const markers = el('recorder-timeline-markers');
    if (!bar || !markers) return;
    const bms = Array.isArray(rec?.bookmarks) ? rec.bookmarks : [];
    const dur = getEffectiveDuration();

    if (!bms.length) {
      bar.innerHTML = `<span style="font-size:11.5px;color:var(--muted);">ブックマークなし（「位置を記録」または B キーでボスの大技・見返したい時間をピン留めできます）</span>`;
      markers.innerHTML = '';
      return;
    }

    bar.innerHTML = bms.map((bm, idx) => `
      <span class="recorder-bookmark-chip" data-jump-sec="${Number(bm.sec)}">
        <span>${formatTime(bm.sec)}${bm.label ? ` ${escapeHtml(bm.label)}` : ''}</span>
        <button type="button" class="recorder-bookmark-del" data-del-bookmark="${idx}" title="このブックマークを削除">×</button>
      </span>
    `).join('');

    if (dur > 0) {
      markers.innerHTML = bms.map(bm => {
        const pct = Math.max(0, Math.min(100, (Number(bm.sec) / dur) * 100));
        return `<span class="recorder-bookmark-pin" style="left:${pct}%"></span>`;
      }).join('');
    } else {
      markers.innerHTML = '';
    }
  }

  // Resolve WebM duration if browser reports Infinity
  videoEl.addEventListener('loadedmetadata', () => {
    const rec = recordings.find(r => r.id === activeVideoId);
    if (!Number.isFinite(videoEl.duration) || videoEl.duration === Infinity) {
      if (rec?.durationSec > 0) {
        el('recorder-time-total').textContent = formatTime(rec.durationSec);
        renderBookmarksForActiveVideo();
      } else {
        videoEl.currentTime = 1e101;
        const onSeekEnd = () => {
          videoEl.removeEventListener('timeupdate', onSeekEnd);
          if (Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
            const resolvedSec = Math.round(videoEl.duration);
            el('recorder-time-total').textContent = formatTime(resolvedSec);
            if (rec && !rec.durationSec) {
              rec.durationSec = resolvedSec;
              window.relicDesktop.recorderUpdateMeta({ id: rec.id, durationSec: resolvedSec }).catch(() => {});
            }
          }
          videoEl.currentTime = 0;
          renderBookmarksForActiveVideo();
        };
        videoEl.addEventListener('timeupdate', onSeekEnd);
      }
    } else {
      el('recorder-time-total').textContent = formatTime(videoEl.duration);
      renderBookmarksForActiveVideo();
    }
  });

  function updateTimelineProgress() {
    const cur = videoEl.currentTime || 0;
    const dur = getEffectiveDuration();
    el('recorder-time-current').textContent = formatTime(cur);
    if (dur > 0) {
      el('recorder-time-total').textContent = formatTime(dur);
      const pct = Math.max(0, Math.min(100, (cur / dur) * 100));
      el('recorder-timeline-fill').style.width = `${pct}%`;
      el('recorder-timeline-thumb').style.left = `${pct}%`;
    }
    if (abLoopStart !== null && abLoopEnd !== null && cur >= abLoopEnd) {
      videoEl.currentTime = abLoopStart;
    }
  }

  videoEl.addEventListener('timeupdate', updateTimelineProgress);
  videoEl.addEventListener('play', () => { el('recorder-play-btn').textContent = '⏸'; });
  videoEl.addEventListener('pause', () => { el('recorder-play-btn').textContent = '▶'; });

  // YouTube-style Seek Bar Drag & Hover
  const timelineContainer = el('recorder-timeline-container');
  let isDraggingTimeline = false;

  function seekFromPointerEvent(ev) {
    const dur = getEffectiveDuration();
    if (!dur || dur <= 0) return;
    const rect = timelineContainer.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
    videoEl.currentTime = ratio * dur;
    updateTimelineProgress();
  }

  timelineContainer.addEventListener('pointerdown', ev => {
    isDraggingTimeline = true;
    timelineContainer.setPointerCapture(ev.pointerId);
    seekFromPointerEvent(ev);
  });

  timelineContainer.addEventListener('pointermove', ev => {
    const dur = getEffectiveDuration();
    const tip = el('recorder-seek-hover-tip');
    if (dur > 0 && tip) {
      const rect = timelineContainer.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      tip.hidden = false;
      tip.style.left = `${ratio * 100}%`;
      tip.textContent = formatTime(ratio * dur);
    }
    if (isDraggingTimeline) {
      seekFromPointerEvent(ev);
    }
  });

  timelineContainer.addEventListener('pointerup', ev => {
    if (isDraggingTimeline) {
      isDraggingTimeline = false;
      try { timelineContainer.releasePointerCapture(ev.pointerId); } catch {}
    }
  });

  timelineContainer.addEventListener('pointerleave', () => {
    const tip = el('recorder-seek-hover-tip');
    if (tip) tip.hidden = true;
  });

  // Player Transport Controls
  function togglePlayPause() {
    if (!videoEl.src) return;
    if (videoEl.paused) videoEl.play().catch(() => {});
    else videoEl.pause();
  }

  function skipSeconds(delta) {
    if (!videoEl.src) return;
    const dur = getEffectiveDuration();
    const target = Math.max(0, videoEl.currentTime + delta);
    videoEl.currentTime = dur > 0 ? Math.min(dur, target) : target;
    updateTimelineProgress();
  }

  function stepFrame(dir) {
    if (!videoEl.src) return;
    videoEl.pause();
    skipSeconds(dir * (1 / 30));
  }

  videoEl.addEventListener('click', togglePlayPause);
  videoEl.addEventListener('dblclick', () => {
    const vp = el('recorder-video-viewport');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else vp?.requestFullscreen?.().catch(() => {});
  });

  el('recorder-play-btn').addEventListener('click', togglePlayPause);
  el('recorder-back-10').addEventListener('click', () => skipSeconds(-10));
  el('recorder-back-5').addEventListener('click', () => skipSeconds(-5));
  el('recorder-fwd-5').addEventListener('click', () => skipSeconds(5));
  el('recorder-fwd-10').addEventListener('click', () => skipSeconds(10));
  el('recorder-frame-prev').addEventListener('click', () => stepFrame(-1));
  el('recorder-frame-next').addEventListener('click', () => stepFrame(1));

  el('recorder-mute-btn').addEventListener('click', () => {
    videoEl.muted = !videoEl.muted;
    el('recorder-mute-btn').textContent = videoEl.muted ? '🔇' : '🔊';
  });

  el('recorder-player-volume').addEventListener('input', () => {
    const v = Number(el('recorder-player-volume').value || 90) / 100;
    videoEl.volume = Math.max(0, Math.min(1, v));
    videoEl.muted = v === 0;
    el('recorder-mute-btn').textContent = videoEl.muted ? '🔇' : '🔊';
  });

  el('recorder-speed-select').addEventListener('change', () => {
    videoEl.playbackRate = Number(el('recorder-speed-select').value || 1);
  });

  el('recorder-pip-btn').addEventListener('click', () => {
    if (!videoEl.src) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else videoEl.requestPictureInPicture?.().catch(() => {});
  });

  el('recorder-fullscreen-btn').addEventListener('click', () => {
    const vp = el('recorder-video-viewport');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else vp?.requestFullscreen?.().catch(() => {});
  });

  // A-B Loop
  function updateAbLoopUi() {
    const btn = el('recorder-ab-loop');
    const bar = el('recorder-timeline-ab');
    const dur = getEffectiveDuration();
    if (!btn || !bar) return;
    if (abLoopStart === null) {
      btn.textContent = '区間ループ';
      bar.hidden = true;
    } else if (abLoopEnd === null) {
      btn.textContent = `A:${formatTime(abLoopStart)} → Bを指定`;
      bar.hidden = true;
    } else {
      btn.textContent = `${formatTime(abLoopStart)}〜${formatTime(abLoopEnd)} 解除`;
      if (dur > 0) {
        const leftPct = Math.max(0, Math.min(100, (abLoopStart / dur) * 100));
        const widthPct = Math.max(0.5, Math.min(100 - leftPct, ((abLoopEnd - abLoopStart) / dur) * 100));
        bar.style.left = `${leftPct}%`;
        bar.style.width = `${widthPct}%`;
        bar.hidden = false;
      }
    }
  }

  el('recorder-ab-loop').addEventListener('click', () => {
    if (!videoEl.src) return;
    if (abLoopStart === null) {
      abLoopStart = videoEl.currentTime;
      abLoopEnd = null;
    } else if (abLoopEnd === null) {
      if (videoEl.currentTime > abLoopStart + 0.3) {
        abLoopEnd = videoEl.currentTime;
      } else {
        abLoopStart = null;
      }
    } else {
      abLoopStart = null;
      abLoopEnd = null;
    }
    updateAbLoopUi();
  });

  // Bookmarks
  async function addCurrentBookmark() {
    const rec = recordings.find(r => r.id === activeVideoId);
    if (!rec || !videoEl.src) return;
    const sec = Math.round(videoEl.currentTime * 10) / 10;
    const bms = Array.isArray(rec.bookmarks) ? [...rec.bookmarks] : [];
    bms.push({ sec, label: el('recorder-edit-memo')?.value?.trim() || '' });
    bms.sort((a, b) => a.sec - b.sec);
    rec.bookmarks = bms;
    await window.relicDesktop.recorderUpdateMeta({ id: rec.id, bookmarks: bms });
    renderBookmarksForActiveVideo();
    renderVideoList();
  }

  el('recorder-add-bookmark').addEventListener('click', addCurrentBookmark);

  el('recorder-bookmarks-bar').addEventListener('click', async ev => {
    const delBtn = ev.target.closest('[data-del-bookmark]');
    if (delBtn) {
      ev.stopPropagation();
      const idx = Number(delBtn.dataset.delBookmark);
      const rec = recordings.find(r => r.id === activeVideoId);
      if (!rec || !Array.isArray(rec.bookmarks)) return;
      rec.bookmarks.splice(idx, 1);
      await window.relicDesktop.recorderUpdateMeta({ id: rec.id, bookmarks: rec.bookmarks });
      renderBookmarksForActiveVideo();
      renderVideoList();
      return;
    }
    const chip = ev.target.closest('[data-jump-sec]');
    if (chip && videoEl.src) {
      videoEl.currentTime = Number(chip.dataset.jumpSec || 0);
      updateTimelineProgress();
    }
  });

  // Metadata Save
  el('recorder-save-meta').addEventListener('click', async () => {
    const rec = recordings.find(r => r.id === activeVideoId);
    if (!rec) return;
    try {
      const updated = await window.relicDesktop.recorderUpdateMeta({
        id: rec.id,
        bossName: el('recorder-edit-boss').value.trim() || '不明なボス',
        phase: el('recorder-edit-phase').value,
        outcome: el('recorder-edit-outcome').value,
        memo: el('recorder-edit-memo').value.trim()
      });
      const wasPaused = videoEl.paused;
      const curTime = videoEl.currentTime;
      await refreshRecorderLibrary();
      if (updated && updated.filePath) {
        videoEl.src = toFileUrl(updated.filePath);
        videoEl.currentTime = curTime;
        if (!wasPaused) videoEl.play().catch(() => {});
      }
      if (typeof notify === 'function') notify('録画データのボス名・フェーズ・メモを更新しました。');
    } catch (err) {
      if (typeof notify === 'function') notify(err.message || '更新に失敗しました。');
    }
  });

  // Library Sidebar Interactions
  el('recorder-boss-folders').addEventListener('click', ev => {
    const btn = ev.target.closest('[data-boss-folder]');
    if (!btn) return;
    selectedBossFilter = btn.dataset.bossFolder || '';
    renderBossFolders();
    renderVideoList();
  });

  el('recorder-phase-tabs').addEventListener('click', ev => {
    const btn = ev.target.closest('[data-phase-filter]');
    if (!btn) return;
    selectedPhaseFilter = btn.dataset.phaseFilter || '';
    for (const b of el('recorder-phase-tabs').querySelectorAll('.recorder-phase-tab')) {
      b.classList.toggle('is-active', b === btn);
    }
    renderVideoList();
  });

  el('recorder-search').addEventListener('input', renderVideoList);
  el('recorder-outcome-filter').addEventListener('change', renderVideoList);

  el('recorder-video-list').addEventListener('click', async ev => {
    const revealBtn = ev.target.closest('[data-reveal-video]');
    if (revealBtn) {
      ev.stopPropagation();
      const rec = recordings.find(r => r.id === revealBtn.dataset.revealVideo);
      if (rec?.filePath) window.relicDesktop.openPathInExplorer(rec.filePath);
      return;
    }
    const delBtn = ev.target.closest('[data-delete-video]');
    if (delBtn) {
      ev.stopPropagation();
      const rec = recordings.find(r => r.id === delBtn.dataset.deleteVideo);
      if (!rec) return;
      if (!window.confirm(`録画「${rec.phase} - ${rec.bossName}」を削除しますか？`)) return;
      if (activeVideoId === rec.id) {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
        activeVideoId = null;
        el('recorder-video-placeholder').hidden = false;
        el('recorder-meta-panel').hidden = true;
      }
      await window.relicDesktop.recorderDeleteVideo(rec.id);
      await refreshRecorderLibrary();
      return;
    }
    const card = ev.target.closest('[data-play-video]');
    if (card) {
      loadVideoIntoPlayer(card.dataset.playVideo);
    }
  });

  // Settings & Folder Controls
  el('recorder-window-refresh').addEventListener('click', refreshRecorderWindows);
  el('recorder-audio-toggle').addEventListener('change', async () => {
    const audioEnabled = el('recorder-audio-toggle').checked;
    recorderSettings = await window.relicDesktop.recorderSaveSettings({ audioEnabled });
  });
  el('recorder-choose-folder').addEventListener('click', async () => {
    const next = await window.relicDesktop.recorderChooseFolder();
    if (next) {
      recorderSettings = next;
      await refreshRecorderLibrary();
    }
  });
  el('recorder-open-folder').addEventListener('click', () => {
    if (recorderSettings.outputDir) {
      window.relicDesktop.openPathInExplorer(recorderSettings.outputDir);
    }
  });

  // Keyboard Shortcuts on Recorder Pane
  document.addEventListener('keydown', ev => {
    if (recorderPane.hidden) return;
    if (ev.target.closest('input, select, textarea, [contenteditable]')) return;
    if (ev.key === ' ' || ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      togglePlayPause();
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      skipSeconds(-5);
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      skipSeconds(5);
    } else if (ev.key.toLowerCase() === 'j') {
      ev.preventDefault();
      skipSeconds(-10);
    } else if (ev.key.toLowerCase() === 'l') {
      ev.preventDefault();
      skipSeconds(10);
    } else if (ev.key === ',') {
      ev.preventDefault();
      stepFrame(-1);
    } else if (ev.key === '.') {
      ev.preventDefault();
      stepFrame(1);
    } else if (ev.key.toLowerCase() === 'm') {
      ev.preventDefault();
      el('recorder-mute-btn').click();
    } else if (ev.key.toLowerCase() === 'f') {
      ev.preventDefault();
      el('recorder-fullscreen-btn').click();
    } else if (ev.key.toLowerCase() === 'b') {
      ev.preventDefault();
      addCurrentBookmark();
    }
  });

  // 3. Auto-Monitoring & Recording Engine
  function updateRecorderStatusUi() {
    const banner = el('recorder-status-banner');
    const statusText = el('recorder-status-text');
    const monitorBtn = el('recorder-monitor-toggle');
    const manualBtn = el('recorder-manual-btn');
    const liveOverride = el('recorder-live-override');
    const tabBadge = el('recorder-tab-badge');

    banner.classList.toggle('is-monitoring', isMonitoring && !isRecordingBattle);
    banner.classList.toggle('is-recording', isRecordingBattle);
    monitorBtn.classList.toggle('is-active', isMonitoring);
    manualBtn.classList.toggle('is-recording', isRecordingBattle);
    liveOverride.hidden = !isRecordingBattle;

    if (isRecordingBattle) {
      const bName = el('recorder-live-boss').value || bestDetectedBoss?.bossName || 'ボス戦';
      const phase = el('recorder-live-phase').value || '夜の王';
      statusText.textContent = `ボス戦を録画中：【${phase}】${bName}（戦闘終了時に自動でフォルダへ保存します）`;
      monitorBtn.textContent = isMonitoring ? '自動監視を停止' : '自動監視を開始';
      manualBtn.textContent = '今の録画を保存して終了';
      if (tabBadge) {
        tabBadge.hidden = false;
        tabBadge.className = 'recorder-tab-badge is-recording';
        tabBadge.textContent = `録画中: ${bName}`;
      }
    } else if (isMonitoring) {
      statusText.textContent = `自動監視中（1日目の夜・2日目の夜・夜の王の開幕を待機しています ／ PC操作ロックなし）`;
      monitorBtn.textContent = '自動監視を停止';
      manualBtn.textContent = '今すぐ手動録画';
      if (tabBadge) {
        tabBadge.hidden = false;
        tabBadge.className = 'recorder-tab-badge';
        tabBadge.textContent = '監視中';
      }
    } else {
      statusText.textContent = '自動監視：オフ（開始ボタンを押すと裏でボス戦を自動検知して録画します）';
      monitorBtn.textContent = '自動監視・自動録画を開始';
      manualBtn.textContent = '今すぐ手動録画';
      if (tabBadge) tabBadge.hidden = true;
    }
  }

  async function ensureCaptureStream() {
    if (captureStream && captureStream.active) return captureStream;
    let windowId = el('recorder-window')?.value;
    if (!windowId) {
      await refreshRecorderWindows();
      windowId = el('recorder-window')?.value;
    }
    if (!windowId) throw new Error('対象のゲームウィンドウが見つかりません。ナイトレインを起動してから「再取得」を押してください。');

    const wantAudio = Boolean(el('recorder-audio-toggle')?.checked);
    const videoConstraint = {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: windowId,
        maxWidth: 1920,
        maxHeight: 1080,
        maxFrameRate: 30
      }
    };

    try {
      if (wantAudio) {
        captureStream = await navigator.mediaDevices.getUserMedia({
          audio: { mandatory: { chromeMediaSource: 'desktop' } },
          video: videoConstraint
        });
      } else {
        captureStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraint
        });
      }
    } catch {
      captureStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: videoConstraint
      });
    }

    if (!hiddenCaptureVideo) {
      hiddenCaptureVideo = document.createElement('video');
      hiddenCaptureVideo.muted = true;
      hiddenCaptureVideo.playsInline = true;
    }
    hiddenCaptureVideo.srcObject = captureStream;
    await hiddenCaptureVideo.play().catch(() => {});

    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement('canvas');
    }
    return captureStream;
  }

  function releaseCaptureStream() {
    if (activeMediaRecorder && activeMediaRecorder.state !== 'inactive') {
      try { activeMediaRecorder.stop(); } catch {}
    }
    activeMediaRecorder = null;
    if (captureStream) {
      for (const track of captureStream.getTracks()) {
        try { track.stop(); } catch {}
      }
      captureStream = null;
    }
    if (hiddenCaptureVideo) {
      hiddenCaptureVideo.srcObject = null;
    }
  }

  function pickSupportedMimeType() {
    for (const mime of ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) return mime;
    }
    return '';
  }

  function startFreshSegmentRecorder() {
    if (!captureStream || !captureStream.active) return;
    if (activeMediaRecorder && activeMediaRecorder.state !== 'inactive') {
      try { activeMediaRecorder.stop(); } catch {}
    }
    activeChunks = [];
    segmentStartMs = Date.now();
    const mimeType = pickSupportedMimeType();
    const options = { videoBitsPerSecond: 8_000_000 };
    if (mimeType) options.mimeType = mimeType;

    const rec = new MediaRecorder(captureStream, options);
    const localChunks = [];
    rec.ondataavailable = ev => {
      if (ev.data && ev.data.size > 0) {
        localChunks.push(ev.data);
      }
    };
    activeMediaRecorder = rec;
    activeChunks = localChunks;
    rec.start(1000);
  }

  function enterBattleRecordingState(initialBossName, initialPhase, manual = false) {
    if (isRecordingBattle) return;
    isRecordingBattle = true;
    isManualRecording = manual;
    battleStartMs = segmentStartMs || Date.now();
    consecutiveNoBossBarMisses = 0;
    detectedOutcome = null;

    if (!activeMediaRecorder || activeMediaRecorder.state === 'inactive') {
      startFreshSegmentRecorder();
      battleStartMs = Date.now();
    }

    el('recorder-live-phase').value = initialPhase || currentExpeditionDay || '夜の王';
    el('recorder-live-boss').value = initialBossName || '';

    clearInterval(liveTimerIntervalId);
    liveTimerIntervalId = setInterval(() => {
      const elapsedSec = Math.max(0, Math.floor((Date.now() - battleStartMs) / 1000));
      if (el('recorder-live-timer')) el('recorder-live-timer').textContent = formatTime(elapsedSec);
    }, 500);

    updateRecorderStatusUi();
  }

  async function finalizeAndSaveBattleRecording(outcomeOverride = null) {
    if (!isRecordingBattle) return;
    isRecordingBattle = false;
    isManualRecording = false;
    clearInterval(liveTimerIntervalId);

    const recorderToStop = activeMediaRecorder;
    const chunksToSave = activeChunks;
    const durationSec = Math.max(1, Math.round((Date.now() - (battleStartMs || Date.now())) / 1000));
    const bossName = el('recorder-live-boss').value.trim() || bestDetectedBoss?.bossName || '不明なボス';
    const phase = el('recorder-live-phase').value || bestDetectedBoss?.defaultPhase || currentExpeditionDay || '夜の王';
    const outcome = outcomeOverride || detectedOutcome || '勝利';

    activeMediaRecorder = null;
    activeChunks = [];
    bestDetectedBoss = null;
    consecutiveBossBarHits = 0;
    consecutiveNoBossBarMisses = 0;
    updateRecorderStatusUi();

    if (recorderToStop && recorderToStop.state !== 'inactive') {
      await new Promise(resolve => {
        recorderToStop.addEventListener('stop', resolve, { once: true });
        try { recorderToStop.stop(); } catch { resolve(); }
      });
    }

    if (isMonitoring && captureStream?.active) {
      startFreshSegmentRecorder();
    } else if (!isMonitoring) {
      releaseCaptureStream();
    }

    if (!chunksToSave.length) return;
    try {
      const blob = new Blob(chunksToSave, { type: 'video/webm' });
      const arrayBuf = await blob.arrayBuffer();
      const saved = await window.relicDesktop.recorderSaveVideo({
        bossName,
        phase,
        outcome,
        durationSec,
        bytes: new Uint8Array(arrayBuf)
      });

      // Advance expedition phase automatically after saving Day 1 or Day 2
      if (phase === '1日目の夜') currentExpeditionDay = '2日目の夜';
      else if (phase === '2日目の夜') currentExpeditionDay = '夜の王';
      else if (phase === '夜の王') currentExpeditionDay = '1日目の夜';

      await refreshRecorderLibrary();
      if (saved?.id && !activeVideoId) {
        loadVideoIntoPlayer(saved.id);
      }
      if (typeof notify === 'function') {
        notify(`ボス戦録画を保存しました：【${saved.phase}】${saved.bossName}（${saved.outcome}）`);
      }
    } catch (err) {
      if (typeof notify === 'function') notify(err.message || '録画データの保存に失敗しました。');
    }
  }

  async function grabFramePngBytes() {
    if (!hiddenCaptureVideo || hiddenCaptureVideo.readyState < 2) return null;
    const vw = hiddenCaptureVideo.videoWidth || 1920;
    const vh = hiddenCaptureVideo.videoHeight || 1080;
    offscreenCanvas.width = vw;
    offscreenCanvas.height = vh;
    const ctx = offscreenCanvas.getContext('2d');
    ctx.drawImage(hiddenCaptureVideo, 0, 0, vw, vh);
    const blob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;
    return new Uint8Array(await blob.arrayBuffer());
  }

  async function monitorTick() {
    if ((!isMonitoring && !isRecordingBattle) || analyzingFrame) return;
    analyzingFrame = true;
    try {
      // Rotate idle pre-buffer every 8 seconds so we always have 0-8s of pre-roll without memory growth
      if (!isRecordingBattle && activeMediaRecorder && (Date.now() - segmentStartMs) > 8000) {
        startFreshSegmentRecorder();
      }

      const pngBytes = await grabFramePngBytes();
      if (!pngBytes) return;

      const analysis = await window.relicDesktop.recorderAnalyzeFrame(pngBytes);
      if (!analysis) return;

      if (analysis.detectedDayBanner) {
        currentExpeditionDay = analysis.detectedDayBanner;
        nightBannerSeenAtMs = Date.now();
      }

      if (analysis.matchedBoss) {
        if (!bestDetectedBoss || analysis.matchedBoss.confidence >= bestDetectedBoss.confidence) {
          bestDetectedBoss = analysis.matchedBoss;
          if (isRecordingBattle) {
            const curInput = el('recorder-live-boss').value.trim();
            if (!curInput || curInput === '不明なボス' || curInput === 'ボス戦') {
              el('recorder-live-boss').value = bestDetectedBoss.bossName;
            }
            if (bestDetectedBoss.defaultPhase) {
              el('recorder-live-phase').value = bestDetectedBoss.defaultPhase;
            }
            updateRecorderStatusUi();
          }
        }
      }

      const nightBannerRecent = (Date.now() - nightBannerSeenAtMs) < 6 * 60 * 1000;
      const isTargetNightFight = Boolean(analysis.matchedBoss?.isKnownCatalog || nightBannerRecent);

      if (!isRecordingBattle) {
        if (analysis.hasBossHpBar && isTargetNightFight) {
          consecutiveBossBarHits++;
          if (consecutiveBossBarHits >= 2) {
            const initialBoss = bestDetectedBoss?.bossName || analysis.bossRawText || '不明なボス';
            const initialPhase = bestDetectedBoss?.defaultPhase || currentExpeditionDay || '夜の王';
            enterBattleRecordingState(initialBoss, initialPhase, false);
          }
        } else {
          consecutiveBossBarHits = 0;
        }
      } else if (!isManualRecording) {
        const fightDurationMs = Date.now() - battleStartMs;
        if (analysis.battleOutcome && fightDurationMs >= 8000) {
          detectedOutcome = analysis.battleOutcome;
          setTimeout(() => {
            if (isRecordingBattle) finalizeAndSaveBattleRecording(detectedOutcome);
          }, 2500);
          return;
        }
        if (!analysis.hasBossHpBar) {
          consecutiveNoBossBarMisses++;
          // If HP bar is gone for ~7.5 seconds after at least 15 seconds of battle, finalize recording
          if (consecutiveNoBossBarMisses >= 5 && fightDurationMs >= 15000) {
            await finalizeAndSaveBattleRecording(detectedOutcome || '勝利');
          }
        } else {
          consecutiveNoBossBarMisses = 0;
        }
      }
    } catch {} finally {
      analyzingFrame = false;
    }
  }

  el('recorder-monitor-toggle').addEventListener('click', async () => {
    if (isMonitoring) {
      isMonitoring = false;
      clearInterval(monitorIntervalId);
      monitorIntervalId = null;
      if (!isRecordingBattle) {
        releaseCaptureStream();
      }
      updateRecorderStatusUi();
      return;
    }
    try {
      await ensureCaptureStream();
      isMonitoring = true;
      startFreshSegmentRecorder();
      clearInterval(monitorIntervalId);
      monitorIntervalId = setInterval(monitorTick, 1500);
      updateRecorderStatusUi();
      if (typeof notify === 'function') {
        notify('ボス戦の自動監視を開始しました（1日目の夜・2日目の夜・夜の王を自動検知して保存します）。');
      }
    } catch (err) {
      if (typeof notify === 'function') notify(err.message || '自動監視の開始に失敗しました。');
    }
  });

  el('recorder-manual-btn').addEventListener('click', async () => {
    if (isRecordingBattle) {
      await finalizeAndSaveBattleRecording('勝利');
      return;
    }
    try {
      await ensureCaptureStream();
      startFreshSegmentRecorder();
      enterBattleRecordingState(bestDetectedBoss?.bossName || '', currentExpeditionDay || '夜の王', true);
      if (!monitorIntervalId) {
        monitorIntervalId = setInterval(monitorTick, 1500);
      }
    } catch (err) {
      if (typeof notify === 'function') notify(err.message || '手動録画の開始に失敗しました。');
    }
  });

  // Initial load
  refreshRecorderLibrary();
  refreshRecorderWindows();
})();
