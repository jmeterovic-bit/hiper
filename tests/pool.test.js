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

import { adaptCats } from '../src/pool.js';
describe('adaptCats', () => {
  const A = ['Década', 'Grupo o solista', 'Año ±2', 'Año ±4', '¿Antes o después del 2000?'];
  const B = ['Década', 'Artista', 'Título', 'Año exacto', 'Año ±3'];
  const songs = (...ys) => ys.map((year) => ({ year }));
  it('una sola década: mitades y año ±1', () => {
    expect(adaptCats(A, songs(1981, 1987))).toEqual(['¿80-84 o 85-89?', 'Grupo o solista', 'Año ±2', 'Año ±4', 'Año ±1']);
    expect(adaptCats(B, songs(2011))[0]).toBe('¿2010-14 o 2015-19?');
    expect(adaptCats(A, songs(2003))[0]).toBe('¿2000-04 o 2005-09?');
  });
  it('varias décadas del mismo lado del 2000: corte en la década que mejor reparte', () => {
    expect(adaptCats(A, songs(1981, 1985, 1992, 1995))[4]).toBe('¿Antes o después de 1990?');
    expect(adaptCats(A, songs(1971, 1982, 1983, 1991))[4]).toBe('¿Antes o después de 1980?');
  });
  it('si cruzan el 2000 no cambia nada', () => {
    expect(adaptCats(A, songs(1995, 2005))).toEqual(A);
  });
});

describe('bandas sonoras', () => {
  const B = ['Década', 'Artista', 'Título', 'Año exacto', 'Año ±3'];
  it('cada canción de «Bandas sonoras» dice su película', () => {
    const t = THEMES.find((x) => x.id === 'bandas-sonoras');
    expect(t).toBeTruthy();
    for (const r of t.songs) expect(typeof r[5] === 'string' && r[5].length > 1, r[0]).toBe(true);
  });
  it('solo bandas sonoras: «Título» pasa a «Película» y «Artista» a «Cantante»', () => {
    const pool = buildPool({ mix: false, themes: ['bandas-sonoras'] });
    const out = adaptCats(B, pool);
    expect(out[1]).toBe('Cantante');
    expect(out[2]).toBe('Película');
  });
  it('mezclado con otras listas, las categorías no cambian por eso', () => {
    const out = adaptCats(B, buildPool({ mix: false, themes: ['bandas-sonoras', 'pop-en'] }));
    expect(out[1]).toBe('Artista');
    expect(out[2]).toBe('Título');
  });
  it('si una canción está en Películas y en Bandas sonoras, se queda la que dice la película', () => {
    const s = allSongs().find((x) => x.title === 'My Heart Will Go On');
    expect(s.film).toBe('Titanic');
  });
});
