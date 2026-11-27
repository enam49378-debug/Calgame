// Sistema de intro de entrada al mundo/partida (después de elegir personaje y entrar al mapa).
// Cada personaje puede registrar su propia escena BBS en INTROS[charId] (clip + apos + cam + props).
// Los personajes sin escena BBS propia usan una entrada cinematográfica genérica (barrido de cámara + pose de entrada).
window.CF_COMBATE = window.CF_COMBATE || {};

window.CF_COMBATE.crearIntroEntrada = function crearIntroEntrada(D) {
  'use strict';
  const { V3, clamp, fwd, rightOf, scene, camera, groundAt, buildSpear, setSpear, burst, sfx,
          bbSet, javiBBTrack, buildTrack, G, cam, endCamScript, CFG_CINE } = D;

  // Escenas de entrada personalizadas (convertidas desde BBS .dat)
  const INTROS = {
    javi: {
      dur: 2.25,
      clip: "entrada_mundo",
      grabAt: 1.7,
      apos: [[0.0,0.0,0.0,-3.844],[0.05,0.0,0.0,-3.679],[0.1,0.0,0.0,-3.463],[0.15,0.0,0.0,-3.205],[0.2,0.0,0.0,-2.914],[0.25,0.0,0.0,-2.597],[0.3,0.0,0.0,-2.264],[0.35,0.0,0.0,-1.922],[0.4,0.0,0.0,-1.58],[0.45,0.0,0.0,-1.247],[0.5,0.0,0.0,-0.93],[0.55,0.0,0.0,-0.639],[0.6,0.0,0.0,-0.381],[0.65,0.0,0.0,-0.165],[0.7,0.0,0.0,0.0],[0.75,0.0,0.0,0.0],[0.8,0.0,0.0,0.0],[0.85,0.0,0.0,0.0],[0.9,0.0,0.0,0.0],[0.95,0.0,0.0,0.0],[1.0,0.0,0.0,0.0],[1.05,0.0,0.0,0.0],[1.1,0.0,0.0,0.0],[1.15,0.0,0.0,0.0],[1.2,0.0,0.0,0.0],[1.25,0.0,0.0,0.0],[1.3,0.0,0.0,0.0],[1.35,0.0,0.0,0.0],[1.4,0.0,0.0,0.0],[1.45,0.0,0.0,0.0],[1.5,0.0,0.0,0.0],[1.55,0.0,0.0,0.0],[1.6,0.0,0.0,0.0],[1.65,0.0,0.0,0.0],[1.7,0.0,0.0,0.0],[1.75,0.0,0.0,0.0],[1.8,0.0,0.0,0.0],[1.85,0.0,0.0,0.0]],
      cam: [[0.0,0.341,1.149,-3.558,361.986,-0.752,0.269,24.216],[0.025,0.341,1.149,-3.558,361.908,-0.83,0.269,24.459],[0.05,0.341,1.149,-3.558,361.81,-0.928,0.269,24.763],[0.075,0.341,1.149,-3.558,361.695,-1.043,0.269,25.122],[0.1,0.341,1.149,-3.558,361.565,-1.173,0.269,25.527],[0.125,0.341,1.149,-3.558,361.422,-1.316,0.269,25.97],[0.15,0.341,1.149,-3.558,361.27,-1.468,0.269,26.445],[0.175,0.341,1.149,-3.558,361.11,-1.628,0.269,26.942],[0.2,0.341,1.149,-3.558,360.945,-1.793,0.269,27.456],[0.225,0.341,1.149,-3.558,360.777,-1.96,0.269,27.977],[0.25,0.341,1.149,-3.558,360.61,-2.128,0.269,28.497],[0.275,0.341,1.149,-3.558,360.445,-2.293,0.269,29.011],[0.3,0.341,1.149,-3.558,360.285,-2.453,0.269,29.508],[0.325,0.341,1.149,-3.558,360.133,-2.605,0.269,29.983],[0.35,0.341,1.149,-3.558,359.99,-2.748,0.269,30.426],[0.375,0.341,1.149,-3.558,359.86,-2.878,0.269,30.831],[0.4,0.341,1.149,-3.558,359.745,-2.993,0.269,31.19],[0.425,0.341,1.149,-3.558,359.647,-3.091,0.269,31.494],[0.45,0.341,1.149,-3.558,359.569,-3.169,0.269,31.737],[0.475,0.341,1.149,-3.558,359.498,-3.215,0.269,31.929],[0.5,0.341,1.149,-3.558,359.437,-3.208,0.269,32.045],[0.525,0.341,1.149,-3.558,359.385,-3.157,0.269,32.095],[0.55,0.341,1.149,-3.558,359.342,-3.075,0.269,32.089],[0.575,0.341,1.149,-3.558,359.309,-2.969,0.269,32.039],[0.6,0.341,1.149,-3.558,359.286,-2.85,0.269,31.957],[0.625,0.341,1.149,-3.558,359.271,-2.729,0.269,31.852],[0.65,0.341,1.149,-3.558,359.267,-2.615,0.269,31.737],[0.675,0.341,1.149,-3.558,359.271,-2.518,0.269,31.621],[0.7,0.341,1.149,-3.558,359.286,-2.449,0.269,31.516],[0.725,0.341,1.149,-3.558,359.309,-2.417,0.269,31.434],[0.75,0.341,1.149,-3.558,359.342,-2.433,0.269,31.384],[0.775,0.341,1.149,-3.558,359.385,-2.505,0.269,31.379],[0.8,0.341,1.149,-3.558,359.437,-2.646,0.269,31.428],[0.825,0.341,1.149,-3.558,359.498,-2.864,0.269,31.544],[0.85,0.341,1.149,-3.558,359.569,-3.169,0.269,31.737],[0.875,0.341,1.154,-3.558,359.725,-3.896,0.22,32.234],[0.9,0.341,1.165,-3.558,359.941,-4.901,0.097,32.935],[0.925,0.341,1.18,-3.558,360.201,-6.113,-0.07,33.787],[0.95,0.341,1.196,-3.558,360.491,-7.462,-0.247,34.732],[0.975,0.341,1.21,-3.558,360.794,-8.876,-0.403,35.715],[1.0,0.341,1.22,-3.558,361.097,-10.285,-0.505,36.68],[1.025,0.341,1.221,-3.558,361.382,-11.618,-0.521,37.573],[1.05,0.341,1.212,-3.558,361.636,-12.803,-0.419,38.337],[1.075,0.341,1.189,-3.558,361.842,-13.771,-0.167,38.917],[1.1,0.341,1.149,-3.558,361.986,-14.449,0.269,39.257],[1.125,0.341,1.099,-3.558,362.057,-14.789,0.822,39.34],[1.15,0.341,1.031,-3.558,362.094,-14.973,1.562,39.272],[1.175,0.341,0.95,-3.558,362.101,-15.024,2.451,39.076],[1.2,0.341,0.859,-3.558,362.086,-14.966,3.452,38.779],[1.225,0.341,0.761,-3.558,362.051,-14.823,4.527,38.406],[1.25,0.341,0.66,-3.558,362.003,-14.617,5.64,37.981],[1.275,0.341,0.558,-3.558,361.946,-14.372,6.753,37.53],[1.3,0.341,0.46,-3.558,361.887,-14.111,7.828,37.078],[1.325,0.341,0.369,-3.558,361.829,-13.857,8.829,36.651],[1.35,0.341,0.288,-3.558,361.778,-13.635,9.718,36.272],[1.375,0.341,0.221,-3.558,361.739,-13.466,10.458,35.969],[1.4,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.425,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.45,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.475,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.5,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.525,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.55,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.575,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.6,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.625,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.65,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.675,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.7,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.725,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.75,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.775,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.8,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.825,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.85,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.875,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.9,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.925,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.95,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[1.975,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.0,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.025,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.05,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.075,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.1,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.125,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.15,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.175,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.2,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.225,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765],[2.25,0.341,0.17,-3.558,361.718,-13.375,11.012,35.765]],
      spear: [[0.0,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.05,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.1,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.15,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.2,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.25,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.3,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.35,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.4,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.45,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.5,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.55,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.6,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.65,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.7,0.323,1.081,-0.384,-1.78,0.0,0.0],[0.75,0.323,1.081,-0.384,-2.174,0.0,0.0],[0.8,0.329,1.377,-0.256,-2.726,0.0,0.0],[0.85,0.336,1.823,-0.067,-3.376,0.0,0.0],[0.9,0.345,2.302,0.142,-4.064,0.0,0.0],[0.95,0.353,2.698,0.33,-4.73,0.0,0.0],[1.0,0.359,2.894,0.459,-5.108,0.0,0.0],[1.05,0.359,2.715,0.459,-5.486,0.0,0.0],[1.1,0.359,2.537,0.459,-5.864,0.0,0.0],[1.15,0.359,2.358,0.459,-6.242,0.0,0.0],[1.2,0.359,2.18,0.459,-6.621,0.0,0.0],[1.25,0.359,2.001,0.459,-6.999,0.0,0.0],[1.3,0.359,1.822,0.459,-7.377,0.0,0.0],[1.35,0.359,1.644,0.459,-7.755,0.0,0.0],[1.4,0.359,1.644,0.459,-8.133,0.0,0.0],[1.45,0.359,1.644,0.459,-8.133,0.0,0.0],[1.5,0.359,1.644,0.459,-8.133,0.0,0.0],[1.55,0.359,1.644,0.459,-8.133,0.0,0.0],[1.6,0.359,1.644,0.459,-8.133,0.0,0.0],[1.65,0.359,1.644,0.459,-8.133,0.0,0.0],[1.7,0.359,1.644,0.459,-8.133,0.0,0.0]]
    }
  };

  const INTRO = {
    on: false,
    f: null,
    spec: null,
    t: 0,
    dur: 0,
    origin: new V3(),
    dir: new V3(0, 0, 1),
    perp: new V3(1, 0, 0),
    yaw: 0,
    prevFov: 60,
    grabbed: false,
    spearMesh: null,
    prevHudVis: false
  };

  function sampleRows(K, t) {
    let i = 0;
    while (i < K.length - 2 && t >= K[i + 1][0]) i++;
    const a = K[i], b = K[Math.min(i + 1, K.length - 1)];
    const u = b[0] > a[0] ? clamp((t - a[0]) / (b[0] - a[0]), 0, 1) : 0;
    return [a, b, u];
  }

  function lerpIdx(a, b, u, j) { return a[j] + (b[j] - a[j]) * u; }

  function localToWorld(x, y, z, out) {
    out.copy(INTRO.origin)
      .addScaledVector(INTRO.perp, x)
      .addScaledVector(INTRO.dir, z);
    out.y = groundAt(out.x, out.z) + y;
    return out;
  }

  function disposeProp() {
    if (!INTRO.spearMesh) return;
    try {
      scene.remove(INTRO.spearMesh);
      INTRO.spearMesh.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    } catch (e) { }
    INTRO.spearMesh = null;
  }

  function introStop() {
    if (!INTRO.on) { disposeProp(); return; }
    const f = INTRO.f;
    INTRO.on = false;
    disposeProp();
    if (f) {
      f.choreTrack = null;
      f.choreTime = 0;
      f.anim.bbR6 = false;
      f.pos.copy(INTRO.origin);
      f.pos.y = groundAt(f.pos.x, f.pos.z);
      f.vel.set(0, 0, 0);
      f.yaw = INTRO.yaw;
      if (f.ch.weapon) setSpear(f, true);
      f.iframes = Math.max(f.iframes, 0.8);
    }
    if (G.camScript && G.camScript._intro) endCamScript();
    cam.fov = INTRO.prevFov || 60;
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    cam.yaw = INTRO.yaw;
    cam.pitch = 0.22;
    document.body.classList.remove('cine');
    INTRO.f = null;
    INTRO.spec = null;
  }

  function introStart(f) {
    if (!f || !f.isPlayer || G.viewer) return;
    introStop();
    const spec = INTROS[f.ch.id] || null;
    INTRO.on = true;
    INTRO.f = f;
    INTRO.spec = spec;
    INTRO.t = 0;
    INTRO.yaw = f.yaw;
    INTRO.origin.copy(f.pos);
    INTRO.origin.y = groundAt(f.pos.x, f.pos.z);
    INTRO.dir.copy(fwd(f.yaw));
    INTRO.perp.copy(rightOf(f.yaw));
    INTRO.prevFov = cam.fov || 60;
    INTRO.grabbed = false;

    if (spec) {
      INTRO.dur = spec.dur;
      const tr = javiBBTrack(spec.clip, f.ch.id);
      if (tr) {
        f.choreTrack = tr;
        f.choreTime = 0;
        f.anim.bbR6 = true;
      }
      // Si tiene lanza suelta en la escena, ocultar la de la mano hasta grabAt
      if (spec.spear && f.ch.weapon === 'spear') {
        setSpear(f, false);
        const sp = buildSpear();
        scene.add(sp);
        INTRO.spearMesh = sp;
      }
      // Posición inicial del recorrido
      if (spec.apos && spec.apos.length) {
        const a0 = spec.apos[0];
        localToWorld(a0[1], a0[2], a0[3], f.pos);
      }
    } else {
      // Intro genérica para personajes sin animación BBS propia todavía
      const bb = bbSet(f.ch.id);
      const menuClip = bb && (bb.entrada_mundo || bb.entrada_menu || bb.lucimiento);
      INTRO.dur = menuClip ? Math.min(1.6, Math.max(1.0, menuClip.length)) : 1.15;
      if (menuClip) {
        const clipName = bb.entrada_mundo ? 'entrada_mundo' : bb.entrada_menu ? 'entrada_menu' : 'lucimiento';
        f.choreTrack = javiBBTrack(clipName, f.ch.id);
        f.choreTime = 0;
        f.anim.bbR6 = true;
      } else if (f.ch.intro) {
        f.choreTrack = buildTrack(f.ch.intro);
        f.choreTime = 0;
        f.anim.bbR6 = false;
      }
    }

    f.vel.set(0, 0, 0);
    f.iframes = Math.max(f.iframes, INTRO.dur + 0.8);
    document.body.classList.add('cine');

    const _pos = new V3(), _look = new V3();
    G.camScript = {
      _intro: true,
      fn(dt) {
        if (!INTRO.on || !INTRO.f) return false;
        const t = INTRO.t;
        if (INTRO.spec && INTRO.spec.cam && INTRO.spec.cam.length) {
          const [a, b, u] = sampleRows(INTRO.spec.cam, t);
          const L = j => lerpIdx(a, b, u, j);
          const yw = L(4) * Math.PI / 180, pt = L(5) * Math.PI / 180, cp = Math.cos(pt);
          _pos.copy(INTRO.origin)
            .addScaledVector(INTRO.perp, L(1))
            .addScaledVector(INTRO.dir, L(3));
          _pos.y += L(2);
          _look.copy(_pos)
            .addScaledVector(INTRO.dir, Math.cos(yw) * cp)
            .addScaledVector(INTRO.perp, Math.sin(yw) * cp);
          _look.y -= Math.sin(pt);
          camera.position.copy(_pos);
          camera.up.set(0, 1, 0);
          camera.lookAt(_look);
          camera.rotateZ(L(6) * Math.PI / 180);
          const wantFov = clamp(L(7) || 55, 18, 95);
          cam.fov = wantFov;
          camera.fov = wantFov;
          camera.updateProjectionMatrix();
          return true;
        }
        // Cámara genérica: barrido suave de frente/costado hacia atrás del personaje
        const k = clamp(t / Math.max(0.1, INTRO.dur), 0, 1);
        const ez = 1 - Math.pow(1 - k, 3);
        const ang = (1 - ez) * 2.55; // empieza casi de frente y gira hasta la espalda
        const dist = 3.8 + ez * 2.4;
        const h = 1.45 + ez * 1.15;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        _pos.copy(INTRO.f.pos)
          .addScaledVector(INTRO.dir, -ca * dist)
          .addScaledVector(INTRO.perp, sa * dist);
        _pos.y += h;
        _look.copy(INTRO.f.pos);
        _look.y += 1.35;
        camera.position.copy(_pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(_look);
        const wantFov = 46 + ez * 14;
        cam.fov = wantFov;
        camera.fov = wantFov;
        camera.updateProjectionMatrix();
        return true;
      },
      cleanup() {
        document.body.classList.remove('cine');
      }
    };
  }

  function introTick(dt) {
    if (!INTRO.on) return false;
    const f = INTRO.f;
    if (!f || !f.alive || G.state !== 'play' || G.over || G.paused) {
      if (G.state !== 'play' || G.over || !f || !f.alive) introStop();
      return INTRO.on;
    }
    INTRO.t += dt;
    f.iframes = Math.max(f.iframes, 0.5);
    f.yaw = INTRO.yaw;
    f.vel.set(0, 0, 0);

    const spec = INTRO.spec;
    if (f.choreTrack) {
      const bb = spec && bbSet(f.ch.id);
      const clipLen = bb && bb[spec.clip] ? bb[spec.clip].length : INTRO.dur;
      f.choreTime = Math.min(INTRO.t, clipLen);
    }

    if (spec && spec.apos && spec.apos.length) {
      const [a, b, u] = sampleRows(spec.apos, INTRO.t);
      localToWorld(lerpIdx(a, b, u, 1), lerpIdx(a, b, u, 2), lerpIdx(a, b, u, 3), f.pos);
    }

    // Lanza de Javi en el mundo hasta el momento de atraparla
    if (spec && spec.spear) {
      if (!INTRO.grabbed && INTRO.t >= spec.grabAt) {
        INTRO.grabbed = true;
        disposeProp();
        setSpear(f, true);
        sfx('draw', f.pos, 0.9);
        burst(f.pos.clone().add(new V3(0, 1.4, 0)), f.ch.color || '#3fa9ff', 14, 5, 0.35);
      } else if (INTRO.spearMesh && !INTRO.grabbed) {
        const [a, b, u] = sampleRows(spec.spear, INTRO.t);
        const sp = INTRO.spearMesh;
        sp.position.copy(INTRO.origin)
          .addScaledVector(INTRO.perp, lerpIdx(a, b, u, 1))
          .addScaledVector(INTRO.dir, lerpIdx(a, b, u, 3));
        sp.position.y += lerpIdx(a, b, u, 2);
        sp.rotation.set(lerpIdx(a, b, u, 4), INTRO.yaw + lerpIdx(a, b, u, 5), lerpIdx(a, b, u, 6));
      }
    }

    if (INTRO.t >= INTRO.dur) {
      introStop();
      return false;
    }
    return true;
  }

  function introActive() { return INTRO.on; }

  // Permitir saltar la intro con Espacio
  addEventListener('keydown', e => {
    if (INTRO.on && !e.repeat && (e.code === 'Space' || e.code === 'Escape')) {
      if (e.code === 'Space') { e.preventDefault(); introStop(); }
    }
  });

  return { INTRO, INTROS, introStart, introTick, introStop, introActive };
};
