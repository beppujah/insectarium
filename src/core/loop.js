import { audio } from '../audio/audio.js';
import SPECIES from '../content/species.json';
import { $, clamp, lerp } from './util.js';
import { findTarget } from '../game/actions.js';
import { CONTROLS, ctl } from '../input/controls.js';
import { keys } from '../input/keyboard.js';
import { stick } from '../input/touch.js';
import { drawMini } from '../render/minimap.js';
import { render, resize } from '../render/raycaster.js';
import { updateDof } from '../render/dof.js';
import { CEIL, N, PASS, SOLID, WCEIL } from '../world/constants.js';
import { updateInsects } from '../world/creatures.js';
import { G, blocked, cellAt, lv, seen } from '../world/level.js';
import { portalCheck } from '../world/portals.js';

// ================= loop =================
let lastT=performance.now(),fpsAcc=0,fpsN=0,miniTick=0;
function loop(now){
 requestAnimationFrame(loop);
 const dt=Math.min(.05,(now-lastT)/1000);lastT=now;if(!G.started)return;
 // knob smoothing
 for(const c of CONTROLS)if(c.kind==='knob'){const s=ctl[c.id];s.value+= (s.target-s.value)*Math.min(1,dt*10);}
 if(G.paused){resize();G.lastCam=render();
 updateDof(dt);return;}
 const tempo=lerp(.1,2.5,ctl.tempo.value);G.t+=dt*tempo;
 // keyboard
 if(keys.KeyQ||ctl.down.down)ctl.alt.target=clamp(ctl.alt.target-dt*.5,0,1);
 if(keys.KeyE||ctl.up.down)ctl.alt.target=clamp(ctl.alt.target+dt*.5,0,1);
 if(ctl.lookUp.down)ctl.pitch.target=clamp(ctl.pitch.target+dt*.6,0,1);
 if(ctl.lookDn.down)ctl.pitch.target=clamp(ctl.pitch.target-dt*.6,0,1);
 // turning: knob with a centre dead zone + keyboard
 let turn=ctl.turn.value-.5;turn=Math.abs(turn)<.06?0:(turn-Math.sign(turn)*.06)/.44;
 if(keys.KeyA||keys.ArrowLeft||ctl.left.down)turn=-1;if(keys.KeyD||keys.ArrowRight||ctl.right.down)turn=1;
 if(stick.id!==null&&Math.abs(stick.x)>.18)turn=(stick.x-Math.sign(stick.x)*.18)/.82;
 G.ang+=turn*2.2*dt;
 // movement
 let v=ctl.speed.value*2.4;
 if(keys.KeyW||keys.ArrowUp||ctl.fwd.down)v=2.4;
 if(ctl.back.down||keys.KeyS||keys.ArrowDown)v=-1.4;
 if(stick.id!==null&&Math.abs(stick.y)>.15){const f=-(stick.y-Math.sign(stick.y)*.15)/.85;v=f>0?f*2.4:f*1.4;}
 G.ground=lv.water?lerp(.2,WCEIL-.05,ctl.alt.value):lerp(.18,1.55,ctl.alt.value);if(lv.under)G.ground=Math.min(G.ground,CEIL-.32);
 // jump and gravity towards the chosen height
 if(lv.water){G.cz+=(G.ground-G.cz)*Math.min(1,dt*1.8)+G.vz*dt;G.vz*=Math.pow(.15,dt);}
 else if(G.vz!==0||G.cz>G.ground+.01){G.vz-=5*dt;G.cz+=G.vz*dt;if(G.cz<=G.ground){G.cz=G.ground;G.vz=0;}}
 else G.cz+=(G.ground-G.cz)*Math.min(1,dt*6);
 if(!lv.water&&G.cz<G.ground)G.cz+=(G.ground-G.cz)*Math.min(1,dt*6);
 if(lv.under&&G.cz>CEIL-.15){G.cz=CEIL-.15;G.vz=Math.min(0,G.vz);}
 if(PASS[cellAt(G.px,G.py)]&&!lv.water)v*=.72; // pushing through grass and flowers
 if(v!==0){const r=.18,sx=Math.cos(G.ang)*v*dt,sy=Math.sin(G.ang)*v*dt;
  if(!blocked(G.px+sx+Math.sign(sx)*r,G.py,G.cz,true))G.px+=sx;
  if(!blocked(G.px,G.py+sy+Math.sign(sy)*r,G.cz,true))G.py+=sy;
  G.bob+=Math.abs(v)*dt*9;}
 // explored cells
 const R=7;for(let y=-R;y<=R;y++)for(let x=-R;x<=R;x++){const cx=(G.px|0)+x,cy=(G.py|0)+y;if(cx>=0&&cy>=0&&cx<N&&cy<N&&x*x+y*y<=R*R)seen[cy*N+cx]=1;}
 portalCheck();
 updateInsects(dt*tempo);
 resize();
 G.lastCam=render();
 updateDof(dt);
 G.flash=Math.max(0,G.flash-dt*2.5);G.fade=Math.max(0,G.fade-dt*1.8);
 audio.update();
 // crosshair
 const tg=findTarget();let label='';
 if(tg)label=(G.found.has(tg.sp.id)?tg.sp.name:'Specie sconosciuta')+' · Osserva';
 else for(let s=.5;s<=1.9;s+=.35){const t=cellAt(G.px+Math.cos(G.ang)*s,G.py+Math.sin(G.ang)*s);
  if(lv.key==='surf'&&t===9){label='Tana · cammina dentro per scendere';break;}
  if(lv.key==='surf'&&t===14){label='Stagno · entra in acqua per immergerti';break;}
  if(lv.under&&t===13){label='Uscita · cammina nella luce per risalire';break;}
  if(SOLID[t]&&!PASS[t])break;}
 if(!tg&&!label&&lv.water&&G.cz>WCEIL-.75)label='Superficie · continua a salire per uscire';
 if(tg!==G.currentTarget){G.currentTarget=tg;$('cross').classList.toggle('on',!!tg);}
 if(label!==G.label){G.label=label;$('target').hidden=!label;$('target').textContent=label;}
 if(++miniTick%6===0&&G.showMap)drawMini();
 fpsAcc+=dt;fpsN++;if(fpsAcc>.5){$('infoChip').textContent=Math.round(fpsN/fpsAcc)+' fps · '+(G.torch?'torcia accesa · ':'')+G.found.size+'/'+SPECIES.length+' specie';fpsAcc=0;fpsN=0;}
}



export { loop };
