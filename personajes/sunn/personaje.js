/* =============================================================================
   PERSONAJE · Sunn  (id: sunn)  ·  tematica Iron Man
   Todo lo de este personaje vive en la carpeta personajes/sunn/
     personaje.js  este archivo: estadisticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar codigo)
   Lo acompana MINI, su companera pequena (js/mini.js): sigue a Sunn y le ayuda a disparar.
   Los movimientos (k: ...) estan implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  CF_PERSONAJES['sunn'] = {
    name: 'Sunn', title: 'Armadura Escarlata', role: 'ARMADURA', color: '#d4202c', hp: 98, spd: 1.04, ai: 'ranged', stance: 'idle', miniCompanion: true, canFly: true,
    desc: 'Un genio con armadura escarlata y dorada. Dispara repulsores desde las palmas, lanza salvas de misiles que persiguen, marca el suelo para un impacto orbital y vuela con los propulsores. Siempre lo acompaña Mini, su pequeña ayudante cabezona, que ataca con él. Al despertar la armadura se sobrecarga.',
    stats: [4, 3, 4, 5, 3],
    skinData: 'personajes/sunn/skin.png',
    skin: { skin: '#e8c79c', hair: '#3a2418', eye: '#7df9ff', shirt: '#c0262e', pants: '#c0262e', shoes: '#d4a017', sleeve: 12 },
    skills: [
      { n: 'Repulsores Gemelos', d: 'Dispara dos rayos de energía, uno por cada palma, que persiguen un poco al rival.', k: 'sunnTwin', cd: 6, o: { dmg: 5.5 }, r: [3, 26], tags: 'proj' },
      { n: 'Salva Stark', d: 'Cinco misiles salen de la armadura, buscan al rival y explotan al tocarlo.', k: 'sunnMissiles', cd: 9, o: { dmg: 5, n: 5 }, r: [4, 30], tags: 'proj aoe' },
      { n: 'Mini al ataque', d: 'Mini corre hasta el rival y lo golpea sin parar; el último golpe lo lanza por los aires.', k: 'sunnMiniStrike', cd: 11, o: { dmg: 2.8, dmg2: 6 }, r: [3, 24], tags: 'gap' },
      { n: 'Mini bombardea', d: 'Marca una zona: Mini sale volando con las botas y deja caer tres bombas rosadas.', k: 'sunnMiniBomb', cd: 12, o: { dmg: 5.5 }, r: [3, 24], tags: 'aoe' },
    ],
    ult: { n: 'Protocolo Casa Vacía', d: 'Sunn alza el vuelo y Mini lo acompaña: una lluvia de misiles cae sobre todos los rivales cercanos.', k: 'sunnUlt', o: { n: 11, dmg: 6.5 }, r: [0, 30] },
    intro: [[0, 'idle', 400], [.45, 'castUp', 600], [1.1, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    flourish: { dur: 1.0, anim: [[0, 'charge', 500], [.55, 'castUp', 600], [.85, 'idle', 400]] },
    awk: [
      { n: 'Unirrayo Estelar', d: 'Carga el reactor y barre la arena con un rayo dorado enorme que rompe guardias.', k: 'sunnUnibeam', cd: 11, o: { dmg: 2.9 }, r: [4, 32], tags: 'proj gb' },
      { n: 'Enjambre de Drones', d: 'Cuatro drones orbitan a tu alrededor y disparan solos al rival durante varios segundos.', k: 'sunnDrones', cd: 12, o: { n: 10, dmg: 3.4 }, r: [0, 32], tags: 'proj' },
      { n: 'Misil Estelar', d: 'Marca una gran zona: dos segundos después cae un misil que lanza a todos por los aires.', k: 'sunnNuke', cd: 14, o: { dmg: 20 }, r: [4, 34], tags: 'aoe gb' },
      { n: 'Armadura Reforzada', d: 'La armadura se refuerza: te cura y te vuelve invulnerable unos segundos.', k: 'sunnShield', cd: 16, o: { heal: 18, time: 2.5 }, r: [0, 10], tags: 'close' },
    ],
    consejos: {
      'S1': 'Dos rayos rápidos: ideal para pegar de lejos y empujar.',
      'S2': 'Los misiles buscan solos: úsalos cuando el rival se mueve mucho.',
      'S3': 'Mini ataca por ti: tú sigues moviéndote y puedes pegar a la vez.',
      'S4': 'Marca bien la zona: Mini tarda un instante en soltar las bombas.',
      'A1': 'Barre un arco enorme: ponte de frente a una fila de rivales.',
      'A2': 'Los drones disparan solos mientras tú peleas o huyes.',
      'A3': 'La marca avisa 2 s antes: obliga a moverse o úsalo con el rival atrapado.',
      'A4': 'Úsala cuando estés a punto de perder: te cura y no te pueden golpear un momento.',
      'U': 'Cae una lluvia de misiles sobre todos los rivales cercanos. R: vuelo con la armadura (WASD, Espacio sube, C baja).',
    },
    dmgMul: .9,
  };
})();
