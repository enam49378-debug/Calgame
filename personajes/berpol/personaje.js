/* =============================================================================
   PERSONAJE · Berpol  (id: berpol)  ·  temática: garabatos y dibujos
   Todo lo de este personaje vive en la carpeta personajes/berpol/
     personaje.js    este archivo: estadísticas, habilidades, despertar, consejos y ataques básicos
     habilidades.js  el código de sus habilidades (todo lo dibuja con trazos de tinta antes de que haga efecto)
     skin.png        su skin
   Berpol pelea dibujando: primero se ve el trazo en el aire o en el suelo y después el dibujo cobra vida.
   Eso da tiempo a reaccionar a los rivales: cada ataque se ve venir mientras se dibuja.
   ============================================================================= */
(function () {
  CF_PERSONAJES['berpol'] = {
    name: 'Berpol', title: 'El Garabateador', role: 'ARTISTA', color: '#ff7ac8', hp: 98, spd: 1.04, ai: 'melee', stance: 'idle', weapon: 'pencil', m1set: [] /* abajo */, introDraw: .2,
    desc: 'Dibuja sus ataques: garabatos que atrapan, bolas de papel que rebotan, gomas que borran todo, muñecos de palitos que corren a explotar. Al despertar dibuja cohetes, charcos de tinta, remolinos y hojas gigantes.',
    stats: [3, 4, 4, 5, 3],
    skinData: 'personajes/berpol/skin.png',
    skin: { skin: '#f0c8a8', hair: '#f4a6d0', eye: '#2b2b2b', shirt: '#6aa7ff', pants: '#3a3f6b', shoes: '#f2f2f2', sleeve: 12 },
    skills: [
      { n: 'Garabato Rayado', d: 'Dibuja una línea en zigzag frente a él. Cuando termina de trazarse, queda como una trampa de tinta que daña y ralentiza a quien la toque.', k: 'berScribble', cd: 9, o: { dmg: 4, len: 13 }, r: [2, 14], tags: 'aoe' },
      { n: 'Bola de Papel', d: 'Dibuja un círculo, lo arruga en una bola y la lanza: rebota tres veces y en la última se abre en un estallido de garabatos.', k: 'berPaper', cd: 9, o: { dmg: 4 }, r: [4, 22], tags: 'proj aoe' },
      { n: 'Goma de Borrar', d: 'Dibuja un recuadro y lo borra de un golpe con una goma gigante: empuja a los rivales y borra los proyectiles que haya dentro.', k: 'berEraser', cd: 11, o: { dmg: 9 }, r: [1, 9], tags: 'close aoe' },
      { n: 'Muñeco de Palitos', d: 'Dibuja un muñeco de palitos que corre hacia el rival más cercano y explota en tinta.', k: 'berStick', cd: 12, o: { dmg: 10 }, r: [4, 26], tags: 'proj aoe' },
    ],
    ult: { n: 'Obra Maestra', d: 'Dibuja un monstruo gigante a sus espaldas. El monstruo pisotea a los rivales uno por uno y al final Berpol lo tacha con una X enorme.', k: 'berUlt', o: { n: 6, dmg: 9 }, r: [0, 30] },
    intro: [[0, 'idle', 400], [.45, 'castUp', 700], [1.1, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    flourish: { dur: 1.0, anim: [[0, 'charge', 500], [.55, 'castUp', 600], [.85, 'idle', 400]] },
    awk: [
      { n: 'Cohete de Lápiz', d: 'Dibuja un cohete, lo suelta y lo guía hacia el rival: explota en un estallido dibujado.', k: 'berRocket', cd: 9, o: { dmg: 16 }, r: [4, 28], tags: 'proj aoe' },
      { n: 'Charco de Tinta', d: 'Dibuja un círculo bajo el rival y lo rellena de tinta: ralentiza y daña a los que están dentro, y Berpol corre más rápido ahí.', k: 'berPond', cd: 13, o: { dmg: 1.5, time: 6 }, r: [3, 22], tags: 'aoe' },
      { n: 'Remolino de Garabatos', d: 'Dibuja una espiral que gira alrededor de él, atrae a los rivales hacia el centro y termina en una explosión de trazos.', k: 'berTornado', cd: 12, o: { dmg: 2 }, r: [0, 8], tags: 'close aoe' },
      { n: 'Hoja en Blanco', d: 'Una hoja gigante cae sobre la zona marcada y la aplasta; al impactar se arruga y deja un estallido de garabatos.', k: 'berPage', cd: 14, o: { dmg: 20 }, r: [3, 22], tags: 'aoe gb' },
    ],
    consejos: {
      'S1': 'Mientras lo dibuja se ve el trazo: úsalo para cortar el paso a un rival que corre.',
      'S2': 'La bola rebota: apunta un poco antes del rival y deja que llegue sola.',
      'S3': 'Muy buena para limpiar proyectiles y empujar a quien tengas encima.',
      'S4': 'El muñeco persigue solo: úsalo para obligar a mover al rival.',
      'A1': 'El cohete se guía solo hacia el rival: suéltalo desde lejos.',
      'A2': 'Pelea dentro del charco: tú corres más y los demás van lentos.',
      'A3': 'Atrae a todos hacia ti: junta rivales antes de rematar.',
      'A4': 'La zona se ve antes de caer: úsala cuando el rival esté atrapado.',
      'U': 'Cada pisotón cae sobre un rival distinto.',
    },
    dmgMul: 1, m1speed: .96,
  };
  CF_PERSONAJES['berpol'].m1set = [
    { anim: [[0, 'sweep', 900], [.06, 'sweep_w', 1400], [.17, 'sweepRec', 500]], arc: { tilt: -.4, len: 2.4, r: 2.0, w: .45, dir: -1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'scepterW', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .5, len: 2.4, r: 2.0, w: .45, dir: 1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'sweep', 900], [.06, 'sweep_w', 1400], [.17, 'sweepRec', 500]], arc: { tilt: -.4, len: 2.4, r: 2.0, w: .45, dir: -1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2 }, reach: 1.6, r: 1.3 },
  ];
  if (window.CF_ORDEN && !CF_ORDEN.includes('berpol')) CF_ORDEN.push('berpol');   // sale al final del menu de personajes
})();
