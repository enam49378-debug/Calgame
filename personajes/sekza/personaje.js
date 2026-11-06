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
    { n: 'Vuelo Rasante', d: 'Sale volando como una flecha y atraviesa al rival; los que cruce salen despedidos.', k: 'sekFlight', cd: 8, o: { dmg: 6 }, r: [3, 22], tags: 'gap gb' },
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
      'A3': 'Te mueve muy rápido: sirve para escapar o cruzar el mapa atravesando rivales.',
      'A4': 'Fija a todos los rivales a la vez hasta 30 bloques: la mejor contra grupos dispersos.',
      'U': 'Durante el despertar mantené Espacio al caer para planear. Atacar desde el aire es su punto fuerte.',
    },
    // Multiplicador de daño ajustado con duelos de bots (1 = normal)
    dmgMul: 1.7,
  };
})();
