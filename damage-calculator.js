'use strict';

// The estimate uses only relic effects with a documented percentage or multiplier.
// A scenario represents one damage component of one attack, not an entire weapon hit.
const DAMAGE_SCENARIOS=[
 {id:'physical-normal',label:'物理・通常攻撃',element:'物理',kind:'normal',melee:true,weapon:true},
 {id:'physical-skill',label:'物理・戦技',element:'物理',kind:'skill',melee:true,weapon:true},
 {id:'physical-guard',label:'物理・ガードカウンター',element:'物理',kind:'guard',melee:true,weapon:true},
 {id:'physical-critical',label:'物理・致命',element:'物理',kind:'critical',melee:true,weapon:true},
 ...[['dash','ダッシュ'],['charged','タメ'],['dual','二刀持ち'],['twohand','両手持ち'],['roll','ローリング']].map(([kind,label])=>({id:'physical-'+kind,label:'物理・'+label,element:'物理',kind,melee:true,weapon:true})),
 {id:'physical-bow',label:'物理・弓',element:'物理',kind:'normal',melee:false,weapon:true},
 {id:'physical-bow-charged',label:'物理・弓のタメ',element:'物理',kind:'charged',melee:false,weapon:true},
 {id:'roar',label:'咆哮・ブレス',element:'物理',kind:'roar'},
 ...['魔力','炎','雷','聖'].flatMap(element=>[
  {id:element+'-normal',label:element+'・通常攻撃',element,kind:'normal',melee:true,weapon:true},
  {id:element+'-skill',label:element+'・戦技',element,kind:'skill',melee:true,weapon:true}
 ]),
 {id:'sorcery',label:'魔術',element:'魔力',kind:'sorcery'},
 ...['物理','炎','雷','聖'].map(element=>({id:element+'-incantation',label:element+'・祈祷',element,kind:'incantation'})),
 {id:'pot',label:'投擲壺',element:'炎',kind:'pot'},
 {id:'knife',label:'投擲ナイフ',element:'物理',kind:'knife'},
 {id:'stone',label:'輝石・重力石',element:'魔力',kind:'stone'},
 {id:'perfume',label:'火花の香り',element:'炎',kind:'perfume'}
];

// Percentage values and stacking are from the affix table on 神攻略wiki.
// Each selected affix is one weapon slot; percentages stack multiplicatively.
const DAMAGE_AFFIXES=[
 ['HP最大時、攻撃力上昇',[7,10,14],'all'],
 ['HP低下時、攻撃力上昇',[13,17,21],'all'],
 ['物理攻撃力上昇',[8,10],'physical'],
 ['属性攻撃力上昇',[6,8],'elemental'],
 ...['魔力','炎','雷','聖'].map(element=>[element+'攻撃力上昇',[6,9,12],element]),
 ['近接攻撃力上昇',[9,12,15],'melee'],
 ['戦技攻撃力上昇',[15,18,21],'skill'],
 ['ガードカウンター強化',[17,20,23],'guard'],
 ['致命の一撃強化',[12,18,24],'critical'],
 ['ダッシュ攻撃強化',[20,24,28],'dash'],
 ['タメ攻撃強化',[16,19,22],'charged'],
 ['二刀持ちの攻撃力上昇',[12,15,18],'dual'],
 ['両手持ちの攻撃力上昇',[12,15,18],'twohand'],
 ['ローリング攻撃強化',[20,24,28],'roll'],
 ['射撃攻撃強化',[7,10,14],'bow'],
 ['魔術強化',[5,8,11],'sorcery'],
 ['祈祷強化',[5,8,11],'incantation'],
 ['魔術／祈祷強化',[6,8],'magic'],
 ['HP最大時、カット率上昇',[24,32,40],'def:all'],
 ['HP低下時、カット率上昇',[18,24,30],'def:all'],
 ['被ダメージ時、カット率上昇',[21,28,36],'def:all'],
 ['攻撃連続時、一度だけカット率上昇',[38,48,60],'def:all'],
 ['タメ攻撃命中時、カット率上昇',[21,28,36],'def:all'],
 ['魔術／祈祷の詠唱時、カット率上昇',[18,24,30],'def:all'],
 ['物理カット率上昇',[9,12,15],'def:physical'],
 ['属性カット率上昇',[8,10,12],'def:elemental'],
 ...['魔力','炎','雷','聖'].map(element=>[element+'カット率上昇',[10,14,18],'def:'+element])
].flatMap(([name,values,condition])=>values.map(value=>({id:name+'|'+value,name,percent:value,condition})));
const DAMAGE_AFFIX_LOOKUP=new Map(DAMAGE_AFFIXES.map(affix=>[affix.id,affix]));
const DEFENSE_ELEMENTS=[
 {id:'物理',label:'物理'},
 {id:'魔力',label:'魔力'},
 {id:'炎',label:'炎'},
 {id:'雷',label:'雷'},
 {id:'聖',label:'聖'}
];
function affixApplies(affix,scenario){
 const c=affix.condition;
 if(c.startsWith('def:'))return false;
 if(c==='all')return true;
 if(c==='physical')return scenario.element==='物理';
 if(c==='elemental')return scenario.element!=='物理';
 if(c==='melee')return !!scenario.melee;
 if(c==='bow')return scenario.id==='physical-bow';
 if(c==='magic')return scenario.kind==='sorcery'||scenario.kind==='incantation';
 return c===scenario.kind||c===scenario.element;
}
function defenseAffixApplies(affix,element){
 const c=affix.condition;
 if(!c.startsWith('def:'))return false;
 const target=c.slice(4);
 if(target==='all')return true;
 if(target==='physical')return element==='物理';
 if(target==='elemental')return element!=='物理';
 return target===element;
}
function applicableDefenseAffixes(ids,element){
 const selected=ids.slice(0,12).map(id=>DAMAGE_AFFIX_LOOKUP.get(id)).filter(affix=>affix&&defenseAffixApplies(affix,element));
 const hp=selected.filter(affix=>affix.name==='HP最大時、カット率上昇'||affix.name==='HP低下時、カット率上昇');
 if(!hp.some(affix=>affix.name==='HP最大時、カット率上昇')||!hp.some(affix=>affix.name==='HP低下時、カット率上昇'))return selected;
 const full=hp.filter(affix=>affix.name==='HP最大時、カット率上昇'),low=hp.filter(affix=>affix.name==='HP低下時、カット率上昇');
 const product=values=>values.reduce((value,affix)=>value*(1-affix.percent/100),1);
 const excluded=product(full)<=product(low)?'HP低下時、カット率上昇':'HP最大時、カット率上昇';
 return selected.filter(affix=>affix.name!==excluded);
}
function applicableAffixes(ids,scenario){
 const selected=ids.slice(0,12).map(id=>DAMAGE_AFFIX_LOOKUP.get(id)).filter(affix=>affix&&affixApplies(affix,scenario));
 // Full-HP and low-HP bonuses cannot be active on the same hit.
 const hp=selected.filter(affix=>affix.name==='HP最大時、攻撃力上昇'||affix.name==='HP低下時、攻撃力上昇');
 if(!hp.some(affix=>affix.name==='HP最大時、攻撃力上昇')||!hp.some(affix=>affix.name==='HP低下時、攻撃力上昇'))return selected;
 const full=hp.filter(affix=>affix.name==='HP最大時、攻撃力上昇'),low=hp.filter(affix=>affix.name==='HP低下時、攻撃力上昇');
 const product=values=>values.reduce((value,affix)=>value*(1+affix.percent/100),1);
 const excluded=product(full)>=product(low)?'HP低下時、攻撃力上昇':'HP最大時、攻撃力上昇';
 return selected.filter(affix=>affix.name!==excluded);
}

