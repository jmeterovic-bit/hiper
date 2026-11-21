// Partes de Spotify que no dependen del teléfono (se prueban en tests/).

export function base64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomVerifier(len = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const rnd = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(rnd, (b) => chars[b % chars.length]).join('');
}

export async function challengeFor(verifier) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(hash));
}

export function authorizeUrl({ clientId, redirectUri, scopes, challenge, state }) {
  const p = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: scopes.join(' '),
    state
  });
  return 'https://accounts.spotify.com/authorize?' + p.toString();
}

export function parseCallback(url) {
  try {
    const u = new URL(url);
    return { code: u.searchParams.get('code'), state: u.searchParams.get('state'), error: u.searchParams.get('error') };
  } catch {
    return { code: null, state: null, error: 'bad_url' };
  }
}

// Elige dónde sonar: el aparato que eligió Jose; si no está, el teléfono; si no, el activo; si no, el primero.
export function pickDevice(devices, preferredId = null) {
  const list = (devices || []).filter((d) => d && d.id && !d.is_restricted);
  return (preferredId && list.find((d) => d.id === preferredId)) ||
    list.find((d) => d.type === 'Smartphone') || list.find((d) => d.is_active) || list[0] || null;
}

// Modo «Fragmento»: punto de partida al azar, ni en el arranque (20 % inicial) ni en los últimos 40 s.
export function randomStart(durationMs, rnd = Math.random) {
  if (!durationMs) return 0;
  const min = durationMs * 0.2, max = durationMs - 40000;
  return max > min ? Math.floor(min + rnd() * (max - min)) : 0;
}

// ¿Ya está sonando esa canción? (respuesta de GET /me/player)
export function isPlayingTrack(state, trackId) {
  return !!(state && state.is_playing && state.item && state.item.id === trackId && state.progress_ms > 200);
}
