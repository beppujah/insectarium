import { $ } from '../core/util.js';
import { photosFor } from '../content/photos.js';
import { G } from '../world/level.js';

// Full-screen gallery: a species' photos, one after another.
// The game stays paused until it is closed.
let state = null; // {sp, photos, i, wasPaused, onClose}

const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ext = (href, text) => '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + text + '</a>';

export const galleryOpen = () => !!state;

/** Opens the gallery; returns false if the species has no photos. */
export function openGallery(sp, { title, onClose } = {}) {
  const photos = photosFor(sp.id);
  if (!photos.length) return false;
  state = { openedAt: performance.now(), sp, photos, i: 0, wasPaused: !!G.paused, onClose, title: title || sp.name };
  G.paused = true;
  $('gallery').hidden = false;
  show();
  $('galNext').focus({ preventScroll: true });
  return true;
}

function show() {
  const { sp, photos, i, title } = state, p = photos[i];
  const img = $('galImg');
  img.src = p.src; img.alt = sp.name + ', foto ' + (i + 1);
  $('galTitle').textContent = title;
  $('galCount').textContent = (i + 1) + ' / ' + photos.length;
  $('galFact').textContent = sp.fact;
  $('galCredit').innerHTML = 'Foto: ' + ext(p.page, esc(p.author === 'Unknown author' ? 'Autore sconosciuto' : p.author)) + ' · ' + (p.licenseUrl ? ext(p.licenseUrl, esc(p.license)) : esc(p.license));
  $('galNext').textContent = i < photos.length - 1 ? 'Avanti' : 'Torna a giocare';
  $('galDots').innerHTML = photos.map((_, k) => '<i' + (k === i ? ' class="on"' : '') + '></i>').join('');
}

export function galleryNext() {
  if (!state) return;
  if (state.i < state.photos.length - 1) { state.i++; show(); }
  else closeGallery();
}
function galleryPrev() { if (state && state.i > 0) { state.i--; show(); } }

export function closeGallery() {
  if (!state) return;
  const { wasPaused, onClose } = state;
  state = null;
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
  galleryNext();
});
// keyboard: capture phase, so keys don't reach the game while the gallery is open
addEventListener('keydown', e => {
  if (!state) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.repeat) return;
  if (['Space', 'Enter', 'ArrowRight', 'KeyD'].includes(e.code)) galleryNext();
  else if (['ArrowLeft', 'KeyA'].includes(e.code)) galleryPrev();
  else if (e.code === 'Escape') closeGallery();
}, true);