const INCANTATION_SCHOOL_ELEMENT={
 '獣の祈祷を強化':'物理',
 '巨人の火の祈祷を強化':'炎',
 '神狩りの祈祷を強化':'炎',
 '狂い火の祈祷を強化':'炎',
 '王都古竜信仰の祈祷を強化':'雷',
 '黄金律原理主義の祈祷を強化':'聖'
};
function damageLevel(name){return Number(name.match(/\+(\d+)$/)?.[1]||0);}
function damageFactor(effect,scenario,counts){
 const n=effect.name,lv=damageLevel(n),deep=effect.type==='deep';
 const attack=n.match(/^(物理|魔力|炎|雷|聖)攻撃力上昇(?:\+\d+)?$/);
 if(attack)return attack[1]===scenario.element?1+(deep?[4,5,6,10.5,12]:[4,5,6])[lv]/100:null;
 if(/^属性攻撃力上昇(?:\+\d+)?$/.test(n))return scenario.element!=='物理'?1+[5,8,10][lv]/100:null;
 if(n==='封牢の囚を倒す度、攻撃力上昇')return counts.evergaol?1.05**counts.evergaol:null;
 if(n==='夜の侵入者を倒す度、攻撃力上昇')return counts.invader?1.07**counts.invader:null;
 if(n==='近接攻撃力上昇')return scenario.melee?1.05:null;
 if(n==='戦技攻撃力上昇')return scenario.kind==='skill'?1.15:null;
 if(n==='咆哮とブレス強化')return scenario.kind==='roar'?1.15:null;
 if(n==='通常攻撃の1段目強化')return scenario.kind==='normal'?1.15:null;
 if(n==='攻撃連続時、攻撃力上昇')return scenario.weapon?1.22:null;
 if(/^致命の一撃強化(?:\+1)?$/.test(n))return scenario.kind==='critical'?(lv?1.24:1.17):null;
 if(n==='武器の持ち替え時、物理攻撃力上昇')return scenario.weapon&&scenario.element==='物理'?1.1:null;
 if(n==='属性攻撃力が付加された時、属性攻撃力上昇')return scenario.weapon&&scenario.element!=='物理'?1.1:null;
 if(n==='攻撃を受けると攻撃力上昇')return 1.15;
 if(n==='状態異常ゲージがある時、徐々に攻撃力上昇')return 1.45;
 if(n==='周囲で毒／腐敗状態の発生時、攻撃力上昇')return 1.12;
 if(/^周囲で(睡眠|発狂)状態の発生時、攻撃力上昇(?:\+\d+)?$/.test(n))return 1+[12,22][lv]/100;
 if(/^(毒|腐敗|凍傷)状態の敵に対する攻撃を強化(?:\+\d+)?$/.test(n))return deep?1+[10,16,20][lv]/100:1.1;
 if(/^脂アイテム使用時、追加で物理攻撃力上昇(?:\+\d+)?$/.test(n))return scenario.weapon&&scenario.element==='物理'?deep?1+[10,17,20][lv]/100:1.1:null;
 if(/^ガードカウンター強化(?:\+\d+)?$/.test(n))return scenario.kind==='guard'?deep?[1.17,1.25,1.29][lv]:1.17:null;
 if(/^魔術強化(?:\+\d+)?$/.test(n))return scenario.kind==='sorcery'?1+[5,8.5,10][lv]/100:null;
 if(/^祈祷強化(?:\+\d+)?$/.test(n))return scenario.kind==='incantation'?1+[5,8.5,10][lv]/100:null;
 if(/^投擲壺の攻撃力上昇(?:\+\d+)?$/.test(n))return scenario.kind==='pot'?(deep&&lv?1.3:1.15):null;
 if(/^投擲ナイフの攻撃力上昇(?:\+\d+)?$/.test(n))return scenario.kind==='knife'?(deep&&lv?1.3:1.14):null;
 if(/^輝石、重力石アイテムの攻撃力上昇(?:\+\d+)?$/.test(n))return scenario.kind==='stone'?(deep&&lv?1.3:1.15):null;
 if(/^調香術強化(?:\+\d+)?$/.test(n))return scenario.kind==='perfume'?(deep&&lv?1.3:1.14):null;
 if(n==='【無頼漢】スキル中に攻撃を受けると攻撃力と最大スタミナ上昇')return 1.1;
 if(n==='【復讐者】ファミリーと共闘中の間、自身を強化')return 1.1;
 if(n==='【隠者】アーツ発動時、自身が出血状態になり、攻撃力上昇')return 1.16;
 if(n==='【執行者】スキル中の攻撃力上昇、攻撃時にカット率低下')return 1.35;
 if(n==='【葬儀屋】アーツ発動時、攻撃力上昇')return 1.18;
 if(n==='【葬儀屋】連撃の最終攻撃命中時、攻撃力上昇')return 1.16;
 if(n==='【葬儀屋】祈祷を使用して、自身に補助効果発生時物理攻撃力上昇')return scenario.element==='物理'?1.19:null;
 if(n.endsWith('の魔術を強化'))return scenario.kind==='sorcery'?1.12:null;
 if(n.endsWith('の祈祷を強化')){
  if(scenario.kind!=='incantation')return null;
  const reqElem=INCANTATION_SCHOOL_ELEMENT[n];
  return (!reqElem||scenario.element===reqElem)?1.12:null;
 }
 if(/の攻撃力上昇$/.test(n)&&scenario.weapon){return n.startsWith('弓')?(scenario.melee?null:1.06):(scenario.melee?1.09:null);}
 return null;
}

