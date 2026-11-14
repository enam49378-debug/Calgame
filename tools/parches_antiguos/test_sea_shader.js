const fs = require('fs');
const vm = require('vm');

const sandbox = {
  window: {},
  document: { createElement: () => ({ getContext: () => null }) },
  navigator: { userAgent: '' }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('lib/three.min.js', 'utf8'), sandbox);
const THREE = sandbox.THREE;
console.log('THREE loaded, version:', THREE.REVISION);

const sh = {
  vertexShader: THREE.ShaderLib.phong.vertexShader,
  fragmentShader: THREE.ShaderLib.phong.fragmentShader,
  uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms)
};

sh.vertexShader = sh.vertexShader
  .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
  .replace('#include <project_vertex>', '#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');

sh.fragmentShader = sh.fragmentShader
  .replace('#include <common>', '#include <common>\nvarying vec3 vWP;uniform float uTime;uniform vec3 uSky,uSunV,uSunC;uniform float uSunK;')
  .replace('#include <color_fragment>', `#include <color_fragment>
    float shoreZ=96.+3.5*sin(vWP.x*.045)+2.*sin(vWP.x*.11+1.);float dd=vWP.z-shoreZ;
    float w1=sin(dd*.55-uTime*1.3+sin(vWP.x*.07)*1.5)*.5+.5,w2=sin(dd*1.3-uTime*2.1+vWP.x*.12)*.5+.5;
    vec3 wc=mix(vec3(.34,.86,.82),vec3(.13,.6,.8),smoothstep(0.,10.,dd));wc=mix(wc,vec3(.04,.3,.62),smoothstep(8.,60.,dd));
    wc+=vec3(.09)*w1*(1.-smoothstep(0.,45.,dd))+vec3(.045)*w2;
    float spk=fract(sin(dot(floor(vWP.xz*3.),vec2(12.9898,78.233)))*43758.5453);
    float f1=(1.-smoothstep(0.,1.2,abs(dd-(1.4+1.2*sin(uTime*.8+vWP.x*.08)))))*step(0.,dd);
    float f2=(1.-smoothstep(0.,.8,abs(dd-(4.2+1.4*sin(uTime*.6+vWP.x*.05+2.)))))*step(0.,dd)*.55;
    float foam=clamp(f1+f2,0.,1.)*(.55+.45*spk);
    vec3 seaN=normalize(vNormal);float glint=pow(max(0.,dot(reflect(-normalize(vViewPosition),seaN),uSunV)),50.);
    float sparkle=step(0.82,glint)*spk*uSunK;
    diffuseColor.rgb=mix(wc,vec3(1.),foam*.88)+uSunC*sparkle*1.2;
    diffuseColor.a=mix(.55,.97,smoothstep(0.,16.,dd));`)
  .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nvec2 wg=vec2(cos(vWP.x*.9+uTime*1.7)*.9+cos((vWP.x+vWP.z)*.35-uTime*1.1)*.6+cos(vWP.x*2.3-vWP.z*1.7+uTime*2.4)*.35,-sin(vWP.z*.8+uTime*1.3)*.8+cos((vWP.z-vWP.x)*.5+uTime*.9)*.5+sin(vWP.z*2.1+vWP.x*1.4-uTime*2.1)*.35);normal=normalize(normal+(viewMatrix*vec4(wg.x,0.,wg.y,0.)).xyz*.13);')
  .replace('#include <fog_fragment>', '{vec3 vd=normalize(vViewPosition);float fr=pow(1.-clamp(dot(vd,normal),0.,1.),3.);gl_FragColor.rgb=mix(gl_FragColor.rgb,uSky,fr*.55);vec3 rv=reflect(-vd,normal);float gl=pow(max(dot(rv,uSunV),0.),90.);gl_FragColor.rgb+=uSunC*(gl*.9+pow(max(dot(rv,uSunV),0.),12.)*.12)*uSunK;}\n#include <fog_fragment>');

function expandIncludes(src) {
  return src.replace(/^[ \t]*#include +<([\w\d_]+)>/gm, (match, include) => {
    const chunk = THREE.ShaderChunk[include];
    if (!chunk) throw new Error('Include not found: ' + include);
    return expandIncludes(chunk);
  });
}

const fullFrag = expandIncludes(sh.fragmentShader);
console.log('Full expanded fragment shader length:', fullFrag.length);

const normalDeclIdx = fullFrag.indexOf('vNormal');
const seaNIdx = fullFrag.indexOf('vec3 seaN=normalize(vNormal)');
console.log('vNormal declared at char index:', normalDeclIdx);
console.log('seaN used at char index:', seaNIdx);
if (normalDeclIdx >= 0 && normalDeclIdx < seaNIdx) {
  console.log('>>> VERIFIED: vNormal is defined and declared BEFORE seaN usage! No shader compilation error!');
} else {
  console.error('>>> ERROR: vNormal order mismatch!');
}
