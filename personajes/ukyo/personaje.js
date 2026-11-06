/* =============================================================================
   PERSONAJE · ItzUkyo  (id: ukyo)
   Todo lo de este personaje vive en la carpeta personajes/ukyo/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  // Ataques básicos (combo de 5 golpes del clic izquierdo)
  const ataquesBasicos = [
  { anim: [[0, 'scepterW', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .5, len: 2.6, r: 2.1, w: .45, dir: 1 }, reach: 1.6, r: 1.5 },
  { anim: [[0, 'sweep', 900], [.06, 'sweep_w', 1400], [.17, 'sweepRec', 500]], arc: { tilt: -.4, len: 2.6, r: 2.1, w: .45, dir: -1 }, reach: 1.6, r: 1.5 },
  { anim: [[0, 'thrust_w', 900], [.06, 'thrust', 1400], [.16, 'thrustRec', 500]], stab: true, reach: 1.95, r: 1.15 },
  { anim: [[0, 'scepterW', 900], [.09, 'scepterSmash', 1400], [.26, 'gatoHero', 450]], arc: { tilt: 1.4, len: 2.4, r: 2.2, w: .7, dir: -1 }, reach: 1.7, r: 1.6 },
  { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2 }, reach: 1.6, r: 1.3 },
  ];
  CF_PERSONAJES['ukyo'] = {
    name: 'ItzUkyo', title: 'Espada Carmesí', role: 'ESPADACHÍN', color: '#e0263a', hp: 100, spd: 1.04, ai: 'melee', stance: 'idle', weapon: 'sword', m1set: ataquesBasicos, introDraw: .2, fireSword: true,
    desc: 'Espadachín de fuego: barre el piso con la hoja, atraviesa a los rivales de una estocada, lanza cuchillas que vuelven solas y escupe bolas de fuego que dejan el suelo ardiendo. Al despertar su espada se envuelve en llamas.',
    stats: [3, 4, 4, 3, 3],
    skin: { skin: '#ffcdc5', hair: '#2e0300', eye: '#e0263a', shirt: '#16142b', pants: '#2b2d3b', shoes: '#150100', sleeve: 12 },
    skinData: 'personajes/ukyo/skin.png',
    skills: [
      { n: 'Barrido', d: 'Barre la espada a ras del piso: una onda baja viaja hacia delante y hace caer a todos los que toca.', k: 'ukSweep', cd: 7, o: { dmg: 6, range: 11 }, r: [2, 12], tags: 'proj aoe' },
      { n: 'Estocada', d: 'Sale disparado con la punta al frente: atraviesa al primer rival, lo arrastra clavado y lo lanza al final del tramo.', k: 'ukLunge', cd: 8, o: { dmg: 7, dmg2: 5, dist: 8 }, r: [3, 11], tags: 'gap gb' },
      { n: 'Cuchillas arrojadizas', d: 'Lanza tres cuchillas en abanico. Las que aciertan se quedan clavadas y, al rato, vuelven a su mano atravesando otra vez al rival.', k: 'ukKnives', cd: 6, o: { dmg: 3, count: 3 }, r: [3, 22], tags: 'proj' },
      { n: 'Bola de fuego', d: 'Escupe una bola de fuego que explota al chocar y deja el suelo ardiendo unos segundos: quien lo pise se quema.', k: 'ukFireball', cd: 9, o: { dmg: 9 }, r: [3, 26], tags: 'proj aoe' },
    ],
    ult: { n: 'Fénix Carmesí', d: 'Su espada arde en llamas: durante el despertar sus golpes prenden fuego a los rivales y sus habilidades se vuelven fuego puro.', k: 'serious', o: {}, r: [0, 12] },
    intro: [[0, 'idle', 500], [.5, 'scepterW', 700], [1.0, 'sweep', 500], [1.4, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Corte Solar', d: 'Alza la espada ardiendo y baja un arco de fuego enorme que atraviesa a todos los que encuentra y los lanza al aire.', k: 'ukSun', cd: 9, o: { dmg: 8 }, r: [3, 20], tags: 'proj' },
    { n: 'Corte Instantáneo', d: 'Se queda inmóvil, desaparece en un tajo y vuelve a envainar. El rival tarda un instante en notar que ya está cortado.', k: 'chore', cd: 14, o: { id: 'ukIai' }, r: [0, 5], tags: 'close gap gb', cine: 1 },
    { n: 'Espada de Fénix', d: 'Clava la espada y la enciende: durante 10 s corre más rápido y cada golpe que da prende fuego al rival.', k: 'ukPhoenix', cd: 16, o: { dur: 10 }, r: [0, 12], tags: 'close' },
    { n: 'Anillo Ígneo', d: 'Clava la espada en el piso y suelta dos olas de fuego seguidas que empujan, queman y lanzan a los rivales cercanos.', k: 'ukRing', cd: 12, o: { dmg: 6 }, r: [0, 6], tags: 'aoe gb' },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'Hace caer a todos los que toca: buena para empezar combos o frenar a un grupo.',
      'S2': 'Atraviesa al primero y lo arrastra clavado: rompe guardia y te aleja del peligro.',
      'S3': 'Las cuchillas que se clavan vuelven a tu mano y pegan otra vez: tiralas y alejate.',
      'S4': 'El piso queda ardiendo unos segundos: tirala por donde el rival tenga que pasar.',
      'A1': 'Atraviesa a todos en línea y los lanza al aire: apuntá a los grupos.',
      'A2': 'Cinemática: el corte llega antes de que se vea. Usala de cerca.',
      'A3': 'Durante 10 s corrés más y cada golpe prende fuego: activala antes de lanzarte con el combo.',
      'A4': 'Dos olas de fuego alrededor tuyo: perfecta cuando te rodean.',
      'U': 'Todo prende fuego durante el despertar: el combo normal se vuelve mucho más peligroso.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: .72,
  };
})();