function damageStackKey(effect){
 const n=effect.name;
 if(n==='封牢の囚を倒す度、攻撃力上昇'||n==='夜の侵入者を倒す度、攻撃力上昇')return n;
 // GameWith's effect table marks these damage effects as stackable (◯).
 if(/^(物理|魔力|炎|雷|聖|属性)攻撃力上昇(?:\+\d+)?$/.test(n))return null;
 if(/^(致命の一撃強化|魔術強化|祈祷強化|ガードカウンター強化|投擲壺の攻撃力上昇|投擲ナイフの攻撃力上昇|輝石、重力石アイテムの攻撃力上昇|調香術強化)(?:\+\d+)?$/.test(n))return null;
 if(['通常攻撃の1段目強化','咆哮とブレス強化','近接攻撃力上昇','戦技攻撃力上昇'].includes(n))return null;
 if(n.endsWith('の魔術を強化')||n.endsWith('の祈祷を強化'))return null;
 if(effect.type==='deep'&&/^(毒|腐敗|凍傷)状態の敵に対する攻撃を強化|^周囲で(睡眠|発狂)状態の発生時、攻撃力上昇|^脂アイテム使用時、追加で物理攻撃力上昇/.test(n))return n;
 return n.replace(/\+\d+$/,'');
}

function calculateDamage(effects,scenario,counts,affixIds=[],disabledNames=[]){
 const used=new Map(),special=new Map();
 for(const effect of effects){
  if(!effect)continue;
  const factor=damageFactor(effect,scenario,counts);
  if(!factor||factor<=1)continue;
  let group=null;
  if(/の攻撃力上昇$/.test(effect.name)&&!effect.name.includes('、')&&!/^(投擲壺|投擲ナイフ)/.test(effect.name))group='weapon-kind';
  const item={name:effect.name,factor};
  if(group){if(!special.has(group)||special.get(group).factor<factor)special.set(group,item);continue;}
  const key=damageStackKey(effect);
  if(key){if(!used.has(key)||used.get(key).factor<factor)used.set(key,item);}
  else used.set(Symbol(),item);
 }
 const items=[...used.values(),...special.values(),...applicableAffixes(affixIds,scenario).map(affix=>({name:'付帯：'+affix.name+' +'+affix.percent+'%',factor:1+affix.percent/100}))];
 for(const item of items)item.enabled=!disabledNames.includes(item.name);
 const multiplier=items.reduce((value,item)=>value*(item.enabled?item.factor:1),1);
 return {scenario,multiplier,items};
}

