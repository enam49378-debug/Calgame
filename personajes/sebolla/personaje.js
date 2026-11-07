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
