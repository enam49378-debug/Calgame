// ====================================================================
// MOTOR DE ESCENA 3D, ILUMINACIÓN, CIELO Y SHADERS CEL-SHADED
// ====================================================================
// Encargado del WebGLRenderer, escena base, cámara principal, luz solar,
// domo de cielo anime, texturas procedurales de bloques y `cityAnimeMaterial`
// (incluyendo los uniforms globales `ZZZ_U`).
window.CF_GRAFICOS = window.CF_GRAFICOS || {};

window.CF_GRAFICOS.crearMotorEscena = function crearMotorEscena(dep = {}) {
  const { $, clamp, V3 = THREE.Vector3, _c = new THREE.Color(), onContextLost, onContextRestored } = dep;
  const WEAK_PC = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2, LOW_PC = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;   // equipo modesto: sin antialias y arranca con menos efectos
  const renderer = (() => {
    try { return new THREE.WebGLRenderer({ antialias: !WEAK_PC && !LOW_PC, powerPreference: 'high-performance' }); }
    catch (e) { return new THREE.WebGLRenderer({ antialias: false }); }
  })();
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); if (onContextLost) onContextLost(); }, false);
  renderer.domElement.addEventListener('webglcontextrestored', () => { try { if (onContextRestored) onContextRestored(); } catch (e) {} }, false);
  // Tonos: 'ninguno' deja los colores de las texturas como se ven en Blockbench (más contraste y brillo); 'aces' es el filtro de cine de antes (más apagado).
  // Se cambia en la consola (F12):  tonos('aces')  o  tonos('ninguno')  y se guarda en tu navegador.
  const TONOS = { aces: THREE.ACESFilmicToneMapping, ninguno: THREE.NoToneMapping };
  renderer.toneMapping = TONOS[(() => { try { return localStorage.getItem('bsb_tonos'); } catch (e) { return null; } })()] ?? TONOS.ninguno;
  renderer.toneMappingExposure = 0.92;
  window.tonos = modo => { if (!(modo in TONOS)) return 'usa tonos("ninguno") o tonos("aces")'; renderer.toneMapping = TONOS[modo]; try { localStorage.setItem('bsb_tonos', modo); } catch (e) { } scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { m.needsUpdate = true; }); }); return modo; };
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, (typeof WEAK_PC !== 'undefined' && (WEAK_PC || LOW_PC)) ? 1.0 : 2.0));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;   // gradación final: más color y contraste, menos apagado
  $('wrap').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  window.scene = scene;
  const SKY = 0x5da8ea;
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(0x82bcf2, 80, 240);
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);

  // Iluminación cel-shaded equilibrada (evita quemar los edificios blancos)
  const IS_LOCAL_HOST = typeof location !== 'undefined' && (/^(localhost|127\.|\[::1\])/.test(location.hostname) || location.protocol === 'file:');
  scene.add(new THREE.HemisphereLight(0xaad8ff, 0x483e32, 0.88));
  const sun = new THREE.DirectionalLight(0xfff6e6, 0.98);
  sun.position.set(30, 55, 18); sun.castShadow = true;
  if (IS_LOCAL_HOST) {
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -54, right: 54, top: 54, bottom: -54, near: 2, far: 185 });
    sun.shadow.bias = -0.00028; sun.shadow.normalBias = .018;
  } else {
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -78, right: 78, top: 78, bottom: -78, near: 0.5, far: 260 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = .025;
  }
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);

  const _shDir = new V3(), _shRight = new V3(), _shUp = new V3(), _shUpRef = new V3();
  function updateSunShadowFocus(dirX, dirY, dirZ, focusX = 0, focusZ = 0, shadowDist = 82) {
    if (typeof ZZZ_U !== 'undefined' && ZZZ_U.beta.value <= 0.5) {
      const gx = Math.round(focusX / 2) * 2, gz = Math.round(focusZ / 2) * 2;
      sun.target.position.set(gx, 0, gz);
      sun.target.updateMatrixWorld();
      sun.position.set(dirX + gx, dirY, dirZ + gz);
      sun.updateMatrixWorld();
      return;
    }
    _shDir.set(dirX, dirY, dirZ);
    if (_shDir.lengthSq() < 1e-6) _shDir.set(0.35, 0.85, 0.25);
    _shDir.normalize();
    if (_shDir.y < 0.28) {
      _shDir.y = 0.28;
      _shDir.normalize();
    }
    const cam = sun.shadow.camera;
    const frustumW = (cam.right - cam.left) || 108;
    const mapW = Math.max(1, sun.shadow.mapSize.x || 1024);
    const texel = frustumW / mapW;
    _shUpRef.set(0, 1, 0);
    if (Math.abs(_shDir.y) > 0.995) _shUpRef.set(0, 0, -1);
    _shRight.crossVectors(_shUpRef, _shDir).normalize();
    _shUp.crossVectors(_shDir, _shRight);
    const px = focusX * _shRight.x + focusZ * _shRight.z;
    const py = focusX * _shUp.x + focusZ * _shUp.z;
    const dx = Math.round(px / texel) * texel - px;
    const dy = Math.round(py / texel) * texel - py;
    sun.target.position.set(
      focusX + _shRight.x * dx + _shUp.x * dy,
      _shRight.y * dx + _shUp.y * dy,
      focusZ + _shRight.z * dx + _shUp.z * dy
    );
    sun.target.updateMatrixWorld();
    sun.position.copy(sun.target.position).addScaledVector(_shDir, shadowDist);
    sun.updateMatrixWorld();
  }

  // Cúpula celeste anime con gradiente vertical (Zenit índigo Shinkai -> Horizonte cálido)
  const ANIME_SKY_TEX = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 512;
    const g = c.getContext('2d', { willReadFrequently: true });
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0.00, '#153c78'); // Zenit: índigo profundo
    gr.addColorStop(0.32, '#2872cb'); // Cielo superior: azul anime vibrante
    gr.addColorStop(0.65, '#56a2e6'); // Medio cielo: celeste luminoso
    gr.addColorStop(0.86, '#94cef6'); // Atmósfera baja
    gr.addColorStop(1.00, '#ffd8b5'); // Resplandor dorado de horizonte
    g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = t.minFilter = THREE.LinearFilter;
    return t;
  })();
  const skyGeo = new THREE.SphereGeometry(380, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ map: ANIME_SKY_TEX, side: THREE.BackSide, depthWrite: false, fog: false });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // ================= Texturas =================
  function noiseRect(g, x, y, w, h, col, amt = 16) {
    const c = new THREE.Color(col), r = c.r * 255, gg = c.g * 255, b = c.b * 255;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (Math.random() - .5) * amt;
      g.fillStyle = `rgb(${clamp(r + k, 0, 255) | 0},${clamp(gg + k, 0, 255) | 0},${clamp(b + k, 0, 255) | 0})`;
      g.fillRect(x + i, y + j, 1, 1);
    }
  }
  function pixTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d', { willReadFrequently: true }), w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    return t;
  }
  const BLOCK_TEX = {
    // Pasto estilo anime Ghibli / BotW: base esmeralda con motas lima luminosas
    grass: pixTex(16, 16, g => {
      g.fillStyle = '#42c050'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#2d913a';
      for (let i = 0; i < 14; i++) g.fillRect((i * 5) % 16, (i * 7) % 16, 2, 2);
      g.fillStyle = '#6eed75';
      for (let i = 0; i < 8; i++) g.fillRect((i * 9 + 3) % 16, (i * 11 + 2) % 16, 1, 2);
    }),
    // Adoquines de anime: piedras redondeadas con juntas limpias y bisel
    cobble: pixTex(16, 16, g => {
      g.fillStyle = '#8291a2'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#515e6e'; // juntas oscuras
      g.strokeRect(0.5, 0.5, 7, 7); g.strokeRect(8.5, 0.5, 7, 7);
      g.strokeRect(4.5, 8.5, 7, 7);
      g.fillStyle = '#a9b8cc'; // brillos superiores
      g.fillRect(1, 1, 6, 1); g.fillRect(9, 1, 6, 1); g.fillRect(5, 9, 6, 1);
    }),
    // Ladrillos cálidos estilizados
    brick: pixTex(16, 16, g => {
      g.fillStyle = '#bf6a54'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#773426'; // líneas de cemento
      g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1);
      g.fillRect(7, 0, 1, 7); g.fillRect(15, 8, 1, 7);
      g.fillStyle = '#db8974'; // resplandor superior
      g.fillRect(0, 1, 7, 1); g.fillRect(8, 9, 7, 1);
    }),
    // Madera anime cálida
    log: pixTex(16, 16, g => {
      g.fillStyle = '#84572e'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#593414';
      for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16);
      g.fillStyle = '#a57342';
      for (let x = 1; x < 16; x += 4) g.fillRect(x, 0, 1, 16);
    }),
    // Hojas de árbol anime
    leaves: pixTex(16, 16, g => {
      g.fillStyle = '#3ab84e'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#217d33';
      for (let i = 0; i < 20; i++) g.fillRect((i * 7) % 16, (i * 11) % 16, 2, 2);
      g.fillStyle = '#6ef07d';
      for (let i = 0; i < 10; i++) g.fillRect((i * 13 + 1) % 16, (i * 9 + 4) % 16, 2, 1);
    }),
    // Tablones limpios
    plank: pixTex(16, 16, g => {
      g.fillStyle = '#c79c5c'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#855e2d';
      [3, 7, 11, 15].forEach(y => g.fillRect(0, y, 16, 1));
      g.fillStyle = '#e5be82';
      [0, 4, 8, 12].forEach(y => g.fillRect(0, y, 16, 1));
    }),
  };

  // Sombreado por bandas y color con más saturación, también cuando se desactiva el posprocesado.
  // Corte transparente (como en los juegos de vista isométrica): lo que queda entre la cámara y el jugador se disuelve con trama,
  // así las paredes y techos de los edificios no tapan al personaje ni obligan a acercar la cámara.
  const CITY_GRAD=(()=>{const t=new THREE.DataTexture(new Uint8Array([75,135,195,245]),4,1,THREE.LuminanceFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;})();
  const CITY_CUT={cam:{value:new THREE.Vector3()},pl:{value:new THREE.Vector3()},on:{value:0}};
  const CUT_GLSL=`
    if(uCutOn>.5){
      vec3 cutAB=uCutPl-uCutCam;float cutL=length(cutAB);vec3 cutD=cutAB/max(cutL,.001);
      float cutS=dot(vCutPos-uCutCam,cutD),cutU=cutL-cutS;
      if(cutS>.15&&cutU>1.7){
        float cutDist=length(vCutPos-(uCutCam+cutD*cutS));
        float cutR=min(2.3,.5*cutS)*smoothstep(1.6,4.4,cutU);
        float cutN=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
        if(cutDist<cutR*(.5+.5*cutN)&&vCutPos.y>uCutPl.y-1.1)discard;
      }
    }
  `;
  // Sombreado de la ciudad: bandas suaves de dibujo animado + color de película (sombras frías, luces cálidas), contorno de cielo y
  // saturación; con opts.cut añade el corte transparente. Los materiales Phong reciben además luz de contorno.
  const HOLE_U = { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 0)) };
  const ZZZ_U = {
    on: { value: 1 },
    beta: { value: IS_LOCAL_HOST ? 1 : 0 },
    night: { value: 0 },
    sunset: { value: 0 },
    wet: { value: 0 },
    sunDir: { value: new THREE.Vector3(0, 1, 0) },
    keyDir: { value: new THREE.Vector3(0.35, 0.85, 0.25).normalize() },
    skyCol: { value: new THREE.Color(SKY) },
    rimCol: { value: new THREE.Color(0x62d8ff) },
    rimWarm: { value: new THREE.Color(0xffc070) },
    shadowTint: { value: new THREE.Color(0x3a446e) },
    impact: { value: 0 },
    impactCol: { value: new THREE.Color(0xffffff) },
  };
  function cityAnimeMaterial(material,opts={}){
    const cut=!!opts.cut,toon=!!material.isMeshToonMaterial,phong=!!material.isMeshPhongMaterial||toon;
    material.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms, {
        uZzz: ZZZ_U.on,
        uZzzWet: ZZZ_U.wet,
        uZzzNight: ZZZ_U.night,
        uZzzSky: ZZZ_U.skyCol,
        uZzzShadow: ZZZ_U.shadowTint,
        uZzzRim: ZZZ_U.rimCol,
        uZzzWarm: ZZZ_U.rimWarm,
      });
      if(cut){
        shader.uniforms.uCutCam=CITY_CUT.cam;shader.uniforms.uCutPl=CITY_CUT.pl;shader.uniforms.uCutOn=CITY_CUT.on;
      }
      shader.vertexShader=shader.vertexShader
        .replace('#include <common>','#include <common>\nvarying vec3 vCutPos;\nvarying vec3 vZzzWNorm;')
        .replace('#include <project_vertex>',`#include <project_vertex>
  vec4 cutW=vec4(transformed,1.0);
  #ifdef USE_INSTANCING
  cutW=instanceMatrix*cutW;
  #endif
  cutW=modelMatrix*cutW;vCutPos=cutW.xyz;
  vec3 zzzN=objectNormal;
  #ifdef USE_INSTANCING
  zzzN=mat3(instanceMatrix)*zzzN;
  #endif
  vZzzWNorm=normalize(mat3(modelMatrix)*zzzN);`);
      shader.fragmentShader=shader.fragmentShader
        .replace('#include <common>',`#include <common>
  varying vec3 vCutPos;varying vec3 vZzzWNorm;
  uniform float uZzz;uniform float uZzzWet;uniform float uZzzNight;
  uniform vec3 uZzzSky;uniform vec3 uZzzShadow;uniform vec3 uZzzRim;uniform vec3 uZzzWarm;
  ${cut?'uniform vec3 uCutCam;uniform vec3 uCutPl;uniform float uCutOn;':''}`);
      if(cut)shader.fragmentShader=shader.fragmentShader.replace('void main() {','void main() {\n'+CUT_GLSL);
      shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`
        float cityLuma=max(.001,dot(gl_FragColor.rgb,vec3(.299,.587,.114)));
        float cityBand=floor(cityLuma*3.5+.35)/3.5;
        gl_FragColor.rgb*=mix(1.,max(.22,cityBand)/cityLuma,${toon?'.12':'.32'});
        vec3 cShTint=mix(vec3(.26,.29,.44),uZzzShadow*mix(1.,.36,uZzzNight),uZzz);
        gl_FragColor.rgb=max(gl_FragColor.rgb,diffuseColor.rgb*cShTint);   // sombras anime con tinte índigo urbano
        if(uZzz>.5){
          float zzzWall=1.-smoothstep(.65,.90,abs(vZzzWNorm.y));
          float zzzBase=smoothstep(-.08,.02,vCutPos.y)*(1.-smoothstep(0.,1.35,vCutPos.y));
          gl_FragColor.rgb*=mix(vec3(1.),vec3(.65,.69,.85),zzzWall*zzzBase*.62);
          vec3 zzzV=normalize(cameraPosition-vCutPos);
          float zzzFres=pow(1.-clamp(zzzV.y,0.,1.),4.6);
          float zzzRoad=smoothstep(.85,.97,vZzzWNorm.y)*(1.-smoothstep(.05,.13,abs(vCutPos.y)));
          float rGray=dot(gl_FragColor.rgb,vec3(.299,.587,.114));
          vec3 roadGraphite=mix(vec3(rGray)*.92,gl_FragColor.rgb,.48);
          gl_FragColor.rgb=mix(gl_FragColor.rgb,roadGraphite,zzzRoad*.55);
          vec3 zzzSkyMix=mix(uZzzSky*.75,vec3(.18,.32,.56),uZzzNight*.72);
          gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*.9+zzzSkyMix*.34,zzzRoad*zzzFres*(.28+uZzzWet*.55));
        }
        ${phong?`float cityRim=pow(1.-clamp(dot(normalize(vNormal),normalize(vViewPosition)),0.,1.),uZzz>.5?2.5:2.8);
        vec3 cRimC=mix(vec3(.55,.76,1.),mix(uZzzRim,uZzzWarm,.35),uZzz);
        gl_FragColor.rgb+=cRimC*cityRim*(uZzz>.5?.26:.22)*clamp(cityLuma+.25,0.,1.);`:''}
        gl_FragColor.rgb=mix(gl_FragColor.rgb*vec3(.92,.96,1.08),gl_FragColor.rgb*vec3(1.04,1.01,.95),smoothstep(.25,.82,cityLuma));
        gl_FragColor.rgb=(gl_FragColor.rgb-.5)*(uZzz>.5?1.08:1.06)+.5;
        float cityGray=dot(gl_FragColor.rgb,vec3(.299,.587,.114));
        gl_FragColor.rgb=max(vec3(0.),mix(vec3(cityGray),gl_FragColor.rgb,uZzz>.5?1.18:1.15));
        #include <fog_fragment>
      `);
    };
    material.customProgramCacheKey=()=> 'zenless-city-v5'+(cut?'-cut':'')+(toon?'-t':phong?'-p':'');return material;
  }

  const HEMI = scene.children.find(o => o.isHemisphereLight);
  function skyFollow(apoc = 0, night = 0) {
    const x = camera.position.x, z = camera.position.z;
    skyDome.position.set(x, 0, z);
    skyDome.scale.setScalar(1 + apoc * .3);
    skyMat.color.setHex(night > .5 ? 0xffffff : 0xffffff).lerp(_c.set(0x7a1010), apoc * .78);
  }

  return {
    WEAK_PC, LOW_PC, renderer, TONOS, scene, SKY, camera, sun, HEMI,
    ANIME_SKY_TEX, skyGeo, skyMat, skyDome, skyFollow, updateSunShadowFocus,
    noiseRect, pixTex, BLOCK_TEX, CITY_GRAD, CITY_CUT, CUT_GLSL,
    HOLE_U, ZZZ_U, cityAnimeMaterial
  };
};
