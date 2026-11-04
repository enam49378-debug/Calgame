"""Genera Javicubito_BBS.bbmodel (basado en alex_A&S_BBS_V2.bbmodel sin animaciones previas)
con estilo Actions & Stuff (Cartoon / Anime) para las 10 animaciones de movimiento de Javicubito
(Lancero Cúbico: ágil, heroico, lanza en la espalda lista para desenvainar y embestir),
renderiza hojas de contacto para verificación visual y compila los clips a JAVI_BB_DATA en index.html."""
import base64
import json
import math
import re
import sys
from pathlib import Path
from uuid import uuid5, NAMESPACE_URL
from PIL import Image, ImageDraw

REPO = Path(r"f:\blockstrike")
BASE_BBMODEL = Path(r"c:\Users\jesul\Downloads\alex_A&S_BBS_V2.bbmodel")
OUT_DIR = REPO / "blockbench" / "Javicubito"
OUT_BBMODEL = OUT_DIR / "Javicubito_BBS.bbmodel"
SCRATCH = Path(r"C:\Users\jesul\.gemini\antigravity\brain\c20a7088-7590-4809-ab1d-f3e04deaa0b7\scratch")

FPS_BB = 24
FPS_GAME = 60


def F(frame: float) -> float:
    return round(frame / FPS_BB, 4)


def uid(tag: str) -> str:
    return str(uuid5(NAMESPACE_URL, "blockstrike/javicubito_bbs/" + tag))


def face_rects(u, v, w, h, d):
    return {
        "east": [u, v + d, u + d, v + d + h],
        "north": [u + d, v + d, u + d + w, v + d + h],
        "west": [u + d + w, v + d, u + 2 * d + w, v + d + h],
        "south": [u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h],
        "up": [u + d + w, v + d, u + d, v],
        "down": [u + d + 2 * w, v, u + d + w, v + d],
    }


def extract_javi_skin():
    html = (REPO / "index.html").read_text(encoding="utf-8")
    m = re.search(
        r"javi:\s*\{\s*name:\s*'Javicubito'[\s\S]{0,800}?skinData:\s*'data:image/png;base64,([^']+)'",
        html,
    )
    assert m, "No se encontró skinData de Javicubito (CHARS.javi) en index.html"
    b64 = m.group(1)
    raw = base64.b64decode(b64)
    skin_png = OUT_DIR / "skin.png"
    if skin_png.exists():
        import io
        im_html = Image.open(io.BytesIO(raw)).convert("RGBA")
        im_png = Image.open(skin_png).convert("RGBA")
        assert im_html.tobytes() == im_png.tobytes(), "Discrepancia de píxeles entre CHARS.javi.skinData y Javicubito/skin.png"
    return "data:image/png;base64," + b64, raw


def build_clean_base_model():
    model = json.loads(BASE_BBMODEL.read_text(encoding="utf-8"))
    skin_data_url, skin_bytes = extract_javi_skin()

    model["name"] = "Javicubito_BBS"
    model["model_identifier"] = "javi"
    model["animations"] = []  # Quitamos TODAS las animaciones originales de alex_A&S_BBS_V2
    model["variable_placeholders"] = ""
    model["variable_placeholder_buttons"] = []

    tex = model["textures"][0]
    tex["name"] = "Javicubito.png"
    tex["source"] = skin_data_url
    tex["internal"] = True
    tex["saved"] = False
    tex.pop("path", None)
    tex.pop("relative_path", None)

    # Ajustar cubos de brazos de 3px (Alex) a 4px (Steve) para la skin clásica de Javicubito,
    # conservando intacta toda la jerarquía de huesos de alex_A&S_BBS_V2.
    el_by_uuid = {el["uuid"]: el for el in model["elements"]}
    for u_id, uv_orig in [
        ("d3df6c87-2ba7-9044-ca91-82f8c3581b82", (40, 16)),
        ("f62dba6c-c63b-efe7-79c3-bb377eb1daf3", (40, 32)),
    ]:
        el = el_by_uuid[u_id]
        el["from"] = [4, 12, -2]
        el["to"] = [8, 24, 2]
        el["faces"] = {f: {"uv": coords, "texture": 0} for f, coords in face_rects(*uv_orig, 4, 12, 4).items()}

    for u_id, uv_orig in [
        ("d4414f0c-9946-5543-3254-5a54834f8962", (32, 48)),
        ("ae1854e4-ba06-2342-7e9d-fa0bd1334540", (48, 48)),
    ]:
        el = el_by_uuid[u_id]
        el["from"] = [-8, 12, -2]
        el["to"] = [-4, 24, 2]
        el["faces"] = {f: {"uv": coords, "texture": 0} for f, coords in face_rects(*uv_orig, 4, 12, 4).items()}

    def fix_origins(nodes):
        for n in nodes:
            if isinstance(n, dict):
                if n.get("name") in ("right_arm", "armor_right_arm"):
                    n["origin"] = [6, 22, 0]
                elif n.get("name") == "right_arm_item":
                    n["origin"] = [6, 12, 0]
                elif n.get("name") in ("left_arm", "armor_left_arm"):
                    n["origin"] = [-6, 22, 0]
                elif n.get("name") == "left_arm_item":
                    n["origin"] = [-6, 12, 0]
                fix_origins(n.get("children", []))

    fix_origins(model["outliner"])
    return model, skin_bytes


def collect_bone_uuids(nodes, out=None):
    if out is None:
        out = {}
    for n in nodes:
        if isinstance(n, dict):
            out[n["name"]] = n["uuid"]
            collect_bone_uuids(n.get("children", []), out)
    return out


# =============================================================================
# ÁLGEBRA 3D Y CONTACTO EXACTO DE PIES CON EL SUELO
# =============================================================================

def mat_mul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(4)) for j in range(4)] for i in range(4)]


def mat_vec(M, v):
    return [M[i][0] * v[0] + M[i][1] * v[1] + M[i][2] * v[2] + M[i][3] for i in range(3)]


def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return [[1, 0, 0, 0], [0, c, -s, 0], [0, s, c, 0], [0, 0, 0, 1]]


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return [[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]]


