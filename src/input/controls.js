import { saveGame } from '../core/save.js';
import { $, clamp } from '../core/util.js';
import { jump, observe, photo, renderCatalog, toast } from '../game/actions.js';
import { G, newWorld } from '../world/level.js';

// ================= controls =================
// 12 knobs (continuous) + 8 buttons
const CONTROLS=[
 {id:'turn',  label:'Gira (centro = dritto)', kind:'knob', def:.5},
 {id:'speed', label:'Velocità',               kind:'knob', def:0},
 {id:'pitch', label:'Guarda su / giù',        kind:'knob', def:.5},
 {id:'alt',   label:'Altezza di volo',        kind:'knob', def:.05},
 {id:'fov',   label:'Campo visivo',           kind:'knob', def:.45},
 {id:'tod',   label:'Ora del giorno',         kind:'knob', def:.1},
 {id:'fog',   label:'Nebbia',                 kind:'knob', def:.15},
 {id:'wind',  label:'Vento',                  kind:'knob', def:.3},
 {id:'tempo', label:'Tempo degli insetti',    kind:'knob', def:.5},
 {id:'color', label:'Colore',                 kind:'knob', def:.5},
 {id:'pixel', label:'Grana dei pixel',        kind:'knob', def:.12},
 {id:'vol',   label:'Volume',                 kind:'knob', def:.7},
 // button-only controllers: held down like keyboard keys
 {id:'fwd',   label:'Avanti (tieni)',         kind:'hold', group:'pad'},
 {id:'left',  label:'Gira a sinistra (tieni)',kind:'hold', group:'pad'},
 {id:'right', label:'Gira a destra (tieni)',  kind:'hold', group:'pad'},
 {id:'up',    label:'Sali (tieni)',           kind:'hold', group:'pad'},
 {id:'down',  label:'Scendi (tieni)',         kind:'hold', group:'pad'},
 {id:'lookUp',label:'Guarda su (tieni)',      kind:'hold', group:'pad'},
 {id:'lookDn',label:'Guarda giù (tieni)',     kind:'hold', group:'pad'},
 {id:'todNext',label:'Ora del giorno successiva',kind:'btn', group:'pad'},
 {id:'fogNext',label:'Nebbia sì / no',        kind:'btn', group:'pad'},
 {id:'observe',label:'Osserva',               kind:'btn'},
 {id:'back',  label:'Indietro (tieni)',       kind:'hold'},
 {id:'jump',  label:'Salto',                  kind:'btn'},
 {id:'torch', label:'Torcia',                 kind:'btn'},
 {id:'map',   label:'Mappa sì / no',          kind:'btn'},
 {id:'photo', label:'Foto',                   kind:'btn'},
 {id:'sound', label:'Suoni sì / no',          kind:'btn'},
 {id:'reseed',label:'Nuovo prato',            kind:'btn'},
];
CONTROLS.forEach(c=>{if(!c.group)c.group=c.kind==='knob'?'knob':'both';});
const ctl={};CONTROLS.forEach(c=>{ctl[c.id]={target:c.def??0,value:c.def??0,raw:null,down:false};});
let ctrlMode='knob';try{ctrlMode=localStorage.getItem('insettario-mode')||'knob';}catch(e){}
const modeControls=()=>CONTROLS.filter(c=>c.group==='both'||c.group===ctrlMode);
function nextTod(){ctl.tod.target=ctl.tod.target>.9?0:Math.min(1,ctl.tod.target+.25);}
let mapping={}; // "cc:ch:num" -> control id
try{mapping=JSON.parse(localStorage.getItem('insettario-map')||'{}');}catch(e){}
const saveMap=()=>{try{localStorage.setItem('insettario-map',JSON.stringify(mapping));}catch(e){}};
const keyFor=id=>Object.keys(mapping).find(k=>mapping[k]===id);

const BTN_ACTIONS={observe:()=>observe(),jump:()=>jump(),torch:()=>{G.torch=!G.torch;},map:()=>{G.showMap=!G.showMap;$('mini').hidden=!G.showMap;},
 photo:()=>photo(),sound:()=>{G.soundOn=!G.soundOn;},reseed:()=>{newWorld((Math.random()*1e9)|0);G.found.clear();renderCatalog();saveGame();toast('Nuovo prato','Il quaderno riparte da zero.',2500);},
 todNext:()=>nextTod(),fogNext:()=>{ctl.fog.target=ctl.fog.target>.5?.15:.85;}};

function onControl(id,v){ // v 0..1
 const c=ctl[id],def=CONTROLS.find(x=>x.id===id);
 c.raw=v;
 if(def.kind==='knob'){c.target=v;}
 else if(def.kind==='hold'){c.down=v>=.5;}
 else{const d=v>=.5;if(d&&!c.down&&BTN_ACTIONS[id])BTN_ACTIONS[id]();c.down=d;}
 if(!$('mapScreen').hidden)renderMapTable();
}

