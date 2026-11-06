/* Ataques básicos de Redbird (combo de 5 golpes del clic izquierdo)
   Cada golpe: anim = animación, arc = estela del golpe, reach/r = alcance y radio, spin = giro. */
(function () {
  const TAU = Math.PI * 2;
  CF_PERSONAJES['redbird'].m1set = [
  { anim: [[0, 'jabR_w', 900], [.05, 'jabR', 1400], [.15, 'redStance', 500]], arc: { tilt: .25, dir: 1 }, reach: 1.25, r: 1.25 },
  { anim: [[0, 'kick_w', 900], [.06, 'kick', 1400]], arc: { tilt: -.4, r: 1.9, w: .7, len: 2.6, dir: -1 }, reach: 1.4, r: 1.35 },
  { anim: [[0, 'kick_w', 900], [.05, 'kickHigh', 1400]], spin: TAU / .26, arc: { tilt: -.15, len: TAU * .9, r: 2, w: .5 }, reach: 1.1, r: 1.7 },
  { anim: [[0, 'visorTouch', 900], [.09, 'kickHigh', 1400], [.26, 'redHero', 450]], eyeStab: true, arc: { tilt: -.5, r: 2, w: .75, len: 2.8, dir: -1 }, reach: 1.6, r: 1.5 },
  { anim: [[0, 'upper_w', 900], [.08, 'upper', 1400]], eyeStab: true, arc: { tilt: 1.57, r: 1.6, len: 2.4 }, reach: 1.3, r: 1.3 },
  ];
})();
