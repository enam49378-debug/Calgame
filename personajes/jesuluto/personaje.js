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
