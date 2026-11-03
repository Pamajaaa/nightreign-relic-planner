'use strict';
const $=id=>document.getElementById(id), chars=Object.keys(normalCharacters), lookup=new Map(EFFECTS.map(e=>[e.id,e]));
const KEY='nightreign.relic.loadouts.v1',DRAFT='nightreign.relic.draft.v1',CHAR_DRAFTS='nightreign.relic.character-drafts.v1';
let characterDrafts={};
try{const parsed=JSON.parse(localStorage.getItem(CHAR_DRAFTS)||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))characterDrafts=parsed;}catch{}
let saved=[], currentId=null,slots=Array(18).fill(null),activeSlot=0,penaltySlots=Array(9).fill(null),desiredEffects=[],dirty=false,toastTimer,vesselId=null,currentDamageDraft=null;
const effectByName=new Map();
for(const e of EFFECTS){if(e.uniqueOnly)continue;let entry=effectByName.get(e.name);if(!entry){entry={name:e.name,normal:null,deep:null,category:e.category,character:e.character};effectByName.set(e.name,entry);}entry[e.type]=e;}
function desiredEffectScope(name){const entry=effectByName.get(name);if(!entry)return null;if(entry.normal&&entry.deep)return 'common';return entry.normal?'normal':'deep';}
function normalizeDesiredEffects(list){if(!Array.isArray(list))return [];return [...new Set(list.filter(n=>typeof n==='string'&&effectByName.has(n)))].slice(0,60);}
function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
function validSavedDamage(d){return d&&typeof d==='object'&&Number.isInteger(d.evergaol)&&d.evergaol>=0&&d.evergaol<=99&&Number.isInteger(d.invader)&&d.invader>=0&&d.invader<=99&&(d.greatChurch===undefined||(Number.isInteger(d.greatChurch)&&d.greatChurch>=0&&d.greatChurch<=99))&&typeof d.scenario==='string'&&d.scenario.length<=50&&(d.defenseElement===undefined||(typeof d.defenseElement==='string'&&d.defenseElement.length<=20))&&Array.isArray(d.affixes)&&d.affixes.length<=12&&d.affixes.every(id=>typeof id==='string'&&id.length<=100)&&(d.disabled===undefined||(Array.isArray(d.disabled)&&d.disabled.length<=40&&d.disabled.every(name=>typeof name==='string'&&name.length<=100)));}
function validBuild(b){return b&&typeof b.id==='string'&&chars.includes(b.character)&&typeof b.name==='string'&&b.name.length<=80&&(b.vessel===undefined||b.vessel===null||VESSELS.some(v=>v.id===b.vessel))&&Array.isArray(b.slots)&&b.slots.length===18&&b.slots.every((id,i)=>id===null||(lookup.has(id)&&lookup.get(id).type===(i<9?'normal':'deep')))&&(b.penalties===undefined||(Array.isArray(b.penalties)&&b.penalties.length===9&&b.penalties.every((n,i)=>n===null||(DEMERITS.includes(n)&&lookup.get(b.slots[i+9])?.hasPenalty))))&&(b.damage===undefined||validSavedDamage(b.damage))&&(b.desiredEffects===undefined||(Array.isArray(b.desiredEffects)&&b.desiredEffects.length<=60&&b.desiredEffects.every(n=>typeof n==='string'&&n.length<=120)));}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved));return true;}catch{notify('保存できませんでした。ブラウザの保存設定や空き容量を確認してください。');return false;}}
function draft(renderPage=true){try{const d={id:currentId,character:$('character').value,name:$('name').value,vessel:vesselId,slots:[...slots],penalties:[...penaltySlots],desiredEffects:[...desiredEffects],damage:snapshotDamageSettings()};characterDrafts[d.character]=d;localStorage.setItem(CHAR_DRAFTS,JSON.stringify(characterDrafts));localStorage.setItem(DRAFT,JSON.stringify(d));}catch{}if(renderPage)render();else updateSaveState();}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
for(let c of chars){$('character').add(new Option(c,c));}
try{const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(parsed))saved=parsed.filter(validBuild);}catch{notify('保存データを読み取れませんでした。バックアップがあれば読み込んでください。');}
try{let d=JSON.parse(localStorage.getItem(DRAFT));if(d&&validBuild({...d,id:d.id||'draft'})){characterDrafts[d.character]=d;vesselId=d.vessel||null;slots=d.slots;penaltySlots=d.penalties?[...d.penalties]:Array(9).fill(null);desiredEffects=normalizeDesiredEffects(d.desiredEffects);currentId=d.id;$('character').value=d.character;$('name').value=d.name;currentDamageDraft=d.damage||null;dirty=true;}}catch{}
function effectOddsBadge(e,type,isUniqueRelic=false){if(!e||e.uniqueOnly||isUniqueRelic||!window.RelicOddsData)return '';const id=window.RelicOddsData.nameToId[e.name],odds=id?window.RelicOddsData.singleOdds[id]:null;if(!odds)return '';const isDeep=type==='deep',prob=isDeep?odds.deepProb:odds.normalProb,oneIn=isDeep?odds.deepOneIn:odds.normalOneIn;if(!prob||!oneIn)return '';const pct=(prob*100).toFixed(prob<0.01?2:1);return `<span class="slot-effect-odds" title="単体出現率（1個あたり）: 約${pct}%（約${oneIn.toLocaleString()}個に1個）">約 ${oneIn.toLocaleString()} 個に 1 個</span>`;}
function renderDesiredEffects(){
 if(!$('desired-effects-panel'))return;
 const equippedCounts=new Map();
 for(const id of slots){const e=lookup.get(id);if(e)equippedCounts.set(e.name,(equippedCounts.get(e.name)||0)+1);}
 const buckets={normal:[],deep:[],common:[]};
 for(const name of desiredEffects){const sc=desiredEffectScope(name);if(sc)buckets[sc].push(name);}
 for(const scope of ['normal','deep','common']){
  const listEl=$('desired-list-'+scope);if(!listEl)continue;
  const names=buckets[scope];
  if(!names.length){listEl.innerHTML='<p class="desired-empty">効果なし（＋から追加／右の遺物からドラッグ）</p>';continue;}
  listEl.innerHTML=names.map(name=>{
   const entry=effectByName.get(name),rep=scope==='deep'?entry.deep:(entry.normal||entry.deep),eq=equippedCounts.get(name)||0;
   const badge=scope==='common'?(effectOddsBadge(entry.normal,'normal')||effectOddsBadge(entry.deep,'deep')):effectOddsBadge(rep,scope);
   return `<div class="desired-effect-item ${eq?'is-equipped':''}" data-desired-effect="${escapeHtml(name)}" data-desired-scope="${scope}" ${tooltipAttrs(rep)}><span class="slot-number desired-drag-handle" title="ドラッグ＆ドロップで遺物スロットへ追加（クリックで空き枠へ追加）">☰</span><span class="desired-effect-body"><span class="effect-name"><span class="effect-label">${escapeHtml(name)}</span>${entry.deep?.hasPenalty?penaltyMark(entry.deep):''}${eq?`<span class="desired-equipped-badge" title="現在の構成に${eq}個セット中">装備中${eq>1?'×'+eq:''}</span>`:''}${badge}</span></span><button class="effect-remove desired-remove-btn" type="button" data-remove-desired="${escapeHtml(name)}" title="リストから外す" aria-label="「${escapeHtml(name)}」をリストから外す">×</button></div>`;
  }).join('');
 }
 if($('desired-effects-clear'))$('desired-effects-clear').disabled=!desiredEffects.length;
}
function matchFixedRelicAtOffset(offset){
 if(offset>=9)return null;
 const cur=[slots[offset]||null,slots[offset+1]||null,slots[offset+2]||null];
 if(!cur.some(Boolean))return null;
 const v=VESSELS.find(x=>x.id===vesselId),slotColor=v?v.normal[offset/3]:null;
 const exactMatches=UNIQUE_RELICS.filter(relic=>relic.effectIds.every((id,k)=>cur[k]===id));
 if(exactMatches.length){
  return (slotColor&&slotColor!=='白'?exactMatches.find(r=>r.color===slotColor):null)||exactMatches.find(r=>!r.isShop)||exactMatches[0];
 }
 const curKey=[...cur].map(x=>x||'').sort().join('|');
 const unorderedMatches=UNIQUE_RELICS.filter(relic=>[...relic.effectIds].map(x=>x||'').sort().join('|')===curKey);
 if(unorderedMatches.length){
  return (slotColor&&slotColor!=='白'?unorderedMatches.find(r=>r.color===slotColor):null)||unorderedMatches.find(r=>!r.isShop)||unorderedMatches[0];
 }
 return null;
}
function isFixedOrOwnedRelicAtOffset(offset){
 if(matchFixedRelicAtOffset(offset))return true;
 if(typeof window.isOwnedRelicAtOffset==='function'&&window.isOwnedRelicAtOffset(offset))return true;
 return false;
}
function getTwoEffectsConflict(nameA,nameB){if(!nameA||!nameB||!window.LedgerForge?.getConflictReason||!window.RelicOddsData?.nameToId)return null;return window.LedgerForge.getConflictReason(nameA,nameB,window.RelicOddsData.nameToId);}
function getSlotConflictWithRelic(effectName,targetSlotIndex){if(!effectName)return null;const offset=Math.floor(targetSlotIndex/3)*3,isUnique=isFixedOrOwnedRelicAtOffset(offset);if(isUnique)return null;for(let j=0;j<3;j++){const idx=offset+j;if(idx===targetSlotIndex)continue;const other=lookup.get(slots[idx]);if(!other||other.uniqueOnly)continue;const c=getTwoEffectsConflict(effectName,other.name);if(c)return {...c,slotIndex:idx,otherSlotNumber:j+1};}return null;}
function getRelicCardConflicts(offset,isUnique){const slotConflicts=new Map(),messages=[];if(isUnique)return {slotConflicts,messages};for(let a=0;a<3;a++){for(let b=a+1;b<3;b++){const ea=lookup.get(slots[offset+a]),eb=lookup.get(slots[offset+b]);if(ea&&eb&&!ea.uniqueOnly&&!eb.uniqueOnly){const c=getTwoEffectsConflict(ea.name,eb.name);if(c){slotConflicts.set(offset+a,c);slotConflicts.set(offset+b,c);messages.push(`効果${a+1}・効果${b+1}：${c.message}`);}}if(offset>=9){const pa=penaltySlots[offset-9+a],pb=penaltySlots[offset-9+b];if(pa&&pb&&pa===pb)messages.push(`効果${a+1}・効果${b+1}：同じデメリット「${pa}」は同一遺物に重複して付きません`);}}}return {slotConflicts,messages};}
function render(){for(let type of ['normal','deep']){let base=type==='normal'?0:9;$(type+'-grid').innerHTML=Array.from({length:3},(_,r)=>{let offset=base+r*3,isUnique=isFixedOrOwnedRelicAtOffset(offset),{slotConflicts,messages}=getRelicCardConflicts(offset,isUnique);return `<article class="relic-card${messages.length?' has-conflict':''}"><div class="card-head"><span class="relic-icon" aria-hidden="true"></span>${type==='normal'?uniqueRelicSelect(offset,r):`<span class="deep-card-title">深層遺物 ${r+1}</span>`}<button class="owned-relic-trigger" type="button" data-open-owned="${offset}" title="読み込んだ所持遺物から選択してセットします">所持遺物 ▾</button>${normalRelicReset(offset)}</div><div class="slots">${Array.from({length:3},(_,j)=>{let i=offset+j,e=lookup.get(slots[i]),conflict=slotConflicts.get(i);return `<div class="effect-entry"><div class="effect-line"><button class="slot ${e?'filled':''}${conflict?' is-conflicting':''}" data-slot="${i}" ${tooltipAttrs(e)} aria-label="${type==='normal'?'通常':'深層'}遺物${r+1} 効果${j+1}${e?'：'+escapeHtml(e.name):'を選ぶ'}"><span class="slot-number drag-handle" aria-label="ドラッグで並び替え・コピー" title="同じ遺物内は並び替え、別の遺物へはコピー">☰</span><span class="slot-text"><span class="effect-name"><span class="effect-label">${e?escapeHtml(e.name):'- - -'}</span>${penaltyMark(e)}${effectOddsBadge(e,type,isUnique)}${conflict?`<span class="slot-conflict-badge" title="${escapeHtml(conflict.message)}">⚠️ 同時出現不可</span>`:''}</span></span>${e?'':'<span class="plus">＋</span>'}</button>${e?`<div class="effect-actions"><button class="effect-remove" type="button" data-remove-slot="${i}" aria-label="${type==='normal'?'通常':'深層'}遺物${r+1} 効果${j+1}を外す" title="効果を外す">×</button></div>`:''}</div>${e?.hasPenalty?`<div class="penalty-line"><label class="penalty-select-label"><select data-penalty="${i-9}" ${penaltySlots[i-9]?tooltipAttrs({name:penaltySlots[i-9],summary:PENALTY_NOTES[penaltySlots[i-9]]}):''} aria-label="深層遺物${r+1} 効果${j+1}のデメリット"><option value="">- - -</option>${DEMERITS.map(n=>`<option value="${escapeHtml(n)}" ${penaltySlots[i-9]===n?'selected':''}>${escapeHtml(n)}</option>`).join('')}</select></label><button class="effect-remove penalty-remove" type="button" data-remove-penalty="${i-9}" aria-label="深層遺物${r+1} 効果${j+1}のデメリットを外す" title="デメリットを外す" ${penaltySlots[i-9]?'':'disabled'}>×</button></div>`:''}</div>`;}).join('')}</div>${messages.length?`<div class="relic-conflict-warning" role="status">${messages.map(m=>`<div>⚠️ ${escapeHtml(m)}</div>`).join('')}</div>`:''}</article>`;}).join('');}
 $('reset-all-relics').disabled=!slots.some(Boolean)&&!penaltySlots.some(Boolean);renderDesiredEffects();renderVessel();renderSaved();updateSaveState();renderDamage();}
