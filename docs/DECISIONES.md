# Decisiones

## Concepto
1. Menú: Lado A (básico) o Lado B (experto). Mismas categorías que las tarjetas impresas.
2. Botón grande «¡Vamos!»: ruleta con notas musicales y los 5 colores que frena en una categoría al azar; suena el jingle de esa categoría.
3. «Escanear tarjeta»: lector de QR de Google (ML Kit). El QR trae `hitstergame.com/<idioma>/<edición>/<número>`.
4. La app busca la canción en `public/cartas.json` y la pone en Spotify. Ronda de 25 s sin números: notas y colores que aceleran.
5. «¡Tiempo!» en rojo (zumbido, vibración y pausa de Spotify), con «Siguiente ronda» y «¡Bingo! Terminar».

## Decisiones
| Tema | Decisión | Motivo |
|---|---|---|
| Plataforma | Capacitor + Vite, como Rutina Gym | Jose ya usa ese flujo y el APK lo compila GitHub. |
| Spotify | Web API con PKCE (Client ID en `src/config.js`, redirect `bingovinilo://callback`) | Suena mientras la app sigue en pantalla. Jose tiene Premium. |
| Token | Se renueva solo; si vence (180 días), la app muestra «Entrar a Spotify» | Límite de Spotify, no se puede quitar. |
| QR | `scan()` de Google Code Scanner | No pide permiso de cámara y es estable. |
| Canción de cada carta | «Escanear en Hitster» abre la app oficial de Hitster (se busca por nombre entre las apps del inicio); ahí se escanea y suena. La ronda de 25 s empieza al volver. El escáner propio + `public/cartas.json` quedan en el código (`scanHere`) para cuando haya lista de canciones. | Jose eligió abrir la app de Hitster (2026-11-17). Pasarle el enlace de la carta no sirve: la app de Hitster no acepta enlaces externos y se abre su web (probado 0.2.4). |
| Sonidos | Web Audio generado, sin archivos | Sin licencias y liviano. |
| Fuentes | Bungee e Inter empaquetadas (@fontsource, licencia OFL) | Funciona sin internet. |

## Pendiente
- Una sola lectura de la carta (sin pasar por la app de Hitster) requiere la lista carta → canción de la edición Latino.
- Probar en el teléfono el inicio de sesión de Spotify y el lector de QR.

## Rechazado
- Abrir el enlace de la carta para que lo tome la app de Hitster: Android lo manda a la web de hitstergame.com (2026-11-17).

## Bitácora
| Fecha | Versión | Cambio |
|---|---|---|
| 2026-11-17 | 0.3.1 | Ícono: el disco de vinilo de la app (surcos, etiqueta rosa) sobre fondo #15131F, pedido de Jose. |
| 2026-11-17 | 0.3.0 | El botón abre la app de Hitster para escanear ahí (la app de Hitster no acepta el enlace de la carta). |
| 2026-11-17 | 0.2.4 | La pantalla «¡Tiempo!» muestra la categoría de la ronda (color, dado y nombre), pedido de Jose. |
| 2026-11-17 | 0.2.3 | Ninguna app aceptaba el enlace: se rearma el enlace de la carta en minúsculas y con https (`cardLink`), porque los QR pueden venir en mayúsculas. Segundo intento sin BROWSABLE. El aviso muestra el enlace usado. |
| 2026-11-17 | 0.2.2 | El enlace se abre con un plugin propio (`AbrirPlugin.java`, ACTION_VIEW + NEW_TASK) que además dice qué apps aceptan el enlace; si falla, el mensaje lo muestra para diagnosticar. |
| 2026-11-17 | 0.2.1 | El conteo arrancaba al cerrar el escáner sin abrir Hitster. Ahora se espera a que el escáner cierre, se abre el enlace con https, la ronda empieza solo si la app salió y volvió, y si en 3 s no se abrió nada aparecen «Abrir en la app de Hitster» y «Empezar ronda». |
| 2026-11-17 | 0.2.0 | Al escanear se abre la carta en la app oficial de Hitster; la ronda empieza al volver. Spotify ya no es obligatorio (sirve para pausar al «¡Tiempo!»). |
| 2026-11-17 | 0.1.0 | Primera versión: menú A/B, ruleta, escaneo, Spotify, ronda de 25 s, «¡Tiempo!» y «¡Bingo!». |
