// Sonidos generados con Web Audio (sin archivos). Uno por categoría, según su color.
let ac;
function audio() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
export const unlockAudio = () => audio();
const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
function tone(freq, start, dur, type = 'sine', vol = 0.18) {
  const a = audio(), o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, a.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + 0.05);
}
export const tick = (i) => tone(N(72 + (i % 5) * 2), 0, 0.06, 'square', 0.06);
export const JINGLES = [
  () => [60, 64, 67, 72].forEach((m, i) => tone(N(m), i * 0.11, 0.18, 'square', 0.09)),
  () => { [60, 64, 67].forEach((m) => tone(N(m), 0, 0.5, 'triangle', 0.12)); [65, 69, 72].forEach((m) => tone(N(m), 0.3, 0.7, 'triangle', 0.12)); },
  () => [76, 79, 76, 79, 84].forEach((m, i) => tone(N(m), i * 0.07, 0.12, 'sawtooth', 0.06)),
  () => [84, 79, 88].forEach((m, i) => tone(N(m), i * 0.16, 0.9, 'sine', 0.16)),
  () => {
    const a = audio(), o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(900, a.currentTime + 0.35);
    o.frequency.exponentialRampToValueAtTime(500, a.currentTime + 0.7);
    g.gain.setValueAtTime(0.18, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.8);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.85);
  }
];
export function buzzer() { [0, 0.28].forEach((t) => { tone(110, t, 0.24, 'sawtooth', 0.2); tone(116, t, 0.24, 'square', 0.08); }); }
export function fanfare() { [67, 72, 76, 79, 84].forEach((m, i) => tone(N(m), i * 0.1, 0.3, 'triangle', 0.14)); tone(N(88), 0.55, 0.8, 'triangle', 0.14); }
