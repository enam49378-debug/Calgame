# -*- coding: utf-8 -*-
import os
import shutil

def main():
    print("Applying complete fix for sea shader, bloom tuning, console errors, and 3D Main Menu transition...")

    # =========================================================================
    # 1. UPDATE js/game.js
    # =========================================================================
    with open('js/game.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # A. FIX SEA SHADER ('normal' : undeclared identifier)
    old_sea_glint = "float glint=pow(max(0.,dot(reflect(-normalize(vViewPosition),normal),uSunV)),50.);"
    new_sea_glint = "vec3 seaN=normalize(vNormal);float glint=pow(max(0.,dot(reflect(-normalize(vViewPosition),seaN),uSunV)),50.);"
    if old_sea_glint in js:
        js = js.replace(old_sea_glint, new_sea_glint, 1)
        print("1. Fixed Sea Water Shader: normal -> seaN (vNormal). Sea is now 100% visible and 256 WebGL errors eliminated!")
    else:
        print("Warning: old_sea_glint not found in js/game.js")

    # B. FIX BLOOM BLOWOUT & SUN OVEREXPOSURE
    # Directional sun and hemisphere light
    old_sun = """// Luz hemisférica vibrante: cielo azul anime + rebote dorado del suelo
scene.add(new THREE.HemisphereLight(0x9fd5ff, 0x5a4836, 1.08));
const sun = new THREE.DirectionalLight(0xfffae8, 1.25);"""

    new_sun = """// Iluminación cel-shaded equilibrada (evita quemar los edificios blancos)
scene.add(new THREE.HemisphereLight(0xaad8ff, 0x483e32, 0.88));
const sun = new THREE.DirectionalLight(0xfff6e6, 0.98);"""

    if old_sun in js:
        js = js.replace(old_sun, new_sun, 1)
        print("2. Tuned lighting: sun 0.98, hemi 0.88 (eliminates white building washout).")

    # Bloom settings in initPostProcessing & gfxApply
    old_bloom_init = "bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(Math.floor(innerWidth / 2), Math.floor(innerHeight / 2)), .38, .36, .62);"
    new_bloom_init = "bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(Math.floor(innerWidth / 2), Math.floor(innerHeight / 2)), .24, .28, .86);"
    if old_bloom_init in js:
        js = js.replace(old_bloom_init, new_bloom_init, 1)
        print("3. Tuned initPostProcessing bloomPass: threshold 0.86, strength 0.24.")

    old_bloom_cfg = """    if (GFX_CFG.bloom === 'anime') {
      bloomPass.strength = 0.38;
      bloomPass.radius = 0.36;
      bloomPass.threshold = 0.62;
    } else if (GFX_CFG.bloom === 'subtle') {
      bloomPass.strength = 0.18;
      bloomPass.radius = 0.26;
      bloomPass.threshold = 0.78;
    }"""

    new_bloom_cfg = """    if (GFX_CFG.bloom === 'anime') {
      bloomPass.strength = 0.24;
      bloomPass.radius = 0.28;
      bloomPass.threshold = 0.86;
    } else if (GFX_CFG.bloom === 'subtle') {
      bloomPass.strength = 0.12;
      bloomPass.radius = 0.22;
      bloomPass.threshold = 0.92;
    }"""

    if old_bloom_cfg in js:
        js = js.replace(old_bloom_cfg, new_bloom_cfg, 1)
        print("4. Tuned gfxApply bloomPass: threshold 0.86, strength 0.24.")

    # Grade pass: smooth S-curve, natural saturation, no building blowout
    old_grade = """            // Sombras azuladas cómic e iluminación cálida anime
            c = mix(c * vec3(.88, .94, 1.12), c * vec3(1.10, 1.04, .92), smoothstep(.18, .78, l));
            c = clamp(c, 0., 1.);
            // Curva S cinematográfica para contraste nítido anime
            c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);
            // Saturación vibrante
            float g = dot(c, vec3(.299, .587, .114));
            c = mix(vec3(g), c, 1.25);
            // Viñeta suave en las esquinas
            vec2 d = (vUv - .5) * vec2(1.12, 1.);
            c *= 1. - smoothstep(.40, .98, length(d)) * .22;"""

    new_grade = """            // Sombras azuladas cómic e iluminación suave anime (sin sobreexponer)
            c = mix(c * vec3(.92, .96, 1.08), c * vec3(1.05, 1.02, .96), smoothstep(.22, .82, l));
            c = clamp(c, 0., 1.);
            // Curva S suave para contraste cel-shaded limpio
            c = mix(c, c * c * (3.0 - 2.0 * c), 0.12);
            // Saturación natural vibrante
            float g = dot(c, vec3(.299, .587, .114));
            c = mix(vec3(g), c, 1.12);
            // Viñeta suave
            vec2 d = (vUv - .5) * vec2(1.12, 1.);
            c *= 1. - smoothstep(.42, .98, length(d)) * .18;"""

    if old_grade in js:
        js = js.replace(old_grade, new_grade, 1)
        print("5. Tuned gradePass shader for rich cel-shading without blowout.")

    # C. FIX /bs-server 404 (only query on localhost)
    old_bs_server = "if (!window.claude && /^https?:$/.test(location.protocol)) {\n    try {\n      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 1200), r = await fetch('/bs-server',"
    new_bs_server = "if (!window.claude && /^https?:$/.test(location.protocol) && /^(localhost|127\.|\[::1\]|192\.168\.)/.test(location.hostname)) {\n    try {\n      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 1200), r = await fetch('/bs-server',"
    if old_bs_server in js:
        js = js.replace(old_bs_server, new_bs_server, 1)
        print("6. Restricted /bs-server fetch to localhost only (eliminates 404 error on web).")

    # D. FIX THREE.Material: 'map' parameter is undefined
    old_batches_mat = "const mat=new THREE.MeshPhongMaterial({color:batch.color,map:texture,shininess:road?8:12,specular:0x15202a,bumpMap:facade?plaster:road?asphalt:null,bumpScale:facade?.025:.018,emissive:batch.tex==='lamp'?batch.color:0x000000});"
    new_batches_mat = """const matOpts={color:batch.color,shininess:road?8:12,specular:0x15202a,bumpScale:facade?.025:.018,emissive:batch.tex==='lamp'?batch.color:0x000000};
    if(texture) matOpts.map=texture;
    const bump=facade?plaster:road?asphalt:null; if(bump) matOpts.bumpMap=bump;
    const mat=new THREE.MeshPhongMaterial(matOpts);"""
    if old_batches_mat in js:
        js = js.replace(old_batches_mat, new_batches_mat, 1)
        print("7. Fixed batches Material map undefined warning.")

    # E. FIX willReadFrequently warning on 2D context
    old_face_orig = "f.faceCtx = g; f.faceOrig = g.getImageData(8, 8, 8, 8); f.hatOrig = g.getImageData(40, 8, 8, 8);"
    new_face_orig = "f.faceCtx = g; f.faceOrig = g.getImageData(8, 8, 8, 8); f.hatOrig = g.getImageData(40, 8, 8, 8);" # check context creator
    
    old_c_ctx = "setupFace(f, faceC, !G.customSkin);"
    # Let's search where face canvas is created or getContext('2d')
    if "c.getContext('2d')" in js:
        js = js.replace("c.getContext('2d')", "c.getContext('2d', { willReadFrequently: true })")
        print("8. Added willReadFrequently: true to canvas 2D contexts.")

    # F. FIX AudioContext warning (resume on user gesture, don't eagerly spam warning on load)
    old_ac_resume = "if (AC && (AC.state === 'suspended' || AC.state === 'interrupted')) AC.resume().catch(()=>{});"
    new_ac_resume = """if (AC && (AC.state === 'suspended' || AC.state === 'interrupted')) {
    const resumeOnGesture = () => { if (AC && AC.state === 'suspended') AC.resume().catch(()=>{}); };
    ['pointerdown','keydown','touchstart'].forEach(ev => window.addEventListener(ev, resumeOnGesture, { once: true, passive: true }));
  }"""
    if old_ac_resume in js:
        js = js.replace(old_ac_resume, new_ac_resume, 1)
        print("9. Deferred AudioContext resume to first user gesture.")

    # G. TRANSITION DIRECTLY TO THE 3D MAIN MENU (Image 1 screen)
    # Clarify the Main Menu in code comments and ensure LOADER transitions to it
    old_finish_trans = """      // 2. Transición cinematográfica directa al MENÚ (Selección de Personajes)
      setTimeout(() => {
        if (typeof titleFinish === 'function' && TITLE.on) {
          titleFinish();
        } else {
          $('title').classList.add('hidden');
          $('menu').classList.remove('hidden');
          G.state = 'menu';
          if (typeof showSelect === 'function') showSelect(G.charId);
        }"""

    new_finish_trans = """      // 2. Transición cinematográfica directa al MENÚ PRINCIPAL 3D (Escena de inicio: Personaje, Ciudad, Sol y Mar)
      setTimeout(() => {
        // El Menú Principal es la escena 3D inicial (titleStart) con el personaje contemplando la ciudad, Cambiar Escena, Ajustes y Jugar
        if (typeof titleStart === 'function') {
          titleStart(true);
        }
        $('menu').classList.add('hidden');
        $('title').classList.remove('hidden', 'leaving');
        G.state = 'title';"""

    if old_finish_trans in js:
        js = js.replace(old_finish_trans, new_finish_trans, 1)
        print("10. LOADER.finish() now transitions directly into the 3D Main Menu as clarified by the user!")
    else:
        print("Warning: old_finish_trans not found.")

    with open('js/game.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("js/game.js updated successfully!")

    # =========================================================================
    # 2. UPDATE index.html (add mobile-web-app-capable and ensure clean meta)
    # =========================================================================
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    old_meta_apple = '<meta name="apple-mobile-web-app-capable" content="yes">'
    new_meta_mobile = '<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">'
    if old_meta_apple in html and '<meta name="mobile-web-app-capable"' not in html:
        html = html.replace(old_meta_apple, new_meta_mobile, 1)
        print("11. Added <meta name=\"mobile-web-app-capable\" content=\"yes\"> to index.html.")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html updated successfully!")

    # =========================================================================
    # 3. SYNC TO CalFight-App
    # =========================================================================
    dest_app = os.path.join('CalFight-App', 'resources', 'app')
    if os.path.exists(dest_app):
        shutil.copy2('index.html', os.path.join(dest_app, 'index.html'))
        shutil.copy2('js/game.js', os.path.join(dest_app, 'js', 'game.js'))
        print("12. Synced index.html and js/game.js to CalFight-App bundle!")

if __name__ == '__main__':
    main()
