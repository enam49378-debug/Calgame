# Herramientas para ordenar el código

`js/game.js` vive dentro de un solo cierre (`(() => { ... })()`) a propósito: así nada del juego queda accesible desde la consola del navegador (anti-trampas).
Para separarlo en archivos sin perder eso se usa el mismo patrón que `js/graficos/`: cada parte es una **fábrica** que `game.js` crea en el mismo lugar donde estaba el código, pasándole lo que necesita.

```js
// js/ui/minimapa.js
window.CF_UI.crearMinimapa = function crearMinimapa(D) {
  'use strict';
  const { $, CITY, G, clamp } = D;   // lo que no cambia se recibe por valor
  // ... el código de siempre ...  D.algo para lo que se reasigna o se crea más abajo en game.js
  return { MM, mmDraw };             // lo que el resto del juego usa
};

// js/game.js, en el lugar donde estaba la sección
const { MM, mmDraw } = CF_UI.crearMinimapa({ $, CITY, G, clamp });
```

Instalar una vez: `npm install` (trae `acorn`, `acorn-walk` y `eslint-scope`).

## extraer_seccion.js

Mueve un rango de líneas de `game.js` a un módulo nuevo, de forma automática y segura (analiza el alcance real de cada nombre):

```
node tools/refactor/extraer_seccion.js js/game.js <desde> <hasta> js/<carpeta>/<archivo>.js CF_<ESPACIO> crear<Nombre> "Título" --dry
```

- `--dry` solo muestra qué pasaría: qué recibe por valor, qué lee a través de `D` y qué devuelve. Sin `--dry` lo aplica.
- No lo aplica si hay problemas (por ejemplo, algo que se usa al cargar **antes** de la sección o una variable que se reasigna afuera).
- Después:
  1. `node tools/refactor/cfa_getters.js js/game.js` (en `CF_A`, lo que ahora viene de módulos pasa a getter; antes las funciones se "elevaban" al principio del archivo y ahora no).
  2. Agregar el `<script defer>` del módulo en `index.html`, **antes** de `js/game.js`.
  3. Si el módulo llama al cargar a una función de `game.js` que a su vez usa algo del módulo, mover esa llamada a `game.js`, justo después de crearlo (pasó con `hudSyncUI()` del minimapa).
  4. Probar en el navegador: que cargue, entrar a una partida y abrir lo que se separó.

## buscar_errores.js (`npm run revisar`)

Busca nombres que no existen en ningún lado (un `ReferenceError` que solo aparece cuando se ejecuta esa línea) y claves repetidas en objetos. Sin argumentos revisa `js/` y `server/`.
