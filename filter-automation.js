'use strict';
if (window.relicDesktop) (() => {
  const panel = document.createElement('section'); panel.className = 'target-panel';
  panel.innerHTML = '<div><p class="eyebrow">GAME FILTER</p><h2>ゲーム内フィルターを自動設定</h2><p>保存した色・大きさ・効果3枠を、ゲームのフィルター画面に入力します。</p></div><button id="filter-auto-open" type="button">自動設定を開く</button>';
  document.querySelector('.workspace').before(panel);
  const dialog = document.createElement('dialog'); dialog.id = 'filter-auto-dialog';
  dialog.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">GAME FILTER</p><h2>ゲーム内フィルターを自動設定</h2></div><button class="icon-button" id="filter-auto-close" type="button" aria-label="自動設定を閉じる">×</button></div><p class="target-help">先に「狙う遺物の条件」を保存し、ゲームでフィルター画面を開いてください。開始すると「1」で全条件を解除して入力します。移動は矢印、決定はF、戻るはQの設定に対応します。現在は16:9画面向けです。</p><label>ゲームのウィンドウ<select id="filter-auto-window"></select></label><button id="filter-auto-refresh" type="button">ウィンドウを再取得</button><div id="filter-auto-plan"></div><p class="target-help">開始から5秒後にゲームへ切り替えます。F8で緊急停止できます。別のウィンドウへ切り替えた場合も停止します。開始時だけ画面を確認し、その後は30ミリ秒間隔のマクロを再生します。入力後はフィルター画面を開いたままにします。</p><div class="target-actions"><button id="filter-auto-start" class="primary" type="button" disabled>保存した条件で自動設定</button><button id="filter-auto-stop" type="button" disabled>停止（F8）</button></div><p id="filter-auto-status" role="status"></p><pre id="filter-auto-log" aria-live="polite"></pre>`;
  document.body.append(dialog);
  dialog.querySelector('#filter-auto-plan').insertAdjacentHTML('beforebegin', '<fieldset class="filter-pattern-selection"><legend>同時に探すパターン（複数選択可）</legend><div id="filter-auto-pattern"></div></fieldset><p class="target-help">選んだパターンを取りこぼさない広めの条件を入力します。別パターン同士を組み合わせた候補も表示されるため、表示されたすべてが当たりになるわけではありません。</p>');
  const el = id => document.getElementById(id);
  let target = null, patterns = [], ready = false, running = false, planRequest = 0;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function updateButton() { el('filter-auto-start').disabled = running || !ready || !el('filter-auto-window').value; }
  async function refresh() {
    el('filter-auto-window').replaceChildren(); updateButton();
    try {
      const windows = await window.relicDesktop.filterWindows();
      for (const item of windows) el('filter-auto-window').add(new Option(item.name, item.id));
      if (!windows.length) el('filter-auto-status').textContent = 'ナイトレインが見つかりません。ゲーム起動後に再取得してください。';
      updateButton();
    } catch (error) { el('filter-auto-status').textContent = error.message; }
  }
  el('filter-auto-open').onclick = async () => {
    if (running) { dialog.showModal(); return; }
    ready = false; el('filter-auto-status').textContent = ''; el('filter-auto-log').textContent = ''; el('filter-auto-plan').replaceChildren(); dialog.showModal();
    try {
      const saved = JSON.parse(localStorage.getItem('nightreign.relic.target.v1'));
      if (!saved) throw new Error('先に「狙う遺物の条件」を設定して保存してください。');
      patterns = activeRelicPatterns(saved);
      el('filter-auto-pattern').innerHTML=patterns.map((pattern,index)=>`<label><input type="checkbox" value="${index}" checked><span>${escape(pattern.name)}</span></label>`).join('');
      if (!patterns.length) throw new Error('オンのパターンがありません。条件設定でオンにしてください。');
      await renderPattern();
    } catch (error) { el('filter-auto-status').textContent = error.message; }
    await refresh();
  };
  async function renderPattern() {
    const request = ++planRequest;
    ready = false; el('filter-auto-plan').replaceChildren(); updateButton();
    try {
      const selected = {patterns:[...el('filter-auto-pattern').querySelectorAll('input:checked')].map(input=>patterns[Number(input.value)])};
      if(!selected.patterns.length)throw new Error('探すパターンを1つ以上選択してください。');
      const plan = await window.relicDesktop.filterPlan(selected);
      if (request !== planRequest) return;
      target = selected;
      el('filter-auto-plan').innerHTML = `<p>色：${escape(plan.colors.join(' ／ ') || '指定なし')} ／ 大きさ：${escape(plan.sizes.join(' ／ ') || '指定なし')}</p>${plan.groups.map(group => `<section><h3>効果${group.slot + 1}（どれか1つ）</h3><p>${group.items.length ? group.items.map(item => escape(item.category) + ' → ' + escape(item.item)).join('<br>') : '指定なし'}</p></section>`).join('')}<p class="target-help">${plan.notes.map(note => escape(note)).join('<br>')}</p>`;
      ready = true;
    } catch (error) { el('filter-auto-status').textContent = error.message; }
    updateButton();
  }
  el('filter-auto-pattern').onchange = renderPattern;
  el('filter-auto-refresh').onclick = refresh; el('filter-auto-window').onchange = updateButton;
  el('filter-auto-close').onclick = () => { if (!running) dialog.close(); };
  dialog.addEventListener('cancel', event => { if (running) { event.preventDefault(); window.relicDesktop.stopFilter(); } });
  window.relicDesktop.onFilterLog(message => { el('filter-auto-log').textContent += message + '\n'; });
  el('filter-auto-start').onclick = async () => {
    if (running || !ready) return;
    running = true; updateButton(); el('filter-auto-stop').disabled = false; el('filter-auto-refresh').disabled = el('filter-auto-window').disabled = true; el('filter-auto-log').textContent = ''; el('filter-auto-status').textContent = '開始準備中…';
    for(const input of el('filter-auto-pattern').querySelectorAll('input'))input.disabled=true;
    try { await window.relicDesktop.applyFilter(target, el('filter-auto-window').value); el('filter-auto-status').textContent = 'マクロの入力が完了しました。ゲーム画面で条件を確認してください。'; }
    catch (error) { el('filter-auto-status').textContent = error.message; }
    finally { running = false; for(const input of el('filter-auto-pattern').querySelectorAll('input'))input.disabled=false; el('filter-auto-stop').disabled = true; el('filter-auto-refresh').disabled = el('filter-auto-window').disabled = false; updateButton(); }
  };
  el('filter-auto-stop').onclick = () => window.relicDesktop.stopFilter();
})();