function renderSaved(){let builds=saved.filter(b=>b.character===$('character').value);$('saved-list').innerHTML=builds.length?builds.map(b=>`<div class="saved-item"><button class="saved-load" data-load="${escapeHtml(b.id)}"><strong>${escapeHtml(b.name)}</strong></button><div class="saved-actions"><button data-copy="${escapeHtml(b.id)}">複製</button><button data-delete="${escapeHtml(b.id)}">削除</button></div></div>`).join(''):'<div class="empty"><span class="empty-symbol">◇</span>まだ構成がありません。<br>理想の効果を選んで<br>最初の構成を保存しましょう。</div>';let hasOwned=false;try{const o=JSON.parse(localStorage.getItem('nightreign.relic.owned.v1')||'null');hasOwned=Boolean((Array.isArray(o)&&o.length)||(o&&Array.isArray(o.relics)&&o.relics.length));}catch{}$('export').disabled=!saved.length&&!hasOwned;}
function updateSaveState(){const original=saved.find(b=>b.id===currentId),name=$('name').value.trim(),damage=snapshotDamageSettings();dirty=original?vesselId!==(original.vessel||null)||name!==original.name||$('character').value!==original.character||JSON.stringify(slots)!==JSON.stringify(original.slots)||JSON.stringify(penaltySlots)!==JSON.stringify(original.penalties||Array(9).fill(null))||JSON.stringify(desiredEffects)!==JSON.stringify(normalizeDesiredEffects(original.desiredEffects))||JSON.stringify(damage)!==JSON.stringify(normalizeDamageSettings(original.damage)):Boolean(vesselId||name||slots.some(Boolean)||penaltySlots.some(Boolean)||desiredEffects.length||JSON.stringify(damage)!==JSON.stringify(defaultDamageSettings()));$('save').disabled=!name||!dirty;}
function copyBuild(id){const source=saved.find(b=>b.id===id);if(!source)return;let n=1,name;do{const suffix=n===1?'（コピー）':`（コピー${n}）`;name=source.name.slice(0,80-suffix.length)+suffix;n++;}while(saved.some(b=>b.character===source.character&&b.name===name));const copy={...source,id:crypto.randomUUID(),name,slots:[...source.slots],penalties:[...(source.penalties||Array(9).fill(null))],desiredEffects:normalizeDesiredEffects(source.desiredEffects),damage:normalizeDamageSettings(source.damage),updatedAt:new Date().toISOString()},old=saved;saved=[...saved];saved.splice(saved.findIndex(b=>b.id===id)+1,0,copy);if(!persist()){saved=old;return;}renderSaved();notify('「'+name+'」を追加しました。');}
function openPicker(i){activeSlot=i;const type=i<9?'normal':'deep';$('picker-type').textContent=type==='normal'?'NORMAL RELIC':'DEEP RELIC';$('picker-title').textContent=`${type==='normal'?'通常':'深層'}遺物 ${Math.floor((i%9)/3)+1} · 効果 ${(i%3)+1}`;$('search').value='';$('category').replaceChildren(new Option('すべてのカテゴリ',''),...[...new Set(EFFECTS.filter(e=>e.type===type).map(e=>e.category))].map(c=>new Option(c,c)));renderResults();$('picker').showModal();$('search').focus();}
function normalizeReadingSearch(text){return text.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-96));}
function renderResults(){const type=activeSlot<9?'normal':'deep',q=normalizeReadingSearch($('search').value).trim().split(/\s+/).filter(Boolean);const filtered=EFFECTS.filter(e=>!e.uniqueOnly&&e.type===type&&(!$('category').value||e.category===$('category').value)&&(!$('only-character').checked||!e.character||e.character===$('character').value)&&q.every(w=>normalizeReadingSearch(e.name+' '+e.category+' '+(EFFECT_READINGS.effects[e.id]||'')).includes(w)));$('results-count').textContent=filtered.length+' 件の効果';$('results').innerHTML=filtered.length?filtered.map(e=>{const conflict=getSlotConflictWithRelic(e.name,activeSlot);return `<div class="result-row"><button class="result${conflict?' is-conflicting':''}" ${tooltipAttrs(e)} data-effect="${escapeHtml(e.id)}"><span><span class="effect-name"><span class="effect-label">${escapeHtml(e.name)}</span>${penaltyMark(e)}${effectOddsBadge(e,type)}${conflict?`<span class="slot-conflict-badge" title="${escapeHtml(conflict.message)}">効果${conflict.otherSlotNumber}と競合（${escapeHtml(conflict.label)}）</span>`:''}</span><small>${escapeHtml(e.category)}${e.type==='deep'&&!e.hasPenalty?' · デメリットなし':''}</small></span><b>${slots[activeSlot]===e.id?'✓':'＋'}</b></button></div>`;}).join(''):'<p class="empty">該当する効果がありません。<br>検索語やカテゴリを変更してください。</p>';$('remove-effect').disabled=!slots[activeSlot];}
document.addEventListener('click',ev=>{if(Date.now()<suppressDragClickUntil)return;const desiredItem=ev.target.closest('.desired-effect-item');if(desiredItem&&!ev.target.closest('button')){const effectName=desiredItem.dataset.desiredEffect;if(effectName)applyDesiredToFirstEmptySlot(effectName);return;}let b=ev.target.closest('button');if(!b)return;if(b.dataset.removeDesired!==undefined){const name=b.dataset.removeDesired;desiredEffects=desiredEffects.filter(n=>n!==name);draft();if($('desired-picker')?.open)renderDesiredPickerResults();return;}if(b.dataset.openDesiredPicker!==undefined){openDesiredPicker(b.dataset.openDesiredPicker);return;}if(b.dataset.desiredPickName!==undefined){const name=b.dataset.desiredPickName;if(desiredEffects.includes(name))desiredEffects=desiredEffects.filter(n=>n!==name);else if(desiredEffects.length<60)desiredEffects.push(name);draft();renderDesiredPickerResults();return;}if(b.dataset.removePenalty!==undefined){penaltySlots[Number(b.dataset.removePenalty)]=null;draft();return;}if(b.dataset.removeSlot!==undefined){const i=Number(b.dataset.removeSlot);slots[i]=null;if(i>=9)penaltySlots[i-9]=null;draft();return;}if(b.dataset.slot!==undefined)openPicker(+b.dataset.slot);if(b.dataset.effect){const picked=lookup.get(b.dataset.effect),conflict=picked?getSlotConflictWithRelic(picked.name,activeSlot):null;slots[activeSlot]=b.dataset.effect;if(activeSlot>=9&&!picked?.hasPenalty)penaltySlots[activeSlot-9]=null;draft();$('picker').close();if(conflict)notify('⚠️ '+conflict.message);}if(b.dataset.load){loadBuild(b.dataset.load);closeBuildMenu();}if(b.dataset.copy)copyBuild(b.dataset.copy);if(b.dataset.delete){let old=saved;let item=saved.find(x=>x.id===b.dataset.delete);if(!item||!confirm(`「${item.name}」を削除しますか？`))return;saved=saved.filter(x=>x.id!==item.id);if(!persist()){saved=old;return;}if(currentId===item.id){currentId=null;draft();}renderSaved();notify('構成を削除しました。');}});
function canReplace(){return !dirty||confirm('編集中の構成を切り替えますか？ 保存していない変更は失われます。');}
function loadBuild(id){if(!canReplace())return;let b=saved.find(x=>x.id===id);if(!b)return;currentId=b.id;vesselId=b.vessel||null;slots=[...b.slots];penaltySlots=b.penalties?[...b.penalties]:Array(9).fill(null);desiredEffects=normalizeDesiredEffects(b.desiredEffects);$('character').value=b.character;$('name').value=b.name;setBuildDamageSettings(b.damage);draft();notify('構成を読み込みました。');}
$('save').onclick=()=>{updateSaveState();if($('save').disabled)return;const name=$('name').value.trim();if(!name){notify('構成名を入力してください。');$('name').focus();return;}let id=currentId||crypto.randomUUID();const b={id,name,character:$('character').value,vessel:vesselId,slots:[...slots],penalties:[...penaltySlots],desiredEffects:[...desiredEffects],damage:snapshotDamageSettings(),updatedAt:new Date().toISOString()},old=[...saved];saved=saved.filter(x=>x.id!==id);saved.unshift(b);if(!persist()){saved=old;return;}currentId=id;draft();dirty=false;notify('「'+name+'」を保存しました。'+(slots.some((id,i)=>i>=9&&lookup.get(id)?.hasPenalty&&!penaltySlots[i-9])?'未選択のデメリットがあります。':''));};
$('new').onclick=()=>{if(!canReplace())return;currentId=null;vesselId=null;slots=Array(18).fill(null);penaltySlots=Array(9).fill(null);desiredEffects=[];$('name').value='';setBuildDamageSettings();draft();dirty=false;closeBuildMenu();$('name').focus();};
$('character').onchange=()=>{const character=$('character').value;let d=characterDrafts[character];if(!d||d.character!==character||!validBuild({...d,id:d.id||'draft'}))d=saved.find(b=>b.character===character);currentId=d?(d.id||null):null;if(currentId&&!saved.some(b=>b.id===currentId))currentId=null;vesselId=d?.vessel||null;slots=d?[...d.slots]:Array(18).fill(null);penaltySlots=d?.penalties?[...d.penalties]:Array(9).fill(null);desiredEffects=normalizeDesiredEffects(d?.desiredEffects);$('name').value=d?.name||'';setBuildDamageSettings(d?.damage);closeBuildMenu();draft();};$('name').oninput=draft;
for(let id of ['search','category','only-character'])$(id).addEventListener(id==='search'?'input':'change',renderResults);
$('close-picker').onclick=()=>$('picker').close();$('remove-effect').onclick=()=>{slots[activeSlot]=null;if(activeSlot>=9)penaltySlots[activeSlot-9]=null;draft();$('picker').close();};
$('export').onclick=()=>{let ownedRelics=[];try{const o=JSON.parse(localStorage.getItem('nightreign.relic.owned.v1')||'null');if(Array.isArray(o))ownedRelics=o;else if(o&&Array.isArray(o.relics))ownedRelics=o.relics;}catch{}let targetPatterns=null;try{const t=JSON.parse(localStorage.getItem('nightreign.relic.target.v1')||'null');if(t&&Array.isArray(t.patterns))targetPatterns=t.patterns;}catch{}const payload={version:1,builds:saved};if(ownedRelics.length)payload.ownedRelics=ownedRelics;if(targetPatterns?.length)payload.targetPatterns=targetPatterns;const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nightreign-loadouts.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('バックアップを書き出しました。');};
$('import').onclick=()=>$('import-file').click();$('import-file').onchange=async ev=>{try{const file=ev.target.files[0];if(!file)return;if(file.size>15000000)throw Error('too large');let json=JSON.parse(await file.text());const hasBuilds=Array.isArray(json.builds)&&json.builds.length>0&&json.builds.every(validBuild);const hasOwned=Array.isArray(json.ownedRelics)&&json.ownedRelics.length>0;const hasTargets=Array.isArray(json.targetPatterns)&&json.targetPatterns.length>0;if(json.version!==1||(!hasBuilds&&!hasOwned&&!hasTargets))throw Error('invalid');let buildMsg='',ownedMsg='';if(hasBuilds){let imported=json.builds.map(b=>({...b,id:crypto.randomUUID()}));let old=saved;saved=[...imported,...saved];if(!persist()){saved=old;return;}buildMsg=imported.length+' 件の構成';}if(hasOwned){try{localStorage.setItem('nightreign.relic.owned.v1',JSON.stringify({version:1,updatedAt:new Date().toISOString(),relics:json.ownedRelics,unreadCount:0,lastUnreadFolder:null}));window.dispatchEvent(new CustomEvent('relic-owned-imported'));ownedMsg=(buildMsg?'・':'')+'所持遺物 '+json.ownedRelics.length+' 件';}catch{}}if(hasTargets){try{localStorage.setItem('nightreign.relic.target.v1',JSON.stringify({patterns:json.targetPatterns}));window.dispatchEvent(new CustomEvent('relic-target-changed'));}catch{}}renderSaved();render();notify((buildMsg||ownedMsg||'データ')+'を読み込みました。');}catch{notify('読み込めませんでした。このアプリから書き出したバックアップを選んでください。');}finally{ev.target.value='';}};
document.addEventListener('change',e=>{const select=e.target.closest('[data-penalty]');if(select){penaltySlots[Number(select.dataset.penalty)]=select.value||null;draft();}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});


