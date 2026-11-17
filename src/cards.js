// Lee el enlace del QR de una carta y busca su canción en la lista de Hitster (src/catalog.js).
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

// Enlace limpio para abrir con Android: https y dominio en minúsculas (los QR suelen venir en MAYÚSCULAS,
// y Android distingue mayúsculas en el esquema y el dominio).
export function cardLink(card) {
  const ed = card.edition !== card.lang ? card.edition + '/' : '';
  return `https://www.hitstergame.com/${card.lang}/${ed}${card.card}`;
}
