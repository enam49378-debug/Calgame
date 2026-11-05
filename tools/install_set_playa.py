import json, uuid, base64, io, copy, colorsys
from pathlib import Path
from PIL import Image

SRC = Path(r'f:\descargas de go\set_playa_pro_v2.bbmodel')
with open(SRC, 'r', encoding='utf-8') as f:
    base_model = json.load(f)

# Extract original texture
tex_src = base_model['textures'][0]['source']
header, raw_b64 = tex_src.split(',', 1)
orig_img = Image.open(io.BytesIO(base64.b64decode(raw_b64))).convert('RGBA')

def make_recolored_b64(target_hue_deg):
    im = orig_img.copy()
    pixels = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 10:
                h_val, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
                # Yellow/gold stripe hue range is 32 to 52 deg, with saturation > 0.35
                if 32 / 360.0 <= h_val <= 52 / 360.0 and s > 0.35:
                    new_r, new_g, new_b = colorsys.hsv_to_rgb(target_hue_deg / 360.0, s, v)
                    pixels[x, y] = (int(new_r * 255), int(new_g * 255), int(new_b * 255), a)
    buf = io.BytesIO()
    im.save(buf, format='PNG')
    return header + ',' + base64.b64encode(buf.getvalue()).decode('ascii')

textures = {
    'sombrilla_amarilla': tex_src,
    'sombrilla_roja': make_recolored_b64(355),
    'sombrilla_azul': make_recolored_b64(210),
    'sombrilla_verde': make_recolored_b64(135),
    'set_playa_pro_v2': tex_src,
}

col_boxes = [
    ('col_poste', [-6.5, 0, 10.5], [-2.5, 36, 14.5]),
    ('col_cama_izq', [-22.5, 0, -13], [-10.5, 7.5, 8.5]),
    ('col_cama_der', [5.5, 0, -6.5], [17.5, 7.5, 15]),
    ('col_mesita', [-7, 0, -8], [3, 7.5, 2]),
]

for name, t_src in textures.items():
    m = copy.deepcopy(base_model)
    m['name'] = name
    m['model_identifier'] = name
    m['textures'][0]['name'] = f'{name}.png'
    m['textures'][0]['source'] = t_src

    col_children = []
    for cname, f_box, t_box in col_boxes:
        u = str(uuid.uuid4())
        m['elements'].append({
            'name': cname,
            'box_uv': False,
            'from': f_box,
            'to': t_box,
            'origin': [(f_box[0] + t_box[0]) / 2, (f_box[1] + t_box[1]) / 2, (f_box[2] + t_box[2]) / 2],
            'color': 0,
            'type': 'cube',
            'uuid': u
        })
        col_children.append(u)

    m['outliner'].append({
        'name': 'colision',
        'origin': [0, 0, 0],
        'color': 0,
        'uuid': str(uuid.uuid4()),
        'export': True,
        'isOpen': True,
        'locked': False,
        'visibility': True,
        'children': col_children
    })

    bb_path = Path('ciudad') / f'{name}.bbmodel'
    js_path = Path('ciudad') / f'{name}.js'

    json_str = json.dumps(m, ensure_ascii=False, separators=(',', ':'))
    with open(bb_path, 'w', encoding='utf-8') as f:
        f.write(json_str)

    prefix = "(window.BB_MODELS=window.BB_MODELS||{})['" + name + "']="
    js_content = prefix + json_str + ";"
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f'Wrote {bb_path} ({len(json_str)} bytes) and {js_path}')

print('All beach set models generated successfully!')
