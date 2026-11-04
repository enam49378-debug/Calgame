# -*- coding: utf-8 -*-
import os
import shutil

def main():
    print("Reading monolithic index.html...")
    with open('index.html', 'r', encoding='utf-8') as f:
        text = f.read()

    os.makedirs('css', exist_ok=True)
    os.makedirs('js', exist_ok=True)
    os.makedirs('lib', exist_ok=True)

    # =========================================================================
    # 1. EXTRACT CSS
    # =========================================================================
    s_start = text.find('<style>')
    s_start2 = text.find('<style>', s_start + 7)
    s_end2 = text.find('</style>', s_start2)
    css_content = text[s_start2 + 7 : s_end2].strip()

    css_path = os.path.join('css', 'style.css')
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write('/* ====================================================================\n')
        f.write(' * CalFight - Estilos Visuales, HUD, Menús y Animaciones UI\n')
        f.write(' * ==================================================================== */\n\n')
        f.write(css_content + '\n')
    print(f"Extracted {css_path}: {len(css_content)} chars")

    # =========================================================================
    # 2. EXTRACT JAVASCRIPT & SEPARATE ANIMATIONS FROM GAME ENGINE
    # =========================================================================
    sc_start = text.rfind('<script>')
    sc_end = text.rfind('</script>')
    js_content = text[sc_start + 8 : sc_end].strip()

    # Blockbench animation keyframe data boundaries
    jl_begin = '/* JESULUTO_BBS_DATA_BEGIN */'
    jl_end = '/* JESULUTO_BBS_DATA_END */'
    i_jl_b = js_content.find(jl_begin)
    i_jl_e = js_content.find(jl_end) + len(jl_end)

    bb_begin = '/* JAVI_BLOCKBENCH_DATA_BEGIN */'
    bb_end = '/* RANDI_BLOCKBENCH_DATA_END */'
    i_bb_b = js_content.find(bb_begin)
    i_bb_e = js_content.find(bb_end) + len(bb_end)

    assert i_jl_b != -1 and i_jl_e != -1, "JESULUTO boundaries not found"
    assert i_bb_b != -1 and i_bb_e != -1, "Blockbench boundaries not found"

    jl_code = js_content[i_jl_b:i_jl_e].strip()
    bb_code = js_content[i_bb_b:i_bb_e].strip()

    anim_js = f"""// ====================================================================
// CalFight - Datos de Modelos y Animaciones 3D (Blockbench Keyframes)
// ====================================================================

{jl_code}
window.JESULUTO_BBS = JESULUTO_BBS;

{bb_code}
window.JAVI_BB_DATA = JAVI_BB_DATA;
window.RED_BB_DATA = RED_BB_DATA;
window.GATO_BB_DATA = GATO_BB_DATA;
window.SEK_BB_DATA = SEK_BB_DATA;
window.RKT_BB_DATA = RKT_BB_DATA;
window.UKY_BB_DATA = UKY_BB_DATA;
window.SEB_BB_DATA = SEB_BB_DATA;
window.RANDI_BB_DATA = RANDI_BB_DATA;
"""

    anim_path = os.path.join('js', 'animations.js')
    with open(anim_path, 'w', encoding='utf-8') as f:
        f.write(anim_js)
    print(f"Extracted {anim_path}: {len(anim_js)} chars")

    # Replace huge animation keyframes in game.js with clean references
    game_js = (
        js_content[:i_jl_b]
        + '// Datos de modelo BBS cargados desde js/animations.js\nconst JESULUTO_BBS = window.JESULUTO_BBS;'
        + js_content[i_jl_e:i_bb_b]
        + """// Clips de animación Blockbench cargados desde js/animations.js
const JAVI_BB_DATA = window.JAVI_BB_DATA;
const RED_BB_DATA = window.RED_BB_DATA;
const GATO_BB_DATA = window.GATO_BB_DATA;
const SEK_BB_DATA = window.SEK_BB_DATA;
const RKT_BB_DATA = window.RKT_BB_DATA;
const UKY_BB_DATA = window.UKY_BB_DATA;
const SEB_BB_DATA = window.SEB_BB_DATA;
const RANDI_BB_DATA = window.RANDI_BB_DATA;"""
        + js_content[i_bb_e:]
    )

    game_path = os.path.join('js', 'game.js')
    with open(game_path, 'w', encoding='utf-8') as f:
        f.write(game_js)
    print(f"Extracted {game_path}: {len(game_js)} chars")

    # =========================================================================
    # 3. CONSTRUCT CLEAN MODULAR index.html
    # =========================================================================
    # Head up to style2
    head_part = text[:s_start2].strip()
    
    # HTML Body from style2 end up to the library script tags
    # Notice we fix the accidental duplicated </head><body> in the original
    html_body = text[s_end2 + 8 : sc_start].strip()

    # Find where the library scripts start in html_body
    lib_marker = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js'
    idx_lib = html_body.find(lib_marker)
    if idx_lib != -1:
        pure_html_body = html_body[:idx_lib].strip()
    else:
        pure_html_body = html_body

    # Clean double </head><body> tags if present
    pure_html_body = pure_html_body.replace(
        '</head>\n<body>\n<div id="spear-recovery" class="hidden"></div>\n<div id="spear-marker" class="hidden">▼ Tu lanza</div>\n</head>\n<body>',
        '<div id="spear-recovery" class="hidden"></div>\n<div id="spear-marker" class="hidden">▼ Tu lanza</div>'
    )
    if pure_html_body.startswith('</head>'):
        pure_html_body = pure_html_body[len('</head>'):].strip()
    if pure_html_body.startswith('<body>'):
        pure_html_body = pure_html_body[len('<body>'):].strip()

    new_index_html = f"""<!doctype html>
<html lang="es" style="background:#07080d;color:#f3f4f8">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
<!-- Fondo oscuro inmediato para evitar cualquier parpadeo al iniciar -->
<style>html,body{{background:#07080d!important;color:#f3f4f8;margin:0;height:100%;overflow:hidden}}</style>
<title>CalFight</title>
<link rel="icon" type="image/png" href="assets/calfight_icon.png">
<meta name="description" content="CalFight: peleas anime en una ciudad de bloques. Juega gratis en el navegador, solo o con amigos.">
<meta name="theme-color" content="#10131e">
<script>if(!/^(localhost|127\\.|\\[::1\\])/.test(location.hostname)||/[?&]csp=1/.test(location.search))document.write("<meta http-equiv=\\"Content-Security-Policy\\" content=\\"default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://lh3.googleusercontent.com; media-src 'self' blob: data:; connect-src 'self' https: wss: ws: blob: data:; frame-src 'self' https://calgame.firebaseapp.com https://accounts.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'\\">");</script>
<meta name="referrer" content="no-referrer">
<meta property="og:type" content="website"><meta property="og:site_name" content="CalFight"><meta property="og:title" content="CalFight">
<meta property="og:description" content="Peleas anime en una ciudad de bloques. Elige tu peleador, rompe la ciudad y juega con tus amigos. Gratis, en el navegador.">
<meta property="og:url" content="https://enam49378-debug.github.io/Calgame/"><meta property="og:image" content="https://enam49378-debug.github.io/Calgame/assets/calfight_banner.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="CalFight"><meta name="twitter:description" content="Peleas anime en una ciudad de bloques. Gratis, en el navegador."><meta name="twitter:image" content="https://enam49378-debug.github.io/Calgame/assets/calfight_banner.png">

<!-- Tipografías -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Bungee&family=Chakra+Petch:wght@400;600;700&display=swap">

<!-- Estilos modulares del juego -->
<link rel="stylesheet" href="css/style.css">

<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="assets/calfight_icon.png">
</head>
<body>

{pure_html_body}

<!-- ==================================================================== -->
<!-- Librerías de motor 3D y red (Locales para juego 100% offline)        -->
<!-- ==================================================================== -->
<script src="lib/three.min.js"></script>
<script src="lib/CopyShader.js"></script>
<script src="lib/LuminosityHighPassShader.js"></script>
<script src="lib/EffectComposer.js"></script>
<script src="lib/RenderPass.js"></script>
<script src="lib/ShaderPass.js"></script>
<script src="lib/UnrealBloomPass.js"></script>
<script src="lib/mqtt.min.js"></script>

<!-- ==================================================================== -->
<!-- Scripts modulares del juego                                          -->
<!-- ==================================================================== -->
<script src="js/animations.js"></script>
<script src="js/game.js"></script>

</body>
</html>
"""

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_index_html)
    print(f"Generated clean modular index.html: {len(new_index_html)} chars")

    # =========================================================================
    # 4. SYNC TO CalFight-App BUNDLE
    # =========================================================================
    dest_app = os.path.join('CalFight-App', 'resources', 'app')
    if os.path.exists(dest_app):
        print(f"Syncing modular files to {dest_app}...")
        
        # Copy css
        dest_css = os.path.join(dest_app, 'css')
        os.makedirs(dest_css, exist_ok=True)
        shutil.copy2(os.path.join('css', 'style.css'), os.path.join(dest_css, 'style.css'))

        # Copy js
        dest_js = os.path.join(dest_app, 'js')
        os.makedirs(dest_js, exist_ok=True)
        shutil.copy2(os.path.join('js', 'animations.js'), os.path.join(dest_js, 'animations.js'))
        shutil.copy2(os.path.join('js', 'game.js'), os.path.join(dest_js, 'game.js'))

        # Copy lib
        dest_lib = os.path.join(dest_app, 'lib')
        os.makedirs(dest_lib, exist_ok=True)
        for item in os.listdir('lib'):
            shutil.copy2(os.path.join('lib', item), os.path.join(dest_lib, item))

        # Copy index.html
        shutil.copy2('index.html', os.path.join(dest_app, 'index.html'))
        print("Successfully synced all files to CalFight-App!")

if __name__ == '__main__':
    main()
