import { ALL_SPECIES, SPECIES, world } from '../content/worlds.js';
import { photosFor } from '../content/photos.js';
import { openGallery } from './gallery.js';
import { $ } from '../core/util.js';
import { SPR } from '../world/creatures.js';
import { G } from '../world/level.js';

// ================= notebook =================
const WIKI=Object.fromEntries(ALL_SPECIES.map(s=>[s.id,s.wiki]));
const homeOf=sp=>sp.levels?(sp.levels.includes('water')||sp.habitat==='water'?'water':sp.levels[0]):sp.under?'under':'surf';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ext=(href,text)=>'<a href="'+esc(href)+'" target="_blank" rel="noopener">'+text+'</a>';
const wikiLink=id=>'https://it.wikipedia.org/w/index.php?search='+encodeURIComponent(WIKI[id][0]);
function openNotebook(){
 G.paused=true;$('notebook').hidden=false;$('nbCount').textContent=G.found.size+' / '+SPECIES.length;
 let h='';
 const HABITAT=['surf','under','water'].filter(k=>world.where[k]).map(k=>[k,...world.where[k]]);
 for(const[key,title,hint]of HABITAT){
  const list=SPECIES.filter(sp=>homeOf(sp)===key);if(!list.length)continue;
  h+='<section class="nbsec"><h3>'+title+'</h3><div class="nbgrid">';
  for(const sp of list){const f=G.found.has(sp.id),ph=f&&photosFor(sp.id)[0];
   h+='<article class="sp'+(f?'':' miss')+'" data-id="'+sp.id+'"><div class="ph">'
    +(ph?'<img alt="'+esc(sp.name)+'" src="'+ph.src+'">':'<img class="pix" alt="" src="'+SPR[sp.id].url+'">')+'</div><div class="tx">'
    +(f?'<b>'+esc(sp.name)+'</b><i>'+esc(WIKI[sp.id][1])+'</i><p>'+esc(sp.fact)+'</p>'+ext(wikiLink(sp.id),'Leggi su Wikipedia ↗')+(ph?'<span class="credit">'+photosFor(sp.id).length+' foto · tocca per vederle</span>':'')
       :'<b>???</b><p>'+hint+(sp.night?', si vede solo di notte':'')+'. Ancora da trovare.</p>')
    +'</div></article>';}
  h+='</div></section>';}
 $('nbBody').innerHTML=h;
}
// tapping a species already found reopens its gallery
$('nbBody').addEventListener('click',e=>{if(e.target.closest('a'))return;const card=e.target.closest('.sp:not(.miss)');if(!card)return;
 const sp=SPECIES.find(s=>s.id===card.dataset.id);if(sp)openGallery(sp);});
function closeNotebook(){$('notebook').hidden=true;G.paused=false;}
$('nbBtn').onclick=openNotebook;$('nbClose').onclick=closeNotebook;$('catalog').onclick=openNotebook;

export { openNotebook, closeNotebook };