def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return [[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]


def mat_trs_zyx(pos, rot_rad, scale):
    R = mat_mul(rot_z(rot_rad[2]), mat_mul(rot_y(rot_rad[1]), rot_x(rot_rad[0])))
    S = [[scale[0], 0, 0, 0], [0, scale[1], 0, 0], [0, 0, scale[2], 0], [0, 0, 0, 1]]
    M = mat_mul(R, S)
    M[0][3], M[1][3], M[2][3] = pos[0], pos[1], pos[2]
    return M


def leg_py_for_clearance(rx_deg: float, ry_deg: float, rz_deg: float, clearance: float = 0.0) -> float:
    """Calcula `pos.y` exacto para que el vértice inferior de la pierna (cubo 4x12x4 desde la cadera y=12)
    quede exactamente a `clearance` píxeles sobre el suelo y=0 (sin flotar ni hundirse)."""
    R = mat_trs_zyx(
        (0.0, 0.0, 0.0),
        (math.radians(rx_deg), -math.radians(ry_deg), -math.radians(rz_deg)),
        (1.0, 1.0, 1.0),
    )
    bottom_corners = [(-2.0, -12.0, -2.0), (2.0, -12.0, -2.0), (-2.0, -12.0, 2.0), (2.0, -12.0, 2.0)]
    min_rel_y = min(mat_vec(R, c)[1] for c in bottom_corners)
    return round(clearance - 12.0 - min_rel_y, 3)


def eval_periodic_tuples(pts, length, t):
    """Evalúa una lista periódica `[(t, x, y, z), ...]` en `t` usando Catmull-Rom sin errores de borde."""
    base = [p for p in pts if p[0] < length - 1e-5]
    n = len(base)
    t = (t % length + length) % length
    if abs(t - length) < 1e-7:
        t = 0.0
    idx = n - 1
    for j in range(n):
        if base[j][0] <= t + 1e-7:
            idx = j
    t0 = base[idx][0]
    if idx == n - 1 and t < t0 - 1e-6:
        t0 -= length
        t1 = base[0][0]
        tm = base[n - 2][0] - length
        tp = base[1 % n][0] + (length if n == 1 else 0.0)
    else:
        t = max(t, t0)
        t1 = base[(idx + 1) % n][0] + (length if idx + 1 >= n else 0.0)
        tm = base[(idx - 1) % n][0] - (length if idx - 1 < 0 else 0.0)
        tp = base[(idx + 2) % n][0] + (length if idx + 2 >= n else 0.0) + (length if (idx + 2) >= 2 * n else 0.0)
    h = t1 - t0
    u = 0.0 if h < 1e-7 else max(0.0, min(1.0, (t - t0) / h))
    u2, u3 = u * u, u * u * u
    out = []
    for axis in (1, 2, 3):
        p0, p1 = base[idx][axis], base[(idx + 1) % n][axis]
        pm, pp = base[(idx - 1) % n][axis], base[(idx + 2) % n][axis]
        m0 = (p1 - pm) / ((t1 - tm) or 1.0) * h
        m1 = (pp - p0) / ((tp - t0) or 1.0) * h
        val = (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1
        out.append(val)
    return tuple(out)


def shift_loop_keyframes(pts, total_frames: int, shift_frames: int):
    """Desfasa exactamente un ciclo periódico definido en frames enteros por `shift_frames`."""
    length = F(total_frames)
    offset = F(shift_frames)
    base = [p for p in pts if p[0] < length - 1e-5]
    shifted = []
    has_zero = False
    for p in base:
        f_orig = round(p[0] * FPS_BB)
        f_new = (f_orig + shift_frames) % total_frames
        if f_new == 0:
            has_zero = True
        shifted.append((F(f_new), p[1], p[2], p[3]))
    if not has_zero:
        vx, vy, vz = eval_periodic_tuples(pts, length, (0.0 - offset) % length)
        shifted.append((0.0, vx, vy, vz))
    shifted.sort(key=lambda item: item[0])
    shifted.append((length, shifted[0][1], shifted[0][2], shifted[0][3]))
    return shifted


def mirror_kf_list(pts, ch):
    out = []
    for item in pts:
        t, x, y, z = item[0], item[1], item[2], item[3]
        if ch == "position":
            out.append((t, -x, y, z))
        elif ch == "rotation":
            out.append((t, x, -y, -z))
        else:
            out.append((t, x, y, z))
    return out


def mirror_tracks(src_tracks):
    dst = {}
    swap = {
        "left_arm": "right_arm",
        "right_arm": "left_arm",
        "left_leg": "right_leg",
        "right_leg": "left_leg",
    }
    for bname, chs in src_tracks.items():
        tb = swap.get(bname, bname)
        dst[tb] = {ch: mirror_kf_list(pts, ch) for ch, pts in chs.items()}
    return dst


def make_bb_anim(name, length, loop, bone_uuids, tracks, interp="catmullrom"):
    animators = {}
    for bname, channels in tracks.items():
        b_uuid = bone_uuids[bname]
        kfs = []
        for ch_name in ("rotation", "position", "scale"):
            pts = channels.get(ch_name, [])
            for idx, item in enumerate(pts):
                t, x, y, z = item[0], item[1], item[2], item[3]
                kf_interp = item[4] if len(item) > 4 else interp
                kfs.append({
                    "channel": ch_name,
                    "data_points": [{"x": round(x, 4), "y": round(y, 4), "z": round(z, 4)}],
                    "uuid": uid(f"{name}/{bname}/{ch_name}/{idx}"),
                    "time": round(t, 4),
                    "color": -1,
                    "interpolation": kf_interp,
                })
        if kfs:
            animators[b_uuid] = {"name": bname, "type": "bone", "keyframes": kfs}
    return {
        "uuid": uid("anim/" + name),
        "name": name,
        "loop": "loop" if loop else "once",
        "override": False,
        "length": round(length, 4),
        "snapping": FPS_BB,
        "selected": name == "Idle",
        "anim_time_update": "",
        "blend_weight": "",
        "start_delay": "",
        "loop_delay": "",
        "animators": animators,
    }


def make_leg_track(frames_spec):
    """frames_spec: [(frame_idx, rx, ry, rz, px, pz, clearance), ...]"""
    rot = [(F(fr), rx, ry, rz) for (fr, rx, ry, rz, px, pz, cl) in frames_spec]
    pos = [(F(fr), px, leg_py_for_clearance(rx, ry, rz, cl), pz) for (fr, rx, ry, rz, px, pz, cl) in frames_spec]
    return {"rotation": rot, "position": pos}


# =============================================================================
# AUTORÍA DE LAS 10 ANIMACIONES DE JAVICUBITO — ESTILO ACTIONS & STUFF
# Personaje: LANCERO CÚBICO (lanza diagonal a la espalda, guardia heroica de
# esgrimista/dragoon, juego de pies elástico de alcance largo y embestidas).
# =============================================================================

def author_all_animations(bone_uuids):
    anims = []

    # -------------------------------------------------------------------------
    # 1. IDLE (48f = 2.0s loop) — Guardia Heroica de Lancero Cúbico
    # Contrasta claramente con ElRandi: Javicubito perfila el hombro DERECHO al
    # frente (`low_body` ry = -17°), pie derecho adelantado, pecho erguido y
    # elástico; brazo derecho listo para desenvainar/estocar y brazo izquierdo
    # abierto atrás como contrapeso de esgrimista/lancero, con respiración A&S.
    # -------------------------------------------------------------------------
    L_IDLE = F(48)
    idle_rleg = make_leg_track([
        (0,  -12.5,  14.0,  6.5, -0.55, -1.40, 0.0),
        (12, -14.8,  14.0,  8.5, -0.42, -1.40, 0.0),
        (24, -17.2,  14.0, 10.2, -0.28, -1.40, 0.0),
        (36, -14.2,  14.0,  8.0, -0.45, -1.40, 0.0),
        (48, -12.5,  14.0,  6.5, -0.55, -1.40, 0.0),
    ])
    idle_lleg = make_leg_track([
        (0,   11.5, -18.0, -9.0,  0.48,  1.30, 0.0),
        (12,  13.8, -18.0, -7.0,  0.62,  1.30, 0.0),
        (24,  16.2, -18.0, -5.2,  0.76,  1.30, 0.0),
        (36,  13.2, -18.0, -7.5,  0.58,  1.30, 0.0),
        (48,  11.5, -18.0, -9.0,  0.48,  1.30, 0.0),
    ])
    idle_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  0.984, 1.024, 0.984),
                (F(12), 1.006, 0.992, 1.006),
                (F(24), 1.028, 0.962, 1.028),
                (F(36), 1.002, 0.998, 1.002),
                (F(48), 0.984, 1.024, 0.984),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  2.5, -16.5, 1.8),
                (F(12), 5.0, -18.5, 3.4),
                (F(24), 7.5, -20.5, 5.0),
                (F(36), 4.4, -18.0, 3.0),
                (F(48), 2.5, -16.5, 1.8),
            ],
            "position": [
                (F(0),  0.20,  0.30,  0.05),
                (F(12), 0.42, -0.58, -0.14),
                (F(24), 0.65, -1.48, -0.32),
                (F(36), 0.38, -0.42, -0.10),
                (F(48), 0.20,  0.30,  0.05),
            ],
        },
        "body": {
            # Pecho orgulloso de lancero con desfase secundario (overlap de 3-4f)
            "rotation": [
                (F(0),  -2.0,  4.0,  1.0),
                (F(15), -0.5,  7.2, -0.5),
                (F(28),  1.0, 10.0, -1.8),
                (F(40), -0.8,  6.2, -0.2),
                (F(48), -2.0,  4.0,  1.0),
            ],
            "position": [
                (F(0),  0.0,  0.38, 0.0),
                (F(15), 0.0, -0.04, 0.0),
                (F(28), 0.0, -0.42, 0.0),
                (F(40), 0.0,  0.06, 0.0),
                (F(48), 0.0,  0.38, 0.0),
            ],
        },
        "head": {
            # Mirada enfocada al frente midiendo la distancia de lanza
            "rotation": [
                (F(0),  -1.0, 14.0, -1.2),
                (F(16),  2.2, 16.5, -2.8),
                (F(29),  5.2, 19.0, -4.2),
                (F(41),  1.5, 16.0, -2.4),
                (F(48), -1.0, 14.0, -1.2),
            ],
        },
        "right_arm": {
            # Brazo derecho adelantado/templado listo para sacar o empuñar la lanza
            "rotation": [
                (F(0),  -38.0, -18.0, 14.0),
                (F(16), -30.0, -14.0, 18.5),
                (F(29), -22.0, -10.0, 23.0),
                (F(41), -31.0, -15.0, 17.5),
                (F(48), -38.0, -18.0, 14.0),
            ],
            "position": [
                (F(0),  -0.15,  0.42, -0.55),
                (F(16), -0.15,  0.02, -0.40),
                (F(29), -0.15, -0.36, -0.25),
                (F(41), -0.15,  0.08, -0.42),
                (F(48), -0.15,  0.42, -0.55),
            ],
        },
        "left_arm": {
            # Brazo izquierdo atrás como contrapeso heroico de esgrimista
            "rotation": [
                (F(0),  18.0, 14.0, -18.0),
                (F(16), 25.0, 18.0, -23.0),
                (F(29), 31.0, 22.0, -28.0),
                (F(41), 23.5, 17.5, -22.0),
                (F(48), 18.0, 14.0, -18.0),
            ],
            "position": [
                (F(0),  0.0,  0.36, 0.25),
                (F(16), 0.0, -0.02, 0.38),
                (F(29), 0.0, -0.36, 0.50),
                (F(41), 0.0,  0.05, 0.35),
                (F(48), 0.0,  0.36, 0.25),
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
    # 2. WALK FRONT (16f = 0.6667s loop) — Marcha Ágil de Lancero A&S
    # Cadencia viva de 16f, rodilla alta decidida, rebote elástico y contragiro
    # limpio del torso que hace lucir la lanza cruzada en la espalda.
    # -------------------------------------------------------------------------
    N_WF = 16
    L_WF = F(N_WF)
    wf_lleg = make_leg_track([
        (0,  -38.0, -3.5, -1.5,  0.00, -1.55, 0.00),  # Contacto talón adelante
        (2,  -11.0, -2.0, -3.2, -0.18, -0.45, 0.00),  # Compresión firme absorbiendo impacto
        (4,   24.0,  0.0, -1.0,  0.00,  0.85, 0.00),  # Impulso atrás sobre el suelo
        (6,   47.0,  2.5,  0.0,  0.00,  1.35, 0.40),  # Despegue explosivo de punta (A&S)
        (8,   16.0,  1.0, -1.0,  0.05,  0.20, 1.75),  # Recogida veloz
        (11, -30.0, -2.0, -2.5,  0.16, -1.35, 3.15),  # Passing: rodilla alta de lancero!
        (14, -45.0, -3.5, -2.0,  0.05, -1.95, 1.40),  # Extensión aérea con hang-time
        (16, -38.0, -3.5, -1.5,  0.00, -1.55, 0.00),
    ])
    wf_rleg_rot = [(t, rx, -ry, -rz) for (t, rx, ry, rz) in shift_loop_keyframes(wf_lleg["rotation"], N_WF, N_WF // 2)]
    wf_rleg_pos = [(t, -px, py, pz) for (t, px, py, pz) in shift_loop_keyframes(wf_lleg["position"], N_WF, N_WF // 2)]

    wf_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(2),  1.045, 0.938, 1.045),
                (F(5),  0.968, 1.048, 0.968),
                (F(8),  1.000, 1.000, 1.000),
                (F(10), 1.045, 0.938, 1.045),
                (F(13), 0.968, 1.048, 0.968),
                (F(16), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  11.0,  8.0,  3.2),
                (F(2),  14.5,  5.0,  6.0),
                (F(5),   8.5, -4.0,  0.6),
                (F(8),  11.0, -8.0, -3.2),
                (F(10), 14.5, -5.0, -6.0),
                (F(13),  8.5,  4.0, -0.6),
                (F(16), 11.0,  8.0,  3.2),
            ],
            "position": [
                (F(0),   0.18, -0.35, -0.55),
                (F(2),   0.45, -1.65, -0.30),
                (F(5),   0.05,  1.15, -0.75),
                (F(8),  -0.18, -0.35, -0.55),
                (F(10), -0.45, -1.65, -0.30),
                (F(13), -0.05,  1.15, -0.75),
                (F(16),  0.18, -0.35, -0.55),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  -2.0, -18.0,  0.0),
                (F(4),  -1.0,  -4.5, -1.8),
                (F(8),  -2.0,  18.0,  0.0),
                (F(12), -1.0,   4.5,  1.8),
                (F(16), -2.0, -18.0,  0.0),
            ],
            "position": [
                (F(0),  0.0,  0.05, -0.20),
                (F(3),  0.0, -0.42, -0.10),
                (F(6),  0.0,  0.50, -0.30),
                (F(11), 0.0, -0.42, -0.10),
                (F(14), 0.0,  0.50, -0.30),
                (F(16), 0.0,  0.05, -0.20),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  -8.5, -6.0, -2.4),
                (F(3),  -5.5, -2.5, -4.0),
                (F(6), -11.0,  2.5, -0.6),
                (F(8),  -8.5,  6.0,  2.4),
                (F(11), -5.5,  2.5,  4.0),
                (F(14),-11.0, -2.5,  0.6),
                (F(16), -8.5, -6.0, -2.4),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),   48.0, -14.0, -15.0),
                (F(4),    6.0,  -2.0, -11.0),
                (F(8),  -54.0,  18.0, -14.0),
                (F(12),  -6.0,   4.0, -17.0),
                (F(16),  48.0, -14.0, -15.0),
            ],
            "position": [
                (F(0),  0.0,  0.12,  0.35),
                (F(3),  0.0, -0.42,  0.05),
                (F(6),  0.0,  0.55, -0.45),
                (F(11), 0.0, -0.42, -0.25),
                (F(14), 0.0,  0.55,  0.18),
                (F(16), 0.0,  0.12,  0.35),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  -54.0, -18.0,  14.0),
                (F(4),   -6.0,  -4.0,  17.0),
                (F(8),   48.0,  14.0,  15.0),
                (F(12),   6.0,   2.0,  11.0),
                (F(16), -54.0, -18.0,  14.0),
            ],
            "position": [
                (F(0),  0.0,  0.12, -0.45),
                (F(3),  0.0, -0.42, -0.25),
                (F(6),  0.0,  0.55,  0.18),
                (F(11), 0.0, -0.42,  0.05),
                (F(14), 0.0,  0.55, -0.45),
                (F(16), 0.0,  0.12, -0.45),
            ],
        },
        "left_leg": wf_lleg,
        "right_leg": {"rotation": wf_rleg_rot, "position": wf_rleg_pos},
    }
    anims.append(make_bb_anim("Walk front", L_WF, True, bone_uuids, wf_tracks))

    # -------------------------------------------------------------------------
    # 3. WALK BACK (18f = 0.75s loop) — Retroceso Táctico de Alcance (Spacing)
    # Un lancero retrocede midiendo la punta de su alcance: perfil derecho al
    # frente (`low_body` ry = -13°), paso atrás buscando piso con la punta y
    # mirada clavada en el rival.
    # -------------------------------------------------------------------------
    N_WB = 18
    L_WB = F(N_WB)
    wb_lleg = make_leg_track([
        (0,   32.0, -6.0, -2.5,  0.12,  1.25, 0.00),  # Punta toca atrás
        (3,   10.0, -5.0, -3.5,  0.22,  0.40, 0.00),  # Talón asienta absorbiendo peso
        (6,  -20.0, -3.0, -2.0,  0.08, -0.80, 0.00),  # Pierna delante empuja hacia atrás
        (8,  -31.0, -2.0, -1.5,  0.05, -1.20, 0.50),  # Despegue frontal
        (12,  -4.0, -4.0, -3.0,  0.18, -0.05, 2.35),  # Recogida ágil por el aire
        (15,  35.0, -6.0, -2.5,  0.15,  1.40, 1.15),  # Extensión buscando piso atrás
        (18,  32.0, -6.0, -2.5,  0.12,  1.25, 0.00),
    ])
    wb_rleg_rot = [(t, rx, -ry, -rz) for (t, rx, ry, rz) in shift_loop_keyframes(wb_lleg["rotation"], N_WB, N_WB // 2)]
    wb_rleg_pos = [(t, -px, py, pz) for (t, px, py, pz) in shift_loop_keyframes(wb_lleg["position"], N_WB, N_WB // 2)]

    wb_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(3),  1.034, 0.954, 1.034),
                (F(7),  0.978, 1.034, 0.978),
                (F(9),  1.000, 1.000, 1.000),
                (F(12), 1.034, 0.954, 1.034),
                (F(16), 0.978, 1.034, 0.978),
                (F(18), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   5.5, -10.0,  2.4),
                (F(3),   8.0, -13.5,  4.2),
                (F(7),   4.0, -16.0,  1.0),
                (F(9),   5.5, -18.0, -2.0),
                (F(12),  8.0, -14.5, -3.8),
                (F(16),  4.0, -11.0, -0.6),
                (F(18),  5.5, -10.0,  2.4),
            ],
            "position": [
                (F(0),   0.25, -0.45, 0.35),
                (F(3),   0.45, -1.45, 0.55),
                (F(7),   0.15,  0.55, 0.20),
                (F(9),   0.05, -0.45, 0.35),
                (F(12), -0.15, -1.45, 0.55),
                (F(16),  0.10,  0.55, 0.20),
                (F(18),  0.25, -0.45, 0.35),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  2.0,  8.5, 0.0),
                (F(5),  3.5,  2.0, 1.5),
                (F(9),  2.0, -5.5, 0.0),
                (F(14), 3.5,  2.0, -1.5),
                (F(18), 2.0,  8.5, 0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  -3.5, 11.0, -1.5),
                (F(4),  -1.5, 13.5, -2.8),
                (F(9),  -3.5, 16.5,  1.2),
                (F(14), -1.5, 13.0,  2.4),
                (F(18), -3.5, 11.0, -1.5),
            ],
        },
        "right_arm": {
            # Guardia derecha al frente manteniendo amenaza de lanza
            "rotation": [
                (F(0),  -44.0, -16.0, 14.0),
                (F(5),  -30.0, -10.0, 18.0),
                (F(9),  -18.0,  -6.0, 20.0),
                (F(14), -32.0, -12.0, 16.0),
                (F(18), -44.0, -16.0, 14.0),
            ],
            "position": [
                (F(0),  -0.15,  0.20, -0.45),
                (F(5),  -0.15, -0.25, -0.25),
                (F(9),  -0.15,  0.30, -0.10),
                (F(14), -0.15, -0.20, -0.30),
                (F(18), -0.15,  0.20, -0.45),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  -14.0, 12.0, -18.0),
                (F(5),    8.0, 16.0, -22.0),
                (F(9),   26.0, 20.0, -24.0),
                (F(14),   4.0, 15.0, -20.0),
                (F(18), -14.0, 12.0, -18.0),
            ],
            "position": [
                (F(0),  0.0,  0.20, 0.15),
                (F(5),  0.0, -0.25, 0.30),
                (F(9),  0.0,  0.30, 0.42),
                (F(14), 0.0, -0.20, 0.25),
                (F(18), 0.0,  0.20, 0.15),
            ],
        },
        "left_leg": wb_lleg,
        "right_leg": {"rotation": wb_rleg_rot, "position": wb_rleg_pos},
    }
    anims.append(make_bb_anim("Walk Back", L_WB, True, bone_uuids, wb_tracks))

    # -------------------------------------------------------------------------
    # 4. WALK LEFT (16f = 0.6667s loop) — Footsies Laterales de Esgrimista (Izq)
    # Desplazamiento lateral puro de lancero rodeando al oponente hacia su izq
    # (`pos.x > 0` = izquierda del personaje, `rz < 0` en pierna izq abre afuera).
    # -------------------------------------------------------------------------
    N_WL = 16
    L_WL = F(N_WL)
    wl_lleg = make_leg_track([
        (0,  -10.0, -10.0, -24.0,  0.95, -0.45, 0.00),  # Pie izq abre y planta a la izq
        (3,  -13.0,  -8.0, -14.0,  0.55, -0.45, 0.00),  # Absorbe peso en planta firme
        (7,   -8.0,  -6.0,   4.0, -0.20, -0.30, 0.00),  # Empuja caderas hacia la izq
        (10, -14.0,  -8.0,  -8.0,  0.10, -0.40, 1.45),  # Despega rápido
        (13, -22.0, -11.0, -28.0,  0.85, -0.60, 2.65),  # Rodilla lateral alta A&S!
        (16, -10.0, -10.0, -24.0,  0.95, -0.45, 0.00),
    ])
    wl_rleg = make_leg_track([
        (0,    8.0,  10.0,  22.0, -0.75,  0.45, 0.00),  # Pie der empuja desde afuera
        (2,   10.0,  10.0,  14.0, -0.35,  0.45, 0.35),  # Despega para cruzar hacia la izq
        (6,  -26.0,  12.0,  -8.0,  0.85, -1.15, 2.75),  # Cruza ágil por delante en el aire!
        (9,   -9.0,   8.0,  -4.0,  0.50, -0.35, 0.00),  # Planta al centro-izq tomando peso
        (11,  -2.0,   8.0,   4.0,  0.10, -0.05, 0.00),  # Pivote suave sin hundirse
        (13,   5.0,  10.0,  13.0, -0.35,  0.25, 0.00),  # Desliza/tracciona hacia la der
        (16,   8.0,  10.0,  22.0, -0.75,  0.45, 0.00),
    ])
    wl_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(3),  1.038, 0.948, 1.022),
                (F(6),  0.976, 1.038, 0.984),
                (F(9),  1.034, 0.954, 1.022),
                (F(13), 0.980, 1.034, 0.988),
                (F(16), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   6.5, -12.0,  3.5),
                (F(3),   9.5, -10.0,  6.5),
                (F(6),   5.5, -15.0,  1.5),
                (F(9),   9.0, -18.0, -3.2),
                (F(13),  5.5, -14.0,  1.0),
                (F(16),  6.5, -12.0,  3.5),
            ],
            "position": [
                (F(0),   0.45, -0.35, -0.10),
                (F(3),   0.85, -1.45,  0.00),
                (F(6),   0.20,  0.80, -0.25),
                (F(9),  -0.25, -1.30, -0.10),
                (F(13),  0.20,  0.70, -0.20),
                (F(16),  0.45, -0.35, -0.10),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  -1.0,  8.0, -1.5),
                (F(4),   0.0, 11.0, -3.0),
                (F(9),  -1.0,  3.0,  2.2),
                (F(13),  0.0,  6.0,  0.0),
                (F(16), -1.0,  8.0, -1.5),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  -3.5, 10.0, -2.0),
                (F(4),  -5.5,  8.0, -4.5),
                (F(9),  -4.0, 15.0,  2.0),
                (F(13), -2.5, 11.5, -0.5),
                (F(16), -3.5, 10.0, -2.0),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),   14.0, 14.0, -24.0),
                (F(4),   24.0, 10.0, -32.0),
                (F(9),   -8.0, 18.0, -16.0),
                (F(13),   6.0, 16.0, -20.0),
                (F(16),  14.0, 14.0, -24.0),
            ],
            "position": [
                (F(0),  0.0,  0.15,  0.20),
                (F(4),  0.0, -0.30,  0.30),
                (F(9),  0.1,  0.35, -0.10),
                (F(16), 0.0,  0.15,  0.20),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  -38.0, -18.0, 16.0),
                (F(4),  -30.0, -14.0, 22.0),
                (F(9),  -46.0, -22.0, 12.0),
                (F(13), -42.0, -20.0, 14.0),
                (F(16), -38.0, -18.0, 16.0),
            ],
            "position": [
                (F(0),  -0.1,  0.15, -0.45),
                (F(4),  -0.1, -0.30, -0.30),
                (F(9),  -0.1,  0.35, -0.55),
                (F(16), -0.1,  0.15, -0.45),
            ],
        },
        "left_leg": wl_lleg,
        "right_leg": wl_rleg,
    }
    anims.append(make_bb_anim("Walk left", L_WL, True, bone_uuids, wl_tracks))

    # -------------------------------------------------------------------------
    # 5. WALK RIGHT (16f = 0.6667s loop) — Espejo exacto de Walk left
    # -------------------------------------------------------------------------
    wr_tracks = mirror_tracks(wl_tracks)
    anims.append(make_bb_anim("Walk Right", L_WL, True, bone_uuids, wr_tracks))

    # -------------------------------------------------------------------------
    # 6. JUMP (22f = 0.9167s once) — Salto Dragoon ("Picado del Dragón")
    # Agachada elástica profunda -> despegue explosivo vertical -> pose aérea de
    # lancero dragoon (rodilla derecha muy alta al pecho, pierna izq extendida
    # abajo, brazo derecho alzado con ímpetu heroico) -> preparación de caída.
    # -------------------------------------------------------------------------
    L_JMP = F(22)
    jmp_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(3),  1.095, 0.835, 1.095),  # Squash profundo antes de saltar!
                (F(5),  0.885, 1.165, 0.885),  # Stretch explosivo de dragoon!
                (F(10), 1.015, 0.980, 1.015),
                (F(15), 1.025, 0.968, 1.025),  # Hang-time heroico en el ápice
                (F(19), 0.955, 1.060, 0.955),  # Estiramiento preparando caída
                (F(22), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),    3.0, -16.0,  1.5),
                (F(3),   24.0, -12.0,  3.0),   # Carga de torso abajo
                (F(5),  -12.0,  -6.0, -1.5),   # Pecho proyectado al cielo!
                (F(11),   8.0, -14.0,  3.5),   # Pose dragoon en el ápice
                (F(16),  14.0, -12.0,  2.5),
                (F(22),   6.0, -15.0,  1.8),
            ],
            "position": [
                (F(0),  0.20,  0.10,  0.00),
                (F(3),  0.30, -3.60,  0.65),
                (F(5),  0.00,  1.90, -0.55),
                (F(11), 0.15,  2.60, -0.25),
                (F(16), 0.15,  1.80, -0.10),
                (F(22), 0.20,  0.10,  0.00),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  -2.0,  4.0,  1.0),
                (F(3),   8.0,  8.0,  2.0),
                (F(6),  -9.0, -6.0, -1.5),
                (F(12),  4.0,  8.0,  2.0),
                (F(18),  2.0,  5.0,  1.0),
                (F(22), -2.0,  4.0,  1.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),   -1.0, 14.0, -1.0),
                (F(3),   14.0, 10.0, -2.0),
                (F(6),  -20.0,  6.0,  1.0),    # Mira arriba al despegar
                (F(12),   8.0, 12.0, -2.0),    # En el ápice mira abajo al rival!
                (F(18),  12.0, 13.0, -1.5),
                (F(22),  -1.0, 14.0, -1.0),
            ],
        },
        "right_arm": {
            # Impulso atrás -> brazo de lanza proyectado arriba-afuera en pose dragoon!
            "rotation": [
                (F(0),   -38.0, -18.0,  14.0),
                (F(3),    52.0,  12.0,  26.0),
                (F(6),  -142.0,   8.0, -18.0),
                (F(12), -122.0,   4.0, -20.0),
                (F(17),  -68.0, -14.0,  12.0),
                (F(22),  -38.0, -18.0,  14.0),
            ],
            "position": [
                (F(0),  -0.15,  0.35, -0.50),
                (F(3),   0.00, -0.65,  0.75),
                (F(6),  -0.35,  1.15, -0.25),
                (F(12), -0.35,  0.95, -0.20),
                (F(17), -0.20,  0.55, -0.45),
                (F(22), -0.15,  0.35, -0.50),
            ],
        },
        "left_arm": {
            # Ala de equilibrio dragoon abierta hacia atrás-afuera dejando el rostro despejado!
            "rotation": [
                (F(0),    18.0, 14.0, -18.0),
                (F(3),    58.0, 16.0, -28.0),
                (F(6),    26.0, 22.0, -46.0),
                (F(12),   34.0, 24.0, -42.0),
                (F(17),   24.0, 18.0, -30.0),
                (F(22),   18.0, 14.0, -18.0),
            ],
            "position": [
                (F(0),  0.0,  0.35,  0.25),
                (F(3),  0.0, -0.65,  0.80),
                (F(6),  0.25, 0.55,  0.45),
                (F(12), 0.25, 0.45,  0.35),
                (F(17), 0.10, 0.40,  0.25),
                (F(22), 0.0,  0.35,  0.25),
            ],
        },
        "right_leg": make_leg_track([
            (0,  -12.5,  14.0,  6.5, -0.55, -1.40, 0.00),
            (3,  -28.0,  12.0,  9.0, -0.50, -1.85, 0.00),  # Planta firme cargando resorte
            (5,   30.0,   6.0,  5.0, -0.20,  1.05, 1.30),  # Punta estira abajo al despegar
            (11, -64.0,  10.0, 10.0, -0.35, -2.50, 5.20),  # Rodilla dragoon muy alta al pecho!
            (16, -46.0,  12.0,  9.0, -0.40, -1.95, 3.80),
            (20, -18.0,  13.0,  7.5, -0.50, -1.45, 1.10),
            (22, -12.5,  14.0,  6.5, -0.55, -1.40, 0.00),
        ]),
        "left_leg": make_leg_track([
            (0,   11.5, -18.0, -9.0,  0.48,  1.30, 0.00),
            (3,   24.0, -15.0,-11.0,  0.55,  1.65, 0.00),
            (5,   36.0,  -8.0, -6.0,  0.25,  1.35, 1.10),
            (11,  24.0, -12.0,-10.0,  0.35,  1.20, 2.60),  # Pierna trasera estilizada abajo!
            (16,  14.0, -14.0,-10.0,  0.40,  0.95, 2.20),
            (20,   8.0, -16.0, -9.5,  0.45,  1.15, 0.80),
            (22,  11.5, -18.0, -9.0,  0.48,  1.30, 0.00),
        ]),
    }
    anims.append(make_bb_anim("Jump", L_JMP, False, bone_uuids, jmp_tracks))

    # -------------------------------------------------------------------------
    # 7. DASH FRONT (11f = 0.4583s once) — Embestida Relámpago de Lancero
    # Anticipación comprimida -> disparo horizontal rasante estilo anime
    # (pecho inclinado 40° adelante, brazo derecho liderando la embestida,
    # pierna izq extendida atrás + rodilla der al frente) -> frenada en y = 0.0.
    # -------------------------------------------------------------------------
    L_DF = F(11)
    df_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *idle0["low_anchor"]["scale"]),
                (F(1),  1.080, 0.875, 1.060),  # Compresión explosiva
                (F(3),  0.895, 0.915, 1.165),  # Smear horizontal de embestida!
                (F(6),  0.945, 0.955, 1.085),
                (F(8),  1.060, 0.910, 0.975),  # Squash de frenada clavando pies!
                (F(11), *idle0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *idle0["low_body"]["rotation"]),
                (F(1),  18.0, -20.0,  3.5),    # Carga baja
                (F(3),  42.0,  14.0, -4.5),    # Torso lanzado de lleno al frente!
                (F(6),  32.0,  10.0, -3.0),
                (F(8),  15.0, -15.0,  3.8),    # Frenada elástica
                (F(11), *idle0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["low_body"]["position"]),
                (F(1),  0.35, -2.25,  0.65),
                (F(3), -0.20, -1.55, -2.35),   # Avance limpio alineado con las piernas!
                (F(6), -0.10, -1.45, -1.70),
                (F(8),  0.30, -1.95, -0.35),
                (F(11), *idle0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *idle0["body"]["rotation"]),
                (F(3),   2.0, 16.0,  0.0),
                (F(6),   1.0, 10.0,  0.0),
                (F(8),  -2.0, -5.0,  0.0),
                (F(11), *idle0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *idle0["head"]["rotation"]),
                (F(1), -10.0,  16.0, -2.0),
                (F(3), -34.0, -24.0,  3.5),    # Levanta la mirada clavándola en el objetivo!
                (F(6), -26.0, -16.0,  2.5),
                (F(8),  -6.0,  14.0, -2.5),
                (F(11), *idle0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            # Brazo derecho lanzado adelante liderando la carga de lancero!
            "rotation": [
                (F(0),  *idle0["right_arm"]["rotation"]),
                (F(1),   24.0,   6.0, 20.0),
                (F(3),  -86.0, -22.0, 14.0),
                (F(6),  -72.0, -18.0, 16.0),
                (F(8),  -30.0, -14.0, 22.0),
                (F(11), *idle0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["right_arm"]["position"]),
                (F(3),  -0.30,  0.45, -1.45),
                (F(6),  -0.20,  0.35, -1.05),
                (F(8),  -0.15, -0.20, -0.35),
                (F(11), *idle0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            # Brazo izquierdo barrido atrás estilo ráfaga anime
            "rotation": [
                (F(0),  *idle0["left_arm"]["rotation"]),
                (F(1),  -18.0,  10.0, -16.0),
                (F(3),   74.0,  14.0, -28.0),
                (F(6),   58.0,  12.0, -24.0),
                (F(8),   12.0,  16.0, -22.0),
                (F(11), *idle0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["left_arm"]["position"]),
                (F(3),  0.00,  0.45,  0.90),
                (F(8),  0.00, -0.15,  0.25),
                (F(11), *idle0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg_track([
            (0,  -12.5,  14.0,  6.5, -0.55, -1.40, 0.00),
            (1,   10.0,  12.0,  8.0, -0.50, -1.55, 0.00),
            (3,  -50.0,   6.0,  6.0, -0.30, -3.15, 3.10),  # Rodilla derecha embistiendo adelante!
            (6,  -38.0,   8.0,  5.5, -0.35, -2.65, 1.80),
            (8,  -25.0,  14.0,  8.5, -0.55, -2.15, 0.00),  # Clava talón en y=0.0!
            (9,  -19.0,  14.0,  7.5, -0.55, -1.78, 0.00),
            (11, -12.5,  14.0,  6.5, -0.55, -1.40, 0.00),
        ]),
        "left_leg": make_leg_track([
            (0,   11.5, -18.0, -9.0,  0.48,  1.30, 0.00),
            (1,   24.0, -16.0, -9.0,  0.50,  0.75, 0.00),
            (3,   62.0,  -6.0, -6.0,  0.30,  2.40, 2.95),  # Pierna izq extendida atrás al máximo!
            (6,   44.0, -10.0, -6.5,  0.35,  1.85, 1.60),
            (8,   19.0, -16.0, -9.5,  0.55,  1.50, 0.00),  # Planta atrás frenando en y=0.0!
            (9,   15.0, -17.0, -9.2,  0.52,  1.40, 0.00),
            (11,  11.5, -18.0, -9.0,  0.48,  1.30, 0.00),
        ]),
    }
    anims.append(make_bb_anim("Dash front", L_DF, False, bone_uuids, df_tracks))

    # -------------------------------------------------------------------------
    # 8. DASH LEFT (10f = 0.4167s once) — Esquive Lateral Cortante (Izquierda)
    # `pos.x > 0` impulsa hacia la izquierda del personaje (+X en juego) con
    # ladeo dinámico `rz = +21°` y derrape controlado clavando en y = 0.0.
    # -------------------------------------------------------------------------
    L_DL = F(10)
    dl_lleg = make_leg_track([
        (0,   11.5, -18.0,  -9.0,  0.48,  1.30, 0.00),
        (1,    6.0, -14.0,   0.0,  0.15,  0.95, 0.00),
        (3,  -16.0, -12.0, -42.0,  2.35, -0.35, 2.45),  # Se lanza abierta a la izq (+X)!
        (5,  -12.0, -12.0, -32.0,  2.05, -0.15, 1.35),
        (8,    6.0, -16.0, -24.0,  1.65,  0.75, 0.00),  # Clava derrape en el suelo y=0!
        (10,  11.5, -18.0,  -9.0,  0.48,  1.30, 0.00),
    ])
    dl_rleg = make_leg_track([
        (0,  -12.5,  14.0,   6.5, -0.55, -1.40, 0.00),
        (1,  -14.0,  12.0,  18.0, -0.95, -1.10, 0.00),
        (3,   12.0,   8.0,  38.0,  1.25, -0.45, 1.95),  # Arrastra extendida tras el empuje!
        (5,    4.0,  10.0,  28.0,  0.95, -0.75, 1.05),
        (8,  -10.0,  14.0,  18.0,  0.15, -1.15, 0.00),  # Planta estabilizando en y=0!
        (10, -12.5,  14.0,   6.5, -0.55, -1.40, 0.00),
    ])
    dl_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *idle0["low_anchor"]["scale"]),
                (F(1),  1.050, 0.880, 1.050),
                (F(3),  1.150, 0.910, 0.940),  # Smear lateral en X!
                (F(5),  1.085, 0.945, 0.970),
                (F(8),  1.055, 0.915, 1.030),  # Compresión de derrape lateral
                (F(10), *idle0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *idle0["low_body"]["rotation"]),
                (F(1),  12.0, -12.0,  -6.0),
                (F(3),  14.0,  -8.0,  21.5),   # Ladeo dinámico hacia la izq!
                (F(5),  12.0, -10.0,  14.0),
                (F(8),  14.0, -16.0,  -9.0),   # Contra-inclinación de derrape!
                (F(10), *idle0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["low_body"]["position"]),
                (F(1),  -0.65, -2.15,  0.15),
                (F(3),   2.35, -1.20, -0.30),  # Impulso limpio a la izq (+X)!
                (F(5),   1.85, -1.30, -0.20),
                (F(8),   0.95, -2.25,  0.10),
                (F(10), *idle0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *idle0["body"]["rotation"]),
                (F(3),   0.0,  10.0,  5.0),
                (F(5),   0.0,   8.0,  2.5),
                (F(8),   0.0,   5.0, -3.5),
                (F(10), *idle0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *idle0["head"]["rotation"]),
                (F(1),  -4.0, 12.0,   4.0),
                (F(3),  -8.0,  8.0, -18.0),
                (F(5),  -6.0, 10.0, -12.0),
                (F(8),  -8.0, 15.0,   7.5),
                (F(10), *idle0["head"]["rotation"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  *idle0["left_arm"]["rotation"]),
                (F(1),   -6.0,  10.0, -22.0),
                (F(3),   24.0, -12.0, -60.0),  # Abre cortando el aire hacia la izq!
                (F(5),   14.0,  -6.0, -48.0),
                (F(8),   -8.0,  14.0, -34.0),
                (F(10), *idle0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["left_arm"]["position"]),
                (F(3),  0.45,  0.50,  0.30),
                (F(8),  0.20, -0.20,  0.05),
                (F(10), *idle0["left_arm"]["position"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *idle0["right_arm"]["rotation"]),
                (F(1),  -12.0,  -8.0,  22.0),
                (F(3),  -56.0, -34.0, -14.0),  # Cruza frente al pecho protegiendo guardia!
                (F(5),  -48.0, -26.0,  -8.0),
                (F(8),  -32.0, -16.0,  26.0),
                (F(10), *idle0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["right_arm"]["position"]),
                (F(3),   0.75,  0.25, -1.05),
                (F(8),  -0.10, -0.15, -0.40),
                (F(10), *idle0["right_arm"]["position"]),
            ],
        },
        "left_leg": dl_lleg,
        "right_leg": dl_rleg,
    }
    anims.append(make_bb_anim("Dash left", L_DL, False, bone_uuids, dl_tracks))

    # -------------------------------------------------------------------------
    # 9. DASH RIGHT (10f = 0.4167s once) — Esquive Lateral Cortante (Derecha)
    # Espejo exacto del impulso lateral de Dash left hacia `-X` (derecha del
    # personaje), partiendo y aterrizando en `idle0` sin ningún salto de pose.
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
    # 10. DASH BACK (12f = 0.50s once) — Salto Atrás Acrobático de Lancero
    # Empuje frontal -> evasión elástica hacia atrás ganando rango de lanza ->
    # aterrizaje bajo de rescate con mano izquierda rozando cerca del suelo y
    # retorno limpio a `idle0`.
    # -------------------------------------------------------------------------
    L_DB = F(12)
    db_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  *idle0["low_anchor"]["scale"]),
                (F(1),  1.065, 0.885, 1.065),
                (F(4),  0.915, 1.105, 0.945),  # Arco elástico hacia atrás!
                (F(7),  0.965, 1.035, 0.980),
                (F(9),  1.080, 0.865, 1.080),  # Aterrizaje bajo amortiguado!
                (F(12), *idle0["low_anchor"]["scale"]),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  *idle0["low_body"]["rotation"]),
                (F(1),  14.0, -14.0,  2.0),    # Carga adelante para patear el suelo
                (F(4), -18.0, -12.0, -2.5),    # Pecho arqueado atrás en el aire!
                (F(7),  -6.0, -15.0,  1.0),
                (F(9),  24.0, -20.0,  5.0),    # Agachada profunda al clavar pies atrás!
                (F(12), *idle0["low_body"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["low_body"]["position"]),
                (F(1),  0.15, -1.75, -0.85),
                (F(4),  0.25,  2.10,  3.80),   # Salto largo hacia atrás (+Z en BB)!
                (F(7),  0.30,  0.85,  3.10),
                (F(9),  0.50, -2.85,  1.65),   # Amortiguación profunda
                (F(12), *idle0["low_body"]["position"]),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  *idle0["body"]["rotation"]),
                (F(4),  -6.0,  6.0, -2.0),
                (F(9),   8.0, 10.0,  2.5),
                (F(12), *idle0["body"]["rotation"]),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  *idle0["head"]["rotation"]),
                (F(1),  -6.0, 12.0, -1.5),
                (F(4),  20.0, 10.0,  1.5),     # Barbilla baja para no perder de vista al rival!
                (F(9), -14.0, 18.0, -3.0),     # Mira al frente desde la agachada baja!
                (F(12), *idle0["head"]["rotation"]),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  *idle0["right_arm"]["rotation"]),
                (F(1),   16.0,  -8.0, 20.0),
                (F(4),  -68.0, -14.0, 26.0),   # Brazos lanzados al frente por contrapeso aéreo!
                (F(9),  -46.0, -20.0, 22.0),
                (F(12), *idle0["right_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["right_arm"]["position"]),
                (F(4),  -0.15,  0.65, -0.95),
                (F(9),  -0.20, -0.45, -0.60),
                (F(12), *idle0["right_arm"]["position"]),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  *idle0["left_arm"]["rotation"]),
                (F(1),   34.0, 16.0, -22.0),
                (F(4),  -56.0, 18.0, -32.0),
                (F(9),  -32.0, 10.0, -30.0),   # Mano izq baja estabilizando el aterrizaje!
                (F(12), *idle0["left_arm"]["rotation"]),
            ],
            "position": [
                (F(0),  *idle0["left_arm"]["position"]),
                (F(4),  0.10,  0.55, -0.75),
                (F(9),  0.10, -1.20, -0.40),
                (F(12), *idle0["left_arm"]["position"]),
            ],
        },
        "right_leg": make_leg_track([
            (0,  -12.5,  14.0,   6.5, -0.55, -1.40, 0.00),
            (1,  -24.0,  12.0,   8.0, -0.50, -1.95, 0.00),  # Empuja el suelo adelante
            (4,  -46.0,  10.0,   8.0, -0.35,  1.80, 3.40),  # Rodillas recogidas saltando atrás!
            (7,  -22.0,  12.0,   7.5, -0.45,  1.20, 1.50),
            (9,  -28.0,  15.0,  10.5, -0.60,  0.15, 0.00),  # Clava pie delantero amortiguando
            (10, -20.5,  14.5,   8.5, -0.58, -0.60, 0.00),
            (12, -12.5,  14.0,   6.5, -0.55, -1.40, 0.00),
        ]),
        "left_leg": make_leg_track([
            (0,   11.5, -18.0,  -9.0,  0.48,  1.30, 0.00),
            (1,    6.0, -16.0, -10.0,  0.45,  0.85, 0.00),
            (4,   28.0, -12.0, -10.0,  0.35,  4.50, 2.80),  # Busca el suelo atrás en el aire!
            (7,   22.0, -15.0, -10.0,  0.45,  3.60, 1.10),
            (9,   26.0, -18.0, -12.5,  0.65,  2.65, 0.00),  # Ancla pie trasero firme en y=0!
            (10,  18.5, -18.0, -10.8,  0.56,  1.98, 0.00),
            (12,  11.5, -18.0,  -9.0,  0.48,  1.30, 0.00),
        ]),
    }
    anims.append(make_bb_anim("Dash back", L_DB, False, bone_uuids, db_tracks))

    return anims


