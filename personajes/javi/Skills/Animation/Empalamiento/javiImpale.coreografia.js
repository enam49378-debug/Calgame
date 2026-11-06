/* Coreografía (cinemática) · personaje: javi · habilidad: Empalamiento · id: javiImpale
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Cabeza -> derribo de espaldas -> pie sobre el torso -> estaca vertical.
CF.coreografia('javiImpale', function () {
  return {
    dur: 4.1, catch: 2, reach: 'jGReach', trails: [[2.48, 2.76], [3.16, 3.43]],
    att: [[.2, 'jGReach'], [.38, 'jGClutch'], [.56, 'jGDrag'], [.8, 'jGThrow'], [.96, 'jGFollow'], [1.13, 'jGFollow'], [1.34, 'jGStep'], [1.6, 'jGPin'], [1.82, 'jGPin'], [2.13, 'jGRaise'], [2.4, 'jGPoise'], [2.53, 'jGPoise'], [2.64, 'jGDriveSmear'], [2.7, 'jGDrive'], [2.85, 'jGHold'], [3.1, 'jGHold'], [3.32, 'jGWithdraw'], [3.57, 'jGRecover'], [4, 'javiHero']],
    vic: [[.22, 'vJReady'], [.38, 'vGGrab'], [.56, 'vGOffBalance'], [.8, 'vGFall'], [.96, 'vGBackHit'], [1.05, 'vGBackRebound'], [1.22, 'vGOnBack'], [1.6, 'vGPressed'], [1.84, 'vGStruggle'], [2.13, 'vGPressed'], [2.4, 'vGStruggle'], [2.57, 'vGPressed'], [2.7, 'vGFlinch'], [2.83, 'vGStill'], [3.1, 'vGStill'], [3.55, 'vGOnBack'], [4, 'vGStill']],
    apos: [[0, 0, 0, 0, 0], [.2, 0, 0, .12, 0], [.38, 0, 0, .34, 0], [.8, 0, 0, .62, 0], [1.13, 0, 0, .62, 0], [1.6, 0, 0, 1.15, 0], [3.1, 0, 0, 1.15, 0], [3.57, -.08, 0, .7, 0], [4.1, -.08, 0, .7, 0]],
    vpos: [[0, 0, 0, 1.45, 0], [.38, 0, 0, 1.45, 0], [.56, 0, .1, 1.48, 0], [.8, 0, .23, 1.58, 0], [.96, 0, .08, 1.7, 0, 'i'], [1.05, 0, .14, 1.72, 0], [1.22, 0, .08, 1.72, 0], [4.1, 0, .08, 1.72, 0]],
    bindings: [
      { start: .22, end: .82, enter: .14, exit: .1, part: 'armL', from: [0, -10, 0], target: 'head', to: [-3, 5, 1], limit: .85 },
      { start: 1.4, end: 3.4, enter: .2, exit: .18, part: 'legR', from: [0, -12, 0], target: 'torso', to: [0, 6, 2.2], limit: .8 },
    ],
    stake: { scale: .58, start: 1.98, end: 3.55, clearance: [[1.98, 0, .65, 0, 0], [2.2, 0, .95, 0, 0], [2.46, 0, .95, 0, 0], [2.55, 0, .75, 0, 0], [2.7, 0, 0, 0, 0, 'i'], [2.84, 0, -.04, 0, 0], [3.1, 0, -.04, 0, 0], [3.32, 0, .65, 0, 0], [3.55, 0, .9, 0, 0]] },
    ev: [
      { t: .38, hit: 2, sfx: 'grab', hs: .045, shake: .1, at: 'head' },
      { t: .8, sfx: 'swing' },
      { t: .96, hit: 4, fx: 'impact', at: 'ground', imp: 1, hs: .08, shake: .4 },
      { t: .97, fx: 'ring', at: 'ground', r: 1.6 },
      { t: 1.6, hit: 2, sfx: 'heavy', hs: .045, shake: .15 },
      { t: 2.14, fx: 'charge', at: 'att' },
      { t: 2.7, hit: 9, fx: 'stab', at: 'head', imp: 1, slow: .18, hs: .16, shake: .6 },
      { t: 2.71, fx: 'ring', at: 'head', r: 1.15, face: 1 },
      { t: 3.2, sfx: 'draw' },
      { t: 3.58, letGo: 1.8 },
    ],
    shots: [[0, 'two', { s: -1, fov: 48, roll: .01 }], [.79, 'ground', { s: -1, fov: 52, roll: .01 }], [1.4, 'two', { s: -1, fov: 46, roll: .01 }], [2.09, 'two', { s: -1, fov: 48, roll: .01 }], [3.59, 'hero', { s: -1, roll: .01 }]],
  };
});
