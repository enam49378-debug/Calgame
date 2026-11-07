/* Banco de pruebas de coreografías (solo localhost). Se carga dentro del juego con:
     __ev(await (await fetch('/tools/cap/harness.js')).text())
   y se usa:  await __H.run({ id:'javiParry', every:.1, views:['dir','side','opp','top'] })
   Hace lo siguiente, sin depender del reloj real (tiempo virtual, siempre 60 cuadros/s exactos):
     - monta la escena (atacante + víctima), la lanza por runChore y avanza cuadro a cuadro;
     - cada `every` segundos DE ESCENA guarda una foto por cada vista (cine = la cámara de la escena, y vistas fijas
       laterales / contraria / cenital / de contacto, que sirven para ver si los cuerpos se atraviesan o no se tocan);
     - guarda config/_frames/metrics.json con medidas por cuadro (distancias entre cuerpos, manos y lanza, puntas, alturas…).
   Después:  python tools/cap/sheet.py   arma las hojas de contacto (una por vista) y la tabla de medidas. */
(() => {
  const H = window.__H = window.__H || {};
  const realNow = H.realNow || performance.now.bind(performance), realRAF = H.realRAF || window.requestAnimationFrame.bind(window);
  H.realNow = realNow; H.realRAF = realRAF;
  let queue = new Set(), vnow = 0;
  H.install = () => { window.requestAnimationFrame = cb => { queue.add(cb); return 1; }; performance.now = () => vnow; queue.add(loop); };
  H.uninstall = () => { window.requestAnimationFrame = realRAF; performance.now = realNow; queue.clear(); realRAF(loop); };
  H.frame = () => { vnow += 1000 / 60; const q = [...queue]; queue.clear(); for (const cb of q) cb(vnow); };

  const mk = (x, y, z) => new V3(x, y, z);
  const segDist = (p, a, b) => { const ab = b.clone().sub(a), u = clamp(p.clone().sub(a).dot(ab) / Math.max(1e-6, ab.lengthSq()), 0, 1); return p.distanceTo(a.clone().addScaledVector(ab, u)); };
  const r = v => Math.round(v * 100) / 100;

  // ---- medidas de un cuadro (en ejes de la escena: x derecha, y altura, z adelante del atacante al empezar)
  H.measure = () => {
    const st = G.chore; if (!st) return null;
    const f = st.f, tg = st.tg; f.model.root.updateMatrixWorld(true); tg.model.root.updateMatrixWorld(true);
    const R = rightOf(st.yaw), F = fwd(st.yaw), O = st.origin;
    const loc = p => ({ x: r((p.x - O.x) * R.x + (p.z - O.z) * R.z), y: r(p.y - O.y), z: r((p.x - O.x) * F.x + (p.z - O.z) * F.z) });
    const out = { t: r(st.t), shot: st.shot, A: loc(f.pos), V: loc(tg.pos), ayaw: r(wrapA(f.yaw - st.yaw)), vyaw: r(wrapA(tg.yaw - st.yaw - Math.PI)) };
    const chA = poseChest(f), chV = poseChest(tg);
    out.chest = r(chA.distanceTo(chV)); out.flat = r(Math.hypot(chA.x - chV.x, chA.z - chV.z));
    if (f.spear && f.spearOut) {
      const tip = f.spear.localToWorld(mk(0, 0, 26 * PX)), tail = f.spear.localToWorld(mk(0, 0, -14 * PX));
      out.tip = loc(tip); out.tail = loc(tail);
      out.tipChest = r(tip.distanceTo(chV)); out.tipHead = r(tip.distanceTo(headPos(tg)));
      out.shaftChest = r(segDist(chV, tail, tip));
      const hl = tg.model.armL.localToWorld(mk(0, -10 * PX, 0)), hr = tg.model.armR.localToWorld(mk(0, -10 * PX, 0));
      out.vHandL = r(segDist(hl, tail, tip)); out.vHandR = r(segDist(hr, tail, tip));
    }
    out.vy = r(tg.pos.y - O.y); out.ay = r(f.pos.y - O.y);
    return out;
  };

  // ---- vistas fijas (ejes de la escena; no dependen del director de cámara)
  const VIEWS = {
    side: (st, A, V, mid) => ({ pos: mid.clone().addScaledVector(rightOf(st.yaw), 5.2).add(mk(0, .9, 0)), look: mid, fov: 36 }),
    opp: (st, A, V, mid) => ({ pos: mid.clone().addScaledVector(rightOf(st.yaw), -6.2).add(mk(0, 1.1, 0)), look: mid, fov: 40 }),
    front: (st, A, V, mid) => ({ pos: A.clone().addScaledVector(fwd(st.yaw), 4.0).add(mk(0, .5, 0)), look: A.clone().add(mk(0, .1, 0)), fov: 34 }),
    back: (st, A, V, mid) => ({ pos: A.clone().addScaledVector(fwd(st.yaw), -5.2).add(mk(0, 1.5, 0)), look: mid, fov: 44 }),
    top: (st, A, V, mid) => ({ pos: mid.clone().add(mk(0, 9.5, 0)), look: mid, fov: 40, up: fwd(st.yaw) }),
    contact: (st, A, V, mid) => ({ pos: mid.clone().addScaledVector(rightOf(st.yaw), 3.1).add(mk(0, .5, 0)), look: mid, fov: 32 }),
  };
  H.VIEWS = VIEWS;
  const canvasToJpeg = (w) => {
    const src = renderer.domElement, h = Math.round(src.height * w / src.width), c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0, w, h); try { g.drawImage($('lines'), 0, 0, w, h); } catch (e) { }
    return c.toDataURL('image/jpeg', .85);
  };
  const post = (name, body) => fetch('/save?p=config/_frames/' + name + '.json', { method: 'POST', body: JSON.stringify(body) });

  // Monta la escena con el atacante y una víctima y arranca la coreografía. Devuelve la duración.
  H.setup = (id, victim) => {
    const D = CHORE[id]; if (!D) throw new Error('no existe la coreografía ' + id);
    if (!G.viewer) openViewer();
    vLoad(id); G.viewer = null; VW.on = false;
    document.getElementById('viewer').classList.add('hidden'); document.getElementById('hud').classList.add('hidden');
    G.paused = false; G.over = false;
    CFG_CINE.off = false;
    if (!H.aura) { VW.att.awak = 0; VW.vic.awak = 0; }   // sin las columnas de luz del despertar (tapan las poses); H.aura = true para verlas
    runChore(VW.att, VW.vic, D);
    return D.dur;
  };

  // Laboratorio de poses: congela dos poses (atacante, víctima) y las fotografía desde varias vistas.
  //   await __H.lab({ A: POSE.thrust, V: 'block', vx:0, vy:0, vz:1.6, vyaw:0, ayaw:0, views:['side','back','top'] })
  // A y V pueden ser el nombre de una pose (string) o un objeto de canales. Se guardan con el prefijo `tag`.
  H.lab = async (o) => {
    const pose = p => typeof p === 'string' ? POSE[p] : p;
    const A = pose(o.A || 'idle'), V = pose(o.V || 'idle');
    CHORE.__lab = { dur: 2, catch: 2, att: [[0, A], [2, A]], vic: [[0, V], [2, V]], apos: [[0, 0, o.ay || 0, 0, o.ayaw || 0], [2, 0, o.ay || 0, 0, o.ayaw || 0]],
      vpos: [[0, o.vx || 0, o.vy || 0, o.vz == null ? 1.6 : o.vz, o.vyaw || 0], [2, o.vx || 0, o.vy || 0, o.vz == null ? 1.6 : o.vz, o.vyaw || 0]], ev: [], shots: [[0, 'two', {}]] };
    delete CHORE.__lab._shots;
    if (o.D) Object.assign(CHORE.__lab, o.D);
    return H.run({ id: '__lab', from: o.t || .6, to: (o.t || .6) + .001, every: 9, views: o.views || ['side', 'back', 'top'], w: o.w || 480, tag: o.tag || 'lab' });
  };
  // opciones: id, every (s de escena entre fotos), views (['dir','side',...]), from, to, w (ancho jpg), tag (prefijo)
  H.run = async (o) => {
    const every = o.every || .1, views = o.views || ['dir'], from = o.from || 0, to = o.to || 1e9, w = o.w || 640, tag = o.tag || '';
    H.install();
    const dur = H.setup(o.id);
    for (let i = 0; i < 4; i++) H.frame();   // arranque (el visor tarda un par de cuadros)
    // el chore ya está corriendo; si no, no hay nada que ver
    const metrics = []; let next = from, guard = 0, saved = 0; H.shots = [];
    while (G.chore && G.chore.t < dur + .2 && G.chore.t <= to && guard++ < 6000) {
      const st = G.chore;
      const m = H.measure(); if (m && (!metrics.length || metrics[metrics.length - 1].t !== m.t)) metrics.push(m);
      if (st.t >= next - 1e-6) {
        next += every;
        const label = tag + String(Math.round(st.t * 1000)).padStart(5, '0');
        for (const v of views) {
          let b64;
          if (v === 'dir') { b64 = canvasToJpeg(w); }
          else {
            const A = poseChest(st.f), V = poseChest(st.tg), mid = A.clone().lerp(V, .5), cfg = VIEWS[v](st, A, V, mid);
            const p0 = camera.position.clone(), q0 = camera.quaternion.clone(), f0 = camera.fov, u0 = camera.up.clone();
            camera.position.copy(cfg.pos); camera.up.copy(cfg.up || mk(0, 1, 0)); camera.lookAt(cfg.look); camera.fov = cfg.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
            drawFrameSafely(); b64 = canvasToJpeg(w);
            camera.position.copy(p0); camera.quaternion.copy(q0); camera.fov = f0; camera.up.copy(u0); camera.updateProjectionMatrix();
          }
          await post(v + '_' + label, { t: r(st.t), v, d: b64 }); saved++;
        }
      }
      H.frame();
    }
    await post('metrics', { id: o.id, dur, rows: metrics });
    H.uninstall();
    return { saved, rows: metrics.length, dur };
  };
  // Prueba de una acción normal de juego (no una coreografía): H.act({ id:'javiParry', go:"MOVES.javiParry(VW.att, Object.assign({}, AWK.javi[0].o, {color:'#4fc3f7'}))", from:0, to:1.6, every:.2, views:['dir','front','side'] })
  H.act = async (o) => {
    const every = o.every || .2, from = o.from || 0, to = o.to || 1.6, views = o.views || ['dir', 'front', 'side'], w = o.w || 420;
    H.install(); if (!G.viewer && G.state !== 'play') openViewer(); vLoad(o.id || 'javiParry'); G.viewer = null; VW.on = false;
    document.getElementById('viewer').classList.add('hidden'); document.getElementById('hud').classList.add('hidden');
    G.paused = false; G.over = false; CFG_CINE.off = !!o.nocine; if (!H.aura) { VW.att.awak = 0; VW.vic.awak = 0; }
    VW.vic.pos.set(0, 0, o.vz || 6); VW.vic.model.root.position.copy(VW.vic.pos);
    for (let i = 0; i < 4; i++) H.frame();
    if (o.dev) H.dev(true);
    __ev(o.go);
    let t = 0, next = from, saved = 0; const pend = [];   // las fotos se guardan al final: esperar (await) en medio dejaría correr el reloj real del juego
    while (t <= to) {
      if (t >= next - 1e-6) {
        next += every; const label = (o.tag || 'act') + String(Math.round(t * 1000)).padStart(5, '0');
        for (const v of views) {
          if (v === 'dir') { pend.push([v + '_' + label, { t: r(t), v, d: canvasToJpeg(w) }]); saved++; continue; }
          const f = VW.att, st = { yaw: f.yaw }, A = poseChest(f), V = poseChest(VW.vic), mid = A.clone(), cfg = VIEWS[v](st, A, V, mid);
          const p0 = camera.position.clone(), q0 = camera.quaternion.clone(), f0 = camera.fov, u0 = camera.up.clone();
          camera.position.copy(cfg.pos); camera.up.copy(cfg.up || mk(0, 1, 0)); camera.lookAt(cfg.look); camera.fov = cfg.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
          drawFrameSafely(); pend.push([v + '_' + label, { t: r(t), v, d: canvasToJpeg(w) }]); saved++;
          camera.position.copy(p0); camera.quaternion.copy(q0); camera.fov = f0; camera.up.copy(u0); camera.updateProjectionMatrix();
        }
      }
      for (const ev of o.events || []) if (!ev.done && t >= ev[0]) { ev.done = true; __ev(ev[1]); }   // o.events: [[segundos, 'código']] (p. ej. el golpe que activa el parry)
      H.frame(); t += 1 / 60;
    }
    for (const [n, b] of pend) await post(n, b);
    H.uninstall(); return { saved, chore: !!G.chore, act: VW.att.action && VW.att.action.name };
  };
  // Mapa de desarrollo: esconde la ciudad (edificios, bancas, árboles…) y deja un piso plano con cuadrícula (1 casilla = 1 m) para revisar animaciones sin que nada estorbe.
  //   __H.dev(true) antes de H.act/H.run · __H.dev(false) al terminar
  H.dev = (on) => {
    if (on && !H._dev) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.fillStyle = '#7d8a96'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#e8eef4'; g.lineWidth = 3; g.strokeRect(0, 0, 128, 128);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 128); g.moveTo(0, 64); g.lineTo(128, 64); g.stroke();
      const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(60, 60);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: tx })); fl.rotation.x = -Math.PI / 2; fl.position.set(VW.att.pos.x, 0.0, VW.att.pos.z);
      fl.userData.devKeep = true; scene.add(fl);
      H._dev = { floor: fl, bg: scene.background, fog: scene.fog, render: renderer.render };
      const orig = renderer.render.bind(renderer);
      renderer.render = function (sc, cam) {
        if (sc !== scene) return orig(sc, cam);
        const keep = new Set([VW.att.model.root, VW.vic.model.root]), hid = [];
        for (const o of scene.children) if (!keep.has(o) && !o.isLight && !o.userData.devKeep && o.visible) { o.visible = false; hid.push(o); }
        const b0 = scene.background, f0 = scene.fog ? scene.fog.far : 0; scene.background = new THREE.Color(0xb9c6d2); if (scene.fog) scene.fog.far = 1e5;
        try { orig(sc, cam); } finally { scene.background = b0; if (scene.fog) scene.fog.far = f0; for (const o of hid) o.visible = true; }
      };
      renderer.render.__dev = true;
    } else if (!on && H._dev) {
      renderer.render = H._dev.render; scene.remove(H._dev.floor); H._dev = null;
    }
    return !!H._dev;
  };
  // Atajo: una sola foto de un instante, desde varias vistas
  H.at = (id, t, views, w) => H.run({ id, from: t, to: t + .001, every: 9, views: views || ['dir', 'side', 'top', 'contact'], w: w || 640, tag: 'p' });
  return 'harness listo';
})();
