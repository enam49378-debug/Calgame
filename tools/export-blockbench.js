// Exporta cada peleador a un proyecto de Blockbench (.bbmodel, formato "Modelo genérico"):
// el modelo con su skin, el arma y TODAS las animaciones del juego grabadas a 20 cuadros por segundo
// con interpolación Catmull-Rom (la misma familia de curvas Hermite que usa el juego).
// Se corre dentro de la página del juego; cada archivo se manda a save-server.py, que lo guarda en /blockbench.
(async function exportBlockbench() {
  const uuid = () => crypto.randomUUID();
  const DEG = 180 / Math.PI, r1 = v => Math.round(v * 100) / 100;
  const FPS = 20, SIM = 1 / 120;
  const saved = [];
  async function save(path, body) {
    const r = await fetch('/save?p=' + encodeURIComponent(path), { method: 'POST', body });
    if (!r.ok) throw new Error('no se pudo guardar ' + path);
    saved.push(path);
  }

  // ---------- modelo ----------
  function makeModel(id) {
    const ch = CHARS[id], skin = charSkin(id), th = skin.height, legacy = th === 32, aw = ch.slim ? 3 : 4, ax = 4 + aw / 2;
    const textures = [{ name: 'skin.png', id: '0', width: 64, height: th, uv_width: 64, uv_height: th, source: skin.toDataURL('image/png'), uuid: uuid(), render_mode: 'default', render_sides: 'auto', visible: true, internal: true, saved: false, particle: false }];
    const elements = [];
    const face = ([x, y, w, h], tex = 0) => ({ uv: [x, y, x + w, y + h], texture: tex });
    function cube(name, from, to, u, v, w, h, d, inflate = 0) {
      const R = faceRects(u, v, w, h, d);
      const el = { name, box_uv: false, rescale: false, locked: false, render_order: 'default', allow_mirror_modeling: true, from, to, autouv: 0, color: 0, inflate, origin: [0, 0, 0],
        faces: { north: face(R.back), east: face(R.left), south: face(R.front), west: face(R.right), up: face(R.top), down: face(R.bottom) }, type: 'cube', uuid: uuid() };
      elements.push(el); return el.uuid;
    }
    const group = (name, origin, children) => ({ name, origin, rotation: [0, 0, 0], color: 0, uuid: uuid(), export: true, mirror_uv: false, isOpen: true, locked: false, visibility: true, autouv: 0, children });
    // piezas (píxeles, el personaje mira a +Z / "south", su derecha es -X)
    const head = group('head', [0, 24, 0], [cube('head', [-4, 24, -4], [4, 32, 4], 0, 0, 8, 8, 8), cube('hat', [-4, 24, -4], [4, 32, 4], 32, 0, 8, 8, 8, .5)]);
    const armR = group('rightArm', [-ax, 22, 0], [cube('rightArm', [-4 - aw, 12, -2], [-4, 24, 2], 40, 16, aw, 12, 4)].concat(legacy ? [] : [cube('rightSleeve', [-4 - aw, 12, -2], [-4, 24, 2], 40, 32, aw, 12, 4, .25)]));
    const armL = group('leftArm', [ax, 22, 0], [cube('leftArm', [4, 12, -2], [4 + aw, 24, 2], legacy ? 40 : 32, legacy ? 16 : 48, aw, 12, 4)].concat(legacy ? [] : [cube('leftSleeve', [4, 12, -2], [4 + aw, 24, 2], 48, 48, aw, 12, 4, .25)]));
    const torso = group('torso', [0, 12, 0], [cube('body', [-4, 12, -2], [4, 24, 2], 16, 16, 8, 12, 4)].concat(legacy ? [] : [cube('jacket', [-4, 12, -2], [4, 24, 2], 16, 32, 8, 12, 4, .25)], [head, armR, armL]));
    const legR = group('rightLeg', [-2, 12, 0], [cube('rightLeg', [-4, 0, -2], [0, 12, 2], 0, 16, 4, 12, 4)].concat(legacy ? [] : [cube('rightPants', [-4, 0, -2], [0, 12, 2], 0, 32, 4, 12, 4, .25)]));
    const legL = group('leftLeg', [2, 12, 0], [cube('leftLeg', [0, 0, -2], [4, 12, 2], legacy ? 0 : 16, legacy ? 16 : 48, 4, 12, 4)].concat(legacy ? [] : [cube('leftPants', [0, 0, -2], [4, 12, 2], 0, 48, 4, 12, 4, .25)]));
    const bodyRoot = group('body_root', [0, 16, 0], [torso, legR, legL]);
    const bones = { body_root: bodyRoot, torso, head, rightArm: armR, leftArm: armL, rightLeg: legR, leftLeg: legL };
    // arma: un cubo de 1 píxel por vóxel, con una paleta de colores como segunda textura
    if (WEAPONS[ch.weapon]) {
      const w = WEAPONS[ch.weapon](), M = new THREE.Matrix4(), P = new THREE.Vector3(), C = new THREE.Color(), pal = [], vox = [];
      for (let i = 0; i < w.count; i++) {
        w.getMatrixAt(i, M); P.setFromMatrixPosition(M); w.getColorAt(i, C);
        const hex = '#' + C.getHexString(); let pi = pal.indexOf(hex); if (pi < 0) { pal.push(hex); pi = pal.length - 1; }
        vox.push([Math.round(P.y / PX), Math.round(P.z / PX), pi]);
      }
      w.geometry.dispose(); w.material.dispose();
      const pc = document.createElement('canvas'); pc.width = pc.height = 16; const pg = pc.getContext('2d');
      pal.forEach((c, i) => { pg.fillStyle = c; pg.fillRect(i % 16, i / 16 | 0, 1, 1); });
      textures.push({ name: 'weapon.png', id: '1', width: 16, height: 16, uv_width: 16, uv_height: 16, source: pc.toDataURL('image/png'), uuid: uuid(), render_mode: 'default', render_sides: 'auto', visible: true, internal: true, saved: false, particle: false });
      const hx = -ax, hy = 12, kids = [];
      vox.forEach(([y, z, pi], i) => {
        const u = pi % 16, v = pi / 16 | 0, f = { uv: [u, v, u + 1, v + 1], texture: 1 };
        const el = { name: 'v' + i, box_uv: false, rescale: false, locked: false, render_order: 'default', allow_mirror_modeling: true, from: [hx - .5, hy + y - .5, z - .5], to: [hx + .5, hy + y + .5, z + .5], autouv: 0, color: 0, inflate: 0, origin: [0, 0, 0], faces: { north: f, east: f, south: f, west: f, up: f, down: f }, type: 'cube', uuid: uuid() };
        elements.push(el); kids.push(el.uuid);
      });
      bones.weapon = group('weapon', [hx, hy, 0], kids);
      armR.children.push(bones.weapon);
    }
    return { ch, bones, elements, textures, outliner: [bodyRoot], th };
  }

  // ---------- grabación de animaciones ----------
  // convierte el estado del animador del juego a valores de Blockbench (grados; Blockbench invierte X e Y al reproducir)
  function frame(x, extra) {
    const lie = Math.min(1, Math.abs(Math.sin(x.ix)));
    const rot = (a, b, c) => [r1(-a * DEG), r1(-b * DEG), r1(c * DEG)];
    return {
      body_root: { rotation: rot(x.ix, x.iy + (extra.yaw || 0), x.iz), position: [r1(-(extra.dx || 0)), r1((16 + x.by) * (1 - lie * .78) - 16 + (extra.dy || 0)), r1(x.bz + (extra.dz || 0))] },
      torso: { rotation: rot(x.tx, x.ty, x.tz) }, head: { rotation: rot(x.hx, x.hy, x.hz) },
      rightArm: { rotation: rot(x.arx, x.ary, x.arz) }, leftArm: { rotation: rot(x.alx, x.aly, x.alz) },
      rightLeg: { rotation: rot(x.lrx, 0, x.lrz) }, leftLeg: { rotation: rot(x.llx, 0, x.llz) },
      weapon: { rotation: rot(x.sx + (extra.tw || 0), 0, 0) },
    };
  }
  // saca cuadros que se pueden reconstruir con la curva (menos cuadros = más fácil de editar)
  function reduce(times, vals, tol = .9) {
    const keep = times.map(() => true);
    for (let i = 1; i < times.length - 1; i++) {
      let a = i - 1; while (!keep[a]) a--;
      const b = i + 1, k = (times[i] - times[a]) / (times[b] - times[a]);
      if (vals[i].every((v, j) => Math.abs(v - (vals[a][j] + (vals[b][j] - vals[a][j]) * k)) < tol)) keep[i] = false;
    }
    return keep;
  }
  function makeAnim(model, name, frames, loop) {
    const animators = {}, len = frames.length ? frames[frames.length - 1].t : 0;
    for (const bone in model.bones) {
      for (const channel of ['rotation', 'position']) {
        const times = [], vals = [];
        for (const f of frames) { const b = f.v[bone]; if (b && b[channel]) { times.push(f.t); vals.push(b[channel]); } }
        if (!vals.length || vals.every(v => v.every(n => Math.abs(n) < .05))) continue;
        const keep = reduce(times, vals);
        const g = model.bones[bone];
        const an = animators[g.uuid] || (animators[g.uuid] = { name: g.name, type: 'bone', keyframes: [] });
        times.forEach((t, i) => { if (keep[i]) an.keyframes.push({ channel, data_points: [{ x: vals[i][0], y: vals[i][1], z: vals[i][2] }], uuid: uuid(), time: r1(t), color: -1, interpolation: 'catmullrom' }); });
      }
    }
    return { uuid: uuid(), name, loop: loop ? 'loop' : 'once', override: false, length: r1(len), snapping: FPS, selected: false, anim_time_update: '', blend_weight: '', start_delay: '', loop_delay: '', animators };
  }
  // pose estática o función del tiempo
  function sampleFn(fn, len) { const out = []; for (let i = 0; i <= Math.round(len * FPS); i++) { const t = i / FPS; out.push({ t, v: frame(fn(t), {}) }); } return out; }
  const full = p => { const o = {}; for (const j of JOINTS) o[j] = jv(p, j); return o; };
  // simula una acción del juego con un peleador de prueba y graba su animación
  function bake(id, start, opts = {}) {
    const saveF = G.fighters, saveP = G.player, saveState = G.state, saveTime = G.time;
    const actor = new Fighter({ name: 'export', char: id, lvlVar: 0 }), target = new Fighter({ name: 'target', char: 'kaiza', lvlVar: 0 });
    G.fighters = [actor, target]; G.player = null; G.state = 'export';
    actor.pos.set(0, 0, 0); actor.yaw = 0; actor.prevYaw = 0; actor.onGround = true; actor.flourT = 1e9; actor.atkT = -1e9;
    target.pos.set(0, 0, opts.dist || 4); target.yaw = Math.PI; target.ai.think = 1e9; actor.ai.target = target; actor.ai.think = 1e9;
    if (actor.spear) setSpear(actor, true);
    actor.anim.x = full(stancePose(actor.ch, 0, 0, actor.spear ? true : undefined)); for (const j of JOINTS) actor.anim.v[j] = 0;
    const frames = []; let t = 0, n = 0;
    start(actor, target);
    const rec = () => frames.push({ t, v: frame(actor.anim.x, { dx: actor.pos.x / PX, dy: actor.pos.y / PX, dz: actor.pos.z / PX, yaw: actor.model.root.rotation.y, tw: actor.twA || 0 }) });
    rec();
    while (t < (opts.max || 3.2)) {
      for (let i = TIMERS.length - 1; i >= 0; i--) { TIMERS[i].t -= SIM; if (TIMERS[i].t <= 0) { const tm = TIMERS.splice(i, 1)[0]; try { tm.fn(); } catch (e) { } } }
      updateAction(actor, SIM); physics(actor, SIM); tickTimers(actor, SIM); animate(actor, SIM);
      target.pos.set(0, 0, opts.dist || 4); target.vel.set(0, 0, 0); target.hp = target.maxHp; target.alive = true;
      updateProj(SIM); updateFx(SIM);
      t += SIM; n++;
      if (n % (120 / FPS) === 0) rec();
      if (!actor.action && t > (opts.min || .3) && actor.onGround && !actor.spearThrown) break;
    }
    rec();
    PROJ.forEach(p => { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); }); PROJ.length = 0; TIMERS.length = 0;
    actor.dispose(); target.dispose();
    G.fighters = saveF; G.player = saveP; G.state = saveState; G.time = saveTime;
    return frames;
  }

  const index = [];
  for (const id of CHAR_IDS) {
    const model = makeModel(id), ch = model.ch, anims = [], hasW = !!model.bones.weapon;
    const add = (name, frames, loop) => { if (frames && frames.length > 1) anims.push(makeAnim(model, name, frames, loop)); };
    // estados de locomoción
    const st = (out, t) => full(stancePose(ch, t, 0, out));
    add('idle', sampleFn(t => st(true, t), TAU / 2.6), true);
    if (hasW) add('idle_sin_arma', sampleFn(t => st(false, t), TAU / 2.6), true);
    const runF = { walk: 0, yawVel: 0, spearOut: hasW };
    add('correr', sampleFn(t => { runF.walk = t * 9 * 1.4; const p = full(runPose(runF, 9)); if (hasW) { p.arx = -.45 + Math.sin(runF.walk) * .2; p.sx = .3; p.arz = .1; } return p; }, TAU / (9 * 1.4)), true);
    const poseAnim = (name, pose, len = .35) => { const keys = buildTrack([[len * .6, pose]], st(true, 0), 0); add(name, sampleFn(t => sampleTrack(keys, t, {}), len)); };
    [['salto', 'jump'], ['caida', 'fall'], ['aterrizaje', 'land'], ['esquive', 'dash'], ['bloqueo', 'block'], ['golpeado_a', 'hurtA'], ['golpeado_b', 'hurtB'], ['en_el_piso', 'down'], ['levantarse', 'getup1']].forEach(([n, p]) => poseAnim(n, p));
    add('mareado', sampleFn(t => full(dizzyPose(t)), 1.6), true);
    // combo de golpes (los 4 golpes y el remate hacia arriba)
    for (let i = 0; i < 4; i++) add('combo_' + (i + 1), bake(id, a => { a.comboIdx = i; a.comboTimer = 1; a.m1cd = 0; doM1(a, false); }, { dist: 1.6 }));
    add('combo_4_arriba', bake(id, a => { a.comboIdx = 3; a.comboTimer = 1; a.m1cd = 0; doM1(a, true); }, { dist: 1.6 }));
    // habilidades y ulti
    ch.skills.forEach((s, i) => add('habilidad_' + (i + 1) + '_' + s.n.toLowerCase().replace(/[^a-z0-9ñáéíóú]+/g, '_'), bake(id, a => useSkill(a, i), { dist: ['grab', 'barrage', 'whirl', 'counter', 'optoJump'].includes(s.k) ? 1.3 : 5, max: 3.2 })));
    add('ulti_' + ch.ult.n.toLowerCase().replace(/[^a-z0-9ñáéíóú]+/g, '_'), bake(id, a => runUlt(a), { dist: 5, max: 3.6 }));
    // pose de lucimiento, entrada del menú y cinemática de la ulti
    if (ch.flourish) { const k = buildTrack(ch.flourish.anim, st(true, 0), 0); add('lucimiento', sampleFn(t => sampleTrack(k, t, {}), ch.flourish.dur)); }
    { const k = buildTrack(ch.intro, st(true, 0), 0); add('entrada_menu', sampleFn(t => sampleTrack(k, t, {}), ch.intro[ch.intro.length - 1][0] + .5)); }
    { const k = buildTrack(ch.cine, st(true, 0), 0); add('cinematica_ulti', sampleFn(t => sampleTrack(k, t, {}), 2.6)); }

    const bb = {
      meta: { format_version: '4.10', model_format: 'free', box_uv: false },
      name: ch.name, model_identifier: id, visible_box: [1, 2, 0], variable_placeholders: '', variable_placeholder_buttons: [], timeline_setups: [], unhandled_root_fields: {},
      resolution: { width: 64, height: model.th },
      elements: model.elements, outliner: model.outliner, textures: model.textures, animations: anims,
    };
    const folder = ch.name;
    await save(`${folder}/${ch.name}.bbmodel`, JSON.stringify(bb));
    await save(`${folder}/skin.png`, await (await fetch(charSkin(id).toDataURL('image/png'))).blob());
    index.push({ id, name: ch.name, animations: anims.map(a => `${a.name} (${a.length}s${a.loop === 'loop' ? ', en bucle' : ''})`) });
  }
  await save('animaciones.json', JSON.stringify(index, null, 2));
  return saved;
})();
