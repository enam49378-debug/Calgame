/* Habilidad: Sobrecarga del Visor  ·  personaje: redbird  ·  movimiento: rbOverload
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// 1 · mantener para cargar y soltar para disparar
CF.mover('rbOverload', function (f, o) {
    if (f.awak > 0) javiSpeak(f, 'skill');   // voz de la habilidad en la ulti

    const LV = [.55, 1.2, 1.9], MAXC = 2.5, COL = ['#ff2d55', '#ff7a1a', '#ffe14d', '#ffffff'], NAME = ['CARGANDO…', 'NIVEL 1', 'NIVEL 2', '¡NIVEL MÁXIMO!'];
    const lvl = t => (t >= LV[2] ? 3 : t >= LV[1] ? 2 : t >= LV[0] ? 1 : 0), hold = o.hold || rand(.8, 2.2);
    startAction(f, { name: 'rbCharge', dur: MAXC + 1, bbClip: 'despertar_carga', anim: [[0, 'visorTouch', 700]], speedMul: .12, aim: true, eyes: true });
    const fire = L => {
      seqEnd(f);
      if (L < 1) { popText(chestOf(f), 'Sin carga', '#aab', 16); endAction(f); f.cd[o.slot] = 1.5; return; }
      const P = [null, { len: 24, width: .6, dur: .7, dmg: 2.4, push: 5 }, { len: 32, width: 1, dur: 1, dmg: 3.4, push: 9 }, { len: 42, width: 1.7, dur: 1.5, dmg: 4.6, push: 15, gb: true }][L];
      MOVES.beam(f, Object.assign({ eyes: true, charge: .1, color: COL[L], bbClip: 'despertar_disparo' }, P));
      const F = fwd(f.yaw); f.vel.x -= F.x * (2 + L * 2); f.vel.z -= F.z * (2 + L * 2);
      if (f.isPlayer) { G.fovKick = Math.max(G.fovKick, 4 + L * 3); G.shake = Math.max(G.shake, .25 * L); }
    };
    seqStart(f, {
      slot: o.slot, lock: true, lv: 0, autoOnly: true,
      auto: (s, k) => k === 'held' && s.t < hold,
      onCancel: () => { if (f.action && f.action.name === 'rbCharge') endAction(f); },
      step(f, s, i) {
        const L = lvl(s.t), org = front(f, .35, 1.72);
        if (f.hurtT > 0 && s.t > .12) { popText(chestOf(f), '¡Carga interrumpida!', '#ff8899', 18); endAction(f); seqEnd(f); return; }
        if (L > s.lv) {
          s.lv = L; ringAt(org, COL[L], 2.2 + L * .5, .35, 'face', f.yaw); burst(org, 8 + L * 6, COL[L], 7, .16, .3, 0); sfx('zap', f.pos);
          if (f.isPlayer) G.shake = Math.max(G.shake, .1 * L);
        }
        const an = rand(0, TAU), rr = 1.2 + L * .35;
        emit(org.x + Math.cos(an) * rr, org.y + rand(-.8, .8), org.z + Math.sin(an) * rr, -Math.cos(an) * 8, rand(-1, 1), -Math.sin(an) * 8, COL[L], .12 + L * .03, .18, 0, 0);
        s.hud = { txt: NAME[L], pct: s.t / MAXC, col: COL[L] };
        if (s.t >= MAXC) {
          seqEnd(f); endAction(f);
          explode(f, chestOf(f), 4.5, { dmg: 6, kb: 10, up: 6, ragdoll: .6, color: COL[0] });
          f.stun = 1; popText(chestOf(f), '¡SOBRECARGA!', COL[0], 26); f.cd[o.slot] = 6;
        } else if (!i.held && s.t > .15) fire(L);
      },
    });
  });
