# -*- coding: utf-8 -*-
import os
import shutil

def main():
    print("Applying Super Visuals overhaul to CalFight engine...")

    with open('js/game.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # =========================================================================
    # 1. ANIME SKY DOME WITH VERTICAL GRADIENT
    # =========================================================================
    old_sky_def = """const scene = new THREE.Scene();
const SKY = 0xa8d5ff;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 70, 210);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);
scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x3d506d, 0.88));
const sun = new THREE.DirectionalLight(0xfff2d4, 0.95);
sun.position.set(30, 55, 18); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -78, right: 78, top: 78, bottom: -78, far: 260 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = .025;
scene.add(sun, sun.target);"""

    new_sky_def = """const scene = new THREE.Scene();
const SKY = 0x68aee8;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(0x8bc4f5, 75, 230);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);

// Luz hemisférica: cielo azul anime + rebote cálido del suelo
scene.add(new THREE.HemisphereLight(0xa5d6ff, 0x5a4a38, 1.05));
const sun = new THREE.DirectionalLight(0xfffae6, 1.25);
sun.position.set(30, 55, 18); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -78, right: 78, top: 78, bottom: -78, far: 260 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = .025;
scene.add(sun, sun.target);

// Cúpula celeste anime con gradiente vertical (Zenit azul profundo -> Horizonte cálido Shinkai)
const ANIME_SKY_TEX = (() => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0.00, '#1c498a'); // Zenit: azul cerúleo profundo
  gr.addColorStop(0.35, '#2e75cb'); // Cielo medio alto: azul anime vibrante
  gr.addColorStop(0.68, '#5fa8e8'); // Cielo medio: celeste luminoso
  gr.addColorStop(0.88, '#9cd4f8'); // Horizonte: neblina suave
  gr.addColorStop(1.00, '#ffd8b5'); // Rebote de luz solar en el horizonte
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  return t;
})();
const skyGeo = new THREE.SphereGeometry(360, 32, 16);
const skyMat = new THREE.MeshBasicMaterial({ map: ANIME_SKY_TEX, side: THREE.BackSide, depthWrite: false, fog: false });
const skyDome = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyDome);"""

    if old_sky_def in js:
        js = js.replace(old_sky_def, new_sky_def, 1)
        print("Updated Sky and Lighting with Anime Sky Dome.")

    # =========================================================================
    # 2. VIBRANT CEL-SHADED BLOCK TEXTURES
    # =========================================================================
    old_block_tex = """const BLOCK_TEX = {
  grass: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#52af32', 30); g.fillStyle = 'rgba(25,75,18,.35)'; for (let i = 0; i < 18; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); g.fillStyle = '#7de853'; for (let i = 0; i < 8; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); }),
  cobble: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#727e8a', 28); g.fillStyle = '#3c4652'; for (let i = 0; i < 26; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, Math.random() < .5 ? 2 : 1, 1); g.fillStyle = '#a6b4c4'; for (let i = 0; i < 14; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); }),
  brick: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#987a70', 18); g.fillStyle = '#54413b'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(15, 8, 1, 7); g.fillStyle = '#bca197'; g.fillRect(0, 0, 7, 1); g.fillRect(8, 8, 7, 1); }),
  log: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#6b4f2c', 18); g.fillStyle = '#4a3519'; for (let x = 1; x < 16; x += 3) g.fillRect(x, 0, 1, 16); }),
  leaves: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#38a82c', 36); g.fillStyle = '#1c6314'; for (let i = 0; i < 30; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); g.fillStyle = '#65d957'; for (let i = 0; i < 12; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); }),
  plank: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#b08b54', 16); g.fillStyle = '#75542b'; [3, 7, 11, 15].forEach(y => g.fillRect(0, y, 16, 1)); g.fillRect(8, 0, 1, 3); g.fillRect(3, 4, 1, 3); g.fillRect(12, 8, 1, 3); }),
};"""

    new_block_tex = """const BLOCK_TEX = {
  // Pasto estilo anime Ghibli / BotW: base esmeralda con motas lima luminosas
  grass: pixTex(16, 16, g => {
    g.fillStyle = '#42c050'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#2d913a';
    for (let i = 0; i < 14; i++) g.fillRect((i * 5) % 16, (i * 7) % 16, 2, 2);
    g.fillStyle = '#6eed75';
    for (let i = 0; i < 8; i++) g.fillRect((i * 9 + 3) % 16, (i * 11 + 2) % 16, 1, 2);
  }),
  // Adoquines de anime: piedras redondeadas con juntas limpias y bisel
  cobble: pixTex(16, 16, g => {
    g.fillStyle = '#8291a2'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#515e6e'; // juntas oscuras
    g.strokeRect(0.5, 0.5, 7, 7); g.strokeRect(8.5, 0.5, 7, 7);
    g.strokeRect(4.5, 8.5, 7, 7);
    g.fillStyle = '#a9b8cc'; // brillos superiores
    g.fillRect(1, 1, 6, 1); g.fillRect(9, 1, 6, 1); g.fillRect(5, 9, 6, 1);
  }),
  // Ladrillos cálidos estilizados
  brick: pixTex(16, 16, g => {
    g.fillStyle = '#bf6a54'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#773426'; // líneas de cemento
    g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1);
    g.fillRect(7, 0, 1, 7); g.fillRect(15, 8, 1, 7);
    g.fillStyle = '#db8974'; // resplandor superior
    g.fillRect(0, 1, 7, 1); g.fillRect(8, 9, 7, 1);
  }),
  // Madera anime cálida
  log: pixTex(16, 16, g => {
    g.fillStyle = '#84572e'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#593414';
    for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16);
    g.fillStyle = '#a57342';
    for (let x = 1; x < 16; x += 4) g.fillRect(x, 0, 1, 16);
  }),
  // Hojas de árbol anime
  leaves: pixTex(16, 16, g => {
    g.fillStyle = '#3ab84e'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#217d33';
    for (let i = 0; i < 20; i++) g.fillRect((i * 7) % 16, (i * 11) % 16, 2, 2);
    g.fillStyle = '#6ef07d';
    for (let i = 0; i < 10; i++) g.fillRect((i * 13 + 1) % 16, (i * 9 + 4) % 16, 2, 1);
  }),
  // Tablones limpios
  plank: pixTex(16, 16, g => {
    g.fillStyle = '#c79c5c'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#855e2d';
    [3, 7, 11, 15].forEach(y => g.fillRect(0, y, 16, 1));
    g.fillStyle = '#e5be82';
    [0, 4, 8, 12].forEach(y => g.fillRect(0, y, 16, 1));
  }),
};"""

    if old_block_tex in js:
        js = js.replace(old_block_tex, new_block_tex, 1)
        print("Updated BLOCK_TEX with clean painterly anime textures.")

    # =========================================================================
    # 3. HIGH-IMPACT BLOOM AND PUNCHY COLOR GRADING
    # =========================================================================
    old_bloom_init = "bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(Math.floor(innerWidth / 2), Math.floor(innerHeight / 2)), .11, .32, .98);"
    new_bloom_init = "bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(Math.floor(innerWidth / 2), Math.floor(innerHeight / 2)), .45, .42, .38);"
    if old_bloom_init in js:
        js = js.replace(old_bloom_init, new_bloom_init, 1)
        print("Tuned initPostProcessing bloomPass to vibrant anime values.")

    old_gfx_bloom_cfg = """    if (GFX_CFG.bloom === 'anime') {
      bloomPass.strength = 0.20;
      bloomPass.radius = 0.35;
      bloomPass.threshold = 0.80;
    } else if (GFX_CFG.bloom === 'subtle') {
      bloomPass.strength = 0.09;
      bloomPass.radius = 0.22;
      bloomPass.threshold = 0.88;
    }"""

    new_gfx_bloom_cfg = """    if (GFX_CFG.bloom === 'anime') {
      bloomPass.strength = 0.48;
      bloomPass.radius = 0.45;
      bloomPass.threshold = 0.38;
    } else if (GFX_CFG.bloom === 'subtle') {
      bloomPass.strength = 0.22;
      bloomPass.radius = 0.30;
      bloomPass.threshold = 0.55;
    }"""

    if old_gfx_bloom_cfg in js:
        js = js.replace(old_gfx_bloom_cfg, new_gfx_bloom_cfg, 1)
        print("Tuned gfxApply bloom strength and threshold for vibrant anime radiance.")

    old_grade_shader = """            vec3 c = texture2D(tDiffuse, vUv).rgb;
            float l = dot(c, vec3(.299, .587, .114));
            c = mix(c * vec3(.93, .98, 1.08), c * vec3(1.05, 1.01, .94), smoothstep(.25, .85, l));
            c=clamp(c,0.,1.);c=mix(c,c*c*(3.-2.*c),.1);
            float g = dot(c, vec3(.299, .587, .114)); c = mix(vec3(g), c, 1.08);
            vec2 d = (vUv - .5) * vec2(1.1, 1.); c *= 1. - smoothstep(.36, .98, length(d)) * .26;
            gl_FragColor = vec4(c, 1.);"""

    new_grade_shader = """            vec3 c = texture2D(tDiffuse, vUv).rgb;
            float l = dot(c, vec3(.299, .587, .114));
            // Sombras azuladas cómic e iluminación cálida anime
            c = mix(c * vec3(.88, .94, 1.12), c * vec3(1.10, 1.04, .92), smoothstep(.18, .78, l));
            c = clamp(c, 0., 1.);
            // Curva S cinematográfica para contraste nítido anime
            c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);
            // Saturación vibrante
            float g = dot(c, vec3(.299, .587, .114));
            c = mix(vec3(g), c, 1.25);
            // Viñeta suave en las esquinas
            vec2 d = (vUv - .5) * vec2(1.12, 1.);
            c *= 1. - smoothstep(.40, .98, length(d)) * .22;
            gl_FragColor = vec4(c, 1.);"""

    if old_grade_shader in js:
        js = js.replace(old_grade_shader, new_grade_shader, 1)
        print("Tuned gradePass shader with punchy anime film contrast and saturation.")

    # =========================================================================
    # 4. GOD RAYS STREAMING FROM SUN QUADRANT (ALWAYS VISIBLE OUTDOORS)
    # =========================================================================
    old_godrays_calc = """  // Rayos de sol crepusculares volumétricos (God Rays anime)
  if (GFX_CFG.godrays && CITY.sunDisc) {
    const sv = CITY.sunDisc.position.clone().project(camera);
    const isVis = sv.z < 1 && Math.abs(sv.x) < 1.45 && Math.abs(sv.y) < 1.45;
    const gr = $('game-godrays');
    if (gr) {
      if (isVis && (!G.cine || G.cine.shot !== 1)) {
        const sx = (sv.x * .5 + .5) * 100;
        const sy = (-sv.y * .5 + .5) * 100;
        gr.style.setProperty('--sx', sx.toFixed(1) + '%');
        gr.style.setProperty('--sy', sy.toFixed(1) + '%');
        const dCenter = Math.hypot(sv.x, sv.y);
        const alpha = clamp((1.45 - dCenter) / 1.45, 0, 1) * 0.65;
        gr.style.opacity = alpha.toFixed(2);
      } else {
        gr.style.opacity = '0';
      }
    }
  } else {
    const gr = $('game-godrays'); if (gr) gr.style.opacity = '0';
  }"""

    new_godrays_calc = """  // Rayos de sol crepusculares volumétricos (God Rays anime de alta visibilidad)
  const gr = $('game-godrays');
  if (gr) {
    if (GFX_CFG.godrays && G.state === 'play' && (!G.cine || G.cine.shot !== 1)) {
      // Vector dirección de la cámara frente al vector del sol
      const camFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const sunDir = new THREE.Vector3(30, 55, 18).normalize();
      const dotSun = camFwd.dot(sunDir);
      if (dotSun > -0.2) {
        const sv = sunDir.clone().multiplyScalar(100).project(camera);
        const sx = clamp((sv.x * 0.5 + 0.5) * 100, 5, 95);
        const sy = clamp((-sv.y * 0.5 + 0.5) * 100, -25, 45);
        gr.style.setProperty('--sx', sx.toFixed(1) + '%');
        gr.style.setProperty('--sy', sy.toFixed(1) + '%');
        const alpha = clamp((dotSun + 0.2) / 0.8, 0, 1) * 0.72;
        gr.style.opacity = alpha.toFixed(2);
      } else {
        gr.style.opacity = '0';
      }
    } else {
      gr.style.opacity = '0';
    }
  }"""

    if old_godrays_calc in js:
        js = js.replace(old_godrays_calc, new_godrays_calc, 1)
        print("Updated God Rays camera projection to be reliably visible.")

    # =========================================================================
    # 5. PITCH-BLACK GROUND CONTACT SHADOW (VISIBLE ON ALL SURFACES)
    # =========================================================================
    old_shadow_tex = """const CONTACT_SHADOW_TEX = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(8, 10, 18, 0.68)');
  grad.addColorStop(0.35, 'rgba(10, 12, 22, 0.45)');
  grad.addColorStop(0.75, 'rgba(12, 14, 25, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  return t;
})();
const CONTACT_SHADOW_MAT = new THREE.MeshBasicMaterial({
  map: CONTACT_SHADOW_TEX,
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1.5,
  polygonOffsetUnits: -1.5
});

function updateContactShadow(f) {
  if (!f || !f.pos) return;
  if (!f.contactShadow) {
    f.contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), CONTACT_SHADOW_MAT.clone());
    f.contactShadow.rotation.x = -Math.PI / 2;
    scene.add(f.contactShadow);
  }
  if (!f.alive || !GFX_CFG.contactShadows || G.state !== 'play') {
    f.contactShadow.visible = false;
    return;
  }
  const gy = groundAt(f.pos.x, f.pos.z, f.pos.y + 0.1);
  const distY = Math.max(0, f.pos.y - gy);
  if (distY > 10) {
    f.contactShadow.visible = false;
    return;
  }
  f.contactShadow.visible = true;
  f.contactShadow.position.set(f.pos.x, gy + 0.035, f.pos.z);
  const scale = clamp(1.4 + distY * 0.15, 0.8, 2.4);
  f.contactShadow.scale.set(scale, scale, 1);
  f.contactShadow.material.opacity = clamp(0.7 - distY * 0.08, 0, 0.7);
}"""

    new_shadow_tex = """const CONTACT_SHADOW_TEX = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0.00, 'rgba(0, 0, 0, 0.90)'); // Centro negro profundo nítido
  grad.addColorStop(0.40, 'rgba(4, 6, 14, 0.70)');
  grad.addColorStop(0.75, 'rgba(10, 12, 22, 0.25)');
  grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.00)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  return t;
})();
const CONTACT_SHADOW_MAT = new THREE.MeshBasicMaterial({
  map: CONTACT_SHADOW_TEX,
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2.0,
  polygonOffsetUnits: -2.0
});

function updateContactShadow(f) {
  if (!f || !f.pos) return;
  if (!f.contactShadow) {
    f.contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), CONTACT_SHADOW_MAT.clone());
    f.contactShadow.rotation.x = -Math.PI / 2;
    scene.add(f.contactShadow);
  }
  if (!f.alive || !GFX_CFG.contactShadows || (G.state !== 'play' && G.state !== 'menu')) {
    f.contactShadow.visible = false;
    return;
  }
  const gy = groundAt(f.pos.x, f.pos.z, f.pos.y + 0.1);
  const distY = Math.max(0, f.pos.y - gy);
  if (distY > 12) {
    f.contactShadow.visible = false;
    return;
  }
  f.contactShadow.visible = true;
  f.contactShadow.position.set(f.pos.x, gy + 0.045, f.pos.z);
  const scale = clamp(1.5 + distY * 0.18, 0.9, 2.8);
  f.contactShadow.scale.set(scale, scale, 1);
  f.contactShadow.material.opacity = clamp(0.88 - distY * 0.09, 0, 0.88);
}"""

    if old_shadow_tex in js:
        js = js.replace(old_shadow_tex, new_shadow_tex, 1)
        print("Updated Contact Shadows with high-contrast pitch-black stencil.")

    # =========================================================================
    # 6. CHARACTER SELECTOR VISUAL UPGRADE (VIBRANT PEDESTAL, GLOW & PARTICLES)
    # =========================================================================
    old_sh_ring = "SH.ring = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.68, 6), glowMat('#ff4d4d', .9)); SH.ring.rotation.x = -Math.PI / 2; SH.ring.position.y = .11; s.add(SH.ring);"
    new_sh_ring = """SH.ring = new THREE.Mesh(new THREE.RingGeometry(1.52, 1.74, 32), glowMat('#ff4d4d', 1.0)); SH.ring.rotation.x = -Math.PI / 2; SH.ring.position.y = .12; s.add(SH.ring);
  // Anillo de energía exterior pulsante en el selector
  SH.ring2 = new THREE.Mesh(new THREE.RingGeometry(1.82, 1.94, 32), glowMat('#4fc3ff', .7)); SH.ring2.rotation.x = -Math.PI / 2; SH.ring2.position.y = .08; s.add(SH.ring2);"""

    if old_sh_ring in js:
        js = js.replace(old_sh_ring, new_sh_ring, 1)
        print("Updated Character Selector pedestal with double glowing energy rings.")

    # Hook SH.ring2 color update in showSelect
    old_sh_rim_color = "SH.rim.color.set(ch.color); SH.rim2.color.set(ch.color); SH.ring.material.color.set(ch.color);"
    new_sh_rim_color = "SH.rim.color.set(ch.color); SH.rim2.color.set(ch.color); SH.ring.material.color.set(ch.color); if(SH.ring2) SH.ring2.material.color.set(ch.color);"
    if old_sh_rim_color in js:
        js = js.replace(old_sh_rim_color, new_sh_rim_color, 1)

    # Hook SH.ring2 rotation in updateShow
    old_sh_ring_rot = "SH.ring.rotation.z += dt * .4;"
    new_sh_ring_rot = "SH.ring.rotation.z += dt * .4; if(SH.ring2) SH.ring2.rotation.z -= dt * .25;"
    if old_sh_ring_rot in js:
        js = js.replace(old_sh_ring_rot, new_sh_ring_rot, 1)

    with open('js/game.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Saved upgraded js/game.js successfully.")

    # =========================================================================
    # 7. SYNC TO CalFight-App BUNDLE
    # =========================================================================
    dest_app = os.path.join('CalFight-App', 'resources', 'app')
    if os.path.exists(dest_app):
        print("Syncing super visuals to CalFight-App bundle...")
        shutil.copy2('index.html', os.path.join(dest_app, 'index.html'))
        shutil.copy2('css/style.css', os.path.join(dest_app, 'css', 'style.css'))
        shutil.copy2('js/game.js', os.path.join(dest_app, 'js', 'game.js'))
        print("CalFight-App bundle successfully updated!")

if __name__ == '__main__':
    main()
