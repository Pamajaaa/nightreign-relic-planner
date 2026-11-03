'use strict';

// Each group needs its own effect occurrence; the displayed order is irrelevant.
function normalizeRelicTarget(target) {
  if (!target || !Array.isArray(target.groups) || target.groups.length !== 3 || !target.groups.every(group => Array.isArray(group) && group.every(name => typeof name === 'string'))) throw new Error('効果は3枠で指定してください。');
  const values = (plural, singular, allowed) => {
    let list = target[plural] !== undefined ? target[plural] : target[singular] ? [target[singular]] : [];
    if (plural === 'colors' && Array.isArray(list)) list = list.filter(value => value !== '白');
    if (!Array.isArray(list) || list.some(value => !allowed.includes(value))) throw new Error('色・大きさの条件が正しくありません。');
    return allowed.filter(value => list.includes(value));
  };
  const excluded = target.excludedPenalties ?? [];
  if (!Array.isArray(excluded) || excluded.some(name => typeof name !== 'string')) throw new Error('避けたいデメリットの条件が正しくありません。');
  const wanted = target.wantedPenalties ?? [];
  if (!Array.isArray(wanted) || wanted.some(name => typeof name !== 'string')) throw new Error('狙うデメリットの条件が正しくありません。');
  const relicType = target.relicType === 'normal' || target.relicType === 'deep' ? target.relicType : undefined;
  const poolLegacy = typeof target.poolLegacy === 'boolean' ? target.poolLegacy : undefined;
  return { ...(relicType ? { relicType } : {}), ...(poolLegacy !== undefined ? { poolLegacy } : {}), colors: values('colors', 'color', ['赤','青','黄','緑']), sizes: values('sizes', 'size', ['小','中','大']), groups: target.groups.map(group => [...new Set(group)]), excludedPenalties: [...new Set(excluded)], wantedPenalties: [...new Set(wanted)] };
}
function matchesRelicTarget(target, relic) {
  if (target?.enabled === false) return false;
  if (Array.isArray(target?.patterns)) return activeRelicPatterns(target).some(pattern => hasRelicConditions(pattern) && matchesRelicTarget(pattern, relic));
  target = normalizeRelicTarget(target);
  if (target.colors.length && !target.colors.includes(relic.color)) return false;
  if (target.sizes.length && !target.sizes.includes(relic.size)) return false;
  if (target.excludedPenalties.length && (!Array.isArray(relic.penalties) || relic.penalties.some(name => target.excludedPenalties.includes(name)))) return false;
  if (target.wantedPenalties.length && (!Array.isArray(relic.penalties) || !relic.penalties.some(name => target.wantedPenalties.includes(name)))) return false;
  const groups = target.groups.filter(group => group.length);
  function assign(index, used) {
    if (index === groups.length) return true;
    return relic.effects.some((effect, position) => {
      if (used.has(position) || !groups[index].includes(effect)) return false;
      const next = new Set(used); next.add(position);
      return assign(index + 1, next);
    });
  }
  return assign(0, new Set());
}

function hasRelicConditions(pattern) { return Boolean(pattern.colors.length || pattern.sizes.length || pattern.excludedPenalties.length || (pattern.wantedPenalties && pattern.wantedPenalties.length) || pattern.groups.some(group => group.length)); }
function normalizeRelicPatterns(target) {
  const list = Array.isArray(target?.patterns) ? target.patterns : [target];
  if (!list.length || list.length > 100) throw new Error('パターンは1〜100件で設定してください。');
  return list.map((pattern, index) => {
    if (pattern?.enabled !== undefined && typeof pattern.enabled !== 'boolean') throw new Error('パターンのオン・オフ設定が正しくありません。');
    return { ...normalizeRelicTarget(pattern), enabled: pattern.enabled !== false, name: typeof pattern.name === 'string' && pattern.name.trim() ? pattern.name.trim().slice(0, 80) : `パターン${index + 1}` };
  });
}
function activeRelicPatterns(target) { return normalizeRelicPatterns(target).filter(pattern => pattern.enabled); }
function reorderRelicPatterns(patterns, fromIndex, toIndex) {
  const list = [...patterns];
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length || fromIndex === toIndex) return list;
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
  return list;
}
if (typeof module !== 'undefined') module.exports = { matchesRelicTarget, normalizeRelicTarget, normalizeRelicPatterns, activeRelicPatterns, hasRelicConditions, reorderRelicPatterns };

