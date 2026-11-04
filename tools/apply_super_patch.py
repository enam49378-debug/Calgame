# -*- coding: utf-8 -*-
import os
import shutil

def main():
    print("Applying Super Visuals & 200 FPS Engine Patch...")

    with open('js/game.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # =========================================================================
    # 1. ANIME SKY DOME WITH VERTICAL GRADIENT
    # =========================================================================
    old_sky_target = """const scene = new THREE.Scene();
const SKY = 0xa8d5ff;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 70, 210);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);
scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x3d506d, 0.88));
const sun = new THREE.DirectionalLight(0xfff2d4, 0.95);
sun.position.set(30, 55, 18); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -78, right: 78, top: 78, bottom: -78, far: 260 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = .025;
scene.add(sun, sun.target);"""

    new_sky_target = """const scene = new THREE.Scene();
const SKY = 0x5da8ea;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(0x82bcf2, 80, 240);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);

// Luz hemisférica vibrante: cielo azul anime + rebote dorado del suelo
scene.add(new THREE.HemisphereLight(0x9fd5ff, 0x5a4836, 1.08));
const sun = new THREE.DirectionalLight(0xfffae8, 1.25);
sun.position.set(30, 55, 18); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -78, right: 78, top: 78, bottom: -78, far: 260 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = .025;
scene.add(sun, sun.target);

// Cúpula celeste anime con gradiente vertical (Zenit índigo Shinkai -> Horizonte cálido)
const ANIME_SKY_TEX = (() => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0.00, '#153c78'); // Zenit: índigo profundo
  gr.addColorStop(0.32, '#2872cb'); // Cielo superior: azul anime vibrante
  gr.addColorStop(0.65, '#56a2e6'); // Medio cielo: celeste luminoso
  gr.addColorStop(0.86, '#94cef6'); // Atmósfera baja
  gr.addColorStop(1.00, '#ffd8b5'); // Resplandor dorado de horizonte
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  return t;
})();
const skyGeo = new THREE.SphereGeometry(380, 32, 16);
const skyMat = new THREE.MeshBasicMaterial({ map: ANIME_SKY_TEX, side: THREE.BackSide, depthWrite: false, fog: false });
const skyDome = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyDome);"""

    if old_sky_target in content:
        content = content.replace(old_sky_target, new_sky_target, 1)
        print("1. Sky Dome added successfully.")
    else:
        print("Warning: old_sky_target not found.")

    # =========================================================================
    # 2. VOLUMETRIC ANIME GOD RAYS
    # =========================================================================
    if 'function updateGodRays()' not in content:
        godrays_func = """
// ====================================================================
// RAYOS DE SOL VOLUMÉTRICOS ANIME (God Rays dinámicos)
// ====================================================================
function updateGodRays() {
  const gr = $('game-godrays');
  if (!gr) return;
  if (!GFX_CFG.godrays || G.state !== 'play' || (G.cine && G.cine.shot === 1) || (typeof WX !== 'undefined' && WX.cloud > 0.65)) {
    gr.style.opacity = '0';
    return;
  }
  const camFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const sunPos = sun.position.clone().normalize();
  const dot = camFwd.dot(sunPos);
  if (dot > -0.25) {
    const sv = sunPos.clone().multiplyScalar(150).project(camera);
    const sx = clamp((sv.x * 0.5 + 0.5) * 100, 5, 95);
    const sy = clamp((-sv.y * 0.5 + 0.5) * 100, -25, 45);
    gr.style.setProperty('--sx', sx.toFixed(1) + '%');
    gr.style.setProperty('--sy', sy.toFixed(1) + '%');
    const alpha = clamp((dot + 0.25) / 0.85, 0, 1) * 0.70;
    gr.style.opacity = alpha.toFixed(2);
  } else {
    gr.style.opacity = '0';
  }
}
"""
        idx_loop = content.find('function loop(now){')
        if idx_loop != -1:
            content = content[:idx_loop] + godrays_func + '\n' + content[idx_loop:]
            print("2. updateGodRays function inserted.")

    old_cam_call = "frameTask('camara:efectos',()=>updateCamFx(rdt));frameTask('camara',()=>{updateCamera(rdt);if(GS.on)guideCam(rdt);});"
    new_cam_call = "frameTask('camara:efectos',()=>updateCamFx(rdt));frameTask('camara',()=>{updateCamera(rdt);if(GS.on)guideCam(rdt);});frameTask('rayos_sol',()=>updateGodRays());"
    if old_cam_call in content and "frameTask('rayos_sol'" not in content:
        content = content.replace(old_cam_call, new_cam_call, 1)
        print("3. updateGodRays hooked into loop().")

    # =========================================================================
    # 3. UNLOCK 200 FPS (ZERO JITTER THROTTLING)
    # =========================================================================
    old_gfx_limit_check = """  if(typeof GFX_LIMIT !== 'undefined' && GFX_LIMIT.minDt > 0){
    const tNow = performance.now();
    if(tNow - GFX_LIMIT.lastFrame < GFX_LIMIT.minDt - 0.5) return;
    GFX_LIMIT.lastFrame = tNow;
  }"""

    new_gfx_limit_check = """  if (typeof GFX_LIMIT !== 'undefined' && GFX_LIMIT.minDt > 0) {
    const tNow = performance.now();
    const elapsed = tNow - GFX_LIMIT.lastFrame;
    if (elapsed < GFX_LIMIT.minDt * 0.88) return;
    GFX_LIMIT.lastFrame = tNow - (elapsed % GFX_LIMIT.minDt);
  }"""

    if old_gfx_limit_check in content:
        content = content.replace(old_gfx_limit_check, new_gfx_limit_check, 1)
        print("4. GFX_LIMIT jitter throttling replaced with phase accumulator.")

    old_apply_min_dt = """  GFX_LIMIT.fps = Number(GFX_CFG.fpsLimit) || 0;
  GFX_LIMIT.minDt = GFX_LIMIT.fps > 0 ? (1000 / GFX_LIMIT.fps) : 0;"""

    new_apply_min_dt = """  GFX_LIMIT.fps = Number(GFX_CFG.fpsLimit) || 0;
  // Si es 0 (ilimitado) o 200 FPS (pantallas de 200 Hz), minDt=0 para permitir rendimiento nativo a 200 Hz sin saltos
  GFX_LIMIT.minDt = (GFX_LIMIT.fps > 0 && GFX_LIMIT.fps < 200) ? (1000 / GFX_LIMIT.fps) : 0;"""

    if old_apply_min_dt in content:
        content = content.replace(old_apply_min_dt, new_apply_min_dt, 1)
        print("5. GFX_LIMIT minDt set to 0 for 200 FPS / Unlimited.")

    # =========================================================================
    # 4. TUNE BLOOM (SAFE RADIANCE, PREVENT WHITEOUT)
    # =========================================================================
    old_bloom_vals = """    if (GFX_CFG.bloom === 'anime') {
      bloomPass.strength = 0.48;
      bloomPass.radius = 0.45;
      bloomPass.threshold = 0.38;
    } else if (GFX_CFG.bloom === 'subtle') {
      bloomPass.strength = 0.22;
      bloomPass.radius = 0.30;
      bloomPass.threshold = 0.55;
    }"""

    new_bloom_vals = """    if (GFX_CFG.bloom === 'anime') {
      bloomPass.strength = 0.38;
      bloomPass.radius = 0.36;
      bloomPass.threshold = 0.62;
    } else if (GFX_CFG.bloom === 'subtle') {
      bloomPass.strength = 0.18;
      bloomPass.radius = 0.26;
      bloomPass.threshold = 0.78;
    }"""

    if old_bloom_vals in content:
        content = content.replace(old_bloom_vals, new_bloom_vals, 1)
        print("6. Bloom threshold tuned to 0.62 (prevents whiteout, keeps auras radiant).")

    old_bloom_ctor = "bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(Math.floor(innerWidth / 2), Math.floor(innerHeight / 2)), .45, .42, .38);"
    new_bloom_ctor = "bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(Math.floor(innerWidth / 2), Math.floor(innerHeight / 2)), .38, .36, .62);"
    if old_bloom_ctor in content:
        content = content.replace(old_bloom_ctor, new_bloom_ctor, 1)
        print("7. UnrealBloomPass ctor tuned to safe vibrant values.")

    with open('js/game.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("js/game.js updated successfully!")

    # =========================================================================
    # 5. SYNC TO CalFight-App BUNDLE
    # =========================================================================
    dest_app = os.path.join('CalFight-App', 'resources', 'app')
    if os.path.exists(dest_app):
        print("Syncing updated files to CalFight-App bundle...")
        shutil.copy2('index.html', os.path.join(dest_app, 'index.html'))
        shutil.copy2('css/style.css', os.path.join(dest_app, 'css', 'style.css'))
        shutil.copy2('js/game.js', os.path.join(dest_app, 'js', 'game.js'))
        print("CalFight-App bundle updated!")

if __name__ == '__main__':
    main()
