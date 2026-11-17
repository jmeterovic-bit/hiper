import '@fontsource/bungee/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import { COLORS, SIDES, ROUND_MS } from './config.js';
import { rouletteSteps } from './roulette.js';
import { parseCardUrl, findTrack } from './cards.js';
import { loadCatalog } from './catalog.js';
import { getSettings, setSettings } from './settings.js';
import { startFx } from './fx.js';
import { unlockAudio, tick, JINGLES, buzzer, fanfare } from './sounds.js';
import * as spotify from './spotify.js';
import { scanQr, keepAwake, buzz, openHitsterApp, isNative } from './native.js';

const $ = (id) => document.getElementById(id);
const SCREENS = ['menu', 'devices', 'ready', 'roulette', 'picked', 'play', 'timeup', 'end'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fx = startFx($('fx'));
let side = 'A', current = 0, mode = 'idle', raf = 0;

function show(id) { SCREENS.forEach((s) => ($(s).hidden = s !== id)); $('topbar').hidden = id === 'menu' || id === 'devices'; }
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
  $('settings').hidden = !on;
  const st = getSettings();
  $('deviceName').textContent = st.deviceName || 'Este teléfono';
  document.querySelectorAll('[data-listen]').forEach((b) => b.classList.toggle('on', b.dataset.listen === st.listen));
}
document.querySelectorAll('[data-listen]').forEach((b) => b.addEventListener('click', () => { setSettings({ listen: b.dataset.listen }); refreshSpotify(); }));

// Elegir el aparato donde suena Spotify.
async function renderDevices() {
  const box = $('devList');
  box.textContent = 'Buscando aparatos…';
  let devs;
  try { devs = await spotify.listDevices(); } catch (e) { box.textContent = e.message; return; }
  box.textContent = '';
  if (!devs.length) { box.textContent = 'No encontré ningún aparato con Spotify abierto.'; return; }
  const st = getSettings();
  for (const d of devs) {
    const b = document.createElement('button');
    b.className = 'dev' + (d.id === st.deviceId ? ' on' : '');
    const name = document.createElement('span'); name.textContent = d.name;
    const type = document.createElement('small'); type.textContent = { Smartphone: 'Teléfono', Computer: 'Computadora', Speaker: 'Parlante', TV: 'TV' }[d.type] || d.type;
    b.append(name, type);
    b.onclick = () => { setSettings({ deviceId: d.id, deviceName: d.name }); renderDevices(); };
    box.appendChild(b);
  }
}
$('deviceBtn').onclick = () => { show('devices'); renderDevices(); };
$('devRefresh').onclick = () => renderDevices();
$('devBack').onclick = () => { refreshSpotify(); show('menu'); };
$('spotifyBtn').onclick = async () => {
  if (spotify.isLoggedIn()) { spotify.logout(); refreshSpotify(); return; }
  try { await spotify.login(); } catch (e) { alertMsg(e.message); }
  refreshSpotify();
};
refreshSpotify();

function alertMsg(text) { $('msg').textContent = text; $('msg').hidden = false; }
function clearMsg() { $('msg').hidden = true; $('msgActions').hidden = true; ['openSpotify', 'openHitster', 'startManual'].forEach((id) => ($(id).hidden = true)); }

document.querySelectorAll('.side').forEach((b) => b.addEventListener('click', () => {
  side = b.dataset.side;
  $('sideLabel').textContent = SIDES[side].name + ' · ' + SIDES[side].level;
  unlockAudio(); keepAwake(true); toReady();
  loadCatalog().catch(() => {});
}));
$('changeSide').onclick = () => { stopRound(); if (spotify.isLoggedIn()) spotify.pause(); fx.setRate(0); wash('var(--bg)'); keepAwake(false); show('menu'); };

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


// Al escanear: si la carta está en la lista propia, suena en Spotify desde aquí.
// Si no, se abre la app oficial de Hitster con el enlace de la carta, y la ronda empieza al volver.
// handoff: 'idle' | 'opening' (se pidió abrir Hitster) | 'away' (la app quedó en segundo plano).
let handoff = 'idle', handoffTimer = 0, lastOpen = null;

// Con Spotify conectado: la app lee el QR, busca la canción en la lista de Hitster y la pone en Spotify.
// Sin Spotify (o si la carta no está en la lista): se abre la app de Hitster para escanear ahí; la ronda empieza al volver.
$('toScan').onclick = () => {
  if (spotify.isLoggedIn()) return scanHere();
  alertMsg('Para escanear aquí, entra a Spotify en el menú («Cambiar lado»). También puedes escanear en la app de Hitster.');
  $('msgActions').hidden = false; $('openHitster').hidden = false;
};

