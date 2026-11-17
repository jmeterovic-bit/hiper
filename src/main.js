import '@fontsource/bungee/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import { COLORS, SIDES, ROUND_MS } from './config.js';
import { rouletteSteps } from './roulette.js';
import { parseCardUrl, findTrack } from './cards.js';
import { startFx } from './fx.js';
import { unlockAudio, tick, JINGLES, buzzer, fanfare } from './sounds.js';
import * as spotify from './spotify.js';
import { scanQr, keepAwake, buzz, openExternal, isNative } from './native.js';

const $ = (id) => document.getElementById(id);
const SCREENS = ['menu', 'ready', 'roulette', 'picked', 'play', 'timeup', 'end'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fx = startFx($('fx'));
let side = 'A', current = 0, lastCardUrl = null, mode = 'idle', raf = 0;
let cardList = null;

function show(id) { SCREENS.forEach((s) => ($(s).hidden = s !== id)); $('topbar').hidden = id === 'menu'; }
function wash(c) { $('bgwash').style.background = c; }
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8] };
function dice(el, n) { el.innerHTML = ''; for (let i = 0; i < 9; i++) { const d = document.createElement('i'); if (PIPS[n].includes(i)) d.className = 'on'; el.appendChild(d); } }
function setCat(i, catEl, diceEl) { catEl.textContent = SIDES[side].cats[i]; if (diceEl) dice(diceEl, i + 1); }

for (const s of 'AB') {
  SIDES[s].cats.forEach((n, i) => {
    const c = document.createElement('span');
    c.className = 'chip'; c.style.background = COLORS[i]; c.textContent = i + 1 + ' · ' + n;
    $('chips' + s).appendChild(c);
  });
}
$('version').textContent = 'Versión ' + __APP_VERSION__;

function refreshSpotify() {
  const on = spotify.isLoggedIn();
  $('spotifyBtn').textContent = on ? 'Spotify conectado · Salir' : 'Entrar a Spotify';
  $('spotifyBtn').classList.toggle('on', on);
}
$('spotifyBtn').onclick = async () => {
  if (spotify.isLoggedIn()) { spotify.logout(); refreshSpotify(); return; }
  try { await spotify.login(); } catch (e) { alertMsg(e.message); }
  refreshSpotify();
};
refreshSpotify();

function alertMsg(text) { $('msg').textContent = text; $('msg').hidden = false; }
function clearMsg() { $('msg').hidden = true; $('msgActions').hidden = true; $('openSpotify').hidden = true; $('openHitster').hidden = true; }

document.querySelectorAll('.side').forEach((b) => b.addEventListener('click', () => {
  side = b.dataset.side;
  $('sideLabel').textContent = SIDES[side].name + ' · ' + SIDES[side].level;
  unlockAudio(); keepAwake(true); toReady();
}));
$('changeSide').onclick = () => { stopRound(); spotify.pause(); fx.setRate(0); wash('var(--bg)'); keepAwake(false); show('menu'); };

function toReady() { fx.setRate(1.5); wash('var(--bg)'); show('ready'); }
$('go').onclick = () => { unlockAudio(); roulette(); };

function roulette() {
  show('roulette'); fx.setRate(10);
  const pick = (Math.random() * 5) | 0;
  const steps = rouletteSteps(pick);
  let k = 0;
  (function step() {
    const s = steps[k];
    setCat(s.cat, $('rCat'), $('rDice')); wash(COLORS[s.cat]); tick(k);
    if (k < steps.length - 1) { setTimeout(step, reduce ? 40 : s.ms); k++; }
    else { current = s.cat; setTimeout(landed, 350); }
  })();
}
function landed() {
  clearMsg(); setCat(current, $('pCat'), $('pDice')); wash(COLORS[current]); show('picked');
  fx.setRate(3); fx.burst(26, '#fff'); JINGLES[current](); buzz();
}

async function loadCards() {
  if (cardList) return cardList;
  const r = await fetch('./cartas.json');
  cardList = r.ok ? await r.json() : {};
  return cardList;
}

// Al escanear: si la carta está en la lista propia, suena en Spotify desde aquí.
// Si no, se abre la app oficial de Hitster con el enlace de la carta, y la ronda empieza al volver.
let waitingReturn = false;
$('toScan').onclick = async () => {
  clearMsg();
  let text;
  try { text = await scanQr(); } catch (e) { if (!/cancel/i.test(e.message)) alertMsg(e.message); return; }
  if (!text) return;
  const card = parseCardUrl(text);
  if (!card) { alertMsg('Ese QR no es de una carta de Hitster.'); return; }
  lastCardUrl = text.trim();
  const track = spotify.isLoggedIn() ? findTrack(await loadCards(), card) : null;
  if (track) {
    try { await spotify.playTrack(track); startRound(); return; }
    catch (e) {
      if (e instanceof spotify.NoDeviceError) { alertMsg(e.message); $('msgActions').hidden = false; $('openSpotify').hidden = false; return; }
    }
  }
  await openInHitster();
};
async function openInHitster() {
  alertMsg('Abriendo la canción en la app de Hitster… Vuelve aquí cuando empiece a sonar.');
  waitingReturn = true;
  try { await openExternal(lastCardUrl); } catch { waitingReturn = false; alertMsg('No se pudo abrir la app de Hitster.'); $('msgActions').hidden = false; $('openHitster').hidden = false; }
}
$('openSpotify').onclick = () => spotify.openSpotifyApp();
$('openHitster').onclick = () => openInHitster();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && waitingReturn) { waitingReturn = false; startRound(); }
});

let t0 = 0, colorT = 0;
function startRound() { clearMsg(); $('plCat').textContent = SIDES[side].cats[current]; show('play'); t0 = performance.now(); colorT = 0; mode = 'play'; loop(); }
function loop(now = performance.now()) {
  if (mode !== 'play') return;
  const p = Math.min(1, (now - t0) / ROUND_MS);
  fx.setRate(2 + p * p * 45);
  colorT += (0.6 + p * p * 9) * 0.016;
  wash(COLORS[Math.floor(colorT) % 5]);
  $('plDisc').style.animationDuration = 2.2 - 1.9 * p + 's';
  if (p >= 1) { timeUp(); return; }
  raf = requestAnimationFrame(loop);
}
function stopRound() { mode = 'idle'; cancelAnimationFrame(raf); }
function timeUp() {
  stopRound(); fx.setRate(0); fx.clear(); wash('var(--red)'); show('timeup');
  buzzer(); buzz(); if (spotify.isLoggedIn()) spotify.pause();
}
$('next').onclick = () => { unlockAudio(); toReady(); };
$('bingo').onclick = () => { show('end'); wash('var(--bg)'); fx.setRate(25); fanfare(); setTimeout(() => fx.setRate(4), 2500); };
$('again').onclick = () => { fx.setRate(0); keepAwake(false); show('menu'); };

// Si el round sigue corriendo cuando la app vuelve al frente (por ejemplo, tras abrir Hitster), el reloj usa la hora real.
document.addEventListener('visibilitychange', () => { if (!document.hidden && mode === 'play') { cancelAnimationFrame(raf); loop(); } });
if (!isNative) console.info('Modo PC: el escaneo pide el texto del QR.');