function damageItemSortRank(name){
 const n=String(name||'');
 if(n.startsWith('付帯：'))return 800;
 if(n.startsWith('デメリット：'))return 900;
 const base=n.replace(/\+\d+$/,'');
 if(n.startsWith('【'))return 100;
 if(n==='封牢の囚を倒す度、攻撃力上昇')return 200;
 if(n==='夜の侵入者を倒す度、攻撃力上昇')return 201;
 if(/^(物理|魔力|炎|雷|聖)攻撃力上昇$/.test(base))return 300+['物理','魔力','炎','雷','聖'].indexOf(base.replace('攻撃力上昇',''))*10-damageLevel(n);
 if(base==='属性攻撃力上昇')return 360-damageLevel(n);
 if(base==='近接攻撃力上昇')return 400;
 if(base==='通常攻撃の1段目強化')return 410;
 if(base==='戦技攻撃力上昇')return 420;
 if(base==='ガードカウンター強化')return 430-damageLevel(n);
 if(base==='致命の一撃強化')return 440-damageLevel(n);
 if(base==='咆哮とブレス強化')return 450;
 if(/の攻撃力上昇$/.test(base)&&!base.includes('、')&&!/^(投擲壺|投擲ナイフ)/.test(base))return 460;
 if(base==='魔術強化')return 500-damageLevel(n);
 if(base.endsWith('の魔術を強化'))return 510;
 if(base==='祈祷強化')return 520-damageLevel(n);
 if(base.endsWith('の祈祷を強化'))return 530;
 if(/^(投擲壺の攻撃力上昇|投擲ナイフの攻撃力上昇|輝石、重力石アイテムの攻撃力上昇|調香術強化)$/.test(base))return 550-damageLevel(n);
 if(/^(毒|腐敗|凍傷)状態の敵に対する攻撃を強化$/.test(base))return 600-damageLevel(n);
 if(/^周囲で(毒／腐敗|睡眠|発狂)状態の発生時、攻撃力上昇$/.test(base))return 620-damageLevel(n);
 if(base==='状態異常ゲージがある時、徐々に攻撃力上昇')return 640;
 if(base==='攻撃連続時、攻撃力上昇')return 650;
 if(base==='攻撃を受けると攻撃力上昇')return 660;
 if(base==='武器の持ち替え時、物理攻撃力上昇'||base==='属性攻撃力が付加された時、属性攻撃力上昇'||base==='脂アイテム使用時、追加で物理攻撃力上昇')return 670-damageLevel(n);
 return 700;
}

function groupDamageItems(items){
 const groups=new Map();
 for(const item of items){
  const group=groups.get(item.name);
  if(group){group.count++;group.factor*=item.factor;}
  else groups.set(item.name,{name:item.name,count:1,factor:item.factor,enabled:item.enabled!==false});
 }
 return [...groups.values()].sort((a,b)=>{
  const ra=damageItemSortRank(a.name),rb=damageItemSortRank(b.name);
  if(ra!==rb)return ra-rb;
  if(b.factor!==a.factor)return b.factor-a.factor;
  return a.name.localeCompare(b.name,'ja');
 });
}

function damageCountAvailability(effects){
 return {
  evergaol:effects.some(effect=>effect?.name==='封牢の囚を倒す度、攻撃力上昇'),
  invader:effects.some(effect=>effect?.name==='夜の侵入者を倒す度、攻撃力上昇'),
  greatChurch:effects.some(effect=>effect?.name==='大教会の強敵を倒す度、最大HP上昇')
 };
}

const CHARACTER_BASE_HP={
 追跡者:1120,
 守護者:1280,
 鉄の目:820,
 レディ:860,
 無頼漢:1200,
 復讐者:780,
 隠者:740,
 執行者:1000,
 学者:900,
 葬儀屋:1040
};
const CHARACTER_VIGOR_CHANGE={
 '【追跡者】精神力上昇、生命力低下':-5,
 '【守護者】筋力/技量上昇、生命力低下':-8,
 '【守護者】精神力/信仰上昇、生命力低下':-6,
 '【鉄の目】生命力/筋力上昇、技量低下':5,
 '【レディ】生命力/筋力上昇、精神力低下':3,
 '【無頼漢】精神力/知力上昇、生命力/持久力低下':-8,
 '【無頼漢】神秘上昇、生命力低下':-4,
 '【復讐者】生命力/持久力上昇、精神力低下':5,
 '【隠者】生命力/持久力/技量上昇、知力/信仰低下':4,
 '【執行者】生命力/持久力上昇、神秘低下':5,
 '【執行者】技量/神秘上昇、生命力低下':-7,
 '【学者】精神力上昇、生命力低下':-3,
 '【葬儀屋】技量上昇、生命力/信仰低下':-5
};
function hpEffectEntry(effect,counts={}){
 if(!effect)return null;
 const n=effect.name,deep=effect.type==='deep',lv=damageLevel(n);
 if(/^生命力\+\d+$/.test(n))return {name:n,kind:'flat',flat:lv*20,stackKey:null};
 if(n==='最大HP上昇'&&!deep)return {name:'最大HP上昇（通常）',kind:'flat',flat:100,stackKey:'normal:最大HP上昇'};
 if(n==='最大HP上昇'&&deep)return {name:'最大HP上昇（深層）',kind:'mult',factor:1.10,stackKey:null};
 if(/^(小盾|中盾|大盾)の武器種を3つ以上装備していると最大HP上昇$/.test(n))return {name:n,kind:'flat',flat:200,stackKey:n};
 if(CHARACTER_VIGOR_CHANGE[n]!==undefined)return {name:n,kind:'flat',flat:CHARACTER_VIGOR_CHANGE[n]*20,stackKey:n};
 if(n==='大教会の強敵を倒す度、最大HP上昇'){
  const c=validDamageCount(counts.greatChurch);
  return c>0?{name:n,kind:'mult',factor:1.05**c,stackKey:n}:null;
 }
 if(n==='【隠者】アーツ発動時、最大HP上昇')return {name:n,kind:'mult',factor:1.50,stackKey:n};
 return null;
}
function hpPenaltyEntry(penaltyName){
 if(penaltyName==='生命力と神秘が低下')return {name:'デメリット：'+penaltyName,kind:'flat',flat:-60};
 if(penaltyName==='瀕死時、最大HP低下')return {name:'デメリット：'+penaltyName,kind:'mult',factor:0.75};
 return null;
}
function defenseItemSortRank(name){
 const n=String(name||'');
 if(n.startsWith('付帯：'))return 800;
 if(n.startsWith('デメリット：'))return 900;
 const base=n.replace(/\+\d+$/,'');
 if(n.startsWith('【'))return 100;
 if(/^(物理|魔力|炎|雷|聖)カット率上昇$/.test(base))return 300+['物理','魔力','炎','雷','聖'].indexOf(base.replace('カット率上昇',''))*10-damageLevel(n);
 if(base==='属性カット率上昇')return 360-damageLevel(n);
 if(base==='HP低下時、カット率上昇')return 500;
 if(base==='ダメージで吹き飛ばされた時、強靭度とカット率上昇')return 510;
 return 700;
}

