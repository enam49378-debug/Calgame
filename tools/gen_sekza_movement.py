# -*- coding: utf-8 -*-
"""
Generador de animaciones estilo Actions & Stuff (cartoon/anime) para Sekza
("Garra del Cielo" — Aéreo: pelea como un águila con zarpazos veloces y picadas rasantes).

Construye `blockbench/Sekza/Sekza_BBS.bbmodel` (y `blockbench/Sekza/skin.png`)
a partir de `alex_A&S_BBS_V2.bbmodel` eliminando las 25 animaciones originales,
adaptando brazos clásicos de 4px con la skin real de Sekza (`CHARS.sekza.skinData`),
y generando las 11 animaciones pedidas:
  1. Idle        (guardia rapaz "Garra del Cielo")
  2. Walk front  (acecho veloz de águila / carrera cortaviento)
  3. Walk Back   (retroceso rapaz sobre puntas con garras en guardia)
  4. Walk left   (planeo lateral izquierdo banqueando como alas)
  5. Walk Right  (planeo lateral derecho banqueando como alas)
  6. Jump        (vuelo del águila con alas abiertas y mirada de halcón)
  7. Dash front  (picada rasante de halcón)
  8. Dash left   (ráfaga lateral izquierda)
  9. Dash right  (ráfaga lateral derecha)
  10. Dash back  (salto aéreo de corriente ascendente hacia atrás)
  11. Idle voz 1 (sincronizada al frame con `sonidos/sekza/reposo_1.mp3`: "Ehh... estoy quieto.")

Además compila las 11 animaciones a `SEK_BB_DATA` en `index.html` (`--apply-html`)
preservando intactos todos sus combos, habilidades, vuelo (`despertar_vuelo`),
`idle_despierto` y cinemáticas.
"""

import base64
import copy
import io
import json
import math
import re
import sys
import uuid
from pathlib import Path
from PIL import Image, ImageDraw

REPO = Path(r"f:\blockstrike")
SRC_BBMODEL = Path(r"c:\Users\jesul\Downloads\alex_A&S_BBS_V2.bbmodel")
OUT_DIR = REPO / "blockbench" / "Sekza"
OUT_BBMODEL = OUT_DIR / "Sekza_BBS.bbmodel"
OUT_SKIN = OUT_DIR / "skin.png"
SCRATCH = Path(r"C:\Users\jesul\.gemini\antigravity\brain\c20a7088-7590-4809-ab1d-f3e04deaa0b7\scratch")

FPS_BB = 24
FPS_GAME = 60


def F(frame):
    return round(frame / FPS_BB, 6)


def make_uuid(tag):
    return str(uuid.uuid5(uuid.NAMESPACE_OID, f"sekza-as-v1:{tag}"))


# =============================================================================
# EXTRACCIÓN DE LA SKIN REAL DE SEKZA + ADAPTACIÓN A BRAZOS DE 4PX (STEVE)
# =============================================================================

def extract_sekza_skin_rgba():
    html = (REPO / "index.html").read_text(encoding="utf-8")
    m = re.search(
        r"\bsekza:\s*\{\s*name:\s*'Sekza'[\s\S]{0,1200}?skinData:\s*'data:image/png;base64,([^']+)'",
        html,
    )
    assert m, "No se encontró CHARS.sekza.skinData en index.html"
    raw = base64.b64decode(m.group(1))
    # Convertir de paleta indexada (modo P con transparencia) a PNG RGBA 64x64 estándar
    img = Image.open(io.BytesIO(raw)).convert("RGBA")
    assert img.size == (64, 64), f"Tamaño inesperado de skin de Sekza: {img.size}"
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    rgba_bytes = buf.getvalue()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_SKIN.write_bytes(rgba_bytes)
    return "data:image/png;base64," + base64.b64encode(rgba_bytes).decode("ascii")


def patch_slim_arms_to_classic_4px(model):
    """Convierte los cubos de brazo de 3px (Alex) a 4px clásicos (Steve) para la skin 64x64 de Sekza."""
    classic_uvs = {
        "right_arm": {
            "north": [44, 20, 48, 32],
            "east":  [40, 20, 44, 32],
            "south": [52, 20, 56, 32],
            "west":  [48, 20, 52, 32],
            "up":    [48, 20, 44, 16],
            "down":  [52, 16, 48, 20],
        },
        "right_sleve": {
            "north": [44, 36, 48, 48],
            "east":  [40, 36, 44, 48],
            "south": [52, 36, 56, 48],
            "west":  [48, 36, 52, 48],
            "up":    [48, 36, 44, 32],
            "down":  [52, 32, 48, 36],
        },
        "left_arm": {
            "north": [36, 52, 40, 64],
            "east":  [32, 52, 36, 64],
            "south": [44, 52, 48, 64],
            "west":  [40, 52, 44, 64],
            "up":    [40, 52, 36, 48],
            "down":  [44, 48, 40, 52],
        },
        "left_sleve": {
            "north": [52, 52, 56, 64],
            "east":  [48, 52, 52, 64],
            "south": [60, 52, 64, 64],
            "west":  [56, 52, 60, 64],
            "up":    [56, 52, 52, 48],
            "down":  [60, 48, 56, 52],
        },
    }
    for elem in model["elements"]:
        nm = elem["name"]
        if nm in ("right_arm", "right_sleve"):
            elem["from"][0] = 4.0
            elem["to"][0] = 8.0
            elem["origin"][0] = 5.0
            for fn, uv in classic_uvs[nm].items():
                if fn in elem["faces"]:
                    elem["faces"][fn]["uv"] = uv
        elif nm in ("left_arm", "left_sleve"):
            elem["from"][0] = -8.0
            elem["to"][0] = -4.0
            elem["origin"][0] = -5.0
            for fn, uv in classic_uvs[nm].items():
                if fn in elem["faces"]:
                    elem["faces"][fn]["uv"] = uv

    def fix_origins(nodes):
        for n in nodes:
            if isinstance(n, dict):
                if n["name"] == "right_arm":
                    n["origin"] = [5, 22, 0]
                elif n["name"] == "left_arm":
                    n["origin"] = [-5, 22, 0]
                elif n["name"] == "right_arm_item":
                    n["origin"] = [6.0, 12, -1]
                elif n["name"] == "left_arm_item":
                    n["origin"] = [-6.0, 12, -1]
                fix_origins(n.get("children", []))

    fix_origins(model["outliner"])


def build_clean_base_model():
    assert SRC_BBMODEL.exists(), f"No existe el modelo base: {SRC_BBMODEL}"
    src = json.loads(SRC_BBMODEL.read_text(encoding="utf-8"))
    model = copy.deepcopy(src)
    model["name"] = "Sekza_BBS"
    model["model_identifier"] = "sekza_bbs"
    model["animations"] = []  # Limpio de las 25 animaciones originales

    patch_slim_arms_to_classic_4px(model)

    skin_data_uri = extract_sekza_skin_rgba()
    if model.get("textures"):
        tex0 = model["textures"][0]
        tex0["name"] = "sekza_skin.png"
        tex0["path"] = str(OUT_SKIN)
        tex0["relative_path"] = "skin.png"
        tex0["source"] = skin_data_uri
        model["textures"] = [tex0]

    return model


def collect_bone_uuids(nodes, out=None):
    if out is None:
        out = {}
    for n in nodes:
        if isinstance(n, dict):
            out[n["name"]] = n["uuid"]
            collect_bone_uuids(n.get("children", []), out)
    return out


# =============================================================================
# RIG & HELPERS DE KEYFRAMES / CORRECCIÓN DE SUELO (y = 0.0)
# =============================================================================

def kf(channel, time_s, x, y, z, interp="catmullrom", tag=""):
    return {
        "channel": channel,
        "data_points": [{"x": round(x, 4), "y": round(y, 4), "z": round(z, 4)}],
        "uuid": make_uuid(f"{tag}:{channel}:{time_s:.5f}"),
        "time": round(time_s, 5),
        "color": -1,
        "interpolation": interp,
    }


def build_animator(anim_name, bone_name, bone_uuid, tracks, interp="catmullrom"):
    kfs = []
    for ch, pts in tracks.items():
        for t, x, y, z in pts:
            kfs.append(kf(ch, t, x, y, z, interp=interp, tag=f"{anim_name}:{bone_name}"))
    return {"name": bone_name, "type": "bone", "keyframes": kfs}


def make_bb_anim(name, length_s, loop, bone_uuids, bone_tracks, interp="catmullrom"):
    animators = {}
    for bname, tracks in bone_tracks.items():
        buuid = bone_uuids[bname]
        animators[buuid] = build_animator(name, bname, buuid, tracks, interp=interp)
    return {
        "uuid": make_uuid(f"anim:{name}"),
        "name": name,
        "loop": "loop" if loop else "once",
        "override": False,
        "length": round(length_s, 5),
        "snapping": FPS_BB,
        "selected": False,
        "saved": True,
        "path": "",
        "anim_time_update": "",
        "blend_weight": "",
        "start_delay": "",
        "loop_delay": "",
        "animators": animators,
    }


def shift_loop_keyframes(pts, n_frames, shift_frames):
    L = F(n_frames)
    shift_t = F(shift_frames)
    interior = pts[:-1]
    shifted = []
    for t, x, y, z in interior:
        nt = (t + shift_t) % L
        shifted.append((round(nt, 6), x, y, z))
    shifted.sort(key=lambda item: item[0])
    if shifted[0][0] > 1e-5:
        t_last, x_last, y_last, z_last = shifted[-1]
        t_first, x_first, y_first, z_first = shifted[0]
        span = (L - t_last) + t_first
        w = (L - t_last) / span if span > 1e-6 else 0.0
        x0 = x_last + (x_first - x_last) * w
        y0 = y_last + (y_first - y_last) * w
        z0 = z_last + (z_first - z_last) * w
        shifted.insert(0, (0.0, x0, y0, z0))
    shifted.append((L, shifted[0][1], shifted[0][2], shifted[0][3]))
    return shifted


