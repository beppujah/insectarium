// Narration: recorded clips (src/assets/voice/<clip>.m4a) when available,
// otherwise the browser's built-in speech synthesis (Web Speech API), which needs no network.

const KEY = 'insettario-voice';
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let enabled = true;
try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* storage unavailable */ }

let voice = null;
function pickVoice() {
  if (!synth) return;
  const it = synth.getVoices().filter(v => /^it([-_]|$)/i.test(v.lang));
  // prefer good-quality voices installed on the device, then any Italian voice
  voice = it.find(v => /enhanced|premium|natural|neural/i.test(v.name))
    || it.find(v => v.localService)
    || it[0] || null;
}
if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export const voiceAvailable = () => !!synth || Object.keys(CLIPS).length > 0;
export const voiceEnabled = () => enabled && voiceAvailable();

export function setVoiceEnabled(on) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* storage unavailable */ }
  if (!on) stopVoice();
}

export function speak(text) {
  if (!enabled || !synth || !text) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'it-IT';
  if (voice) u.voice = voice;
  u.rate = 0.95;
  synth.speak(u);
}

// recorded clips: nuova-specie, <id>-name, <id>-1 … <id>-3
const CLIPS = import.meta.glob('../assets/voice/*.{m4a,mp3}', { eager: true, query: '?url', import: 'default' });
const clipUrl = name => CLIPS['../assets/voice/' + name + '.m4a'] || CLIPS['../assets/voice/' + name + '.mp3'];
let player = null;
let queueId = 0;

/** Plays the recorded clips in order; if any is missing, reads `text` with speech synthesis instead. */
export function narrate(clips, text) {
  stopVoice();
  if (!enabled) return;
  const urls = clips.map(clipUrl);
  if (!urls.length || urls.some(u => !u)) { speak(text); return; }
  const id = ++queueId;
  player = player || new Audio();
  let k = 0;
  const next = () => {
    if (id !== queueId || k >= urls.length) return;
    player.src = urls[k++];
    player.play().catch(() => { /* autoplay refused or interrupted */ });
  };
  player.onended = next;
  next();
}

export function stopVoice() {
  queueId++;
  if (player) { player.onended = null; player.pause(); }
  if (synth) synth.cancel();
}
