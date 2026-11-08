/* ===== MODELOS DE BLOCKBENCH PARA EL ABISMO (enemigos y barco) =====
   Carga los .bbmodel de modelos/abismo/ (hechos/editables en Blockbench; se generan con tools/gen_modelos_abismo.py), arma sus huesos (grupos)
   y reproduce las animaciones del propio archivo (idle, walk, attack). Los cubos «glow_*» brillan sin sombreado.
   Si un modelo no carga, abismo.js y muelle.js usan una versión de respaldo hecha por código.
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const T = THREE, FILES = ['cangrejo', 'medusa', 'rape', 'marinero', 'capitan', 'calamarin', 'barco'], DATA = {};
    const RAD = Math.PI / 180, nums = v => [parseFloat(v.x) || 0, parseFloat(v.y) || 0, parseFloat(v.z) || 0];
    const FACE_ORDER = ['east', 'west', 'up', 'down', 'south', 'north'];   // orden de las caras de BoxGeometry: +x, -x, +y, -y, +z, -z
    function parse(name, d) {
      return new Promise(ok => {
        const img = new Image(); img.onload = () => {
          const tex = new T.Texture(img); tex.needsUpdate = true; tex.magFilter = T.NearestFilter; tex.minFilter = T.NearestFilter;
          const anims = {}; for (const an of d.animations || []) { const ar = []; for (const k in an.animators) { const a = an.animators[k], ch = {}; for (const kf of a.keyframes || []) (ch[kf.channel] = ch[kf.channel] || []).push({ t: kf.time, v: nums(kf.data_points[0]) }); for (const c in ch) ch[c].sort((p, q) => p.t - q.t); ar.push({ bone: a.name, ch }); } anims[an.name] = { length: an.length || 1, tracks: ar }; }
          DATA[name] = { d, tex, anims, els: new Map(d.elements.map(e => [e.uuid, e])), W: d.resolution.width, H: d.resolution.height }; ok();
        }; img.onerror = () => ok(); img.src = d.textures[0].source;
      });
    }
    for (const f of FILES) fetch('modelos/abismo/' + f + '.bbmodel').then(r => { if (!r.ok) throw 0; return r.json(); }).then(d => parse(f, d)).catch(() => { });
    function box(acc, c, s, uv) {   // agrega un cubo (24 vértices) a un acumulador de geometría
      const [cx, cy, cz] = c, [hx, hy, hz] = [s[0] / 2, s[1] / 2, s[2] / 2];
      const F = [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]], [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]], [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]], [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]], [[0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]]];
      F.forEach(([n, vs], fi) => { const b = acc.p.length / 3; for (const v of vs) { acc.p.push(cx + v[0] * hx, cy + v[1] * hy, cz + v[2] * hz); acc.n.push(n[0], n[1], n[2]); acc.u.push(uv[fi][0], uv[fi][1]); } acc.i.push(b, b + 1, b + 2, b, b + 2, b + 3); });
    }
    const mkGeo = acc => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(acc.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(acc.n, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(acc.u, 2)); g.setIndex(acc.i); return g; };
    function make(name, scale) {
      const D = DATA[name]; if (!D) return null; const s = scale || .0625, bones = {}, rest = {};
      const lam = new T.MeshLambertMaterial({ map: D.tex, side: T.DoubleSide }); lam.emissive = new T.Color(0x182028); lam.userData.em = lam.emissive.clone(); const glow = new T.MeshBasicMaterial({ map: D.tex, side: T.DoubleSide });
      function node(n, parent, po) {
        const o = n.origin || [0, 0, 0], g = new T.Group(); g.name = n.name; g.position.set((o[0] - po[0]) * s, (o[1] - po[1]) * s, (o[2] - po[2]) * s); const r = n.rotation || [0, 0, 0]; g.rotation.set(r[0] * RAD, r[1] * RAD, r[2] * RAD, 'ZYX'); parent.add(g); bones[n.name] = g;
        rest[n.name] = { p: g.position.clone(), r: [g.rotation.x, g.rotation.y, g.rotation.z] };
        const a = { p: [], n: [], u: [], i: [] }, b = { p: [], n: [], u: [], i: [] };
        for (const c of n.children || []) {
          if (typeof c === 'string') { const e = D.els.get(c); if (!e || e.type !== 'cube') continue; const f = e.from, t = e.to, uv = FACE_ORDER.map(k => { const q = e.faces[k].uv; return [(q[0] + q[2]) / 2 / D.W, 1 - (q[1] + q[3]) / 2 / D.H]; });
            box(/^glow_/.test(e.name) ? b : a, [((f[0] + t[0]) / 2 - o[0]) * s, ((f[1] + t[1]) / 2 - o[1]) * s, ((f[2] + t[2]) / 2 - o[2]) * s], [(t[0] - f[0]) * s, (t[1] - f[1]) * s, (t[2] - f[2]) * s], uv); }
          else node(c, g, o);
        }
        if (a.p.length) g.add(new T.Mesh(mkGeo(a), lam)); if (b.p.length) g.add(new T.Mesh(mkGeo(b), glow));
      }
      const root = new T.Group(); for (const n of D.d.outliner) node(n, root, [0, 0, 0]);
      const inst = {
        root, bones, anims: D.anims, name,
        update(anim, time, dt) {
          const an = D.anims[anim] || D.anims.idle; if (!an) return; const L = an.length, tt = ((time % L) + L) % L, k = 1 - Math.exp(-(dt || .016) * 14), act = new Set();
          for (const tk of an.tracks) { const b = bones[tk.bone]; if (!b) continue; act.add(tk.bone); const rs = rest[tk.bone];
            const smp = ch => { const a = tk.ch[ch]; if (!a || !a.length) return null; if (a.length === 1) return a[0].v; let i = 0; while (i < a.length - 1 && a[i + 1].t <= tt) i++; const p = a[i], q = a[Math.min(i + 1, a.length - 1)]; if (q === p || q.t === p.t) return p.v; const u = Math.max(0, Math.min(1, (tt - p.t) / (q.t - p.t))); return [p.v[0] + (q.v[0] - p.v[0]) * u, p.v[1] + (q.v[1] - p.v[1]) * u, p.v[2] + (q.v[2] - p.v[2]) * u]; };
            const r = smp('rotation') || [0, 0, 0], ps = smp('position') || [0, 0, 0], sc = smp('scale') || [1, 1, 1];
            b.rotation.x += (rs.r[0] + r[0] * RAD - b.rotation.x) * k; b.rotation.y += (rs.r[1] + r[1] * RAD - b.rotation.y) * k; b.rotation.z += (rs.r[2] + r[2] * RAD - b.rotation.z) * k;
            b.position.x += (rs.p.x + ps[0] * s - b.position.x) * k; b.position.y += (rs.p.y + ps[1] * s - b.position.y) * k; b.position.z += (rs.p.z + ps[2] * s - b.position.z) * k;
            b.scale.x += (sc[0] - b.scale.x) * k; b.scale.y += (sc[1] - b.scale.y) * k; b.scale.z += (sc[2] - b.scale.z) * k; }
          for (const nm in bones) if (!act.has(nm)) { const b = bones[nm], rs = rest[nm]; b.rotation.x += (rs.r[0] - b.rotation.x) * k; b.rotation.y += (rs.r[1] - b.rotation.y) * k; b.rotation.z += (rs.r[2] - b.rotation.z) * k; b.position.lerp(rs.p, k); b.scale.x += (1 - b.scale.x) * k; b.scale.y += (1 - b.scale.y) * k; b.scale.z += (1 - b.scale.z) * k; }
        },
      };
      return inst;
    }
    window.CF_BBM = { make, has: n => !!DATA[n], loaded: () => Object.keys(DATA), data: DATA };
  }
});
