# CalFight -> Roblox Studio (100% Construido en Roblox, sin Blockbench ni .obj)

Todo el mapa de **Ciudad Aurora** está construido directamente con **piezas nativas de Roblox** (`Part`, `WedgePart`, `SurfaceGui`, `PointLight`, `SpawnLocation` y `Model`), listo para meter en tu proyecto `bat.rbxl` **sin importar ni un solo `.obj`**.

---

## Qué incluye `CalFight_Ciudad_Roblox.rbxmx`
- **37 Edificios completos** dentro de `Map/Edificios`:
  - Fachadas con ventanas (`Glass`), marcos, molduras, toldos, balcones, unidades de aire y azoteas.
  - **8 locales accesibles con puertas abiertas e interiores amueblados**: `CAFÉ LUNA`, `ARCADE`, `MERCADO`, `LIBROS` (Biblioteca), `RAMEN`, `TALLER`, `CENTRO COMERCIAL` y `TORRE AURORA` (vestíbulo de mármol + ascensor), más **`CASINO AURORA`** (alfombra, recepción, mesas de juego, ruleta y bar).
- **31 Carteles** con `SurfaceGui` legible y **Reloj de la Estación**.
- **417 tramos de avenidas, calles, plaza y pasos de cebra** + Plaza circular central.
- **221 Árboles destructibles** en `Map/Trees` (`Model` con `TreeRoot`, compatibles con el script `DestroyAmbient` de `bat.rbxl`).
- **397 piezas de parques y mobiliario** (fuente, bancos, jardineras, farolas con `PointLight`, borde de la arena) y `117` siluetas ligeras en `Map/Horizonte`.
- **138 piezas de Playa y Mar** + **34 modelos nativos en la costa** (`muelle` caminable con farolas, `palmeras`, `sombrillas`, `torres de salvavidas`, `chiringuitos`, `cancha de vóley playa`, `faro` iluminado, `barcas`, `velero`, `casetas`, `castillos de arena` y `rocas`).
- **44 `SpawnLocation`** (`Spawn1..Spawn44`) + plataformas de ascensor de Torre Aurora (`Map/Ascensores`).

---

## Instalación en `bat.rbxl` (2 pasos)

1. **Insertar el mapa en Studio**:
   - Abre `bat.rbxl` en **Roblox Studio**.
   - En **Explorer**, haz clic derecho sobre **`Workspace`** → **Insert from File...** y selecciona:
     `f:\blockstrike\roblox_ciudad\CalFight_Ciudad_Roblox.rbxmx`

2. **Reemplazar el mapa de Battlegrounds automáticamente**:
   - Abre **View → Command Bar**.
   - Abre **[Instalar_Ciudad_Roblox.luau](file:///f:/blockstrike/roblox_ciudad/Instalar_Ciudad_Roblox.luau)**, copia todo, pégalo en la **Command Bar** y pulsa **Enter**.
   - En segundos borra el mapa anterior de Battlegrounds (conservando `Throwables` y `Emote Anims`), mete Ciudad Aurora dentro de `Workspace.Map`, reemplaza `Spawn1..Spawn2` por los 44 spawns de CalFight e instala el script `AscensorTorreAurora` en `ServerScriptService`.

¡Listo! Dale a **Play (F5)** para probarlo.