// ---- MIDI ----
let learnQueue=[],learnUsed=new Set(),learnLock=0,midiOK=false;
async function initMIDI(){
 if(midiOK)return;
 if(!navigator.requestMIDIAccess){setMidi('Web MIDI non disponibile: usa Chrome');return;}
 try{
  const acc=await navigator.requestMIDIAccess();midiOK=true;
  const hook=()=>{const names=[];acc.inputs.forEach(i=>{i.onmidimessage=onMidi;names.push(i.name);});
   setMidi(names.length?'Collegato: '+names.join(', '):'Nessun dispositivo: collega l\'Oscilla via USB');};
  hook();acc.onstatechange=hook;
 }catch(e){setMidi('Accesso MIDI negato. Consentilo dall\'icona nella barra di Chrome e ricarica.');}
}
function setMidi(t){$('midiStatus').textContent=t;$('midiChip').innerHTML='MIDI: <b>'+(t.startsWith('Collegato')?t.slice(11):'—')+'</b>';}
function onMidi(e){
 const [st,d1,d2]=e.data;const type=st&0xF0,ch=(st&0x0F)+1;
 let key,val;
 if(type===0xB0){key='cc:'+ch+':'+d1;val=clamp(d2/127,0,1);}
 else if(type===0x90||type===0x80){key='note:'+ch+':'+d1;val=(type===0x90&&d2>0)?1:0;}
 else return;
 $('lastMsg')&&($('lastMsg').textContent=key.replace(/:/g,' ')+' = '+d2);
 if(learnQueue.length){
  if(learnUsed.has(key)||performance.now()<learnLock)return;
  const id=learnQueue.shift();
  Object.keys(mapping).forEach(k=>{if(mapping[k]===id)delete mapping[k];});
  mapping[key]=id;learnUsed.add(key);learnLock=performance.now()+500;saveMap();
  showLearn();renderMapTable();return;
 }
 const id=mapping[key];if(id)onControl(id,val);
}
function startLearn(ids){learnQueue=ids.slice();learnUsed=new Set();learnLock=0;
 // don't repeat assignments of the remaining controls
 Object.keys(mapping).forEach(k=>{if(!ids.includes(mapping[k]))learnUsed.add(k);});
 showLearn();renderMapTable();}
function showLearn(){const m=$('learnMsg');
 if(!learnQueue.length){m.hidden=true;return;}
 const c=CONTROLS.find(x=>x.id===learnQueue[0]);m.hidden=false;
 m.textContent=(c.kind==='knob'?'Gira il knob per: ':'Premi il pulsante per: ')+c.label+(learnQueue.length>1?'  ('+learnQueue.length+' rimasti)':'');}
function renderMapTable(){
 const t=$('maptable');
 let h='<div class="h">Controllo</div><div class="h">MIDI</div><div class="h">Valore</div><div class="h"></div>';
 modeControls().forEach(c=>{const k=keyFor(c.id);const s=ctl[c.id];
  const v=c.kind==='knob'?s.target:(s.down?1:0);
  h+='<div>'+c.label+'</div><div>'+(k?(k.startsWith('note')?'nota ':'CC ')+k.split(':')[2]+' <span style="color:#6b634f">ch'+k.split(':')[1]+'</span>':'—')+'</div>'
   +'<div class="bar"><i style="width:'+Math.round(v*100)+'%"></i></div>'
   +'<div><button data-id="'+c.id+'" class="'+(learnQueue[0]===c.id?'wait':'')+'">'+(learnQueue[0]===c.id?'In attesa…':'Assegna')+'</button></div>';});
 h+='<div class="h" style="grid-column:1/-1">Ultimo messaggio: <span id="lastMsg">—</span></div>';
 t.innerHTML=h;
 t.querySelectorAll('button').forEach(b=>b.onclick=()=>startLearn([b.dataset.id]));
}
$('wizardBtn').onclick=()=>startLearn(modeControls().map(c=>c.id));
function setMode(m){ctrlMode=m;try{localStorage.setItem('insettario-mode',m);}catch(e){}learnQueue=[];showLearn();
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===m));renderMapTable();}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
function openMap(){$('mapScreen').hidden=false;setMode(ctrlMode);initMIDI();}
$('mapOpenBtn').onclick=openMap;
$('mapCloseBtn').onclick=()=>{$('mapScreen').hidden=true;learnQueue=[];};

export { CONTROLS, ctl, nextTod, BTN_ACTIONS, initMIDI, openMap };
