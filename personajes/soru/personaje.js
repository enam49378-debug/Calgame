/* =============================================================================
   PERSONAJE · Soru San  (id: soru)  ·  temática: jugador técnico de Minecraft vanilla
   Todo lo de este personaje vive en la carpeta personajes/soru/
     personaje.js    este archivo: estadísticas, habilidades, despertar, consejos y ataques básicos
     habilidades.js  el código de sus habilidades (maza, élitros, TNT, tótem, carga de viento...)
     skin.png        su skin (se puede reemplazar sin tocar código)
   Soru San es un animador y jugador de Minecraft vanilla: sabe de mecánicas, de redstone y de todo lo del juego base.
   Por eso pelea con lo que da el juego sin mods: la maza, los élitros con cohetes, el tótem de la inmortalidad, el TNT y la carga de viento.
   ============================================================================= */
(function () {
  CF_PERSONAJES['soru'] = {
    name: 'Soru San', title: 'Técnico Vanilla', role: 'TÉCNICO', color: '#e23b3b', hp: 108, spd: 1.0, ai: 'melee', stance: 'idle', weapon: 'mace', m1set: [] /* abajo */, introDraw: .2,
    desc: 'Jugador técnico de Minecraft vanilla. Salta y aplasta con la maza, sale volando con élitros y cohetes, lanza TNT con cañón y se salva con el tótem de la inmortalidad. Al despertar domina el juego: carga de viento, lluvia de TNT y faro de poder.',
    stats: [4, 4, 3, 3, 4],
    skinData: 'personajes/soru/skin.png',
    skin: { skin: '#e8b9a0', hair: '#a91b1b', eye: '#2b2b2b', shirt: '#312e2e', pants: '#463232', shoes: '#222222', sleeve: 12 },
    skills: [
      { n: 'Golpe de Maza', d: 'Salta y cae con la maza sobre el rival: cuanto más alto, más fuerte golpea. Rompe la guardia.', k: 'slam', cd: 8, o: { radius: 4, dmg: 15, jump: 16, fwd: 5, track: true, color: '#e23b3b' }, r: [3, 14], tags: 'gap aoe gb' },
      { n: 'Élitros y Cohete', d: 'Se lanza al aire con los élitros, enciende un cohete y atraviesa en vuelo a los rivales del camino lanzándolos hacia arriba.', k: 'soruElytra', cd: 9, o: { dmg: 8 }, r: [4, 22], tags: 'gap' },
      { n: 'Cañón de TNT', d: 'Dispara tres bloques de TNT en arco. Al caer parpadean y explotan.', k: 'soruTnt', cd: 8, o: { dmg: 8, n: 3 }, r: [4, 26], tags: 'proj aoe' },
      { n: 'Tótem de la Inmortalidad', d: 'Sostiene el tótem: se cura y no lo pueden golpear durante un momento.', k: 'soruTotem', cd: 18, o: { heal: 28, time: 2 }, r: [0, 10], tags: 'close' },
    ],
    ult: { n: 'Tormenta de Cohetes', d: 'Soru alza el vuelo con los élitros y una lluvia de cohetes y TNT cae sobre todos los rivales cercanos.', k: 'soruUlt', o: { n: 11, dmg: 6.5 }, r: [0, 30] },
    intro: [[0, 'idle', 400], [.45, 'scepterSmash', 700], [1.1, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    flourish: { dur: 1.0, anim: [[0, 'charge', 500], [.55, 'castUp', 600], [.85, 'idle', 400]] },
    awk: [
      { n: 'Carga de Viento', d: 'Revienta una carga de viento a sus pies: todos los rivales cercanos salen despedidos por los aires.', k: 'wave', cd: 7, o: { radius: 5.5, dmg: 8, kb: 24, up: 14, ragdoll: 1.3, color: '#bfe8ff' }, r: [0, 6], tags: 'aoe gb close' },
      { n: 'Mazazo Gravitatorio', d: 'Un salto altísimo y una caída que parte el suelo: daño enorme en un área grande.', k: 'slam', cd: 12, o: { radius: 5.5, dmg: 26, jump: 20, fwd: 6, track: true, color: '#e23b3b' }, r: [3, 16], tags: 'gap aoe gb' },
      { n: 'Lluvia de TNT', d: 'Marca una zona grande: ocho bloques de TNT caen del cielo y explotan uno tras otro.', k: 'soruTntRain', cd: 13, o: { dmg: 9, n: 8 }, r: [4, 28], tags: 'aoe' },
      { n: 'Faro de Poder', d: 'Enciende un faro: se cura un poco y sus habilidades se recargan mucho más rápido unos segundos.', k: 'soruBeacon', cd: 16, o: { heal: 14, time: 8 }, r: [0, 10], tags: 'close' },
    ],
    consejos: {
      'S1': 'Cuanto más cerca esté el rival al saltar, mejor: la caída lo persigue un poco.',
      'S2': 'Sirve para cerrar distancia o escapar: atraviesa al que se cruce.',
      'S3': 'El TNT cae en arco: apunta un poco más adelante del rival.',
      'S4': 'Úsalo cuando te estén por tumbar: te cura y te protege un instante.',
      'A1': 'Pegado al rival lanza a todos lejos: ideal cuando te rodean.',
      'A2': 'Es lento de preparar pero es el golpe más fuerte que tiene.',
      'A3': 'Úsala con el rival acorralado: cae mucho TNT en la zona marcada.',
      'A4': 'Recarga tus habilidades a toda velocidad: úsalo antes de pelear.',
      'U': 'Cae una lluvia de cohetes y TNT sobre todos los rivales cercanos.',
    },
    dmgMul: 1,
  };
  CF_PERSONAJES['soru'].m1set = [
    { anim: [[0, 'scepterW', 900], [.09, 'scepterSmash', 1400], [.26, 'gatoHero', 450]], arc: { tilt: 1.4, len: 2.4, r: 2.2, w: .7, dir: -1 }, reach: 1.7, r: 1.6 },
    { anim: [[0, 'sweep', 900], [.06, 'sweep_w', 1400], [.17, 'sweepRec', 500]], arc: { tilt: -.4, len: 2.6, r: 2.1, w: .45, dir: -1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'scepterW', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .5, len: 2.6, r: 2.1, w: .45, dir: 1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'scepterW', 900], [.09, 'scepterSmash', 1400], [.26, 'gatoHero', 450]], arc: { tilt: 1.4, len: 2.4, r: 2.2, w: .7, dir: -1 }, reach: 1.7, r: 1.6 },
    { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2 }, reach: 1.6, r: 1.3 },
  ];
  if (window.CF_ORDEN && !CF_ORDEN.includes('soru')) CF_ORDEN.push('soru');   // sale al final del menu de personajes
})();
