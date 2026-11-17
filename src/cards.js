// Lee el enlace del QR de una carta y busca su canción en la lista local (public/cartas.json).
// Formato del QR: http://www.hitstergame.com/<idioma>/<edición>/<número>  (algunas ediciones no traen <edición>).

export function parseCardUrl(text) {
  if (typeof text !== 'string') return null;
  const m = text.trim().match(/hitstergame\.com\/([a-z]{2}(?:-[a-z]{2})?)\/(?:([a-z0-9]{8})\/)?(\d{1,6})\/?$/i);
  if (!m) return null;
  return { lang: m[1].toLowerCase(), edition: (m[2] || m[1]).toLowerCase(), card: m[3].padStart(5, '0') };
}

// lista: { "<edición>": { "<número de 5 dígitos>": "<id de la canción en Spotify>" } }
export function findTrack(list, card) {
  if (!list || !card) return null;
  const id = list[card.edition]?.[card.card];
  if (!id) return null;
  const clean = String(id).replace(/^spotify:track:/, '').replace(/^https?:\/\/open\.spotify\.com\/track\//, '').split('?')[0];
  return /^[A-Za-z0-9]{22}$/.test(clean) ? clean : null;
}
