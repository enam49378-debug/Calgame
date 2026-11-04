"""Genera ElRandi_BBS.bbmodel (basado en alex_A&S_BBS_V2.bbmodel sin animaciones previas)
con estilo Actions & Stuff (Cartoon / Anime) para las 10 animaciones de movimiento de ElRandi,
renderiza hojas de contacto para verificación visual y compila los clips a RANDI_BB_DATA en index.html."""
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
OUT_DIR = REPO / "blockbench" / "Randi"
OUT_BBMODEL = OUT_DIR / "ElRandi_BBS.bbmodel"
OUT_SKIN = OUT_DIR / "skin.png"
SCRATCH = Path(r"C:\Users\jesul\.gemini\antigravity\brain\c20a7088-7590-4809-ab1d-f3e04deaa0b7\scratch")

FPS_BB = 24
FPS_GAME = 60


def F(frame: float) -> float:
    return round(frame / FPS_BB, 4)


def uid(tag: str) -> str:
    return str(uuid5(NAMESPACE_URL, "blockstrike/elrandi_bbs/" + tag))


def face_rects(u, v, w, h, d):
    return {
        "east": [u, v + d, u + d, v + d + h],
        "north": [u + d, v + d, u + d + w, v + d + h],
        "west": [u + d + w, v + d, u + 2 * d + w, v + d + h],
        "south": [u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h],
        "up": [u + d + w, v + d, u + d, v],
        "down": [u + d + 2 * w, v, u + d + w, v + d],
    }


def extract_randi_skin():
    html = (REPO / "index.html").read_text(encoding="utf-8")
    m = re.search(
        r"randi:\s*\{\s*name:\s*'ElRandi'[\s\S]{0,800}?skinData:\s*'data:image/png;base64,([^']+)'",
        html,
    )
    assert m, "No se encontró skinData de ElRandi (CHARS.randi) en index.html"
    b64 = m.group(1)
    raw = base64.b64decode(b64)
    r6_path = OUT_DIR / "Randi-R6.bbmodel"
    if r6_path.exists():
        r6_src = json.loads(r6_path.read_text(encoding="utf-8"))["textures"][0]["source"]
        r6_b64 = r6_src.split(",", 1)[1]
        assert base64.b64decode(r6_b64) == raw, "Discrepancia entre CHARS.randi.skinData y Randi-R6.bbmodel"
    return "data:image/png;base64," + b64, raw


def build_clean_base_model():
    model = json.loads(BASE_BBMODEL.read_text(encoding="utf-8"))
    skin_data_url, skin_bytes = extract_randi_skin()

    model["name"] = "ElRandi_BBS"
    model["model_identifier"] = "randi"
    model["animations"] = []  # Quitamos TODAS las animaciones originales de alex_A&S_BBS_V2
    model["variable_placeholders"] = ""
    model["variable_placeholder_buttons"] = []

    tex = model["textures"][0]
    tex["name"] = "ElRandi.png"
    tex["source"] = skin_data_url
    tex["internal"] = True
    tex["saved"] = False
    tex.pop("path", None)
    tex.pop("relative_path", None)

    # Ajustar cubos de brazos de 3px (Alex) a 4px (Steve) para que la skin de ElRandi
    # encaje al píxel sin cortes UV, conservando toda la jerarquía de huesos de BBS V2.
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
# AUTORÍA DE LAS 10 ANIMACIONES ESTILO ACTIONS & STUFF (CARTOON / ANIME)
# =============================================================================

