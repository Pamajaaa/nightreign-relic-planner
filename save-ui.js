'use strict';
if (window.relicDesktop) (() => {
  const panel = document.createElement('section'); panel.className = 'target-panel';
  panel.innerHTML = '<div><p class="eyebrow">SAVE BACKUP</p><h2>セーブのバックアップと復元</h2><p>復元元とセーブ先を指定し、復元前のデータを退避してから置き換えます。</p></div><button id="save-manager-open" type="button">バックアップ設定</button>';
  document.querySelector('.workspace').before(panel);
  const dialog = document.createElement('dialog'); dialog.id = 'save-manager-dialog';
  dialog.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">SAVE BACKUP</p><h2>セーブのバックアップと復元</h2></div><button class="icon-button" id="save-manager-close" type="button" aria-label="バックアップ設定を閉じる">×</button></div>
    <div class="save-path-row"><label>バックアップ元<input id="save-source" type="text" spellcheck="false" placeholder="backup1などのフォルダー"></label><button data-save-folder="source" type="button">選択</button></div>
    <div class="save-path-row"><label>ゲームのセーブ先<input id="save-destination" type="text" spellcheck="false" placeholder="NR0000.sl2のあるフォルダー"></label><button data-save-folder="destination" type="button">選択</button></div>
    <fieldset class="save-files"><legend>復元するファイル</legend><label><input type="checkbox" value="NR0000.sl2" checked disabled>NR0000.sl2（必須）</label><label><input type="checkbox" value="NR0000.sl2.bak" checked>NR0000.sl2.bak</label><label><input type="checkbox" value="steam_autocloud.vdf" checked>steam_autocloud.vdf</label></fieldset>
    <p class="target-help">元のバックアップには書き込みません。復元前のセーブと復元元のコピーをアプリの履歴フォルダーに保管し、コピー後に内容が一致するか確認します。失敗した場合は変更済みのファイルを元に戻します。</p>
    <div class="target-actions"><button id="save-config-store" type="button">設定を保存</button><button id="save-inspect" type="button">ファイルを確認</button><button id="save-self-test" type="button">テスト用データで試す</button></div>
    <div id="save-inspection"></div><label class="save-ack"><input id="save-ack" type="checkbox">ゲームを終了し、表示された復元元・セーブ先を確認した</label>
    <p class="target-help">この単体復元ボタンは、ゲームを終了して使ってください。タイトル画面での復元は、リセマラ操作と連携してから実機で確認します。</p>
    <button id="save-restore" class="primary" type="button" disabled>バックアップを復元</button><p id="save-manager-status" role="status" aria-live="polite"></p>`;
  document.body.append(dialog);
  const procedure = document.createElement('section'); procedure.className = 'target-panel';
  procedure.innerHTML = '<div><p class="eyebrow">REROLL PROCEDURE</p><h2>リセマラの手順</h2><p>購入先を選び、リセット・復元・購入までの操作順を事前確認します。</p></div><button id="reroll-plan-open" type="button">手順を確認</button>';
  document.querySelector('.workspace').before(procedure);
  const planDialog = document.createElement('section'); planDialog.id = 'reroll-plan-dialog';
  planDialog.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">REROLL PROCEDURE</p><h2>リセマラの手順と連続実行</h2></div><button class="icon-button" id="reroll-plan-close" type="button" aria-label="手順を閉じる">×</button></div><label class="save-shop-label">購入する遺物<select id="reroll-shop"><option value="0">通常遺物</option><option value="1">通常遺物（1.03前）</option><option value="2">深層遺物</option><option value="3">深層遺物（1.03前）</option><option value="4">コレクター：通常遺物</option><option value="5">コレクター：通常遺物（1.03前）</option><option value="6">コレクター：深層遺物</option><option value="7">コレクター：深層遺物（1.03前）</option></select></label><div id="reroll-plan-content"></div><p class="target-help">シミュレーションはゲームに入力せず、ダミーファイルで手順を検証します。1周の試運転は実際のセーブ復元とマーク・王の証の消費を伴います。</p><button id="reroll-simulate" type="button">ゲーム操作なしで手順をテスト</button><details class="reroll-live-settings"><summary>実際のゲームで実行する</summary><p class="target-help">開始から停止までゲーム画面を自動録画し、実行記録フォルダーに保存します（無音）。ゲームを遺物儀式の一覧画面にしてください。既存マクロに合わせた操作を行い、待機設定に従ってタイトルへ戻ってから復元します。購入前の所持数確認は行いません。購入後にフィルターを設定し、お気に入り未登録の候補だけを確認します。全候補が不一致の場合だけ復元・購入を繰り返し、一致候補や読み取り不明で停止します。</p><div id="reroll-live-summary"></div><label class="save-shop-label">対象ウィンドウ<select id="reroll-window"></select></label><button id="reroll-refresh" type="button">ウィンドウを再取得</button><button id="reroll-start-live" class="primary" type="button" disabled>1周の試運転を開始</button><button id="reroll-speed-test" type="button" disabled>2周の試運転</button><p class="target-help">試運転は連続実行と同じ速度で各周3回購入します。2周の試運転は最大2周で停止します。一致した場合は当たりを別保存します。読み取り不明・エラーの場合は途中でも停止します。通常の待機設定には保存しません。入力が詰まったらF8で止め、録画とログで確認してください。</p><button id="reroll-start-continuous" class="primary" type="button" disabled>連続実行</button></details><button id="reroll-stop" type="button" disabled>停止（F8）</button><p id="reroll-plan-status" role="status"></p><pre id="reroll-run-log" aria-live="polite"></pre>`;
  procedure.append(planDialog);
  procedure.classList.add("reroll-dashboard");
  planDialog.querySelector('#reroll-plan-content').insertAdjacentHTML('beforebegin','<details class="reroll-timing"><summary>待ち時間の設定</summary><p class="target-help">遺物確認以外は画像認識を使わず、マクロと固定待機で進みます。タイトルへの到着は判定せず、設定時間が経過すると復元します。</p><label>タイトルへ戻ってから復元まで（秒）<input id="reroll-title-wait" type="number" min="6" max="180" step="0.5" value="8"></label><label>復元完了後の追加待機（秒）<input id="reroll-restore-wait" type="number" min="0" max="60" value="0"></label><label>再開操作後の追加待機（秒）<input id="reroll-resume-extra" type="number" min="0" max="120" value="1"></label><label>再開マクロ末尾の待機（秒）<input id="reroll-resume-final" type="number" min="0" max="30" step="0.1" value="1"></label><label>購入時の画面切り替え待機（ms）<input id="reroll-purchase-wait" type="number" min="180" max="1000" step="10" value="200"></label><p class="target-help">購入の待機は200msが標準です。</p><div hidden><input id="reroll-adaptive-wait" type="checkbox"><input id="reroll-macro-navigation" type="checkbox" checked><input id="reroll-auto-wait" type="checkbox"><input id="reroll-title-timeout" value="60"><input id="reroll-resume-timeout" value="90"></div><button id="reroll-timing-save" type="button">待ち時間を保存</button></details>');
  const el = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  // Reuse existing controls and handlers in a single persistent dashboard.
  procedure.querySelector(':scope > div').remove();
  el('reroll-plan-open').hidden=true;
  planDialog.querySelector('.dialog-head').remove();
  const controls=document.createElement('div');controls.className='reroll-controls';planDialog.append(controls);
  const setup=document.createElement('div');setup.className='reroll-setup';controls.append(setup);
  const setupHead=document.createElement('div');setupHead.className='dialog-head automation-section-head';
  setupHead.innerHTML='<div><p class="eyebrow">AUTO REROLL</p><h2>自動リセマラ</h2></div>';
  setup.append(setupHead);
  setup.append(el('reroll-live-summary'));
  const setupRowsContainer=document.createElement('div');setupRowsContainer.className='reroll-setup-rows';setup.append(setupRowsContainer);
  const setupRowPurchase=document.createElement('div');setupRowPurchase.className='reroll-setup-row reroll-setup-row-purchase';
  const setupRowBackup=document.createElement('div');setupRowBackup.className='reroll-setup-row reroll-setup-row-backup';
  const setupRowSound=document.createElement('div');setupRowSound.className='reroll-setup-row reroll-setup-row-sound';
  setupRowsContainer.append(setupRowPurchase,setupRowBackup,setupRowSound);

  const shopLabel=el('reroll-shop').closest('label');shopLabel.firstChild.textContent='購入する遺物（自動選択）';
  shopLabel.hidden=true;
  shopLabel.style.display='none';
  setupRowPurchase.append(shopLabel);
  setupRowPurchase.insertAdjacentHTML('beforeend',`
    <label class="save-shop-label">購入場所<select id="reroll-shop-source" style="width:auto;min-width:10.5rem;" title="バザー（マーク消費）とコレクターの看板（王の証消費・大確定）を切り替えます">
      <option value="bazaar">バザー（マーク）</option>
      <option value="collector">コレクター（王の証・大確定）</option>
    </select></label>
    <label class="save-shop-label"><span id="reroll-budget-label">使用ルーン（万）</span><input id="reroll-rune-budget" type="number" min="0" step="0.1" placeholder="例: 54" style="width:6rem" title="使用するマーク（万単位）または王の証（個数）を入力すると、1周で購入できる回数を自動計算します（1回あたり10個購入）"></label>
    <label class="save-shop-label">購入回数（1周）<input id="reroll-purchase-count" type="number" min="1" max="1000" step="1" value="30" style="width:5.4rem"></label>
  `);
  const windowOptions=document.createElement('div');windowOptions.className='reroll-window-options';windowOptions.innerHTML='<p id="reroll-window-status" role="status" aria-live="polite">ゲームを検出中…</p>';setupRowPurchase.append(windowOptions);
  const windowRow=document.createElement('div');windowRow.className='reroll-window-row';windowOptions.append(windowRow);
  windowRow.append(el('reroll-window').closest('label'),el('reroll-refresh'));

  const gearBtn = el('save-manager-open');
  gearBtn.textContent = '⚙バックアップ設定';
  gearBtn.title = '現在のセーブでバックアップを更新したり、1〜3個前の世代へ戻したり、保存先を確認・変更します';
  gearBtn.setAttribute('aria-label', 'バックアップ設定');
  setupRowBackup.append(gearBtn);

  const quickRestore=document.createElement('button');
  quickRestore.id='reroll-quick-restore';
  quickRestore.type='button';
  quickRestore.textContent='ガチャ前に復元';
  quickRestore.title='バックアップデータを現在のセーブに復元し、ガチャを回す前の状態に戻します';
  setupRowBackup.append(quickRestore);
  if (typeof window.relicDesktop.openBackgroundRerollRoom === 'function') {
    const bgRoomBtn = document.createElement('button');
    bgRoomBtn.id = 'reroll-open-bg-room';
    bgRoomBtn.type = 'button';
    bgRoomBtn.textContent = '🖥️ 裏リセマラ部屋を開く';
    bgRoomBtn.title = '別ローカルアカウント（RerollUser）の裏セッション（リモートデスクトップ）を開きます。裏セッション内でナイトレインとこのアプリを動かせば、メイン画面で自由にマウス・キーボードを使いながら裏でリセマラし続けられます。';
    bgRoomBtn.onclick = async () => {
      try {
        el('reroll-plan-status').textContent = '裏リセマラ部屋（127.0.0.2 / RerollUser）を起動しています…（初回のみ管理者許可「はい」を押してください）';
        await window.relicDesktop.openBackgroundRerollRoom();
      } catch (err) {
        el('reroll-plan-status').textContent = '起動エラー：' + err.message;
      }
    };
    setupRowBackup.append(bgRoomBtn);

    if (typeof window.relicDesktop.stopBackgroundRerollRoom === 'function') {
      const stopBgBtn = document.createElement('button');
      stopBgBtn.id = 'reroll-stop-bg-room';
      stopBgBtn.type = 'button';
      stopBgBtn.className = 'subtle';
      stopBgBtn.textContent = '🛑 裏部屋を完全終了（表で遊ぶ）';
      stopBgBtn.title = '裏リセマラ部屋（RerollUser）のナイトレイン・Steam・セッションを完全に終了し、表で安全にゲームを遊べる状態にします（セーブデータ競合・フリーズ防止）。';
      stopBgBtn.onclick = async () => {
        try {
          el('reroll-plan-status').textContent = '裏リセマラ部屋のゲームとセッションを完全終了しています…';
          await window.relicDesktop.stopBackgroundRerollRoom({ logoff: true });
          el('reroll-plan-status').textContent = '裏リセマラ部屋を完全に終了しました！このまま表で安全にナイトレインをプレイできます。';
        } catch (err) {
          el('reroll-plan-status').textContent = '終了エラー：' + err.message;
        }
      };
      setupRowBackup.append(stopBgBtn);
    }

    const ecoBlackBtn = document.createElement('button');
    ecoBlackBtn.id = 'reroll-eco-blackout';
    ecoBlackBtn.type = 'button';
    ecoBlackBtn.className = 'subtle';
    ecoBlackBtn.textContent = '🌙 画面を暗くする（省電力）';
    ecoBlackBtn.title = 'モニターの物理電源を切らずに画面全体を真っ黒にします（DisplayPort切断による復帰不能を防ぎます。マウス移動やキー操作ですぐ戻ります）';
    ecoBlackBtn.onclick = () => {
      const topBtn = document.getElementById('eco-blackout-btn');
      if (topBtn) topBtn.click();
    };
    setupRowBackup.append(ecoBlackBtn);
  }

  setupRowSound.insertAdjacentHTML('beforeend',`
    <label class="save-shop-label reroll-sound-row-label">通知音<span class="reroll-sound-controls"><select id="reroll-notify-sound" style="width:auto;min-width:11.5rem;">
      <option value="chime-short">ピロン♪（極短・2音）</option>
      <option value="ping-single">ポーン♪（極短・単音）</option>
      <option value="crystal">キラッ♪（高音ベル）</option>
      <option value="win-ding">Windows チーン（短）</option>
      <option value="win-notify">Windows ポロン（標準）</option>
      <option value="fanfare">タラララン♪（華やか）</option>
      <option value="mute">ミュート（音なし）</option>
    </select><button id="reroll-notify-sound-test" type="button" title="選択中の通知音を試聴" aria-label="選択中の通知音を試聴" style="padding:0 12px;min-width:40px;">🔊</button><span class="reroll-volume-wrap" title="通知音の音量（0%〜100%）"><span class="reroll-volume-caption">音量</span><input id="reroll-notify-volume" type="range" min="0" max="100" step="5" value="80" aria-label="通知音の音量" style="width:6.8rem;min-height:auto;padding:0;accent-color:var(--gold);cursor:pointer;"><small id="reroll-notify-volume-label" style="min-width:2.8rem;text-align:right;font-size:0.86rem;color:var(--text);">80%</small></span></span></label>
  `);
  quickRestore.onclick=async()=>{
    if(cycleRunning)return;
    const conf = config || await window.relicDesktop.saveSettings();
    if(!conf?.source || !conf?.destination){
      el('reroll-plan-status').textContent='バックアップ元またはセーブ先が未設定です。「バックアップ設定」から設定してください。';
      return;
    }
    const ok = window.confirm(
      `バックアップデータを復元して、ガチャ前の状態に戻しますか？\n\n復元元：${conf.source}\nセーブ先：${conf.destination}\n\n※ゲーム側は必ず「タイトル画面」にしてから実行してください。\n（現在のセーブは自動で退避フォルダに保存されます）`
    );
    if(!ok)return;
    lock(true);el('reroll-plan-status').textContent='バックアップを復元中…';
    try{
      const result=await window.relicDesktop.restoreSave(conf, true);
      el('reroll-plan-status').textContent='復元が完了しました！ガチャ前のデータに戻りました。（退避先：'+result.archive+'）';
    }catch(err){
      el('reroll-plan-status').textContent='復元に失敗しました：'+err.message;
    }finally{
      lock(false);
    }
  };
  panel.remove();
  const advanced=document.createElement('details');advanced.className='reroll-advanced';controls.append(advanced);
  advanced.innerHTML='<summary>詳細設定・操作手順</summary>';
  advanced.append(planDialog.querySelector('.reroll-timing'),el('reroll-plan-content'));
  const diagnostic=document.createElement('details');diagnostic.innerHTML='<summary>開発用の動作確認</summary>';
  diagnostic.append(el('reroll-simulate'));advanced.append(diagnostic);
  const actions=document.createElement('div');actions.className='reroll-action-bar';controls.append(actions);
  actions.insertAdjacentHTML('beforeend','<div class="reroll-buttons reroll-buttons-top"></div><div class="reroll-buttons reroll-buttons-bottom"></div>');
  const buttonsTop=actions.querySelector('.reroll-buttons-top');
  const buttonsBottom=actions.querySelector('.reroll-buttons-bottom');
  const targetMatchLabel=document.createElement('label');targetMatchLabel.className='reroll-target-matches-label';targetMatchLabel.innerHTML='止める当たり数<input id="reroll-target-matches" type="number" min="1" max="99" step="1" value="1">';
  const matchBadge=document.createElement('span');matchBadge.id='reroll-match-count';matchBadge.className='reroll-match-badge';matchBadge.setAttribute('aria-live','polite');matchBadge.textContent='当たり：0回';matchBadge.hidden=true;
  const historyGroup=document.createElement('div');historyGroup.className='reroll-action-history-group';
  const historyLabel=document.createElement('span');historyLabel.className='reroll-action-history-label';historyLabel.innerHTML='🏆 当たり履歴 <small id="reroll-inline-history-meta">（0件）</small>';
  const matchHistoryBtn=document.createElement('button');matchHistoryBtn.id='reroll-match-history-open';matchHistoryBtn.type='button';matchHistoryBtn.textContent='すべて見る';matchHistoryBtn.title='これまでに保存された当たり遺物（matched-backups）の一覧を確認します';
  historyGroup.append(historyLabel,matchHistoryBtn);
  buttonsTop.append(el('reroll-start-continuous'),el('reroll-start-live'),el('reroll-speed-test'),targetMatchLabel,el('reroll-stop'));
  buttonsBottom.append(historyGroup,matchBadge);
  el('reroll-start-live').textContent='1周の試運転';el('reroll-start-live').classList.remove('primary');
  const matchList=document.createElement('ul');matchList.id='reroll-match-list';matchList.className='reroll-match-list';matchList.hidden=true;
  const statusRow=document.createElement('div');statusRow.className='reroll-status-row';
  const planStatusEl=el('reroll-plan-status');
  const statusDismissBtn=document.createElement('button');statusDismissBtn.id='reroll-status-dismiss';statusDismissBtn.className='reroll-status-dismiss effect-remove';statusDismissBtn.type='button';statusDismissBtn.title='確認してメッセージを消す';statusDismissBtn.setAttribute('aria-label','確認してメッセージを消す');statusDismissBtn.textContent='×';
  statusDismissBtn.onclick=()=>{if(planStatusEl)planStatusEl.textContent='';statusRow.removeAttribute('data-alert-level');};
  if(planStatusEl)statusRow.append(planStatusEl,statusDismissBtn);
  actions.append(statusRow,matchList);
  const statusObserver=new MutationObserver(()=>{
    const txt=(planStatusEl?.textContent||'').trim();
    if(txt.startsWith('🚨'))statusRow.setAttribute('data-alert-level','error');
    else if(txt.startsWith('⚠️'))statusRow.setAttribute('data-alert-level','warn');
    else statusRow.removeAttribute('data-alert-level');
  });
  if(planStatusEl)statusObserver.observe(planStatusEl,{childList:true,characterData:true,subtree:true});

  const inlineHistorySection = document.createElement('div');
  inlineHistorySection.id = 'reroll-inline-history';
  inlineHistorySection.className = 'reroll-inline-history';
  inlineHistorySection.hidden = true;
  inlineHistorySection.innerHTML = `
    <button type="button" id="reroll-inline-history-all" hidden>すべて見る</button>
    <div id="reroll-inline-history-list" class="reroll-inline-history-list"></div>
  `;

  const matchHistoryDialog = document.createElement('dialog');
  matchHistoryDialog.id = 'reroll-match-history-dialog';
  matchHistoryDialog.style.cssText = 'max-width:780px;width:92vw;max-height:84vh;padding:20px;border-radius:12px;background:#141b1d;color:#e8eceb;border:1px solid rgba(255,255,255,0.16);';
  matchHistoryDialog.innerHTML = `
    <div class="dialog-head" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
      <div style="min-width:0;">
        <p class="eyebrow" style="margin:0;font-size:0.75rem;opacity:0.7;">MATCHED RELICS HISTORY</p>
        <h2 style="margin:2px 0 0;font-size:1.25rem;">🏆 保存された当たり遺物一覧</h2>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
        <select id="match-history-color-filter" aria-label="色フィルター" style="width:auto;min-width:118px;flex-shrink:0;padding:6px 10px;border-radius:6px;background:#1d2628;color:#fff;border:1px solid rgba(255,255,255,0.2);">
          <option value="">すべての色</option>
          <option value="赤">赤のみ</option>
          <option value="青">青のみ</option>
          <option value="黄">黄のみ</option>
          <option value="緑">緑のみ</option>
        </select>
        <button id="match-history-refresh" type="button" style="padding:6px 14px;white-space:nowrap;flex-shrink:0;">再読み込み</button>
        <button class="icon-button" id="match-history-close" type="button" aria-label="閉じる" style="flex-shrink:0;">×</button>
      </div>
    </div>
    <p id="match-history-summary" style="margin:0 0 10px;font-size:0.9rem;opacity:0.85;"></p>
    <div id="match-history-list" style="display:flex;flex-direction:column;gap:10px;max-height:62vh;overflow-y:auto;padding-right:4px;"></div>
  `;
  document.body.append(matchHistoryDialog);

  let cachedMatchHistory = [];
  const colorBgMap = {
    '赤': 'rgba(220, 68, 68, 0.22)',
    '青': 'rgba(68, 138, 230, 0.22)',
    '黄': 'rgba(220, 185, 55, 0.22)',
    '緑': 'rgba(65, 190, 105, 0.22)'
  };
  const colorBorderMap = {
    '赤': '#e05a5a',
    '青': '#5aa2f0',
    '黄': '#e0c250',
    '緑': '#55c57a'
  };
  function buildMatchHistoryCardHtml(item, idx) {
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString('ja-JP') : '日時不明';
    const patStr = item.patterns?.length ? `[${item.patterns.join(' ／ ')}]` : '';
    const colorBadge = item.color ? `<span style="display:inline-block;padding:2px 9px;border-radius:999px;font-weight:700;font-size:0.86rem;background:${colorBgMap[item.color] || 'rgba(255,255,255,0.1)'};border:1px solid ${colorBorderMap[item.color] || '#888'};">${escape(item.color)}${item.size ? '・' + escape(item.size) : ''}</span>` : '';
    const effectsHtml = (item.effects || []).map(eff => `<div style="font-weight:600;color:#f3f6f6;">・${escape(eff)}</div>`).join('');
    const penaltiesHtml = (item.penalties || []).length
      ? `<div style="margin-top:4px;font-size:0.88rem;color:#f29b9b;">デメリット：${item.penalties.map(escape).join(' ／ ')}</div>`
      : '';
    return `
      <div style="padding:12px 14px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px;">
            ${colorBadge}
            ${patStr ? `<strong style="color:#d4af37;font-size:0.95rem;">${escape(patStr)}</strong>` : ''}
            ${item.relicName ? `<span style="opacity:0.8;font-size:0.9rem;">${escape(item.relicName)}</span>` : ''}
            <small style="opacity:0.7;margin-left:auto;font-size:0.84rem;">${escape(dateStr)}</small>
          </div>
          <div style="display:flex;flex-direction:column;gap:2px;font-size:0.96rem;">
            ${effectsHtml || '<div>（効果情報なし）</div>'}
          </div>
          ${penaltiesHtml}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;align-items:flex-end;">
          <div style="display:flex;gap:6px;align-items:center;">
            <button type="button" data-open-match-folder="${idx}" style="font-size:0.84rem;padding:5px 10px;white-space:nowrap;">📁 フォルダ</button>
            <button type="button" data-delete-match-folder="${idx}" title="この当たり遺物をファイルごと削除" aria-label="この当たり遺物をファイルごと削除" style="font-size:1rem;line-height:1;padding:5px 9px;color:#f29b9b;border-color:rgba(242,155,155,0.35);background:rgba(220,68,68,0.12);white-space:nowrap;">×</button>
          </div>
          <button type="button" data-restore-match-folder="${idx}" style="font-size:0.84rem;padding:5px 10px;width:100%;white-space:nowrap;">この当たりを復元</button>
        </div>
      </div>
    `;
  }
  function bindMatchHistoryActions(container, items) {
    if (!container) return;
    container.querySelectorAll('[data-open-match-folder]').forEach(btn => {
      btn.onclick = () => {
        const target = items[Number(btn.dataset.openMatchFolder)];
        if (target?.folder) window.relicDesktop.openPathInExplorer?.(target.folder);
      };
    });
    container.querySelectorAll('[data-delete-match-folder]').forEach(btn => {
      btn.onclick = async () => {
        const target = items[Number(btn.dataset.deleteMatchFolder)];
        if (!target?.folder) return;
        const ok = window.confirm(
          `この当たり遺物を保存ファイルごと削除しますか？\n\n` +
          `色・サイズ：${target.color || '?'}・${target.size || '?'}\n` +
          `効果：${(target.effects || []).join(' ／ ')}\n` +
          `フォルダ：${target.folderName || target.folder}\n\n` +
          `※削除すると元に戻せません。`
        );
        if (!ok) return;
        try {
          await window.relicDesktop.deleteMatchedHistory(target.folder);
          await loadAndOpenMatchHistory(false);
        } catch (err) {
          alert('削除に失敗しました：' + err.message);
        }
      };
    });
    container.querySelectorAll('[data-restore-match-folder]').forEach(btn => {
      btn.onclick = async () => {
        if (cycleRunning) {
          alert('リセマラ実行中は復元できません。先に停止してください。');
          return;
        }
        const target = items[Number(btn.dataset.restoreMatchFolder)];
        if (!target?.folder) return;
        const conf = config || await window.relicDesktop.saveSettings();
        if (!conf?.destination) {
          alert('セーブ先が設定されていません。「バックアップ設定」から設定してください。');
          return;
        }
        const ok = window.confirm(
          `この当たり遺物のセーブデータを現在のゲームへ復元しますか？\n\n` +
          `色・サイズ：${target.color || '?'}・${target.size || '?'}\n` +
          `効果：${(target.effects || []).join(' ／ ')}\n\n` +
          `※ゲーム側は必ず「タイトル画面」にしてから実行してください。`
        );
        if (!ok) return;
        try {
          const res = await window.relicDesktop.restoreSave({ ...conf, source: target.folder }, true);
          el('reroll-plan-status').textContent = `当たり遺物データを復元しました！（退避先：${res.archive}）`;
          if (matchHistoryDialog.open) matchHistoryDialog.close();
        } catch (err) {
          alert('復元に失敗しました：' + err.message);
        }
      };
    });
  }
  function renderMatchHistoryList() {
    const inlineListEl = document.getElementById('reroll-inline-history-list');
    const inlineMetaEl = document.getElementById('reroll-inline-history-meta');
    const latestFive = cachedMatchHistory.slice(0, 5);
    if (inlineMetaEl) {
      inlineMetaEl.textContent = `（${cachedMatchHistory.length}件）`;
    }
    if (inlineListEl) {
      if (!latestFive.length) {
        inlineListEl.innerHTML = '<p class="reroll-inline-history-empty">保存された当たり遺物はまだありません。</p>';
      } else {
        inlineListEl.innerHTML = latestFive.map((item, idx) => buildMatchHistoryCardHtml(item, idx)).join('');
        bindMatchHistoryActions(inlineListEl, latestFive);
      }
    }

    const colorFilter = document.getElementById('match-history-color-filter')?.value || '';
    const listEl = document.getElementById('match-history-list');
    const summaryEl = document.getElementById('match-history-summary');
    if (!listEl || !summaryEl) return;
    const counts = { '赤': 0, '青': 0, '黄': 0, '緑': 0 };
    for (const item of cachedMatchHistory) {
      if (item.color && counts[item.color] !== undefined) counts[item.color]++;
    }
    summaryEl.textContent = `全 ${cachedMatchHistory.length} 件（赤：${counts['赤']} ／ 青：${counts['青']} ／ 黄：${counts['黄']} ／ 緑：${counts['緑']}）`;
    const filtered = colorFilter ? cachedMatchHistory.filter(i => i.color === colorFilter) : cachedMatchHistory;
    if (!filtered.length) {
      listEl.innerHTML = `<p style="padding:16px;text-align:center;opacity:0.7;">${colorFilter ? `「${escape(colorFilter)}」色の当たり遺物はまだありません。` : '保存された当たり遺物はまだありません。'}</p>`;
      return;
    }
    listEl.innerHTML = filtered.map((item, idx) => buildMatchHistoryCardHtml(item, idx)).join('');
    bindMatchHistoryActions(listEl, filtered);
  }

  async function loadAndOpenMatchHistory(openDialog = true) {
    if (typeof window.relicDesktop.listMatchedHistory !== 'function') return;
    try {
      const res = await window.relicDesktop.listMatchedHistory();
      cachedMatchHistory = Array.isArray(res?.items) ? res.items : [];
      matchHistoryBtn.textContent = 'すべて見る';
      renderMatchHistoryList();
      if (openDialog) matchHistoryDialog.showModal();
    } catch (err) {
      el('reroll-plan-status').textContent = '履歴の読み込みエラー：' + err.message;
    }
  }

  matchHistoryBtn.onclick = () => loadAndOpenMatchHistory(true);
  historyLabel.style.cursor = 'pointer';
  historyLabel.onclick = () => loadAndOpenMatchHistory(true);
  inlineHistorySection.querySelector('#reroll-inline-history-all').onclick = event => {
    event.preventDefault();
    event.stopPropagation();
    loadAndOpenMatchHistory(true);
  };
  matchBadge.style.cursor = 'pointer';
  matchBadge.title = 'クリックで保存された当たり遺物履歴を開きます';
  matchBadge.onclick = () => loadAndOpenMatchHistory(true);
  document.getElementById('match-history-close').onclick = () => matchHistoryDialog.close();
  document.getElementById('match-history-refresh').onclick = () => loadAndOpenMatchHistory(false);
  document.getElementById('match-history-color-filter').onchange = renderMatchHistoryList;
  setTimeout(() => loadAndOpenMatchHistory(false), 400);
  const logs=document.createElement('details');logs.className='reroll-log-details';controls.append(logs);
  logs.innerHTML='<summary>実行ログ・録画の保存先</summary><div class="reroll-log-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;"><button id="reroll-share-debug" class="primary" type="button" title="直近の実行ログ・録画・未確認画像を自動でZIP化してアップロードし、共有URLをクリップボードにコピーします">🔗 デバッグ共有URLを発行（自動コピー）</button><button id="reroll-export-zip" type="button">📦 デバッグ用ZIPを保存</button><button id="reroll-open-logs" type="button">📁 ログ保存フォルダを開く</button></div>';
  logs.append(el('reroll-run-log'));
  logs.querySelector('#reroll-open-logs').onclick=async()=>{
    try{await window.relicDesktop.openSessionFolder();}catch(err){el('reroll-plan-status').textContent=err.message;}
  };
  logs.querySelector('#reroll-share-debug').onclick=async()=>{
    const btn=logs.querySelector('#reroll-share-debug');
    if(btn)btn.disabled=true;
    try{
      el('reroll-plan-status').textContent='デバッグ用データをZIP化して共有URLを発行中…（数秒〜十数秒かかります）';
      const res=await window.relicDesktop.shareDebugZip();
      const msg=`✅ デバッグ共有URLを発行し、クリップボードにコピーしました！（そのまま Discord やチャットへ Ctrl+V で貼り付けできます）：${res.url}`;
      el('reroll-plan-status').textContent=msg;
      const toast=document.getElementById('toast');
      if(toast){toast.textContent='デバッグ共有URLをコピーしました！そのまま貼り付け（Ctrl+V）できます。';toast.classList.add('visible');setTimeout(()=>toast.classList.remove('visible'),4500);}
    }catch(err){
      el('reroll-plan-status').textContent='共有URL発行エラー：'+err.message;
    }finally{
      if(btn)btn.disabled=false;
    }
  };
  logs.querySelector('#reroll-export-zip').onclick=async()=>{
    try{
      el('reroll-plan-status').textContent='直近の実行ログ・録画をZIPに圧縮中…';
      const res=await window.relicDesktop.exportSessionZip();
      if(!res.canceled)el('reroll-plan-status').textContent='デバッグ用ZIPを保存しました：'+res.path;
      else el('reroll-plan-status').textContent='';
    }catch(err){el('reroll-plan-status').textContent=err.message;}
  };
  controls.append(setup,actions,inlineHistorySection,advanced,logs);
  planDialog.replaceChildren(controls);
  el('save-self-test').hidden=true;
  let config = null, inspected = false, busy = false;
  let cycleRunning = false, matchCount = 0;
  function updateMatchBadge(count) {
    matchCount = count;
    matchBadge.textContent = `当たり：${count}回`;
    matchBadge.classList.toggle('is-hit', count > 0);
  }
  function clearMatchList() {
    matchList.replaceChildren();
    matchList.hidden = true;
  }
  function appendMatchSummary(line) {
    const li = document.createElement('li');
    const sep = line.indexOf('：');
    if (sep > 0) {
      const strong = document.createElement('strong');
      strong.textContent = line.slice(0, sep);
      const span = document.createElement('span');
      span.textContent = line.slice(sep + 1);
      li.append(strong, span);
    } else {
      li.textContent = line;
    }
    matchList.append(li);
    matchList.hidden = false;
  }
  const current = () => ({ source: el('save-source').value.trim(), destination: el('save-destination').value.trim(), files: ['NR0000.sl2','NR0000.sl2.bak','steam_autocloud.vdf'], shopIndex: config?.shopIndex ?? 3, timing:config?.timing, purchaseCount:config?.purchaseCount??30, targetMatchCount:config?.targetMatchCount??1, notifySound: el('reroll-notify-sound')?.value || config?.notifySound || 'chime-short', notifyVolume: Number(el('reroll-notify-volume')?.value ?? config?.notifyVolume ?? 80) });
  function update() { el('save-restore').disabled = busy || !inspected || !el('save-ack').checked; }
  function invalidate() { inspected = false; el('save-ack').checked = false; el('save-inspection').replaceChildren(); update(); }
  function lock(value) { busy = value; for (const button of dialog.querySelectorAll('button')) button.disabled = value; for (const input of dialog.querySelectorAll('input:not([value="NR0000.sl2"])')) input.disabled = value; update(); }
  async function renderBackupGenerations() {
    const container = el('save-auto-candidates');
    if (!container || typeof window.relicDesktop.listBackupGenerations !== 'function') return;
    try {
      const gens = await window.relicDesktop.listBackupGenerations();
      if (!Array.isArray(gens) || !gens.length) {
        container.innerHTML = '<p style="margin:8px 0;font-size:0.86rem;opacity:0.75;">保存済みの世代バックアップはまだありません。</p>';
        return;
      }
      container.innerHTML = `
        <div style="margin:10px 0;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);display:grid;gap:8px;">
          <strong style="font-size:0.88rem;color:#d4af37;">📦 スライド世代バックアップ一覧（最大3世代自動保管）</strong>
          ${gens.map(g => {
            const dt = g.savedAt ? new Date(g.savedAt).toLocaleString('ja-JP') : '日時不明';
            return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;background:${g.isCurrent ? 'rgba(212,175,55,0.14)' : 'rgba(0,0,0,0.25)'};font-size:0.85rem;">
              <div>
                <strong>${escape(g.label)}</strong> <code style="opacity:0.8;">(${escape(g.key)})</code><br>
                <small style="opacity:0.8;">セーブ日時：${escape(dt)}</small>
              </div>
              ${g.isCurrent
                ? '<span style="font-weight:700;color:#8be28b;padding:4px 8px;">✓ 使用中</span>'
                : `<button type="button" data-activate-gen="${escape(g.key)}" style="padding:4px 10px;font-size:0.8rem;">この世代に戻す</button>`}
            </div>`;
          }).join('')}
        </div>`;
      container.querySelectorAll('[data-activate-gen]').forEach(btn => {
        btn.onclick = async () => {
          const slotKey = btn.dataset.activateGen;
          if (!window.confirm(`${slotKey} のデータを現在の使用中バックアップ（backup_current）に切り替えますか？`)) return;
          lock(true);
          try {
            const res = await window.relicDesktop.activateBackupGeneration(slotKey);
            config = res.config;
            el('save-source').value = config.source;
            el('save-destination').value = config.destination;
            el('save-manager-status').textContent = `${slotKey} を現在のバックアップ（backup_current）に切り替えました。`;
            el('reroll-plan-status').textContent = `${slotKey} を現在のバックアップ（backup_current）に切り替えました。`;
            await renderBackupGenerations();
          } catch (err) {
            el('save-manager-status').textContent = err.message;
          } finally {
            lock(false);
          }
        };
      });
    } catch {}
  }

  el('save-manager-open').onclick = async () => {
    dialog.showModal();
    if (busy) return;
    el('save-manager-status').textContent = '';
    try {
      config = await window.relicDesktop.saveSettings();
      if (busy) return;
      el('save-source').value = config.source;
      el('save-destination').value = config.destination;
      for (const input of dialog.querySelectorAll('.save-files input')) input.checked = config.files.includes(input.value);
      invalidate();
      await renderBackupGenerations();
    } catch (error) { if (!busy) el('save-manager-status').textContent = error.message; }
  };
  el('save-manager-close').onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  for (const input of dialog.querySelectorAll('input:not(#save-ack)')) input.addEventListener('input', invalidate);
  el('save-ack').onchange = update;
  for (const button of dialog.querySelectorAll('[data-save-folder]')) button.onclick = async () => {
    const folder = await window.relicDesktop.chooseSaveFolder(button.dataset.saveFolder);
    if (folder) { el('save-' + button.dataset.saveFolder).value = folder; invalidate(); }
  };
  el('save-source').closest('.save-path-row').insertAdjacentHTML('beforebegin','<button id="save-auto-setup" class="primary" type="button">現在のセーブでバックアップを更新（スライド保存）</button><div id="save-auto-candidates"></div>');
  async function autoSetup(selection, forceUpdate = false){
    if (forceUpdate && !dialog.open) {
      const ok = window.confirm('現在のセーブデータでバックアップ（backup_current）を更新しますか？\n（これまでのバックアップは 1個前 → 2個前 → 3個前 へ自動でスライド保管されます）');
      if (!ok) return;
    }
    lock(true);invalidate();el('save-manager-status').textContent='セーブとバックアップを確認中…';
    if (!dialog.open) el('reroll-plan-status').textContent='現在のセーブデータでバックアップ（backup_current）を更新中…';
    try{
      let result = await window.relicDesktop.autoBackup(selection, { forceUpdate });
      config=result.config;el('save-source').value=config.source;el('save-destination').value=config.destination;
      for(const input of dialog.querySelectorAll('.save-files input'))input.checked=config.files.includes(input.value);
      const msg = result.alreadyIdentical
        ? '現在のセーブデータはすでに backup_current と同じ内容です（スライド不要）。'
        : result.updated
          ? `現在のセーブを backup_current に保存しました！（以前のデータを backup_1〜${Math.min(3, result.slidCount || 1)} へスライド保管しました）`
          : '固定バックアップ（backup_current）をセットアップしました！';
      el('save-manager-status').textContent = msg;
      el('reroll-plan-status').textContent = msg;
      await renderBackupGenerations();
      renderRerollTarget();
    }catch(error){
      el('save-manager-status').textContent=error.message;
      if (!dialog.open) el('reroll-plan-status').textContent='バックアップ作成エラー：'+error.message;
    }
    finally{lock(false);updateCycleButtons();}
  }
  el('save-auto-setup').onclick=()=>autoSetup(null, true);
  if (el('reroll-quick-auto-backup')) el('reroll-quick-auto-backup').onclick = () => autoSetup(null, true);
  const manualSettings=document.createElement('div');manualSettings.className='save-manual-settings';
  dialog.insertBefore(manualSettings,el('save-manager-status'));
  for(const row of [...dialog.querySelectorAll('.save-path-row')])manualSettings.append(row);
  manualSettings.append(el('save-config-store'));
  el('save-config-store').textContent='保存先を保存';
  dialog.querySelector('.save-files').hidden=true;
  for(const paragraph of dialog.querySelectorAll(':scope > .target-help'))paragraph.hidden=true;
  el('save-inspect').hidden=true;el('save-ack').closest('label').hidden=true;
  el('save-restore').hidden=true;el('save-inspection').hidden=true;

  el('save-config-store').onclick = async () => {
    try { config = await window.relicDesktop.storeSaveSettings(current()); el('save-manager-status').textContent = 'このPCの設定を保存しました。'; }
    catch (error) { el('save-manager-status').textContent = error.message; }
  };
  el('save-inspect').onclick = async () => {
    lock(true); invalidate(); el('save-manager-status').textContent = 'ファイルの内容を確認中…';
    try {
      const result = await window.relicDesktop.inspectSave(current());
      el('save-inspection').innerHTML = `<p class="target-help">復元元：${escape(result.source)}<br>セーブ先：${escape(result.destination)}</p><table><thead><tr><th>ファイル</th><th>バックアップ</th><th>現在のセーブ</th></tr></thead><tbody>` + result.files.map(file => `<tr><td>${escape(file.name)}</td><td>${(file.backup.size / 1024 / 1024).toFixed(2)} MB</td><td>${file.alreadyMatches ? '同じ内容' : file.current ? '異なる内容' : 'ファイルなし'}</td></tr>`).join('') + '</tbody></table>';
      inspected = true; el('save-manager-status').textContent = '確認できました。まだ復元は行っていません。';
    } catch (error) { el('save-manager-status').textContent = error.message; }
    finally { lock(false); }
  };
  el('save-self-test').onclick = async () => {
    lock(true); el('save-manager-status').textContent = 'テスト用データで復元処理を確認中…';
    try { const result = await window.relicDesktop.testSaveRestore(); el('save-manager-status').textContent = result.message; }
    catch (error) { el('save-manager-status').textContent = error.message; }
    finally { lock(false); }
  };
  el('save-restore').onclick = async () => {
    if (!inspected || !el('save-ack').checked || busy) return;
    lock(true); el('save-manager-status').textContent = '復元前の退避と復元処理を実行中…';
    try { const result = await window.relicDesktop.restoreSave(current(), true); el('save-manager-status').textContent = '復元と内容の確認が完了しました。退避先：' + result.archive; }
    catch (error) { el('save-manager-status').textContent = error.message; }
    finally { invalidate(); lock(false); }
  };
  async function renderPlan() {
    const result = await window.relicDesktop.rerollPlan(Number(el('reroll-shop').value),config?.timing,config?.purchaseCount??30);
    el('reroll-plan-content').innerHTML = '<ol>' + result.stages.map(stage => `<li><strong>${escape(stage.name)}</strong>${stage.durationMs ? `<small>記録上の待機 ${(stage.durationMs / 1000).toFixed(2)}秒</small>` : ''}</li>`).join('') + '</ol>';
  }
  function isCollectorShopSelected(shopVal = Number(el('reroll-shop')?.value ?? 0)) {
    if (el('reroll-shop-source')) return el('reroll-shop-source').value === 'collector';
    return shopVal >= 4;
  }
  function syncShopSourceUI(shopVal = Number(el('reroll-shop')?.value ?? 0)) {
    const isCol = shopVal >= 4;
    if (el('reroll-shop-source')) el('reroll-shop-source').value = isCol ? 'collector' : 'bazaar';
    const budgetLabel = el('reroll-budget-label');
    const budgetInput = el('reroll-rune-budget');
    if (budgetLabel) budgetLabel.textContent = isCol ? '使用王の証（個）' : '使用ルーン（万）';
    if (budgetInput) {
      budgetInput.step = isCol ? '10' : '0.1';
      budgetInput.placeholder = isCol ? '例: 1500' : '例: 54';
    }
  }
  function findBestShopForPatterns(patterns, forceCollector = null) {
    if (!window.LedgerForge || !window.RelicOddsData) return null;
    const condPatterns = (patterns || []).filter(hasRelicConditions);
    if (!condPatterns.length) return null;
    const isCol = forceCollector !== null ? forceCollector : isCollectorShopSelected();
    const forge = window.LedgerForge;
    const { nameToId } = window.RelicOddsData;
    const probs = [0, 0, 0, 0];
    let anyDeepHint = false;
    for (const pat of condPatterns) {
      const nNew = forge.calcPatternOdds(pat, false, nameToId, { legacy: false, collector: isCol })?.prob || 0;
      const nLeg = forge.calcPatternOdds(pat, false, nameToId, { legacy: true, collector: isCol })?.prob || 0;
      const dNew = forge.calcPatternOdds(pat, true, nameToId, { legacy: false, collector: isCol })?.prob || 0;
      const dLeg = forge.calcPatternOdds(pat, true, nameToId, { legacy: true, collector: isCol })?.prob || 0;
      const normalValid = nNew > 0 || nLeg > 0;
      const deepValid = dNew > 0 || dLeg > 0;
      const allowNormal = !(pat.relicType === 'deep' && deepValid);
      const allowDeep = !(pat.relicType === 'normal' && normalValid);
      const explicitLeg = typeof pat.poolLegacy === 'boolean' ? pat.poolLegacy : null;
      if (allowNormal) {
        const allowNNew = explicitLeg === null || explicitLeg === false || (nLeg <= 0 && nNew > 0);
        const allowNLeg = explicitLeg === null || explicitLeg === true || (nNew <= 0 && nLeg > 0);
        if (allowNNew) probs[0] += nNew;
        if (allowNLeg) probs[1] += nLeg;
      }
      if (allowDeep) {
        const allowDNew = explicitLeg === null || explicitLeg === false || (dLeg <= 0 && dNew > 0);
        const allowDLeg = explicitLeg === null || explicitLeg === true || (dNew <= 0 && dLeg > 0);
        if (allowDNew) probs[2] += dNew;
        if (allowDLeg) probs[3] += dLeg;
      }
      if ((pat.wantedPenalties && pat.wantedPenalties.length > 0) || pat.relicType === 'deep') {
        anyDeepHint = true;
      }
    }
    let bestShop = null;
    let bestProb = 0;
    // Compare [0, 1, 2, 3]; if tied (e.g. cursed-only deep effects), prefer legacy (1 over 0, 3 over 2)
    for (const s of [1, 0, 3, 2]) {
      if (probs[s] > bestProb + 1e-12) {
        bestProb = probs[s];
        bestShop = s;
      }
    }
    if (bestShop === null && anyDeepHint) bestShop = 2;
    if (bestShop === null) return null;
    return isCol ? bestShop + 4 : bestShop;
  }
  async function autoSelectBestShop() {
    if (cycleRunning) return false;
    try {
      const saved = JSON.parse(localStorage.getItem('nightreign.relic.target.v1') || 'null');
      const patterns = saved ? activeRelicPatterns(saved) : [];
      const bestShop = findBestShopForPatterns(patterns);
      if (bestShop === null) return false;
      const currentShop = Number(el('reroll-shop').value);
      if (currentShop !== bestShop) {
        el('reroll-shop').value = String(bestShop);
        syncShopSourceUI(bestShop);
        if (config) {
          config = await window.relicDesktop.storeSaveSettings({ ...config, shopIndex: bestShop });
        }
        updateRuneBudgetFromCount(Number(el('reroll-purchase-count').value || config?.purchaseCount || 30));
        await renderPlan();
        return true;
      }
    } catch {}
    return false;
  }
  el('reroll-plan-open').onclick = async () => {
    // Execution controls are always visible.
    if (cycleRunning) return;
    try {
      config = await window.relicDesktop.saveSettings();
      el('reroll-shop').value = String(config.shopIndex);
      syncShopSourceUI(Number(config.shopIndex));
      el('reroll-purchase-count').value = config.purchaseCount ?? 30;
      const saved = JSON.parse(localStorage.getItem('nightreign.relic.target.v1') || 'null');
      const bestShop = saved ? findBestShopForPatterns(activeRelicPatterns(saved), Number(config.shopIndex) >= 4) : null;
      if (bestShop !== null && bestShop !== Number(config.shopIndex)) {
        el('reroll-shop').value = String(bestShop);
        syncShopSourceUI(bestShop);
        config = await window.relicDesktop.storeSaveSettings({ ...config, shopIndex: bestShop });
      }
      updateRuneBudgetFromCount(Number(el('reroll-purchase-count').value));
      el('reroll-target-matches').value = config.targetMatchCount ?? 1;
      const savedSound = config.notifySound || localStorage.getItem('nightreign.relic.notifySound.v1') || 'chime-short';
      if (el('reroll-notify-sound')) el('reroll-notify-sound').value = savedSound;
      const savedVolRaw = config.notifyVolume ?? localStorage.getItem('nightreign.relic.notifyVolume.v1');
      const savedVol = savedVolRaw !== null && savedVolRaw !== undefined && savedVolRaw !== '' && Number.isFinite(Number(savedVolRaw)) ? Math.max(0, Math.min(100, Math.round(Number(savedVolRaw)))) : 80;
      if (el('reroll-notify-volume')) el('reroll-notify-volume').value = String(savedVol);
      if (el('reroll-notify-volume-label')) el('reroll-notify-volume-label').textContent = `${savedVol}%`;
      const timing = { autoWait: true, titleTimeoutSec: 60, resumeTimeoutSec: 90, postRestoreWaitSec: 0, resumeExtraSec: 1, ...config.timing };
      el('reroll-adaptive-wait').checked = config.timing?.adaptiveWait !== false;
      el('reroll-macro-navigation').checked = config.timing?.macroNavigation !== false;
      el('reroll-title-wait').value = config.timing?.titleWaitSec ?? 8;
      el('reroll-auto-wait').checked = timing.autoWait;
      el('reroll-resume-final').value = timing.resumeFinalWaitSec ?? 1;
      el('reroll-purchase-wait').value = timing.purchaseTransitionMs ?? 200;
      for (const [id, key] of [['reroll-title-timeout', 'titleTimeoutSec'], ['reroll-resume-timeout', 'resumeTimeoutSec'], ['reroll-restore-wait', 'postRestoreWaitSec'], ['reroll-resume-extra', 'resumeExtraSec']]) el(id).value = timing[key];
      window.dispatchEvent(new CustomEvent('relic-reroll-settings-changed'));
      await renderPlan();
      await refreshRerollWindows();
    }
    catch (error) { el('reroll-plan-status').textContent = error.message; }
  };
  function relicUnitPrice(shopIndex) {
    const sub = shopIndex % 4;
    if (shopIndex >= 4) {
      // コレクター（王の証）：通常遺物 (5個), 深層遺物 (10個)
      return sub >= 2 ? 10 : 5;
    }
    // バザー（マーク）：通常遺物 (600), 深層遺物 (1800)
    return sub >= 2 ? 1800 : 600;
  }
  function updateRuneBudgetFromCount(count) {
    if (!Number.isFinite(count) || count <= 0) return null;
    const shopVal = Number(el('reroll-shop').value);
    const isCol = shopVal >= 4;
    const pricePerRelic = relicUnitPrice(shopVal);
    const costPerBatch = pricePerRelic * 10;
    const totalCost = count * costPerBatch;
    const displayVal = isCol ? totalCost : Number((totalCost / 10000).toFixed(4));
    el('reroll-rune-budget').value = displayVal;
    return { totalRunes: totalCost, costPerBatch, manVal: displayVal };
  }
  let isSyncingRuneBudget = false;
  async function applyPurchaseCount() {
    if (isSyncingRuneBudget) return;
    try {
      const rawVal = el('reroll-purchase-count').value;
      if (rawVal === '') return;
      const count = Number(rawVal);
      if (!Number.isInteger(count) || count < 1 || count > 1000) {
        throw Error('購入回数は1～1000の整数で指定してください。');
      }
      isSyncingRuneBudget = true;
      const calc = updateRuneBudgetFromCount(count);
      isSyncingRuneBudget = false;
      window.dispatchEvent(new CustomEvent('relic-reroll-settings-changed'));
      config = await window.relicDesktop.storeSaveSettings({ ...config, purchaseCount: count });
      await renderPlan();
      renderRerollTarget();
    } catch (error) {
      isSyncingRuneBudget = false;
      el('reroll-plan-status').textContent = error.message;
      if (config?.purchaseCount) {
        el('reroll-purchase-count').value = config.purchaseCount;
        updateRuneBudgetFromCount(config.purchaseCount);
        window.dispatchEvent(new CustomEvent('relic-reroll-settings-changed'));
        renderRerollTarget();
      }
    }
  }
  async function applyRuneBudget() {
    if (isSyncingRuneBudget) return;
    const rawVal = el('reroll-rune-budget').value;
    if (rawVal === '') return;
    const budgetVal = Number(rawVal);
    if (!Number.isFinite(budgetVal) || budgetVal <= 0) return;
    const shopVal = Number(el('reroll-shop').value);
    const isCol = shopVal >= 4;
    const totalBudget = isCol ? budgetVal : budgetVal * 10000;
    const pricePerRelic = relicUnitPrice(shopVal);
    const costPerBatch = pricePerRelic * 10; // 1回の購入操作で10個購入
    const maxCount = Math.min(1000, Math.max(1, Math.floor(totalBudget / costPerBatch)));
    isSyncingRuneBudget = true;
    el('reroll-purchase-count').value = maxCount;
    isSyncingRuneBudget = false;
    window.dispatchEvent(new CustomEvent('relic-reroll-settings-changed'));
    try {
      config = await window.relicDesktop.storeSaveSettings({ ...config, purchaseCount: maxCount });
      await renderPlan();
      renderRerollTarget();
    } catch (error) {
      el('reroll-plan-status').textContent = error.message;
    }
  }
  el('reroll-rune-budget').oninput = applyRuneBudget;
  el('reroll-rune-budget').onchange = applyRuneBudget;
  el('reroll-purchase-count').oninput = applyPurchaseCount;
  el('reroll-purchase-count').onchange = applyPurchaseCount;
  el('reroll-target-matches').onchange=async()=>{try{const count=Number(el('reroll-target-matches').value);if(!Number.isInteger(count)||count<1||count>99)throw Error('止める当たり数は1～99の整数で指定してください。');config=await window.relicDesktop.storeSaveSettings({...config,targetMatchCount:count});}catch(error){el('reroll-plan-status').textContent=error.message;el('reroll-target-matches').value=config?.targetMatchCount??1;}};
  if (el('reroll-shop-source')) {
    el('reroll-shop-source').onchange = async () => {
      try {
        const wantCol = el('reroll-shop-source').value === 'collector';
        const curSub = Number(el('reroll-shop').value || 0) % 4;
        const nextShop = wantCol ? curSub + 4 : curSub;
        el('reroll-shop').value = String(nextShop);
        syncShopSourceUI(nextShop);
        config = await window.relicDesktop.storeSaveSettings({ ...config, shopIndex: nextShop });
        updateRuneBudgetFromCount(Number(el('reroll-purchase-count').value || config?.purchaseCount || 30));
        window.dispatchEvent(new CustomEvent('relic-reroll-settings-changed'));
        await renderPlan();
        renderRerollTarget();
      } catch (error) {
        el('reroll-plan-status').textContent = error.message;
      }
    };
  }
  el('reroll-shop').onchange = async () => {
    try {
      const nextShop = Number(el('reroll-shop').value);
      syncShopSourceUI(nextShop);
      config = await window.relicDesktop.storeSaveSettings({ ...config, shopIndex: nextShop });
      if (el('reroll-rune-budget').value) {
        await applyRuneBudget();
      } else {
        updateRuneBudgetFromCount(Number(el('reroll-purchase-count').value || 30));
        await renderPlan();
      }
      renderRerollTarget();
    }
    catch (error) { el('reroll-plan-status').textContent = error.message; }
  };
  el('reroll-timing-save').onclick=async()=>{try{const timing={resumeFinalWaitSec:Number(el('reroll-resume-final').value),purchaseTransitionMs:Number(el('reroll-purchase-wait').value),adaptiveWait:false,macroNavigation:true,titleWaitSec:Number(el('reroll-title-wait').value),autoWait:false,titleTimeoutSec:Number(el('reroll-title-timeout').value),resumeTimeoutSec:Number(el('reroll-resume-timeout').value),postRestoreWaitSec:Number(el('reroll-restore-wait').value),resumeExtraSec:Number(el('reroll-resume-extra').value)}; config=await window.relicDesktop.storeSaveSettings({...config,timing});window.dispatchEvent(new CustomEvent('relic-reroll-settings-changed'));await renderPlan();renderRerollTarget();el('reroll-plan-status').textContent='このPCの待ち時間を保存しました。';}catch(error){el('reroll-plan-status').textContent=error.message;}};
  const activePatternCount=()=>{const saved=JSON.parse(localStorage.getItem('nightreign.relic.target.v1')||'null');return saved?activeRelicPatterns(saved).length:0;};
  function updateCycleButtons() {
    for(const button of el('reroll-live-summary').querySelectorAll('[data-toggle-pattern],[data-edit-pattern],[data-add-pattern],[data-sync-shared]')){
      button.disabled=cycleRunning;
      if(button.hasAttribute('data-toggle-pattern'))button.draggable=!cycleRunning;
    }
    for(const input of planDialog.querySelectorAll('.reroll-timing input,.reroll-timing button'))input.disabled=cycleRunning;
    el('reroll-simulate').disabled = cycleRunning || !activePatternCount();
    el('reroll-shop').disabled = cycleRunning; if(el('reroll-shop-source'))el('reroll-shop-source').disabled=cycleRunning; if(el('reroll-rune-budget'))el('reroll-rune-budget').disabled=cycleRunning; el('reroll-purchase-count').disabled=cycleRunning; el('reroll-target-matches').disabled=cycleRunning;
    el('reroll-refresh').disabled = cycleRunning;
    el('reroll-window').disabled = cycleRunning;
    el('reroll-stop').disabled = !cycleRunning;
    el('reroll-start-live').disabled = cycleRunning || !activePatternCount() || !el('reroll-window').value || !config?.source || !config?.destination;
    el('reroll-speed-test').disabled = el('reroll-start-live').disabled;
    el('reroll-start-continuous').disabled = el('reroll-start-live').disabled;
    el('save-manager-open').disabled=cycleRunning;
    if(el('reroll-quick-auto-backup'))el('reroll-quick-auto-backup').disabled=cycleRunning||busy;
    if(el('reroll-quick-restore'))el('reroll-quick-restore').disabled=cycleRunning||!config?.source||!config?.destination;
    el('target-open').disabled=cycleRunning;
  }
  async function refreshRerollWindows() {
    el('reroll-window-status').textContent='ゲームを検出中…';
    const previous=el('reroll-window').value;
    const windows = await window.relicDesktop.filterWindows(); el('reroll-window').replaceChildren();
    for (const item of windows) el('reroll-window').add(new Option(item.name, item.id));
    if(windows.length>1){el('reroll-window').prepend(new Option('ゲームを選択',''));el('reroll-window').value=windows.some(item=>item.id===previous)?previous:'';}
    el('reroll-window').closest('label').hidden = windows.length <= 1;
    windowRow.hidden = false;
    el('reroll-window-status').textContent = windows.length === 1 ? 'ゲーム検出済み' : windows.length ? 'ゲームを選択してください' : 'ゲーム未検出';
    renderRerollTarget();
    updateCycleButtons();
  }
  function formatEffectOdds(itemOrName, isDeep, isLegacy = false, isCollector = false) {
    if (!window.RelicOddsData) return '';
    const exactNames = typeof itemOrName === 'object' && itemOrName !== null
      ? (Array.isArray(itemOrName.exactNames) && itemOrName.exactNames.length ? itemOrName.exactNames : [itemOrName.item].filter(Boolean))
      : [itemOrName].filter(Boolean);
    if (!exactNames.length) return '';
    const seenIds = new Set();
    let totalProb = 0;
    let totalLatestProb = 0;
    const breakdown = [];
    for (const name of exactNames) {
      const id = window.RelicOddsData.nameToId[name];
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      const odds = window.RelicOddsData.singleOdds[id];
      if (!odds) continue;
      let prob = isDeep ? (isLegacy ? odds.deepLegacyProb : odds.deepProb) : (isLegacy ? odds.normalLegacyProb : odds.normalProb);
      let oneIn = isDeep ? (isLegacy ? odds.deepLegacyOneIn : odds.deepOneIn) : (isLegacy ? odds.normalLegacyOneIn : odds.normalOneIn);
      if (isCollector && window.LedgerForge?.Q) {
        prob = window.LedgerForge.Q(isDeep, [id], isLegacy, true);
        oneIn = prob > 0 ? Math.max(1, Math.round(1 / prob)) : null;
      }
      const latestProb = isDeep ? odds.deepProb : odds.normalProb;
      if (prob > 0 && oneIn) {
        totalProb += prob;
        breakdown.push(`${name}: 約${oneIn.toLocaleString()}個に1個`);
      }
      if (latestProb > 0) {
        totalLatestProb += latestProb;
      }
    }
    if (!seenIds.size) return '';
    if (totalProb <= 0) {
      if (isLegacy && totalLatestProb > 0) {
        return `<span class="reroll-effect-odds is-zero">Ver.1.03追加（以前では出現不可）</span>`;
      }
      return `<span class="reroll-effect-odds is-zero">${isDeep ? '出現不可' : '深層限定'}</span>`;
    }
    const combinedOneIn = Math.max(1, Math.round(1 / totalProb));
    const pct = (totalProb * 100).toFixed(totalProb < 0.01 ? 2 : 1);
    const titleText = breakdown.length > 1
      ? `合算出現率: 約${pct}%（${breakdown.join(' ／ ')}）`
      : `単体出現率: 約${pct}%`;
    return `<span class="reroll-effect-odds" title="${escape(titleText)}">約 ${combinedOneIn.toLocaleString()} 個に 1 個</span>`;
  }
  function getRerollTimingFromInputs() {
    return {
      titleWaitSec: Number(el('reroll-title-wait')?.value ?? config?.timing?.titleWaitSec ?? 8),
      postRestoreWaitSec: Number(el('reroll-restore-wait')?.value ?? config?.timing?.postRestoreWaitSec ?? 0),
      resumeFinalWaitSec: Number(el('reroll-resume-final')?.value ?? config?.timing?.resumeFinalWaitSec ?? 1),
      resumeExtraSec: Number(el('reroll-resume-extra')?.value ?? config?.timing?.resumeExtraSec ?? 1),
      purchaseTransitionMs: Number(el('reroll-purchase-wait')?.value ?? config?.timing?.purchaseTransitionMs ?? 200)
    };
  }
  function calculateTargetSummaryOdds(patterns, isDeep, purchaseCount, timing, isLegacy = false, isCollector = false) {
    if (!window.LedgerForge || !window.RelicOddsData) return null;
    const forge = window.LedgerForge;
    const { nameToId } = window.RelicOddsData;
    const batch = (purchaseCount || 30) * 10;
    const price = isDeep ? 1800 : 600;

    let totalPatternProb = 0;
    let totalBaseProb = 0;
    let totalSizeFilteredProb = 0;
    let totalAnyColorProb = 0;
    let anyImpossible = false;
    let anyV103Only = false;
    let hasColorFilter = false;
    let hasSizeFilter = false;
    let maxExcludedPenalties = 0;
    let maxWantedPenalties = 0;

    for (const pat of patterns) {
      const odds = forge.calcPatternOdds(pat, isDeep, nameToId, { legacy: isLegacy, collector: isCollector });
      if (!odds) continue;
      if (odds.hasV103Only) anyV103Only = true;
      if (odds.colorCount > 0 && odds.colorCount < 4) hasColorFilter = true;
      if (odds.sizes && odds.sizes.length > 0 && odds.sizes.length < 3) hasSizeFilter = true;
      if (odds.excludedPenaltyCount > maxExcludedPenalties) maxExcludedPenalties = odds.excludedPenaltyCount;
      if (odds.wantedPenaltyCount > maxWantedPenalties) maxWantedPenalties = odds.wantedPenaltyCount;
      if (odds.prob <= 0) {
        anyImpossible = true;
      } else {
        totalPatternProb += odds.prob;
        totalBaseProb += odds.baseProb;
        totalSizeFilteredProb += odds.sizeFilteredProb;
        totalAnyColorProb += odds.anyColorProb;
      }
    }

    totalPatternProb = Math.min(1, totalPatternProb);
    totalBaseProb = Math.min(1, totalBaseProb);
    totalSizeFilteredProb = Math.min(1, totalSizeFilteredProb);
    totalAnyColorProb = Math.min(1, totalAnyColorProb);

    if (totalPatternProb <= 0) {
      return { impossible: anyImpossible, anyV103Only, totalOneIn: null, estCycles: null, estRunesMan: null, maxWantedPenalties };
    }

    const savedHours = Number(localStorage.getItem('nightreign.relic.oddsHours.v1'));
    const hours = Number.isFinite(savedHours) && savedHours > 0 ? Math.min(9999, Math.max(0.1, savedHours)) : 8;
    const totalOneIn = Math.max(1, Math.round(1 / totalPatternProb));
    const baseOneIn = totalBaseProb > 0 ? Math.max(1, Math.round(1 / totalBaseProb)) : null;
    const estCycles = Math.ceil(totalOneIn / batch);
    const estRunesMan = Number(((totalOneIn * price) / 10000).toFixed(1));
    const percentStr = (totalPatternProb * 100).toFixed(totalPatternProb < 0.0001 ? 5 : totalPatternProb < 0.01 ? 3 : 2);
    const stats8h = forge.calc8HourStats(totalPatternProb, { purchaseCount, timing, hours });
    const baseStats8h = totalBaseProb > 0 ? forge.calc8HourStats(totalBaseProb, { purchaseCount, timing, hours }) : null;
    const penaltyFactor = totalSizeFilteredProb > 0 ? totalAnyColorProb / totalSizeFilteredProb : 1;

    return {
      impossible: false,
      anyV103Only,
      prob: totalPatternProb,
      baseProb: totalBaseProb,
      totalOneIn,
      baseOneIn,
      percentStr,
      estCycles,
      estRunesMan,
      batch,
      stats8h,
      baseStats8h,
      hasColorFilter,
      hasSizeFilter,
      maxExcludedPenalties,
      maxWantedPenalties,
      penaltyFactor
    };
  }
  let targetPreviewRequest=0;
  let lastRerollSummary=null;
  function renderRerollTarget() {
    const request=++targetPreviewRequest;
    const saved=JSON.parse(localStorage.getItem('nightreign.relic.target.v1')||'null');
    const all=saved?normalizeRelicPatterns(saved):[],patterns=all.filter(pattern=>pattern.enabled);
    if (!cycleRunning && patterns.length) {
      const bestShop = findBestShopForPatterns(patterns);
      if (bestShop !== null && Number(el('reroll-shop')?.value ?? -1) !== bestShop) {
        el('reroll-shop').value = String(bestShop);
        syncShopSourceUI(bestShop);
        updateRuneBudgetFromCount(Number(el('reroll-purchase-count')?.value || config?.purchaseCount || 30));
        if (config && config.shopIndex !== bestShop) {
          config = { ...config, shopIndex: bestShop };
          window.relicDesktop.storeSaveSettings(config).catch(() => {});
        }
        renderPlan().catch(() => {});
        window.dispatchEvent(new CustomEvent('relic-reroll-settings-changed'));
      }
    }
    const detailsEl=el('reroll-live-summary').querySelector('details');
    const expanded=detailsEl?detailsEl.open:true;
    el('reroll-live-summary').innerHTML='<h3>探すパターンのオン／オフ <small>'+patterns.length+' / '+all.length+'件オン（クリックでオン・オフ切替／ドラッグで並替）</small><div class="pattern-heading-actions"><button type="button" data-sync-shared aria-label="裏アプリへ条件を反映" title="現在のオン・オフ状態や条件を裏リセマラ部屋のアプリへ反映します">裏アプリへ反映</button><button type="button" data-add-pattern aria-label="新しい条件を作成" title="新しい条件を作成">＋</button><button type="button" data-edit-pattern="0" aria-label="パターンを編集" title="パターンを編集">✎</button></div></h3><div class="reroll-pattern-chips">'+(all.length?all.map((pattern,index)=>'<button type="button" draggable="'+(!cycleRunning)+'" data-toggle-pattern="'+index+'" aria-pressed="'+pattern.enabled+'">'+escape(pattern.name)+'</button>').join(''):'<span>＋から条件を作成してください</span>')+'</div><details'+(expanded?' open':'')+'><summary>条件（ゲーム内フィルター設定・出現確率）</summary><div id="reroll-filter-preview" class="reroll-filter-preview"></div></details>';
    updateCycleButtons();
    const preview=el('reroll-filter-preview');
    if(!patterns.length){lastRerollSummary=null;preview.textContent='パターンを選択（オンに）してください。';return;}
    preview.textContent='読み込み中…';
    window.relicDesktop.filterPlan({patterns}).then(plan=>{
      if(request!==targetPreviewRequest)return;
      if (!cycleRunning) {
        const bestShop = findBestShopForPatterns(patterns);
        if (bestShop !== null && Number(el('reroll-shop')?.value ?? -1) !== bestShop) {
          el('reroll-shop').value = String(bestShop);
          syncShopSourceUI(bestShop);
          updateRuneBudgetFromCount(Number(el('reroll-purchase-count')?.value || config?.purchaseCount || 30));
          if (config && config.shopIndex !== bestShop) {
            config = { ...config, shopIndex: bestShop };
            window.relicDesktop.storeSaveSettings(config).catch(() => {});
          }
        }
      }
      const shopVal = Number(el('reroll-shop')?.value ?? 0);
      const isCollector = shopVal >= 4;
      const subShopVal = shopVal % 4;
      const isDeep = subShopVal >= 2;
      const isLegacy = subShopVal === 1 || subShopVal === 3;
      const purchaseCount = Number(el('reroll-purchase-count')?.value || config?.purchaseCount || 30);
      const timing = getRerollTimingFromInputs();

      const groupsHtml = plan.groups.map(group => {
        const slotTitle = '効果' + (group.slot + 1);
        let itemsHtml = '<p class="reroll-filter-item-empty">指定なし</p>';
        if (group.items.length) {
          itemsHtml = group.items.map(item => {
            const exactNames = Array.isArray(item.exactNames) && item.exactNames.length ? item.exactNames : [item.item];
            const oddsTag = formatEffectOdds(item, isDeep, isLegacy, isCollector);
            const effObj = typeof EFFECTS !== 'undefined' ? EFFECTS.find(e => exactNames.includes(e.name) || e.name === item.item) : null;
            const tip = effObj?.summary ? ` data-tooltip="${escape(effObj.summary)}" data-tooltip-name="${escape(exactNames.join(' ／ '))}"` : '';
            let displayName = item.item;
            if (exactNames.length === 1 && exactNames[0] !== item.item) {
              displayName = exactNames[0];
            } else if (exactNames.length > 1) {
              const tiers = exactNames.map(n => {
                const m = n.normalize('NFKC').match(/\+(\d+)$/);
                return m ? `+${m[1]}` : '無印';
              });
              displayName = `${item.item}（${tiers.join('・')}）`;
            }
            return `<div class="reroll-filter-item-row"${tip}><span class="reroll-filter-item-name">${escape(displayName)}</span>${oddsTag}</div>`;
          }).join('');
        }
        return `<div class="reroll-filter-group"><span>${slotTitle}</span><div class="reroll-filter-group-items">${itemsHtml}</div></div>`;
      }).join('');

      const allWanted = [...new Set(patterns.flatMap(p => p.wantedPenalties || []))];
      const wantedPenaltiesHtml = allWanted.length
        ? `<div class="reroll-filter-group"><span>狙うデメリット</span><div class="reroll-filter-group-items"><div class="reroll-penalty-chips">${allWanted.map(name => {
            const tip = typeof PENALTY_NOTES !== 'undefined' && PENALTY_NOTES[name] ? ` data-tooltip="${escape(PENALTY_NOTES[name])}" data-tooltip-name="${escape(name)}"` : '';
            return `<span class="reroll-wanted-penalty-chip"${tip}>${escape(name)}</span>`;
          }).join('')}</div></div></div>`
        : '';

      const allExcluded = [...new Set(patterns.flatMap(p => p.excludedPenalties || []))];
      const penaltiesHtml = allExcluded.length
        ? `<div class="reroll-filter-group"><span>除外デメリット</span><div class="reroll-filter-group-items"><div class="reroll-penalty-chips">${allExcluded.map(name => {
            const tip = typeof PENALTY_NOTES !== 'undefined' && PENALTY_NOTES[name] ? ` data-tooltip="${escape(PENALTY_NOTES[name])}" data-tooltip-name="${escape(name)}"` : '';
            return `<span class="reroll-penalty-chip"${tip}>${escape(name)}</span>`;
          }).join('')}</div></div></div>`
        : '';

      const summary = calculateTargetSummaryOdds(patterns, isDeep, purchaseCount, timing, isLegacy, isCollector);
      lastRerollSummary = summary ? { ...summary, purchaseCount, timing } : null;
      let summaryHtml = '';
      if (summary) {
        if (summary.impossible && !summary.totalOneIn) {
          const allPatternConflicts = patterns.length > 0 && window.LedgerForge?.findPatternConflict && window.RelicOddsData?.nameToId
            ? patterns.map(p => window.LedgerForge.findPatternConflict(p, window.RelicOddsData.nameToId)).filter(Boolean)
            : [];
          const conflictMsg = allPatternConflicts.length === patterns.length ? allPatternConflicts[0].message : null;
          const warnMsg = isLegacy && summary.anyV103Only
            ? 'Ver.1.03で追加された効果が含まれているため、「以前のバージョン（Ver.1.02）」では出現しません'
            : conflictMsg
            ? conflictMsg
            : isDeep
            ? '指定した条件は同時に出現しないか、存在しません'
            : summary.maxWantedPenalties > 0
            ? '通常遺物にはデメリットが付かないため、購入する遺物を「深層遺物」に変更してください'
            : '通常遺物では出現しない効果が含まれています（購入する遺物を「深層遺物」に変更してください）';
          summaryHtml = `
            <div class="reroll-odds-summary is-impossible">
              <div class="reroll-odds-headline">
                <span class="reroll-odds-badge is-warn">注意</span>
                <strong>${warnMsg}</strong>
              </div>
            </div>`;
        } else if (summary.totalOneIn) {
          summaryHtml = `
            <div class="reroll-odds-summary">
              <div class="reroll-odds-headline-grid">
                <div class="reroll-odds-headline">
                  <span class="reroll-odds-badge">最終的な出現確率</span>
                  <strong class="reroll-odds-value">約 ${summary.totalOneIn.toLocaleString()} 個に 1 個</strong>
                </div>
                <div class="reroll-odds-8h-box">
                  <label class="reroll-odds-8h-label" for="reroll-odds-hours">
                    <input type="number" id="reroll-odds-hours" class="reroll-odds-hours-input" min="0.5" max="9999" step="0.5" value="${escape(String(summary.stats8h.hours))}" aria-label="計算する時間（時間）"> 時間回したときの期待値
                  </label>
                  <strong id="reroll-odds-8h-value" class="reroll-odds-8h-value">約 ${summary.stats8h.expectedCountStr}</strong>
                  <span class="reroll-odds-8h-sep">／</span>
                  <span class="reroll-odds-8h-hit-label">1個以上出る確率</span>
                  <strong id="reroll-odds-8h-hitprob" class="reroll-odds-8h-value">${escape(summary.stats8h.hitPercent8hStr)}</strong>
                </div>
              </div>
            </div>`;
        }
      }

      const shopNames = ['通常遺物', '通常遺物（1.03前）', '深層遺物', '深層遺物（1.03前）', 'コレクター：通常遺物（大確定）', 'コレクター：通常遺物 1.03前（大確定）', 'コレクター：深層遺物（大確定）', 'コレクター：深層遺物 1.03前（大確定）'];
      preview.innerHTML = '<p class="reroll-filter-props">購入対象：' + escape(shopNames[shopVal] || '通常遺物') + '　色：' + escape(plan.colors.join(' ／ ') || '指定なし') + '　大きさ：' + escape(plan.sizes.join(' ／ ') || '指定なし') + '</p>' + groupsHtml + wantedPenaltiesHtml + penaltiesHtml + summaryHtml;
    }).catch(error=>{if(request===targetPreviewRequest)preview.textContent=error.message;});
  }
  function updateRerollHoursStatsInPlace(hours) {
    const forge = window.LedgerForge;
    if (!forge || !lastRerollSummary || !lastRerollSummary.prob) return;
    const stats8h = forge.calc8HourStats(lastRerollSummary.prob, {
      purchaseCount: lastRerollSummary.purchaseCount,
      timing: lastRerollSummary.timing,
      hours
    });
    const valEl = document.getElementById('reroll-odds-8h-value');
    const hitProbEl = document.getElementById('reroll-odds-8h-hitprob');
    const subEl = document.getElementById('reroll-odds-8h-sub');
    const baseEl = document.getElementById('reroll-odds-base-8h');
    if (valEl) valEl.textContent = `約 ${stats8h.expectedCountStr}`;
    if (hitProbEl) hitProbEl.textContent = stats8h.hitPercent8hStr;
    if (subEl) subEl.textContent = `（約 ${stats8h.cyclesIn8h.toLocaleString()} 周・約 ${stats8h.relicsIn8h.toLocaleString()} 個判定時）`;
    if (baseEl && lastRerollSummary.baseProb > 0) {
      const baseStats8h = forge.calc8HourStats(lastRerollSummary.baseProb, {
        purchaseCount: lastRerollSummary.purchaseCount,
        timing: lastRerollSummary.timing,
        hours
      });
      baseEl.textContent = `${stats8h.hours}時間で期待値 約 ${baseStats8h.expectedCountStr}`;
    }
  }
  function handleRerollOddsHoursInput(event) {
    const input = event.target.closest('#reroll-odds-hours');
    if (!input) return;
    const val = Number(input.value);
    if (!Number.isFinite(val) || val <= 0) return;
    const hours = Math.min(9999, Math.max(0.1, Math.round(val * 100) / 100));
    try { localStorage.setItem('nightreign.relic.oddsHours.v1', String(hours)); } catch {}
    updateRerollHoursStatsInPlace(hours);
    window.dispatchEvent(new CustomEvent('relic-odds-hours-changed', { detail: { hours } }));
  }
  el('reroll-live-summary').addEventListener('input', handleRerollOddsHoursInput);
  el('reroll-live-summary').addEventListener('change', handleRerollOddsHoursInput);
  window.addEventListener('relic-odds-hours-changed', event => {
    const hours = Number(event?.detail?.hours);
    if (!Number.isFinite(hours) || hours <= 0) return;
    const input = document.getElementById('reroll-odds-hours');
    if (input && document.activeElement !== input) {
      input.value = String(hours);
    }
    updateRerollHoursStatsInPlace(hours);
  });
  let chipDragIndex = null;
  el('reroll-live-summary').addEventListener('dragstart', event => {
    const button = event.target.closest('[data-toggle-pattern]');
    if (!button || cycleRunning) { event.preventDefault(); return; }
    chipDragIndex = Number(button.dataset.togglePattern);
    button.classList.add('is-dragging');
    if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(chipDragIndex)); }
  });
  el('reroll-live-summary').addEventListener('dragover', event => {
    const button = event.target.closest('[data-toggle-pattern]');
    if (!button || chipDragIndex === null || cycleRunning) return;
    event.preventDefault();
    for (const item of el('reroll-live-summary').querySelectorAll('.is-drop-target')) if (item !== button) item.classList.remove('is-drop-target');
    if (Number(button.dataset.togglePattern) !== chipDragIndex) button.classList.add('is-drop-target');
  });
  el('reroll-live-summary').addEventListener('dragleave', event => { event.target.closest('[data-toggle-pattern]')?.classList.remove('is-drop-target'); });
  el('reroll-live-summary').addEventListener('drop', event => {
    const button = event.target.closest('[data-toggle-pattern]');
    const from = chipDragIndex ?? Number(event.dataTransfer?.getData('text/plain'));
    chipDragIndex = null;
    if (!button || !Number.isInteger(from) || cycleRunning) return;
    event.preventDefault();
    const to = Number(button.dataset.togglePattern);
    if (from === to) return;
    const key = 'nightreign.relic.target.v1';
    const all = normalizeRelicPatterns(JSON.parse(localStorage.getItem(key) || 'null'));
    const reordered = reorderRelicPatterns(all, from, to);
    localStorage.setItem(key, JSON.stringify({ patterns: reordered }));
    window.dispatchEvent(new Event('relic-target-changed'));
    el('reroll-live-summary').querySelector('[data-toggle-pattern="' + to + '"]')?.focus();
  });
  el('reroll-live-summary').addEventListener('dragend', () => {
    chipDragIndex = null;
    for (const item of el('reroll-live-summary').querySelectorAll('.is-dragging,.is-drop-target')) item.classList.remove('is-dragging', 'is-drop-target');
  });
  function appendRerollLog(message) {
    if (!message) return;
    if (el('reroll-run-log')) {
      el('reroll-run-log').textContent += message + '\n';
    }
    if (el('reroll-plan-status')) {
      el('reroll-plan-status').textContent = message;
    }
  }
  el('reroll-live-summary').addEventListener('click',async event=>{
    if(cycleRunning)return;
    if(event.target.closest('[data-sync-shared]')){
      try{
        await autoSelectBestShop();
        await window.relicDesktop?.syncSharedStorage?.();
        const shopNames = ['通常遺物', '通常遺物（1.03前）', '深層遺物', '深層遺物（1.03前）', 'コレクター：通常遺物（大確定）', 'コレクター：通常遺物 1.03前（大確定）', 'コレクター：深層遺物（大確定）', 'コレクター：深層遺物 1.03前（大確定）'];
        const curShopName = shopNames[Number(el('reroll-shop')?.value ?? 0)] || '通常遺物';
        const toast=document.getElementById('toast');
        if(toast){toast.textContent=`裏アプリへ現在のガチャ条件（購入対象：${curShopName}）を反映しました。`;toast.classList.add('visible');setTimeout(()=>toast.classList.remove('visible'),3000);}
        appendRerollLog(`🔄 裏アプリへ現在のガチャ条件（購入対象：${curShopName}）を反映しました。`);
      }catch(error){
        el('reroll-plan-status').textContent=error.message;
      }
      return;
    }
    if(event.target.closest('[data-add-pattern]')){window.dispatchEvent(new CustomEvent('relic-target-edit',{detail:{add:true}}));return;}
    const edit=event.target.closest('[data-edit-pattern]');if(edit){window.dispatchEvent(new CustomEvent('relic-target-edit',{detail:{index:Number(edit.dataset.editPattern)}}));return;}
    const button=event.target.closest('[data-toggle-pattern]');if(!button)return;
    const key='nightreign.relic.target.v1';
    const all=normalizeRelicPatterns(JSON.parse(localStorage.getItem(key)||'null'));
    const index=Number(button.dataset.togglePattern);if(!all[index])return;
    all[index].enabled=!all[index].enabled;
    button.setAttribute('aria-pressed', String(all[index].enabled));
    localStorage.setItem(key,JSON.stringify({patterns:all}));
    window.dispatchEvent(new CustomEvent('relic-target-changed',{detail:{source:'reroll-toggle',toggledIndex:index,enabled:all[index].enabled}}));
    el('reroll-live-summary').querySelector('[data-toggle-pattern="'+index+'"]')?.focus();
  });
  window.addEventListener('relic-target-changed', () => {
    if (!cycleRunning) {
      renderRerollTarget();
      autoSelectBestShop().then(changed => {
        if (changed && !cycleRunning) renderRerollTarget();
      });
    }
  });
  document.getElementById('target-settings')?.addEventListener('close',()=>{if(!cycleRunning)refreshRerollWindows().catch(error=>{el('reroll-plan-status').textContent=error.message;});});
  dialog.addEventListener('close',()=>{if(!cycleRunning)el('reroll-plan-open').click();});
  window.addEventListener('automation-tab-open',()=>{if(!cycleRunning)el('reroll-plan-open').click();});
  const backupConfirmDialog = document.createElement('dialog');
  backupConfirmDialog.id = 'reroll-backup-confirm-dialog';
  backupConfirmDialog.style.cssText = 'max-width:440px;width:90vw;padding:24px 26px;border-radius:12px;background:#141b1d;color:#e8eceb;border:1px solid rgba(212,175,55,0.45);box-shadow:0 16px 48px rgba(0,0,0,0.65);text-align:center;';
  backupConfirmDialog.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin:-8px -8px 4px 0;">
      <button class="icon-button" id="backup-confirm-close" type="button" aria-label="閉じる">×</button>
    </div>
    <h2 style="margin:0 0 10px;font-size:1.25rem;line-height:1.45;">バックアップを更新して開始しますか？</h2>
    <p id="backup-confirm-current-meta" style="margin:0 0 22px;font-size:0.86rem;color:#b8c2c0;"></p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <button id="backup-confirm-update" type="button" class="primary" style="min-height:48px;font-size:1.05rem;font-weight:700;">はい（更新する）</button>
      <button id="backup-confirm-keep" type="button" style="min-height:48px;font-size:1.05rem;font-weight:600;">いいえ（そのまま）</button>
    </div>
  `;
  document.body.append(backupConfirmDialog);

  function askContinuousBackupAction() {
    return new Promise(async resolve => {
      const metaEl = document.getElementById('backup-confirm-current-meta');
      if (metaEl) {
        metaEl.textContent = '';
        try {
          const gens = await window.relicDesktop.listBackupGenerations?.();
          const cur = Array.isArray(gens) ? gens.find(g => g.isCurrent) : null;
          if (cur?.savedAt) {
            metaEl.textContent = `現在のバックアップ日時：${new Date(cur.savedAt).toLocaleString('ja-JP')}`;
          }
        } catch {}
      }
      let settled = false;
      const finish = choice => {
        if (settled) return;
        settled = true;
        if (backupConfirmDialog.open) backupConfirmDialog.close();
        resolve(choice);
      };
      document.getElementById('backup-confirm-update').onclick = () => finish('update');
      document.getElementById('backup-confirm-keep').onclick = () => finish('keep');
      document.getElementById('backup-confirm-close').onclick = () => finish('cancel');
      backupConfirmDialog.oncancel = () => finish('cancel');
      backupConfirmDialog.onclose = () => finish('cancel');
      backupConfirmDialog.showModal();
      document.getElementById('backup-confirm-keep')?.focus();
    });
  }

  async function runCycle(mode, speedTest=false) {
    if (cycleRunning) return;
    let forceUpdateBackup = false;
    if (mode === 'continuous') {
      const choice = await askContinuousBackupAction();
      if (choice === 'cancel') return;
      forceUpdateBackup = (choice === 'update');
    }
    if (mode !== 'simulation') {
      try {
        const backupRes = await window.relicDesktop.autoBackup(null, { forceUpdate: forceUpdateBackup });
        config = backupRes.config;
        if (el('save-source')) el('save-source').value = config.source;
        if (el('save-destination')) el('save-destination').value = config.destination;
        if (forceUpdateBackup) {
          await renderBackupGenerations();
        }
      } catch (err) {
        el('reroll-plan-status').textContent = 'バックアップ確認エラー：' + err.message;
        return;
      }
    }
    cycleRunning = true; updateMatchBadge(0); clearMatchList(); updateCycleButtons(); el('reroll-run-log').textContent = ''; el('reroll-plan-status').textContent = '開始準備中…';
    try {
      if (mode !== 'simulation') {
        await refreshRerollWindows().catch(() => {});
      }
      const target = JSON.parse(localStorage.getItem('nightreign.relic.target.v1') || '{"color":"","size":"","groups":[[],[],[]]}');
      const targetMatches = Number(el('reroll-target-matches').value) || 1;
      const result = await window.relicDesktop.startReroll({ mode, speedTest, targetMatches, timing:config?.timing, shopIndex: Number(el('reroll-shop').value), target, save: config, windowId: el('reroll-window').value, acknowledged: mode !== 'simulation' });
      if (Number.isInteger(result.matches)) updateMatchBadge(result.matches);
      if (Array.isArray(result.matchedRelics) && result.matchedRelics.length) {
        clearMatchList();
        for (const item of result.matchedRelics) appendMatchSummary(item.summary);
        loadAndOpenMatchHistory(false);
      }
      const hitSuffix = matchCount > 0 ? `（当たり：${matchCount}回）` : '';
      el('reroll-plan-status').textContent = (result.simulation ? '手順とダミーファイルの復元テストが完了しました。実ゲーム・実セーブは変更していません。' : result.matchLimitReached ? `指定した当たり回数（${matchCount}回）に達したため停止しました。` : result.matched ? '一致候補で停止しました。元画像を確認してください。' : result.review?.status==='no-match' ? '候補の確認が終わりました。一致はありません。次の復元は行いません。' : (result.review?.reason||'候補を確認しきれないため停止しました。')) + (result.matchLimitReached ? '' : hitSuffix);
      el('reroll-run-log').textContent += '\n記録先：' + result.reportFolder;
    } catch (error) { el('reroll-plan-status').textContent = error.message + (matchCount > 0 ? `（現在の当たり：${matchCount}回）` : ''); }
    finally { cycleRunning = false; updateCycleButtons(); }
  }
  el('reroll-simulate').onclick = () => runCycle('simulation');
  el('reroll-start-continuous').onclick = () => runCycle('continuous');
  el('reroll-speed-test').onclick = () => runCycle('two-cycle',true);
  el('reroll-start-live').onclick = () => runCycle('one-cycle');
  el('reroll-stop').onclick = () => window.relicDesktop.stopReroll();
  el('reroll-refresh').onclick = refreshRerollWindows;
  el('reroll-window').onchange = ()=>{el('reroll-window-status').textContent=el('reroll-window').value?'ゲーム検出済み':'ゲームを選択してください';updateCycleButtons();};
  let sharedAudioCtx = null;
  let lastAudioPlayMs = 0;
  const wavBufferCache = new Map();
  function getNotifyVolumeRatio() {
    const raw = el('reroll-notify-volume')?.value ?? config?.notifyVolume ?? localStorage.getItem('nightreign.relic.notifyVolume.v1') ?? 80;
    const num = Number(raw);
    if (!Number.isFinite(num)) return 0.8;
    return Math.max(0, Math.min(100, num)) / 100;
  }
  async function playRerollNotificationSound(kind = 'match', presetOverride = null) {
    try {
      const preset = presetOverride || el('reroll-notify-sound')?.value || config?.notifySound || localStorage.getItem('nightreign.relic.notifySound.v1') || 'chime-short';
      const volRatio = getNotifyVolumeRatio();
      if (preset === 'mute' || volRatio <= 0) return;
      if (typeof window.relicDesktop?.playNotifySound === 'function') {
        const res = await window.relicDesktop.playNotifySound({
          kind,
          preset,
          volume: Math.round(volRatio * 100)
        });
        if (res?.played) return;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      const isCold = (Date.now() - lastAudioPlayMs) > 2500;
      const leadInSec = isCold ? 0.10 : 0.03;
      const now = ctx.currentTime;
      lastAudioPlayMs = Date.now();
      const baseTime = now + leadInSec;

      let notes;
      if (kind === 'error') {
        notes = [
          { freq: 440, start: 0.00, dur: 0.12, gain: 0.36, type: 'sine' },
          { freq: 330, start: 0.13, dur: 0.18, gain: 0.36, type: 'sine' }
        ];
      } else if (preset === 'ping-single') {
        notes = [
          { freq: 1046.50, start: 0.00, dur: 0.18, gain: 0.42, type: 'sine' }
        ];
      } else if (preset === 'crystal') {
        notes = [
          { freq: 1318.51, start: 0.00, dur: 0.11, gain: 0.34, type: 'sine' },
          { freq: 1760.00, start: 0.12, dur: 0.20, gain: 0.42, type: 'sine' }
        ];
      } else if (preset === 'fanfare') {
        notes = [
          { freq: 523.25, start: 0.00, dur: 0.11, gain: 0.36, type: 'triangle' },
          { freq: 659.25, start: 0.11, dur: 0.11, gain: 0.40, type: 'triangle' },
          { freq: 783.99, start: 0.22, dur: 0.12, gain: 0.44, type: 'triangle' },
          { freq: 1046.50, start: 0.34, dur: 0.30, gain: 0.50, type: 'triangle' }
        ];
      } else {
        notes = [
          { freq: 880, start: 0.00, dur: 0.11, gain: 0.38, type: 'sine' },
          { freq: 1174.66, start: 0.12, dur: 0.19, gain: 0.44, type: 'sine' }
        ];
      }
      for (const n of notes) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const peakGain = Math.max(0.0002, n.gain * volRatio);
        osc.type = n.type || 'sine';
        osc.frequency.setValueAtTime(n.freq, baseTime + n.start);
        g.gain.setValueAtTime(0.0001, baseTime + n.start);
        g.gain.linearRampToValueAtTime(peakGain, baseTime + n.start + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, baseTime + n.start + n.dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(baseTime + n.start);
        osc.stop(baseTime + n.start + n.dur + 0.02);
      }
      setTimeout(() => { try { ctx.close(); } catch {} }, 1500);
    } catch {}
  }
  if (el('reroll-notify-sound')) {
    const initialSound = localStorage.getItem('nightreign.relic.notifySound.v1');
    if (initialSound) el('reroll-notify-sound').value = initialSound;
    el('reroll-notify-sound').onchange = async () => {
      const val = el('reroll-notify-sound').value || 'chime-short';
      try { localStorage.setItem('nightreign.relic.notifySound.v1', val); } catch {}
      playRerollNotificationSound('match', val);
      if (config) {
        try { config = await window.relicDesktop.storeSaveSettings({ ...config, notifySound: val }); } catch {}
      }
    };
  }
  if (el('reroll-notify-volume')) {
    const initialVol = localStorage.getItem('nightreign.relic.notifyVolume.v1');
    if (initialVol !== null && initialVol !== '' && Number.isFinite(Number(initialVol))) {
      const v = Math.max(0, Math.min(100, Math.round(Number(initialVol))));
      el('reroll-notify-volume').value = String(v);
      if (el('reroll-notify-volume-label')) el('reroll-notify-volume-label').textContent = `${v}%`;
    }
    el('reroll-notify-volume').oninput = () => {
      const v = Math.max(0, Math.min(100, Math.round(Number(el('reroll-notify-volume').value || 80))));
      if (el('reroll-notify-volume-label')) el('reroll-notify-volume-label').textContent = `${v}%`;
      try { localStorage.setItem('nightreign.relic.notifyVolume.v1', String(v)); } catch {}
    };
    el('reroll-notify-volume').onchange = async () => {
      const v = Math.max(0, Math.min(100, Math.round(Number(el('reroll-notify-volume').value || 80))));
      if (el('reroll-notify-volume-label')) el('reroll-notify-volume-label').textContent = `${v}%`;
      try { localStorage.setItem('nightreign.relic.notifyVolume.v1', String(v)); } catch {}
      playRerollNotificationSound('match');
      if (config) {
        try { config = await window.relicDesktop.storeSaveSettings({ ...config, notifyVolume: v }); } catch {}
      }
    };
  }
  if (el('reroll-notify-sound-test')) {
    el('reroll-notify-sound-test').onclick = () => {
      const val = el('reroll-notify-sound')?.value || 'chime-short';
      playRerollNotificationSound('match', val);
    };
  }
  function scheduleMatchHistoryRefresh() {
    for (const delay of [1500, 8000, 14000, 20000]) {
      setTimeout(() => loadAndOpenMatchHistory(false), delay);
    }
  }
  window.addEventListener('focus', () => {
    if (!cycleRunning) loadAndOpenMatchHistory(false);
  });
  window.relicDesktop.onRerollLog(message => {
    if (message.startsWith('🔄 【履歴更新】')) {
      loadAndOpenMatchHistory(false);
      return;
    }
    const hitMatch = message.match(/現在の当たり：(\d+)回/);
    if (hitMatch) updateMatchBadge(Number(hitMatch[1]));
    if (message.startsWith('🔔 【裏リセマラ通知】')) {
      const inner = message.replace('🔔 【裏リセマラ通知】', '').trim();
      const idx = Number(inner.match(/^当たり遺物 #(\d+)/)?.[1]);
      if (Number.isInteger(idx) && idx > matchCount) updateMatchBadge(idx);
      else updateMatchBadge(matchCount + 1);
      appendMatchSummary(inner);
      el('reroll-plan-status').textContent = message;
      if (typeof window.relicDesktop?.playNotifySound !== 'function') playRerollNotificationSound('match');
      scheduleMatchHistoryRefresh();
    } else if (message.startsWith('⚠️ 【裏リセマラ警告】') || message.startsWith('🚨 【裏リセマラ停止】')) {
      el('reroll-plan-status').textContent = message;
      if (typeof window.relicDesktop?.playNotifySound !== 'function') playRerollNotificationSound('error');
    } else if (message.startsWith('当たり遺物 #')) {
      const idx = Number(message.match(/^当たり遺物 #(\d+)/)?.[1]);
      if (Number.isInteger(idx) && idx > matchCount) updateMatchBadge(idx);
      appendMatchSummary(message);
      if (typeof window.relicDesktop?.playNotifySound !== 'function') playRerollNotificationSound('match');
      scheduleMatchHistoryRefresh();
    }
    el('reroll-run-log').textContent += message + '\n';
    if (cycleRunning) el('reroll-plan-status').textContent = matchCount > 0 && !message.includes('現在の当たり：') ? `${message}（現在の当たり：${matchCount}回）` : message;
  });

  renderRerollTarget();
  el('reroll-plan-open').click();
})();
