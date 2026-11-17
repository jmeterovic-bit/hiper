import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/catalog.js';
import { findTrack, parseCardUrl } from '../src/cards.js';

describe('buildIndex', () => {
  const db = { gamesets: [
    { sku: 'aaab0004', gameset_data: { gameset_name: 'Latino', cards: [{ CardNumber: '00211', Spotify: '7s25THrKz86DM225dOYwnr', ArtistType: 'solo' }, { CardNumber: '7', Spotify: '4uLU6hMCjMI75M1A2tKUQC' }] } },
    { sku: 'aaaa0101', gameset_data: { cards: [] } },
    { gameset_data: { cards: [{ CardNumber: '1', Spotify: 'x' }] } }
  ] };
  it('arma edición → número → id', () => {
    const idx = buildIndex(db);
    expect(idx.aaab0004['00211']).toBe('7s25THrKz86DM225dOYwnr');
    expect(idx.aaab0004['00007']).toBe('4uLU6hMCjMI75M1A2tKUQC');
    expect(Object.keys(idx)).toEqual(['aaab0004', 'aaaa0101']);
  });
  it('sirve para encontrar la canción de un QR', () => {
    const idx = buildIndex(db);
    expect(findTrack(idx, parseCardUrl('HTTP://WWW.HITSTERGAME.COM/US/AAAB0004/00211'))).toBe('7s25THrKz86DM225dOYwnr');
  });
  it('tolera datos vacíos', () => {
    expect(buildIndex(null)).toEqual({});
  });
});
