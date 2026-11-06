/* =============================================================================
   PERSONAJE · Nyx  (id: nyx)
   Todo lo de este personaje vive en la carpeta personajes/_sin_usar/nyx/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['nyx'] = {
    name: 'Nyx', title: 'Sombra Veloz', role: 'ASESINA', color: '#d65cff', hp: 85, spd: 1.12, ai: 'melee', stance: 'ninja',
    desc: 'Rápida y frágil. Aparece detrás de su objetivo, tira kunais que persiguen y deja cortes que estallan después.',
    stats: [2, 4, 5, 3, 4],
    skin: { skin: '#f3d3b8', hair: '#2b1840', eye: '#e040fb', shirt: '#3a1460', pants: '#1b1626', shoes: '#0d0d12', glove: '#1b1626', sleeve: 12, mask: '#1a1a24', band: '#e040fb', scarf: '#8e24aa' },
    skills: [
      { n: 'Paso Sombra', d: 'Se teletransporta a la espalda del rival y lo lanza.', k: 'blink', cd: 7, o: { dmg: 8, kb: 12, up: 10, ragdoll: 1 }, r: [3, 20], tags: 'gap gb' },
      { n: 'Kunais', d: 'Tres kunais que siguen al objetivo.', k: 'shoot', cd: 6, o: { count: 3, spread: .14, speed: 42, dmg: 4, stun: .55, size: .3, long: 2.4, homing: 3, anim: 'throw' }, r: [3, 24], tags: 'proj' },
      { n: 'Corte Fugaz', d: 'Cruza al rival; el corte estalla medio segundo después.', k: 'slash', cd: 8, o: { dmg: 10 }, r: [2, 9], tags: 'gap gb' },
      { n: 'Remolino', d: 'Ráfaga veloz de cortes a corta distancia.', k: 'barrage', cd: 9, o: { hits: 14, dur: .9, dmg: 1.2 }, r: [0, 2.6], tags: 'close' },
    ],
    ult: { n: 'Mil Cortes', d: 'Salta entre hasta cinco rivales y los corta a todos.', k: 'cuts', o: {}, r: [0, 18] },
    intro: [[0, 'signs', 500], [.5, 'slashW'], [.65, 'slash', 900], [1.05, 'ninja', 400]],
    cine: [[0, 'signs', 400], [1.0, 'slashW', 600]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Danza de Sombras', d: 'Cinco cortes en zigzag a través del rival.', k: 'dashCombo', cd: 7, o: { n: 5, zig: true, dmg: 3, dmg2: 9 }, r: [2, 16], tags: 'gap gb' },
    { n: 'Niebla Oscura', d: 'Niebla que corta a quien entre.', k: 'zone', cd: 10, o: { r: 5.5, dur: 5, dmg: 2.6, stun: .35, fx: 'shadow' }, r: [0, 5.5], tags: 'aoe' },
    { n: 'Kunais Flotantes', d: 'Seis kunais flotan a tu alrededor y salen solos.', k: 'orbitals', cd: 9, o: { n: 6, kind: 'kunai', dur: 7, rate: .35, proj: { speed: 46, dmg: 3.5, stun: .45, size: .25, long: 2.6, homing: 3 } }, r: [0, 14], tags: 'proj' },
    { n: 'Ejecución Sombría', d: 'Cinco cortes desde las sombras; guarda el arma y recién ahí cae.', k: 'chore', cd: 14, o: { id: 'nyxShadow' }, r: [0, 3.5], tags: 'close gb', cine: 1 },
    ],
  };
})();
