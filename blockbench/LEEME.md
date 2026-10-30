# Modelos y animaciones para Blockbench

Cada carpeta es un peleador. Adentro hay:

- `<Nombre>.bbmodel`: el proyecto de Blockbench con el modelo, la skin y todas sus animaciones del juego.
- `skin.png`: la skin sola.

`animaciones.json` tiene la lista de animaciones de cada peleador con su duración.

## Cómo abrirlo
1. Abrí [Blockbench](https://www.blockbench.net/) (programa o versión web).
2. **Archivo → Abrir modelo** y elegí el `.bbmodel`.
3. Arriba a la derecha pasá a la pestaña **Animate** para ver y editar las animaciones.

## Huesos (grupos)
| Hueso | Qué mueve |
|---|---|
| `body_root` | Todo el cuerpo: inclinación, giro, saltos y desplazamiento de los ataques |
| `torso` | Torso (gira la cintura) |
| `head` | Cabeza |
| `rightArm` / `leftArm` | Brazos (pivote en el hombro) |
| `rightLeg` / `leftLeg` | Piernas (pivote en la cadera) |
| `weapon` | Lanza o cetro, dentro de la mano derecha (solo Javicubito y elGatopro300) |

El personaje mira hacia **+Z (sur)**.

## Animaciones
- Locomoción: `idle`, `idle_sin_arma`, `correr`, `salto`, `caida`, `aterrizaje`, `esquive`, `bloqueo`, `golpeado_a`, `golpeado_b`, `en_el_piso`, `levantarse`, `mareado`.
- Combo: `combo_1` a `combo_4`, `combo_4_arriba` (remate con Espacio).
- Poderes: `habilidad_1_…` a `habilidad_4_…` y `ulti_…`.
- Extras: `lucimiento` (pose cuando está quieto), `entrada_menu`, `cinematica_ulti`.

Las animaciones están grabadas del juego a 20 cuadros por segundo, con los cuadros repetidos eliminados, e interpolación **Catmull-Rom** (curvas suaves, como el juego).

## Volver a exportar
Con el juego en la carpeta `blockstrike`:
1. `python tools/save-server.py`
2. Abrí `http://127.0.0.1:8767/index.html`, abrí la consola del navegador (F12) y pegá:
   `eval(await (await fetch('/tools/export-blockbench.js')).text())`