def leg_min_y_offset(rx_deg, ry_deg, rz_deg):
    rx = math.radians(rx_deg)
    ry = -math.radians(ry_deg)
    rz = -math.radians(rz_deg)
    cx, sx = math.cos(rx), math.sin(rx)
    cy, sy = math.cos(ry), math.sin(ry)
    cz, sz = math.cos(rz), math.sin(rz)
    m10 = cy * sz
    m11 = sx * sy * sz + cx * cz
    m12 = cx * sy * sz - sx * cz
    corners = [
        (-2, -12, -2), (2, -12, -2), (-2, -12, 2), (2, -12, 2),
        (-2, 0, -2), (2, 0, -2), (-2, 0, 2), (2, 0, 2),
    ]
    return min(12.0 + m10 * x + m11 * y + m12 * z for x, y, z in corners)


def grounded_leg_py(rx_deg, ry_deg, rz_deg, lift_y=0.0):
    return round(lift_y - leg_min_y_offset(rx_deg, ry_deg, rz_deg), 4)


def make_leg_track(frames_spec):
    rot, pos = [], []
    for fr, rx, ry, rz, px, pz, lift_y in frames_spec:
        t = F(fr)
        py = grounded_leg_py(rx, ry, rz, lift_y)
        rot.append((t, rx, ry, rz))
        pos.append((t, px, py, pz))
    return {"rotation": rot, "position": pos}


def mirror_tracks(tracks):
    out = {}
    for bname, chs in tracks.items():
        if bname.startswith("left_"):
            tb = "right_" + bname[len("left_"):]
        elif bname.startswith("right_"):
            tb = "left_" + bname[len("right_"):]
        else:
            tb = bname
        out[tb] = {}
        for ch, pts in chs.items():
            if ch == "rotation":
                out[tb][ch] = [(t, rx, -ry, -rz) for (t, rx, ry, rz) in pts]
            elif ch == "position":
                out[tb][ch] = [(t, -px, py, pz) for (t, px, py, pz) in pts]
            else:
                out[tb][ch] = list(pts)
    return out


# =============================================================================
# AUTORÍA DE LAS 11 ANIMACIONES DE SEKZA ("GARRA DEL CIELO" — ESTILO A&S)
# =============================================================================