function openBuildMenu(){renderSaved();$('build-menu').hidden=false;$('name').setAttribute('aria-expanded','true');$('toggle-build-menu').setAttribute('aria-expanded','true');}
function closeBuildMenu(){$('build-menu').hidden=true;$('name').setAttribute('aria-expanded','false');$('toggle-build-menu').setAttribute('aria-expanded','false');}
$('name').addEventListener('click',openBuildMenu);$('toggle-build-menu').onclick=()=>{$('build-menu').hidden?openBuildMenu():closeBuildMenu();};
document.addEventListener('click',e=>{if(!e.target.closest('.name-control'))closeBuildMenu();});
$('name').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();openBuildMenu();$('saved-list').querySelector('button')?.focus();}if(e.key==='Escape')closeBuildMenu();});
$('build-menu').addEventListener('keydown',e=>{if(e.key==='Escape'){closeBuildMenu();$('name').focus();}});


let uniqueTargetOffset=0;
function uniqueRelicSelect(offset,r){const current=matchFixedRelicAtOffset(offset);const label=current?(current.isShop?`${current.name}（店売り）`:current.name):'通常遺物 '+(r+1);return `<button class="unique-relic-title" type="button" data-open-unique="${offset}" aria-label="通常遺物${r+1}の固有・店売り遺物を選ぶ"><span>${escapeHtml(label)}</span><span aria-hidden="true">▾</span></button>`;}
function openUniquePicker(offset){uniqueTargetOffset=offset;$('unique-title').textContent='通常遺物 '+(offset/3+1)+' · 固有・店売り遺物を選ぶ';$('unique-search').value='';$('unique-group').value='';$('unique-match-vessel').disabled=!vesselId;if(!vesselId)$('unique-match-vessel').checked=false;renderUniqueResults();$('unique-picker').showModal();$('unique-search').focus();}
function renderUniqueResults(){const terms=normalizeReadingSearch($('unique-search').value).trim().split(/\s+/).filter(Boolean),group=$('unique-group').value,vessel=VESSELS.find(v=>v.id===vesselId),matchColor=$('unique-match-vessel').checked&&vessel?vessel.normal[uniqueTargetOffset/3]:null;const relics=UNIQUE_RELICS.filter(r=>(!group||r.group===group)&&(!matchColor||matchColor==='白'||r.color===matchColor)&&terms.every(t=>normalizeReadingSearch(r.name+' '+(r.group||'')+' '+(r.shop||'')+' '+(r.note||'')+' '+r.effects.join(' ')+' '+(EFFECT_READINGS.unique[r.name]||'')).includes(t)));$('unique-result-count').textContent=relics.length+'件';$('unique-results').innerHTML=relics.length?relics.map(r=>{const key=r.id||r.name,effectObjects=r.effectIds.filter(Boolean).map(id=>lookup.get(id)),selected=r.effectIds.every((id,j)=>slots[uniqueTargetOffset+j]===id),summary=effectObjects.filter(Boolean).map(e=>e.name+'：'+e.summary).join('\n'),shopSub=r.isShop?` <small>店売り遺物・${escapeHtml(r.shop||'')}${r.note?'（'+escapeHtml(r.note)+'）':''}</small>`:'';return `<button class="unique-card ${selected?'selected':''}" type="button" data-apply-unique="${escapeHtml(key)}" ${tooltipAttrs({name:r.name,summary})}><span class="unique-card-art relic-mark mark-${r.color}" aria-hidden="true"><img src="${escapeHtml(r.image)}" alt="" width="108" height="118" loading="lazy"></span><span class="unique-card-body"><strong>${escapeHtml(r.name)}${shopSub}${selected?' <small>選択中</small>':''}</strong><span class="unique-card-effects">${effectObjects.filter(Boolean).map(e=>`<span ${tooltipAttrs(e)}>${escapeHtml(e.name)}</span>`).join('')}</span></span></button>`;}).join(''):'<p class="empty">該当する固有・店売り遺物がありません。</p>';}
function applyUniqueRelic(key){const relic=UNIQUE_RELICS.find(x=>(x.id||x.name)===key||x.name===key);if(!relic)return;slots.splice(uniqueTargetOffset,3,...relic.effectIds);draft();$('unique-picker').close();notify('「'+relic.name+(relic.isShop?'（店売り遺物）':'')+'」の効果をセットしました。');}
for(const group of [...new Set(UNIQUE_RELICS.map(r=>r.group))])$('unique-group').add(new Option(group,group));
$('unique-search').addEventListener('input',renderUniqueResults);$('unique-group').addEventListener('change',renderUniqueResults);$('unique-match-vessel').addEventListener('change',renderUniqueResults);$('close-unique').onclick=()=>$('unique-picker').close();
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.openUnique!==undefined)openUniquePicker(Number(b.dataset.openUnique));if(b.dataset.applyUnique)applyUniqueRelic(b.dataset.applyUnique);});

