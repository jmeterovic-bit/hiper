// Inicio de sesión en Spotify (PKCE, sin secreto) y control de la reproducción con la Web API.
// Requiere Spotify Premium. La canción suena en la app de Spotify del teléfono; esta app solo la controla.
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { AppLauncher } from '@capacitor/app-launcher';
import { SPOTIFY_CLIENT_ID, REDIRECT_URI, SCOPES } from './config.js';
import { randomVerifier, challengeFor, authorizeUrl, parseCallback, pickDevice, isPlayingTrack } from './spotify-core.js';

const KEY = 'spotify.tokens';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
const save = (t) => { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch {} };

export const isLoggedIn = () => !!load()?.refresh_token;
export function logout() { try { localStorage.removeItem(KEY); } catch {} }

async function tokenRequest(params) {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, ...params }).toString()
  });
  if (!r.ok) throw new Error('Spotify no aceptó el inicio de sesión (' + r.status + ').');
  const j = await r.json();
  const prev = load() || {};
  const t = { access_token: j.access_token, refresh_token: j.refresh_token || prev.refresh_token, expires_at: Date.now() + (j.expires_in - 60) * 1000 };
  save(t);
  return t;
}

export async function login() {
  const verifier = randomVerifier();
  const state = randomVerifier(16);
  const challenge = await challengeFor(verifier);
  let handle;
  const got = new Promise((resolve) => {
    handle = App.addListener('appUrlOpen', ({ url }) => { if (url.startsWith(REDIRECT_URI)) resolve(url); });
  });
  await Browser.open({ url: authorizeUrl({ clientId: SPOTIFY_CLIENT_ID, redirectUri: REDIRECT_URI, scopes: SCOPES, challenge, state }) });
  const url = await got;
  (await handle).remove();
  try { await Browser.close(); } catch {}
  const cb = parseCallback(url);
  if (cb.error || !cb.code || cb.state !== state) throw new Error('No se pudo entrar a Spotify.');
  await tokenRequest({ grant_type: 'authorization_code', code: cb.code, redirect_uri: REDIRECT_URI, code_verifier: verifier });
}

async function accessToken() {
  const t = load();
  if (!t) throw new Error('Primero entra a tu cuenta de Spotify.');
  if (Date.now() < t.expires_at) return t.access_token;
  return (await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh_token })).access_token;
}

async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch('https://api.spotify.com/v1' + path, {
    method,
    headers: { Authorization: 'Bearer ' + (await accessToken()), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (r.status === 204) return null;
  const text = await r.text();
  const j = text ? JSON.parse(text) : null;
  if (!r.ok) {
    const err = new Error(j?.error?.message || 'Error de Spotify ' + r.status);
    err.status = r.status;
    throw err;
  }
  return j;
}

export class NoDeviceError extends Error {}

export async function listDevices() {
  const { devices } = await api('/me/player/devices');
  return (devices || []).filter((d) => d && d.id && !d.is_restricted);
}

// Pone la canción en el aparato elegido (o el mejor disponible). Devuelve el aparato usado.
export async function playTrack(trackId, preferredId = null) {
  const dev = pickDevice(await listDevices(), preferredId);
  if (!dev) throw new NoDeviceError('Spotify está cerrado. Ábrelo un momento y vuelve.');
  await api('/me/player/play?device_id=' + encodeURIComponent(dev.id), { method: 'PUT', body: { uris: ['spotify:track:' + trackId], position_ms: 0 } });
  return dev;
}

// Espera hasta que la canción de verdad esté sonando (máximo `timeout` ms). Devuelve true si sonó.
export async function waitUntilPlaying(trackId, timeout = 12000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { if (isPlayingTrack(await api('/me/player'), trackId)) return true; } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

export async function pause() {
  try { await api('/me/player/pause', { method: 'PUT' }); } catch {}
}

export async function openSpotifyApp() {
  try { await AppLauncher.openUrl({ url: 'spotify:' }); } catch {}
}
