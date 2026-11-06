/* Ataques básicos de Javicubito (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['javi'].m1set = [
  { anim: [[0, 'thrust_w', 900], [.05, 'thrust', 1400], [.16, 'thrustRec', 500]], stab: true, reach: 1.9, r: 1.15 },
  { anim: [[0, 'sweep_w', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .12, len: 2.8, r: 2.2, w: .5, dir: 1 }, reach: 1.4, r: 1.6 },
  { anim: [[0, 'lancerAlt', 900], [.05, 'thrust', 1400], [.16, 'thrustRec', 500]], stab: true, reach: 1.9, r: 1.15 },
  { anim: [[0, 'overhead', 900], [.09, 'plunge', 1400], [.26, 'javiHero', 450]], arc: { tilt: 1.57, len: 2.2, r: 2.2, w: .6, dir: -1 }, reach: 1.7, r: 1.4, twirl: true },
  { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2, dir: 1 }, reach: 1.6, r: 1.3, twirl: true },
  ];
})();
