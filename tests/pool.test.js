import { describe, it, expect } from 'vitest';
import { THEMES, DECADES } from '../src/listas.js';
import { allSongs, buildPool, pickNext, matchTrack, decadeOf, toSong } from '../src/pool.js';

describe('listas propias: datos', () => {
  it('cada canción tiene título, artista, año y tipo válidos', () => {
    for (const t of THEMES) for (const r of t.songs) {
      const [title, artist, year, type] = r;
      expect(title && artist, t.id + ': ' + r).toBeTruthy();
      expect(year >= 1930 && year <= 2026, t.id + ': ' + title).toBe(true);
      expect(['g', 's']).toContain(type);
      expect(DECADES).toContain(decadeOf(year));
    }
  });
  it('no repite canciones dentro de un tema', () => {
    for (const t of THEMES) {
      const keys = t.songs.map((r) => toSong(r, t.id).key);
      expect(new Set(keys).size, t.id).toBe(keys.length);
    }
  });
  it('cada tema tiene al menos 30 canciones', () => {
    for (const t of THEMES) expect(t.songs.length, t.id).toBeGreaterThanOrEqual(30);
  });
});

describe('buildPool', () => {
  const themes = [
    { id: 'a', name: 'A', songs: [['Uno', 'X', 1985, 'g'], ['Dos', 'Y', 1999, 's']] },
    { id: 'b', name: 'B', songs: [['Uno', 'X', 1985, 'g'], ['Tres', 'Z', 2011, 's']] }
  ];
  it('mezclar todas junta los temas sin repetir', () => {
    expect(buildPool({ mix: true }, themes).map((s) => s.title)).toEqual(['Uno', 'Dos', 'Tres']);
    expect(allSongs(themes)).toHaveLength(3);
  });
  it('filtra por tema y por década', () => {
    expect(buildPool({ mix: false, themes: ['b'], decades: [] }, themes).map((s) => s.title)).toEqual(['Uno', 'Tres']);
    expect(buildPool({ mix: false, themes: [], decades: [1990] }, themes).map((s) => s.title)).toEqual(['Dos']);
    expect(buildPool({ mix: false, themes: ['b'], decades: [1990] }, themes)).toEqual([]);
  });
});

describe('pickNext', () => {
  const pool = allSongs([{ id: 'a', songs: [['Uno', 'X', 1985, 'g'], ['Dos', 'Y', 1999, 's']] }]);
  it('no repite hasta que salen todas', () => {
    const a = pickNext(pool, [], () => 0);
    const b = pickNext(pool, a.played, () => 0);
    expect(b.song.key).not.toBe(a.song.key);
    const c = pickNext(pool, b.played, () => 0);
    expect(c.played).toHaveLength(1);
  });
  it('lista vacía', () => { expect(pickNext([], []).song).toBeNull(); });
});

describe('matchTrack', () => {
  const song = toSong(['Persiana americana', 'Soda Stereo', 1986, 'g'], 'x');
  it('elige la versión del artista y evita karaoke', () => {
    const items = [
      { id: '1', name: 'Persiana Americana (Karaoke Version)', artists: [{ name: 'Soda Stereo' }] },
      { id: '2', name: 'Persiana Americana', artists: [{ name: 'Otro Grupo' }] },
      { id: '3', name: 'Persiana Americana - Remasterizado 2007', artists: [{ name: 'Soda Stereo' }] }
    ];
    expect(matchTrack(items, song).id).toBe('3');
  });
  it('null si ningún resultado es del artista', () => {
    expect(matchTrack([{ id: '2', name: 'Persiana Americana', artists: [{ name: 'Otro' }] }], song)).toBeNull();
  });
});
