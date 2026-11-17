// Datos de la app de Spotify de Jose (developer.spotify.com). El Client ID es público: no es un secreto.
export const SPOTIFY_CLIENT_ID = '04fc5056476340739089d2e97be9edfe';
export const REDIRECT_URI = 'bingovinilo://callback';
export const SCOPES = ['user-read-playback-state', 'user-modify-playback-state'];
export const ROUND_MS = 25000;

export const COLORS = ['#7b4fc9', '#2f7fd6', '#e98a1b', '#2fa36b', '#e0457b'];
export const SIDES = {
  A: { name: 'Lado A', level: 'básico', cats: ['Década', 'Grupo o solista', 'Año ±2', 'Año ±4', '¿Antes o después del 2000?'] },
  B: { name: 'Lado B', level: 'experto', cats: ['Década', 'Artista', 'Título', 'Año exacto', 'Año ±3'] }
};
