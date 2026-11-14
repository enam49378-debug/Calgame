# -*- coding: utf-8 -*-
import os
import shutil

def main():
    print("Upgrading graphics across style.css, index.html, and js/game.js...")

    # =========================================================================
    # 1. UPDATE css/style.css with #game-godrays
    # =========================================================================
    with open('css/style.css', 'r', encoding='utf-8') as f:
        css = f.read()

    godrays_css = """
#game-godrays{position:fixed;inset:0;z-index:3;pointer-events:none;mix-blend-mode:screen;opacity:0;transition:opacity .25s ease;--sx:50%;--sy:35%;
  background:repeating-conic-gradient(from 0deg at var(--sx) var(--sy),rgba(255,190,110,0) 0deg,rgba(255,210,130,.18) 2.2deg,rgba(255,190,110,0) 5.0deg,rgba(255,190,110,0) 8.5deg);
  -webkit-mask:radial-gradient(circle at var(--sx) var(--sy),#000 0,rgba(0,0,0,.6) 35%,transparent 75%);
  mask:radial-gradient(circle at var(--sx) var(--sy),#000 0,rgba(0,0,0,.6) 35%,transparent 75%);
}
"""
    if '#game-godrays' not in css:
        css += godrays_css
        with open('css/style.css', 'w', encoding='utf-8') as f:
            f.write(css)
        print("Updated css/style.css with #game-godrays.")

    # =========================================================================
    # 2. UPDATE index.html with new godrays element and new graphics menu options
    # =========================================================================
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Add #game-godrays right after <canvas id="lines"></canvas>
    if '<div id="game-godrays"></div>' not in html:
        html = html.replace(
            '<canvas id="lines"></canvas>',
            '<canvas id="lines"></canvas>\n<div id="game-godrays"></div>'
        )
        print("Added #game-godrays to index.html.")

    # Add the 4 new graphics options to section[data-cat="gfx"]
    old_speedlines_block = """        <label class="chk">
          <input id="gfx-speedlines" type="checkbox" checked>
          <span>Líneas de velocidad de anime
            <small>Efecto de velocidad en dashes, combos y remates de K.O.</small>
          </span>
        </label>"""

    new_options_block = """        <label class="chk">
          <input id="gfx-speedlines" type="checkbox" checked>
          <span>Líneas de velocidad de anime
            <small>Efecto de velocidad en dashes, combos y remates de K.O.</small>
          </span>
        </label>
        <label class="chk">
          <input id="gfx-godrays" type="checkbox" checked>
          <span>Rayos de Sol Volumétricos (God Rays)
            <small>Haces de luz dorada estilo Makoto Shinkai entre los edificios.</small>
          </span>
        </label>
        <label class="chk">
          <input id="gfx-auras" type="checkbox" checked>
          <span>Auras de Despertar (Awakening FX)
            <small>Llamas de energía anime y auras vivas al activar el Despertar.</small>
          </span>
        </label>
        <label class="chk">
          <input id="gfx-dust" type="checkbox" checked>
          <span>Polvo y Viento Anime (Dashes y Caídas)
            <small>Anillos de polvo en el suelo al hacer esquives y aterrizar de saltos.</small>
          </span>
        </label>
        <label class="chk">
          <input id="gfx-cshadows" type="checkbox" checked>
          <span>Sombras de Contacto Suave (Ground AO)
            <small>Sombra suave bajo los pies de cada peleador para asentarlos en el suelo.</small>
          </span>
        </label>"""

    if old_speedlines_block in html and '<input id="gfx-godrays"' not in html:
        html = html.replace(old_speedlines_block, new_options_block, 1)
        print("Added 4 new graphics menu options in index.html.")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

    # =========================================================================
    # 3. UPDATE js/game.js WITH COMPLETE VISUAL ENGINE UPGRADE
    # =========================================================================
    with open('js/game.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # 3.1 Update GFX_CFG, gfxSyncUI, gfxApply, and gfxInit
    old_cfg_start = 'const GFX_CFG = {\n  preset: "auto",\n  fpsLimit: 200,\n  shadows: "soft",\n  bloom: "anime",\n  scale: 1.0,\n  outlines: true,\n  speedlines: true\n};'
    new_cfg_start = """const GFX_CFG = {
  preset: "auto",
  fpsLimit: 200,
  shadows: "soft",
  bloom: "anime",
  scale: 1.0,
  outlines: true,
  speedlines: true,
  godrays: true,
  auras: true,
  dust: true,
  contactShadows: true
};"""
    if old_cfg_start in js:
        js = js.replace(old_cfg_start, new_cfg_start, 1)
        print("Updated GFX_CFG in game.js.")

    old_sync_ui = """  const ol = $('gfx-outlines'); if (ol) ol.checked = !!GFX_CFG.outlines;
  const sl = $('gfx-speedlines'); if (sl) sl.checked = !!GFX_CFG.speedlines;"""

    new_sync_ui = """  const ol = $('gfx-outlines'); if (ol) ol.checked = !!GFX_CFG.outlines;
  const sl = $('gfx-speedlines'); if (sl) sl.checked = !!GFX_CFG.speedlines;
  const gr = $('gfx-godrays'); if (gr) gr.checked = !!GFX_CFG.godrays;
  const au = $('gfx-auras'); if (au) au.checked = !!GFX_CFG.auras;
  const du = $('gfx-dust'); if (du) du.checked = !!GFX_CFG.dust;
  const cs = $('gfx-cshadows'); if (cs) cs.checked = !!GFX_CFG.contactShadows;"""

    if old_sync_ui in js:
        js = js.replace(old_sync_ui, new_sync_ui, 1)
        print("Updated gfxSyncUI in game.js.")

    old_preset_level0 = """    GFX_CFG.outlines = true;
    GFX_CFG.speedlines = true;
  } else if (level === 1) {"""

    new_preset_level0 = """    GFX_CFG.outlines = true;
    GFX_CFG.speedlines = true;
    GFX_CFG.godrays = true;
    GFX_CFG.auras = true;
    GFX_CFG.dust = true;
    GFX_CFG.contactShadows = true;
  } else if (level === 1) {"""

    if old_preset_level0 in js:
        js = js.replace(old_preset_level0, new_preset_level0, 1)

    old_preset_level1 = """    GFX_CFG.outlines = true;
    GFX_CFG.speedlines = true;
  } else if (level === 2) {"""

    new_preset_level1 = """    GFX_CFG.outlines = true;
    GFX_CFG.speedlines = true;
    GFX_CFG.godrays = true;
    GFX_CFG.auras = true;
    GFX_CFG.dust = true;
    GFX_CFG.contactShadows = true;
  } else if (level === 2) {"""

    if old_preset_level1 in js:
        js = js.replace(old_preset_level1, new_preset_level1, 1)

    old_preset_level2 = """    GFX_CFG.outlines = false;
    GFX_CFG.speedlines = true;
  } else if (level === 3) {"""

    new_preset_level2 = """    GFX_CFG.outlines = false;
    GFX_CFG.speedlines = true;
    GFX_CFG.godrays = false;
    GFX_CFG.auras = true;
    GFX_CFG.dust = true;
    GFX_CFG.contactShadows = true;
  } else if (level === 3) {"""

    if old_preset_level2 in js:
        js = js.replace(old_preset_level2, new_preset_level2, 1)

    old_preset_level3 = """    GFX_CFG.outlines = false;
    GFX_CFG.speedlines = false;
  } else {"""

    new_preset_level3 = """    GFX_CFG.outlines = false;
    GFX_CFG.speedlines = false;
    GFX_CFG.godrays = false;
    GFX_CFG.auras = false;
    GFX_CFG.dust = false;
    GFX_CFG.contactShadows = false;
  } else {"""

    if old_preset_level3 in js:
        js = js.replace(old_preset_level3, new_preset_level3, 1)

    old_preset_level4 = """    GFX_CFG.outlines = false;
    GFX_CFG.speedlines = false;
  }
  gfxApply(save);"""

    new_preset_level4 = """    GFX_CFG.outlines = false;
    GFX_CFG.speedlines = false;
    GFX_CFG.godrays = false;
    GFX_CFG.auras = false;
    GFX_CFG.dust = false;
    GFX_CFG.contactShadows = false;
  }
  gfxApply(save);"""

    if old_preset_level4 in js:
        js = js.replace(old_preset_level4, new_preset_level4, 1)

    # Wire event listeners in gfxInit
    old_listeners = """  const sl = $('gfx-speedlines');
  if (sl) sl.addEventListener('change', () => {
    GFX_CFG.speedlines = sl.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
  });"""

    new_listeners = """  const sl = $('gfx-speedlines');
  if (sl) sl.addEventListener('change', () => {
    GFX_CFG.speedlines = sl.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
  });
  const gr = $('gfx-godrays');
  if (gr) gr.addEventListener('change', () => {
    GFX_CFG.godrays = gr.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
  });
  const au = $('gfx-auras');
  if (au) au.addEventListener('change', () => {
    GFX_CFG.auras = au.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
  });
  const du = $('gfx-dust');
  if (du) du.addEventListener('change', () => {
    GFX_CFG.dust = du.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
  });
  const cs = $('gfx-cshadows');
  if (cs) cs.addEventListener('change', () => {
    GFX_CFG.contactShadows = cs.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
  });"""

    if old_listeners in js:
        js = js.replace(old_listeners, new_listeners, 1)
        print("Updated event listeners in gfxInit.")

    # 3.2 Define Ground Contact Shadow System, Awakening Aura System, and Anime Dust System
    helper_systems_code = """
// ====================================================================
// MOTOR GRÁFICO ANIME: SISTEMAS DE EFECTOS AVANZADOS
// ====================================================================

// 1. Textura y material de sombra de contacto suave (Ground Ambient Occlusion)
const CONTACT_SHADOW_TEX = (() => {
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
}

// 2. Sistema de Auras de Despertar (Awakening Energy Flame Spires)
const AURA_GEO = new THREE.CylinderGeometry(0.85, 1.3, 2.5, 12, 1, true);
function updateAwakeningAura(f, dt) {
  if (!f || !f.pos || !f.model) return;
  const active = f.alive && f.awak > 0 && GFX_CFG.auras && G.state === 'play';
  if (!f.awakAura && active) {
    const col = f.ch.color || '#4fc3ff';
    const mat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(AURA_GEO, mat);
    mesh.position.y = 1.2;
    f.model.root.add(mesh);
    f.awakAura = { mesh, mat, col };
    // Explosión de activación anime
    ringAt(f.pos, col, 4.8, 0.55);
    sphereFlash(f.pos, col, 2.4, 0.4);
    if (f.isPlayer) { camPunch(0.4, 1); G.shake = Math.max(G.shake, 0.35); }
    sfx('boom', f.pos);
  }
  if (f.awakAura) {
    if (!active) {
      if (f.awakAura.mesh.parent) f.awakAura.mesh.parent.remove(f.awakAura.mesh);
      f.awakAura.mat.dispose();
      f.awakAura = null;
      if (f.model && f.model.mats) f.model.mats.forEach(m => m.emissive && m.emissive.setRGB(0, 0, 0));
      return;
    }
    const au = f.awakAura;
    const t = G.time;
    au.mesh.rotation.y += dt * 5.5;
    const pulse = 1.0 + Math.sin(t * 14) * 0.12;
    au.mesh.scale.set(pulse, 1.0 + Math.cos(t * 10) * 0.1, pulse);
    au.mat.opacity = 0.38 + Math.sin(t * 12) * 0.15;
    // Resplandor cel-shaded en los materiales del personaje
    if (f.model.mats) {
      const emPow = 0.35 + 0.18 * Math.sin(t * 9);
      f.model.mats.forEach(m => { if (m.emissive) m.emissive.set(au.col).multiplyScalar(emPow); });
    }
    // Chispas de energía ascendentes
    if (Math.random() < dt * 26) {
      const a = rand(0, TAU), r = rand(0.3, 0.9);
      emit(
        f.pos.x + Math.cos(a) * r,
        f.pos.y + rand(0.1, 1.8),
        f.pos.z + Math.sin(a) * r,
        rand(-0.2, 0.2), rand(3, 6), rand(-0.2, 0.2),
        Math.random() < 0.4 ? '#ffffff' : au.col,
        rand(0.08, 0.18), 0.45, -0.05, 1
      );
    }
  }
}

// 3. Sistema de Polvo y Viento Anime (Anime Dust Puffs)
function animeDustRing(p, count = 10, maxR = 2.2, col = '#e4d8c5') {
  if (!GFX_CFG.dust) return;
  const gy = groundAt(p.x, p.z, p.y + 0.2);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + rand(-0.2, 0.2);
    const spd = rand(3.5, 7.5);
    const vx = Math.cos(a) * spd, vz = Math.sin(a) * spd;
    emit(
      p.x + Math.cos(a) * 0.4, gy + rand(0.05, 0.2), p.z + Math.sin(a) * 0.4,
      vx, rand(0.4, 1.8), vz,
      col, rand(0.12, 0.28), rand(0.3, 0.55), -0.6, 1
    );
  }
}
function animeDashSmoke(f) {
  if (!GFX_CFG.dust || !f || !f.pos) return;
  const F = fwd(f.yaw);
  const gy = groundAt(f.pos.x, f.pos.z, f.pos.y + 0.2);
  for (let i = 0; i < 4; i++) {
    emit(
      f.pos.x - F.x * rand(0.3, 0.8) + rand(-0.3, 0.3),
      gy + rand(0.05, 0.25),
      f.pos.z - F.z * rand(0.3, 0.8) + rand(-0.3, 0.3),
      -F.x * rand(2, 5), rand(0.3, 1.2), -F.z * rand(2, 5),
      '#e0d8cc', rand(0.15, 0.3), rand(0.3, 0.5), -0.5, 1
    );
  }
}
"""
    # Insert helper systems before updateCamera
    pos_cam = js.find('function updateCamera(dt) {')
    assert pos_cam != -1, "function updateCamera not found"
    js = js[:pos_cam] + helper_systems_code + '\n' + js[pos_cam:]
    print("Inserted helper systems (contact shadows, auras, dust) into game.js.")

    # 3.3 Add God Rays screen projection into updateCamera(dt)
    godrays_camera_code = """
  // Rayos de sol crepusculares volumétricos (God Rays anime)
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
  }
"""
    # Insert near end of updateCamera
    old_cam_end = 'camera.position.copy(c); camera.lookAt(look); camera.updateProjectionMatrix();'
    if old_cam_end in js:
        js = js.replace(old_cam_end, old_cam_end + godrays_camera_code, 1)
        print("Hooked God Rays projection into updateCamera.")

    # 3.4 Hook updateContactShadow and updateAwakeningAura into fighter loop
    # Let's find where fighters are updated in step(dt)
    old_step_fighters = 'for(let i=0;i<G.fighters.length;i++){const f=G.fighters[i];if(!f)continue;updateFighter(f,dt);}'
    new_step_fighters = 'for(let i=0;i<G.fighters.length;i++){const f=G.fighters[i];if(!f)continue;updateFighter(f,dt);updateContactShadow(f);updateAwakeningAura(f,dt);}'
    if old_step_fighters in js:
        js = js.replace(old_step_fighters, new_step_fighters, 1)
        print("Hooked contact shadows and auras into step() fighter loop.")
    else:
        # Check alternative fighter loop
        alt_fighter_loop = 'for(const f of G.fighters){if(!f)continue;updateFighter(f,dt);'
        if alt_fighter_loop in js:
            js = js.replace(alt_fighter_loop, alt_fighter_loop + 'updateContactShadow(f);updateAwakeningAura(f,dt);', 1)
            print("Hooked contact shadows and auras into alternative step() loop.")
        else:
            # Search where updateFighter is called in step
            pos_uf = js.find('updateFighter(')
            print("updateFighter found at:", pos_uf)

    # 3.5 Hook animeDustRing on landing and dash in movement / physics
    old_landing = 'if (!f.onGround && f.alive && vy < -9 && f.ragdoll <= 0) { f.landAnim = '
    new_landing = 'if (!f.onGround && f.alive && vy < -9 && f.ragdoll <= 0) { animeDustRing(f.pos, 14, 2.5); f.landAnim = '
    if old_landing in js:
        js = js.replace(old_landing, new_landing, 1)
        print("Hooked animeDustRing on landing.")

    old_dash_smoke = 'if (c.dash && f.dashCd <= 0 && !a && (f.onGround || f.airDash)) {'
    new_dash_smoke = 'if (c.dash && f.dashCd <= 0 && !a && (f.onGround || f.airDash)) { animeDashSmoke(f);'
    if old_dash_smoke in js:
        js = js.replace(old_dash_smoke, new_dash_smoke, 1)
        print("Hooked animeDashSmoke on dash start.")

    # 3.6 Hook enhanced impact cross-sparks and shockwaves in applyHit
    old_applyhit_burst = "  burst(chest, heavy ? 22 : 9, col, heavy ? 11 : 6, heavy ? .22 : .14, heavy ? .5 : .3, .5);\n  burst(chest, heavy ? 10 : 4, '#ffffff', heavy ? 9 : 5, .1, .25, .3);"
    new_applyhit_burst = """  burst(chest, heavy ? 22 : 9, col, heavy ? 11 : 6, heavy ? .22 : .14, heavy ? .5 : .3, .5);
  burst(chest, heavy ? 10 : 4, '#ffffff', heavy ? 9 : 5, .1, .25, .3);
  ringAt(chest, '#ffffff', heavy ? 2.8 : 1.6, heavy ? .28 : .18, 'face', Math.atan2(dir.x, dir.z));
  if (heavy && t.onGround) animeDustRing(t.pos, 10, 2.0);"""
    if old_applyhit_burst in js:
        js = js.replace(old_applyhit_burst, new_applyhit_burst, 1)
        print("Hooked enhanced impact shockwave in applyHit.")

    # 3.7 Add Diamond Glints and Cel-Shaded Wave Foam to Sea Shader
    old_sea_frag = """          float f1=(1.-smoothstep(0.,1.2,abs(dd-(1.4+1.2*sin(uTime*.8+vWP.x*.08)))))*step(0.,dd);
          float f2=(1.-smoothstep(0.,.8,abs(dd-(4.2+1.4*sin(uTime*.6+vWP.x*.05+2.)))))*step(0.,dd)*.55;
          float foam=clamp(f1+f2,0.,1.)*(.55+.45*spk);
          diffuseColor.rgb=mix(wc,vec3(1.),foam*.85);diffuseColor.a=mix(.55,.97,smoothstep(0.,16.,dd));"""

    new_sea_frag = """          float f1=(1.-smoothstep(0.,1.2,abs(dd-(1.4+1.2*sin(uTime*.8+vWP.x*.08)))))*step(0.,dd);
          float f2=(1.-smoothstep(0.,.8,abs(dd-(4.2+1.4*sin(uTime*.6+vWP.x*.05+2.)))))*step(0.,dd)*.55;
          float foam=clamp(f1+f2,0.,1.)*(.55+.45*spk);
          // destellos anime (diamond glints) en la cresta de las olas
          float glint=pow(max(0.,dot(reflect(-normalize(vViewPosition),normal),uSunV)),50.);
          float sparkle=step(0.82,glint)*spk*uSunK;
          diffuseColor.rgb=mix(wc,vec3(1.),foam*.88)+uSunC*sparkle*1.2;
          diffuseColor.a=mix(.55,.97,smoothstep(0.,16.,dd));"""

    if old_sea_frag in js:
        js = js.replace(old_sea_frag, new_sea_frag, 1)
        print("Hooked diamond glints and cel-shaded foam in sea shader.")

    with open('js/game.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Saved upgraded js/game.js.")

    # =========================================================================
    # 4. SYNC TO CalFight-App BUNDLE
    # =========================================================================
    dest_app = os.path.join('CalFight-App', 'resources', 'app')
    if os.path.exists(dest_app):
        print("Syncing upgraded files to CalFight-App bundle...")
        shutil.copy2('index.html', os.path.join(dest_app, 'index.html'))
        shutil.copy2('css/style.css', os.path.join(dest_app, 'css', 'style.css'))
        shutil.copy2('js/game.js', os.path.join(dest_app, 'js', 'game.js'))
        print("CalFight-App bundle successfully synchronized!")

if __name__ == '__main__':
    main()
