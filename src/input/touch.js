import { $, clamp, isTouch } from '../core/util.js';
import { jump, observe } from '../game/actions.js';
import { BTN_ACTIONS, ctl, nextTod } from './controls.js';
import { G } from '../world/level.js';

// ================= touch controls =================
const stick={x:0,y:0,id:null};
(()=>{const el=$('stick'),dot=$('knobdot'),R=52;
 const upd=e=>{const r=el.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
  const d=Math.hypot(dx,dy);if(d>R){dx*=R/d;dy*=R/d;}stick.x=dx/R;stick.y=dy/R;dot.style.transform='translate('+dx+'px,'+dy+'px)';};
 el.addEventListener('pointerdown',e=>{e.preventDefault();stick.id=e.pointerId;el.setPointerCapture(e.pointerId);upd(e);});
 el.addEventListener('pointermove',e=>{if(e.pointerId===stick.id)upd(e);});
 const end=e=>{if(e.pointerId!==stick.id)return;stick.id=null;stick.x=stick.y=0;dot.style.transform='';};
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
 const lp=$('lookpad');let look=null;
 lp.addEventListener('pointerdown',e=>{e.preventDefault();look={id:e.pointerId,x:e.clientX,y:e.clientY};lp.setPointerCapture(e.pointerId);});
 lp.addEventListener('pointermove',e=>{if(!look||e.pointerId!==look.id)return;const dx=e.clientX-look.x,dy=e.clientY-look.y;look.x=e.clientX;look.y=e.clientY;
  G.ang+=dx*.0065;ctl.pitch.target=clamp(ctl.pitch.target-dy*.0035,0,1);});
 const lend=e=>{if(look&&e.pointerId===look.id)look=null;};lp.addEventListener('pointerup',lend);lp.addEventListener('pointercancel',lend);
 const taps={tod:nextTod,torch:()=>BTN_ACTIONS.torch(),jump:jump,map:()=>BTN_ACTIONS.map(),observe:observe};
 document.querySelectorAll('[data-tap]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();taps[b.dataset.tap]();
  if(b.dataset.tap==='torch')b.classList.toggle('on',G.torch);}));
 document.querySelectorAll('[data-hold]').forEach(b=>{const c=ctl[b.dataset.hold];
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);c.down=true;b.classList.add('on');});
  const off=()=>{c.down=false;b.classList.remove('on');};b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);});
 addEventListener('contextmenu',e=>{if(isTouch)e.preventDefault();});
})();

export { stick };
