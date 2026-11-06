import './style.css';
import '@fontsource/young-serif/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './world/style.js';
import { audio } from './audio/audio.js';
import { SPECIES, WORLDS, setWorld, speciesOf, world } from './content/worlds.js';
import { loop } from './core/loop.js';
import { applySave, loadSave, saveGame } from './core/save.js';
import { $, isTouch } from './core/util.js';
import { renderCatalog, toast } from './game/actions.js';
import { initMIDI } from './input/controls.js';
import { resize } from './render/raycaster.js';
import { G, newWorld } from './world/level.js';

// ================= startup: the map of the worlds =================
const LAST = 'insettario-world';
let last = 'prato';
try { last = localStorage.getItem(LAST) || 'prato'; } catch (e) { /* storage unavailable */ }
if (!WORLDS[last]) last = 'prato';

let chosen = null;
function choose(id) {
  chosen = id;
  const w = WORLDS[id], saved = loadSave(id), n = speciesOf(id).length;
  document.querySelectorAll('.pin').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.world === id)));
  document.querySelectorAll('.land').forEach(l => l.classList.toggle('on', l.dataset.world === id));
  $('placeName').textContent = w.name;
  $('placeBlurb').textContent = w.blurb + ' ' + n + ' specie da trovare.';
  $('continueBtn').hidden = !saved;
  if (saved) $('continueBtn').textContent = 'Continua · ' + saved.found.filter(f => speciesOf(id).some(s => s.id === f)).length + '/' + n + ' specie';
  $('enterBtn').textContent = saved ? 'Ricomincia' : 'Entra ' + (id === 'prato' ? 'nel prato' : id === 'deserto' ? 'nel deserto' : 'nella giungla');
  $('enterBtn').classList.toggle('ghost', !!saved);
  // the world behind the map shows the chosen place
  setWorld(id);
  newWorld(saved ? saved.seed : 1234);
}
function refreshPins() {
  document.querySelectorAll('.pin').forEach(p => {
    const id = p.dataset.world, s = loadSave(id), n = speciesOf(id).length;
    const f = s ? s.found.filter(x => speciesOf(id).some(sp => sp.id === x)).length : 0;
    p.querySelector('span').textContent = f + ' / ' + n;
  });
}
document.querySelectorAll('.pin').forEach(p => { p.onclick = () => choose(p.dataset.world); });
document.querySelectorAll('.land').forEach(l => { l.style.cursor = 'pointer'; l.addEventListener('click', () => choose(l.dataset.world)); });

function startGame(resume) {
  const saved = resume && loadSave(chosen);
  if (world.id !== chosen) setWorld(chosen);
  if (saved) applySave(saved);
  else { newWorld((Math.random() * 1e9) | 0); G.found.clear(); }
  try { localStorage.setItem(LAST, chosen); } catch (e) { /* storage unavailable */ }
  renderCatalog();
  $('levelChip').textContent = world.levels.surf;
  $('startScreen').hidden = true; $('hud').hidden = false; if (isTouch) $('touch').hidden = false;
  G.started = true; G.paused = false; audio.init(); initMIDI(); saveGame();
  if (saved) toast('Bentornato', G.found.size + ' specie su ' + SPECIES.length + ' nel quaderno. Riprendi da dove eri rimasto.', 4000);
  else toast(world.welcome, isTouch ? 'Cammina col joystick, trascina a destra per guardarti intorno. Quando un insetto entra nel mirino, tocca Osserva.' : 'Gira e cammina con i knob o con W A S D. Quando un insetto entra nel mirino, premi Osserva.', 5000);
}
function openHome() {
  saveGame();
  G.started = false;
  $('hud').hidden = true; $('touch').hidden = true; $('notebook').hidden = true;
  $('startScreen').hidden = false;
  refreshPins(); choose(world.id);
}
$('continueBtn').onclick = () => startGame(true);
$('enterBtn').onclick = () => {
  if (loadSave(chosen) && !confirmRestart()) return;
  startGame(false);
};
// restarting a world with progress asks once (a second press on the same button confirms)
let armed = 0;
function confirmRestart() {
  if (performance.now() - armed < 4000) return true;
  armed = performance.now();
  $('enterBtn').textContent = 'Sicuro? Premi di nuovo';
  return false;
}
$('homeBtn').onclick = openHome;

refreshPins(); choose(last); renderCatalog(); resize();
requestAnimationFrame(loop);
