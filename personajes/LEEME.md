# Personajes de CalFight

Cada personaje vive en su propia carpeta: `personajes/<id>/`

```
personajes/<id>/
  personaje.js              estadisticas, habilidades, despertar, ult, consejos
  skin.png                  su skin
  Animation/                animaciones generales (idle, caminar, correr, salto, golpeado...)
  Sound/                    voces generales (baja, dano, muerte, reposo, menu...)
  Ataques basicos/
    Animation/              combo_1 ... combo_4
    Code/                   ataques-basicos.js  (el combo de 5 golpes del clic izquierdo)
    Sound/                  golpe_1, golpe_2...
  Skills/
    Animation/<Habilidad>/  animaciones de esa habilidad (un .json por animacion)
    Code/<Habilidad>/       codigo y logica de esa habilidad (.js)
    Sound/<Habilidad>/      sonidos de esa habilidad
    Ulti/
      Animation/            animaciones de la ulti
      Code/                 codigo de la ulti
      Sound/                activar_ulti, ulti_lista y la musica ulti.mp3
```

Cada habilidad (normal o de despertar) tiene su carpeta con su nombre dentro de `Animation`, `Code` y `Sound`.
`Skills/Animation/_sin_usar/` guarda animaciones que ya no usa ninguna habilidad.

## Como se usa

1. Editas los archivos de la carpeta del personaje.
2. Abres el juego con `Iniciar_Editor.bat`: el servidor vuelve a juntar todo solo.
   (Sin servidor: doble clic en `Actualizar_Personajes.bat`.)
3. Para publicar, sube tambien los archivos generados: `js/animations.js`, `js/personajes.js`, `js/habilidades.js`.

El juego lee esos tres archivos generados (no los edites a mano; los regenera `tools/actualizar_personajes.py`).

## Que va en cada sitio

| Quiero cambiar... | Archivo |
|---|---|
| vida, velocidad, dano, recarga, alcance, texto | `personaje.js` (`hp`, `spd`, `skills[].cd`, `o.dmg`, `r`...) |
| como funciona una habilidad | `Skills/Code/<Habilidad>/<movimiento>.js` |
| una animacion | `.json` dentro de `Animation/` (el nombre del archivo es el nombre de la animacion) |
| los golpes del clic izquierdo | `Ataques basicos/Code/ataques-basicos.js` |
| una voz o sonido | el `.mp3` en la carpeta `Sound` que corresponda |

Si una habilidad usa un movimiento compartido (por ejemplo `rush`, `shoot`, `dashCombo`), su carpeta `Code`
tiene un aviso `usa-movimiento-compartido.txt`; ese movimiento esta en `js/game.js` dentro de `MOVES`.
Para darle logica propia crea un `.js` ahi con `CF.mover('nombre', function (f, o) { ... });` y pon ese
nombre en el campo `k` de la habilidad en `personaje.js`.

## Codigo de habilidades

Los archivos de `Code` se escriben como si estuvieran dentro de `js/game.js`: puedes usar `startAction`, `applyHit`,
`hitArea`, `spawnProj`, `fwd`, `V3`, `sfx`... directamente. Si algun dia necesitas una funcion nueva que creaste en
`game.js`, anade su nombre a la lista del bloque `CF_API` (al final de `game.js`).

## Animaciones

Cada animacion es un `.json` (mismo formato que antes). Si una herramienta antigua (`gen_*_movement.py`, `import_bbs_*.py`)
escribe en `js/animations.js`, corre `python tools/actualizar_personajes.py --importar` para pasar los cambios a las carpetas.

## Sonidos

El juego busca las voces en estas carpetas (lo decide el nombre del archivo):
`activar_ulti*`, `ulti_lista*`, `habilidad_ulti*` -> `Skills/Ulti/Sound/` · `golpe*` -> `Ataques basicos/Sound/` · el resto -> `Sound/`.
La musica de la ulti es `Skills/Ulti/Sound/ulti.mp3`. Las voces de Clippy estan en `jesuluto/Sound/clippy/`.

### Sonidos de cada habilidad

Deja los audios en `Skills/Sound/<Habilidad>/` (mp3, ogg o wav) y el juego los reproduce al usar esa habilidad:

| Nombre del archivo | Cuando suena |
|---|---|
| `lanzar*.mp3` (`lanzar_1.mp3`, `lanzar_2.mp3`...) | efecto al usar la habilidad (si hay varios, elige uno al azar) |
| `voz*.mp3` (`voz_1.mp3`...) | frase del personaje al usarla |

Para la ulti se usa la misma regla en `Skills/Ulti/Sound/`. Las carpetas de habilidades de despierto se llaman como
la habilidad (si el nombre se repite con una normal, termina en ` (despierto)`).
Despues abre el juego con `Iniciar_Editor.bat` (o corre `Actualizar_Personajes.bat`) para que se vea el archivo nuevo.

## Coreografias (cinematicas)

Las habilidades con escena (agarres, cinematicas) tienen su coreografia en
`Skills/Animation/<Habilidad>/<id>.coreografia.js`: la linea de tiempo del atacante (`att`), la victima (`vic`), los
eventos (`ev`: golpes, efectos, sonidos) y la camara (`shots`). Las que no pertenecen a ninguna habilidad estan en
`Skills/Animation/_sin_habilidad/`.

## Anadir un personaje nuevo

1. Copia una carpeta (por ejemplo `personajes/mattux`) y cambiale el nombre.
2. En `personaje.js` cambia el id en `CF_PERSONAJES['...']` y los datos.
3. Anade el id a `CF_ORDEN` en `personajes/_lista.js`.
4. Si tiene animaciones propias, anade su nombre global en `GLOBAL_OF` de `tools/actualizar_personajes.py`.

## Personajes sin usar

`_sin_usar/` guarda Kaiza, Nyx, Volt, Brasa, Yuki y Titan (ver su LEEME).
