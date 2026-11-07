// GENERADO por tools/actualizar_personajes.py  ·  NO editar a mano
// Edita personajes/<id>/personaje.js y personajes/<id>/Ataques basicos/Code/*.js

/* Registro de personajes. Se carga ANTES que cada personajes/<id>/personaje.js y js/game.js.
   CF_ORDEN define el orden en el que salen en el menú. Para añadir un personaje nuevo:
   crea personajes/<id>/personaje.js, añade el id aquí y su <script> en index.html. */
window.CF_PERSONAJES = {};
window.CF_ORDEN = ["javi", "redbird", "gato", "sekza", "rocket", "ukyo", "mattux", "sebolla", "randi", "capitan", "jesuluto"];


/* ===== personajes/javi/personaje.js ===== */
/* =============================================================================
   PERSONAJE · Javicubito  (id: javi)
   Todo lo de este personaje vive en la carpeta personajes/javi/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['javi'] = {
    name: 'Javicubito', title: 'Lancero Cúbico', role: 'LANCERO', color: '#3fa9ff', hp: 92, spd: 1.02, ai: 'melee', stance: 'lancer', weapon: 'spear', m1set: [] /* ver Ataques basicos/Code/ataques-basicos.js */, introDraw: .15,
    desc: 'Pelea con una lanza de Minecraft que lleva en la espalda y saca al atacar. Golpea de lejos, embiste y arroja una lanza que vuelve sola a su mano.',
    stats: [3, 4, 3, 4, 3],
    skinData: 'personajes/javi/skin.png',
    skin: { skin: '#c8a07a', hair: '#4a2f1b', eye: '#3b82f6', shirt: '#2f6fd6', pants: '#22324d', shoes: '#333333', sleeve: 12 },
    skills: [
      { n: 'Embestida', d: 'Carga con la lanza al frente y atraviesa a todos en el camino.', k: 'lunge', cd: 7, o: { dmg: 12 }, r: [2, 13], tags: 'gap gb' },
      { n: 'Lanza Leal', d: 'Arroja la lanza. Si elimina al rival, queda clavada: acércate al cuerpo para recuperarla.', k: 'spearThrow', cd: 6, o: { dmg: 11 }, r: [3, 22], tags: 'proj' },
      { n: 'Torbellino', d: 'Gira la lanza a tu alrededor, atrae a los rivales con cortes seguidos y al final los expulsa con un golpe fuerte.', k: 'whirl', cd: 9, o: {}, r: [0, 2.8], tags: 'close aoe' },
      { n: 'Picado del Dragón', d: 'Salta sobre el rival y clava la lanza en el suelo.', k: 'slam', cd: 10, o: { radius: 3.8, dmg: 15, jump: 15, fwd: 4, track: true, upPose: 'spearThrowW', downPose: 'plunge', landPose: 'plunge' }, r: [2, 12], tags: 'gap aoe gb' },
    ],
    ult: { n: 'Lluvia de Lanzas', d: 'Salta y hace llover lanzas sobre la zona; la última es gigante.', k: 'spearRain', o: {}, r: [0, 18] },
    intro: [[0, 'reach', 700], [.3, 'thrust_w', 800], [.45, 'thrust', 1100], [.75, 'sweep_w', 800], [.88, 'sweep', 1100], [1.25, 'lancer', 400]],
    cine: [[.12, 'reach'], [.3, 'twirlPose'], [.52, 'lancerAlt'], [.72, 'jCoil'], [.9, 'jLiftArc'], [1.05, 'jOver'], [1.19, 'jDrive'], [1.3, 'thrust'], [1.48, 'thrustRec'], [1.68, 'twirlPose'], [1.92, 'javiHero'], [2.24, 'jHeroBreath'], [2.55, 'javiHero']],
    cineTwirl: [[.32, 1, .32], [1.5, 1, .38]], cineContacts: [1.19, 1.92],
    flourish: { dur: 1.1, anim: [[0, 'twirlPose', 600], [.45, 'lancerAlt', 700], [.85, 'lancer', 400]], twirl: [2, .45], needWeapon: true },
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Parry del Dragón', d: 'Cruza la lanza en guardia diagonal durante 1.6 s: si lo golpean, desvía el ataque y desata un contraataque anime (ráfaga relámpago de estocadas, paso fantasma a la espalda, ascenso del dragón y picado celestial).', k: 'javiParry', cd: 14, o: { window: 1.6 }, r: [0, 4], tags: 'counter close gb' },
    { n: 'Embestida Relámpago', d: 'Choque de lanza: lo atraviesa tres veces como un rayo y cae del cielo sobre él.', k: 'chore', cd: 12, o: { id: 'javiDash' }, r: [0, 6], tags: 'gap gb', cine: 1 },
    { n: 'Cadena de Lanza', d: 'Engancha al rival de lejos, salta por encima y lo ensarta por la espalda.', k: 'chore', cd: 12, o: { id: 'javiChain' }, r: [4, 20], tags: 'proj gap', cine: 1 },
    { n: 'Empalamiento', d: 'Lo agarra de la cabeza, lo derriba, lo inmoviliza con el pie y remata con una estaca.', k: 'chore', cd: 14, o: { id: 'javiImpale' }, r: [0, 3.5], tags: 'close gb', cine: 1 },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'Usala para cerrar distancia o rematar a alguien que huye. Rompe guardia: ideal contra rivales que se quedan bloqueando.',
      'S2': 'Apuntá con la cámara (mejor con Shift lock). Si mata, la lanza queda clavada y peleás a puño limpio hasta recuperarla: no la tires si el rival está casi muerto y lejos.',
      'S3': 'Metete en medio de varios rivales: los atrae con cortes y al final los expulsa. Combina muy bien después de la Embestida.',
      'S4': 'Salta y busca solo al rival: buena para caer sobre un grupo o seguir a alguien que lanzaste por el aire.',
      'A1': 'Cruza la lanza y espera: si alguien te golpea durante 1,6 s, desvías el golpe y desatás un contraataque anime devastador (~4,5 s). Si nadie te golpea, no pasa nada.',
      'A2': 'Cinemática: si conecta, el rival no puede hacer nada hasta el final. Usala de cerca (hasta 6 bloques).',
      'A3': 'La única cinemática que agarra de lejos (4 a 20 bloques): perfecta para traer a alguien que se escapa.',
      'A4': 'La más larga y la que más daño hace: guardala para terminar la pelea. Necesitás estar pegado al rival.',
      'U': 'Cubre una zona grande: usala cuando varios rivales estén juntos. La última lanza, la gigante, es la que más pega.',
      'F1': 'Golpe rápido para empezar combos cuando no tenés la lanza.',
      'F2': 'Apretá otra vez la tecla (o clic) justo cuando el puño toca: si acertás hace 26 de daño y rompe guardia; si fallás es un golpe normal.',
      'F3': 'La tercera patada lanza al rival: saltá enseguida para seguir el combo en el aire.',
      'F4': 'Pega a todos los que tengas adelante: buena cuando te rodean.',
      'AF1': 'Tres oportunidades de Destello Negro seguidas: tocá en cada impacto. Cuantos más aciertes, más daño.',
      'AF2': 'Destroza el piso y lo que haya alrededor: usala en grupos o para romper coberturas.',
      'AF3': 'Como la Embestida con lanza, pero a puño: rompe guardia y arrolla a todos en línea.',
      'AF4': 'La cinemática más fuerte sin lanza: agarre de cerca y remate con Destello Negro garantizado.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: .9,
    // Habilidades sin la lanza (cuando la pierde): normales y al despertar
    fist: [
  { n: 'Puño Divergente', d: 'Un puñetazo que golpea dos veces: el segundo impacto llega un instante después, más fuerte.', k: 'fistDiv', cd: 6, o: {}, r: [0, 3.2], tags: 'close' },
  { n: 'Destello Negro', d: 'Carga el puño y vuelve a pulsar la tecla (o clic) justo al impactar: ¡Destello Negro! Si fallas el momento, golpe normal.', k: 'blackFlash', cd: 9, o: { dmg: 26 }, r: [0, 3.4], tags: 'close gb' },
  { n: 'Patada Giratoria', d: 'Tres patadas seguidas; la última lo lanza por los aires.', k: 'manjiKick', cd: 8, o: {}, r: [0, 3], tags: 'close' },
  { n: 'Ráfaga de Puños', d: 'Una lluvia de puñetazos veloces y un gancho que lo manda arriba.', k: 'fistFlurry', cd: 11, o: {}, r: [0, 3], tags: 'close aoe' },
    ],
    awkFist: [
  { n: 'Destellos Encadenados', d: 'Tres Destellos Negros seguidos: acierta el momento de cada uno (pulsa la tecla o clic en cada impacto).', k: 'bf3', cd: 12, o: {}, r: [0, 3.4], tags: 'close gb' },
  { n: 'Rompe Suelo', d: 'Salta y estrella el puño contra el piso: onda de choque que lo destroza todo alrededor.', k: 'groundBreak', cd: 11, o: {}, r: [0, 6], tags: 'aoe close' },
  { n: 'Embestida de Hombro', d: 'Carga con el hombro y arrolla a todos en el camino.', k: 'shoulderDash', cd: 8, o: {}, r: [2, 12], tags: 'gap gb' },
  { n: 'Furia del Destello', d: 'Coreografía: lo agarra, diez puñetazos seguidos, un gancho que lo sube y un Destello Negro que lo manda a volar.', k: 'chore', cd: 15, o: { id: 'javiFury' }, r: [0, 3.5], tags: 'close gb', cine: 1 },
    ],
  };
})();

