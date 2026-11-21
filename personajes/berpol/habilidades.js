/* ===== personajes/berpol/habilidades.js =====
   Habilidades de Berpol (garabatos). Los números están en personaje.js.
   Todo se dibuja primero con trazos de tinta (se ve cómo se va trazando) y después el dibujo cobra vida:
     berScribble  zigzag que queda como trampa de tinta        berRocket   cohete dibujado que se guía solo
     berPaper     círculo -> bola de papel que rebota 3 veces   berPond     charco de tinta que ralentiza
     berEraser    recuadro borrado por una goma gigante         berTornado  espiral que atrae
     berStick     muñeco de palitos que corre y explota          berPage     hoja gigante que aplasta
     berUlt       Obra Maestra: monstruo gigante dibujado
   Multijugador: los trazos y efectos se repiten en los demás navegadores; el daño lo calcula quien lanza la habilidad. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const INK = '#1b1b2f', COLS = ['#ff7ac8', '#6aa7ff', '#ffd54f', '#7dff9a', '#ff8a5a'];
    const PP = (b, x) => Object.assign({}, POSE[b], x);
    const bx = (w, h, d, col, op) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: col, transparent: op != null, opacity: op != null ? op : 1 }));
    const free = g => g.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
    function loop(f, maxT, fn, onEnd) {
      let t = 0, done = false, untrack = () => { };
      const stop = () => { if (done) return; done = true; untrack(); if (onEnd) onEnd(); };
      untrack = trackSkillObj(f, maxT + 1, stop);
      const nd = ndt(), tick = () => {
        if (done) return; const dt = nd(); t += dt; let r = false;
        try { r = fn(dt, t); } catch (e) { console.error(e); r = true; }
        if (r || t >= maxT || G.state !== 'play') stop(); else later(0, tick);
      };
      tick(); return stop;
    }
    const foes = (f, c, r) => enemiesOf(f).filter(g => g.alive && Math.hypot(g.pos.x - c.x, g.pos.z - c.z) < r);
    const gp = (x, z) => new V3(x, groundAt(x, z), z);
    const nearest = (f, range) => { let b = null, bd = range; for (const g of enemiesOf(f)) { if (!g.alive) continue; const d = dist2d(f, g); if (d < bd) { bd = d; b = g; } } return b; };
    const segDist = (p, a, b) => { const abx = b.x - a.x, abz = b.z - a.z, l2 = abx * abx + abz * abz || 1, t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / l2)); return Math.hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t)); };
    // trazo de tinta: lista de puntos -> segmentos que se van revelando con reveal(0..1)
    function stroke(pts, col, w) {
      const g = new THREE.Group(), segs = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], m = bx(w, w, a.distanceTo(b) + w * .6, i % 3 === 1 ? col : INK);
        m.position.copy(a).add(b).multiplyScalar(.5); m.lookAt(b); m.visible = false; g.add(m); segs.push(m);
      }
      scene.add(g);
      return { g, segs, reveal(k) { const n = Math.floor(k * segs.length + .001); for (let i = 0; i < segs.length; i++) segs[i].visible = i < n; }, dispose() { scene.remove(g); free(g); } };
    }
    const circlePts = (c, r, n, y) => { const o = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; o.push(new V3(c.x + Math.cos(a) * r, y, c.z + Math.sin(a) * r)); } return o; };
    // poses de dibujar: el brazo traza en el aire
    const DRAW = [[0, 'windup', 800], [.12, 'palm', 900], [.3, 'throw', 900], [.5, 'palm', 900]];
    const splat = (c, col, r) => { for (let i = 0; i < 3; i++) later(i * .05, () => ringAt(c, i ? '#ffffff' : col, r * (.6 + i * .5), .4)); burst(new V3(c.x, c.y + 1, c.z), 26, col, 9, .22, .6, .3); burst(new V3(c.x, c.y + 1, c.z), 12, INK, 7, .26, .6, .2); };
    const star = (c, f) => {   // estallido dibujado: radios de tinta que salen del centro
      const g = new THREE.Group(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, m = bx(.16, .16, 3 + (i % 2) * 2, i % 2 ? COLS[i % 5] : INK); m.position.set(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6); m.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); g.add(m); }
      g.position.set(c.x, c.y + 1, c.z); scene.add(g); let k = 0; loop(f, .7, dt => { k += dt; g.scale.setScalar(1 + k * 2.2); g.children.forEach(m => m.material.opacity = 1); g.visible = k < .55; return false; }, () => { scene.remove(g); free(g); });
    };
    // objeto de tinta que persiste: devuelve al final
    const pencil = () => { };

    // ---------- el lápiz ----------
    WEAPONS.pencil = function buildPencil() {
      const vox = [], P = (y, z, c) => vox.push([y, z, c]);
      for (let z = -4; z <= 11; z++) for (let y = -1; y <= 1; y++) { const edge = Math.abs(y) === 1; P(y, z, z % 4 === 0 ? '#e0a31a' : (edge ? '#ffd23a' : '#ffe066')); }
      for (let y = -1; y <= 1; y++) { P(y, -5, '#cfd3d9'); P(y, -6, '#ff8fb0'); P(y, -7, '#ff6f9a'); }
      for (let y = -1; y <= 1; y++) for (let z = 12; z <= 13; z++) P(y, z, '#e9c9a1');
      P(0, 14, '#e9c9a1'); P(0, 15, '#2b2b33'); P(0, 16, '#2b2b33');
      return buildVoxelWeapon(vox, 1);
    };

    // ---------- 1. Garabato Rayado ----------
    MOVES.berScribble = function (f, o) {
      const F = fwd(f.yaw), R = rightOf(f.yaw), base = front(f, 1.4, 0), N = 11, pts = [], pg = [];
      for (let i = 0; i < N; i++) { const d = 1 + i * ((o.len || 13) - 1) / (N - 1), s = i === 0 ? 0 : (i % 2 ? 2.4 : -2.4), x = base.x + F.x * d + R.x * s, z = base.z + F.z * d + R.z * s, p = gp(x, z); pg.push(p); pts.push(new V3(x, p.y + .5, z)); }
      const st = stroke(pts, '#ff7ac8', .34);
      startAction(f, { name: 'berScribble', dur: 1.0, aim: true, noControl: true, speedMul: 0, anim: DRAW });
      popText(chestOf(f), 'GARABATO', '#ff7ac8', 22); sfx('whoosh', f.pos, .5);
      let hurt = new Map(), next = 0;
      loop(f, 5.4, (dt, t) => {
        st.reveal(Math.min(1, t / .8));
        if (t < .8) { const k = Math.min(.999, t / .8) * (N - 1), i = Math.floor(k), p = pts[i]; emit(p.x, p.y, p.z, rand(-1, 1), rand(1, 3), rand(-1, 1), COLS[i % 5], .16, .35, 0, 2); return false; }
        if (t > 4.7) { st.g.scale.y = Math.max(.01, 1 - (t - 4.7) / .6); return false; }   // al final se borra
        if (t > next) { next = t + .25; const c = pts[(Math.random() * N) | 0]; emit(c.x, c.y, c.z, 0, -3, 0, INK, .14, .5, 0, 1); }
        for (const g of foes(f, f.pos, 40)) {
          let hit = false; for (let i = 0; i < N - 1 && !hit; i++) if (segDist(g.pos, pts[i], pts[i + 1]) < 1.2) hit = true;
          if (hit && (hurt.get(g) || 0) < t) { hurt.set(g, t + .6); applyHit(f, g, { dmg: o.dmg || 4, stun: .15, kb: 0, color: '#ff7ac8', hitstop: 0 }); g.buf = Math.max(g.buf || 0, .9); popText(chestOf(g), 'ENREDADO', '#ff7ac8', 15); burst(chestOf(g), 10, INK, 5, .14, .4, 0); }
        }
        return false;
      }, () => st.dispose());
    };

    // ---------- 2. Bola de Papel ----------
    MOVES.berPaper = function (f, o) {
      const F = fwd(f.yaw), c0 = front(f, 1.6, 1.8), tg = nearest(f, 26), ring = stroke(circlePts(c0, 1.1, 14, c0.y), '#6aa7ff', .24);
      const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.8, 0), new THREE.MeshBasicMaterial({ color: '#ffffff' })); ball.position.copy(c0); ball.visible = false; scene.add(ball);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(ball.geometry), new THREE.LineBasicMaterial({ color: INK })); ball.add(edges);
      startAction(f, { name: 'berPaper', dur: 1.2, aim: true, noControl: true, speedMul: 0, anim: [[0, 'windup', 800], [.1, 'palm', 900], [.4, 'throwW', 900], [.62, 'throw', 1200]] });
      popText(chestOf(f), 'BOLA DE PAPEL', '#6aa7ff', 20);
      const pos = c0.clone(), vel = new V3(); let phase = 0, bounces = 0;
      loop(f, 5, (dt, t) => {
        if (phase === 0) {
          ring.reveal(Math.min(1, t / .45));
          if (t > .45) { ring.g.visible = false; ball.visible = true; ball.scale.setScalar(Math.max(.1, 1.4 - (t - .45) * 5)); if (t > .75) { phase = 1; ball.scale.setScalar(1); const to = tg ? chestOf(tg) : new V3(f.pos.x + F.x * 12, f.pos.y, f.pos.z + F.z * 12), dx = to.x - pos.x, dz = to.z - pos.z, d = Math.hypot(dx, dz) || 1, sp = Math.min(16, Math.max(8, d * 1.2)); vel.set(dx / d * sp, 8, dz / d * sp); sfx('whoosh', pos, .7); } }
          return false;
        }
        vel.y -= 28 * dt; pos.addScaledVector(vel, dt); ball.position.copy(pos); ball.rotation.x += dt * 9; ball.rotation.z += dt * 6;
        emit(pos.x, pos.y, pos.z, rand(-.5, .5), rand(-.5, .5), rand(-.5, .5), '#ffffff', .16, .3, 0, 1);
        const gy = groundAt(pos.x, pos.z) + .6;
        let direct = false; for (const g of foes(f, pos, 1.6)) if (Math.abs(chestOf(g).y - pos.y) < 1.8) direct = true;
        if (pos.y < gy || (direct && bounces < 3)) {
          pos.y = gy; bounces++; const last = bounces >= 3, p = gp(pos.x, pos.z);
          if (last) { explode(f, new V3(p.x, p.y + .8, p.z), 4, { dmg: (o.dmg || 4) * 1.8, stun: .8, kb: 9, up: 9, ragdoll: .8, color: '#6aa7ff', hitstop: .08, shake: .4 }); splat(p, '#6aa7ff', 5); star(p, f); sfx('boom', p, .6); popText(new V3(p.x, p.y + 2.4, p.z), 'ABIERTA', '#6aa7ff', 22); return true; }   // la bola se abre en garabatos
          explode(f, new V3(p.x, p.y + .6, p.z), 2.1, { dmg: o.dmg || 4, kb: 5, up: 7, color: '#6aa7ff', hitstop: 0 }); splat(p, COLS[bounces], 2.6); sfx('hit', p, .5);
          vel.y = Math.max(8 - bounces * 2, 4) + 3; vel.x *= .85; vel.z *= .85;
        }
        return false;
      }, () => { ring.dispose(); scene.remove(ball); free(ball); });
    };

    // ---------- 3. Goma de Borrar ----------
    MOVES.berEraser = function (f, o) {
      const F = fwd(f.yaw), R = rightOf(f.yaw), c = front(f, 4.2, 0), HW = 3.4, HD = 2.8;
      const corner = (a, b) => { const p = gp(c.x + R.x * a + F.x * b, c.z + R.z * a + F.z * b); return new V3(p.x, p.y + .4, p.z); };
      const pts = [corner(-HW, -HD), corner(HW, -HD), corner(HW, HD), corner(-HW, HD), corner(-HW, -HD)], dense = [];
      for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) dense.push(pts[i].clone().lerp(pts[i + 1], k / 6)); dense.push(pts[4]);
      const st = stroke(dense, '#ff5a8a', .3), er = new THREE.Group(); er.add(bx(1.5, 1.2, HD * 2 + .8, '#ff9ec0')); const cap = bx(1.55, .5, HD * 2 + .9, '#4a6fd0'); cap.position.y = .85; er.add(cap); er.visible = false; scene.add(er);
      startAction(f, { name: 'berEraser', dur: 1.15, aim: true, noControl: true, speedMul: 0, anim: [[0, 'windup', 800], [.15, 'palm', 900], [.5, 'scepterW', 900], [.62, 'scepterSmash', 1400]] });
      popText(chestOf(f), 'GOMA', '#ff9ec0', 22); sfx('whoosh', f.pos, .6);
      const hit = new Set(); let swipe = -1, cleaned = 0;
      const inside = p => { const dx = p.x - c.x, dz = p.z - c.z, a = dx * R.x + dz * R.z, b = dx * F.x + dz * F.z; return { a, b, ok: Math.abs(a) < HW + .6 && Math.abs(b) < HD + .6 }; };
      loop(f, 2.6, (dt, t) => {
        st.reveal(Math.min(1, t / .45)); if (t < .6) return false;
        if (swipe < 0) swipe = 0; swipe += dt / .42; const a = -HW + 2 * HW * Math.min(1, swipe); er.visible = swipe < 1.1;
        const ep = gp(c.x + R.x * a, c.z + R.z * a); er.position.set(ep.x, ep.y + .7, ep.z); er.rotation.y = Math.atan2(F.x, F.z) + Math.PI / 2;
        for (let i = 0; i < st.segs.length; i++) if (i / st.segs.length < (swipe) * 1.0 && (swipe < 1.1)) { const sp = st.segs[i].position, s = inside(sp); if (s.a < a - .2) st.segs[i].visible = false; }   // la goma va borrando el recuadro
        for (const g of foes(f, c, 9)) { const s = inside(g.pos); if (s.ok && Math.abs(s.a - a) < 1.4 && !hit.has(g)) { hit.add(g); applyHit(f, g, { dmg: o.dmg || 9, stun: .4, kb: 14, up: 5, dir: new V3(R.x, 0, R.z), guardBreak: true, color: '#ff9ec0', hitstop: .08, shake: .35 }); popText(chestOf(g), 'BORRADO', '#ff9ec0', 18); burst(chestOf(g), 16, '#ffffff', 8, .2, .5, 0); } }
        for (let i = PROJ.length - 1; i >= 0; i--) { const p = PROJ[i]; if (p.owner === f) continue; const s = inside(p.pos); if (s.ok && s.a < a + 1) { burst(p.pos, 12, '#ffffff', 6, .16, .4, 0); scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); PROJ.splice(i, 1); cleaned++; } }   // borra los proyectiles rivales que estén dentro
        emit(ep.x + rand(-.6, .6), ep.y + .8, ep.z + rand(-HD, HD), rand(-1, 1), rand(1, 3), rand(-1, 1), '#ffffff', .18, .4, 0, 2);
        return swipe > 1.3;
      }, () => { st.dispose(); scene.remove(er); free(er); });
    };

    // ---------- 4. Muñeco de Palitos ----------
    function stickFigure(col) {
      const g = new THREE.Group(), head = new THREE.Mesh(new THREE.TorusGeometry(.32, .06, 6, 14), new THREE.MeshBasicMaterial({ color: INK })); head.position.y = 1.7; g.add(head);
      const body = bx(.1, .9, .1, INK); body.position.y = 1.0; g.add(body);
      const limb = (x, y, len) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = bx(.09, len, .09, col || INK); m.position.y = -len / 2; p.add(m); g.add(p); return p; };
      g.arms = [limb(-.05, 1.35, .75), limb(.05, 1.35, .75)]; g.legs = [limb(-.05, .55, .85), limb(.05, .55, .85)]; return g;
    }
    MOVES.berStick = function (f, o) {
      const F = fwd(f.yaw), tg = nearest(f, 30), fig = stickFigure('#ff7ac8'), s0 = front(f, 2, 0), p = gp(s0.x, s0.z);
      fig.scale.setScalar(.01); fig.position.copy(p); fig.rotation.y = f.yaw; scene.add(fig);
      startAction(f, { name: 'berStick', dur: .9, aim: true, noControl: true, speedMul: 0, anim: DRAW });
      popText(chestOf(f), 'MUÑECO', '#ff7ac8', 22); sfx('whoosh', f.pos, .5);
      let dir = F.clone(), boom = false;
      loop(f, 4.2, (dt, t) => {
        fig.scale.setScalar(Math.min(1.6, Math.max(.01, t * 4 - 0)));
        if (t < .5) return false;
        const e = tg && tg.alive ? tg : nearest({ pos: fig.position, team: f.team, isPlayer: f.isPlayer, id: f.id }, 30);
        if (tg && tg.alive) { dir.set(tg.pos.x - fig.position.x, 0, tg.pos.z - fig.position.z).normalize(); }
        fig.rotation.y = angLerp(fig.rotation.y, Math.atan2(dir.x, dir.z), .3);
        const sp = 9 + t * 1.5; fig.position.x += dir.x * sp * dt; fig.position.z += dir.z * sp * dt; fig.position.y = groundAt(fig.position.x, fig.position.z) + Math.abs(Math.sin(t * 16)) * .25;
        const s = Math.sin(t * 18) * .9; fig.arms[0].rotation.x = s; fig.arms[1].rotation.x = -s; fig.legs[0].rotation.x = -s; fig.legs[1].rotation.x = s;
        fig.children.forEach(m => { m.rotation.z = (m === fig.arms[0] || m === fig.arms[1] || m === fig.legs[0] || m === fig.legs[1]) ? m.rotation.z : Math.sin(t * 25 + m.id) * .04; });   // tiembla como un garabato
        emit(fig.position.x, fig.position.y + 1, fig.position.z, rand(-1, 1), rand(0, 2), rand(-1, 1), INK, .12, .3, 0, 1);
        if (foes(f, fig.position, 1.9).length || t > 3.8) {
          const c = fig.position.clone(); c.y = groundAt(c.x, c.z);
          explode(f, new V3(c.x, c.y + 1, c.z), 3.4, { dmg: o.dmg || 10, stun: .6, kb: 10, up: 9, ragdoll: .8, color: '#ff7ac8', hitstop: .08, shake: .4 }); splat(c, '#ff7ac8', 5); star(c, f); sfx('boom', c, .7); popText(new V3(c.x, c.y + 2.6, c.z), '¡PUM!', '#ff7ac8', 24);
          return true;
        }
        return false;
      }, () => { scene.remove(fig); free(fig); });
    };

    // ---------- Despierto: Cohete de Lápiz ----------
    MOVES.berRocket = function (f, o) {
      const F = fwd(f.yaw), c = front(f, 2.5, 0), base = gp(c.x, c.z), tg = nearest(f, 32), pts = [];
      const prof = [[0, 3.4], [.55, 2.6], [.75, 1.6], [.75, -.1], [.55, -.9], [0, -.9], [-.55, -.9], [-.75, -.1], [-.75, 1.6], [-.55, 2.6], [0, 3.4]], R = rightOf(f.yaw);
      for (const [x, y] of prof) pts.push(new V3(base.x + R.x * x, base.y + .3 + y * .9, base.z + R.z * x));   // contorno del cohete dibujado de pie
      const st = stroke(pts, '#ffd54f', .22), rk = new THREE.Group(); const body = bx(.9, 2.6, .9, '#ffffff'); rk.add(body); const nose = new THREE.Mesh(new THREE.ConeGeometry(.65, 1.2, 4), new THREE.MeshBasicMaterial({ color: '#ff5a5a' })); nose.position.y = 1.9; rk.add(nose);
      const fin = bx(1.8, .5, .2, '#6aa7ff'); fin.position.y = -1; rk.add(fin); const fin2 = bx(.2, .5, 1.8, '#6aa7ff'); fin2.position.y = -1; rk.add(fin2); rk.visible = false; scene.add(rk);
      startAction(f, { name: 'berRocket', dur: 1.3, aim: true, noControl: true, speedMul: 0, anim: DRAW });
      popText(chestOf(f), 'COHETE', '#ffd54f', 22); sfx('whoosh', f.pos, .5);
      const pos = new V3(base.x, base.y + 2, base.z), vel = new V3(); let phase = 0, boom = false;
      loop(f, 5.5, (dt, t) => {
        if (phase === 0) { st.reveal(Math.min(1, t / .8)); if (t > 1.0) { phase = 1; st.g.visible = false; rk.visible = true; vel.set(0, 16, 0); sfx('fire', pos, .7); } rk.position.copy(pos); return false; }
        const e = tg && tg.alive ? chestOf(tg) : null;
        if (e) { const d = e.clone().sub(pos).normalize().multiplyScalar(26); vel.lerp(d, Math.min(1, (pos.y > 8 || vel.y < 8 ? 3.5 : 1) * dt * 2.2)); } else vel.y -= 12 * dt;
        pos.addScaledVector(vel, dt); rk.position.copy(pos); rk.lookAt(pos.clone().add(vel)); rk.rotateX(Math.PI / 2);
        emit(pos.x - vel.x * .03, pos.y - vel.y * .03, pos.z - vel.z * .03, rand(-1, 1), rand(-1, 1), rand(-1, 1), Math.random() < .5 ? '#ffd54f' : INK, .24, .4, 0, 3);
        const hitF = foes(f, pos, 1.6).find(g => Math.abs(chestOf(g).y - pos.y) < 1.8);
        if (hitF || pos.y < groundAt(pos.x, pos.z) + .3 || t > 4.2) {
          const g0 = gp(pos.x, pos.z); explode(f, new V3(pos.x, Math.max(pos.y, g0.y + .8), pos.z), 5, { dmg: o.dmg || 16, kb: 12, up: 12, ragdoll: 1, guardBreak: true, color: '#ffd54f', hitstop: .1, shake: .55 });
          splat(g0, '#ffd54f', 7); star(g0, f); sfx('boom', g0, .9); popText(new V3(g0.x, g0.y + 3, g0.z), 'BOOM', '#ffd54f', 28); shakeFrom(g0, .5); return true;
        }
        return false;
      }, () => { st.dispose(); scene.remove(rk); free(rk); });
    };

    // ---------- Despierto: Charco de Tinta ----------
    MOVES.berPond = function (f, o) {
      const tg = nearest(f, 24), F = fwd(f.yaw), c = tg ? gp(tg.pos.x, tg.pos.z) : gp(f.pos.x + F.x * 9, f.pos.z + F.z * 9), R = 4.6;
      const st = stroke(circlePts(c, R, 28, c.y + .15), '#6aa7ff', .26), disc = new THREE.Mesh(new THREE.CircleGeometry(R, 32), new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.set(c.x, c.y + .1, c.z); disc.scale.setScalar(.01); scene.add(disc);
      startAction(f, { name: 'berPond', dur: 1.0, aim: true, noControl: true, speedMul: 0, anim: DRAW });
      popText(chestOf(f), 'TINTA', '#6aa7ff', 22); sfx('whoosh', f.pos, .5); const T = o.time || 6; let tick = .9, drip = 0;
      loop(f, T + 1.2, (dt, t) => {
        st.reveal(Math.min(1, t / .5)); disc.scale.setScalar(Math.min(1, Math.max(.01, (t - .4) / .6))); if (t > T + .4) disc.scale.setScalar(Math.max(.01, 1 - (t - T - .4) / .8));
        if (t > drip) { drip = t + .12; emit(c.x + rand(-R, R) * .8, c.y + .2, c.z + rand(-R, R) * .8, 0, rand(2, 5), 0, INK, .18, .5, 0, 1); }
        if (t < .9 || t > T + .4) return false;
        for (const g of foes(f, c, R)) { g.buf = Math.max(g.buf || 0, .5); }   // dentro del charco van lentos
        if (!f.remote && f.alive && Math.hypot(f.pos.x - c.x, f.pos.z - c.z) < R) f.turbo = Math.max(f.turbo || 0, .3);
        if (t > tick) { tick += .6; for (const g of foes(f, c, R)) { applyHit(f, g, { dmg: o.dmg || 1.5, stun: 0, kb: 0, color: INK, hitstop: 0 }); burst(chestOf(g), 6, INK, 4, .12, .4, 0); } }
        return false;
      }, () => { st.dispose(); scene.remove(disc); free(disc); });
    };

    // ---------- Despierto: Remolino de Garabatos ----------
    MOVES.berTornado = function (f, o) {
      const g = new THREE.Group(), sts = [];
      for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 26; i++) { const a = i * .45 + k * 2.09, r = .8 + i * .2; pts.push(new V3(Math.cos(a) * r, .2 + i * .22, Math.sin(a) * r)); } const s = stroke(pts, COLS[k], .24); s.reveal(1); s.g.parent && s.g.parent.remove(s.g); g.add(s.g); sts.push(s); }
      g.position.set(f.pos.x, f.pos.y, f.pos.z); g.scale.setScalar(.2); scene.add(g);
      startAction(f, { name: 'berTornado', dur: .9, aim: false, noControl: true, speedMul: 0, anim: [[0, 'charge', 600], [.3, 'castUp', 800]] });
      popText(chestOf(f), 'REMOLINO', '#6aa7ff', 22); sfx('ult', f.pos, .5);
      let tick = .5; const T = 3.2;
      loop(f, T, (dt, t) => {
        g.position.set(f.pos.x, groundAt(f.pos.x, f.pos.z), f.pos.z); g.rotation.y += dt * 9; g.scale.setScalar(Math.min(1.2, .2 + t * 1.2));
        emit(f.pos.x + rand(-5, 5), f.pos.y + rand(0, 5), f.pos.z + rand(-5, 5), rand(-1, 1), rand(0, 2), rand(-1, 1), COLS[(Math.random() * 5) | 0], .14, .4, 0, 2);
        if (t > tick) { tick += .4; for (const e of foes(f, f.pos, 7.5)) { const dx = f.pos.x - e.pos.x, dz = f.pos.z - e.pos.z, d = Math.hypot(dx, dz) || 1; if (d < 1.6) continue; applyHit(f, e, { dmg: o.dmg || 2, stun: .1, kb: Math.min(9, d + 3), up: 2, dir: new V3(dx / d, 0, dz / d), color: '#6aa7ff', hitstop: 0 }); } }   // los atrae hacia el centro
        return false;
      }, () => { const p = gp(f.pos.x, f.pos.z); explode(f, new V3(p.x, p.y + 1, p.z), 3.4, { dmg: 6, kb: 11, up: 13, ragdoll: .9, color: '#6aa7ff', hitstop: .06, shake: .35 }); splat(p, '#6aa7ff', 6); star(p, f); scene.remove(g); for (const s of sts) free(s.g); free(g); });
    };

    // ---------- Despierto: Hoja en Blanco ----------
    MOVES.berPage = function (f, o) {
      const tg = nearest(f, 24), F = fwd(f.yaw), c = tg ? gp(tg.pos.x, tg.pos.z) : gp(f.pos.x + F.x * 10, f.pos.z + F.z * 10), S = 5.2;
      const sheet = new THREE.Group(), paper = bx(S * 2, .16, S * 2, '#ffffff'); sheet.add(paper);
      for (let i = -3; i <= 3; i++) { const l = bx(S * 2 - .6, .02, .06, '#9ec1ff'); l.position.set(0, .1, i * 1.3); sheet.add(l); } const mg = bx(.06, .02, S * 2 - .6, '#ff7a7a'); mg.position.set(-S + 1.2, .11, 0); sheet.add(mg);
      sheet.position.set(c.x, c.y + 30, c.z); sheet.rotation.set(.25, f.yaw, .2); scene.add(sheet);
      startAction(f, { name: 'berPage', dur: 1.6, aim: true, noControl: true, speedMul: 0, anim: [[0, 'charge', 600], [.35, 'slamUp', 1000], [1.1, 'mega', 1200]] });
      warnCircle(c, S + .4, '#6aa7ff', 1.3); popText(chestOf(f), 'HOJA EN BLANCO', '#6aa7ff', 22); sfx('ult', f.pos, .5);
      let fell = 0, landed = false, t0 = 0;
      loop(f, 4, (dt, t) => {
        if (!landed) {
          const k = Math.min(1, Math.max(0, (t - .6) / .7)); sheet.position.y = c.y + 30 - k * k * 29.6; sheet.rotation.x = .25 * (1 - k); sheet.rotation.z = .2 * (1 - k) + Math.sin(t * 6) * .05 * (1 - k); sheet.rotation.y += dt * 1.2 * (1 - k);
          if (k >= 1) { landed = true; t0 = t; explode(f, new V3(c.x, c.y + .6, c.z), S, { dmg: o.dmg || 20, stun: .8, kb: 9, up: 11, ragdoll: 1, guardBreak: true, noRC: true, color: '#6aa7ff', hitstop: .12, shake: .6 }); splat(c, '#6aa7ff', 8); star(c, f); sfx('boom', c, .9); shakeFrom(c, .6); popText(new V3(c.x, c.y + 3, c.z), 'APLASTADO', '#6aa7ff', 24); }
        } else {   // la hoja se arruga y desaparece
          const k = Math.min(1, (t - t0) / .6); sheet.scale.set(1 - k * .85, 1 + k * 3, 1 - k * .85); sheet.rotation.x += dt * 8; emit(c.x + rand(-3, 3), c.y + 1, c.z + rand(-3, 3), rand(-2, 2), rand(2, 5), rand(-2, 2), '#ffffff', .2, .5, 0, 2); if (k >= 1) return true;
        }
        return false;
      }, () => { scene.remove(sheet); free(sheet); });
    };

    // ---------- Ulti: Obra Maestra ----------
    MOVES.berUlt = function (f, o) {
      const F = fwd(f.yaw), R = rightOf(f.yaw), home = gp(f.pos.x - F.x * 9, f.pos.z - F.z * 9), g = new THREE.Group(), parts = [];
      const L = (a, b, col) => { const n = 8, pts = []; for (let i = 0; i <= n; i++) pts.push(new V3(a[0] + (b[0] - a[0]) * i / n + rand(-.18, .18), a[1] + (b[1] - a[1]) * i / n + rand(-.18, .18), a[2] || 0)); const s = stroke(pts, col, .42); s.g.parent && s.g.parent.remove(s.g); g.add(s.g); parts.push(s); };
      const circ = (cx, cy, r, col) => { const pts = []; for (let i = 0; i <= 22; i++) { const a = i / 22 * TAU + .3; pts.push(new V3(cx + Math.cos(a) * r + rand(-.12, .12), cy + Math.sin(a) * r, 0)); } const s = stroke(pts, col, .42); s.g.parent && s.g.parent.remove(s.g); g.add(s.g); parts.push(s); };
      circ(0, 10.5, 2.4, '#ff7ac8'); circ(-.9, 11, .35, INK); circ(.9, 11, .35, INK); L([-1.2, 9.7], [1.2, 9.7], '#ff5a8a');   // cabeza y boca
      L([0, 8.1], [0, 4], '#6aa7ff'); L([0, 7.4], [-3.6, 5.2], '#6aa7ff'); L([0, 7.4], [3.6, 5.2], '#6aa7ff'); L([0, 4], [-2, 0], '#6aa7ff'); L([0, 4], [2, 0], '#6aa7ff');
      for (let i = -3; i <= 3; i++) L([i * .75, 12.8 - Math.abs(i) * .25], [i * .75, 14.2 - Math.abs(i) * .5], '#ffd54f');   // pelos de punta
      g.position.set(home.x, home.y, home.z); g.rotation.y = Math.atan2(F.x, F.z); g.scale.setScalar(1.15); scene.add(g);
      startAction(f, { name: 'berUlt', dur: 3.0, aim: true, noControl: true, speedMul: 0, anim: [[0, 'charge', 600], [.5, 'windup', 800], [1.0, 'palm', 900], [1.6, 'throw', 900], [2.3, 'castUp', 1000]],
        steps: [{ at: .4, fn: () => { ringAt(gp(f.pos.x, f.pos.z), '#ff7ac8', 6, .6); lightColumn(f.pos, '#ff7ac8', 12); sfx('ult', f.pos); if (f.isPlayer) showBanner('OBRA MAESTRA', '#ff7ac8', 'El monstruo pisotea a los rivales'); } }] });
      let stomp = 0, next = 2.0, boom = false, tgtPos = home.clone(), phase = 0, t0 = 0;
      const total = o.n || 6;
      loop(f, 9, (dt, t) => {
        const k = Math.min(1, t / 1.6); parts.forEach((s, i) => s.reveal(Math.min(1, Math.max(0, k * parts.length - i * .8)))); g.position.x += (tgtPos.x - g.position.x) * Math.min(1, dt * 4); g.position.z += (tgtPos.z - g.position.z) * Math.min(1, dt * 4); g.position.y = groundAt(g.position.x, g.position.z);
        if (t < 2.0) { if (Math.random() < .5) emit(g.position.x + rand(-3, 3), g.position.y + rand(0, 10), g.position.z + rand(-1, 1), rand(-1, 1), rand(0, 2), rand(-1, 1), COLS[(Math.random() * 5) | 0], .2, .4, 0, 2); return false; }
        if (stomp < total && t > next) {
          next = t + .75; const es = enemiesOf(f).filter(e => e.alive && dist2d(f, e) < 40), e = es.length ? es[stomp % es.length] : null, p = e ? gp(e.pos.x, e.pos.z) : gp(f.pos.x + F.x * rand(6, 14) + R.x * rand(-6, 6), f.pos.z + F.z * rand(6, 14) + R.z * rand(-6, 6)); stomp++;
          warnCircle(p, 4, '#ff3b30', .7); tgtPos = new V3(p.x - F.x * 5, 0, p.z - F.z * 5); g.rotation.y = Math.atan2(p.x - g.position.x, p.z - g.position.z); g.rotation.x = 0;
          later(.7, () => { g.rotation.x = .12; later(.15, () => { g.rotation.x = 0; }); explode(f, new V3(p.x, p.y + .8, p.z), 4.2, { dmg: o.dmg || 9, stun: .5, kb: 9, up: 10, ragdoll: .8, guardBreak: true, color: '#ff7ac8', hitstop: .08, shake: .5 }); splat(p, '#ff7ac8', 7); star(p, f); sfx('boom', p, .8); shakeFrom(p, .5); popText(new V3(p.x, p.y + 2.6, p.z), 'PISOTÓN', '#ff7ac8', 22); });
        }
        if (stomp >= total && t > next + .8 && !boom) {   // final: Berpol tacha el dibujo con una X enorme
          boom = true; const es = enemiesOf(f).filter(e => e.alive && dist2d(f, e) < 40); let cx = f.pos.x + F.x * 10, cz = f.pos.z + F.z * 10; if (es.length) { cx = es.reduce((a, e) => a + e.pos.x, 0) / es.length; cz = es.reduce((a, e) => a + e.pos.z, 0) / es.length; }
          const c = gp(cx, cz), xs = [stroke([new V3(c.x - 8, c.y + .5, c.z - 8), new V3(c.x + 8, c.y + .5, c.z + 8)].flatMap((p, i, a) => i ? [] : Array.from({ length: 13 }, (_, k) => a[0].clone().lerp(a[1], k / 12))), '#ff3b30', .5), stroke(Array.from({ length: 13 }, (_, k) => new V3(c.x + 8, c.y + .5, c.z - 8).lerp(new V3(c.x - 8, c.y + .5, c.z + 8), k / 12)), '#ff3b30', .5)];
          xs.forEach((x, i) => loop(f, 1.2, (dt, tt) => { x.reveal(Math.min(1, tt / .35)); return false; }, () => x.dispose()));
          warnCircle(c, 9, '#ff3b30', .6);
          later(.6, () => { explode(f, new V3(c.x, c.y + 1, c.z), 9, { dmg: 14, stun: 1, kb: 12, up: 12, ragdoll: 1.2, guardBreak: true, color: '#ff3b30', hitstop: .15, shake: .8 }); splat(c, '#ff3b30', 12); star(c, f); sfx('boom', c, 1); shakeFrom(c, .8); popText(new V3(c.x, c.y + 3, c.z), 'TACHADO', '#ff3b30', 30); phase = 1; t0 = t; });
        }
        if (phase === 1 && t - t0 > .9) return true;
        return false;
      }, () => { scene.remove(g); for (const s of parts) free(s.g); free(g); });
    };
  }
});