function normalRelicReset(offset){const label=offset<9?`通常遺物${offset/3+1}`:`深層遺物${(offset-9)/3+1}`;const hasAny=slots.slice(offset,offset+3).some(Boolean)||(offset>=9&&penaltySlots.slice(offset-9,offset-6).some(Boolean));return `<button class="reset-unique effect-remove" type="button" data-reset-unique="${offset}" aria-label="${label}の効果をすべて外す" title="この遺物の効果をすべて外す" ${hasAny?'':'disabled'}>×</button>`;}
document.addEventListener('click',e=>{const button=e.target.closest('[data-reset-unique]');if(!button)return;const offset=Number(button.dataset.resetUnique);slots.fill(null,offset,offset+3);if(offset>=9)penaltySlots.fill(null,offset-9,offset-6);draft();notify('この遺物の効果をすべて外しました。');});

function vesselOrder(v){if(v.normal[2]==='白')return 0;if(v.deep[2]==='白')return 1;if(v.normal.every(c=>c===v.normal[0])&&v.deep.every(c=>c===v.deep[0])&&v.normal[0]===v.deep[0])return 3;return 2;}
function availableVessels(){return VESSELS.filter(v=>v.name.includes($('character').value)||v.name.endsWith('の聖杯')).sort((a,b)=>vesselOrder(a)-vesselOrder(b));}
function vesselArt(v){return '<img class="vessel-art" src="assets/icons/vessel-gold-compact.png" alt=""/>';}
function vesselColors(colors){return colors.map(c=>`<span class="vessel-aura gem-${c}" role="img" aria-label="${c}" title="${c}"><svg viewBox="0 0 40 44" aria-hidden="true"><ellipse cx="20" cy="36" rx="16" ry="5" fill="none" stroke="currentColor" stroke-width="2" opacity=".65"/><path d="M20 36C10 36 7 30 11 23L14 27C13 18 19 16 17 6C25 10 27 17 25 23L30 18C29 23 35 27 30 32C27 35 24 36 20 36Z" fill="currentColor"/><path d="M20 35C15 35 14 31 17 27L19 29C18 24 22 23 22 19C28 27 27 35 20 35Z" fill="white" opacity=".25"/></svg></span>`).join('');}
function renderVessel(){$('clear-vessel').disabled=!vesselId;const v=VESSELS.find(v=>v.id===vesselId);$('choose-vessel').innerHTML=vesselArt(v)+`<span>${v?escapeHtml(v.name):'- - -'}</span><span>▾</span>`;for(const type of ['normal','deep'])document.querySelectorAll('#'+type+'-grid .relic-icon').forEach((icon,i)=>{const unique=type==='normal'?UNIQUE_RELICS.find(relic=>!relic.isShop&&relic.effectIds.every((id,j)=>slots[i*3+j]===id)):null;icon.className=unique?'relic-icon unique-relic-icon':'relic-icon relic-crystal'+(v?' vessel-gem gem-'+v[type][i]:'');icon.style.backgroundImage=unique?`url("${unique.image}")`:'';icon.textContent='';icon.setAttribute('aria-label',unique?unique.name:v?v[type][i]+'の遺物':'遺物');const card=icon.closest('.relic-card');if(v)card.dataset.relicColor=v[type][i];else delete card.dataset.relicColor;});}
$('choose-vessel').onclick=()=>{$('vessel-list').innerHTML=availableVessels().map(v=>`<button class="vessel-option" data-vessel="${v.id}" aria-pressed="${v.id===vesselId}"><span><strong>${escapeHtml(v.name)}</strong><span class="vessel-color-row">通常 ${vesselColors(v.normal)}</span><span class="vessel-color-row">深層 ${vesselColors(v.deep)}</span></span></button>`).join('');$('vessel-picker').showModal();};
$('close-vessel').onclick=()=>$('vessel-picker').close();
$('vessel-list').onclick=e=>{const b=e.target.closest('[data-vessel]');if(!b)return;vesselId=b.dataset.vessel||null;draft();$('vessel-picker').close();};
renderVessel();

