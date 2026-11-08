/* ===== COSMÉTICOS (estilo anime / cine épico) =====
   Objetos que se ponen sobre el personaje: halo, cuernos, máscara, capa, katana, alas, hombreras, auras y ojos.
   - Botón 👑 arriba (junto a Panel, Guía y Emotes) abre el panel para equipar / quitar. Un cosmético por espacio (cabeza, cara, espalda, hombros, aura).
   - Se desbloquean con KILLS en salas públicas (las mismas kills de los emotes) o derrotando al jefe KRAKEN del abismo.
   - Los demás jugadores los ven (se mandan en la presencia de la sala).
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const T = THREE, PX16 = 1 / 16;
    const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
    const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
    const SLOTS = [['head', 'Cabeza'], ['face', 'Cara'], ['back', 'Espalda'], ['shoulders', 'Hombros'], ['aura', 'Aura']];
    const bm = (c, op = 1, add = false) => new T.MeshBasicMaterial({ color: c, transparent: op < 1 || add, opacity: op, depthWrite: !add, blending: add ? T.AdditiveBlending : T.NormalBlending, side: T.DoubleSide });
    const lm = c => new T.MeshLambertMaterial({ color: c, side: T.DoubleSide });
    const mk = (par, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const q = new T.Mesh(new T.BoxGeometry(w, h, d), m); q.position.set(x, y, z); if (rx || ry || rz) q.rotation.set(rx, ry, rz); par.add(q); return q; };

    // ---------------------------------------------------------------- catálogo: id, nombre, espacio, cómo se consigue (k = kills públicas, boss = n.º de victorias contra el Kraken)
    const CAT = [
      { id: 1, n: 'Halo dorado', ico: '😇', slot: 'head', k: 10, mk: 'halo' },
      { id: 2, n: 'Cuernos de Oni', ico: '👹', slot: 'head', k: 30, mk: 'oni' },
      { id: 3, n: 'Capa épica', ico: '🦸', slot: 'back', free: 1, mk: 'cape' },
      { id: 4, n: 'Katana a la espalda', ico: '🗡️', slot: 'back', k: 45, mk: 'katana' },
      { id: 5, n: 'Máscara Kitsune', ico: '🦊', slot: 'face', k: 60, mk: 'kitsune' },
      { id: 6, n: 'Hombreras de samurái', ico: '🛡️', slot: 'shoulders', k: 100, mk: 'shoulders' },
      { id: 7, n: 'Aura dorada', ico: '✨', slot: 'aura', k: 80, mk: 'aura', col: '#ffd54f' },
      { id: 8, n: 'Alas de ángel', ico: '🪽', slot: 'back', k: 150, mk: 'wings' },
      { id: 9, n: 'Ojos de energía', ico: '👁️', slot: 'face', free: 1, mk: 'eyes', col: 0x6fd8ff },
      { id: 10, n: 'Corona del Abismo', ico: '👑', slot: 'head', boss: 1, mk: 'crown' },
      { id: 11, n: 'Aura abisal', ico: '🌊', slot: 'aura', boss: 1, mk: 'aura', col: '#39e6ff', ring: true },
      { id: 12, n: 'Alas del Kraken', ico: '🐙', slot: 'back', boss: 2, mk: 'kwings' },
      { id: 13, n: 'Ojos del Kraken', ico: '🔴', slot: 'face', boss: 3, mk: 'eyes', col: 0xff3b30 },
      { id: 14, n: 'Hombreras del abismo', ico: '🔱', slot: 'shoulders', boss: 4, mk: 'shoulders', col: '#0b3a4a', trim: '#39e6ff' },
    ];
    const byId = id => CAT.find(c => c.id === id);

    // ---------------------------------------------------------------- estado
    let eq = rd('bsb_cos_eq', {}); if (!eq || typeof eq !== 'object') eq = {};
    const bossKills = () => Math.max(0, rd('bsb_boss_kills', 0) | 0);
    const pubKills = () => (window.CF_EMOTES ? CF_EMOTES.kills : 0);
    const isOwner = () => !!(SOC && SOC.owner);                          // el dueño tiene todo
    const loot = () => (window.CF_LOOT && Array.isArray(CF_LOOT.c) ? CF_LOOT : { e: [], c: [] });
    const owned = c => !!c && (isOwner() || c.free || (c.boss ? bossKills() >= c.boss : loot().c.includes(c.id)));
    const sane = () => { for (const [s] of SLOTS) { const c = byId(eq[s]); if (!c || c.slot !== s || !owned(c)) delete eq[s]; } };
    const idsOf = () => SLOTS.map(([s]) => eq[s]).filter(Boolean);
    const save = () => wr('bsb_cos_eq', eq);

    // ---------------------------------------------------------------- modelos 3D (unidades en bloques; 1 px = 1/16)
    let maskTex = null;
    function kitsuneTex() {
      if (maskTex) return maskTex; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#d6262c';
      g.beginPath(); g.moveTo(20, 18); g.lineTo(44, 50); g.lineTo(20, 52); g.fill(); g.beginPath(); g.moveTo(108, 18); g.lineTo(84, 50); g.lineTo(108, 52); g.fill();
      g.fillRect(58, 34, 12, 52); g.fillRect(40, 96, 48, 6); g.fillStyle = '#111'; g.fillRect(28, 56, 24, 7); g.fillRect(76, 56, 24, 7);
      maskTex = new T.CanvasTexture(c); maskTex.magFilter = T.NearestFilter; return maskTex;
    }
    const MAKERS = {
      halo(c) { const g = new T.Group(), a = new T.Mesh(new T.TorusGeometry(.36, .03, 8, 36), bm(0xffd54f, .95, true)), b = new T.Mesh(new T.TorusGeometry(.3, .018, 8, 30), bm(0xffffff, .7, true)); a.rotation.x = b.rotation.x = Math.PI / 2; b.position.y = -.02; g.add(a, b); g.position.set(0, .82, 0); g.userData.anim = (t) => { g.rotation.y = t * 1.2; g.position.y = .82 + Math.sin(t * 2) * .02; }; return g; },
      oni(c) { const g = new T.Group(), m = lm('#c4262e'), d = lm('#2a0f12'); for (const s of [-1, 1]) { const h = new T.Mesh(new T.ConeGeometry(.075, .34, 6), m); h.position.set(s * .2, .66, .05); h.rotation.z = -s * .35; g.add(h); mk(g, .12, .05, .12, d, s * .19, .52, .05); } return g; },
      crown(c) { const g = new T.Group(), gold = bm(0x39e6ff, .95, true), band = new T.Mesh(new T.TorusGeometry(.27, .035, 6, 24), bm(0xffd54f, .95, true)); band.rotation.x = Math.PI / 2; band.position.y = .56; g.add(band); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, s = new T.Mesh(new T.ConeGeometry(.045, .26 + (i % 2) * .1, 5), gold); s.position.set(Math.cos(a) * .27, .72, Math.sin(a) * .27); g.add(s); } g.userData.anim = (t) => { band.rotation.z = t * .6; }; return g; },
      kitsune(c) { const g = new T.Group(), m = new T.Mesh(new T.BoxGeometry(.5, .5, .04), new T.MeshBasicMaterial({ map: kitsuneTex() })); m.position.set(0, .25, .27); g.add(m); for (const s of [-1, 1]) { const e = new T.Mesh(new T.ConeGeometry(.09, .26, 4), lm('#f6f2ea')); e.position.set(s * .17, .62, .06); e.rotation.z = -s * .15; g.add(e); const i = new T.Mesh(new T.ConeGeometry(.05, .18, 4), lm('#d6262c')); i.position.set(s * .17, .6, .08); i.rotation.z = -s * .15; g.add(i); } return g; },
      eyes(c) { const g = new T.Group(), m = bm(c.col || 0x6fd8ff, 1, true); for (const s of [-1, 1]) { mk(g, .13, .06, .02, m, s * .12, .27, .262); mk(g, .2, .12, .01, bm(c.col || 0x6fd8ff, .35, true), s * .12, .27, .266); } g.userData.anim = (t) => { g.children.forEach((q, i) => { q.material.opacity = (i % 2 ? .3 : 1) * (.8 + Math.sin(t * 5) * .2); }); }; return g; },
      cape(c) { const g = new T.Group(), geo = new T.PlaneGeometry(.58, .98, 4, 8), red = lm('#a3121c'); const m = new T.Mesh(geo, red); m.position.y = -.49; g.add(m); mk(g, .6, .035, .02, bm(0xffd54f, 1), 0, .02, 0); mk(g, .035, .98, .02, bm(0xffd54f, 1), .29, -.49, 0); mk(g, .035, .98, .02, bm(0xffd54f, 1), -.29, -.49, 0);
        g.position.set(0, .73, -.14); const base = Float32Array.from(geo.attributes.position.array); g.userData.anim = (t, f) => { const sp = f ? Math.hypot(f.vel.x, f.vel.z) : 0, p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = base[i * 3 + 1], k = (.49 - y) / .98; p.setZ(i, -Math.sin(t * 4 + y * 5) * .05 * k - k * k * Math.min(.5, sp * .05)); } p.needsUpdate = true; g.rotation.x = -.05 - Math.min(.5, sp * .03); }; return g; },
      katana(c) { const g = new T.Group(); mk(g, .045, 1.05, .02, lm('#cfd6dd'), 0, .5, 0); mk(g, .09, .035, .06, lm('#d4a73a'), 0, 0, 0); mk(g, .05, .24, .035, lm('#17171c'), 0, -.14, 0); mk(g, .06, .9, .045, lm('#14141a'), .09, .5, 0).rotation.z = 0; g.position.set(0, .22, -.2); g.rotation.z = -.62; return g; },
      wings(c) { const g = new T.Group(), m = bm(0xffffff, .92), sh = bm(0xbfe6ff, .5, true), L = [], R = []; for (const [arr, s] of [[L, -1], [R, 1]]) { const p = new T.Group(); p.position.set(s * .12, .56, -.16); g.add(p); for (let i = 0; i < 5; i++) { const f = mk(p, .08, .55 - i * .06, .018, i % 2 ? m : sh, s * (.1 + i * .17), .12 - i * .1, -i * .015, 0, 0, -s * (.25 + i * .12)); } arr.push(p); }
        g.userData.anim = (t) => { const f = Math.sin(t * 2) * .12; L[0].rotation.y = -.6 - f; R[0].rotation.y = .6 + f; }; return g; },
      kwings(c) { const g = new T.Group(), m = lm('#a8325a'), m2 = bm(0x39e6ff, .8, true), arms = []; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const root = new T.Group(); root.position.set(s * .1, .62 - k * .12, -.16); root.rotation.y = s * (-1.2 - k * .3); g.add(root); let par = root; const segs = []; for (let i = 0; i < 5; i++) { const sgm = new T.Group(); sgm.position.z = i ? -.3 : 0; par.add(sgm); mk(sgm, .09 - i * .012, .09 - i * .012, .32, i === 4 ? m2 : m, 0, 0, -.14); segs.push(sgm); par = sgm; } arms.push([segs, k, s]); }
        g.userData.anim = (t) => { for (const [segs, k, s] of arms) segs.forEach((q, i) => { q.rotation.x = Math.sin(t * 2.2 + k + i * .6) * .22; q.rotation.y = s * Math.sin(t * 1.6 + i * .5 + k) * .18; }); }; return g; },
      shoulders(c) { const g = new T.Group(), a = lm(c.col2 || c.col || '#8a1620'), b = bm(c.trim ? new T.Color(c.trim).getHex() : 0xd4a73a, 1); for (const s of [-1, 1]) { const p = new T.Group(); p.position.set(s * .36, .78, 0); p.rotation.z = -s * .3; g.add(p); for (let i = 0; i < 3; i++) mk(p, .3 - i * .02, .05, .3, a, 0, -i * .06, 0); mk(p, .32, .02, .32, b, 0, .03, 0); mk(p, .06, .12, .06, b, s * .12, .1, 0, 0, 0, 0); } return g; },
    };
    const mount = { head: f => f.model.head, face: f => f.model.head, back: f => f.model.torso, shoulders: f => f.model.torso };

    // ---------------------------------------------------------------- poner y quitar en los luchadores
    function unmount(f) { if (f._cos) { for (const o of f._cos.objs) { if (o.parent) o.parent.remove(o); o.traverse(q => { if (q.geometry) q.geometry.dispose(); }); } f._cos = null; } }
    function mountFor(f, ids) {
      const key = ids.join(','); if (f._cosKey === key && f._cos) return; f._cosKey = key; unmount(f); if (!f.model || !f.model.head || !f.model.torso) return;
      const objs = [], auras = [];
      for (const id of ids) { const c = byId(id); if (!c) continue; if (c.mk === 'aura') { auras.push(c); continue; } const mkr = MAKERS[c.mk]; if (!mkr) continue; const o = mkr(c); const par = mount[c.slot] && mount[c.slot](f); if (!par) continue; par.add(o); objs.push(o); }
      f._cos = { objs, auras, ids };
    }
    function remote(px, ids) {
      if (!Array.isArray(ids)) { if (px._cosKey) { px._cosKey = ''; unmount(px); } return; }
      const clean = ids.slice(0, 6).filter(v => Number.isInteger(v) && byId(v)); const seen = new Set(), ok = clean.filter(v => { const s = byId(v).slot; if (seen.has(s)) return false; seen.add(s); return true; });
      mountFor(px, ok);
    }

    // ---------------------------------------------------------------- animación (capa, alas, aura) en cada cuadro
    let last = performance.now(), auraT = 0;
    function loop(now) {
      requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
      if (G.state !== 'play') return;
      const p = G.player; if (p && p.model) { sane(); mountFor(p, idsOf()); }
      auraT += dt;
      for (const f of G.fighters) {
        const c = f._cos; if (!c) continue;
        for (const o of c.objs) if (o.userData.anim) { try { o.userData.anim(t, f); } catch (e) { } }
        if (c.auras.length && f.alive && auraT > .05 && f.model.root.visible) for (const a of c.auras) {
          const col = a.col || '#ffd54f'; emit(f.pos.x + rand(-.45, .45), f.pos.y + rand(0, 1.8), f.pos.z + rand(-.45, .45), rand(-.15, .15), rand(.6, 1.6), rand(-.15, .15), col, .09, 1.1, 0, 1);
          if (a.ring && Math.floor(t * 1.2) !== Math.floor((t - dt) * 1.2)) ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), col, 1.8, .8);
        }
      }
      if (auraT > .05) auraT = 0;
    }
    requestAnimationFrame(loop);

    // ---------------------------------------------------------------- panel para equipar (con vista previa del modelo al lado, como el selector de personajes)
    const css = document.createElement('style');
    css.textContent = `#cosdlg{position:fixed;inset:0;z-index:95;display:none;align-items:center;justify-content:center;background:rgba(6,8,16,.86);font-family:var(--body,system-ui,sans-serif);color:#fff}#cosdlg.on{display:flex}
#cosdlg .box{width:min(980px,97vw);max-height:92vh;background:#12162a;border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:16px 18px;display:grid;grid-template-columns:340px 1fr;gap:16px;overflow:hidden}
@media(max-width:820px){#cosdlg .box{grid-template-columns:1fr;overflow:auto}}
#cosdlg .pv{display:flex;flex-direction:column;gap:8px}#cosdlg canvas{width:100%;height:340px;border-radius:14px;background:radial-gradient(circle at 50% 30%,#2a3470,#0c1024);cursor:grab;touch-action:none}
#cosdlg .an{display:flex;flex-wrap:wrap;gap:6px}#cosdlg .an button{border:1px solid rgba(255,255,255,.2);border-radius:9px;background:#1b2140;color:#fff;padding:5px 9px;font-size:12px;cursor:pointer}#cosdlg .an button.on{background:#3a3010;border-color:#ffd54f}
#cosdlg .info{min-height:64px;font-size:13px}#cosdlg .info b{display:block;font-size:15px}#cosdlg .go{border:0;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;background:#ffd54f;color:#201800;margin-top:6px}#cosdlg .go[disabled]{opacity:.45;cursor:not-allowed}
#cosdlg .lst{overflow:auto;max-height:84vh;padding-right:4px}#cosdlg h2{margin:0 0 4px;letter-spacing:.06em;font-size:20px;display:flex;justify-content:space-between;align-items:center}#cosdlg .sub{opacity:.75;font-size:12px;margin-bottom:6px}
#cosdlg h4{margin:10px 0 6px;font-size:12px;letter-spacing:.08em;opacity:.8}#cosdlg .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:7px}
#cosdlg .it{border:1px solid rgba(255,255,255,.18);border-radius:12px;background:#1b2140;padding:9px 7px;text-align:center;cursor:pointer;color:#fff;font-size:12px}#cosdlg .it .ic{font-size:24px;display:block}
#cosdlg .it.lock{opacity:.6}#cosdlg .it.on{outline:2px solid #ffd54f;background:#3a3010}#cosdlg .it.sel{outline:2px solid #4fd0c9}#cosdlg .it small{display:block;opacity:.8;margin-top:2px;font-size:10px}
#cosdlg button.b{border:0;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;background:#2a3158;color:#fff}`;
    document.head.appendChild(css);
    const D = document.createElement('div'); D.id = 'cosdlg'; D.setAttribute('role', 'dialog'); D.setAttribute('aria-modal', 'true'); document.body.appendChild(D);
    let panelOn = false, selId = 0, anim = 'idle', yawDrag = 0, rot = .5;
    const WP = { ok: null, rr: null, scene: null, cam: null, model: null, an: null, fl: null, track: null, raf: 0, last: 0, t0: 0, key: '' };
    const REST = { ix: .04, tx: .08, ty: .3, hy: -.25, alx: -1.05, alz: -.35, aly: .2, arx: -.75, arz: .3, ary: -.2, llx: -.3, llz: .08, lrx: .25, lrz: -.1, by: -.6 };
    const kf = (dur, step, fn) => { const o = []; for (let t = step, i = 0; t < dur; t += step, i++) o.push([+t.toFixed(3), fn(i)]); return o; };
    const ANIMS = {
      idle: { n: 'Quieto', dur: 3, seq: [[1.5, Object.assign({}, REST, { by: -.2, ix: .02 })], [3, REST]] },
      wave: { n: 'Saludo', dur: 2.4, seq: [[.25, { hy: .25, alx: -.3, alz: .3, arx: -2.55, arz: -.5, by: -.6 }], ...kf(2.1, .28, i => ({ hy: .25, alx: -.3, alz: .3, arx: -2.55, arz: i % 2 ? -.95 : -.15, by: -.6 })), [2.4, REST]] },
      dance: { n: 'Baile', dur: 3.2, seq: kf(3.2, .4, i => { const s = i % 2 ? 1 : -1; return { ix: .08, tx: .1 * s, ty: .55 * s, hy: -.3 * s, hx: .1, by: i % 2 ? -3 : -1.2, alx: s > 0 ? -2.7 : -.5, alz: .4, arx: s > 0 ? -.5 : -2.7, arz: -.4, llx: s > 0 ? -.5 : .1, lrx: s > 0 ? .1 : -.5 }; }) },
      power: { n: 'Pose épica', dur: 3, seq: [[.4, { ix: -.12, tx: -.25, hx: -.3, ty: .5, hy: -.5, by: -2, alx: -2.9, alz: .1, arx: .4, arz: -.9, llx: -.4, lrx: .3, llz: .3, lrz: -.1 }], [2.6, { ix: -.12, tx: -.25, hx: -.3, ty: .5, hy: -.5, by: -2.4, alx: -2.9, alz: .1, arx: .4, arz: -.9, llx: -.4, lrx: .3, llz: .3, lrz: -.1 }], [3, REST]] },
      run: { n: 'Correr', dur: 1.2, seq: kf(1.2, .15, i => ({ ix: .5, tx: .1, by: -2, alx: i % 2 ? -1.6 : .5, arx: i % 2 ? .5 : -1.6, alz: .1, arz: -.1, llx: i % 2 ? -1.1 : .9, lrx: i % 2 ? .9 : -1.1 })) },
    };
    function wpInit() {
      if (WP.ok != null) return WP.ok; const p = G.player; if (!p || !p.model || !p.model.tex || !p.model.tex.image) return false;
      try {
        const cv0 = D.querySelector('canvas'); const rr = new T.WebGLRenderer({ canvas: cv0, alpha: true, antialias: true }); rr.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); rr.setClearColor(0x000000, 0);
        const sc = new T.Scene(); sc.add(new T.HemisphereLight(0xffffff, 0x556677, 1.15)); const dl = new T.DirectionalLight(0xffffff, .9); dl.position.set(2, 3, 4); sc.add(dl);
        const img = p.model.tex.image, cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; cv.getContext('2d').drawImage(img, 0, 0);
        const m = buildModel(cv, !!(p.ch && p.ch.slim), sc); WP.model = m; WP.an = new Animator(m); WP.fl = { model: m, vel: { x: 0, z: 0 }, alive: true };
        WP.cam = new T.PerspectiveCamera(28, 1, .1, 40); WP.cam.position.set(0, 1.05, 5.8); WP.cam.lookAt(0, .92, 0); WP.rr = rr; WP.scene = sc; WP.ok = true;
      } catch (e) { console.warn('cosmeticos: sin vista previa 3D', e); WP.ok = false; }
      return WP.ok;
    }
    function wpFrame(now) {
      WP.raf = 0; if (!panelOn || !WP.ok) return; const dt = Math.min(.05, Math.max(0, (now - (WP.last || now)) / 1000)); WP.last = now;
      const cv = WP.rr.domElement, w = cv.clientWidth || 340, h = cv.clientHeight || 340; if (cv.width !== Math.round(w * WP.rr.getPixelRatio())) { WP.rr.setSize(w, h, false); WP.cam.aspect = w / h; WP.cam.updateProjectionMatrix(); }
      const A = ANIMS[anim] || ANIMS.idle; if (WP.key !== anim) { WP.key = anim; WP.track = buildTrack(A.seq, Object.assign({}, REST), 0); WP.t0 = now; WP.an.reset(); }
      const t = ((now - WP.t0) / 1000) % (A.dur + .3); WP.an.bbR6 = false; WP.an.play(WP.track, Math.min(t, A.dur - 1e-3), dt, false);
      rot += dt * (yawDrag ? 0 : .5); WP.model.root.rotation.y = rot;
      const c = WP.fl._cos; if (c) for (const o of c.objs) if (o.userData.anim) { try { o.userData.anim(now / 1000, WP.fl); } catch (e) { } }
      WP.rr.render(WP.scene, WP.cam); WP.raf = requestAnimationFrame(wpFrame);
    }
    function previewIds() { const ids = Object.assign({}, eq); const c = byId(selId); if (c) ids[c.slot] = c.id; return SLOTS.map(([s]) => ids[s]).filter(Boolean); }
    function paint() {
      sane(); const sel = byId(selId);
      let h = '<div class="box"><div class="pv"><canvas></canvas><div class="an">' + Object.entries(ANIMS).map(([k, a]) => '<button type="button" data-an="' + k + '" class="' + (k === anim ? 'on' : '') + '">' + a.n + '</button>').join('') + '</div><div class="info">';
      if (sel) { const ok = owned(sel); h += '<b>' + sel.ico + ' ' + sel.n + '</b>' + (ok ? (eq[sel.slot] === sel.id ? 'Equipado.' : 'Desbloqueado.') : '🔒 ' + (sel.boss ? 'Se consigue derrotando al Kraken (' + sel.boss + (sel.boss > 1 ? ' victorias' : ' victoria') + ').' : 'Se consigue con kills: premio al azar cada 50 kills en salas públicas.')) + '<br><button type="button" class="go" id="coseq"' + (ok ? '' : ' disabled') + '>' + (eq[sel.slot] === sel.id ? 'Quitar' : 'Equipar') + '</button>'; }
      else h += '<b>Tocá un cosmético</b>para verlo puesto en tu personaje (gíralo arrastrando).';
      h += '</div></div><div class="lst"><h2><span>👑 COSMÉTICOS</span><button class="b" id="cosx" type="button">Listo</button></h2><div class="sub">Un cosmético por espacio. ' + (isOwner() ? 'Eres el dueño: tienes todo desbloqueado. ' : 'Cada 50 kills en salas públicas ganas uno al azar; los del abismo, derrotando al Kraken (' + bossKills() + ' victorias). ') + '</div>';
      for (const [s, name] of SLOTS) { h += '<h4>' + name.toUpperCase() + '</h4><div class="gr">'; for (const c of CAT.filter(x => x.slot === s)) { const ok = owned(c), on = eq[s] === c.id; h += '<button type="button" class="it' + (ok ? '' : ' lock') + (on ? ' on' : '') + (c.id === selId ? ' sel' : '') + '" data-id="' + c.id + '"><span class="ic">' + (ok ? c.ico : '🔒') + '</span><b>' + c.n + '</b><small>' + (ok ? (on ? 'Equipado' : 'Tocá para ver') : c.boss ? 'Jefe Kraken' : 'Premio al azar') + '</small></button>'; } h += '</div>'; }
      D.innerHTML = h + '</div></div>';
      D.querySelector('#cosx').onclick = closePanel;
      D.querySelectorAll('.it').forEach(b => b.addEventListener('click', () => { selId = +b.dataset.id; paint(); }));
      D.querySelectorAll('[data-an]').forEach(b => b.addEventListener('click', () => { anim = b.dataset.an; paint(); }));
      const eqb = D.querySelector('#coseq'); if (eqb) eqb.onclick = () => { const c = byId(selId); if (!c || !owned(c)) return; if (eq[c.slot] === c.id) delete eq[c.slot]; else eq[c.slot] = c.id; save(); paint(); };
      const cv = D.querySelector('canvas'); let down = false, lx = 0;
      cv.addEventListener('pointerdown', e => { down = true; yawDrag = 1; lx = e.clientX; try { cv.setPointerCapture(e.pointerId); } catch (x) { } cv.style.cursor = 'grabbing'; });
      cv.addEventListener('pointermove', e => { if (down) { rot += (e.clientX - lx) * .012; lx = e.clientX; } });
      cv.addEventListener('pointerup', () => { down = false; yawDrag = 0; cv.style.cursor = 'grab'; });
      // el canvas se vuelve a crear en cada repintado: se reconstruye el visor 3D
      try { if (WP.rr) WP.rr.dispose(); } catch (e) { } WP.ok = null; WP.rr = null; WP.key = ''; WP.scene = null; WP.model = null;
      if (wpInit()) { mountFor(WP.fl, previewIds()); if (!WP.raf) { WP.t0 = performance.now(); WP.last = 0; WP.raf = requestAnimationFrame(wpFrame); } }
    }
    function openPanel() { if (G.state !== 'play') return; if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (e) { } } panelOn = true; D.classList.add('on'); selId = 0; paint(); }
    function closePanel() { panelOn = false; D.classList.remove('on'); try { if (WP.rr) WP.rr.dispose(); } catch (e) { } WP.ok = null; WP.rr = null; WP.fl = null; D.innerHTML = ''; }
    D.addEventListener('click', e => { if (e.target === D) closePanel(); });
    addEventListener('keydown', e => { if (panelOn && e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closePanel(); } }, true);
    function injectBtn() {
      const top = document.getElementById('topl'); if (!top || document.getElementById('cosbtn')) return;
      const b = document.createElement('button'); b.id = 'cosbtn'; b.type = 'button'; b.className = 'chip'; b.title = 'Cosméticos'; b.setAttribute('aria-label', 'Cosméticos');
      b.style.cssText = 'pointer-events:auto;border:0;color:var(--ink);font-family:var(--body);cursor:pointer'; b.textContent = '👑';
      b.addEventListener('click', ev => { ev.stopPropagation(); panelOn ? closePanel() : openPanel(); });
      const em = document.getElementById('emotebtn'); top.insertBefore(b, em ? em.nextSibling : null);
    }
    injectBtn(); setTimeout(injectBtn, 1200); setTimeout(injectBtn, 3000);

    // ---------------------------------------------------------------- premios del jefe (lo llama js/abismo.js)
    function grantBoss() {
      const before = bossKills(), after = before + 1; wr('bsb_boss_kills', after);
      return CAT.filter(c => c.boss && c.boss > before && c.boss <= after).map(c => c.ico + ' Cosmético «' + c.n + '»');
    }

    // premios por kills (los reparte js/emotes.js): lista de cosméticos que aún no tienes y desbloqueo
    const lockedPool = () => CAT.filter(c => !c.boss && !c.free && !loot().c.includes(c.id)).map(c => ({ t: 'c', id: c.id }));
    function unlock(id) { const c = byId(id); if (!c) return ''; if (window.CF_LOOT && !CF_LOOT.c.includes(id)) { CF_LOOT.c.push(id); if (window.CF_LOOT_SAVE) CF_LOOT_SAVE(); } return c.n; }
    window.CF_COS = { lockedPool, unlock, remote, grantBoss, equippedIds: () => { sane(); return idsOf(); }, open: openPanel, list: () => CAT.map(c => ({ id: c.id, n: c.n, slot: c.slot })) };
  }
});
