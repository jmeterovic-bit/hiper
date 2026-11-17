// Pasos de la ruleta: empieza rápido y va frenando hasta caer en la categoría elegida.
export function rouletteSteps(pick, { first = 55, factor = 1.11, max = 420, count = 5 } = {}) {
  const delays = [];
  for (let d = first; d < max; d *= factor) delays.push(Math.round(d));
  const start = (((pick - delays.length) % count) + count) % count;
  return delays.map((ms, i) => ({ ms, cat: (start + i + 1) % count }));
}
