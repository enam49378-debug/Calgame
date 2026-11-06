/* Ataques básicos de ItzUkyo (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['ukyo'].m1set = [
  { anim: [[0, 'scepterW', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .5, len: 2.6, r: 2.1, w: .45, dir: 1 }, reach: 1.6, r: 1.5 },
  { anim: [[0, 'sweep', 900], [.06, 'sweep_w', 1400], [.17, 'sweepRec', 500]], arc: { tilt: -.4, len: 2.6, r: 2.1, w: .45, dir: -1 }, reach: 1.6, r: 1.5 },
  { anim: [[0, 'thrust_w', 900], [.06, 'thrust', 1400], [.16, 'thrustRec', 500]], stab: true, reach: 1.95, r: 1.15 },
  { anim: [[0, 'scepterW', 900], [.09, 'scepterSmash', 1400], [.26, 'gatoHero', 450]], arc: { tilt: 1.4, len: 2.4, r: 2.2, w: .7, dir: -1 }, reach: 1.7, r: 1.6 },
  { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2 }, reach: 1.6, r: 1.3 },
  ];
})();
