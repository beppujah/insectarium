// Narration with the browser's built-in speech synthesis (Web Speech API).
// Free, no network requests: it uses the voices installed on the device.

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

export const voiceAvailable = () => !!synth;
export const voiceEnabled = () => enabled && !!synth;

export function setVoiceEnabled(on) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* storage unavailable */ }
  if (!on) stopVoice();
}

export function speak(text) {
  if (!voiceEnabled() || !text) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'it-IT';
  if (voice) u.voice = voice;
  u.rate = 0.95;
  synth.speak(u);
}

export function stopVoice() {
  if (synth) synth.cancel();
}
