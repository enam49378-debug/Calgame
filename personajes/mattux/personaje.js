/* =============================================================================
   PERSONAJE · Mattux  (id: mattux)
   Todo lo de este personaje vive en la carpeta personajes/mattux/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['mattux'] = {
    name: 'Mattux', title: 'Velocista Sónico', role: 'VELOCISTA', color: '#2f6bff', hp: 88, spd: 1.16, ai: 'melee', stance: 'idle',
    desc: 'El más rápido del juego: corre, rueda y rebota. Se hace bola en un Spin Dash, salta de rival en rival con el ataque teledirigido, lanza ondas sónicas y levanta un tornado con el Ciclón Sónico. Al despertar se vuelve Súper: dorado, más veloz y con el poder de las esmeraldas.',
    stats: [3, 3, 5, 3, 4],
    skin: { skin: '#f0c9a8', hair: '#1c2e8c', eye: '#2f6bff', shirt: '#2f6bff', pants: '#2f6bff', shoes: '#c4162a', sleeve: 12 },
    skinData: 'personajes/mattux/skin.png',
    skills: [
      { n: 'Spin Dash', d: 'Se hace bola, carga un instante y sale disparado girando: arrolla a todos los que toca en el camino.', k: 'sonSpin', cd: 8, o: { dmg: 6.5 }, r: [3, 14], tags: 'gap gb' },
      { n: 'Ataque Teledirigido', d: 'Salta hacia el rival más cercano convertido en bola y rebota para encadenar hasta tres rivales.', k: 'sonHoming', cd: 8, o: { dmg: 6.5 }, r: [3, 18], tags: 'gap proj' },
      { n: 'Onda Sónica', d: 'Dos tajos de viento azul salen en abanico y cortan todo a su paso.', k: 'sonBoom', cd: 9, o: { dmg: 5.5 }, r: [2, 24], tags: 'proj' },
      { n: 'Ciclón Sónico', d: 'Corre en círculos a la velocidad de la luz y levanta un tornado azul: arrastra a los rivales hacia dentro, los golpea sin parar y al final los lanza por los aires. No lo interrumpen los golpes; para librarte, aléjate del círculo.', k: 'sonCyclone', cd: 13, o: { dmg: 2.4 }, r: [0, 7], tags: 'aoe close gb' },
    ],
    ult: { n: 'Súper Mattux', d: 'Se vuelve dorado: más velocidad y habilidades nuevas con el poder del caos.', k: 'serious', o: {}, r: [0, 15] },
    intro: [[0, 'idle', 400], [.45, 'jabR_w', 600], [.65, 'jabR', 900], [1.2, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Súper Spin Dash', d: 'Un Spin Dash enorme y dorado que dura más y golpea más fuerte.', k: 'sonSpin', cd: 7, o: { dmg: 10, sup: 1 }, r: [3, 18], tags: 'gap gb' },
    { n: 'Aceleración Sónica', d: 'Corre más rápido que el sonido atravesando a todos y cierra con una onda de choque.', k: 'sonBoost', cd: 9, o: { dmg: 10 }, r: [3, 22], tags: 'gap gb' },
    { n: 'Lanzas del Caos', d: 'Cinco lanzas de energía dorada giran a tu alrededor y salen solas hacia los rivales.', k: 'orbitals', cd: 10, o: { n: 5, kind: 'shard', dur: 7, rate: .42, proj: { speed: 44, dmg: 5, stun: .5, size: .3, long: 4, homing: 3 } }, r: [0, 14], tags: 'proj' },
    { n: 'Explosión del Caos', d: 'Carga toda la energía de las esmeraldas y la libera en una explosión que lanza a todos por los aires.', k: 'sonBlast', cd: 13, o: { dmg: 18 }, r: [0, 9], tags: 'aoe close gb' },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'Carga un instante y sale disparado: arrolla a todos en línea y rompe guardia.',
      'S2': 'Busca solo al rival más cercano y rebota hasta tres: genial contra grupos.',
      'S3': 'Dos tajos en abanico a distancia: sirven para pegar sin acercarte.',
      'S4': 'Un tornado azul que arrastra a los rivales cercanos y los lanza por los aires: no te lo cancelan, úsalo cuando te rodeen.',
      'A1': 'Más largo y más fuerte que el normal: cruza media ciudad.',
      'A2': 'Atraviesa a todos y cierra con una onda de choque: también sirve para escapar.',
      'A3': 'Cinco lanzas doradas disparan solas durante 7 s mientras peleás.',
      'A4': '18 de daño a todos alrededor: metete en el medio y soltala.',
      'U': 'Más velocidad y habilidades nuevas: no te quedes quieto.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: .95,
  };
})();