def author_all_animations(bone_uuids):
    anims = []

    # -------------------------------------------------------------------------
    # 1. IDLE (48f = 2.0s loop) — Postura de combate 3/4 de Invocador de Sombras
    # Un ciclo amplio y fluido de 2.0s estilo Actions & Stuff: respiración
    # elástica marcada, balanceo sutil de peso entre pies firmes en y = 0.0
    # y overlap orgánico de brazos/cabeza (mano izq lista para sombras a lo Megumi).
    # -------------------------------------------------------------------------
    L_IDLE = F(48)
    idle_lleg = make_leg_track([
        (0,  -11.0, -12.0, -6.0,  0.60, -1.35, 0.0),
        (12, -13.0, -12.0, -8.0,  0.46, -1.35, 0.0),
        (24, -15.5, -12.0, -9.8,  0.32, -1.35, 0.0),
        (36, -12.5, -12.0, -7.2,  0.50, -1.35, 0.0),
        (48, -11.0, -12.0, -6.0,  0.60, -1.35, 0.0),
    ])
    idle_rleg = make_leg_track([
        (0,   10.0,  16.0,  8.5, -0.50,  1.25, 0.0),
        (12,  12.0,  16.0,  6.5, -0.64,  1.25, 0.0),
        (24,  14.5,  16.0,  4.8, -0.78,  1.25, 0.0),
        (36,  11.5,  16.0,  7.2, -0.60,  1.25, 0.0),
        (48,  10.0,  16.0,  8.5, -0.50,  1.25, 0.0),
    ])
    idle_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  0.986, 1.020, 0.986),
                (F(12), 1.005, 0.994, 1.005),
                (F(24), 1.026, 0.966, 1.026),
                (F(36), 1.002, 0.998, 1.002),
                (F(48), 0.986, 1.020, 0.986),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  4.5, 16.8, -2.0),
                (F(12), 7.0, 18.5, -3.6),
                (F(24), 9.5, 20.2, -5.2),
                (F(36), 6.2, 18.0, -3.2),
                (F(48), 4.5, 16.8, -2.0),
            ],
            "position": [
                (F(0),  -0.22,  0.25, 0.00),
                (F(12), -0.45, -0.60, 0.16),
                (F(24), -0.68, -1.45, 0.34),
                (F(36), -0.40, -0.45, 0.14),
                (F(48), -0.22,  0.25, 0.00),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  0.0, -3.2, -0.8),
                (F(15), 0.0, -6.0,  0.6),
                (F(28), 0.0, -8.5,  1.8),
                (F(40), 0.0, -5.0,  0.2),
                (F(48), 0.0, -3.2, -0.8),
            ],
            "position": [
                (F(0),  0.0,  0.35, 0.0),
                (F(15), 0.0, -0.05, 0.0),
                (F(28), 0.0, -0.40, 0.0),
                (F(40), 0.0,  0.05, 0.0),
                (F(48), 0.0,  0.35, 0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  1.5, -14.5, 1.2),
                (F(16), 4.8, -16.5, 2.8),
                (F(29), 8.0, -18.5, 4.4),
                (F(41), 3.8, -16.0, 2.4),
                (F(48), 1.5, -14.5, 1.2),
            ],
        },
        "left_arm": {
            # Mano izquierda adelantada lista para sello de sombras (con retraso A&S)
            "rotation": [
                (F(0),  -56.0, 25.0,  -9.5),
                (F(16), -48.0, 21.0, -13.5),
                (F(29), -40.0, 17.0, -17.5),
                (F(41), -49.0, 22.0, -13.0),
                (F(48), -56.0, 25.0,  -9.5),
            ],
            "position": [
                (F(0),  0.15,  0.42, -0.65),
                (F(16), 0.15,  0.02, -0.50),
                (F(29), 0.15, -0.35, -0.35),
                (F(41), 0.15,  0.08, -0.52),
                (F(48), 0.15,  0.42, -0.65),
            ],
        },
        "right_arm": {
            # Mano derecha abierta al costado equilibrando la silueta anime
            "rotation": [
                (F(0),  -24.0, -13.0, 15.0),
                (F(16), -17.0, -17.0, 19.5),
                (F(29), -10.0, -21.0, 24.5),
                (F(41), -18.0, -16.5, 19.0),
                (F(48), -24.0, -13.0, 15.0),
            ],
            "position": [
                (F(0),  0.0,  0.35, 0.10),
                (F(16), 0.0, -0.02, 0.22),
                (F(29), 0.0, -0.35, 0.34),
                (F(41), 0.0,  0.05, 0.20),
                (F(48), 0.0,  0.35, 0.10),
            ],
        },
        "left_leg": idle_lleg,
        "right_leg": idle_rleg,
    }
    # Guardamos la pose 0 de Idle para que todos los Dashes encadenen sin cortes
    idle0 = {
        b: {ch: pts[0][1:4] for ch, pts in chs.items()}
        for b, chs in idle_tracks.items()
    }
    anims.append(make_bb_anim("Idle", L_IDLE, True, bone_uuids, idle_tracks))

    # -------------------------------------------------------------------------
    # 2. WALK FRONT (18f = 0.75s loop) — Zancada expresiva Actions & Stuff
    # Contacto limpio (y0=0) -> compresión elástica -> despegue de punta ->
    # rodilla alta (passing) con hang-time cartoon y contragiro enérgico.
    # -------------------------------------------------------------------------
    N_WF = 18
    L_WF = F(N_WF)
    wf_lleg = make_leg_track([
        (0,  -34.0, -3.0, -1.5,  0.00, -1.45, 0.00),  # Contacto talón adelante
        (2,  -10.0, -2.0, -3.0, -0.15, -0.40, 0.00),  # Planta firme absorbiendo peso
        (5,   26.0,  0.0, -1.0,  0.00,  0.85, 0.00),  # Empuje atrás en el suelo
        (7,   44.0,  2.0,  0.0,  0.00,  1.25, 0.35),  # Despegue de punta (toe-off A&S)
        (9,   18.0,  1.0, -1.0,  0.05,  0.25, 1.55),  # Recogida rápida
        (12, -26.0, -1.5, -2.5,  0.15, -1.25, 2.95),  # Passing: rodilla bien alta!
        (15, -42.0, -3.0, -2.0,  0.05, -1.85, 1.45),  # Extensión en el aire (hang-time)
        (18, -34.0, -3.0, -1.5,  0.00, -1.45, 0.00),
    ])
    wf_rleg_rot = [(t, rx, -ry, -rz) for (t, rx, ry, rz) in shift_loop_keyframes(wf_lleg["rotation"], N_WF, N_WF // 2)]
    wf_rleg_pos = [(t, -px, py, pz) for (t, px, py, pz) in shift_loop_keyframes(wf_lleg["position"], N_WF, N_WF // 2)]

    wf_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(2),  1.040, 0.945, 1.040),
                (F(6),  0.972, 1.042, 0.972),
                (F(9),  1.000, 1.000, 1.000),
                (F(11), 1.040, 0.945, 1.040),
                (F(15), 0.972, 1.042, 0.972),
                (F(18), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   9.0,  7.0,  2.8),
                (F(2),  12.0,  4.5,  5.5),
                (F(6),   7.0, -3.5,  0.5),
                (F(9),   9.0, -7.0, -2.8),
                (F(11), 12.0, -4.5, -5.5),
                (F(15),  7.0,  3.5, -0.5),
                (F(18),  9.0,  7.0,  2.8),
            ],
            "position": [
                (F(0),   0.15, -0.35, -0.45),
                (F(2),   0.40, -1.55, -0.25),
                (F(6),   0.05,  1.05, -0.65),
                (F(9),  -0.15, -0.35, -0.45),
                (F(11), -0.40, -1.55, -0.25),
                (F(15), -0.05,  1.05, -0.65),
                (F(18),  0.15, -0.35, -0.45),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  0.0, -15.5,  0.0),
                (F(5),  0.0,  -4.0, -1.5),
                (F(9),  0.0,  15.5,  0.0),
                (F(14), 0.0,   4.0,  1.5),
                (F(18), 0.0, -15.5,  0.0),
            ],
            "position": [
                (F(0),  0.0,  0.00, -0.2),
                (F(3),  0.0, -0.40, -0.1),
                (F(7),  0.0,  0.45, -0.3),
                (F(12), 0.0, -0.40, -0.1),
                (F(16), 0.0,  0.45, -0.3),
                (F(18), 0.0,  0.00, -0.2),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  -7.0, -5.5, -2.2),
                (F(3),  -4.0, -2.5, -3.8),
                (F(7),  -9.5,  2.5, -0.5),
                (F(9),  -7.0,  5.5,  2.2),
                (F(12), -4.0,  2.5,  3.8),
                (F(16), -9.5, -2.5,  0.5),
                (F(18), -7.0, -5.5, -2.2),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),   42.0, -12.0, -14.0),
                (F(5),    4.0,  -2.0, -10.0),
                (F(9),  -48.0,  16.0, -13.0),
                (F(14),  -6.0,   4.0, -16.0),
                (F(18),  42.0, -12.0, -14.0),
            ],
            "position": [
                (F(0),  0.0,  0.10,  0.30),
                (F(3),  0.0, -0.40,  0.05),
                (F(7),  0.0,  0.50, -0.40),
                (F(12), 0.0, -0.40, -0.25),
                (F(16), 0.0,  0.50,  0.15),
                (F(18), 0.0,  0.10,  0.30),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  -48.0, -16.0, 13.0),
                (F(5),   -6.0,  -4.0, 16.0),
                (F(9),   42.0,  12.0, 14.0),
                (F(14),   4.0,   2.0, 10.0),
                (F(18), -48.0, -16.0, 13.0),
            ],
            "position": [
                (F(0),  0.0,  0.10, -0.40),
                (F(3),  0.0, -0.40, -0.25),
                (F(7),  0.0,  0.50,  0.15),
                (F(12), 0.0, -0.40,  0.05),
                (F(16), 0.0,  0.50, -0.30),
                (F(18), 0.0,  0.10, -0.40),
            ],
        },
        "left_leg": wf_lleg,
        "right_leg": {"rotation": wf_rleg_rot, "position": wf_rleg_pos},
    }
    anims.append(make_bb_anim("Walk front", L_WF, True, bone_uuids, wf_tracks))

    # -------------------------------------------------------------------------
    # 3. WALK BACK (20f = 0.8333s loop) — Retroceso táctico anime A&S
    # Torso inclinado adelante manteniendo guardia de sombras activa y mirada
    # fija al frente; pies tanteando hacia atrás con rodilla alta frontal al recoger.
    # -------------------------------------------------------------------------
    N_WB = 20
    L_WB = F(N_WB)
    wb_lleg = make_leg_track([
        (0,   34.0, -4.0, -2.0,  0.10,  1.45, 0.10),  # Punta alcanza atrás
        (3,   12.0, -3.0, -3.5,  0.00,  0.65, 0.00),  # Planta firme atrás absorbiendo peso
        (7,  -26.0, -2.0, -2.0,  0.10, -1.15, 0.00),  # Empuja cuerpo hacia atrás desde adelante
        (11, -22.0, -1.0, -2.5,  0.15, -1.05, 2.65),  # Levanta rodilla frontal estilo A&S
        (16,  28.0, -3.0, -2.0,  0.10,  1.25, 1.35),  # Extiende hacia atrás en el aire
        (20,  34.0, -4.0, -2.0,  0.10,  1.45, 0.10),
    ])
    wb_rleg_rot = [(t, rx, -ry, -rz) for (t, rx, ry, rz) in shift_loop_keyframes(wb_lleg["rotation"], N_WB, N_WB // 2)]
    wb_rleg_pos = [(t, -px, py, pz) for (t, px, py, pz) in shift_loop_keyframes(wb_lleg["position"], N_WB, N_WB // 2)]

    wb_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(3),  1.032, 0.955, 1.032),
                (F(7),  0.978, 1.035, 0.978),
                (F(10), 1.000, 1.000, 1.000),
                (F(13), 1.032, 0.955, 1.032),
                (F(17), 0.978, 1.035, 0.978),
                (F(20), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),  11.5, -6.5,  2.2),
                (F(3),  14.0, -4.0,  4.6),
                (F(7),   9.5,  3.0,  0.5),
                (F(10), 11.5,  6.5, -2.2),
                (F(13), 14.0,  4.0, -4.6),
                (F(17),  9.5, -3.0, -0.5),
                (F(20), 11.5, -6.5,  2.2),
            ],
            "position": [
                (F(0),   0.15, -0.35, 0.25),
                (F(3),   0.32, -1.40, 0.50),
                (F(7),   0.05,  0.75, 0.10),
                (F(10), -0.15, -0.35, 0.25),
                (F(13), -0.32, -1.40, 0.50),
                (F(17), -0.05,  0.75, 0.10),
                (F(20),  0.15, -0.35, 0.25),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  0.0,  12.5, 0.0),
                (F(5),  0.0,   3.0, 0.0),
                (F(10), 0.0, -12.5, 0.0),
                (F(15), 0.0,  -3.0, 0.0),
                (F(20), 0.0,  12.5, 0.0),
            ],
            "position": [
                (F(0),  0.0,  0.00, 0.0),
                (F(4),  0.0, -0.35, 0.0),
                (F(8),  0.0,  0.30, 0.0),
                (F(14), 0.0, -0.35, 0.0),
                (F(18), 0.0,  0.30, 0.0),
                (F(20), 0.0,  0.00, 0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  -8.5, -5.0, -1.8),
                (F(4), -11.0, -2.0, -3.2),
                (F(10), -8.5,  5.0,  1.8),
                (F(14),-11.0,  2.0,  3.2),
                (F(20), -8.5, -5.0, -1.8),
            ],
        },
        "left_arm": {
            # Guardia media cautelosa acompañando el retroceso
            "rotation": [
                (F(0),  -54.0, 22.0, -14.0),
                (F(5),  -36.0, 14.0, -12.0),
                (F(10), -18.0,  4.0, -18.0),
                (F(15), -34.0, 12.0, -15.0),
                (F(20), -54.0, 22.0, -14.0),
            ],
            "position": [
                (F(0),  0.1,  0.15, -0.50),
                (F(4),  0.1, -0.25, -0.35),
                (F(10), 0.0,  0.25, -0.10),
                (F(14), 0.0, -0.25, -0.25),
                (F(20), 0.1,  0.15, -0.50),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  -18.0,  -4.0, 18.0),
                (F(5),  -34.0, -12.0, 15.0),
                (F(10), -54.0, -22.0, 14.0),
                (F(15), -36.0, -14.0, 12.0),
                (F(20), -18.0,  -4.0, 18.0),
            ],
            "position": [
                (F(0),   0.0,  0.25, -0.10),
                (F(4),   0.0, -0.25, -0.25),
                (F(10), -0.1,  0.15, -0.50),
                (F(14), -0.1, -0.25, -0.35),
                (F(20),  0.0,  0.25, -0.10),
            ],
        },
        "left_leg": wb_lleg,
        "right_leg": {"rotation": wb_rleg_rot, "position": wb_rleg_pos},
    }
    anims.append(make_bb_anim("Walk Back", L_WB, True, bone_uuids, wb_tracks))

    # -------------------------------------------------------------------------
    # 4. WALK LEFT (18f = 0.75s loop) — Paso lateral cruzado ágil A&S
    # Desplazamiento lateral hacia la izquierda del personaje con cruce alto de
    # rodilla derecha por delante y manos listas para invocar sombras.
    # -------------------------------------------------------------------------
    N_WL = 18
    L_WL = F(N_WL)
    wl_lleg = make_leg_track([
        (0,   -8.0, -8.0, -24.0,  1.45, -0.35, 0.10),  # Abre hacia la izq y contacta
        (3,   -5.0, -6.0, -12.0,  0.85, -0.20, 0.00),  # Planta firme recibiendo el peso
        (7,    6.0, -2.0,   6.0, -0.25,  0.20, 0.00),  # Empuja bajo la cadera mientras der cruza
        (11,  10.0,  0.0,  14.0, -0.65,  0.35, 0.85),  # Despega
        (14, -16.0, -8.0, -28.0,  1.30, -0.65, 2.35),  # Alcanza alto de nuevo a la izq
        (18,  -8.0, -8.0, -24.0,  1.45, -0.35, 0.10),
    ])
    wl_rleg = make_leg_track([
        (0,   10.0,  8.0,  22.0, -0.70,  0.35, 0.00),  # Empujando abierta desde la der
        (3,   14.0,  6.0,  26.0, -0.95,  0.50, 0.45),  # Fin de empuje lateral
        (7,  -28.0, 12.0,  -9.0,  0.95, -1.35, 2.85),  # Arco alto cruzando por delante!
        (11, -10.0,  6.0,  -4.0,  0.55, -0.45, 0.00),  # Planta al centro-izq tomando el peso
        (15,   4.0,  8.0,  12.0, -0.25,  0.10, 0.00),  # Desliza/pivota hacia la der
        (18,  10.0,  8.0,  22.0, -0.70,  0.35, 0.00),
    ])
    wl_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(3),  1.038, 0.950, 1.020),
                (F(7),  0.978, 1.038, 0.985),
                (F(11), 1.032, 0.956, 1.020),
                (F(15), 0.982, 1.032, 0.990),
                (F(18), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   8.0, 11.0,  3.8),
                (F(3),  10.5, 13.5,  6.8),
                (F(7),   6.5,  6.0,  1.5),
                (F(11), 10.0,  2.5, -3.0),
                (F(15),  6.5,  8.5,  1.2),
                (F(18),  8.0, 11.0,  3.8),
            ],
            "position": [
                (F(0),   0.45, -0.35, -0.10),
                (F(3),   0.80, -1.40,  0.00),
                (F(7),   0.15,  0.85, -0.25),
                (F(11), -0.25, -1.25, -0.10),
                (F(15),  0.20,  0.70, -0.20),
                (F(18),  0.45, -0.35, -0.10),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  0.0, -10.0, -1.5),
                (F(5),  0.0,  -5.0, -3.0),
                (F(11), 0.0,   5.0,  2.0),
                (F(15), 0.0,  -4.5,  0.0),
                (F(18), 0.0, -10.0, -1.5),
            ],
            "position": [
                (F(0),  0.0,  0.00, 0.0),
                (F(4),  0.0, -0.35, 0.0),
                (F(8),  0.0,  0.35, 0.0),
                (F(12), 0.0, -0.30, 0.0),
                (F(16), 0.0,  0.30, 0.0),
                (F(18), 0.0,  0.00, 0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),  -5.5, -3.0, -2.2),
                (F(4),  -7.5, -5.0, -4.8),
                (F(11), -6.0,  4.0,  2.2),
                (F(15), -4.5, -1.5, -0.5),
                (F(18), -5.5, -3.0, -2.2),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  -34.0, 14.0, -24.0),
                (F(4),  -22.0,  8.0, -32.0),
                (F(11), -46.0, 20.0, -14.0),
                (F(15), -40.0, 16.0, -20.0),
                (F(18), -34.0, 14.0, -24.0),
            ],
            "position": [
                (F(0),  0.0,  0.10, -0.30),
                (F(4),  0.0, -0.30, -0.15),
                (F(11), 0.1,  0.30, -0.45),
                (F(18), 0.0,  0.10, -0.30),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  -48.0, -24.0, 12.0),
                (F(4),  -38.0, -18.0, 18.0),
                (F(11), -24.0, -10.0, 26.0),
                (F(15), -36.0, -16.0, 16.0),
                (F(18), -48.0, -24.0, 12.0),
            ],
            "position": [
                (F(0),  0.1,  0.15, -0.45),
                (F(4),  0.1, -0.30, -0.25),
                (F(11), 0.0,  0.30, -0.15),
                (F(18), 0.1,  0.15, -0.45),
            ],
        },
        "left_leg": wl_lleg,
        "right_leg": wl_rleg,
    }
    anims.append(make_bb_anim("Walk left", L_WL, True, bone_uuids, wl_tracks))

    # -------------------------------------------------------------------------
    # 5. WALK RIGHT (18f = 0.75s loop) — Espejo lateral exacto hacia la derecha
    # -------------------------------------------------------------------------
    anims.append(make_bb_anim("Walk Right", L_WL, True, bone_uuids, mirror_tracks(wl_tracks)))

    # -------------------------------------------------------------------------
    # 6. JUMP (14f = 0.5833s once) — Salto Cartoon / Anime Actions & Stuff
    # Anticipación squash (f=2) -> Stretch explosivo (f=4) -> Pose aérea anime
    # asimétrica con rodilla izquierda bien recogida y brazos abiertos con estilo!
    # -------------------------------------------------------------------------
    L_JMP = F(14)
    jmp_lleg = make_leg_track([
        (0,  -12.0, -12.0,  -7.0, 0.55, -1.35, 0.00),
        (2,   18.0, -14.0,  -9.0, 0.65, -1.85, 0.00),  # Agachado cargando salto
        (4,  -56.0,  -8.0, -10.0, 0.45, -2.50, 4.20),  # Rodillazo explosivo al cielo!
        (8,  -50.0, -10.0, -12.0, 0.55, -2.35, 4.10),  # Hang-time aéreo anime
        (14, -42.0, -10.0, -12.0, 0.55, -2.10, 3.60),
    ])
    jmp_rleg = make_leg_track([
        (0,   11.0,  16.0,   7.5, -0.55,  1.25, 0.00),
        (2,   22.0,  16.0,   9.0, -0.65, -0.80, 0.00),
        (4,   42.0,   8.0,   8.0, -0.35,  1.65, 2.20),  # Estirón de empuje en despegue
        (8,   48.0,  12.0,  11.0, -0.45,  2.15, 2.95),  # Recogida atrás en el aire!
        (14,  40.0,  12.0,  12.0, -0.45,  1.95, 2.60),
    ])
    jmp_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(2),  1.100, 0.840, 1.100),  # Squash potente anclado al suelo
                (F(4),  0.890, 1.160, 0.890),  # Stretch vertical explosivo A&S
                (F(8),  1.025, 0.975, 1.025),  # Rebote elástico en el ápice
                (F(11), 1.000, 1.000, 1.000),
                (F(14), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   6.0, 18.0, -3.0),
                (F(2),  22.0, 20.0, -5.0),
                (F(4), -12.0, -8.0,  3.5),
                (F(8),   8.0, 12.0, -4.0),
                (F(14), 12.0, 14.0, -4.5),
            ],
            "position": [
                (F(0),  -0.35, -0.45,  0.10),
                (F(2),  -0.50, -3.10,  0.95),
                (F(4),   0.15,  2.40, -0.65),
                (F(8),  -0.25,  2.10, -0.35),
                (F(14), -0.25,  1.65, -0.25),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  0.0, -5.0, 0.0),
                (F(2),  0.0, -9.0, 0.0),
                (F(4),  0.0, 14.0, 0.0),
                (F(8),  0.0, -7.0, 0.0),
                (F(14), 0.0, -7.0, 0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),   3.5, -16.0,  2.5),
                (F(2), -14.0, -16.0,  3.0),
                (F(4), -14.0,   4.0, -2.5),
                (F(8),   9.0, -10.0,  3.0),
                (F(14), 12.0, -11.0,  3.0),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),   -50.0,  22.0, -12.0),
                (F(2),    46.0, -10.0, -22.0),  # Anticipación brazos atrás
                (F(4),  -128.0,  20.0, -32.0),  # Lanzamiento de brazos al cielo!
                (F(8),   -68.0,  16.0, -48.0),  # Silueta anime abierta en el aire
                (F(14),  -58.0,  14.0, -52.0),
            ],
            "position": [
                (F(0),  0.15,  0.15, -0.55),
                (F(2),  0.00, -0.65,  0.55),
                (F(4),  0.00,  1.25, -0.45),
                (F(8),  0.00,  0.90, -0.25),
                (F(14), 0.00,  0.75, -0.20),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),   -18.0, -16.0, 18.0),
                (F(2),    50.0,  12.0, 24.0),
                (F(4),  -108.0, -18.0, 34.0),
                (F(8),   -50.0, -14.0, 50.0),
                (F(14),  -42.0, -12.0, 54.0),
            ],
            "position": [
                (F(0),  0.0,  0.05,  0.20),
                (F(2),  0.0, -0.65,  0.55),
                (F(4),  0.0,  1.15, -0.35),
                (F(8),  0.0,  0.85,  0.00),
                (F(14), 0.0,  0.70,  0.05),
            ],
        },
        "left_leg": jmp_lleg,
        "right_leg": jmp_rleg,
    }
    anims.append(make_bb_anim("Jump", L_JMP, False, bone_uuids, jmp_tracks))

    # -------------------------------------------------------------------------
    # 7. DASH FRONT (10f = 0.4167s once) — Impulso explosivo de sombras adelante
    # -------------------------------------------------------------------------
    L_DF = F(10)
    df_lleg = make_leg_track([
        (0,  -12.0, -12.0, -7.0, 0.55, -1.35, 0.00),
        (1,   12.0, -10.0, -8.0, 0.50, -1.55, 0.00),
        (3,  -48.0,  -6.0, -6.0, 0.30, -3.10, 3.20),  # Rodilla delantera embistiendo!
        (5,  -38.0,  -8.0, -5.0, 0.35, -2.65, 1.90),
        (8,  -24.0, -12.0, -8.0, 0.55, -2.10, 0.00),  # Clava el pie en derrape frontal
        (10, -12.0, -12.0, -7.0, 0.55, -1.35, 0.00),
    ])
    df_rleg = make_leg_track([
        (0,   11.0,  16.0,  7.5, -0.55,  1.25, 0.00),
        (1,   24.0,  14.0,  8.0, -0.50,  0.65, 0.00),
        (3,   60.0,   6.0,  6.0, -0.30,  2.35, 3.00),  # Pierna trasera extendida al máximo!
        (5,   44.0,   8.0,  6.0, -0.35,  1.85, 1.65),
        (8,   18.0,  14.0,  8.5, -0.55,  1.50, 0.00),  # Planta atrás frenando
        (10,  11.0,  16.0,  7.5, -0.55,  1.25, 0.00),
    ])
    df_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(1),  1.080, 0.880, 1.060),
                (F(3),  0.900, 0.920, 1.160),  # Smear horizontal de velocidad adelante!
                (F(5),  0.945, 0.955, 1.085),
                (F(8),  1.055, 0.920, 0.970),  # Compresión de frenada
                (F(10), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   6.0,  18.0, -3.0),
                (F(1),  20.0,  20.0, -4.5),
                (F(3),  42.0, -18.0,  5.5),
                (F(5),  34.0, -12.0,  3.8),
                (F(8),  16.0,  14.0, -4.0),
                (F(10),  6.0,  18.0, -3.0),
            ],
            "position": [
                (F(0),  -0.35, -0.45,  0.10),
                (F(1),  -0.45, -2.35,  0.65),
                (F(3),   0.25, -1.65, -2.35),
                (F(5),   0.15, -1.55, -1.70),
                (F(8),  -0.40, -1.95, -0.35),
                (F(10), -0.35, -0.45,  0.10),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  0.0,  -5.0, 0.0),
                (F(3),  0.0, -18.0, 0.0),
                (F(5),  0.0, -11.0, 0.0),
                (F(8),  0.0,   6.0, 0.0),
                (F(10), 0.0,  -5.0, 0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),   3.5, -16.0,  2.5),
                (F(1), -12.0, -16.0,  2.5),
                (F(3), -34.0,  28.0, -4.5),  # Cabeza levantada clavando la mirada al frente
                (F(5), -26.0,  18.0, -3.0),
                (F(8),  -8.0, -14.0,  3.0),
                (F(10),  3.5, -16.0,  2.5),
            ],
        },
        "right_arm": {
            # Mano derecha corta el viento al frente canalizando sombras
            "rotation": [
                (F(0),  -18.0, -16.0, 18.0),
                (F(1),   34.0,   8.0, 22.0),
                (F(3),  -88.0, -24.0, 14.0),
                (F(5),  -74.0, -18.0, 16.0),
                (F(8),  -26.0, -12.0, 24.0),
                (F(10), -18.0, -16.0, 18.0),
            ],
            "position": [
                (F(0),  0.00,  0.05,  0.20),
                (F(3),  0.35,  0.45, -1.55),
                (F(5),  0.25,  0.35, -1.10),
                (F(8),  0.00, -0.25, -0.20),
                (F(10), 0.00,  0.05,  0.20),
            ],
        },
        "left_arm": {
            # Brazo izquierdo lanzado atrás estilo ninja burst anime
            "rotation": [
                (F(0),  -50.0,  22.0, -12.0),
                (F(1),   16.0,   0.0, -18.0),
                (F(3),   76.0, -14.0, -26.0),
                (F(5),   60.0, -10.0, -22.0),
                (F(8),  -56.0,  20.0, -18.0),
                (F(10), -50.0,  22.0, -12.0),
            ],
            "position": [
                (F(0),  0.15,  0.15, -0.55),
                (F(3),  0.00,  0.45,  0.90),
                (F(8),  0.15, -0.15, -0.60),
                (F(10), 0.15,  0.15, -0.55),
            ],
        },
        "left_leg": df_lleg,
        "right_leg": df_rleg,
    }
    anims.append(make_bb_anim("Dash front", L_DF, False, bone_uuids, df_tracks))

    # -------------------------------------------------------------------------
    # 8. DASH LEFT (10f = 0.4167s once) — Evasión lateral explosiva a la izq
    # -------------------------------------------------------------------------
    L_DL = F(10)
    dl_lleg = make_leg_track([
        (0,  -12.0, -12.0,  -7.0, 0.55, -1.35, 0.00),
        (1,   -6.0,  -8.0,   2.0, 0.20, -1.00, 0.00),
        (3,  -18.0, -12.0, -42.0, 2.35, -0.95, 2.45),  # Se lanza abierta a la izq!
        (5,  -14.0, -10.0, -32.0, 2.10, -0.95, 1.35),
        (8,  -12.0, -12.0, -24.0, 1.65, -1.05, 0.00),  # Derrape ancho en el suelo
        (10, -12.0, -12.0,  -7.0, 0.55, -1.35, 0.00),
    ])
    dl_rleg = make_leg_track([
        (0,   11.0,  16.0,   7.5, -0.55, 1.25, 0.00),
        (1,   14.0,  12.0,  18.0, -0.95, 0.90, 0.00),
        (3,   16.0,   8.0,  38.0,  1.25, 0.65, 1.90),  # Arrastra extendida tras el empuje!
        (5,   12.0,  10.0,  28.0,  1.00, 0.75, 1.05),
        (8,   10.0,  14.0,  18.0,  0.15, 0.95, 0.00),  # Planta frenando
        (10,  11.0,  16.0,   7.5, -0.55, 1.25, 0.00),
    ])
    dl_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(1),  1.050, 0.880, 1.050),
                (F(3),  1.150, 0.910, 0.940),  # Smear lateral en X!
                (F(5),  1.085, 0.945, 0.970),
                (F(8),  1.055, 0.915, 1.030),  # Compresión de derrape lateral
                (F(10), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   6.0, 18.0, -3.0),
                (F(1),  14.0, 12.0, -7.0),
                (F(3),  15.0, 12.0, 22.0),  # Ladeo dinámico hacia la izq!
                (F(5),  13.0, 10.0, 14.0),
                (F(8),  16.0, 16.0, -9.5),  # Contra-inclinación de derrape!
                (F(10),  6.0, 18.0, -3.0),
            ],
            "position": [
                (F(0),  -0.35, -0.45,  0.10),
                (F(1),  -0.85, -2.20,  0.20),
                (F(3),   2.35, -1.25, -0.30),
                (F(5),   1.85, -1.35, -0.20),
                (F(8),   0.95, -2.35,  0.10),
                (F(10), -0.35, -0.45,  0.10),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  0.0,  -5.0,  0.0),
                (F(3),  0.0, -11.0,  5.0),
                (F(5),  0.0,  -8.5,  2.5),
                (F(8),  0.0,  -6.5, -3.5),
                (F(10), 0.0,  -5.0,  0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),   3.5, -16.0,   2.5),
                (F(1),  -5.0, -10.0,   5.0),
                (F(3),  -9.0, -10.0, -18.0),  # Compensa el ladeo manteniendo mirada fija!
                (F(5),  -7.0,  -9.0, -12.0),
                (F(8),  -9.0, -14.0,   8.0),
                (F(10),  3.5, -16.0,   2.5),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  -50.0,  22.0, -12.0),
                (F(1),  -20.0,  12.0, -18.0),
                (F(3),   26.0, -14.0, -62.0),  # Abre cortando el viento hacia la izq!
                (F(5),   16.0,  -8.0, -50.0),
                (F(8),  -34.0,  16.0, -38.0),
                (F(10), -50.0,  22.0, -12.0),
            ],
            "position": [
                (F(0),  0.15,  0.15, -0.55),
                (F(3),  0.45,  0.55,  0.35),
                (F(8),  0.20, -0.20, -0.35),
                (F(10), 0.15,  0.15, -0.55),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  -18.0, -16.0,  18.0),
                (F(1),   16.0,  -6.0,  24.0),
                (F(3),  -58.0, -36.0, -16.0),  # Cruza frente al pecho protegiendo!
                (F(5),  -50.0, -28.0, -10.0),
                (F(8),  -28.0, -18.0,  28.0),
                (F(10), -18.0, -16.0,  18.0),
            ],
            "position": [
                (F(0),  0.00,  0.05,  0.20),
                (F(3),  0.85,  0.25, -1.15),
                (F(8),  0.00, -0.15, -0.25),
                (F(10), 0.00,  0.05,  0.20),
            ],
        },
        "left_leg": dl_lleg,
        "right_leg": dl_rleg,
    }
    anims.append(make_bb_anim("Dash left", L_DL, False, bone_uuids, dl_tracks))

    # -------------------------------------------------------------------------
    # 9. DASH RIGHT (10f = 0.4167s once) — Evasión lateral explosiva a la der
    # Espejo del impulso lateral de Dash left, partiendo y aterrizando en la
    # postura Idle 3/4 de ElRandi para transiciones impecables.
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
    # 10. DASH BACK (11f = 0.4583s once) — Evasión atrás con derrape ninja bajo
    # Salto rasante hacia atrás clavando la mirada en el rival + mano izquierda
    # extendida en signo protector + aterrizaje en derrape bajo estilo Megumi!
    # -------------------------------------------------------------------------
    L_DB = F(11)
    db_lleg = make_leg_track([
        (0,  -12.0, -12.0, -7.0, 0.55, -1.35, 0.00),
        (1,  -22.0, -12.0, -8.0, 0.50, -1.65, 0.00),  # Empuje inicial desde pie delantero
        (3,  -42.0, -12.0, -9.0, 0.40, -1.45, 3.25),  # Rodilla recogida volando atrás!
        (6,  -34.0, -10.0, -8.0, 0.45, -1.75, 1.80),
        (8,  -28.0, -14.0, -9.0, 0.60, -2.15, 0.00),  # Clava adelante frenando el derrape
        (11, -12.0, -12.0, -7.0, 0.55, -1.35, 0.00),
    ])
    db_rleg = make_leg_track([
        (0,   11.0,  16.0,  7.5, -0.55, 1.25, 0.00),
        (1,   16.0,  14.0,  8.0, -0.50, 0.85, 0.00),
        (3,   52.0,  12.0,  9.0, -0.35, 2.55, 2.85),  # Busca lejos hacia atrás en el aire!
        (6,   40.0,  14.0,  8.0, -0.45, 2.10, 1.45),
        (8,   30.0,  16.0,  9.0, -0.60, 1.65, 0.00),  # Flexión profunda de derrape ninja!
        (11,  11.0,  16.0,  7.5, -0.55, 1.25, 0.00),
    ])
    db_tracks = {
        "low_anchor": {
            "scale": [
                (F(0),  1.000, 1.000, 1.000),
                (F(1),  1.065, 0.890, 1.050),
                (F(3),  0.910, 0.950, 1.140),  # Smear hacia atrás en el aire!
                (F(6),  0.955, 0.970, 1.065),
                (F(8),  1.090, 0.870, 1.060),  # Squash profundo del derrape bajo!
                (F(11), 1.000, 1.000, 1.000),
            ],
        },
        "low_body": {
            "rotation": [
                (F(0),   6.0, 18.0, -3.0),
                (F(1),  16.0, 12.0, -3.5),
                (F(3),  26.0, 22.0, -6.5),
                (F(6),  23.0, 20.0, -5.5),
                (F(8),  28.0, 18.0, -4.5),
                (F(11),  6.0, 18.0, -3.0),
            ],
            "position": [
                (F(0),  -0.35, -0.45,  0.10),
                (F(1),  -0.35, -2.10, -0.25),
                (F(3),  -0.45, -0.65,  2.45),
                (F(6),  -0.45, -1.25,  1.95),
                (F(8),  -0.45, -3.35,  1.15),
                (F(11), -0.35, -0.45,  0.10),
            ],
        },
        "body": {
            "rotation": [
                (F(0),  0.0,  -5.0, 0.0),
                (F(3),  0.0, -11.0, 0.0),
                (F(8),  0.0,  -8.5, 0.0),
                (F(11), 0.0,  -5.0, 0.0),
            ],
        },
        "head": {
            "rotation": [
                (F(0),   3.5, -16.0, 2.5),
                (F(1),  -9.0, -11.0, 2.5),
                (F(3), -22.0, -15.0, 4.5),
                (F(6), -19.0, -14.0, 4.0),
                (F(8), -24.0, -13.0, 3.5),
                (F(11),  3.5, -16.0, 2.5),
            ],
        },
        "left_arm": {
            "rotation": [
                (F(0),  -50.0, 22.0, -12.0),
                (F(1),  -26.0, 14.0, -14.0),
                (F(3),  -74.0, 18.0, -22.0),  # Mano izquierda extendida manteniendo signo!
                (F(6),  -64.0, 16.0, -18.0),
                (F(8),  -58.0, 20.0, -15.0),
                (F(11), -50.0, 22.0, -12.0),
            ],
            "position": [
                (F(0),  0.15,  0.15, -0.55),
                (F(3),  0.05,  0.35, -1.25),
                (F(8),  0.10, -0.20, -0.85),
                (F(11), 0.15,  0.15, -0.55),
            ],
        },
        "right_arm": {
            "rotation": [
                (F(0),  -18.0, -16.0, 18.0),
                (F(1),  -24.0, -10.0, 16.0),
                (F(3),   54.0,  14.0, 34.0),
                (F(6),   36.0,  10.0, 30.0),
                (F(8),  -28.0,  -8.0, 28.0),  # Mano derecha baja rozando el piso al frenar!
                (F(11), -18.0, -16.0, 18.0),
            ],
            "position": [
                (F(0),  0.00,  0.05,  0.20),
                (F(3),  0.00,  0.45,  0.85),
                (F(8),  0.00, -1.15, -0.35),
                (F(11), 0.00,  0.05,  0.20),
            ],
        },
        "left_leg": db_lleg,
        "right_leg": db_rleg,
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


def convert_anim_to_calfight_clip(anim, custom_gait=False, full_jump=False):
    length = anim["length"]
    loop = anim["loop"] == "loop"
    n_samples = int(round(length * FPS_GAME)) + 1
    T_shift_torso = [[1, 0, 0, 0], [0, 1, 0, -12.0], [0, 0, 1, 0], [0, 0, 0, 1]]

    all_frames = []
    for i in range(n_samples):
        t = min(length, i / FPS_GAME)
        W = eval_bbs_world_matrices(anim, t)

        # Nota: en buildModel `inner` está en y = 16, mientras en BBS `low_anchor` está en y = 0.
        # Para que una escala de `low_anchor` (ej. bsy = 0.85) mantenga el piso y = 0 fijo cuando
        # `inner` escala alrededor de `inner.position.y`, `M_inner = W['low_anchor'] * Translate(0, 16, 0)`
        # traslada automáticamente `p_in[1] = 16 * bsy + ly`, de modo que un pie en `y_local = -16`
        # queda en `p_in[1] + bsy * (-16) = ly = 0`! Cero flotación durante squash & stretch!
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
# RENDERIZADOR DE VISTA PREVIA 3D (Hojas de contacto)
# =============================================================================

PARTS_BOXES = [
    ("torso",     (-4, -12, -2), (4, 0, 2),   (34, 42, 94)),
    ("head",      (-4, 0, -4),   (4, 8, 4),   (240, 196, 166)),
    ("right_arm", (-2, -10, -2), (2, 2, 2),   (178, 52, 62)),   # Destacado rojizo para leer der vs izq
    ("left_arm",  (-2, -10, -2), (2, 2, 2),   (66, 98, 188)),
    ("right_leg", (-2, -12, -2), (2, 0, 2),   (34, 104, 188)),
    ("left_leg",  (-2, -12, -2), (2, 0, 2),   (64, 156, 240)),
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
    cell_w, cell_h = 152, 178
    img = Image.new("RGB", (cols * cell_w, len(anims) * cell_h), (22, 24, 32))
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
        for col_idx in range(cols):
            frac = col_idx / cols if loop else col_idx / (cols - 1)
            t = frac * length
            cx = col_idx * cell_w + cell_w // 2
            floor_y = row_idx * cell_h + cell_h - 26

            g1 = proj((-12, 0, 0), cx, floor_y)
            g2 = proj((12, 0, 0), cx, floor_y)
            g3 = proj((0, 0, -12), cx, floor_y)
            g4 = proj((0, 0, 12), cx, floor_y)
            draw.line([(g1[0], g1[1]), (g2[0], g2[1])], fill=(60, 66, 84), width=1)
            draw.line([(g3[0], g3[1]), (g4[0], g4[1])], fill=(50, 78, 72), width=1)

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
                        col = (250, 212, 110)
                    polys.append((depth, pts2d, col))

            polys.sort(key=lambda item: item[0])
            for _, pts2d, col in polys:
                draw.polygon(pts2d, fill=col, outline=(12, 12, 18))

            if col_idx == 0:
                draw.text((col_idx * cell_w + 6, row_idx * cell_h + 4), anim["name"], fill=(240, 240, 250))
            draw.text((col_idx * cell_w + 6, row_idx * cell_h + cell_h - 16), f"t={t:.2f}s y0={min_foot_y:+.1f}", fill=(165, 175, 195))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


def patch_randi_bb_data_in_html(anims):
    by_name = {a["name"]: a for a in anims}
    clips = {
        "idle": convert_anim_to_calfight_clip(by_name["Idle"]),
        "walk_front": convert_anim_to_calfight_clip(by_name["Walk front"]),
        "walk_back": convert_anim_to_calfight_clip(by_name["Walk Back"], custom_gait=True),
        "walk_left": convert_anim_to_calfight_clip(by_name["Walk left"], custom_gait=True),
        "walk_right": convert_anim_to_calfight_clip(by_name["Walk Right"], custom_gait=True),
        "jump": convert_anim_to_calfight_clip(by_name["Jump"], full_jump=True),
        "dash_front": convert_anim_to_calfight_clip(by_name["Dash front"]),
        "dash_left": convert_anim_to_calfight_clip(by_name["Dash left"]),
        "dash_right": convert_anim_to_calfight_clip(by_name["Dash right"]),
        "dash_back": convert_anim_to_calfight_clip(by_name["Dash back"]),
    }

    html_path = REPO / "index.html"
    html = html_path.read_text(encoding="utf-8")
    pat = re.compile(r"(/\* RANDI_BLOCKBENCH_DATA_BEGIN \*/\s*const RANDI_BB_DATA = )(\{.*?\})(;\s*/\* RANDI_BLOCKBENCH_DATA_END \*/)", re.S)
    m = pat.search(html)
    assert m, "No se encontró el bloque RANDI_BB_DATA en index.html"
    data = json.loads(m.group(2))

    # Mapear las 10 animaciones de movimiento a las claves del motor (manteniendo todos los combos/habilidades intactos)
    data["idle"] = clips["idle"]
    data["idle_combate"] = clips["idle"]
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
    print("Actualizado RANDI_BB_DATA en index.html con las 10 animaciones de movimiento A&S.")


def main():
    model, skin_bytes = build_clean_base_model()
    bone_uuids = collect_bone_uuids(model["outliner"])
    anims = author_all_animations(bone_uuids)
    model["animations"] = anims

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_BBMODEL.write_text(json.dumps(model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_SKIN.write_bytes(skin_bytes)
    print("Guardado Blockbench:", OUT_BBMODEL, f"({len(anims)} animaciones)")

    preview_path = SCRATCH / "elrandi_movement_sheet.png"
    render_contact_sheet(anims, preview_path)
    print("Guardada vista previa:", preview_path)

    if "--apply-html" in sys.argv:
        patch_randi_bb_data_in_html(anims)


if __name__ == "__main__":
    main()
