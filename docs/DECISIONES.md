# Decisiones

## Concepto
1. Menú: Lado A (básico) o Lado B (experto). Mismas categorías que las tarjetas impresas.
2. Botón grande «¡Vamos!»: ruleta con notas musicales y los 5 colores que frena en una categoría al azar; suena el jingle de esa categoría.
3. «Escanear tarjeta»: lector de QR de Google (ML Kit). El QR trae `hitstergame.com/<idioma>/<edición>/<número>`.
4. La app busca la canción en la lista de Hitster (`src/catalog.js`) y la pone en Spotify. Ronda de 25 s sin números: notas y colores que aceleran.
5. «¡Tiempo!» en rojo (zumbido, vibración y pausa de Spotify), con «Siguiente ronda» y «¡Bingo! Terminar».

## Decisiones
| Tema | Decisión | Motivo |
|---|---|---|
| Plataforma | Capacitor + Vite, como Rutina Gym | Jose ya usa ese flujo y el APK lo compila GitHub. |
| Spotify | Web API con PKCE (Client ID en `src/config.js`, redirect `bingovinilo://callback`) | Suena mientras la app sigue en pantalla. Jose tiene Premium. |
| Aparato de Spotify | Ajuste «Suena en» en el menú (lista de `/me/player/devices`, guardado en el teléfono). Sin elección: el teléfono antes que el aparato activo. | Sonaba en la PC de Jose (era el aparato activo). |
| Inicio de la ronda | La cuenta de 25 s empieza cuando `/me/player` dice que la canción ya suena (máx. 12 s de espera). | Spotify tarda unos segundos en empezar (Jose, 2026-11-17). |
| Escuchar | Ajuste «Fragmento» (se pausa al «¡Tiempo!») o «Completa» (sigue sonando; se pausa al terminar la partida). | Como la app oficial, pedido de Jose. |
| Token | Se renueva solo; si vence (180 días), la app muestra «Entrar a Spotify» | Límite de Spotify, no se puede quitar. |
| QR | `scan()` de Google Code Scanner | No pide permiso de cámara y es estable. |
| Canción de cada carta | Con Spotify conectado: escáner propio + lista de Jumbo (`gameset_database.json`, la misma de la app oficial; `{gamesets:[{sku, gameset_data:{cards:[{CardNumber, Spotify}]}}]}`), descargada en el teléfono y guardada en IndexedDB 7 días. Sin Spotify o carta fuera de la lista: botón para escanear en la app de Hitster (la ronda empieza al volver). | Jose eligió la lista de Jumbo (2026-11-17) tras ver que abrir la app de Hitster obliga a escanear dos veces. La lista trae las ediciones Latino (p. ej. aaab0004, aaaa0053, aaaa0102). No se guarda una copia en el repo. |
| Sonidos | Web Audio generado, sin archivos | Sin licencias y liviano. |
| Fuentes | Bungee e Inter empaquetadas (@fontsource, licencia OFL) | Funciona sin internet. |

## Pendiente
- Probar en el teléfono el escaneo propio con Spotify (edición Latino).
- Probar en el teléfono el inicio de sesión de Spotify y el lector de QR.

## Rechazado
- Campo «Client ID» para que cada amigo use su propia app de Spotify (Jose, 2026-11-17): los amigos se agregan en User Management o usan el escaneo en la app de Hitster.
- Abrir el enlace de la carta para que lo tome la app de Hitster: Android lo manda a la web de hitstergame.com (2026-11-17).

## Bitácora
| Fecha | Versión | Cambio |
|---|---|---|
| 2026-11-17 | 0.5.0 | Elegir aparato de Spotify, la cuenta espera a que suene la canción, opción Fragmento/Completa. |
| 2026-11-17 | 0.4.0 | Escaneo propio con la lista de Hitster y canción en Spotify sin salir de la app. La app de Hitster queda como respaldo. |
| 2026-11-17 | 0.3.1 | Ícono: el disco de vinilo de la app (surcos, etiqueta rosa) sobre fondo #15131F, pedido de Jose. |
| 2026-11-17 | 0.3.0 | El botón abre la app de Hitster para escanear ahí (la app de Hitster no acepta el enlace de la carta). |
| 2026-11-17 | 0.2.4 | La pantalla «¡Tiempo!» muestra la categoría de la ronda (color, dado y nombre), pedido de Jose. |
| 2026-11-17 | 0.2.3 | Ninguna app aceptaba el enlace: se rearma el enlace de la carta en minúsculas y con https (`cardLink`), porque los QR pueden venir en mayúsculas. Segundo intento sin BROWSABLE. El aviso muestra el enlace usado. |
| 2026-11-17 | 0.2.2 | El enlace se abre con un plugin propio (`AbrirPlugin.java`, ACTION_VIEW + NEW_TASK) que además dice qué apps aceptan el enlace; si falla, el mensaje lo muestra para diagnosticar. |
| 2026-11-17 | 0.2.1 | El conteo arrancaba al cerrar el escáner sin abrir Hitster. Ahora se espera a que el escáner cierre, se abre el enlace con https, la ronda empieza solo si la app salió y volvió, y si en 3 s no se abrió nada aparecen «Abrir en la app de Hitster» y «Empezar ronda». |
| 2026-11-17 | 0.2.0 | Al escanear se abre la carta en la app oficial de Hitster; la ronda empieza al volver. Spotify ya no es obligatorio (sirve para pausar al «¡Tiempo!»). |
| 2026-11-17 | 0.1.0 | Primera versión: menú A/B, ruleta, escaneo, Spotify, ronda de 25 s, «¡Tiempo!» y «¡Bingo!». |
