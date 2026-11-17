import { describe, it, expect } from 'vitest';
import { parseCardUrl, findTrack } from '../src/cards.js';

describe('parseCardUrl', () => {
  it('lee el QR con edición', () => {
    expect(parseCardUrl('http://www.hitstergame.com/us/aaab0001/00211')).toEqual({ lang: 'us', edition: 'aaab0001', card: '00211' });
  });
  it('lee el QR sin edición (usa el idioma)', () => {
    expect(parseCardUrl('http://www.hitstergame.com/de/00268')).toEqual({ lang: 'de', edition: 'de', card: '00268' });
  });
  it('rechaza otros QR', () => {
    expect(parseCardUrl('https://example.com/123')).toBeNull();
    expect(parseCardUrl(null)).toBeNull();
  });
});

describe('findTrack', () => {
  const list = { aaab0001: { '00211': 'spotify:track:4uLU6hMCjMI75M1A2tKUQC', '00212': 'malo' } };
  it('encuentra el id limpio', () => {
    expect(findTrack(list, { edition: 'aaab0001', card: '00211' })).toBe('4uLU6hMCjMI75M1A2tKUQC');
  });
  it('devuelve null si falta o es inválido', () => {
    expect(findTrack(list, { edition: 'aaab0001', card: '00999' })).toBeNull();
    expect(findTrack(list, { edition: 'aaab0001', card: '00212' })).toBeNull();
    expect(findTrack({}, { edition: 'x', card: '1' })).toBeNull();
  });
});
