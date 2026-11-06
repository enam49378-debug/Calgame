/* =============================================================================
   PERSONAJE · Rocket  (id: rocket)
   Todo lo de este personaje vive en la carpeta personajes/rocket/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['rocket'] = {
    name: 'Rocket', title: 'Tejedora Nocturna', role: 'ACECHADORA', color: '#e0214a', hp: 95, spd: 1.06, ai: 'mid', stance: 'ninja', m1set: [] /* ver Ataques basicos/Code/ataques-basicos.js */, legs: true,
    desc: 'Pelea como una araña: atrapa con telaraña, se arrastra de un hilo hasta el rival, envenena y siembra trampas. Al despertar le salen patas de araña por la espalda, camina sobre ellas y teje pesadillas.',
    stats: [3, 4, 4, 2, 4],
    skin: { skin: '#c8b898', hair: '#14181f', eye: '#e0214a', shirt: '#1d252e', pants: '#12181f', shoes: '#141414', sleeve: 12 },
    skinData: 'personajes/rocket/skin.png',
    skills: [
      { n: 'Telaraña', d: 'Dispara un hilo que sigue al rival: si lo toca, lo envuelve en seda y lo deja inmóvil un buen rato.', k: 'rkWeb', cd: 7, o: { dmg: 3, root: 1.7 }, r: [3, 22], tags: 'proj' },
      { n: 'Gancho de Seda', d: 'Lanza un hilo al rival y se deja arrastrar de cara hasta él, rematando con una patada.', k: 'rkZip', cd: 8, o: { dmg: 7 }, r: [4, 22], tags: 'gap gb' },
      { n: 'Picadura Venenosa', d: 'Se lanza con la mandíbula abierta y muerde: el veneno sigue quitando vida durante varios segundos.', k: 'rkBite', cd: 9, o: { dmg: 5, dps: 2.4, dur: 4.5 }, r: [0, 4], tags: 'close' },
      { n: 'Trampas de Seda', d: 'Teje tres telarañas en el piso alrededor del rival. Quien las pise queda atrapado y herido.', k: 'rkTraps', cd: 11, o: { dmg: 4, root: 1.9 }, r: [2, 16], tags: 'aoe' },
    ],
    ult: { n: 'Tejedora de Pesadillas', d: 'Le salen patas de araña por la espalda: durante el despertar camina y corre sobre ellas y sus habilidades se vuelven pesadillas.', k: 'serious', o: {}, r: [0, 12] },
    intro: [[0, 'ninja', 500], [.5, 'castUp', 700], [1.0, 'point', 500], [1.4, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Patas Lanza', d: 'Las patas de araña clavan cinco estocadas al frente; la última lanza al rival por el aire.', k: 'rkLegStabs', cd: 11, o: { dmg: 2.3, dmg2: 6.5 }, r: [1, 9], tags: 'close gb' },
    { n: 'Capullo Mortal', d: 'Lo envuelve en seda, lo alza sobre su cabeza, lo hace girar y lo estrella contra el suelo.', k: 'chore', cd: 16, o: { id: 'rkCocoon' }, r: [0, 4], tags: 'close gap gb', cine: 1 },
    { n: 'Red Gigante', d: 'Extiende una telaraña enorme en el piso que arrastra a todos hacia el centro y los hiere sin parar.', k: 'rkWebField', cd: 15, o: { dmg: 1.1, r: 6 }, r: [0, 14], tags: 'aoe' },
    { n: 'Enjambre', d: 'Suelta seis arañitas que persiguen al rival y lo muerden varias veces.', k: 'rkSwarm', cd: 12, o: { n: 5, dmg: .9 }, r: [2, 22], tags: 'proj' },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'Si toca, el rival queda inmóvil 1,7 s: abrí con esta y seguí con la Picadura Venenosa.',
      'S2': 'Te arrastra hasta el rival y lo patea: un acercamiento seguro que rompe guardia.',
      'S3': 'El veneno sigue quitando vida 4,5 s: mordé y alejate mientras el rival se debilita.',
      'S4': 'Ponelas en el camino del rival o alrededor tuyo para que nadie se te acerque.',
      'A1': 'Cinco estocadas al frente: quedate de cara al rival; la última lo lanza por el aire.',
      'A2': 'Cinemática de cerca: lo envuelve en seda y lo estrella contra el piso.',
      'A3': 'Arrastra a todos hacia el centro: combinala con Patas Lanza cuando estén juntos.',
      'A4': 'Las arañitas persiguen solas: soltalas al empezar a pelear y seguí atacando.',
      'U': 'Con las patas de araña corrés más rápido: aprovechá el despertar para perseguir.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: 1,
  };
})();