function groupDefenseItems(items){
 const groups=new Map();
 for(const item of items){
  const group=groups.get(item.name);
  if(group){group.count++;group.factor*=item.factor;}
  else groups.set(item.name,{name:item.name,count:1,factor:item.factor,enabled:item.enabled!==false});
 }
 return [...groups.values()].sort((a,b)=>{
  const ra=defenseItemSortRank(a.name),rb=defenseItemSortRank(b.name);
  if(ra!==rb)return ra-rb;
  if(a.factor!==b.factor)return a.factor-b.factor;
  return a.name.localeCompare(b.name,'ja');
 });
}
function groupHpItems(items){
 const groups=new Map();
 for(const item of items){
  const g=groups.get(item.name);
  if(g){
   g.count++;
   if(item.kind==='flat')g.flat+=item.flat;
   else g.factor*=item.factor;
  }else{
   groups.set(item.name,{name:item.name,kind:item.kind,count:1,flat:item.flat||0,factor:item.factor||1,enabled:item.enabled!==false});
  }
 }
 return [...groups.values()];
}
function calculateMaxHp(character,effects=[],counts={},disabledNames=[],penalties=[]){
 const baseHp=CHARACTER_BASE_HP[character]||1000;
 const used=new Map(),rawItems=[];
 for(const effect of effects){
  const entry=hpEffectEntry(effect,counts);
  if(!entry)continue;
  if(entry.stackKey){
   if(!used.has(entry.stackKey))used.set(entry.stackKey,entry);
  }else{
   rawItems.push(entry);
  }
 }
 const items=[...used.values(),...rawItems];
 for(const p of penalties){
  const pen=hpPenaltyEntry(p);
  if(pen)items.push(pen);
 }
 for(const item of items)item.enabled=!disabledNames.includes(item.name);
 let flatBonus=0,multiplier=1;
 for(const item of items){
  if(!item.enabled)continue;
  if(item.kind==='flat')flatBonus+=item.flat;
  else if(item.kind==='mult')multiplier*=item.factor;
 }
 const maxHp=Math.max(1,Math.round((baseHp+flatBonus)*multiplier));
 return {character,baseHp,flatBonus,multiplier,maxHp,items};
}

function defenseFactor(effect,element){
 const n=effect.name,lv=damageLevel(n),deep=effect.type==='deep';
 if(/^物理カット率上昇(?:\+\d+)?$/.test(n))return element==='物理'?1-(deep?[8,10,13][lv]:8)/100:null;
 if(/^属性カット率上昇(?:\+\d+)?$/.test(n))return element!=='物理'?1-[7,12,14][lv]/100:null;
 const elemCut=n.match(/^(魔力|炎|雷|聖)カット率上昇(?:\+\d+)?$/);
 if(elemCut)return elemCut[1]===element?1-(deep?[10,16,18][lv]:10)/100:null;
 if(n==='HP低下時、カット率上昇')return 0.85;
 if(n==='ダメージで吹き飛ばされた時、強靭度とカット率上昇')return 0.80;
 if(n==='【守護者】スキル使用時、周囲の味方のカット率上昇')return 0.82;
 if(n==='【隠者】属性痕を集めた時、対応する属性カット率上昇')return element!=='物理'?0.80:null;
 if(n==='【復讐者】ファミリーと共闘中の間、自身を強化')return element!=='物理'?0.80:null;
 if(n==='【無頼漢】スキル命中時、敵の攻撃力低下')return 0.85;
 if(n==='【執行者】スキル中の攻撃力上昇、攻撃時にカット率低下')return 1.40;
 return null;
}

function defensePenaltyFactor(penaltyName){
 if(penaltyName==='聖杯瓶使用時、カット率低下')return 1.45;
 if(penaltyName==='回避直後、カット率低下')return 1.45;
 if(penaltyName==='回避連続時、カット率低下')return 1.35;
 return null;
}

function defenseStackKey(effect){
 const n=effect.name;
 if(/^(物理|魔力|炎|雷|聖|属性)カット率上昇(?:\+\d+)?$/.test(n))return null;
 if(n==='HP低下時、カット率上昇')return null;
 return n.replace(/\+\d+$/,'');
}

function calculateDefense(effects,element,affixIds=[],disabledNames=[],penalties=[]){
 const used=new Map();
 for(const effect of effects){
  if(!effect)continue;
  const factor=defenseFactor(effect,element);
  if(factor===null||factor===1)continue;
  const item={name:effect.name,factor};
  const key=defenseStackKey(effect);
  if(key){if(!used.has(key)||used.get(key).factor>factor)used.set(key,item);}
  else used.set(Symbol(),item);
 }
 const penaltyItems=[];
 for(const p of penalties){
  if(!p)continue;
  const factor=defensePenaltyFactor(p);
  if(factor)penaltyItems.push({name:'デメリット：'+p,factor});
 }
 const items=[
  ...used.values(),
  ...applicableDefenseAffixes(affixIds,element).map(affix=>({name:'付帯：'+affix.name+' +'+affix.percent+'%',factor:1-affix.percent/100})),
  ...penaltyItems
 ];
 for(const item of items)item.enabled=!disabledNames.includes(item.name);
 const damageTakenMultiplier=items.reduce((value,item)=>value*(item.enabled?item.factor:1),1);
 const cutPercent=(1-damageTakenMultiplier)*100;
 return {element,damageTakenMultiplier,cutPercent,items};
}

