'use strict';
if (window.relicDesktop) (() => {
  const workspace = document.querySelector('.workspace');
  const intro = document.querySelector('.intro');
  const planner = document.createElement('section');
  planner.id = 'planner-pane';
  workspace.before(planner); planner.append(workspace);

  const automation = document.createElement('section');
  automation.id = 'automation-pane';
  automation.hidden = false;
  const patternSummary = document.getElementById('reroll-live-summary');
  const targetSettings = document.getElementById('target-settings');
  const damageCalc = planner.querySelector('.damage-calculator');
  if (patternSummary) {
    patternSummary.classList.add('reroll-pattern-overview');
    patternSummary.hidden = false;
  }
  const quick = document.createElement('div'); quick.className = 'automation-quick-settings'; quick.hidden = true; automation.append(quick);
  const targetPanel = document.getElementById('target-open')?.closest('.target-panel'); if (targetPanel) { quick.append(targetPanel); targetPanel.hidden = true; }
  const rerollPanel = document.getElementById('reroll-plan-dialog')?.closest('.target-panel');
  const sectionHead = document.querySelector('.automation-section-head');
  if (sectionHead) automation.append(sectionHead);
  const splitGrid = document.createElement('div');
  splitGrid.className = 'automation-split-grid';
  const leftCol = document.createElement('div');
  leftCol.className = 'automation-col-left';
  const rightCol = document.createElement('div');
  rightCol.className = 'automation-col-right';
  if (targetSettings) {
    const resetBtn = document.getElementById('target-reset');
    const patternTools = targetSettings.querySelector('.target-pattern-tools');
    if (resetBtn && patternTools) {
      resetBtn.textContent = 'クリア';
      resetBtn.title = 'このパターンの条件をクリア';
      patternTools.append(resetBtn);
    }
    leftCol.append(targetSettings);
  }
  if (rerollPanel) rightCol.append(rerollPanel);
  splitGrid.append(leftCol, rightCol);
  automation.append(splitGrid);
  const tools = document.createElement('details'); tools.className = 'automation-tools'; tools.hidden = true; tools.innerHTML = '<summary>個別ツール（フィルター・画像認識）</summary>';
  for (const id of ['filter-auto-open', 'candidate-scan-open', 'ocr-open']) {
    const panel = document.getElementById(id)?.closest('.target-panel'); if (panel) tools.append(panel);
  }
  const adv = automation.querySelector('.reroll-advanced');
  if (adv) adv.hidden = true;
  const utilityGroup = document.createElement('div'); utilityGroup.className = 'automation-utility-group';
  automation.querySelector('.reroll-controls')?.append(utilityGroup);
  for (const item of [adv, automation.querySelector('.reroll-log-details'), tools]) {
    if (item) utilityGroup.append(item);
  }
  if (damageCalc) {
    damageCalc.after(automation);
  } else {
    const bottomSettings = planner.querySelector('.bottom-settings');
    if (bottomSettings) bottomSettings.before(automation);
    else planner.append(automation);
  }
  const nav = document.createElement('div'); nav.className = 'app-tabs'; nav.hidden = true;
  nav.innerHTML = '<button id="planner-tab" type="button" role="tab" aria-controls="planner-pane" aria-selected="true">理想遺物</button><button id="automation-tab" type="button" role="tab" aria-controls="automation-pane" aria-selected="true">自動リセマラ</button>';
  planner.before(nav);
  if (intro) intro.hidden = false;
  window.dispatchEvent(new Event('automation-tab-open'));
})();