# =============================================================================
# EVALUACIÓN EXACTA 3D (Catmull-Rom + Matrices 4x4) -> CalFight + Render Preview
# =============================================================================

def eval_channel_catmull(kfs, t, length, loop):
    if not kfs:
        return None
    n = len(kfs)
    if n == 1:
        dp = kfs[0]["data_points"][0]
        return (dp["x"], dp["y"], dp["z"])
    pts = [(k["time"], k["data_points"][0]["x"], k["data_points"][0]["y"], k["data_points"][0]["z"]) for k in kfs]
    if loop and abs(pts[-1][0] - length) < 1e-4 and all(abs(pts[-1][j] - pts[0][j]) < 1e-4 for j in (1, 2, 3)):
        return eval_periodic_tuples(pts, length, t)
    ts = [p[0] for p in pts]
    vs = [(p[1], p[2], p[3]) for p in pts]
    if t <= ts[0]:
        return vs[0]
    if t >= ts[-1]:
        return vs[-1]
    idx = 0
    for j in range(n - 1):
        if ts[j] <= t + 1e-7:
            idx = j
    g = lambda k: (ts[min(max(k, 0), n - 1)], vs[min(max(k, 0), n - 1)])
    (t0, p0), (t1, p1), (tm, pm), (tp, pp) = g(idx), g(idx + 1), g(idx - 1), g(idx + 2)
    h = t1 - t0
    u = 0.0 if h < 1e-7 else max(0.0, min(1.0, (t - t0) / h))
    u2, u3 = u * u, u * u * u
    out = []
    for j in range(3):
        m0 = (p1[j] - pm[j]) / ((t1 - tm) or 1.0) * h if idx > 0 else 0.0
        m1 = (pp[j] - p0[j]) / ((tp - t0) or 1.0) * h if idx + 2 < n else 0.0
        out.append((2 * u3 - 3 * u2 + 1) * p0[j] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1[j] + (u3 - u2) * m1)
    return tuple(out)


