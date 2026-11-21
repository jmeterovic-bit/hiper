# Bingo del Vinilo (repo `hiper`)

App Android personal de Jose para jugar un bingo musical casero con las cartas de Hitster (QR) o con listas propias por tema (`src/listas.js`). Capacitor 7 + Vite, JS sin framework, interfaz en español. Las tarjetas y el tablero impresos están en los archivos del proyecto (`bingo-hipster/`).

**Antes de cambiar algo, lee [docs/DECISIONES.md](docs/DECISIONES.md).**

## Reglas que no se rompen
- Juego propio: no copiar textos, arte ni diseño de Hitster/Jumbo. Solo se leen los QR de las cartas que Jose compró.
- Listas propias: no escribir IDs ni enlaces de Spotify a mano; la app busca cada canción por título y artista.
- La canción suena en la app de Spotify del teléfono (Premium), controlada con la Web API. Sin secreto de cliente: PKCE.
- No guardar ni enviar a ningún servicio datos de Jose más allá del inicio de sesión de Spotify (tokens en el teléfono).

## Compilar
- `npm test` y `npm run lint`. GitHub Actions los corre y compila el APK en cada push y PR (secreto `DEBUG_KEYSTORE_BASE64`, el mismo de Rutina Gym, para que las actualizaciones se instalen encima).
- La versión solo se cambia en `package.json`.
- PC: `npm install` y `npm run dev` (el escaneo pide el texto del QR).

## Al terminar un cambio
Agrega una fila a la bitácora de `docs/DECISIONES.md` y una sección en `CHANGELOG.md`.