function openDesiredPicker(scope='all'){
 if(!$('desired-picker'))return;
 $('desired-scope-filter').value=['normal','deep','common'].includes(scope)?scope:'all';
 $('desired-search').value='';
 $('desired-category').replaceChildren(new Option('すべてのカテゴリ',''),...[...new Set([...effectByName.values()].map(e=>e.category))].map(c=>new Option(c,c)));
 renderDesiredPickerResults();
 $('desired-picker').showModal();
 $('desired-search').focus();
}
function renderDesiredPickerResults(){
 if(!$('desired-picker'))return;
 const scope=$('desired-scope-filter').value||'all',cat=$('desired-category').value,onlyChar=$('desired-only-character').checked,q=normalizeReadingSearch($('desired-search').value).trim().split(/\s+/).filter(Boolean);
 const scopeLabels={normal:'通常限定',deep:'深層限定',common:'共通'};
 const filtered=[...effectByName.values()].filter(entry=>{
  const sc=desiredEffectScope(entry.name);
  if(scope!=='all'&&sc!==scope)return false;
  if(cat&&entry.category!==cat)return false;
  if(onlyChar&&entry.character&&entry.character!==$('character').value)return false;
  const reading=(EFFECT_READINGS.effects[entry.normal?.id]||'')+' '+(EFFECT_READINGS.effects[entry.deep?.id]||'');
  return q.every(w=>normalizeReadingSearch(entry.name+' '+entry.category+' '+reading).includes(w));
 });
 $('desired-results-count').textContent=`${filtered.length} 件の効果（選択中: ${desiredEffects.length} 件）`;
 $('desired-results').innerHTML=filtered.length?filtered.map(entry=>{
  const sc=desiredEffectScope(entry.name),rep=sc==='deep'?entry.deep:(entry.normal||entry.deep),selected=desiredEffects.includes(entry.name);
  const badge=sc==='common'?(effectOddsBadge(entry.normal,'normal')||effectOddsBadge(entry.deep,'deep')):effectOddsBadge(rep,sc);
  return `<div class="result-row"><button class="result ${selected?'is-selected':''}" type="button" ${tooltipAttrs(rep)} data-desired-pick-name="${escapeHtml(entry.name)}"><span><span class="effect-name"><span class="desired-scope-tag scope-${sc}">${scopeLabels[sc]}</span><span class="effect-label">${escapeHtml(entry.name)}</span>${entry.deep?.hasPenalty?penaltyMark(entry.deep):''}${badge}</span><small>${escapeHtml(entry.category)}${entry.deep&&!entry.deep.hasPenalty?' · デメリットなし':''}</small></span><b>${selected?'✓':'＋'}</b></button></div>`;
 }).join(''):'<p class="empty">該当する効果がありません。<br>検索語やカテゴリを変更してください。</p>';
}
if($('desired-picker')){
 for(const id of ['desired-search','desired-scope-filter','desired-category','desired-only-character'])$(id)?.addEventListener(id==='desired-search'?'input':'change',renderDesiredPickerResults);
 $('close-desired-picker')?.addEventListener('click',()=>$('desired-picker').close());
 $('desired-effects-add')?.addEventListener('click',()=>openDesiredPicker('all'));
 $('desired-effects-from-slots')?.addEventListener('click',()=>{
  let added=0;
  for(const id of slots){const e=lookup.get(id);if(e&&!e.uniqueOnly&&effectByName.has(e.name)&&!desiredEffects.includes(e.name)&&desiredEffects.length<60){desiredEffects.push(e.name);added++;}}
  if(added){draft();notify(`現在の遺物構成から ${added} 件の効果を追加しました。`);}
  else notify('追加できる新しい効果はありません（すでに追加済みか未選択です）。');
 });
 $('desired-effects-clear')?.addEventListener('click',()=>{
  if(!desiredEffects.length)return;
  desiredEffects=[];draft();notify('ほしい遺物効果リストをクリアしました。');
 });
}
function effectIdForDrop(from,to){
 const source=lookup.get(slots[from]);if(!source)return null;
 const targetType=to<9?'normal':'deep';
 return source.type===targetType?source.id:EFFECTS.find(effect=>effect.type===targetType&&effect.name===source.name)?.id||null;
}
function effectIdForDesiredDrop(effectName,to){
 const targetType=to<9?'normal':'deep';
 return EFFECTS.find(effect=>!effect.uniqueOnly&&effect.type===targetType&&effect.name===effectName)?.id||null;
}
function applyDesiredToSlot(effectName,to){
 const targetId=effectIdForDesiredDrop(effectName,to);if(!targetId)return false;
 const conflict=typeof getSlotConflictWithRelic==='function'?getSlotConflictWithRelic(effectName,to):null;
 slots[to]=targetId;
 if(to>=9&&!lookup.get(targetId)?.hasPenalty)penaltySlots[to-9]=null;
 draft();
 if(conflict&&typeof notify==='function')notify('⚠️ '+conflict.message);
 return true;
}
function applyDesiredToFirstEmptySlot(effectName){
 const hasNormal=EFFECTS.some(effect=>!effect.uniqueOnly&&effect.type==='normal'&&effect.name===effectName);
 const hasDeep=EFFECTS.some(effect=>!effect.uniqueOnly&&effect.type==='deep'&&effect.name===effectName);
 const ranges=[];
 if(hasNormal)ranges.push([0,8]);
 if(hasDeep)ranges.push([9,17]);
 for(const [start,end] of ranges){
  for(let i=start;i<=end;i++){
   if(!slots[i]&&!(typeof getSlotConflictWithRelic==='function'&&getSlotConflictWithRelic(effectName,i)))return applyDesiredToSlot(effectName,i);
  }
 }
 for(const [start,end] of ranges){
  for(let i=start;i<=end;i++){
   if(!slots[i])return applyDesiredToSlot(effectName,i);
  }
 }
 if(typeof notify==='function')notify('空きスロットがありません。入れたいスロットへドラッグ＆ドロップしてください。');
 return false;
}
function moveEffect(from,to){
 if(from===to||!effectIdForDrop(from,to))return false;
 if(Math.floor(from/3)===Math.floor(to/3)){
  [slots[from],slots[to]]=[slots[to],slots[from]];
  if(from>=9)[penaltySlots[from-9],penaltySlots[to-9]]=[penaltySlots[to-9],penaltySlots[from-9]];
  draft();return true;
 }else{
  const source=lookup.get(slots[from]),targetId=effectIdForDrop(from,to);
  const conflict=source&&typeof getSlotConflictWithRelic==='function'?getSlotConflictWithRelic(source.name,to):null;
  slots[to]=targetId;
  if(to>=9)penaltySlots[to-9]=from>=9&&source.hasPenalty?penaltySlots[from-9]:null;
  draft();
  if(conflict&&typeof notify==='function')notify('⚠️ '+conflict.message);
  return true;
 }
}
let effectDrag=null,suppressDragClickUntil=0;
document.addEventListener('pointerdown',event=>{
 const desiredItem=event.target.closest('.desired-effect-item');
 if(desiredItem&&event.button===0&&!event.target.closest('button')){
  if(event.pointerType==='touch'&&!event.target.closest('.desired-drag-handle'))return;
  event.preventDefault();event.stopPropagation();
  const effectName=desiredItem.dataset.desiredEffect;
  if(!effectName)return;
  const rect=desiredItem.getBoundingClientRect();
  const ghost=desiredItem.cloneNode(true);ghost.classList.add('effect-drag-ghost');ghost.style.width=rect.width+'px';ghost.style.left=rect.left+'px';ghost.style.top=rect.top+'px';ghost.setAttribute('aria-hidden','true');document.body.append(ghost);desiredItem.classList.add('effect-drag-source');
  effectDrag={kind:'desired',effectName,id:event.pointerId,x:event.clientX,y:event.clientY,moved:false,handle:desiredItem,source:desiredItem,ghost,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top};
  desiredItem.setPointerCapture(event.pointerId);
  return;
 }
 const handle=event.target.closest('.drag-handle');if(!handle||event.button!==0)return;
 event.preventDefault();event.stopPropagation();
 const from=Number(handle.closest('[data-slot]').dataset.slot);
 if(!slots[from])return;
 const source=handle.closest('.effect-entry'),rect=source.getBoundingClientRect();
 const ghost=source.cloneNode(true);ghost.classList.add('effect-drag-ghost');ghost.querySelectorAll('button').forEach(button=>button.removeAttribute('data-slot'));ghost.style.width=rect.width+'px';ghost.style.left=rect.left+'px';ghost.style.top=rect.top+'px';ghost.setAttribute('aria-hidden','true');document.body.append(ghost);source.classList.add('effect-drag-source');document.body.classList.add('effect-dragging');
 effectDrag={kind:'slot',from,id:event.pointerId,x:event.clientX,y:event.clientY,moved:false,handle,source,ghost,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top};
 handle.setPointerCapture(event.pointerId);
},true);
document.addEventListener('pointermove',event=>{
 const drag=effectDrag;if(!drag||drag.id!==event.pointerId)return;
 drag.ghost.style.left=(event.clientX-drag.offsetX)+'px';drag.ghost.style.top=(event.clientY-drag.offsetY)+'px';if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>6)drag.moved=true;
 if(!drag.moved)return;
 event.preventDefault();document.body.classList.add('effect-dragging');
 document.querySelectorAll('.drop-target,.drop-compatible').forEach(el=>{el.classList.remove('drop-target','drop-compatible');});
 if(drag.kind==='desired'){
  document.querySelectorAll('[data-slot]').forEach(slotEl=>{const idx=Number(slotEl.dataset.slot);if(effectIdForDesiredDrop(drag.effectName,idx)&&!getSlotConflictWithRelic(drag.effectName,idx))slotEl.classList.add('drop-compatible');});
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-slot]');
  if(target&&effectIdForDesiredDrop(drag.effectName,Number(target.dataset.slot)))target.classList.add('drop-target');
 }else{
  const elAtPoint=document.elementFromPoint(event.clientX,event.clientY);
  const target=elAtPoint?.closest('[data-slot]');
  if(target&&effectIdForDrop(drag.from,Number(target.dataset.slot)))target.classList.add('drop-target');
  const desiredPanel=elAtPoint?.closest('#desired-effects-panel');
  const srcEffect=lookup.get(slots[drag.from]);
  if(desiredPanel&&srcEffect&&!srcEffect.uniqueOnly&&effectByName.has(srcEffect.name))desiredPanel.classList.add('drop-target');
 }
}, {capture:true,passive:false});
function finishEffectDrag(event){
 const drag=effectDrag;if(!drag||drag.id!==event.pointerId)return;
 effectDrag=null;drag.ghost.remove();drag.source.classList.remove('effect-drag-source');suppressDragClickUntil=Date.now()+400;
 event.preventDefault();event.stopPropagation();document.body.classList.remove('effect-dragging');
 document.querySelectorAll('.drop-target,.drop-compatible').forEach(el=>{el.classList.remove('drop-target','drop-compatible');});
 if(event.type==='pointerup'){
  if(drag.kind==='desired'){
   if(drag.moved){
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-slot]');
    if(target)applyDesiredToSlot(drag.effectName,Number(target.dataset.slot));
   }else{
    applyDesiredToFirstEmptySlot(drag.effectName);
   }
  }else if(drag.moved){
   const elAtPoint=document.elementFromPoint(event.clientX,event.clientY);
   const target=elAtPoint?.closest('[data-slot]');
   if(target){moveEffect(drag.from,Number(target.dataset.slot));}
   else if(elAtPoint?.closest('#desired-effects-panel')){
    const srcEffect=lookup.get(slots[drag.from]);
    if(srcEffect&&!srcEffect.uniqueOnly&&effectByName.has(srcEffect.name)){
     if(!desiredEffects.includes(srcEffect.name)&&desiredEffects.length<60){desiredEffects.push(srcEffect.name);draft();notify(`「${srcEffect.name}」をほしい遺物効果に追加しました。`);}
     else notify(`「${srcEffect.name}」はすでにリストにあります。`);
    }
   }
  }
 }
}
document.addEventListener('pointerup',finishEffectDrag,true);
document.addEventListener('pointercancel',finishEffectDrag,true);
document.addEventListener('click',event=>{if(Date.now()<suppressDragClickUntil||event.target.closest('.drag-handle')){event.preventDefault();event.stopImmediatePropagation();}},true);

$('clear-vessel').onclick=()=>{vesselId=null;draft();};

$('reset-all-relics').onclick=()=>{slots=Array(18).fill(null);penaltySlots=Array(9).fill(null);draft();notify('すべての遺物の効果をリセットしました。');};
