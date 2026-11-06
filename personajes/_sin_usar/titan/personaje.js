/* =============================================================================
   PERSONAJE · Titán  (id: titan)
   Todo lo de este personaje vive en la carpeta personajes/_sin_usar/titan/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['titan'] = {
    name: 'Titán', title: 'Coloso de Piedra', role: 'TANQUE', color: '#ffd166', hp: 130, spd: .9, ai: 'melee', stance: 'heavy',
    desc: 'Lento pero aguanta muchísimo. Agarra y estrella, contraataca y cae del cielo como un meteoro.',
    stats: [5, 4, 2, 2, 3],
    skin: { skin: '#a0603a', hair: '#1c1c1c', eye: '#ffd166', shirt: '#5d4037', pants: '#3e2c22', shoes: '#1c1c1c', glove: '#ffd166', sleeve: 0, beard: '#1c1c1c', belt: '#ffd166', straps: '#ffd166' },
    skills: [
      { n: 'Suplex', d: 'Agarra al rival, lo levanta y lo estrella. No se puede bloquear.', k: 'grab', cd: 8, o: { dmg: 15 }, r: [0, 3.5], tags: 'close gb' },
      { n: 'Embestida', d: 'Carga con el hombro y arrastra.', k: 'rush', cd: 8, o: { dmg: 10, kb: 24, up: 6, ragdoll: 1.2, pose: 'shoulder', hitPose: 'shoulder' }, r: [2, 12], tags: 'gap gb' },
      { n: 'Terremoto', d: 'Golpe al suelo de radio enorme.', k: 'slam', cd: 10, o: { radius: 7, dmg: 10, jump: 9 }, r: [0, 6.5], tags: 'aoe gb' },
      { n: 'Contraataque', d: 'Postura: si te golpean, aparece detrás y devuelve el golpe.', k: 'counter', cd: 9, o: {}, r: [0, 4], tags: 'counter' },
    ],
    ult: { n: 'Meteoro', d: 'Salta al cielo y cae sobre el rival.', k: 'meteor', o: {}, r: [0, 20] },
    intro: [[0, 'stomp', 700], [.45, 'vpose', 500], [1.05, 'heavy', 400]],
    cine: [[0, 'charge', 400], [.85, 'lift', 500]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Martillo Aéreo', d: 'Lo lanza, salta y lo aplasta contra el piso.', k: 'airCombo', cd: 8, o: { dmg: 14 }, r: [0, 3], tags: 'close' },
    { n: 'Brazo de Piedra', d: 'Lo trae de lejos y lo estrella contra el piso de un lado y del otro.', k: 'chore', cd: 12, o: { id: 'titanArm' }, r: [4, 20], tags: 'proj gap', cine: 1 },
    { n: 'Tierra Temblorosa', d: 'El piso tiembla y lanza a todos cerca.', k: 'zone', cd: 10, o: { r: 6.5, dur: 4, dmg: 3, stun: .3, kb: 5, up: 4, fx: 'earth' }, r: [0, 6.5], tags: 'aoe' },
    { n: 'Destructor de Montañas', d: 'Salta altísimo con el rival en brazos y cae con un piledriver.', k: 'chore', cd: 14, o: { id: 'titanCrush' }, r: [0, 3.5], tags: 'close gb', cine: 1 },
    ],
  };
})();
