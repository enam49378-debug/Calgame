// Minimapa: la ciudad desde arriba con zoom centrado en el jugador
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_UI = window.CF_UI || {};

window.CF_UI.crearMinimapa = function crearMinimapa(D) {
  'use strict';
  const { $, CITY, FPS, G, HUD_CFG, MAPCUR, SEA, SHORE, STAGE, TAU, cam, cineGrade, clamp, endCamScript, fwd, hudSyncUI, mapNow, worldBig } = D;

// Desactivar cinemáticas: no se ven las cámaras animadas ni las escenas; se ve la acción desde fuera, como la ven los demás jugadores
const CFG_CINE = { off: false };
try { CFG_CINE.off = localStorage.getItem('bsb_nocine') === '1'; } catch (e) { }
{
  const nc = $('opt-nocine');
  if (nc) { nc.checked = CFG_CINE.off; nc.addEventListener('change', () => { CFG_CINE.off = nc.checked; try { localStorage.setItem('bsb_nocine', CFG_CINE.off ? '1' : '0'); } catch (e) { } if (CFG_CINE.off && G.cine) { G.cine = null; endCamScript(); cineGrade(false); document.body.classList.remove('cine'); } }); }
}
const MM = { on: true, bg: null, bgW: 512, t: 0, cx: 0, cz: 16, half: 145, zoom: 2.0 };
function mmApply() { const m = mapNow().mm; MM.cx = m.cx; MM.cz = m.cz; MM.half = m.half; MM.bgW = (worldBig() && MAPCUR.id !== 'A') ? 1024 : 512; MM.bg = null; }   // el minimapa sigue al mapa actual
mmApply(); if (window.CF_BETA) CF_BETA.subscribe(() => mmApply());
try {
  MM.on = localStorage.getItem('bsb_minimap') !== '0';
  const z0 = parseFloat(localStorage.getItem('bsb_mm_zoom'));
  if (Number.isFinite(z0)) MM.zoom = clamp(z0, 1.0, 3.0);
} catch (e) { }
{
  const fo = $('opt-fps'), mo = $('opt-mm'), mz = $('mm-zoom'), mzv = $('mm-zoom-o');
  if (fo) { try { fo.checked = localStorage.getItem('bsb_fps') === '1'; } catch (e) { } fo.addEventListener('change', () => { FPS.on = fo.checked; try { localStorage.setItem('bsb_fps', FPS.on ? '1' : '0'); } catch (e) { } if (FPS.el) FPS.el.style.display = FPS.on ? 'block' : 'none'; }); }
  if (mo) { mo.checked = MM.on; mo.addEventListener('change', () => { MM.on = mo.checked; try { localStorage.setItem('bsb_minimap', MM.on ? '1' : '0'); } catch (e) { } }); }
  if (mz) {
    mz.value = MM.zoom;
    if (mzv) mzv.textContent = MM.zoom.toFixed(1) + '×';
    mz.addEventListener('input', () => {
      MM.zoom = clamp(parseFloat(mz.value) || 2.0, 1.0, 3.0);
      if (mzv) mzv.textContent = MM.zoom.toFixed(1) + '×';
      try { localStorage.setItem('bsb_mm_zoom', String(MM.zoom)); } catch (e) { }
    });
  }
}
const mmX = (x, W) => ((x - MM.cx) / MM.half * .5 + .5) * W, mmZ = (z, W) => ((z - MM.cz) / MM.half * .5 + .5) * W;
function mmBackground(W) {
  const c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d', { willReadFrequently: true }), k = W / (2 * MM.half);
  g.fillStyle = '#365a3c'; g.fillRect(0, 0, W, W);
  // mar y arena (al sur, z positivo)
  for (let px = 0; px < W; px++) {
    const x = MM.cx + (px / W - .5) * 2 * MM.half, sz = mmZ(SHORE(x), W);
    g.fillStyle = '#c9b27a'; g.fillRect(px, sz - 7 * k, 1, 7 * k + 1);
    g.fillStyle = '#25638c'; g.fillRect(px, sz, 1, W - sz);
  }
  const mmB = worldBig() && MAPCUR.id !== 'A';
  if (!mmB) {
  // Islas del mar en el minimapa
  g.fillStyle = '#727984'; g.beginPath(); g.arc(mmX(-82, W), mmZ(152, W), 12 * k, 0, TAU); g.fill();
  g.fillStyle = '#ff5252'; g.beginPath(); g.arc(mmX(-82, W), mmZ(152, W), 3.2 * k, 0, TAU); g.fill();
  g.fillStyle = '#dfc686'; g.beginPath(); g.arc(mmX(78, W), mmZ(144, W), 13 * k, 0, TAU); g.fill();
  g.fillStyle = '#388e3c'; g.beginPath(); g.arc(mmX(78, W), mmZ(144, W), 5 * k, 0, TAU); g.fill();
  }
  if (worldBig() && CITY.mmExtra) CITY.mmExtra(g, (x, z, w, d) => g.fillRect(mmX(x - w / 2, W), mmZ(z - d / 2, W), w * k, d * k));
  if (!mmB) {
  // centro pavimentado y calles
  g.fillStyle = '#4c545e'; g.beginPath(); g.arc(mmX(0, W), mmZ(0, W), CITY.core * k, 0, TAU); g.fill();
  g.fillStyle = '#2c3138';
  const road = (x, z, w, d) => g.fillRect(mmX(x - w / 2, W), mmZ(z - d / 2, W), w * k, d * k);
  road(0, 0, 8, 2 * CITY.core); road(0, 0, 2 * CITY.core, 8);
  for (const a of [-22, 22, -44, 44]) { const L = 2 * Math.floor(Math.sqrt(CITY.core * CITY.core - a * a) - 1.5); road(a, 0, 5, L); road(0, a, L, 5); }
  g.fillStyle = '#6e9a62'; for (const pk of CITY.parks) road(pk.x, pk.z, pk.w, pk.d);
  // edificios: más claros los más altos, con borde para que se lean como bloques
  for (const b of CITY.buildings) {
    const l = clamp(58 + (b.h || 8) * 1.1, 60, 86);
    g.fillStyle = `hsl(220 10% ${l}%)`; road(b.x, b.z, b.w, b.d);
    g.strokeStyle = '#0009'; g.lineWidth = 1; g.strokeRect(mmX(b.x - b.w / 2, W) + .5, mmZ(b.z - b.d / 2, W) + .5, b.w * k - 1, b.d * k - 1);
  }
  g.strokeStyle = '#ffffff22'; g.lineWidth = 2; g.beginPath(); g.arc(mmX(0, W), mmZ(0, W), CITY.bounds * k, 0, TAU); g.stroke();
  }
  return c;
}
function mmDraw() {
  const cv = $('minimap'); if (!cv) return;
  const vis = MM.on && !HUD_CFG.all && G.state === 'play' && !G.cine && !G.viewer && !STAGE.on && !!G.player;
  cv.classList.toggle('hidden', !vis); $('hud').classList.toggle('mm', vis);
  if (!vis) return;
  if (G.player.abyss && window.CF_ABISMO && CF_ABISMO.mini && CF_ABISMO.mini(cv.getContext('2d'), cv.width, G.player, cam.yaw)) return;   // el abismo tiene su propio mapa
  const W = cv.width, g = cv.getContext('2d');
  if (!MM.bg && CITY.buildings.length) MM.bg = mmBackground(MM.bgW);
  const p = G.player;
  const zoom = clamp(MM.zoom || 2.0, 1.0, 3.0);
  const viewHalf = MM.half / zoom;
  // Centro de cámara del minimapa sigue al jugador con suavidad dentro de los límites del mundo
  const maxOff = Math.max(0, MM.half - viewHalf);
  const vcx = clamp(p.pos.x, MM.cx - maxOff, MM.cx + maxOff);
  const vcz = clamp(p.pos.z, MM.cz - maxOff, MM.cz + maxOff);
  const toX = x => ((x - vcx) / viewHalf * .5 + .5) * W;
  const toZ = z => ((z - vcz) / viewHalf * .5 + .5) * W;

  g.clearRect(0, 0, W, W);
  if (MM.bg) {
    const B = MM.bgW;
    const sx = ((vcx - viewHalf - (MM.cx - MM.half)) / (2 * MM.half)) * B;
    const sy = ((vcz - viewHalf - (MM.cz - MM.half)) / (2 * MM.half)) * B;
    const sw = (viewHalf / MM.half) * B;
    g.drawImage(MM.bg, sx, sy, sw, sw, 0, 0, W, W);
  }
  const clampP = v => clamp(v, 10, W - 10);
  const px = clampP(toX(p.pos.x)), pz = clampP(toZ(p.pos.z)), cy = cam.yaw, R = 58;
  // cono de lo que ve la cámara
  const grd = g.createRadialGradient(px, pz, 4, px, pz, R); grd.addColorStop(0, '#ffffff55'); grd.addColorStop(1, '#ffffff00');
  g.fillStyle = grd; g.beginPath(); g.moveTo(px, pz);
  for (let i = 0; i <= 8; i++) { const a = cy - .55 + i / 8 * 1.1; g.lineTo(px + Math.sin(a) * R, pz + Math.cos(a) * R); }
  g.closePath(); g.fill();

  // Barcos, tiburones y ballena en el mar
  if (SEA.boats) {
    for (const b of SEA.boats) {
      const bx = toX(b.mesh.position.x), bz = toZ(b.mesh.position.z);
      if (bx > 4 && bx < W - 4 && bz > 4 && bz < W - 4) {
        g.fillStyle = '#f5efe2'; g.fillRect(bx - 3, bz - 2, 6, 4);
      }
    }
  }
  if (SEA.sharks && SEA.sharksOn !== false) {
    for (const s of SEA.sharks) {
      if (!s.mesh.visible) continue;
      const sx = toX(s.x), sz = toZ(s.z);
      if (sx > 6 && sx < W - 6 && sz > 6 && sz < W - 6) {
        g.fillStyle = '#ff5757';
        g.beginPath(); g.arc(sx, sz, 3.2, 0, TAU); g.fill();
      }
    }
  }
  if (SEA.whale && SEA.whale.active) {
    const wx = clampP(toX(SEA.whale.mesh.position.x)), wz = clampP(toZ(SEA.whale.mesh.position.z));
    g.strokeStyle = '#4fd4ff'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(wx, wz, 9 + Math.sin(performance.now() * .01) * 3, 0, TAU); g.stroke();
  }

  // los demás: puntos del color de su personaje (si están fuera del zoom, se pegan al borde para orientarte)
  for (const f of G.fighters) {
    if (f === p || !f.alive || f.dummy) continue;
    const rx = toX(f.pos.x), rz = toZ(f.pos.z);
    const x = clampP(rx), z = clampP(rz), out = (rx !== x || rz !== z);
    const r = f.remote ? 8 : (out ? 5.5 : 6.8);
    g.beginPath(); g.arc(x, z, r + 2.2, 0, TAU); g.fillStyle = f.remote ? '#fff' : '#000b'; g.fill();
    g.beginPath(); g.arc(x, z, r, 0, TAU); g.fillStyle = f.ch.color; g.fill();
  }
  // yo: flecha hacia donde miro
  const F = fwd(p.yaw), Rr = { x: F.z, z: -F.x };
  g.beginPath(); g.moveTo(px + F.x * 13, pz + F.z * 13); g.lineTo(px - F.x * 8 + Rr.x * 9, pz - F.z * 8 + Rr.z * 9); g.lineTo(px - F.x * 3.5, pz - F.z * 3.5); g.lineTo(px - F.x * 8 - Rr.x * 9, pz - F.z * 8 - Rr.z * 9); g.closePath();
  g.fillStyle = p.alive ? '#d7ff2f' : '#888'; g.strokeStyle = '#000'; g.lineWidth = 3; g.stroke(); g.fill();
}
setInterval(mmDraw, 66);

  return { CFG_CINE, MM, mmApply, mmBackground, mmDraw, mmX, mmZ };
};
