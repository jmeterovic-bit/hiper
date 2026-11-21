// Lógica del modo «Listas propias» (sin pantalla ni red, para poder probarla).
import { THEMES } from './listas.js';

export const decadeOf = (year) => Math.floor(year / 10) * 10;
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function toSong([title, artist, year, type, search], theme) {
  return { title, artist, year, type, search: search || artist, theme, key: norm(title) + '|' + norm(search || artist) };
}

// Todas las canciones, sin repetir (una canción puede estar en dos temas).
export function allSongs(themes = THEMES) {
  const seen = new Map();
  for (const t of themes) for (const row of t.songs) {
    const s = toSong(row, t.id);
    if (!seen.has(s.key)) seen.set(s.key, s);
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
