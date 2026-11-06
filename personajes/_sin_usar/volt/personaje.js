/* =============================================================================
   PERSONAJE · Volt  (id: volt)
   Todo lo de este personaje vive en la carpeta personajes/_sin_usar/volt/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['volt'] = {
    name: 'Volt', title: 'Tormenta Viva', role: 'TIRADOR', color: '#33e1ff', hp: 95, spd: 1, ai: 'ranged', stance: 'loose',
    desc: 'Pelea a distancia con orbes explosivos y rayos. Si lo alcanzan, se escapa con un relámpago.',
    stats: [3, 4, 3, 5, 3],
    skin: { skin: '#c98e5b', hair: '#ffe14d', eye: '#18ffff', shirt: '#0b6fb0', pants: '#263238', shoes: '#eceff1', glove: '#eceff1', sleeve: 5, spiky: true, goggles: '#18ffff', bolt: '#ffe14d', belt: '#263238' },
    skills: [
      { n: 'Orbe Voltaico', d: 'Esfera que explota al tocar.', k: 'shoot', cd: 6, o: { count: 1, speed: 26, dmg: 9, size: .8, explode: 3, homing: 1.5 }, r: [3, 24], tags: 'proj' },
      { n: 'Rayo', d: 'Haz continuo que empuja.', k: 'beam', cd: 10, o: { len: 20, dur: .8, dmg: 2.2, width: .9 }, r: [3, 18], tags: 'proj' },
      { n: 'Relámpago', d: 'Aparece junto al rival y lo electrocuta.', k: 'blink', cd: 8, o: { dmg: 7, kb: 3, up: 0, stun: 1.1 }, r: [3, 20], tags: 'gap gb' },
      { n: 'Descarga', d: 'Estallido eléctrico alrededor.', k: 'wave', cd: 9, o: { radius: 6, dmg: 8 }, r: [0, 5.5], tags: 'aoe gb' },
    ],
    ult: { n: 'Cañón Trueno', d: 'Rayo gigante que atraviesa guardias.', k: 'beam', o: { len: 40, width: 1.7, dur: 1.6, dmg: 3.2, gb: true, push: 9, charge: .75 }, r: [2, 30] },
    intro: [[0, 'castUp', 500], [.6, 'palm', 800], [1.0, 'point', 500]],
    cine: [[0, 'castUp', 400], [.9, 'cast', 600]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Orbes Satélite', d: 'Cuatro orbes eléctricos te rodean y estallan sobre los rivales.', k: 'orbitals', cd: 9, o: { n: 4, kind: 'orb', dur: 7, rate: .6, proj: { speed: 30, dmg: 7, size: .5, explode: 2.2, homing: 2 } }, r: [0, 14], tags: 'proj' },
    { n: 'Campo Eléctrico', d: 'Campo que electrocuta y deja quietos a los de adentro.', k: 'zone', cd: 10, o: { r: 6, dur: 4.5, dmg: 2.4, stun: .55, fx: 'elec' }, r: [0, 6], tags: 'aoe' },
    { n: 'Rayo Zigzag', d: 'Cuatro saltos relámpago a través del rival.', k: 'dashCombo', cd: 7, o: { n: 4, zig: true, dmg: 3.5, dmg2: 10 }, r: [2, 16], tags: 'gap gb' },
    { n: 'Sobrecarga', d: 'Lo usa de pararrayos en el aire y lo descarga con un trueno.', k: 'chore', cd: 14, o: { id: 'voltOverload' }, r: [0, 3.5], tags: 'close gb', cine: 1 },
    ],
  };
})();
