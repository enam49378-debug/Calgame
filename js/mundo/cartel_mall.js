// Cartel publicitario del centro comercial
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_MUNDO = window.CF_MUNDO || {};

window.CF_MUNDO.crearCartelMall = function crearCartelMall(D) {
  'use strict';
  const { COL, camera, scene } = D;

// ====================================================================
// CARTEL PUBLICITARIO DIGITAL ANIMADO EN EL TECHO DEL CENTRO COMERCIAL
// ====================================================================
const MALL_BB = {
  root: null,
  canvas: null,
  ctx: null,
  texture: null,
  material: null,
  slides: [
    { src: 'assets/billboard/ad1.jpg', tag: 'MEME DEL DÍA', title: 'PELIGRO EN LA PLAYA: HELICÓPTERO' },
    { src: 'assets/billboard/ad2.jpg', tag: 'DUELO ÉPICO', title: 'JAVI VS SEKZA: CHOQUE DE TITANES' },
    { src: 'assets/billboard/ad3.jpg', tag: 'MOMENTO VIRAL', title: 'CALFIGHT COMMUNITY HIGHLIGHT' },
    { src: 'assets/calfight_banner.png', tag: 'TORNEO OFICIAL', title: '¡GRAN FINAL DE CALFIGHT 2026!' },
    { src: 'assets/billboard/ad_mar.jpg', tag: 'NUEVA ACTUALIZACIÓN', title: '¡ACTUALIZACIÓN DEL MAR PROFUNDO!' },
    { src: 'assets/banner_calfight_discord.png', tag: 'COMUNIDAD', title: 'ÚNETE A NUESTRO DISCORD' }
  ],
  current: 0,
  prev: 0,
  timer: 5.5,
  transT: 0,
  transDur: 0.65,
  transitioning: false,
  transType: 0,
  tickerX: 0,
  animTime: 0,
  lastDraw: 0,
  tickerText: '🔥 ¡BIENVENIDOS AL CENTRO COMERCIAL AURORA!  •  🌊 NUEVA ACTUALIZACIÓN DEL MAR: MAR PROFUNDO OSCURO, MEDUSAS LUMINOSAS, MANTARRAYAS Y EVENTOS MARINOS  •  🦈 ATENCIÓN: LOS TIBURONES SOLO SALEN EN EL MAR MÁS PROFUNDO  •  🐋 ¡AVISTAMIENTOS DE LA BALLENA GIGANTE EN LA COSTA!  •  🍹 DISFRUTA DE BEBIDAS Y REFRESCOS EN EL CHIRINGUITO DE LA PLAYA  •  🥊 TORNEO CALFIGHT: ¡DEMUESTRA QUIÉN ES EL VERDADERO CAMPEÓN!  •  ⚔️ RECUERDA ASIGNAR TUS CONTROLES Y COMBOS FAVORITOS EN OPCIONES  •  🏆 TABLA DE LÍDERES: ¡MANTÉN PULSADO TAB PARA VER TUS KILLS Y MUERTES!  •  '
};

function pickNextMallSlide() {
  const n = MALL_BB.slides.length;
  if (n <= 1) return 0;
  let next;
  do {
    next = Math.floor(Math.random() * n);
  } while (next === MALL_BB.current);
  return next;
}

function initMallBillboard() {
  if (MALL_BB.root) return;
  const W = 1024, H = 512;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  MALL_BB.canvas = cv;
  MALL_BB.ctx = ctx;

  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  MALL_BB.texture = tex;
  MALL_BB.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });

  // Carga previa de imágenes
  MALL_BB.slides.forEach(sl => {
    const im = new Image();
    im.onload = () => { sl.img = im; sl.loaded = true; MALL_BB.lastDraw = 0; };
    im.onerror = () => { sl.loaded = false; };
    im.src = sl.src;
  });

  // Estructura 3D en el techo del Centro Comercial (x: 0, z: 53.5, y: 9.5)
  const root = new THREE.Group();
  root.position.set(0, 9.5, 53.5);
  MALL_BB.root = root;
  scene.add(root);

  const matSteel = new THREE.MeshStandardMaterial({ color: 0x272c36, roughness: 0.75, metalness: 0.5 });
  const matBeam = new THREE.MeshStandardMaterial({ color: 0x3d4452, roughness: 0.6, metalness: 0.7 });
  const matNeonY = new THREE.MeshBasicMaterial({ color: 0xd7ff2f });
  const matNeonC = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  const matLamp = new THREE.MeshBasicMaterial({ color: 0xfff6cf });

  // 4 Pilares de soporte (truss legs)
  const legGeo = new THREE.BoxGeometry(0.38, 3.4, 0.38);
  const legPos = [
    [-5.6, 1.7, -1.2],
    [-5.6, 1.7, 1.2],
    [5.6, 1.7, -1.2],
    [5.6, 1.7, 1.2]
  ];
  legPos.forEach(p => {
    const m = new THREE.Mesh(legGeo, matSteel);
    m.position.set(p[0], p[1], p[2]);
    root.add(m);
  });

  // Vigas diagonales y travesaños
  const crossX = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.2, 0.2), matBeam);
  crossX.position.set(0, 1.4, -1.2); root.add(crossX);
  const crossX2 = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.2, 0.2), matBeam);
  crossX2.position.set(0, 1.4, 1.2); root.add(crossX2);
  const crossZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2.4), matBeam);
  crossZ1.position.set(-5.6, 2.4, 0); root.add(crossZ1);
  const crossZ2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2.4), matBeam);
  crossZ2.position.set(5.6, 2.4, 0); root.add(crossZ2);

  // Pasarela de mantenimiento (catwalk)
  const catwalk = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.22, 3.2), matSteel);
  catwalk.position.set(0, 3.3, 0); root.add(catwalk);
  // Barandillas de seguridad
  const railN = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.85, 0.08), matBeam);
  railN.position.set(0, 3.8, -1.56); root.add(railN);
  const railS = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.85, 0.08), matBeam);
  railS.position.set(0, 3.8, 1.56); root.add(railS);

  // Marco de la pantalla principal (center y: 7.4)
  const frame = new THREE.Mesh(new THREE.BoxGeometry(15.4, 8.0, 0.62), new THREE.MeshStandardMaterial({ color: 0x12141a, roughness: 0.85 }));
  frame.position.set(0, 7.4, 0); root.add(frame);

  // Bordes neón perimetrales
  const neonTop = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.12, 0.68), matNeonY);
  neonTop.position.set(0, 11.42, 0); root.add(neonTop);
  const neonBot = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.12, 0.68), matNeonC);
  neonBot.position.set(0, 3.38, 0); root.add(neonBot);
  const neonL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 8.08, 0.68), matNeonY);
  neonL.position.set(-7.72, 7.4, 0); root.add(neonL);
  const neonR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 8.08, 0.68), matNeonY);
  neonR.position.set(7.72, 7.4, 0); root.add(neonR);

  // Cartel superior "CALFIGHT"
  const topSign = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.72, 0.25), new THREE.MeshStandardMaterial({ color: 0x0c0e14 }));
  topSign.position.set(0, 11.82, 0); root.add(topSign);
  const topSignGlow = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.14, 0.28), matNeonY);
  topSignGlow.position.set(0, 11.82, 0); root.add(topSignGlow);

  // Focos superiores dirigidos al cartel (3 en cara norte, 3 en cara sur)
  [-4.5, 0, 4.5].forEach(fx => {
    const lampF = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.45), matBeam);
    lampF.position.set(fx, 11.55, -0.6); lampF.rotation.x = -0.35; root.add(lampF);
    const bulbF = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.35), matLamp);
    bulbF.position.set(fx, 11.48, -0.6); root.add(bulbF);

    const lampB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.45), matBeam);
    lampB.position.set(fx, 11.55, 0.6); lampB.rotation.x = 0.35; root.add(lampB);
    const bulbB = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.35), matLamp);
    bulbB.position.set(fx, 11.48, 0.6); root.add(bulbB);
  });

  // Pantalla Frontal (mira hacia el norte, hacia el centro/plaza/torre aurora)
  const screenF = new THREE.Mesh(new THREE.PlaneGeometry(14.7, 7.4), MALL_BB.material);
  screenF.position.set(0, 7.4, -0.32);
  screenF.rotation.y = Math.PI;
  root.add(screenF);

  // Pantalla Trasera (mira hacia el sur, hacia el bulevar y la playa)
  const screenB = new THREE.Mesh(new THREE.PlaneGeometry(14.7, 7.4), MALL_BB.material);
  screenB.position.set(0, 7.4, 0.32);
  screenB.rotation.y = 0;
  root.add(screenB);

  // Colisión para permitir caminar sobre la pasarela o el marco
  COL.push({ x: 0, z: 53.5, hx: 7.8, hz: 1.6, y0: 9.5, h: 21.2 });
}

