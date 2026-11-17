// Cámara (lector de QR de Google, sin pedir permiso de cámara), pantalla encendida y vibración.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();

export async function scanQr() {
  if (!isNative) return window.prompt ? window.prompt('Texto del QR (modo PC):') : null;
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
    throw new Error('Instalando el lector de QR de Google. Prueba otra vez en unos segundos.');
  }
  const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
  return barcodes?.[0]?.rawValue || null;
}

export async function keepAwake(on) {
  try { on ? await KeepAwake.keepAwake() : await KeepAwake.allowSleep(); } catch {}
}

export async function buzz() {
  try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
}

// Abre el enlace con Android (ACTION_VIEW) con un plugin propio (android/.../AbrirPlugin.java).
// Devuelve { abierto, apps: [paquetes que lo aceptan], error }.
const Abrir = registerPlugin('Abrir');
export async function openExternal(url) {
  if (!isNative) { window.open(url, '_blank'); return { abierto: true, apps: [] }; }
  return Abrir.enlace({ url });
}

// Abre la app oficial de Hitster. Devuelve { abierto, paquete }.
export async function openHitsterApp() {
  if (!isNative) return { abierto: false, paquete: null };
  return Abrir.hitster();
}
