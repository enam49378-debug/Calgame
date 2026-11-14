# Orden del Proyecto · Blockstrike / CalFight

Guía de carpetas, archivos de código, lanzadores y documentación del proyecto.

---

## 1. Vista general de carpetas (raíz)

Las carpetas de recursos del juego (`assets/`, `ciudad/`, `modelos/`, `personajes/`, `caras/`, `musica/`, `sonidos/`, `css/`, `lib/`, `js/`, `config/`) permanecen directamente en la raíz porque `index.html`, los shaders/cargadores (`fetch(...)`, `new Audio(...)`), Firebase (`firebase.json`) y el servidor estático resuelven rutas relativas desde `/`.

```text
blockstrike/
├── index.html                  # Entrada principal y orden de carga de CSS y scripts
├── package.json                # Scripts de servidor y pruebas (npm start, npm run test:...)
├── CLAUDE.md                   # Reglas y mapa rápido de arquitectura
├── README.md                   # Resumen general y changelog histórico
├── manifest.webmanifest        # Manifiesto PWA / iconos
├── firebase.json               # Reglas y emuladores de Firestore/Auth
├── firestore.rules / .indexes.json
│
├── *.bat / *.ps1 / *.exe       # Lanzadores en Windows (doble clic desde la raíz)
│   ├── Iniciar_Todo.bat        # Servidor local + playit.exe + navegador
│   ├── Iniciar_Servidor.bat    # Solo servidor Node local (puerto 52018)
│   ├── Iniciar_Internet.bat    # Servidor local + túnel Cloudflare / localhost.run
│   ├── Iniciar_Editor.bat      # Servidor de modo desarrollador (tools/dev-server.py)
│   ├── Actualizar_Personajes.bat / Actualizar_Voces.bat / Configurar_Publico.bat
│   ├── Tunel_Cloudflare.ps1 / Tunel_Gratis.ps1
│   ├── CalFight.exe / playit.exe / publico.txt
│
├── js/                         # Código fuente del cliente
│   ├── graficos/               # ★ Motor gráfico, materiales, postprocesado y VFX (ver docs/GRAFICOS.md)
│   │   ├── motor_escena.js
│   │   ├── materiales_peleador.js
│   │   ├── escenario_ulti.js
│   │   ├── efectos_combate.js
│   │   └── calidad_post.js
│   ├── game.js                 # Núcleo de juego (mapa, clima, IA, combate, HUD, loop)
│   ├── physics.js              # Física y colisiones
│   ├── destruction.js          # Destrucción del escenario e impactos de agujeros
│   ├── animations.js           # Keyframes generados para peleadores
│   ├── personajes.js           # Catálogo y atributos de personajes (generado desde personajes/)
│   ├── habilidades.js          # Código compilado de habilidades (generado desde personajes/)
│   ├── bbmodelos.js            # Cargador de .bbmodel para ciudad, mar y abismo
│   ├── texturas.js             # Clasificación de alfa y filtrado de texturas (`CF_TEXTURES`)
│   ├── emote_list.js / emotes.js / emote_clips.js
│   ├── cosmetics.js / mini.js / muelle.js / abismo.js
│   ├── ranking.js / owner.js / disco.js / sonidos.js / arbitro.js
│   └── titulo.js / carga_partida.js
│
├── css/                        # Hojas de estilo (style.css, perfil.css, cuentas.css, mobile.css)
├── lib/                        # Three.js, EffectComposer, passes y MQTT en local (sin CDN)
├── server/                     # Servidor Node.js de salas, lobby y sincronización
├── config/                     # Configuración editable (audio.json, mapa.json)
│
├── assets/                     # Iconos, logos, vallas publicitarias (`billboard/`), máquina del tiempo
├── caras/                      # Expresiones faciales generadas/importadas
├── ciudad/                     # Modelos `.bbmodel` de edificios y muelle de Ciudad Aurora
├── modelos/                    # Modelos `.bbmodel` de abismo, cosméticos y alas (`sekza/`)
├── personajes/                 # Carpeta fuente por peleador (skin, poses, habilidades, voces)
├── blockbench/                 # Proyectos fuente originales y animaciones `.dat`/`.bbmodel`
├── musica/ / sonidos/          # Pistas musicales y efectos/ambiente globales
│
├── tests/                      # Pruebas automatizadas en Node y Playwright (`npm run test:...`)
│
├── tools/                      # Scripts de construcción y utilidades
│   ├── actualizar_personajes.py # Compila personajes/* -> js/personajes.js, js/habilidades.js, etc.
│   ├── voces.py                # Indexa audios en personajes/*/Sound y configura duraciones
│   ├── dev-server.py / save-server.py / export-blockbench.js
│   ├── gen_*.py / atlas_hq.py / densidad_texturas.py / texturas_nativas.py / install_set_playa.py
│   ├── bbsparse.py / bbs_a_clip.py / bbs_escena.py / bbmodel_a_emotes.py / import_*.py / convertir_alas_sekza.py
│   ├── audio/                  # Generadores auxiliares de pistas de audio
│   ├── discord/                # Scripts de administración del servidor de Discord
│   ├── launcher/               # Código fuente C# del lanzador (`CalFight.cs`)
│   └── parches_antiguos/       # Scripts históricos ya aplicados (conservados solo como referencia)
│
└── docs/                       # Documentación e informes ordenados
    ├── ORDEN_DEL_PROYECTO.md   # Este documento
    ├── GRAFICOS.md             # Arquitectura de los 5 módulos en js/graficos/
    ├── ACTIVAR_COMUNIDAD.md    # Guía para configurar Firestore y comunidad
    ├── ACTUALIZACION.md        # Registro de cambios anteriores
    ├── LEEME_SERVIDOR.txt      # Guía para alojar salas locales o por playit.gg
    ├── MODO_DESARROLLADOR.md   # Uso de herramientas y editor en localhost
    ├── SEGURIDAD.md            # Reglas y prácticas de cuentas/autenticación
    └── verificaciones/         # Reportes JSON de verificaciones pasadas
```

