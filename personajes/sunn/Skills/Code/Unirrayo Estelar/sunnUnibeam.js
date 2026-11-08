/* Habilidad: Unirrayo Estelar  ·  personaje: sunn  ·  movimiento: sunnUnibeam
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js. */
CF.mover('sunnUnibeam', function (f, o) {
  MOVES.beam(f, { eyes: false, len: 46, width: 1.3, dur: 1.7, dmg: o.dmg || 2.9, charge: .9, push: 9, gb: true, sweep: 1.6, color: '#ffd54f', fromFn: () => front(f, .5, 1.45) });
});
