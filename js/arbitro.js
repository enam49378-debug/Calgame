/* ===== ÁRBITRO DE LA PARTIDA (reglas del servidor) =====
   Lo usa server/server.js: el servidor deja de ser un simple repetidor y pasa a ser quien decide la verdad del combate.
   El navegador sigue simulando el movimiento y las animaciones (si no, el juego iría con retraso), pero ya NO es quien manda en:
     · golpes: solo se reenvían a la víctima los golpes que el árbitro da por válidos (atacante vivo, víctima viva y cerca, ritmo y daño posibles,
       ningún golpe entre jugadores dentro del abismo ni entre mundos distintos)
     · vida: la vida que ven los demás es la del árbitro. Bajar vida siempre se acepta (solo te perjudica); subirla solo dentro de lo que
       dan las curaciones del juego; si un jugador ignora el daño que se le dio, el árbitro se lo aplica
     · muertes y K.O.: el árbitro cuenta muertes y bajas (con crédito solo si hubo golpes válidos del que dice haber matado)
     · reglas de la sala: solo las puede cambiar el anfitrión
     · todo lo que llega se sanea (números dentro de rango, textos limpios, tamaños máximos)
   No toca ni el DOM ni el juego: sirve en Node (require) y en el navegador (CF_ARBITRO). Probado en tests/arbitro.test.cjs. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CF_ARBITRO = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const L = {
    MAX_JSON: 24000,          // tamaño máximo de un estado
    RANGE: 100,               // distancia máxima atacante-víctima (los proyectiles de largo alcance cuentan)
    MAX_DMG: 60,              // daño máximo de un golpe suelto
    HITS_PER_S: 16,           // golpes por segundo (como el antitrampas del cliente)
    DMG_2S: 170,              // daño total en 2 s
    STRIKES: 10,              // rechazos en 5 s para silenciar a un jugador
    MUTE_MS: 15000,           // cuánto se silencian sus golpes
    HEAL_CAP: 75,             // curación instantánea máxima (lo más grande del juego: máquina del tiempo de Redbird, ~60)
    HEAL_RATE: 20,            // curación sostenida por segundo
    PEND_MS: 8000,            // tiempo que un golpe válido espera reflejarse en la vida de la víctima
    GOD_MIN: 150, GOD_RATIO: .92,   // ignora >92 % de ≥150 de daño válido en 8 s: se le aplica el 60 % de lo ignorado
    CREDIT_MS: 7000,          // un K.O. solo cuenta si ese jugador te pegó en los últimos 7 s
    RESPAWN_MS: 1500,         // revivir antes de esto es imposible (el juego espera 4 s)
  };
  const num = (v, a, b, d = 0) => { v = +v; return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
  const text = (s, n = 24) => typeof s === 'string' ? s.replace(/[<>&\u0000-\u001f]/g, '').slice(0, n) : '';

  function create(opts = {}) {
    const log = opts.log || (() => { });
    const P = new Map(), D = new Map();      // jugadores y dummies (los publica el anfitrión)
    const R = { hostH: 0, god: false };      // reglas vistas del anfitrión
    const fresh = id => ({ id, st: '', ch: '', hp: null, mh: 100, alive: true, deathT: -1e9, x: 0, y: 0, z: 0, ab: 0, t: 0, k: 0, d: 0, seqMax: 0, verd: new Map(), times: [], dmg: [], rej: [], mute: 0,
      pend: [], last: new Map(), tok: L.HEAL_CAP, tokT: 0, ign: 0, auth: 0, winT: 0, corrT: 0, flags: 0, hits: 0, rejected: 0 });
    const get = id => { let p = P.get(id); if (!p) { p = fresh(id); P.set(id, p); } return p; };

    const refill = (p, now) => { if (p.tokT) p.tok = Math.min(L.HEAL_CAP, p.tok + (now - p.tokT) / 1000 * L.HEAL_RATE); p.tokT = now; };
    const consume = (p, loss) => { let rem = loss; for (const e of p.pend) { if (rem <= 0) break; const take = Math.min(e.dm - e.used, rem); if (take > 0) { e.used += take; rem -= take; } } };
    const correct = (p, why, out, now, force) => {
      if (!force && now - p.corrT < 300) return; p.corrT = now; p.flags++;
      out.push({ to: p.id, msg: { t: 'au', hp: Math.round(p.hp * 10) / 10, al: p.alive ? 1 : 0, k: p.k, d: p.d, why } });
    };
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

    function die(v, now, koBy, out, why, win = L.CREDIT_MS) {
      if (!v.alive) return; v.alive = false; v.hp = 0; v.deathT = now; v.d++; v.pend = [];
      let killer = null;
      const ok = id => { const k = id && id !== v.id ? P.get(id) : null; const t = k && v.last.get(id); return k && t != null && now - t <= win ? k : null; };
      killer = ok(koBy);
      if (!killer) { let bt = -1, bid = null; for (const [id, t] of v.last) if (now - t <= 4000 && t > bt && id !== v.id && P.has(id)) { bt = t; bid = id; } killer = bid ? P.get(bid) : null; }
      if (killer) { killer.k++; out.push({ to: killer.id, msg: { t: 'au', k: killer.k, d: killer.d } }); }
      out.push({ to: v.id, msg: { t: 'au', hp: 0, al: 0, k: v.k, d: v.d } });
      log(`K.O. ${v.id} ${killer ? 'por ' + killer.id : 'sin crédito'}${why ? ' (' + why + ')' : ''}`);
    }

    // ¿es válido este golpe? (devuelve null si sí, o el motivo; los motivos "mudos" no cuentan como intento de trampa)
    function judge(a, h, now) {
      const dm = +h.dm; if (!Number.isFinite(dm) || dm < 0) return 'daño';
      if (now < a.mute) return 'silenciado';
      if (!a.alive || a.st !== 'play') return 'mudo:atacante';
      const v = P.get(h.to) || D.get(h.to);
      if (!v || v === a) return 'mudo:destino';
      const isDummy = v.owner !== undefined;
      if (!v.alive || (!isDummy && v.st !== 'play')) return 'mudo:víctima';
      if ((a.ab ? 1 : 0) !== (v.ab ? 1 : 0)) return 'mundos';
      if (a.ab && v.ab && !isDummy) return 'abismo';       // sin PVP dentro del abismo
      if (dist(a, v) > L.RANGE) return 'distancia';
      a.times = a.times.filter(t => now - t < 1000); if (a.times.length >= L.HITS_PER_S) return 'ritmo';
      a.dmg = a.dmg.filter(e => now - e.t < 2000); if (a.dmg.reduce((s, e) => s + e.d, 0) + Math.min(dm, L.MAX_DMG) > L.DMG_2S) return 'daño total';
      return null;
    }

    function cleanState(d, isHost) {
      let raw; try { raw = JSON.stringify(d); } catch (e) { return null; }
      if (!raw || raw.length > L.MAX_JSON) return null;
      const f = JSON.parse(raw); if (!f || typeof f !== 'object' || Array.isArray(f)) return null;
      delete f.__proto__; delete f.constructor; delete f.prototype;
      if (f.x !== undefined) { f.x = num(f.x, -800, 800); f.z = num(f.z, -800, 1400); f.y = num(f.y, -300, 700); }
      f.mh = num(f.mh, 1, 300, 100); f.hp = num(f.hp, 0, f.mh, f.mh);
      f.nm = text(f.nm, 16); f.ch = text(f.ch, 24); f.st = text(f.st, 12);
      f.k = num(f.k, 0, 9999); f.d = num(f.d, 0, 9999);
      if (!isHost) delete f.rl;                                        // solo el anfitrión cambia las reglas de la sala
      if (Array.isArray(f.hits)) f.hits = f.hits.slice(0, 12).filter(h => h && typeof h === 'object'); else delete f.hits;
      if (Array.isArray(f.acts)) f.acts = f.acts.slice(0, 12); else if (f.acts !== undefined) delete f.acts;
      if (Array.isArray(f.j)) f.j = f.j.slice(0, 40).map(v => num(v, -20, 20));
      return f;
    }

    // estado de un jugador -> { d: lo que se reenvía a los demás, out: [{ to, msg }] mensajes para el árbitro de cada cliente }
    function presence(id, d, now, isHost) {
      const f = cleanState(d, isHost); if (!f) return null;
      const p = get(id), out = [], prevSt = p.st;
      refill(p, now);
      p.t = now; p.st = f.st; p.ch = f.ch;
      if (f.x !== undefined) { p.x = f.x; p.y = f.y; p.z = f.z; }
      p.ab = f.ab ? 1 : 0;
      if (isHost && f.rl && typeof f.rl === 'object') {
        R.god = !!f.rl.god;
        const h = f.rl.p && Number.isFinite(+f.rl.p.h) ? +f.rl.p.h : 0;
        if (h > R.hostH) { R.hostH = h; for (const q of P.values()) q.free = now + 4000; }      // el anfitrión lanzó "vida al máximo" a todos
        else R.hostH = Math.max(R.hostH, h);
      }
      const playing = f.st === 'play', repAlive = f.al === undefined ? true : !!f.al;
      if (playing && prevSt !== 'play') { p.k = 0; p.d = 0; p.alive = repAlive; p.hp = f.hp; p.mh = f.mh; p.pend = []; p.last.clear(); p.ign = p.auth = 0; p.winT = now; p.tok = L.HEAL_CAP; }
      if (playing) {
        if (p.hp === null) { p.hp = f.hp; p.alive = repAlive; p.mh = f.mh; }
        else if (f.mh !== p.mh) {   // cambio de peleador / despertar: la vida máxima cambia; solo se regala la diferencia de vida máxima (no se puede abusar subiéndola)
          const dMax = f.mh - p.mh; p.mh = f.mh;
          if (repAlive) { if (f.hp <= p.hp) p.hp = f.hp; else p.hp = Math.min(f.hp, p.hp + Math.max(0, dMax) + Math.max(0, p.tok)); }
        }
        else if (p.alive && !repAlive) die(p, now, f.ko && f.ko.by, out);
        else if (!p.alive && repAlive) {
          if (now - p.deathT >= L.RESPAWN_MS || R.god) { p.alive = true; p.hp = f.hp; p.pend = []; p.tok = L.HEAL_CAP; }
          else correct(p, 'no puedes reaparecer tan rápido', out, now);
        }
        else if (p.alive) {
          if (f.hp <= p.hp) { const loss = p.hp - f.hp; if (loss > 0) consume(p, loss); p.hp = f.hp; }
          else {
            const gain = f.hp - p.hp;
            if (R.god || now < (p.free || 0) || gain <= p.tok + .01) { p.tok = Math.max(0, p.tok - gain); p.hp = f.hp; }
            else { const ok = Math.max(0, p.tok); p.tok -= ok; p.hp += ok; log(`${id} intentó curarse +${Math.round(gain)} (permitido +${Math.round(ok)})`); correct(p, 'curación imposible', out, now); }
          }
        }
      }
      // golpes que dice haber dado
      const hitsOut = [];
      if (Array.isArray(f.hits)) for (const h of f.hits) {
        const s = Math.floor(+h.s); if (!(s > 0)) continue;
        if (p.verd.has(s)) { if (p.verd.get(s)) hitsOut.push(h); continue; }
        if (s < p.seqMax - 300) continue;
        const why = judge(p, h, now);
        p.verd.set(s, !why); if (p.verd.size > 80) p.verd.delete(p.verd.keys().next().value);
        p.seqMax = Math.max(p.seqMax, s);
        if (why) {
          if (!why.startsWith('mudo')) { p.rejected++; p.rej = p.rej.filter(t => now - t < 5000); p.rej.push(now); if (p.rej.length >= L.STRIKES && now >= p.mute) { p.mute = now + L.MUTE_MS; p.rej.length = 0; log(`${id} silenciado ${L.MUTE_MS / 1000}s (muchos golpes imposibles; último: ${why})`); } }
          continue;
        }
        const dm = Math.min(L.MAX_DMG, +h.dm);
        h.dm = dm; if (h.kb !== undefined) h.kb = num(h.kb, 0, 60); if (h.up !== undefined) h.up = num(h.up, 0, 60); if (h.rg !== undefined) h.rg = num(h.rg, 0, 8); if (h.st !== undefined) h.st = num(h.st, 0, 8); if (h.fz !== undefined) h.fz = num(h.fz, 0, 8);
        hitsOut.push(h); p.hits++; p.times.push(now); p.dmg.push({ t: now, d: dm });
        const v = P.get(h.to);
        if (v) { v.pend.push({ t: now, by: id, dm, used: 0 }); v.last.set(id, now); }
      }
      if (f.hits !== undefined) f.hits = hitsOut;
      // lo que ven los demás es lo que decide el árbitro
      if (playing && p.hp !== null) { f.hp = Math.round(p.hp * 10) / 10; f.mh = p.mh; f.al = p.alive ? 1 : 0; f.k = p.k; f.d = p.d; }
      return { d: f, out };
    }

    // cada ~250 ms: golpes válidos que la víctima no reflejó (ignorar el daño) y limpieza
    function tick(now) {
      const out = [];
      for (const p of P.values()) {
        if (p.hp === null) continue;
        while (p.pend.length && now - p.pend[0].t > L.PEND_MS) { const e = p.pend.shift(); p.ign += e.dm - e.used; p.auth += e.dm; }
        if (!p.winT) p.winT = now;
        if (p.auth >= L.GOD_MIN && !R.god && p.alive) {
          if (p.ign / p.auth >= L.GOD_RATIO) {
            const dmg = p.ign * .6; p.hp = Math.max(0, p.hp - dmg); log(`${p.id} ignoraba el daño (${Math.round(p.ign)}/${Math.round(p.auth)}): se le aplican ${Math.round(dmg)}`);
            if (p.hp <= 0) { let lh = null; for (const [id, t] of p.last) if (!lh || t > lh[1]) lh = [id, t]; die(p, now, lh && lh[0], out, 'daño ignorado', 15000); } else correct(p, 'el servidor aplicó daño que ignorabas', out, now, true);
          }
          p.ign = p.auth = 0; p.winT = now;
        } else if (now - p.winT > 20000) { p.ign = p.auth = 0; p.winT = now; }
      }
      return out;
    }

    function dummy(owner, id, d, now) {
      const f = cleanState(d, false); if (!f) return null;
      D.set(id, { id, owner, x: f.x || 0, y: f.y || 0, z: f.z || 0, alive: f.al === undefined ? true : !!f.al, ab: 0, st: 'play', t: now });
      return f;
    }
    function leave(id) { P.delete(id); for (const [k, v] of [...D]) if (v.owner === id || k === id) D.delete(k); }
    function stats() { return { players: [...P.values()].map(p => ({ id: p.id, hp: p.hp, alive: p.alive, k: p.k, d: p.d, hits: p.hits, rejected: p.rejected, flags: p.flags })) }; }
    return { presence, tick, dummy, leave, stats, get: id => P.get(id), limits: L };
  }
  return { create, LIMITS: L };
});
