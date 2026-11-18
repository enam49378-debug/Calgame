/* ===== MAPAS QUE CAMBIAN (estilo battleground) + PORTALES =====
   Cada cierto tiempo la partida cambia de mapa: lo del mapa anterior desaparece y aparece el siguiente.
     Mapa A · Selva Esmeralda: la ciudad, el mar, el abismo y la selva.    Mapa B · Valle Sakura: el Japón.
   Cada mapa tiene su clima, su hora y sus eventos.
   Cuando toca cambiar:
     1) un portal se abre delante de cada peleador y lo absorbe (nadie se puede mover);
     2) pantalla de viaje: el personaje sale despedido, asustado, por un túnel de luz (esto tapa la carga del mapa);
     3) otro portal lo traga y, en el mapa nuevo, cae de un portal del cielo de cara al suelo, se queda tendido, se levanta y recupera el control.
   Solo se ve con la vista privada (CF_BETA): el público sigue con el mapa de siempre. Solo contra bots / práctica (en salas online todavía no).
   Este archivo se ejecuta dentro de game.js: usa sus funciones directamente (G, scene, STAGE, animate, ...). El tiempo entre cambios se puede
   ajustar con localStorage 'bsb_map_rot' (segundos, mínimo 20). */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    let EVERY = 300; try { const v = +localStorage.getItem('bsb_map_rot'); if (v >= 20) EVERY = v; } catch (e) { }
    const ORDER = ['A', 'B'];
    const TIPS = {
      A: ['La selva esconde una pirámide: sube hasta la cima.', 'En la ciudad hay un ascensor en la Torre Aurora.', 'Cuidado con el mar profundo: el Kraken despierta de vez en cuando.', 'Los ríos y la laguna se nadan: ¡bucea!'],
      B: ['El castillo del Dragón Blanco está sobre la colina.', 'Cruza los puentes rojos del Río Koi.', 'La niebla del zorro cubre el valle de vez en cuando.', 'El gran torii del mar se alcanza por una pasarela.']
    };
    const R = { t: 0, warned: -1, ev: null, evT: 70, chipT: 0 };
    const T = { phase: '', t: 0, to: 'B', list: [], fx: null, swapped: false, spawns: null, exitP: null, saved: null };
    const col3 = id => new THREE.Color(MAPS[id].col);

    // ---------- interfaz ----------
    const css = document.createElement('style');
    css.textContent = '#mviaje{position:fixed;inset:0;z-index:70;pointer-events:none;display:none;font-family:"Chakra Petch",system-ui,sans-serif;color:#fff}#mviaje.on{display:block}'
      + '#mviaje .vg{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,.72) 100%)}'
      + '#mviaje .tt{position:absolute;left:0;right:0;top:9vh;text-align:center;animation:mvIn .7s cubic-bezier(.2,1.2,.4,1) both}'
      + '#mviaje small{display:block;letter-spacing:.42em;font-size:13px;opacity:.85;font-weight:600}'
      + '#mviaje h1{font-size:clamp(28px,5.4vw,60px);margin:.18em 0 .05em;font-weight:700;letter-spacing:.06em;text-shadow:0 0 28px var(--mc),0 3px 0 rgba(0,0,0,.45)}'
      + '#mviaje p{margin:0;font-size:15px;opacity:.85}'
      + '#mviaje .bar{position:absolute;left:50%;bottom:12vh;width:min(440px,72vw);height:8px;transform:translateX(-50%);background:rgba(255,255,255,.18);border-radius:6px;overflow:hidden}'
      + '#mviaje .bar i{display:block;height:100%;width:0;background:var(--mc);box-shadow:0 0 16px var(--mc)}'
      + '#mviaje .ld{position:absolute;left:0;right:0;bottom:15.2vh;text-align:center;font-size:12px;letter-spacing:.3em;opacity:.8}'
      + '#mviaje .tip{position:absolute;left:0;right:0;bottom:6.5vh;text-align:center;font-size:14px;opacity:.82;padding:0 24px}'
      + '@keyframes mvIn{from{opacity:0;transform:translateY(-18px) scale(.94)}}'
      + '#mflash{position:fixed;inset:0;z-index:71;background:#fff;opacity:0;pointer-events:none}'
      + '#mchip{position:fixed;left:50%;top:38px;transform:translateX(-50%);z-index:30;display:none;pointer-events:none;padding:4px 14px;border-radius:999px;background:rgba(10,16,26,.62);border:1px solid var(--mc,#fff);color:#fff;font:600 12px "Chakra Petch",system-ui,sans-serif;letter-spacing:.08em;white-space:nowrap}'
      + '#mchip.on{display:block}#mchip.hot{animation:mchot .6s ease-in-out infinite alternate}@keyframes mchot{to{background:rgba(120,30,40,.8)}}';
    document.head.appendChild(css);
    const V = document.createElement('div'); V.id = 'mviaje';
    V.innerHTML = '<div class="vg"></div><div class="tt"><small>VIAJANDO A</small><h1></h1><p></p></div><div class="ld">CARGANDO EL MAPA</div><div class="bar"><i></i></div><div class="tip"></div>';
    document.body.appendChild(V);
    const FL = document.createElement('div'); FL.id = 'mflash'; document.body.appendChild(FL);
    const CH = document.createElement('div'); CH.id = 'mchip'; document.body.appendChild(CH);
    const flash = (ms = 420) => { FL.style.transition = 'none'; FL.style.opacity = '1'; void FL.offsetWidth; FL.style.transition = `opacity ${ms}ms ease-out`; FL.style.opacity = '0'; };
    const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const snd = (k, pos, v) => { try { sfx(k, pos || (G.player && G.player.pos), v == null ? .6 : v); } catch (e) { } };

    // ---------- portal ----------
    let swTex = null;
    function swirlTex() {
      if (swTex) return swTex;
      const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      const gr = g.createRadialGradient(128, 128, 4, 128, 128, 126); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.38, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,.06)');
      g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineCap = 'round';
      for (let k = 0; k < 6; k++) { g.lineWidth = 5 + (k % 2) * 4; g.beginPath(); for (let i = 0; i <= 44; i++) { const u = i / 44, a = k / 6 * TAU + u * 5.4, r = 8 + u * 114, x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      swTex = new THREE.CanvasTexture(c); return swTex;
    }
    function makePortal(color, r0 = 1.6) {
      const g = new THREE.Group(), add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false };
      const core = new THREE.Mesh(new THREE.CircleGeometry(r0 * .92, 32), new THREE.MeshBasicMaterial({ color: 0x07041a, transparent: true, opacity: .88, depthWrite: false, side: THREE.DoubleSide, fog: false })); core.position.z = -.02;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(r0, 48), new THREE.MeshBasicMaterial({ map: swirlTex(), color, ...add })); disc.position.z = .02;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r0, .1, 8, 56), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(r0 * 1.2, .05, 6, 56), new THREE.MeshBasicMaterial({ color, opacity: .9, ...add }));
      g.add(core, disc, ring, ring2); g.userData = { disc, ring2 }; g.scale.setScalar(.001); g.renderOrder = 5; return g;
    }
    const portalTick = (g, dt, open) => { g.userData.disc.rotation.z -= dt * 3.4; g.userData.ring2.rotation.z += dt * 1.7; g.scale.setScalar(Math.max(.001, open)); };
    function killPortal(p) { if (!p) return; if (p.parent) p.parent.remove(p); p.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    const fighters = () => G.fighters.filter(f => f.alive && !f.dummy && !f.remote && f.model);
    function resetModel(f) { const m = f.model.root; m.scale.setScalar(1); m.rotation.x = 0; m.rotation.z = 0; }

    // ---------- 1) absorción ----------
    function begin(to) {
      if (TRAVEL.on || !G.player || !G.player.alive || G.over) return false;
      TRAVEL.on = TRAVEL.freeze = TRAVEL.lock = true; T.phase = 'absorb'; T.t = 0; T.to = to; T.swapped = false; T.list = []; T.spawns = null;
      $('hud').style.visibility = 'hidden'; CH.classList.remove('on', 'hot');
      for (const f of fighters()) {
        if (f.action) endAction(f); f.blocking = false; f.vel.set(0, 0, 0); f.iframes = 99; f.onGround = true;
        const Fv = fwd(f.yaw), c = new V3(f.pos.x + Fv.x * 3.4, f.pos.y + 1.45, f.pos.z + Fv.z * 3.4);
        const p = makePortal(col3(to), f.isPlayer ? 1.7 : 1.15); p.position.copy(c); p.rotation.y = f.yaw + Math.PI; scene.add(p);
        T.list.push({ f, p, c, p0: f.pos.clone(), delay: f.isPlayer ? 0 : Math.random() * .5 });
      }
      snd('ult', G.player.pos, .5);
      showBanner('PORTAL ABIERTO', MAPS[to].col, 'Viajando a ' + MAPS[to].short);
      return true;
    }
    function absorbTick(dt) {
      T.t += dt;
      for (const e of T.list) {
        const t = T.t - e.delay; if (t < 0) continue;
        const f = e.f, open = easeOut(clamp(t / .55, 0, 1)) * (t > 2.05 ? clamp(1 - (t - 2.05) / .3, 0, 1) : 1);
        portalTick(e.p, dt, open);
        if (t > .45) {
          const s = clamp((t - .45) / 1.6, 0, 1), k = s * s;
          f.pos.set(e.p0.x + (e.c.x - e.p0.x) * k, e.p0.y + (e.c.y - 1 - e.p0.y) * k, e.p0.z + (e.c.z - e.p0.z) * k);
          f.onGround = false; f.ragdoll = Math.max(f.ragdoll, .3); if (!e.rag) { e.rag = 1; startRagdoll(f, 5); }
          animate(f, dt); const m = f.model.root; m.scale.setScalar(Math.max(.06, 1 - k * .94)); m.rotation.z = t * 7 * (1 + k * 3); m.rotation.x = Math.sin(t * 9) * .4 * k;
        } else animate(f, dt);
        if (Math.random() < dt * 70) {   // chispas que giran hacia el portal
          const a = rand(0, TAU), r = rand(.5, 1.9) * open, Rv = rightOf(f.yaw), p = new V3(e.c.x + Rv.x * Math.cos(a) * r, e.c.y + Math.sin(a) * r, e.c.z + Rv.z * Math.cos(a) * r);
          emit(p.x, p.y, p.z, (e.c.x - p.x) * 1.6, (e.c.y - p.y) * 1.6, (e.c.z - p.z) * 1.6, Math.random() < .35 ? '#ffffff' : MAPS[T.to].col, rand(.08, .16), .55, 0, 1);
        }
      }
      PS.update(dt);
      if (T.t > 2.65) startTunnel();
    }

    // ---------- 2) pantalla de viaje ----------
    const TUNNEL_MIN = 4.6, EXIT_AT = 3.0;
    function makeTunnelFx() {
      const g = new THREE.Group(), c = col3(T.to);
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      const geo = new THREE.BoxGeometry(.05, .05, 5), streaks = [];
      const place = (m, far) => { const a = rand(0, TAU), r = rand(1.6, 7); m.position.set(Math.cos(a) * r, 1 + Math.sin(a) * r * .8, far ? rand(-80, 12) : -80); m.scale.z = rand(.6, 2.2); m.userData.v = rand(34, 70); };
      for (let i = 0; i < 100; i++) { const m = new THREE.Mesh(geo, mat); place(m, true); g.add(m); streaks.push(m); }
      const rg = new THREE.TorusGeometry(6.2, .07, 6, 48), rmat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), rings = [];
      for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(rg, rmat); m.position.set(0, 1, -i * 10); g.add(m); rings.push(m); }
      g.userData = { streaks, rings, place, mat }; return g;
    }
    function startTunnel() {
      T.phase = 'tunnel'; T.t = 0; flash(380);
      for (const e of T.list) { killPortal(e.p); e.p = null; resetModel(e.f); }
      const P = G.player; T.saved = { pos: P.pos.clone(), yaw: P.yaw };
      P.pos.set(0, 3000, 0); P.yaw = 0; P.prevYaw = 0; P.vel.set(0, 0, 0); P.ragdoll = 999; P.onGround = false; P.rdPose = 0; P.rdDir = 1; P.getupT = 0;
      stageEnter(P);
      const c = col3(T.to); STAGE.skyMat.color.copy(c).multiplyScalar(.5); STAGE.swirlMat.color.copy(c); STAGE.rim.color.copy(c); STAGE.scene.background.copy(c).multiplyScalar(.05); STAGE.scene.fog.color.copy(STAGE.scene.background);
      if (STAGE.floorMat) STAGE.floorMat.visible = false; STAGE.rings.concat(STAGE.halos).forEach(m => { m.visible = false; });
      T.fx = makeTunnelFx(); T.fx.position.copy(P.pos); STAGE.scene.add(T.fx);
      T.exitP = null; T.exitT = -1;
      const o = V; o.style.setProperty('--mc', MAPS[T.to].col); o.querySelector('h1').textContent = MAPS[T.to].short; o.querySelector('p').textContent = MAPS[T.to].sub;
      o.querySelector('.tip').textContent = pick(TIPS[T.to]); o.querySelector('.bar i').style.width = '0%'; o.classList.add('on');
      snd('elev_ride', P.pos, .7);
    }
    function tunnelTick(dt) {
      T.t += dt; const P = G.player, c = col3(T.to);
      if (!T.swapped && T.t > .8) doSwap();
      V.querySelector('.bar i').style.width = (clamp(T.t / (TUNNEL_MIN - .4), 0, 1) * 100) + '%';
      // el personaje flota asustado: brazos y piernas sueltos, voltereta lenta
      T.rag = (T.rag || 0) - dt; if (T.rag <= 0) { T.rag = .35; startRagdoll(P, 5); P.rdPose = 0; }
      P.ragdoll = Math.max(P.ragdoll, 3); P.onGround = false;
      let k = 0;
      if (T.t > EXIT_AT && T.swapped) {   // 3) otro portal lo traga
        if (!T.exitP) { T.exitP = makePortal(c, 3.6); T.exitP.position.set(0, 3000 + 1.1, -18); STAGE.scene.add(T.exitP); T.exitT = T.t; snd('ult', P.pos, .45); }
        const u = clamp((T.t - T.exitT) / 1.7, 0, 1); k = u * u; portalTick(T.exitP, dt, easeOut(clamp((T.t - T.exitT) / .6, 0, 1)));
      }
      P.pos.set(0, 3000 + Math.sin(T.t * 2) * .12, -17 * k);
      animate(P, dt);
      const m = P.model.root; m.rotation.x = Math.sin(T.t * 1.4) * .5; m.rotation.z = T.t * 1.1 + k * 9; m.scale.setScalar(Math.max(.1, 1 - k * .9));
      updateStage(dt);
      const u2 = T.fx.userData;
      for (const s of u2.streaks) { s.position.z += s.userData.v * dt; if (s.position.z > 14) u2.place(s, false); }
      for (const r of u2.rings) { r.position.z += 30 * dt; if (r.position.z > 12) r.position.z -= 90; r.rotation.z += dt; }
      if (Math.random() < dt * 40) STAGE.parts.emit(P.pos.x + rand(-2, 2), P.pos.y + rand(-.5, 2.5), P.pos.z + rand(2, 8), 0, 0, -rand(20, 40), Math.random() < .5 ? '#ffffff' : MAPS[T.to].col, rand(.05, .1), .6, 0, .5);
      if (T.t > TUNNEL_MIN && T.swapped && k >= 1) startArrive();
    }
    function tunnelCam(dt) {
      const P = G.player, t = T.t, chase = T.exitP ? clamp((t - T.exitT) / 1.7, 0, 1) : 0;
      camera.position.set(P.pos.x + Math.sin(t * .6) * 1.1, P.pos.y + 1.55 + Math.sin(t * .9) * .2, P.pos.z + 4.6 - chase * 1.4);
      camera.lookAt(P.pos.x, P.pos.y + .75 - chase * .2, P.pos.z - .8); camera.rotation.z += Math.sin(t * 2.3) * .03;
    }

    // ---------- cambio de mapa (detrás de la pantalla de viaje) ----------
    function doSwap() {
      T.swapped = true; setMapNow(T.to);
      atmosphereCommand({ mode: 'auto', hour: MAPS[T.to].hour, cycle: true });
      R.ev = null; R.evT = 55 + Math.random() * 40;
      const taken = [], free = spawnsNow().filter(p => groundAt(p.x, p.z) <= .1); T.spawns = new Map();
      for (const e of T.list) {
        let best = null, bs = -1; const pool = free.length ? free : spawnsNow();
        for (const p of pool) { let d = 999; for (const q of taken) d = Math.min(d, Math.hypot(p.x - q.x, p.z - q.z)); d += Math.random() * 6; if (d > bs) { bs = d; best = p; } }
        taken.push(best); T.spawns.set(e.f, best);
      }
    }

    // ---------- 4) llegada: cae de un portal del cielo ----------
    function startArrive() {
      T.phase = 'arrive'; T.t = 0; stageExit();
      if (STAGE.floorMat) STAGE.floorMat.visible = true; STAGE.rings.concat(STAGE.halos).forEach(m => { m.visible = true; });
      if (T.fx) { STAGE.scene.remove(T.fx); T.fx = null; } killPortal(T.exitP); T.exitP = null; V.classList.remove('on'); flash(700);
      const c = col3(T.to);
      for (const e of T.list) {
        const f = e.f, sp = T.spawns.get(f), gy = groundAt(sp.x, sp.z);
        resetModel(f); f.pos.set(sp.x, gy + 15 + (f.isPlayer ? 0 : Math.random() * 3), sp.z); f.yaw = f.prevYaw = sp.yaw; f.vel.set(0, -4, 0); f.onGround = false;
        f.action = null; f.stun = 0; f.getupT = 0; f.hurtT = 0; f.iframes = 9; f.rdDir = 1; startRagdoll(f, 3); f.ragdoll = 3; f.rdPose = 1;
        const p = makePortal(c, f.isPlayer ? 1.9 : 1.3); p.rotation.x = -Math.PI / 2; p.position.set(sp.x, f.pos.y + 1.6, sp.z); scene.add(p); e.p = p; e.land = false; e.up = false;
        if (f.ai) { f.ai.cityPath = null; f.ai.cityThink = 0; }
      }
      const P = G.player; cam.yaw = P.yaw; cam.pitch = .02; TRAVEL.freeze = false;   // desde aquí corre la física: cae de verdad
      snd('chime', P.pos, .8);
    }
    function arriveTick(dt) {
      T.t += dt; let done = true;
      for (const e of T.list) {
        const f = e.f; if (!f.alive) continue;
        if (e.p) {
          const open = easeOut(clamp(T.t / .45, 0, 1)) * (T.t > 2.4 ? clamp(1 - (T.t - 2.4) / .4, 0, 1) : 1); portalTick(e.p, dt, open);
          if (open > .2 && Math.random() < dt * 50) { const a = rand(0, TAU), r = rand(.4, 1.7); emit(e.p.position.x + Math.cos(a) * r, e.p.position.y, e.p.position.z + Math.sin(a) * r, 0, rand(-4, -1.5), 0, Math.random() < .3 ? '#ffffff' : MAPS[T.to].col, rand(.07, .15), .7, 0, 1); }
          if (T.t > 2.8) { killPortal(e.p); e.p = null; }
        }
        if (!e.land) { f.ragdoll = Math.max(f.ragdoll, .4); f.rdPose = 1; if (f.onGround) { e.land = true; startRagdoll(f, .9); f.ragdoll = .9; f.rdPose = 1; f.vel.set(0, 0, 0); burst(new V3(f.pos.x, f.pos.y + .2, f.pos.z), 26, '#d9d2b4', 6, .22, .6, -.2); if (f.isPlayer) { G.shake = .6; snd('heavy', f.pos, .9); } } }
        else if (!e.up && f.ragdoll <= 0) { e.up = true; f.getupT = .55; }   // se levanta (animación 'levantarse')
        if (f.isPlayer && !(e.up && f.getupT <= 0)) done = false;
      }
      if (done || T.t > 7) finish();
    }

    // ---------- fin ----------
    function finish() {
      for (const e of T.list) { killPortal(e.p); e.p = null; if (e.f.model) resetModel(e.f); if (e.f.alive) e.f.iframes = Math.max(e.f.iframes, 1.2); }
      T.list = []; T.phase = ''; TRAVEL.on = TRAVEL.freeze = TRAVEL.lock = false; $('hud').style.visibility = ''; R.t = 0; R.warned = -1;
      showBanner(MAPS[MAPCUR.id].short, MAPS[MAPCUR.id].col, MAPS[MAPCUR.id].sub); addFeedText('Mapa nuevo: ' + MAPS[MAPCUR.id].name, MAPS[MAPCUR.id].col);
    }
    function abort() {
      if (STAGE.on) stageExit(); if (STAGE.floorMat) STAGE.floorMat.visible = true; STAGE.rings.concat(STAGE.halos).forEach(m => { m.visible = true; });
      if (T.fx) { STAGE.scene.remove(T.fx); T.fx = null; } killPortal(T.exitP); T.exitP = null;
      for (const e of T.list) { killPortal(e.p); if (e.f.model) resetModel(e.f); }
      T.list = []; T.phase = ''; TRAVEL.on = TRAVEL.freeze = TRAVEL.lock = false; V.classList.remove('on'); $('hud').style.visibility = '';
    }

    // ---------- eventos de cada mapa ----------
    const wx = mode => { try { atmosphereCommand({ mode }); } catch (e) { } };
    const petals = dt => { const p = G.player.pos; for (let i = 0; i < 2; i++) if (Math.random() < dt * 14) emit(p.x + rand(-16, 16), p.y + rand(7, 13), p.z + rand(-16, 16), rand(1, 3), rand(-1.7, -.9), rand(-1, 1), pick(['#f7b6cf', '#fbd0e0', '#f39dbd']), .13, 6, 0, 0); };
    const lanterns = dt => { const p = G.player.pos; if (Math.random() < dt * 12) emit(p.x + rand(-20, 20), p.y + rand(0, 2), p.z + rand(-20, 20), rand(-.3, .3), rand(1.2, 2.2), rand(-.3, .3), pick(['#ffd35c', '#ffb454', '#fff0b1']), .3, 9, 0, 1); };
    const EVTS = {
      A: [{ id: 'tormenta', n: 'Tormenta tropical', m: 'Se acerca una tormenta tropical: truenos y lluvia fuerte.', col: '#7ad7ff', dur: 60, on() { wx('storm'); }, off() { wx('auto'); } },
          { id: 'neblina', n: 'Niebla de la selva', m: 'La niebla cubre la selva: verás poco a lo lejos.', col: '#bfe8d0', dur: 55, on() { wx('densefog'); }, off() { wx('auto'); } }],
      B: [{ id: 'petalos', n: 'Lluvia de pétalos', m: 'Los cerezos sueltan una lluvia de pétalos.', col: '#f7b6cf', dur: 45, on() { wx('wind'); }, tick: petals, off() { wx('auto'); } },
          { id: 'niebla', n: 'Niebla del zorro', m: 'La niebla del zorro cubre el valle.', col: '#cfd8ff', dur: 50, on() { wx('densefog'); }, off() { wx('auto'); } },
          { id: 'festival', n: 'Festival de farolillos', m: 'Cae la noche y miles de farolillos suben al cielo.', col: '#ffd35c', dur: 55, on() { atmosphereCommand({ hour: 20.2, cycle: false }); }, tick: lanterns, off() { atmosphereCommand({ mode: 'auto', hour: 18, cycle: true }); } }]
    };
    function eventsTick(dt) {
      if (R.ev) { R.ev.t -= dt; if (R.ev.e.tick) R.ev.e.tick(dt); if (R.ev.t <= 0) { R.ev.e.off(); addFeedText(R.ev.e.n + ' terminó', '#9fd3ff'); R.ev = null; R.evT = 80 + Math.random() * 70; } return; }
      R.evT -= dt; if (R.evT > 0) return;
      const list = EVTS[MAPCUR.id] || [], e = pick(list); if (!e) { R.evT = 90; return; }
      R.ev = { e, t: e.dur }; e.on(); showBanner(e.n.toUpperCase(), e.col, e.m); addFeedText(e.m, e.col);
    }

    // ---------- bucle ----------
    function updateChip(dt) {
      R.chipT -= dt; if (R.chipT > 0) return; R.chipT = .25;
      const on = worldBig() && G.state === 'play' && !TRAVEL.on && !G.over; CH.classList.toggle('on', on); if (!on) return;
      const rem = EVERY - R.t; CH.style.setProperty('--mc', MAPS[MAPCUR.id].col);
      CH.textContent = MAPS[MAPCUR.id].short + (R.ev ? '  ·  ' + R.ev.e.n.toUpperCase() : '') + '  ·  PORTAL EN ' + fmt(rem); CH.classList.toggle('hot', rem <= 10);
    }
    function tick(dt) {
      if (!worldBig()) { if (TRAVEL.on) abort(); if (MAPCUR.id !== 'A') setMapNow('A'); CH.classList.remove('on'); return; }
      if (G.state !== 'play') { if (TRAVEL.on) abort(); CH.classList.remove('on'); return; }
      if (TRAVEL.on) {
        if (G.over) { abort(); return; }
        if (T.phase === 'absorb') absorbTick(dt); else if (T.phase === 'tunnel') tunnelTick(dt); else if (T.phase === 'arrive') arriveTick(dt);
        return;
      }
      if (G.paused || G.over || G.mp || G.cine) { updateChip(0); return; }
      R.t += dt; eventsTick(dt); updateChip(dt);
      const rem = EVERY - R.t, sec = Math.ceil(rem);
      if (rem <= 10 && sec !== R.warned && sec > 0) { R.warned = sec; if (sec === 10) showBanner('PORTAL EN 10 s', MAPS[MAPCUR.id].col, 'El mapa está a punto de cambiar'); else snd('chime', G.player && G.player.pos, .35); }
      if (R.t >= EVERY && G.player && G.player.alive) begin(ORDER[(ORDER.indexOf(MAPCUR.id) + 1) % ORDER.length]);
    }
    function reset() { if (TRAVEL.on) abort(); R.t = 0; R.warned = -1; R.ev = null; R.evT = 70; }
    A.MAPAS = { tick, cam(dt) { if (T.phase === 'tunnel') tunnelCam(dt); }, reset, begin, every(s) { EVERY = Math.max(20, +s || 300); R.t = 0; }, state: () => ({ phase: T.phase, t: T.t, map: MAPCUR.id, left: EVERY - R.t }) };
  }
});
