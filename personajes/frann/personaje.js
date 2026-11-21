/* =============================================================================
   PERSONAJE · SoyFrann  (id: frann)  ·  temática: jugador Hacker
   Todo lo de este personaje vive en la carpeta personajes/frann/
     personaje.js    este archivo: estadísticas, habilidades, despertar, consejos y ataques básicos
     habilidades.js  el código de sus habilidades (DDoS, virus, firewall, aimbot, wallhack, noclip...)
     skin.png        su skin
   SoyFrann es el hacker del grupo: pelea con "trucos" de juego (el clásico cliente hack) pero adaptados al multijugador:
   nada de esto es injusto, todo se ve en pantalla y todos lo pueden esquivar.
   ============================================================================= */
(function () {
  CF_PERSONAJES['frann'] = {
    name: 'SoyFrann', title: 'El Hacker', role: 'HACKER', color: '#32ff7e', hp: 100, spd: 1.06, ai: 'melee', stance: 'idle', weapon: 'sword', m1set: [] /* abajo */, introDraw: .2,
    desc: 'Jugador hacker. Salta de un lado a otro con el lag switch, tira un DDoS que congela al rival, le planta un virus que lo va debilitando y se cubre con un firewall. Al despertar activa aimbot, wallhack y noclip.',
    stats: [3, 5, 4, 4, 3],
    skinData: 'personajes/frann/skin.png',
    skin: { skin: '#e8b9a0', hair: '#f2f2f2', eye: '#2b2b2b', shirt: '#1d2b22', pants: '#222a2a', shoes: '#111111', sleeve: 12 },
    skills: [
      { n: 'Lag Switch', d: 'Se desconecta un instante y reaparece justo detrás del rival más cercano.', k: 'blink', cd: 6, o: { color: '#32ff7e' }, r: [3, 13], tags: 'gap' },
      { n: 'DDoS', d: 'Satura al rival más cercano con paquetes: queda inmóvil un momento y recibe daño.', k: 'frannDdos', cd: 9, o: { dmg: 11, stun: 1.2, range: 20 }, r: [3, 20], tags: 'proj' },
      { n: 'Virus', d: 'Lanza un virus que se pega al rival y le va quitando vida durante varios segundos.', k: 'frannVirus', cd: 10, o: { dmg: 3, ticks: 6, range: 22 }, r: [3, 22], tags: 'proj' },
      { n: 'Firewall', d: 'Levanta un muro de datos delante de él que bloquea y empuja a quien lo toque.', k: 'frannFirewall', cd: 14, o: { dmg: 6, time: 4 }, r: [0, 8], tags: 'close' },
    ],
    ult: { n: 'Cliente Hack', d: 'Activa todos los trucos: marca a los rivales cercanos y los golpea con una ráfaga de datos desde todos los lados.', k: 'frannUlt', o: { n: 10, dmg: 6 }, r: [0, 30] },
    intro: [[0, 'idle', 400], [.45, 'castUp', 700], [1.1, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    flourish: { dur: 1.0, anim: [[0, 'charge', 500], [.55, 'castUp', 600], [.85, 'idle', 400]] },
    awk: [
      { n: 'Aimbot', d: 'Dispara una ráfaga de proyectiles que se desvían solos hacia el rival.', k: 'frannAimbot', cd: 8, o: { dmg: 5, n: 6, range: 26 }, r: [3, 26], tags: 'proj' },
      { n: 'Wallhack', d: 'Resalta a todos los rivales a través de las paredes y se mueve más rápido unos segundos.', k: 'frannWallhack', cd: 14, o: { time: 7 }, r: [0, 30], tags: 'close' },
      { n: 'Noclip', d: 'Se vuelve intocable y atraviesa a los rivales un instante, avanzando muy rápido.', k: 'rush', cd: 9, o: { dist: 14, dmg: 9, speed: 34, color: '#32ff7e' }, r: [3, 16], tags: 'gap' },
      { n: 'Ban Hammer', d: 'Cae desde arriba con el martillo de baneo: daño enorme en un área marcada.', k: 'slam', cd: 13, o: { radius: 4.5, dmg: 24, jump: 18, fwd: 5, track: true, color: '#ff3b3b' }, r: [3, 16], tags: 'gap aoe gb' },
    ],
    consejos: {
      'S1': 'Úsalo para escapar o para caer encima del rival por sorpresa.',
      'S2': 'Si le pega, el rival no se puede mover: aprovecha para combinar.',
      'S3': 'El daño es lento pero seguro: ideal para pelear de lejos y huir.',
      'S4': 'Ponlo entre tú y el rival cuando te persiguen.',
      'A1': 'Los proyectiles giran hacia el rival: no hace falta apuntar bien.',
      'A2': 'Úsalo antes de pelear: te da velocidad y ves a todos.',
      'A3': 'Atraviesa a los rivales y los daña: perfecto para escapar de un grupo.',
      'A4': 'Es lento de preparar pero es el golpe más fuerte que tiene.',
      'U': 'Una ráfaga de datos cae sobre todos los rivales cercanos.',
    },
    dmgMul: 1,
  };
  CF_PERSONAJES['frann'].m1set = [
    { anim: [[0, 'sweep', 900], [.06, 'sweep_w', 1400], [.17, 'sweepRec', 500]], arc: { tilt: -.4, len: 2.6, r: 2.1, w: .45, dir: -1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'scepterW', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .5, len: 2.6, r: 2.1, w: .45, dir: 1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'sweep', 900], [.06, 'sweep_w', 1400], [.17, 'sweepRec', 500]], arc: { tilt: -.4, len: 2.6, r: 2.1, w: .45, dir: -1 }, reach: 1.6, r: 1.5 },
    { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2 }, reach: 1.6, r: 1.3 },
  ];
  if (window.CF_ORDEN && !CF_ORDEN.includes('frann')) CF_ORDEN.push('frann');   // sale al final del menu de personajes
})();
