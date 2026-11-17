import { describe, it, expect } from 'vitest';
import { base64url, challengeFor, authorizeUrl, parseCallback, pickDevice, isPlayingTrack } from '../src/spotify-core.js';
import { rouletteSteps } from '../src/roulette.js';

describe('PKCE', () => {
  it('calcula el challenge del ejemplo del RFC 7636', async () => {
    expect(await challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
  it('base64url sin relleno', () => {
    expect(base64url(new Uint8Array([251, 255]))).toBe('-_8');
  });
  it('arma la URL de Spotify', () => {
    const u = new URL(authorizeUrl({ clientId: 'abc', redirectUri: 'bingovinilo://callback', scopes: ['a', 'b'], challenge: 'ch', state: 'st' }));
    expect(u.host).toBe('accounts.spotify.com');
    expect(u.searchParams.get('scope')).toBe('a b');
    expect(u.searchParams.get('code_challenge_method')).toBe('S256');
  });
  it('lee la respuesta', () => {
    expect(parseCallback('bingovinilo://callback?code=X&state=Y')).toEqual({ code: 'X', state: 'Y', error: null });
  });
});

describe('pickDevice', () => {
  it('prefiere el elegido, luego el teléfono, luego el activo', () => {
    const devs = [{ id: '1', type: 'Computer', is_active: true }, { id: '2', type: 'Smartphone' }, { id: '3', type: 'Speaker' }];
    expect(pickDevice(devs, '3').id).toBe('3');
    expect(pickDevice(devs).id).toBe('2');
    expect(pickDevice(devs, 'no-existe').id).toBe('2');
    expect(pickDevice([{ id: '1', type: 'Computer', is_active: true }]).id).toBe('1');
    expect(pickDevice([])).toBeNull();
  });
  it('sabe cuándo la canción ya suena', () => {
    expect(isPlayingTrack({ is_playing: true, item: { id: 'a' }, progress_ms: 900 }, 'a')).toBe(true);
    expect(isPlayingTrack({ is_playing: true, item: { id: 'b' }, progress_ms: 900 }, 'a')).toBe(false);
    expect(isPlayingTrack({ is_playing: true, item: { id: 'a' }, progress_ms: 0 }, 'a')).toBe(false);
    expect(isPlayingTrack(null, 'a')).toBe(false);
  });
});

describe('rouletteSteps', () => {
  it('siempre termina en la categoría elegida', () => {
    for (let pick = 0; pick < 5; pick++) {
      const s = rouletteSteps(pick);
      expect(s.at(-1).cat).toBe(pick);
      expect(s.length).toBeGreaterThan(10);
    }
  });
});