function duplicateAffixIds(ids,index){
 if(ids.length>=12||!ids[index])return ids;
 const copy=[...ids];copy.splice(index+1,0,ids[index]);return copy;
}

function validDamageCount(value){return Math.min(99,Math.max(0,Number.isFinite(Number(value))?Math.floor(Number(value)):0));}
function defaultDamageSettings(){return {evergaol:0,invader:0,greatChurch:0,scenario:'auto',defenseElement:'auto',affixes:[],disabled:['デメリット：瀕死時、最大HP低下']};}
function normalizeDamageSettings(value){
 const data=value&&typeof value==='object'?value:{};
 const hasDisabled=Array.isArray(data.disabled);
 return {
  evergaol:validDamageCount(data.evergaol),
  invader:validDamageCount(data.invader),
  greatChurch:validDamageCount(data.greatChurch),
  scenario:data.scenario==='auto'||DAMAGE_SCENARIOS.some(s=>s.id===data.scenario)?data.scenario:'auto',
  defenseElement:data.defenseElement==='auto'||DEFENSE_ELEMENTS.some(e=>e.id===data.defenseElement)?data.defenseElement:'auto',
  affixes:Array.isArray(data.affixes)?data.affixes.slice(0,12).map(id=>DAMAGE_AFFIX_LOOKUP.has(id)?id:''):[],
  disabled:hasDisabled?[...new Set(data.disabled.filter(name=>typeof name==='string'&&name.length<=100))].slice(0,40):['デメリット：瀕死時、最大HP低下']
 };
}
const DAMAGE_SETTINGS_KEY='nightreign.damage-calculator.v1';
let damageSettings=defaultDamageSettings();
try{damageSettings=normalizeDamageSettings(currentDamageDraft||JSON.parse(localStorage.getItem(DAMAGE_SETTINGS_KEY)));}catch{}
function snapshotDamageSettings(){return {...damageSettings,affixes:[...damageSettings.affixes],disabled:[...damageSettings.disabled]};}
function formatDamage(value){return value.toLocaleString('ja-JP',{minimumFractionDigits:2,maximumFractionDigits:2});}
function saveDamageSettings(){try{localStorage.setItem(DAMAGE_SETTINGS_KEY,JSON.stringify(damageSettings));}catch{}}
function setBuildDamageSettings(value){
 damageSettings=normalizeDamageSettings(value);
 $('damage-evergaol').value=damageSettings.evergaol;
 $('damage-invader').value=damageSettings.invader;
 if($('damage-great-church'))$('damage-great-church').value=damageSettings.greatChurch;
 $('damage-scenario').value=damageSettings.scenario;
 if($('defense-element'))$('defense-element').value=damageSettings.defenseElement;
 renderDamageAffixes();saveDamageSettings();renderDamage();
}
let activeAffixIndex=-1;
function openDamageAffixPicker(index){
 activeAffixIndex=index;
 $('damage-affix-picker-search').value='';
 renderDamageAffixResults();
 $('damage-affix-picker').showModal();
 $('damage-affix-picker-search').focus();
}
function renderDamageAffixResults(){
 const query=$('damage-affix-picker-search').value.normalize('NFKC').toLowerCase().trim();
 const matches=DAMAGE_AFFIXES.filter(affix=>(affix.name+' +'+affix.percent+'%').normalize('NFKC').toLowerCase().includes(query));
 $('damage-affix-results-count').textContent=matches.length+' 件の効果';
 const results=$('damage-affix-results');results.replaceChildren();
 for(const affix of matches){
  const button=document.createElement('button');button.type='button';button.className='result';
  const name=document.createElement('span');name.textContent=affix.name+' +'+affix.percent+'%';
  const mark=document.createElement('b');mark.textContent=damageSettings.affixes[activeAffixIndex]===affix.id?'✓':'＋';
  button.append(name,mark);
  button.addEventListener('click',()=>{
   damageSettings.affixes[activeAffixIndex]=affix.id;
   saveDamageSettings();draft(false);renderDamageAffixes();renderDamage();
   $('damage-affix-picker').close();
  });
  results.append(button);
 }
 if(!matches.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='該当する効果がありません。';results.append(empty);}
}
function renderDamageAffixes(){
 const list=$('damage-affix-list');
 list.replaceChildren();
 damageSettings.affixes.forEach((id,index)=>{
  const row=document.createElement('div');row.className='damage-affix-row';
  const copy=document.createElement('button');copy.type='button';copy.className='damage-affix-copy';copy.textContent='⧉';copy.title='複製';copy.setAttribute('aria-label','付帯効果 '+(index+1)+' を複製');copy.disabled=!id||damageSettings.affixes.length>=12;
  copy.addEventListener('click',()=>{damageSettings.affixes=duplicateAffixIds(damageSettings.affixes,index);saveDamageSettings();draft(false);renderDamageAffixes();renderDamage();});
  const choose=document.createElement('button');choose.type='button';choose.className='damage-affix-choose';choose.textContent=id?DAMAGE_AFFIX_LOOKUP.get(id)?.name+' +'+DAMAGE_AFFIX_LOOKUP.get(id)?.percent+'%':'付帯効果を選ぶ';
  choose.setAttribute('aria-label','付帯効果 '+(index+1)+' を選ぶ');
  choose.addEventListener('click',()=>openDamageAffixPicker(index));
  const remove=document.createElement('button');remove.type='button';remove.className='damage-affix-remove';remove.textContent='×';remove.setAttribute('aria-label','付帯効果 '+(index+1)+' を削除');
  remove.addEventListener('click',()=>{damageSettings.affixes.splice(index,1);saveDamageSettings();draft(false);renderDamageAffixes();renderDamage();});
  row.append(copy,choose,remove);list.append(row);
 });
 $('damage-affix-add').disabled=damageSettings.affixes.length>=12;
}
function renderDamage(){
 const character=$('character').value;
 const effects=slots.map(id=>lookup.get(id)).filter(e=>e&&(!e.character||e.character===character)),scenarios=damageSettings.scenario==='auto'?DAMAGE_SCENARIOS:[DAMAGE_SCENARIOS.find(s=>s.id===damageSettings.scenario)];
 const available=damageCountAvailability(effects);
 for(const [kind,id] of [['evergaol','damage-evergaol'],['invader','damage-invader'],['greatChurch','damage-great-church']]){
  const input=$(id);
  if(!input)continue;
  input.disabled=!available[kind];
  input.parentElement.classList.toggle('damage-count-inactive',!available[kind]);
  input.title=available[kind]?'':'対応する遺物効果を選ぶと入力できます';
 }
 const best=scenarios.map(s=>calculateDamage(effects,s,damageSettings,damageSettings.affixes,damageSettings.disabled)).reduce((a,b)=>b.multiplier>a.multiplier?b:a);
 $('damage-value').textContent='約 '+formatDamage(best.multiplier)+' 倍';
 $('damage-mode').textContent=damageSettings.scenario==='auto'?'最大火力：'+best.scenario.label:'火力：'+best.scenario.label;
 const countHints=[['封牢の囚を倒す度、攻撃力上昇',damageSettings.evergaol,'封牢'],['夜の侵入者を倒す度、攻撃力上昇',damageSettings.invader,'夜の侵入者']].filter(([name,count])=>!count&&effects.some(effect=>effect.name===name)).map(([,count,label])=>`<li class="damage-empty"><span>${label}：撃破数が0のため倍率に含めていません</span></li>`).join('');
 const isNonDamageDisabled=name=>name.includes('カット率')||name.startsWith('デメリット：')||name.startsWith('生命力')||name.startsWith('最大HP上昇')||name.endsWith('最大HP上昇');
 const shown=groupDamageItems(best.items),missing=damageSettings.disabled.filter(name=>!shown.some(item=>item.name===name)&&!isNonDamageDisabled(name));
 $('damage-breakdown').innerHTML=(shown.map(item=>`<li class="${item.enabled?'':'damage-factor-off'}"><span>${escapeHtml(item.name)}${item.count>1?' ×'+item.count:''}</span><strong>${item.enabled?'×'+formatDamage(item.factor):'オフ'}</strong><button type="button" data-toggle-damage="${escapeHtml(item.name)}" aria-label="${escapeHtml(item.name)}の倍率を${item.enabled?'オフ':'オン'}にする" title="倍率を${item.enabled?'オフ':'オン'}にする">${item.enabled?'倍率をオフ':'倍率をオン'}</button></li>`).join('')+missing.map(name=>`<li class="damage-factor-off"><span>${escapeHtml(name)}</span><strong>オフ</strong><button type="button" data-toggle-damage="${escapeHtml(name)}" aria-label="${escapeHtml(name)}の倍率をオンにする">倍率をオン</button></li>`).join(''))+countHints||'<li class="damage-empty">倍率が分かる火力効果はまだ選ばれていません。</li>';
 const activePenalties=penaltySlots.filter((p,idx)=>p&&lookup.get(slots[idx+9])?.hasPenalty);
 if($('defense-value')){
  const defElements=damageSettings.defenseElement==='auto'?DEFENSE_ELEMENTS.map(e=>e.id):[damageSettings.defenseElement];
  const bestDef=defElements.map(el=>calculateDefense(effects,el,damageSettings.affixes,damageSettings.disabled,activePenalties)).reduce((a,b)=>b.damageTakenMultiplier<a.damageTakenMultiplier?b:a);
  const cutBigText=bestDef.cutPercent>=0?`${bestDef.cutPercent.toFixed(1)}%`:`-${Math.abs(bestDef.cutPercent).toFixed(1)}%`;
  $('defense-value').textContent=cutBigText;
  $('defense-mode').textContent=(damageSettings.defenseElement==='auto'?`最大カット（${bestDef.element}）：`:`被弾（${bestDef.element}）：`)+`被ダメ 約 ${formatDamage(bestDef.damageTakenMultiplier)} 倍`;
  const shownDef=groupDefenseItems(bestDef.items);
  $('defense-breakdown').innerHTML=shownDef.map(item=>{
   const itemCut=Math.round((1-item.factor)*1000)/10;
   const factorLabel=item.enabled?`${itemCut>=0?'+'+itemCut:itemCut}% (×${formatDamage(item.factor)})`:'オフ';
   return `<li class="${item.enabled?'':'damage-factor-off'}"><span>${escapeHtml(item.name)}${item.count>1?' ×'+item.count:''}</span><strong>${factorLabel}</strong><button type="button" data-toggle-damage="${escapeHtml(item.name)}" aria-label="${escapeHtml(item.name)}の倍率を${item.enabled?'オフ':'オン'}にする" title="倍率を${item.enabled?'オフ':'オン'}にする">${item.enabled?'倍率をオフ':'倍率をオン'}</button></li>`;
  }).join('')||'<li class="damage-empty">カット率に関わる効果はまだ選ばれていません。</li>';
 }
 if($('hp-value')){
  const hpRes=calculateMaxHp(character,effects,damageSettings,damageSettings.disabled,activePenalties);
  $('hp-value').textContent=hpRes.maxHp.toLocaleString('ja-JP');
  const flatStr=hpRes.flatBonus>=0?`+${hpRes.flatBonus}`:`${hpRes.flatBonus}`;
  $('hp-mode').textContent=`${character} 基礎 ${hpRes.baseHp.toLocaleString('ja-JP')}（${flatStr} / ×${formatDamage(hpRes.multiplier)}）`;
  const churchHint=(!damageSettings.greatChurch&&effects.some(e=>e.name==='大教会の強敵を倒す度、最大HP上昇'))?`<li class="damage-empty"><span>大教会の強敵：撃破数が0のため最大HPに含めていません</span></li>`:'';
  const shownHp=groupHpItems(hpRes.items);
  $('hp-breakdown').innerHTML=(shownHp.map(item=>{
   const label=item.enabled?(item.kind==='flat'?(item.flat>=0?`+${item.flat}`:`${item.flat}`):`×${formatDamage(item.factor)} (${item.factor>=1?'+'+Math.round((item.factor-1)*1000)/10+'%':Math.round((item.factor-1)*1000)/10+'%'})`):'オフ';
   return `<li class="${item.enabled?'':'damage-factor-off'}"><span>${escapeHtml(item.name)}${item.count>1?' ×'+item.count:''}</span><strong>${label}</strong><button type="button" data-toggle-damage="${escapeHtml(item.name)}" aria-label="${escapeHtml(item.name)}を${item.enabled?'オフ':'オン'}にする" title="${item.enabled?'オフ':'オン'}にする">${item.enabled?'オフにする':'オンにする'}</button></li>`;
  }).join('')+churchHint)||`<li class="damage-empty">最大HPに関わる効果はまだ選ばれていません（Lv.15基礎値：${hpRes.baseHp.toLocaleString('ja-JP')}）。</li>`;
 }
}
function toggleDamageItem(event){
 const button=event.target.closest('[data-toggle-damage]');if(!button)return;
 const name=button.dataset.toggleDamage;
 damageSettings.disabled=damageSettings.disabled.includes(name)?damageSettings.disabled.filter(value=>value!==name):[...damageSettings.disabled,name];
 saveDamageSettings();draft(false);renderDamage();
}
$('damage-breakdown').addEventListener('click',toggleDamageItem);
$('defense-breakdown')?.addEventListener('click',toggleDamageItem);
$('hp-breakdown')?.addEventListener('click',toggleDamageItem);
for(const scenario of DAMAGE_SCENARIOS)$('damage-scenario').add(new Option(scenario.label,scenario.id));
if($('defense-element')){
 for(const el of DEFENSE_ELEMENTS)$('defense-element').add(new Option(el.label,el.id));
 $('defense-element').value=damageSettings.defenseElement;
}
$('damage-evergaol').value=damageSettings.evergaol;
$('damage-invader').value=damageSettings.invader;
if($('damage-great-church'))$('damage-great-church').value=damageSettings.greatChurch;
$('damage-scenario').value=damageSettings.scenario;
renderDamageAffixes();
$('damage-affix-picker-search').addEventListener('input',renderDamageAffixResults);
$('close-damage-affix-picker').addEventListener('click',()=>$('damage-affix-picker').close());
$('damage-affix-add').addEventListener('click',()=>{
 if(damageSettings.affixes.length>=12)return;
 damageSettings.affixes.push('');saveDamageSettings();draft(false);renderDamageAffixes();
 openDamageAffixPicker(damageSettings.affixes.length-1);
});
for(const id of ['damage-evergaol','damage-invader','damage-great-church','damage-scenario','defense-element'])$(id)?.addEventListener('input',()=>{
 damageSettings.evergaol=validDamageCount($('damage-evergaol').value);
 damageSettings.invader=validDamageCount($('damage-invader').value);
 if($('damage-great-church'))damageSettings.greatChurch=validDamageCount($('damage-great-church').value);
 damageSettings.scenario=$('damage-scenario').value;
 if($('defense-element'))damageSettings.defenseElement=$('defense-element').value;
 saveDamageSettings();
 draft(false);
 renderDamage();
});
for(const id of ['damage-evergaol','damage-invader','damage-great-church'])$(id)?.addEventListener('change',()=>{$(id).value=validDamageCount($(id).value);});
(() => {
 const calcSection = document.querySelector('.damage-calculator');
 const heading = calcSection?.querySelector('.damage-heading');
 const body = calcSection?.querySelector('.damage-body');
 if (!calcSection || !heading || !body) return;
 body.id = 'damage-body';
 const toggleBtn = document.createElement('button');
 toggleBtn.type = 'button';
 toggleBtn.id = 'damage-toggle';
 toggleBtn.className = 'damage-toggle-btn';
 toggleBtn.setAttribute('aria-controls', 'damage-body');
 heading.append(toggleBtn);
 const collapsedKey = 'nightreign.damage-calculator.collapsed.v1';
 let isCollapsed = localStorage.getItem(collapsedKey) === 'true';
 function applyCollapsedState() {
  calcSection.classList.toggle('is-collapsed', isCollapsed);
  body.hidden = isCollapsed;
  toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
  toggleBtn.textContent = isCollapsed ? '開く ▼' : '閉じる ▲';
 }
 heading.addEventListener('click', event => {
  if (event.target.closest('input,select,a')) return;
  isCollapsed = !isCollapsed;
  try { localStorage.setItem(collapsedKey, String(isCollapsed)); } catch {}
  applyCollapsedState();
 });
 applyCollapsedState();
})();
