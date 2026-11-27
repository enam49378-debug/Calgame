// Habilidades con secuencia de teclas y control
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_COMBATE = window.CF_COMBATE || {};

window.CF_COMBATE.crearSecuencias = function crearSecuencias(D) {
  'use strict';
  const { $, ARENA, G, TAU, V3, addFx, aimYawFor, angLerp, animeDashSmoke, applyHit, bbSet, burst, cam, chestOf, clamp, dist2d, doM1, endAction, enemiesOf, fwd, ghost, glowMat, impactFrame, javiSpeak, keys, later, mapNow, mountUpdate, popText, rand, ringAt, sebRemoteCtl, sekzaFlightControl, sfx, slashLine, sphereFlash, useSkill, useUlt, worldBig, wrapA, yawTo } = D;

// ================= Habilidades con secuencia de teclas =================
// f.seq = { slot, lock, step(f, s, i), auto(s, 'tap'|'held'), onCancel, hud }. Mientras exista, cada cuadro se llama a step con
// { down: se tocó la tecla de la habilidad, held: se mantiene, dt }. Los bots y los jugadores remotos usan s.auto en vez del teclado.
function seqHud(s) {
  const el = $('seqhud'); if (!el) return;
  if (!s || !s.hud) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden'); el.firstChild.textContent = s.hud.txt; el.firstChild.style.color = s.hud.col;
  const b = el.lastChild.firstChild; b.style.width = (clamp(s.hud.pct, 0, 1) * 100) + '%'; b.style.background = s.hud.col;
}
function seqEnd(f) { f.seq = null; if (f.isPlayer) seqHud(null); }
function seqCancel(f) { const s = f.seq; if (!s) return; seqEnd(f); if (s.onCancel) s.onCancel(s); }
function seqStart(f, s) {
  seqCancel(f); s.t = 0; f.seq = s;
  if (f.remote) { const pump = () => { if (f.seq === s) { seqTick(f, {}, .05); if (f.seq === s) later(.05, pump); } }; later(.05, pump); }
  return s;
}
function seqTick(f, c, dt) {
  const s = f.seq; s.t += dt;
  const A = s.autoOnly || !f.isPlayer;
  const down = A ? !!(s.auto && s.auto(s, 'tap')) : c.skill === s.slot;
  const held = A ? !!(s.auto && s.auto(s, 'held')) : !!keys['Digit' + (s.slot + 1)];
  s.step(f, s, { down, held, dt });
  if (f.seq === s && f.isPlayer) seqHud(s);
}
function laserLeg(a, b, col, w = .2, dur = .25) {
  const len = a.distanceTo(b) || .1, grp = new THREE.Group();
  const o1 = new THREE.Mesh(new THREE.BoxGeometry(w * 2, w * 2, len), glowMat(col, .6)), c1 = new THREE.Mesh(new THREE.BoxGeometry(w * .8, w * .8, len), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  grp.add(o1, c1); grp.position.copy(a).lerp(b, .5); grp.lookAt(b);
  addFx(grp, dur, (g, k) => { const q = 1 - k * .8; g.scale.set(q, q, 1); o1.material.opacity = .6 * (1 - k); c1.material.opacity = 1 - k; }, () => { o1.geometry.dispose(); o1.material.dispose(); c1.geometry.dispose(); c1.material.dispose(); });
}
function clampArena(v, m = 2) { if (v.z > 560) return v; if (worldBig() && !mapNow().circle) { const b = mapNow().b; v.x = clamp(v.x, b.x0 + m, b.x1 - m); v.z = Math.max(v.z, b.z0 + m); return v; } const d = Math.hypot(v.x, v.z), L = ARENA - m; if (d > L) { v.x *= L / d; v.z *= L / d; } return v; }
// ---------- tecnicas de movimiento (como en los battlegrounds de Roblox) ----------
// DASH CANCEL: hacer dash y usar una habilidad enseguida corta el resto del dash y la habilidad sale al instante.
//   dash hacia atras (backdash cancel): conserva parte del retroceso; en el aire llega mas lejos.
//   dash de lado (micro dash): el impulso es mas corto y rapido. Los golpes M1 NO cancelan el dash.
// RAGDOLL CANCEL: en el suelo, tirado en ragdoll, un dash de lado o hacia atras te levanta al instante (una vez cada RC_CD segundos).
//   Los golpes pesados de caida (noRC) lo impiden.
const RC_CD = 30, PERFECT_BLOCK = .22;
function blackFlashFx(f, p) {   // el rayo negro y rojo del Black Flash
  popText(p, 'BLACK FLASH', '#ff2a2a', 30); impactFrame('#000000', .16); sphereFlash(p, '#000000', 2.4, .3); sphereFlash(p, '#ff2a2a', 3.2, .22);
  for (let k = 0; k < 9; k++) { const a = rand(0, TAU), d = new V3(Math.cos(a), rand(-.4, .8), Math.sin(a)); slashLine(p.clone().addScaledVector(d, .3), p.clone().addScaledVector(d, rand(2.6, 4.2)), k % 2 ? '#ff2a2a' : '#000000', .26, .14); }
  burst(p, 30, '#ff2a2a', 11, .22, .6, .1); burst(p, 20, '#0a0a0a', 9, .26, .6, .1); ringAt(new V3(p.x, p.y - .8, p.z), '#ff2a2a', 4.2, .4); sfx('boom', p, .7); sfx('counter', p, .8);
  if (f.isPlayer) { G.slowT = Math.max(G.slowT, .35); G.fovKick = Math.max(G.fovKick, 9); }
}
// DASH DE FRENTE: si el dash conecta con un rival, le hace dano y lo arrastra con el dash. Si venias de tres golpes basicos (M1) lo manda rodando (shove).
function dashFrontHit(f, dt) {
  if (f.remote) return;
  const C = f.dashCarry;
  if (C) { if (C.g.alive && !C.g.remote && C.g.ragdoll <= 0) { C.g.vel.x = f.vel.x * .95; C.g.vel.z = f.vel.z * .95; } return; }   // arrastra a quien alcanzo mientras dura el dash
  if (f.dashHit) return;
  const F = fwd(f.yaw);
  for (const g of enemiesOf(f)) {
    if (!g.alive || g.iframes > 0 || g.ragdoll > 0 || Math.abs(g.pos.y - f.pos.y) > 1.8) continue;
    const dx = g.pos.x - f.pos.x, dz = g.pos.z - f.pos.z, d = Math.hypot(dx, dz);
    if (d > 1.7 || (dx * F.x + dz * F.z) / (d || 1) < .3) continue;
    f.dashHit = true;
    const shove = f.comboIdx >= 3 && G.time - (f.lastAtkT || -9) < 1.3;
    const r = applyHit(f, g, shove ? { dmg: 5, ragdoll: .8, kb: 12, up: 2, dir: F, color: f.ch.color, hitstop: .07, shake: .3 } : { dmg: 3.5, stun: .45, kb: g.remote ? 9 : 0, dir: F, color: f.ch.color, hitstop: .05, shake: .2 });
    if (r === true) { popText(chestOf(g), shove ? 'SHOVE' : 'EMBESTIDA', f.ch.color, 17); if (!shove && !g.remote) f.dashCarry = { g }; }
    break;
  }
}
function dashEnd(f) {   // se suelta a quien arrastraba
  f.dashHit = false; const C = f.dashCarry; f.dashCarry = null;
  if (C && C.g.alive && !C.g.remote && C.g.ragdoll <= 0) { C.g.vel.x *= .4; C.g.vel.z *= .4; }
}
function dashKindOf(f, dx, dz) {
  if (!dx && !dz) return 'front';
  let ref = f.yaw; if (f.isPlayer) ref = cam.yaw; else if (f.ai && f.ai.target && f.ai.target.alive) ref = yawTo(f, f.ai.target);
  f._dashRef = ref;
  const rel = Math.abs(wrapA(Math.atan2(dx, dz) - ref));
  return rel < .79 ? 'front' : rel > 2.36 ? 'back' : 'side';
}
function tryRagdollCancel(f, c) {
  const dx = c.mx, dz = c.mz, kind = dashKindOf(f, dx, dz);
  const say = (t, col) => { if (f.isPlayer && (f.rcMsgT || 0) < G.time) { f.rcMsgT = G.time + .9; popText(chestOf(f), t, col, 16); } };
  if (kind === 'front') { say('Dash de lado o atrás para cancelar', '#ffb020'); return false; }
  if ((f.rcBlockT || 0) > G.time) { say('NO SE PUEDE CANCELAR', '#ff5a5a'); return false; }
  if ((f.rcCd || 0) > 0) { say('RAGDOLL CANCEL en ' + Math.ceil(f.rcCd) + ' s', '#ffb020'); return false; }
  if (!f.onGround) return false;
  f.ragdoll = 0; f.stun = 0; f.hurtT = 0; f.getupT = 0; f.landT = 0; f.rcCd = RC_CD; f.iframes = Math.max(f.iframes, .4);
  f.vel.x = dx * 25; f.vel.z = dz * 25; f.vel.y = 0; f.dashT = .2; f.dashCd = 2; f.dashAnimT = f.dashAnimDur = .35; f.dashKind = kind; f.dashDir = 'front'; f.yaw = f._dashRef != null ? f._dashRef : f.yaw;
  const p = new V3(f.pos.x, f.pos.y + .1, f.pos.z); ringAt(p, '#7df9ff', 2.4, .4); burst(chestOf(f), 16, '#7df9ff', 7, .16, .4, .1); sfx('dash', f.pos);
  popText(chestOf(f), 'RAGDOLL CANCEL', '#7df9ff', 20); if (f.isPlayer) G.fovKick = Math.max(G.fovKick, 5);
  return true;
}
function dashCancel(f, sv) {
  dashEnd(f);
  const k = f.dashKind || 'front', m = k === 'back' ? (f.onGround ? .6 : .9) : k === 'side' ? 1.3 : .5;
  f.dashT = 0; f.dashAnimT = 0; f.dashRecT = 0; f.vel.x = sv.x * m; f.vel.z = sv.z * m;
  ghost(f, '#7df9ff', .5, .3); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#7df9ff', 1.6, .3);
  if (f.isPlayer) popText(chestOf(f), k === 'back' ? 'BACKDASH CANCEL' : k === 'side' ? 'MICRO DASH' : 'DASH CANCEL', '#7df9ff', 15);
}
function applyCtl(f, c, dt) {
  f.ctlJump = !!c.jump; f.ctlDown = !!c.down;
  if (f.mount) { mountUpdate(f, c, dt); return; }
  if (f.sebRem) { sebRemoteCtl(f, c, dt); c = { mx: 0, mz: 0, jump: false, dash: false, m1: false, block: false, skill: -1, ult: false, up: false }; }
  const can = f.alive && f.stun <= 0 && f.ragdoll <= 0 && f.frozen <= 0 && !f.grabbed;
  if (f.action && f.action.name === 'flourish' && (c.mx || c.mz || c.jump || c.block || c.dash)) endAction(f);
  const a = f.action;
  { const wb = f.blocking; f.blocking = can && !a && c.block; if (f.blocking && !wb) { f.blockT0 = G.time; javiSpeak(f, 'ev_block'); } else if (!f.blocking && wb) f.blockRelT = G.time; }
  let sp = 9 * f.ch.spd * (f.awak > 0 ? 1.15 : 1) * (f.fireT > 0 ? 1.2 : 1) * (f.pisco > 0 ? 1.3 : 1) * (f.turbo > 0 ? 1.35 : 1) * (f.buf > 0 ? .3 : 1) * (f.isPlayer ? G.rules.spd : 1);
  if (f.blocking) sp *= .3; if (a) sp *= (a.speedMul != null ? a.speedMul : .4); if (f.swim) sp *= .55; else if (f.wade) sp *= .8; if (!can) sp = 0;
  const moving = c.mx || c.mz;
  if (can && f.dashT <= 0 && !(a && a.noControl)) {
    const k = Math.min(1, (f.onGround ? 14 : 4) * dt);
    f.vel.x += (c.mx * sp - f.vel.x) * k; f.vel.z += (c.mz * sp - f.vel.z) * k;
  }
  // Shift Lock (como en Roblox): el personaje siempre mira hacia donde apunta la cámara
  if (can && f.isPlayer && G.shiftLock && !(a && (a.lockYaw || a.noControl))) f.yaw = angLerp(f.yaw, a ? aimYawFor(f) : cam.yaw, Math.min(1, 20 * dt));
  else if (can && !(a && a.lockYaw)) {
    const tgt = f.ai && f.ai.target && f.ai.target.alive ? f.ai.target : null;
    if (a || f.blocking || (tgt && dist2d(f, tgt) < 6 && f.ai.flee <= 0)) {
      if (!(a && a.noControl)) f.yaw = angLerp(f.yaw, aimYawFor(f), Math.min(1, (a && a.name === 'beam' ? 2.5 : 16) * dt));
    } else if (moving) f.yaw = angLerp(f.yaw, Math.atan2(c.mx, c.mz), Math.min(1, 12 * dt));
  }
  if (f.seq) { if (!can || (f.seq.lock && c.dash && !a)) seqCancel(f); else { seqTick(f, c, dt); if (f.seq && f.seq.slot === c.skill) c.skill = -1; } }
  if (!can) { if (f.alive && f.ragdoll > 0 && c.dash && !f.grabbed && f.frozen <= 0 && !f.sceneLock && !f.cineLock && !f.choreTrack && !f.seq) tryRagdollCancel(f, c); return; }
  sekzaFlightControl(f,c,dt);
  if (f.ch.wings && f.awak > 0 && c.jump && !f.onGround && f.vel.y < -2.2 && !a) f.vel.y = -2.2;
  // SALTO como en los battlegrounds de Roblox: se guarda un instante si lo pulsas durante un golpe, y pierde fuerza si saltas muchas veces seguidas (cansancio de salto)
  if (c.jump && !f.jumpHeld) f.jumpBufT = .3; f.jumpHeld = !!c.jump;
  if ((c.jump || f.jumpBufT > 0) && f.onGround && !a && !f.blocking) {
    const fat = f.jumpFat || 0; f.vel.y = 11.5 * clamp(1 - .17 * fat, .5, 1); f.jumpFat = Math.min(5, fat + 1); f.jumpBufT = 0;
    f.onGround = false; f.dashAnimT = 0; sfx('jump', f.pos); f.anim.v.by -= 30; javiSpeak(f, 'ev_jump');
  }
  if (c.dash && f.dashCd <= 0 && !a && (f.onGround || f.airDash)) { animeDashSmoke(f);
    let dx = c.mx, dz = c.mz; if (!dx && !dz) { const F = fwd(f.isPlayer ? cam.yaw : f.yaw); dx = F.x; dz = F.z; }
    f.vel.x = dx * 25; f.vel.z = dz * 25; if (!f.onGround) { f.airDash = false; f.vel.y = Math.max(f.vel.y, 2); }
    const tgt = !f.isPlayer && f.ai && f.ai.target && f.ai.target.alive ? f.ai.target : null;
    const locked = (f.isPlayer && G.shiftLock) || !!(tgt && dist2d(f, tgt) < 6 && f.ai.flee <= 0);
    const refYaw = f.isPlayer && G.shiftLock ? cam.yaw : f.yaw, dYaw = Math.atan2(dx, dz), dRel = wrapA(dYaw - refYaw);
    const dSet = bbSet(f.ch.id), dir = locked ? (Math.abs(dRel) > 2.36 ? 'back' : dRel > .79 ? 'left' : dRel < -.79 ? 'right' : 'front') : 'front';
    const dName = dir === 'back' ? 'esquive_atras' : dir === 'left' ? 'esquive_izq' : dir === 'right' ? 'esquive_der' : 'esquive';
    if (locked && dSet && dSet[dName]) { f.yaw = refYaw; f.dashDir = dir; }
    else { f.yaw = dYaw; f.dashDir = 'front'; }
    const dClip = dSet && (dSet[dName] || dSet.esquive);
    f.dashAnimDur = dClip ? dClip.length : .35; f.dashAnimT = f.dashAnimDur;
    f.dashT = .2; f.dashCd = 1.4; f.iframes = Math.max(f.iframes, .16); f.blocking = false; f.dashKind = dashKindOf(f, dx, dz); f.dashHit = false; f.dashCarry = null; if (f.m1cd > .25) f.m1cd = .25; javiSpeak(f, 'ev_dash');
    sfx('dash', f.pos); burst(new V3(f.pos.x, .3, f.pos.z), 10, '#d8d0c0', 4, .2, .4, .2, 2);
    if (f.isPlayer) G.fovKick = Math.max(G.fovKick, 5);
  }
  if (f.seq && f.seq.lock) return;
  if (f.dashT > 0 && f.dashKind === 'front') dashFrontHit(f, dt);
  if (c.m1 && !f.m1Held) f.m1BufT = .16; f.m1Held = !!c.m1;
  if ((c.m1 || f.m1BufT > 0) && !f.blocking && f.dashT <= 0 && f.dashRecT <= 0) { doM1(f, c.up); if (f.action && f.action.name === 'm1') f.m1BufT = 0; }   // el M1 no cancela el dash
  const busy = f.action && !f.action.soft, dashing = f.dashT > 0 || f.dashRecT > 0, sv = dashing ? f.vel.clone() : null;
  if (c.skill >= 0 && !busy && !f.blocking) { const cd0 = f.cd[c.skill]; useSkill(f, c.skill); if (dashing && f.cd[c.skill] > cd0 + .01) dashCancel(f, sv); }   // DASH CANCEL: la habilidad corta el dash
  if (c.ult && !busy && f.ult >= 100) { const u0 = f.ult, a0 = f.awak; useUlt(f); if (dashing && (f.ult < u0 || f.awak > a0)) dashCancel(f, sv); }
}

  return { PERFECT_BLOCK, applyCtl, blackFlashFx, clampArena, dashEnd, laserLeg, seqCancel, seqEnd, seqHud, seqStart, seqTick };
};
