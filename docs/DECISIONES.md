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
| Escuchar | Ajuste «Fragmento» (empieza en un punto al azar entre el 20 % y 40 s antes del final; se pausa al «¡Tiempo!») o «Completa» (sigue sonando; se pausa al terminar la partida). | Como la app oficial, pedido de Jose. |
| Token | Se renueva solo; si vence (180 días), la app muestra «Entrar a Spotify» | Límite de Spotify, no se puede quitar. |
| QR | `scan()` de Google Code Scanner | No pide permiso de cámara y es estable. |
| Canción de cada carta | Con Spotify conectado: escáner propio + lista de Jumbo (`gameset_database.json`, la misma de la app oficial; `{gamesets:[{sku, gameset_data:{cards:[{CardNumber, Spotify}]}}]}`), descargada en el teléfono y guardada en IndexedDB 7 días. Sin Spotify o carta fuera de la lista: botón para escanear en la app de Hitster (la ronda empieza al volver). | Jose eligió la lista de Jumbo (2026-11-17) tras ver que abrir la app de Hitster obliga a escanear dos veces. La lista trae las ediciones Latino (p. ej. aaab0004, aaaa0053, aaaa0102). No se guarda una copia en el repo. |
| Modo «Listas propias» | Listas por tema en `src/listas.js` (título, artista, año original, grupo/solista). La app busca cada canción en Spotify al jugar (`/search`, se elige la versión del artista y se evita karaoke) y guarda el ID en el teléfono. Mezclar todas o elegir temas y décadas. La respuesta sale al «¡Tiempo!» con «Ver respuesta» (sola a los 6 s, para dar tiempo a anotar). No se repite hasta agotar la elección. | Pedido de Jose (2026-11-20): jugar sin cartas. Sin IDs escritos a mano: no se inventan enlaces. Los años los escribió Claude: revisarlos si alguno parece mal. |
| Sonidos | Web Audio generado, sin archivos | Sin licencias y liviano. |
| Fuentes | Bungee e Inter empaquetadas (@fontsource, licencia OFL) | Funciona sin internet. |

## Pendiente
- Revisar en partidas reales los años de las listas propias y si Spotify encuentra todas las canciones.
- Probar en el teléfono el escaneo propio con Spotify (edición Latino).
- Probar en el teléfono el inicio de sesión de Spotify y el lector de QR.

## Rechazado
- Campo «Client ID» para que cada amigo use su propia app de Spotify (Jose, 2026-11-17): los amigos se agregan en User Management o usan el escaneo en la app de Hitster.
- Abrir el enlace de la carta para que lo tome la app de Hitster: Android lo manda a la web de hitstergame.com (2026-11-17).

## Bitácora
| Fecha | Versión | Cambio |
|---|---|---|
| 2026-11-22 | 0.9.0 | Lista «Bandas sonoras», pedida por Jose: como Películas, pero la respuesta es la película, el año (de la película) y el cantante. Sexto dato en la fila: la película (título en español latino conocido, con el original entre paréntesis cuando son distintos). Solo con canciones de película, «Título» → «Película» y «Artista» → «Cantante» (`adaptCats`); los colores no cambian. Si una canción está en Películas y en Bandas sonoras, `allSongs` se queda con la que trae la película. |
| 2026-11-21 | 0.8.0 | Cuatro listas nuevas pedidas por Jose: Música colombiana (35), Colombia 70 - 00's (34, éxitos colombianos e internacionales 1970-2009), Música boliviana (30) y Bolivia 70 - 20's (35, bolivianos e internacionales 1976-2022). Años de Los Kjarkas: el del álbum de estudio donde sale la canción (álbum visto en Spotify y año en la discografía de Wikipedia). Otros bolivianos: año de listas de prensa boliviana; cada canción se comprobó en Spotify. Años bolivianos menos seguros que el resto: Tiempo al tiempo (1995, álbum Quiquin Pacha; una lista dice 1988). |
| 2026-11-21 | 0.7.2 | Revisión de los años de las listas propias, pedida por Jose (MusicBrainz y Wikipedia no se pueden consultar desde aquí: revisión propia más búsquedas web). Billie Jean pasa de 1983 a 1982 (salió en el álbum Thriller, nov. 1982). Se dejan: Take On Me 1985 (éxito mundial; la primera versión es de 1984), Hotel California 1976 (álbum; el sencillo es de 1977), Te boté 2018 (el original es de fines de 2017, el remix famoso de 2018), Héroe 2002 (la versión en español salió como sencillo en 2002; Hero es de 2001). Criterio: el año en que la canción salió por primera vez, salvo que sea mucho más conocida por una versión posterior. |
| 2026-11-20 | 0.7.1 | En el teléfono de Jose «Fragmento» seguía empezando al inicio con 0.7.0. Ahora `waitUntilPlaying` revisa `/me/player`: si va en los primeros 15 s, hace `seek` a un punto al azar (hasta 2 intentos; sin duración se suponen 3 min). La cuenta empieza después del salto. |
| 2026-11-20 | 0.7.0 | «Fragmento» empieza en un punto al azar (duración con `/tracks/{id}`; si falla, salta con `/me/player/seek` apenas suena). Letra de la respuesta se ajusta a títulos largos. Listas propias: categorías que pierden sentido según las décadas elegidas se reemplazan (`adaptCats`: una década → «¿80-84 o 85-89?» y «Año ±1»; todas de un lado del 2000 → «¿Antes o después de <década que mejor reparte>?»; el año del corte cuenta como «después»). Mismos colores: las tarjetas impresas sirven. Pedidos de Jose. |
| 2026-11-20 | 0.6.1 | «Insufficient client scope» al poner canción en Listas propias: la búsqueda usaba `market=from_token`, que exige `user-read-private`. Se quita el parámetro (con el token, Spotify usa el país de la cuenta). |
| 2026-11-20 | 0.6.0 | Modo «Listas propias»: 8 temas (328 canciones), mezclar todas o elegir temas y décadas, respuesta en pantalla al «¡Tiempo!». Pedido de Jose. |
| 2026-11-18 | 0.5.0 | El Release se publica solo al mezclar a `main`: si la versión de `package.json` no tiene Release, el workflow crea la etiqueta `v<versión>` y lo publica con el APK y las notas del CHANGELOG. Pedido de Jose. |
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
