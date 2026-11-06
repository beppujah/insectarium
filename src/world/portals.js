import { audio } from '../audio/audio.js';
import { saveGame } from '../core/save.js';
import { toast } from '../game/actions.js';
import { ctl } from '../input/controls.js';
import { N, WCEIL } from './constants.js';
import { G, LV, blocked, cellAt, lv, map, setLevel } from './level.js';

// ================= passages between meadow, tunnels and pond =================
function portalCheck(){
 const t=cellAt(G.px,G.py);
 if(G.portalLock){if(t!==9&&t!==13&&t!==14&&!(lv.water&&G.cz>WCEIL-.5))G.portalLock=false;return;}
 if(lv.key==='surf'&&t===9&&G.cz<.75)changeLevel(LV.under);
 else if(lv.under&&t===13)changeLevel(LV.surf);
 else if(lv.key==='surf'&&t===14&&G.cz<.75)dive();
 else if(lv.water&&G.cz>WCEIL-.22)surfaceUp();
}
function dive(){
 const p=G.pond,ux=32+(G.px-p.x)*4,uy=32+(G.py-p.y)*4;
 setLevel(LV.water);
 if(!blocked(ux,uy,1.5)&&cellAt(ux,uy)!==19){G.px=ux;G.py=uy;}else{G.px=32.5;G.py=32.5;}
 G.cz=WCEIL-.45;G.vz=0;ctl.alt.target=.55;G.portalLock=true;G.fade=.8;audio.dig&&audio.dig(true);saveGame();
 if(!G.wentWater){G.wentWater=true;toast('Sott\'acqua','Nuoti: Sali e Scendi (o Q ed E, o il knob dell\'altezza) ti portano su e giù. Sali fino in cima per tornare a galla.',6500);}
 else toast('Stagno','Sei di nuovo sott\'acqua.',1800);
}
function surfaceUp(){
 const p=G.pond;let tx=p.x+(G.px-32)/4,ty=p.y+(G.py-32)/4,best=null,bd=1e9;
 setLevel(LV.surf);
 for(let y=-10;y<=10;y++)for(let x=-10;x<=10;x++){const cx=(tx|0)+x,cy=(ty|0)+y;if(cx<1||cy<1||cx>N-2||cy>N-2)continue;const c=map[cy*N+cx];if(c!==0)continue;
  const d=Math.hypot(cx+.5-tx,cy+.5-ty);if(d<bd){bd=d;best=[cx+.5,cy+.5];}}
 if(best){G.px=best[0];G.py=best[1];G.ang=Math.atan2(G.py-p.y,G.px-p.x);}
 ctl.alt.target=.05;G.cz=.4;G.vz=0;G.portalLock=false;G.fade=.8;audio.dig&&audio.dig(false);saveGame();
 toast('A galla','Sei tornato sulla riva dello stagno.',1800);
}
function changeLevel(l){
 G.px=(G.px|0)+.5;G.py=(G.py|0)+.5;setLevel(l);G.portalLock=true;G.fade=1;G.vz=0;
 if(l.under){ctl.alt.target=Math.min(ctl.alt.target,.15);G.cz=Math.min(G.cz,.4);}
 audio.dig&&audio.dig(l.under);saveGame();
 if(l.under&&!G.wentDown){G.wentDown=true;toast('Sotto terra','Gallerie buie: la lanterna illumina intorno a te, la torcia più lontano. Cerca i funghi luminosi e i fasci di luce delle uscite.',6000);}
 else toast(l.name,l.under?'Sei di nuovo nelle gallerie.':'Sei tornato sul prato.',1800);
}

export { portalCheck };