/* ===== personajes/javi/Ataques basicos/Code/ataques-basicos.js ===== */
/* Ataques básicos de Javicubito (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['javi'].m1set = [
  { anim: [[0, 'thrust_w', 900], [.05, 'thrust', 1400], [.16, 'thrustRec', 500]], stab: true, reach: 1.9, r: 1.15 },
  { anim: [[0, 'sweep_w', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .12, len: 2.8, r: 2.2, w: .5, dir: 1 }, reach: 1.4, r: 1.6 },
  { anim: [[0, 'lancerAlt', 900], [.05, 'thrust', 1400], [.16, 'thrustRec', 500]], stab: true, reach: 1.9, r: 1.15 },
  { anim: [[0, 'overhead', 900], [.09, 'plunge', 1400], [.26, 'javiHero', 450]], arc: { tilt: 1.57, len: 2.2, r: 2.2, w: .6, dir: -1 }, reach: 1.7, r: 1.4, twirl: true },
  { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2, dir: 1 }, reach: 1.6, r: 1.3, twirl: true },
  ];
})();

/* ===== personajes/redbird/personaje.js ===== */
/* =============================================================================
   PERSONAJE · Redbird  (id: redbird)
   Todo lo de este personaje vive en la carpeta personajes/redbird/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['redbird'] = {
    name: 'Redbird', title: 'Visor Carmesí', role: 'LÁSER', color: '#ff2d55', hp: 95, spd: 1, ai: 'ranged', stance: 'redStance', eyeLaser: true, m1set: [] /* ver Ataques basicos/Code/ataques-basicos.js */,
    desc: 'Dispara rayos láser por los ojos a través de su visor. Barre la arena con el láser y se impulsa disparando al piso.',
    stats: [3, 4, 3, 5, 3],
    skinData: 'personajes/redbird/skin.png',
    skin: { skin: '#e8c79c', hair: '#3e9b35', eye: '#ff2020', shirt: '#2b5fbf', pants: '#f0b400', shoes: '#1d3a8a', sleeve: 12, goggles: '#ff2020' },
    skills: [
      { n: 'Rayo Óptico', d: 'Láser continuo desde el visor que empuja.', k: 'beam', cd: 14, o: { eyes: true, len: 20, dur: .9, dmg: 1.9, width: .45, charge: .3, push: 4 }, r: [3, 18], tags: 'proj' },
      { n: 'Ráfaga Óptica', d: 'Tres disparos rápidos de los ojos que persiguen.', k: 'eyeBolts', cd: 6, o: { speed: 48, dmg: 4, stun: .45, size: .22, long: 4, homing: 2 }, r: [3, 24], tags: 'proj' },
      { n: 'Pilar Láser', d: 'Marca el suelo del rival con el visor: un instante después un pilar de luz estalla y lo lanza por el aire.', k: 'pillar', cd: 9, o: { radius: 2.7, delay: .6, dmg: 7, up: 13, ragdoll: .9, color: '#ff2d55' }, r: [2, 16], tags: 'aoe' },
      { n: 'Impulso Óptico', d: 'Dispara al piso: explota y te lanza por el aire.', k: 'optoJump', cd: 8, o: {}, r: [0, 3.5], tags: 'close aoe gb' },
    ],
    ult: { n: 'Visor Máximo', d: 'Abre el visor del todo: un rayo gigante que rompe guardias.', k: 'beam', o: { eyes: true, len: 38, width: 1.6, dur: 1.4, dmg: 2.4, gb: true, push: 8, charge: .9 }, r: [2, 28] },
    intro: [[0, 'visorTouch', 600], [.6, 'point', 600], [1.1, 'loose', 400]],
    cine: [[0, 'redStance'], [.5, 'visorTouch'], [.78, 'lookDown'], [1.0, 'charge'], [1.35, 'point'], [1.6, 'redHero']],
    cineEyes: .5,
    flourish: { dur: 1.0, anim: [[0, 'visorTouch', 600], [.55, 'point', 600], [.85, 'redStance', 400]], eyes: true },
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Sobrecarga del Visor', d: 'Carga el visor al máximo y suelta un rayo enorme que rompe guardias y empuja muy lejos.', k: 'rbOverload', cd: 10, o: { hold: 1.95 }, r: [4, 26], tags: 'proj gb' },
    { n: 'Prismas Reflectantes', d: 'Deja tres prismas alrededor del rival y el rayo rebota en todos, pegando más fuerte en cada rebote.', k: 'rbMirrors', cd: 11, o: {}, r: [3, 24], tags: 'proj gap' },
    { n: 'Bombardeo Orbital', d: 'Una marca persigue al rival con retraso y el satélite dispara un pilar con dos ondas de columnas.', k: 'rbSatellite', cd: 14, o: { at: 1.7 }, r: [4, 26], tags: 'aoe' },
    { n: 'Ojo del Cosmos', d: 'Redbird camina hasta quedar frente a la cámara, cae de rodillas y suelta un rayo gigante desde el visor. Si el rayo mata a 2 rivales o más, el cosmos responde: el rayo se vuelve más fuerte, rompe un trozo de la Tierra y la cámara baja entre nubes hasta volver a la pelea.', k: 'rbCosmos', cd: 40, o: { need: 2, dmg: 8.5 }, r: [0, 40], tags: 'proj aoe gb' },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'Mantené la mira sobre el rival mientras dura: el láser lo va empujando, así que sirve para sacarlo de un lugar o tirarlo al mar.',
      'S2': 'Tres disparos que persiguen solos: ideal para pegar desde lejos y cargar el despertar sin arriesgarte.',
      'S3': 'Tiene medio segundo de retraso: usala cuando el rival esté aturdido, bloqueando o quieto.',
      'S4': 'Te lanza por el aire: sirve para escapar o subir a techos, y rompe la guardia de los que estén pegados.',
      'A1': 'Carga casi 2 s: no la uses con rivales encima. Desde lejos rompe guardias y los manda muy lejos.',
      'A2': 'Cada rebote pega más fuerte: funciona mejor contra un rival que se queda en el lugar.',
      'A3': 'La marca persigue con retraso: obligá al rival a moverse o usala cuando esté atrapado.',
      'A4': 'Cinemática: Redbird carga y dispara un rayo gigante (no puedes moverte). Si el rayo mata a 2 rivales o más, la escena sigue en el espacio. Apunta hacia donde haya más rivales juntos.',
      'U': 'Un rayo gigante que rompe guardias: apuntalo a una fila de rivales.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: .85,
  };
})();

