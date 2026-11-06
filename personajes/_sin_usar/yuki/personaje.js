/* =============================================================================
   PERSONAJE · Yuki  (id: yuki)
   Todo lo de este personaje vive en la carpeta personajes/_sin_usar/yuki/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['yuki'] = {
    name: 'Yuki', title: 'Reina del Hielo', role: 'CONTROL', color: '#9fb4ff', hp: 95, spd: 1.02, ai: 'mid', stance: 'elegant',
    desc: 'Congela a los rivales y los deja quietos. Su ulti congela a todos cerca y después los hace estallar.',
    stats: [3, 3, 3, 4, 4],
    skin: { skin: '#f5dcc8', hair: '#e8f4ff', eye: '#7fd8ff', shirt: '#1e3a6e', pants: '#16284d', shoes: '#e8f4ff', glove: '#bfe3ff', sleeve: 10, longHair: true, crown: '#bfe3ff', snow: '#e8f4ff' },
    skills: [
      { n: 'Lanza de Hielo', d: 'Proyectil veloz que aturde.', k: 'shoot', cd: 5, o: { count: 1, speed: 40, dmg: 6, stun: 1.0, size: .35, long: 3, homing: 2, kb: 2, anim: 'throw' }, r: [3, 26], tags: 'proj' },
      { n: 'Prisión Helada', d: 'Marca el suelo y congela a quien quede adentro.', k: 'pillar', cd: 10, o: { radius: 2.6, delay: .55, dmg: 8, freeze: 1.6 }, r: [2, 16], tags: 'aoe' },
      { n: 'Patinaje', d: 'Se desliza cortando; el corte estalla después.', k: 'slash', cd: 8, o: { dmg: 9 }, r: [2, 9], tags: 'gap gb' },
      { n: 'Ventisca', d: 'Ráfaga helada alrededor que aturde.', k: 'wave', cd: 9, o: { radius: 5.5, dmg: 6, kb: 7, up: 3, stun: 1.0, ragdoll: 0 }, r: [0, 5], tags: 'aoe gb' },
    ],
    ult: { n: 'Cero Absoluto', d: 'Congela a todos a 16 bloques y los hace estallar.', k: 'iceage', o: {}, r: [0, 15] },
    intro: [[0, 'palm', 500], [.5, 'castUp', 600], [1.0, 'elegant', 400]],
    cine: [[0, 'signs', 400], [.9, 'palm', 600]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Tormenta de Nieve', d: 'Ventisca que daña y frena a los de adentro.', k: 'zone', cd: 10, o: { r: 6, dur: 5, dmg: 2.2, stun: .5, fx: 'ice' }, r: [0, 6], tags: 'aoe' },
    { n: 'Fragmentos Orbitales', d: 'Cristales de hielo te rodean y salen a congelar.', k: 'orbitals', cd: 9, o: { n: 5, kind: 'shard', dur: 7, rate: .5, proj: { speed: 44, dmg: 4, stun: .9, size: .3, long: 3, homing: 3 } }, r: [0, 14], tags: 'proj' },
    { n: 'Patinaje Fugaz', d: 'Cuatro deslizamientos a través del rival.', k: 'dashCombo', cd: 7, o: { n: 4, zig: true, dmg: 3.5, dmg2: 10 }, r: [2, 16], tags: 'gap gb' },
    { n: 'Tumba de Hielo', d: 'Lo congela en una estatua, la toca con un dedo y estalla.', k: 'chore', cd: 14, o: { id: 'yukiTomb' }, r: [0, 3.5], tags: 'close gb', cine: 1 },
    ],
  };
})();
