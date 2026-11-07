/* Coreografía (cinemática) · personaje: sekza · habilidad: Vuelo Sin Retorno (ulti, habilidad 3) · id: sekPlane
   Sekza hace un dash para agarrar a alguien (si no atrapa a nadie la habilidad solo falla: eso lo decide el movimiento sekAbduct, no esta escena).
   Si lo atrapa:
     I    GIRO       lo agarra, da vueltas cada vez mas rapido (varias) y lo lanza al cielo
     II   DESPEGUE   se agacha, abre las alas y sale volando con fuerza detras de la victima
     III  NUBES      la victima, en las nubes, intenta volar pero se asusta y solo da vueltas sin control
     IV   PAJAROS    Sekza llega y lo golpea; cruzan pajarones enormes que lo embisten uno tras otro
     V    AVION      pasa un avion: Sekza lo patea por la puerta y entra tras el
     VI   PASILLO    la victima corre por el pasillo, Sekza corre mucho mas rapido, la alcanza y la estrella contra el piso (compuerta)
     VII  CAIDA      la victima cae a toda velocidad y choca con el suelo; Sekza mira desde el avion, salta y cae de pie
   att = poses de Sekza, vic = poses de la victima, apos/vpos = [t, x(derecha), y(altura), z(adelante), giro] respecto de donde empezo la escena,
   props = el avion (con su interior) y las nubes, ev = eventos, shots = camara. Todo el avion se mueve con la funcion planeX(t). */
