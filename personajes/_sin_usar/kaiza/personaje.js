/* =============================================================================
   PERSONAJE · Kaiza  (id: kaiza)
   Todo lo de este personaje vive en la carpeta personajes/_sin_usar/kaiza/
     personaje.js  este archivo: estadísticas, habilidades, despertar, consejos
     skin.png      su skin (se puede reemplazar sin tocar código)
   Para cambiar el equilibrio (vida, velocidad, daño, recargas) edita los números de aquí.
   Los movimientos (k: ...) están implementados en js/game.js dentro de MOVES.
   ============================================================================= */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['kaiza'] = {
    name: 'Kaiza', title: 'Puño Carmesí', role: 'PELEADOR', color: '#ff4d4d', hp: 100, spd: 1, ai: 'melee', stance: 'idle',
    desc: 'Cuerpo a cuerpo puro. Encadena golpes, lanza al rival por el aire y remata con un puñetazo que barre la arena.',
    stats: [3, 5, 3, 1, 2],
    skin: { skin: '#e9b88f', hair: '#d32f2f', eye: '#ffca28', shirt: '#24252e', pants: '#2f303a', shoes: '#121212', glove: '#c62828', belt: '#c62828', sleeve: 4, spiky: true, open: '#f1f1f1', scar: '#b5735a' },
    skills: [
      { n: 'Ráfaga', d: 'Lluvia de golpes que termina en un lanzamiento.', k: 'barrage', cd: 7, o: { hits: 10, dur: 1.0, dmg: 1.6 }, r: [0, 2.6], tags: 'close' },
      { n: 'Gancho Cohete', d: 'Se lanza hacia adelante y remata con un gancho al cielo.', k: 'rush', cd: 8, o: { dmg: 9, fin: 'upper' }, r: [2, 12], tags: 'gap gb' },
      { n: 'Impacto Sísmico', d: 'Salta y cae aplastando todo alrededor.', k: 'slam', cd: 10, o: { radius: 5, dmg: 11 }, r: [0, 5], tags: 'aoe gb' },
      { n: 'Onda de Choque', d: 'Explosión de aire que rompe guardias.', k: 'wave', cd: 9, o: { radius: 5, dmg: 8 }, r: [0, 4.5], tags: 'aoe gb' },
    ],
    ult: { n: 'Golpe Definitivo', d: 'Un solo puñetazo que arrasa en cono.', k: 'serious', o: {}, r: [0, 12] },
    intro: [[0, 'jabR_w'], [.1, 'jabR', 900], [.28, 'jabL', 900], [.5, 'upper_w'], [.66, 'upper', 900], [1.05, 'cross', 400]],
    cine: [[0, 'charge', 400], [.9, 'windup', 500]],
    // Habilidades que reemplazan a las normales al despertar (ulti)
    awk: [
    { n: 'Combo Aéreo', d: 'Gancho al cielo, salta detrás y lo estrella de vuelta.', k: 'airCombo', cd: 8, o: { dmg: 12 }, r: [0, 3], tags: 'close' },
    { n: 'Paso Sísmico', d: 'Tres embestidas que atraviesan al rival.', k: 'dashCombo', cd: 7, o: { n: 3, dmg: 4, dmg2: 11 }, r: [2, 16], tags: 'gap gb' },
    { n: 'Aura de Combate', d: 'Campo de presión que golpea y empuja a todos cerca.', k: 'zone', cd: 10, o: { r: 5, dur: 4, dmg: 3, stun: .3, kb: 4, fx: 'wind' }, r: [0, 5], tags: 'aoe' },
    { n: 'Paliza Seria', d: 'Ráfaga de puños y un único puñetazo serio que lo manda a volar.', k: 'chore', cd: 14, o: { id: 'kaizaSerious' }, r: [0, 3.5], tags: 'close gb', cine: 1 },
    ],
  };
})();
