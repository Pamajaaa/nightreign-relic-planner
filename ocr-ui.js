'use strict';
if (window.relicDesktop) (() => {
  const panel = document.createElement('section');
  panel.className = 'target-panel';
  panel.innerHTML = '<div><p class="eyebrow">IMAGE RECOGNITION</p><h2>遺物の画像認識</h2><p>スクリーンショットや動画の1コマから、遺物効果を読み取って確認します。</p></div><button id="ocr-open" type="button">画像認識を試す</button>';
  document.querySelector('.workspace').before(panel);
  const dialog = document.createElement('dialog');
  dialog.id = 'ocr-dialog';
  dialog.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">IMAGE RECOGNITION</p><h2>遺物の画像認識</h2></div><button class="icon-button" id="ocr-close" type="button" aria-label="画像認識を閉じる">×</button></div>
    <p class="ocr-help">画像・動画はこのPC内で処理します。遺物効果の文字だけを枠で囲んでください。アイコンやタイトルは範囲に含めない方が読み取りやすくなります。</p>
    <label class="ocr-file-label">画像・動画を選択<input id="ocr-file" type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"></label>
    <div id="ocr-video-controls" hidden><label>動画の位置（秒）<input id="ocr-time" type="number" min="0" step="0.1" value="0"></label><input id="ocr-seek" type="range" min="0" step="0.1" value="0" aria-label="動画の位置"></div>
    <video id="ocr-video" muted playsinline preload="metadata" hidden></video>
    <label class="save-shop-label">判定内容<select id="ocr-mode"><option value="effects">遺物効果を読み取る</option><option value="title">タイトルの入力待ち画面を判定する</option></select></label><div class="ocr-controls"><label>読み取る場所<select id="ocr-preset"><option value="right">遺物儀式：右下の遺物</option><option value="left">遺物儀式：左下の装備中の遺物</option><option value="custom">画面をドラッグして範囲指定</option></select></label><button id="ocr-run" class="primary" type="button" disabled>この範囲を読み取る</button></div>
    <div class="ocr-preview"><canvas id="ocr-canvas" aria-label="ドラッグして読み取り範囲を指定"></canvas><p id="ocr-placeholder">画像または動画を選ぶとプレビューが表示されます。</p></div>
    <p id="ocr-status" role="status" aria-live="polite"></p><div id="ocr-results"></div>
    <p class="ocr-help">認識結果は確認用です。補正候補は誤る場合があります。色・大きさの自動認識と、自動リセマラの判定にはまだ接続していません。</p>
    <button id="ocr-export" type="button" disabled>認識結果を書き出す</button>`;
  document.body.append(dialog);
  const el = id => document.getElementById(id);
  const canvas = el('ocr-canvas'), context = canvas.getContext('2d');
  const source = document.createElement('canvas'), sourceContext = source.getContext('2d');
  let url, image, kind, busy = false, result = null, start = null, generation = 0, videoInitialized = false;
  let region = { x: 1477 / 2560, y: 1074 / 1440, w: 900 / 2560, h: 239 / 1440 };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function clearResult() { result = null; el('ocr-results').replaceChildren(); el('ocr-export').disabled = true; }
  function draw() {
    if (!source.width || !kind) return;
    canvas.width = source.width; canvas.height = source.height;
    context.drawImage(source, 0, 0);
    if (el('ocr-mode').value === 'title') return;
    context.fillStyle = '#0007'; context.fillRect(0, 0, canvas.width, canvas.height);
    const x = region.x * canvas.width, y = region.y * canvas.height, w = region.w * canvas.width, h = region.h * canvas.height;
    context.drawImage(source, x, y, w, h, x, y, w, h);
    context.strokeStyle = '#e5c575'; context.lineWidth = Math.max(2, canvas.width / 550); context.strokeRect(x, y, w, h);
  }
  function frame() {
    const media = kind === 'video' ? el('ocr-video') : image;
    const width = kind === 'video' ? media.videoWidth : media.naturalWidth;
    const height = kind === 'video' ? media.videoHeight : media.naturalHeight;
    if (!width || !height) return;
    const scale = Math.min(1, 4096 / width, 2160 / height);
    source.width = Math.round(width * scale); source.height = Math.round(height * scale);
    sourceContext.drawImage(media, 0, 0, source.width, source.height);
    el('ocr-placeholder').hidden = true; canvas.hidden = false;
    el('ocr-run').disabled = busy; clearResult(); draw();
  }
  el('ocr-open').onclick = () => dialog.showModal();
  el('ocr-close').onclick = () => dialog.close();
  el('ocr-file').onchange = async event => {
    const file = event.target.files[0]; if (!file || busy) return;
    generation++; videoInitialized = false; clearResult(); el('ocr-status').textContent = ''; el('ocr-run').disabled = true;
    if (url) URL.revokeObjectURL(url);
    el('ocr-video').pause(); url = URL.createObjectURL(file);
    if (file.type.startsWith('video/')) {
      kind = 'video'; el('ocr-video-controls').hidden = false;
      el('ocr-video').src = url;
    } else {
      kind = 'image'; el('ocr-video-controls').hidden = true; image = new Image();
      image.onload = frame;
      image.onerror = () => { el('ocr-status').textContent = '画像を開けませんでした。PNG・JPEG・WebPで試してください。'; };
      image.src = url;
    }
  };
  el('ocr-video').onloadedmetadata = () => {
    const duration = el('ocr-video').duration;
    if (!Number.isFinite(duration)) return;
    el('ocr-seek').max = el('ocr-time').max = String(Math.max(0, duration - 0.05));
    el('ocr-time').value = el('ocr-seek').value = '0';
  };
  el('ocr-video').onloadeddata = () => { if (!videoInitialized && !busy) { videoInitialized = true; frame(); } };
  el('ocr-video').onerror = () => { el('ocr-status').textContent = 'この動画を開けませんでした。MP4かスクリーンショットで試してください。'; };
  function seek(value) {
    if (busy) return;
    const time = Math.max(0, Math.min(Number(el('ocr-seek').max), Number(value) || 0));
    el('ocr-time').value = el('ocr-seek').value = String(time);
    el('ocr-run').disabled = true; clearResult(); el('ocr-video').currentTime = time;
  }
  el('ocr-time').onchange = event => seek(event.target.value);
  el('ocr-seek').oninput = event => seek(event.target.value);
  el('ocr-video').onseeked = () => { videoInitialized = true; if (!busy) frame(); };
  el('ocr-preset').onchange = event => {
    if (event.target.value === 'right') region = { x: 1477 / 2560, y: 1074 / 1440, w: 900 / 2560, h: 239 / 1440 };
    if (event.target.value === 'left') region = { x: 360 / 2560, y: 1074 / 1440, w: 750 / 2560, h: 239 / 1440 };
    clearResult(); draw();
  };
  function point(event) { const rect = canvas.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }; }
  canvas.onpointerdown = event => { if (busy || !kind || el('ocr-mode').value === 'title') return; start = point(event); canvas.setPointerCapture(event.pointerId); el('ocr-preset').value = 'custom'; };
  canvas.onpointermove = event => {
    if (!start) return;
    const end = point(event);
    region = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), w: Math.abs(start.x - end.x), h: Math.abs(start.y - end.y) };
    clearResult(); draw();
  };
  canvas.onpointerup = canvas.onpointercancel = () => { start = null; };
  function lock(value) {
    busy = value;
    for (const id of ['ocr-file', 'ocr-time', 'ocr-seek', 'ocr-preset', 'ocr-run', 'ocr-mode']) el(id).disabled = value;
    if (!value && el('ocr-mode').value === 'title') el('ocr-preset').disabled = true;
  }
  el('ocr-mode').onchange = () => { clearResult(); el('ocr-status').textContent = ''; el('ocr-preset').disabled = el('ocr-mode').value === 'title'; el('ocr-run').textContent = el('ocr-mode').value === 'title' ? 'この画面を判定する' : 'この範囲を読み取る'; draw(); };
  el('ocr-run').onclick = async () => {
    if (busy || !kind) return;
    const titleMode = el('ocr-mode').value === 'title';
    if (!titleMode && (region.w * source.width < 30 || region.h * source.height < 12)) { el('ocr-status').textContent = '文字が収まる大きさの範囲を指定してください。'; return; }
    lock(true); clearResult(); el('ocr-status').textContent = 'このPCで認識中… 初回は日本語エンジンの準備に少し時間がかかります。';
    const currentGeneration = generation;
    try {
      const crop = document.createElement('canvas'); crop.width = titleMode ? source.width : Math.round(region.w * source.width); crop.height = titleMode ? source.height : Math.round(region.h * source.height);
      crop.getContext('2d').drawImage(source, titleMode ? 0 : Math.round(region.x * source.width), titleMode ? 0 : Math.round(region.y * source.height), crop.width, crop.height, 0, 0, crop.width, crop.height);
      const blob = await new Promise(resolve => crop.toBlob(resolve, 'image/png'));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const data = await (titleMode ? window.relicDesktop.classifyTitle(bytes) : window.relicDesktop.recognizeImage(bytes));
      if (currentGeneration !== generation) return;
      result = { ...data, mode: titleMode ? 'title' : 'effects', file: el('ocr-file').files[0]?.name, time: kind === 'video' ? el('ocr-video').currentTime : null, region: titleMode ? null : region };
      if (titleMode) {
        el('ocr-status').textContent = data.ready ? 'タイトルの入力待ち候補を検出しました。自動復元では2回連続で確認します。' : '復元を許可できる画面ではありません。';
        el('ocr-results').innerHTML = `<p>${escape(data.reason)}</p><p class="ocr-help">ロゴ類似度：${escape(data.logoSimilarity ?? '判定不可')} ／ 入力待ち表示の類似度：${escape(data.promptSimilarity ?? '判定不可')} ／ 右上の表示：${data.busy ? 'あり' : 'なし'}</p>`;
        el('ocr-export').disabled = false; return;
      }
      el('ocr-status').textContent = `効果 ${data.effects.length} 件・デメリット ${data.penalties.length} 件 ／ ${(data.elapsedMs / 1000).toFixed(1)} 秒。元画像と照らし合わせて確認してください。`;
      el('ocr-results').innerHTML = `<div class="ocr-result-table"><table><thead><tr><th>OCRの読み取り</th><th>効果一覧との照合</th><th>結果</th></tr></thead><tbody>${data.lines.map(line => `<tr><td>${escape(line.raw)}</td><td>${line.name ? escape(line.name) : `未確定${line.candidates.length ? '<small>候補：' + escape(line.candidates[0].name) + '</small>' : ''}`}</td><td>${line.kind === 'penalty' ? 'デメリット・' : ''}${{exact:'表記一致',corrected:'補正候補・要確認',unknown:'読取不明'}[line.status]}</td></tr>`).join('')}</tbody></table></div><details><summary>補正前の全文</summary><pre>${escape(data.rawText || '文字を検出できませんでした。範囲や動画の位置を変更して試してください。')}</pre></details>`;
      el('ocr-export').disabled = false;
    } catch (error) { el('ocr-status').textContent = `認識できませんでした：${error.message}`; }
    finally { lock(false); }
  };
  el('ocr-export').onclick = () => {
    if (!result) return;
    const download = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = download; link.download = 'nightreign-ocr-result.json'; link.click(); setTimeout(() => URL.revokeObjectURL(download), 1000);
  };
  canvas.hidden = true;
})();
