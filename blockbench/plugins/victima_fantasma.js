/* Víctima fantasma — plugin de Blockbench (4.8 o superior, programa y versión web)
 *
 * Muestra a la víctima en la vista 3D mientras animas al atacante, SIN que la víctima esté dentro del modelo.
 * Funciona así: la víctima es una copia del modelo del proyecto (mismo esqueleto) y se anima con OTRA animación del mismo proyecto
 * (por ejemplo "cine_vic_paliza" para "cine_paliza"). Se mueve con el tiempo de la línea de tiempo: reproduce y la verás reaccionar.
 *
 * Uso: Animación ▸ Víctima fantasma…   (o el interruptor "Mostrar víctima")
 *   - Animación de la víctima: automática (cine_X → cine_vic_X, X_vic, vic_X) o la que elijas.
 *   - Posición y giro: dónde está la víctima respecto al atacante (en unidades de Blockbench; 16 = 1 metro).
 *   - Trayectoria (vpos): pega la lista vpos del juego y la víctima seguirá esa trayectoria: [[t, x, y, z, giro], ...] (metros y radianes).
 */
(function () {
  const ID = 'victima_fantasma';
  let toggle, openAction, prop, root = null, pairs = [], posing = false, lastSig = '', handlers = [], cfgCache = null;
  const DEF = { on: false, anim: 'auto', x: 0, y: 0, z: -24, yaw: 180, color: '#8b6bff', opacity: 0.8, texture: false, invertZ: true, vpos: '' };

  const cfg = () => {
    if (!Project) return Object.assign({}, DEF);
    let c = null; try { c = JSON.parse((prop && Project.bs_vic_cfg) || 'null'); } catch (e) { }
    if (!c) { try { c = JSON.parse(localStorage.getItem('bs_vic_cfg_' + (Project.name || '')) || 'null'); } catch (e) { } }
    return Object.assign({}, DEF, c || {});
  };
  const saveCfg = c => { if (!Project) return; const s = JSON.stringify(c); if (prop) Project.bs_vic_cfg = s; try { localStorage.setItem('bs_vic_cfg_' + (Project.name || ''), s); } catch (e) { } };

  // ----- animación de la víctima
  const autoName = a => {
    if (!a) return null; const n = a.name;
    const cands = [n.replace(/^cine_/, 'cine_vic_'), n + '_vic', 'vic_' + n, n.replace(/^(\w+?)_/, '$1_vic_')];
    for (const c of cands) { if (c === n) continue; const f = Animation.all.find(x => x.name === c); if (f) return f; }
    return null;
  };
  const victimAnim = () => {
    const c = cfg(); if (c.anim && c.anim !== 'auto' && c.anim !== 'none') return Animation.all.find(a => a.name === c.anim) || null;
    if (c.anim === 'none') return null; return autoName(Animation.selected);
  };

  // ----- trayectoria vpos del juego: [[t, x(derecha), y, z(adelante), giro, 'i'|'o'|'c'], ...]
  const parseVpos = text => {
    if (!text || !text.trim()) return null;
    let s = text.trim(); const i = s.indexOf('['), j = s.lastIndexOf(']'); if (i < 0 || j < i) return null; s = s.slice(i, j + 1);
    s = s.replace(/(^|[^\d])\.(\d)/g, '$10.$2');
    try { const a = (new Function('return ' + s))(); return Array.isArray(a) && a.length && Array.isArray(a[0]) ? a.map(k => ({ t: +k[0] || 0, x: +k[1] || 0, y: +k[2] || 0, z: +k[3] || 0, yaw: +k[4] || 0, f: k[5] || '' })) : null; } catch (e) { return null; }
  };
  const pathAt = (keys, t) => {
    if (!keys) return { x: 0, y: 0, z: 0, yaw: 0 };
    if (t <= keys[0].t) return keys[0]; const L = keys[keys.length - 1]; if (t >= L.t) return L;
    let i = 0; while (i < keys.length - 2 && t >= keys[i + 1].t) i++;
    const a = keys[i], b = keys[i + 1]; let u = (t - a.t) / ((b.t - a.t) || 1);
    if (b.f === 'c') return a; if (b.f === 'i') u = u * u * u; else if (b.f === 'o') u = 1 - Math.pow(1 - u, 3); else u = u * u * (3 - 2 * u);
    const l = k => a[k] + (b[k] - a[k]) * u; return { x: l('x'), y: l('y'), z: l('z'), yaw: l('yaw') };
  };

  // ----- el fantasma
  const destroy = () => { if (root) { if (root.parent) root.parent.remove(root); root.traverse(o => { if (o.isMesh && o.userData.bsMat) o.material.dispose(); }); } root = null; pairs = []; };
  const build = () => {
    destroy(); const c = cfg(); if (!c.on || !Project || !Project.model_3d) return;
    const src = Project.model_3d, srcObjs = [], clone = src.clone(true), cloObjs = [];
    src.traverse(o => srcObjs.push(o)); clone.traverse(o => cloObjs.push(o));
    if (srcObjs.length !== cloObjs.length) return;
    clone.name = 'bs_victima'; root = new THREE.Group(); root.name = 'bs_victima_root'; root.add(clone); root.userData.clone = clone;
    if (!c.texture) cloObjs.forEach(o => { if (o.isMesh) { o.material = new THREE.MeshLambertMaterial({ color: c.color, transparent: true, opacity: c.opacity, depthWrite: false }); o.userData.bsMat = true; o.castShadow = false; } });
    const map = new Map(); srcObjs.forEach((o, i) => map.set(o, cloObjs[i]));
    pairs = Group.all.map(g => [g, map.get(g.mesh)]).filter(p => p[1]);
    clone.position.copy(src.position); clone.rotation.copy(src.rotation); clone.scale.copy(src.scale);
    Canvas.scene.add(root); place();
  };
  const place = () => {
    if (!root) return; const c = cfg(), keys = parseVpos(c.vpos), p = pathAt(keys, Timeline.time || 0), zs = c.invertZ ? -1 : 1;
    root.position.set(c.x + p.x * 16, c.y + p.y * 16, c.z + p.z * 16 * zs); root.rotation.y = THREE.MathUtils.degToRad(c.yaw) + (c.invertZ ? -1 : 1) * p.yaw;
  };
  const pose = () => {
    if (posing || !root || !Project) return; const va = victimAnim(); posing = true;
    try {
      const saved = Group.all.map(g => [g.mesh, g.mesh.position.clone(), g.mesh.rotation.clone(), g.mesh.scale.clone()]);
      Animator.showDefaultPose(true);
      if (va) for (const k in va.animators) { const an = va.animators[k]; if (an && an.displayFrame && an.getGroup) { try { an.getGroup(); an.displayFrame(1); } catch (e) { } } }
      for (const [g, o] of pairs) { o.position.copy(g.mesh.position); o.rotation.copy(g.mesh.rotation); o.scale.copy(g.mesh.scale); }
      for (const [m, p, r, s] of saved) { m.position.copy(p); m.rotation.copy(r); m.scale.copy(s); }
      place();
    } finally { posing = false; }
  };
  const refresh = () => { const sig = [Project && Project.uuid, Animation.selected && Animation.selected.uuid, cfg().on, Project && Project.model_3d && Project.model_3d.children.length].join('|'); if (sig !== lastSig) { lastSig = sig; build(); } pose(); };

  // ----- cuadro de diálogo
  const openDialog = () => {
    if (!Project) return Blockbench.showQuickMessage('Abre un proyecto primero', 2000);
    const c = cfg(), names = { auto: 'Automática (cine_X → cine_vic_X, X_vic, vic_X)', none: 'Ninguna (víctima quieta)' };
    Animation.all.forEach(a => { names[a.name] = a.name; });
    new Dialog({
      id: 'victima_fantasma_dialog', title: 'Víctima fantasma', width: 560,
      form: {
        on: { label: 'Mostrar víctima', type: 'checkbox', value: c.on },
        anim: { label: 'Animación de la víctima', type: 'select', options: names, value: c.anim in names ? c.anim : 'auto' },
        pos: { label: 'Posición (x, y, z)', type: 'vector', dimensions: 3, value: [c.x, c.y, c.z], step: 1 },
        yaw: { label: 'Giro (°)', type: 'number', value: c.yaw, min: -360, max: 360, step: 5 },
        invertZ: { label: 'El modelo mira hacia -Z (Norte)', type: 'checkbox', value: c.invertZ },
        color: { label: 'Color del fantasma', type: 'color', value: c.color },
        opacity: { label: 'Opacidad', type: 'number', value: c.opacity, min: 0.1, max: 1, step: 0.05 },
        texture: { label: 'Usar la textura del modelo', type: 'checkbox', value: c.texture },
        vpos: { label: 'Trayectoria vpos del juego (opcional)', type: 'textarea', value: c.vpos, placeholder: '[[0,0,0,1.5,0],[.5,0,0,1.5,0],[.62,0,3.4,1.8,0,\'o\']]' },
      },
      onConfirm(f) {
        const n = { on: !!f.on, anim: f.anim, x: +f.pos[0], y: +f.pos[1], z: +f.pos[2], yaw: +f.yaw, invertZ: !!f.invertZ, color: String(f.color && f.color.toHexString ? f.color.toHexString() : f.color), opacity: +f.opacity, texture: !!f.texture, vpos: f.vpos || '' };
        saveCfg(n); toggle && toggle.set(n.on); lastSig = ''; refresh(); Canvas.updateView && Canvas.updateView({ elements: [], element_aspects: { transform: true } });
      },
    }).show();
  };

  Plugin.register(ID, {
    title: 'Víctima fantasma', author: 'Blockstrike', icon: 'accessibility_new', version: '1.0.0', min_version: '4.8.0', variant: 'both',
    description: 'Muestra a la víctima en la vista 3D mientras animas, sin que esté dentro del modelo: se anima con otra animación (cine_vic_X) y sigue una trayectoria opcional.',
    tags: ['Animation', 'Cinemáticas'],
    onload() {
      prop = new Property(ModelProject, 'string', 'bs_vic_cfg', { default: '' });
      toggle = new Toggle('victima_fantasma_toggle', {
        name: 'Mostrar víctima', description: 'Muestra u oculta a la víctima fantasma', icon: 'accessibility_new', category: 'animation', default: false,
        onChange(v) { const c = cfg(); c.on = !!v; saveCfg(c); lastSig = ''; refresh(); },
      });
      openAction = new Action('victima_fantasma_config', { name: 'Víctima fantasma…', description: 'Configura la víctima que se ve mientras animas', icon: 'settings_accessibility', category: 'animation', click: openDialog });
      MenuBar.addAction(toggle, 'animation'); MenuBar.addAction(openAction, 'animation');
      for (const ev of ['display_animation_frame', 'select_project', 'timeline_pause', 'finished_edit', 'select_mode']) { const fn = () => refresh(); Blockbench.on(ev, fn); handlers.push([ev, fn]); }
      const sel = () => { toggle && toggle.set(cfg().on); lastSig = ''; refresh(); }; Blockbench.on('select_project', sel); handlers.push(['select_project', sel]);
      setTimeout(sel, 300);
    },
    onunload() {
      handlers.forEach(([e, f]) => Blockbench.removeListener(e, f)); handlers = []; destroy();
      toggle && toggle.delete(); openAction && openAction.delete(); prop && prop.delete();
    },
  });
})();
