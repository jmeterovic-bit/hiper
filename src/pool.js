// Lógica del modo «Listas propias» (sin pantalla ni red, para poder probarla).
import { THEMES } from './listas.js';

export const decadeOf = (year) => Math.floor(year / 10) * 10;
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function toSong([title, artist, year, type, search, film], theme) {
  return { title, artist, year, type, search: search || artist, film: film || null, theme, key: norm(title) + '|' + norm(search || artist) };
}

// Todas las canciones, sin repetir (una canción puede estar en dos temas).
export function allSongs(themes = THEMES) {
  const seen = new Map();
  for (const t of themes) for (const row of t.songs) {
    const s = toSong(row, t.id);
    // si está repetida, gana la versión que dice de qué película es
    if (!seen.has(s.key) || (s.film && !seen.get(s.key).film)) seen.set(s.key, s);
  }
  return [...seen.values()];
}

// Elección del jugador: { mix: true } = todas las listas; si no, los temas y décadas marcados.
// Sin temas marcados valen todos; sin décadas marcadas valen todas.
export function buildPool(choice = {}, themes = THEMES) {
  const { mix = true, themes: ids = [], decades = [] } = choice;
  if (mix) return allSongs(themes);
  const picked = ids.length ? themes.filter((t) => ids.includes(t.id)) : themes;
  return allSongs(picked).filter((s) => !decades.length || decades.includes(decadeOf(s.year)));
}

// Elige una canción que todavía no salió. Si ya salieron todas, empieza de nuevo.
export function pickNext(pool, played, rnd = Math.random) {
  if (!pool.length) return { song: null, played };
  let left = pool.filter((s) => !played.includes(s.key));
  if (!left.length) { played = []; left = pool; }
  const song = left[Math.floor(rnd() * left.length)];
  return { song, played: [...played, song.key] };
}

// Entre los resultados de la búsqueda de Spotify, la versión de ese artista con ese título.
export function matchTrack(items, song) {
  const want = norm(song.search), title = norm(song.title);
  const byArtist = (items || []).filter((t) => t && t.id && (t.artists || []).some((a) => norm(a.name) === want || norm(a.name).includes(want) || want.includes(norm(a.name))));
  const bad = /karaoke|cover|instrumental|tribute|8 bit|lullaby/;
  const ok = byArtist.filter((t) => !bad.test(norm(t.name)) || bad.test(title));
  return ok.find((t) => norm(t.name).startsWith(title)) || ok[0] || null;
}

export const describeType = (t) => (t === 'g' ? 'Grupo' : 'Solista');

// Con listas propias, algunas categorías pierden sentido según las canciones elegidas:
// - Todas de una sola década: «Década» pasa a «¿80-84 o 85-89?» y «¿Antes o después del 2000?» a «Año ±1».
// - Varias décadas, pero todas antes (o todas después) del 2000: la pregunta usa el cambio de década
//   que mejor reparte las canciones (p. ej. «¿Antes o después de 1990?»; 1990 cuenta como «después»).
// Los colores no cambian, así que las tarjetas impresas siguen sirviendo.
// - Todas de películas («Bandas sonoras»): «Grupo o solista» y «Título» pasan a «Película», y «Artista» a «Cantante».
const yy = (y) => (y < 2000 ? String(y).slice(2) : String(y));
export function adaptCats(cats, pool) {
  const out = [...cats];
  if (!pool || !pool.length) return out;
  if (pool.every((s) => s.film)) {
    const iT = cats.indexOf('Título'), iA = cats.indexOf('Artista'), iG = cats.indexOf('Grupo o solista');
    if (iT >= 0) out[iT] = 'Película';
    if (iG >= 0) out[iG] = 'Película';
    if (iA >= 0) out[iA] = 'Cantante';
  }
  const decades = [...new Set(pool.map((s) => decadeOf(s.year)))].sort((a, b) => a - b);
  const iDec = cats.indexOf('Década');
  const i2000 = cats.indexOf('¿Antes o después del 2000?');
  if (decades.length === 1) {
    const d = decades[0];
    if (iDec >= 0) out[iDec] = `¿${yy(d)}-${String(d + 4).slice(2)} o ${yy(d + 5)}-${String(d + 9).slice(2)}?`;
    if (i2000 >= 0) out[i2000] = 'Año ±1';
    return out;
  }
  if (i2000 >= 0 && (pool.every((s) => s.year < 2000) || pool.every((s) => s.year >= 2000))) {
    let best = decades[1], bestGap = Infinity;
    for (const b of decades.slice(1)) {
      const gap = Math.abs(pool.filter((s) => s.year < b).length * 2 - pool.length);
      if (gap < bestGap) { best = b; bestGap = gap; }
    }
    out[i2000] = `¿Antes o después de ${best}?`;
  }
  return out;
}
