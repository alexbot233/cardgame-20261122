// Ember Duel — tiny WebAudio cues, synthesised at runtime (zero asset files, zero network).
// The mute preference lives in localStorage so it survives a reload.
const STORAGE_KEY = 'ember-duel:muted';
let muted = false;
try { muted = localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* storage blocked */ }
let ctx = null;

function audio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(c, freq, duration, type, volume, delay = 0) {
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.7), t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function syncButton() {
  const btn = document.getElementById('muteBtn');
  if (!btn) return;
  btn.textContent = muted ? '♪ SOUND OFF' : '♪ SOUND ON';
  btn.setAttribute('aria-pressed', String(muted));
  btn.title = muted ? 'Unmute sound (M)' : 'Mute sound (M)';
}

export const SFX = {
  play(kind) {
    if (muted) return;
    const c = audio();
    if (!c) return;
    if (kind === 'select') tone(c, 620, 0.09, 'triangle', 0.05);
    if (kind === 'place' || kind === 'click') { tone(c, 350, 0.16, 'triangle', 0.07); tone(c, 530, 0.12, 'sine', 0.05, 0.06); }
    if (kind === 'clash') { tone(c, 130, 0.3, 'sawtooth', 0.09); tone(c, 240, 0.22, 'square', 0.05, 0.05); }
    if (kind === 'deal') [440, 560, 680].forEach((f, i) => tone(c, f, 0.1, 'triangle', 0.04, i * 0.07));
    if (kind === 'win') [523, 659, 784, 1046].forEach((f, i) => tone(c, f, 0.42, 'triangle', 0.07, i * 0.13));
    if (kind === 'loss') [330, 262, 196, 147].forEach((f, i) => tone(c, f, 0.4, 'sawtooth', 0.05, i * 0.15));
  },
  isMuted() { return muted; },
  setMuted(value) {
    muted = Boolean(value);
    try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0'); } catch { /* storage blocked */ }
    syncButton();
  },
  toggleMuted() { SFX.setMuted(!muted); },
  syncButton,
};
syncButton();