if (typeof document !== 'undefined') (() => {
  const storageKey = 'nightreign.relic.target.v1';
  const effectFamilies = new Map();
  for (const effect of new Map(EFFECTS.filter(effect => !effect.uniqueOnly).map(effect => [effect.name, effect])).values()) {
    const key = effect.category + ':' + effect.name.normalize('NFKC').replace(/\+\d+$/, '');
    if (!effectFamilies.has(key)) effectFamilies.set(key, []);
    effectFamilies.get(key).push(effect);
  }
  const tier = effect => Number(effect.name.normalize('NFKC').match(/\+(\d+)$/)?.[1] || 0);
  const effects = [...effectFamilies.values()].flatMap(family => family.sort((a, b) => tier(a) - tier(b)));
  const known = new Set(effects.map(effect => effect.name));
  const empty = () => ({ colors: [], sizes: [], groups: [[], [], []], excludedPenalties: [], wantedPenalties: [] });
  let savedPatterns = [{ ...empty(), name: 'パターン1' }], draftPatterns = [], activePattern = 0, editing = empty(), activeGroup = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved) { const migrated = normalizeRelicPatterns(saved); if (migrated.every(pattern => pattern.groups.every(group => group.every(name => known.has(name))) && pattern.excludedPenalties.every(name => DEMERITS.includes(name)) && (pattern.wantedPenalties || []).every(name => DEMERITS.includes(name)))) savedPatterns = migrated; }
  } catch {}
  const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalize = text => text.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 96)).replace(/上昇/g, '');
  const panel = document.createElement('section');
  panel.className = 'target-panel';
  panel.hidden = !window.relicDesktop;
  panel.innerHTML = `<div><p class="eyebrow">TARGET RELIC</p><h2>遺物を探す</h2></div><button id="target-open" type="button">条件を設定</button>`;
  document.querySelector('.workspace').before(panel);
  const dialog = document.createElement('section');
  dialog.id = 'target-settings';
  dialog.open = true;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => {
    if (effectDialog.open) effectDialog.close();
    if (penaltyDialog.open) penaltyDialog.close();
    if (wantedPenaltyDialog.open) wantedPenaltyDialog.close();
    dialog.dispatchEvent(new Event('close'));
  };
  dialog.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">TARGET RELIC</p><h2>遺物を探す</h2></div><button class="icon-button" id="target-close" type="button" aria-label="条件設定を閉じる" hidden>×</button></div>
    <section class="target-patterns"><div id="target-pattern-tabs" role="tablist" aria-label="条件パターン"></div><div class="target-pattern-tools"><label>名前<input id="target-pattern-name" maxlength="80" aria-label="パターン名"></label><button id="target-pattern-add" type="button">＋ パターン追加</button><button id="target-save" class="primary" type="button">条件を保存</button><button id="target-pattern-copy" type="button">複製</button><button id="target-pattern-delete" type="button">削除</button></div><p id="target-status" role="status"></p></section>
    <div class="target-selects"><fieldset id="target-relic-type" class="target-values target-relic-type-values"><legend>遺物の種類<small>確率計算・対象切替</small></legend><button type="button" data-relic-type="normal" data-pool-legacy="false">通常遺物</button><button type="button" data-relic-type="normal" data-pool-legacy="true" title="「景色の原石（以前のバージョン）」の抽選プール（Ver.1.02まで・学者/葬儀屋や魔術/祈祷変更等を除外）">通常遺物（1.03前）</button><button type="button" data-relic-type="deep" data-pool-legacy="false">深層遺物</button><button type="button" data-relic-type="deep" data-pool-legacy="true" title="「昏景の原石（以前のバージョン）」の抽選プール（Ver.1.02まで・学者/葬儀屋等を除外）">深層遺物（1.03前）</button></fieldset>${[['color','遺物の色',['赤','青','黄','緑']],['size','遺物の大きさ',['小','中','大']]].map(([kind,title,values]) => `<fieldset id="target-${kind}" class="target-values"><legend>${title}<small>複数選択可</small></legend>${values.map(value => `<label><input type="checkbox" value="${value}"><span data-color="${kind === 'color' ? value : ''}">${value}</span></label>`).join('')}<button type="button" data-target-any="${kind}">指定なし</button></fieldset>`).join('')}</div>
    <div id="target-groups"></div>
    <div class="target-slot-row target-wanted-penalty-row"><button type="button" id="target-wanted-penalty-open" class="target-effect-slot target-wanted-penalty-slot" aria-haspopup="dialog"><span class="target-slot-number">狙うデメリット</span><span id="target-wanted-penalty-summary" class="target-slot-value"></span><span class="target-slot-edit">選択 ›</span></button><button type="button" id="target-wanted-penalty-reset" class="effect-remove target-slot-reset" aria-label="狙うデメリットだけリセット" title="狙うデメリットだけリセット">×</button></div>
    <div class="target-slot-row target-penalty-row"><button type="button" id="target-penalty-open" class="target-effect-slot target-penalty-slot" aria-haspopup="dialog"><span class="target-slot-number">避けたいデメリット</span><span id="target-penalty-summary" class="target-slot-value"></span><span class="target-slot-edit">選択 ›</span></button><button type="button" id="target-penalty-reset" class="effect-remove target-slot-reset" aria-label="避けたいデメリットだけリセット" title="避けたいデメリットだけリセット">×</button></div>
    <div id="target-pattern-odds" class="target-pattern-odds"></div>
    <section class="target-effect-picker"><h3 id="target-group-title"></h3><div class="target-picker-tools"><label class="search-box"><span>⌕</span><input id="target-search" aria-label="候補の効果を検索" placeholder="効果名・読みで検索" type="search"></label><label>遺物の種類<select id="target-type"><option value="">すべて</option><option value="normal">通常遺物</option><option value="deep">深層遺物</option></select></label><label><input type="checkbox" id="target-selected-only">選択済みだけ表示</label></div><select id="target-category" hidden><option value="">すべてのカテゴリ</option>${[...new Set(effects.map(effect => effect.category))].map(category => `<option>${escape(category)}</option>`).join('')}</select><div class="target-picker-layout"><nav id="target-categories" aria-label="効果のカテゴリ"></nav><div class="target-picker-results"><div class="target-result-heading"><p id="target-result-count" aria-live="polite"></p><button type="button" id="target-clear-group">この枠を解除</button></div><div id="target-effects"></div></div></div></section>
    <div class="target-actions"><button id="target-reset" class="subtle" type="button">条件をクリア</button><button id="target-cancel" type="button" hidden>キャンセル</button></div>`;
  const damageCalc = document.querySelector('.damage-calculator');
  if (damageCalc) damageCalc.after(dialog);
  else document.body.append(dialog);
  const effectDialog = document.createElement('dialog');
  effectDialog.id = 'target-effect-dialog';
  effectDialog.innerHTML = '<div class="dialog-head"><h2 id="target-effect-dialog-title">効果の候補を選択</h2><button class="icon-button" id="target-effect-close" type="button" aria-label="候補選択を閉じる">×</button></div>';
  effectDialog.append(dialog.querySelector('.target-effect-picker'));
  document.body.append(effectDialog);
  const penaltyDialog = document.createElement('dialog');
  penaltyDialog.id = 'target-penalty-dialog';
  penaltyDialog.innerHTML = '<div class="dialog-head"><h2>避けたいデメリット</h2><button type="button" class="icon-button" id="target-penalty-close" aria-label="デメリット選択を閉じる">×</button></div><p class="target-help">選んだデメリットが1つでも含まれていたら除外します。複数選択できます。</p><div id="target-penalty-options"></div><div class="target-actions"><button type="button" id="target-penalty-clear">すべて解除</button><button type="button" id="target-penalty-done" class="primary">選択を完了</button></div>';
  document.body.append(penaltyDialog);
  const wantedPenaltyDialog = document.createElement('dialog');
  wantedPenaltyDialog.id = 'target-wanted-penalty-dialog';
  wantedPenaltyDialog.innerHTML = '<div class="dialog-head"><h2>狙うデメリット</h2><button type="button" class="icon-button" id="target-wanted-penalty-close" aria-label="狙うデメリット選択を閉じる">×</button></div><p class="target-help">選んだデメリットのうち、どれか1つ以上が含まれている遺物を狙います。複数選択できます。</p><div id="target-wanted-penalty-options"></div><div class="target-actions"><button type="button" id="target-wanted-penalty-clear">すべて解除</button><button type="button" id="target-wanted-penalty-done" class="primary">選択を完了</button></div>';
  document.body.append(wantedPenaltyDialog);
  const el = id => document.getElementById(id);
  function getEffectSummary(name) {
    const effect = typeof EFFECTS !== 'undefined' ? EFFECTS.find(e => e.name === name) : null;
    return effect?.summary || '';
  }
  function getEffectTooltipAttrs(name) {
    const sum = getEffectSummary(name);
    return sum ? ` data-tooltip="${escape(sum)}" data-tooltip-name="${escape(name)}"` : '';
  }
  function getEffectOddsBadge(name, preferType, isLegacy = false) {
    if (!window.RelicOddsData) return '';
    const id = window.RelicOddsData.nameToId[name];
    if (!id) return '';
    const odds = window.RelicOddsData.singleOdds[id];
    if (!odds) return '';
    const n = isLegacy ? odds.normalLegacyOneIn : odds.normalOneIn;
    const d = isLegacy ? odds.deepLegacyOneIn : odds.deepOneIn;
    const nLatest = odds.normalOneIn, dLatest = odds.deepOneIn;
    const verLabel = isLegacy ? '（Ver.1.02以前）' : '';
    if (preferType === 'normal') {
      if (!n && isLegacy && nLatest) {
        return `<span class="target-effect-odds is-zero" title="Ver.1.03で追加された効果のため、以前のバージョン（Ver.1.02）では出現しません（最新Ver.1.03では約 ${nLatest.toLocaleString()} 個に 1 個）">Ver.1.03追加（以前では不可）</span>`;
      }
      if (!n) return `<span class="target-effect-odds" title="深層遺物（バザー）${verLabel}での単体出現率">深層: 約 ${(d || dLatest || 0).toLocaleString()} 個に 1 個</span>`;
      return `<span class="target-effect-odds" title="通常遺物（バザー）${verLabel}での単体出現率">約 ${n.toLocaleString()} 個に 1 個</span>`;
    }
    if (preferType === 'deep') {
      if (!d && isLegacy && dLatest) {
        return `<span class="target-effect-odds is-zero" title="Ver.1.03で追加された効果のため、以前のバージョン（Ver.1.02）では出現しません（最新Ver.1.03では約 ${dLatest.toLocaleString()} 個に 1 個）">Ver.1.03追加（以前では不可）</span>`;
      }
      if (!d) return `<span class="target-effect-odds" title="通常遺物（バザー）${verLabel}での単体出現率">通常: 約 ${(n || nLatest || 0).toLocaleString()} 個に 1 個</span>`;
      return `<span class="target-effect-odds" title="深層遺物（バザー）${verLabel}での単体出現率">約 ${d.toLocaleString()} 個に 1 個</span>`;
    }
    if (n && d) {
      return `<span class="target-effect-odds" title="通常: 約${n.toLocaleString()}個に1個 ／ 深層: 約${d.toLocaleString()}個に1個">通常: 約 ${n.toLocaleString()} ／ 深層: 約 ${d.toLocaleString()} 個に 1 個</span>`;
    } else if (n) {
      return `<span class="target-effect-odds" title="通常遺物（バザー）${verLabel}での出現率">約 ${n.toLocaleString()} 個に 1 個</span>`;
    } else if (d) {
      return `<span class="target-effect-odds" title="深層遺物（バザー）${verLabel}での出現率">深層: 約 ${d.toLocaleString()} 個に 1 個</span>`;
    } else if (isLegacy && (nLatest || dLatest)) {
      return `<span class="target-effect-odds is-zero" title="Ver.1.03で追加された効果のため、以前のバージョン（Ver.1.02）では出現しません">Ver.1.03追加</span>`;
    }
    return '';
  }
  const oddsHoursStorageKey = 'nightreign.relic.oddsHours.v1';
  let oddsHours = Math.max(0.1, Math.min(99999, Number(localStorage.getItem(oddsHoursStorageKey)) || 8));
  let oddsTypeOverride = null;
  let oddsLegacyOverride = null;
  let lastCalculatedOdds = null;
  function detectPatternTypeInfo(pat) {
    const groups = (pat.groups || []).filter(g => Array.isArray(g) && g.length > 0);
    const { nameToId, singleOdds } = window.RelicOddsData || {};
    if (!nameToId || !singleOdds) return { isDeep: false, isLegacy: false, canSwitch: true, hasNormalOnly: false, hasDeepOnly: false };
    const hasDeepOnly = groups.some(g => g.every(name => {
      const id = nameToId[name];
      return id && singleOdds[id]?.normalProb === 0 && singleOdds[id]?.deepProb > 0;
    }));
    const hasNormalOnly = groups.some(g => g.every(name => {
      const id = nameToId[name];
      return id && singleOdds[id]?.deepProb === 0 && singleOdds[id]?.normalProb > 0;
    }));
    let isDeep = false;
    const explicitType = oddsTypeOverride || pat.relicType || null;
    if (explicitType === 'deep') {
      isDeep = true;
    } else if (explicitType === 'normal') {
      isDeep = Boolean(hasDeepOnly && !oddsTypeOverride);
    } else {
      const hasPenalties = Boolean((pat.excludedPenalties && pat.excludedPenalties.length > 0) || (pat.wantedPenalties && pat.wantedPenalties.length > 0));
      if (hasDeepOnly) isDeep = true;
      else if (hasNormalOnly) isDeep = false;
      else if (hasPenalties) isDeep = true;
      else if (typeof pat.name === 'string' && pat.name.includes('深層')) isDeep = true;
      else if (typeof pat.name === 'string' && pat.name.includes('通常')) isDeep = false;
      else if (window.LedgerForge) {
        const nMax = Math.max(
          window.LedgerForge.calcPatternOdds(pat, false, nameToId, { legacy: false })?.prob || 0,
          window.LedgerForge.calcPatternOdds(pat, false, nameToId, { legacy: true })?.prob || 0
        );
        const dMax = Math.max(
          window.LedgerForge.calcPatternOdds(pat, true, nameToId, { legacy: false })?.prob || 0,
          window.LedgerForge.calcPatternOdds(pat, true, nameToId, { legacy: true })?.prob || 0
        );
        if (nMax > 0 || dMax > 0) {
          isDeep = dMax > nMax + 1e-12;
        } else {
          const shopEl = document.getElementById('reroll-shop');
          isDeep = shopEl ? (Number(shopEl.value) % 4) >= 2 : false;
        }
      } else {
        const shopEl = document.getElementById('reroll-shop');
        isDeep = shopEl ? (Number(shopEl.value) % 4) >= 2 : false;
      }
    }
    let isLegacy = false;
    if (oddsLegacyOverride !== null) {
      isLegacy = oddsLegacyOverride;
    } else if (typeof pat.poolLegacy === 'boolean') {
      isLegacy = pat.poolLegacy;
    } else if (window.LedgerForge) {
      const oddsLeg = window.LedgerForge.calcPatternOdds(pat, isDeep, nameToId, { legacy: true });
      const oddsNew = window.LedgerForge.calcPatternOdds(pat, isDeep, nameToId, { legacy: false });
      if (oddsLeg && oddsLeg.prob > 0 && (!oddsNew || oddsLeg.prob >= oddsNew.prob)) {
        isLegacy = true;
      } else {
        isLegacy = false;
      }
    }
    return { isDeep, isLegacy, canSwitch: true, hasNormalOnly, hasDeepOnly };
  }
  function getCurrentRerollTimingOpts(hoursOverride) {
    const purchaseCount = Number(document.getElementById('reroll-purchase-count')?.value) || 30;
    const hours = hoursOverride ?? oddsHours;
    const timing = {
      titleWaitSec: Number(document.getElementById('reroll-title-wait')?.value ?? 8),
      postRestoreWaitSec: Number(document.getElementById('reroll-restore-wait')?.value ?? 0),
      resumeFinalWaitSec: Number(document.getElementById('reroll-resume-final')?.value ?? 1),
      resumeExtraSec: Number(document.getElementById('reroll-resume-extra')?.value ?? 1),
      purchaseTransitionMs: Number(document.getElementById('reroll-purchase-wait')?.value ?? 200)
    };
    return { hours, purchaseCount, timing };
  }
  function renderPatternOdds() {
    const container = el('target-pattern-odds');
    if (!container) return;
    if (!window.LedgerForge || !window.RelicOddsData) {
      container.innerHTML = '';
      lastCalculatedOdds = null;
      return;
    }
    const savedHours = Number(localStorage.getItem(oddsHoursStorageKey));
    if (Number.isFinite(savedHours) && savedHours > 0) oddsHours = Math.max(0.1, Math.min(99999, savedHours));
    const hasAnyCondition = editing.groups.some(g => g.length > 0) || (editing.colors && editing.colors.length > 0) || (editing.sizes && editing.sizes.length > 0) || (editing.excludedPenalties && editing.excludedPenalties.length > 0) || (editing.wantedPenalties && editing.wantedPenalties.length > 0);
    if (!hasAnyCondition) {
      lastCalculatedOdds = null;
      container.innerHTML = '<div class="target-odds-summary is-empty"><span class="target-odds-hint">効果・色・デメリット条件を設定すると、出現確率と期待値がここに表示されます。</span></div>';
      return;
    }
    const { nameToId } = window.RelicOddsData;
    const forge = window.LedgerForge;
    const typeInfo = detectPatternTypeInfo(editing);
    const isDeepPattern = typeInfo.isDeep;
    const isLegacy = typeInfo.isLegacy;
    const isCollector = document.getElementById('reroll-shop-source')?.value === 'collector';
    const odds = forge.calcPatternOdds(editing, isDeepPattern, nameToId, { legacy: isLegacy, collector: isCollector });
    const altOdds = forge.calcPatternOdds(editing, isDeepPattern, nameToId, { legacy: !isLegacy, collector: isCollector });
    const wantedArr = editing.wantedPenalties || [];
    const excludedArr = editing.excludedPenalties || [];
    const effectiveWantedCount = wantedArr.filter(x => !excludedArr.includes(x)).length;
    if (!odds || odds.prob <= 0) {
      lastCalculatedOdds = null;
      const patternConflict = forge.findPatternConflict?.(editing, nameToId);
      const reasonText = (isLegacy && altOdds && altOdds.prob > 0)
        ? 'Ver.1.03で追加された効果（学者・葬儀屋・初期魔術/祈祷・通常遺物の武器種見つけやすさ）が含まれているため、「以前のバージョン（Ver.1.02）」では出現しません'
        : (typeInfo.hasDeepOnly && typeInfo.hasNormalOnly)
        ? '通常遺物専用の効果と深層遺物専用の効果が混在しているため、同時に出現しません'
        : patternConflict
        ? patternConflict.message
        : (wantedArr.length > 0 && !isDeepPattern)
        ? '通常遺物にはデメリット効果が付かないため、狙うデメリットを満たす遺物は出現しません（深層遺物で計算してください）'
        : (wantedArr.length > 0 && effectiveWantedCount === 0)
        ? '狙うデメリットがすべて「避けたいデメリット」にも含まれているため、条件を満たす遺物は出現しません'
        : (excludedArr.length >= 24 && isDeepPattern && odds?.sizeFilteredProb > 0)
        ? 'デメリット効果を全24種すべて除外しているため、デメリット付き深層遺物が出現しません'
        : isDeepPattern
        ? '指定した条件の組み合わせは同時に出現しないか、存在しません'
        : '通常遺物では同時に出現しない効果が含まれています（深層遺物をお選びください）';
      container.innerHTML = `
        <div class="target-odds-summary is-impossible">
          <div class="target-odds-headline">
            <span class="target-odds-badge is-warn">注意</span>
            <strong class="target-odds-value">${reasonText}</strong>
          </div>
        </div>`;
      return;
    }
    const finalProb = odds.prob;
    lastCalculatedOdds = { finalProb, baseProb: odds.baseProb };
    const totalOneIn = Math.max(1, Math.round(1 / finalProb));
    const timingOpts = getCurrentRerollTimingOpts(oddsHours);
    const stats8h = forge.calc8HourStats(finalProb, timingOpts);
    container.innerHTML = `
      <div class="target-odds-summary">
        <div class="target-odds-headline-grid">
          <div class="target-odds-headline">
            <span class="target-odds-badge">最終的な出現確率</span>
            <strong class="target-odds-value">約 ${totalOneIn.toLocaleString()} 個に 1 個</strong>
          </div>
          <div class="target-odds-8h-box">
            <label class="target-odds-8h-label" for="target-odds-hours">
              <input type="number" id="target-odds-hours" class="target-odds-hours-input" min="0.5" max="9999" step="0.5" value="${escape(String(oddsHours))}" aria-label="リセマラ時間（時間）"> 時間回したときの期待値
            </label>
            <strong class="target-odds-8h-value" id="target-odds-8h-value">約 ${stats8h.expectedCountStr}</strong>
            <span class="target-odds-8h-sep">／</span>
            <span class="target-odds-8h-hit-label">1個以上出る確率</span>
            <strong class="target-odds-8h-value" id="target-odds-8h-hitprob">${escape(stats8h.hitPercent8hStr)}</strong>
          </div>
        </div>
      </div>`;
  }
  function summary() {
    el('target-open').setAttribute('aria-label', `狙う遺物の条件を設定（${savedPatterns.length}パターン）`);
  }
  let snapshotPatterns = structuredClone(savedPatterns);
  let isInternalTargetChange = false;
  let toastTimer = null;
  function notify(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
    }
  }
  function setStatus(message, isSuccess = false) {
    const statusEl = el('target-status');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('is-success', Boolean(isSuccess && message));
  }
  function preparePatternsForSave(patterns) {
    for (const pat of patterns) {
      if (hasRelicConditions(pat)) {
        if (pat._autoDisabledEmpty) {
          pat.enabled = true;
          delete pat._autoDisabledEmpty;
        }
      } else if (patterns.length > 1 && pat.enabled !== false) {
        pat.enabled = false;
        pat._autoDisabledEmpty = true;
      }
    }
    return normalizeRelicPatterns({ patterns });
  }
  function serializePatternsForDirtyCheck(patterns) {
    try {
      const normalized = normalizeRelicPatterns({ patterns: structuredClone(patterns) });
      return JSON.stringify(normalized.map(p => ({
        name: p.name,
        relicType: p.relicType || null,
        poolLegacy: Boolean(p.poolLegacy),
        colors: p.colors,
        sizes: p.sizes,
        groups: p.groups,
        wantedPenalties: p.wantedPenalties || [],
        excludedPenalties: p.excludedPenalties || []
      })));
    } catch {
      return '';
    }
  }
  function updateTargetSaveState() {
    const saveBtn = el('target-save');
    if (!saveBtn) return;
    const isDirty = serializePatternsForDirtyCheck(draftPatterns) !== serializePatternsForDirtyCheck(snapshotPatterns);
    saveBtn.disabled = !isDirty;
  }
  function autoSavePatterns() {
    try {
      const normalized = preparePatternsForSave(draftPatterns);
      localStorage.setItem(storageKey, JSON.stringify({ patterns: normalized }));
      savedPatterns = structuredClone(normalized);
      summary();
      updateTargetSaveState();
      isInternalTargetChange = true;
      window.dispatchEvent(new CustomEvent('relic-target-changed'));
      isInternalTargetChange = false;
    } catch {}
  }
  function getGroupCombinedOddsBadge(group, isDeep, isLegacy = false) {
    if (!Array.isArray(group) || group.length < 2 || !window.RelicOddsData || !window.LedgerForge) return '';
    const { nameToId } = window.RelicOddsData;
    const res = window.LedgerForge.calcPatternOdds({ groups: [group, [], []] }, isDeep, nameToId, { legacy: isLegacy });
    if (!res || res.prob <= 0) return '';
    const oneIn = Math.max(1, Math.round(1 / res.prob));
    const pct = (res.prob * 100).toFixed(res.prob < 0.01 ? 2 : 1);
    return `<span class="target-effect-odds target-slot-combined-odds" title="この枠の候補いずれか1つ以上が付く合算確率（約${pct}%）">枠合算: 約 ${oneIn.toLocaleString()} 個に 1 個</span>`;
  }
  function renderGroups() {
    if (!Array.isArray(editing.wantedPenalties)) editing.wantedPenalties = [];
    const typeInfo = detectPatternTypeInfo(editing);
    const isDeepPattern = typeInfo.isDeep;
    const isLegacy = typeInfo.isLegacy;
    const preferType = isDeepPattern ? 'deep' : 'normal';
    el('target-groups').innerHTML = editing.groups.map((group, index) => {
      let valueHtml = 'ーーー';
      if (group.length) {
        const combinedBadge = getGroupCombinedOddsBadge(group, isDeepPattern, isLegacy);
        valueHtml = group.map((name, effIdx) => {
          const tip = getEffectTooltipAttrs(name);
          const badge = getEffectOddsBadge(name, preferType, isLegacy);
          return `<span class="target-effect-line"><span class="target-effect-tag"${tip}><span class="target-effect-name">${escape(name)}</span>${badge}<span class="target-effect-remove" role="button" tabindex="-1" data-remove-group-effect="${index}" data-remove-effect-idx="${effIdx}" title="「${escape(name)}」を外す" aria-label="「${escape(name)}」を外す">×</span></span></span>`;
        }).join('') + (combinedBadge ? `<span class="target-effect-line">${combinedBadge}</span>` : '');
      }
      const copyIconSvg = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="5.5" y="5.5" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 5.5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
      const copyTitle = group.length ? `効果${index + 1}を他の枠へドラッグ＆ドロップで複製（クリックで空き枠へ複製）` : '効果を選択すると他の枠へ複製できます';
      return `<div class="target-slot-row" data-slot-row="${index}"><button class="target-effect-slot" type="button" data-target-group="${index}" aria-haspopup="dialog"><span class="target-slot-number"><span>効果${index + 1}</span><span class="target-slot-copy" role="button" tabindex="-1" data-copy-group="${index}" title="${copyTitle}" aria-label="効果${index + 1}を複製" aria-disabled="${!group.length}">${copyIconSvg}</span></span><span class="target-slot-value ${group.length ? '' : 'is-empty'}">${valueHtml}</span><span class="target-slot-edit">選択 ›</span></button><button class="effect-remove target-slot-reset" type="button" data-target-reset-group="${index}" title="効果${index + 1}だけリセット" aria-label="効果${index + 1}だけリセット" ${group.length ? '' : 'disabled'}>×</button></div>`;
    }).join('');
    const groupTitleText = `効果${activeGroup + 1}の候補を選択（複数選択可）`;
    el('target-group-title').textContent = groupTitleText;
    if (el('target-effect-dialog-title')) el('target-effect-dialog-title').textContent = groupTitleText;
    el('target-wanted-penalty-summary').innerHTML = editing.wantedPenalties.length ? editing.wantedPenalties.map(name => {
      const tip = typeof PENALTY_NOTES !== 'undefined' && PENALTY_NOTES[name] ? ` data-tooltip="${escape(PENALTY_NOTES[name])}" data-tooltip-name="${escape(name)}"` : '';
      return `<span class="target-wanted-penalty-tag"${tip}>${escape(name)}</span>`;
    }).join('') : 'ーーー';
    el('target-wanted-penalty-reset').disabled = !editing.wantedPenalties.length;
    el('target-penalty-summary').innerHTML = editing.excludedPenalties.length ? editing.excludedPenalties.map(name => {
      const tip = typeof PENALTY_NOTES !== 'undefined' && PENALTY_NOTES[name] ? ` data-tooltip="${escape(PENALTY_NOTES[name])}" data-tooltip-name="${escape(name)}"` : '';
      return `<span class="target-penalty-tag"${tip}>${escape(name)}</span>`;
    }).join('') : 'ーーー';
    el('target-penalty-reset').disabled = !editing.excludedPenalties.length;
    updateRelicTypeButtons();
    renderPatternOdds();
  }
  function renderEffects() {
    const categoryScroll = el('target-categories').scrollTop;
    const words = normalize(el('target-search').value).trim().split(/\s+/).filter(Boolean);
    const category = el('target-category').value;
    const type = el('target-type').value;
    const typeInfo = detectPatternTypeInfo(editing);
    const candidates = effects.filter(effect => (!type || EFFECTS.some(item => item.name === effect.name && item.type === type)) && (!el('target-selected-only').checked || editing.groups[activeGroup].includes(effect.name)) && words.every(word => normalize(effect.name + ' ' + effect.category + ' ' + (EFFECT_READINGS.effects[effect.id] || '')).includes(word)));
    el('target-categories').innerHTML = ['', ...new Set(effects.map(effect => effect.category))].map(value => `<button type="button" data-target-category="${escape(value)}" aria-pressed="${category === value}">${escape(value || 'すべて')}<small>${candidates.filter(effect => !value || effect.category === value).length}</small></button>`).join('');
    const filtered = candidates.filter(effect => !category || effect.category === category);
    el('target-result-count').textContent = `${filtered.length} 件 ／ この枠で ${editing.groups[activeGroup].length} 件選択中`;
    const otherGroups = editing.groups
      .map((g, idx) => ({ g, idx }))
      .filter(item => item.idx !== activeGroup && Array.isArray(item.g) && item.g.length > 0);
    el('target-effects').innerHTML = filtered.length ? filtered.map(effect => {
      const tip = effect.summary ? ` data-tooltip="${escape(effect.summary)}" data-tooltip-name="${escape(effect.name)}"` : '';
      const badge = getEffectOddsBadge(effect.name, type || undefined, typeInfo.isLegacy);
      let conflictBadge = '';
      if (window.LedgerForge?.getConflictReason && window.RelicOddsData?.nameToId) {
        for (const other of otherGroups) {
          if (other.g.every(otherName => Boolean(window.LedgerForge.getConflictReason(effect.name, otherName, window.RelicOddsData.nameToId)))) {
            const c = window.LedgerForge.getConflictReason(effect.name, other.g[0], window.RelicOddsData.nameToId);
            if (c) {
              conflictBadge = `<span class="target-effect-odds is-zero" title="${escape(c.message)}">効果${other.idx + 1}と競合（${escape(c.label)}）</span>`;
              break;
            }
          }
        }
      }
      return `<label class="target-option"${tip}><input type="checkbox" value="${escape(effect.name)}" ${editing.groups[activeGroup].includes(effect.name) ? 'checked' : ''}><span><span class="target-option-title"><span class="target-option-name">${escape(effect.name)}</span>${badge}${conflictBadge}</span><small>${escape(effect.category)}${EFFECTS.some(item => item.name === effect.name && item.type === 'normal' && !item.uniqueOnly) ? '' : ' · 深層遺物'}${effect.hasPenalty ? ' · デメリットあり' : ''}</small></span><b aria-hidden="true">${editing.groups[activeGroup].includes(effect.name) ? '✓' : '＋'}</b></label>`;
    }).join('') : '<p class="empty">該当する効果がありません。<br>検索やカテゴリを変更してください。</p>';
    el('target-categories').scrollTop = categoryScroll;
  }
  function updateRelicTypeButtons() {
    const typeInfo = detectPatternTypeInfo(editing);
    const activeType = typeInfo.isDeep ? 'deep' : 'normal';
    const activeLegacy = Boolean(typeInfo.isLegacy);
    const wrap = el('target-relic-type');
    if (wrap) {
      for (const btn of wrap.querySelectorAll('[data-relic-type]')) {
        const btnLegacy = btn.dataset.poolLegacy === 'true';
        btn.setAttribute('aria-pressed', String(btn.dataset.relicType === activeType && btnLegacy === activeLegacy));
      }
    }
  }
  function renderValues(withOdds = true) { for (const [kind,key] of [['color','colors'],['size','sizes']]) { for (const input of el('target-'+kind).querySelectorAll('input')) input.checked = editing[key].includes(input.value); el('target-'+kind).querySelector('button').setAttribute('aria-pressed', !editing[key].length); } updateRelicTypeButtons(); if (withOdds) renderPatternOdds(); }
  function renderPatterns() {
    el('target-pattern-tabs').innerHTML = draftPatterns.map((pattern,index) => `<button role="tab" draggable="true" aria-selected="${index === activePattern}" data-target-pattern="${index}" type="button">${escape(pattern.name || `パターン${index+1}`)}</button>`).join('');
    if (el('target-pattern-name').value !== (editing.name || '')) el('target-pattern-name').value = editing.name || '';
    el('target-pattern-delete').disabled = draftPatterns.length === 1;
    el('target-pattern-add').disabled = el('target-pattern-copy').disabled = draftPatterns.length >= 100;
    updateTargetSaveState();
  }
  function choosePattern(index) { activePattern = index; editing = draftPatterns[index]; activeGroup = 0; oddsTypeOverride = null; oddsLegacyOverride = null; renderPatterns(); renderValues(false); renderGroups(); if (effectDialog.open) renderEffects(); el('target-status').textContent = ''; }
  window.addEventListener('relic-target-changed', event => {
    if (isInternalTargetChange) return;
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved) {
      savedPatterns = normalizeRelicPatterns(saved);
      draftPatterns = structuredClone(savedPatterns);
      if (event?.detail?.source === 'reroll-toggle') {
        if (Number.isInteger(event.detail.toggledIndex) && event.detail.enabled && draftPatterns[event.detail.toggledIndex]) {
          choosePattern(event.detail.toggledIndex);
        } else {
          const activeEnabled = draftPatterns[activePattern]?.enabled;
          if (!activeEnabled) {
            const firstOn = draftPatterns.findIndex(p => p.enabled);
            if (firstOn >= 0) {
              choosePattern(firstOn);
              summary();
              return;
            }
          }
          activePattern = Math.min(activePattern, draftPatterns.length - 1);
          editing = draftPatterns[activePattern];
          renderPatterns();
          updateRelicTypeButtons();
        }
        summary();
        return;
      }
      snapshotPatterns = structuredClone(savedPatterns);
      choosePattern(Math.min(activePattern, draftPatterns.length - 1));
      summary();
      updateTargetSaveState();
    }
  });
  window.addEventListener('relic-reroll-settings-changed', () => {
    updateRelicTypeButtons();
    renderPatternOdds();
  });
  el('target-open').onclick = () => { snapshotPatterns = structuredClone(savedPatterns); draftPatterns = structuredClone(savedPatterns); el('target-search').value = ''; el('target-category').value = ''; el('target-type').value = ''; el('target-selected-only').checked = false; choosePattern(0); dialog.showModal(); };
  window.addEventListener('relic-target-edit',event=>{
    if(el('target-open').disabled)return;
    el('target-open').click();
    dialog.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if(event.detail?.add){
      if(!(draftPatterns.length===1&&!hasRelicConditions(draftPatterns[0]))){
        if(draftPatterns.length>=100){el('target-status').textContent='パターンは100件までです。';return;}
        el('target-pattern-add').click();
      }
      el('target-pattern-name').focus();el('target-pattern-name').select();
    }else if(Number.isInteger(event.detail?.index)&&draftPatterns[event.detail.index])choosePattern(event.detail.index);
  });
  let tabDragIndex = null;
  el('target-pattern-tabs').onclick = event => { const button = event.target.closest('[data-target-pattern]'); if (button) choosePattern(Number(button.dataset.targetPattern)); };
  el('target-pattern-tabs').addEventListener('dragstart', event => {
    const button = event.target.closest('[data-target-pattern]');
    if (!button) return;
    tabDragIndex = Number(button.dataset.targetPattern);
    button.classList.add('is-dragging');
    if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(tabDragIndex)); }
  });
  el('target-pattern-tabs').addEventListener('dragover', event => {
    const button = event.target.closest('[data-target-pattern]');
    if (!button || tabDragIndex === null) return;
    event.preventDefault();
    for (const item of el('target-pattern-tabs').querySelectorAll('.is-drop-target')) if (item !== button) item.classList.remove('is-drop-target');
    if (Number(button.dataset.targetPattern) !== tabDragIndex) button.classList.add('is-drop-target');
  });
  el('target-pattern-tabs').addEventListener('dragleave', event => { event.target.closest('[data-target-pattern]')?.classList.remove('is-drop-target'); });
  el('target-pattern-tabs').addEventListener('drop', event => {
    const button = event.target.closest('[data-target-pattern]');
    const from = tabDragIndex ?? Number(event.dataTransfer?.getData('text/plain'));
    tabDragIndex = null;
    if (!button || !Number.isInteger(from)) return;
    event.preventDefault();
    const to = Number(button.dataset.targetPattern);
    if (from === to) return;
    const currentRef = draftPatterns[activePattern];
    draftPatterns = reorderRelicPatterns(draftPatterns, from, to);
    activePattern = Math.max(0, draftPatterns.indexOf(currentRef));
    editing = draftPatterns[activePattern];
    renderPatterns();
    autoSavePatterns();
  });
  el('target-pattern-tabs').addEventListener('dragend', () => {
    tabDragIndex = null;
    for (const item of el('target-pattern-tabs').querySelectorAll('.is-dragging,.is-drop-target')) item.classList.remove('is-dragging', 'is-drop-target');
  });
  el('target-pattern-name').oninput = event => { editing.name = event.target.value; const scroll = el('target-pattern-tabs').scrollLeft; renderPatterns(); el('target-pattern-tabs').scrollLeft = scroll; autoSavePatterns(); };
  el('target-pattern-add').onclick = () => { draftPatterns.push({ ...empty(), name: `パターン${draftPatterns.length+1}` }); choosePattern(draftPatterns.length-1); autoSavePatterns(); };
  el('target-pattern-copy').onclick = () => { draftPatterns.push({ ...structuredClone(editing), name: (editing.name || 'パターン') + '（コピー）' }); choosePattern(draftPatterns.length-1); autoSavePatterns(); };
  el('target-pattern-delete').onclick = () => { if (draftPatterns.length > 1) { draftPatterns.splice(activePattern,1); choosePattern(Math.min(activePattern,draftPatterns.length-1)); autoSavePatterns(); } };
  el('target-relic-type').onclick = event => {
    const btn = event.target.closest('[data-relic-type]');
    if (!btn) return;
    const nextType = btn.dataset.relicType;
    const nextLegacy = btn.dataset.poolLegacy === 'true';
    editing.relicType = nextType;
    editing.poolLegacy = nextLegacy;
    oddsTypeOverride = nextType;
    oddsLegacyOverride = nextLegacy;
    renderValues(false);
    renderGroups();
    if (effectDialog.open) renderEffects();
    autoSavePatterns();
  };
  function handleOddsHoursInput(event) {
    const input = event.target.closest('#target-odds-hours');
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) return;
    const val = Number(raw);
    if (!Number.isFinite(val) || val <= 0) return;
    oddsHours = Math.min(99999, Math.max(0.1, val));
    try { localStorage.setItem(oddsHoursStorageKey, String(oddsHours)); } catch {}
    if (lastCalculatedOdds && window.LedgerForge) {
      const opts = getCurrentRerollTimingOpts(oddsHours);
      const s8 = window.LedgerForge.calc8HourStats(lastCalculatedOdds.finalProb, opts);
      const valEl = el('target-odds-8h-value');
      const hitProbEl = el('target-odds-8h-hitprob');
      if (valEl) valEl.textContent = `約 ${s8.expectedCountStr}`;
      if (hitProbEl) hitProbEl.textContent = s8.hitPercent8hStr;
    }
    window.dispatchEvent(new CustomEvent('relic-odds-hours-changed', { detail: { hours: oddsHours } }));
  }
  el('target-pattern-odds').addEventListener('input', handleOddsHoursInput);
  el('target-pattern-odds').addEventListener('change', handleOddsHoursInput);
  el('target-wanted-penalty-reset').onclick = () => { editing.wantedPenalties = []; renderGroups(); autoSavePatterns(); };
  el('target-penalty-reset').onclick = () => { editing.excludedPenalties = []; renderGroups(); autoSavePatterns(); };
  el('target-close').onclick = el('target-cancel').onclick = () => {
    draftPatterns = structuredClone(snapshotPatterns);
    autoSavePatterns();
    choosePattern(Math.min(activePattern, draftPatterns.length - 1));
    dialog.close();
  };
  el('target-effect-close').onclick = () => effectDialog.close();
  effectDialog.addEventListener('click', event => { if (event.target === effectDialog) effectDialog.close(); });
  el('target-wanted-penalty-open').onclick = () => {
    el('target-wanted-penalty-options').innerHTML = DEMERITS.map(name => {
      const tip = typeof PENALTY_NOTES !== 'undefined' && PENALTY_NOTES[name] ? ` data-tooltip="${escape(PENALTY_NOTES[name])}" data-tooltip-name="${escape(name)}"` : '';
      return `<label class="target-option"${tip}><input type="checkbox" value="${escape(name)}" ${(editing.wantedPenalties || []).includes(name) ? 'checked' : ''}><span class="target-option-title"><span class="target-option-name">${escape(name)}</span><span class="target-effect-odds target-penalty-odds" title="デメリット1枠あたりの出現率（全24種等確率）">1/24（約4.2%）</span></span></label>`;
    }).join('');
    wantedPenaltyDialog.showModal();
  };
  el('target-wanted-penalty-options').onchange = () => { editing.wantedPenalties = [...el('target-wanted-penalty-options').querySelectorAll('input:checked')].map(input => input.value); renderGroups(); autoSavePatterns(); };
  el('target-wanted-penalty-clear').onclick = () => { editing.wantedPenalties = []; for (const input of el('target-wanted-penalty-options').querySelectorAll('input')) input.checked = false; renderGroups(); autoSavePatterns(); };
  el('target-wanted-penalty-close').onclick = el('target-wanted-penalty-done').onclick = () => wantedPenaltyDialog.close();
  el('target-penalty-open').onclick = () => {
    el('target-penalty-options').innerHTML = DEMERITS.map(name => {
      const tip = typeof PENALTY_NOTES !== 'undefined' && PENALTY_NOTES[name] ? ` data-tooltip="${escape(PENALTY_NOTES[name])}" data-tooltip-name="${escape(name)}"` : '';
      return `<label class="target-option"${tip}><input type="checkbox" value="${escape(name)}" ${editing.excludedPenalties.includes(name) ? 'checked' : ''}><span class="target-option-title"><span class="target-option-name">${escape(name)}</span><span class="target-effect-odds target-penalty-odds" title="デメリット1枠あたりの出現率（全24種等確率）">1/24（約4.2%）</span></span></label>`;
    }).join('');
    penaltyDialog.showModal();
  };
  el('target-penalty-options').onchange = () => { editing.excludedPenalties = [...el('target-penalty-options').querySelectorAll('input:checked')].map(input => input.value); renderGroups(); autoSavePatterns(); };
  el('target-penalty-clear').onclick = () => { editing.excludedPenalties = []; for (const input of el('target-penalty-options').querySelectorAll('input')) input.checked = false; renderGroups(); autoSavePatterns(); };
  el('target-penalty-close').onclick = el('target-penalty-done').onclick = () => penaltyDialog.close();
  dialog.addEventListener('close', () => { if (effectDialog.open) effectDialog.close(); if (penaltyDialog.open) penaltyDialog.close(); if (wantedPenaltyDialog.open) wantedPenaltyDialog.close(); });
  for (const [kind,key] of [['color','colors'],['size','sizes']]) { el('target-'+kind).onchange = () => { editing[key] = [...el('target-'+kind).querySelectorAll('input:checked')].map(input => input.value); renderValues(); autoSavePatterns(); }; el('target-'+kind).querySelector('button').onclick = () => { editing[key] = []; renderValues(); autoSavePatterns(); }; }
  el('target-search').oninput = renderEffects;
  el('target-category').onchange = renderEffects;
  el('target-categories').onclick = event => { const button = event.target.closest('[data-target-category]'); if (button) { el('target-category').value = button.dataset.targetCategory; renderEffects(); } };
  el('target-type').onchange = el('target-selected-only').onchange = renderEffects;
  el('target-clear-group').onclick = () => { editing.groups[activeGroup] = []; renderGroups(); renderEffects(); autoSavePatterns(); };
  let slotCopyDrag = null;
  let suppressSlotCopyClickUntil = 0;
  function resolveDropGroupElement(clientX, clientY) {
    const hit = document.elementFromPoint(clientX, clientY);
    if (!hit) return null;
    const direct = hit.closest('[data-target-group]');
    if (direct) return direct;
    const row = hit.closest('[data-slot-row]');
    return row ? row.querySelector('[data-target-group]') : null;
  }
  el('target-groups').addEventListener('pointerdown', event => {
    const copyBtn = event.target.closest('[data-copy-group]');
    if (!copyBtn || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const from = Number(copyBtn.dataset.copyGroup);
    if (!Number.isInteger(from) || !editing.groups[from]?.length) {
      suppressSlotCopyClickUntil = Date.now() + 350;
      setStatus(`効果${from + 1}には複製する効果が設定されていません。`, false);
      return;
    }
    const sourceSlot = copyBtn.closest('[data-target-group]');
    const rect = sourceSlot.getBoundingClientRect();
    const ghost = sourceSlot.cloneNode(true);
    ghost.classList.add('effect-drag-ghost', 'target-slot-drag-ghost');
    ghost.removeAttribute('data-target-group');
    ghost.style.width = rect.width + 'px';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.setAttribute('aria-hidden', 'true');
    document.body.append(ghost);
    sourceSlot.classList.add('is-copy-drag-source');
    document.body.classList.add('effect-dragging');
    slotCopyDrag = {
      from,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      copyBtn,
      sourceSlot,
      ghost,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    try { copyBtn.setPointerCapture(event.pointerId); } catch {}
  }, true);
  document.addEventListener('pointermove', event => {
    const drag = slotCopyDrag;
    if (!drag || drag.id !== event.pointerId) return;
    drag.ghost.style.left = (event.clientX - drag.offsetX) + 'px';
    drag.ghost.style.top = (event.clientY - drag.offsetY) + 'px';
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 5) drag.moved = true;
    if (!drag.moved) return;
    event.preventDefault();
    document.body.classList.add('effect-dragging');
    for (const item of el('target-groups').querySelectorAll('.is-copy-drop-target')) {
      item.classList.remove('is-copy-drop-target');
    }
    const targetSlot = resolveDropGroupElement(event.clientX, event.clientY);
    if (targetSlot && Number(targetSlot.dataset.targetGroup) !== drag.from) {
      targetSlot.classList.add('is-copy-drop-target');
    }
  }, { capture: true, passive: false });
  function finishSlotCopyDrag(event) {
    const drag = slotCopyDrag;
    if (!drag || drag.id !== event.pointerId) return;
    slotCopyDrag = null;
    drag.ghost.remove();
    drag.sourceSlot.classList.remove('is-copy-drag-source');
    suppressSlotCopyClickUntil = Date.now() + 400;
    event.preventDefault();
    event.stopPropagation();
    document.body.classList.remove('effect-dragging');
    for (const item of el('target-groups').querySelectorAll('.is-copy-drop-target')) {
      item.classList.remove('is-copy-drop-target');
    }
    if (event.type === 'pointerup') {
      if (drag.moved) {
        const targetSlot = resolveDropGroupElement(event.clientX, event.clientY);
        const to = targetSlot ? Number(targetSlot.dataset.targetGroup) : -1;
        if (Number.isInteger(to) && to >= 0 && to !== drag.from && editing.groups[to]) {
          editing.groups[to] = [...editing.groups[drag.from]];
          renderGroups();
          renderEffects();
          autoSavePatterns();
          setStatus(`効果${drag.from + 1}を効果${to + 1}に複製しました。`, true);
        }
      } else {
        const emptyIdx = editing.groups.findIndex((g, idx) => idx !== drag.from && g.length === 0);
        if (emptyIdx >= 0) {
          editing.groups[emptyIdx] = [...editing.groups[drag.from]];
          renderGroups();
          renderEffects();
          autoSavePatterns();
          setStatus(`効果${drag.from + 1}を効果${emptyIdx + 1}に複製しました。`, true);
        } else {
          setStatus('複製アイコンを他の効果枠（効果1〜3）へドラッグ＆ドロップすると上書き複製できます。', false);
        }
      }
    }
  }
  document.addEventListener('pointerup', finishSlotCopyDrag, true);
  document.addEventListener('pointercancel', finishSlotCopyDrag, true);
  el('target-groups').onclick = event => {
    if (Date.now() < suppressSlotCopyClickUntil || event.target.closest('[data-copy-group]')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const removeEff = event.target.closest('[data-remove-group-effect]');
    if (removeEff) {
      event.preventDefault();
      event.stopPropagation();
      const gIdx = Number(removeEff.dataset.removeGroupEffect);
      const eIdx = Number(removeEff.dataset.removeEffectIdx);
      if (Array.isArray(editing.groups[gIdx]) && eIdx >= 0 && eIdx < editing.groups[gIdx].length) {
        const [removedName] = editing.groups[gIdx].splice(eIdx, 1);
        renderGroups();
        renderEffects();
        autoSavePatterns();
        if (removedName) el('target-status').textContent = `効果${gIdx + 1}から「${removedName}」を外しました。`;
      }
      return;
    }
    const select = event.target.closest('[data-target-group]');
    const reset = event.target.closest('[data-target-reset-group]');
    if (select) { activeGroup = Number(select.dataset.targetGroup); el('target-selected-only').checked = false; el('target-search').value = ''; el('target-category').value = ''; el('target-type').value = ''; renderGroups(); renderEffects(); effectDialog.showModal(); }
    if (reset) { editing.groups[Number(reset.dataset.targetResetGroup)] = []; renderGroups(); renderEffects(); autoSavePatterns(); el('target-status').textContent = `効果${Number(reset.dataset.targetResetGroup) + 1}をリセットしました。`; }
  };
  el('target-effects').onchange = event => {
    const input = event.target;
    if (!input.matches('input[type="checkbox"]')) return;
    const scroll = el('target-effects').scrollTop;
    const group = editing.groups[activeGroup];
    if (input.checked) group.push(input.value); else group.splice(group.indexOf(input.value), 1);
    renderGroups();
    renderEffects();
    autoSavePatterns();
    el('target-effects').scrollTop = scroll;
    [...el('target-effects').querySelectorAll('input')].find(candidate => candidate.value === input.value)?.focus({ preventScroll: true });
  };
  el('target-reset').textContent = 'このパターンをクリア';
  el('target-reset').onclick = () => { Object.assign(editing, empty()); renderValues(); renderGroups(); renderEffects(); autoSavePatterns(); setStatus('このパターンの条件をクリアしました。', true); };
  el('target-save').onclick = () => {
    try {
      const normalized = preparePatternsForSave(draftPatterns);
      localStorage.setItem(storageKey, JSON.stringify({ patterns: normalized }));
      savedPatterns = structuredClone(normalized);
      snapshotPatterns = structuredClone(normalized);
      summary();
      updateTargetSaveState();
      isInternalTargetChange = true;
      window.dispatchEvent(new CustomEvent('relic-target-changed'));
      isInternalTargetChange = false;
      dialog.close();
      setStatus('狙う遺物の条件を保存しました。', true);
      notify('狙う遺物の条件を保存しました。');
    } catch {
      setStatus('保存できませんでした。空き容量を確認してください。', false);
    }
  };
  window.addEventListener('relic-odds-hours-changed', event => {
    const nextHours = Number(event?.detail?.hours);
    if (Number.isFinite(nextHours) && nextHours > 0 && Math.abs(nextHours - oddsHours) > 1e-6) {
      oddsHours = nextHours;
      const input = el('target-odds-hours');
      if (input && document.activeElement !== input) input.value = String(oddsHours);
      if (lastCalculatedOdds && window.LedgerForge) {
        const opts = getCurrentRerollTimingOpts(oddsHours);
        const s8 = window.LedgerForge.calc8HourStats(lastCalculatedOdds.finalProb, opts);
        const valEl = el('target-odds-8h-value');
        const hitProbEl = el('target-odds-8h-hitprob');
        if (valEl) valEl.textContent = `約 ${s8.expectedCountStr}`;
        if (hitProbEl) hitProbEl.textContent = s8.hitPercent8hStr;
      }
    }
  });
  summary();
  draftPatterns = structuredClone(savedPatterns);
  const firstEnabledIdx = draftPatterns.findIndex(p => p.enabled);
  choosePattern(firstEnabledIdx >= 0 ? firstEnabledIdx : 0);
})();
