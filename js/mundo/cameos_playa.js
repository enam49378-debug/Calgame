// Cameos de personajes en la playa
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_MUNDO = window.CF_MUNDO || {};

window.CF_MUNDO.crearCameosPlaya = function crearCameosPlaya(D) {
  'use strict';
  const { $, Animator, BEACH, CHARS, CITY, DOM_ANIMALS, G, JDEF, JOINTS, PX, SEA_Y, SHORE, TITLE, V3, WEAPONS, angLerp, buildModel, burst, camera, charSkin, clamp, copyCanvas, disposeModel, emit, fwd, ghost, groundAt, poseTitleTower, rand, ringAt, scene, setSpear, sfx, slashLine, splashFx } = D;

// ===== Cameos: otros personajes que pasan por la playa haciendo lo suyo =====
function cmSpawn(id) {
  const ch = CHARS[id], m = buildModel(copyCanvas(charSkin(id)), !!ch.slim, scene); m.root.traverse(o => { if (o.isMesh) o.receiveShadow = false; });
  const fig = { model: m, anim: new Animator(m), ch, alive: true, hp: 1, maxHp: 1 }; fig.anim.bbR6 = true; for (const j of JOINTS) fig.anim.x[j] = JDEF[j] || 0;
  if (WEAPONS[ch.weapon]) { fig.spear = WEAPONS[ch.weapon](); m.mats.push(fig.spear.material); setSpear(fig, false); }
  return fig;
}
const cmReset = x => { for (const j of JOINTS) x[j] = JDEF[j] || 0; };
// curvas de tiempo estilo animación: 'snap' entra seco, 'back' se pasa y vuelve, 'io' suave, 'hold' se queda quieto hasta la siguiente clave
const EZ = { lin: u => u, io: u => u * u * (3 - 2 * u), out: u => 1 - (1 - u) ** 3, in: u => u * u * u, back: u => outBack(u), snap: u => 1 - (1 - u) ** 5, hold: u => (u >= 1 ? 1 : 0) };
// poses clave: [[tiempo, {canal: valor}, curva]]; lo que no se nombra vuelve a su valor de reposo. Devuelve la escala vertical (sy) si alguna clave la trae
function cmKeys(x, keys, t) {
  cmReset(x); let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  const A = keys[i], B = keys[Math.min(i + 1, keys.length - 1)], u = B === A ? 1 : clamp((t - A[0]) / (B[0] - A[0]), 0, 1), w = (EZ[B[2] || 'io'])(u);
  const ks = new Set([...Object.keys(A[1]), ...Object.keys(B[1])]); let sy = 1;
  for (const k of ks) { const va = A[1][k] != null ? A[1][k] : (k === 'sy' ? 1 : JDEF[k] || 0), vb = B[1][k] != null ? B[1][k] : (k === 'sy' ? 1 : JDEF[k] || 0), v = va + (vb - va) * w; if (k === 'sy') sy = v; else x[k] = v; }
  return sy;
}
// ciclos: carrera anime (inclinado, brazos fuertes, rebote con aplastar/estirar) y caminata con peso
function cmRun(x, ph, k = 1, lean = .4) { cmReset(x); const s = Math.sin(ph), c2 = Math.cos(ph * 2); Object.assign(x, { ix: lean, tx: .12 * k, hx: -.2 * k, ty: s * .18 * k, llx: s * 1.15 * k, lrx: -s * 1.15 * k, alx: -s * 1.35 * k - .35, arx: s * 1.35 * k - .35, alz: .18, arz: -.18, by: (-1.4 + c2 * 1.1) * k, hy: -s * .08 }); return 1 - c2 * .04 * k; }
function cmWalk2(x, ph, k = 1) { cmReset(x); const s = Math.sin(ph), c2 = Math.cos(ph * 2); Object.assign(x, { ix: .05, llx: s * .62 * k, lrx: -s * .62 * k, alx: -s * .55 * k, arx: s * .55 * k, by: (-.5 + c2 * .45) * k, ty: s * .1 * k, hy: -s * .07, hz: s * .04 }); return 1 - c2 * .02; }
function cmSneak(x, ph) { cmReset(x); const s = Math.sin(ph), up = Math.max(0, s), dn = Math.max(0, -s); Object.assign(x, { ix: .32, tx: .15, hx: -.35, llx: -up * 1.25, lrx: -dn * 1.25, alx: -1.25 + s * .2, arx: -1.25 - s * .2, alz: -.25, arz: .25, by: -2.2 + Math.abs(s) * 1.2, hy: Math.sin(ph * .5) * .35 }); return 1 + Math.abs(s) * .03; }
const cmPlace = (f, px, pz, yaw, py, sy = 1) => { const gy = groundAt(px, pz, 4); f.model.root.position.set(px, (py == null ? gy : py) + .02, pz); f.model.root.rotation.y = yaw; f.model.root.scale.set(1 + (1 - sy) * .5, sy, 1 + (1 - sy) * .5); f.anim.apply(); };
const CM_W = -Math.PI / 2, CM_E = Math.PI / 2;   // mirando al oeste (hacia el sol) o al este
const smoothK = (a, b, v) => { const q = clamp((v - a) / (b - a), 0, 1); return q * q * (3 - 2 * q); };
// ¿se ve este punto? (dentro del cuadro y no perdido en la distancia)
function cmVisible(x, z, h = 1) { const v = new V3(x, groundAt(x, z, 4) + h, z), d = v.distanceTo(camera.position); v.project(camera); return v.z < 1 && Math.abs(v.x) < 1.12 && Math.abs(v.y) < 1.15 && d < 88; }
// punto fuera de cámara sobre la playa: se camina desde 'x0' hacia 'dir' (+1 este / -1 oeste) hasta que deja de verse
function cmOff(x0, z, dir) { for (let x = x0; Math.abs(x - x0) < 160; x += dir * 2) if (!cmVisible(x, z) && !cmVisible(x, z, .2) && !cmVisible(x, z, 2)) return x + dir * 3; return x0 + dir * 160; }
// trayecto con su paso (caminar / correr / sigilo); devuelve true al llegar
function cmGo(c, f, from, to, z, speed, style, u, py) {
  const dist = Math.abs(to - from) || 1, k = clamp(u * speed / dist, 0, 1), px = from + (to - from) * k, x = f.anim.x, ph = u * (style === 'run' ? speed * 1.6 : style === 'sneak' ? 4.2 : 7.5);
  const sy = style === 'run' ? cmRun(x, ph, 1.1, .45) : style === 'sneak' ? cmSneak(x, ph) : cmWalk2(x, ph);
  cmPlace(f, px, z, to < from ? CM_W : CM_E, py, sy); f.model.root.visible = true; return k >= 1;
}
const legT = (a, b, sp) => Math.abs(b - a) / sp;
// sitio donde actúa: el preferido si se ve bien; si no, el punto de la playa más cercano que quede dentro del cuadro
function cmStage(x0, z) { const ok = x => { if (!cmVisible(x, z) || !cmVisible(x, z, 2)) return false; const v = new V3(x, groundAt(x, z, 4) + 1, z).project(camera); return Math.abs(v.x) < .75; }; if (ok(x0)) return x0; for (let d = 2; d < 70; d += 2) { if (ok(x0 - d)) return x0 - d; if (ok(x0 + d)) return x0 + d; } return x0; }
const TITLE_LIFT = [
  [0, { ix: .28, llx: -.35, lrx: .25, alx: -.6, arx: -.6 }],
  [.34, { by: -4, ix: .5, hx: -.36, llx: -.65, lrx: .35, alx: -1.25, arx: -1.25, sy: .94 }],
  [.54, { by: -3.4, ix: .32, hx: -.25, alx: -1.85, arx: -1.85, alz: -.19, arz: .19, sy: .97 }, 'hold'],
  [1.04, { hx: -.28, alx: -2.85, arx: -2.85, alz: -.2, arz: .2 }, 'out'],
];
const TITLE_THROW = [
  [0, { hx: -.28, alx: -2.85, arx: -2.85, alz: -.2, arz: .2 }],
  [.4, { by: -3.6, ix: -.28, hx: -.45, llx: -.6, lrx: .32, alx: -2.4, arx: -2.4, alz: -.28, arz: .28, sy: .91 }],
  [.52, { by: .6, ix: .2, hx: -.52, alx: -3.12, arx: -3.12, alz: -.22, arz: .22, sy: 1.07 }, 'snap'],
  [.72, { ix: .23, alx: -1.7, arx: -1.65, llx: -.65, lrx: .48 }],
  [1.05, { by: -2, llx: -.55, lrx: .35, alx: -.7, arx: -.5 }],
  [1.42, { hx: -.42, alx: -.12, arx: -.22 }],
  [2.05, { hx: -.42, arx: -1.55, arz: .5 }],
  [2.48, { arx: .1, alx: -.15 }],
  [2.72, {}],
];
function startTitleRepair(wreck) {
  const { b, dir, pivot } = wreck;
  const grip = new V3(b.x + Math.sign(dir.x) * b.w / 2, b.h * .58, b.z + Math.sign(dir.z) * b.d / 2)
    .applyMatrix4(wreck.transform).setY(0);
  const side = new V3(-dir.z, 0, dir.x);
  if (side.dot(grip.clone().sub(pivot)) < 0) side.negate();
  const start = grip.clone().addScaledVector(side, 9).addScaledVector(dir, 3);
  const fig = cmSpawn('capitan');
  const label = document.createElement('div'); label.className = 'trepair';
  const name = document.createElement('strong'); name.textContent = CHARS.capitan.name.toUpperCase();
  const line = document.createElement('span'); line.textContent = 'Otra vez, Sekza…';
  label.append(name, line); $('title').appendChild(label);
  cameoEnd();
  wreck.repair = { t: 0, fig, grip, side, start, label, line, placed: false };
}
function finishTitleRepair() {
  const wreck = TITLE.wreck;
  if (!wreck) return;
  poseTitleTower(wreck, 0);
  if (wreck.repair) {
    const { fig, label } = wreck.repair;
    scene.remove(fig.model.root); disposeModel(fig.model); label.remove();
  }
  TITLE.wreck = null;
  TITLE.nextSek = TITLE.t + 12;
}
function updateTitleRepair(dt) {
  const w = TITLE.wreck;
  if (!w?.landed || TITLE.sek || TITLE.lt != null || TITLE.t < w.repairAt) return;
  if (!w.repair) startTitleRepair(w);
  const r = w.repair;
  const t = r.t += dt, x = r.fig.anim.x, dir = w.dir, carry = smoothK(2.6, 4, t);
  const pos = r.grip.clone().addScaledVector(r.side, .36);
  let yaw = Math.atan2(-dir.x, -dir.z), sy = 1;
  if (t < 1.55) {
    pos.lerp(r.start, 1 - EZ.out(t / 1.55));
    const approach = Math.atan2(r.grip.x - r.start.x, r.grip.z - r.start.z);
    yaw = angLerp(approach, yaw, smoothK(1.15, 1.55, t));
    sy = cmRun(x, t * 13, 1 - smoothK(1.15, 1.55, t), .34);
  } else if (t < 2.6) {
    sy = cmKeys(x, TITLE_LIFT, t - 1.55);
    x.alx += Math.sin(t * 37) * .07; x.arx -= Math.sin(t * 37) * .07;
    poseTitleTower(w, Math.PI / 2, 1.92 * smoothK(2.07, 2.6, t));
  } else if (t < 4) {
    const step = Math.sin(carry * Math.PI * 6);
    cmReset(x);
    Object.assign(x, { ix: .06, hx: -.28, llx: step * .6, lrx: -step * .6, alx: -2.87, arx: -2.87, alz: -.18, arz: .18, by: -.9 * Math.abs(step) });
    pos.addScaledVector(dir, -6 * carry);
    poseTitleTower(w, Math.PI / 2, 1.92 - .07 * Math.abs(step), -6 * carry);
  } else {
    const u = t - 4;
    sy = cmKeys(x, TITLE_THROW, u);
    const away = smoothK(.55, 1.16, u);
    pos.addScaledVector(dir, -6).addScaledVector(r.side, away * 6.3);
    pos.y += Math.sin(away * Math.PI) * 1.05;
    yaw = angLerp(yaw, Math.atan2(dir.x, dir.z), smoothK(1.14, 1.7, u));
    if (u < .52) poseTitleTower(w, Math.PI / 2, 1.92 - .37 * Math.sin(u / .52 * Math.PI), -6);
    else if (!r.placed) {
      const k = clamp((u - .52) / 1.54, 0, 1);
      if (!r.thrown) { r.thrown = true; sfx('heavy', pos, .8, { range: 120, title: true }); }
      poseTitleTower(w, Math.PI / 2 * (1 - EZ.io(k)), 1.92 * (1 - k) + 8 * k * (1 - k), -6 * (1 - k));
      if (k >= 1) {
        r.placed = true;
        r.line.textContent = 'Y que no se repita.';
        const p = new V3(w.b.x, .4, w.b.z);
        burst(p, 38, '#d7b8a0', 12, .8, 1.5, .1, 2.5);
        ringAt(p, '#fff0d4', 10, .48);
        TITLE.boomShake = .5;
        sfx('boom', p, .72, { range: 140, title: true });
      }
    }
  }
  cmPlace(r.fig, pos.x, pos.z, yaw, pos.y, sy);
  if (t >= 7.15) finishTitleRepair();
}
function titleRepairCamera(cam, look) {
  const w = TITLE.wreck, r = w?.repair;
  if (!r || TITLE.lt != null) return null;
  const widen = smoothK(3.35, 5.68, r.t);
  const close = r.grip.clone().addScaledVector(r.side, 8.6).addScaledVector(w.dir, 3.5).setY(3.4);
  const wide = w.pivot.clone().addScaledVector(r.side, Math.max(45, w.b.h * 1.62, w.b.h * .88 / camera.aspect)).addScaledVector(w.dir, 8).setY(13);
  const closeLook = r.grip.clone().addScaledVector(w.dir, -2.6 * smoothK(2.6, 4, r.t)).setY(1.65);
  const wideLook = w.pivot.clone().addScaledVector(w.dir, w.b.h * .21).setY(w.b.h * .46);
  cam.copy(close.lerp(wide, widen)); look.copy(closeLook.lerp(wideLook, widen));
  return 52;
}
const TITLE_BOAT_DUR = 5.7;
const TITLE_BOAT_CLIMB = [
  [0, { ix: .76, hx: -.62, alx: -1.85, arx: -1.8, llx: .25, lrx: -.18 }],
  [.32, { ix: .35, hx: -.28, alx: -2.2, arx: -2.28, llx: -.42, lrx: .24 }],
  [.7, { by: -2.8, ix: .6, hx: -.44, alx: -1.2, arx: -1.9, llx: -.9, lrx: .5 }],
  [1.02, { by: -3, ix: .42, hx: -.22, alx: -.65, arx: -1.04, llx: -.88, lrx: .32 }],
  [1.43, { by: -2.5, ix: .3, hx: -.15, alx: -.48, arx: -.75, llx: -.35, lrx: .12 }],
];
function titleRedBoat() {
  camera.updateMatrixWorld();
  let pick = null, best = Infinity;
  for (const boat of BEACH.boats) {
    if (boat.model !== 'barca_roja' || !boat.mesh.visible) continue;
    if (boat.mesh.position.z < SHORE(boat.mesh.position.x) + 5) continue;
    const p = boat.mesh.position.clone().setY(SEA_Y + 1), d = p.distanceTo(camera.position), v = p.project(camera);
    if (v.z <= -1 || v.z >= 1 || Math.abs(v.x) > .94 || Math.abs(v.y) > .82 || d > 85) continue;
    const score = Math.abs(v.x) + d * .012;
    if (score < best) { best = score; pick = boat; }
  }
  return pick;
}
function titleBoatTentacles() {
  const steps = 10, count = 3 * steps;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geo, mat, count * 2);
  mesh.visible = false; mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    mesh.setColorAt(i, color.set(i % 3 === 0 ? '#553965' : '#38264f'));
    mesh.setColorAt(count + i, color.set(i % 2 ? '#bb7799' : '#d297b1'));
  }
  scene.add(mesh);
  const curve = new THREE.CatmullRomCurve3(Array.from({length:5}, () => new V3()));
  return { mesh, steps, count, curve, a: new V3(), b: new V3(), center: new V3(), tangent: new V3(), size: new V3(), up: new V3(0, 1, 0), q: new THREE.Quaternion(), matrix: new THREE.Matrix4() };
}
function poseTitleTentacles(c, t, body) {
  const { mesh, steps, count, curve, a, b, center, tangent, size, up, q, matrix } = c.tentacles;
  mesh.visible = t > 2.7 && t < 5.35;
  if (!mesh.visible) return;
  const [base, elbow, reach, wrap, tip] = curve.points;
  for (let i = 0; i < 3; i++) {
    const spread = i - 1, high = i === 1 ? .52 : .98;
    const growth = smoothK(2.7 + i * .065, 3.23 + i * .045, t) * (1 - smoothK(4.56, 5.35, t));
    c.boat.mesh.localToWorld(base.set(c.side * (2.25 + i * .25), 0, -.45 + spread * 1.22));
    base.y = SEA_Y - 1.65;
    elbow.copy(base).addScaledVector(c.out, .46).y += 2 + .42 * Math.sin(t * 10 + i);
    reach.copy(body).addScaledVector(c.out, .78).addScaledVector(c.along, spread * .66).y += high + .34;
    wrap.copy(body).addScaledVector(c.out, .14).addScaledVector(c.along, spread * .33 + (i === 1 ? .26 : 0)).y += high;
    tip.copy(body).addScaledVector(c.out, -.28).addScaledVector(c.along, spread * .26).y += high + .24;
    curve.getPoint(0, a);
    for (let j = 0; j < steps; j++) {
      const u = (j + 1) / steps, index = i * steps + j;
      curve.getPoint(growth * u, b);
      tangent.copy(b).sub(a);
      const len = tangent.length(), width = (.38 - .28 * u) * Math.min(1, growth * 4);
      q.setFromUnitVectors(up, tangent.divideScalar(len || 1));
      center.copy(a).lerp(b, .5);
      mesh.setMatrixAt(index, matrix.compose(center, q, size.set(width, len + width * .58, width)));
      center.addScaledVector(c.out, width * .52);
      mesh.setMatrixAt(count + index, matrix.compose(center, q, size.set(width * .52, width * .48, width * .62)));
      a.copy(b);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
}
const TITLE_BOAT_CAMEO = {
  dur: TITLE_BOAT_DUR,
  init(c) {
    const hull = c.boat.mesh;
    hull.updateWorldMatrix(true, false);
    const near = hull.worldToLocal(camera.position.clone());
    c.side = near.x >= 0 ? 1 : -1;
    c.out = new V3(c.side, 0, 0).applyAxisAngle(new V3(0, 1, 0), hull.rotation.y);
    c.along = fwd(hull.rotation.y);
    c.view = camera.position.clone().sub(hull.position).setY(0).normalize();
    const f = cmSpawn('gato'); c.f = [f];
    if (f.spear) f.spear.visible = false;
    c.tentacles = titleBoatTentacles();
    c.bang = bangSprite(); scene.add(c.bang);
    c.nextSplash = 0;
  },
  upd(c, t) {
    const f = c.f[0], x = f.anim.x, hull = c.boat.mesh;
    hull.updateWorldMatrix(true, false);
    const climb = smoothK(1.84, 2.91, t), over = smoothK(2.12, 2.87, t), drag = smoothK(3.62, 4.87, t);
    const tug = smoothK(3.22, 3.57, t) * (1 - drag);
    const swim = clamp(t / 1.48, 0, 1), stroke = Math.sin(swim * Math.PI * 5);
    const deckX = .16 + .14 * tug + 2.65 * drag;
    const localX = (1.16 + 3.32 * (1 - EZ.io(swim))) * (1 - over) + deckX * over;
    const localZ = -.42 - .82 * (1 - swim) + .13 * stroke * (1 - swim) + .42 * drag;
    const p = hull.localToWorld(new V3(c.side * localX, .18, localZ));
    const floatY = SEA_Y - .93 - .65 * (1 - smoothK(0, .24, t)) + .08 * stroke * (1 - swim);
    p.y = floatY * (1 - climb) + p.y * climb + .48 * Math.sin(Math.PI * climb) + .56 * Math.sin(Math.PI * drag) - 3.4 * drag ** 1.7;
    let yaw = Math.atan2(-c.out.x, -c.out.z);
    if (t < 1.48) {
      const strokeB = Math.cos(swim * Math.PI * 5);
      cmReset(x);
      Object.assign(x, { ix: .76, hx: -.64, hy: .18 * stroke, alx: -1.85 + .68 * stroke, arx: -1.8 - .68 * stroke, alz: -.22, arz: .22, llx: .25 + .42 * strokeB, lrx: -.18 - .4 * strokeB });
    } else if (t < 2.91) cmKeys(x, TITLE_BOAT_CLIMB, t - 1.48);
    else {
      const panic = smoothK(2.91, 3.16, t), flail = Math.sin((t - 2.91) * 27) * panic;
      cmReset(x);
      Object.assign(x, { by: -2.5 + 1.8 * drag, ix: .3 - .93 * drag, hx: -.15 - .28 * panic, hy: c.side * 1.05 * panic * (1 - drag), alx: -.48 - 1.4 * panic + flail * .66, arx: -.75 - 1.2 * panic - flail * .66, alz: -.52 * panic, arz: .6 * panic, llx: -.35 + flail * .7, lrx: .12 - flail * .64 });
      yaw += c.side * .42 * panic;
    }
    cmPlace(f, p.x, p.z, yaw, p.y);
    f.model.root.visible = t < 4.93;
    c.bang.visible = t > 3.0 && t < 3.57;
    if (c.bang.visible) {
      f.model.head.getWorldPosition(c.bang.position).y += .73;
      c.bang.scale.setScalar(.74 * outBack((t - 3.0) / .22));
    }
    poseTitleTentacles(c, t, p);
    if (t > 3.2) { const u = t - 3.2; c.boat.kick = c.side * .22 * Math.sin(u * 12) * Math.exp(-u * 1.65); }
    if (t >= .13 && t < 1.55 && t >= c.nextSplash) {
      c.nextSplash = t + .24;
      burst(p.clone().setY(SEA_Y + .08), 5, '#c5efff', 2.8, .11, .42, .45, 2);
    }
    if (!c.surge && t >= 2.83) {
      c.surge = true;
      const q = hull.localToWorld(new V3(c.side * 1.94, 0, -.42)).setY(SEA_Y + .06);
      splashFx({pos:q});
    }
    if (!c.sunk && t >= 4.26) {
      c.sunk = true;
      const q = p.clone().setY(SEA_Y + .06);
      splashFx({pos:q});
      burst(q, 22, '#e2f7ff', 6.5, .19, .7, .7, 3.2);
      sfx('drop', q, .62, { range: 70, title: true });
    }
  },
  done(c) {
    c.boat.kick = 0;
    const { mesh } = c.tentacles;
    scene.remove(mesh, c.bang);
    mesh.geometry.dispose(); mesh.material.dispose(); mesh.dispose();
    c.bang.material.map.dispose(); c.bang.material.dispose();
  },
};
function titleBoatCamera(cam, look) {
  const c = TITLE.cm;
  if (c?.id !== 'gatoBoat' || TITLE.lt != null) return null;
  const hull = c.boat.mesh.position, t = c.t;
  const distance = 11.8 - 2.3 * smoothK(0, 2.92, t) + Math.max(0, 1 - camera.aspect) * 7;
  cam.copy(hull).addScaledVector(c.view, distance).setY(2.55);
  const follow = .72 + 1.12 * (1 - smoothK(0, 1.64, t)) + 1.2 * smoothK(3.65, 4.87, t);
  look.copy(hull).addScaledVector(c.out, follow).setY(.46);
  return 45;
}
const CAMEOS = {
  // Mattux: entra corriendo desde fuera, frena derrapando, espera impaciente y sale disparado hacia el sol
  mattux: { init(c) { c.f = [cmSpawn('mattux')]; c.z = 89; c.S = cmStage(-16, c.z); c.from = cmOff(c.S, c.z, 1); c.tIn = legT(c.from, c.S, 26) + .25; c.dur = c.tIn + 1.0 + 2.2; c.last = null; }, upd(c, t) {
    const f = c.f[0], x = f.anim.x;
    if (t < c.tIn - .25) { cmGo(c, f, c.from, c.S + 3, c.z, 26, 'run', t); x.ix = .7; ghostTrail(c, f, '#2f6bff'); }
    else if (t < c.tIn) { const u = (t - (c.tIn - .25)) / .25, px = c.S + 3 * (1 - EZ.out(u)); const sy = cmKeys(x, [[0, { ix: -.35, tx: -.3, by: -2.4, llx: -.9, lrx: .6, alx: .8, arx: .8, sy: .9 }], [1, { ix: -.1, by: -1, sy: 1 }, 'out']], u); cmPlace(f, px, c.z, CM_W, null, sy); emit(px + rand(-.3, .3), .2, c.z + rand(-.4, .4), rand(1, 3), rand(.5, 1.5), rand(-.6, .6), '#e8d9b0', .2, .5, .3, 2); }
    else if (t < c.tIn + 1.0) { const u = t - c.tIn; const sy = cmKeys(x, [[0, { alx: -1.35, arx: -1.35, alz: -.75, arz: .75 }], [.3, { alx: -1.35, arx: -1.35, alz: -.75, arz: .75, hy: 1.1, hx: -.1 }, 'back'], [.75, { alx: -1.35, arx: -1.35, alz: -.75, arz: .75, hy: 1.1, hx: -.1 }, 'hold'], [1.0, { by: -3.2, ix: .55, tx: .2, alx: .9, arx: .9, sy: .84 }, 'snap']], u); x.llx = Math.abs(Math.sin(u * 11)) * .32 * (u < .75 ? 1 : 0); cmPlace(f, c.S, c.z, CM_W, null, sy); }
    else { const u = t - c.tIn - 1.0, px = c.S - 95 * EZ.in(clamp(u / 1.6, 0, 1)); const sy = cmRun(x, u * 34, 1.25, .7); cmPlace(f, px, c.z, CM_W, null, sy);
      const pt = new V3(px, groundAt(px, c.z, 4) + .9, c.z); if (c.last) { slashLine(c.last, pt, '#2f6bff', .5, .24); slashLine(c.last, pt, '#ffffff', .32, .08); } c.last = pt;
      if (!c.go) { c.go = 1; ringAt(new V3(c.S, .2, c.z), '#2f6bff', 3.2, .35); burst(new V3(c.S, .3, c.z), 18, '#e8d9b0', 6, .2, .5, .3); ghost(f, '#2f6bff', .55, .3); sfx('dash', new V3(c.S, 0, c.z), .5); }
      f.model.root.visible = cmVisible(px, c.z) || u < .3; }
  } },
  // Javi: llega caminando desde fuera, gira la lanza, pose de héroe y se va por donde vino
  javi: { init(c) { c.f = [cmSpawn('javi')]; setSpear(c.f[0], true); c.z = 88; c.S = cmStage(-34, c.z); c.from = cmOff(c.S, c.z, 1); c.sp = Math.max(2.4, Math.abs(c.from - c.S) / 4.5); c.sty = c.sp > 4 ? 'run' : 'walk'; c.tIn = legT(c.from, c.S, c.sp); c.dur = c.tIn * 2 + 3.0; c.spin = 0; }, upd(c, t) {
    const f = c.f[0], x = f.anim.x, gr = f.model.gripRot;
    if (t < c.tIn) { cmGo(c, f, c.from, c.S, c.z, c.sp, c.sty, t); x.arx = -.45; f.anim.apply(); }
    else if (t < c.tIn + 3.0) { const u = t - c.tIn;
      const sy = cmKeys(x, [[0, { arx: -.45, by: -.5 }], [.25, { by: -1.6, ix: .12, arx: -.2, sy: .9 }, 'out'], [.45, { by: -2.2, ty: -.6, arx: .5, alx: -.6, sy: .88 }, 'io'], [.6, { by: -.8, ty: .5, arx: -1.6, alx: .4, sy: 1.06 }, 'snap'], [1.8, { by: -.8, ty: .2, arx: -1.5, alx: .3 }, 'io'], [2.1, { tx: -.12, hx: -.25, arx: -.2, arz: .1, alz: .35, llz: .14, lrz: -.14, sy: 1.04 }, 'back'], [2.7, { tx: -.12, hx: -.25, arx: -.2, arz: .1, alz: .35, llz: .14, lrz: -.14 }, 'hold'], [3.0, { arx: -.45 }, 'io']], u);
      cmPlace(f, c.S, c.z, CM_W, null, sy);
      if (gr) { const k = smoothK(.5, .8, u) * (1 - smoothK(1.6, 1.9, u)); c.spin += k * 28 / 60; gr.rotation.set(u > 1.9 ? 0 : c.spin, 0, 0); if (k > .5 && Math.random() < .5) emit(c.S + rand(-.6, .6), 1.3 + rand(-.4, .6), c.z + rand(-.6, .6), 0, rand(.5, 1.5), 0, '#3fa9ff', .12, .4, 0, 2); } }
    else { cmGo(c, f, c.S, c.from, c.z, c.sp, c.sty, t - c.tIn - 3.0); x.arx = -.45; f.anim.apply(); }
  } },
  // ItzUkyo: llega caminando, guardia, dos tajos de fuego, envaina, reverencia y se va
  ukyo: { init(c) { c.f = [cmSpawn('ukyo')]; c.z = 86; c.S = cmStage(-30, c.z); c.from = cmOff(c.S, c.z, 1); c.sp = Math.max(2.4, Math.abs(c.from - c.S) / 4.5); c.sty = c.sp > 4 ? 'run' : 'walk'; c.tIn = legT(c.from, c.S, c.sp); c.dur = c.tIn * 2 + 5.0; }, upd(c, t) {
    const f = c.f[0], x = f.anim.x;
    if (t < c.tIn) { cmGo(c, f, c.from, c.S, c.z, c.sp, c.sty, t); return; }
    if (t >= c.tIn + 5.0) { cmGo(c, f, c.S, c.from, c.z, c.sp, c.sty, t - c.tIn - 5.0); return; }
    const u = t - c.tIn, G0 = { llz: .2, lrz: -.2, by: -1.6, ix: .1 };
    if (!f.spearOut && u > .2 && u < 3.6 && f.spear) setSpear(f, true);
    const sy = cmKeys(x, [[0, {}], [.5, Object.assign({ arx: -.9, alx: -.6 }, G0), 'back'],
      [1.0, Object.assign({ ty: -1.05, tx: .2, arx: -1.3, alx: -.8, sy: .92 }, G0), 'io'], [1.08, Object.assign({ ty: 1.15, tx: .38, arx: -1.85, alx: .35, sy: 1.08 }, G0), 'snap'], [1.6, Object.assign({ ty: .95, tx: .3, arx: -1.75, alx: .3 }, G0), 'hold'],
      [2.3, Object.assign({ ty: .9, tx: .2, arx: -2.6, alx: -.3 }, G0), 'io'], [2.38, Object.assign({ ty: -1.1, tx: .4, arx: -1.2, alx: -.2, sy: 1.08 }, G0), 'snap'], [3.0, Object.assign({ ty: -.9, tx: .3, arx: -1.1 }, G0), 'hold'],
      [3.6, { arx: -.3, alx: -.3 }, 'io'], [4.2, { tx: .45, hx: .25 }, 'back'], [4.7, { tx: .45, hx: .25 }, 'hold'], [5.0, {}, 'io']], u);
    const fx = (k, t0, dir) => { if (u >= t0 && !c[k]) { c[k] = 1; const o = new V3(c.S, groundAt(c.S, c.z, 4) + 1.25, c.z), a1 = o.clone().add(new V3(-1.4, .5, 1.6 * dir)), a2 = o.clone().add(new V3(-1.6, -.2, -1.6 * dir)); slashLine(a1, a2, '#e0263a', .35, .35); slashLine(a1, a2, '#ffd27a', .25, .12); burst(o.clone().add(new V3(-1.5, 0, 0)), 26, '#e0263a', 9, .18, .5, 0); ghost(f, '#e0263a', .45, .22); sfx('swing', o, .5); } };
    fx('a', 1.06, 1); fx('b', 2.36, -1); if (u > 3.7 && f.spearOut) setSpear(f, false);
    cmPlace(f, c.S, c.z, CM_W, null, sy);
  } },
  // Redbird: llega caminando, mano al visor, carga, dispara con retroceso y se va
  redbird: { init(c) { c.f = [cmSpawn('redbird')]; c.z = 86; c.S = cmStage(-24, c.z); c.from = cmOff(c.S, c.z, 1); c.sp = Math.max(2.4, Math.abs(c.from - c.S) / 4.5); c.sty = c.sp > 4 ? 'run' : 'walk'; c.tIn = legT(c.from, c.S, c.sp); c.dur = c.tIn * 2 + 4.0; }, upd(c, t) {
    const f = c.f[0], x = f.anim.x;
    if (t < c.tIn) { cmGo(c, f, c.from, c.S, c.z, c.sp, c.sty, t); return; }
    if (t >= c.tIn + 4.0) { cmGo(c, f, c.S, c.from, c.z, c.sp, c.sty, t - c.tIn - 4.0); return; }
    const u = t - c.tIn;
    const sy = cmKeys(x, [[0, {}], [.6, { arx: -2.25, arz: .45, hx: .1 }, 'back'], [1.5, { arx: -2.25, arz: .45, by: -1.4, tx: .15, hx: .15, sy: .93 }, 'io'], [1.6, { arx: -2.1, arz: .45, by: .5, tx: -.28, hx: -.25, ix: -.08, sy: 1.06 }, 'snap'], [2.3, { arx: -2.1, arz: .45, by: .2, tx: -.2, hx: -.2 }, 'hold'], [3.0, { arx: -.3 }, 'io'], [3.5, { hy: .5 }, 'back'], [4.0, {}, 'io']], u);
    cmPlace(f, c.S, c.z, CM_W, null, sy);
    if (u > .7 && u < 1.55 && Math.random() < .6) { const o = f.model.head.localToWorld(new V3(0, 4 * PX, 5 * PX)); emit(o.x + rand(-.3, .3), o.y + rand(-.3, .3), o.z + rand(-.3, .3), 0, rand(.3, 1), 0, '#ff3a3a', .12, .4, 0, 2); }
    if (u > 1.6 && u < 2.3) { const o = f.model.head.localToWorld(new V3(0, 4 * PX, 6 * PX)), d = CITY.sunDisc.position.clone().sub(o).normalize(), e = o.clone().addScaledVector(d, 150), w = 1 - (u - 1.6) / .7; slashLine(o, e, '#ff3a3a', .1, .34 * w + .06); slashLine(o, e, '#ffffff', .08, .12 * w + .03); if (!c.b) { c.b = 1; burst(o, 18, '#ff3a3a', 7, .14, .35, 0); ringAt(o, '#ff3a3a', 2, .3); sfx('zap', o, .5); } }
  } },
  // Rocket: llega columpiándose con tela desde fuera, aterriza aplastado, saluda y se va igual
  rocket: { init(c) { c.f = [cmSpawn('rocket')]; c.z = 87; c.S = cmStage(-30, c.z); c.from = cmOff(c.S, c.z, 1); c.tIn = 1.3; c.dur = c.tIn * 2 + 2.2; }, upd(c, t) {
    const f = c.f[0], x = f.anim.x;
    const swing = (a0, a1, k) => { const e = EZ.io(k), px = a0 + (a1 - a0) * e, py = groundAt(px, c.z, 4) + Math.sin(k * Math.PI) * 5; cmReset(x); Object.assign(x, { arx: -2.9, alx: .6, ix: .45, llx: .5, lrx: -.3, hx: -.3 }); cmPlace(f, px, c.z, a1 < a0 ? CM_W : CM_E, py, 1 + Math.sin(k * Math.PI) * .12); slashLine(new V3(px, py + 1.6, c.z), new V3((a0 + a1) / 2, 9, c.z), '#ffffff', .1, .06); };
    if (t < c.tIn) { swing(c.from, c.S, t / c.tIn); if (!c.z1) { c.z1 = 1; sfx('whoosh', new V3(c.S, 2, c.z), .5); } }
    else if (t < c.tIn + 2.2) { const u = t - c.tIn; const sy = cmKeys(x, [[0, { by: -3, ix: .2, sy: .82 }], [.25, { by: 0, sy: 1.05 }, 'back'], [.5, { arx: -2.9, arz: .2 }, 'back'], [1.8, { arx: -2.9, arz: .2 }, 'hold'], [2.2, { by: -3, ix: .3, arx: -2.9, sy: .85 }, 'snap']], u); if (u > .5 && u < 1.8) x.arz = .2 + Math.sin(u * 14) * .45; if (u < .1 && !c.l) { c.l = 1; burst(new V3(c.S, .3, c.z), 14, '#e8d9b0', 5, .18, .4, .3); } cmPlace(f, c.S, c.z, CM_W, null, sy); }
    else swing(c.S, c.from, (t - c.tIn - 2.2) / c.tIn);
  } },
  // ElRandi: entra corriendo desde fuera con los brazos arriba, las llamas detrás, y se pierde hacia el sol
  randi: { init(c) { c.f = [cmSpawn('randi')]; c.z = 90; c.from = cmOff(-30, c.z, 1) + 12; c.to = c.from - 120; c.dur = legT(c.from, c.to, 11); c.ll = []; for (let i = 0; i < 4; i++) { const g = DOM_ANIMALS[[0, 2, 3, 0][i]](); g.scale.setScalar(.8); scene.add(g); c.ll.push(g); } }, upd(c, t) {
    const f = c.f[0], x = f.anim.x, px = c.from - 11 * t, hop = Math.max(0, Math.sin(t * 6.5)) ** 3 * .45; const sy = cmRun(x, t * 15, 1.1, .2); x.alx = -2.8 + Math.sin(t * 15) * .35; x.arx = -2.8 - Math.sin(t * 15) * .35; x.alz = -.45; x.arz = .45; x.hx = -.35 + Math.sin(t * 30) * .08;
    cmPlace(f, px, c.z, CM_W, groundAt(px, c.z, 4) + hop, sy); c.ll.forEach((g, i) => { const gx = px + 5 + i * 2.4, gz = c.z + (i % 2 ? 1.4 : -1.4), b = Math.abs(Math.sin(t * 13 + i)); g.position.set(gx, groundAt(gx, gz, 4) + b * .35, gz); g.rotation.y = CM_W; g.scale.set(.8, .8 * (1 + (b - .5) * .08), .8); });
    if (Math.random() < .5) emit(px + 4 + rand(-3, 3), .2, c.z + rand(-2, 2), rand(-1, 1), rand(.5, 1.5), rand(-1, 1), '#e8d9b0', .16, .6, .2, 2);
  }, done(c) { for (const g of c.ll) scene.remove(g); } },
  // ElGato: entra de puntillas con sus copias, se congela al notar la cámara, salta del susto y huye por donde vino
  gato: { init(c) { c.f = [cmSpawn('gato'), cmSpawn('gato'), cmSpawn('gato')]; c.f.slice(1).forEach(f => f.model.root.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .42; } })); c.z = 89; c.S = cmStage(-28, c.z); c.from = cmOff(c.S, c.z, 1); c.sp = Math.max(2.2, Math.abs(c.from - c.S) / 5); c.tIn = legT(c.from, c.S, c.sp); c.dur = c.tIn + 1.4 + legT(c.S, c.from, 9) + .6; }, upd(c, t) {
    c.f.forEach((f, i) => { const x = f.anim.x, z = c.z + [0, 1.5, -1.5][i], d0 = i * .35, tt = t - d0;
      if (tt < 0) { f.model.root.visible = false; return; }
      if (tt < c.tIn) cmGo(c, f, c.from, c.S + i * 1.2, z, c.sp, 'sneak', tt);
      else if (tt < c.tIn + 1.4) { const u = tt - c.tIn; const sy = cmKeys(x, [[0, { ix: .32, tx: .15, alx: -1.25, arx: -1.25, by: -2 }], [.25, { hy: 1.3, hx: -.1, by: -1.5 }, 'snap'], [.8, { hy: 1.3, hx: -.1, by: -1.5 }, 'hold'], [.95, { by: -3, sy: .8, alx: -.2, arx: -.2 }, 'snap'], [1.15, { by: 1.5, alx: -2.9, arx: -2.9, alz: -.6, arz: .6, hy: 1.3, sy: 1.15 }, 'back'], [1.4, { by: 0, hy: 0 }, 'io']], u); cmPlace(f, c.S + i * 1.2, z, CM_W, groundAt(c.S, z, 4) + (u > .95 && u < 1.4 ? Math.sin((u - .95) / .45 * Math.PI) * .9 : 0), sy); }
      else cmGo(c, f, c.S + i * 1.2, c.from, z, 9, 'run', tt - c.tIn - 1.4);
      if (i > 0) f.model.root.visible = f.model.root.visible && Math.floor(t * 9 + i) % 5 !== 0;
    });
  } },
  jesuluto: { dur: 6, init(c) { const d = document.createElement('div'); d.id = 'tclippy'; d.innerHTML = '<b>📎</b><span>¡Parece que estás viendo el atardecer!<br><small>¿Necesitas ayuda con eso?</small></span>'; $('title').appendChild(d); c.el = d; }, upd(c, t) { c.el.classList.toggle('on', t > .3 && t < 5.4); }, done(c) { if (c.el) c.el.remove(); } },
};
// estela de imágenes residuales mientras corre rápido
function ghostTrail(c, f, col) { c.gt = (c.gt || 0) + 1; if (c.gt % 4 === 0) ghost(f, col, .4, .2); }
const CAMEO_IDS = Object.keys(CAMEOS);
function titleCameo(dt, t) {
  let C = TITLE.cm;
  if (!C) {
    if (t < (TITLE.nextCm == null ? 6 : TITLE.nextCm) || TITLE.lt != null) return;
    const ids = CAMEO_IDS.filter(i => i !== G.charId && CHARS[i] && i !== TITLE.lastCm); if (!ids.length) return;
    const repairAt = TITLE.wreck?.repairAt ?? Infinity;
    const boat = !TITLE.sek && TITLE.lastCm !== 'gatoBoat' && t + TITLE_BOAT_DUR + .3 < repairAt && Math.random() < .36 ? titleRedBoat() : null;
    const id = boat ? 'gatoBoat' : ids[(Math.random() * ids.length) | 0];
    const def = boat ? TITLE_BOAT_CAMEO : CAMEOS[id];
    C = TITLE.cm = { id, def, t: 0, boat }; TITLE.lastCm = id; def.init(C);
  }
  C.t += dt; C.def.upd(C, C.t);
  if (C.t >= (C.dur || C.def.dur)) cameoEnd();
}
function cameoEnd() {
  const C = TITLE.cm; if (!C) return; if (C.def.done) C.def.done(C);
  for (const f of C.f || []) { scene.remove(f.model.root); disposeModel(f.model); }
  TITLE.cm = null; TITLE.nextCm = TITLE.t + rand(9, 14);
}
function titleSekzaEnd() {
  const K = TITLE.sek; if (!K) return; if (K.bang) scene.remove(K.bang); scene.remove(K.model.root); disposeModel(K.model); for (const g of K.gulls) scene.remove(g);
  TITLE.sek = null; TITLE.nextSek = TITLE.t + 48;
}
function bangSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d', { willReadFrequently: true }); g.lineJoin = 'round';
  g.font = '900 120px Impact,Arial Black,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 16; g.strokeStyle = '#000'; g.strokeText('!', 64, 66); g.lineWidth = 6; g.strokeStyle = '#fff'; g.strokeText('!', 64, 66); g.fillStyle = '#ff2d4a'; g.fillText('!', 64, 66);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false })); sp.renderOrder = 30; sp.visible = false; return sp;
}
const outBack = k => { k = clamp(k, 0, 1); const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

  return { CAMEOS, CAMEO_IDS, CM_E, CM_W, EZ, TITLE_LIFT, TITLE_THROW, bangSprite, cameoEnd, cmGo, cmKeys, cmOff, cmPlace, cmReset, cmRun, cmSneak, cmSpawn, cmStage, cmVisible, cmWalk2, finishTitleRepair, ghostTrail, legT, outBack, smoothK, startTitleRepair, titleBoatCamera, titleCameo, titleRepairCamera, titleSekzaEnd, updateTitleRepair };
};
