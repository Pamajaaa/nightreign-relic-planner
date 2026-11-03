'use strict';
const backgroundKey='nightreign.background.v1';
let backgroundChoice='none',backgroundTransparency=50,frameTransparency=20,relicTint=100;
try{const setting=JSON.parse(localStorage.getItem(backgroundKey));if(setting){if(typeof setting.relicTint==='number'&&Number.isFinite(setting.relicTint))relicTint=Math.max(0,Math.min(100,setting.relicTint));if(setting.id==='none'||BACKGROUNDS.some(b=>b.id===setting.id))backgroundChoice=setting.id;if(typeof setting.transparency==='number'&&Number.isFinite(setting.transparency))backgroundTransparency=Math.max(0,Math.min(100,setting.transparency));if(typeof setting.frameTransparency==='number'&&Number.isFinite(setting.frameTransparency))frameTransparency=Math.max(0,Math.min(100,setting.frameTransparency));}}catch{}
function updateBackground(save=true){document.documentElement.style.setProperty('--relic-tint-strength',String(relicTint/100));document.documentElement.style.setProperty('--relic-tint-percent',relicTint+'%');$('relic-tint').value=String(relicTint);$('relic-tint-value').textContent=relicTint+'%';document.documentElement.style.setProperty('--frame-opacity',String(1-frameTransparency/100));$('frame-opacity').value=String(frameTransparency);$('frame-opacity-value').textContent=frameTransparency+'%';const scene=BACKGROUNDS.find(b=>b.id===backgroundChoice),opacity=scene?1-backgroundTransparency/100:0;for(const [key,value] of Object.entries({'--frame-top':scene?.frameTop||'25 32 25','--frame-bottom':scene?.frameBottom||'16 23 25','--frame-field':scene?.frameField||'14 21 23','--frame-border':scene?.frameBorder||'48 59 60'}))document.documentElement.style.setProperty(key,value);document.documentElement.style.setProperty('--bg',scene?.color||'#101617');document.documentElement.style.setProperty('--scene-opacity',String(opacity));$('scene-background').style.backgroundImage=scene?`url("${scene.image}")`:'none';$('background-preview').style.backgroundColor=scene?.color||'#101617';$('background-preview-image').style.backgroundImage=scene?`url("${scene.image}")`:'none';$('background-opacity').value=String(backgroundTransparency);$('background-opacity-value').textContent=backgroundTransparency+'%';$('background-preview-name').textContent=scene?.name||'画像なし';$('background-opacity').disabled=!scene;for(const button of document.querySelectorAll('[data-background]'))button.setAttribute('aria-pressed',String(button.dataset.background===backgroundChoice));if(save){try{localStorage.setItem(backgroundKey,JSON.stringify({id:backgroundChoice,transparency:backgroundTransparency,frameTransparency,relicTint}));}catch{notify('背景設定を保存できませんでした。');}}}
function renderBackgrounds(){$('background-grid').innerHTML=`<button class="background-option no-background" type="button" data-background="none"><span class="no-scene">◇</span><span>画像なし</span></button>`+BACKGROUNDS.map(b=>`<button class="background-option" type="button" data-background="${b.id}" aria-label="${b.name}を背景にする"><img src="${b.thumb}" alt="${b.name}" loading="lazy" width="320" height="180"><span>${b.name}</span></button>`).join('');updateBackground(false);}
$('open-background').onclick=()=>{renderBackgrounds();$('background-picker').showModal();};
$('close-background').onclick=()=>$('background-picker').close();
$('background-grid').onclick=e=>{const b=e.target.closest('[data-background]');if(!b)return;backgroundChoice=b.dataset.background;updateBackground();};
$('background-opacity').addEventListener('input',()=>{backgroundTransparency=Number($('background-opacity').value);updateBackground();});
$('frame-opacity').addEventListener('input',()=>{frameTransparency=Number($('frame-opacity').value);updateBackground();});
updateBackground(false);

function enableOpacityTyping(rangeId,outputId){
 const range=$(rangeId),output=$(outputId);
 output.tabIndex=0;output.title='ダブルクリックで数値を入力';
 function edit(){
  if(range.disabled||output.hidden)return;
  const input=document.createElement('input');
  input.type='number';input.min='0';input.max='100';input.step='1';input.inputMode='numeric';input.value=range.value;
  input.className='opacity-number-input';input.setAttribute('aria-label',rangeId==='background-opacity'?'背景透明度（0〜100%）':rangeId==='relic-tint'?'枠の色味（0〜100%）':'枠透明度（0〜100%）');
  output.hidden=true;output.after(input);input.focus();input.select();
  let finished=false;
  function finish(commit){
   if(finished)return;finished=true;
   const value=input.value.trim(),number=Number(value);
   input.remove();output.hidden=false;
   if(commit&&value!==''&&Number.isFinite(number)){
    range.value=String(Math.max(0,Math.min(100,Math.round(number))));
    range.dispatchEvent(new Event('input',{bubbles:true}));
   }
  }
  input.addEventListener('blur',()=>finish(true));
  input.addEventListener('keydown',event=>{
   if(event.key==='Enter'){event.preventDefault();finish(true);output.focus();}
   if(event.key==='Escape'){event.preventDefault();finish(false);output.focus();}
  });
 }
 output.addEventListener('dblclick',event=>{event.preventDefault();edit();});
 output.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();edit();}});
}
enableOpacityTyping('background-opacity','background-opacity-value');
enableOpacityTyping('frame-opacity','frame-opacity-value');

$('relic-tint').addEventListener('input',()=>{relicTint=Number($('relic-tint').value);updateBackground();});
enableOpacityTyping('relic-tint','relic-tint-value');
