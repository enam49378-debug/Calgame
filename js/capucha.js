/* ===== CAPUCHA DE JAVICUBITO =====
   Accesorio con física: cuando no llueve cuelga doblada detrás de la cabeza y se balancea con lo que hace (corre, salta, frena, cae, gira);
   cuando empieza a llover Javi se la pone (levanta el brazo, la capucha se voltea sobre la cabeza con un pequeño rebote) y, al parar la lluvia, se le cae hacia atrás.
   Modelo y textura: personajes/javi/Accesorios/capucha/ (datos ya convertidos en capucha.js). Solo se ve con la vista privada (CF_BETA).
   Este archivo se ejecuta dentro de game.js: usa sus funciones directamente (WX, PX, TOON_GRAD, ...). */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const D = window.CF_CAPUCHA_DATA; if (!D) return;
    const visible = () => !!(window.CF_BETA && window.CF_BETA.on);
    let TEX = null;
    function texture() {
      if (TEX) return TEX;
      const img = new Image(); TEX = new THREE.Texture(img); img.onload = () => { TEX.needsUpdate = true; }; img.src = D.tex;
      TEX.magFilter = TEX.minFilter = THREE.NearestFilter; TEX.generateMipmaps = false; return TEX;
    }
    // BBS: coordenadas en píxeles, UV en píxeles (v hacia abajo). El modelo BBS mira a -Z y CalFight a +Z: se gira media vuelta.
    function geo(d, cy) {
      const P = new Float32Array(d.v.length), U = new Float32Array(d.uv.length);
      for (let i = 0; i < P.length; i++) P[i] = (d.v[i] - (i % 3 === 1 ? cy : 0)) * PX;
      for (let i = 0; i < U.length; i += 2) { U[i] = d.uv[i] / 64; U[i + 1] = 1 - d.uv[i + 1] / 64; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
      g.computeVertexNormals(); g.rotateY(Math.PI); return g;
    }
    // poses (en píxeles, en el espacio de la cabeza: y hacia arriba, +z hacia el frente)
    const ON = { y: 4.6, z: -.3, rx: 0, sx: .9, sy: .867, sz: 1.22 };   // ajustada a la cabeza de Javi (capa exterior de 10 px): 10,8 de ancho, 10,4 de alto y 11 de fondo
    const OFF = { y: 2.4, z: -7.2, rx: -Math.PI / 2, sx: .9, sy: .5, sz: .5 };   // doblada detrás del cuello
    const lerp = (a, b, k) => a + (b - a) * k;

    function make(f, m) {
      const mat = fighterToonMaterial(texture(), 'cutout', THREE.DoubleSide, { spec: .3 });   // el mismo material que el cuerpo: mismos colores, luz y brillo que la chaqueta
      const olm = OUTLINE_MAT.clone(); olm.map = texture(); olm.alphaTest = .5; olm.needsUpdate = true;   // contorno que respeta los huecos de la capucha (si no, se veía negro por la abertura)
      const topGeo = geo(D.top, 4), bandGeo = geo(D.band, 4);
      const pivot = new THREE.Group(), top = new THREE.Mesh(topGeo, mat); top.castShadow = true; pivot.add(top);
      const ol = new THREE.Mesh(addOutlineOffset(topGeo.clone(), .36 * PX), olm); top.add(ol);   // contorno como el resto del cuerpo
      m.head.add(pivot);
      const bp = new THREE.Group(), band = new THREE.Mesh(bandGeo, mat); band.castShadow = true; bp.add(band);
      band.add(new THREE.Mesh(addOutlineOffset(bandGeo.clone(), .3 * PX), olm));
      bp.position.set(0, 11.2 * PX, -3.3 * PX); bp.scale.set(.9, 1, .25); m.torso.add(bp);   // cuello de la capucha sobre los hombros (por detrás)
      m.mats.push(mat);
      return { model: m, pivot, top, band, bp, mat, u: 0, uv: 0, rx: 0, rxv: 0, rz: 0, rzv: 0, by: 0, byv: 0, bandA: 0, pv: new V3(), pvy: 0, rain: 0, put: 0, init: false, want: 0, hold: 0 };
    }
    function drop(C) { if (!C) return; try { C.pivot.parent && C.pivot.parent.remove(C.pivot); C.bp.parent && C.bp.parent.remove(C.bp); } catch (e) { } }

    function update(f, m, dt, T) {
      if (!f.ch || f.ch.id !== 'javi' || !m || !m.head || !m.torso) return;
      let C = f.cap;
      if (C && C.model !== m) { drop(C); C = f.cap = null; }   // el modelo cambió (morph)
      const show = visible();
      if (!show) { if (C) { C.pivot.visible = false; C.bp.visible = false; } return; }
      if (!C) C = f.cap = make(f, m);
      C.pivot.visible = C.bp.visible = f.alive !== false && !f.cineHide;
      // ---- ¿llueve? (con histéresis: se la pone enseguida y se la quita un rato después)
      const rain = typeof f.capForce === 'number' ? f.capForce : WX.rain, wet = !f.abyss && !f.swim;
      if (wet && rain > .16) { C.hold = 2.5; C.want = 1; } else { C.hold -= dt; if (C.hold <= 0 || !wet) C.want = 0; }
      if (!C.init) { C.init = true; C.u = C.want; C.uv = 0; C.pv.copy(f.vel); }
      if (dt <= 0) return;
      if (C.want > .5 && C.u < .4 && C.put <= 0 && C.uv > -1) { if (!C.putDone) { C.put = .6; C.putDone = true; } }
      if (C.want < .5) C.putDone = false;
      // ---- resorte de abrir/cerrar: rebota un poco al pasar de un estado al otro
      C.uv += ((C.want - C.u) * 150 - C.uv * 24) * dt; C.u = clamp(C.u + C.uv * dt, 0, 1);   // sin rebote de tamaño: la capucha nunca se hace más grande que su modelo
      if (typeof f.capU === 'number') { C.u = f.capU; C.uv = 0; }   // (solo para revisar poses)
      // ---- física: aceleración del cuerpo en su propio marco (adelante / lado / arriba)
      // el cambio de velocidad (lo que "sentiría" la tela) empuja la capucha en sentido contrario: se queda atrás al arrancar, se adelanta al frenar, rebota al caer
      const dx = f.vel.x - C.pv.x, dy = f.vel.y - C.pv.y, dz = f.vel.z - C.pv.z; C.pv.copy(f.vel);
      const F = fwd(f.yaw), Rv = rightOf(f.yaw), dF = clamp(dx * F.x + dz * F.z, -22, 22), dR = clamp(dx * Rv.x + dz * Rv.z, -22, 22), dU = clamp(dy, -26, 26);
      const sp = Math.hypot(f.vel.x, f.vel.z), loose = 1 - .78 * clamp(C.u, 0, 1);   // puesta sobre la cabeza se mueve poco
      const dyaw = clamp(wrapA(f.yaw - (C.pyaw == null ? f.yaw : C.pyaw)), -.6, .6); C.pyaw = f.yaw;
      C.rxv += (-.3 * dF - .04 * Math.abs(dU)) * loose; C.rzv += (-.3 * dR + 5 * dyaw) * loose; C.byv += -.9 * dU * loose;
      const n = Math.max(1, Math.ceil(dt / .008)), h = dt / n;
      for (let i = 0; i < n; i++) {   // resortes amortiguados (rebotan un par de veces)
        C.rxv += (-90 * C.rx - 6 * C.rxv) * h; C.rx = clamp(C.rx + C.rxv * h, -.95, .95);
        C.rzv += (-90 * C.rz - 6 * C.rzv) * h; C.rz = clamp(C.rz + C.rzv * h, -.95, .95);
        C.byv += (-150 * C.by - 8 * C.byv) * h; C.by = clamp(C.by + C.byv * h, -2.4, 2.4);
      }
      const flutter = (Math.sin(T * 17 + 1) + Math.sin(T * 11.3)) * .5 * clamp(sp / 9, 0, 1) * .07 * loose;   // aletea al correr
      const lift = clamp(sp * .022, 0, .26) * loose;   // el viento la levanta
      const u = C.u, arc = Math.sin(Math.PI * u);   // al subir da un arco: sube y pasa por encima de la cabeza
      C.pivot.position.set(0, (lerp(OFF.y, ON.y, u) + arc * 3.5) * PX + C.by * PX * .5 * loose, (lerp(OFF.z, ON.z, u) + arc * 1.2) * PX);
      C.pivot.rotation.set(lerp(OFF.rx, ON.rx, u) + (C.rx + lift + flutter) * (1 - .85 * u), 0, C.rz * (1 - .7 * u));
      C.pivot.scale.set(lerp(OFF.sx, ON.sx, u), lerp(OFF.sy, ON.sy, u), lerp(OFF.sz, ON.sz, u));
      // cuello: sigue a la capucha con retraso
      C.bandA += ((C.rx * 1.3 + lift + flutter * 1.5) - C.bandA) * Math.min(1, dt * 12);
      C.bp.rotation.set(C.bandA * .8 + C.by * .05, 0, C.rz * .6); C.bp.visible = C.pivot.visible;
      // ---- gesto de ponérsela: levanta el brazo derecho hacia la cabeza (solo si está libre)
      if (C.put > 0) {
        C.put -= dt; const k = Math.sin(Math.PI * clamp(1 - C.put / .6, 0, 1));
        if (!f.action && f.alive && f.ragdoll <= 0 && !(f.stun > 0) && m.armR) { m.armR.rotation.x = -2.35 * k; m.armR.rotation.z = .35 * k; }
      }
    }
    A.CAPUCHA = { update, force(f, v) { f.capForce = v; } };
  }
});
