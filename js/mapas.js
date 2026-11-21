/* ===== MAPAS QUE CAMBIAN (estilo battleground) + PORTALES DEL MULTIVERSO =====
   Cada cierto tiempo la partida cambia de mapa por completo: lo del mapa anterior desaparece y aparece el siguiente.
     Mapa A · Ciudad Aurora (la ciudad, el mar y el abismo)   Mapa J · Selva Esmeralda   Mapa B · Valle Sakura (Japón)
   Cada mapa tiene su propio terreno, límites, minimapa, clima, hora y eventos.
   Cuando toca cambiar:
     1) un portal del multiverso se abre delante de cada peleador y lo absorbe (nadie se puede mover);
     2) pantalla de viaje: el personaje sale despedido, asustado, por un túnel de universos (esto tapa la carga del mapa);
     3) otro portal lo traga y, en el mapa nuevo, cae de un portal del cielo de cara al suelo, se queda tendido, se levanta y recupera el control.
   Solo se ve con la vista privada (CF_BETA): el público sigue con la ciudad de siempre. Solo contra bots / práctica (en salas online todavía no).
   Este archivo se ejecuta dentro de game.js: usa sus funciones directamente (G, scene, STAGE, animate, ...). El tiempo entre cambios se puede
   ajustar con localStorage 'bsb_map_rot' (segundos, mínimo 20). */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    let EVERY = 300; try { const v = +localStorage.getItem('bsb_map_rot'); if (v >= 20) EVERY = v; } catch (e) { }
    const ORDER = ['A', 'J', 'B'];
    const TIPS = {
      A: ['En la ciudad hay un ascensor en la Torre Aurora.', 'Cuidado con el mar profundo: el Kraken despierta de vez en cuando.', 'La plaza central tiene una fuente y farolillos colgantes.', 'Desde la azotea de la Torre Aurora se ve toda la ciudad.'],
      J: ['La selva esconde una pirámide: sube hasta la cima.', 'Los ríos y la laguna se nadan: ¡bucea!', 'La casa del árbol tiene una escalera de caracol.', 'El cenote azul es muy profundo.'],
      B: ['El castillo del Dragón Blanco está sobre la colina.', 'Cruza los puentes rojos del Río Koi.', 'La niebla del zorro cubre el valle de vez en cuando.', 'El gran torii del mar se alcanza por una pasarela.']
    };
    // colores de cada universo: [oscuro, medio, brillante]
    const PAL = { A: ['#0b2a73', '#2fb6ff', '#ffd36b'], J: ['#04301c', '#27e08a', '#e2ff70'], B: ['#3a0f4f', '#ff74c4', '#ffe3f4'] };
    const R = { t: 0, warned: -1, ev: null, evT: 70, chipT: 0, off: false };
    const S = { seq: 0, doneSeq: 0, last: null, lastChange: 0, wasCoord: false };   // sincronización en salas: el coordinador manda, los demás obedecen
    const T = { phase: '', t: 0, from: 'A', rem: [], to: 'B', list: [], fx: null, swapped: false, spawns: null, exitP: null, saved: null, extras: [], fov: 0 };
    const col3 = id => new THREE.Color(MAPS[id].col);
    const pal = (id, i) => new THREE.Color(PAL[id][i]);
    const easeBack = k => { k = clamp(k, 0, 1); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

    // ---------- interfaz ----------
    const css = document.createElement('style');
    css.textContent = '#mviaje{position:fixed;inset:0;z-index:70;pointer-events:none;display:none;font-family:"Chakra Petch",system-ui,sans-serif;color:#fff}#mviaje.on{display:block}'
      + '#mviaje .vg{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,.72) 100%)}'
      + '#mviaje .tt{position:absolute;left:0;right:0;top:9vh;text-align:center;animation:mvIn .7s cubic-bezier(.2,1.2,.4,1) both}'
      + '#mviaje small{display:block;letter-spacing:.42em;font-size:13px;opacity:.85;font-weight:600}'
      + '#mviaje h1{font-size:clamp(28px,5.4vw,60px);margin:.18em 0 .05em;font-weight:700;letter-spacing:.06em;text-shadow:0 0 28px var(--mc),0 3px 0 rgba(0,0,0,.45)}'
      + '#mviaje p{margin:0;font-size:15px;opacity:.85}'
      + '#mviaje .dots{display:flex;justify-content:center;gap:10px;margin-top:12px}#mviaje .dots i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.28)}#mviaje .dots i.on{background:var(--mc);box-shadow:0 0 12px var(--mc)}'
      + '#mviaje .bar{position:absolute;left:50%;bottom:12vh;width:min(440px,72vw);height:8px;transform:translateX(-50%);background:rgba(255,255,255,.18);border-radius:6px;overflow:hidden}'
      + '#mviaje .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#fff,var(--mc));box-shadow:0 0 16px var(--mc)}'
      + '#mviaje .ld{position:absolute;left:0;right:0;bottom:15.2vh;text-align:center;font-size:12px;letter-spacing:.3em;opacity:.8}'
      + '#mviaje .tip{position:absolute;left:0;right:0;bottom:6.5vh;text-align:center;font-size:14px;opacity:.82;padding:0 24px}'
      + '@keyframes mvIn{from{opacity:0;transform:translateY(-18px) scale(.94)}}'
      + '#mflash{position:fixed;inset:0;z-index:71;background:#fff;opacity:0;pointer-events:none}'
      + '#mwarp{position:fixed;inset:0;z-index:69;pointer-events:none;opacity:0;overflow:hidden;mix-blend-mode:screen}'
      + '#mwarp::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 12%,var(--mc,#fff) 130%)}'
      + '#mwarp::after{content:"";position:absolute;inset:-30%;background:conic-gradient(from 0deg,transparent,var(--mc,#fff),transparent 22%,rgba(255,255,255,.5),transparent 48%,var(--mc,#fff),transparent 74%);opacity:.6;animation:mwspin 1.3s linear infinite;-webkit-mask:radial-gradient(circle,transparent 16%,#000 78%);mask:radial-gradient(circle,transparent 16%,#000 78%)}'
      + '@keyframes mwspin{to{transform:rotate(360deg)}}'
      + '#mchip{position:fixed;left:50%;top:38px;transform:translateX(-50%);z-index:30;display:none;pointer-events:none;padding:4px 14px;border-radius:999px;background:rgba(10,16,26,.62);border:1px solid var(--mc,#fff);color:#fff;font:600 12px "Chakra Petch",system-ui,sans-serif;letter-spacing:.08em;white-space:nowrap}'
      + '#mchip.on{display:block}#mchip.hot{animation:mchot .6s ease-in-out infinite alternate}@keyframes mchot{to{background:rgba(120,30,40,.8)}}';
    document.head.appendChild(css);
    const V = document.createElement('div'); V.id = 'mviaje';
    V.innerHTML = '<div class="vg"></div><div class="tt"><small>VIAJANDO A</small><h1></h1><p></p><div class="dots"><i></i><i></i><i></i></div></div><div class="ld">CARGANDO EL MAPA</div><div class="bar"><i></i></div><div class="tip"></div>';
    document.body.appendChild(V);
    const FL = document.createElement('div'); FL.id = 'mflash'; document.body.appendChild(FL);
    const WP = document.createElement('div'); WP.id = 'mwarp'; document.body.appendChild(WP);
    const CH = document.createElement('div'); CH.id = 'mchip'; document.body.appendChild(CH);
    const flash = (ms = 420, col = '#fff') => { FL.style.background = col; FL.style.transition = 'none'; FL.style.opacity = '1'; void FL.offsetWidth; FL.style.transition = `opacity ${ms}ms ease-out`; FL.style.opacity = '0'; };
    const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const snd = (k, pos, v) => { try { sfx(k, pos || (G.player && G.player.pos), v == null ? .6 : v); } catch (e) { } };
    const warp = (k, id) => { WP.style.setProperty('--mc', MAPS[id || T.to].col); WP.style.opacity = String(clamp(k, 0, 1)); };

    // ---------- portal del multiverso ----------
    const NOISE = 'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return v;}';
    const PV = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
    const PF = 'varying vec2 vUv;uniform float uTime;uniform vec3 uA,uB,uC;' + NOISE
      + 'void main(){vec2 p=(vUv-.5)*2.;float r=length(p);if(r>1.)discard;float ang=atan(p.y,p.x);'
      + 'float sw=ang+(1.-r)*7.5-uTime*1.7;vec2 q=vec2(cos(sw),sin(sw))*(r*2.1+.2);float n=fbm(q+vec2(uTime*.12,-uTime*.09));'
      + 'float arms=.5+.5*sin(sw*3.+n*7.);vec3 col=mix(uA,uB,n*1.3);col=mix(col,uC,arms*arms*(1.-r*.45));'
      + 'float core=smoothstep(.62,0.,r);col+=vec3(1.)*core*core*1.3;'
      + 'vec2 sq=q*9.+uTime*.35;float st=step(.972,hash(floor(sq)))*(.4+.6*hash(floor(sq)+3.));col+=vec3(1.)*st*(1.-r*.7)*1.6;'
      + 'vec3 ir=.5+.5*cos(6.2831*(ang/6.2831+uTime*.18+vec3(0.,.33,.67)));float rim=smoothstep(.66,1.,r);col+=mix(uC,ir,.6)*rim*1.8;'
      + 'gl_FragColor=vec4(col,smoothstep(1.,.84,r));}';
    function jagged(r0, out) {   // grietas de la realidad alrededor del portal
      const pts = [];
      for (let i = 0; i < 14; i++) { const a = Math.random() * TAU; let r = r0 * 1.12, ca = a; const n = 3 + (Math.random() * 3 | 0); for (let k = 0; k < n; k++) { const r2 = r + r0 * (.18 + Math.random() * .34), a2 = ca + (Math.random() - .5) * .35; pts.push(Math.cos(ca) * r, Math.sin(ca) * r, 0, Math.cos(a2) * r2, Math.sin(a2) * r2, 0); r = r2; ca = a2; if (r > r0 * out) break; } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
    }
    function makePortal(id, r0 = 1.6) {
      const g = new THREE.Group(), add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false };
      const mat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: Math.random() * 10 }, uA: { value: pal(id, 0) }, uB: { value: pal(id, 1) }, uC: { value: pal(id, 2) } }, vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(r0, 64), mat);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r0 * 1.02, .07, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(r0 * 1.14, .03, 6, 64), new THREE.MeshBasicMaterial({ color: pal(id, 2), opacity: .9, ...add }));
      const ring3 = new THREE.Mesh(new THREE.TorusGeometry(r0 * 1.3, .02, 6, 64), new THREE.MeshBasicMaterial({ color: pal(id, 1), opacity: .7, ...add }));
      const beads = new THREE.Group(), bg = new THREE.OctahedronGeometry(.08 * r0 / 1.6 + .03, 0);
      for (let i = 0; i < 28; i++) { const m = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(i / 28, .8, .7), fog: false })); const a = i / 28 * TAU; m.position.set(Math.cos(a) * r0 * 1.22, Math.sin(a) * r0 * 1.22, 0); m.userData.a = a; beads.add(m); }
      const shock = new THREE.Mesh(new THREE.RingGeometry(r0, r0 * 1.05, 64), new THREE.MeshBasicMaterial({ color: pal(id, 2), opacity: .7, ...add }));
      const cracks = new THREE.LineSegments(jagged(r0, 2.6), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      g.add(disc, ring, ring2, ring3, beads, shock, cracks); g.userData = { mat, ring2, ring3, beads, shock, cracks, t: Math.random() * 6, r0 }; g.scale.setScalar(.001); g.renderOrder = 5; return g;
    }
    function portalTick(g, dt, open) {
      const u = g.userData; u.t += dt; u.mat.uniforms.uTime.value += dt;
      u.beads.rotation.z += dt * 1.1; u.ring2.rotation.z -= dt * 1.7; u.ring3.rotation.z += dt * .8;
      u.beads.children.forEach((m, i) => { m.scale.setScalar(.8 + .5 * Math.sin(u.t * 4 + i)); m.material.color.setHSL((i / 28 + u.t * .12) % 1, .8, .7); });
      const k = (u.t * .8) % 1; u.shock.scale.setScalar(1 + k * .85); u.shock.material.opacity = .7 * (1 - k) * (1 - k);
      u.cracks.material.opacity = (.35 + .65 * Math.random()) * Math.min(1, open);
      g.scale.setScalar(Math.max(.001, open));
    }
    function killPortal(p) { if (!p) return; if (p.parent) p.parent.remove(p); p.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    const fighters = () => G.fighters.filter(f => f.alive && !f.dummy && !f.remote && f.model);
    function resetModel(f) { const m = f.model.root; m.scale.setScalar(1); m.rotation.x = 0; m.rotation.z = 0; }
    const rainbow = (i, n) => new THREE.Color().setHSL((i / n) % 1, .85, .65);

    // ---------- 1) absorción ----------
    function begin(to) {
      if (TRAVEL.on || !G.player || !G.player.alive || G.over || to === MAPCUR.id) return false;
      TRAVEL.on = TRAVEL.freeze = TRAVEL.lock = true; T.phase = 'absorb'; T.t = 0; T.from = MAPCUR.id; T.to = to; T.swapped = false; T.list = []; T.spawns = null; T.extras = [];
      $('hud').style.visibility = 'hidden'; CH.classList.remove('on', 'hot');
      for (const f of fighters()) {
        if (f.action) endAction(f); f.blocking = false; f.vel.set(0, 0, 0); f.iframes = 99; f.onGround = true;
        const Fv = fwd(f.yaw), c = new V3(f.pos.x + Fv.x * 3.5, f.pos.y + 1.5, f.pos.z + Fv.z * 3.5);
        const p = makePortal(to, f.isPlayer ? 1.8 : 1.2); p.position.copy(c); p.rotation.y = f.yaw + Math.PI; scene.add(p);
        T.list.push({ f, p, c, p0: f.pos.clone(), delay: f.isPlayer ? 0 : Math.random() * .5 });
      }
      T.rem = [];
      if (G.mp) for (const f of G.fighters) if (f.remote && f.model && !f.otherMap && f.alive) {   // los demás jugadores también se ven absorbidos por su portal
        const Fv = fwd(f.yaw), c = new V3(f.pos.x + Fv.x * 3.5, f.pos.y + 1.5, f.pos.z + Fv.z * 3.5), p = makePortal(to, 1.5); p.position.copy(c); p.rotation.y = f.yaw + Math.PI; scene.add(p); T.rem.push({ f, p, c, y0: f.yaw });
      }
      snd('ult', G.player.pos, .5);
      showBanner('PORTAL DEL MULTIVERSO', MAPS[to].col, 'Viajando a ' + MAPS[to].short);
      return true;
    }
    function absorbTick(dt) {
      T.t += dt;
      for (const e of T.list) {
        const t = T.t - e.delay; if (t < 0) continue;
        const f = e.f, open = easeBack(t / .7) * (t > 2.1 ? clamp(1 - (t - 2.1) / .3, 0, 1) : 1);
        portalTick(e.p, dt, open);
        if (t > .5) {
          const s = clamp((t - .5) / 1.6, 0, 1), k = s * s * (1.5 - .5 * s);
          f.pos.set(e.p0.x + (e.c.x - e.p0.x) * k, e.p0.y + (e.c.y - 1 - e.p0.y) * k, e.p0.z + (e.c.z - e.p0.z) * k);
          f.onGround = false; f.ragdoll = Math.max(f.ragdoll, .3); if (!e.rag) { e.rag = 1; startRagdoll(f, 5); }
          animate(f, dt); const m = f.model.root; m.scale.setScalar(Math.max(.05, 1 - k * .95)); m.rotation.z = t * 7 * (1 + k * 3); m.rotation.x = Math.sin(t * 9) * .4 * k;
        } else animate(f, dt);
        if (Math.random() < dt * 90) {   // polvo estelar que gira hacia el portal, con los colores del universo
          const a = rand(0, TAU), r = rand(.5, 2.4) * Math.min(1, open), Rv = rightOf(f.yaw), p = new V3(e.c.x + Rv.x * Math.cos(a) * r, e.c.y + Math.sin(a) * r, e.c.z + Rv.z * Math.cos(a) * r);
          const cc = Math.random() < .3 ? '#ffffff' : '#' + pal(T.to, 1 + (Math.random() < .5 ? 1 : 0)).getHexString();
          emit(p.x, p.y, p.z, (e.c.x - p.x) * 1.8 + (e.c.z - p.z) * .8, (e.c.y - p.y) * 1.8, (e.c.z - p.z) * 1.8 - (e.c.x - p.x) * .8, cc, rand(.07, .17), .6, 0, 1);
        }
      }
      for (const e of T.rem) {   // visual de los demás: su posición la manda su propio juego; aquí solo se dibuja su portal y se encoge
        const t = T.t, open = easeBack(t / .7) * (t > 2.1 ? clamp(1 - (t - 2.1) / .3, 0, 1) : 1); portalTick(e.p, dt, open);
        if (e.f.model && t > .5) { const k = Math.pow(clamp((t - .5) / 1.6, 0, 1), 2), m = e.f.model.root; m.scale.setScalar(Math.max(.05, 1 - k * .94)); m.rotation.z = t * 7 * (1 + k * 3); }
      }
      warp(clamp((T.t - 1.1) / 1.3, 0, 1) * .8);
      PS.update(dt);
      if (T.t > 2.65) startTunnel();
    }

    // ---------- 2) túnel de universos ----------
    const TUNNEL_MIN = 5.2, EXIT_AT = 3.4;
    const SKY_F = 'varying vec3 vP;uniform float uTime;uniform vec3 uK0,uK1,uK2;' + NOISE
      + 'float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}'
      + 'void main(){vec3 d=normalize(vP);float n=fbm(d.xy*2.6+d.z*1.9+vec2(uTime*.05,-uTime*.04));float n2=fbm(d.zy*3.+vec2(-uTime*.06,uTime*.03)+5.);'
      + 'float ph=uTime*.16;float w0=.5+.5*sin(ph),w1=.5+.5*sin(ph+2.094),w2=.5+.5*sin(ph+4.188);vec3 c=(uK0*w0+uK1*w1+uK2*w2)/(w0+w1+w2+.001);'
      + 'vec3 col=c*(n*1.25+n2*.5)*.9+vec3(.015,.01,.03);vec3 g=floor(d*70.);float st=step(.994,h3(g));col+=vec3(1.)*st*(.5+.5*sin(uTime*3.+h3(g+1.)*20.))*1.4;gl_FragColor=vec4(col,1.);}';
    const BUB_V = 'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}';
    const BUB_F = 'varying vec3 vN;varying vec3 vV;uniform float uTime;void main(){float f=pow(1.-abs(dot(vN,vV)),2.2);vec3 col=.5+.5*cos(6.2831*(f*1.3+uTime*.15+vec3(0.,.33,.67)));gl_FragColor=vec4(col*f*1.7,f*.95);}';
    function makeBubble(id, r) {   // una burbuja iridiscente con un mundo en miniatura dentro
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(r * .52, 20, 14), new THREE.MeshBasicMaterial({ color: pal(id, 1) })));
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(r * .56, 16, 12), new THREE.MeshBasicMaterial({ color: pal(id, 2), transparent: true, opacity: .35, depthWrite: false })); g.add(cloud);
      const rg = new THREE.Mesh(new THREE.TorusGeometry(r * .85, r * .03, 6, 48), new THREE.MeshBasicMaterial({ color: pal(id, 2) })); rg.rotation.x = 1.2; rg.rotation.y = .4; g.add(rg);
      const sh = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), new THREE.ShaderMaterial({ uniforms: { uTime: { value: Math.random() * 9 } }, vertexShader: BUB_V, fragmentShader: BUB_F, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      g.add(sh); g.userData = { sh, cloud, rg }; return g;
    }
    function makeTunnelFx() {
      const g = new THREE.Group(), ids = ['A', 'J', 'B'];
      const sky = new THREE.Mesh(new THREE.SphereGeometry(56, 32, 20), new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uK0: { value: pal('A', 1) }, uK1: { value: pal('J', 1) }, uK2: { value: pal('B', 1) } }, vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false, fog: false }));
      sky.renderOrder = -10; g.add(sky);
      const mats = ids.map(id => new THREE.MeshBasicMaterial({ color: pal(id, 1), transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      const geo = new THREE.BoxGeometry(.05, .05, 5), streaks = [];
      const place = (m, far) => { const a = rand(0, TAU), r = rand(1.8, 8); m.position.set(Math.cos(a) * r, 1 + Math.sin(a) * r * .8, far ? rand(-80, 12) : -80); m.scale.z = rand(.6, 2.4); m.userData.v = rand(36, 78); };
      for (let i = 0; i < 120; i++) { const m = new THREE.Mesh(geo, mats[i % 3]); place(m, true); g.add(m); streaks.push(m); }
      const rg = new THREE.TorusGeometry(6.4, .06, 6, 56), rings = [];
      for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: pal(ids[i % 3], 2), transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.position.set(0, 1, -i * 10); g.add(m); rings.push(m); }
      const bubbles = [];   // universos que pasan flotando
      const bp = (b, far) => { const a = rand(0, TAU), r = rand(4, 9); b.position.set(Math.cos(a) * r, 1 + Math.sin(a) * r * .7, far ? rand(-85, 8) : -85); b.userData.v = rand(14, 24); b.userData.s = rand(-.6, .6); };
      for (let i = 0; i < 9; i++) { const b = makeBubble(ids[i % 3], rand(1.2, 2.6)); bp(b, true); g.add(b); bubbles.push(b); }
      const minis = [];     // portales pequeños que pasan
      for (let i = 0; i < 5; i++) { const p = makePortal(ids[(i + 1) % 3], rand(.9, 1.5)); p.scale.setScalar(1); const a = rand(0, TAU), r = rand(5, 9); p.position.set(Math.cos(a) * r, 1 + Math.sin(a) * r * .7, rand(-85, 8)); p.rotation.y = rand(-.8, .8); p.userData.v = rand(18, 30); g.add(p); minis.push(p); }
      g.userData = { sky, streaks, rings, bubbles, minis, place, bp }; return g;
    }
    function startTunnel() {
      T.phase = 'tunnel'; T.t = 0; flash(420, '#' + pal(T.to, 2).getHexString()); warp(0);
      for (const e of T.list) { killPortal(e.p); e.p = null; resetModel(e.f); }
      for (const e of T.rem) { killPortal(e.p); if (e.f.model) resetModel(e.f); } T.rem = [];
      const P = G.player; T.saved = { pos: P.pos.clone(), yaw: P.yaw };
      P.pos.set(0, 3000, 0); P.yaw = 0; P.prevYaw = 0; P.vel.set(0, 0, 0); P.ragdoll = 999; P.onGround = false; P.rdPose = 0; P.rdDir = 1; P.getupT = 0;
      stageEnter(P);
      const c = col3(T.to); STAGE.skyMat.visible = false; STAGE.swirlMat.color.copy(c); STAGE.rim.color.copy(c); STAGE.scene.background.set(0x02010a); STAGE.scene.fog.color.copy(STAGE.scene.background);
      if (STAGE.floorMat) STAGE.floorMat.visible = false; STAGE.rings.concat(STAGE.halos).forEach(m => { m.visible = false; });
      T.fx = makeTunnelFx(); T.fx.position.copy(P.pos); STAGE.scene.add(T.fx);
      T.exitP = null; T.exitT = -1;
      const o = V; o.style.setProperty('--mc', MAPS[T.to].col); o.querySelector('h1').textContent = MAPS[T.to].short; o.querySelector('p').textContent = MAPS[T.to].sub;
      o.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('on', ORDER[i] === T.to));
      o.querySelector('.tip').textContent = pick(TIPS[T.to]); o.querySelector('.bar i').style.width = '0%'; o.classList.add('on');
      snd('elev_ride', P.pos, .7);
    }
    function tunnelTick(dt) {
      T.t += dt; const P = G.player;
      if (!T.swapped && T.t > .9) doSwap();
      V.querySelector('.bar i').style.width = (clamp(T.t / (TUNNEL_MIN - .4), 0, 1) * 100) + '%';
      // el personaje flota asustado: brazos y piernas sueltos, voltereta lenta
      T.rag = (T.rag || 0) - dt; if (T.rag <= 0) { T.rag = .33; startRagdoll(P, 5); P.rdPose = 0; }
      P.ragdoll = Math.max(P.ragdoll, 3); P.onGround = false;
      let k = 0;
      if (T.t > EXIT_AT && T.swapped) {   // otro portal lo traga
        if (!T.exitP) { T.exitP = makePortal(T.to, 4); T.exitP.position.set(0, 3000 + 1.1, -19); STAGE.scene.add(T.exitP); T.exitT = T.t; snd('ult', P.pos, .5); }
        const u = clamp((T.t - T.exitT) / 1.8, 0, 1); k = u * u; portalTick(T.exitP, dt, easeBack((T.t - T.exitT) / .8));
      }
      P.pos.set(0, 3000 + Math.sin(T.t * 2) * .12, -18 * k);
      animate(P, dt);
      const m = P.model.root; m.rotation.x = Math.sin(T.t * 1.4) * .5; m.rotation.z = T.t * 1.1 + k * 9; m.scale.setScalar(Math.max(.08, 1 - k * .92));
      updateStage(dt);
      const u2 = T.fx.userData; u2.sky.material.uniforms.uTime.value += dt;
      for (const s of u2.streaks) { s.position.z += s.userData.v * dt; if (s.position.z > 14) u2.place(s, false); }
      u2.rings.forEach((r, i) => { r.position.z += 30 * dt; if (r.position.z > 12) r.position.z -= 90; r.rotation.z += dt; });
      for (const b of u2.bubbles) { b.position.z += b.userData.v * dt; b.rotation.y += b.userData.s * dt; b.userData.sh.material.uniforms.uTime.value += dt; b.userData.rg.rotation.z += dt; if (b.position.z > 14) u2.bp(b, false); }
      for (const p of u2.minis) { p.position.z += p.userData.v * dt; portalTick(p, dt, 1); if (p.position.z > 14) { p.position.z = -85; const a = rand(0, TAU), r = rand(5, 9); p.position.x = Math.cos(a) * r; p.position.y = 1 + Math.sin(a) * r * .7; } }
      if (Math.random() < dt * 60) STAGE.parts.emit(P.pos.x + rand(-2, 2), P.pos.y + rand(-.5, 2.5), P.pos.z + rand(2, 8), 0, 0, -rand(20, 40), '#' + rainbow(Math.random() * 3, 3).getHexString(), rand(.05, .11), .6, 0, .5);
      if (T.t > TUNNEL_MIN && T.swapped && k >= 1) startArrive();
    }
    function tunnelCam(dt) {
      const P = G.player, t = T.t, chase = T.exitP ? clamp((T.t - T.exitT) / 1.8, 0, 1) : 0;
      camera.position.set(P.pos.x + Math.sin(t * .6) * 1.2, P.pos.y + 1.55 + Math.sin(t * .9) * .22, P.pos.z + 4.7 - chase * 1.4);
      camera.lookAt(P.pos.x, P.pos.y + .75 - chase * .2, P.pos.z - .8); camera.rotation.z += Math.sin(t * 1.9) * .05;
    }
    function camFx(dt) {   // el campo de visión se estira al entrar al portal y al viajar
      let extra = 0;
      if (T.phase === 'absorb') extra = Math.pow(clamp((T.t - .4) / 2, 0, 1), 2) * 42;
      else if (T.phase === 'tunnel') extra = 22 + 7 * Math.sin(T.t * 3.2) + (T.exitP ? 16 * clamp((T.t - T.exitT) / 1.8, 0, 1) : 0);
      else if (T.phase === 'arrive') extra = 34 * Math.pow(1 - clamp(T.t / 1.8, 0, 1), 2);
      if (extra > .01) { camera.fov = (cam.fov || 70) + extra; camera.updateProjectionMatrix(); }
    }

    // ---------- cambio de mapa (detrás de la pantalla de viaje) ----------
    function doSwap() {
      T.swapped = true; setMapNow(T.to); S.lastChange = performance.now();
      atmosphereCommand({ mode: 'auto', hour: MAPS[T.to].hour, cycle: true });
      R.ev = null; R.evT = 55 + Math.random() * 40;
      const taken = [], free = spawnsNow().filter(p => groundAt(p.x, p.z) <= .1); T.spawns = new Map();
      for (const e of T.list) {
        let best = null, bs = -1; const pool = free.length ? free : spawnsNow();
        for (const p of pool) { let d = 999; for (const q of taken) d = Math.min(d, Math.hypot(p.x - q.x, p.z - q.z)); d += Math.random() * 6; if (d > bs) { bs = d; best = p; } }
        taken.push(best); T.spawns.set(e.f, best);
      }
    }

    // ---------- 3) llegada: cae de un portal del cielo ----------
    const beamMat = id => new THREE.ShaderMaterial({ uniforms: { uC: { value: pal(id, 1) }, uK: { value: 1 } }, vertexShader: 'varying float vY;void main(){vY=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying float vY;uniform vec3 uC;uniform float uK;void main(){gl_FragColor=vec4(uC*1.6,(1.-vY)*.55*uK+.0);}', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    function extra(mesh, dur, upd) { scene.add(mesh); T.extras.push({ mesh, t: 0, dur, upd }); }
    function startArrive() {
      T.phase = 'arrive'; T.t = 0; stageExit();
      STAGE.skyMat.visible = true; if (STAGE.floorMat) STAGE.floorMat.visible = true; STAGE.rings.concat(STAGE.halos).forEach(m => { m.visible = true; });
      if (T.fx) { STAGE.scene.remove(T.fx); T.fx = null; } killPortal(T.exitP); T.exitP = null; V.classList.remove('on'); flash(800, '#' + pal(T.to, 2).getHexString());
      for (const e of T.list) {
        const f = e.f, sp = T.spawns.get(f), gy = groundAt(sp.x, sp.z), H = 15 + (f.isPlayer ? 0 : Math.random() * 3);
        resetModel(f); f.pos.set(sp.x, gy + H, sp.z); f.yaw = f.prevYaw = sp.yaw; f.vel.set(0, -4, 0); f.onGround = false;
        f.action = null; f.stun = 0; f.getupT = 0; f.hurtT = 0; f.iframes = 9; f.rdDir = 1; startRagdoll(f, 3); f.ragdoll = 3; f.rdPose = 1;
        const p = makePortal(T.to, f.isPlayer ? 2 : 1.3); p.rotation.x = -Math.PI / 2; p.position.set(sp.x, f.pos.y + 1.6, sp.z); scene.add(p); e.p = p; e.land = false; e.up = false; e.gy = gy;
        const bm = beamMat(T.to), beam = new THREE.Mesh(new THREE.CylinderGeometry(f.isPlayer ? 1.7 : 1.1, f.isPlayer ? 1.7 : 1.1, H + 2, 28, 1, true), bm);   // columna de luz del portal al suelo
        beam.position.set(sp.x, gy + (H + 2) / 2 - .2, sp.z); extra(beam, 3.2, (m, k) => { bm.uniforms.uK.value = k < .55 ? 1 : Math.max(0, 1 - (k - .55) / .45); });
        if (f.ai) { f.ai.cityPath = null; f.ai.cityThink = 0; }
      }
      const P = G.player; cam.yaw = P.yaw; cam.pitch = .02; TRAVEL.freeze = false;   // desde aquí corre la física: cae de verdad
      snd('chime', P.pos, .8);
    }
    function shockwave(x, y, z, id, big) {
      const mat = new THREE.MeshBasicMaterial({ color: pal(id, 2), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      const m = new THREE.Mesh(new THREE.RingGeometry(.35, .6, 56), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y + .08, z);
      extra(m, .95, (mm, k) => { const s = 1 + k * (big ? 16 : 9); mm.scale.set(s, s, 1); mat.opacity = .9 * (1 - k) * (1 - k); });
    }
    function arriveTick(dt) {
      T.t += dt; let done = true;
      for (const e of T.list) {
        const f = e.f; if (!f.alive) continue;
        if (e.p) {
          const open = easeBack(T.t / .55) * (T.t > 2.4 ? clamp(1 - (T.t - 2.4) / .4, 0, 1) : 1); portalTick(e.p, dt, open);
          if (open > .2 && Math.random() < dt * 60) { const a = rand(0, TAU), r = rand(.4, 1.9); emit(e.p.position.x + Math.cos(a) * r, e.p.position.y, e.p.position.z + Math.sin(a) * r, 0, rand(-4, -1.5), 0, '#' + rainbow(Math.random() * 3, 3).getHexString(), rand(.07, .16), .8, 0, 1); }
          if (T.t > 2.8) { killPortal(e.p); e.p = null; }
        }
        if (!e.land) { f.ragdoll = Math.max(f.ragdoll, .4); f.rdPose = 1; if (Math.random() < dt * 40) emit(f.pos.x + rand(-.4, .4), f.pos.y + rand(.2, 1.6), f.pos.z + rand(-.4, .4), 0, rand(3, 7), 0, '#' + pal(T.to, 2).getHexString(), .1, .5, 0, 1);   // estela de luz al caer
          if (f.onGround) { e.land = true; startRagdoll(f, .9); f.ragdoll = .9; f.rdPose = 1; f.vel.set(0, 0, 0); burst(new V3(f.pos.x, f.pos.y + .2, f.pos.z), 30, '#' + pal(T.to, 2).getHexString(), 8, .2, .8, -.3); shockwave(f.pos.x, e.gy, f.pos.z, T.to, f.isPlayer); if (f.isPlayer) { G.shake = .6; snd('heavy', f.pos, .9); } } }
        else if (!e.up && f.ragdoll <= 0) { e.up = true; f.getupT = .55; }   // se levanta (animación 'levantarse')
        if (f.isPlayer && !(e.up && f.getupT <= 0)) done = false;
      }
      for (let i = T.extras.length - 1; i >= 0; i--) { const x = T.extras[i]; x.t += dt; const k = x.t / x.dur; if (k >= 1) { killPortal(x.mesh); T.extras.splice(i, 1); } else x.upd(x.mesh, k); }
      if (done || T.t > 7) finish();
    }
    function clearExtras() { for (const x of T.extras) killPortal(x.mesh); T.extras = []; }

    // ---------- fin ----------
    function finish() {
      for (const e of T.list) { killPortal(e.p); e.p = null; if (e.f.model) resetModel(e.f); if (e.f.alive) e.f.iframes = Math.max(e.f.iframes, 1.2); }
      T.list = []; T.phase = ''; TRAVEL.on = TRAVEL.freeze = TRAVEL.lock = false; $('hud').style.visibility = ''; R.t = 0; R.warned = -1; warp(0);
      showBanner(MAPS[MAPCUR.id].short, MAPS[MAPCUR.id].col, MAPS[MAPCUR.id].sub); addFeedText('Mapa nuevo: ' + MAPS[MAPCUR.id].name, MAPS[MAPCUR.id].col);
    }
    function abort() {
      for (const e of T.rem) { killPortal(e.p); if (e.f.model) resetModel(e.f); } T.rem = [];
      if (STAGE.on) stageExit(); STAGE.skyMat.visible = true; if (STAGE.floorMat) STAGE.floorMat.visible = true; STAGE.rings.concat(STAGE.halos).forEach(m => { m.visible = true; });
      if (T.fx) { STAGE.scene.remove(T.fx); T.fx = null; } killPortal(T.exitP); T.exitP = null; clearExtras();
      for (const e of T.list) { killPortal(e.p); if (e.f.model) resetModel(e.f); }
      T.list = []; T.phase = ''; TRAVEL.on = TRAVEL.freeze = TRAVEL.lock = false; V.classList.remove('on'); $('hud').style.visibility = ''; warp(0);
    }

    // ---------- eventos de cada mapa ----------
    const wx = mode => { try { atmosphereCommand({ mode }); } catch (e) { } };
    const back = () => atmosphereCommand({ mode: 'auto', hour: MAPS[MAPCUR.id].hour, cycle: true });
    const petals = dt => { const p = G.player.pos; for (let i = 0; i < 2; i++) if (Math.random() < dt * 14) emit(p.x + rand(-16, 16), p.y + rand(7, 13), p.z + rand(-16, 16), rand(1, 3), rand(-1.7, -.9), rand(-1, 1), pick(['#f7b6cf', '#fbd0e0', '#f39dbd']), .13, 6, 0, 0); };
    const lanterns = dt => { const p = G.player.pos; if (Math.random() < dt * 12) emit(p.x + rand(-20, 20), p.y + rand(0, 2), p.z + rand(-20, 20), rand(-.3, .3), rand(1.2, 2.2), rand(-.3, .3), pick(['#ffd35c', '#ffb454', '#fff0b1']), .3, 9, 0, 1); };
    const fireflies = dt => { const p = G.player.pos; if (Math.random() < dt * 18) emit(p.x + rand(-18, 18), p.y + rand(.4, 3.5), p.z + rand(-18, 18), rand(-.5, .5), rand(-.2, .5), rand(-.5, .5), pick(['#d8ff6a', '#9dffb0', '#fff7a0']), .2, 6, 0, 1); };
    const EVTS = {
      A: [{ id: 'aguacero', n: 'Aguacero', m: 'Un aguacero cae sobre la ciudad.', col: '#7ad7ff', dur: 50, on() { wx('rain'); }, off: back },
          { id: 'doradas', n: 'Hora dorada', m: 'La ciudad se baña de luz dorada.', col: '#ffd35c', dur: 50, on() { atmosphereCommand({ hour: 18.6, cycle: false }); }, off: back }],
      J: [{ id: 'tormenta', n: 'Tormenta tropical', m: 'Se acerca una tormenta tropical: truenos y lluvia fuerte.', col: '#7ad7ff', dur: 60, on() { wx('storm'); }, off: back },
          { id: 'neblina', n: 'Niebla de la selva', m: 'La niebla cubre la selva: verás poco a lo lejos.', col: '#bfe8d0', dur: 55, on() { wx('densefog'); }, off: back },
          { id: 'luciernagas', n: 'Noche de luciérnagas', m: 'Cae la noche y la selva se llena de luciérnagas.', col: '#d8ff6a', dur: 55, on() { atmosphereCommand({ hour: 21, cycle: false }); }, tick: fireflies, off: back }],
      B: [{ id: 'petalos', n: 'Lluvia de pétalos', m: 'Los cerezos sueltan una lluvia de pétalos.', col: '#f7b6cf', dur: 45, on() { wx('wind'); }, tick: petals, off: back },
          { id: 'niebla', n: 'Niebla del zorro', m: 'La niebla del zorro cubre el valle.', col: '#cfd8ff', dur: 50, on() { wx('densefog'); }, off: back },
          { id: 'festival', n: 'Festival de farolillos', m: 'Cae la noche y miles de farolillos suben al cielo.', col: '#ffd35c', dur: 55, on() { atmosphereCommand({ hour: 20.2, cycle: false }); }, tick: lanterns, off: back }]
    };
    function eventsTick(dt) {
      if (G.mp && !amCoord()) { if (R.ev) { R.ev.t -= dt; if (R.ev.e.tick) R.ev.e.tick(dt); } return; }   // en sala los eventos los lleva el coordinador
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
      CH.textContent = MAPS[MAPCUR.id].short + (R.ev ? '  ·  ' + R.ev.e.n.toUpperCase() : '') + (R.off ? '  ·  PORTAL PAUSADO' : '  ·  PORTAL EN ' + fmt(rem)); CH.classList.toggle('hot', !R.off && rem <= 10);
    }
    function tick(dt) {
      if (!worldBig()) { if (TRAVEL.on) abort(); if (MAPCUR.id !== 'A') setMapNow('A'); CH.classList.remove('on'); return; }
      if (G.state !== 'play') { if (TRAVEL.on) abort(); CH.classList.remove('on'); return; }
      if (TRAVEL.on) {
        if (G.over) { abort(); return; }
        if (T.phase === 'absorb') absorbTick(dt); else if (T.phase === 'tunnel') tunnelTick(dt); else if (T.phase === 'arrive') arriveTick(dt);
        return;
      }
      if (G.paused || G.over || G.cine) { updateChip(0); return; }
      const coord = !G.mp || amCoord();
      if (G.mp) {   // el que pasa a ser coordinador sigue el reloj que llevaba el anterior
        if (coord && !S.wasCoord) { S.wasCoord = true; if (S.last) R.t = EVERY - (+S.last.i || 0) / 1000; S.seq = Math.max(S.seq, S.doneSeq); } else if (!coord) S.wasCoord = false;
      }
      if (!coord) { R.t += dt; eventsTick(dt); updateChip(dt); return; }   // los demás esperan las órdenes del coordinador (netIn)
      if (!R.off) R.t += dt; eventsTick(dt); updateChip(dt);
      const rem = EVERY - R.t, sec = Math.ceil(rem);
      if (!R.off && rem <= 10 && sec !== R.warned && sec > 0) { R.warned = sec; if (sec === 10) showBanner('PORTAL EN 10 s', MAPS[MAPCUR.id].col, 'El mapa está a punto de cambiar'); else snd('chime', G.player && G.player.pos, .35); }
      if (!R.off && R.t >= EVERY && G.player && G.player.alive) { if (G.mp) S.seq++; begin(ORDER[(ORDER.indexOf(MAPCUR.id) + 1) % ORDER.length]); }
    }
    function reset() { if (TRAVEL.on) abort(); R.t = 0; R.warned = -1; R.ev = null; R.evT = 70; S.doneSeq = 0; S.last = null; S.wasCoord = false; }
    // ---------- sala: lo que el coordinador manda y lo que los demás reciben ----------
    const nextOf = id => ORDER[(ORDER.indexOf(id) + 1) % ORDER.length];
    function netOut() {
      if (!G.mp || !amCoord()) return {};
      const o = { ms: { s: S.seq, c: TRAVEL.on ? T.to : MAPCUR.id, t: TRAVEL.on ? T.to : nextOf(MAPCUR.id), i: TRAVEL.on ? 0 : Math.max(0, Math.round((EVERY - R.t) * 1000)), p: R.off ? 1 : 0 } };
      if (R.ev) o.ev = { id: R.ev.e.id, l: Math.round(R.ev.t) };
      const se = []; for (const k in SEA.ev) if (SEA.ev[k] > 0 && k !== 'squid') se.push(k); if (se.length) o.se = se;
      return o;
    }
    function adopt(id) {   // recién entrado a una sala: se pone en el mapa de la sala sin animación
      if (!G.player || G.state !== 'play') return false;
      setMapNow(id); S.lastChange = performance.now(); respawn(G.player); G.player.iframes = 2; return true;
    }
    function syncEvents(ev, se) {
      if (ev && ev.id) {
        if (!R.ev || R.ev.e.id !== ev.id) { const e = (EVTS[MAPCUR.id] || []).find(q => q.id === ev.id); if (e) { if (R.ev) R.ev.e.off(); R.ev = { e, t: +ev.l || 30 }; e.on(); showBanner(e.n.toUpperCase(), e.col, e.m); addFeedText(e.m, e.col); } }
        else R.ev.t = +ev.l || R.ev.t;
      } else if (R.ev) { R.ev.e.off(); R.ev = null; }
      if (Array.isArray(se)) for (const k of se) if (typeof k === 'string' && SEA_EVENTS[k] && k !== 'squid' && !(SEA.ev[k] > 0)) { try { triggerSeaEvent(k); } catch (e) { } }   // eventos del mar del coordinador
    }
    function netIn(peers) {
      if (!G.mp || !worldBig()) return;
      if (amCoord()) { S.last = null; return; }
      let ms = null, ev = null, se = null, best = -1;
      for (const pe of peers) { if (pe.sameTab) continue; const pr = pe.presence; if (pr && pr.ms && typeof pr.ms === 'object') { const ts = +pr.ts || 0; if (!ms || ts > best) { ms = pr.ms; ev = pr.ev; se = pr.se; best = ts; } } }
      S.last = ms; if (!ms || !ORDER.includes(ms.c) || !ORDER.includes(ms.t) || G.state !== 'play') return;
      R.off = !!ms.p;
      if (!S.doneSeq) { if (MAPCUR.id === ms.c || adopt(ms.c)) { S.doneSeq = ms.s; S.seq = ms.s; } }
      else if (ms.s > S.doneSeq) { S.doneSeq = ms.s; S.seq = ms.s; if (!TRAVEL.on && MAPCUR.id !== ms.t) begin(ms.t); }
      else if (!TRAVEL.on && ms.c !== MAPCUR.id && performance.now() - S.lastChange > 15000 && ms.i > 2000) begin(ms.c);   // se quedó en otro mapa: se pone al día
      if (!TRAVEL.on) R.t = EVERY - (+ms.i || 0) / 1000;
      syncEvents(ev, se);
    }
    window.CF_A_MAPAS = null;
    A.MAPAS = { netOut, netIn, inTunnel: () => T.phase === 'tunnel', tick, cam(dt) { if (T.phase === 'tunnel') tunnelCam(dt); camFx(dt); }, reset, begin(id) { if (G.mp) { if (!amCoord()) return false; S.seq++; } return begin(id); }, every(s) { EVERY = Math.max(20, +s || 300); R.t = 0; }, pause(v) { R.off = v == null ? !R.off : !!v; return R.off; }, ids: ORDER,
      next() { return this.begin(ORDER[(ORDER.indexOf(MAPCUR.id) + 1) % ORDER.length]); }, state: () => ({ phase: T.phase, t: T.t, map: MAPCUR.id, left: EVERY - R.t, paused: R.off, every: EVERY }) };
    window.CF_A_MAPAS = A.MAPAS;   // la consola del owner (js/owner.js) lo usa para lanzar el portal
  }
});
