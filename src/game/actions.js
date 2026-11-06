import { audio } from '../audio/audio.js';
import SPECIES from '../content/species.json';
import { saveGame } from '../core/save.js';
import { $ } from '../core/util.js';
import { H, W, dbuf, view } from '../render/raycaster.js';
import { openNotebook } from '../ui/notebook.js';
import { galleryNext, galleryOpen, openGallery } from '../ui/gallery.js';
import { SPR } from '../world/creatures.js';
import { G, insects, lv } from '../world/level.js';

// ================= actions =================
function findTarget(){
 if(!G.lastCam)return null;const {dX,dY,night}=G.lastCam;let best=null,bd=1e9;
 for(const b of insects){const dx=b.x-G.px,dy=b.y-G.py,depth=dx*dX+dy*dY;if(depth<.1||depth>2.6)continue;
  const lat=dx*-dY+dy*dX;if(Math.abs(lat)>Math.max(.35,b.sp.size*.8))continue;
  if(b.sp.night&&night<.35)continue;
  if(Math.abs(b.z-G.cz)>1.1)continue;
  if(depth>=dbuf[(H>>1)*W+(W>>1)]+.2)continue;
  if(depth<bd){bd=depth;best=b;}}
 return best;}
function observe(){
 if(galleryOpen()){galleryNext();return;} // Observe (touch or MIDI) also steps through the photos
 const b=findTarget();
 if(!b){toast('Niente a portata','Avvicinati a un insetto e mettilo nel mirino.',1800);return;}
 G.flash=.6;audio.chime();G.currentTarget=null;
 const sp=b.sp;
 if(G.found.has(sp.id)){toast(sp.name+' (già nel quaderno)',sp.fact,2600);return;}
 G.found.add(sp.id);renderCatalog();saveGame();
 if(!$('notebook').hidden)openNotebook();
 const done=()=>{
  if(G.found.size===SPECIES.length)toast('Quaderno completo!','Hai trovato tutte le specie: sul prato, sotto terra e nello stagno. I progressi sono salvati. Usa "Nuovo prato" per ricominciare da capo in un prato diverso.',7000);
  else toast(sp.name+' · '+G.found.size+'/'+SPECIES.length,sp.fact,4500);};
 // first observation: real photos, one after another, game paused
 if(!openGallery(sp,{title:'Nuova specie: '+sp.name+' · '+G.found.size+'/'+SPECIES.length,onClose:()=>{if(G.found.size===SPECIES.length)done();}}))done();
}
function jump(){if(lv.water){G.vz=1.6;return;}if(G.cz<=G.ground+.01)G.vz=1.9;}
function photo(){G.flash=1;audio.chime(1.5);
 const a=document.createElement('a');a.download='insettario-'+Date.now()+'.png';a.href=view.toDataURL('image/png');a.click();}
let toastTimer;
function toast(t,p,ms){$('toastT').textContent=t;$('toastP').textContent=p;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,ms);}
function renderCatalog(){
 $('catalog').innerHTML=SPECIES.map(s=>'<div class="card'+(G.found.has(s.id)?' found':'')+'"><img alt="" src="'+SPR[s.id].url+'"><span>'+(G.found.has(s.id)?s.name:'?')+'</span></div>').join('');}

export { findTarget, observe, jump, photo, toast, renderCatalog };