def author_all_animations(bone_uuids):
    anims = []

    # -------------------------------------------------------------------------
    # 1. IDLE (48f = 2.00s loop) — Guardia Rapaz "Garra del Cielo"
    # Postura agazapada felina/rapaz lista para saltar al cielo; brazo derecho
    # alzado y arqueado como garra de águila lista para el zarpazo, brazo izq
    # adelantado en guardia baja, respiración ágil y mirada penetrante de halcón.
    # -------------------------------------------------------------------------
    L_IDLE = F(48)
    idle_rleg = make_leg_track([
        (0,   14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
        (12,  16.5,  16.0,  6.5, -0.70,  1.45, 0.0),
        (24,  19.0,  16.0,  5.0, -0.82,  1.45, 0.0),
        (36,  16.0,  16.0,  7.2, -0.66,  1.45, 0.0),
        (48,  14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
    ])
    idle_lleg = make_leg_track([
        (0,  -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
        (12, -18.0, -14.0, -9.5,  0.48, -1.55, 0.0),
        (24, -20.5, -14.0,-11.0,  0.35, -1.55, 0.0),
        (36, -17.5, -14.0, -9.0,  0.52, -1.55, 0.0),
        (48, -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
    ])
    idle_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  0.988, 1.018, 0.988),
                (F(12), 1.008, 0.990, 1.008),
                (F(24), 1.028, 0.962, 1.028),
                (F(36), 1.004, 0.996, 1.004),
                (F(48), 0.988, 1.018, 0.988),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  14.0, 14.0, -2.5),
                (F(12), 16.5, 16.0, -4.0),
                (F(24), 19.2, 18.0, -5.5),
                (F(36), 16.0, 15.5, -3.6),
                (F(48), 14.0, 14.0, -2.5),
            ],
            "position": [
                (F(0),  -0.18, -0.85, -0.35),
                (F(12), -0.38, -1.55, -0.20),
                (F(24), -0.58, -2.25, -0.05),
                (F(36), -0.34, -1.45, -0.22),
                (F(48), -0.18, -0.85, -0.35),
            ],
        },
        "body": {
            "rotation": [
                (F(0),   2.0, -4.0, -1.0),
                (F(15),  3.5, -6.5,  0.4),
                (F(28),  5.0, -9.0,  1.6),
                (F(40),  3.2, -5.8,  0.2),
                (F(48),  2.0, -4.0, -1.0),
            ],
            "position": [
                (F(0),  0.0,  0.32, 0.0),
                (F(15), 0.0, -0.05, 0.0),
                (F(28), 0.0, -0.38, 0.0),
                (F(40), 0.0,  0.04, 0.0),
                (F(48), 0.0,  0.32, 0.0),
            ],
        },
        "head": {
            # Barbilla baja y mirada de águila clavada en la presa
            "rotation": [
                (F(0),  -11.5, -11.5, 1.8),
                (F(16),  -8.5, -13.5, 3.2),
                (F(29),  -5.5, -15.5, 4.6),
                (F(41),  -9.2, -13.0, 2.8),
                (F(48), -11.5, -11.5, 1.8),
            ],
        },
        "right_arm": {
            # Garra derecha alzada/armada al costado como ala-garra lista para rasgar!
            "rotation": [
                (F(0),  -72.0, -14.0, 28.0),
                (F(16), -64.0, -10.0, 34.0),
                (F(29), -56.0,  -6.0, 40.0),
                (F(41), -65.0, -11.0, 33.0),
                (F(48), -72.0, -14.0, 28.0),
            ],
            "position": [
                (F(0),  -0.30,  0.65, -0.55),
                (F(16), -0.35,  0.25, -0.45),
                (F(29), -0.40, -0.15, -0.35),
                (F(41), -0.34,  0.30, -0.46),
                (F(48), -0.30,  0.65, -0.55),
            ],
        },
        "left_arm": {
            # Garra izquierda adelantada cubriendo el frente lista para zarpazo rápido
            "rotation": [
                (F(0),  -54.0, 22.0, -20.0),
                (F(16), -46.0, 18.0, -25.0),
                (F(29), -38.0, 14.0, -30.0),
                (F(41), -47.0, 19.0, -24.0),
                (F(48), -54.0, 22.0, -20.0),
            ],
            "position": [
                (F(0),  0.25,  0.40, -0.75),
                (F(16), 0.25,  0.02, -0.62),
                (F(29), 0.25, -0.32, -0.50),
                (F(41), 0.25,  0.08, -0.65),
                (F(48), 0.25,  0.40, -0.75),
            ],
        },
        "left_leg": idle_lleg,
        "right_leg": idle_rleg,
    }
    idle0 = {
        b: {ch: pts[0][1:4] for ch, pts in chs.items()}
        for b, chs in idle_tracks.items()
    }
    anims.append(make_bb_anim("Idle", L_IDLE, True, bone_uuids, idle_tracks))

    # -------------------------------------------------------------------------
    # 2. WALK FRONT (14f = 0.5833s loop) — Acecho Veloz Cortaviento (Águila/Ninja)
    # Torso inclinado cortando el viento, brazos extendidos atrás-afuera como
    # alas de halcón con batido elástico A&S en cada zancada y rodillas altas!
    # -------------------------------------------------------------------------
    N_WF = 14
    L_WF = F(N_WF)
    wf_lleg = make_leg_track([
        (0,  -42.0, -3.5, -1.5,  0.00, -1.65, 0.00),  # Contacto garra adelante
        (2,  -12.0, -2.0, -3.5, -0.18, -0.45, 0.00),  # Compresión elástica rápida
        (4,   28.0,  0.0, -1.0,  0.00,  0.95, 0.00),  # Empuje explosivo
        (5,   52.0,  2.5,  0.0,  0.00,  1.50, 0.55),  # Despegue veloz de punta!
        (7,   14.0,  1.0, -1.0,  0.05,  0.15, 2.05),
        (10, -34.0, -2.0, -2.5,  0.16, -1.45, 3.45),  # Zancada aérea con hang-time de águila!
        (12, -48.0, -3.5, -2.0,  0.05, -2.05, 1.50),
        (14, -42.0, -3.5, -1.5,  0.00, -1.65, 0.00),
    ])
    wf_rleg_rot = [(t, rx, -ry, -rz) for (t, rx, ry, rz) in shift_loop_keyframes(wf_lleg["rotation"], N_WF, N_WF // 2)]
    wf_rleg_pos = [(t, -px, py, pz) for (t, px, py, pz) in shift_loop_keyframes(wf_lleg["position"], N_WF, N_WF // 2)]

    wf_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(2),  1.048, 0.935, 1.048),
                (F(5),  0.962, 1.055, 0.962),
                (F(7),  1.000, 1.000, 1.000),
                (F(9),  1.048, 0.935, 1.048),
                (F(12), 0.962, 1.055, 0.962),
                (F(14), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  21.0,  8.5,  3.5),
                (F(2),  25.0,  5.0,  6.5),
                (F(5),  18.0, -4.0,  0.8),
                (F(7),  21.0, -8.5, -3.5),
                (F(9),  25.0, -5.0, -6.5),
                (F(12), 18.0,  4.0, -0.8),
                (F(14), 21.0,  8.5,  3.5),
            ],
            "position": [
                (F(0),   0.18, -0.85, -0.95),
                (F(2),   0.45, -2.05, -0.75),
                (F(5),   0.05,  0.75, -1.15),
                (F(7),  -0.18, -0.85, -0.95),
                (F(9),  -0.45, -2.05, -0.75),
                (F(12), -0.05,  0.75, -1.15),
                (F(14),  0.18, -0.85, -0.95),
            ],
        },
        "body": {
            "rotation": [
                (F(0),   4.0, -16.0,  0.0),
                (F(4),   2.0,  -4.0, -2.0),
                (F(7),   4.0,  16.0,  0.0),
                (F(11),  2.0,   4.0,  2.0),
                (F(14),  4.0, -16.0,  0.0),
            ],
        },
        "head": {
            # Compensación de cabeza mirando al frente mientras el torso corta el viento!
            "rotation": [
                (F(0),  -20.0, -5.5, -2.5),
                (F(3),  -17.0, -2.0, -4.0),
                (F(5),  -23.0,  2.5, -0.5),
                (F(7),  -20.0,  5.5,  2.5),
                (F(10), -17.0,  2.0,  4.0),
                (F(12), -23.0, -2.5,  0.5),
                (F(14), -20.0, -5.5, -2.5),
            ],
        },
        "left_arm": {
            # Alas de halcón barridas atrás-afuera con pulso rítmico!
            "rotation": [
                (F(0),   52.0, 10.0, -34.0),
                (F(3),   64.0, 14.0, -44.0),
                (F(7),   34.0,  6.0, -24.0),
                (F(10),  44.0,  8.0, -30.0),
                (F(14),  52.0, 10.0, -34.0),
            ],
            "position": [
                (F(0),  0.20,  0.35, 0.55),
                (F(3),  0.30, -0.25, 0.70),
                (F(7),  0.15,  0.65, 0.35),
                (F(11), 0.20, -0.15, 0.50),
                (F(14), 0.20,  0.35, 0.55),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),   34.0, -6.0,  24.0),
                (F(3),   44.0, -8.0,  30.0),
                (F(7),   52.0,-10.0,  34.0),
                (F(10),  64.0,-14.0,  44.0),
                (F(14),  34.0, -6.0,  24.0),
            ],
            "position": [
                (F(0),  -0.15,  0.65, 0.35),
                (F(3),  -0.20, -0.15, 0.50),
                (F(7),  -0.20,  0.35, 0.55),
                (F(10), -0.30, -0.25, 0.70),
                (F(14), -0.15,  0.65, 0.35),
            ],
        },
        "left_leg": wf_lleg,
        "right_leg": {"rotation": wf_rleg_rot, "position": wf_rleg_pos},
    }
    anims.append(make_bb_anim("Walk front", L_WF, True, bone_uuids, wf_tracks))

    # -------------------------------------------------------------------------
    # 3. WALK BACK (16f = 0.6667s loop) — Retroceso Rapaz sobre Puntas
    # Mantiene las dos garras cruzadas/listas frente al pecho vigilando al rival
    # mientras retrocede con rebotes felinos ligeros.
    # -------------------------------------------------------------------------
    N_WB = 16
    L_WB = F(N_WB)
    wb_lleg = make_leg_track([
        (0,   28.0, -5.0, -2.5,  0.15,  1.25, 0.00),
        (2,    6.0, -4.0, -4.0,  0.00,  0.25, 0.00),
        (5,  -22.0, -3.0, -2.0,  0.10, -0.95, 0.00),
        (8,  -30.0, -4.0, -2.5,  0.15, -1.25, 1.35),
        (12,   6.0, -5.0, -3.5,  0.22,  0.35, 2.35),
        (14,  24.0, -5.0, -2.5,  0.18,  1.15, 0.90),
        (16,  28.0, -5.0, -2.5,  0.15,  1.25, 0.00),
    ])
    wb_rleg_rot = [(t, rx, -ry, -rz) for (t, rx, ry, rz) in shift_loop_keyframes(wb_lleg["rotation"], N_WB, N_WB // 2)]
    wb_rleg_pos = [(t, -px, py, pz) for (t, px, py, pz) in shift_loop_keyframes(wb_lleg["position"], N_WB, N_WB // 2)]

    wb_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(2),  1.032, 0.955, 1.032),
                (F(6),  0.978, 1.032, 0.978),
                (F(8),  1.000, 1.000, 1.000),
                (F(10), 1.032, 0.955, 1.032),
                (F(14), 0.978, 1.032, 0.978),
                (F(16), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  15.0, 14.0, -2.5),
                (F(3),  17.5, 10.0, -4.5),
                (F(8),  15.0,  6.0,  2.5),
                (F(11), 17.5, 10.0,  4.5),
                (F(16), 15.0, 14.0, -2.5),
            ],
            "position": [
                (F(0),  -0.15, -0.95,  0.20),
                (F(2),  -0.30, -1.85,  0.35),
                (F(6),  -0.05,  0.15,  0.10),
                (F(8),   0.15, -0.95,  0.20),
                (F(10),  0.30, -1.85,  0.35),
                (F(14),  0.05,  0.15,  0.10),
                (F(16), -0.15, -0.95,  0.20),
            ],
        },
        "body": {
            "rotation": [
                (F(0),   3.0, -6.0,  0.0),
                (F(8),   3.0,  6.0,  0.0),
                (F(16),  3.0, -6.0,  0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  -12.5, -8.0,  1.5),
                (F(4),  -10.0, -5.0,  3.0),
                (F(8),  -12.5,-12.0, -1.5),
                (F(12), -10.0, -9.0, -3.0),
                (F(16), -12.5, -8.0,  1.5),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  -68.0, -18.0, 24.0),
                (F(4),  -58.0, -14.0, 30.0),
                (F(8),  -76.0, -22.0, 18.0),
                (F(12), -64.0, -16.0, 26.0),
                (F(16), -68.0, -18.0, 24.0),
            ],
            "position": [
                (F(0),  -0.25,  0.50, -0.60),
                (F(4),  -0.25,  0.05, -0.45),
                (F(8),  -0.25,  0.65, -0.75),
                (F(12), -0.25,  0.10, -0.50),
                (F(16), -0.25,  0.50, -0.60),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  -62.0, 24.0, -18.0),
                (F(4),  -52.0, 20.0, -24.0),
                (F(8),  -48.0, 16.0, -28.0),
                (F(12), -66.0, 26.0, -16.0),
                (F(16), -62.0, 24.0, -18.0),
            ],
            "position": [
                (F(0),  0.25, 0.50, -0.75),
                (F(4),  0.25, 0.05, -0.60),
                (F(8),  0.25, 0.35, -0.55),
                (F(12), 0.25, 0.55, -0.80),
                (F(16), 0.25, 0.50, -0.75),
            ],
        },
        "left_leg": wb_lleg,
        "right_leg": {"rotation": wb_rleg_rot, "position": wb_rleg_pos},
    }
    anims.append(make_bb_anim("Walk Back", L_WB, True, bone_uuids, wb_tracks))

    # -------------------------------------------------------------------------
    # 4. WALK LEFT (14f = 0.5833s loop) — Planeo Lateral Izquierdo (+X)
    # Sekza rodea a su presa banqueando los brazos abiertos como alas de águila!
    # -------------------------------------------------------------------------
    N_WL = 14
    L_WL = F(N_WL)
    wl_lleg = make_leg_track([
        (0,   -8.0, -10.0,  -8.0,  0.35, -0.55, 0.00),
        (3,   -9.0, -12.0, -28.0,  1.20, -0.65, 2.20),  # Abre paso rapaz a la izq (+X)
        (6,  -11.0, -10.0, -18.0,  1.00, -0.55, 0.00),  # Planta firme
        (8,   -8.5,  -9.0,  -6.5,  0.40, -0.45, 0.00),
        (10,  -6.0,  -8.0,   5.0, -0.20, -0.35, 0.00),
        (14,  -8.0, -10.0,  -8.0,  0.35, -0.55, 0.00),
    ])
    wl_rleg = make_leg_track([
        (0,    8.0,  10.0,   8.0, -0.35,  0.55, 0.00),
        (3,   10.0,   8.0,  16.0,  0.35,  0.55, 0.00),
        (6,   11.0,   8.0,  22.0,  0.75,  0.65, 0.00),
        (9,   -4.0,   6.0, -14.0,  1.00, -0.35, 2.35),  # Cruza ágil hacia la izq (+X)
        (11,   3.0,   8.0,   2.0,  0.15,  0.20, 0.45),
        (14,   8.0,  10.0,   8.0, -0.35,  0.55, 0.00),
    ])
    wl_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(3),  0.975, 1.035, 0.975),
                (F(6),  1.038, 0.948, 1.038),
                (F(9),  0.975, 1.035, 0.975),
                (F(12), 1.030, 0.960, 1.030),
                (F(14), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  14.0, 12.0,  3.5),
                (F(3),  12.0,  8.0, 10.5),      # Banqueo de águila hacia la izquierda!
                (F(6),  16.0, 14.0,  2.5),
                (F(9),  12.5, 18.0,  8.5),
                (F(12), 15.5, 14.0,  1.5),
                (F(14), 14.0, 12.0,  3.5),
            ],
            "position": [
                (F(0),   0.15, -0.85, -0.25),
                (F(3),   0.85,  0.10, -0.35),
                (F(6),   0.55, -1.55, -0.20),
                (F(9),   0.70,  0.15, -0.35),
                (F(12),  0.25, -1.35, -0.20),
                (F(14),  0.15, -0.85, -0.25),
            ],
        },
        "body": {
            "rotation": [
                (F(0),   2.0, -4.0,  1.5),
                (F(5),   2.0, -8.0, -2.5),
                (F(10),  2.0,  2.0,  2.5),
                (F(14),  2.0, -4.0,  1.5),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  -11.0, -8.0, -3.5),
                (F(3),  -12.5, -4.0, -9.0),
                (F(6),   -9.5,-10.0, -2.5),
                (F(9),  -12.5,-14.0, -7.5),
                (F(14), -11.0, -8.0, -3.5),
            ],
        },
        "left_arm": {
            # Ala izquierda baja cortando la corriente lateral
            "rotation": [
                (F(0),  -24.0, 14.0, -42.0),
                (F(4),  -16.0, 10.0, -54.0),
                (F(9),  -34.0, 18.0, -34.0),
                (F(14), -24.0, 14.0, -42.0),
            ],
            "position": [
                (F(0),  0.35, 0.35, -0.20),
                (F(4),  0.45, 0.05, -0.10),
                (F(9),  0.30, 0.55, -0.35),
                (F(14), 0.35, 0.35, -0.20),
            ],
        },
        "right_arm": {
            # Ala derecha alta equilibrando el banqueo
            "rotation": [
                (F(0),  -56.0, -14.0, 44.0),
                (F(4),  -46.0, -10.0, 54.0),
                (F(9),  -66.0, -18.0, 36.0),
                (F(14), -56.0, -14.0, 44.0),
            ],
            "position": [
                (F(0),  -0.35, 0.65, -0.35),
                (F(4),  -0.45, 0.85, -0.25),
                (F(9),  -0.30, 0.45, -0.45),
                (F(14), -0.35, 0.65, -0.35),
            ],
        },
        "left_leg": wl_lleg,
        "right_leg": wl_rleg,
    }
    anims.append(make_bb_anim("Walk left", L_WL, True, bone_uuids, wl_tracks))

    # -------------------------------------------------------------------------
    # 5. WALK RIGHT (14f = 0.5833s loop) — Espejo exacto de Walk left (-X)
    # -------------------------------------------------------------------------
    wr_tracks = mirror_tracks(wl_tracks)
    anims.append(make_bb_anim("Walk Right", L_WL, True, bone_uuids, wr_tracks))

    # -------------------------------------------------------------------------
    # 6. JUMP (24f = 1.00s once) — Vuelo del Águila ("Garra del Cielo")
    # Agachada rapaz profunda -> despegue explosivo vertical -> pose de águila
    # imperial suspendida en el aire (AMBOS brazos desplegados como grandes alas,
    # rodilla izquierda recogida, garra derecha lista y mirada clavada abajo!).
    # -------------------------------------------------------------------------
    L_JMP = F(24)
    jmp_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(3),  1.105, 0.820, 1.105),   # Compresión rapaz máxima!
                (F(5),  0.875, 1.180, 0.875),   # Despegue al cielo!
                (F(10), 1.020, 0.975, 1.020),   # Suspensión planeando en el ápice!
                (F(16), 1.030, 0.962, 1.030),
                (F(20), 0.950, 1.068, 0.950),   # Preparando caída de halcón
                (F(24), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  14.0, 14.0, -2.5),
                (F(3),  30.0, 10.0, -3.5),
                (F(5), -14.0,  4.0,  1.0),      # Pecho abierto al sol al despegar!
                (F(11), 12.0,  2.0,  0.0),      # En el ápice inclina torso como águila acechando desde arriba!
                (F(17), 18.0,  6.0, -1.5),
                (F(24), 14.0, 14.0, -2.5),
            ],
            "position": [
                (F(0),  -0.18, -0.85, -0.35),
                (F(3),  -0.25, -4.10,  0.45),
                (F(5),   0.00,  2.20, -0.65),
                (F(11),  0.00,  3.10, -0.45),   # Gran elevación aérea!
                (F(17), -0.05,  2.10, -0.35),
                (F(24), -0.18, -0.85, -0.35),
            ],
        },
        "body": {
            "rotation": [
                (F(0),   2.0, -4.0, -1.0),
                (F(3),   8.0, -6.0, -1.5),
                (F(6), -10.0,  0.0,  0.0),
                (F(12),  4.0,  0.0,  0.0),
                (F(18),  3.0, -2.0, -0.5),
                (F(24),  2.0, -4.0, -1.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  -11.5, -11.5, 1.8),
                (F(3),   10.0,  -8.0, 2.0),
                (F(6),  -22.0,   0.0, 0.0),     # Mira al cielo al despegar
                (F(12),  12.0,  -3.0, 0.0),     # Mirada de águila clavada hacia abajo desde el aire!
                (F(18),  10.0,  -6.0, 1.0),
                (F(24), -11.5, -11.5, 1.8),
            ],
        },
        "left_arm": {
            # Gran ala izquierda desplegada de par en par!
            "rotation": [
                (F(0),  -54.0, 22.0, -20.0),
                (F(3),   48.0, 16.0, -28.0),
                (F(6),  -42.0, -8.0, -72.0),    # Despliegue máximo de ala!
                (F(12), -28.0, -4.0, -66.0),
                (F(18), -38.0, 10.0, -48.0),
                (F(24), -54.0, 22.0, -20.0),
            ],
            "position": [
                (F(0),  0.25,  0.40, -0.75),
                (F(3),  0.10, -0.65,  0.75),
                (F(6),  0.65,  1.15, -0.25),
                (F(12), 0.60,  0.95, -0.20),
                (F(18), 0.40,  0.65, -0.45),
                (F(24), 0.25,  0.40, -0.75),
            ],
        },
        "right_arm": {
            # Gran ala derecha desplegada en simetría rapaz!
            "rotation": [
                (F(0),  -72.0, -14.0, 28.0),
                (F(3),   44.0, -14.0, 28.0),
                (F(6),  -42.0,   8.0, 72.0),    # Despliegue máximo de ala derecha!
                (F(12), -28.0,   4.0, 66.0),
                (F(18), -52.0,  -8.0, 46.0),
                (F(24), -72.0, -14.0, 28.0),
            ],
            "position": [
                (F(0),  -0.30,  0.65, -0.55),
                (F(3),  -0.10, -0.65,  0.75),
                (F(6),  -0.65,  1.15, -0.25),
                (F(12), -0.60,  0.95, -0.20),
                (F(18), -0.45,  0.75, -0.40),
                (F(24), -0.30,  0.65, -0.55),
            ],
        },
        "left_leg": make_leg_track([
            (0,  -15.5, -14.0, -7.5,  0.62, -1.55, 0.00),
            (3,  -30.0, -12.0,-10.0,  0.55, -1.95, 0.00),
            (5,   32.0,  -6.0, -5.0,  0.25,  1.15, 1.40),
            (11, -68.0, -10.0,-10.0,  0.40, -2.65, 5.40),  # Garra izq muy recogida al pecho!
            (17, -48.0, -12.0, -9.0,  0.48, -2.10, 3.90),
            (21, -22.0, -13.0, -8.0,  0.55, -1.65, 1.15),
            (24, -15.5, -14.0, -7.5,  0.62, -1.55, 0.00),
        ]),
        "right_leg": make_leg_track([
            (0,   14.0,  16.0,  8.5, -0.55,  1.45, 0.00),
            (3,   26.0,  14.0, 10.5, -0.60,  1.75, 0.00),
            (5,   38.0,   8.0,  6.0, -0.25,  1.45, 1.20),
            (11,  22.0,  12.0, 10.0, -0.35,  1.25, 2.95),  # Garra der estilizada abajo lista para cazar!
            (17,  16.0,  14.0,  9.5, -0.45,  1.10, 2.35),
            (21,  12.0,  15.0,  9.0, -0.50,  1.30, 0.85),
            (24,  14.0,  16.0,  8.5, -0.55,  1.45, 0.00),
        ]),
    }
    anims.append(make_bb_anim("Jump", L_JMP, False, bone_uuids, jmp_tracks))

    # -------------------------------------------------------------------------
    # 7. DASH FRONT (10f = 0.4167s once) — Picada Rasante de Halcón
    # Pliega ambas alas atrás disparándose como proyectil rasante (48° torso)
    # y lanza un zarpazo frontal de frenada clavando garras en y = 0.0!
    # -------------------------------------------------------------------------
    L_DF = F(10)
    df_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *idle0["low_anchor"]["scale"]),
                (F(1),  1.085, 0.865, 1.065),
                (F(3),  0.880, 0.900, 1.185),   # Smear supersónico de halcón!
                (F(5),  0.935, 0.945, 1.100),
                (F(7),  1.065, 0.900, 0.975),   # Frenada felina!
                (F(10), *idle0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *idle0["low_body"]["rotation"]),
                (F(1),  24.0, 16.0, -3.5),
                (F(3),  48.0, -8.0,  3.5),      # Picada horizontal agresiva!
                (F(5),  36.0, -4.0,  2.0),
                (F(7),  22.0, 16.0, -4.0),
                (F(10), *idle0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["low_body"]["position"]),
                (F(1),  -0.30, -2.55,  0.45),
                (F(3),   0.15, -1.85, -2.55),
                (F(5),   0.05, -1.75, -1.85),
                (F(7),  -0.30, -2.25, -0.55),
                (F(10), *idle0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *idle0["body"]["rotation"]),
                (F(3),   4.0, -12.0, 0.0),
                (F(5),   2.0,  -6.0, 0.0),
                (F(7),   3.0,   6.0, 0.0),
                (F(10), *idle0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *idle0["head"]["rotation"]),
                (F(1), -16.0, -14.0,  2.0),
                (F(3), -38.0,  16.0, -3.0),     # Mirada fija al frente durante la picada!
                (F(5), -28.0,  10.0, -2.0),
                (F(7), -14.0, -14.0,  3.0),
                (F(10), *idle0["head"]["rotation"]),
            ],
        },
        "left_arm": {
            # Alas plegadas en flecha aerodinámica -> abren frenando!
            "rotation": [
                (F(0),  *idle0["left_arm"]["rotation"]),
                (F(1),  -24.0, 14.0, -24.0),
                (F(3),   72.0, 16.0, -38.0),
                (F(5),   54.0, 12.0, -34.0),
                (F(7),  -64.0, 26.0, -24.0),
                (F(10), *idle0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["left_arm"]["position"]),
                (F(3),  0.25, 0.55,  0.85),
                (F(7),  0.30, 0.15, -0.80),
                (F(10), *idle0["left_arm"]["position"]),
            ],
        },
        "right_arm": {
            # Ala plegada -> lanza garra derecha adelante al frenar!
            "rotation": [
                (F(0),  *idle0["right_arm"]["rotation"]),
                (F(1),  -32.0, -10.0, 26.0),
                (F(3),   68.0, -16.0, 38.0),
                (F(5),  -42.0, -14.0, 32.0),
                (F(7),  -82.0, -20.0, 22.0),
                (F(10), *idle0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["right_arm"]["position"]),
                (F(3),  -0.25, 0.55,  0.85),
                (F(7),  -0.30, 0.45, -0.95),
                (F(10), *idle0["right_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_track([
            (0,  -15.5, -14.0, -7.5,  0.62, -1.55, 0.00),
            (1,    8.0, -12.0, -8.0,  0.55, -1.65, 0.00),
            (3,  -54.0,  -6.0, -6.0,  0.30, -3.25, 3.20),
            (5,  -40.0,  -8.0, -6.0,  0.35, -2.75, 1.85),
            (7,  -26.0, -14.0, -9.0,  0.60, -2.20, 0.00),
            (8,  -20.0, -14.0, -8.2,  0.61, -1.88, 0.00),
            (10, -15.5, -14.0, -7.5,  0.62, -1.55, 0.00),
        ]),
        "right_leg": make_leg_track([
            (0,   14.0,  16.0,  8.5, -0.55,  1.45, 0.00),
            (1,   26.0,  14.0,  9.0, -0.55,  0.85, 0.00),
            (3,   64.0,   6.0,  6.0, -0.30,  2.55, 3.05),
            (5,   46.0,  10.0,  6.5, -0.35,  1.95, 1.65),
            (7,   21.0,  16.0,  9.5, -0.60,  1.65, 0.00),
            (8,   17.5,  16.0,  9.0, -0.58,  1.55, 0.00),
            (10,  14.0,  16.0,  8.5, -0.55,  1.45, 0.00),
        ]),
    }
    anims.append(make_bb_anim("Dash front", L_DF, False, bone_uuids, df_tracks))

    # -------------------------------------------------------------------------
    # 8. DASH LEFT (10f = 0.4167s once) — Ráfaga de Ala Lateral Izquierda (+X)
    # -------------------------------------------------------------------------
    L_DL = F(10)
    dl_lleg = make_leg_track([
        (0,  -15.5, -14.0,  -7.5,  0.62, -1.55, 0.00),
        (1,   -8.0, -12.0,   0.0,  0.20, -1.15, 0.00),
        (3,  -18.0, -12.0, -44.0,  2.45, -0.55, 2.55),
        (5,  -14.0, -12.0, -34.0,  2.15, -0.45, 1.40),
        (8,  -14.0, -14.0, -24.0,  1.65, -1.05, 0.00),
        (9,  -14.8, -14.0, -15.5,  1.12, -1.30, 0.00),
        (10, -15.5, -14.0,  -7.5,  0.62, -1.55, 0.00),
    ])
    dl_rleg = make_leg_track([
        (0,   14.0,  16.0,   8.5, -0.55,  1.45, 0.00),
        (1,   14.0,  14.0,  18.0, -0.95,  1.15, 0.00),
        (3,   16.0,   8.0,  40.0,  1.30,  0.45, 2.10),
        (5,   10.0,  10.0,  30.0,  0.95,  0.75, 1.10),
        (8,   12.0,  16.0,  18.0,  0.15,  1.25, 0.00),
        (9,   13.0,  16.0,  13.0, -0.20,  1.35, 0.00),
        (10,  14.0,  16.0,   8.5, -0.55,  1.45, 0.00),
    ])
    dl_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *idle0["low_anchor"]["scale"]),
                (F(1),  1.055, 0.875, 1.055),
                (F(3),  1.165, 0.900, 0.935),   # Smear cortaviento lateral!
                (F(5),  1.090, 0.940, 0.965),
                (F(8),  1.060, 0.908, 1.035),
                (F(10), *idle0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *idle0["low_body"]["rotation"]),
                (F(1),  18.0, 12.0,  -6.0),
                (F(3),  18.0,  6.0,  24.0),     # Banqueo agresivo de ala hacia +X!
                (F(5),  16.0,  8.0,  15.0),
                (F(8),  18.0, 15.0,  -9.5),
                (F(10), *idle0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["low_body"]["position"]),
                (F(1),  -0.65, -2.35, -0.20),
                (F(3),   2.45, -1.35, -0.55),
                (F(5),   1.90, -1.45, -0.45),
                (F(8),   0.95, -2.45, -0.25),
                (F(10), *idle0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *idle0["body"]["rotation"]),
                (F(3),   2.0, -8.0,  5.0),
                (F(5),   2.0, -6.0,  2.5),
                (F(8),   3.0, -4.0, -3.5),
                (F(10), *idle0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *idle0["head"]["rotation"]),
                (F(1), -12.0, -10.0,   4.0),
                (F(3), -14.0,  -4.0, -20.0),
                (F(5), -12.0,  -6.0, -13.0),
                (F(8), -14.0, -12.0,   8.0),
                (F(10), *idle0["head"]["rotation"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  *idle0["left_arm"]["rotation"]),
                (F(1),  -24.0,  14.0, -24.0),
                (F(3),   18.0, -14.0, -68.0),   # Ala izq corta el viento a ras!
                (F(5),    8.0,  -8.0, -54.0),
                (F(8),  -38.0,  18.0, -38.0),
                (F(10), *idle0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["left_arm"]["position"]),
                (F(3),  0.55,  0.55,  0.20),
                (F(8),  0.30, -0.15, -0.45),
                (F(10), *idle0["left_arm"]["position"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *idle0["right_arm"]["rotation"]),
                (F(1),  -42.0,  -8.0,  26.0),
                (F(3),  -48.0,  12.0,  64.0),   # Ala der alta abierta en banqueo de águila!
                (F(5),  -54.0,   4.0,  52.0),
                (F(8),  -64.0, -14.0,  34.0),
                (F(10), *idle0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["right_arm"]["position"]),
                (F(3),  -0.55, 0.95, -0.35),
                (F(8),  -0.35, 0.25, -0.50),
                (F(10), *idle0["right_arm"]["position"]),
            ],
        },
        "left_leg": dl_lleg,
        "right_leg": dl_rleg,
    }
    anims.append(make_bb_anim("Dash left", L_DL, False, bone_uuids, dl_tracks))

    # -------------------------------------------------------------------------
    # 9. DASH RIGHT (10f = 0.4167s once) — Ráfaga de Ala Lateral Derecha (-X)
    # -------------------------------------------------------------------------
    dr_tracks = mirror_tracks(dl_tracks)
    for bname, chs in dr_tracks.items():
        if bname in idle0:
            for ch, pts in chs.items():
                if ch in idle0[bname]:
                    ix, iy, iz = idle0[bname][ch]
                    pts[0] = (pts[0][0], ix, iy, iz)
                    pts[-1] = (pts[-1][0], ix, iy, iz)
    anims.append(make_bb_anim("Dash right", L_DL, False, bone_uuids, dr_tracks))

    # -------------------------------------------------------------------------
    # 10. DASH BACK (12f = 0.50s once) — Salto Aéreo de Corriente Ascendente
    # Patea el aire al frente elevándose hacia atrás con AMBAS alas abiertas
    # frenando en el viento y aterriza agazapado como águila en percha (y=0.0)!
    # -------------------------------------------------------------------------
    L_DB = F(12)
    db_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *idle0["low_anchor"]["scale"]),
                (F(1),  1.070, 0.880, 1.070),
                (F(4),  0.905, 1.120, 0.935),   # Arco aéreo hacia atrás!
                (F(7),  0.965, 1.035, 0.980),
                (F(9),  1.085, 0.855, 1.085),   # Aterrizaje agazapado de rapaz!
                (F(12), *idle0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *idle0["low_body"]["rotation"]),
                (F(1),  22.0, 12.0, -2.0),
                (F(4), -16.0,  6.0,  1.5),      # Pecho arqueado planeando atrás!
                (F(7),  -2.0, 10.0, -1.0),
                (F(9),  28.0, 16.0, -4.5),      # Agachada felina profunda al posarse!
                (F(12), *idle0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["low_body"]["position"]),
                (F(1),  -0.15, -2.15, -0.95),
                (F(4),  -0.10,  2.35,  3.85),
                (F(7),  -0.15,  1.05,  3.15),
                (F(9),  -0.35, -3.15,  1.45),
                (F(12), *idle0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *idle0["body"]["rotation"]),
                (F(4),  -6.0, -2.0,  0.0),
                (F(9),   8.0, -6.0, -2.0),
                (F(12), *idle0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *idle0["head"]["rotation"]),
                (F(1), -12.0, -10.0, 1.5),
                (F(4),  18.0,  -4.0, 0.0),      # Mira abajo al rival desde la corriente!
                (F(9), -18.0, -14.0, 3.0),      # Alza la mirada feroz al posarse!
                (F(12), *idle0["head"]["rotation"]),
            ],
        },
        "left_arm": {
            # Ambas alas abiertas frenando el aire hacia atrás!
            "rotation": [
                (F(0),  *idle0["left_arm"]["rotation"]),
                (F(1),   28.0,  16.0, -24.0),
                (F(4),  -54.0,  -8.0, -68.0),
                (F(9),  -42.0,  18.0, -34.0),
                (F(12), *idle0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["left_arm"]["position"]),
                (F(4),  0.55,  0.95, -0.45),
                (F(9),  0.30, -0.65, -0.65),
                (F(12), *idle0["left_arm"]["position"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *idle0["right_arm"]["rotation"]),
                (F(1),   20.0, -12.0, 24.0),
                (F(4),  -54.0,   8.0, 68.0),
                (F(9),  -64.0, -16.0, 36.0),
                (F(12), *idle0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["right_arm"]["position"]),
                (F(4),  -0.55,  0.95, -0.45),
                (F(9),  -0.35,  0.15, -0.55),
                (F(12), *idle0["right_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_track([
            (0,  -15.5, -14.0, -7.5,  0.62, -1.55, 0.00),
            (1,  -26.0, -12.0, -9.0,  0.55, -2.05, 0.00),
            (4,  -48.0, -10.0, -8.0,  0.40,  1.65, 3.60),
            (7,  -24.0, -12.0, -8.0,  0.50,  1.05, 1.55),
            (9,  -30.0, -15.0,-10.5,  0.65,  0.05, 0.00),
            (10, -22.5, -14.5, -9.0,  0.64, -0.75, 0.00),
            (12, -15.5, -14.0, -7.5,  0.62, -1.55, 0.00),
        ]),
        "right_leg": make_leg_track([
            (0,   14.0,  16.0,  8.5, -0.55,  1.45, 0.00),
            (1,    8.0,  14.0,  9.5, -0.50,  0.95, 0.00),
            (4,   30.0,  12.0, 10.0, -0.35,  4.55, 2.95),
            (7,   24.0,  15.0, 10.0, -0.45,  3.65, 1.15),
            (9,   28.0,  18.0, 12.0, -0.65,  2.70, 0.00),
            (10,  21.0,  17.0, 10.2, -0.60,  2.08, 0.00),
            (12,  14.0,  16.0,  8.5, -0.55,  1.45, 0.00),
        ]),
    }
    anims.append(make_bb_anim("Dash back", L_DB, False, bone_uuids, db_tracks))

    # -------------------------------------------------------------------------
    # 11. IDLE VOZ 1 (60f = 2.50s once) — `sekza/reposo_1.mp3`: "Ehh... estoy quieto."
    # Picos exactos del audio @ 24fps (dur=2.090s = 51f):
    #   f13..f19 (p=f14..f18, 0.58s..0.75s): "Ehhh..." -> sale de su postura feroz, se endereza extrañado
    #     y se mira las manos vendadas a un lado y al otro como dándose cuenta de que no hace nada!
    #   f24..f30 (p=f24 "es-", f30 "-TOY"): se mira los pies / abre levemente las palmas
    #   f33..f40 (p=f34 "QUIE-", f37 "-to."): se queda CÓMICAMENTE tieso/congelado literal de pie (f34..f46!)
    #   f47..f60: sacude levemente la cabeza y vuelve de golpe a su guardia rapaz `idle0`!
    # -------------------------------------------------------------------------
    L_SV1 = F(60)
    sv1_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *idle0["low_anchor"]["scale"]),
                (F(10), 1.015, 0.980, 1.015),
                (F(16), 0.972, 1.040, 0.972),   # "Ehhh..." se estira incorporándose!
                (F(24), 1.012, 0.984, 1.012),   # "es-toy..."
                (F(34), 0.968, 1.045, 0.968),   # "...QUIE-to." ¡tieso como estatua!
                (F(45), 0.970, 1.042, 0.970),   # Sostiene el freeze cómico literal!
                (F(51), 1.032, 0.955, 1.032),   # Rebote agazapándose de nuevo en guardia
                (F(60), *idle0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *idle0["low_body"]["rotation"]),
                (F(16),  2.5,  4.0,  2.0),      # Se endereza saliendo del acecho rapaz
                (F(25),  4.0, -3.0, -2.0),
                (F(34),  0.0,  0.0,  0.0),      # ¡Completamente recto y quieto en "QUIE-to"!
                (F(45),  0.0,  0.0,  0.0),      # Literalmente quieto!
                (F(52), 16.5, 15.5, -3.5),
                (F(60), *idle0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["low_body"]["position"]),
                (F(16),  0.05,  0.15,  0.00),
                (F(34),  0.00,  0.35,  0.00),
                (F(45),  0.00,  0.35,  0.00),
                (F(52), -0.25, -1.25, -0.40),
                (F(60), *idle0["low_body"]["rotation"][:0] + idle0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *idle0["body"]["rotation"]),
                (F(16), -1.5, -2.0,  1.0),
                (F(34),  0.0,  0.0,  0.0),
                (F(45),  0.0,  0.0,  0.0),
                (F(60), *idle0["body"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["body"]["position"]),
                (F(34), 0.0, 0.45, 0.0),
                (F(45), 0.0, 0.45, 0.0),
                (F(60), *idle0["body"]["position"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *idle0["head"]["rotation"]),
                (F(15),   8.0,  14.0, -7.5),    # "Ehhh..." mira su mano/lado izq confundido
                (F(24),  12.0, -12.0,  6.5),    # "es-toy..." mira al otro lado/abajo
                (F(30),   6.0,  -4.0, -4.0),
                (F(34),   0.0,   0.0,  7.5),    # "...QUIE-to." mira directo a cámara ladeando tieso!
                (F(45),   0.0,   0.0,  7.5),    # Freeze total!
                (F(51),  -6.0, -16.0, -3.0),    # Sacude cabeza volviendo al modo águila
                (F(60), *idle0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *idle0["right_arm"]["rotation"]),
                (F(16), -36.0, -10.0, 22.0),    # Baja la garra mirándola extrañado
                (F(25), -44.0,   8.0, 32.0),    # Pequeño gesto abierto en "es-TOY..."
                (F(34),  -4.0,  -2.0,  9.0),    # "...QUIE-to." brazos pegados rectos de estatua!
                (F(45),  -4.0,  -2.0,  9.0),
                (F(52), -78.0, -16.0, 32.0),    # Vuelve a armar la garra derecha con rebote!
                (F(60), *idle0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["right_arm"]["position"]),
                (F(16), -0.20, 0.25, -0.35),
                (F(34),  0.00, 0.10,  0.00),
                (F(45),  0.00, 0.10,  0.00),
                (F(52), -0.35, 0.75, -0.60),
                (F(60), *idle0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  *idle0["left_arm"]["rotation"]),
                (F(16), -38.0,  12.0, -22.0),
                (F(25), -44.0,  -8.0, -32.0),   # Abre palma izq en "es-TOY..."
                (F(34),  -4.0,   2.0,  -9.0),   # "...QUIE-to." firme/tieso literal!
                (F(45),  -4.0,   2.0,  -9.0),
                (F(52), -60.0,  24.0, -22.0),
                (F(60), *idle0["left_arm"]["position"][:0] + idle0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["left_arm"]["position"]),
                (F(16), 0.20, 0.25, -0.35),
                (F(34), 0.00, 0.10,  0.00),
                (F(45), 0.00, 0.10,  0.00),
                (F(52), 0.28, 0.45, -0.80),
                (F(60), *idle0["left_arm"]["position"]),
            ],
        },
        "left_leg": make_leg_track([
            (0,  -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
            (16,  -6.0,  -8.0, -4.0,  0.30, -0.65, 0.0),
            (34,   0.0,  -3.0, -2.0,  0.10,  0.00, 0.0),   # Pies juntos/rectos en "estoy quieto"!
            (45,   0.0,  -3.0, -2.0,  0.10,  0.00, 0.0),
            (52, -17.5, -14.0, -8.5,  0.65, -1.65, 0.0),
            (60, -15.5, -14.0, -7.5,  0.62, -1.55, 0.0),
        ]),
        "right_leg": make_leg_track([
            (0,   14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
            (16,   6.0,  10.0,  4.5, -0.25,  0.65, 0.0),
            (34,   0.0,   3.0,  2.0, -0.10,  0.00, 0.0),
            (45,   0.0,   3.0,  2.0, -0.10,  0.00, 0.0),
            (52,  16.0,  16.0,  9.0, -0.58,  1.55, 0.0),
            (60,  14.0,  16.0,  8.5, -0.55,  1.45, 0.0),
        ]),
    }
    anims.append(make_bb_anim("Idle voz 1", L_SV1, False, bone_uuids, sv1_tracks))

    return anims


# =============================================================================
# EVALUACIÓN 3D (Catmull-Rom + Matrices 4x4) -> CalFight + Render Preview
# =============================================================================

def eval_channel_catmull(kfs, t, length, loop):
    if not kfs:
        return None
    pts = [(k["time"], k["data_points"][0]["x"], k["data_points"][0]["y"], k["data_points"][0]["z"]) for k in kfs]
    pts.sort(key=lambda x: x[0])
    if len(pts) == 1:
        return pts[0][1:]

    if loop:
        t = t % length
    else:
        if t <= pts[0][0]:
            return pts[0][1:]
        if t >= pts[-1][0]:
            return pts[-1][1:]

    idx = 0
    for i in range(len(pts) - 1):
        if pts[i][0] <= t <= pts[i + 1][0]:
            idx = i
            break
    else:
        return pts[-1][1:]

    def get_pt(k):
        if loop:
            n = len(pts) - 1
            if n <= 0:
                return pts[0]
            k_mod = k % n
            cycle = (k - k_mod) // n
            base = pts[k_mod]
            return (base[0] + cycle * length, base[1], base[2], base[3])
        else:
            return pts[max(0, min(len(pts) - 1, k))]

    p0 = get_pt(idx - 1)
    p1 = get_pt(idx)
    p2 = get_pt(idx + 1)
    p3 = get_pt(idx + 2)

    dt = p2[0] - p1[0]
    if dt <= 1e-6:
        return p1[1:]
    u = (t - p1[0]) / dt
    u2 = u * u
    u3 = u2 * u

    out = []
    for c in (1, 2, 3):
        v0, v1, v2, v3 = p0[c], p1[c], p2[c], p3[c]
        dt0 = max(p1[0] - p0[0], 1e-4)
        dt2 = max(p3[0] - p2[0], 1e-4)
        m1 = 0.5 * ((v2 - v1) + (v1 - v0) * (dt / dt0))
        m2 = 0.5 * ((v3 - v2) * (dt / dt2) + (v2 - v1))
        val = (2 * u3 - 3 * u2 + 1) * v1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * v2 + (u3 - u2) * m2
        out.append(val)
    return tuple(out)


def mat_mul(A, B):
    return [
        [sum(A[i][k] * B[k][j] for k in range(4)) for j in range(4)]
        for i in range(4)
    ]


def mat_trs_zyx(pos, rot_rad, scl):
    rx, ry, rz = rot_rad
    cx, sx = math.cos(rx), math.sin(rx)
    cy, sy = math.cos(ry), math.sin(ry)
    cz, sz = math.cos(rz), math.sin(rz)
    R00 = cy * cz
    R01 = sx * sy * cz - cx * sz
    R02 = cx * sy * cz + sx * sz
    R10 = cy * sz
    R11 = sx * sy * sz + cx * cz
    R12 = cx * sy * sz - sx * cz
    R20 = -sy
    R21 = sx * cy
    R22 = cx * cy
    sx_v, sy_v, sz_v = scl
    return [
        [R00 * sx_v, R01 * sy_v, R02 * sz_v, pos[0]],
        [R10 * sx_v, R11 * sy_v, R12 * sz_v, pos[1]],
        [R20 * sx_v, R21 * sy_v, R22 * sz_v, pos[2]],
        [0.0, 0.0, 0.0, 1.0],
    ]


def mat_inv_rigid_uniform_or_diag(M):
    R = [row[:3] for row in M[:3]]
    t = [M[0][3], M[1][3], M[2][3]]
    sx2 = sum(R[i][0] ** 2 for i in range(3))
    sy2 = sum(R[i][1] ** 2 for i in range(3))
    sz2 = sum(R[i][2] ** 2 for i in range(3))
    Rinv = [
        [R[0][0] / sx2, R[1][0] / sx2, R[2][0] / sx2],
        [R[0][1] / sy2, R[1][1] / sy2, R[2][1] / sy2],
        [R[0][2] / sz2, R[1][2] / sz2, R[2][2] / sz2],
    ]
    tinv = [-sum(Rinv[i][k] * t[k] for k in range(3)) for i in range(3)]
    return [
        [Rinv[0][0], Rinv[0][1], Rinv[0][2], tinv[0]],
        [Rinv[1][0], Rinv[1][1], Rinv[1][2], tinv[1]],
        [Rinv[2][0], Rinv[2][1], Rinv[2][2], tinv[2]],
        [0.0, 0.0, 0.0, 1.0],
    ]


def decompose_xyz(M):
    pos = (M[0][3], M[1][3], M[2][3])
    sx = math.sqrt(sum(M[i][0] ** 2 for i in range(3)))
    sy = math.sqrt(sum(M[i][1] ** 2 for i in range(3)))
    sz = math.sqrt(sum(M[i][2] ** 2 for i in range(3)))
    r00, r01, r02 = M[0][0] / sx, M[0][1] / sy, M[0][2] / sz
    r10, r11, r12 = M[1][0] / sx, M[1][1] / sy, M[1][2] / sz
    r20, r21, r22 = M[2][0] / sx, M[2][1] / sy, M[2][2] / sz
    ry = math.asin(max(-1.0, min(1.0, r02)))
    if abs(r02) < 0.999999:
        rx = math.atan2(-r12, r22)
        rz = math.atan2(-r01, r00)
    else:
        rx = math.atan2(r21, r11)
        rz = 0.0
    return pos, (rx, ry, rz), (sx, sy, sz)


def mat_vec(M, p):
    x, y, z = p
    return (
        M[0][0] * x + M[0][1] * y + M[0][2] * z + M[0][3],
        M[1][0] * x + M[1][1] * y + M[1][2] * z + M[1][3],
        M[2][0] * x + M[2][1] * y + M[2][2] * z + M[2][3],
    )


BBS_TREE = {
    "anchor":     {"parent": None,         "origin": (0.0, 0.0, 0.0)},
    "low_anchor": {"parent": "anchor",     "origin": (0.0, 0.0, 0.0)},
    "low_body":   {"parent": "low_anchor", "origin": (0.0, 12.0, 0.0)},
    "body":       {"parent": "low_body",   "origin": (0.0, 18.0, 0.0)},
    "torso":      {"parent": "body",       "origin": (0.0, 24.0, 0.0)},
    "right_arm":  {"parent": "body",       "origin": (5.0, 22.0, 0.0)},
    "left_arm":   {"parent": "body",       "origin": (-5.0, 22.0, 0.0)},
    "head":       {"parent": "low_body",   "origin": (0.0, 24.0, 0.0)},
    "right_leg":  {"parent": "low_anchor", "origin": (1.9, 12.0, 0.0)},
    "left_leg":   {"parent": "low_anchor", "origin": (-1.9, 12.0, 0.0)},
}


def eval_bbs_world_matrices(anim, t):
    length = anim["length"]
    loop = anim["loop"] == "loop"
    by_name = {}
    for _, an in anim["animators"].items():
        by_name[an["name"]] = an["keyframes"]

    world = {}
    for bname, info in BBS_TREE.items():
        ox, oy, oz = info["origin"]
        if info["parent"] is None:
            px, py, pz = (0.0, 0.0, 0.0)
            parent_M = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
        else:
            px, py, pz = BBS_TREE[info["parent"]]["origin"]
            parent_M = world[info["parent"]]
        bind = (px - ox, oy - py, oz - pz)
        kfs = by_name.get(bname, [])
        pos_kf = eval_channel_catmull([k for k in kfs if k["channel"] == "position"], t, length, loop) or (0.0, 0.0, 0.0)
        rot_kf = eval_channel_catmull([k for k in kfs if k["channel"] == "rotation"], t, length, loop) or (0.0, 0.0, 0.0)
        scl_kf = eval_channel_catmull([k for k in kfs if k["channel"] == "scale"], t, length, loop) or (1.0, 1.0, 1.0)
        pos_cal = (bind[0] + pos_kf[0], bind[1] + pos_kf[1], bind[2] - pos_kf[2])
        rot_cal = (math.radians(rot_kf[0]), -math.radians(rot_kf[1]), -math.radians(rot_kf[2]))
        local_M = mat_trs_zyx(pos_cal, rot_cal, scl_kf)
        world[bname] = mat_mul(parent_M, local_M)
    return world


def convert_anim_to_calfight_clip(anim, custom_gait=False, full_jump=False):
    length = anim["length"]
    loop = anim["loop"] == "loop"
    n_samples = int(round(length * FPS_GAME)) + 1
    T_shift_torso = [[1, 0, 0, 0], [0, 1, 0, -12.0], [0, 0, 1, 0], [0, 0, 0, 1]]

    all_frames = []
    for si in range(n_samples):
        t = min(length, si / FPS_GAME)
        W = eval_bbs_world_matrices(anim, t)

        M_inner = mat_mul(W["low_anchor"], [[1, 0, 0, 0], [0, 1, 0, 16.0], [0, 0, 1, 0], [0, 0, 0, 1]])
        p_in, r_in, s_in = decompose_xyz(M_inner)
        M_inner_inv = mat_inv_rigid_uniform_or_diag(M_inner)

        M_torso_world = mat_mul(W["torso"], T_shift_torso)
        M_torso_local = mat_mul(M_inner_inv, M_torso_world)
        p_tr, r_tr, s_tr = decompose_xyz(M_torso_local)
        M_torso_world_inv = mat_inv_rigid_uniform_or_diag(M_torso_world)

        M_head_local = mat_mul(M_torso_world_inv, W["head"])
        p_hd, r_hd, s_hd = decompose_xyz(M_head_local)

        M_armR_local = mat_mul(M_torso_world_inv, W["right_arm"])
        p_ar, r_ar, s_ar = decompose_xyz(M_armR_local)

        M_armL_local = mat_mul(M_torso_world_inv, W["left_arm"])
        p_al, r_al, s_al = decompose_xyz(M_armL_local)

        M_legR_local = mat_mul(M_inner_inv, W["right_leg"])
        p_lr, r_lr, s_lr = decompose_xyz(M_legR_local)

        M_legL_local = mat_mul(M_inner_inv, W["left_leg"])
        p_ll, r_ll, s_ll = decompose_xyz(M_legL_local)

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
        all_frames.append((round(t, 6), frame))

    defaults = {
        "alz": 0.06, "arz": -0.06,
        "als": 1.0, "ars": 1.0, "lls": 1.0, "lrs": 1.0,
        "tscx": 1.0, "tscy": 1.0, "tscz": 1.0,
        "hscx": 1.0, "hscy": 1.0, "hscz": 1.0,
        "bsx": 1.0, "bsy": 1.0, "bsz": 1.0,
    }
    chans = sorted(
        k for k in all_frames[0][1].keys()
        if any(abs(fr[k] - defaults.get(k, 0.0)) > 1e-4 for _, fr in all_frames)
    )
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

    clip = {
        "length": round(length, 4),
        "loop": loop,
        "contacts": [],
        "channels": chans,
        "samples": samples,
    }
    if custom_gait:
        clip["customGait"] = True
    if full_jump:
        clip["fullJump"] = True
    return clip


# =============================================================================
# RENDERIZADOR DE HOJA DE CONTACTO 3D (Colores camisa escocesa roja + vendas)
# =============================================================================

PARTS_BOXES = [
    ("torso",     (-4, -12, -2), (4, 0, 2),   (142, 38, 42)),   # Camisa leñadora roja de Sekza
    ("head",      (-4, 0, -4),   (4, 8, 4),   (242, 204, 162)),
    ("right_arm", (-2, -10, -2), (2, 2, 2),   (228, 168, 56)),  # Ámbar/dorado ("Garra del Cielo") para distinguir der vs izq
    ("left_arm",  (-2, -10, -2), (2, 2, 2),   (185, 190, 196)), # Vendas grises
    ("right_leg", (-2, -12, -2), (2, 0, 2),   (56, 96, 114)),   # Jeans azul grisáceo
    ("left_leg",  (-2, -12, -2), (2, 0, 2),   (78, 128, 150)),
]

FACE_QUADS = [
    ([0, 1, 2, 3], (0, 0, 1), 1.00),
    ([5, 4, 7, 6], (0, 0, -1), 0.55),
    ([4, 0, 3, 7], (-1, 0, 0), 0.78),
    ([1, 5, 6, 2], (1, 0, 0), 0.84),
    ([3, 2, 6, 7], (0, 1, 0), 1.08),
    ([4, 5, 1, 0], (0, -1, 0), 0.45),
]


def render_contact_sheet(anims, out_path):
    cols = 6
    cell_w, cell_h = 156, 180
    img = Image.new("RGB", (cols * cell_w, len(anims) * cell_h), (20, 22, 28))
    draw = ImageDraw.Draw(img)

    yaw_cam = math.radians(32)
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
        length = anim["length"]
        loop = anim["loop"] == "loop"
        # Para Idle voz 1 muestreamos los picos exactos de voz ("Ehh... estoy quieto.")
        if anim["name"] == "Idle voz 1":
            sample_ts = [0.0, F(16), F(25), F(34), F(45), L_Val := length]
        else:
            sample_ts = [(col_idx / cols if loop else col_idx / (cols - 1)) * length for col_idx in range(cols)]

        for col_idx, t in enumerate(sample_ts):
            cx = col_idx * cell_w + cell_w // 2
            floor_y = row_idx * cell_h + cell_h - 26

            g1 = proj((-12, 0, 0), cx, floor_y)
            g2 = proj((12, 0, 0), cx, floor_y)
            g3 = proj((0, 0, -12), cx, floor_y)
            g4 = proj((0, 0, 12), cx, floor_y)
            draw.line([(g1[0], g1[1]), (g2[0], g2[1])], fill=(64, 66, 82), width=1)
            draw.line([(g3[0], g3[1]), (g4[0], g4[1])], fill=(52, 78, 72), width=1)

            W = eval_bbs_world_matrices(anim, t)
            polys = []
            min_foot_y = 999.0
            for bname, bmin, bmax, base_col in PARTS_BOXES:
                M = W[bname]
                x0, y0, z0 = bmin
                x1, y1, z1 = bmax
                corners_local = [
                    (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
                    (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
                ]
                corners_w = [mat_vec(M, c) for c in corners_local]
                if "leg" in bname:
                    min_foot_y = min(min_foot_y, min(c[1] for c in corners_w))
                corners_p = [proj(c, cx, floor_y) for c in corners_w]
                for idxs, _, shade_k in FACE_QUADS:
                    pts2d = [(corners_p[k][0], corners_p[k][1]) for k in idxs]
                    ax, ay = pts2d[1][0] - pts2d[0][0], pts2d[1][1] - pts2d[0][1]
                    bx, by = pts2d[2][0] - pts2d[0][0], pts2d[2][1] - pts2d[0][1]
                    if ax * by - ay * bx >= 0:
                        continue
                    depth = sum(corners_p[k][2] for k in idxs) / 4.0
                    col = tuple(max(0, min(255, int(c * shade_k))) for c in base_col)
                    if bname == "head" and idxs == [0, 1, 2, 3]:
                        col = (255, 198, 72)
                    polys.append((depth, pts2d, col))

            polys.sort(key=lambda item: item[0])
            for _, pts2d, col in polys:
                draw.polygon(pts2d, fill=col, outline=(12, 12, 18))

            if col_idx == 0:
                draw.text((col_idx * cell_w + 6, row_idx * cell_h + 4), anim["name"], fill=(255, 236, 190))
            draw.text((col_idx * cell_w + 6, row_idx * cell_h + cell_h - 16), f"t={t:.2f}s y0={min_foot_y:+.1f}", fill=(185, 190, 205))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


def patch_sek_bb_data_in_html(anims):
    by_name = {a["name"]: a for a in anims}
    clips = {
        "idle":       convert_anim_to_calfight_clip(by_name["Idle"]),
        "walk_front": convert_anim_to_calfight_clip(by_name["Walk front"]),
        "walk_back":  convert_anim_to_calfight_clip(by_name["Walk Back"], custom_gait=True),
        "walk_left":  convert_anim_to_calfight_clip(by_name["Walk left"], custom_gait=True),
        "walk_right": convert_anim_to_calfight_clip(by_name["Walk Right"], custom_gait=True),
        "jump":       convert_anim_to_calfight_clip(by_name["Jump"], full_jump=True),
        "dash_front": convert_anim_to_calfight_clip(by_name["Dash front"]),
        "dash_left":  convert_anim_to_calfight_clip(by_name["Dash left"]),
        "dash_right": convert_anim_to_calfight_clip(by_name["Dash right"]),
        "dash_back":  convert_anim_to_calfight_clip(by_name["Dash back"]),
        "idle_voz_1": convert_anim_to_calfight_clip(by_name["Idle voz 1"]),
    }

    html_path = REPO / "index.html"
    html = html_path.read_text(encoding="utf-8")
    pat = re.compile(r"(/\* SEK_BLOCKBENCH_DATA_BEGIN \*/\s*const SEK_BB_DATA = )(\{.*?\})(;\s*/\* SEK_BLOCKBENCH_DATA_END \*/)", re.S)
    m = pat.search(html)
    assert m, "No se encontró el bloque SEK_BB_DATA en index.html"
    data = json.loads(m.group(2))

    # Mapear las 10 animaciones de movimiento A&S + variante de voz preservando todos
    # sus combos, habilidades, `idle_despierto`, `despertar_vuelo` y cinemáticas.
    data["idle"] = clips["idle"]
    data["idle_combate"] = clips["idle"]
    data["idle_voz_1"] = clips["idle_voz_1"]

    data["caminar"] = clips["walk_front"]
    data["correr"] = clips["walk_front"]
    data["caminar_atras"] = clips["walk_back"]
    data["correr_atras"] = clips["walk_back"]
    data["caminar_izq"] = clips["walk_left"]
    data["correr_izq"] = clips["walk_left"]
    data["caminar_der"] = clips["walk_right"]
    data["correr_der"] = clips["walk_right"]

    data["salto"] = clips["jump"]
    data["esquive"] = clips["dash_front"]
    data["esquive_izq"] = clips["dash_left"]
    data["esquive_der"] = clips["dash_right"]
    data["esquive_atras"] = clips["dash_back"]

    serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    new_html = html[:m.start()] + m.group(1) + serialized + m.group(3) + html[m.end():]
    html_path.write_text(new_html, encoding="utf-8")
    print("Actualizado SEK_BB_DATA en index.html con las 11 animaciones A&S de Sekza (10 mov + idle_voz_1).")


def main():
    model = build_clean_base_model()
    bone_uuids = collect_bone_uuids(model["outliner"])
    anims = author_all_animations(bone_uuids)
    model["animations"] = anims

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_BBMODEL.write_text(json.dumps(model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Guardado Blockbench: {OUT_BBMODEL} ({len(anims)} animaciones)")

    sheet_path = SCRATCH / "sekza_movement_sheet.png"
    for i, arg in enumerate(sys.argv):
        if arg == "--sheet" and i + 1 < len(sys.argv):
            sheet_path = Path(sys.argv[i + 1])
    render_contact_sheet(anims, sheet_path)
    print(f"Guardada vista previa: {sheet_path}")

    if "--apply-html" in sys.argv:
        patch_sek_bb_data_in_html(anims)


if __name__ == "__main__":
    main()
