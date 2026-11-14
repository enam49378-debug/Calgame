# -*- coding: utf-8 -*-
"""
Script to apply anime & comic/manga graphic overhaul to index.html
"""
import sys
import re

def main():
    path = "f:/blockstrike/index.html"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    orig_len = len(content)
    print(f"Read index.html: {orig_len} chars")

    # 1. CSS upgrades: #halftone, #impact-flash, .dn, .comic-onom
    css_target = "#halftone{position:fixed;inset:0;pointer-events:none;opacity:0;background-image:radial-gradient(rgba(0,0,0,.55) 1.1px,transparent 1.7px);background-size:7px 7px;mix-blend-mode:multiply;transition:opacity .2s;z-index:2}"
    if css_target not in content:
        print("ERROR: css_target not found!")
        return 1

    css_replacement = "#halftone{position:fixed;inset:0;pointer-events:none;opacity:.08;background-image:radial-gradient(rgba(0,0,0,.55) 1.1px,transparent 1.7px);background-size:7px 7px;mix-blend-mode:multiply;transition:opacity .2s;z-index:2}\nbody.cine #halftone,body.impact-active #halftone{opacity:.42}"
    content = content.replace(css_target, css_replacement, 1)

    # #impact-flash
    impact_css_target = "#impact-flash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:5}"
    if impact_css_target not in content:
        print("ERROR: impact_css_target not found!")
        return 1
    impact_css_replacement = "#impact-flash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:100;mix-blend-mode:difference}"
    content = content.replace(impact_css_target, impact_css_replacement, 1)

    # .dn and add .comic-onom
    dn_target = ".dn{position:absolute;left:0;top:0;font-family:var(--display);font-size:22px;text-shadow:2px 2px 0 #000,0 0 6px #000;white-space:nowrap;will-change:transform;font-style:italic}"
    if dn_target not in content:
        print("ERROR: dn_target not found!")
        return 1
    dn_replacement = (
        ".dn{position:absolute;left:0;top:0;font-family:var(--display);font-size:24px;font-weight:900;text-shadow:3px 3px 0 #000,0 0 8px #000;-webkit-text-stroke:1.6px #000;white-space:nowrap;will-change:transform;font-style:italic}\n"
        ".comic-onom{position:absolute;left:0;top:0;font-family:var(--display);font-size:32px;font-weight:900;font-style:italic;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;pointer-events:none;will-change:transform,opacity;padding:4px 14px;border:3px solid #000;border-radius:4px;-webkit-text-stroke:2.4px #000;text-shadow:3px 3px 0 #000,6px 6px 0 rgba(0,0,0,.75);box-shadow:4px 4px 0 #000;clip-path:polygon(5% 0%,95% 3%,100% 72%,95% 100%,5% 97%,0% 28%);transform-origin:center center;z-index:10}\n"
        ".comic-onom.burst-gold{background:linear-gradient(135deg,#ffe600,#ff9100);color:#ffffff}\n"
        ".comic-onom.burst-cyan{background:linear-gradient(135deg,#00e5ff,#0091ea);color:#ffffff}\n"
        ".comic-onom.burst-red{background:linear-gradient(135deg,#ff1744,#d50000);color:#ffffff}\n"
        ".comic-onom.burst-orange{background:linear-gradient(135deg,#ff9100,#ff3d00);color:#ffffff}\n"
        ".comic-onom.burst-purple{background:linear-gradient(135deg,#d500f9,#651fff);color:#ffffff}\n"
        ".comic-onom.burst-white{background:linear-gradient(135deg,#ffffff,#cfd8dc);color:#000000;-webkit-text-stroke:2px #fff;text-shadow:3px 3px 0 #000}"
    )
    content = content.replace(dn_target, dn_replacement, 1)

    # 2. Add pick helper
    pick_target = "const rand = (a, b) => a + Math.random() * (b - a);"
    if pick_target not in content:
        print("ERROR: pick_target not found!")
        return 1
    content = content.replace(pick_target, "const rand = (a, b) => a + Math.random() * (b - a);\nconst pick = arr => arr[Math.floor(Math.random() * arr.length)];", 1)

    # 3. Renderer filter and scene lights
    rend_target = "renderer.domElement.style.filter = 'contrast(1.07) saturate(1.22) brightness(1.03)';"
    if rend_target not in content:
        print("ERROR: rend_target not found!")
        return 1
    content = content.replace(rend_target, "renderer.domElement.style.filter = 'contrast(1.12) saturate(1.36) brightness(1.04)';", 1)

    light_target = "scene.add(new THREE.HemisphereLight(0xe4f1ff, 0x52703c, 0.78));\nconst sun = new THREE.DirectionalLight(0xfff0d0, 0.85);"
    if light_target not in content:
        print("ERROR: light_target not found!")
        return 1
    content = content.replace(light_target, "scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x3d506d, 0.88));\nconst sun = new THREE.DirectionalLight(0xfff2d4, 0.95);", 1)

    # 4. BLOCK_TEX with vibrant anime palette
    block_tex_target = (
        "const BLOCK_TEX = {\n"
        "  grass: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#5d9e3a', 34); g.fillStyle = 'rgba(30,70,20,.35)'; for (let i = 0; i < 18; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); }),\n"
        "  cobble: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#7d7d7d', 30); g.fillStyle = '#4a4a4a'; for (let i = 0; i < 26; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, Math.random() < .5 ? 2 : 1, 1); g.fillStyle = '#a0a0a0'; for (let i = 0; i < 14; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); }),\n"
        "  brick: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#8b8b8b', 18); g.fillStyle = '#5a5a5a'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(15, 8, 1, 7); g.fillStyle = '#a5a5a5'; g.fillRect(0, 0, 7, 1); g.fillRect(8, 8, 7, 1); }),\n"
        "  log: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#6b4f2c', 18); g.fillStyle = '#4a3519'; for (let x = 1; x < 16; x += 3) g.fillRect(x, 0, 1, 16); }),\n"
        "  leaves: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#3f8a2e', 40); g.fillStyle = '#245a18'; for (let i = 0; i < 30; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); }),\n"
        "  plank: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#a7834f', 16); g.fillStyle = '#7a5c33'; [3, 7, 11, 15].forEach(y => g.fillRect(0, y, 16, 1)); g.fillRect(8, 0, 1, 3); g.fillRect(3, 4, 1, 3); g.fillRect(12, 8, 1, 3); }),\n"
        "};"
    )
    if block_tex_target not in content:
        print("ERROR: block_tex_target not found!")
        return 1
    block_tex_replacement = (
        "const BLOCK_TEX = {\n"
        "  grass: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#52af32', 30); g.fillStyle = 'rgba(25,75,18,.35)'; for (let i = 0; i < 18; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); g.fillStyle = '#7de853'; for (let i = 0; i < 8; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); }),\n"
        "  cobble: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#727e8a', 28); g.fillStyle = '#3c4652'; for (let i = 0; i < 26; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, Math.random() < .5 ? 2 : 1, 1); g.fillStyle = '#a6b4c4'; for (let i = 0; i < 14; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); }),\n"
        "  brick: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#987a70', 18); g.fillStyle = '#54413b'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(15, 8, 1, 7); g.fillStyle = '#bca197'; g.fillRect(0, 0, 7, 1); g.fillRect(8, 8, 7, 1); }),\n"
        "  log: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#6b4f2c', 18); g.fillStyle = '#4a3519'; for (let x = 1; x < 16; x += 3) g.fillRect(x, 0, 1, 16); }),\n"
        "  leaves: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#38a82c', 36); g.fillStyle = '#1c6314'; for (let i = 0; i < 30; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); g.fillStyle = '#65d957'; for (let i = 0; i < 12; i++) g.fillRect(Math.random() * 16 | 0, Math.random() * 16 | 0, 1, 1); }),\n"
        "  plank: pixTex(16, 16, g => { noiseRect(g, 0, 0, 16, 16, '#b08b54', 16); g.fillStyle = '#75542b'; [3, 7, 11, 15].forEach(y => g.fillRect(0, y, 16, 1)); g.fillRect(8, 0, 1, 3); g.fillRect(3, 4, 1, 3); g.fillRect(12, 8, 1, 3); }),\n"
        "};"
    )
    content = content.replace(block_tex_target, block_tex_replacement, 1)

    # 5. CITY_GRAD and cityAnimeMaterial
    city_grad_target = "const CITY_GRAD=(()=>{const t=new THREE.DataTexture(new Uint8Array([104,156,202,232]),4,1,THREE.LuminanceFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;})();"
    if city_grad_target not in content:
        print("ERROR: city_grad_target not found!")
        return 1
    content = content.replace(city_grad_target, "const CITY_GRAD=(()=>{const t=new THREE.DataTexture(new Uint8Array([75,135,195,245]),4,1,THREE.LuminanceFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;})();", 1)

    frag_target = """      float cityLuma=max(.001,dot(gl_FragColor.rgb,vec3(.299,.587,.114)));
      float cityBand=floor(cityLuma*6.+.5)/6.;
      gl_FragColor.rgb*=mix(1.,max(.15,cityBand)/cityLuma,${toon?'.08':'.26'});
      gl_FragColor.rgb=max(gl_FragColor.rgb,diffuseColor.rgb*vec3(.2,.23,.34));   // las sombras nunca quedan grises: conservan el color, algo azulado
      ${phong?'float cityRim=pow(1.-clamp(dot(normalize(vNormal),normalize(vViewPosition)),0.,1.),3.);gl_FragColor.rgb+=vec3(.5,.68,1.)*cityRim*.055*cityLuma;':''}
      gl_FragColor.rgb=mix(gl_FragColor.rgb*vec3(.93,.98,1.07),gl_FragColor.rgb*vec3(1.025,1.,.97),smoothstep(.22,.82,cityLuma));
      gl_FragColor.rgb=(gl_FragColor.rgb-.5)*1.04+.5;
      float cityGray=dot(gl_FragColor.rgb,vec3(.299,.587,.114));
      gl_FragColor.rgb=max(vec3(0.),mix(vec3(cityGray),gl_FragColor.rgb,1.1));
      #include <fog_fragment>"""

    frag_replacement = """      float cityLuma=max(.001,dot(gl_FragColor.rgb,vec3(.299,.587,.114)));
      float cityBand=floor(cityLuma*3.5+.35)/3.5;
      gl_FragColor.rgb*=mix(1.,max(.22,cityBand)/cityLuma,${toon?'.12':'.32'});
      gl_FragColor.rgb=max(gl_FragColor.rgb,diffuseColor.rgb*vec3(.26,.29,.44));   // sombras anime con tinte cómic índigo
      ${phong?'float cityRim=pow(1.-clamp(dot(normalize(vNormal),normalize(vViewPosition)),0.,1.),2.8);gl_FragColor.rgb+=vec3(.55,.76,1.)*cityRim*.22*clamp(cityLuma+.25,0.,1.);':''}
      gl_FragColor.rgb=mix(gl_FragColor.rgb*vec3(.92,.96,1.08),gl_FragColor.rgb*vec3(1.04,1.01,.95),smoothstep(.25,.82,cityLuma));
      gl_FragColor.rgb=(gl_FragColor.rgb-.5)*1.06+.5;
      float cityGray=dot(gl_FragColor.rgb,vec3(.299,.587,.114));
      gl_FragColor.rgb=max(vec3(0.),mix(vec3(cityGray),gl_FragColor.rgb,1.15));
      #include <fog_fragment>"""

    if frag_target not in content:
        print("ERROR: frag_target not found!")
        return 1
    content = content.replace(frag_target, frag_replacement, 1)

    # 6. WX.sky shader
    sky_frag_target = """    fragmentShader:`varying vec3 vDir; uniform vec3 uTop,uHorizon,uLow,uSunDir; uniform float uCloud,uTime,uSunset,uSunVis;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(a),hash(a+vec2(1,0)),f.x),mix(hash(a+vec2(0,1)),hash(a+vec2(1,1)),f.x),f.y);}
      void main(){vec3 d=normalize(vDir);float y=d.y;
        vec3 c=mix(uHorizon,uTop,pow(max(y,0.),.55));c=mix(c,uLow,1.-smoothstep(-.5,0.,y));
        vec2 p=d.xz/max(.13,y+.25)*2.5+vec2(uTime*.007,0.);
        float n=noise(p)*.65+noise(p*2.1)*.25+noise(p*4.3)*.1;
        float cloud=smoothstep(.55-uCloud*.3,.8-uCloud*.23,n)*smoothstep(-.08,.18,y)*uCloud;
        float sd=max(dot(d,uSunDir),0.);
        c+=vec3(1.,.5,.2)*pow(sd,5.)*uSunset*.5*smoothstep(-.25,.15,y+.1)+vec3(1.,.72,.42)*pow(sd,40.)*.45*uSunVis;   // resplandor del atardecer
        c=mix(c,uHorizon*.88+vec3(.025),cloud*.6);
        c=mix(c,vec3(1.,.93,.78),smoothstep(.9986,.9992,sd)*uSunVis*(1.-uCloud*.75));   // disco del sol
        gl_FragColor=vec4(c,1.);
      }`"""

    sky_frag_replacement = """    fragmentShader:`varying vec3 vDir; uniform vec3 uTop,uHorizon,uLow,uSunDir; uniform float uCloud,uTime,uSunset,uSunVis;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(a),hash(a+vec2(1,0)),f.x),mix(hash(a+vec2(0,1)),hash(a+vec2(1,1)),f.x),f.y);}
      void main(){vec3 d=normalize(vDir);float y=d.y;
        vec3 c=mix(uHorizon,uTop,pow(max(y,0.),.45));c=mix(c,uLow,1.-smoothstep(-.5,0.,y));
        float horizGlow=smoothstep(-.08,.24,y)*(1.-smoothstep(.02,.48,y));
        c+=mix(vec3(.22,.16,.08),vec3(.32,.12,.02),uSunset)*horizGlow*.65;
        vec2 p=d.xz/max(.13,y+.25)*2.5+vec2(uTime*.007,0.);
        float n=noise(p)*.65+noise(p*2.1)*.25+noise(p*4.3)*.1;
        float cloudEdge=smoothstep(.52-uCloud*.3,.58-uCloud*.25,n)*smoothstep(-.08,.2,y)*uCloud;
        float cloudShadow=smoothstep(.58-uCloud*.3,.74-uCloud*.22,n);
        vec3 cloudColor=mix(mix(vec3(.72,.78,.92),vec3(.88,.64,.72),uSunset),vec3(1.0,1.0,.98),cloudShadow);
        c=mix(c,cloudColor,cloudEdge*.82);
        float sd=max(dot(d,uSunDir),0.);
        c+=vec3(1.,.52,.22)*pow(sd,5.)*uSunset*.65*smoothstep(-.25,.15,y+.1)+vec3(1.,.82,.5)*pow(sd,36.)*.5*uSunVis;
        c=mix(c,vec3(1.,.96,.82),smoothstep(.9984,.9993,sd)*uSunVis*(1.-uCloud*.75));
        c+=vec3(1.,.85,.55)*smoothstep(.994,.9984,sd)*.35*uSunVis*(1.-uCloud*.75);
        gl_FragColor=vec4(c,1.);
      }`"""

    if sky_frag_target not in content:
        print("ERROR: sky_frag_target not found!")
        return 1
    content = content.replace(sky_frag_target, sky_frag_replacement, 1)

    # 7. updateCityWeather sky colors and fog distance
    weather_sky_target = """  WX.skyTop.set(0x111c3b).lerp(_c.set(0x3a8ae0),day).lerp(_c.set(0x665a86),sunset*.65);
  WX.skyHorizon.set(0x293957).lerp(_c.set(0xb4dcf6),day).lerp(_c.set(0xf4ae7c),sunset*.8);"""

    weather_sky_replacement = """  WX.skyTop.set(0x0a1c42).lerp(_c.set(0x1a72e8),day).lerp(_c.set(0x6c3f82),sunset*.75);
  WX.skyHorizon.set(0x1e2c48).lerp(_c.set(0x9ee0ff),day).lerp(_c.set(0xff9452),sunset*.85);"""

    if weather_sky_target not in content:
        print("ERROR: weather_sky_target not found!")
        return 1
    content = content.replace(weather_sky_target, weather_sky_replacement, 1)

    weather_fog_target = "scene.fog.near=Math.max(2,48-WX.fogAmount*48*WX.fogStrength);scene.fog.far=Math.max(22,192-WX.fogAmount*137*WX.fogStrength);"
    weather_fog_replacement = "scene.fog.near=Math.max(15,75-WX.fogAmount*65*WX.fogStrength);scene.fog.far=Math.max(45,260-WX.fogAmount*180*WX.fogStrength);"
    if weather_fog_target not in content:
        print("ERROR: weather_fog_target not found!")
        return 1
    content = content.replace(weather_fog_target, weather_fog_replacement, 1)

    # 8. TOON_GRAD and buildModel
    toon_grad_target = """const TOON_GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([105, 175, 232]), 3, 1, THREE.LuminanceFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x0b0b14, side: THREE.BackSide });"""

    toon_grad_replacement = """const TOON_GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([75, 145, 215, 255]), 4, 1, THREE.LuminanceFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x080912, side: THREE.BackSide });"""

    if toon_grad_target not in content:
        print("ERROR: toon_grad_target not found!")
        return 1
    content = content.replace(toon_grad_target, toon_grad_replacement, 1)

    build_model_target = """function buildModel(skin, slim, parent) {
  const tex = new THREE.CanvasTexture(skin);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const th = skin.height, legacy = th === 32, aw = slim ? 3 : 4;
  const base = new THREE.MeshToonMaterial({ map: tex, gradientMap: TOON_GRAD, emissive: 0x000000 });
  const over = new THREE.MeshToonMaterial({ map: tex, gradientMap: TOON_GRAD, alphaTest: 0.5, side: THREE.DoubleSide, emissive: 0x000000 });
  const root = new THREE.Group(), inner = new THREE.Group(), torso = new THREE.Group();
  inner.position.y = 16 * PX; root.add(inner);
  torso.position.y = -4 * PX; inner.add(torso);
  const part = (par, w, h, d, u, v, ou, ov, offY, inflate) => {
    const m = new THREE.Mesh(boxUV(w, h, d, u, v, th, 0), base); m.position.y = offY * PX; m.castShadow = true; par.add(m);
    // contorno anime: copia invertida un poco más grande, solo caras traseras, en negro
    const tk = w === 8 && h === 8 ? 1.4 : .9, ol = new THREE.Mesh(m.geometry, OUTLINE_MAT);
    ol.scale.set((w + tk) / w, (h + tk) / h, (d + tk) / d); m.add(ol);
    if (ou != null) { const o = new THREE.Mesh(boxUV(w, h, d, ou, ov, th, inflate), over); o.position.y = offY * PX; par.add(o); }
  };"""

    build_model_replacement = """function buildModel(skin, slim, parent) {
  const tex = new THREE.CanvasTexture(skin);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const th = skin.height, legacy = th === 32, aw = slim ? 3 : 4;
  const toonOpts = (alpha) => {
    const mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: TOON_GRAD, alphaTest: alpha ? 0.5 : 0, side: alpha ? THREE.DoubleSide : THREE.FrontSide, emissive: 0x000000 });
    mat.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `
        vec3 vView = normalize(vViewPosition);
        float chRim = pow(1.0 - clamp(dot(normalize(vNormal), vView), 0.0, 1.0), 2.6);
        gl_FragColor.rgb += vec3(0.55, 0.78, 1.0) * chRim * 0.32;
        gl_FragColor.rgb = max(gl_FragColor.rgb, diffuseColor.rgb * vec3(0.32, 0.34, 0.48));
        #include <fog_fragment>
      `);
    };
    return mat;
  };
  const base = toonOpts(false);
  const over = toonOpts(true);
  const root = new THREE.Group(), inner = new THREE.Group(), torso = new THREE.Group();
  inner.position.y = 16 * PX; root.add(inner);
  torso.position.y = -4 * PX; inner.add(torso);
  const part = (par, w, h, d, u, v, ou, ov, offY, inflate) => {
    const m = new THREE.Mesh(boxUV(w, h, d, u, v, th, 0), base); m.position.y = offY * PX; m.castShadow = true; par.add(m);
    // contorno anime: copia invertida un poco más grande, solo caras traseras, en negro
    const tk = w === 8 && h === 8 ? 1.5 : 1.1, ol = new THREE.Mesh(m.geometry, OUTLINE_MAT);
    ol.scale.set((w + tk) / w, (h + tk) / h, (d + tk) / d); m.add(ol);
    if (ou != null) {
      const o = new THREE.Mesh(boxUV(w, h, d, ou, ov, th, inflate), over);
      o.position.y = offY * PX;
      const otk = tk * 0.9, ool = new THREE.Mesh(o.geometry, OUTLINE_MAT);
      ool.scale.set((w + inflate + otk) / (w + inflate), (h + inflate + otk) / (h + inflate), (d + inflate + otk) / (d + inflate));
      o.add(ool);
      par.add(o);
    }
  };"""

    if build_model_target not in content:
        print("ERROR: build_model_target not found!")
        return 1
    content = content.replace(build_model_target, build_model_replacement, 1)

    # 9. buildJesulutoModel outlines
    jl_cube_target = """    for (const cube of bone.cubes || []) {
      const mesh = new THREE.Mesh(jlCubeGeometry(cube,bone.origin,bone.eye?16:64), bone.eye?eyeMat:bodyMat);
      mesh.castShadow = !bone.eye;
      g.add(mesh);
    }"""

    jl_cube_replacement = """    for (const cube of bone.cubes || []) {
      const mesh = new THREE.Mesh(jlCubeGeometry(cube,bone.origin,bone.eye?16:64), bone.eye?eyeMat:bodyMat);
      mesh.castShadow = !bone.eye;
      g.add(mesh);
      if (!bone.eye) {
        const ol = new THREE.Mesh(mesh.geometry, OUTLINE_MAT);
        ol.scale.set(1.08, 1.08, 1.08);
        mesh.add(ol);
      }
    }"""

    if jl_cube_target not in content:
        print("ERROR: jl_cube_target not found!")
        return 1
    content = content.replace(jl_cube_target, jl_cube_replacement, 1)

    # 10. Weapons: buildSpear, buildScepter, buildSword
    weapons_target = """function buildSpear(scale = 1) {
  const vox = [], P = (y, z, c) => vox.push([y, z, c]);
  for (let z = -11; z <= 16; z++) P(0, z, z === -11 ? '#c9a94a' : (z >= -3 && z <= 2) ? '#3b2a1a' : (z % 2 ? '#7a5230' : '#8f6339'));
  [[1, 16], [-1, 16], [1, 17], [-1, 17], [0, 17]].forEach(([y, z]) => P(y, z, '#c9a94a'));
  [1, 2, 2, 2, 1, 1, 0, 0].forEach((w, i) => { for (let y = -w; y <= w; y++) P(y, 18 + i, w && Math.abs(y) === w ? '#2bb3a8' : y === 0 ? '#9ff7ef' : '#4ee6d6'); });
  P(0, 26, '#e0fffb');
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x000000 });
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(PX * scale, PX * scale, PX * scale), mat, vox.length), M = new THREE.Matrix4();
  vox.forEach(([y, z, c], i) => { M.makeTranslation(0, y * PX * scale, z * PX * scale); m.setMatrixAt(i, M); m.setColorAt(i, _c.set(c)); });
  m.castShadow = true; m.frustumCulled = false;
  return m;
}
// Cetro dorado con gema y cuernos, mismo agarre que la lanza
function buildScepter() {
  const vox = [], P = (y, z, c) => vox.push([y, z, c]);
  for (let z = -10; z <= 15; z++) P(0, z, (z >= -2 && z <= 2) ? '#1e6b3a' : (z % 2 ? '#d4a017' : '#b8860b'));
  P(0, -11, '#3ddc84');
  [[1, 15], [-1, 15], [1, 16], [-1, 16]].forEach(([y, z]) => P(y, z, '#d4a017'));
  [[0, 17, '#4fc3f7'], [0, 18, '#b3e5fc'], [0, 19, '#4fc3f7'], [1, 17, '#0288d1'], [-1, 17, '#0288d1'], [1, 18, '#4fc3f7'], [-1, 18, '#4fc3f7']].forEach(([y, z, c]) => P(y, z, c));
  [[2, 17], [3, 18], [3, 19], [3, 20], [2, 21], [-2, 17], [-3, 18], [-3, 19], [-3, 20], [-2, 21]].forEach(([y, z]) => P(y, z, Math.abs(y) === 3 ? '#ffd54f' : '#d4a017'));
  P(0, 20, '#d4a017'); P(0, 21, '#ffd54f'); P(0, 22, '#fff3c4');
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x000000 });
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(PX, PX, PX), mat, vox.length), M = new THREE.Matrix4();
  vox.forEach(([y, z, c], i) => { M.makeTranslation(0, y * PX, z * PX); m.setMatrixAt(i, M); m.setColorAt(i, _c.set(c)); });
  m.castShadow = true; m.frustumCulled = false;
  return m;
}
// Espada de ItzUkyo: empuñadura azul oscuro con trama roja, guardia y pomo dorados, hoja larga de acero
function buildSword() {
  const vox = [], P = (y, z, c) => vox.push([y, z, c]);
  for (let z = -4; z <= 2; z++) P(0, z, z % 2 ? '#ba1f2f' : '#16142b');
  [[0, -5], [1, -5], [-1, -5]].forEach(([y, z]) => P(y, z, '#bd8e20'));
  for (let y = -3; y <= 3; y++) P(y, 3, '#bd8e20');
  P(2, 4, '#bd8e20'); P(-2, 4, '#bd8e20');
  for (let z = 4; z <= 25; z++) { P(0, z, '#dfe8f2'); P(1, z, '#f7fbff'); P(-1, z, '#8f9db0'); }
  P(0, 26, '#ffffff'); P(1, 26, '#f7fbff');
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x000000 });
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(PX, PX, PX), mat, vox.length), M = new THREE.Matrix4();
  vox.forEach(([y, z, c], i) => { M.makeTranslation(0, y * PX, z * PX); m.setMatrixAt(i, M); m.setColorAt(i, _c.set(c)); });
  m.castShadow = true; m.frustumCulled = false;
  return m;
}"""

    weapons_replacement = """function buildSpear(scale = 1) {
  const vox = [], P = (y, z, c) => vox.push([y, z, c]);
  for (let z = -11; z <= 16; z++) P(0, z, z === -11 ? '#c9a94a' : (z >= -3 && z <= 2) ? '#3b2a1a' : (z % 2 ? '#7a5230' : '#8f6339'));
  [[1, 16], [-1, 16], [1, 17], [-1, 17], [0, 17]].forEach(([y, z]) => P(y, z, '#c9a94a'));
  [1, 2, 2, 2, 1, 1, 0, 0].forEach((w, i) => { for (let y = -w; y <= w; y++) P(y, 18 + i, w && Math.abs(y) === w ? '#2bb3a8' : y === 0 ? '#9ff7ef' : '#4ee6d6'); });
  P(0, 26, '#e0fffb');
  const mat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: TOON_GRAD });
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(PX * scale, PX * scale, PX * scale), mat, vox.length), M = new THREE.Matrix4();
  const olM = new THREE.InstancedMesh(new THREE.BoxGeometry(PX * scale * 1.15, PX * scale * 1.15, PX * scale * 1.15), OUTLINE_MAT, vox.length);
  vox.forEach(([y, z, c], i) => { M.makeTranslation(0, y * PX * scale, z * PX * scale); m.setMatrixAt(i, M); m.setColorAt(i, _c.set(c)); olM.setMatrixAt(i, M); });
  m.castShadow = true; m.frustumCulled = false; olM.frustumCulled = false; m.add(olM);
  return m;
}
// Cetro dorado con gema y cuernos, mismo agarre que la lanza
function buildScepter() {
  const vox = [], P = (y, z, c) => vox.push([y, z, c]);
  for (let z = -10; z <= 15; z++) P(0, z, (z >= -2 && z <= 2) ? '#1e6b3a' : (z % 2 ? '#d4a017' : '#b8860b'));
  P(0, -11, '#3ddc84');
  [[1, 15], [-1, 15], [1, 16], [-1, 16]].forEach(([y, z]) => P(y, z, '#d4a017'));
  [[0, 17, '#4fc3f7'], [0, 18, '#b3e5fc'], [0, 19, '#4fc3f7'], [1, 17, '#0288d1'], [-1, 17, '#0288d1'], [1, 18, '#4fc3f7'], [-1, 18, '#4fc3f7']].forEach(([y, z, c]) => P(y, z, c));
  [[2, 17], [3, 18], [3, 19], [3, 20], [2, 21], [-2, 17], [-3, 18], [-3, 19], [-3, 20], [-2, 21]].forEach(([y, z]) => P(y, z, Math.abs(y) === 3 ? '#ffd54f' : '#d4a017'));
  P(0, 20, '#d4a017'); P(0, 21, '#ffd54f'); P(0, 22, '#fff3c4');
  const mat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: TOON_GRAD });
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(PX, PX, PX), mat, vox.length), M = new THREE.Matrix4();
  const olM = new THREE.InstancedMesh(new THREE.BoxGeometry(PX * 1.15, PX * 1.15, PX * 1.15), OUTLINE_MAT, vox.length);
  vox.forEach(([y, z, c], i) => { M.makeTranslation(0, y * PX, z * PX); m.setMatrixAt(i, M); m.setColorAt(i, _c.set(c)); olM.setMatrixAt(i, M); });
  m.castShadow = true; m.frustumCulled = false; olM.frustumCulled = false; m.add(olM);
  return m;
}
// Espada de ItzUkyo: empuñadura azul oscuro con trama roja, guardia y pomo dorados, hoja larga de acero
function buildSword() {
  const vox = [], P = (y, z, c) => vox.push([y, z, c]);
  for (let z = -4; z <= 2; z++) P(0, z, z % 2 ? '#ba1f2f' : '#16142b');
  [[0, -5], [1, -5], [-1, -5]].forEach(([y, z]) => P(y, z, '#bd8e20'));
  for (let y = -3; y <= 3; y++) P(y, 3, '#bd8e20');
  P(2, 4, '#bd8e20'); P(-2, 4, '#bd8e20');
  for (let z = 4; z <= 25; z++) { P(0, z, '#dfe8f2'); P(1, z, '#f7fbff'); P(-1, z, '#8f9db0'); }
  P(0, 26, '#ffffff'); P(1, 26, '#f7fbff');
  const mat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: TOON_GRAD });
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(PX, PX, PX), mat, vox.length), M = new THREE.Matrix4();
  const olM = new THREE.InstancedMesh(new THREE.BoxGeometry(PX * 1.15, PX * 1.15, PX * 1.15), OUTLINE_MAT, vox.length);
  vox.forEach(([y, z, c], i) => { M.makeTranslation(0, y * PX, z * PX); m.setMatrixAt(i, M); m.setColorAt(i, _c.set(c)); olM.setMatrixAt(i, M); });
  m.castShadow = true; m.frustumCulled = false; olM.frustumCulled = false; m.add(olM);
  return m;
}"""

    if weapons_target not in content:
        print("ERROR: weapons_target not found!")
        return 1
    content = content.replace(weapons_target, weapons_replacement, 1)

    # 11. impactFrame with comic inversion
    impact_frame_target = """function impactFrame(col, dur = .11) {
  if (IMPACT.cd > 0) return;
  const duration = clamp(Number.isFinite(dur) ? dur : .11, .04, .12);
  IMPACT.t = duration; IMPACT.col = col; IMPACT.cd = .45; IMPACT.until = performance.now() + duration * 1000;
  // A compositor animation expires even if the next game frame is delayed.
  // Keep rendering the world: no hidden buildings or shared material overrides.
  const el = $('impact-flash');
  for (const animation of el.getAnimations()) animation.cancel();
  el.animate([{ opacity: .45, background: '#ffffff' }, { opacity: .18, background: col, offset: .45 }, { opacity: 0, background: col }], { duration: duration * 1000, easing: 'ease-out' });
}"""

    impact_frame_replacement = """function impactFrame(col, dur = .11) {
  if (IMPACT.cd > 0) return;
  const duration = clamp(Number.isFinite(dur) ? dur : .11, .04, .12);
  IMPACT.t = duration; IMPACT.col = col; IMPACT.cd = .45; IMPACT.until = performance.now() + duration * 1000;
  document.body.classList.add('impact-active');
  setTimeout(() => document.body.classList.remove('impact-active'), duration * 1000);
  const el = $('impact-flash');
  for (const animation of el.getAnimations()) animation.cancel();
  el.animate([
    { opacity: .88, background: '#ffffff', filter: 'invert(1) contrast(1.8)' },
    { opacity: .55, background: col, filter: 'invert(0.6)', offset: .35 },
    { opacity: .2, background: col, filter: 'none', offset: .7 },
    { opacity: 0, background: col, filter: 'none' }
  ], { duration: duration * 1000, easing: 'ease-out' });
}"""

    if impact_frame_target not in content:
        print("ERROR: impact_frame_target not found!")
        return 1
    content = content.replace(impact_frame_target, impact_frame_replacement, 1)

    # 12. popText and comicPop in updateNums
    poptext_target = """function popText(p, text, col, size = 22) {
  const el = document.createElement('div'); el.className = 'dn'; el.textContent = text; el.style.color = col; el.style.fontSize = size + 'px';
  $('nums').appendChild(el); DN.push({ el, p: p.clone().add(new V3(rand(-.4, .4), .9, rand(-.4, .4))), t: 0 });
}
function updateNums(dt) {
  for (let i = DN.length - 1; i >= 0; i--) {
    const d = DN[i]; d.t += dt; d.p.y += dt * 1.6;
    if (d.t > .9) { d.el.remove(); DN.splice(i, 1); continue; }
    const s = toScreen(d.p);
    if (!s) { d.el.style.opacity = 0; continue; }
    d.el.style.opacity = 1 - Math.max(0, d.t - .5) / .4;
    d.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%) scale(${1 + Math.max(0, .15 - d.t) * 4})`;
  }
}"""

    poptext_replacement = """function popText(p, text, col, size = 22) {
  const el = document.createElement('div'); el.className = 'dn'; el.textContent = text; el.style.color = col; el.style.fontSize = size + 'px';
  $('nums').appendChild(el); DN.push({ el, p: p.clone().add(new V3(rand(-.4, .4), .9, rand(-.4, .4))), t: 0, rot: rand(-6, 6) });
}
function comicPop(p, text, burstClass = 'burst-gold', size = 32, rot = 0) {
  const el = document.createElement('div');
  el.className = 'comic-onom ' + burstClass;
  el.textContent = text;
  el.style.fontSize = size + 'px';
  $('nums').appendChild(el);
  DN.push({ el, isComic: true, p: p.clone().add(new V3(rand(-.3, .3), 1.2, rand(-.3, .3))), t: 0, rot: rot || rand(-14, 14), dur: 0.85 });
}
function updateNums(dt) {
  for (let i = DN.length - 1; i >= 0; i--) {
    const d = DN[i]; d.t += dt; d.p.y += dt * (d.isComic ? 1.2 : 1.6);
    const maxT = d.dur || 0.9;
    if (d.t > maxT) { d.el.remove(); DN.splice(i, 1); continue; }
    const s = toScreen(d.p);
    if (!s) { d.el.style.opacity = 0; continue; }
    if (d.isComic) {
      const progress = d.t / maxT;
      const scale = d.t < 0.08 ? (0.2 + (d.t / 0.08) * 1.25) : d.t < 0.22 ? (1.45 - ((d.t - 0.08) / 0.14) * 0.45) : (1.0 - progress * 0.15);
      d.el.style.opacity = progress > 0.65 ? (1 - (progress - 0.65) / 0.35) : 1;
      d.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%) rotate(${d.rot}deg) scale(${scale})`;
    } else {
      d.el.style.opacity = 1 - Math.max(0, d.t - .5) / .4;
      d.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%) rotate(${d.rot || 0}deg) scale(${1 + Math.max(0, .15 - d.t) * 4})`;
    }
  }
}"""

    if poptext_target not in content:
        print("ERROR: poptext_target not found!")
        return 1
    content = content.replace(poptext_target, poptext_replacement, 1)

    # 13. counterHit comicPop
    counter_target = "popText(chestOf(t), '¡CONTRA!', '#ffffff', 26); sfx('counter', t.pos);"
    if counter_target not in content:
        print("ERROR: counter_target not found!")
        return 1
    content = content.replace(counter_target, "popText(chestOf(t), '¡CONTRA!', '#ffffff', 26); comicPop(chestOf(t), '¡PARRY!', 'burst-cyan', 36, rand(-12, 12)); sfx('counter', t.pos);", 1)

    # 14. applyHit onomatopoeias
    hit_onom_target = """    if (heavy) G.fovKick = Math.max(G.fovKick, 4);
    popText(chest, Math.max(1, Math.round(dmg)), t.isPlayer ? '#ff6b6b' : (heavy ? '#d7ff2f' : '#ffffff'), heavy ? 30 : 22);
  }"""

    hit_onom_replacement = """    if (heavy) G.fovKick = Math.max(G.fovKick, 4);
    popText(chest, Math.max(1, Math.round(dmg)), t.isPlayer ? '#ff6b6b' : (heavy ? '#d7ff2f' : '#ffffff'), heavy ? 30 : 22);
    // Onomatopeyas de acción estilo cómic / anime
    const charId = (att.ch && att.ch.id) || '';
    if (o.guardBreak) {
      comicPop(chest, '¡CRACK!', 'burst-gold', 34, rand(-12, 12));
    } else if (o.spearFinish || ragdoll >= 1 || o.dmg >= 11 || G.combo === 4) {
      let onom = '¡BAM!', bClass = 'burst-gold';
      if (charId === 'javi' || att.spear) { onom = pick(['¡ESTOCADA!', '¡ZAS!', '¡CLASH!', '¡PUNZÓN!']); bClass = 'burst-cyan'; }
      else if (charId === 'sekza') { onom = pick(['¡GARRASO!', '¡SLASH!', '¡ZAS!', '¡PICADA!']); bClass = 'burst-orange'; }
      else if (charId === 'randi') { onom = pick(['¡PALOMAZO!', '¡DOGOOON!', '¡PUM!', '¡BAM!']); bClass = 'burst-red'; }
      else { onom = pick(['¡BAM!', '¡WHAM!', '¡KRAK!', '¡POW!', '¡BOOM!']); }
      comicPop(chest, onom, bClass, 34, rand(-15, 15));
    } else if (heavy) {
      comicPop(chest, pick(['¡POW!', '¡ZAS!', '¡SMACK!', '¡WHAM!']), 'burst-white', 26, rand(-10, 10));
    } else if (G.combo >= 2 && Math.random() < 0.5) {
      comicPop(chest, pick(['¡TAK!', '¡HIT!', '¡POP!']), 'burst-white', 20, rand(-8, 8));
    }
  }"""

    if hit_onom_target not in content:
        print("ERROR: hit_onom_target not found!")
        return 1
    content = content.replace(hit_onom_target, hit_onom_replacement, 1)

    # 15. drawLines manga speed lines during combat
    drawlines_target = """function drawLines(dt) {
  if (IMPACT.t > 0 && performance.now() >= IMPACT.until) IMPACT.t = 0;
  if (IMPACT.t > 0) {
    const w = LC.width, h = LC.height, cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
    LG.clearRect(0, 0, w, h); linesDrawn = true; LG.fillStyle = IMPACT.col; LG.globalAlpha = .9;
    for (let i = 0; i < 28; i++) {
      const a = rand(0, TAU), da = rand(.01, .04), r0 = R * rand(.32, .6);
      LG.beginPath(); LG.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      LG.lineTo(cx + Math.cos(a - da) * R * 1.1, cy + Math.sin(a - da) * R * 1.1); LG.lineTo(cx + Math.cos(a + da) * R * 1.1, cy + Math.sin(a + da) * R * 1.1);
      LG.closePath(); LG.fill();
    }
    LG.globalAlpha = 1; return;
  }
  const p = G.player;
  const want = G.cine ? 1 : (G.state === 'play' && p && (p.dashT > 0 || (p.action && p.action.ghost))) ? .45 : 0;
  G.linesI += (want - G.linesI) * Math.min(1, dt * 10);
  if (G.linesI < .03) { if (linesDrawn) { LG.clearRect(0, 0, LC.width, LC.height); linesDrawn = false; } return; }
  const w = LC.width, h = LC.height, cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2, I = G.linesI;
  LG.clearRect(0, 0, w, h); linesDrawn = true;
  const col = G.cine ? G.cine.f.ch.color : '#ffffff';
  for (let i = 0; i < 70 * I; i++) {
    const a = rand(0, TAU), r0 = R * rand(.42, .7), r1 = R * 1.05;
    LG.strokeStyle = i % 3 ? `rgba(255,255,255,${.35 * I})` : col; LG.globalAlpha = i % 3 ? 1 : .5 * I;
    LG.lineWidth = rand(1, 4);
    LG.beginPath(); LG.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); LG.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); LG.stroke();
  }
  LG.globalAlpha = 1;
}"""

    drawlines_replacement = """function drawLines(dt) {
  if (IMPACT.t > 0 && performance.now() >= IMPACT.until) IMPACT.t = 0;
  if (IMPACT.t > 0) {
    const w = LC.width, h = LC.height, cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
    LG.clearRect(0, 0, w, h); linesDrawn = true; LG.fillStyle = IMPACT.col; LG.globalAlpha = .92;
    for (let i = 0; i < 34; i++) {
      const a = rand(0, TAU), da = rand(.015, .05), r0 = R * rand(.28, .55);
      LG.beginPath(); LG.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      LG.lineTo(cx + Math.cos(a - da) * R * 1.15, cy + Math.sin(a - da) * R * 1.15); LG.lineTo(cx + Math.cos(a + da) * R * 1.15, cy + Math.sin(a + da) * R * 1.15);
      LG.closePath(); LG.fill();
    }
    LG.globalAlpha = 1; return;
  }
  const p = G.player;
  const inComboFinisher = p && p.action && (p.action.name?.includes('combo') && (p.combo >= 3 || p.action.name?.includes('combo_4')));
  const inHeavy = p && p.action && (p.action.ragdoll || (p.action.kb && p.action.kb > 10) || p.action.dash);
  const inFastSpeed = p && Math.hypot(p.vel.x, p.vel.z) > 13;
  const want = G.cine ? 1 : (G.state === 'play' && p && (p.dashT > 0 || p.dashAnimT > 0 || inComboFinisher || inHeavy || inFastSpeed)) ? .65 : (p && p.awak > 0 ? .16 : 0);
  G.linesI += (want - G.linesI) * Math.min(1, dt * 10);
  if (G.linesI < .03) { if (linesDrawn) { LG.clearRect(0, 0, LC.width, LC.height); linesDrawn = false; } return; }
  const w = LC.width, h = LC.height, cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2, I = G.linesI;
  LG.clearRect(0, 0, w, h); linesDrawn = true;
  const col = G.cine ? G.cine.f.ch.color : (p && p.ch ? p.ch.color : '#ffffff');
  for (let i = 0; i < 80 * I; i++) {
    const a = rand(0, TAU), r0 = R * rand(.36, .68), r1 = R * 1.08;
    LG.strokeStyle = i % 3 ? `rgba(255,255,255,${.45 * I})` : col; LG.globalAlpha = i % 3 ? 1 : .65 * I;
    LG.lineWidth = rand(1.5, 4.5);
    LG.beginPath(); LG.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); LG.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); LG.stroke();
  }
  LG.globalAlpha = 1;
}"""

    if drawlines_target not in content:
        print("ERROR: drawlines_target not found!")
        return 1
    content = content.replace(drawlines_target, drawlines_replacement, 1)

    print("All replacements matched successfully!")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Successfully written modified index.html!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