async function openInHitster() {
  clearMsg();
  handoff = 'opening';
  try { lastOpen = await openHitsterApp(); } catch (e) { lastOpen = { abierto: false, error: e.message }; }
  if (!lastOpen.abierto) {
    handoff = 'idle';
    alertMsg(lastOpen.paquete === null
      ? 'No encontré la app de Hitster en este teléfono. Pon la canción a mano y toca «Empezar ronda».'
      : 'No se pudo abrir la app de Hitster. Pon la canción a mano y toca «Empezar ronda».');
    $('msgActions').hidden = false; $('openHitster').hidden = false; $('startManual').hidden = false;
    return;
  }
  alertMsg('Escanea la carta en Hitster y vuelve aquí cuando empiece a sonar.');
  clearTimeout(handoffTimer);
  handoffTimer = setTimeout(() => {
    if (handoff !== 'opening') return;
    handoff = 'idle';
    $('msgActions').hidden = false; $('openHitster').hidden = false; $('startManual').hidden = false;
  }, 3000);
}

async function scanHere() {
  clearMsg();
  let text;
  try { text = await scanQr(); } catch (e) { if (!/cancel/i.test(e.message)) alertMsg(e.message); return; }
  if (!text) return;
  const card = parseCardUrl(text);
  if (!card) { alertMsg('Ese QR no es de una carta de Hitster.'); return; }
  let catalog;
  try { catalog = await loadCatalog(); } catch (e) { alertMsg(e.message); $('msgActions').hidden = false; $('openHitster').hidden = false; return; }
  const track = findTrack(catalog, card);
  if (!track) {
    alertMsg(`La carta ${card.card} (edición ${card.edition}) no está en la lista de Hitster. Puedes escanearla en la app de Hitster.`);
    $('msgActions').hidden = false; $('openHitster').hidden = false;
    return;
  }
  try {
    const dev = await spotify.playTrack(track, getSettings().deviceId);
    if (getSettings().deviceId && dev.id !== getSettings().deviceId) setSettings({ deviceId: dev.id, deviceName: dev.name });
    startRound(track);
  } catch (e) {
    alertMsg(e.message);
    if (e instanceof spotify.NoDeviceError) { $('msgActions').hidden = false; $('openSpotify').hidden = false; }
  }
}
$('openSpotify').onclick = () => spotify.openSpotifyApp();
$('openHitster').onclick = () => openInHitster();
$('startManual').onclick = () => startRound();
document.addEventListener('visibilitychange', () => {
  if (document.hidden && handoff === 'opening') handoff = 'away';
  else if (!document.hidden && handoff === 'away') { handoff = 'idle'; clearTimeout(handoffTimer); startRound(); }
});

let t0 = 0, colorT = 0;
// La cuenta de 25 s empieza cuando Spotify de verdad está sonando (máximo 12 s de espera).
async function startRound(trackId = null) {
  clearMsg(); $('plCat').textContent = SIDES[side].cats[current]; show('play');
  if (trackId) {
    mode = 'loading'; $('plSub').textContent = 'Cargando la canción…'; fx.setRate(1.5);
    await spotify.waitUntilPlaying(trackId);
    if (mode !== 'loading') return;
  }
  $('plSub').textContent = '¡A escuchar!';
  t0 = performance.now(); colorT = 0; mode = 'play'; loop();
}
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
  stopRound(); fx.setRate(0); fx.clear(); wash('var(--red)');
  $('tCat').style.background = COLORS[current]; setCat(current, $('tCatName'), $('tDice'));
  show('timeup');
  buzzer(); buzz(); if (spotify.isLoggedIn() && getSettings().listen === 'fragmento') spotify.pause();
}
$('next').onclick = () => { unlockAudio(); toReady(); };
$('bingo').onclick = () => { if (spotify.isLoggedIn()) spotify.pause(); show('end'); wash('var(--bg)'); fx.setRate(25); fanfare(); setTimeout(() => fx.setRate(4), 2500); };
$('again').onclick = () => { fx.setRate(0); keepAwake(false); show('menu'); };

// Si el round sigue corriendo cuando la app vuelve al frente (por ejemplo, tras abrir Hitster), el reloj usa la hora real.
document.addEventListener('visibilitychange', () => { if (!document.hidden && mode === 'play') { cancelAnimationFrame(raf); loop(); } });
if (!isNative) console.info('Modo PC: el escaneo pide el texto del QR.');
