# Arquitectura de Gráficos (`js/graficos/`)

Todo el sistema gráfico base se extrajo de `js/game.js` en **5 módulos autocontenidos** bajo `js/graficos/`, conectados mediante el espacio de nombres `window.CF_GRAFICOS`.

---

## 1. Mapa de módulos

| Archivo | Fábrica | Responsabilidad principal |
| :--- | :--- | :--- |
| [`motor_escena.js`](../js/graficos/motor_escena.js) | `CF_GRAFICOS.crearMotorEscena(dep)` | `WebGLRenderer`, mapeo de tonos (`TONOS`, `window.tonos`), `scene`, `camera`, luces base (`sun`, `HEMI`), domo de cielo anime (`skyDome`, `ANIME_SKY_TEX`, `skyFollow`), texturas procedurales (`noiseRect`, `pixTex`, `BLOCK_TEX`), uniforms `ZZZ_U` / `HOLE_U` / `CITY_CUT` y shader de ciudad `cityAnimeMaterial`. |
| [`materiales_peleador.js`](../js/graficos/materiales_peleador.js) | `CF_GRAFICOS.crearMaterialesPeleador(dep)` | Generación y normalización de skins (`makeSkinCanvas`, `normalizeSkin`, `detectSlim`, `headPortrait`), `TOON_GRAD`, `OUTLINE_MAT`, `boxUV`, shader de peleador cel-shaded `fighterToonMaterial` y constructores de rigs (`buildModel`, `disposeModel`, `buildJesulutoModel`, `buildFighterModel`). |
| [`escenario_ulti.js`](../js/graficos/escenario_ulti.js) | `CF_GRAFICOS.crearEscenarioUlti(dep)` | Escenario estilizado aislado para cinemáticas de ulti (`STAGE`, `initStage`, `stageEnter`, `stageExit`, `updateStage`) y oscurecimiento dramático del mundo (`cineGrade`). |
| [`efectos_combate.js`](../js/graficos/efectos_combate.js) | `CF_GRAFICOS.crearEfectosCombate(dep)` | Partículas instanciadas (`Parts`, `PS`, `emit`, `burst`), ciclo de efectos 3D (`FX`, `addFx`, `updateFx`, `removeFx`), destellos y cortes (`ringAt`, `sphereFlash`, `slashLine`, `impactStar`, `arcSlash`, `ghost`, `warnCircle`, `fireColumn`, `iceSpikes`, `iceBlock`), `IMPACT` / `impactFrame`, chispas, grietas, `updateAura`, números de daño y onomatopeyas (`popText`, `comicPop`, `updateNums`), sombras de contacto (`updateContactShadow`), auras de despertar (`updateAwakeningAura`) y polvo (`animeDustRing`, `animeDashSmoke`). |
| [`calidad_post.js`](../js/graficos/calidad_post.js) | `CF_GRAFICOS.crearCalidadYPost(dep)` | `EffectComposer` (`RenderPass`, `UnrealBloomPass`, `caPass` aberración cromática, `gradePass` gradación Zenless Urbano / clásica, `window.nitidez`), presets y escalado automático (`GFX`, `GFX_CFG`, `GFX_LIMIT`, `window.estiloVisual`, `gfxInit`, `gfxApply`, `gfxSet`, `gfxWatch`, `performanceDecorations`), render principal y paneles cómic (`renderView`, `renderPanels`, `drawPanelBorders`, `renderMain`), speedlines 2D (`LC`, `LG`, `drawLines`), contador `FPS` (`F2`) y resplandor solar (`updateGodRays`). |

---

## 2. Patrón de integración con `js/game.js` y `CF_A`

1. **Sin dependencias circulares al cargar**: Cada módulo se carga con `<script defer>` antes de `js/game.js` y únicamente define su constructor en `window.CF_GRAFICOS`.
2. **Inyección de dependencias (`dep`)**: `js/game.js` instancia cada fábrica pasando utilidades matemáticas/DOM y *getters* perezosos (`getG`, `getWX`, `getCITY`, `getSTAGE`, `getGFX`, `getGFX_CFG`, `getGradePass`, etc.) + *callbacks* (`onPasses`, `onPerf`) para sincronizar estados mutables.
3. **Compatibilidad total con habilidades y pruebas**:
   - Todos los símbolos usados por `personajes/*/Code`, `js/habilidades.js`, `js/abismo.js`, `js/muelle.js` y `js/bbmodelos.js` siguen expuestos en `CF_A`.
   - Variables reasignables en pruebas locales (`composer`, `gradePass`, `bloomPass`, `renderMain`, `renderView`, `PERF_FX`, `PERF_DEST`, `linesDrawn`) conservan sus enlaces en el cierre de `game.js`.

---

## 3. Dónde agregar mejoras gráficas futuras

- **Nuevos uniforms o pases de iluminación / toon / sombras de mundo**: [`motor_escena.js`](../js/graficos/motor_escena.js) (`ZZZ_U` y `cityAnimeMaterial`).
- **Sombras, contorno, Fresnel o materiales de personaje**: [`materiales_peleador.js`](../js/graficos/materiales_peleador.js) (`fighterToonMaterial` y `OUTLINE_MAT`).
- **Nuevos pases de posprocesado (`SSAOPass`, HDR/ACES custom, DOF, bloom avanzado, grading)**: [`calidad_post.js`](../js/graficos/calidad_post.js) (`initPostProcessing`, `renderView`, `GFX_CFG`).
- **Partículas, slashes o VFX de impacto**: [`efectos_combate.js`](../js/graficos/efectos_combate.js).
- **Texturas y detección de transparencia**: [`js/texturas.js`](../js/texturas.js).

---

## 4. Puerta Beta para Owner / Git local (`ZZZ_U.beta`)

Las mejoras visuales experimentales (sombras nítidas 2048/3072 con texel-snap y sombras de luna, terminador ZZZ en peleadores/armas, especular cel anime y contornos dinámicos) están protegidas por `ZZZ_U.beta`:

- **Activadas automáticamente**:
  - Cuando el juego se ejecuta localmente tras descargar el repositorio de Git (`localhost`, `127.0.0.1`, `[::1]` o `file:`).
  - En la web pública, **únicamente** para el **Owner** (cuenta verificada con correo Owner en Firebase Auth `SOC.owner` o desbloqueo `DEV.on` mediante la clave privada de `CLAVE_DUENO.txt`).
- **Para jugadores normales en la web pública**: `ZZZ_U.beta` permanece en `0`, manteniendo la iluminación, sombras (`1024×1024`), opciones de menú y shaders estables previos sin exponer la beta.
- **Comparar vistas como Owner**: Desde la consola del Owner (`F2`) puedes alternar en vivo entre vista beta y vista de jugador normal con el botón **Beta ZZZ** o el comando `/beta [on|off]`.
