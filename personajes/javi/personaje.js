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