---

## 2. Orden de carga en `index.html`

Los scripts usan `defer` y se ejecutan en el orden exacto declarado en [`index.html`](../index.html):

1. **Base 3D y red (`lib/` + `js/texturas.js`)**: `three.min.js`, `texturas.js`, shaders/passes de postprocesado (`CopyShader`, `LuminosityHighPassShader`, `EffectComposer`, `RenderPass`, `ShaderPass`, `UnrealBloomPass`), `mqtt.min.js`.
2. **Módulos gráficos (`js/graficos/`)**:
   - `motor_escena.js`
   - `materiales_peleador.js`
   - `escenario_ulti.js`
   - `efectos_combate.js`
   - `calidad_post.js`
   Cada módulo registra una fábrica pura en `window.CF_GRAFICOS`.
3. **Sistemas del juego y plugins (`CF_HABILIDADES`)**: `physics.js`, `destruction.js`, `animations.js`, `personajes.js`, `habilidades.js`, `emotes*`, `cosmetics.js`, `bbmodelos.js`, `sonidos.js`, `mini.js`, `muelle.js`, `abismo.js`, `ranking.js`, `owner.js`, `disco.js`, `titulo.js`, `carga_partida.js`.
4. **Orquestador principal (`js/game.js`)**: Inicializa los módulos gráficos pasándoles el contexto del juego, construye la ciudad/mar/clima, conecta red e interfaz y ejecuta `CF_A` para todos los plugins de `CF_HABILIDADES`.

---

## 3. Reglas para mantener el código ordenado

- **No tocar carpetas de activos en raíz sin actualizar rutas**: `personajes/`, `modelos/`, `ciudad/`, `musica/`, `sonidos/`, `caras/` y `assets/` se consumen por URL relativa tanto desde el cliente como desde herramientas Python en `tools/`.
- **Scripts en `tools/`**: los scripts activos (`actualizar_personajes.py`, `voces.py`, `gen_*.py`, `bbs_*.py`, etc.) viven directamente en `tools/` porque calculan la raíz del repositorio un nivel arriba (`dirname(tools)`). Scripts sueltos o históricos deben ir a subcarpetas (`tools/parches_antiguos/`, `tools/audio/`, `tools/discord/`).
- **Próximas separaciones recomendadas de `js/game.js`** (siguiendo el mismo patrón de `js/graficos/`):
  1. `js/mundo/` — construcción de ciudad (`CITY_PLAN`), interiores y mar (`buildSeaWorld`, `SEA`).
  2. `js/clima/` — atmósfera compartida (`ROOM_ATMOSPHERE`, `WX`, lluvia, nieve, rayos).
  3. `js/red/` — salas MQTT/WebRTC, interpolación y sincronización multijugador (`NET`).
  4. `js/combate/` — hits, combos, IA de bots y reglas de pelea.
  5. `js/ui/` — HUD, menús, cuentas/perfil y editor de mapas/caras.