CF.coreografia('sekPlane', function () {
  const P = (n, o) => Object.assign({}, POSE[n], o || {});
  const S = 1, TAU2 = Math.PI * 2;
  const H = 44;                          // altura de las nubes y del avion
  const PZ = 7;                          // linea por la que pasa el avion (z de la escena)
  const FLOOR = H - 1.3;                 // piso del avion
  const T_KICK = 7.6, T_HATCH = 9.9, T_HIT = 11.0;
  // posicion del avion: llega rapido, pasa justo frente a la victima cuando la patean y se "frena" para el interior
  const planeX = t => {
    const x0 = 1.0;
    if (t <= T_KICK) return x0 + 32 * (t - T_KICK);
    const u = t - T_KICK;
    if (u <= .8) return x0 + 32 * u - (29 / 1.6) * u * u;
    return x0 + 32 * .8 - (29 / 1.6) * .64 + 3 * (u - .8);
  };
  const DOOR = -2.2;                     // la puerta esta 2.2 m detras del centro del avion (lado de la victima)
  // ---------------- poses de la victima
  const FLAIL = (i) => {                 // intenta volar: brazos que aletean, piernas pataleando y gira sin control
    const up = i % 2 === 0;
    return { ix: -i * 1.05, tx: 0, hx: .3, alx: up ? -2.7 : -.6, arx: up ? -.6 : -2.7, alz: .7, arz: -.7, llx: up ? -.9 : .6, lrx: up ? .6 : -.9, by: -1 };
  };
  const V_HELD = P('vLifted'), V_DANGLE = P('vDangle');
  const V_SCARED = P('vConfused');
  const RUN_V = P('jSprint', { hx: .35, ix: .35 });
  const V_FALL_IN = P('hurtFwd', { ix: .5, by: -2 });
  const V_DOWN = P('down');
  const V_PLUNGE = { ix: 1.1, tx: .5, hx: .2, alx: -2.9, arx: -2.9, llx: .9, lrx: .9, by: -1 };   // cae de cabeza con los brazos arriba
  // ---------------- poses de Sekza
  const A_GRAB = P('aCollar');
  const A_SPIN = P('aCollar', { ty: .4 });
  const A_CROUCH = P('charge', { by: -6, ix: .35, tx: .3, alx: -.4, arx: -.4, alz: .9, arz: -.9, llx: -1.1, lrx: -1.1 });   // se agacha con las alas abiertas
  const A_LAUNCH = P('castUp', { ix: -.35, tx: -.3, llx: .6, lrx: .6 });
  const A_FLY = { ix: .9, tx: .3, by: 0, hx: -.4, alx: -.2, arx: -.2, alz: .5, arz: -.5, llx: .35, lrx: .35 };      // vuela como flecha, inclinado
  const A_HOVER = P('ninja', { by: -1, alz: .6, arz: -.6 });
  const A_PUNCH_R = P('jabR', { ix: .2 }), A_PUNCH_L = P('jabL', { ix: .2 }), A_HOOK = P('hook'), A_KICK = P('kick');
  const A_RUN = P('jSprint', { ix: .6 });
  const A_CATCH = P('aCatch');
  const A_SLAM = P('slamDown');
  const A_LOOK = P('point', { hx: .6, ix: .15 });
  const A_DIVE = P('jDive', { ix: 1.3 });
  const A_LAND = P('land', { by: -7, ix: .45, tx: .3, alx: -.6, arx: .3, llx: -1.3, lrx: -.2 });
  const A_HERO = P('ninja');
  // ---------------- recorridos
  const att = [], vic = [], apos = [], vpos = [];
  const R = 1.5;
  // I. giro (0 - 1.9): cada vez mas rapido, la victima gira en un circulo y sube
  const PHI = t => 18.85 * Math.pow(Math.min(t, 1.9) / 1.9, 2) * S;
  for (let t = 0; t <= 1.91; t += .1) {
    const ph = PHI(t), y = .5 + 1.5 * Math.pow(t / 1.9, 1.4);
    apos.push([+t.toFixed(2), 0, 0, 0, ph]);
    vpos.push([+t.toFixed(2), R * Math.sin(ph), y, R * Math.cos(ph), ph + Math.PI]);
  }
  att.push([0, A_GRAB], [.5, A_SPIN], [1.5, A_SPIN], [1.9, A_SPIN]);
  vic.push([0, V_HELD], [.6, V_DANGLE], [1.2, P('vDangle', { ix: 1.1 })], [1.9, P('vDangle', { ix: 1.4 })]);
  // II. lanzamiento y despegue
  const Y1 = PHI(1.9), YW = Y1 + 1.57, V0 = Y1 + 31.4159;   // YW: Sekza mirando a la nariz del avion; V0: giro acumulado de la victima (multiplo de 2π)
  vpos.push([2.0, .2, 3.2, 2.6, Y1], [2.4, 1.2, 14, 5, Y1 + 2], [2.9, 2.4, 30, 8, Y1 + 5], [3.3, 3, 41, 9.2, Y1 + 8], [3.6, 3.4, 44, 9.6, Y1 + 10]);
  apos.push([2.0, 0, 0, 0, Y1], [2.5, 0, 0, 0, Y1], [2.7, 0, 3, .9, Y1], [3.0, .8, 16, 3.5, Y1], [3.4, 1.6, 36, 6, Y1], [3.8, 2.2, 43, 7, Y1], [4.3, 2.6, 44.3, 7.4, Y1]);
  att.push([2.0, A_CROUCH], [2.45, A_CROUCH], [2.6, A_LAUNCH], [2.9, A_FLY], [3.8, A_FLY], [4.3, A_HOVER]);
  vic.push([2.0, P('vFlip')], [2.5, FLAIL(0)], [2.9, FLAIL(1)], [3.3, FLAIL(2)]);
  // III. la victima en las nubes (3.6 - 5.0): intenta volar, se asusta, da vueltas
  for (let k = 0, t = 3.5; t < 5.0; t += .18, k++) vic.push([+t.toFixed(2), FLAIL(k + 3)]);
  vpos.push([4.2, 1.4, 44.6, 9.6, Y1 + 13]);
  // IV. golpes y pajarones (5.0 - 7.2)
  const base = [1.2, 44.5, 9.6], hits = [[5.1, [.9, .5, .8], 'jabR'], [5.5, [-.9, -.3, .6], 'jabL'], [5.9, [.3, .9, -.9], 'hook'], [6.3, [-.8, .2, -.7], 'kick'], [6.7, [.6, -.6, .9], 'jabR']];
  vpos.push([4.8, base[0], base[1], base[2], Y1 + 15]);
  hits.forEach(([t, d], i) => {
    vpos.push([t, base[0] + d[0], base[1] + d[1], base[2] + d[2], Y1 + 17 + i * 2.6], [t + .32, base[0] + d[0] * .4, base[1] + d[1] * .4, base[2] + d[2] * .4, Y1 + 18 + i * 2.6]);
  });
  apos.push([4.8, 2.6, 44.5, 7.5, Y1]);
  hits.forEach(([t, , pose]) => { apos.push([t - .1, 2.6, 44.5, 7.6, Y1], [t + .15, 3.2, 44.6, 8.3, Y1]); att.push([t - .12, pose === 'kick' ? P('kick_w') : P(pose + '_w')], [t, P(pose)]); });
  att.push([4.9, A_HOVER], [6.9, A_HOVER]);
  for (let k = 0, t = 5.0; t < 7.2; t += .22, k++) vic.push([+t.toFixed(2), P(k % 2 ? 'vFlip2' : 'vSpinA')]);
  // V. el avion pasa; Sekza lo patea por la puerta (7.0 - 8.0) y entran
  const doorX = planeX(T_KICK) + DOOR;   // x de la puerta cuando la patean
  apos.push([7.3, doorX - 1.5, 44.4, 9.4, Y1 + 3.1], [T_KICK - .05, doorX + .2, 44.3, 11.3, Y1 + 3.14]);   // se coloca detras de la victima, del lado contrario al avion
  // dentro del avion (a partir de 7.95 todo se mide respecto del avion)
  const inP = (t, lx, ly, lz) => [+t.toFixed(2), planeX(t) + lx, FLOOR + ly, PZ + lz];   // lx: a lo largo del avion (+ = nariz)
  // la victima sale disparada de la patada y cae dentro, deslizandose
  vpos.push([T_KICK, doorX, 44.4, 9.2, Y1 + 30], [7.85, planeX(7.85) + DOOR + .2, FLOOR + 1.2, PZ + .9, V0]);
  const push2 = (arr, t, lx, ly, lz, yw) => arr.push([...inP(t, lx, ly, lz), yw]);
  push2(vpos, 8.1, DOOR + .4, 0, 0, V0 + 1.6); push2(vpos, 8.4, DOOR + 1.0, 0, 0, V0 + 1.57);
  // se levanta y corre por el pasillo hacia la nariz (+x)
  for (let t = 8.6; t <= 9.4001; t += .1) push2(vpos, t, DOOR + 1.0 + (t - 8.6) * 5.6, 0, 0, V0 + 1.57);
  // Sekza entra, se levanta y corre MUCHO mas rapido
  apos.push([T_KICK + .1, doorX + .6, 44.2, 10.4, Y1 + 3.14]);
  push2(apos, 8.0, DOOR - .3, 0, 0, YW); push2(apos, 8.8, DOOR - .4, 0, 0, YW);
  for (let t = 8.9; t <= 9.4001; t += .1) push2(apos, t, DOOR - .4 + (t - 8.9) * 18.5, 0, 0, YW);
  // la agarra, la empuja unos pasos y la estrella contra el piso por la compuerta
  push2(apos, 9.6, 5.0, 0, 0, YW); push2(apos, T_HATCH, 6.6, 0, 0, YW); push2(apos, T_HATCH + .3, 6.7, 0, 0, YW); push2(apos, 10.5, 6.7, 0, 0, YW);
  push2(vpos, 9.6, 5.9, 0, 0, V0 + 1.57); push2(vpos, T_HATCH - .05, 7.6, .4, 0, V0 + 1.57);
  // cae por la compuerta: aceleracion enorme hacia el suelo
  const GX = planeX(T_HATCH) + 8.0;
  for (let t = T_HATCH; t <= T_HIT + .001; t += .1) { const u = t - T_HATCH, y = Math.max(0, FLOOR - .5 * 64 * u * u); vpos.push([+t.toFixed(2), GX + u * 2, y, PZ + .2, V0 + 1.57 + u * 7]); }
  vpos.push([T_HIT + .15, GX + 2.5, 0, PZ + .2, V0 + 1.57 + 9], [13.6, GX + 2.7, 0, PZ + .2, V0 + 1.57 + 9]);
  // Sekza se queda en la compuerta, mira, y salta: cae en picada y aterriza de pie junto a la victima
  const LAND_T = 12.0, LX = GX + 6.5, LZ = PZ + 3.2;
  apos.push([10.9, planeX(10.9) + 6.7, FLOOR, PZ, YW], [11.3, planeX(11.3) + 6.9, FLOOR, PZ, YW]);
  for (let t = 11.4; t <= LAND_T + .001; t += .1) { const u = (t - 11.4) / (LAND_T - 11.4), e = u * u; apos.push([+t.toFixed(2), planeX(11.4) + 7 + (LX - planeX(11.4) - 7) * u, Math.max(0, FLOOR * (1 - e)), PZ + (LZ - PZ) * u, YW + (-1.57 - 1.2) * u]); }
  apos.push([LAND_T + .4, LX, 0, LZ, Y1 - 2.77], [13.6, LX, 0, LZ, Y1 - 2.77]);
  att.push([T_KICK - .2, P('kick_w')], [T_KICK, A_KICK], [7.9, A_DIVE], [8.1, A_LAND], [8.8, P('getup1')], [8.95, A_RUN], [9.4, A_RUN], [9.5, A_CATCH], [9.8, A_SLAM], [T_HATCH + .2, A_SLAM], [10.1, A_LOOK], [11.2, A_LOOK], [11.5, A_DIVE], [11.95, A_DIVE], [LAND_T + .1, A_LAND], [12.8, A_HERO]);
  vic.push([7.3, FLAIL(2)], [T_KICK, P('hurtFwd', { ix: .8 })], [7.9, V_FALL_IN], [8.2, V_DOWN], [8.5, P('getup1')], [8.7, RUN_V], [9.4, RUN_V], [9.55, P('hurtFwd', { ix: .6 })], [T_HATCH - .05, P('vDangle', { ix: 1 })], [T_HATCH + .1, V_PLUNGE], [T_HIT - .05, V_PLUNGE], [T_HIT + .2, V_DOWN], [13.6, V_DOWN]);

  // ---------------- el avion y las nubes
  const planeProp = (st) => {
    const g = new THREE.Group(), mats = [], geos = [];
    const M = (c, o) => { const m = new THREE.MeshLambertMaterial(Object.assign({ color: c, side: THREE.DoubleSide, emissive: new THREE.Color(c).multiplyScalar(.28) }, o || {})); mats.push(m); return m; };
    const B = (w, h, d, m, x, y, z, par) => { const ge = new THREE.BoxGeometry(w, h, d); geos.push(ge); const me = new THREE.Mesh(ge, m); me.position.set(x, y, z); (par || g).add(me); return me; };
    const white = M(0xf2f5f8), grey = M(0xaab4c2), blue = M(0x2f6fd0), dark = M(0x2a2f3a), red = M(0xd9363e), floor = M(0x6b7585), seat = M(0x2f6fd0), seat2 = M(0x3b4a66), glass = M(0xaee6ff, { emissive: new THREE.Color(0xaee6ff).multiplyScalar(.9) });
    // cabina: z de -12 a 10, ancho 3.6, alto 3 (suelo en y = -1.3); la pared de la puerta es la -X
    const Z0 = -12, Z1 = 10, W = 3.6, HH = 3.0, LENG = Z1 - Z0, CZ = (Z0 + Z1) / 2;
    const hatchGap = [3.6, 5.2];
    B(W, .16, 3.6 - Z0, floor, 0, -1.38, (Z0 + hatchGap[0]) / 2);                                  // piso (parte de atras)
    B(W, .16, Z1 - hatchGap[1], floor, 0, -1.38, (hatchGap[1] + Z1) / 2);                          // piso (parte de adelante)
    const hatch = B(W, .16, hatchGap[1] - hatchGap[0], red, 0, -1.38, (hatchGap[0] + hatchGap[1]) / 2);   // compuerta
    B(W, .12, LENG, white, 0, 1.5, CZ);                                                                // techo
    B(.12, HH, LENG, white, W / 2, 0, CZ);                                                             // pared +X (sin puerta)
    B(.12, HH, (-3.3) - Z0, white, -W / 2, 0, (Z0 - 3.3) / 2);                                         // pared -X, parte de atras
    B(.12, HH, Z1 - (-1.1), white, -W / 2, 0, (Z1 - 1.1) / 2);                                         // pared -X, parte de adelante
    B(.12, 1.0, 2.2, grey, -W / 2, 1.0, -2.2); B(.12, .3, 2.2, grey, -W / 2, -1.15, -2.2);            // marco de la puerta
    B(W, HH, .12, white, 0, 0, Z0); B(W, HH, .12, white, 0, 0, Z1);                                    // mamparos
    B(W - .1, .22, LENG, blue, 0, 1.38, CZ);                                                           // franja azul del techo
    // asientos: dos y dos a cada lado, mirando a la nariz
    for (let z = -9.5; z <= 8.6; z += 1.8) {
      if (z > hatchGap[0] - 1.1 && z < hatchGap[1] + 1.1) continue;
      for (const sx of [-1.15, 1.15]) {
        for (const o of [-.4, .4]) { const xx = sx + (sx < 0 ? -o * .0 : 0) + o * .0; }
        const sm = Math.round(z) % 2 ? seat : seat2;
        B(.8, .38, .8, sm, sx, -1.0, z); B(.8, .95, .16, sm, sx, -.55, z - .38); B(.5, .12, .3, grey, sx, -.1, z - .45);
      }
    }
    // ventanillas (luces) en ambas paredes y portaequipajes
    for (let z = -10; z <= 9; z += 1.8) { for (const sx of [-1, 1]) { if (sx < 0 && z > -3.7 && z < -.7) continue; B(.05, .45, .6, glass, sx * (W / 2 - .06), .35, z); B(.45, .25, 1.4, grey, sx * 1.35, 1.15, z); } }
    // fuselaje exterior: nariz, cola, alas, motores
    const nose = new THREE.Mesh((() => { const ge = new THREE.ConeGeometry(1.9, 8, 14); geos.push(ge); return ge; })(), white); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0, Z1 + 4); g.add(nose);
    const tail = new THREE.Mesh((() => { const ge = new THREE.ConeGeometry(1.9, 7, 14); geos.push(ge); return ge; })(), white); tail.rotation.x = -Math.PI / 2; tail.position.set(0, 0, Z0 - 3.5); g.add(tail);
    B(W + .25, 1.2, LENG, white, 0, -.9, CZ).material = M(0xdfe5ec, { side: THREE.BackSide });   // la panza (vista desde abajo)
    for (const sx of [-1, 1]) { B(13, .28, 5, white, sx * 8.3, -.8, -1.5).rotation.y = sx * -.25; const en = new THREE.Mesh((() => { const ge = new THREE.CylinderGeometry(.75, .75, 3.2, 14); geos.push(ge); return ge; })(), grey); en.rotation.x = Math.PI / 2; en.position.set(sx * 6, -1.4, -.5); g.add(en); B(5, .2, 2.4, white, sx * 2.6, .2, Z0 - 2.5); }
    B(.25, 4.6, 3, red, 0, 3.2, Z0 - 2.5);
    g.visible = false; scene.add(g);
    const R = rightOf(st.yaw); g.rotation.y = Math.atan2(R.x, R.z);
    // nubes (billboards) alrededor de la zona de la pelea
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 128; const c = cvs.getContext('2d');
    for (let i = 0; i < 9; i++) { const x = 30 + Math.random() * 68, y = 44 + Math.random() * 40, r = 22 + Math.random() * 30, gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.55, 'rgba(245,250,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    const ctex = new THREE.CanvasTexture(cvs), clouds = new THREE.Group(); scene.add(clouds);
    const NC = Math.max(14, Math.round(34 * [1, .75, .5, .3, .15][GFX.level | 0]));   // menos nubes en graficos bajos
    for (let i = 0; i < NC; i++) { const m = new THREE.SpriteMaterial({ map: ctex, transparent: true, opacity: .3 + Math.random() * .3, depthWrite: false, fog: false }); mats.push(m); const sp = new THREE.Sprite(m), s = 26 + Math.random() * 38; sp.scale.set(s, s * .6, 1); const yy = Math.random() < .5 ? 12 + Math.random() * 20 : 58 + Math.random() * 18; sp.position.copy(L2W(st.origin, st.yaw, -55 + Math.random() * 120, yy, -35 + Math.random() * 90)); /* las nubes quedan por debajo y por encima del avion (no entre las camaras) */ clouds.add(sp); }
    return {
      group: g,
      tick(t) {
        g.visible = t > 5.6 && t < 11.6; const px = planeX(t); g.position.copy(L2W(st.origin, st.yaw, px, H, PZ));
        if (t > T_KICK - .2) { const u = Math.max(0, t - 8.0); g.position.y += Math.sin(u * 3) * .06; g.rotation.z = Math.sin(u * 2.1) * .015; }
      },
      on(name) { if (name === 'hatch') hatch.visible = false; },
      dispose() { scene.remove(g); scene.remove(clouds); mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose()); ctex.dispose(); },
    };
  };

  const tidy = arr => { arr.sort((a, b) => a[0] - b[0]); for (let i = 1; i < arr.length; i++) if (arr[i][0] - arr[i - 1][0] < .002) arr[i][0] = arr[i - 1][0] + .002; return arr; };
  [att, vic, apos, vpos].forEach(tidy);
  return {
    dur: 13.6, pull: true, catch: 3, reach: 'grab',
    trails: [],
    att, vic, apos, vpos,
    props: [planeProp],
    ev: [
      { t: .1, text: '¡TE TENGO!', who: 'att', fx: 'impact', at: 'att' },
      { t: .5, fx: 'ring', at: 'ground', r: 3.4 }, { t: 1.0, fx: 'ring', at: 'ground', r: 4.4 }, { t: 1.5, fx: 'ring', at: 'ground', r: 5.2 },
      { t: .6, fx: 'dust', at: 'groundA', n: 14 }, { t: 1.2, fx: 'dust', at: 'groundA', n: 18 }, { t: 1.7, fx: 'dust', at: 'groundA', n: 22 },
      { t: 1.9, text: '¡AL CIELO!', who: 'att', fx: 'boom', at: 'att', r: 2.2, imp: 1, shake: .7, slow: .15 },
      { t: 2.45, fx: 'charge', at: 'att' },
      { t: 2.62, fx: 'boom', at: 'groundA', r: 3, big: 1, shake: 1, imp: 1, text: '¡A VOLAR!', who: 'att' }, { t: 2.65, fx: 'crack', at: 'groundA', r: 4 }, { t: 2.7, fx: 'dust', at: 'groundA', n: 30 },
      { t: 3.0, fx: 'line', sfx: 'whoosh' }, { t: 3.4, fx: 'line', sfx: 'whoosh' },
      { t: 3.8, text: '¡NO PUEDE VOLAR!', who: 'vic', fx: 'ring', at: 'vic', r: 3, face: 1 },
      { t: 4.4, text: '¡AAAAH!', who: 'vic' },
      { t: 5.0, fx: 'bird', a: .8, sc: 3.2 }, { t: 5.1, hit: 2.5, fx: 'impact', at: 'vic', big: 1, shake: .5, text: '¡PAJARÓN!', who: 'att' },
      { t: 5.4, fx: 'bird', a: -1.3, sc: 3.2, col: '#e8eef8' }, { t: 5.5, hit: 2.5, fx: 'impact', at: 'vic', big: 1, shake: .5 },
      { t: 5.8, fx: 'bird', a: 2.2, sc: 3.6 }, { t: 5.9, hit: 3, fx: 'impact', at: 'vic', big: 1, shake: .6, imp: 1 },
      { t: 6.2, fx: 'bird', a: -.4, sc: 3.6, col: '#ffe9b0' }, { t: 6.3, hit: 3, fx: 'impact', at: 'vic', big: 1, shake: .6 },
      { t: 6.6, fx: 'bird', a: 3.0, sc: 4 }, { t: 6.7, hit: 3.5, fx: 'impact', at: 'vic', big: 1, shake: .8, imp: 1, slow: .2, text: '¡Y OTRO!', who: 'att' },
      { t: 6.9, text: '¡UN AVIÓN!', who: 'vic' }, { t: 6.95, sfx: 'whoosh' },
      { t: T_KICK, hit: 3, fx: 'boom', at: 'vic', r: 2.4, big: 1, imp: 1, shake: 1, slow: .2, text: '¡PUERTA!', who: 'att' },
      { t: 7.9, fx: 'impact', at: 'vic', sfx: 'heavy', shake: .6 },
      { t: 8.2, fx: 'dust', at: 'ground', n: 4 },
      { t: 8.9, text: '¡CORRE!', who: 'vic' },
      { t: 8.95, fx: 'charge', at: 'att' }, { t: 9.0, fx: 'ghost' }, { t: 9.1, fx: 'ghost' }, { t: 9.2, fx: 'ghost' }, { t: 9.3, fx: 'line', sfx: 'whoosh' },
      { t: 9.45, hit: 2, fx: 'impact', at: 'vic', big: 1, imp: 1, shake: .6, text: '¡TE ALCANCÉ!', who: 'att' },
      { t: T_HATCH, hit: 3, fx: 'boom', at: 'vic', r: 2.6, big: 1, imp: 1, shake: 1, prop: 'hatch', slow: .2, text: '¡AL SUELO!', who: 'att' },
      { t: T_HIT - .02, rel: { dmg: 26, kb: 10, up: 3, rag: 2.2 }, fx: 'boom', at: 'ground', r: 4.8, big: 1, imp: 1, shake: 1.4, slow: .3 }, { t: T_HIT, fx: 'crack', at: 'ground', r: 7 }, { t: T_HIT + .05, fx: 'dust', at: 'ground', n: 40 },
      { t: LAND_T, fx: 'ring', at: 'groundA', r: 5, shake: .6 }, { t: LAND_T + .02, fx: 'dust', at: 'groundA', n: 34 }, { t: LAND_T + .05, fx: 'crack', at: 'groundA', r: 5 },
      { t: LAND_T + .3, text: '¡VUELO SIN RETORNO!', who: 'att' },
    ],
    shots: [
      [0, 'rig', { at: 'A', a0: 20, a1: 220, r0: 4.6, r1: 4.6, h0: .1, ly: .9, fov: 52, roll0: 5, ease: 'l' }],
      [1.3, 'rig', { at: 'V', a0: 90, a1: 300, r0: 6, r1: 5, h0: .4, fov: 58, ease: 'l' }],
      [1.9, 'rig', { at: 'V', a0: 80, a1: 100, r0: 8, r1: 10, h0: -.5, h1: 2, fov0: 62, fov1: 70 }],
      [2.35, 'rig', { at: 'A', a0: 150, a1: 190, r0: 5.5, r1: 7, h0: -.4, ly: .5, fov: 56, roll0: -6 }],
      [2.9, 'rig', { at: 'A', at1: 'V', a0: 110, a1: 80, r0: 12, r1: 14, h0: -3, h1: 1, fov: 64, ease: 'o' }],
      [3.4, 'faceV', { s: 1, fov: 42 }],
      [4.0, 'rig', { at: 'V', a0: 60, a1: 100, r0: 9, r1: 8, h0: .5, fov: 56, roll0: 4 }],
      [4.5, 'rig', { at: 'mid', a0: 120, a1: 90, r0: 8, h0: .4, fov: 50 }],
      [5.0, 'rig', { at: 'V', a0: 160, a1: 140, r0: 5, h0: .2, fov: 46, roll0: -4 }],
      [5.45, 'rig', { at: 'V', a0: 40, a1: 55, r0: 5, h0: .4, fov: 46, roll0: 5 }],
      [5.8, 'two', { fov: 52 }],
      [6.2, 'rig', { at: 'V', a0: 175, a1: 185, r0: 4.8, h0: .2, fov: 44, roll0: 3 }],
      [6.6, 'rig', { at: 'V', a0: 195, a1: 205, r0: 5, h0: .3, fov: 48 }],
      [6.95, 'rig', { at: 'mid', a0: 100, a1: 100, r0: 28, h0: 1, fov: 52, ease: 'l' }],
      [7.4, 'rig', { at: 'V', a0: 165, a1: 160, r0: 6.5, h0: .4, fov: 48, roll0: -5 }],
      [7.75, 'rig', { at: 'V', a0: 270, a1: 270, r0: 4.6, h0: .6, fov: 62, roll0: 6 }],
      [8.2, 'rig', { at: 'V', a0: 270, a1: 270, r0: 4.6, h0: .8, fov: 58 }],
      [8.65, 'rig', { at: 'V', a0: 80, a1: 90, r0: 3.2, h0: .3, fov: 52 }],
      [9.0, 'rig', { at: 'A', a0: 270, a1: 270, r0: 3.2, h0: .2, fov: 64, roll0: 4 }],
      [9.4, 'rig', { at: 'mid', a0: 90, a1: 90, r0: 3.4, r1: 2.8, h0: .5, fov: 50, roll0: -4 }],
      [9.85, 'rig', { at: 'V', a0: 270, a1: 270, r0: 4.8, h0: 1.0, fov: 58, roll0: 8 }],
      [10.1, 'rig', { at: 'V', a0: 0, a1: 20, r0: 3.5, r1: 5, h0: 3, h1: 4, fov0: 70, fov1: 78, ease: 'l' }],
      [10.55, 'rig', { at: 'A', a0: 250, a1: 250, r0: 6, h0: -5, fov: 54, roll0: 3 }],
      [10.85, 'rig', { at: 'V', a0: 60, a1: 70, r0: 8, h0: .2, fov: 48, roll0: -4 }],
      [11.2, 'rig', { at: 'A', a0: 120, a1: 135, r0: 15, h0: 3, fov: 50 }],
      [11.65, 'rig', { at: 'A', a0: 90, a1: 150, r0: 9, r1: 7, h0: .8, h1: 1, fov: 60, ease: 'o' }],
      [12.0, 'rig', { at: 'A', a0: 200, a1: 230, r0: 8, h0: 2.8, ly: .8, fov: 50, roll0: 4 }],
      [12.75, 'rig', { at: 'A', a0: 160, a1: 200, r0: 7, r1: 6.5, h0: 2.2, ly: 1, fov: 48, roll0: -3 }],
    ],
  };
});
