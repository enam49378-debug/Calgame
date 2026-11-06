# -*- coding: utf-8 -*-
"""
Generador de variantes de Idle con Voz (`Idle voz N` / `idle_voz_N`) en estilo
Actions & Stuff (cartoon/anime) para:
  - Javicubito (`javi/reposo_1..3` -> `Idle voz 1..3`)
  - ElRandi    (`randi/reposo_1..6` -> `Idle voz 1..6`)

Sincronizado frame a frame (@ 24fps en Blockbench, @ 60fps en index.html) con
los picos reales de audio de `personajes/javi/Sound/reposo_*.mp3` y `personajes/randi/Sound/reposo_*.mp3`.
"""

import json
import math
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw

TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import gen_javicubito_movement as javi_mod
import gen_elrandi_movement as randi_mod

REPO = TOOLS_DIR.parent
SCRATCH = Path(r"C:\Users\jesul\.gemini\antigravity\brain\c20a7088-7590-4809-ab1d-f3e04deaa0b7\scratch")
F = javi_mod.F


# =============================================================================
# 1. JAVICUBITO — 3 VARIANTES DE IDLE CON VOZ (`javi/reposo_1..3`)
# =============================================================================

def javi_idle0():
    return {
        "low_anchor": {"scale": (0.984, 1.024, 0.984)},
        "low_body":   {"rotation": (2.5, -16.5, 1.8), "position": (0.20, 0.30, 0.05)},
        "body":       {"rotation": (-2.0, 4.0, 1.0),  "position": (0.0, 0.38, 0.0)},
        "head":       {"rotation": (-1.0, 14.0, -1.2)},
        "right_arm":  {"rotation": (-38.0, -18.0, 14.0), "position": (-0.15, 0.42, -0.55)},
        "left_arm":   {"rotation": (18.0, 14.0, -18.0),  "position": (0.0, 0.36, 0.25)},
    }


