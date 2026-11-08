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
    name: 'Sunn', title: 'Armadura Escarlata', role: 'ARMADURA', color: '#d4202c', hp: 98, spd: 1.04, ai: 'ranged', stance: 'idle', miniCompanion: true,
    desc: 'Un genio con armadura escarlata y dorada. Dispara repulsores desde las palmas, lanza salvas de misiles que persiguen, marca el suelo para un impacto orbital y vuela con los propulsores. Siempre lo acompaña Mini, su pequeña ayudante cabezona, que dispara con él. Al despertar la armadura se sobrecarga.',
    stats: [4, 3, 4, 5, 3],
    skinData: 'personajes/sunn/skin.png',
    skin: { skin: '#e8c79c', hair: '#3a2418', eye: '#7df9ff', shirt: '#c0262e', pants: '#c0262e', shoes: '#d4a017', sleeve: 12 },
    skills: [
      { n: 'Repulsor', d: 'Dispara un rayo de energia desde la palma: empuja a quien alcanza.', k: 'beam', cd: 9, o: { eyes: false, len: 24, dur: .8, dmg: 2.2, width: .5, charge: .35, push: 5, color: '#7df9ff' }, r: [3, 22], tags: 'proj' },
      { n: 'Salva de Misiles', d: 'Tres misiles de la armadura que persiguen al rival.', k: 'eyeBolts', cd: 6, o: { speed: 46, dmg: 4, stun: .45, size: .26, long: 4, homing: 2 }, r: [3, 24], tags: 'proj' },
      { n: 'Impacto Orbital', d: 'Marca el suelo del rival: un instante despues un pilar de energia estalla y lo lanza por el aire.', k: 'pillar', cd: 9, o: { radius: 2.8, delay: .6, dmg: 7, up: 13, ragdoll: .9, color: '#ffb020' }, r: [2, 16], tags: 'aoe' },
      { n: 'Propulsores', d: 'Enciende las botas: una explosion al suelo te lanza por el aire.', k: 'optoJump', cd: 8, o: {}, r: [0, 3.5], tags: 'close aoe gb' },
    ],
    ult: { n: 'Rayo del Reactor', d: 'Libera el reactor del pecho: un rayo gigante que rompe guardias.', k: 'beam', o: { eyes: false, len: 38, width: 1.6, dur: 1.4, dmg: 2.4, gb: true, push: 8, charge: .9, color: '#7df9ff' }, r: [2, 28] },
    intro: [[0, 'idle', 400], [.45, 'castUp', 600], [1.1, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    flourish: { dur: 1.0, anim: [[0, 'charge', 500], [.55, 'castUp', 600], [.85, 'idle', 400]] },
    awk: [
      { n: 'Sobrecarga del Reactor', d: 'Carga el reactor casi 2 s y suelta un rayo enorme que rompe guardias y empuja muy lejos.', k: 'rbOverload', cd: 10, o: { hold: 1.95 }, r: [4, 26], tags: 'proj gb' },
      { n: 'Drones Reflectores', d: 'Deja tres drones alrededor del rival y el rayo rebota en todos, pegando mas fuerte en cada rebote.', k: 'rbMirrors', cd: 11, o: {}, r: [3, 24], tags: 'proj gap' },
      { n: 'Satelite Stark', d: 'Una marca persigue al rival y el satelite dispara un pilar con dos ondas de columnas.', k: 'rbSatellite', cd: 14, o: { at: 1.7 }, r: [4, 26], tags: 'aoe' },
      { n: 'Explosion del Reactor', d: 'Carga toda la energia del reactor y la libera en una explosion que lanza a todos por los aires.', k: 'sonBlast', cd: 13, o: { dmg: 18 }, r: [0, 9], tags: 'aoe close gb' },
    ],
    consejos: {
      'S1': 'Mantén la mira sobre el rival mientras dura: el rayo lo empuja, sirve para sacarlo de un lugar.',
      'S2': 'Tres misiles que persiguen solos: ideal para pegar desde lejos y cargar el despertar.',
      'S3': 'Tiene medio segundo de retraso: úsalo cuando el rival esté aturdido, bloqueando o quieto.',
      'S4': 'Te lanza por el aire: sirve para escapar o subir a techos, y rompe la guardia de los pegados.',
      'A1': 'Carga casi 2 s: no la uses con rivales encima. Desde lejos rompe guardias y los manda lejos.',
      'A2': 'Cada rebote pega más fuerte: funciona mejor contra un rival que se queda en el lugar.',
      'A3': 'La marca persigue con retraso: obliga al rival a moverse o úsala cuando esté atrapado.',
      'A4': '18 de daño a todos alrededor: métete en el medio y suéltala.',
      'U': 'Un rayo gigante que rompe guardias: apúntalo a una fila de rivales. Mini dispara más rápido mientras dura el despertar.',
    },
    dmgMul: .9,
  };
})();