/* ===== personajes/redbird/Ataques basicos/Code/ataques-basicos.js ===== */
/* Ataques básicos de Redbird (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['redbird'].m1set = [
  { anim: [[0, 'jabR_w', 900], [.05, 'jabR', 1400], [.15, 'redStance', 500]], arc: { tilt: .25, dir: 1 }, reach: 1.25, r: 1.25 },
  { anim: [[0, 'kick_w', 900], [.06, 'kick', 1400]], arc: { tilt: -.4, r: 1.9, w: .7, len: 2.6, dir: -1 }, reach: 1.4, r: 1.35 },
  { anim: [[0, 'kick_w', 900], [.05, 'kickHigh', 1400]], spin: TAU / .26, arc: { tilt: -.15, len: TAU * .9, r: 2, w: .5 }, reach: 1.1, r: 1.7 },
  { anim: [[0, 'visorTouch', 900], [.09, 'kickHigh', 1400], [.26, 'redHero', 450]], eyeStab: true, arc: { tilt: -.5, r: 2, w: .75, len: 2.8, dir: -1 }, reach: 1.6, r: 1.5 },
  { anim: [[0, 'upper_w', 900], [.08, 'upper', 1400]], eyeStab: true, arc: { tilt: 1.57, r: 1.6, len: 2.4 }, reach: 1.3, r: 1.3 },
  ];
})();

/* ===== personajes/gato/personaje.js ===== */
/* =============================================================================
   PERSONAJE · elGatopro300  (id: gato)
   Todo lo de este personaje vive en la carpeta personajes/gato/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['gato'] = {
    name: 'elGatopro300', title: 'Dios del Engaño', role: 'ILUSIONISTA', color: '#3ddc84', hp: 92, spd: 1.08, ai: 'mid', stance: 'elegant', weapon: 'scepter', m1set: [] /* ver Ataques basicos/Code/ataques-basicos.js */, introDraw: .45,
    desc: 'Loki, el Dios del Engaño, pelea de cerca y sucio: se lanza como una serpiente, te rodea con puñales a la velocidad de la luz, te agarra para apuñalarte por la espalda y te estrella desde el aire. Al despertar maneja el cetro: paliza, mil puñaladas, cadena mágica y el Truco Final.',
    stats: [2, 4, 4, 4, 5],
    skinData: 'personajes/gato/skin.png',
    skin: { skin: '#f3bdab', hair: '#ebebeb', eye: '#4c3b3b', shirt: '#84292d', pants: '#48698c', shoes: '#2e2728', sleeve: 12 },
    skills: [
      { n: 'Embestida Traicionera', d: 'Se lanza como una serpiente hacia el rival y, si lo alcanza, lo remata con un gancho al cielo que rompe la guardia.', k: 'rush', cd: 8, o: { dmg: 8, fin: 'upper' }, r: [2, 12], tags: 'gap gb' },
      { n: 'Danza de Puñales', d: 'Aparece alrededor del rival en zigzag y lo acuchilla cuatro veces a la velocidad de la luz; el último tajo lo lanza por los aires.', k: 'dashCombo', cd: 8, o: { n: 4, zig: true, dmg: 3, dmg2: 8 }, r: [2, 16], tags: 'gap gb' },
      { n: 'Puñal en la Espalda', d: 'Lo agarra, lo sujeta de espaldas y lo apuñala una y otra vez antes de lanzarlo de una patada. No se puede bloquear.', k: 'cineGrab', cd: 13, o: { style: 'shadow', dmg: 10 }, r: [0, 3.5], tags: 'close gb' },
      { n: 'Caída del Dios', d: 'Gancho al cielo, salta tras él, lo castiga en el aire y lo estrella contra el piso.', k: 'airCombo', cd: 10, o: { dmg: 10 }, r: [0, 3], tags: 'close' },
    ],
    ult: { n: 'Ejército de Ilusiones', d: 'Seis copias salen en círculo, persiguen a todos y explotan.', k: 'illusion', o: { count: 5, dmg: 5.5, speed: 14, life: 3, army: true }, r: [0, 22] },
    intro: [[0, 'cross', 500], [.45, 'signs', 600], [.8, 'point', 700], [1.2, 'elegant', 400]],
    cine: [[0, 'signs'], [.5, 'cross'], [.78, 'magicPalm'], [1.0, 'scepterW'], [1.35, 'bow'], [1.6, 'gatoHero']],
    cineTwirl: [[1.0, 1, .4], [1.6, 2, .45]],
    flourish: { dur: 1.3, anim: [[0, 'cross', 500], [.4, 'magicPalm', 700], [.8, 'bow', 500], [1.1, 'elegant', 400]], twirl: [1, .4], needWeapon: true, magic: .45 },
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Paliza del Cetro', d: 'Lo agarra, lo sujeta y lo golpea con el cetro cuatro veces antes de un remate mágico que lo lanza lejos. No se puede bloquear.', k: 'cineGrab', cd: 14, o: { style: 'magic', dmg: 13 }, r: [0, 3.5], tags: 'close gb' },
    { n: 'Mil Puñaladas', d: 'Seis cortes en zigzag a través del rival, cada vez más rápido, y un tajo final que lo manda por los aires.', k: 'dashCombo', cd: 12, o: { n: 6, zig: true, dmg: 2.6, dmg2: 9 }, r: [2, 18], tags: 'gap gb' },
    { n: 'Cadena Mágica', d: 'Lo atrae con magia, lo frena, golpecito en la frente... y estalla.', k: 'chore', cd: 12, o: { id: 'gatoChain' }, r: [4, 20], tags: 'proj gap', cine: 1 },
    { n: 'Truco Final', d: 'Reverencia burlona, lo da vuelta en el aire y una copia lo remata.', k: 'chore', cd: 14, o: { id: 'gatoTrick' }, r: [0, 3.5], tags: 'close gb', cine: 1 },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'Cierra la distancia de golpe: si conecta, el gancho final lo manda al aire para seguir con otra habilidad.',
      'S2': 'Cuatro puñaladas desde distintos lados: es difícil de esquivar corriendo, mejor bloquear o salir de rango.',
      'S3': 'Agarre de cerca que no se bloquea: el rival queda a tu merced unos segundos, úsalo cuando esté distraído.',
      'S4': 'Combo de cerca: lanza, salta y estrella. Ideal después de aturdirlo con la Embestida.',
      'A1': 'Agarre con cetro: cuatro golpes mágicos y un remate. Úsalo cuando el rival no pueda esquivar.',
      'A2': 'Seis cortes seguidos desde todos los lados: la más rápida de tus habilidades para hacer daño.',
      'A3': 'Rayo muy rápido y largo: perfecto para cortar a alguien que huye y dejarlo quieto 1,3 s.',
      'A4': 'La más vistosa: usala de cerca para cerrar la pelea.',
      'U': 'Seis copias salen en círculo y persiguen a todos: ideal cuando hay varios rivales alrededor.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: 1,
  };
})();