def mat_inv_rigid_uniform_or_diag(M):
    cols = [[M[r][c] for r in range(3)] for c in range(3)]
    s = [math.sqrt(sum(x * x for x in col)) or 1.0 for col in cols]
    R = [[M[r][c] / s[c] for c in range(3)] for r in range(3)]
    L_inv = [[R[c][r] / s[r] for c in range(3)] for r in range(3)]
    t = [M[0][3], M[1][3], M[2][3]]
    t_inv = [-sum(L_inv[r][c] * t[c] for c in range(3)) for r in range(3)]
    return [
        [L_inv[0][0], L_inv[0][1], L_inv[0][2], t_inv[0]],
        [L_inv[1][0], L_inv[1][1], L_inv[1][2], t_inv[1]],
        [L_inv[2][0], L_inv[2][1], L_inv[2][2], t_inv[2]],
        [0, 0, 0, 1],
    ]


def decompose_xyz(M):
    pos = (M[0][3], M[1][3], M[2][3])
    sx = math.sqrt(M[0][0] ** 2 + M[1][0] ** 2 + M[2][0] ** 2) or 1.0
    sy = math.sqrt(M[0][1] ** 2 + M[1][1] ** 2 + M[2][1] ** 2) or 1.0
    sz = math.sqrt(M[0][2] ** 2 + M[1][2] ** 2 + M[2][2] ** 2) or 1.0
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


