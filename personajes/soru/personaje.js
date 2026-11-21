/* =============================================================================
   PERSONAJE · Soru San  (id: soru)  ·  temática: jugador técnico de Minecraft vanilla
   Todo lo de este personaje vive en la carpeta personajes/soru/
     personaje.js    este archivo: estadísticas, habilidades, despertar, consejos y ataques básicos
     habilidades.js  el código de sus habilidades (maza, élitros, TNT, tótem, carga de viento...)
     skin.png        su skin (se puede reemplazar sin tocar código)
   Soru San es un animador y jugador de Minecraft vanilla: sabe de mecánicas, de redstone y de todo lo del juego base.
   Por eso pelea con lo que da el juego sin mods: la maza, los élitros con cohetes, el tótem de la inmortalidad, el TNT y la carga de viento.
   ============================================================================= */
(function () {
  CF_PERSONAJES['soru'] = {
    name: 'Soru San', title: 'Técnico Vanilla', role: 'TÉCNICO', color: '#e23b3b', hp: 108, spd: 1.0, ai: 'melee', stance: 'idle', weapon: 'mace', m1set: [] /* abajo */, introDraw: .2,
    desc: 'Jugador técnico de Minecraft vanilla. Salta y aplasta con la maza, sale volando con élitros y cohetes, lanza TNT con cañón y se salva con el tótem de la inmortalidad. Al despertar domina el juego: carga de viento, lluvia de TNT y faro de poder.',
    stats: [4, 4, 3, 3, 4],
    skinData: 'personajes/soru/skin.png',
    skin: { skin: '#e8b9a0', hair: '#a91b1b', eye: '#2b2b2b', shirt: '#312e2e', pants: '#463232', shoes: '#222222', sleeve: 12 },
    skills: [
      { n: 'Mazazo en Picada', d: 'Una carga de viento lo lanza al cielo, queda un instante en lo alto y cae en picada sobre el rival: cuanto más alto llegue, más daño y más área.', k: 'soruMace', cd: 9, o: { radius: 4, dmg: 15, jump: 16 }, r: [3, 18], tags: 'gap aoe gb' },
      { n: 'Circuito de Redstone', d: 'Dibuja un circuito de redstone en el suelo. La señal tarda en salir, se detiene en el repetidor y al llegar a la lámpara explota lanzando por los aires a quien esté encima.', k: 'soruRedstone', cd: 10, o: { dmg: 9, len: 14 }, r: [3, 15], tags: 'aoe proj' },
      { n: 'Vuelo de Cohetes', d: 'Salta, abre los élitros y se impulsa con tres cohetes que giran hacia el rival. Cada cohete deja una estrella de fuegos artificiales que explota.', k: 'soruElytra', cd: 10, o: { dmg: 8 }, r: [4, 24], tags: 'gap' },
      { n: 'Tótem Señuelo', d: 'Planta un tótem que lo cura mientras esté cerca. Al romperse, si sigue a su lado se salva y los rivales cercanos quedan aturdidos.', k: 'soruTotem', cd: 18, o: { heal: 26, time: 2 }, r: [0, 10], tags: 'close' },
    ],
    ult: { n: 'Tormenta de Cohetes', d: 'Soru alza el vuelo con los élitros y una lluvia de cohetes y TNT cae sobre todos los rivales cercanos.', k: 'soruUlt', o: { n: 11, dmg: 6.5 }, r: [0, 30] },
    intro: [[0, 'idle', 400], [.45, 'scepterSmash', 700], [1.1, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    flourish: { dur: 1.0, anim: [[0, 'charge', 500], [.55, 'castUp', 600], [.85, 'idle', 400]] },
    awk: [
      { n: 'Carga de Viento', d: 'Revienta una carga de viento: lanza a todos y deja una corriente de aire que sigue levantando a quien se quede dentro.', k: 'soruWind', cd: 8, o: { radius: 5.5, dmg: 8, kb: 22, up: 14 }, r: [0, 6], tags: 'aoe gb close' },
      { n: 'Mazazo Gravitatorio', d: 'La picada de la maza, mucho más alta y devastadora.', k: 'soruMace', cd: 13, o: { radius: 5.5, dmg: 24, jump: 24 }, r: [3, 20], tags: 'gap aoe gb' },
      { n: 'Lluvia de TNT', d: 'Cae una lluvia de TNT en una zona marcada. Cada bloque que explota enciende la mecha de los de al lado: reacción en cadena.', k: 'soruTntRain', cd: 13, o: { dmg: 9, n: 9 }, r: [4, 28], tags: 'aoe' },
      { n: 'Faro de Poder', d: 'Planta un faro: dentro de su rayo Soru se cura, corre más y recarga sus habilidades mucho más rápido, mientras los rivales se queman.', k: 'soruBeacon', cd: 16, o: { heal: 14, time: 8 }, r: [0, 10], tags: 'close' },
    ],
    consejos: {
      'S1': 'La caída va hacia el rival que tengas más cerca: mientras más alto, más daño.',
      'S2': 'El circuito se ve antes de activarse: ponlo donde el rival vaya a pasar.',
      'S3': 'Cada cohete gira hacia el rival: úsalo para cerrar distancia o escapar.',
      'S4': 'Pelea cerca del tótem: te cura y al romperse aturde a los rivales.',
      'A1': 'Lanza a todos lejos y la corriente los sigue levantando: ideal cuando te rodean.',
      'A2': 'Es lento de preparar pero es el golpe más fuerte que tiene.',
      'A3': 'Úsala con el rival acorralado: cae mucho TNT en la zona marcada.',
      'A4': 'Pelea dentro del rayo: te cura, corres más y se recargan tus habilidades.',
      'U': 'Cae una lluvia de cohetes y TNT sobre todos los rivales cercanos.',
    },
    dmgMul: 1, m1speed: 1.15,   // la maza pega mas lento
  };
  CF_PERSONAJES['soru'].m1set = [
    { anim: [[0, 'scepterW', 900], [.09, 'scepterSmash', 1400], [.26, 'gatoHero', 450]], arc: { tilt: 1.4, len: 2.4, r: 2.2, w: .7, dir: -1 }, reach: 1.7, r: 1.6 },
    { anim: [[0, 'sweep', 900], [.06, 'sweep_w', 1400], [.17, 'sweepRec', 500]], arc: { tilt: -.4, len: 2.6, r: 2.1, w: .45, dir: -1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'scepterW', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .5, len: 2.6, r: 2.1, w: .45, dir: 1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'scepterW', 900], [.09, 'scepterSmash', 1400], [.26, 'gatoHero', 450]], arc: { tilt: 1.4, len: 2.4, r: 2.2, w: .7, dir: -1 }, reach: 1.7, r: 1.6 },
    { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2 }, reach: 1.6, r: 1.3 },
  ];
  if (window.CF_ORDEN && !CF_ORDEN.includes('soru')) CF_ORDEN.push('soru');   // sale al final del menu de personajes
})();