def author_javi_voice_idles(bone_uuids):
    """
    Devuelve `(anims, eyes_map, sample_times_map)` para Javicubito:
      - `Idle voz 1`: "Ehhh... nos podemos mover cuando quieras..." (dur audio 2.95s -> clip 3.25s = 78f)
      - `Idle voz 2`: "Cuando des la orden." (dur audio 1.80s -> clip 2.0833s = 50f)
      - `Idle voz 3`: "Hm-hm-hm-hm-hmmmm~" (dur audio 2.23s -> clip 2.50s = 60f)
    """
    i0 = javi_idle0()
    make_leg = javi_mod.make_leg_track
    make_anim = javi_mod.make_bb_anim
    anims = []
    eyes_map = {}
    key_times = {}

    # -------------------------------------------------------------------------
    # JAVI IDLE VOZ 1 (78f = 3.25s) — "Ehhh... nos podemos mover cuando quieras..."
    # Picos de voz:
    #   f14..f21 (p=f18, 0.75s): "Ehhhh..." -> suspiro impaciente, hombros caen, mirada arriba
    #   f25..f39 (p=f26, f34, f37): "nos podemos mover" -> encogimiento abierto de ambos brazos
    #   f42..f53 (p=f46 "CUAN-do", f52 "QUIE-ras"): gesto casual señalando adelante + ceja alzada
    #   f56..f78: recupera su guardia firme de lancero (`idle0`)
    # -------------------------------------------------------------------------
    L_JV1 = F(78)
    jv1_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *i0["low_anchor"]["scale"]),
                (F(11), 0.975, 1.035, 0.975),   # Toma aire antes del suspiro
                (F(19), 1.042, 0.942, 1.042),   # "Ehhhh..." se desinfla aburrido!
                (F(26), 1.015, 0.980, 1.015),
                (F(34), 0.978, 1.032, 0.978),   # Rebote de encogimiento de hombros ("podemos")
                (F(40), 1.020, 0.972, 1.020),
                (F(46), 0.982, 1.026, 0.982),   # Énfasis en "CUAN-do"
                (F(54), 1.018, 0.978, 1.018),   # Asentamiento relajado en "quieras..."
                (F(68), 0.992, 1.012, 0.992),
                (F(78), *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *i0["low_body"]["rotation"]),
                (F(11),  0.5, -14.0,  1.0),
                (F(19),  7.5,  -8.0, -4.5),     # Deja caer la cadera de lado suspirando
                (F(28),  4.0,  -4.0, -2.5),
                (F(35),  1.5,   2.0,  3.5),     # Abre el torso al encogerse de hombros
                (F(46),  4.5, -12.0,  4.8),     # Se inclina casual en "cuando..."
                (F(54),  6.0, -14.5,  3.2),     # "...quieras"
                (F(68),  3.2, -16.0,  2.0),
                (F(78), *i0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["low_body"]["position"]),
                (F(11),  0.15,  0.55,  0.00),
                (F(19), -0.45, -1.35,  0.30),
                (F(35),  0.25, -0.35, -0.15),
                (F(46),  0.55, -0.75, -0.30),
                (F(55),  0.40, -0.95, -0.15),
                (F(78), *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *i0["body"]["rotation"]),
                (F(18),  4.5,  2.0, -3.5),
                (F(34), -3.5, -4.0,  2.5),
                (F(46), -1.5,  6.5,  1.5),
                (F(55),  1.0,  5.5, -1.0),
                (F(78), *i0["body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["body"]["position"]),
                (F(18), 0.0, -0.45, 0.0),
                (F(34), 0.0,  0.55, 0.0),       # Hombros suben en el shrug!
                (F(42), 0.0, -0.20, 0.0),
                (F(52), 0.0,  0.15, 0.0),
                (F(78), *i0["body"]["position"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *i0["head"]["rotation"]),
                (F(11),  -6.0,  10.0,  -2.0),
                (F(18), -16.0,  -6.0,   9.5),   # "Ehhhh..." mira arriba ladeando cabeza aburrido!
                (F(26),  -4.0,   2.0,   4.0),   # "nos..."
                (F(34),   3.5,   8.0,  -9.5),   # "...podemos mover" ladea al otro lado
                (F(40),   6.0,   5.0,  -4.0),
                (F(46),  -5.5,  16.0,   7.5),   # "CUAN-do..." cabeceo con actitud
                (F(53),   2.5,  18.5,  -6.0),   # "...QUIE-ras" mirada de costado canchera
                (F(66),   0.5,  15.0,  -2.0),
                (F(78), *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *i0["right_arm"]["rotation"]),
                (F(18), -14.0,  -8.0,  10.0),   # Brazo cae pesado en el suspiro
                (F(27), -42.0, -10.0,  28.0),
                (F(35), -58.0,   8.0,  46.0),   # Abre palma al costado en "¿nos podemos mover?"
                (F(41), -44.0,  -4.0,  30.0),
                (F(46), -76.0,  -8.0,  24.0),   # Señala/gesticula hacia adelante en "CUAN-do"
                (F(53), -62.0,   4.0,  34.0),   # "...QUIE-ras" abre mano relajado
                (F(66), -42.0, -15.0,  17.0),
                (F(78), *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["right_arm"]["position"]),
                (F(18), -0.10, -0.45, -0.15),
                (F(35), -0.35,  0.75, -0.55),
                (F(46), -0.25,  0.55, -0.85),
                (F(54), -0.30,  0.30, -0.65),
                (F(78), *i0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  *i0["left_arm"]["rotation"]),
                (F(18),   8.0,   8.0, -10.0),   # Cae relajado en el suspiro
                (F(27), -28.0,  16.0, -28.0),
                (F(35), -44.0,  18.0, -46.0),   # Ambos brazos abiertos al frente-costado en shrug cartoon!
                (F(42), -24.0,  12.0, -28.0),
                (F(48),  10.0,  16.0, -24.0),   # Apoya/relaja al costado mientras remata con la derecha
                (F(56),  14.0,  15.0, -21.0),
                (F(78), *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["left_arm"]["position"]),
                (F(18), 0.00, -0.45,  0.10),
                (F(35), 0.45,  0.65, -0.85),
                (F(48), 0.10,  0.10,  0.20),
                (F(78), *i0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg([
            (0,  -12.5, 14.0,  6.5, -0.55, -1.40, 0.0),
            (19,  -8.0, 14.0,  3.5, -0.85, -1.25, 0.0),
            (35, -14.0, 14.0,  7.5, -0.45, -1.40, 0.0),
            (48, -16.5, 14.0,  9.5, -0.30, -1.40, 0.0),
            (78, -12.5, 14.0,  6.5, -0.55, -1.40, 0.0),
        ]),
        "left_leg": make_leg([
            (0,   11.5, -18.0, -9.0, 0.48,  1.30, 0.0),
            (19,  15.5, -18.0,-12.0, 0.15,  1.35, 0.0),
            (35,  12.5, -18.0, -8.0, 0.55,  1.30, 0.0),
            (48,  15.0, -18.0, -6.0, 0.72,  1.30, 0.0),
            (78,  11.5, -18.0, -9.0, 0.48,  1.30, 0.0),
        ]),
    }
    anims.append(make_anim("Idle voz 1", L_JV1, False, bone_uuids, jv1_tracks))
    eyes_map["idle_voz_1"] = {
        "eyelid_lt": [[0.0, 0, 0, 1], [0.55, 0, -0.65, 1.1], [0.92, 0, -0.65, 1.1], [1.20, 0, 0, 1], [1.92, 0, -0.25, 1.0], [2.35, 0, -0.25, 1.0], [2.85, 0, 0, 1], [3.25, 0, 0, 1]],
        "eyelid_rt": [[0.0, 0, 0, 1], [0.55, 0, -0.65, 1.1], [0.92, 0, -0.65, 1.1], [1.20, 0, 0, 1], [1.92, 0, 0, 1], [3.25, 0, 0, 1]],
        "eyebrow_l": [[0.0, 0, 0, 1], [0.58, 0, -0.75, 1], [0.95, 0, -0.75, 1], [1.42, 0, 0.55, 1], [1.75, 0, 0, 1], [2.15, 0, -0.45, 1], [2.75, 0, 0, 1], [3.25, 0, 0, 1]],
        "eyebrow_r": [[0.0, 0, 0, 1], [0.58, 0, -0.75, 1], [0.95, 0, -0.75, 1], [1.42, 0, 0.55, 1], [1.92, 0, 0.75, 1], [2.35, 0, 0.75, 1], [2.80, 0, 0, 1], [3.25, 0, 0, 1]],
        "pupil_l":   [[0.0, 0, 0, 1], [0.62, 0.35, 0.55, 1], [0.95, 0.35, 0.55, 1], [1.35, 0, 0, 1], [1.95, -0.55, 0, 1], [2.35, -0.55, 0, 1], [2.80, 0, 0, 1], [3.25, 0, 0, 1]],
        "pupil_r":   [[0.0, 0, 0, 1], [0.62, 0.35, 0.55, 1], [0.95, 0.35, 0.55, 1], [1.35, 0, 0, 1], [1.95, -0.55, 0, 1], [2.35, -0.55, 0, 1], [2.80, 0, 0, 1], [3.25, 0, 0, 1]],
    }
    key_times["Idle voz 1"] = [0.0, F(18), F(35), F(46), F(53), L_JV1]

    # -------------------------------------------------------------------------
    # JAVI IDLE VOZ 2 (50f = 2.0833s) — "Cuando des la orden."
    # Picos de voz:
    #   f8..f13 (p=f10, 0.42s): "CUAN-do" -> lleva puño derecho al pecho en saludo de lancero!
    #   f17..f20 (0.71s..0.83s): "des la" -> postura firme y erguida
    #   f24..f33 (p=f26, 1.08s "OR-", f31 "-den"): inclinación respetuosa de cabeza + corte firme de brazo a guardia
    #   f35..f50: se asienta impecable en `idle0`
    # -------------------------------------------------------------------------
    L_JV2 = F(50)
    jv2_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *i0["low_anchor"]["scale"]),
                (F(5),  1.028, 0.962, 1.028),   # Anticipación firme
                (F(10), 0.968, 1.048, 0.968),   # Pecho erguido orgulloso en "CUAN-do!"
                (F(20), 0.980, 1.028, 0.980),
                (F(26), 1.032, 0.958, 1.032),   # Asentimiento marcial en "OR-den!"
                (F(34), 0.976, 1.034, 0.976),   # Rebote limpio al erguirse
                (F(50), *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *i0["low_body"]["rotation"]),
                (F(5),   5.0, -18.5,  2.5),
                (F(10), -1.5,  -8.0,  0.5),     # Cuadra el pecho al frente con honor!
                (F(20), -0.5,  -9.0,  0.8),
                (F(26),  8.5, -12.0,  2.2),     # Reverencia corta y decidida en "OR-den"
                (F(34),  1.5, -17.5,  1.5),
                (F(50), *i0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["low_body"]["position"]),
                (F(5),   0.28, -0.45,  0.10),
                (F(10),  0.08,  0.75, -0.15),
                (F(26),  0.22, -0.85, -0.25),
                (F(34),  0.18,  0.45,  0.00),
                (F(50), *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *i0["body"]["rotation"]),
                (F(10), -4.5,  2.0,  0.5),
                (F(26),  5.5,  5.0,  1.5),
                (F(35), -2.8,  4.2,  1.0),
                (F(50), *i0["body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["body"]["position"]),
                (F(10), 0.0,  0.60, 0.0),
                (F(26), 0.0, -0.25, 0.0),
                (F(35), 0.0,  0.45, 0.0),
                (F(50), *i0["body"]["position"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *i0["head"]["rotation"]),
                (F(5),    3.0, 15.0, -1.5),
                (F(10),  -7.5,  6.5,  0.0),     # Mentón alto con determinación en "CUAN-do"
                (F(18),  -3.5,  7.5, -0.5),     # "...des la..."
                (F(26),  16.5, 10.0, -1.5),     # "...OR-" asentimiento marcial profundo!
                (F(33),  -3.5, 14.5, -1.0),     # "-den." levanta la mirada fija al frente!
                (F(42),  -0.5, 14.0, -1.2),
                (F(50), *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *i0["right_arm"]["rotation"]),
                (F(5),  -24.0, -10.0,  22.0),   # Abre ligeramente para tomar impulso
                (F(10), -78.0, -42.0, -14.0),   # Puño derecho cruzado sobre el corazón! (saludo lancero)
                (F(21), -74.0, -40.0, -12.0),   # Mantiene el saludo durante "des la..."
                (F(27), -50.0,  -8.0,  30.0),   # Corta el aire hacia afuera en "OR-den!"
                (F(34), -34.0, -20.0,  12.0),   # Overshoot elástico clavando la guardia
                (F(50), *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["right_arm"]["position"]),
                (F(10),  0.85,  0.55, -1.15),
                (F(21),  0.80,  0.50, -1.10),
                (F(27), -0.35,  0.25, -0.65),
                (F(50), *i0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  *i0["left_arm"]["rotation"]),
                (F(10),  26.0, 22.0, -12.0),    # Mano izquierda firme atrás estilo guardia real
                (F(26),  32.0, 24.0, -16.0),
                (F(35),  16.0, 13.0, -19.0),
                (F(50), *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["left_arm"]["position"]),
                (F(10), -0.15, 0.45, 0.45),
                (F(26), -0.15, 0.20, 0.55),
                (F(50), *i0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg([
            (0,  -12.5, 14.0, 6.5, -0.55, -1.40, 0.0),
            (10, -10.0, 12.0, 5.0, -0.45, -1.25, 0.0),
            (26, -15.5, 14.0, 8.0, -0.40, -1.40, 0.0),
            (50, -12.5, 14.0, 6.5, -0.55, -1.40, 0.0),
        ]),
        "left_leg": make_leg([
            (0,   11.5, -18.0, -9.0, 0.48, 1.30, 0.0),
            (10,   9.5, -15.0, -7.5, 0.40, 1.15, 0.0),
            (26,  14.0, -18.0, -7.5, 0.58, 1.30, 0.0),
            (50,  11.5, -18.0, -9.0, 0.48, 1.30, 0.0),
        ]),
    }
    anims.append(make_anim("Idle voz 2", L_JV2, False, bone_uuids, jv2_tracks))
    eyes_map["idle_voz_2"] = {
        "eyelid_lt": [[0.0, 0, 0, 1], [0.95, 0, 0, 1], [1.08, 0, -0.85, 1.15], [1.28, 0, 0, 1], [2.08, 0, 0, 1]],
        "eyelid_rt": [[0.0, 0, 0, 1], [0.95, 0, 0, 1], [1.08, 0, -0.85, 1.15], [1.28, 0, 0, 1], [2.08, 0, 0, 1]],
        "eyebrow_l": [[0.0, 0, 0, 1], [0.38, 0, -0.55, 1], [1.12, 0, -0.75, 1], [1.45, 0, -0.35, 1], [1.90, 0, 0, 1], [2.08, 0, 0, 1]],
        "eyebrow_r": [[0.0, 0, 0, 1], [0.38, 0, -0.55, 1], [1.12, 0, -0.75, 1], [1.45, 0, -0.35, 1], [1.90, 0, 0, 1], [2.08, 0, 0, 1]],
    }
    key_times["Idle voz 2"] = [0.0, F(5), F(10), F(26), F(34), L_JV2]

    # -------------------------------------------------------------------------
    # JAVI IDLE VOZ 3 (60f = 2.50s) — "Hm-hm-hm-hm-hmmmm~"
    # Tarareo rítmico relajado! Picos exactos de las 5 notas:
    #   Nota 1: f9  (0.38s) -> rebote/ladeo a la izq
    #   Nota 2: f17 (0.71s) -> rebote/ladeo a la der
    #   Nota 3: f21 (0.88s) -> rebote alegre a la izq + golpecito de pie
    #   Nota 4: f29 (1.21s) -> rebote suave a la der
    #   Nota 5: f36..f41 (1.50s..1.71s) -> "hmmmm~" balanceo largo contento con ojos cerrados felices!
    # -------------------------------------------------------------------------
    L_JV3 = F(60)
    jv3_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *i0["low_anchor"]["scale"]),
                (F(6),  1.028, 0.960, 1.028),
                (F(9),  0.976, 1.036, 0.976),   # Nota 1 "Hm!"
                (F(14), 1.026, 0.964, 1.026),
                (F(17), 0.978, 1.034, 0.978),   # Nota 2 "hm!"
                (F(19), 1.024, 0.968, 1.024),
                (F(22), 0.972, 1.042, 0.972),   # Nota 3 "hm!"
                (F(26), 1.025, 0.965, 1.025),
                (F(29), 0.980, 1.030, 0.980),   # Nota 4 "hm"
                (F(34), 1.028, 0.962, 1.028),
                (F(39), 0.975, 1.038, 0.975),   # Nota 5 "hmmmm~"
                (F(48), 1.010, 0.988, 1.010),
                (F(60), *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *i0["low_body"]["rotation"]),
                (F(9),   3.5, -10.0,  6.5),     # Groove a la izquierda
                (F(17),  4.0, -18.0, -4.5),     # Groove a la derecha
                (F(22),  3.0,  -9.0,  7.5),     # Groove amplio a la izquierda
                (F(29),  4.5, -17.0, -3.5),     # Groove a la derecha
                (F(38),  2.0, -11.0,  5.5),     # "hmmmm~" balanceo contento
                (F(47),  4.0, -15.5,  2.5),
                (F(60), *i0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["low_body"]["position"]),
                (F(9),   0.65, -0.35,  0.05),
                (F(17), -0.35, -0.45,  0.10),
                (F(22),  0.75, -0.25,  0.00),
                (F(29), -0.25, -0.45,  0.10),
                (F(38),  0.55, -0.20,  0.00),
                (F(48),  0.28, -0.10,  0.05),
                (F(60), *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *i0["body"]["rotation"]),
                (F(10), -1.0,  2.0,  3.5),
                (F(18),  0.5,  6.0, -3.5),
                (F(23), -1.5,  1.5,  4.0),
                (F(30),  0.5,  6.5, -3.0),
                (F(39), -2.5,  2.5,  3.5),
                (F(60), *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *i0["head"]["rotation"]),
                (F(9),   -5.5,   8.0,  11.5),   # Cabeceo musical Nota 1!
                (F(17),   3.5,  16.0, -10.5),   # Cabeceo musical Nota 2!
                (F(22),  -6.5,   7.0,  13.0),   # Cabeceo musical Nota 3!
                (F(29),   4.0,  15.5,  -9.0),   # Cabeceo musical Nota 4!
                (F(38),  -7.5,   9.0,  11.0),   # "hmmmm~" disfruta la melodía
                (F(46),   2.0,  13.5,  -3.5),
                (F(60), *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *i0["right_arm"]["rotation"]),
                (F(9),  -26.0, -12.0, 22.0),    # Brazos sueltos llevando el compás!
                (F(17), -16.0, -18.0, 12.0),
                (F(22), -30.0, -10.0, 25.0),
                (F(29), -18.0, -18.0, 13.0),
                (F(39), -28.0, -12.0, 24.0),
                (F(49), -34.0, -16.0, 16.0),
                (F(60), *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["right_arm"]["position"]),
                (F(9),  -0.25,  0.55, -0.35),
                (F(17), -0.10, -0.20, -0.30),
                (F(22), -0.25,  0.60, -0.40),
                (F(29), -0.10, -0.20, -0.30),
                (F(39), -0.25,  0.55, -0.35),
                (F(60), *i0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  *i0["left_arm"]["rotation"]),
                (F(9),    8.0, 12.0, -14.0),
                (F(17),  22.0, 16.0, -26.0),
                (F(22),   6.0, 10.0, -13.0),
                (F(29),  22.0, 16.0, -25.0),
                (F(39),   8.0, 12.0, -15.0),
                (F(60), *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["left_arm"]["position"]),
                (F(9),  0.00, -0.15, 0.20),
                (F(17), 0.15,  0.55, 0.30),
                (F(22), 0.00, -0.15, 0.20),
                (F(29), 0.15,  0.50, 0.30),
                (F(39), 0.05,  0.25, 0.25),
                (F(60), *i0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg([
            # Lleva el ritmo con golpecitos de punta del pie derecho!
            (0,  -12.5, 14.0, 6.5, -0.55, -1.40, 0.00),
            (9,  -18.0, 14.0, 8.0, -0.45, -1.55, 0.35),
            (14, -12.0, 14.0, 6.0, -0.55, -1.40, 0.00),
            (22, -20.0, 14.0, 8.5, -0.42, -1.60, 0.45),
            (27, -12.0, 14.0, 6.0, -0.55, -1.40, 0.00),
            (38, -17.0, 14.0, 8.0, -0.45, -1.50, 0.30),
            (45, -12.5, 14.0, 6.5, -0.55, -1.40, 0.00),
            (60, -12.5, 14.0, 6.5, -0.55, -1.40, 0.00),
        ]),
        "left_leg": make_leg([
            (0,   11.5, -18.0, -9.0, 0.48, 1.30, 0.0),
            (9,   13.5, -18.0, -7.0, 0.65, 1.30, 0.0),
            (17,  10.5, -18.0,-10.5, 0.30, 1.30, 0.0),
            (22,  14.0, -18.0, -6.5, 0.70, 1.30, 0.0),
            (29,  10.5, -18.0,-10.0, 0.35, 1.30, 0.0),
            (38,  13.5, -18.0, -7.0, 0.65, 1.30, 0.0),
            (60,  11.5, -18.0, -9.0, 0.48, 1.30, 0.0),
        ]),
    }
    anims.append(make_anim("Idle voz 3", L_JV3, False, bone_uuids, jv3_tracks))
    eyes_map["idle_voz_3"] = {
        "eyelid_lt": [[0.0, 0, 0, 1], [0.30, 0, -0.75, 1.1], [1.75, 0, -0.75, 1.1], [2.10, 0, 0, 1], [2.50, 0, 0, 1]],
        "eyelid_rt": [[0.0, 0, 0, 1], [0.30, 0, -0.75, 1.1], [1.75, 0, -0.75, 1.1], [2.10, 0, 0, 1], [2.50, 0, 0, 1]],
        "eyelid_lb": [[0.0, 0, 0, 1], [0.30, 0,  0.45, 1.05], [1.75, 0,  0.45, 1.05], [2.10, 0, 0, 1], [2.50, 0, 0, 1]],
        "eyelid_rb": [[0.0, 0, 0, 1], [0.30, 0,  0.45, 1.05], [1.75, 0,  0.45, 1.05], [2.10, 0, 0, 1], [2.50, 0, 0, 1]],
        "eyebrow_l": [[0.0, 0, 0, 1], [0.35, 0,  0.45, 1], [1.75, 0,  0.45, 1], [2.15, 0, 0, 1], [2.50, 0, 0, 1]],
        "eyebrow_r": [[0.0, 0, 0, 1], [0.35, 0,  0.45, 1], [1.75, 0,  0.45, 1], [2.15, 0, 0, 1], [2.50, 0, 0, 1]],
    }
    key_times["Idle voz 3"] = [0.0, F(9), F(17), F(22), F(38), L_JV3]

    return anims, eyes_map, key_times


# =============================================================================
# 2. ELRANDI — 6 VARIANTES DE IDLE CON VOZ (`randi/reposo_1..6`)
# =============================================================================

def randi_idle0():
    return {
        "low_anchor": {"scale": (0.986, 1.020, 0.986)},
        "low_body":   {"rotation": (4.5, 16.8, -2.0), "position": (-0.22, 0.25, 0.00)},
        "body":       {"rotation": (0.0, -3.2, -0.8), "position": (0.0, 0.35, 0.0)},
        "head":       {"rotation": (1.5, -14.5, 1.2)},
        "left_arm":   {"rotation": (-56.0, 25.0, -9.5), "position": (0.15, 0.42, -0.65)},
        "right_arm":  {"rotation": (-24.0, -13.0, 15.0), "position": (0.0, 0.35, 0.10)},
    }


def author_randi_voice_idles(bone_uuids):
    """
    Devuelve `(anims, sample_times_map)` para ElRandi:
      - `Idle voz 1` (98f = 4.0833s): "Uyyy, qué ganas de una Inca Kola, huevón..."
      - `Idle voz 2` (126f = 5.25s):  "El pollo tenía... el pollo estaba... ¿estaba vivo o estaba muerto?"
      - `Idle voz 3` (102f = 4.25s):  "¿Por qué Rocket camina en cuatro patas?"
      - `Idle voz 4` (84f = 3.50s):   "Ahora todos quieren llamar la atención..." (calmo/cortante)
      - `Idle voz 5` (196f = 8.1667s):"Puedes luchar con cien que la amen... pero nunca con uno que ella ame..."
      - `Idle voz 6` (72f = 3.00s):   "¡Ahora todos quieren llamar la atención!" (exasperado/expresivo)
    """
    i0 = randi_idle0()
    make_leg = randi_mod.make_leg_track
    make_anim = randi_mod.make_bb_anim
    anims = []
    key_times = {}

    # -------------------------------------------------------------------------
    # RANDI IDLE VOZ 1 (98f = 4.0833s) — "Uyyy, qué ganas de una Inca Kola, huevón..."
    #   f11..f19 (p=f14): "Uyyyy..." -> suspira mirando arriba con antojo
    #   f24..f36 (p=f30): "qué GA-nas de una..." -> mano izq soba la panza, mano der imagina botella
    #   f40..f50 (p=f44): "...IN-ca KO-la..." -> empina la botella imaginaria hacia la boca!
    #   f54..f66 (p=f55): "...hue-VÓN!" -> deja caer los brazos con antojo sufrido y vuelve a guardia
    # -------------------------------------------------------------------------
    L_RV1 = F(98)
    rv1_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *i0["low_anchor"]["scale"]),
                (F(10), 1.022, 0.972, 1.022),
                (F(15), 0.968, 1.048, 0.968),   # "Uyyyy..." inhala largo de antojo!
                (F(22), 1.028, 0.962, 1.028),
                (F(31), 0.985, 1.022, 0.985),   # "qué GA-nas..."
                (F(44), 0.972, 1.040, 0.972),   # "...Inca Kola!" empina botella imaginaria
                (F(56), 1.048, 0.935, 1.048),   # "...hue-VÓN!" se desinfla de antojo!
                (F(74), 1.012, 0.986, 1.012),
                (F(98), *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *i0["low_body"]["rotation"]),
                (F(15), -6.5,  8.0,  2.5),      # Se arquea atrás suspirando al cielo
                (F(30),  2.0,  5.0, -3.5),      # Soba la panza
                (F(44), -8.5,  4.0,  1.5),      # Empina el trago imaginario!
                (F(56), 14.5, 12.0, -4.5),      # Caída cómica de hombros en "huevón!"
                (F(76),  8.0, 15.5, -2.8),
                (F(98), *i0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["low_body"]["position"]),
                (F(15),  0.10,  0.65,  0.35),
                (F(30), -0.35, -0.45,  0.10),
                (F(44),  0.05,  0.55,  0.40),
                (F(56), -0.45, -1.65, -0.25),
                (F(76), -0.30, -0.45,  0.00),
                (F(98), *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *i0["body"]["rotation"]),
                (F(15), -5.0, -1.0,  1.5),
                (F(30),  2.0, -4.0, -2.0),
                (F(44), -6.0,  2.0,  1.0),
                (F(57),  6.5, -5.0, -2.5),
                (F(98), *i0["body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["body"]["position"]),
                (F(15), 0.0,  0.55, 0.0),
                (F(44), 0.0,  0.50, 0.0),
                (F(57), 0.0, -0.50, 0.0),
                (F(98), *i0["body"]["position"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *i0["head"]["rotation"]),
                (F(15), -20.0, -4.0,  6.5),     # "Uyyyy..." mira al cielo soñando!
                (F(29),  -4.0, -8.0, -5.5),     # "qué ganas..."
                (F(44), -26.0,  4.0,  4.0),     # "...Inca Kola" cabeza atrás bebiendo!
                (F(56),  14.0,-12.0, -7.5),     # "...hue-VÓN" baja la cabeza sufriendo el antojo
                (F(73),   6.5,-14.0,  2.5),
                (F(98), *i0["head"]["rotation"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  *i0["left_arm"]["rotation"]),
                (F(15), -28.0, 14.0, -22.0),
                (F(28), -52.0, 38.0,   8.0),    # Mano izq se frota la panza con hambre/sed!
                (F(36), -46.0, 32.0,   4.0),
                (F(44), -50.0, 36.0,   6.0),
                (F(56), -14.0, 12.0, -24.0),    # Brazos caen rendidos en "huevón!"
                (F(75), -38.0, 20.0, -14.0),
                (F(98), *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["left_arm"]["position"]),
                (F(28), -0.65, -0.35, -0.95),
                (F(44), -0.55, -0.25, -0.90),
                (F(56),  0.15, -0.55, -0.15),
                (F(98), *i0["left_arm"]["position"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *i0["right_arm"]["rotation"]),
                (F(15), -46.0, -10.0,  24.0),
                (F(30), -78.0, -24.0,  10.0),   # Sostiene la Inca Kola imaginaria frente a él!
                (F(44),-118.0, -38.0,  18.0),   # La empina centrada directo hacia la boca!
                (F(49),-112.0, -35.0,  16.0),
                (F(57),  -8.0, -14.0,  26.0),   # Cae con peso cómico en "huevón!"
                (F(76), -18.0, -14.0,  18.0),
                (F(98), *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["right_arm"]["position"]),
                (F(30),  0.45,  0.45, -0.95),
                (F(44),  1.15,  0.85, -1.15),
                (F(57), -0.15, -0.55,  0.20),
                (F(98), *i0["right_arm"]["position"]),
            ],
        },
        "left_leg": make_leg([
            (0,  -11.0, -12.0, -6.0,  0.60, -1.35, 0.0),
            (15,  -8.5, -12.0, -4.5,  0.70, -1.25, 0.0),
            (44,  -8.0, -12.0, -4.5,  0.70, -1.25, 0.0),
            (56, -16.5, -12.0, -9.5,  0.35, -1.40, 0.0),
            (98, -11.0, -12.0, -6.0,  0.60, -1.35, 0.0),
        ]),
        "right_leg": make_leg([
            (0,   10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
            (15,  12.5, 16.0, 9.5, -0.40, 1.30, 0.0),
            (44,  13.0, 16.0, 9.5, -0.40, 1.30, 0.0),
            (56,  15.5, 16.0, 5.0, -0.75, 1.25, 0.0),
            (98,  10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
        ]),
    }
    anims.append(make_anim("Idle voz 1", L_RV1, False, bone_uuids, rv1_tracks))
    key_times["Idle voz 1"] = [0.0, F(15), F(30), F(44), F(56), L_RV1]

    # -------------------------------------------------------------------------
    # RANDI IDLE VOZ 2 (126f = 5.25s) — Meme del Pollo (Pedro Castillo!)
    # "El- el pollo tenía... el pollo estaba... ¿estaba vivo o- o estaba muerto?"
    #   f6..f26  (p=f18 "PO-llo"): levanta dedo/mano derecha dando discurso serio
    #   f32..f50 (p=f42 "PO-llo es-TA-ba"): se traba y se rasca la cabeza confundido con mano izq!
    #   f56..f82 (p=f60, f76 "VI-vo"): extiende mano IZQUIERDA sopesando "¿estaba vivo?"
    #   f86..f110(p=f104 "MUER-to?"): extiende mano DERECHA sopesando "¿o estaba muerto?" (ambas manos abiertas!)
    # -------------------------------------------------------------------------
    L_RV2 = F(126)
    rv2_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),   *i0["low_anchor"]["scale"]),
                (F(18),  0.974, 1.036, 0.974),  # Discurso solemne "el PO-llo!"
                (F(36),  1.022, 0.970, 1.022),  # Se traba pensando...
                (F(60),  0.980, 1.028, 0.980),  # "¿estaba..."
                (F(76),  0.975, 1.034, 0.975),  # "...VI-vo?"
                (F(92),  1.024, 0.968, 1.024),
                (F(104), 0.972, 1.040, 0.972),  # "...o estaba MUER-to?"
                (F(114), 1.015, 0.982, 1.015),
                (F(126), *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   *i0["low_body"]["rotation"]),
                (F(18),   6.5,   4.0,  -1.5),   # Se cuadra como orador
                (F(42),   4.0,  10.0,   5.5),   # Ladea dudando ("el pollo estaba...")
                (F(60),   5.5,  -6.0,   6.5),   # Se inclina a la izquierda ("¿estaba vivo?")
                (F(80),   5.0,  -8.0,   7.5),
                (F(96),   6.0,  14.0,  -6.5),   # Bascula a la derecha ("¿o estaba muerto?")
                (F(108),  4.5,   6.0,  -4.0),
                (F(126), *i0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),   *i0["low_body"]["position"]),
                (F(18),  -0.05,  0.20, -0.35),
                (F(42),   0.35, -0.55,  0.10),
                (F(76),   0.65, -0.35, -0.20),
                (F(104), -0.55, -0.35, -0.20),
                (F(126), *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),   *i0["body"]["rotation"]),
                (F(18),  -2.0,  2.0,  0.0),
                (F(42),   1.5, -4.0,  3.0),
                (F(76),  -1.0, -8.0,  3.5),
                (F(104), -1.0,  8.0, -3.5),
                (F(126), *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),   *i0["head"]["rotation"]),
                (F(8),    -4.0,  -4.0,  -2.0),
                (F(18),    6.5,  -2.0,   3.0),  # Cabeceo enfático en "el PO-llo tenía..."
                (F(35),   -3.0,   6.0, -12.5),  # Ladea cabeza confundido al trabarse!
                (F(46),    4.0,   8.0, -10.0),
                (F(60),   -5.0, -14.0,   8.5),  # Mira su mano izquierda ("¿estaba VI-vo?")
                (F(78),    2.0, -16.0,  10.0),
                (F(94),   -5.0,  14.0,  -9.5),  # Mira su mano derecha ("¿o estaba MUER-to?")
                (F(106),  -8.0,   2.0, -12.0),  # Queda mirando al frente desconcertado!
                (F(126), *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),   *i0["right_arm"]["rotation"]),
                (F(8),   -68.0, -14.0,  12.0),
                (F(18),  -94.0, -18.0,   8.0),  # Mano derecha alzada exponiendo "el pollo!"
                (F(28),  -76.0, -14.0,  12.0),
                (F(42),  -28.0, -12.0,  18.0),  # Baja mientras se rasca con la izquierda
                (F(76),  -24.0, -10.0,  18.0),
                (F(92),  -64.0,   8.0,  38.0),  # Abre palma derecha sopesando "¿o estaba..."
                (F(104), -74.0,  12.0,  46.0),  # "...MUER-to?!"
                (F(112), -68.0,  10.0,  42.0),
                (F(126), *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),   *i0["right_arm"]["position"]),
                (F(18),   0.15,  0.75, -0.85),
                (F(42),   0.00,  0.10, -0.10),
                (F(104), -0.45,  0.65, -0.75),
                (F(126), *i0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),   *i0["left_arm"]["rotation"]),
                (F(18),  -34.0,  18.0, -14.0),
                (F(35), -132.0,  14.0, -14.0),  # Mano izq sube a rascarse la sien confundido!
                (F(44), -122.0,  12.0, -10.0),  # Rasca-rasca en "el pollo estaba..."
                (F(50), -130.0,  14.0, -14.0),
                (F(62),  -56.0,  14.0, -34.0),  # Extiende palma izquierda al frente: "¿estaba..."
                (F(76),  -64.0,  16.0, -42.0),  # "...VI-vo?"
                (F(104), -58.0,  14.0, -38.0),  # Mantiene ambas manos abiertas en balanza filosófica!
                (F(112), -54.0,  14.0, -34.0),
                (F(126), *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),   *i0["left_arm"]["position"]),
                (F(35),  -0.15,  0.95, -0.55),
                (F(50),  -0.15,  0.90, -0.55),
                (F(76),   0.45,  0.55, -1.05),
                (F(104),  0.45,  0.50, -0.95),
                (F(126), *i0["left_arm"]["position"]),
            ],
        },
        "left_leg": make_leg([
            (0,   -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
            (42,   -9.0, -12.0, -4.0, 0.75, -1.25, 0.0),
            (76,  -14.0, -12.0, -8.5, 0.85, -1.40, 0.0),
            (104,  -8.5, -12.0, -4.5, 0.40, -1.25, 0.0),
            (126, -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
        ]),
        "right_leg": make_leg([
            (0,    10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
            (42,   12.0, 16.0, 9.5, -0.35, 1.30, 0.0),
            (76,    8.5, 16.0, 6.0, -0.25, 1.20, 0.0),
            (104,  13.5, 16.0,10.0, -0.70, 1.35, 0.0),
            (126,  10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
        ]),
    }
    anims.append(make_anim("Idle voz 2", L_RV2, False, bone_uuids, rv2_tracks))
    key_times["Idle voz 2"] = [0.0, F(18), F(38), F(76), F(104), L_RV2]

    # -------------------------------------------------------------------------
    # RANDI IDLE VOZ 3 (102f = 4.25s) — "¿Por qué Rocket camina en cuatro patas?"
    #   f16..f28 (p=f16 "¿Por qué", f24 "ROC-ket"): se asoma curioso hacia adelante, mano der al mentón
    #   f32..f54 (p=f32 "ca-MI-na", f43 "CUA-tro", f50 "PA-tas?"): mano izq señala abajo imitando patitas!
    #   f56..f76: sostiene pose pensativa ladeando la cabeza muy extrañado -> vuelve a `idle0`
    # -------------------------------------------------------------------------
    L_RV3 = F(102)
    rv3_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),   *i0["low_anchor"]["scale"]),
                (F(12),  1.030, 0.960, 1.030),
                (F(17),  0.975, 1.035, 0.975),  # "¿Por QUÉ..." se asoma curioso!
                (F(32),  1.015, 0.980, 1.015),  # "...ca-MI-na..."
                (F(43),  0.982, 1.026, 0.982),  # "...en CUA-tro..."
                (F(51),  1.022, 0.970, 1.022),  # "...PA-tas?"
                (F(72),  1.008, 0.990, 1.008),
                (F(102), *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   *i0["low_body"]["rotation"]),
                (F(17),  16.5,   8.0,  -2.5),   # Torso inclinado adelante escudriñando a Rocket!
                (F(33),  18.0,   4.0,   1.5),
                (F(51),  14.0,   6.0,   4.5),
                (F(70),  11.0,  10.0,   3.5),
                (F(102), *i0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),   *i0["low_body"]["position"]),
                (F(17),  -0.10, -0.95, -1.15),
                (F(51),   0.15, -0.85, -0.95),
                (F(72),   0.05, -0.55, -0.55),
                (F(102), *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),   *i0["body"]["rotation"]),
                (F(17),   3.5,  2.0,  0.0),
                (F(51),   2.0, -3.0,  2.5),
                (F(102), *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),   *i0["head"]["rotation"]),
                (F(17),  -14.0,  -6.0,  -5.0),  # Entrecierra/asoma la mirada al frente
                (F(25),  -10.0,  -2.0,   4.5),  # "...Rocket..."
                (F(33),   -4.0,  -6.0,  -3.0),  # "...camina..."
                (F(43),    6.0,  -8.0,   9.5),  # Mira hacia el suelo en "...cuatro..."
                (F(52),   -6.0,  -4.0,  15.5),  # "...patas?" ladea fuerte la cabeza súper extrañado!
                (F(72),   -4.5,  -6.0,  13.5),  # Se queda procesando el misterio
                (F(102), *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            # Mano derecha bajo la barbilla en pose clásica de detective/pensador!
            "rotation": [
                (F(0),   *i0["right_arm"]["rotation"]),
                (F(16),  -96.0, -46.0, -14.0),
                (F(52), -100.0, -48.0, -16.0),
                (F(72),  -94.0, -44.0, -12.0),
                (F(102), *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),   *i0["right_arm"]["position"]),
                (F(16),   1.15,  0.55, -1.15),
                (F(72),   1.10,  0.50, -1.10),
                (F(102), *i0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            # Mano izquierda apunta hacia abajo haciendo el gesto de "cuatro patas"
            "rotation": [
                (F(0),   *i0["left_arm"]["rotation"]),
                (F(17),  -36.0,  18.0, -18.0),
                (F(32),  -64.0,  10.0, -24.0),  # "ca-MI-na..."
                (F(38),  -44.0,  14.0, -20.0),
                (F(43),  -72.0,   6.0, -28.0),  # "...en CUA-tro..." (primer toque abajo-adelante)
                (F(47),  -48.0,  12.0, -22.0),
                (F(51),  -76.0,   4.0, -32.0),  # "...PA-tas?" (segundo toque!)
                (F(70),  -58.0,  12.0, -26.0),
                (F(102), *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),   *i0["left_arm"]["position"]),
                (F(32),   0.25,  0.15, -0.85),
                (F(43),   0.30,  0.05, -0.95),
                (F(51),   0.35,  0.05, -1.00),
                (F(70),   0.25,  0.15, -0.80),
                (F(102), *i0["left_arm"]["position"]),
            ],
        },
        "left_leg": make_leg([
            (0,   -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
            (17,  -18.0, -12.0, -8.0, 0.50, -1.55, 0.0),
            (70,  -16.5, -12.0, -7.5, 0.52, -1.50, 0.0),
            (102, -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
        ]),
        "right_leg": make_leg([
            (0,    10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
            (17,   16.5, 16.0, 7.0, -0.55, 1.35, 0.0),
            (70,   15.0, 16.0, 7.5, -0.52, 1.30, 0.0),
            (102,  10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
        ]),
    }
    anims.append(make_anim("Idle voz 3", L_RV3, False, bone_uuids, rv3_tracks))
    key_times["Idle voz 3"] = [0.0, F(17), F(32), F(43), F(52), L_RV3]

    # -------------------------------------------------------------------------
    # RANDI IDLE VOZ 4 (84f = 3.50s) — "Ahora todos quieren llamar la atención..." (seco/cool)
    #   f18..f28 (p=f21, f27 "Ahora TO-dos"): echa el peso atrás cruzando brazo izq y mirando de lado
    #   f33..f46 (p=f33 "QUIE-ren", f43 "lla-MAR"): ademán despectivo suave con mano derecha + niega con cabeza
    #   f53..f61 (p=f55 "la a-ten-CIÓN"): suspiro seco encogiendo un hombro y regresa a guardia
    # -------------------------------------------------------------------------
    L_RV4 = F(84)
    rv4_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *i0["low_anchor"]["scale"]),
                (F(20), 1.020, 0.974, 1.020),
                (F(33), 0.982, 1.026, 0.982),
                (F(43), 0.988, 1.018, 0.988),
                (F(56), 1.028, 0.962, 1.028),   # Suspiro seco final
                (F(84), *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *i0["low_body"]["rotation"]),
                (F(21),  2.0,  24.0, -5.5),     # Recarga el peso atrás con frialdad a lo Megumi
                (F(34),  3.0,  20.0, -4.0),
                (F(55),  6.5,  22.0, -5.0),
                (F(84), *i0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["low_body"]["position"]),
                (F(21), -0.65, -0.45,  0.45),
                (F(55), -0.60, -0.85,  0.40),
                (F(84), *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *i0["body"]["rotation"]),
                (F(21), -1.5, -6.5,  1.5),
                (F(34), -1.0, -3.5,  0.5),
                (F(55),  2.0, -6.0,  1.5),
                (F(84), *i0["body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["body"]["position"]),
                (F(34), 0.0,  0.30, 0.0),
                (F(56), 0.0, -0.25, 0.0),
                (F(84), 0.0,  0.35, 0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *i0["head"]["rotation"]),
                (F(21),   3.5, -24.0,  4.5),    # Desvía la mirada sin impresionarse
                (F(33),   1.0,  -8.0, -2.5),    # Niega suave a un lado ("QUIE-ren...")
                (F(43),   2.5, -22.0,  4.0),    # ...y al otro ("...lla-MAR...")
                (F(55),   8.5, -18.0,  5.5),    # "...la atención." baja levemente el mentón
                (F(70),   3.5, -15.5,  2.0),
                (F(84), *i0["head"]["rotation"]),
            ],
        },
        "left_arm": {
            # Brazo izquierdo cruzado tranquilo frente al torso
            "rotation": [
                (F(0),  *i0["left_arm"]["rotation"]),
                (F(21), -68.0,  44.0,  12.0),
                (F(56), -66.0,  42.0,  10.0),
                (F(84), *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["left_arm"]["position"]),
                (F(21), -0.65,  0.15, -0.95),
                (F(56), -0.60,  0.10, -0.90),
                (F(84), *i0["left_arm"]["position"]),
            ],
        },
        "right_arm": {
            # Ademán desganado hacia afuera ("bah, quieren llamar la atención")
            "rotation": [
                (F(0),  *i0["right_arm"]["rotation"]),
                (F(21), -42.0, -22.0,  10.0),
                (F(34), -58.0,   8.0,  38.0),   # Gesto despectivo 1 en "QUIE-ren"
                (F(39), -46.0,  -2.0,  26.0),
                (F(43), -62.0,  12.0,  44.0),   # Gesto despectivo 2 en "lla-MAR"
                (F(56), -20.0, -10.0,  18.0),   # Deja caer la mano sin darle importancia
                (F(84), *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["right_arm"]["position"]),
                (F(34), -0.35,  0.45, -0.65),
                (F(43), -0.40,  0.50, -0.70),
                (F(56),  0.00,  0.05,  0.05),
                (F(84), *i0["right_arm"]["position"]),
            ],
        },
        "left_leg": make_leg([
            (0,  -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
            (21,  -7.5, -12.0, -9.5, 0.25, -1.20, 0.0),
            (56,  -8.5, -12.0, -9.0, 0.30, -1.25, 0.0),
            (84, -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
        ]),
        "right_leg": make_leg([
            (0,   10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
            (21,  14.5, 16.0, 4.5, -0.85, 1.35, 0.0),
            (56,  14.0, 16.0, 5.0, -0.80, 1.35, 0.0),
            (84,  10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
        ]),
    }
    anims.append(make_anim("Idle voz 4", L_RV4, False, bone_uuids, rv4_tracks))
    key_times["Idle voz 4"] = [0.0, F(21), F(34), F(43), F(56), L_RV4]

    # -------------------------------------------------------------------------
    # RANDI IDLE VOZ 5 (196f = 8.1667s) — Monólogo Dramático Anime!
    # "Puedes luchar... con cien que la amen... pero nunca... con uno que ella ame..."
    #   Acto 1 (f18..f34, p=f31 "lu-CHAR"): puño derecho frente al pecho con determinación solemne
    #   Acto 2 (f46..f74, p=f54 "con CIEN", f64 "que la A-men"): abre ambos brazos épico y lleva mano izq al corazón
    #   Acto 3 (f90..f108, p=f98 "pe-ro NUN-ca..."): niega dramático y corta el aire con mano derecha; pausa pesada f110..f132
    #   Acto 4 (f136..f170, clímax f152 "que E-LLA A-me..."): mano al pecho, inclina cabeza derrotado por el desamor -> regresa a `idle0`
    # -------------------------------------------------------------------------
    L_RV5 = F(196)
    rv5_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),   *i0["low_anchor"]["scale"]),
                (F(16),  1.018, 0.976, 1.018),
                (F(31),  0.972, 1.040, 0.972),  # "lu-CHAR!" firmeza heroica
                (F(44),  1.015, 0.980, 1.015),
                (F(54),  0.965, 1.050, 0.965),  # "con CIEN!" expansión dramática de pecho
                (F(70),  1.010, 0.988, 1.010),
                (F(98),  0.978, 1.030, 0.978),  # "pero NUN-ca..."
                (F(122), 1.032, 0.958, 1.032),  # Silencio pesado... se hunde respirando hondo
                (F(152), 1.048, 0.935, 1.048),  # Clímax trágico: "...con uno que E-LLA A-me..."
                (F(174), 1.028, 0.964, 1.028),
                (F(196), *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   *i0["low_body"]["rotation"]),
                (F(20),   3.5,  10.0,  -1.5),
                (F(31),   1.5,   6.0,  -0.5),
                (F(54),  -5.5,   0.0,   0.0),   # Pecho abierto al cielo en "con cien"
                (F(68),   2.0,   4.0,   2.0),   # "...que la amen"
                (F(98),   5.0,  14.0,  -3.5),   # "...pero nunca..."
                (F(124), 10.5,  12.0,  -2.5),   # Pausa dramática: hombros pesan
                (F(152), 20.5,   8.0,   3.5),   # Se encorva dolido en "con uno que ella ame..."
                (F(172), 17.5,  10.0,   2.5),
                (F(196), *i0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),   *i0["low_body"]["position"]),
                (F(31),  -0.10,  0.45, -0.15),
                (F(54),   0.00,  0.75,  0.15),
                (F(98),  -0.25, -0.25,  0.05),
                (F(124), -0.20, -0.95,  0.15),
                (F(152),  0.10, -2.05, -0.45),
                (F(172),  0.05, -1.65, -0.35),
                (F(196), *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),   *i0["body"]["rotation"]),
                (F(31),  -2.0, -1.0,  0.0),
                (F(54),  -5.5,  0.0,  0.0),
                (F(98),   1.5, -5.0, -1.5),
                (F(152),  7.5,  3.0,  2.0),
                (F(172),  6.0,  2.0,  1.5),
                (F(196), *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),   *i0["head"]["rotation"]),
                (F(20),  -3.0,  -6.0,   0.0),
                (F(31),   6.5,  -4.0,   1.0),   # Asiente firme en "luchar"
                (F(54), -16.0,   0.0,   0.0),   # Mira al cielo en "con CIEN..."
                (F(68),  -6.0,   4.0,  -4.5),   # "...que la amen"
                (F(92),   4.0, -14.0,   2.0),   # "pero..."
                (F(98),   6.0,  14.0,  -3.5),   # "...NUN-" (niega dramático)
                (F(105),  8.0, -10.0,   2.5),   # "-ca..."
                (F(126), 14.0,  -6.0,   2.0),   # Baja la mirada en el silencio...
                (F(142), 10.0,  -4.0,  -2.0),   # "con uno..."
                (F(154), 24.5,  -2.0,  -5.5),   # "...que E-LLA A-me..." cabeza gacha de puro dolor anime!
                (F(174), 21.0,  -4.0,  -4.0),
                (F(196), *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),   *i0["right_arm"]["rotation"]),
                (F(20),  -72.0, -24.0,   8.0),
                (F(31),  -88.0, -30.0,  -4.0),  # Puño cerrado frente a sí: "Puedes LU-CHAR!"
                (F(42),  -74.0, -22.0,   6.0),
                (F(54),  -64.0,  14.0,  54.0),  # Abre brazos de par en par: "con CIEN..."
                (F(68),  -48.0,   6.0,  36.0),
                (F(92),  -72.0, -28.0,  -8.0),  # Cruza antes de cortar
                (F(100), -58.0,  16.0,  46.0),  # Corta el aire negando: "¡pero NUN-ca!"
                (F(124), -22.0, -10.0,  18.0),  # El brazo cae sin fuerzas en la pausa...
                (F(142), -68.0, -32.0, -10.0),
                (F(154), -84.0, -44.0, -18.0),  # Se lleva la mano derecha al pecho herido: "que E-LLA ame..."
                (F(174), -80.0, -42.0, -16.0),
                (F(196), *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),   *i0["right_arm"]["position"]),
                (F(31),   0.45,  0.55, -0.95),
                (F(54),  -0.55,  0.75, -0.45),
                (F(100), -0.45,  0.45, -0.65),
                (F(124),  0.00, -0.25,  0.10),
                (F(154),  0.85,  0.35, -1.10),
                (F(174),  0.80,  0.30, -1.05),
                (F(196), *i0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),   *i0["left_arm"]["rotation"]),
                (F(31),  -38.0,  18.0, -16.0),
                (F(54),  -64.0, -14.0, -54.0),  # Abre ambos brazos en "con CIEN!"
                (F(66),  -78.0,  42.0,  16.0),  # Mano izq al corazón en "que la A-men..."
                (F(80),  -74.0,  40.0,  14.0),
                (F(100), -28.0,  14.0, -22.0),
                (F(124), -14.0,  10.0, -16.0),  # Cae abatido en la pausa
                (F(154), -18.0,   8.0, -20.0),  # Cuelga suelto mientras la derecha aprieta el pecho
                (F(174), -22.0,  12.0, -18.0),
                (F(196), *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),   *i0["left_arm"]["position"]),
                (F(54),   0.55,  0.75, -0.45),
                (F(66),  -0.80,  0.45, -1.05),
                (F(124),  0.05, -0.35, -0.10),
                (F(154),  0.10, -0.45, -0.15),
                (F(196), *i0["left_arm"]["position"]),
            ],
        },
        "left_leg": make_leg([
            (0,   -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
            (54,   -8.0, -10.0, -4.5, 0.55, -1.20, 0.0),
            (124, -13.5, -12.0, -7.5, 0.50, -1.35, 0.0),
            (154, -18.5, -12.0, -9.5, 0.40, -1.45, 0.0),
            (174, -17.0, -12.0, -9.0, 0.42, -1.42, 0.0),
            (196, -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
        ]),
        "right_leg": make_leg([
            (0,    10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
            (54,    8.0, 14.0, 7.0, -0.45, 1.15, 0.0),
            (124,  12.5, 16.0, 7.0, -0.60, 1.25, 0.0),
            (154,  17.5, 16.0, 5.5, -0.68, 1.35, 0.0),
            (174,  16.0, 16.0, 6.0, -0.65, 1.32, 0.0),
            (196,  10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
        ]),
    }
    anims.append(make_anim("Idle voz 5", L_RV5, False, bone_uuids, rv5_tracks))
    key_times["Idle voz 5"] = [F(31), F(54), F(68), F(100), F(124), F(154)]

    # -------------------------------------------------------------------------
    # RANDI IDLE VOZ 6 (72f = 3.00s) — "¡Ahora todos quieren llamar la atención!" (exasperado!)
    #   f6..f13  (p=f8 "¡A-HO-ra", f12 "TO-dos!"): squash rápido y abre AMBOS brazos indignado!
    #   f17..f28 (p=f17 "QUIE-ren", f23 "lla-MAR"): sacude las manos al ritmo de cada palabra!
    #   f31..f41 (p=f35 "la a-ten-CIÓN!"): alza las manos al cielo harto y las deja caer de golpe (f44)!
    # -------------------------------------------------------------------------
    L_RV6 = F(72)
    rv6_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *i0["low_anchor"]["scale"]),
                (F(5),  1.050, 0.930, 1.050),   # Anticipación rápida!
                (F(9),  0.962, 1.055, 0.962),   # "¡A-HO-ra TO-dos!" salta expresivo en su sitio
                (F(15), 1.022, 0.970, 1.022),
                (F(19), 0.978, 1.032, 0.978),   # "QUIE-ren"
                (F(25), 1.020, 0.972, 1.020),   # "lla-MAR"
                (F(35), 0.960, 1.058, 0.960),   # "¡la a-ten-CIÓN!" estira harto
                (F(44), 1.045, 0.938, 1.045),   # Plop cómico al soltar los brazos!
                (F(56), 0.994, 1.010, 0.994),
                (F(72), *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *i0["low_body"]["rotation"]),
                (F(5),  10.0,  14.0, -3.0),
                (F(9),  -3.5,   2.0,  2.5),     # Abre el pecho reclamando!
                (F(18),  6.5,  -4.0, -4.0),
                (F(25),  5.0,   6.0,  4.0),
                (F(35), -5.0,   0.0,  0.0),     # "¡la a-ten-CIÓN!"
                (F(44), 12.5,  12.0, -3.5),     # Se deja caer harto
                (F(72), *i0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["low_body"]["position"]),
                (F(5),  -0.25, -0.95,  0.10),
                (F(9),   0.05,  0.65, -0.35),
                (F(22),  0.00, -0.25, -0.25),
                (F(35),  0.00,  0.75, -0.15),
                (F(44), -0.30, -1.35,  0.15),
                (F(72), *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *i0["body"]["rotation"]),
                (F(9),  -4.0,  2.0,  1.5),
                (F(18),  2.0, -4.0, -2.5),
                (F(25),  1.5,  4.0,  2.5),
                (F(35), -5.0,  0.0,  0.0),
                (F(44),  5.0, -4.0, -1.5),
                (F(72), *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *i0["head"]["rotation"]),
                (F(9),   -8.0,   2.0,  -6.5),   # "¡Ahora TODOS!"
                (F(18),   4.0,  -9.0,   8.0),   # "QUIE-ren"
                (F(25),  -3.0,   8.0,  -7.5),   # "lla-MAR"
                (F(35), -16.0,   0.0,   4.0),   # "¡la a-ten-CIÓN!" mira arriba exasperado
                (F(44),  10.0, -12.0,  -4.0),   # Suspira bajando la cabeza
                (F(72), *i0["head"]["rotation"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  *i0["left_arm"]["rotation"]),
                (F(5),  -26.0,  18.0, -12.0),
                (F(9),  -62.0,  12.0, -48.0),   # Abre brazos de par en par indignado!
                (F(15), -48.0,  10.0, -32.0),
                (F(19), -68.0,  12.0, -44.0),   # Sacude en "QUIE-ren"
                (F(25), -52.0,  10.0, -34.0),
                (F(35),-128.0,  -8.0,  24.0),   # Lanza manos arriba en V abierta dejando cara libre!
                (F(44), -12.0,  10.0, -22.0),   # Caen de golpe a los costados!
                (F(56), -42.0,  22.0, -12.0),
                (F(72), *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["left_arm"]["position"]),
                (F(9),   0.45,  0.65, -0.85),
                (F(35),  0.45,  1.05, -0.35),
                (F(44),  0.10, -0.45, -0.10),
                (F(72), *i0["left_arm"]["position"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *i0["right_arm"]["rotation"]),
                (F(5),  -18.0, -10.0,  14.0),
                (F(9),  -62.0, -12.0,  48.0),   # Abre brazo derecho en espejo expresivo!
                (F(15), -48.0, -10.0,  32.0),
                (F(19), -68.0, -12.0,  44.0),
                (F(25), -52.0, -10.0,  34.0),
                (F(35),-128.0,   8.0, -24.0),   # Lanza ambas manos arriba en V abierta!
                (F(44),  -8.0, -12.0,  22.0),   # Caen de golpe!
                (F(56), -20.0, -13.0,  16.0),
                (F(72), *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *i0["right_arm"]["position"]),
                (F(9),  -0.45,  0.65, -0.85),
                (F(35), -0.45,  1.05, -0.35),
                (F(44), -0.10, -0.45,  0.10),
                (F(72), *i0["right_arm"]["position"]),
            ],
        },
        "left_leg": make_leg([
            (0,  -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
            (9,   -8.0, -10.0, -4.5, 0.55, -1.20, 0.0),
            (35,  -7.5, -10.0, -4.0, 0.55, -1.15, 0.0),
            (44, -15.0, -12.0, -8.5, 0.42, -1.40, 0.0),
            (72, -11.0, -12.0, -6.0, 0.60, -1.35, 0.0),
        ]),
        "right_leg": make_leg([
            (0,   10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
            (9,    7.5, 14.0, 7.0, -0.45, 1.15, 0.0),
            (35,   7.0, 14.0, 6.5, -0.45, 1.10, 0.0),
            (44,  14.0, 16.0, 6.0, -0.68, 1.30, 0.0),
            (72,  10.0, 16.0, 8.5, -0.50, 1.25, 0.0),
        ]),
    }
    anims.append(make_anim("Idle voz 6", L_RV6, False, bone_uuids, rv6_tracks))
    key_times["Idle voz 6"] = [0.0, F(9), F(19), F(35), F(44), L_RV6]

    return anims, key_times


# =============================================================================
# RENDERIZADOR DE MOMENTOS CLAVE (Contact Sheet en picos exactos de voz)
# =============================================================================

def render_key_moments_sheet(mod, anims, key_times, out_path, draw_spear=False):
    cols = 6
    cell_w, cell_h = 158, 182
    img = Image.new("RGB", (cols * cell_w, len(anims) * cell_h), (20, 24, 34))
    draw = ImageDraw.Draw(img)

    yaw_cam = math.radians(30)
    pitch_cam = math.radians(14)
    cy, sy = math.cos(yaw_cam), math.sin(yaw_cam)
    cp, sp = math.cos(pitch_cam), math.sin(pitch_cam)

    def proj(pt, cx, floor_y, scale=3.55):
        x, y, z = pt
        rx = x * cy - z * sy
        rz = x * sy + z * cy
        ry = y * cp - rz * sp
        rz2 = y * sp + rz * cp
        return (cx + rx * scale, floor_y - ry * scale, rz2)

    for row_idx, anim in enumerate(anims):
        times = key_times[anim["name"]]
        for col_idx, t in enumerate(times):
            cx = col_idx * cell_w + cell_w // 2
            floor_y = row_idx * cell_h + cell_h - 26

            g1 = proj((-12, 0, 0), cx, floor_y)
            g2 = proj((12, 0, 0), cx, floor_y)
            g3 = proj((0, 0, -12), cx, floor_y)
            g4 = proj((0, 0, 12), cx, floor_y)
            draw.line([(g1[0], g1[1]), (g2[0], g2[1])], fill=(58, 66, 86), width=1)
            draw.line([(g3[0], g3[1]), (g4[0], g4[1])], fill=(48, 78, 72), width=1)

            W = mod.eval_bbs_world_matrices(anim, t)
            polys = []
            min_foot_y = 999.0

            if draw_spear:
                M_torso = W["torso"]
                sp_a = mod.mat_vec(M_torso, (-5.5, -15.0, -2.9))
                sp_b = mod.mat_vec(M_torso, (6.5, 5.5, -2.9))
                pa = proj(sp_a, cx, floor_y)
                pb = proj(sp_b, cx, floor_y)
                draw.line([(pa[0], pa[1]), (pb[0], pb[1])], fill=(143, 99, 57), width=3)
                draw.ellipse([pb[0] - 3, pb[1] - 3, pb[0] + 3, pb[1] + 3], fill=(78, 230, 214), outline=(18, 24, 36))

            for bname, bmin, bmax, base_col in mod.PARTS_BOXES:
                M = W[bname]
                x0, y0, z0 = bmin
                x1, y1, z1 = bmax
                corners_local = [
                    (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
                    (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
                ]
                corners_w = [mod.mat_vec(M, c) for c in corners_local]
                if "leg" in bname:
                    min_foot_y = min(min_foot_y, min(c[1] for c in corners_w))
                corners_p = [proj(c, cx, floor_y) for c in corners_w]
                for idxs, _, shade_k in mod.FACE_QUADS:
                    pts2d = [(corners_p[k][0], corners_p[k][1]) for k in idxs]
                    ax, ay = pts2d[1][0] - pts2d[0][0], pts2d[1][1] - pts2d[0][1]
                    bx, by = pts2d[2][0] - pts2d[0][0], pts2d[2][1] - pts2d[0][1]
                    if ax * by - ay * bx >= 0:
                        continue
                    depth = sum(corners_p[k][2] for k in idxs) / 4.0
                    col = tuple(max(0, min(255, int(c * shade_k))) for c in base_col)
                    if bname == "head" and idxs == [0, 1, 2, 3]:
                        col = (115, 194, 255) if draw_spear else (250, 212, 110)
                    polys.append((depth, pts2d, col))

            polys.sort(key=lambda item: item[0])
            for _, pts2d, col in polys:
                draw.polygon(pts2d, fill=col, outline=(12, 14, 22))

            if col_idx == 0:
                draw.text((col_idx * cell_w + 6, row_idx * cell_h + 4), anim["name"], fill=(240, 245, 255))
            draw.text((col_idx * cell_w + 6, row_idx * cell_h + cell_h - 16), f"f{int(round(t*24))} ({t:.2f}s) y0={min_foot_y:+.1f}", fill=(165, 185, 215))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


# =============================================================================
# COMPILACIÓN EN `.bbmodel` + `index.html` (`JAVI_BB_DATA` & `RANDI_BB_DATA`)
# =============================================================================

def build_and_save_all(apply_html=False):
    # 1. Javicubito: 10 movimiento + 3 voz = 13 animaciones
    j_model, _ = javi_mod.build_clean_base_model()
    j_uuids = javi_mod.collect_bone_uuids(j_model["outliner"])
    j_mov_anims = javi_mod.author_all_animations(j_uuids)
    j_voz_anims, j_eyes_map, j_key_times = author_javi_voice_idles(j_uuids)
    j_model["animations"] = j_mov_anims + j_voz_anims
    javi_mod.OUT_DIR.mkdir(parents=True, exist_ok=True)
    javi_mod.OUT_BBMODEL.write_text(json.dumps(j_model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Guardado {javi_mod.OUT_BBMODEL} ({len(j_model['animations'])} animaciones: 10 mov + 3 voz)")

    j_sheet = SCRATCH / "javicubito_voice_idles_sheet.png"
    render_key_moments_sheet(javi_mod, j_voz_anims, j_key_times, j_sheet, draw_spear=True)
    print(f"Vista previa Javi voz: {j_sheet}")

    # 2. ElRandi: 10 movimiento + 6 voz = 16 animaciones
    r_model, _ = randi_mod.build_clean_base_model()
    r_uuids = randi_mod.collect_bone_uuids(r_model["outliner"])
    r_mov_anims = randi_mod.author_all_animations(r_uuids)
    r_voz_anims, r_key_times = author_randi_voice_idles(r_uuids)
    r_model["animations"] = r_mov_anims + r_voz_anims
    randi_mod.OUT_DIR.mkdir(parents=True, exist_ok=True)
    randi_mod.OUT_BBMODEL.write_text(json.dumps(r_model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Guardado {randi_mod.OUT_BBMODEL} ({len(r_model['animations'])} animaciones: 10 mov + 6 voz)")

    r_sheet = SCRATCH / "elrandi_voice_idles_sheet.png"
    render_key_moments_sheet(randi_mod, r_voz_anims, r_key_times, r_sheet, draw_spear=False)
    print(f"Vista previa Randi voz: {r_sheet}")

    if apply_html:
        html_path = REPO / "index.html"
        html = html_path.read_text(encoding="utf-8")

        # Patch JAVI_BB_DATA (`idle_voz_1..3` + expresiones 3D `eyes`)
        pat_j = re.compile(r"(/\* JAVI_BLOCKBENCH_DATA_BEGIN \*/\s*const JAVI_BB_DATA = )(\{.*?\})(;\s*/\* JAVI_BLOCKBENCH_DATA_END \*/)", re.S)
        mj = pat_j.search(html)
        assert mj, "No se encontró JAVI_BB_DATA en index.html"
        j_data = json.loads(mj.group(2))
        for idx, anim in enumerate(j_voz_anims, 1):
            key = f"idle_voz_{idx}"
            clip = javi_mod.convert_anim_to_calfight_clip(anim, armed_spear=True)
            if key in j_eyes_map:
                clip["eyes"] = j_eyes_map[key]
            j_data[key] = clip
        j_ser = json.dumps(j_data, ensure_ascii=False, separators=(",", ":"))
        html = html[:mj.start()] + mj.group(1) + j_ser + mj.group(3) + html[mj.end():]

        # Patch RANDI_BB_DATA (`idle_voz_1..6`)
        pat_r = re.compile(r"(/\* RANDI_BLOCKBENCH_DATA_BEGIN \*/\s*const RANDI_BB_DATA = )(\{.*?\})(;\s*/\* RANDI_BLOCKBENCH_DATA_END \*/)", re.S)
        mr = pat_r.search(html)
        assert mr, "No se encontró RANDI_BB_DATA en index.html"
        r_data = json.loads(mr.group(2))
        for idx, anim in enumerate(r_voz_anims, 1):
            key = f"idle_voz_{idx}"
            r_data[key] = randi_mod.convert_anim_to_calfight_clip(anim)
        r_ser = json.dumps(r_data, ensure_ascii=False, separators=(",", ":"))
        html = html[:mr.start()] + mr.group(1) + r_ser + mr.group(3) + html[mr.end():]

        html_path.write_text(html, encoding="utf-8")
        print("Actualizados JAVI_BB_DATA (idle_voz_1..3) y RANDI_BB_DATA (idle_voz_1..6) en index.html.")


if __name__ == "__main__":
    build_and_save_all(apply_html=("--apply-html" in sys.argv))
