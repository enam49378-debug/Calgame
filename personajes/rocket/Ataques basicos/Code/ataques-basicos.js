/* Ataques básicos de Rocket (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['rocket'].m1set = [
  { anim: [[0, 'jabR_w', 900], [.05, 'hook', 1400], [.15, 'ninja', 500]], arc: { tilt: .1, dir: 1, len: 2.4, r: 1.7 }, reach: 1.35, r: 1.35 },
  { anim: [[0, 'jabL', 900], [.05, 'jabL', 1400], [.15, 'ninja', 500]], arc: { tilt: -.3, dir: -1, len: 2.4 }, reach: 1.35, r: 1.35 },
  { anim: [[0, 'kick_w', 900], [.06, 'kick', 1400], [.16, 'ninja', 500]], arc: { tilt: -.5, dir: 1, len: 2.4, r: 1.9 }, reach: 1.5, r: 1.4 },
  { anim: [[0, 'kick_w', 900], [.08, 'kickHigh', 1400], [.26, 'ninja', 450]], arc: { tilt: .9, len: 2.8, r: 2.1, w: .6, dir: -1 }, reach: 1.7, r: 1.5 },
  { anim: [[0, 'upper_w', 900], [.08, 'upper', 1400]], arc: { tilt: 1.57, r: 1.6, len: 2.4 }, reach: 1.5, r: 1.3 },
  ];
})();
