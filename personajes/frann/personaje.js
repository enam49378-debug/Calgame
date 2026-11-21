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
      { n: 'Lag Switch', d: 'Salta hacia adelante y deja un punto glitcheado. Tras un momento el rollback lo devuelve ahí y los dos lados explotan: sirve para golpear y volver a salvo.', k: 'frannLag', cd: 8, o: { dist: 11, dmg: 5 }, r: [3, 13], tags: 'gap aoe' },
      { n: 'DDoS', d: 'Fija una mira roja que persigue al rival con retraso. Al bloquearse, una oleada de paquetes converge sobre el punto y lo deja fuera de línea.', k: 'frannDdos', cd: 10, o: { dmg: 11, stun: 1.2, range: 22 }, r: [3, 22], tags: 'aoe proj' },
      { n: 'Virus', d: 'Lanza un virus que infecta al rival y le quita vida. Cada pocos segundos salta a otro rival que tenga cerca.', k: 'frannVirus', cd: 11, o: { dmg: 3, ticks: 6, range: 24 }, r: [3, 24], tags: 'proj' },
      { n: 'Firewall', d: 'Cuatro paneles de datos orbitan a su alrededor: queman y empujan a quien los toca y al final salen despedidos explotando.', k: 'frannFirewall', cd: 14, o: { dmg: 6, time: 4.5 }, r: [0, 6], tags: 'close aoe' },
    ],
    ult: { n: 'Cliente Hack', d: 'Activa todos los trucos: marca a los rivales cercanos y los golpea con una ráfaga de datos desde todos los lados.', k: 'frannUlt', o: { n: 10, dmg: 6 }, r: [0, 30] },
    intro: [[0, 'idle', 400], [.45, 'castUp', 700], [1.1, 'idle', 400]],
    cine: [[0, 'charge', 400], [.7, 'castUp', 600], [1.2, 'jump', 500]],
    flourish: { dur: 1.0, anim: [[0, 'charge', 500], [.55, 'castUp', 600], [.85, 'idle', 400]] },
    awk: [
      { n: 'Aimbot', d: 'Marca al rival y, al bloquearse la mira, lo clava con una descarga que llega desde todos lados y un headshot final.', k: 'frannAimbot', cd: 9, o: { dmg: 5, n: 7, range: 30 }, r: [3, 30], tags: 'proj' },
      { n: 'Wallhack', d: 'Pone cajas rojas sobre todos los rivales (se ven por las paredes). Corre más rápido y sus habilidades se recargan antes.', k: 'frannWallhack', cd: 15, o: { time: 7 }, r: [0, 45], tags: 'close' },
      { n: 'Noclip', d: 'Se vuelve intangible, atraviesa a los rivales dejando glitches y reaparece con un choque de datos.', k: 'frannNoclip', cd: 9, o: { dmg: 9, speed: 34 }, r: [3, 16], tags: 'gap' },
      { n: 'Ban Hammer', d: 'Un martillo gigante cae sobre la zona marcada y deja baneados (aturdidos) a todos los que atrape.', k: 'frannBan', cd: 14, o: { radius: 4.5, dmg: 24 }, r: [3, 24], tags: 'aoe gb' },
    ],
    consejos: {
      'S1': 'Golpea y espera: el rollback te devuelve a salvo.',
      'S2': 'La mira tarda en bloquear: el rival puede salir de ahí si se mueve rápido.',
      'S3': 'Se contagia: es mejor cuando hay varios rivales juntos.',
      'S4': 'Pelea cuerpo a cuerpo mientras giran los paneles.',
      'A1': 'No se falla si el rival no se escapa de la mira.',
      'A2': 'Úsalo antes de pelear: te da velocidad y recarga tus habilidades.',
      'A3': 'Eres intocable mientras atraviesas: perfecto para escapar de un grupo.',
      'A4': 'El martillo se ve venir: úsalo cuando el rival esté aturdido.',
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