BBS_TREE = {
    "anchor":      {"origin": (0.0, 16.0, 0.0), "parent": None},
    "low_anchor":  {"origin": (0.0, 0.0, 0.0),  "parent": "anchor"},
    "low_body":    {"origin": (0.0, 12.0, 0.0), "parent": "low_anchor"},
    "body":        {"origin": (0.0, 24.0, 0.0), "parent": "low_body"},
    "torso":       {"origin": (0.0, 24.0, 0.0), "parent": "body"},
    "right_arm":   {"origin": (6.0, 22.0, 0.0), "parent": "body"},
    "left_arm":    {"origin": (-6.0, 22.0, 0.0), "parent": "body"},
    "head":        {"origin": (0.0, 24.0, 0.0), "parent": "low_body"},
    "right_leg":   {"origin": (1.9, 12.0, 0.0), "parent": "low_anchor"},
    "left_leg":    {"origin": (-1.9, 12.0, 0.0), "parent": "low_anchor"},
}
BBS_ORDER = ["anchor", "low_anchor", "low_body", "body", "torso", "right_arm", "left_arm", "head", "right_leg", "left_leg"]


def eval_bbs_world_matrices(anim, t):
    loop = anim["loop"] == "loop"
    length = anim["length"]
    by_name = {b["name"]: b["keyframes"] for b in anim["animators"].values()}
    world = {}
    for bname in BBS_ORDER:
        info = BBS_TREE[bname]
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


