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
    { n: 'Ojo del Cosmos', d: 'Redbird camina hasta quedar frente a la cámara, cae de rodillas y suelta un rayo gigante desde el visor. Si el rayo mata a 3 rivales o más, el cosmos responde: el rayo se vuelve más fuerte, atraviesa el espacio y rompe la Tierra antes de volver a la pelea.', k: 'rbCosmos', cd: 40, o: { need: 3, dmg: 8.5 }, r: [0, 40], tags: 'proj aoe gb' },
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
      'A4': 'Cinemática: Redbird carga y dispara un rayo gigante (no puedes moverte). Si el rayo mata a 3 rivales o más, la escena sigue en el espacio. Apunta hacia donde haya más rivales juntos.',
      'U': 'Un rayo gigante que rompe guardias: apuntalo a una fila de rivales.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: .85,
  };
})();
