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
| Canción de cada carta | Al escanear se abre el enlace de la carta con Android y lo toma la app oficial de Hitster, que la pone en Spotify. La ronda de 25 s empieza al volver a esta app. `public/cartas.json` (vacío) queda como opción para tocarla desde aquí. | Jose eligió esta opción (2026-11-17): la lista de Jumbo no se pudo leer y la comunitaria no cubre su edición. |
| Sonidos | Web Audio generado, sin archivos | Sin licencias y liviano. |
| Fuentes | Bungee e Inter empaquetadas (@fontsource, licencia OFL) | Funciona sin internet. |

## Pendiente
- Probar que la app de Hitster toma el enlace de la carta (edición Latino que Jose está comprando).
- Probar en el teléfono el inicio de sesión de Spotify y el lector de QR.

## Rechazado
(nada todavía)

## Bitácora
| Fecha | Versión | Cambio |
|---|---|---|
| 2026-11-17 | 0.2.0 | Al escanear se abre la carta en la app oficial de Hitster; la ronda empieza al volver. Spotify ya no es obligatorio (sirve para pausar al «¡Tiempo!»). |
| 2026-11-17 | 0.1.0 | Primera versión: menú A/B, ruleta, escaneo, Spotify, ronda de 25 s, «¡Tiempo!» y «¡Bingo!». |
