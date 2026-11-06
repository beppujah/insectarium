import { clamp } from '../core/util.js';
import { G } from '../world/level.js';
import { H, W, dbuf, u32 } from './raycaster.js';

// Macro-lens depth of field.
// A softened, downsampled copy of the frame is drawn on its own canvas over the game view; the browser
// stretches it smoothly, and its alpha follows each block's circle of confusion, so only what is out of
// focus turns soft. Autofocus follows the insect in the crosshair, otherwise the scene at the centre.

const D = 3;            // downsampling factor of the soft layer
const STRENGTH = 1.6;   // how quickly things blur away from the focal distance
const MAX_ALPHA = .92;

const canvas = document.getElementById('dof');
const ctx = canvas.getContext('2d');
let w = 0, h = 0, img = null, col = null, tmp = null, coc = null;
let focus = 4;
let enabled = true;

export const dofEnabled = () => enabled;
export function setDof(on) { enabled = on; canvas.hidden = !on; }

function resize() {
  w = Math.ceil(W / D); h = Math.ceil(H / D);
  canvas.width = w; canvas.height = h;
  img = ctx.createImageData(w, h);
  col = new Float32Array(w * h * 3); tmp = new Float32Array(w * h * 3); coc = new Float32Array(w * h);
}

const far = d => (d > 60 ? 60 : d);

// median depth of a small grid around the centre of the frame
function centreDepth() {
  const s = [];
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
    const x = (W / 2 + i * W * .015) | 0, y = (H / 2 + j * H * .015) | 0;
    s.push(far(dbuf[y * W + x]));
  }
  s.sort((a, b) => a - b);
  return s[s.length >> 1];
}

export function updateDof(dt) {
  if (!enabled || !W) return;
  if (w !== Math.ceil(W / D) || h !== Math.ceil(H / D)) resize();

  const t = G.currentTarget;
  const want = t ? Math.hypot(t.x - G.px, t.y - G.py) : centreDepth();
  focus += (clamp(want, .5, 20) - focus) * Math.min(1, dt * 4);
  const inv = 1 / focus;

  // 1. average D×D blocks: colour and circle of confusion
  for (let by = 0; by < h; by++) for (let bx = 0; bx < w; bx++) {
    let r = 0, g = 0, b = 0, c = 0, n = 0;
    for (let yy = 0; yy < D; yy++) {
      const y = by * D + yy; if (y >= H) break;
      for (let xx = 0; xx < D; xx++) {
        const x = bx * D + xx; if (x >= W) break;
        const o = y * W + x, p = u32[o];
        r += p & 255; g += (p >> 8) & 255; b += (p >> 16) & 255;
        c += Math.abs(1 / Math.max(far(dbuf[o]), .15) - inv); n++;
      }
    }
    const k = by * w + bx;
    col[k * 3] = r / n; col[k * 3 + 1] = g / n; col[k * 3 + 2] = b / n; coc[k] = c / n;
  }
  // 2. soften: separable 3-tap blur, twice
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = y * w + Math.max(0, x - 1), m = y * w + x, z = y * w + Math.min(w - 1, x + 1);
      for (let ch = 0; ch < 3; ch++) tmp[m * 3 + ch] = (col[a * 3 + ch] + 2 * col[m * 3 + ch] + col[z * 3 + ch]) / 4;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = Math.max(0, y - 1) * w + x, m = y * w + x, z = Math.min(h - 1, y + 1) * w + x;
      for (let ch = 0; ch < 3; ch++) col[m * 3 + ch] = (tmp[a * 3 + ch] + 2 * tmp[m * 3 + ch] + tmp[z * 3 + ch]) / 4;
    }
  }
  // 3. write the soft layer; alpha = how far out of focus each block is
  const px = img.data;
  for (let k = 0; k < w * h; k++) {
    px[k * 4] = col[k * 3]; px[k * 4 + 1] = col[k * 3 + 1]; px[k * 4 + 2] = col[k * 3 + 2];
    px[k * 4 + 3] = clamp((coc[k] * STRENGTH - .12) * 1.6, 0, MAX_ALPHA) * 255;
  }
  ctx.putImageData(img, 0, 0);
}
