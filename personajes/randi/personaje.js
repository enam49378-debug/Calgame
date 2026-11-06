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