def convert_anim_to_calfight_clip(anim, custom_gait=False, armed_spear=False, full_jump=False):
    """Convierte la animación BBS a clip de 60 fps para `JAVI_BB_DATA`.
    Cuando `armed_spear=True`, estabiliza el ángulo `sx` de la muñeca derecha (`gripRot`)
    y modera el arco hacia abajo de `arx` si lleva la lanza en la mano (`spearOut=True`),
    evitando que la lanza de 26px atraviese el suelo al caminar o esquivar."""
    length = anim["length"]
    loop = anim["loop"] == "loop"
    n_samples = int(round(length * FPS_GAME)) + 1
    T_shift_torso = [[1, 0, 0, 0], [0, 1, 0, -12.0], [0, 0, 1, 0], [0, 0, 0, 1]]

    all_frames = []
    for i in range(n_samples):
        t = min(length, i / FPS_GAME)
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

        arx_val = r_ar[0]
        sx_val = 0.0
        if armed_spear:
            # Con lanza en mano (`spearOut == True`), en Three.js `arx + sx < 0` apunta la lanza
            # hacia arriba/adelante. Mantenemos un portado de lancero limpio (~ -1.05 rad = 60° arriba).
            if anim["name"] == "Walk front":
                arx_val = -0.52 + 0.22 * r_ar[0]
                sx_val = -0.95 - arx_val
            else:
                sx_val = max(-1.45, min(0.35, -0.98 - arx_val - 0.6 * r_in[0]))

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
            "arx": arx_val, "ary": r_ar[1], "arz": r_ar[2], "ars": s_ar[1],
            "sx": sx_val,

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
            if ch in ("ix", "iy", "iz", "tx", "ty", "tz", "hx", "hy", "hz", "alx", "aly", "alz", "arx", "ary", "arz", "llx", "lly", "llz", "lrx", "lry", "lrz", "sx") and ch in prev_vals:
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
# RENDERIZADOR DE VISTA PREVIA 3D (Paleta Javicubito + Lanza en la espalda)
# =============================================================================

