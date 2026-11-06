import { $ } from '../core/util.js';
import { photosFor } from '../content/photos.js';
import { G } from '../world/level.js';
import { narrate, setVoiceEnabled, stopVoice, voiceAvailable, voiceEnabled } from '../audio/voice.js';

// Full-screen gallery: a species' photos, one after another.
// The game stays paused until it is closed. Each photo has its own fact, read aloud by the voice.
let state = null; // {sp, photos, i, wasPaused, onClose}

const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ext = (href, text) => '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + text + '</a>';

export const galleryOpen = () => !!state;

/** Opens the gallery; returns false if the species has no photos. */
export function openGallery(sp, { title, isNew, onClose } = {}) {
  const photos = photosFor(sp.id);
  if (!photos.length) return false;
  state = { openedAt: performance.now(), sp, photos, i: 0, wasPaused: !!G.paused, onClose, title: title || sp.name, isNew: !!isNew };
  updateVoiceButton();
  G.paused = true;
  $('gallery').hidden = false;
  show();
  $('galNext').focus({ preventScroll: true });
  return true;
}

function show() {
  const { sp, photos, i, title } = state, p = photos[i];
  const img = $('galImg');
  // hide the previous photo until the new one has loaded (otherwise the last species flashes for a moment)
  if (img.getAttribute('src') !== p.src) {
    img.style.visibility = 'hidden';
    img.onload = img.onerror = () => { img.style.visibility = ''; };
    img.src = p.src;
    if (img.complete && img.naturalWidth) img.style.visibility = '';
  }
  img.alt = sp.name + ', foto ' + (i + 1);
  $('galTitle').textContent = title;
  $('galCount').textContent = (i + 1) + ' / ' + photos.length;
  const k = factIndex(sp, p, i), fact = (sp.facts || [])[k] || sp.fact;
  $('galFact').textContent = fact;
  $('galCredit').innerHTML = 'Foto: ' + ext(p.page, esc(p.author === 'Unknown author' ? 'Autore sconosciuto' : p.author)) + ' · ' + (p.licenseUrl ? ext(p.licenseUrl, esc(p.license)) : esc(p.license));
  $('galNext').textContent = i < photos.length - 1 ? 'Avanti' : 'Torna a giocare';
  $('galDots').innerHTML = photos.map((_, k) => '<i' + (k === i ? ' class="on"' : '') + '></i>').join('');
  readFact(i, k, fact);
}

// first photo: "Nuova specie!" (only the first time) + name + fact; then just the fact
function readFact(i, k, fact) {
  const { sp, isNew } = state, clip = sp.id + '-' + (k + 1);
  if (i > 0) narrate([clip], fact);
  else narrate([...(isNew ? ['nuova-specie'] : []), sp.id + '-name', clip], (isNew ? 'Nuova specie: ' : '') + sp.name + '. ' + fact);
}

// index of the fact belonging to a photo: matched by file name, so a missing photo doesn't shift the others
function factIndex(sp, p, i) {
  const k = (sp.photos || []).indexOf(p.file);
  return k >= 0 ? k : i;
}

function updateVoiceButton() {
  const b = $('galVoice');
  b.hidden = !voiceAvailable();
  b.textContent = voiceEnabled() ? 'Voce: sì' : 'Voce: no';
  b.setAttribute('aria-pressed', String(voiceEnabled()));
}
function toggleVoice() {
  setVoiceEnabled(!voiceEnabled());
  updateVoiceButton();
  if (voiceEnabled() && state) {
    const { sp, photos, i } = state, k = factIndex(sp, photos[i], i);
    narrate([sp.id + '-' + (k + 1)], (sp.facts || [])[k] || sp.fact);
  }
}

export function galleryNext() {
  if (!state) return;
  if (state.i < state.photos.length - 1) { state.i++; show(); }
  else closeGallery();
}

export function closeGallery() {
  if (!state) return;
  const { wasPaused, onClose } = state;
  state = null;
  stopVoice();
  $('gallery').hidden = true;
  G.paused = wasPaused;
  if (onClose) onClose();
}

// click or tap anywhere on the photo: next (credit links stay clickable)
$('gallery').addEventListener('click', e => {
  // the tap that opened the gallery (e.g. the Observe button) must not advance it
  if (!state || performance.now() - state.openedAt < 400) return;
  if (e.target.closest('a')) return;
  if (e.target.closest('#galClose')) { closeGallery(); return; }
  if (e.target.closest('#galVoice')) { toggleVoice(); return; }
  galleryNext();
});
const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Fn']);
// keyboard: capture phase, so keys don't reach the game while the gallery is open
addEventListener('keydown', e => {
  if (!state) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.repeat) return;
  if (e.code === 'Escape') closeGallery();
  else if (!MODIFIERS.has(e.key)) galleryNext(); // any other key: next photo
}, true);
