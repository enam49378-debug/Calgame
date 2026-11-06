/* Habilidad: Cadena Óptica  ·  personaje: redbird  ·  movimiento: rbChain
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// 4 · secuencia de flechas: cada acierto lo golpea desde ese lado; con las 4 lo lanza y lo remata un rayo del cielo
CF.mover('rbChain', function (f, o) {
    const tg = findTarget(f, 14); if (!tg) return false;
    const DIRS = [{ k: ['KeyW', 'ArrowUp'], g: '↑' }, { k: ['KeyA', 'ArrowLeft'], g: '←' }, { k: ['KeyS', 'ArrowDown'], g: '↓' }, { k: ['KeyD', 'ArrowRight'], g: '→' }];
    const CLIPS = ['despertar_golpe_a', 'despertar_golpe_b', 'despertar_golpe_d', 'despertar_golpe_c'], W = [1, .9, .8, .7], COL = '#ffe14d';
    const seqK = []; for (let n = 0; n < 4; n++) { let d; do d = Math.random() * 4 | 0; while (n && d === seqK[n - 1]); seqK.push(d); }
    const camF = fwd(cam.yaw), camR = rightOf(cam.yaw);
    const around = d => { const v = [camF.clone(), camR.clone().negate(), camF.clone().negate(), camR.clone()][d]; return clampArena(new V3(tg.pos.x + v.x * 2.1, 0, tg.pos.z + v.z * 2.1)); };
    const jump = d => {
      ghost(f, COL, .5, .3); const from = chestOf(f).clone(), q = around(d);
      f.pos.set(q.x, Math.max(groundAt(q.x, q.z), tg.pos.y), q.z); f.vel.set(0, 0, 0); f.yaw = yawTo(f, tg);
      ghost(f, COL, .35, .25); slashLine(from, chestOf(f), COL, .25, .14); ringAt(f.pos, COL, 2, .3); sfx('tp', f.pos);
    };
    const end = () => seqEnd(f);
    const fail = msg => {
      end(); popText(chestOf(f), msg, '#ff8899', 22);
      startAction(f, { name: 'rbFail', dur: .35, bbClip: 'despertar_golpe_c', speedMul: 0, aim: true, noControl: true });
      applyHit(f, tg, { dmg: 3, kb: 9, up: 3, color: COL, hitstop: .05, shake: .2 });
    };
    const finale = () => {
      end(); jump(2);
      startAction(f, { name: 'rbFinal', dur: 1.3, bbClip: 'despertar_final', speedMul: 0, noControl: true, aim: true, eyes: true });
      later(.3, () => { if (!tg.alive) return; applyHit(f, tg, { dmg: 5, kb: 0, up: 15, stun: 1.6, color: COL, hitstop: .08, shake: .3 }); sfx('heavy', tg.pos); });
      later(.75, () => {
        const P = tg.pos.clone(), top = new V3(P.x, P.y + 18, P.z), mid = chestOf(tg).clone();
        laserLeg(top, mid, '#ffffff', .7, .5); lightColumn(new V3(P.x, groundAt(P.x, P.z), P.z), COL, 30); sfx('ult', P);
        explode(f, new V3(P.x, mid.y, P.z), 3.6, { dmg: 12, kb: 8, up: 4, ragdoll: 1.4, color: COL, guardBreak: true, hitstop: .14, shake: .6 });
      });
    };
    startAction(f, { name: 'rbDash', dur: 99, bbClip: 'despertar_blink', speedMul: 0, noControl: true, aim: true, eyes: true });
    jump(2);
    const acc = rand(.6, .85);
    seqStart(f, {
      slot: o.slot, lock: true, i: 0, ph: 'dash', pt: 0, react: rand(.25, .55),
      onCancel: () => { if (f.action && /^rb/.test(f.action.name)) endAction(f); },
      step(f, s, ctl) {
        f.iframes = Math.max(f.iframes, .2);
        if (!tg.alive) { end(); endAction(f); return; }
        f.yaw = yawTo(f, tg);
        const glyphs = () => seqK.map((d, n) => n < s.i ? '✔' : n === s.i ? '[' + DIRS[d].g + ']' : DIRS[d].g).join('   ');
        if (s.ph === 'dash') {
          s.hud = { txt: '¡PREPARATE!', pct: 1 - s.t / .4, col: COL };
          if (s.t >= .4) { s.ph = 'ask'; s.pt = s.t; startAction(f, { name: 'rbWait', dur: 99, bbClip: 'despertar_espera', speedMul: 0, noControl: true, aim: true, eyes: true }); }
        } else if (s.ph === 'ask') {
          const left = W[s.i] - (s.t - s.pt); let got = -1;
          if (f.isPlayer) { for (let d = 0; d < 4; d++) if (DIRS[d].k.some(k => pressed.has(k))) got = d; }
          else if (s.t - s.pt > s.react) got = Math.random() < acc ? seqK[s.i] : (seqK[s.i] + 1) % 4;
          s.hud = { txt: glyphs(), pct: left / W[s.i], col: COL };
          if (got >= 0) {
            if (got !== seqK[s.i]) { fail('¡TECLA EQUIVOCADA!'); return; }
            jump(got); s.ph = 'strike'; s.pt = s.t;
            startAction(f, { name: 'rbStrike', dur: .32, bbClip: CLIPS[got], speedMul: 0, noControl: true, aim: true });
            impactStar(chestOf(tg), COL, 1.8, .22);
            applyHit(f, tg, { dmg: [3, 4, 5, 6.5][s.i], stun: 1.1, kb: .6, up: 0, dir: fwd(f.yaw), color: COL, hitstop: .06, shake: .25 });
          } else if (left <= 0) fail('¡TARDE!');
        } else if (s.ph === 'strike') {
          s.hud = { txt: glyphs(), pct: 1, col: '#ffffff' };
          if (s.t - s.pt >= .3) {
            s.i++;
            if (s.i >= 4) finale();
            else { s.ph = 'ask'; s.pt = s.t; startAction(f, { name: 'rbWait', dur: 99, bbClip: 'despertar_espera', speedMul: 0, noControl: true, aim: true, eyes: true }); }
          }
        }
      },
    });
  });
