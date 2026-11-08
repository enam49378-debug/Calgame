/* ===== COSMÉTICOS (estilo anime / cine épico) =====
   Objetos que se ponen sobre el personaje: halo, cuernos, máscara, capa, katana, alas, hombreras, auras y ojos.
   - Botón arriba (junto a Panel, Guía y Emotes) abre el panel para equipar / quitar. Un cosmético por espacio (cabeza, cara, espalda, hombros, aura).
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
      { id: 1, n: 'Halo dorado', slot: 'head', k: 10, mk: 'halo', bb: 'cos_halo' },
      { id: 2, n: 'Cuernos de Oni', slot: 'head', k: 30, mk: 'oni', bb: 'cos_oni' },
      { id: 3, n: 'Capa épica', slot: 'back', free: 1, mk: 'cape', bb: 'cos_capa' },
      { id: 4, n: 'Katana a la espalda', slot: 'back', k: 45, mk: 'katana', bb: 'cos_katana' },
      { id: 5, n: 'Máscara Kitsune', slot: 'face', k: 60, mk: 'kitsune', bb: 'cos_kitsune' },
      { id: 6, n: 'Hombreras de samurái', slot: 'shoulders', k: 100, mk: 'shoulders', bb: 'cos_hombreras_samurai' },
      { id: 7, n: 'Aura dorada', slot: 'aura', k: 80, mk: 'aura', col: '#ffd54f' },
      { id: 8, n: 'Alas de ángel', slot: 'back', k: 150, mk: 'wings', bb: 'cos_alas_angel' },
      { id: 9, n: 'Ojos de energía', slot: 'face', free: 1, mk: 'eyes', col: 0x6fd8ff, bb: 'cos_ojos_azul' },
      { id: 10, n: 'Corona del Abismo', slot: 'head', boss: 1, mk: 'crown', bb: 'cos_corona' },
      { id: 11, n: 'Aura abisal', slot: 'aura', boss: 1, mk: 'aura', col: '#39e6ff', ring: true },
      { id: 12, n: 'Alas del Kraken', slot: 'back', boss: 2, mk: 'kwings', bb: 'cos_alas_kraken' },
      { id: 13, n: 'Ojos del Kraken', slot: 'face', boss: 3, mk: 'eyes', col: 0xff3b30, bb: 'cos_ojos_kraken' },
      { id: 14, n: 'Hombreras del abismo', slot: 'shoulders', boss: 4, mk: 'shoulders', col: '#0b3a4a', trim: '#39e6ff', bb: 'cos_hombreras_abismo' },
      { id: 15, n: 'Kabuto de samurái', slot: 'head', k: 120, mk: 'kabuto', bb: 'cos_kabuto' },
      { id: 16, n: 'Orejas de gato', slot: 'head', k: 25, mk: 'gato', bb: 'cos_gato' },
      { id: 17, n: 'Sombrero pirata', slot: 'head', k: 70, mk: 'pirata', bb: 'cos_pirata' },
      { id: 18, n: 'Cuernos de ciervo', slot: 'head', k: 90, mk: 'ciervo', bb: 'cos_ciervo' },
      { id: 19, n: 'Gafas oscuras', slot: 'face', k: 15, mk: 'gafas', bb: 'cos_gafas' },
      { id: 20, n: 'Antifaz ninja', slot: 'face', k: 55, mk: 'antifaz', bb: 'cos_antifaz' },
      { id: 21, n: 'Mochila aventurera', slot: 'back', k: 35, mk: 'mochila', bb: 'cos_mochila' },
      { id: 22, n: 'Alas de demonio', slot: 'back', k: 180, mk: 'dwings', bb: 'cos_alas_demonio' },
      { id: 23, n: 'Escudo a la espalda', slot: 'back', k: 110, mk: 'escudo', bb: 'cos_escudo' },
      { id: 24, n: 'Hombreras de pinchos', slot: 'shoulders', k: 130, mk: 'pinchos', bb: 'cos_hombreras_pinchos' },
      { id: 25, n: 'Bufanda roja', slot: 'shoulders', k: 20, mk: 'bufanda', bb: 'cos_bufanda' },
      { id: 26, n: 'Aura carmesí', slot: 'aura', k: 100, mk: 'aura', col: '#ff3b5c' },
      { id: 27, n: 'Aura violeta', slot: 'aura', k: 140, mk: 'aura', col: '#b388ff', ring: true },
    ];
    const byId = id => CAT.find(c => c.id === id);

    // ---------------------------------------------------------------- estado
    let eq = rd('bsb_cos_eq', {}); if (!eq || typeof eq !== 'object') eq = {};
    const bossKills = () => Math.max(0, rd('bsb_boss_kills', 0) | 0);
    const pubKills = () => (window.CF_EMOTES ? CF_EMOTES.kills : 0);
    const isOwner = () => !!((SOC && SOC.owner) || /^(localhost|127\.|\[::1\])/.test(location.hostname));                          // el dueño tiene todo
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
    function bbObj(c) {   // cosmético hecho en Blockbench (modelos/cosmeticos/*.bbmodel)
      const inst = CF_BBM.make(c.bb, 1 / 16), g = new T.Group(); g.add(inst.root);
      g.userData.anim = (t, f) => { const mv = f && f.vel ? Math.hypot(f.vel.x, f.vel.z) : 0; inst.update(mv > 1.5 && inst.anims.walk ? 'walk' : 'idle', t, .016); }; return g;
    }
    const mount = { head: f => f.model.head, face: f => f.model.head, back: f => f.model.torso, shoulders: f => f.model.torso };

    // ---------------------------------------------------------------- poner y quitar en los luchadores
    function unmount(f) { if (f._cos) { for (const o of f._cos.objs) { if (o.parent) o.parent.remove(o); o.traverse(q => { if (q.geometry) q.geometry.dispose(); }); } f._cos = null; } }
    function mountFor(f, ids) {
      const key = ids.join(','); if (f._cosKey === key && f._cos) return; f._cosKey = key; unmount(f); if (!f.model || !f.model.head || !f.model.torso) return;
      const objs = [], auras = [];
      for (const id of ids) { const c = byId(id); if (!c) continue; if (c.mk === 'aura') { auras.push(c); continue; } const useBB = c.bb && window.CF_BBM && CF_BBM.has(c.bb); const mkr = useBB ? null : MAKERS[c.mk]; if (!mkr && !useBB) continue; const o = useBB ? bbObj(c) : mkr(c); const par = mount[c.slot] && mount[c.slot](f); if (!par) continue; par.add(o); objs.push(o); }
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
      if (window.CF_BBM) { const n = CF_BBM.loaded().length; if (n !== (loop.n || 0)) { loop.n = n; for (const f of G.fighters) f._cosKey = ''; if (WP.fl) WP.fl._cosKey = ''; } }
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
    css.textContent = `#cosdlg{position:fixed;inset:0;z-index:95;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 20%,rgba(30,40,90,.92),rgba(4,6,14,.95));font-family:var(--body,system-ui,sans-serif);color:#eef2ff}#cosdlg.on{display:flex}
#cosdlg .box{width:min(1080px,97vw);height:min(660px,94vh);display:grid;grid-template-columns:minmax(300px,420px) 1fr;gap:0;background:linear-gradient(160deg,#141a38,#0b0f22);border:1px solid rgba(125,249,255,.25);border-radius:18px;box-shadow:0 20px 70px rgba(0,0,0,.7);overflow:hidden}
@media(max-width:820px){#cosdlg .box{grid-template-columns:1fr;grid-template-rows:260px 1fr;height:96vh}}
#cosdlg .pv{display:flex;flex-direction:column;gap:10px;padding:14px;background:radial-gradient(circle at 50% 30%,#2a3470,#0a0e20);border-right:1px solid rgba(255,255,255,.08);min-height:0}
#cosdlg canvas{flex:1;min-height:0;width:100%;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0));cursor:grab;touch-action:none}
#cosdlg .an{display:flex;flex-wrap:wrap;gap:5px}#cosdlg .an button{border:1px solid rgba(255,255,255,.18);border-radius:7px;background:rgba(255,255,255,.05);color:#cfd8ff;padding:5px 10px;font-size:12px;cursor:pointer;font-weight:600}#cosdlg .an button.on{background:#7df9ff;color:#06101c;border-color:#7df9ff}
#cosdlg .info{min-height:92px;font-size:13px;line-height:1.45;color:#b9c4ec}#cosdlg .info b{display:block;font-size:17px;color:#fff;margin-bottom:2px}#cosdlg .info .tag{display:inline-block;font-size:10px;letter-spacing:.1em;padding:2px 7px;border-radius:5px;margin-bottom:6px;font-weight:700;color:#06101c}
#cosdlg .act{display:flex;gap:8px;margin-top:8px}#cosdlg .go{flex:1;border:0;border-radius:9px;padding:10px 14px;font-weight:800;cursor:pointer;background:linear-gradient(90deg,#ffd54f,#ffb347);color:#1a1200;letter-spacing:.04em}#cosdlg .go:disabled{opacity:.35;cursor:not-allowed}#cosdlg .go.sec{flex:0 0 auto;background:rgba(255,255,255,.1);color:#fff}
#cosdlg .lst{display:flex;flex-direction:column;min-height:0;padding:14px 16px}#cosdlg .hd{display:flex;align-items:center;gap:12px}#cosdlg h2{margin:0;letter-spacing:.14em;font-size:19px;flex:1}#cosdlg .cnt{font-size:12px;color:#8fa2d0}
#cosdlg .tabs{display:flex;gap:5px;margin:10px 0;flex-wrap:wrap}#cosdlg .tabs button{border:0;border-radius:7px;background:rgba(255,255,255,.06);color:#b9c4ec;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer}#cosdlg .tabs button.on{background:#ffd54f;color:#1a1200}
#cosdlg .gr{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;align-content:start;padding-right:4px}
#cosdlg .it{position:relative;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.04);padding:12px 10px 10px 14px;text-align:left;cursor:pointer;color:#fff;font-size:13px;overflow:hidden;transition:background .12s,transform .12s}
#cosdlg .it:hover{background:rgba(125,249,255,.12);transform:translateY(-1px)}#cosdlg .it .sw{position:absolute;left:0;top:0;bottom:0;width:4px}#cosdlg .it b{display:block;font-size:13px}#cosdlg .it small{display:block;margin-top:3px;font-size:10.5px;color:#8fa2d0}
#cosdlg .it.lock b{opacity:.55}#cosdlg .it.on{background:rgba(255,213,79,.14);border-color:#ffd54f}#cosdlg .it.sel{outline:2px solid #7df9ff}
#cosdlg button.b{border:0;border-radius:9px;padding:8px 16px;font-weight:800;cursor:pointer;background:#2a3158;color:#fff;letter-spacing:.04em}`;
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
    const TABS = [['all', 'Todos'], ['head', 'Cabeza'], ['face', 'Cara'], ['back', 'Espalda'], ['shoulders', 'Hombros'], ['aura', 'Aura']], SLOT_COL = { head: '#ffd54f', face: '#ff8fb0', back: '#7df9ff', shoulders: '#b388ff', aura: '#7dffb0' }; let tab = 'all';
    const SLOT_NAME = Object.fromEntries(SLOTS);
    const how = c => owned(c) ? (eq[c.slot] === c.id ? 'Equipado' : (isOwner() ? 'Dueño: desbloqueado' : 'Desbloqueado')) : c.boss ? 'Derrota al Kraken (' + c.boss + (c.boss > 1 ? ' veces' : ' vez') + ')' : 'Premio al azar cada 50 kills';
    function build() {
      D.innerHTML = '<div class="box"><div class="pv"><canvas></canvas><div class="an"></div><div class="info"></div></div><div class="lst"><div class="hd"><h2>COSMÉTICOS</h2><span class="cnt"></span><button class="b" id="cosx" type="button">Listo</button></div><div class="tabs"></div><div class="gr"></div></div></div>';
      D.querySelector('#cosx').onclick = closePanel;
      const cv = D.querySelector('canvas'); let down = false, lx = 0;
      cv.addEventListener('pointerdown', e => { down = true; yawDrag = 1; lx = e.clientX; try { cv.setPointerCapture(e.pointerId); } catch (x) { } cv.style.cursor = 'grabbing'; });
      cv.addEventListener('pointermove', e => { if (down) { rot += (e.clientX - lx) * .012; lx = e.clientX; } });
      cv.addEventListener('pointerup', () => { down = false; yawDrag = 0; cv.style.cursor = 'grab'; });
      try { if (WP.rr) WP.rr.dispose(); } catch (e) { } WP.ok = null; WP.rr = null; WP.key = ''; WP.scene = null; WP.model = null;
      if (wpInit()) { if (!WP.raf) { WP.t0 = performance.now(); WP.last = 0; WP.raf = requestAnimationFrame(wpFrame); } }
      refresh();
    }
    function refresh() {
      sane(); const sel = byId(selId), list = CAT.filter(c => tab === 'all' || c.slot === tab);
      D.querySelector('.an').innerHTML = Object.entries(ANIMS).map(([k, a]) => '<button type="button" data-an="' + k + '" class="' + (k === anim ? 'on' : '') + '">' + a.n + '</button>').join('');
      let h = ''; if (sel) { const ok = owned(sel); h = '<span class="tag" style="background:' + SLOT_COL[sel.slot] + '">' + SLOT_NAME[sel.slot].toUpperCase() + '</span><b>' + sel.n + '</b>' + how(sel) + '<div class="act"><button type="button" class="go" id="coseq"' + (ok ? '' : ' disabled') + '>' + (eq[sel.slot] === sel.id ? 'QUITAR' : 'EQUIPAR') + '</button><button type="button" class="go sec" id="cosclr">Quitar todo</button></div>'; }
      else h = '<b>Elige un cosmético</b>Toca uno de la lista para verlo puesto en tu personaje. Arrastra el modelo para girarlo.<div class="act"><button type="button" class="go sec" id="cosclr">Quitar todo</button></div>';
      D.querySelector('.info').innerHTML = h;
      D.querySelector('.cnt').textContent = CAT.filter(owned).length + ' de ' + CAT.length + ' desbloqueados' + (isOwner() ? ' · dueño' : '');
      D.querySelector('.tabs').innerHTML = TABS.map(([k, n]) => '<button type="button" data-tab="' + k + '" class="' + (k === tab ? 'on' : '') + '">' + n + '</button>').join('');
      D.querySelector('.gr').innerHTML = list.map(c => { const ok = owned(c), on = eq[c.slot] === c.id; return '<button type="button" class="it' + (ok ? '' : ' lock') + (on ? ' on' : '') + (c.id === selId ? ' sel' : '') + '" data-id="' + c.id + '"><span class="sw" style="background:' + SLOT_COL[c.slot] + '"></span><b>' + c.n + '</b><small>' + (tab === 'all' ? SLOT_NAME[c.slot] + ' · ' : '') + how(c) + '</small></button>'; }).join('');
      D.querySelectorAll('.it').forEach(b => b.addEventListener('click', () => { selId = +b.dataset.id; refresh(); }));
      D.querySelectorAll('[data-an]').forEach(b => b.addEventListener('click', () => { anim = b.dataset.an; refresh(); }));
      D.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; refresh(); }));
      const eqb = D.querySelector('#coseq'); if (eqb) eqb.onclick = () => { const c = byId(selId); if (!c || !owned(c)) return; if (eq[c.slot] === c.id) delete eq[c.slot]; else eq[c.slot] = c.id; save(); refresh(); };
      const cl = D.querySelector('#cosclr'); if (cl) cl.onclick = () => { eq = {}; save(); refresh(); };
      if (WP.ok && WP.fl) mountFor(WP.fl, previewIds());
    }
    const paint = build;
    function openPanel() { if (G.state !== 'play') return; if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (e) { } } panelOn = true; window.__uiOpen = true; D.classList.add('on'); selId = 0; build(); }
    function closePanel() { panelOn = false; window.__uiOpen = false; D.classList.remove('on'); try { if (WP.rr) WP.rr.dispose(); } catch (e) { } WP.ok = null; WP.rr = null; WP.fl = null; D.innerHTML = ''; }
    D.addEventListener('click', e => { if (e.target === D) closePanel(); });
    addEventListener('keydown', e => { if (panelOn && e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closePanel(); } }, true);
    function injectBtn() {
      const top = document.getElementById('topl'); if (!top || document.getElementById('cosbtn')) return;
      const b = document.createElement('button'); b.id = 'cosbtn'; b.type = 'button'; b.className = 'chip'; b.title = 'Cosméticos'; b.setAttribute('aria-label', 'Cosméticos');
      b.style.cssText = 'pointer-events:auto;border:0;color:var(--ink);font-family:var(--body);cursor:pointer'; b.textContent = 'Cosméticos';
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