/* ===== personajes/gato/Ataques basicos/Code/ataques-basicos.js ===== */
/* Ataques básicos de elGatopro300 (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['gato'].m1set = [
  { anim: [[0, 'scepterW', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .5, len: 2.6, r: 2.1, w: .45, dir: 1 }, reach: 1.5, r: 1.5, magic: true },
  { anim: [[0, 'sweep_w', 900], [.06, 'thrust', 1400], [.16, 'thrustRec', 500]], stab: true, reach: 1.9, r: 1.15, magic: true },
  { anim: [[0, 'twirlPose', 800], [.07, 'magicPalm', 1400]], palm: true, reach: 1.6, r: 1.4 },
  { anim: [[0, 'scepterW', 900], [.09, 'scepterSmash', 1400], [.26, 'gatoHero', 450]], arc: { tilt: 1.4, len: 2.4, r: 2.2, w: .7, dir: -1 }, reach: 1.6, r: 1.6, magic: true, twirl: true },
  { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2 }, reach: 1.6, r: 1.3, magic: true, twirl: true },
  ];
})();

/* ===== personajes/sekza/personaje.js ===== */
/* =============================================================================
   PERSONAJE · Sekza  (id: sekza)
   Todo lo de este personaje vive en la carpeta personajes/sekza/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['sekza'] = {
    name: 'Sekza', title: 'Garra del Cielo', role: 'AÉREO', color: '#ffb020', hp: 92, spd: 1.1, ai: 'mid', stance: 'ninja', m1set: [] /* ver Ataques basicos/Code/ataques-basicos.js */, wings: true,
    special: {n:'Especial · Corriente del Cielo',key:'R',d:'R: vuela brevemente con WASD; Espacio sube y C baja. Doble R en la playa: ordena a las gaviotas atacar a rivales cercanos.'},
    desc: 'Pelea como un águila: zarpazos veloces, plumas que persiguen y picadas rasantes. Al despertar le salen alas, planea en el aire y su poder se vuelve una tormenta.',
    stats: [3, 4, 4, 3, 3],
    skin: { skin: '#fcd39d', hair: '#111010', eye: '#3b82f6', shirt: '#6d2225', pants: '#3d6676', shoes: '#191516', sleeve: 12 },
    skinData: 'personajes/sekza/skin.png',
    skills: [
      { n: 'Viento Cortante', d: 'Lanza una hoz de viento que sale en curva, llega lejos y vuelve a tu mano jalando a todos los que cruza.', k: 'sekBoomerang', cd: 6, o: { dmg: 4, range: 11 }, r: [3, 16], tags: 'proj' },
      { n: 'Picada de Halcón', d: 'Salta altísimo, marca el piso y cae en picada sobre el rival con un impacto que lo lanza por los aires.', k: 'sekDive', cd: 9, o: { dmg: 9 }, r: [4, 22], tags: 'gap gb' },
      { n: 'Ojo del Águila', d: 'Se queda quieta con la mirada fija: si la golpean en ese instante esquiva, aparece detrás del atacante y le devuelve el golpe.', k: 'sekParry', cd: 9, o: {}, r: [0, 6], tags: 'counter' },
      { n: 'Corriente Ascendente', d: 'Levanta una columna de aire que sube a los rivales por los cielos y los deja indefensos un momento.', k: 'sekUpdraft', cd: 10, o: { dmg: 3, r: 3.4 }, r: [3, 22], tags: 'aoe' },
    ],
    ult: { n: 'Alas del Águila', d: 'Le salen alas: durante el despertar planea en el aire (mantené Espacio al caer) y sus habilidades se vuelven una tormenta.', k: 'serious', o: {}, r: [0, 12] },
    intro: [[0, 'ninja', 500], [.5, 'castUp', 700], [1.0, 'point', 500], [1.4, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Lluvia de Plumas', d: 'Se eleva y sacude las alas: una lluvia de plumas cae del cielo sobre toda la zona del rival.', k: 'sekRain', cd: 11, o: { dmg: 3.2 }, r: [3, 20], tags: 'aoe' },
    { n: 'Cacería', d: 'Lo atrapa con las garras, lo lleva hasta las nubes y lo suelta en picada contra el suelo.', k: 'chore', cd: 14, o: { id: 'sekHunt' }, r: [0, 6], tags: 'close gap gb', cine: 1 },
    { n: 'Vuelo Sin Retorno', d: 'Se lanza en un dash para agarrar a alguien (si no atrapa a nadie, falla). Si lo agarra: lo hace girar, lo lanza al cielo, lo golpea con pajarones, lo patea dentro de un avión, lo persigue por el pasillo y lo estrella contra el suelo.', k: 'sekAbduct', cd: 15, o: { range: 9 }, r: [2, 9], tags: 'close gap gb', cine: 1 },
    { n: 'Mirada Letal', d: 'Fija con la vista a todos los rivales a la vez y los castiga con un rayo de luz cayendo del cielo.', k: 'sekLock', cd: 13, o: { dmg: 9, range: 30 }, r: [3, 30], tags: 'proj gb' },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'La hoz vuelve a tu mano y arrastra a los que cruza: tirala más allá del rival para traerlo hacia vos.',
      'S2': 'Marca el piso donde vas a caer: te encuentra aunque el rival se mueva un poco, y rompe guardia.',
      'S3': 'Es un parry: activala justo antes de que te peguen. Si nadie te pega en ese instante, se pierde.',
      'S4': 'Los sube por el aire y quedan indefensos: seguí con la Picada de Halcón o con el combo en el aire.',
      'A1': 'Cubre toda la zona del rival: buena para pegarle a un grupo desde arriba.',
      'A2': 'Cinemática: lo sube hasta las nubes y lo suelta en picada. Usala de cerca.',
      'A3': 'Dash para agarrar: si no atrapa a nadie falla y se recarga rápido. Si lo atrapa, empieza una cinemática larga que termina con el rival estrellado contra el suelo. Usala con el rival a menos de 9 bloques.',
      'A4': 'Fija a todos los rivales a la vez hasta 30 bloques: la mejor contra grupos dispersos.',
      'U': 'Durante el despertar mantené Espacio al caer para planear. Atacar desde el aire es su punto fuerte.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: 1.7,
  };
})();

