// uso: npm run revisar   (o: node tools/refactor/buscar_errores.js <archivos.js...>)
// busca nombres que no se declaran en ningún lado (ReferenceError al ejecutarse) y claves repetidas en objetos
const fs=require('fs'),acorn=require('acorn'),escope=require('eslint-scope'),walk=require('acorn-walk');
// sin argumentos revisa todo el código del juego y del servidor
const path=require('path');
const todos=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?todos(path.join(dir,e.name)):e.name.endsWith('.js')?[path.join(dir,e.name)]:[]);
const raiz=path.join(__dirname,'..','..');
const files=process.argv.length>2?process.argv.slice(2):todos(path.join(raiz,'js')).concat(todos(path.join(raiz,'server')));
// nombres globales que crean los propios archivos del juego (window.X = ..., o declaraciones de nivel superior)
const own=new Set();
for(const f of files){const s=fs.readFileSync(f,'utf8');for(const m of s.matchAll(/(?:window|root)\.([A-Za-z_$][\w$]*)\s*=/g))own.add(m[1]);for(const m of s.matchAll(/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm))own.add(m[1]);}
const B=new Set(Object.getOwnPropertyNames(globalThis).concat('window','document','navigator','location','localStorage','sessionStorage','performance','requestAnimationFrame','cancelAnimationFrame','THREE','Image','Audio','AudioContext','webkitAudioContext','HTMLCanvasElement','HTMLElement','Element','Node','Event','CustomEvent','KeyboardEvent','MouseEvent','PointerEvent','TouchEvent','getComputedStyle','innerWidth','innerHeight','devicePixelRatio','screen','history','alert','confirm','prompt','open','close','fetch','Blob','File','FileReader','URL','URLSearchParams','Worker','WebSocket','RTCPeerConnection','RTCSessionDescription','RTCIceCandidate','MediaRecorder','ResizeObserver','MutationObserver','IntersectionObserver','crypto','indexedDB','caches','self','top','parent','frames','opener','addEventListener','removeEventListener','dispatchEvent','setTimeout','setInterval','clearTimeout','clearInterval','queueMicrotask','structuredClone','atob','btoa','console','matchMedia','scrollTo','scrollX','scrollY','pageXOffset','pageYOffset','visualViewport','DOMParser','XMLSerializer','OffscreenCanvas','ImageData','createImageBitmap','Path2D','DOMMatrix','FontFace','Notification','ServiceWorker','BroadcastChannel','TextEncoder','TextDecoder','AbortController','Headers','Request','Response','FormData','Gamepad','speechSynthesis','SpeechSynthesisUtterance','origin','isSecureContext','name','status','focus','blur','print','firebase','module','require','exports','__dirname','process','globalThis','mqtt','Paho','DeviceOrientationEvent','DeviceMotionEvent','screenX','screenY','outerWidth','outerHeight','getSelection','CSS','HTMLInputElement','HTMLImageElement','HTMLVideoElement','HTMLAudioElement','SVGElement','ClipboardItem','PerformanceObserver','DecompressionStream','CompressionStream','ReadableStream','WritableStream','Intl','WebAssembly','event','external','closed','length','frameElement','customElements','HTMLDivElement','HTMLCanvasElement','GPU','VideoFrame','AudioBuffer','OfflineAudioContext','GainNode','MediaStream','RTCDataChannel','webkitURL','XMLHttpRequest','ImageDecoder'));
let n=0;
for(const f of files){
  const src=fs.readFileSync(f,'utf8').replace(/=> eval\(s\)/g,'=> evxl(s)');
  let ast;try{ast=acorn.parse(src,{ecmaVersion:2022,locations:true,ranges:true,allowHashBang:true});}catch(e){console.log(f,'NO PARSEA',e.message);continue;}
  const sm=escope.analyze(ast,{ecmaVersion:2022,sourceType:'script'});
  const g=sm.globalScope;const seen=new Set();
  for(const r of g.through){const nm=r.identifier.name;if(B.has(nm)||own.has(nm)||nm==='evxl')continue;
    // dentro de with(A){...}: no se puede saber (habilidades)
    let p=r.from,inWith=false;while(p){if(p.type==='with'){inWith=true;break;}p=p.upper;}if(inWith)continue;
    const k=nm+':'+r.identifier.loc.start.line;if(seen.has(k))continue;seen.add(k);
    const typ=(()=>{try{const line=src.split('\n')[r.identifier.loc.start.line-1];return /typeof\s+$/.test(line.slice(0,r.identifier.loc.start.column))?'typeof':''}catch(e){return ''}})();
    if(typ)continue;
    console.log(f+':'+r.identifier.loc.start.line+'  nombre sin declarar: '+nm);n++;}
  walk.simple(ast,{ObjectExpression(o){const ks=new Map();for(const p of o.properties){if(p.type!=='Property'||p.computed||p.kind!=='init')continue;const k=p.key.name||p.key.value;if(ks.has(k)){console.log(f+':'+p.loc.start.line+'  clave repetida en objeto: '+k+' (también en línea '+ks.get(k)+')');n++;}ks.set(k,p.loc.start.line);}}});
}
console.log('total',n);
