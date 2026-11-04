# -*- coding: utf-8 -*-
"""
Generador de las 5 animaciones de combate básico (M1) en estilo Actions & Stuff
(cartoon/anime con anticipación rapaz, smear de zarpazo en el frame de contacto
y seguimiento aéreo de halcón/águila) para Sekza ("Garra del Cielo" — Aéreo):
  - `M1 1`        -> `combo_1`        (dur=0.26s, hit=0.07s, zarpazo rapaz derecho tilt=0.35, dir=1)
  - `M1 2`        -> `combo_2`        (dur=0.26s, hit=0.07s, zarpazo cruzado izquierdo tilt=-0.35, dir=-1)
  - `M1 3`        -> `combo_3`        (dur=0.26s, hit=0.07s, barrido rapaz giratorio tilt=-0.5, dir=1)
  - `M1 4`        -> `combo_4`        (dur=0.40s, hit=0.09s, talón aéreo rapaz demoledor tilt=0.9, dir=-1)
  - `M1 4 Arriba` -> `combo_4_arriba` (dur=0.40s, hit=0.09s, zarpazo ascendente rompecielos tilt=1.57)
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

import gen_sekza_movement as sek_mod

REPO = TOOLS_DIR.parent
SCRATCH = Path(r"C:\Users\jesul\.gemini\antigravity\brain\c20a7088-7590-4809-ab1d-f3e04deaa0b7\scratch")


def make_leg_pts(spec):
    """`spec` usa tiempos exactos en segundos `(t_s, rx, ry, rz, px, pz, lift_y)`."""
    rot, pos = [], []
    for t_s, rx, ry, rz, px, pz, lift_y in spec:
        py = sek_mod.grounded_leg_py(rx, ry, rz, lift_y)
        rot.append((round(t_s, 5), rx, ry, rz))
        pos.append((round(t_s, 5), px, py, pz))
    return {"rotation": rot, "position": pos}


def author_sekza_m1(bone_uuids):
    i0 = {
        "low_anchor": {"scale": (0.988, 1.018, 0.988)},
        "low_body":   {"rotation": (14.0, 14.0, -2.5), "position": (-0.18, -0.85, -0.35)},
        "body":       {"rotation": (2.0, -4.0, -1.0),  "position": (0.0, 0.32, 0.0)},
        "head":       {"rotation": (-11.5, -11.5, 1.8)},
        "right_arm":  {"rotation": (-72.0, -14.0, 28.0), "position": (-0.30, 0.65, -0.55)},
        "left_arm":   {"rotation": (-54.0, 22.0, -20.0),  "position": (0.25, 0.40, -0.75)},
        "right_leg":  {"rotation": (14.0, 16.0, 8.5),   "position": (-0.55, 1.45, 0.0)},
        "left_leg":   {"rotation": (-15.5, -14.0, -7.5), "position": (0.62, -1.55, 0.0)},
    }
    make_anim = sek_mod.make_bb_anim
    anims = []
    sample_map = {}

    L1 = 0.26
    # -------------------------------------------------------------------------
    # 1. M1 1 (`combo_1`, len=0.26s, hit=0.07s) — Zarpazo Rapaz Derecho
    # `SEK_M1[0]: arc={tilt: 0.35, dir: 1, len: 2.2}`
    # -------------------------------------------------------------------------
    c1_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.03, 1.060, 0.915, 1.060),
                (0.07, 0.925, 1.065, 1.100),
                (0.11, 0.960, 1.025, 1.055),
                (0.19, 1.015, 0.980, 1.015),
                (L1,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.03, 16.0,  32.0, -4.5),
                (0.07, 22.0, -26.0,  5.0),
                (0.11, 24.0, -32.0,  6.0),
                (0.19, 16.0, -10.0,  1.5),
                (L1,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.03, -0.40, -1.25,  0.55),
                (0.07,  0.25, -0.75, -2.15),
                (0.11,  0.30, -0.85, -2.35),
                (0.19,  0.10, -0.45, -1.05),
                (L1,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.03,  2.0,  14.0, -2.0),
                (0.07,  4.0, -14.0,  3.0),
                (0.11,  5.0, -18.0,  3.5),
                (0.19,  2.0,  -6.0,  1.0),
                (L1,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.03,  -6.0, -34.0,  3.5),
                (0.07, -14.0,  36.0, -5.0),
                (0.11, -16.0,  44.0, -5.5),
                (0.19, -10.0,  18.0, -2.0),
                (L1,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            # Garra derecha abre arriba-atrás y desgarra en diagonal descendente (tilt=0.35)!
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.03, -42.0,  18.0,  54.0),
                (0.07,-112.0,  32.0,  10.0),    # ¡ZARPAZO RAPAZ DERECHO EN 0.07s!
                (0.11,-116.0,  18.0,  -2.0),
                (0.19, -82.0,   4.0,  18.0),
                (L1,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.03, -0.45,  0.45,  1.05),
                (0.07,  0.45,  0.65, -2.05),
                (0.11,  0.65,  0.60, -2.15),
                (0.19,  0.15,  0.45, -0.95),
                (L1,   *i0["right_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.06, 0.90, 1.06),
                (0.07, 0.88, 1.28, 0.88),       # Smear anime de zarpazo!
                (0.11, 0.95, 1.10, 0.95),
                (0.19, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.03, -64.0,  24.0, -22.0),
                (0.07,  42.0,  14.0, -42.0),    # Ala izquierda abre atrás equilibrando el zarpazo!
                (0.11,  48.0,  16.0, -46.0),
                (0.19, -24.0,  18.0, -24.0),
                (L1,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.07,  0.25, 0.35,  0.85),
                (L1,   *i0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg_pts([
            (0.00,  14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
            (0.03,  20.0,  16.0, 10.0, -0.65,  1.85, 0.0),
            (0.07,  34.0,  12.0,  8.0, -0.45,  2.25, 0.0),
            (0.11,  36.0,  12.0,  8.0, -0.45,  2.35, 0.0),
            (0.19,  22.0,  15.0,  8.2, -0.50,  1.75, 0.0),
            (L1,    14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
        ]),
        "left_leg": make_leg_pts([
            (0.00, -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
            (0.03, -10.0, -14.0, -8.5,  0.55, -1.15, 0.0),
            (0.07, -30.0, -12.0, -9.5,  0.60, -2.55, 0.0),  # Zancada rapaz al frente!
            (0.11, -32.0, -12.0,-10.0,  0.60, -2.65, 0.0),
            (0.19, -20.0, -13.0, -8.5,  0.60, -1.95, 0.0),
            (L1,   -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
        ]),
    }
    anims.append(make_anim("M1 1", L1, False, bone_uuids, c1_tracks))
    sample_map["M1 1"] = [0.00, 0.03, 0.07, 0.11, 0.19, L1]

    # -------------------------------------------------------------------------
    # 2. M1 2 (`combo_2`, len=0.26s, hit=0.07s) — Zarpazo Cruzado Izquierdo
    # `SEK_M1[1]: arc={tilt: -0.35, dir: -1, len: 2.2}`
    # -------------------------------------------------------------------------
    c2_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.03, 1.060, 0.915, 1.060),
                (0.07, 0.925, 1.065, 1.100),
                (0.11, 0.960, 1.025, 1.055),
                (0.19, 1.015, 0.980, 1.015),
                (L1,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.03, 14.0, -28.0,  4.5),
                (0.07, 20.0,  28.0, -5.0),
                (0.11, 22.0,  34.0, -6.0),
                (0.19, 15.0,  18.0, -2.5),
                (L1,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.03,  0.35, -1.25,  0.45),
                (0.07, -0.25, -0.75, -2.15),
                (0.11, -0.30, -0.85, -2.35),
                (0.19, -0.15, -0.45, -1.05),
                (L1,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.03,  2.0, -14.0,  2.5),
                (0.07,  4.0,  14.0, -3.0),
                (0.11,  5.0,  18.0, -3.5),
                (0.19,  2.0,   4.0, -1.0),
                (L1,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.03,  -6.0,  28.0, -3.0),
                (0.07, -13.0, -38.0,  5.0),
                (0.11, -15.0, -46.0,  5.5),
                (0.19,  -8.0, -20.0,  2.5),
                (L1,   *i0["head"]["rotation"]),
            ],
        },
        "left_arm": {
            # Garra izquierda desgarra de arriba-izq cruzando hacia abajo-der (tilt=-0.35, dir=-1)!
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.03, -40.0, -18.0, -52.0),
                (0.07,-110.0, -32.0,  -8.0),    # ¡ZARPAZO IZQUIERDO RAPAZ EN 0.07s!
                (0.11,-114.0, -20.0,   4.0),
                (0.19, -74.0,  10.0, -16.0),
                (L1,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.03,  0.45, 0.45,  1.05),
                (0.07, -0.45, 0.65, -2.05),
                (0.11, -0.65, 0.60, -2.15),
                (0.19, -0.15, 0.45, -0.95),
                (L1,   *i0["left_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.06, 0.90, 1.06),
                (0.07, 0.88, 1.28, 0.88),       # Smear de garra izquierda!
                (0.11, 0.95, 1.10, 0.95),
                (0.19, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "right_arm": {
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.03, -68.0, -22.0, 18.0),
                (0.07,  44.0, -14.0, 38.0),
                (0.11,  50.0, -16.0, 42.0),
                (0.19, -28.0, -14.0, 24.0),
                (L1,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.07, -0.25, 0.35, 0.85),
                (L1,   *i0["right_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_pts([
            (0.00, -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
            (0.03, -12.0, -14.0, -8.5,  0.58, -1.25, 0.0),
            (0.07, -28.0, -12.0, -9.0,  0.60, -2.45, 0.0),
            (0.11, -30.0, -12.0, -9.5,  0.60, -2.55, 0.0),
            (0.19, -18.0, -13.0, -8.0,  0.60, -1.85, 0.0),
            (L1,   -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
        ]),
        "right_leg": make_leg_pts([
            (0.00,  14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
            (0.03,  18.0,  16.0,  9.5, -0.60,  1.65, 0.0),
            (0.07,  32.0,  14.0,  8.0, -0.45,  2.15, 0.0),
            (0.11,  34.0,  14.0,  8.0, -0.45,  2.25, 0.0),
            (0.19,  20.0,  15.0,  8.2, -0.50,  1.65, 0.0),
            (L1,    14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
        ]),
    }
    anims.append(make_anim("M1 2", L1, False, bone_uuids, c2_tracks))
    sample_map["M1 2"] = [0.00, 0.03, 0.07, 0.11, 0.19, L1]

    # -------------------------------------------------------------------------
    # 3. M1 3 (`combo_3`, len=0.26s, hit=0.07s) — Latigazo Giratorio de Talón Rapaz
    # `SEK_M1[2]: arc={tilt: -0.5, dir: 1, len: 2.4, r: 1.9}`
    # -------------------------------------------------------------------------
    c3_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.03, 1.075, 0.895, 1.075),
                (0.07, 1.045, 0.945, 1.085),
                (0.12, 1.020, 0.970, 1.035),
                (0.20, 1.000, 1.000, 1.000),
                (L1,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.03, 18.0,  42.0, -7.5),
                (0.07, 24.0, -32.0,  7.0),
                (0.12, 26.0, -52.0, 10.0),
                (0.20, 16.0, -18.0,  3.5),
                (L1,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.03, -0.55, -1.65,  0.65),
                (0.07,  0.35, -1.15, -2.15),
                (0.12,  0.65, -1.35, -2.25),
                (0.20,  0.20, -0.65, -0.95),
                (L1,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.03,  4.0,  20.0, -4.0),
                (0.07,  5.0, -16.0,  4.0),
                (0.12,  6.5, -24.0,  5.5),
                (0.20,  2.5,  -8.0,  1.5),
                (L1,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.03,  -8.0, -40.0,  5.5),
                (0.07, -13.0,  40.0, -6.0),
                (0.12, -15.0,  54.0, -7.5),
                (0.20,  -8.0,  18.0, -2.0),
                (L1,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.03, -34.0,  24.0,  70.0),    # Abre ala derecha amplia cargando el giro!
                (0.07,-108.0,  36.0,  16.0),    # Atraviesa el frente barriendo en arco!
                (0.12,-106.0,  10.0, -18.0),
                (0.20, -68.0,   2.0,  12.0),
                (L1,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.03, -0.75, 0.55,  0.65),
                (0.07,  0.55, 0.60, -1.85),
                (0.12,  1.15, 0.50, -1.55),
                (0.20,  0.25, 0.40, -0.75),
                (L1,   *i0["right_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.08, 0.88, 1.08),
                (0.07, 0.88, 1.28, 0.88),       # Smear de garra giratoria!
                (0.12, 0.95, 1.10, 0.95),
                (0.20, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.03, -64.0,  24.0, -24.0),
                (0.07,  48.0,  16.0, -46.0),
                (0.12,  56.0,  20.0, -50.0),
                (0.20, -20.0,  18.0, -22.0),
                (L1,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.07,  0.30, 0.35,  0.85),
                (L1,   *i0["left_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_pts([
            (0.00, -15.5, -14.0,  -7.5,  0.62, -1.55, 0.0),
            (0.03, -18.0, -14.0, -11.0,  0.80, -1.55, 0.0),
            (0.07, -30.0, -12.0, -13.0,  0.95, -2.55, 0.0),
            (0.12, -32.0, -12.0, -14.0,  1.00, -2.65, 0.0),
            (0.20, -18.0, -13.0,  -9.0,  0.75, -1.85, 0.0),
            (L1,   -15.5, -14.0,  -7.5,  0.62, -1.55, 0.0),
        ]),
        "right_leg": make_leg_pts([
            (0.00,  14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
            (0.03,  22.0,  18.0, 13.0, -0.80,  1.75, 0.0),
            (0.07,  34.0,  14.0, 11.0, -0.60,  2.15, 0.0),
            (0.12,  36.0,  14.0, 11.0, -0.60,  2.25, 0.0),
            (0.20,  20.0,  15.0,  9.5, -0.55,  1.65, 0.0),
            (L1,    14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
        ]),
    }
    anims.append(make_anim("M1 3", L1, False, bone_uuids, c3_tracks))
    sample_map["M1 3"] = [0.00, 0.03, 0.07, 0.12, 0.20, L1]

    L4 = 0.40
    # -------------------------------------------------------------------------
    # 4. M1 4 (`combo_4`, len=0.40s, hit=0.09s) — Talón Rapaz Aéreo (Remate!)
    # `SEK_M1[3]: arc={tilt: 0.9, len: 2.8, r: 2.1, w: 0.6, dir: -1}`
    # -------------------------------------------------------------------------
    g_r0 = sek_mod.grounded_leg_py(14.0, 16.0, 8.5, 0.0)
    g_r1 = sek_mod.grounded_leg_py(30.0, 20.0, 14.0, 0.4)
    g_r4 = sek_mod.grounded_leg_py(18.0, 16.0, 10.0, 0.0)
    g_r5 = sek_mod.grounded_leg_py(15.0, 16.0, 9.0, 0.0)
    c4_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.04, 1.070, 0.885, 1.070),
                (0.09, 0.925, 1.090, 0.950),
                (0.15, 0.965, 1.045, 0.975),
                (0.28, 1.040, 0.945, 1.040),
                (L4,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.04,  16.0, -26.0,   4.5),
                (0.09, -20.0,  26.0,  18.0),    # Contrapeso aéreo de halcón cazador!
                (0.15, -22.0,  32.0,  20.0),
                (0.28,  14.0,   8.0,  -3.0),
                (L4,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.04, -0.30, -2.10,  0.35),
                (0.09,  0.95,  0.35,  0.45),
                (0.15,  1.05,  0.25,  0.55),
                (0.28, -0.25, -1.45, -0.15),
                (L4,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.04,  4.0, -10.0,  1.5),
                (0.09, -6.0,  12.0,  4.5),
                (0.15, -7.0,  16.0,  5.5),
                (0.28,  3.0,  -4.0, -1.0),
                (L4,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.04,  -8.0,  22.0,  -2.5),
                (0.09,  14.0, -34.0, -12.0),
                (0.15,  16.0, -40.0, -14.0),
                (0.28,  -6.0, -10.0,   1.5),
                (L4,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.04, -72.0, -20.0, 18.0),
                (0.09,  56.0,  14.0, 32.0),
                (0.15,  62.0,  18.0, 36.0),
                (0.28, -36.0, -14.0, 24.0),
                (L4,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.09, -0.35, 0.15, 0.75),
                (0.28, -0.10, 0.15, 0.05),
                (L4,   *i0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.04, -42.0,  20.0, -24.0),
                (0.09, -84.0,  38.0, -24.0),
                (0.15, -88.0,  42.0, -26.0),
                (0.28, -48.0,  22.0, -16.0),
                (L4,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.09,  0.35, 0.65, -0.85),
                (L4,   *i0["left_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_pts([
            (0.00, -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
            (0.04, -22.0, -16.0,-10.0,  0.65, -1.65, 0.0),
            (0.09,   6.0, -28.0, -8.0,  0.85, -0.55, 0.0),
            (0.15,   8.0, -32.0, -9.0,  0.90, -0.45, 0.0),
            (0.28, -18.0, -14.0, -8.0,  0.65, -1.55, 0.0),
            (L4,   -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
        ]),
        "right_leg": {
            # ¡TALÓN RAPAZ ALTO EN 0.09s CON SMEAR `lrs`!
            "rotation": [
                (0.00,  14.0,  16.0,   8.5),
                (0.04,  30.0,  20.0,  14.0),
                (0.09,-116.0, -24.0, -18.0),
                (0.15,-122.0, -36.0, -24.0),
                (0.22, -48.0,   4.0,  12.0),
                (0.28,  18.0,  16.0,  10.0),
                (0.34,  15.0,  16.0,   9.0),
                (L4,    14.0,  16.0,   8.5),
            ],
            "position": [
                (0.00, -0.55,  g_r0,  1.45),
                (0.04, -0.85,  g_r1,  1.95),
                (0.09,  0.25,  1.15, -1.65),
                (0.15,  0.55,  1.25, -1.85),
                (0.22, -0.25,  0.65, -0.35),
                (0.28, -0.55,  g_r4,  1.55),
                (0.34, -0.52,  g_r5,  1.45),
                (L4,   -0.55,  g_r0,  1.45),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.04, 1.06, 0.90, 1.06),
                (0.09, 0.88, 1.28, 0.88),       # Smear demoledor de garra/talón!
                (0.15, 0.94, 1.12, 0.94),
                (0.25, 1.00, 1.00, 1.00),
                (L4,   1.00, 1.00, 1.00),
            ],
        },
    }
    anims.append(make_anim("M1 4", L4, False, bone_uuids, c4_tracks))
    sample_map["M1 4"] = [0.00, 0.04, 0.09, 0.15, 0.28, L4]

    # -------------------------------------------------------------------------
    # 5. M1 4 ARRIBA (`combo_4_arriba`, len=0.40s, hit=0.09s) — Ciclón Rapaz Rompecielos
    # `SEK_M1[4]: arc={tilt: 1.57, r: 1.6, len: 2.4}` (`up=15`!)
    # -------------------------------------------------------------------------
    c4u_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.04, 1.095, 0.830, 1.095),    # Compresión rapaz abajo!
                (0.09, 0.875, 1.185, 0.875),    # ¡DISPARO AL CIELO EN 0.09s!
                (0.16, 0.945, 1.080, 0.945),
                (0.28, 1.050, 0.925, 1.050),
                (L4,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.04,  28.0,  30.0, -6.0),
                (0.09, -16.0, -26.0,  6.0),     # Torso proyectado al cielo!
                (0.16, -18.0, -32.0,  7.0),
                (0.28,  12.0,   8.0, -2.5),
                (L4,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.04, -0.45, -3.35,  0.45),
                (0.09,  0.35,  2.35, -1.35),    # Despega con corriente ascendente!
                (0.16,  0.40,  1.95, -1.45),
                (0.28, -0.20, -1.45, -0.25),
                (L4,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.04,  8.0,  16.0, -3.0),
                (0.09, -10.0, -20.0,  4.5),
                (0.16, -12.0, -24.0,  5.0),
                (0.28,  3.0,  -4.0, -1.0),
                (L4,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.04,   8.0, -24.0,  3.0),
                (0.09, -24.0,  28.0, -4.5),     # Ojos fijos en la presa en el aire!
                (0.16, -26.0,  32.0, -5.0),
                (0.28,  -4.0, -10.0,  1.5),
                (L4,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.04,  36.0,  14.0,  28.0),
                (0.09,-152.0,  12.0, -16.0),    # ¡GARRA ASCENDENTE AL CIELO (rz=-16 despeja cabeza)!
                (0.16,-158.0,  14.0, -20.0),
                (0.28, -58.0, -16.0,  18.0),
                (L4,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.04, -0.25, -1.15,  0.45),
                (0.09,  0.25,  1.65, -1.25),
                (0.16,  0.25,  1.75, -1.15),
                (0.28,  0.00,  0.25, -0.35),
                (L4,   *i0["right_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.04, 1.08, 0.88, 1.08),
                (0.09, 0.88, 1.30, 0.88),       # Smear vertical de garra!
                (0.16, 0.95, 1.10, 0.95),
                (0.26, 1.00, 1.00, 1.00),
                (L4,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.04, -36.0,  18.0, -24.0),
                (0.09,  44.0,  18.0, -42.0),    # Ala izquierda tira abajo impulsando el vuelo!
                (0.16,  48.0,  20.0, -44.0),
                (0.28, -42.0,  22.0, -14.0),
                (L4,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.09,  0.25, -0.25,  0.75),
                (0.28,  0.15,  0.20, -0.45),
                (L4,   *i0["left_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_pts([
            (0.00, -15.5, -14.0, -7.5,  0.62, -1.55, 0.00),
            (0.04, -28.0, -14.0, -9.0,  0.60, -1.85, 0.00),
            (0.09,  18.0, -10.0, -5.0,  0.35,  0.45, 1.85),  # Se despega con el zarpazo!
            (0.16,  12.0, -10.0, -6.0,  0.40,  0.15, 1.35),
            (0.28, -20.0, -14.0, -8.5,  0.62, -1.65, 0.00),
            (0.34, -17.0, -14.0, -7.8,  0.62, -1.58, 0.00),
            (L4,   -15.5, -14.0, -7.5,  0.62, -1.55, 0.00),
        ]),
        "right_leg": make_leg_pts([
            (0.00,  14.0,  16.0,  8.5, -0.55,  1.45, 0.00),
            (0.04,  26.0,  16.0, 11.0, -0.60,  1.75, 0.00),
            (0.09, -46.0,  10.0,  8.0, -0.35, -1.95, 3.40),  # Rodilla derecha sube dando impulso!
            (0.16, -38.0,  10.0,  8.0, -0.40, -1.65, 2.65),
            (0.28,  18.0,  16.0,  9.5, -0.55,  1.55, 0.00),
            (0.34,  15.5,  16.0,  9.0, -0.55,  1.48, 0.00),
            (L4,    14.0,  16.0,  8.5, -0.55,  1.45, 0.00),
        ]),
    }
    anims.append(make_anim("M1 4 Arriba", L4, False, bone_uuids, c4u_tracks))
    sample_map["M1 4 Arriba"] = [0.00, 0.04, 0.09, 0.16, 0.28, L4]

    return anims, sample_map


def compile_sekza_combat_clip(anim, contacts):
    length = anim["length"]
    n_samples = int(round(length * 120)) + 1
    times = sorted(set([round(min(length, i / 120.0), 6) for i in range(n_samples)] + [round(c, 6) for c in contacts] + [round(length, 6)]))
    T_shift_torso = [[1, 0, 0, 0], [0, 1, 0, -12.0], [0, 0, 1, 0], [0, 0, 0, 1]]

    all_frames = []
    for t in times:
        W = sek_mod.eval_bbs_world_matrices(anim, t)
        M_inner = sek_mod.mat_mul(W["low_anchor"], [[1, 0, 0, 0], [0, 1, 0, 16.0], [0, 0, 1, 0], [0, 0, 0, 1]])
        p_in, r_in, s_in = sek_mod.decompose_xyz(M_inner)
        M_inner_inv = sek_mod.mat_inv_rigid_uniform_or_diag(M_inner)

        M_torso_world = sek_mod.mat_mul(W["torso"], T_shift_torso)
        M_torso_local = sek_mod.mat_mul(M_inner_inv, M_torso_world)
        p_tr, r_tr, s_tr = sek_mod.decompose_xyz(M_torso_local)
        M_torso_world_inv = sek_mod.mat_inv_rigid_uniform_or_diag(M_torso_world)

        p_hd, r_hd, s_hd = sek_mod.decompose_xyz(sek_mod.mat_mul(M_torso_world_inv, W["head"]))
        p_ar, r_ar, s_ar = sek_mod.decompose_xyz(sek_mod.mat_mul(M_torso_world_inv, W["right_arm"]))
        p_al, r_al, s_al = sek_mod.decompose_xyz(sek_mod.mat_mul(M_torso_world_inv, W["left_arm"]))
        p_lr, r_lr, s_lr = sek_mod.decompose_xyz(sek_mod.mat_mul(M_inner_inv, W["right_leg"]))
        p_ll, r_ll, s_ll = sek_mod.decompose_xyz(sek_mod.mat_mul(M_inner_inv, W["left_leg"]))

        frame = {
            "bx": p_in[0], "by": p_in[1] - 16.0, "bz": p_in[2],
            "ix": r_in[0], "iy": r_in[1], "iz": r_in[2],
            "bsx": s_in[0], "bsy": s_in[1], "bsz": s_in[2],
            "tpx": p_tr[0], "tpy": p_tr[1] - (-4.0), "tpz": p_tr[2],
            "tx": r_tr[0], "ty": r_tr[1], "tz": r_tr[2],
            "tscx": s_tr[0], "tscy": s_tr[1], "tscz": s_tr[2],
            "hpx": p_hd[0], "hpy": p_hd[1] - 12.0, "hpz": p_hd[2],
            "hx": r_hd[0], "hy": r_hd[1], "hz": r_hd[2],
            "hscx": s_hd[0], "hscy": s_hd[1], "hscz": s_hd[2],
            "arpx": p_ar[0] - (-5.0), "arpy": p_ar[1] - 10.0, "arpz": p_ar[2],
            "arx": r_ar[0], "ary": r_ar[1], "arz": r_ar[2], "ars": s_ar[1],
            "alpx": p_al[0] - 5.0, "alpy": p_al[1] - 10.0, "alpz": p_al[2],
            "alx": r_al[0], "aly": r_al[1], "alz": r_al[2], "als": s_al[1],
            "lrpx": p_lr[0] - (-1.9), "lrpy": p_lr[1] - (-4.0), "lrpz": p_lr[2],
            "lrx": r_lr[0], "lry": r_lr[1], "lrz": r_lr[2], "lrs": s_lr[1],
            "llpx": p_ll[0] - 1.9, "llpy": p_ll[1] - (-4.0), "llpz": p_ll[2],
            "llx": r_ll[0], "lly": r_ll[1], "llz": r_ll[2], "lls": s_ll[1],
        }
        all_frames.append((t, frame))

    defaults = {
        "alz": 0.06, "arz": -0.06,
        "als": 1.0, "ars": 1.0, "lls": 1.0, "lrs": 1.0,
        "tscx": 1.0, "tscy": 1.0, "tscz": 1.0,
        "hscx": 1.0, "hscy": 1.0, "hscz": 1.0,
        "bsx": 1.0, "bsy": 1.0, "bsz": 1.0,
    }
    chans = sorted(k for k in all_frames[0][1].keys() if any(abs(fr[k] - defaults.get(k, 0.0)) > 1e-4 for _, fr in all_frames))
    angle_chans = {"ix", "iy", "iz", "tx", "ty", "tz", "hx", "hy", "hz", "alx", "aly", "alz", "arx", "ary", "arz", "llx", "lly", "llz", "lrx", "lry", "lrz"}
    prev_vals = {}
    samples = []
    for t, fr in all_frames:
        row = [t]
        for ch in chans:
            v = fr[ch]
            if ch in angle_chans and ch in prev_vals:
                while v - prev_vals[ch] > math.pi:
                    v -= 2 * math.pi
                while v - prev_vals[ch] < -math.pi:
                    v += 2 * math.pi
            prev_vals[ch] = v
            row.append(round(v, 5))
        samples.append(row)

    return {
        "length": round(length, 4),
        "loop": False,
        "contacts": list(contacts),
        "channels": chans,
        "samples": samples,
    }


def render_sekza_m1_sheet(anims, key_times, out_path):
    cols = max(len(v) for v in key_times.values())
    cell_w, cell_h = 224, 220
    img = Image.new("RGB", (cols * cell_w, len(anims) * cell_h), (18, 16, 22))
    draw = ImageDraw.Draw(img)

    yaw = math.radians(34.0)
    pitch = math.radians(17.0)
    cy_p, sy_p = math.cos(yaw), math.sin(yaw)
    cp_p, sp_p = math.cos(pitch), math.sin(pitch)
    scale = 4.2

    def proj(pt, cx, floor_y):
        x, y, z = pt
        rx = x * cy_p - z * sy_p
        rz = x * sy_p + z * cy_p
        ry = y * cp_p - rz * sp_p
        rz2 = y * sp_p + rz * cp_p
        return (cx + rx * scale, floor_y - ry * scale, rz2)

    for row_idx, anim in enumerate(anims):
        times = key_times[anim["name"]]
        for col_idx, t in enumerate(times):
            cx = col_idx * cell_w + cell_w // 2 - 8
            floor_y = row_idx * cell_h + cell_h - 28

            g1, g2 = proj((-14, 0, 0), cx, floor_y), proj((14, 0, 0), cx, floor_y)
            g3, g4 = proj((0, 0, -14), cx, floor_y), proj((0, 0, 24), cx, floor_y)
            draw.line([(g1[0], g1[1]), (g2[0], g2[1])], fill=(62, 54, 70), width=1)
            draw.line([(g3[0], g3[1]), (g4[0], g4[1])], fill=(86, 72, 48), width=1)

            W = sek_mod.eval_bbs_world_matrices(anim, t)
            polys = []
            min_foot_y = 999.0

            for bname, bmin, bmax, base_col in sek_mod.PARTS_BOXES:
                M = W[bname]
                x0, y0, z0 = bmin
                x1, y1, z1 = bmax
                corners_local = [
                    (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
                    (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
                ]
                corners_w = [sek_mod.mat_vec(M, c) for c in corners_local]
                if "leg" in bname:
                    min_foot_y = min(min_foot_y, min(c[1] for c in corners_w))
                corners_p = [proj(c, cx, floor_y) for c in corners_w]
                for idxs, _, shade_k in sek_mod.FACE_QUADS:
                    pts2d = [(corners_p[k][0], corners_p[k][1]) for k in idxs]
                    ax, ay = pts2d[1][0] - pts2d[0][0], pts2d[1][1] - pts2d[0][1]
                    bx, by = pts2d[2][0] - pts2d[0][0], pts2d[2][1] - pts2d[0][1]
                    if ax * by - ay * bx >= 0:
                        continue
                    depth = sum(corners_p[k][2] for k in idxs) / 4.0
                    col = tuple(max(0, min(255, int(c * shade_k))) for c in base_col)
                    polys.append((depth, pts2d, col))

            polys.sort(key=lambda item: item[0])
            for _, pts2d, col in polys:
                draw.polygon(pts2d, fill=col, outline=(14, 12, 18))

            if col_idx == 0:
                draw.text((col_idx * cell_w + 6, row_idx * cell_h + 4), anim["name"], fill=(255, 230, 200))
            draw.text(
                (col_idx * cell_w + 6, row_idx * cell_h + cell_h - 16),
                f"{t:.2f}s y0={min_foot_y:+.1f}",
                fill=(225, 205, 180),
            )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


def main():
    model = sek_mod.build_clean_base_model()
    uuids = sek_mod.collect_bone_uuids(model["outliner"])
    mov_anims = sek_mod.author_all_animations(uuids)
    m1_anims, sample_map = author_sekza_m1(uuids)

    model["animations"] = mov_anims + m1_anims
    sek_mod.OUT_DIR.mkdir(parents=True, exist_ok=True)
    sek_mod.OUT_BBMODEL.write_text(json.dumps(model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Guardado {sek_mod.OUT_BBMODEL} ({len(model['animations'])} animaciones: 10 mov + 1 voz + 5 M1)")

    sheet_path = SCRATCH / "sekza_m1_sheet.png"
    render_sekza_m1_sheet(m1_anims, sample_map, sheet_path)
    print(f"Vista previa M1 Sekza: {sheet_path}")

    if "--apply-html" in sys.argv:
        by_name = {a["name"]: a for a in m1_anims}
        html_path = REPO / "index.html"
        html = html_path.read_text(encoding="utf-8")
        pat = re.compile(r"(/\* SEK_BLOCKBENCH_DATA_BEGIN \*/\s*const SEK_BB_DATA = )(\{.*?\})(;\s*/\* SEK_BLOCKBENCH_DATA_END \*/)", re.S)
        m = pat.search(html)
        assert m, "No se encontró SEK_BB_DATA en index.html"
        data = json.loads(m.group(2))
        data["combo_1"] = compile_sekza_combat_clip(by_name["M1 1"], [0.07])
        data["combo_2"] = compile_sekza_combat_clip(by_name["M1 2"], [0.07])
        data["combo_3"] = compile_sekza_combat_clip(by_name["M1 3"], [0.07])
        data["combo_4"] = compile_sekza_combat_clip(by_name["M1 4"], [0.09])
        data["combo_4_arriba"] = compile_sekza_combat_clip(by_name["M1 4 Arriba"], [0.09])
        ser = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        html_path.write_text(html[:m.start()] + m.group(1) + ser + m.group(3) + html[m.end():], encoding="utf-8")
        print("¡SUBIDO AL TIRO! SEK_BB_DATA actualizado en index.html con combo_1..4 + combo_4_arriba.")


if __name__ == "__main__":
    main()