/* ===== personajes/sekza/Ataques basicos/Code/ataques-basicos.js ===== */
/* Ataques básicos de Sekza (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['sekza'].m1set = [
  { anim: [[0, 'jabR_w', 900], [.05, 'jabR', 1400], [.15, 'ninja', 500]], arc: { tilt: .35, dir: 1, len: 2.2 }, reach: 1.3, r: 1.3 },
  { anim: [[0, 'jabL_w', 900], [.05, 'jabL', 1400], [.15, 'ninja', 500]], arc: { tilt: -.35, dir: -1, len: 2.2 }, reach: 1.3, r: 1.3 },
  { anim: [[0, 'kick_w', 900], [.06, 'kick', 1400], [.16, 'ninja', 500]], arc: { tilt: -.5, dir: 1, len: 2.4, r: 1.9 }, reach: 1.5, r: 1.4 },
  { anim: [[0, 'kick_w', 900], [.08, 'kickHigh', 1400], [.26, 'ninja', 450]], arc: { tilt: .9, len: 2.8, r: 2.1, w: .6, dir: -1 }, reach: 1.7, r: 1.5 },
  { anim: [[0, 'upper_w', 900], [.08, 'upper', 1400]], arc: { tilt: 1.57, r: 1.6, len: 2.4 }, reach: 1.5, r: 1.3 },
  ];
})();

/* ===== personajes/rocket/personaje.js ===== */
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