function drawMallSlideImage(ctx, slide, x, y, w, h) {
  const img = slide.img;
  if (!img || !img.complete || !img.naturalWidth) {
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CARGANDO CALFIGHT TV...', x + w / 2, y + h / 2 - 10);
    ctx.fillStyle = '#d7ff2f';
    ctx.font = '16px monospace';
    ctx.fillText(slide.title || '', x + w / 2, y + h / 2 + 25);
    return;
  }
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const rw = w / iw, rh = h / ih;
  const r = Math.min(rw, rh);
  const dw = iw * r, dh = ih * r;
  const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;

  // Fondo ambiental para llenar laterales
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.fillStyle = 'rgba(7, 10, 18, 0.82)';
  ctx.fillRect(x, y, w, h);
  // Imagen centrada nítida
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function renderMallBillboardCanvas() {
  const ctx = MALL_BB.ctx;
  if (!ctx) return;
  const W = 1024, H = 512;
  const vx = 16, vy = 52, vw = 992, vh = 408;

  ctx.fillStyle = '#060810';
  ctx.fillRect(0, 0, W, H);

  const cur = MALL_BB.slides[MALL_BB.current] || MALL_BB.slides[0];
  const prv = MALL_BB.slides[MALL_BB.prev] || cur;

  if (!MALL_BB.transitioning) {
    drawMallSlideImage(ctx, cur, vx, vy, vw, vh);
  } else {
    const p = Math.min(1, Math.max(0, MALL_BB.transT / MALL_BB.transDur));
    const mode = MALL_BB.transType % 4;

    if (mode === 0) {
      // 1. Cyber-Wipe horizontal con haz láser neón
      const splitX = vx + p * vw;
      ctx.save();
      ctx.beginPath(); ctx.rect(vx, vy, splitX - vx, vh); ctx.clip();
      drawMallSlideImage(ctx, cur, vx, vy, vw, vh);
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.rect(splitX, vy, vx + vw - splitX, vh); ctx.clip();
      drawMallSlideImage(ctx, prv, vx, vy, vw, vh);
      ctx.restore();

      const g = ctx.createLinearGradient(splitX - 16, 0, splitX + 16, 0);
      g.addColorStop(0, 'rgba(0, 229, 255, 0)');
      g.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      g.addColorStop(0.7, 'rgba(215, 255, 47, 0.9)');
      g.addColorStop(1, 'rgba(215, 255, 47, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(splitX - 16, vy, 32, vh);
      for (let k = 0; k < 6; k++) {
        const gy = vy + Math.random() * vh, gw = 18 + Math.random() * 45, gh = 4 + Math.random() * 10;
        ctx.fillStyle = k % 2 ? '#00e5ff' : '#d7ff2f';
        ctx.fillRect(splitX - 25 + Math.random() * 50, gy, gw, gh);
      }
    } else if (mode === 1) {
      // 2. Glitch Horizontal Slices
      const slices = 12;
      const sh = vh / slices;
      for (let s = 0; s < slices; s++) {
        const sy = vy + s * sh;
        const dir = (s % 2 === 0) ? 1 : -1;
        const shift = (1 - p) * dir * (180 + Math.sin(p * 8 + s) * 90);
        ctx.save();
        ctx.beginPath(); ctx.rect(vx, sy, vw, sh); ctx.clip();
        if (p < 0.5) {
          drawMallSlideImage(ctx, prv, vx + shift * 0.4, vy, vw, vh);
        } else {
          drawMallSlideImage(ctx, cur, vx - shift * 0.4, vy, vw, vh);
        }
        if (Math.random() < 0.35) {
          ctx.fillStyle = s % 2 ? 'rgba(0, 229, 255, 0.28)' : 'rgba(215, 255, 47, 0.28)';
          ctx.fillRect(vx, sy, vw, sh);
        }
        ctx.restore();
      }
    } else if (mode === 2) {
      // 3. Persianas Digitales con desvanecimiento cromático
      const cols = 14;
      const cw = vw / cols;
      for (let c = 0; c < cols; c++) {
        const cx = vx + c * cw;
        const colP = Math.min(1, Math.max(0, (p - c * 0.04) / 0.55));
        ctx.save();
        ctx.beginPath(); ctx.rect(cx, vy, cw, vh); ctx.clip();
        if (colP < 0.5) {
          drawMallSlideImage(ctx, prv, vx, vy, vw, vh);
          ctx.fillStyle = `rgba(0, 229, 255, ${colP * 0.8})`;
          ctx.fillRect(cx, vy, cw, vh);
        } else {
          drawMallSlideImage(ctx, cur, vx, vy, vw, vh);
          ctx.fillStyle = `rgba(215, 255, 47, ${(1 - colP) * 0.8})`;
          ctx.fillRect(cx, vy, cw, vh);
        }
        ctx.restore();
      }
    } else {
      // 4. Flash Zoom & CRT Scanline Static Burn
      if (p < 0.5) {
        const scale = 1 + p * 0.12;
        ctx.save();
        ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
        ctx.translate(vx + vw / 2, vy + vh / 2);
        ctx.scale(scale, scale);
        drawMallSlideImage(ctx, prv, -vw / 2, -vh / 2, vw, vh);
        ctx.fillStyle = `rgba(255, 255, 255, ${p * 1.6})`;
        ctx.fillRect(-vw / 2, -vh / 2, vw, vh);
        ctx.restore();
      } else {
        const scale = 1 + (1 - p) * 0.12;
        ctx.save();
        ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
        ctx.translate(vx + vw / 2, vy + vh / 2);
        ctx.scale(scale, scale);
        drawMallSlideImage(ctx, cur, -vw / 2, -vh / 2, vw, vh);
        ctx.fillStyle = `rgba(0, 229, 255, ${(1 - p) * 1.4})`;
        ctx.fillRect(-vw / 2, -vh / 2, vw, vh);
        ctx.restore();
      }
    }
  }

  // Líneas de escaneo sutiles (look de pantalla gigante LED)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
  for (let y = vy; y < vy + vh; y += 4) {
    ctx.fillRect(vx, y, vw, 2);
  }

  // Viñeta y marco interior de la pantalla
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(vx, vy, vw, vh);

  // Barra Superior (Header Broadcast)
  ctx.fillStyle = '#0b0f1a';
  ctx.fillRect(0, 0, W, 48);
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(0, 46, W, 2);

  // Indicador "● EN VIVO"
  const pulse = Math.sin(MALL_BB.animTime * 5.5) * 0.5 + 0.5;
  ctx.beginPath();
  ctx.arc(32, 24, 7, 0, Math.PI * 2);
  ctx.fillStyle = pulse > 0.4 ? '#ff3b30' : '#771512';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('EN VIVO · 4K', 47, 30);

  // Etiqueta de Categoría
  const tagText = cur.tag || 'DESTACADO';
  ctx.font = 'bold 14px sans-serif';
  const tagW = ctx.measureText(tagText).width + 18;
  ctx.fillStyle = '#d7ff2f';
  ctx.fillRect(160, 11, tagW, 26);
  ctx.fillStyle = '#0a0d14';
  ctx.fillText(tagText, 169, 29);

  // Título del anuncio / meme
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 17px sans-serif';
  ctx.fillText(cur.title || 'CALFIGHT TRANSMISIÓN', 175 + tagW, 30);

  // Reloj / Uptime
  const mins = Math.floor(MALL_BB.animTime / 60);
  const secs = Math.floor(MALL_BB.animTime % 60);
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  ctx.fillStyle = '#7a8ba8';
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`CALFIGHT TV • ${timeStr}`, W - 24, 30);

  // Barra Inferior (News Ticker Marquee)
  ctx.fillStyle = '#070912';
  ctx.fillRect(0, 464, W, 48);
  ctx.fillStyle = '#d7ff2f';
  ctx.fillRect(0, 464, W, 2);

  // Píldora fija "NOTICIAS"
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(16, 472, 125, 32);
  ctx.fillStyle = '#060a12';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📢 NOTICIAS', 78, 493);

  // Ticker de texto en marquesina
  ctx.save();
  ctx.beginPath();
  ctx.rect(155, 464, W - 175, 48);
  ctx.clip();
  ctx.fillStyle = '#f4f6fa';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  const tw = ctx.measureText(MALL_BB.tickerText).width;
  const off = (MALL_BB.tickerX % tw);
  ctx.fillText(MALL_BB.tickerText, 155 + off, 495);
  ctx.fillText(MALL_BB.tickerText, 155 + off + tw, 495);
  ctx.restore();

  // Marca de agua en esquina inferior derecha
  ctx.fillStyle = 'rgba(215, 255, 47, 0.85)';
  ctx.font = 'italic 900 22px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('CALFIGHT', vx + vw - 18, vy + vh - 16);

  MALL_BB.texture.needsUpdate = true;
}

function updateMallBillboard(dt) {
  if (!MALL_BB.root) return;
  MALL_BB.animTime += dt;
  MALL_BB.tickerX -= dt * 95;

  // Lógica de cambio de diapositiva
  if (!MALL_BB.transitioning) {
    MALL_BB.timer -= dt;
    if (MALL_BB.timer <= 0) {
      MALL_BB.prev = MALL_BB.current;
      MALL_BB.current = pickNextMallSlide();
      MALL_BB.transitioning = true;
      MALL_BB.transT = 0;
      MALL_BB.transType = (MALL_BB.transType + 1) % 4;
    }
  } else {
    MALL_BB.transT += dt;
    if (MALL_BB.transT >= MALL_BB.transDur) {
      MALL_BB.transitioning = false;
      MALL_BB.timer = 5.5;
    }
  }

  // Si la cartelera del mall no se dibuja en pantalla, ahorrar canvas 2D y subida de textura
  if (!MALL_BB.root.visible) return;
  const cp = camera.position;
  const distSq = cp.x * cp.x + (cp.z - 53.5) * (cp.z - 53.5);
  if (distSq > 72900) return; // Más de 270 unidades de distancia

  const now = performance.now();
  const minInterval = MALL_BB.transitioning ? 28 : (distSq > 22500 ? 90 : 45);
  if (now - MALL_BB.lastDraw >= minInterval) {
    MALL_BB.lastDraw = now;
    renderMallBillboardCanvas();
  }
}

  return { MALL_BB, initMallBillboard, updateMallBillboard };
};
