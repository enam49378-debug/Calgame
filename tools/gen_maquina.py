import json, os
os.chdir(r'F:\blockstrike')
m = json.load(open('assets/maquina_tiempo/model.bbmodel', encoding='utf-8'))
cubes = []
for e in m['elements']:
    f = e['faces']
    cubes.append({'from': e['from'], 'to': e['to'], 'uv': [f[k]['uv'] for k in ('east', 'west', 'up', 'down', 'south', 'north')]})
data = json.dumps(cubes, separators=(',', ':'))
src = '''/* "Ojo del Cosmos" · la Máquina del Tiempo (referencia a Bobicraft) volando por el espacio.
   El modelo es assets/maquina_tiempo/model.bbmodel (Blockbench) con su textura texture.png: son 8 cubos con texturas en rectángulos (UV de caja).
   Aquí se arma con three.js leyendo esos cubos (por si se cambia el modelo: tools/gen_maquina.py los vuelve a sacar del .bbmodel).
   Uso desde espacio-cosmos.js:  const M = rbMaquinaTiempo(grupo);  M.fly(desde, hasta, segundos, escala);  M.update(s, dt);  M.dispose(); */
const rbMaquinaTiempo = function (parent) {
  const CUBES = __DATA__;   // [{from, to, uv:[este, oeste, arriba, abajo, sur, norte]}] en píxeles de Blockbench (res. 512)
  const RES = 512, g = new THREE.Group(), geos = [], mats = [];
  const tex = new THREE.TextureLoader().load('assets/maquina_tiempo/texture.png'); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  const mat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0x2a2a2a, transparent: true, alphaTest: .35 }); mats.push(mat);
  const body = new THREE.Group(); g.add(body);
  for (const c of CUBES) {
    const w = c.to[0] - c.from[0], h = c.to[1] - c.from[1], d = c.to[2] - c.from[2];
    const ge = new THREE.BoxGeometry(w * PX, h * PX, d * PX); geos.push(ge);
    const uv = ge.attributes.uv;   // BoxGeometry: +x, -x, +y, -y, +z, -z, 4 vértices cada una (arriba-izq, arriba-der, abajo-izq, abajo-der)
    c.uv.forEach((r, i) => { const u1 = r[0] / RES, v1 = 1 - r[1] / RES, u2 = r[2] / RES, v2 = 1 - r[3] / RES; uv.setXY(i * 4, u1, v1); uv.setXY(i * 4 + 1, u2, v1); uv.setXY(i * 4 + 2, u1, v2); uv.setXY(i * 4 + 3, u2, v2); });
    const me = new THREE.Mesh(ge, mat); me.position.set((c.from[0] + c.to[0]) / 2 * PX, ((c.from[1] + c.to[1]) / 2 - 40) * PX, (c.from[2] + c.to[2]) / 2 * PX); body.add(me);
  }
  // resplandor del portal temporal y estela
  const gc = document.createElement('canvas'); gc.width = gc.height = 64; const gx = gc.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(120,220,255,.55)'); gr.addColorStop(1, 'rgba(60,140,255,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
  const glowTex = new THREE.CanvasTexture(gc), mk = (col, op) => { const m2 = new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); mats.push(m2); return m2; };
  const halo = new THREE.Sprite(mk(0x9be7ff, .8)); halo.scale.set(9, 9, 1); g.add(halo);
  const trail = []; for (let i = 0; i < 10; i++) { const sp = new THREE.Sprite(mk(i % 2 ? 0xffd34a : 0x6ad8ff, 0)); g.add(sp); sp.visible = false; trail.push(sp); }
  g.visible = false; parent.add(g);
  let run = null, spin = 0;
  const api = {
    group: g,
    // vuela en línea recta de A a B durante `dur` segundos (posiciones en el mismo sistema que `parent`), dando vueltas; `scale` multiplica el tamaño
    fly(A, B, dur, scale) { run = { A: A.clone(), B: B.clone(), dur, t: 0, scale: scale || 4, ph: Math.random() * 6 }; g.visible = true; g.scale.setScalar(run.scale); halo.scale.set(9, 9, 1).multiplyScalar(1); },
    update(dt) {
      if (!run) return; run.t += dt; const k = run.t / run.dur;
      if (k >= 1) { g.visible = false; run = null; return; }
      const e = k * k * (3 - 2 * k) * .35 + k * .65; g.position.lerpVectors(run.A, run.B, e);
      spin += dt; body.rotation.set(Math.sin(spin * .9 + run.ph) * .45, spin * 1.35, Math.sin(spin * .7) * .3);
      halo.material.opacity = .55 + .3 * Math.sin(spin * 9); const sc = 9 * (1 + .12 * Math.sin(spin * 7)); halo.scale.set(sc, sc, 1);
      const dir = new V3().subVectors(run.B, run.A).normalize();
      trail.forEach((sp, i) => { const u = (i + 1) / trail.length; sp.visible = true; sp.position.copy(dir).multiplyScalar(-u * 6.5 * (1 + run.scale * .2)); sp.position.x += Math.sin(spin * 5 + i) * .25; sp.material.opacity = (1 - u) * .55 * Math.min(1, run.t * 3); const s2 = (1 - u * .7) * 5; sp.scale.set(s2, s2, 1); });
    },
    active: () => !!run,
    dispose() { parent.remove(g); mats.forEach(m2 => m2.dispose()); geos.forEach(x => x.dispose()); tex.dispose(); glowTex.dispose(); },
  };
  return api;
};
'''
out = 'personajes/redbird/Skills/Code/Ojo del Cosmos/maquina-tiempo.js'
open(out, 'w', encoding='utf-8', newline='').write(src.replace('__DATA__', data))
print('ok', len(data))