/* ===== personajes/rocket/Ataques basicos/Code/ataques-basicos.js ===== */
/* Ataques básicos de Rocket (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['rocket'].m1set = [
  { anim: [[0, 'jabR_w', 900], [.05, 'hook', 1400], [.15, 'ninja', 500]], arc: { tilt: .1, dir: 1, len: 2.4, r: 1.7 }, reach: 1.35, r: 1.35 },
  { anim: [[0, 'jabL', 900], [.05, 'jabL', 1400], [.15, 'ninja', 500]], arc: { tilt: -.3, dir: -1, len: 2.4 }, reach: 1.35, r: 1.35 },
  { anim: [[0, 'kick_w', 900], [.06, 'kick', 1400], [.16, 'ninja', 500]], arc: { tilt: -.5, dir: 1, len: 2.4, r: 1.9 }, reach: 1.5, r: 1.4 },
  { anim: [[0, 'kick_w', 900], [.08, 'kickHigh', 1400], [.26, 'ninja', 450]], arc: { tilt: .9, len: 2.8, r: 2.1, w: .6, dir: -1 }, reach: 1.7, r: 1.5 },
  { anim: [[0, 'upper_w', 900], [.08, 'upper', 1400]], arc: { tilt: 1.57, r: 1.6, len: 2.4 }, reach: 1.5, r: 1.3 },
  ];
})();

/* ===== personajes/ukyo/personaje.js ===== */
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
  CF_PERSONAJES['ukyo'] = {
    name: 'ItzUkyo', title: 'Espada Carmesí', role: 'ESPADACHÍN', color: '#e0263a', hp: 100, spd: 1.04, ai: 'melee', stance: 'idle', weapon: 'sword', m1set: [] /* ver Ataques basicos/Code/ataques-basicos.js */, introDraw: .2, fireSword: true,
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

/* ===== personajes/ukyo/Ataques basicos/Code/ataques-basicos.js ===== */
/* Ataques básicos de ItzUkyo (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['ukyo'].m1set = [
  { anim: [[0, 'scepterW', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .5, len: 2.6, r: 2.1, w: .45, dir: 1 }, reach: 1.6, r: 1.5 },
  { anim: [[0, 'sweep', 900], [.06, 'sweep_w', 1400], [.17, 'sweepRec', 500]], arc: { tilt: -.4, len: 2.6, r: 2.1, w: .45, dir: -1 }, reach: 1.6, r: 1.5 },
  { anim: [[0, 'thrust_w', 900], [.06, 'thrust', 1400], [.16, 'thrustRec', 500]], stab: true, reach: 1.95, r: 1.15 },
  { anim: [[0, 'scepterW', 900], [.09, 'scepterSmash', 1400], [.26, 'gatoHero', 450]], arc: { tilt: 1.4, len: 2.4, r: 2.2, w: .7, dir: -1 }, reach: 1.7, r: 1.6 },
  { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2 }, reach: 1.6, r: 1.3 },
  ];
})();

/* ===== personajes/mattux/personaje.js ===== */
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

/* ===== personajes/sebolla/personaje.js ===== */
/* =============================================================================
   PERSONAJE · Seb0lla  (id: sebolla)
   Todo lo de este personaje vive en la carpeta personajes/sebolla/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['sebolla'] = {
    name: 'Seb0lla', title: 'El del Paquete Misterioso', role: 'HUMORISTA', color: '#fa6c00', hp: 100, spd: 1.05, ai: 'mid', stance: 'idle', verity: true,
    desc: 'Humorista de Minecraft y mejor amigo de Verity, la esfera sonriente que lo sabe todo y lo acompaña siempre. En su estado normal pelea a puñetazo limpio con ella (Paliza, Pelota y Sándwich) y se defiende con un Parry. Al despertar Verity se pone seria y todo se vuelve cinemática: Dúo Dinámico, Rayo a Quemarropa, Maratón y la gran Verity Gigante, un humanoide enorme al que monta como a un caballo.',
    stats: [3, 4, 4, 3, 4],
    skin: { skin: '#a97864', hair: '#664b3d', eye: '#464a99', shirt: '#fa6c00', pants: '#464a99', shoes: '#a0a3ad', sleeve: 12 },
    skinData: 'personajes/sebolla/skin.png',
    // golpes basicos de Seb0lla: mas alcance y avanzan hacia el rival (antes solo pegaban pegado a el)
    m1set: [
      { anim: [[0, 'jabR_w', 800], [.05, 'jabR', 1100]], arc: { tilt: .25, dir: 1 }, reach: 1.9, r: 1.65, lunge: 6.5 },
      { anim: [[0, 'jabL_w', 800], [.05, 'jabL', 1100]], arc: { tilt: -.25, dir: -1 }, reach: 1.9, r: 1.65, lunge: 6.5 },
      { anim: [[0, 'hook_w', 800], [.06, 'hook', 1100]], arc: { tilt: .08, dir: 1, len: 2.9, r: 1.75, w: .6 }, reach: 2.1, r: 1.95, lunge: 7 },
      { anim: [[0, 'kick_w', 800], [.08, 'kick', 1100]], arc: { tilt: -.45, r: 1.95, w: .75, len: 2.8, dir: -1 }, reach: 2.3, r: 2.05, lunge: 7 },
      { anim: [[0, 'upper_w', 800], [.08, 'upper', 1100]], arc: { tilt: 1.57, r: 1.6, len: 2.4 }, reach: 2.0, r: 1.85, lunge: 5 },
    ],
    skills: [
      { n: 'Paliza de Verity', d: 'Se lanza sobre el rival y le da una lluvia de puñetazos; Verity entra con un cabezazo y un gancho final lo manda por los aires.', k: 'sebBrawlA', cd: 9, o: {}, r: [0, 6], tags: 'close gap gb' },
      { n: 'Pelota de Verity', d: 'Patea al rival al cielo y Verity lo remata desde arriba, estampándolo contra el piso con una onda de choque.', k: 'sebBallA', cd: 11, o: {}, r: [0, 4], tags: 'close gb' },
      { n: 'Sándwich', d: 'Verity aparece detrás del rival: Seb0lla y ella se lo pasan de golpe en golpe como ping-pong y lo aplastan con un aplauso explosivo.', k: 'sebSandA', cd: 10, o: {}, r: [0, 4], tags: 'close gb' },
      { n: 'Parry', d: 'Se cubre con los brazos 0.5 s: si lo golpean, Verity aparece frente al atacante, lo aturde, lo empuja y Seb0lla se cura un poco.', k: 'sebParry', cd: 8, o: {}, r: [0, 4], tags: 'counter' },
    ],
    ult: { n: 'Verity™', d: 'Abre un paquete misterioso y Verity despierta: se agranda, lo cura todo y empieza a atacar sola. Sus habilidades pasan a ser cinemáticas de pelea: Dúo Dinámico, Rayo a Quemarropa, Maratón de Verity y Verity Gigante.', k: 'serious', o: {}, r: [0, 12] },
    intro: [[0, 'idle', 500], [.5, 'castUp', 700], [1.0, 'point', 500], [1.4, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Verity Gigante', d: 'Verity se transforma en una criatura humanoide enorme, Seb0lla se sube a su cabeza y la conduces como a un caballo 12 s: sus pasos aplastan con un radio enorme, destruyen edificios y puedes embestir con Q.', k: 'sebMount', cd: 20, o: { dur: 12 }, r: [0, 40], tags: '' },
    { n: 'Dúo Dinámico', d: 'Ráfaga de más de diez golpes a toda velocidad (¡ORA ORA ORA!) y Verity cae desde el cielo con un puñetazo gigante que parte el piso.', k: 'chore', cd: 14, o: { id: 'sebDuo' }, r: [0, 5], tags: 'close gap gb', cine: 1 },
    { n: 'Rayo a Quemarropa', d: 'Lo agarra del cuello, lo golpea tres veces mientras Verity carga, y lo lanza de cabeza contra su rayo.', k: 'chore', cd: 13, o: { id: 'sebPoint' }, r: [0, 5], tags: 'close gap gb', cine: 1 },
    { n: 'Maratón de Verity', d: 'Se teletransporta alrededor del rival golpeándolo desde todos los lados sin parar y lo remata con una patada voladora.', k: 'chore', cd: 12, o: { id: 'sebMarathon' }, r: [0, 5], tags: 'close gap gb', cine: 1 },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'Se lanza sobre el rival: buena para empezar la pelea, y rompe guardia.',
      'S2': 'Patea al rival al cielo y Verity lo estampa: usala de cerca.',
      'S3': 'Verity aparece atrás del rival: no tiene a dónde escapar.',
      'S4': 'Activala justo antes de que te peguen: si aciertan, Verity los aturde y vos te curás.',
      'A1': 'Durante 12 s manejás a Verity gigante: caminá encima de los rivales y usá Q para embestir.',
      'A2': '¡ORA ORA ORA!: cinemática de cerca con más de diez golpes.',
      'A3': 'Lo agarra del cuello y lo lanza de cabeza contra el rayo de Verity.',
      'A4': 'Lo golpea desde todos los lados y remata con una patada voladora.',
      'U': 'Verity se agranda, te cura del todo y ataca sola: tus habilidades pasan a ser cinemáticas.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: .95,
  };
})();

/* ===== personajes/randi/personaje.js ===== */
/* =============================================================================
   PERSONAJE · ElRandi  (id: randi)
   Todo lo de este personaje vive en la carpeta personajes/randi/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['randi'] = {
    name: 'ElRandi', title: 'Invocador del Perú', role: 'INVOCADOR', color: '#d6222c', hp: 100, spd: 1.03, ai: 'mid', stance: 'idle',
    desc: 'Peruano y maestro de las sombras (a lo Megumi). Sus palomas MARCAN al rival (Picoteado) y el resto de habilidades se aprovecha de esas marcas; corre dibujando líneas de Nazca y se toma un pisco para chispearse. Al despertar (G) gana Cóndor, Perros viringos, el duelo Tinku y la gran invocación: acércate a un rival y llama a Capitán Perú.',
    stats: [3, 3, 4, 3, 4],
    skin: { skin: '#c99a7b', hair: '#8b3a12', eye: '#2b1a10', shirt: '#1b1517', pants: '#1b1517', shoes: '#1b1517', sleeve: 12 },
    skinData: 'personajes/randi/skin.png',
    skills: [
      { n: 'Paloma Mensajera', d: 'Una paloma veloz persigue al rival y lo marca con PICOTEADO (hasta ×3, 7 s). Cada marca hace que sus habilidades le peguen un 12 % más fuerte.', k: 'randiPaloma', cd: 5, o: { dmg: 3.2 }, r: [3, 26], tags: 'proj' },
      { n: 'Cuyes Bomba', d: 'Suelta cuatro cuyes que corren por el suelo, saltan y estallan junto al rival. Si estaba marcado con Picoteado, gasta las marcas y sufre daño extra.', k: 'randiCuyes', cd: 9, o: { dmg: 2.8 }, r: [2, 16], tags: 'aoe' },
      { n: 'Estampida Andina', d: 'Llama a una manada de llamas que carga en línea recta arrasando todo a su paso: lanza por los aires a quien toquen y rompe lo que encuentre.', k: 'randiLlamas', cd: 11, o: { dmg: 6 }, r: [2, 16], tags: 'proj gap' },
      { n: 'Pisco Sour', d: 'Se toma un pisco sour: 7 s CHISPEADO, más rápido (×1.3), pega un 20 % más y se cura un poco con cada golpe.', k: 'randiPisco', cd: 16, o: { dur: 7 }, r: [0, 14], tags: 'buff' },
    ],
    ult: { n: 'Sombras del Perú', d: 'ElRandi despierta 30 s: se cura del todo y sus habilidades cambian por otras más fuertes, entre ellas la invocación de Capitán Perú (cerca de un rival; gasta 12 s de despertar).', k: 'serious', o: {}, r: [0, 12] },
    intro: [[0, 'idle', 500], [.5, 'castUp', 700], [1.0, 'point', 500], [1.4, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Capitán Perú', d: 'La gran invocación (necesita un rival cerca y gasta 12 s de despertar): Capitán Perú patea a ElRandi y pasas a controlarlo. Matar y golpear le suma tiempo; cuando se acaba, Capitán Perú cae y ElRandi con él.', k: 'randiMahoraga', cd: 3, o: {}, r: [0, 9], tags: 'close' },
    { n: 'Cóndor de los Andes', d: 'Un cóndor cae del cielo sobre el rival, lo atrapa y lo sube; un instante después lo suelta contra el piso.', k: 'randiCondor', cd: 10, o: { dmg: 9 }, r: [3, 24], tags: 'proj gap' },
    { n: 'Perros Viringos', d: 'Dos perros peruanos sin pelo salen corriendo y muerden al rival por los dos lados durante 9 s.', k: 'randiPerros', cd: 14, o: {}, r: [0, 22], tags: 'proj' },
    { n: 'Tinku', d: 'Levanta un círculo de piedras: tú y el rival quedan encerrados 6 s en un duelo andino. Mientras dure, pegas un 20 % más fuerte.', k: 'randiTinku', cd: 18, o: {}, r: [0, 7], tags: 'close' },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'Empezá siempre por acá: cada marca de Picoteado hace que tus habilidades peguen un 12 % más (hasta ×3).',
      'S2': 'Si el rival tiene marcas, las gasta para hacer daño extra: tirala después de 2 o 3 palomas.',
      'S3': 'Las llamas arrasan en línea recta y rompen lo que encuentran: buena contra grupos.',
      'S4': '7 s más rápido y pegando un 20 % más: tomalo antes de lanzarte a pelear.',
      'A1': 'Necesitás un rival cerca y gasta 12 s de despertar: pasás a controlar a Capitán Perú, que se vuelve más resistente con cada golpe que recibe.',
      'A2': 'Atrapa al rival desde el cielo y lo suelta contra el piso: funciona de lejos.',
      'A3': 'Dos perros lo muerden por los dos lados durante 9 s: soltalos y seguí peleando.',
      'A4': 'Te encierra con el rival 6 s y pegás un 20 % más: usala contra el más débil para que no escape.',
      'U': 'Te cura del todo y dura 30 s: es el momento de invocar a Capitán Perú.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: 1.05,
  };
})();

/* ===== personajes/capitan/personaje.js ===== */
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

/* ===== personajes/jesuluto/personaje.js ===== */
/* =============================================================================
   PERSONAJE · Jesuluto  (id: jesuluto)
   Todo lo de este personaje vive en la carpeta personajes/jesuluto/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['jesuluto'] = {
    name: 'Jesuluto', title: 'Computadora del Caos', role: 'ORDENADOR', color: '#0078d7', hp: 100, spd: 1, ai: 'mid', stance: 'idle', screenHead: true, bsod: true,
    desc: 'Una computadora con vida propia. Su pantalla le cambia la cara según la pelea: lanza ventanas de error, vuelve atrás en el tiempo con Ctrl+Z, formatea el piso y siempre lo acompaña Clippy, el asistente que ataca solo. Al despertar llega la Pantalla Azul.',
    stats: [3, 3, 4, 4, 3],
    skin: { skin: '#f2b07a', hair: '#e8a860', eye: '#6bff3a', shirt: '#f0a84e', pants: '#f0a84e', shoes: '#f0c9a0', sleeve: 12 },
    slim: true, skinData: 'personajes/jesuluto/skin.png',
    skills: [
      { n: 'Ventanas de Error', d: 'Lanza cuatro ventanas de error que persiguen al rival; las tres primeras aturden y la última es enorme: «ERROR FATAL», lo lanza por los aires.', k: 'jlError', cd: 7, o: { dmg: 4.5 }, r: [3, 20], tags: 'proj' },
      { n: 'Clipazo', d: '«¡Parece que estás atacando!» Clippy sale disparado, golpea y aturde al rival y vuelve emocionado: durante 6 s ayuda mucho más con cada golpe tuyo.', k: 'jlClippy', cd: 11, o: { dmg: 8, dur: 6 }, r: [2, 22], tags: 'gap' },
      { n: 'Ctrl + Z', d: 'Deshace los últimos 3 segundos: vuelve a donde estabas y recupera vida. La copia que deja atrás estalla.', k: 'jlUndo', cd: 11, o: {}, r: [0, 4], tags: 'gap' },
      { n: 'Formatear C:', d: 'Empieza a formatear el piso a su alrededor (¡sin apagar!). Al llegar al 100 % estalla, rompe guardias y lanza a los rivales.', k: 'jlFormat', cd: 10, o: { dmg: 11, r: 6.2 }, r: [0, 6], tags: 'close aoe gb' },
    ],
    ult: { n: 'Pantalla Azul', d: 'Se cuelga con una Pantalla Azul de la Muerte que lanza una onda y llena todo de errores. Al despertar se cura del todo, Clippy crece y sus habilidades se vuelven puro caos de Windows.', k: 'serious', o: {}, r: [0, 12] },
    intro: [[0, 'idle', 500], [.5, 'castUp', 700], [1.0, 'point', 500], [1.4, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Lluvia de Errores', d: 'Marca una zona y le llueven ventanas de error del cielo: cada una explota al caer.', k: 'jlRain', cd: 11, o: { dmg: 3.6 }, r: [3, 24], tags: 'aoe' },
    { n: 'Clippy Gigante', d: 'Clippy se hace enorme, se lanza sobre el rival y cae de golpe lanzándolo por los aires.', k: 'jlGiant', cd: 13, o: { dmg: 13 }, r: [3, 22], tags: 'gap gb' },
    { n: 'No Responde', d: 'Una barra de progreso gigante avanza arrasando: quien toca queda congelado «sin responder» y con la guardia rota.', k: 'jlWave', cd: 11, o: { dmg: 7 }, r: [3, 22], tags: 'proj gb' },
    { n: 'Virus.exe', d: 'Cinco virus orbitan a tu alrededor y salen a infectar al rival; cada uno estalla al tocar.', k: 'orbitals', cd: 9, o: { n: 5, kind: 'orb', dur: 7, rate: .55, proj: { speed: 30, dmg: 5, size: .45, explode: 2.2, homing: 2 } }, r: [0, 25], tags: 'proj' },
    ],
    // Consejos de uso que salen en el Libro de habilidades (S1-S4 normales, A1-A4 despierto, F sin lanza, U ulti)
    consejos: {
      'S1': 'Las tres primeras ventanas aturden y la última, ERROR FATAL, lo lanza: tirala desde lejos.',
      'S2': 'Además de pegar, Clippy te ayuda más durante 6 s: usala antes de empezar el combo.',
      'S3': 'Te devuelve adonde estabas hace 3 s y te cura: usala cuando te estén ganando.',
      'S4': 'Tarda en cargar: plantate en el medio de un grupo y que no te saquen antes del 100 %.',
      'A1': 'Llueve sobre la zona marcada: buena contra grupos o rivales quietos.',
      'A2': 'Clippy cae encima del rival y lo lanza: rompe guardia.',
      'A3': 'Congela a quien toca y le rompe la guardia: tirala a una fila de rivales.',
      'A4': 'Cinco virus disparan solos durante 7 s: activala y seguí atacando.',
      'U': 'Te cura del todo y Clippy crece: tus habilidades pasan a ser puro caos de Windows.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: .9,
  };
})();

/* ===== sonidos propios de cada habilidad (personajes/<id>/Skills/Sound/<Habilidad>/) ===== */
window.CF_SONIDOS_HAB = {};
