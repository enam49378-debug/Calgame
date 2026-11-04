# -*- coding: utf-8 -*-
"""
Generador de las 5 animaciones de combate básico (M1) en estilo Actions & Stuff
(cartoon/anime con anticipación, smear de brazo/lanza en el milisegundo exacto
del hitbox y seguimiento de lancero/dragoon) para Javicubito ("Lancero Cúbico"):
  - `M1 1`        -> `combo_1`        (dur=0.26s, hit=0.07s, estocada frontal relámpago)
  - `M1 2`        -> `combo_2`        (dur=0.26s, hit=0.07s, barrido creciente der->izq)
  - `M1 3`        -> `combo_3`        (dur=0.26s, hit=0.07s, estocada baja profunda de víbora)
  - `M1 4`        -> `combo_4`        (dur=0.40s, hit=0.09s, tajo vertical Dragoon de arriba abajo)
  - `M1 4 Arriba` -> `combo_4_arriba` (dur=0.40s, hit=0.09s, estocada ascendente rompecielos)
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
import gen_voice_idles as voice_mod

REPO = TOOLS_DIR.parent
SCRATCH = Path(r"C:\Users\jesul\.gemini\antigravity\brain\c20a7088-7590-4809-ab1d-f3e04deaa0b7\scratch")


def make_leg_pts(spec):
    """`spec` usa tiempos exactos en segundos `(t_s, rx, ry, rz, px, pz, lift_y)`."""
    rot, pos = [], []
    for t_s, rx, ry, rz, px, pz, lift_y in spec:
        py = javi_mod.leg_py_for_clearance(rx, ry, rz, lift_y)
        rot.append((round(t_s, 5), rx, ry, rz))
        pos.append((round(t_s, 5), px, py, pz))
    return {"rotation": rot, "position": pos}


def mat_euler_xyz(rx, ry, rz, px=0.0, py=0.0, pz=0.0, sx=1.0, sy=1.0, sz=1.0):
    """Matriz 4x4 exacta de Three.js (`Euler(rx, ry, rz, 'XYZ')` intrínseco = `Rx * Ry * Rz` con escala local)."""
    cx, s_x = math.cos(rx), math.sin(rx)
    cy, s_y = math.cos(ry), math.sin(ry)
    cz, s_z = math.cos(rz), math.sin(rz)
    # R = Rx(rx) * Ry(ry) * Rz(rz)
    r00 = cy * cz
    r01 = -cy * s_z
    r02 = s_y
    r10 = s_x * s_y * cz + cx * s_z
    r11 = -s_x * s_y * s_z + cx * cz
    r12 = -s_x * cy
    r20 = -cx * s_y * cz + s_x * s_z
    r21 = cx * s_y * s_z + s_x * cz
    r22 = cx * cy
    return [
        [r00 * sx, r01 * sy, r02 * sz, px],
        [r10 * sx, r11 * sy, r12 * sz, py],
        [r20 * sx, r21 * sy, r22 * sz, pz],
        [0.0, 0.0, 0.0, 1.0],
    ]


def author_javi_m1(bone_uuids):
    """
    Diseña las 5 animaciones M1 de Javicubito incluyendo el hueso `right_arm_item`
    (pivote exacto `[6, 12, 0]` = `m.gripRot` en Three.js) para controlar con precisión
    milimétrica la orientación 3D de la lanza de 37px (`z=-11..+26`).
    """
    i0 = voice_mod.javi_idle0()
    make_anim = javi_mod.make_bb_anim
    anims = []
    sample_map = {}

    # Pose base con lanza empuñada lista (guardia de lancero):
    # Apunta ~42° hacia adelante-arriba despejando completamente el rostro!
    g_item = (6.0, -10.0, 0.0)

    # -------------------------------------------------------------------------
    # 1. M1 1 (`combo_1`, len=0.26s, hit=0.07s) — Estocada Relámpago de Esgrimista
    # `SPEAR_M1[0]: stab=True, reach=1.9`
    # Recoge codo derecho atrás nivelando la lanza (0.03s) y dispara estocada recta
    # horizontal a las 0.07s proyectando el hombro derecho adelante y abriendo el
    # brazo izquierdo atrás como contrapeso clásico de Lancer!
    # -------------------------------------------------------------------------
    L1 = 0.26
    c1_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.03, 1.050, 0.925, 1.050),    # Compresión elástica preparando estocada
                (0.07, 0.920, 1.060, 1.110),    # ¡PROYECCIÓN HORIZONTAL DE ESTOCADA EN 0.07s!
                (0.11, 0.955, 1.030, 1.060),
                (0.19, 1.015, 0.980, 1.015),
                (L1,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.03, 10.0,  26.0, -4.0),      # Retrae hombro derecho cargando el resorte!
                (0.07, 16.0, -32.0,  5.0),      # ¡Perfil de esgrimista adelantando hombro derecho al máximo!
                (0.11, 18.0, -36.0,  5.5),
                (0.19, 10.0, -24.0,  3.0),
                (L1,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.03, -0.35, -0.95,  0.65),
                (0.07,  0.25, -0.75, -2.35),    # Paso de estocada larga hacia +Z!
                (0.11,  0.30, -0.85, -2.55),
                (0.19,  0.22, -0.25, -1.05),
                (L1,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.03,  2.0,  12.0, -2.0),
                (0.07,  4.0, -14.0,  2.5),
                (0.11,  4.5, -16.0,  3.0),
                (0.19,  1.0,  -4.0,  1.5),
                (L1,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.03,  -4.0, -28.0,  3.0),
                (0.07, -10.0,  42.0, -4.5),     # Mirada afilada sobre el hombro derecho directo a la punta!
                (0.11, -12.0,  46.0, -5.0),
                (0.19,  -5.0,  24.0, -2.5),
                (L1,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            # Torso yaw en 0.07s = -46° -> ry=+44° alinea el brazo directo hacia +Z!
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.03,  36.0,  14.0,  28.0),    # Codo atrás amartillando la lanza!
                (0.07,-106.0,  44.0,   6.0),    # ¡BRAZO EXTENDIDO EN LÍNEA CON LA LANZA EN 0.07s!
                (0.11,-108.0,  46.0,   4.0),
                (0.19, -64.0,   8.0,  14.0),
                (L1,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.03, -0.35,  0.25,  1.25),
                (0.07,  0.45,  0.45, -2.15),    # Máximo alcance de hombro adelante!
                (0.11,  0.50,  0.42, -2.25),
                (0.19,  0.10,  0.40, -1.10),
                (L1,   *i0["right_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.06, 0.90, 1.06),
                (0.07, 0.90, 1.25, 0.90),       # Smear anime en brazo!
                (0.11, 0.96, 1.08, 0.96),
                (0.19, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "right_arm_item": {
            # Controla `sx, sy, sz, ssc` de la lanza (`m.gripRot`):
            # En 0.03s `arx≈+48°` -> `rx=-50°` mantiene la lanza horizontal apuntando al frente mientras carga!
            # En 0.07s `arx+torso_x ≈ -86°` -> `rx=+86°` clava la lanza 100% HORIZONTAL RECTA AL FRENTE (+Z)!
            "rotation": [
                (0.00, *g_item),
                (0.03, -52.0, -26.0,  0.0),     # Nivelada apuntando al pecho rival desde atrás!
                (0.07,  88.0,   2.0,  0.0),     # ¡LANZA 100% RECTA HORIZONTAL EN LÍNEA CON EL BRAZO!
                (0.11,  90.0,   2.0,  0.0),
                (0.19,   8.0,   0.0,  0.0),
                (L1,   *g_item),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.00, 1.00, 0.94),
                (0.07, 1.00, 1.00, 1.15),       # Estiramiento anime de estocada!
                (0.12, 1.00, 1.00, 1.04),
                (0.19, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            # Mano izquierda abre atrás con elegancia de esgrimista equilibrando la lanza
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.03, -46.0,  22.0, -18.0),
                (0.07,  46.0,  16.0, -42.0),
                (0.11,  52.0,  18.0, -46.0),
                (0.19,  28.0,  15.0, -26.0),
                (L1,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.07,  0.25, 0.35,  0.85),
                (0.19,  0.10, 0.35,  0.45),
                (L1,   *i0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg_pts([
            # En Javi el pie derecho está adelantado (guardia de esgrimista)!
            (0.00, -12.5,  14.0,  6.5, -0.55, -1.40, 0.0),
            (0.03,  -6.0,  14.0,  7.5, -0.55, -0.85, 0.0),
            (0.07, -28.0,  10.0,  9.0, -0.50, -2.55, 0.0),  # Estocada de pie derecho adelante!
            (0.11, -30.0,  10.0,  9.5, -0.50, -2.65, 0.0),
            (0.19, -20.0,  12.0,  7.5, -0.52, -1.95, 0.0),
            (L1,   -12.5,  14.0,  6.5, -0.55, -1.40, 0.0),
        ]),
        "left_leg": make_leg_pts([
            (0.00,  11.5, -18.0, -9.0,  0.48,  1.30, 0.0),
            (0.03,  18.0, -18.0,-10.0,  0.55,  1.65, 0.0),
            (0.07,  32.0, -14.0, -8.5,  0.45,  2.15, 0.0),  # Empuje trasero firme!
            (0.11,  34.0, -14.0, -8.5,  0.45,  2.25, 0.0),
            (0.19,  21.0, -16.0, -8.8,  0.47,  1.70, 0.0),
            (L1,    11.5, -18.0, -9.0,  0.48,  1.30, 0.0),
        ]),
    }
    anims.append(make_anim("M1 1", L1, False, bone_uuids, c1_tracks))
    sample_map["M1 1"] = [0.00, 0.03, 0.07, 0.11, 0.19, L1]

    # -------------------------------------------------------------------------
    # 2. M1 2 (`combo_2`, len=0.26s, hit=0.07s) — Barrido Creciente Horizontal
    # `SPEAR_M1[1]: arc={tilt: 0.12, len: 2.8, dir: 1}` (Derecha -> Izquierda!)
    # Abre la lanza bien ancha a la derecha en 0.03s -> corta en gran media luna
    # horizontal frente al rival en 0.07s -> termina cruzada a la izquierda en 0.12s!
    # -------------------------------------------------------------------------
    c2_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.03, 1.065, 0.905, 1.065),
                (0.07, 1.045, 0.950, 1.075),    # Base ancha para barrido de alabarda/lanza!
                (0.12, 1.020, 0.975, 1.035),
                (0.20, 0.995, 1.005, 0.995),
                (L1,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.03, 14.0,  40.0, -6.5),      # Abre torso amplio hacia la derecha!
                (0.07, 18.0, -18.0,  5.0),      # ¡Atraviesa el centro en el frame 0.07s!
                (0.12, 20.0, -48.0,  8.5),      # Completa el gran tajo hacia la izquierda!
                (0.20, 10.0, -28.0,  4.0),
                (L1,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.03, -0.55, -1.45,  0.55),
                (0.07,  0.35, -1.05, -1.95),
                (0.12,  0.65, -1.20, -2.05),
                (0.20,  0.30, -0.45, -0.85),
                (L1,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.03,  3.0,  20.0, -3.5),
                (0.07,  4.0, -14.0,  3.5),
                (0.12,  5.5, -26.0,  5.0),
                (0.20,  1.0,  -6.0,  2.0),
                (L1,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.03,  -6.0, -42.0,  5.0),
                (0.07, -10.0,  28.0, -4.5),
                (0.12, -12.0,  58.0, -7.0),     # Mantiene los ojos clavados al frente mientras gira!
                (0.20,  -4.0,  26.0, -3.0),
                (L1,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.03, -62.0,  28.0,  62.0),    # Abre el brazo derecho ancho al costado!
                (0.07, -98.0,  24.0,  12.0),    # ¡Pasa barriendo frente al pecho en 0.07s!
                (0.12, -96.0, -24.0, -18.0),    # Cruza hasta el costado izquierdo!
                (0.20, -58.0,  -8.0,  10.0),
                (L1,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.03, -0.75, 0.45,  0.45),
                (0.07,  0.45, 0.55, -1.75),
                (0.12,  1.05, 0.45, -1.45),
                (0.20,  0.15, 0.42, -0.75),
                (L1,   *i0["right_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.06, 0.90, 1.06),
                (0.07, 0.90, 1.22, 0.90),
                (0.12, 0.96, 1.08, 0.96),
                (0.20, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "right_arm_item": {
            # Orienta la hoja de la lanza a lo largo del barrido horizontal (derecha -> frente -> izquierda)!
            "rotation": [
                (0.00, *g_item),
                (0.03,  56.0, -36.0, -10.0),    # Apunta abierta hacia la derecha-adelante!
                (0.07,  82.0,  18.0,  -6.0),    # ¡Corta horizontal frente al rival con leve tilt 0.12!
                (0.12,  78.0,  46.0, -12.0),    # Termina apuntando hacia la izquierda tras cortar!
                (0.20,  16.0,  12.0,   0.0),
                (L1,   *g_item),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.07, 1.00, 1.00, 1.12),
                (0.14, 1.00, 1.00, 1.03),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.03, -58.0,  24.0, -20.0),
                (0.07,  38.0,  16.0, -44.0),
                (0.12,  48.0,  20.0, -48.0),
                (0.20,  24.0,  15.0, -24.0),
                (L1,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.07,  0.25, 0.35, 0.75),
                (L1,   *i0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg_pts([
            (0.00, -12.5, 14.0,  6.5, -0.55, -1.40, 0.0),
            (0.03, -18.0, 16.0, 11.0, -0.75, -1.55, 0.0),
            (0.07, -26.0, 12.0, 12.0, -0.55, -2.25, 0.0),
            (0.12, -28.0, 10.0, 12.5, -0.50, -2.35, 0.0),
            (0.20, -19.0, 12.0,  9.0, -0.52, -1.85, 0.0),
            (L1,   -12.5, 14.0,  6.5, -0.55, -1.40, 0.0),
        ]),
        "left_leg": make_leg_pts([
            (0.00,  11.5, -18.0, -9.0,  0.48,  1.30, 0.0),
            (0.03,  20.0, -18.0,-12.0,  0.75,  1.65, 0.0),
            (0.07,  30.0, -14.0,-11.0,  0.65,  2.05, 0.0),
            (0.12,  32.0, -14.0,-11.5,  0.65,  2.15, 0.0),
            (0.20,  20.0, -16.0,-10.0,  0.55,  1.65, 0.0),
            (L1,    11.5, -18.0, -9.0,  0.48,  1.30, 0.0),
        ]),
    }
    anims.append(make_anim("M1 2", L1, False, bone_uuids, c2_tracks))
    sample_map["M1 2"] = [0.00, 0.03, 0.07, 0.12, 0.20, L1]

    # -------------------------------------------------------------------------
    # 3. M1 3 (`combo_3`, len=0.26s, hit=0.07s) — Estocada Profunda de Víbora
    # `SPEAR_M1[2]: stab=True, reach=1.9`
    # Se diferencia claramente de M1 1: Javi se agacha al ras en postura felina
    # de Lancer (Fate/Cu Chulainn) y lanza un aguijonazo bajo/medio de máximo
    # alcance con paso largo profundo!
    # -------------------------------------------------------------------------
    c3_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.03, 1.080, 0.885, 1.080),    # Agachada felina de Lancer!
                (0.07, 0.905, 1.045, 1.135),    # ¡Estiramiento horizontal de víbora hacia +Z!
                (0.11, 0.945, 1.020, 1.075),
                (0.19, 1.020, 0.975, 1.020),
                (L1,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.03, 22.0,  34.0, -6.0),      # Agachado cargando lanza al costado bajo!
                (0.07, 26.0, -38.0,  6.5),      # ¡Lunge bajo agresivo proyectando todo el torso!
                (0.11, 28.0, -42.0,  7.0),
                (0.19, 14.0, -24.0,  3.5),
                (L1,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.03, -0.45, -2.15,  0.85),
                (0.07,  0.35, -1.85, -2.85),    # ¡El paso más profundo de los 3 primeros M1!
                (0.11,  0.40, -1.95, -3.05),
                (0.19,  0.25, -0.85, -1.25),
                (L1,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.03,  5.0,  16.0, -3.0),
                (0.07,  6.0, -16.0,  3.5),
                (0.11,  7.0, -18.0,  4.0),
                (0.19,  2.0,  -4.0,  1.5),
                (L1,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.03, -12.0, -36.0,  4.5),
                (0.07, -20.0,  48.0, -6.5),     # Barbilla baja pero ojos clavados al frente desde abajo!
                (0.11, -22.0,  52.0, -7.0),
                (0.19,  -8.0,  24.0, -3.0),
                (L1,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            # Torso pitch en 0.07s = +32°, yaw = -54° -> rx=-118°, ry=+52° clava el brazo recto hacia +Z!
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.03,  44.0,  18.0,  34.0),
                (0.07,-118.0,  52.0,   6.0),    # ¡ESTOCADA DE VÍBORA A LAS 0.07s!
                (0.11,-120.0,  54.0,   4.0),
                (0.19, -68.0,  10.0,  14.0),
                (L1,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.03, -0.45,  0.15,  1.45),
                (0.07,  0.55,  0.55, -2.35),
                (0.11,  0.60,  0.50, -2.45),
                (0.19,  0.15,  0.40, -1.15),
                (L1,   *i0["right_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.08, 0.88, 1.08),
                (0.07, 0.88, 1.28, 0.88),
                (0.11, 0.95, 1.10, 0.95),
                (0.19, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "right_arm_item": {
            # En 0.07s apunta levemente ascendente (-6° pitch mundial) desde la guardia baja directo al pecho!
            "rotation": [
                (0.00, *g_item),
                (0.03, -64.0, -30.0,  0.0),
                (0.07,  82.0,   2.0,  0.0),     # Aguijón ligeramente ascendente desde postura baja!
                (0.11,  84.0,   2.0,  0.0),
                (0.19,   6.0,   0.0,  0.0),
                (L1,   *g_item),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.00, 1.00, 0.92),
                (0.07, 1.00, 1.00, 1.18),
                (0.12, 1.00, 1.00, 1.05),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.03, -52.0,  24.0, -22.0),
                (0.07,  54.0,  18.0, -48.0),    # Ala izquierda tendida atrás estilo Cu Chulainn!
                (0.11,  58.0,  20.0, -52.0),
                (0.19,  28.0,  16.0, -26.0),
                (L1,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.07,  0.30, 0.45,  0.95),
                (L1,   *i0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg_pts([
            (0.00, -12.5, 14.0,  6.5, -0.55, -1.40, 0.0),
            (0.03, -16.0, 14.0,  9.0, -0.65, -1.35, 0.0),
            (0.07, -36.0, 10.0, 11.0, -0.60, -2.95, 0.0),  # Zancada baja súper profunda!
            (0.11, -38.0, 10.0, 11.5, -0.60, -3.05, 0.0),
            (0.19, -22.0, 12.0,  8.5, -0.56, -2.05, 0.0),
            (L1,   -12.5, 14.0,  6.5, -0.55, -1.40, 0.0),
        ]),
        "left_leg": make_leg_pts([
            (0.00,  11.5, -18.0, -9.0,  0.48,  1.30, 0.0),
            (0.03,  24.0, -18.0,-11.0,  0.65,  1.85, 0.0),
            (0.07,  40.0, -14.0,-10.0,  0.55,  2.65, 0.0),
            (0.11,  42.0, -14.0,-10.0,  0.55,  2.75, 0.0),
            (0.19,  24.0, -16.0, -9.5,  0.50,  1.90, 0.0),
            (L1,    11.5, -18.0, -9.0,  0.48,  1.30, 0.0),
        ]),
    }
    anims.append(make_anim("M1 3", L1, False, bone_uuids, c3_tracks))
    sample_map["M1 3"] = [0.00, 0.03, 0.07, 0.11, 0.19, L1]

    # -------------------------------------------------------------------------
    # 4. M1 4 (`combo_4`, len=0.40s, hit=0.09s) — Tajo Vertical Dragoon (Remate!)
    # `SPEAR_M1[3]: arc={tilt: 1.57, len: 2.2, dir: -1}, twirl=True`
    # ¡Alza la lanza por encima de la cabeza con salto corto (0.04s) y descarga un
    # hachazo/tajo vertical devastador de arriba hacia abajo a las 0.09s, seguido
    # de pose heroica mientras el motor ejecuta el `twirl` de lanza!
    # -------------------------------------------------------------------------
    L4 = 0.40
    c4_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.04, 0.935, 1.105, 0.935),    # Se alza imponente cargando sobre la cabeza!
                (0.09, 1.085, 0.875, 1.095),    # ¡IMPACTO PESADO CONTRA EL FRENTE EN 0.09s!
                (0.15, 1.055, 0.915, 1.065),
                (0.28, 0.975, 1.035, 0.975),    # Pose heroica mientras gira la lanza (twirl)
                (L4,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.04, -14.0,  24.0, -4.0),     # Arquea torso atrás alzando la lanza al cielo!
                (0.09,  28.0, -28.0,  5.5),     # ¡Látigo vertical hacia adelante-abajo en 0.09s!
                (0.15,  30.0, -32.0,  6.0),
                (0.28,   4.0, -20.0,  2.5),     # Se yergue heroico durante el molinete!
                (L4,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.04, -0.25,  1.45,  0.45),
                (0.09,  0.30, -1.95, -2.35),
                (0.15,  0.35, -2.15, -2.50),
                (0.28,  0.22,  0.25, -0.65),
                (L4,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.04, -8.0,  12.0, -2.0),
                (0.09,  8.0, -14.0,  3.0),
                (0.15,  9.0, -16.0,  3.5),
                (0.28, -2.0,   2.0,  1.0),
                (L4,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.04,  12.0, -28.0,  3.0),
                (0.09, -22.0,  38.0, -5.0),     # Mirada feroz clavada en el impacto!
                (0.15, -24.0,  42.0, -5.5),
                (0.28,  -2.0,  16.0, -1.5),
                (L4,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            # En 0.04s rx=-158° (rz=-18° despeja cabeza!) alza la lanza arriba;
            # En 0.09s descarga a rx=-106°, ry=+40° cortando de arriba abajo al ras del suelo sin atravesarlo!
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.04,-158.0,  14.0, -18.0),    # ¡Brazo alzado sobre la cabeza cargando el tajo!
                (0.09,-106.0,  40.0,  10.0),    # ¡TAJO VERTICAL DRAGOON EN 0.09s!
                (0.15,-100.0,  38.0,  12.0),
                (0.28, -52.0, -12.0,  22.0),    # Sostiene el molinete lateral heroico (`twirl`)!
                (L4,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.04, -0.25,  1.45, -0.25),
                (0.09,  0.35,  0.55, -2.05),
                (0.15,  0.35,  0.40, -2.10),
                (0.28, -0.25,  0.55, -0.65),
                (L4,   *i0["right_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.04, 0.94, 1.12, 0.94),
                (0.09, 0.88, 1.28, 0.88),       # Smear del hachazo vertical!
                (0.15, 0.95, 1.10, 0.95),
                (0.26, 1.00, 1.00, 1.00),
                (L4,   1.00, 1.00, 1.00),
            ],
        },
        "right_arm_item": {
            # En 0.04s: brazo arriba + item rx=+58° -> lanza cargada en lo alto!
            # En 0.09s: punta de diamante corta hasta y≈+4px sobre el suelo (cero clipping)!
            "rotation": [
                (0.00, *g_item),
                (0.04,  58.0,  0.0,  0.0),      # Lanza cargada en lo alto sobre la cabeza!
                (0.09,  64.0,  2.0,  0.0),      # ¡Corta al ras del suelo (spY≈+4px, cero clipping)!
                (0.15,  56.0,  2.0,  0.0),
                (0.28,   8.0, -8.0,  0.0),
                (L4,   *g_item),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.04, 1.00, 1.00, 1.05),
                (0.09, 1.00, 1.00, 1.18),
                (0.16, 1.00, 1.00, 1.05),
                (L4,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.04,-138.0, -14.0,  18.0),    # Acompaña la carga alta (rz=+18 despeja cabeza)!
                (0.09,  48.0,  16.0, -44.0),    # Latigazo atrás al descargar el golpe!
                (0.15,  54.0,  18.0, -48.0),
                (0.28,  22.0,  14.0, -24.0),
                (L4,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.04,  0.20,  1.15, -0.35),
                (0.09,  0.25,  0.25,  0.85),
                (L4,   *i0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg_pts([
            (0.00, -12.5, 14.0,  6.5, -0.55, -1.40, 0.00),
            (0.04,   8.0, 12.0,  6.0, -0.45, -0.45, 1.25),  # Pequeño brinco Dragoon al cargar!
            (0.09, -32.0, 10.0, 10.5, -0.55, -2.65, 0.00),  # Aterriza clavando el golpe en 0.09s!
            (0.15, -34.0, 10.0, 11.0, -0.55, -2.75, 0.00),
            (0.28, -16.0, 13.0,  7.5, -0.55, -1.65, 0.00),
            (L4,   -12.5, 14.0,  6.5, -0.55, -1.40, 0.00),
        ]),
        "left_leg": make_leg_pts([
            (0.00,  11.5, -18.0, -9.0,  0.48,  1.30, 0.00),
            (0.04,  22.0, -14.0, -7.0,  0.45,  1.55, 0.85),
            (0.09,  36.0, -14.0, -9.5,  0.50,  2.35, 0.00),
            (0.15,  38.0, -14.0,-10.0,  0.50,  2.45, 0.00),
            (0.28,  15.0, -17.0, -9.0,  0.48,  1.50, 0.00),
            (L4,    11.5, -18.0, -9.0,  0.48,  1.30, 0.00),
        ]),
    }
    anims.append(make_anim("M1 4", L4, False, bone_uuids, c4_tracks))
    sample_map["M1 4"] = [0.00, 0.04, 0.09, 0.15, 0.28, L4]

    # -------------------------------------------------------------------------
    # 5. M1 4 ARRIBA (`combo_4_arriba`, len=0.40s, hit=0.09s) — Lanza Rompecielos
    # `SPEAR_M1[4]: arc={tilt: 1.57, len: 1.6, dir: 1}, twirl=True` (`up=15`!)
    # Agachada profunda cargando la lanza abajo (0.04s) y disparo vertical al cielo
    # clavando la punta de diamante hacia arriba (`~75°` al cielo) en 0.09s!
    # -------------------------------------------------------------------------
    c4u_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.04, 1.095, 0.830, 1.095),    # Resorte comprimido abajo!
                (0.09, 0.875, 1.185, 0.875),    # ¡DISPARO VERTICAL AL CIELO EN 0.09s!
                (0.16, 0.945, 1.080, 0.945),
                (0.28, 1.045, 0.935, 1.045),    # Aterrizaje amortiguado
                (L4,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.04,  26.0,  28.0, -5.5),
                (0.09, -16.0, -28.0,  5.5),     # Pecho proyectado hacia el cielo!
                (0.16, -18.0, -32.0,  6.5),
                (0.28,  10.0, -20.0,  2.5),
                (L4,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.04, -0.35, -3.25,  0.55),
                (0.09,  0.30,  2.25, -1.45),    # Se despega del suelo impulsando al rival!
                (0.16,  0.35,  1.85, -1.55),
                (0.28,  0.20, -1.25, -0.35),
                (L4,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.04,  7.0,  14.0, -2.5),
                (0.09, -9.0, -14.0,  3.5),
                (0.16,-11.0, -16.0,  4.0),
                (0.28,  2.0,  -2.0,  1.0),
                (L4,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.04,   8.0, -28.0,  3.0),
                (0.09, -24.0,  36.0, -4.5),     # Mira hacia arriba siguiendo la punta de diamante!
                (0.16, -26.0,  40.0, -5.0),
                (0.28,  -4.0,  16.0, -1.5),
                (L4,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.04,  34.0,  14.0,  26.0),    # Mano baja cargando el impulso!
                (0.09,-146.0,  28.0, -16.0),    # ¡BRAZO DISPARADO ARRIBA-ADELANTE EN 0.09s (rz=-16 despeja cara)!
                (0.16,-152.0,  30.0, -18.0),
                (0.28, -54.0, -12.0,  20.0),
                (L4,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.04, -0.30, -0.95,  0.65),
                (0.09,  0.25,  1.65, -1.35),
                (0.16,  0.25,  1.75, -1.25),
                (0.28, -0.15,  0.40, -0.55),
                (L4,   *i0["right_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.04, 1.08, 0.88, 1.08),
                (0.09, 0.88, 1.28, 0.88),
                (0.16, 0.95, 1.10, 0.95),
                (0.26, 1.00, 1.00, 1.00),
                (L4,   1.00, 1.00, 1.00),
            ],
        },
        "right_arm_item": {
            # En 0.04s: brazo atrás (+67° mundial) -> `rx=-95°` apunta la lanza ya inclinada arriba (~28°) sin tocar el piso!
            # En 0.09s: brazo arriba (-171° mundial) -> `rx=+96°` clava la lanza a -75° DIRECTO AL CIELO (+Y, +Z)!
            "rotation": [
                (0.00, *g_item),
                (0.04, -96.0, -18.0,  0.0),     # Lista apuntando en diagonal arriba desde abajo (0 clipping)!
                (0.09,  96.0,   0.0,  0.0),     # ¡PUNTA DE DIAMANTE CLAVADA AL CIELO EN 0.09s!
                (0.16, 100.0,   0.0,  0.0),
                (0.28,   4.0,   0.0,  0.0),
                (L4,   *g_item),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.04, 1.00, 1.00, 0.94),
                (0.09, 1.00, 1.00, 1.20),       # Estiramiento vertical de lanza!
                (0.16, 1.00, 1.00, 1.06),
                (L4,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.04, -38.0,  18.0, -22.0),
                (0.09,  46.0,  18.0, -44.0),
                (0.16,  50.0,  20.0, -46.0),
                (0.28,  20.0,  14.0, -20.0),
                (L4,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.09,  0.25, -0.20, 0.75),
                (L4,   *i0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg_pts([
            (0.00, -12.5, 14.0,  6.5, -0.55, -1.40, 0.00),
            (0.04, -26.0, 14.0,  9.5, -0.60, -1.85, 0.00),
            (0.09, -44.0, 10.0,  8.0, -0.45, -1.95, 3.20),  # Rodilla derecha sube impulsando el salto!
            (0.16, -36.0, 10.0,  8.0, -0.48, -1.65, 2.50),
            (0.28, -18.0, 14.0,  8.0, -0.55, -1.65, 0.00),
            (0.34, -15.0, 14.0,  7.2, -0.55, -1.52, 0.00),
            (L4,   -12.5, 14.0,  6.5, -0.55, -1.40, 0.00),
        ]),
        "left_leg": make_leg_pts([
            (0.00,  11.5, -18.0, -9.0,  0.48,  1.30, 0.00),
            (0.04,  24.0, -18.0,-10.5,  0.55,  1.75, 0.00),
            (0.09,  18.0, -12.0, -6.5,  0.38,  0.55, 1.75),  # Despega del suelo!
            (0.16,  14.0, -12.0, -7.0,  0.42,  0.35, 1.30),
            (0.28,  16.0, -18.0, -9.5,  0.50,  1.50, 0.00),
            (0.34,  13.5, -18.0, -9.2,  0.49,  1.40, 0.00),
            (L4,    11.5, -18.0, -9.0,  0.48,  1.30, 0.00),
        ]),
    }
    anims.append(make_anim("M1 4 Arriba", L4, False, bone_uuids, c4u_tracks))
    sample_map["M1 4 Arriba"] = [0.00, 0.04, 0.09, 0.16, 0.28, L4]

    return anims, sample_map


def eval_javi_m1_frame(anim, t):
    """Evalúa los huesos BBS + `right_arm_item` y devuelve tanto `W` como el `frame` exacto de Three.js."""
    W = javi_mod.eval_bbs_world_matrices(anim, t)
    by_name = {b["name"]: b["keyframes"] for b in anim["animators"].values()}
    kfs_item = by_name.get("right_arm_item", [])
    length = anim["length"]
    rot_it = javi_mod.eval_channel_catmull([k for k in kfs_item if k["channel"] == "rotation"], t, length, False) or (0.0, 0.0, 0.0)
    scl_it = javi_mod.eval_channel_catmull([k for k in kfs_item if k["channel"] == "scale"], t, length, False) or (1.0, 1.0, 1.0)
    rot_it_cal = (math.radians(rot_it[0]), -math.radians(rot_it[1]), -math.radians(rot_it[2]))
    M_item_local = javi_mod.mat_trs_zyx((0.0, -10.0, 0.0), rot_it_cal, (1.0, 1.0, 1.0))
    _, r_it_xyz, _ = javi_mod.decompose_xyz(M_item_local)

    T_shift_torso = [[1, 0, 0, 0], [0, 1, 0, -12.0], [0, 0, 1, 0], [0, 0, 0, 1]]
    M_inner = javi_mod.mat_mul(W["low_anchor"], [[1, 0, 0, 0], [0, 1, 0, 16.0], [0, 0, 1, 0], [0, 0, 0, 1]])
    p_in, r_in, s_in = javi_mod.decompose_xyz(M_inner)
    M_inner_inv = javi_mod.mat_inv_rigid_uniform_or_diag(M_inner)

    M_torso_world = javi_mod.mat_mul(W["torso"], T_shift_torso)
    M_torso_local = javi_mod.mat_mul(M_inner_inv, M_torso_world)
    p_tr, r_tr, s_tr = javi_mod.decompose_xyz(M_torso_local)
    M_torso_world_inv = javi_mod.mat_inv_rigid_uniform_or_diag(M_torso_world)

    p_hd, r_hd, s_hd = javi_mod.decompose_xyz(javi_mod.mat_mul(M_torso_world_inv, W["head"]))
    p_ar, r_ar, s_ar = javi_mod.decompose_xyz(javi_mod.mat_mul(M_torso_world_inv, W["right_arm"]))
    p_al, r_al, s_al = javi_mod.decompose_xyz(javi_mod.mat_mul(M_torso_world_inv, W["left_arm"]))
    p_lr, r_lr, s_lr = javi_mod.decompose_xyz(javi_mod.mat_mul(M_inner_inv, W["right_leg"]))
    p_ll, r_ll, s_ll = javi_mod.decompose_xyz(javi_mod.mat_mul(M_inner_inv, W["left_leg"]))

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
        "arpx": p_ar[0] - (-6.0), "arpy": p_ar[1] - 10.0, "arpz": p_ar[2],
        "arx": r_ar[0], "ary": r_ar[1], "arz": r_ar[2], "ars": s_ar[1],
        "sx": r_it_xyz[0], "sy": r_it_xyz[1], "sz": r_it_xyz[2], "ssc": scl_it[2],
        "alpx": p_al[0] - 6.0, "alpy": p_al[1] - 10.0, "alpz": p_al[2],
        "alx": r_al[0], "aly": r_al[1], "alz": r_al[2], "als": s_al[1],
        "lrpx": p_lr[0] - (-2.0), "lrpy": p_lr[1] - (-4.0), "lrpz": p_lr[2],
        "lrx": r_lr[0], "lry": r_lr[1], "lrz": r_lr[2], "lrs": s_lr[1],
        "llpx": p_ll[0] - 2.0, "llpy": p_ll[1] - (-4.0), "llpz": p_ll[2],
        "llx": r_ll[0], "lly": r_ll[1], "llz": r_ll[2], "lls": s_ll[1],
    }
    return W, frame


def compile_javi_combat_clip(anim, contacts):
    length = anim["length"]
    n_samples = int(round(length * 120)) + 1
    times = sorted(set([round(min(length, i / 120.0), 6) for i in range(n_samples)] + [round(c, 6) for c in contacts] + [round(length, 6)]))
    all_frames = [(t, eval_javi_m1_frame(anim, t)[1]) for t in times]

    defaults = {
        "alz": 0.06, "arz": -0.06,
        "als": 1.0, "ars": 1.0, "lls": 1.0, "lrs": 1.0,
        "tscx": 1.0, "tscy": 1.0, "tscz": 1.0,
        "hscx": 1.0, "hscy": 1.0, "hscz": 1.0,
        "bsx": 1.0, "bsy": 1.0, "bsz": 1.0,
        "ssc": 1.0,
    }
    chans = sorted(k for k in all_frames[0][1].keys() if any(abs(fr[k] - defaults.get(k, 0.0)) > 1e-4 for _, fr in all_frames))
    angle_chans = {"ix", "iy", "iz", "tx", "ty", "tz", "hx", "hy", "hz", "alx", "aly", "alz", "arx", "ary", "arz", "llx", "lly", "llz", "lrx", "lry", "lrz", "sx", "sy", "sz"}
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


def render_javi_m1_sheet(anims, key_times, out_path):
    """Renderiza las 5 filas de M1 de Javicubito incluyendo la LANZA 3D EN LA MANO (`m.gripRot`) exacta de Three.js!"""
    cols = max(len(v) for v in key_times.values())
    cell_w, cell_h = 228, 224
    img = Image.new("RGB", (cols * cell_w, len(anims) * cell_h), (14, 18, 26))
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
            draw.line([(g1[0], g1[1]), (g2[0], g2[1])], fill=(58, 66, 86), width=1)
            draw.line([(g3[0], g3[1]), (g4[0], g4[1])], fill=(48, 86, 78), width=1)

            W, fr = eval_javi_m1_frame(anim, t)
            polys = []
            min_foot_y = 999.0

            for bname, bmin, bmax, base_col in javi_mod.PARTS_BOXES:
                M = W[bname]
                x0, y0, z0 = bmin
                x1, y1, z1 = bmax
                corners_local = [
                    (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
                    (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
                ]
                corners_w = [javi_mod.mat_vec(M, c) for c in corners_local]
                if "leg" in bname:
                    min_foot_y = min(min_foot_y, min(c[1] for c in corners_w))
                corners_p = [proj(c, cx, floor_y) for c in corners_w]
                for idxs, _, shade_k in javi_mod.FACE_QUADS:
                    pts2d = [(corners_p[k][0], corners_p[k][1]) for k in idxs]
                    ax, ay = pts2d[1][0] - pts2d[0][0], pts2d[1][1] - pts2d[0][1]
                    bx, by = pts2d[2][0] - pts2d[0][0], pts2d[2][1] - pts2d[0][1]
                    if ax * by - ay * bx >= 0:
                        continue
                    depth = sum(corners_p[k][2] for k in idxs) / 4.0
                    col = tuple(max(0, min(255, int(c * shade_k))) for c in base_col)
                    if bname == "head" and idxs == [0, 1, 2, 3]:
                        col = (115, 194, 255)
                    polys.append((depth, pts2d, col))

            polys.sort(key=lambda item: item[0])
            for _, pts2d, col in polys:
                draw.polygon(pts2d, fill=col, outline=(12, 14, 22))

            # Reconstrucción exacta de `m.gripRot` en Three.js para dibujar la lanza en mano (`z=-11..+26`):
            M_in = mat_euler_xyz(fr["ix"], fr["iy"], fr["iz"], fr["bx"], 16.0 + fr["by"], fr["bz"], fr["bsx"], fr["bsy"], fr["bsz"])
            M_tr = javi_mod.mat_mul(M_in, mat_euler_xyz(fr["tx"], fr["ty"], fr["tz"], fr["tpx"], -4.0 + fr["tpy"], fr["tpz"], fr["tscx"], fr["tscy"], fr["tscz"]))
            M_ar = javi_mod.mat_mul(M_tr, mat_euler_xyz(fr["arx"], fr["ary"], fr["arz"], -6.0 + fr["arpx"], 10.0 + fr["arpy"], fr["arpz"], 1.0, fr["ars"], 1.0))
            M_hand = javi_mod.mat_mul(M_ar, [[1, 0, 0, 0], [0, 1, 0, -10.0], [0, 0, 1, 0], [0, 0, 0, 1]])
            ws = fr["ssc"]
            M_grip = javi_mod.mat_mul(M_hand, mat_euler_xyz(fr["sx"], fr["sy"], fr["sz"], 0.0, 0.0, 0.0, 1.0, 1.0, ws))

            sp_butt = javi_mod.mat_vec(M_grip, (0.0, 0.0, -11.0))
            sp_guard = javi_mod.mat_vec(M_grip, (0.0, 0.0, 17.0))
            sp_tip = javi_mod.mat_vec(M_grip, (0.0, 0.0, 26.0))
            min_sp_y = min(sp_butt[1], sp_tip[1])

            p_butt = proj(sp_butt, cx, floor_y)
            p_guard = proj(sp_guard, cx, floor_y)
            p_tip = proj(sp_tip, cx, floor_y)
            draw.line([(p_butt[0], p_butt[1]), (p_guard[0], p_guard[1])], fill=(156, 108, 62), width=3)
            draw.line([(p_guard[0], p_guard[1]), (p_tip[0], p_tip[1])], fill=(88, 245, 232), width=5)
            draw.ellipse([p_tip[0] - 3, p_tip[1] - 3, p_tip[0] + 3, p_tip[1] + 3], fill=(224, 255, 251), outline=(22, 90, 96))

            if col_idx == 0:
                draw.text((col_idx * cell_w + 6, row_idx * cell_h + 4), anim["name"], fill=(240, 245, 255))
            draw.text(
                (col_idx * cell_w + 6, row_idx * cell_h + cell_h - 16),
                f"{t:.2f}s y0={min_foot_y:+.1f} spY={min_sp_y:+.1f}",
                fill=(165, 185, 215) if min_sp_y >= -0.5 else (255, 110, 110),
            )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


def main():
    model, _ = javi_mod.build_clean_base_model()
    uuids = javi_mod.collect_bone_uuids(model["outliner"])
    mov_anims = javi_mod.author_all_animations(uuids)
    voz_anims, _, _ = voice_mod.author_javi_voice_idles(uuids)
    m1_anims, sample_map = author_javi_m1(uuids)

    model["animations"] = mov_anims + voz_anims + m1_anims
    javi_mod.OUT_DIR.mkdir(parents=True, exist_ok=True)
    javi_mod.OUT_BBMODEL.write_text(json.dumps(model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Guardado {javi_mod.OUT_BBMODEL} ({len(model['animations'])} animaciones: 10 mov + 3 voz + 5 M1)")

    sheet_path = SCRATCH / "javicubito_m1_sheet.png"
    render_javi_m1_sheet(m1_anims, sample_map, sheet_path)
    print(f"Vista previa M1 Javicubito (con lanza 3D): {sheet_path}")

    if "--apply-html" in sys.argv:
        by_name = {a["name"]: a for a in m1_anims}
        html_path = REPO / "index.html"
        html = html_path.read_text(encoding="utf-8")
        pat = re.compile(r"(/\* JAVI_BLOCKBENCH_DATA_BEGIN \*/\s*const JAVI_BB_DATA = )(\{.*?\})(;\s*/\* JAVI_BLOCKBENCH_DATA_END \*/)", re.S)
        m = pat.search(html)
        assert m, "No se encontró JAVI_BB_DATA en index.html"
        data = json.loads(m.group(2))
        data["combo_1"] = compile_javi_combat_clip(by_name["M1 1"], [0.07])
        data["combo_2"] = compile_javi_combat_clip(by_name["M1 2"], [0.07])
        data["combo_3"] = compile_javi_combat_clip(by_name["M1 3"], [0.07])
        data["combo_4"] = compile_javi_combat_clip(by_name["M1 4"], [0.09])
        data["combo_4_arriba"] = compile_javi_combat_clip(by_name["M1 4 Arriba"], [0.09])
        ser = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        html_path.write_text(html[:m.start()] + m.group(1) + ser + m.group(3) + html[m.end():], encoding="utf-8")
        print("¡SUBIDO AL TIRO! JAVI_BB_DATA actualizado en index.html con combo_1..4 + combo_4_arriba.")


if __name__ == "__main__":
    main()
