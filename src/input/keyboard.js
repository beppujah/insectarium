import { $ } from '../core/util.js';
import { jump, observe } from '../game/actions.js';
import { BTN_ACTIONS, nextTod, openMap } from './controls.js';
import { closeNotebook, openNotebook } from '../ui/notebook.js';
import { G } from '../world/level.js';

// ---- keyboard ----
const keys={};
addEventListener('keydown',e=>{
 if(e.repeat&&!['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))return;
 keys[e.code]=true;
 if(!G.started)return;
 if(G.paused&&e.code!=='KeyN'&&e.code!=='Escape')return;
 if(e.code==='Space'){e.preventDefault();observe();}
 if(e.code==='KeyT')nextTod();
 if(e.code==='KeyL')BTN_ACTIONS.torch();
 if(e.code==='KeyN'){if($('notebook').hidden)openNotebook();else closeNotebook();}
 if(e.code==='Escape'&&!$('notebook').hidden)closeNotebook();
 if(G.paused)return;
 if(e.code==='KeyM'){if($('mapScreen').hidden)openMap();else $('mapCloseBtn').click();}
 if(e.code==='KeyJ')jump();
});
addEventListener('keyup',e=>{keys[e.code]=false;});

export { keys };
