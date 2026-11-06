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
