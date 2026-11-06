/* Ataques básicos de elGatopro300 (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['gato'].m1set = [
  { anim: [[0, 'scepterW', 900], [.06, 'sweep', 1400], [.17, 'sweepRec', 500]], arc: { tilt: .5, len: 2.6, r: 2.1, w: .45, dir: 1 }, reach: 1.5, r: 1.5, magic: true },
  { anim: [[0, 'sweep_w', 900], [.06, 'thrust', 1400], [.16, 'thrustRec', 500]], stab: true, reach: 1.9, r: 1.15, magic: true },
  { anim: [[0, 'twirlPose', 800], [.07, 'magicPalm', 1400]], palm: true, reach: 1.6, r: 1.4 },
  { anim: [[0, 'scepterW', 900], [.09, 'scepterSmash', 1400], [.26, 'gatoHero', 450]], arc: { tilt: 1.4, len: 2.4, r: 2.2, w: .7, dir: -1 }, reach: 1.6, r: 1.6, magic: true, twirl: true },
  { anim: [[0, 'thrust_w', 900], [.08, 'upthrust', 1400]], arc: { tilt: 1.57, len: 1.6, r: 2.2 }, reach: 1.6, r: 1.3, magic: true, twirl: true },
  ];
})();
