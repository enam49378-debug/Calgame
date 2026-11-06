/* =============================================================================
   PERSONAJE · Brasa  (id: brasa)
   Todo lo de este personaje vive en la carpeta personajes/_sin_usar/brasa/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['brasa'] = {
    name: 'Brasa', title: 'Llama Indomable', role: 'EXPLOSIVA', color: '#ff8a1f', hp: 100, spd: 1, ai: 'mid', stance: 'idleM',
    desc: 'Patadas de fuego y erupciones bajo los pies del rival. Su ulti explota en tres anillos cada vez más grandes.',
    stats: [3, 5, 3, 4, 3],
    skin: { skin: '#9a5b34', hair: '#ff6d00', eye: '#ffab00', shirt: '#3e2723', pants: '#212121', shoes: '#ff6d00', glove: '#ff8a1f', sleeve: 0, spiky: true, flame: '#ff6d00', band2: '#ffd54f' },
    skills: [
      { n: 'Bola de Fuego', d: 'Proyectil rápido que estalla.', k: 'shoot', cd: 5, o: { count: 1, speed: 34, dmg: 7, size: .6, explode: 2.2, homing: 1, anim: 'throw' }, r: [3, 24], tags: 'proj' },
      { n: 'Patada Ígnea', d: 'Patada voladora que manda lejos.', k: 'rush', cd: 8, o: { dmg: 8, kb: 20, up: 7, ragdoll: 1.1, pose: 'kickRush', hitPose: 'kick' }, r: [2, 12], tags: 'gap gb' },
      { n: 'Erupción', d: 'Marca el suelo del rival; un instante después estalla hacia arriba.', k: 'pillar', cd: 9, o: { radius: 2.8, delay: .55, dmg: 12, up: 18, ragdoll: 1.3 }, r: [2, 16], tags: 'aoe' },
      { n: 'Línea de Llamas', d: 'Explosiones en fila hacia adelante.', k: 'flameline', cd: 8, o: {}, r: [1, 10], tags: 'aoe' },
    ],
    ult: { n: 'Supernova', d: 'Se eleva y estalla tres veces.', k: 'nova', o: {}, r: [0, 11] },
    intro: [[0, 'kick_w'], [.15, 'kick', 900], [.55, 'stomp', 700], [.9, 'vpose', 500]],
    cine: [[0, 'charge', 400], [.85, 'castUp', 600]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Suelo de Lava', d: 'El piso se vuelve lava y quema a quien lo pise.', k: 'zone', cd: 10, o: { r: 6, dur: 5, dmg: 3, stun: .25, fx: 'fire' }, r: [0, 6], tags: 'aoe' },
    { n: 'Patadas del Fénix', d: 'Patada al cielo, combo aéreo de fuego y caída.', k: 'airCombo', cd: 8, o: { dmg: 12 }, r: [0, 3], tags: 'close' },
    { n: 'Látigo de Fuego', d: 'Látigo que atrapa al rival y lo trae para rematarlo.', k: 'pullStrike', cd: 7, o: { dmg: 12 }, r: [4, 20], tags: 'proj gap' },
    { n: 'Ejecución Volcánica', d: 'Patadas de fuego en espiral y un volcán que se abre bajo sus pies.', k: 'chore', cd: 14, o: { id: 'brasaVolcano' }, r: [0, 3.5], tags: 'close gb', cine: 1 },
    ],
  };
})();
