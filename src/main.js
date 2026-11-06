import './style.css';
import '@fontsource/young-serif/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import { audio } from './audio/audio.js';
import SPECIES from './content/species.json';
import { loop } from './core/loop.js';
import { applySave, loadSave, saveGame } from './core/save.js';
import { $, isTouch } from './core/util.js';
import { renderCatalog, toast } from './game/actions.js';
import { initMIDI } from './input/controls.js';
import { resize } from './render/raycaster.js';
import { G, newWorld } from './world/level.js';

// ================= startup =================
const saved=loadSave();
newWorld(saved?saved.seed:1234);renderCatalog();resize();
function startGame(resume){
 if(resume&&saved)applySave(saved);
 else{newWorld((Math.random()*1e9)|0);G.found.clear();}
 renderCatalog();
 $('startScreen').hidden=true;$('hud').hidden=false;if(isTouch)$('touch').hidden=false;G.started=true;audio.init();initMIDI();saveGame();
 if(resume&&saved)toast('Bentornato',G.found.size+' specie su '+SPECIES.length+' nel quaderno. Riprendi da dove eri rimasto.',4000);
 else toast('Benvenuto nel prato',isTouch?'Cammina col joystick, trascina a destra per guardarti intorno. Quando un insetto entra nel mirino, tocca Osserva.':'Gira e cammina con i knob o con W A S D. Quando un insetto entra nel mirino, premi Osserva.',5000);
}
if(saved){$('continueBtn').hidden=false;$('continueBtn').textContent='Continua · '+saved.found.length+'/'+SPECIES.length+' specie';
 $('enterBtn').textContent='Nuova partita';$('enterBtn').classList.add('ghost');}
$('continueBtn').onclick=()=>startGame(true);
$('enterBtn').onclick=()=>startGame(false);
requestAnimationFrame(loop);
