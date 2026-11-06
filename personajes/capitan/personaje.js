/* =============================================================================
   PERSONAJE · Capitán Perú  (id: capitan)
   Todo lo de este personaje vive en la carpeta personajes/capitan/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['capitan'] = {
    name: 'Capitán Perú', title: 'Héroe de la Patria', role: 'INVOCACIÓN', color: '#e63946', hp: 160, spd: 1.08, ai: 'melee', stance: 'idle', hidden: true, adapt: true, noUlt: true,
    desc: 'El Gran General invocado por ElRandi. Pega duro y se adapta: cada golpe que recibe lo hace más resistente a ese rival.', stats: [5, 3, 4, 2, 4],
    skin: { skin: '#c99a7b', hair: '#1c1616', eye: '#2b1a10', shirt: '#d6222c', pants: '#f0eee8', shoes: '#d6222c', sleeve: 12 },
    skinData: 'personajes/capitan/skin.png',
    skills: [
      { n: 'Patada Peruana', d: 'Sale disparado con una patada voladora que lanza al rival muy lejos.', k: 'rush', cd: 7, o: { dmg: 10, kb: 20, up: 7, ragdoll: 1.1, pose: 'kickRush', hitPose: 'kick' }, r: [2, 12], tags: 'gap gb' },
      { n: '¡Fuerza Peruana!', d: 'Salta y cae con un impacto que aplasta todo alrededor.', k: 'slam', cd: 9, o: { radius: 5, dmg: 12 }, r: [0, 5], tags: 'aoe gb' },
      { n: 'Combo Bicolor', d: 'Gancho al cielo, salto y remate rojiblanco.', k: 'airCombo', cd: 8, o: { dmg: 13 }, r: [0, 3], tags: 'close' },
      { n: 'Rueda de Adaptación', d: 'Modo defensa 3.5 s: el próximo golpe que reciba lo recupera 15 de vida y lo hace mucho más resistente a ese rival.', k: 'capAdapt', cd: 12, o: {}, r: [0, 8], tags: 'counter' },
    ],
    ult: { n: '—', d: '', k: 'serious', o: {}, r: [0, 0] }, intro: [], cine: [],
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: 1.1,
  };
})();
