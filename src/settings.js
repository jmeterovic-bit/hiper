// Ajustes del teléfono (solo en este aparato): dónde suena y cuánto se escucha.
const KEY = 'ajustes';
const DEFAULTS = { deviceId: null, deviceName: null, listen: 'fragmento' };
export function getSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}
export function setSettings(patch) {
  const next = { ...getSettings(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}
