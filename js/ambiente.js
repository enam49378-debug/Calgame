/* ===== AMBIENTE DE LA SALA: clima, hora y rayos =====
   Un solo código para los dos lados (antes eran dos copias que se habían separado):
     · el servidor: server/ambiente.js lo crea con los edificios de server/mapa.json
     · el juego:    game.js lo crea con CITY_PLAN (window.CF_AMBIENTE)
   Es determinista: con la misma semilla y los mismos pasos, todos calculan el mismo clima.
   El ciclo de clima automático depende del mapa (estado.mapa: 'A' Ciudad Aurora, 'J' Selva Esmeralda, 'B' Valle Sakura) y viaja dentro del estado,
   así el anfitrión, el servidor y los demás jugadores usan siempre el mismo ciclo.
   Probado en tests/ambiente.cjs. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CF_AMBIENTE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PRESETS = {
    clear:    { rain: 0,   cloud: .04, fog: .08, snow: 0,  wind: .2 },
    cloudy:   { rain: 0,   cloud: .8,  fog: .25, snow: 0,  wind: .35 },
    drizzle:  { rain: .28, cloud: .75, fog: .48, snow: 0,  wind: .25 },
    rain:     { rain: .72, cloud: .9,  fog: .6,  snow: 0,  wind: .55 },
    storm:    { rain: 1,   cloud: 1,   fog: .78, snow: 0,  wind: 1 },
    fog:      { rain: 0,   cloud: .55, fog: .85, snow: 0,  wind: .1 },
    densefog: { rain: .08, cloud: .7,  fog: 1,   snow: 0,  wind: .08 },
    wind:     { rain: 0,   cloud: .48, fog: .3,  snow: 0,  wind: 1 },
    snow:     { rain: 0,   cloud: .7,  fog: .5,  snow: .7, wind: .3 },
    blizzard: { rain: 0,   cloud: .95, fog: .92, snow: 1,  wind: 1 },
  };

  // ciclo automático de cada mapa: [clima, segundos]
  const CICLOS = {
    A: [['clear', 80], ['cloudy', 50], ['drizzle', 65], ['rain', 85], ['storm', 85], ['fog', 70], ['densefog', 60], ['wind', 55], ['snow', 80], ['blizzard', 65]],
    J: [['clear', 70], ['cloudy', 45], ['drizzle', 60], ['rain', 90], ['storm', 75], ['fog', 55], ['clear', 50], ['wind', 40]],
    B: [['clear', 70], ['cloudy', 45], ['drizzle', 60], ['fog', 75], ['snow', 80], ['clear', 65], ['wind', 50], ['densefog', 45]],   // Valle Sakura: sin tormentas
  };

  const CANALES = ['rain', 'cloud', 'fog', 'snow', 'wind'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round = v => Math.round(v * 1000) / 1000;
  const mapaValido = m => (Object.prototype.hasOwnProperty.call(CICLOS, m) ? m : 'A');

  function hash(text) {
    let n = 2166136261;
    for (const c of String(text)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return n >>> 0;
  }
  function random(s) {
    s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
    return s.rng / 4294967296;
  }

  /**
   * @param {object} o
   * @param {Array<Array<number>>} o.edificios  [x, z, ancho, fondo, alto, ...] de cada edificio (para refugios y dónde cae un rayo)
   * @param {() => {bounds:number, arena:number}} o.limites  borde jugable de la ciudad y radio máximo aceptado en los paquetes
   */
  function crear({ edificios, limites }) {
    const buildings = edificios;

    function kind(s) {
      if (s.mode !== 'auto') return s.mode;
      const seq = CICLOS[mapaValido(s.mapa)];
      let total = 0;
      for (const q of seq) total += q[1];
      let t = s.elapsed % total;
      for (const [k, d] of seq) { if (t < d) return k; t -= d; }
      return 'clear';
    }

    function create(seed = 8197) {
      return { v: 3, t: 0, hour: 11, cycle: true, mode: 'auto', mapa: 'A', elapsed: 0, rain: 0, cloud: .04, fog: .08, snow: 0, wind: .2, wet: 0, fogStrength: 1.15,
        seed: seed >>> 0, rng: seed >>> 0, seq: 0, nextStrike: 12, strikes: [] };
    }

    function command(s, c) {
      if (!c || typeof c !== 'object') return false;
      let ok = false;
      if (typeof c.mode === 'string' && (c.mode === 'auto' || PRESETS[c.mode])) { s.mode = c.mode; s.elapsed = 0; s.nextStrike = s.t + 5; ok = true; }
      if (Number.isFinite(c.hour) && c.hour >= 0 && c.hour < 24) { s.hour = c.hour; ok = true; }
      if (typeof c.cycle === 'boolean') { s.cycle = c.cycle; ok = true; }
      if (Number.isFinite(c.fogStrength)) { s.fogStrength = clamp(c.fogStrength, .6, 1.65); ok = true; }
      return ok;
    }

    // ¿la persona está bajo techo (dentro de un edificio o bajo su alero)?
    function sheltered(p) {
      for (const [x, z, w, d, h] of buildings) {
        if (Math.abs(p.x - x) < w / 2 - .1 && Math.abs(p.z - z) < d / 2 - .1 && p.y + 1.85 < h - .1) return true;
        const frente = z < 0 ? 1 : -1;
        if (Math.abs(p.x - x) < w / 2 - .2 && Math.abs(p.z - (z + frente * (d / 2 + .5))) < .7 && p.y + 1.85 < 2.38) return true;
      }
      return false;
    }

    function surfaceAt(x, z) {
      for (const [bx, bz, w, d, h] of buildings) if (Math.abs(x - bx) < w / 2 && Math.abs(z - bz) < d / 2) return h + .3;
      return .1;
    }

    // aviso de rayo: cae en (x, z) después de `delay` segundos
    function warn(s, x, z, delay = 0) {
      const b = limites().bounds - 1;
      const strike = { id: s.seed.toString(36) + '-' + (++s.seq), x: round(clamp(x, -b, b)), z: round(clamp(z, -b, b)), y: surfaceAt(x, z),
        at: round(s.t + delay), radius: 3.1, damage: 28, resolved: false, victims: [] };
      s.strikes.push(strike);
      return strike;
    }

    function advance(s, dt, players = [], hazards = true) {
      dt = clamp(Number.isFinite(dt) ? dt : 0, 0, 60);
      s.t += dt; s.elapsed += dt;
      if (s.cycle) s.hour = (s.hour + dt * .05) % 24;
      const p = PRESETS[kind(s)], blend = 1 - Math.exp(-dt * .28);
      for (const k of CANALES) s[k] += (p[k] - s[k]) * blend;
      s.wet = clamp(s.wet + dt * (s.rain > .1 ? s.rain * .035 : s.snow > .2 ? .003 : -.008), 0, 1);
      if (hazards) {
        if (kind(s) === 'storm' && s.t >= s.nextStrike) lanzarRayo(s, players);
        for (const e of s.strikes) if (!e.resolved && s.t >= e.at) resolverRayo(e, players);
      }
      s.strikes = s.strikes.filter(e => s.t - e.at < 6).slice(-8);
      return s;
    }

    // en tormenta, casi siempre apunta a alguien que está a la intemperie; si no, a un punto al azar de la ciudad
    function lanzarRayo(s, players) {
      s.nextStrike = s.t + 4.5 + random(s) * 4;
      const expuestos = players.filter(p => p.alive && !p.safe && !sheltered(p));
      const objetivo = expuestos.length && random(s) < .9 ? expuestos[Math.floor(random(s) * expuestos.length)] : null;
      if (objetivo) warn(s, objetivo.x + (random(s) - .5) * .6, objetivo.z + (random(s) - .5) * .6);
      else {
        const a = random(s) * Math.PI * 2, r = 5 + random(s) * (limites().bounds - 9);
        warn(s, Math.cos(a) * r, Math.sin(a) * r);
      }
    }

    function resolverRayo(e, players) {
      e.resolved = true;
      for (const p of players) {
        if (!p.alive || p.safe || sheltered(p)) continue;
        const d = Math.hypot(p.x - e.x, p.z - e.z);
        if (d < e.radius && Math.abs(p.y - e.y) < 2.8) e.victims.push({ id: String(p.id), damage: Math.round(e.damage * (1 - d / e.radius * .55)) });
      }
    }

    // llega al clima objetivo de golpe (al entrar a la partida)
    function warm(s) {
      const p = PRESETS[kind(s)];
      for (const k of CANALES) s[k] = p[k];
      s.wet = p.rain;
      return s;
    }

    function snapshot(s) {
      const d = { ...s, strikes: s.strikes.map(e => ({ ...e, victims: e.victims.map(v => ({ ...v })) })) };
      for (const k of ['t', 'hour', 'elapsed', 'rain', 'cloud', 'fog', 'snow', 'wind', 'wet']) d[k] = round(d[k]);
      return d;
    }

    // valida un estado que llega por la red; devuelve null si algo no cuadra
    function parse(d) {
      const numeros = ['t', 'hour', 'elapsed', 'rain', 'cloud', 'fog', 'snow', 'wind', 'wet', 'seed', 'rng', 'seq', 'nextStrike', 'fogStrength'];
      if (!d || d.v !== 3 || !numeros.every(k => Number.isFinite(d[k])) || !(d.mode === 'auto' || PRESETS[d.mode]) || typeof d.cycle !== 'boolean') return null;
      if (d.t < 0 || d.t > 1e9 || d.hour < 0 || d.hour >= 24 || ['rain', 'cloud', 'fog', 'snow', 'wind', 'wet'].some(k => d[k] < 0 || d[k] > 1)) return null;
      const s = { ...d, mapa: mapaValido(d.mapa), strikes: [] };   // los servidores viejos no mandan `mapa`: usan el ciclo de la Ciudad
      s.fogStrength = clamp(d.fogStrength, .6, 1.65);
      const arena = limites().arena;
      for (const e of Array.isArray(d.strikes) ? d.strikes.slice(-8) : []) {
        if (!e || typeof e.id !== 'string' || e.id.length > 64 || !['x', 'y', 'z', 'at', 'radius', 'damage'].every(k => Number.isFinite(e[k]))) continue;
        if (Math.abs(e.x) > arena || Math.abs(e.z) > arena || e.radius < 0 || e.radius > 4 || e.damage < 0 || e.damage > 35) continue;
        const victims = (Array.isArray(e.victims) ? e.victims : [])
          .filter(v => v && typeof v.id === 'string' && v.id.length < 80 && Number.isFinite(v.damage) && v.damage > 0 && v.damage <= 35)
          .map(v => ({ id: v.id, damage: v.damage }));
        s.strikes.push({ ...e, resolved: !!e.resolved, victims });
      }
      return s;
    }

    return { presets: PRESETS, buildings, create, hash, kind, command, sheltered, surfaceAt, warn, advance, warm, snapshot, parse };
  }

  return { crear, PRESETS, CICLOS };
});
