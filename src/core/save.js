import SPECIES from '../content/species.json';
import { ctl } from '../input/controls.js';
import { FULLH, N } from '../world/constants.js';
import { G, LV, blocked, cellAt, lv, newWorld, seen, setLevel } from '../world/level.js';

// ================= saving =================
// progress stays in this browser (localStorage)
const SAVE_KEY='insettario-save';
const KEEP=['tod','fog','wind','tempo','color','pixel','vol','fov','alt'];
const enc=a=>{const bits=new Uint8Array(N*N/8);for(let i=0;i<N*N;i++)if(a[i])bits[i>>3]|=1<<(i&7);let s='';for(const b of bits)s+=String.fromCharCode(b);return btoa(s);};
const dec=(str,a)=>{try{const bin=atob(str);for(let i=0;i<N*N;i++)a[i]=(bin.charCodeAt(i>>3)>>(i&7))&1;}catch(e){}};
function saveGame(){
 if(!G.started)return;
 const bits=new Uint8Array(N*N/8);for(let i=0;i<N*N;i++)if(seen[i])bits[i>>3]|=1<<(i&7);
 let bin='';for(const b of bits)bin+=String.fromCharCode(b);
 const data={v:1,seed:G.seed,found:[...G.found],px:G.px,py:G.py,ang:G.ang,torch:G.torch,
  knobs:Object.fromEntries(KEEP.map(k=>[k,ctl[k].target])),seen:btoa(bin),at:Date.now(),
  v2:true,level:lv.key,seenS:enc(LV.surf.seen),seenU:enc(LV.under.seen),seenW:enc(LV.water.seen),wentDown:!!G.wentDown,wentWater:!!G.wentWater};
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));}catch(e){}
}
function loadSave(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');return d&&d.v===1?d:null;}catch(e){return null;}}
function applySave(d){
 newWorld(d.seed);
 G.found=new Set(d.found.filter(id=>SPECIES.some(s=>s.id===id)));if(lv.water)ctl.alt.target=.5;
 if(d.v2){dec(d.seenS,LV.surf.seen);dec(d.seenU,LV.under.seen);if(d.seenW)dec(d.seenW,LV.water.seen);if(LV[d.level])setLevel(LV[d.level]);G.wentDown=!!d.wentDown;G.wentWater=!!d.wentWater;}
 if(!blocked(d.px,d.py,.2)&&!FULLH[cellAt(d.px,d.py)]){G.px=d.px;G.py=d.py;}G.ang=d.ang||0;G.torch=!!d.torch;G.portalLock=true;
 for(const k of KEEP)if(typeof d.knobs?.[k]==='number')ctl[k].target=ctl[k].value=d.knobs[k];
 if(!d.v2)dec(d.seen,LV.surf.seen);
 document.querySelector('[data-tap="torch"]')?.classList.toggle('on',G.torch);
}
setInterval(saveGame,4000);
addEventListener('visibilitychange',()=>{if(document.hidden)saveGame();});
addEventListener('pagehide',saveGame);

export { saveGame, loadSave, applySave };