PARTS_BOXES = [
    ("torso",     (-4, -12, -2), (4, 0, 2),   (45, 76, 168)),    # Chaqueta azul real de Javi
    ("head",      (-4, 0, -4),   (4, 8, 4),   (235, 194, 168)),  # Piel / cabello castaño
    ("right_arm", (-2, -10, -2), (2, 2, 2),   (235, 178, 56)),   # Destacado dorado para leer brazo derecho
    ("left_arm",  (-2, -10, -2), (2, 2, 2),   (76, 134, 232)),   # Manga azul clara izquierda
    ("right_leg", (-2, -12, -2), (2, 0, 2),   (36, 52, 84)),     # Pantalón azul oscuro der
    ("left_leg",  (-2, -12, -2), (2, 0, 2),   (56, 82, 128)),    # Pantalón azul medio izq
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
    cell_w, cell_h = 152, 182
    img = Image.new("RGB", (cols * cell_w, len(anims) * cell_h), (18, 24, 36))
    draw = ImageDraw.Draw(img)

    yaw_cam = math.radians(32)
    pitch_cam = math.radians(14)
    cy, sy = math.cos(yaw_cam), math.sin(yaw_cam)
    cp, sp = math.cos(pitch_cam), math.sin(pitch_cam)

    def proj(pt, cx, floor_y, scale=3.45):
        x, y, z = pt
        rx = x * cy - z * sy
        rz = x * sy + z * cy
        ry = y * cp - rz * sp
        rz2 = y * sp + rz * cp
        return (cx + rx * scale, floor_y - ry * scale, rz2)

    for row_idx, anim in enumerate(anims):
        length = anim["length"]
        loop = anim["loop"] == "loop"
        for col_idx in range(cols):
            frac = col_idx / cols if loop else col_idx / (cols - 1)
            t = frac * length
            cx = col_idx * cell_w + cell_w // 2
            floor_y = row_idx * cell_h + cell_h - 26

            g1 = proj((-12, 0, 0), cx, floor_y)
            g2 = proj((12, 0, 0), cx, floor_y)
            g3 = proj((0, 0, -12), cx, floor_y)
            g4 = proj((0, 0, 12), cx, floor_y)
            draw.line([(g1[0], g1[1]), (g2[0], g2[1])], fill=(54, 68, 96), width=1)
            draw.line([(g3[0], g3[1]), (g4[0], g4[1])], fill=(46, 86, 98), width=1)

            W = eval_bbs_world_matrices(anim, t)
            polys = []
            min_foot_y = 999.0

            # Dibuja también la lanza diagonal en la espalda (referencia visual del personaje)
            M_torso = W["torso"]
            sp_a = mat_vec(M_torso, (-5.5, -15.0, -2.9))
            sp_b = mat_vec(M_torso, (6.5, 5.5, -2.9))
            pa = proj(sp_a, cx, floor_y)
            pb = proj(sp_b, cx, floor_y)
            draw.line([(pa[0], pa[1]), (pb[0], pb[1])], fill=(143, 99, 57), width=3)
            draw.ellipse([pb[0] - 3, pb[1] - 3, pb[0] + 3, pb[1] + 3], fill=(78, 230, 214), outline=(18, 24, 36))

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
                        col = (115, 194, 255)  # Cara frontal celeste brillante para leer mirada
                    polys.append((depth, pts2d, col))

            polys.sort(key=lambda item: item[0])
            for _, pts2d, col in polys:
                draw.polygon(pts2d, fill=col, outline=(12, 14, 22))

            if col_idx == 0:
                draw.text((col_idx * cell_w + 6, row_idx * cell_h + 4), anim["name"], fill=(240, 245, 255))
            draw.text((col_idx * cell_w + 6, row_idx * cell_h + cell_h - 16), f"t={t:.2f}s y0={min_foot_y:+.1f}", fill=(160, 185, 215))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


def patch_javi_bb_data_in_html(anims):
    by_name = {a["name"]: a for a in anims}
    clips_unarmed = {
        "idle": convert_anim_to_calfight_clip(by_name["Idle"], armed_spear=False),
        "walk_front": convert_anim_to_calfight_clip(by_name["Walk front"], armed_spear=False),
    }
    clips_armed = {
        "idle": convert_anim_to_calfight_clip(by_name["Idle"], armed_spear=True),
        "walk_front": convert_anim_to_calfight_clip(by_name["Walk front"], armed_spear=True),
        "walk_back": convert_anim_to_calfight_clip(by_name["Walk Back"], custom_gait=True, armed_spear=True),
        "walk_left": convert_anim_to_calfight_clip(by_name["Walk left"], custom_gait=True, armed_spear=True),
        "walk_right": convert_anim_to_calfight_clip(by_name["Walk Right"], custom_gait=True, armed_spear=True),
        "jump": convert_anim_to_calfight_clip(by_name["Jump"], armed_spear=True, full_jump=True),
        "dash_front": convert_anim_to_calfight_clip(by_name["Dash front"], armed_spear=True),
        "dash_left": convert_anim_to_calfight_clip(by_name["Dash left"], armed_spear=True),
        "dash_right": convert_anim_to_calfight_clip(by_name["Dash right"], armed_spear=True),
        "dash_back": convert_anim_to_calfight_clip(by_name["Dash back"], armed_spear=True),
    }

    html_path = REPO / "index.html"
    html = html_path.read_text(encoding="utf-8")
    pat = re.compile(r"(/\* JAVI_BLOCKBENCH_DATA_BEGIN \*/\s*const JAVI_BB_DATA = )(\{.*?\})(;\s*/\* JAVI_BLOCKBENCH_DATA_END \*/)", re.S)
    m = pat.search(html)
    assert m, "No se encontró el bloque JAVI_BB_DATA en index.html"
    data = json.loads(m.group(2))

    # Respaldar la idle BBS previa de 6s por si se necesita consultar más adelante
    if "idle" in data and data["idle"].get("length") == 6.0 and "idle_bbs_6s" not in data:
        data["idle_bbs_6s"] = data["idle"]

    # Mapear las 10 animaciones de movimiento A&S de Javicubito preservando todos sus combos,
    # habilidades, voces (`idle_voz_1..3`), `sacar_lanza`, `guardar_lanza` y cinemáticas.
    data["idle"] = clips_armed["idle"]
    data["idle_combate"] = clips_armed["idle"]
    data["idle_sin_arma"] = clips_unarmed["idle"]

    data["caminar"] = clips_armed["walk_front"]
    data["correr"] = clips_armed["walk_front"]
    data["caminar_sin_arma"] = clips_unarmed["walk_front"]
    data["correr_sin_arma"] = clips_unarmed["walk_front"]

    data["caminar_atras"] = clips_armed["walk_back"]
    data["correr_atras"] = clips_armed["walk_back"]
    data["caminar_izq"] = clips_armed["walk_left"]
    data["correr_izq"] = clips_armed["walk_left"]
    data["caminar_der"] = clips_armed["walk_right"]
    data["correr_der"] = clips_armed["walk_right"]

    data["salto"] = clips_armed["jump"]
    data["esquive"] = clips_armed["dash_front"]
    data["esquive_izq"] = clips_armed["dash_left"]
    data["esquive_der"] = clips_armed["dash_right"]
    data["esquive_atras"] = clips_armed["dash_back"]

    serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    new_html = html[:m.start()] + m.group(1) + serialized + m.group(3) + html[m.end():]
    html_path.write_text(new_html, encoding="utf-8")
    print("Actualizado JAVI_BB_DATA en index.html con las 10 animaciones de movimiento A&S.")


def main():
    model, _ = build_clean_base_model()
    bone_uuids = collect_bone_uuids(model["outliner"])
    anims = author_all_animations(bone_uuids)
    model["animations"] = anims

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_BBMODEL.write_text(json.dumps(model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Guardado Blockbench:", OUT_BBMODEL, f"({len(anims)} animaciones)")

    preview_path = SCRATCH / "javicubito_movement_sheet.png"
    render_contact_sheet(anims, preview_path)
    print("Guardada vista previa:", preview_path)

    if "--apply-html" in sys.argv:
        patch_javi_bb_data_in_html(anims)


if __name__ == "__main__":
    main()
