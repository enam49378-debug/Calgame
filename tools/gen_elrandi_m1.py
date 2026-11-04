# -*- coding: utf-8 -*-
"""
Generador de las 5 animaciones de combate básico (M1) en estilo Actions & Stuff
(cartoon/anime con anticipación, smear de impacto en el milisegundo exacto del
hitbox y seguimiento elástico) para ElRandi ("Invocador del Perú"):
  - `M1 1`        -> `combo_1`        (dur=0.26s, hit=0.07s, corte der->izq)
  - `M1 2`        -> `combo_2`        (dur=0.26s, hit=0.07s, corte izq->der)
  - `M1 3`        -> `combo_3`        (dur=0.26s, hit=0.07s, gancho amplio Tinku)
  - `M1 4`        -> `combo_4`        (dur=0.40s, hit=0.09s, patada roundhouse anime)
  - `M1 4 Arriba` -> `combo_4_arriba` (dur=0.40s, hit=0.09s, uppercut ascendente)
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

import gen_elrandi_movement as randi_mod
import gen_voice_idles as voice_mod

REPO = TOOLS_DIR.parent
SCRATCH = Path(r"C:\Users\jesul\.gemini\antigravity\brain\c20a7088-7590-4809-ab1d-f3e04deaa0b7\scratch")


def make_leg_pts(spec):
    """`spec` usa tiempos exactos en segundos `(t_s, rx, ry, rz, px, pz, lift_y)`."""
    rot, pos = [], []
    for t_s, rx, ry, rz, px, pz, lift_y in spec:
        py = randi_mod.leg_py_for_clearance(rx, ry, rz, lift_y)
        rot.append((round(t_s, 5), rx, ry, rz))
        pos.append((round(t_s, 5), px, py, pz))
    return {"rotation": rot, "position": pos}


def author_randi_m1(bone_uuids):
    i0 = voice_mod.randi_idle0()
    make_anim = randi_mod.make_bb_anim
    anims = []
    sample_map = {}

    # -------------------------------------------------------------------------
    # 1. M1 1 (`combo_1`, len=0.26s, hit=0.07s) — Directo / Palma Jujutsu Derecha
    # Carga el hombro derecho atrás (0.03s) -> dispara el torso y el brazo der
    # al frente-cruzado a las 0.07s con smear (`scale.y=1.24`)!
    # -------------------------------------------------------------------------
    L1 = 0.26
    c1_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.03, 1.055, 0.920, 1.055),    # Compresión explosiva de carga
                (0.07, 0.925, 1.065, 1.095),    # Impacto proyectado adelante!
                (0.12, 0.965, 1.025, 1.045),
                (0.20, 1.015, 0.980, 1.015),
                (L1,   0.995, 1.008, 0.995),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.03, 12.0,  32.0, -5.0),      # Arma cadera derecha atrás!
                (0.07, 18.0, -26.0,  5.0),      # Latigazo de cadera adelantando hombro der!
                (0.11, 20.0, -32.0,  6.0),      # Overshoot cartoon de impacto
                (0.19, 14.0, -16.0,  2.5),      # Lista para encadenar M1 2!
                (L1,    8.0,   4.0, -1.0),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.03, -0.45, -1.15,  0.55),
                (0.07,  0.20, -0.65, -2.05),    # Avance contundente hacia +Z!
                (0.11,  0.25, -0.75, -2.25),
                (0.19,  0.10, -0.55, -1.10),
                (L1,   -0.10, -0.15, -0.35),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.03,  2.0,  14.0, -2.0),
                (0.07,  4.0, -14.0,  3.0),
                (0.11,  5.0, -18.0,  3.5),
                (0.19,  2.0,  -8.0,  1.5),
                (L1,    0.0,  -4.0,  0.0),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.03,  -4.0, -32.0,  3.5),
                (0.07, -12.0,  36.0, -5.0),     # Contragiro manteniendo ojos clavados al frente (+Z)!
                (0.11, -14.0,  44.0, -5.5),
                (0.19,  -8.0,  20.0, -2.5),
                (L1,    -2.0,  -2.0,  0.5),
            ],
        },
        "right_arm": {
            # Torso yaw en 0.07s = -40° -> ry=+34° alinea el puño directo al rival (yaw mundial -6° -> -22°)!
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.03,  42.0,  18.0,  36.0),    # Codo derecho bien atrás cargando!
                (0.07,-110.0,  34.0,   6.0),    # ¡PUÑETAZO / PALMA RECTA AL FRENTE EN 0.07s!
                (0.11,-112.0,  24.0,  -4.0),    # Cruza der->izq (dir=1) en overshoot!
                (0.19, -72.0,  10.0,  12.0),
                (L1,   -42.0, -14.0,  16.0),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.03, -0.35,  0.20,  1.15),
                (0.07,  0.45,  0.55, -2.05),    # Hombro proyectado directo al rival!
                (0.11,  0.65,  0.50, -2.15),
                (0.19,  0.25,  0.30, -0.95),
                (L1,    0.05,  0.30, -0.25),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.06, 0.90, 1.06),
                (0.07, 0.90, 1.26, 0.90),       # Smear anime en el frame exacto de impacto!
                (0.12, 0.96, 1.08, 0.96),
                (0.19, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.03, -76.0,  28.0, -14.0),    # Mano guía mide al rival
                (0.07,  42.0,  12.0, -34.0),    # Tira fuerte atrás por acción-reacción!
                (0.11,  48.0,  14.0, -38.0),
                (0.19, -28.0,  18.0, -20.0),
                (L1,   -52.0,  24.0, -12.0),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.03,  0.20, 0.45, -0.95),
                (0.07,  0.15, 0.25,  0.85),
                (0.19,  0.15, 0.30, -0.25),
                (L1,    0.15, 0.38, -0.55),
            ],
        },
        "left_leg": make_leg_pts([
            (0.00, -11.0, -12.0, -6.0,  0.60, -1.35, 0.0),
            (0.03,  -6.0, -12.0, -8.0,  0.50, -0.95, 0.0),
            (0.07, -26.0, -10.0, -8.5,  0.55, -2.35, 0.0),  # Paso firme adelante!
            (0.12, -28.0, -10.0, -9.0,  0.55, -2.45, 0.0),
            (0.19, -20.0, -11.0, -8.0,  0.57, -1.95, 0.0),
            (L1,   -15.0, -12.0, -7.0,  0.58, -1.65, 0.0),
        ]),
        "right_leg": make_leg_pts([
            (0.00,  10.0,  16.0,  8.5, -0.50,  1.25, 0.0),
            (0.03,  18.0,  16.0, 10.0, -0.60,  1.65, 0.0),
            (0.07,  30.0,  12.0,  8.0, -0.45,  1.95, 0.0),  # Empuja desde atrás!
            (0.12,  32.0,  12.0,  8.0, -0.45,  2.05, 0.0),
            (0.19,  21.0,  14.0,  8.2, -0.48,  1.68, 0.0),
            (L1,    14.0,  16.0,  8.5, -0.50,  1.40, 0.0),
        ]),
    }
    anims.append(make_anim("M1 1", L1, False, bone_uuids, c1_tracks))
    sample_map["M1 1"] = [0.00, 0.03, 0.07, 0.11, 0.19, L1]

    # -------------------------------------------------------------------------
    # 2. M1 2 (`combo_2`, len=0.26s, hit=0.07s) — Golpe Cruzado Izquierdo de Sombra
    # Parte desde el giro previo y desata un latigazo de izquierda (`dir=-1` izq->der)!
    # -------------------------------------------------------------------------
    c2_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, 0.995, 1.008, 0.995),
                (0.03, 1.058, 0.918, 1.058),
                (0.07, 0.922, 1.068, 1.100),
                (0.12, 0.965, 1.025, 1.045),
                (0.20, 1.015, 0.980, 1.015),
                (L1,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00,  10.0, -16.0,  2.5),
                (0.03,  14.0, -30.0,  5.0),     # Carga hombro izquierdo atrás!
                (0.07,  19.0,  28.0, -5.0),     # ¡Giro explosivo proyectando hombro izquierdo!
                (0.11,  21.0,  34.0, -6.0),
                (0.19,  14.0,  22.0, -3.5),
                (L1,    *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00,  0.10, -0.35, -0.45),
                (0.03,  0.40, -1.15,  0.45),
                (0.07, -0.25, -0.65, -2.05),
                (0.11, -0.30, -0.75, -2.25),
                (0.19, -0.25, -0.45, -0.95),
                (L1,    *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00,  1.0,  -8.0,  1.0),
                (0.03,  2.0, -14.0,  2.5),
                (0.07,  4.0,  14.0, -3.0),
                (0.11,  5.0,  18.0, -3.5),
                (0.19,  2.0,   8.0, -1.5),
                (L1,    *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00,  -4.0,  16.0, -2.0),
                (0.03,  -4.0,  30.0, -3.5),
                (0.07, -12.0, -38.0,  5.0),     # Ojos fijos en el rival (+Z)!
                (0.11, -14.0, -46.0,  5.5),
                (0.19,  -6.0, -24.0,  3.0),
                (L1,    *i0["head"]["rotation"]),
            ],
        },
        "left_arm": {
            # Torso yaw en 0.07s = +42° -> ry=-34° alinea el puño directo al rival (yaw mundial +8° -> +26°)!
            "rotation": [
                (0.00, -32.0,  18.0, -16.0),
                (0.03,  42.0, -18.0, -36.0),    # Carga brazo izq atrás!
                (0.07,-112.0, -34.0,  -6.0),    # ¡IMPACTO IZQUIERDO RECTO AL RIVAL EN 0.07s!
                (0.11,-114.0, -22.0,   6.0),    # Cruza izq->der (dir=-1)!
                (0.19, -68.0,   8.0, -12.0),
                (L1,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00,  0.15, 0.35, -0.45),
                (0.03,  0.35, 0.20,  1.15),
                (0.07, -0.45, 0.55, -2.05),
                (0.11, -0.65, 0.50, -2.15),
                (0.19, -0.15, 0.38, -1.00),
                (L1,   *i0["left_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.06, 0.90, 1.06),
                (0.07, 0.90, 1.26, 0.90),       # Smear de brazo izquierdo!
                (0.12, 0.96, 1.08, 0.96),
                (0.19, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "right_arm": {
            "rotation": [
                (0.00, -48.0, -14.0, 16.0),
                (0.03, -68.0, -24.0, 14.0),
                (0.07,  42.0, -14.0, 34.0),     # Latigazo atrás equilibrando!
                (0.11,  48.0, -16.0, 38.0),
                (0.19,  -8.0, -14.0, 22.0),
                (L1,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00,  0.05, 0.30, -0.35),
                (0.07, -0.15, 0.25,  0.85),
                (0.19,  0.00, 0.30,  0.25),
                (L1,   *i0["right_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_pts([
            (0.00, -14.0, -12.0, -7.0,  0.58, -1.55, 0.0),
            (0.03, -10.0, -12.0, -8.0,  0.55, -1.25, 0.0),
            (0.07, -28.0, -12.0, -9.0,  0.60, -2.45, 0.0),
            (0.12, -30.0, -12.0, -9.5,  0.60, -2.55, 0.0),
            (0.19, -19.0, -12.0, -7.5,  0.60, -1.90, 0.0),
            (L1,   -11.0, -12.0, -6.0,  0.60, -1.35, 0.0),
        ]),
        "right_leg": make_leg_pts([
            (0.00,  13.0,  16.0,  8.5, -0.50,  1.35, 0.0),
            (0.03,  16.0,  16.0,  9.5, -0.55,  1.50, 0.0),
            (0.07,  32.0,  14.0,  8.0, -0.45,  2.10, 0.0),
            (0.12,  34.0,  14.0,  8.0, -0.45,  2.20, 0.0),
            (0.19,  20.0,  15.0,  8.2, -0.48,  1.65, 0.0),
            (L1,    10.0,  16.0,  8.5, -0.50,  1.25, 0.0),
        ]),
    }
    anims.append(make_anim("M1 2", L1, False, bone_uuids, c2_tracks))
    sample_map["M1 2"] = [0.00, 0.03, 0.07, 0.11, 0.19, L1]

    # -------------------------------------------------------------------------
    # 3. M1 3 (`combo_3`, len=0.26s, hit=0.07s) — Gancho Amplio Tinku (Derecha)
    # Agachada pesada -> barrido circular horizontal de puño derecho (`dir=1, len=2.9`)
    # con torsión máxima de torso para preparar la patada final de M1 4!
    # -------------------------------------------------------------------------
    c3_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.03, 1.075, 0.895, 1.075),    # Se planta pesado estilo duelo Tinku!
                (0.07, 1.060, 0.935, 1.080),    # Barrido horizontal ancho!
                (0.12, 1.030, 0.965, 1.040),
                (0.20, 1.005, 0.992, 1.005),
                (L1,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.03, 18.0,  42.0, -8.0),      # Torsión amplia hacia atrás-derecha!
                (0.07, 22.0, -28.0,  6.5),      # ¡GANCHO CIRCULAR EN EL FRAME 0.07s!
                (0.12, 24.0, -44.0,  9.5),      # Gran seguimiento circular!
                (0.20, 16.0, -18.0,  4.0),
                (L1,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.03, -0.65, -1.85,  0.65),
                (0.07,  0.35, -1.25, -2.15),
                (0.12,  0.65, -1.45, -2.25),
                (0.20,  0.25, -0.85, -0.95),
                (L1,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.03,  4.0,  20.0, -4.0),
                (0.07,  5.0, -18.0,  4.0),
                (0.12,  6.5, -26.0,  5.5),
                (0.20,  3.0, -10.0,  2.0),
                (L1,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.03,  -8.0, -42.0,  6.0),
                (0.07, -13.0,  42.0, -6.5),
                (0.12, -15.0,  56.0, -8.0),
                (0.20,  -6.0,  22.0, -3.0),
                (L1,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            # En 0.07s pasa por yaw mundial ~-8° (pleno rostro del rival) y barre hasta -55° en 0.12s!
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.03, -38.0,  26.0,  72.0),    # Abre el brazo derecho ancho al costado cargando el hook!
                (0.07,-112.0,  38.0,  16.0),    # ¡Impacta de lleno al frente (+Z) en arco horizontal!
                (0.12,-110.0,  12.0, -18.0),    # Barre cruzando hasta el costado izquierdo en follow-through!
                (0.20, -60.0,   4.0,   8.0),
                (L1,   *i0["right_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["right_arm"]["position"]),
                (0.03, -0.85, 0.65,  0.65),
                (0.07,  0.65, 0.65, -1.85),
                (0.12,  1.25, 0.55, -1.55),
                (0.20,  0.40, 0.35, -0.65),
                (L1,   *i0["right_arm"]["position"]),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.03, 1.08, 0.88, 1.08),
                (0.07, 0.88, 1.28, 0.88),       # Smear potente de gancho Tinku!
                (0.12, 0.95, 1.10, 0.95),
                (0.20, 1.00, 1.00, 1.00),
                (L1,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.03, -64.0,  24.0, -24.0),
                (0.07,  46.0,  16.0, -44.0),
                (0.12,  54.0,  20.0, -48.0),
                (0.20, -24.0,  20.0, -22.0),
                (L1,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.07,  0.30, 0.35,  0.85),
                (0.20,  0.20, 0.35, -0.25),
                (L1,   *i0["left_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_pts([
            (0.00, -11.0, -12.0,  -6.0,  0.60, -1.35, 0.0),
            (0.03, -18.0, -14.0, -12.0,  0.85, -1.55, 0.0),
            (0.07, -30.0, -12.0, -14.0,  1.05, -2.55, 0.0),
            (0.12, -32.0, -12.0, -15.0,  1.10, -2.65, 0.0),
            (0.20, -20.0, -12.0, -10.0,  0.82, -1.95, 0.0),
            (L1,   -11.0, -12.0,  -6.0,  0.60, -1.35, 0.0),
        ]),
        "right_leg": make_leg_pts([
            (0.00,  10.0,  16.0,  8.5, -0.50,  1.25, 0.0),
            (0.03,  22.0,  18.0, 14.0, -0.85,  1.75, 0.0),
            (0.07,  34.0,  14.0, 12.0, -0.65,  2.15, 0.0),
            (0.12,  36.0,  14.0, 12.0, -0.65,  2.25, 0.0),
            (0.20,  22.0,  15.0, 10.0, -0.56,  1.70, 0.0),
            (L1,    10.0,  16.0,  8.5, -0.50,  1.25, 0.0),
        ]),
    }
    anims.append(make_anim("M1 3", L1, False, bone_uuids, c3_tracks))
    sample_map["M1 3"] = [0.00, 0.03, 0.07, 0.12, 0.20, L1]

    # -------------------------------------------------------------------------
    # 4. M1 4 (`combo_4`, len=0.40s, hit=0.09s) — Patada Giratoria Anime (Remate!)
    # El remate manda a volar al rival (`kb=17, ragdoll=1.0`)! Planta firme la
    # pierna izquierda y suelta un latigazo de pierna derecha alta a la cabeza
    # (`rx=-116°`) inclinando el torso atrás como contrapeso marcial anime!
    # -------------------------------------------------------------------------
    L4 = 0.40
    g_r0 = randi_mod.leg_py_for_clearance(10.0, 16.0, 8.5, 0.0)
    g_r1 = randi_mod.leg_py_for_clearance(30.0, 22.0, 14.0, 0.4)
    g_r4 = randi_mod.leg_py_for_clearance(16.0, 16.0, 10.0, 0.0)
    g_r5 = randi_mod.leg_py_for_clearance(13.0, 16.0, 9.2, 0.0)
    c4_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.04, 1.075, 0.880, 1.075),    # Carga profunda antes de patear!
                (0.09, 0.925, 1.085, 0.955),    # Extensión explosiva de patada en 0.09s!
                (0.15, 0.960, 1.045, 0.975),
                (0.28, 1.045, 0.938, 1.045),    # Amortigua al clavar el pie de vuelta!
                (L4,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.04,  18.0, -28.0,   5.0),    # Carga girando torso!
                (0.09, -22.0,  28.0,  18.0),    # Contrarrotación Muay Thai/Taekwondo despejando la patada!
                (0.15, -24.0,  34.0,  20.0),    # Hang-time heroico del remate!
                (0.28,  14.0,   8.0,  -3.5),    # Baja el pie con peso
                (L4,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.04, -0.35, -2.10,  0.35),
                (0.09,  0.95,  0.35,  0.45),
                (0.15,  1.05,  0.25,  0.55),
                (0.28, -0.25, -1.45, -0.15),
                (L4,   *i0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (0.00, *i0["body"]["rotation"]),
                (0.04,  4.0, -12.0,  2.0),
                (0.09, -6.0,  14.0,  5.0),
                (0.15, -7.0,  18.0,  6.0),
                (0.28,  3.0,  -4.0, -1.0),
                (L4,   *i0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (0.00, *i0["head"]["rotation"]),
                (0.04,  -6.0,  24.0,  -3.0),
                (0.09,  16.0, -36.0, -14.0),    # Ojos clavados al frente mientras el torso contrarrota!
                (0.15,  18.0, -42.0, -16.0),
                (0.28,  -4.0, -10.0,   2.0),
                (L4,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            # Brazo derecho lanza latigazo atrás-abajo despejando 100% la silueta de la patada!
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.04, -72.0, -20.0, 18.0),
                (0.09,  56.0,  14.0, 32.0),
                (0.15,  62.0,  18.0, 36.0),
                (0.28, -32.0, -14.0, 22.0),
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
            # Guardia anime cruzada frente al pecho durante la patada alta
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.04, -42.0, 20.0, -24.0),
                (0.09, -84.0, 38.0, -24.0),
                (0.15, -88.0, 42.0, -26.0),
                (0.28, -48.0, 22.0, -16.0),
                (L4,   *i0["left_arm"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["left_arm"]["position"]),
                (0.09,  0.35, 0.65, -0.85),
                (L4,   *i0["left_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_pts([
            # Pierna izquierda pivota clavada al suelo soportando toda la patada!
            (0.00, -11.0, -12.0, -6.0,  0.60, -1.35, 0.0),
            (0.04, -22.0, -16.0,-10.0,  0.65, -1.65, 0.0),
            (0.09,   6.0, -28.0, -8.0,  0.85, -0.55, 0.0),
            (0.15,   8.0, -32.0, -9.0,  0.90, -0.45, 0.0),
            (0.28, -16.0, -14.0, -8.0,  0.65, -1.55, 0.0),
            (L4,   -11.0, -12.0, -6.0,  0.60, -1.35, 0.0),
        ]),
        "right_leg": {
            # ¡LATIGAZO DE PATADA ALTA A LA CABEZA A LAS 0.09s CON CADERA CONECTADA Y SMEAR `lrs`!
            "rotation": [
                (0.00,  10.0,  16.0,   8.5),
                (0.04,  30.0,  22.0,  14.0),     # Arma la pierna atrás
                (0.09,-116.0, -24.0, -18.0),     # ¡PATADA ROUNDHOUSE ALTA EN DIAGONAL A LAS 0.09s!
                (0.15,-122.0, -36.0, -24.0),     # Cruza el arco completo!
                (0.22, -48.0,   4.0,  12.0),
                (0.28,  16.0,  16.0,  10.0),     # Clava pie atrás firme!
                (0.34,  13.0,  16.0,   9.2),
                (L4,    10.0,  16.0,   8.5),
            ],
            "position": [
                (0.00, -0.50,  g_r0,  1.25),
                (0.04, -0.85,  g_r1,  1.95),
                (0.09,  0.25,  1.15, -1.65),     # Pivote unido a la pelvis mientras patea alto!
                (0.15,  0.55,  1.25, -1.85),
                (0.22, -0.25,  0.65, -0.35),
                (0.28, -0.55,  g_r4,  1.45),
                (0.34, -0.52,  g_r5,  1.35),
                (L4,   -0.50,  g_r0,  1.25),
            ],
            "scale": [
                (0.00, 1.00, 1.00, 1.00),
                (0.04, 1.06, 0.90, 1.06),
                (0.09, 0.88, 1.28, 0.88),        # Smear brutal de pierna en el impacto!
                (0.15, 0.94, 1.12, 0.94),
                (0.25, 1.00, 1.00, 1.00),
                (L4,   1.00, 1.00, 1.00),
            ],
        },
    }
    anims.append(make_anim("M1 4", L4, False, bone_uuids, c4_tracks))
    sample_map["M1 4"] = [0.00, 0.04, 0.09, 0.15, 0.28, L4]

    # -------------------------------------------------------------------------
    # 5. M1 4 ARRIBA (`combo_4_arriba`, len=0.40s, hit=0.09s) — Uppercut Rompecielos
    # Lanzador vertical (`up=15`): agachada profunda (0.04s) y disparo vertical
    # elevándose del suelo con gancho ascendente derecho (`rx=-152°` + smear)!
    # -------------------------------------------------------------------------
    c4u_tracks = {
        "low_anchor": {
            "scale": [
                (0.00, *i0["low_anchor"]["scale"]),
                (0.04, 1.100, 0.825, 1.100),    # Squash profundo cargando el resorte!
                (0.09, 0.875, 1.190, 0.875),    # ¡STRETCH VERTICAL EXPLOSIVO EN 0.09s!
                (0.16, 0.945, 1.080, 0.945),
                (0.28, 1.055, 0.920, 1.055),    # Aterrizaje amortiguado
                (L4,   *i0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (0.00, *i0["low_body"]["rotation"]),
                (0.04,  28.0,  32.0, -6.0),     # Agachado cargando hombro der abajo!
                (0.09, -16.0, -28.0,  6.5),     # ¡Torso proyectado al cielo!
                (0.16, -18.0, -34.0,  7.5),
                (0.28,  12.0,   8.0, -2.5),
                (L4,   *i0["low_body"]["rotation"]),
            ],
            "position": [
                (0.00, *i0["low_body"]["position"]),
                (0.04, -0.45, -3.45,  0.45),
                (0.09,  0.35,  2.35, -1.35),    # Despega levemente con la fuerza del uppercut!
                (0.16,  0.40,  1.95, -1.45),
                (0.28, -0.20, -1.55, -0.25),
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
                (0.04,  10.0, -24.0,  3.0),
                (0.09, -22.0,  28.0, -4.5),     # Mira arriba siguiendo al rival lanzado!
                (0.16, -24.0,  32.0, -5.0),
                (0.28,  -2.0, -10.0,  1.5),
                (L4,   *i0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (0.00, *i0["right_arm"]["rotation"]),
                (0.04,  38.0,  14.0,  28.0),    # Puño baja casi rozando la rodilla!
                (0.09,-150.0,  10.0, -16.0),    # ¡UPPERCUT AL CIELO EN 0.09s (rz=-16 despeja cara)!
                (0.16,-158.0,  12.0, -20.0),    # Máxima extensión arriba!
                (0.28, -56.0, -16.0,  18.0),
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
                (0.09, 0.88, 1.30, 0.88),       # Smear vertical de uppercut!
                (0.16, 0.95, 1.10, 0.95),
                (0.26, 1.00, 1.00, 1.00),
                (L4,   1.00, 1.00, 1.00),
            ],
        },
        "left_arm": {
            "rotation": [
                (0.00, *i0["left_arm"]["rotation"]),
                (0.04, -36.0,  18.0, -24.0),
                (0.09,  44.0,  18.0, -42.0),    # Tira abajo-atrás potenciando el ascenso!
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
            (0.00, -11.0, -12.0, -6.0,  0.60, -1.35, 0.00),
            (0.04, -28.0, -12.0, -9.0,  0.60, -1.85, 0.00),
            (0.09,  18.0,  -8.0, -5.0,  0.35,  0.45, 1.85),  # Se eleva del suelo en el uppercut!
            (0.16,  12.0,  -8.0, -6.0,  0.40,  0.15, 1.35),
            (0.28, -18.0, -12.0, -8.5,  0.60, -1.65, 0.00),
            (0.34, -14.0, -12.0, -7.0,  0.60, -1.50, 0.00),
            (L4,   -11.0, -12.0, -6.0,  0.60, -1.35, 0.00),
        ]),
        "right_leg": make_leg_pts([
            (0.00,  10.0,  16.0,  8.5, -0.50,  1.25, 0.00),
            (0.04,  26.0,  16.0, 11.0, -0.60,  1.75, 0.00),
            (0.09, -46.0,  10.0,  8.0, -0.35, -1.95, 3.40),  # Rodilla derecha sube impulsando el gancho!
            (0.16, -38.0,  10.0,  8.0, -0.40, -1.65, 2.65),
            (0.28,  15.0,  16.0,  9.5, -0.55,  1.45, 0.00),
            (0.34,  12.5,  16.0,  9.0, -0.52,  1.35, 0.00),
            (L4,    10.0,  16.0,  8.5, -0.50,  1.25, 0.00),
        ]),
    }
    anims.append(make_anim("M1 4 Arriba", L4, False, bone_uuids, c4u_tracks))
    sample_map["M1 4 Arriba"] = [0.00, 0.04, 0.09, 0.16, 0.28, L4]

    return anims, sample_map


def compile_combat_clip(mod, anim, contacts):
    """Compila el clip a 120fps + puntos exactos de contacto para máxima nitidez en combates de 0.26s."""
    length = anim["length"]
    n_samples = int(round(length * 120)) + 1
    times = sorted(set([round(min(length, i / 120.0), 6) for i in range(n_samples)] + [round(c, 6) for c in contacts] + [round(length, 6)]))
    T_shift_torso = [[1, 0, 0, 0], [0, 1, 0, -12.0], [0, 0, 1, 0], [0, 0, 0, 1]]

    all_frames = []
    for t in times:
        W = mod.eval_bbs_world_matrices(anim, t)
        M_inner = mod.mat_mul(W["low_anchor"], [[1, 0, 0, 0], [0, 1, 0, 16.0], [0, 0, 1, 0], [0, 0, 0, 1]])
        p_in, r_in, s_in = mod.decompose_xyz(M_inner)
        M_inner_inv = mod.mat_inv_rigid_uniform_or_diag(M_inner)

        M_torso_world = mod.mat_mul(W["torso"], T_shift_torso)
        M_torso_local = mod.mat_mul(M_inner_inv, M_torso_world)
        p_tr, r_tr, s_tr = mod.decompose_xyz(M_torso_local)
        M_torso_world_inv = mod.mat_inv_rigid_uniform_or_diag(M_torso_world)

        p_hd, r_hd, s_hd = mod.decompose_xyz(mod.mat_mul(M_torso_world_inv, W["head"]))
        p_ar, r_ar, s_ar = mod.decompose_xyz(mod.mat_mul(M_torso_world_inv, W["right_arm"]))
        p_al, r_al, s_al = mod.decompose_xyz(mod.mat_mul(M_torso_world_inv, W["left_arm"]))
        p_lr, r_lr, s_lr = mod.decompose_xyz(mod.mat_mul(M_inner_inv, W["right_leg"]))
        p_ll, r_ll, s_ll = mod.decompose_xyz(mod.mat_mul(M_inner_inv, W["left_leg"]))

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
            "alpx": p_al[0] - 6.0, "alpy": p_al[1] - 10.0, "alpz": p_al[2],
            "alx": r_al[0], "aly": r_al[1], "alz": r_al[2], "als": s_al[1],
            "lrpx": p_lr[0] - (-2.0), "lrpy": p_lr[1] - (-4.0), "lrpz": p_lr[2],
            "lrx": r_lr[0], "lry": r_lr[1], "lrz": r_lr[2], "lrs": s_lr[1],
            "llpx": p_ll[0] - 2.0, "llpy": p_ll[1] - (-4.0), "llpz": p_ll[2],
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
    prev_vals = {}
    samples = []
    for t, fr in all_frames:
        row = [t]
        for ch in chans:
            v = fr[ch]
            if ch in ("ix", "iy", "iz", "tx", "ty", "tz", "hx", "hy", "hz", "alx", "aly", "alz", "arx", "ary", "arz", "llx", "lly", "llz", "lrx", "lry", "lrz") and ch in prev_vals:
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


def main():
    model, _ = randi_mod.build_clean_base_model()
    uuids = randi_mod.collect_bone_uuids(model["outliner"])
    mov_anims = randi_mod.author_all_animations(uuids)
    voz_anims, _ = voice_mod.author_randi_voice_idles(uuids)
    m1_anims, sample_map = author_randi_m1(uuids)

    model["animations"] = mov_anims + voz_anims + m1_anims
    randi_mod.OUT_DIR.mkdir(parents=True, exist_ok=True)
    randi_mod.OUT_BBMODEL.write_text(json.dumps(model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Guardado {randi_mod.OUT_BBMODEL} ({len(model['animations'])} animaciones: 10 mov + 6 voz + 5 M1)")

    sheet_path = SCRATCH / "elrandi_m1_sheet.png"
    voice_mod.render_key_moments_sheet(randi_mod, m1_anims, sample_map, sheet_path, draw_spear=False)
    print(f"Vista previa M1 Randi: {sheet_path}")

    if "--apply-html" in sys.argv:
        by_name = {a["name"]: a for a in m1_anims}
        html_path = REPO / "index.html"
        html = html_path.read_text(encoding="utf-8")
        pat = re.compile(r"(/\* RANDI_BLOCKBENCH_DATA_BEGIN \*/\s*const RANDI_BB_DATA = )(\{.*?\})(;\s*/\* RANDI_BLOCKBENCH_DATA_END \*/)", re.S)
        m = pat.search(html)
        assert m, "No se encontró RANDI_BB_DATA en index.html"
        data = json.loads(m.group(2))
        data["combo_1"] = compile_combat_clip(randi_mod, by_name["M1 1"], [0.07])
        data["combo_2"] = compile_combat_clip(randi_mod, by_name["M1 2"], [0.07])
        data["combo_3"] = compile_combat_clip(randi_mod, by_name["M1 3"], [0.07])
        data["combo_4"] = compile_combat_clip(randi_mod, by_name["M1 4"], [0.09])
        data["combo_4_arriba"] = compile_combat_clip(randi_mod, by_name["M1 4 Arriba"], [0.09])
        ser = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        html_path.write_text(html[:m.start()] + m.group(1) + ser + m.group(3) + html[m.end():], encoding="utf-8")
        print("¡SUBIDO AL TIRO! RANDI_BB_DATA actualizado en index.html con combo_1..4 + combo_4_arriba.")


if __name__ == "__main__":
    main()
