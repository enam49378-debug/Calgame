// Atmósfera y clima de Ciudad Aurora
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_CLIMA = window.CF_CLIMA || {};

window.CF_CLIMA.crearAtmosfera = function crearAtmosfera(D) {
  'use strict';
  const { $, ARENA, CITY, CITY_PLAN, COL, HEMI, MAPCUR, SKY, SPAWN_POINTS, SUN_DIR, TAU, V3, ZZZ_U, _c, camera, clamp, colQuery, mapNow, pixTex, scene, sun, updateSunShadowFocus, worldBig } = D;

// ================= Atmósfera de Ciudad Aurora =================
// Efectos visuales independientes de la física y del daño. Un único lote por efecto de lluvia.
// Núcleo compartido por servidor y juego: una sola línea temporal por sala.
// clima, hora y rayos de la sala: el mismo código que usa el servidor (js/ambiente.js)
const ROOM_ATMOSPHERE = CF_AMBIENTE.crear({ edificios: CITY_PLAN.map(b => [b.x, b.z, b.w, b.d, b.h, b.accessible]), limites: () => ({ bounds: CITY.bounds, arena: ARENA }) });

const WX = {
  hour:11, cycle:true, mode:'auto', quality:'full', sound:true, elapsed:0, time:0,
  rain:0, cloud:0, wet:0, night:0, flash:0, stormWait:18, hudWait:0,
  skyTop:new THREE.Color(), skyHorizon:new THREE.Color(), objects:[], lampLights:[], materials:[],
};
try {
  const cfg=JSON.parse(localStorage.getItem('bsb_atmosphere_v1')||'null');
  if(cfg){
    if(Number.isFinite(cfg.hour))WX.hour=clamp(cfg.hour,0,23.95);
    if(typeof cfg.cycle==='boolean')WX.cycle=cfg.cycle;
    if(['auto','clear','cloudy','rain','storm'].includes(cfg.mode))WX.mode=cfg.mode;
    if(['full','light'].includes(cfg.quality))WX.quality=cfg.quality;
    if(typeof cfg.sound==='boolean')WX.sound=cfg.sound;
  }
} catch(e){}
function wxRandom(seed){let a=seed>>>0;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
const wxRandomValue=wxRandom(8197);
const WX_ROOM={state:ROOM_ATMOSPHERE.create(8197),source:null,lastPacket:-1,received:0,seen:new Set(),visuals:new Map(),owner:null,uiWait:0};
ROOM_ATMOSPHERE.command(WX_ROOM.state,{hour:WX.hour,cycle:WX.cycle,mode:WX.mode});
function atmosphereLeader(){
  if(!D.G.mp||!D.NET.named)return null;
  if(D.NET.named.environment&&D.NET.named.environmentHost)return D.NET.named.environmentHost;
  const me=D.NET.named.myId||D.NET.myPeer;
  const peers=D.NET.named.peers().filter(p=>p.presence&&p.presence.st==='play'&&p.presence.ch!=='dummy'&&!(String(p.peer).includes('-d'))&&!/-b\d+$/.test(String(p.peer)));
  if(!peers.some(p=>p.peer===me)&&D.G.state==='play')peers.push({peer:me,presence:{jt:D.NET.joinT}});
  peers.sort((a,b)=>(a.presence.jt||Infinity)-(b.presence.jt||Infinity)||String(a.peer).localeCompare(String(b.peer)));
  return peers[0]?.peer||me;
}
function canEditAtmosphere(){return !D.G.mp||!D.NET.named||atmosphereLeader()===(D.NET.named.myId||D.NET.myPeer);}
function atmosphereCommand(command){
  if(!canEditAtmosphere())return false;
  if(D.G.mp&&D.NET.named?.environment&&D.NET.named.weatherCommand){D.NET.named.weatherCommand(command);return true;}
  ROOM_ATMOSPHERE.command(WX_ROOM.state,command);D.NET.sendT=0;return true;
}
function atmospherePayload(){
  if(!D.G.mp||!D.NET.named||D.NET.named.environment||!canEditAtmosphere())return null;
  return ROOM_ATMOSPHERE.snapshot(WX_ROOM.state);
}
function weatherEntityId(f,i){return f.netId||f.peer||(f.isPlayer?(D.NET.named?.myId||D.NET.myPeer||'solo-player'):'solo-'+i);}
function atmospherePlayers(){return D.G.fighters.map((f,i)=>({id:weatherEntityId(f,i),x:f.pos.x,y:f.pos.y,z:f.pos.z,alive:f.alive,safe:f.remote?!!f.net?.wxSafe:f.iframes>0||!!f.cineLock||!!f.choreTrack}));}
function adoptAtmosphere(packet,source,ping=0){
  const s=ROOM_ATMOSPHERE.parse(packet);if(!s)return;
  if(WX_ROOM.source===source&&s.t<=WX_ROOM.lastPacket)return;
  WX_ROOM.lastPacket=s.t;WX_ROOM.source=source;WX_ROOM.received=performance.now();
  // Compensación acotada del viaje; nunca se comparan relojes del sistema de dos jugadores.
  ROOM_ATMOSPHERE.advance(s,clamp(ping/2000,0,.25),[],false);WX_ROOM.state=s;
}
function advanceAtmosphere(dt,instant){
  const me=D.G.mp&&D.NET.named?(D.NET.named.myId||D.NET.myPeer):null;
  const server=D.G.mp&&D.NET.named?.environment;
  let authority=true;
  if(server){adoptAtmosphere(server,'server:'+D.NET.named.name+':'+server.seed,D.NET.named.ping||0);authority=false;}
  else if(me){
    const leader=atmosphereLeader();WX_ROOM.owner=leader;authority=leader===me;
    if(!authority){const peer=D.NET.named.peers().find(p=>p.peer===leader);if(peer?.presence?.wx)adoptAtmosphere(peer.presence.wx,'peer:'+leader,D.NET.named.ping||0);}
    else if(WX_ROOM.source!=='host:'+me){WX_ROOM.source='host:'+me;WX_ROOM.lastPacket=-1;}
  }else{
    WX_ROOM.source=null;WX_ROOM.lastPacket=-1;
    // Permite las vistas previas existentes y conserva las preferencias de un jugador sin sala.
    if(instant)ROOM_ATMOSPHERE.command(WX_ROOM.state,{mode:WX.mode,hour:WX.hour,cycle:WX.cycle});
  }
  const s=WX_ROOM.state;
  if(authority)s.mapa=mapNow().id;   // el ciclo de clima es el del mapa donde se juega (viaja en el estado: los demás lo reciben)
  if(instant&&!me){ROOM_ATMOSPHERE.warm(s);}
  ROOM_ATMOSPHERE.advance(s,dt,authority?atmospherePlayers():[],authority&&D.G.state==='play'&&!D.G.viewer&&!D.G.cine);
  for(const k of ['hour','cycle','mode','elapsed','rain','cloud','wet','snow','wind','fogStrength'])WX[k]=s[k];
  WX.fogAmount=s.fog;WX.time=s.t;WX.kind=ROOM_ATMOSPHERE.kind(s);
  updateAtmosphereStrikes(s);
  WX_ROOM.uiWait-=dt;
  if(WX_ROOM.uiWait<=0||instant){
    WX_ROOM.uiWait=.25;const edit=canEditAtmosphere();
    document.querySelectorAll('[data-hour],#wx-hour,#wx-cycle,#wx-weather,#wx-fog').forEach(el=>{el.disabled=!edit;});
    $('wx-roomstatus').textContent=D.G.mp?(edit?'Clima de la sala · controles del anfitrión':'Clima compartido · lo controla el anfitrión'):'Ambiente de la partida';
    if(document.activeElement!==$('wx-weather'))$('wx-weather').value=WX.mode;
    if(document.activeElement!==$('wx-cycle'))$('wx-cycle').checked=WX.cycle;
  }
}
function lightningDamage(f,event,amount){
  if(!f||f.remote||!f.alive||f.iframes>0||f.cineLock)return;
  f.hp-=clamp(amount,0,35);f.flashT=.18;f.hurtT=.35;f.hurtPose='hurtB';f.blocking=false;
  if(f.action)D.endAction(f);f.stun=Math.max(f.stun,.55);f.vel.y=Math.max(f.vel.y,7);f.onGround=false;
  D.burst(D.chestOf(f),16,'#a9d8ff',8,.12,.5,.4);
  if(f.isPlayer){D.popText(D.chestOf(f),'-'+Math.round(amount)+' · RAYO','#ffe28a',22);D.G.shake=Math.max(D.G.shake,.25);}
  if(f.hp<=0){D.kill(f,null);if(f.isPlayer){$('deathby').textContent='Te alcanzó un rayo';if(D.G.mp&&D.NET.ko)D.NET.ko.cause='rayo';}}
}
function buildLightningVisual(event){
  const root=new THREE.Group(),bolt=new THREE.Group(),rng=wxRandom(ROOM_ATMOSPHERE.hash(event.id)),points=[];
  for(let i=0;i<=9;i++){const t=i/9;points.push(new V3(event.x+(i===9?0:(rng()-.5)*2.4),event.y+30*(1-t),event.z+(i===9?0:(rng()-.5)*1.5)));}
  const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
  for(const [r,c,a]of [[.16,0x72a9ff,.28],[.045,0xf4fbff,1]])bolt.add(new THREE.Mesh(new THREE.TubeGeometry(curve,45,r,4,false),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:a,depthWrite:false})));
  const shock=new THREE.Mesh(new THREE.RingGeometry(.7,.78,32),new THREE.MeshBasicMaterial({color:0xb5d6ff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));shock.rotation.x=-Math.PI/2;shock.position.set(event.x,event.y+.035,event.z);
  root.add(bolt,shock);root.visible=false;scene.add(root);return {root,bolt,shock,played:false};
}
function updateAtmosphereStrikes(s){
  const visible=D.G.state==='play'&&!D.G.grade&&!D.STAGE.on&&!D.G.viewer,active=new Set();
  for(const e of s.strikes){
    active.add(e.id);let v=WX_ROOM.visuals.get(e.id);if(!v){v=buildLightningVisual(e);WX_ROOM.visuals.set(e.id,v);}
    const age=s.t-e.at;v.root.visible=visible&&age>=0&&age<.65;v.bolt.visible=age>=0&&age<.42;v.shock.visible=age>=0&&age<.55;
    v.shock.scale.setScalar(1+Math.max(0,age)*5);v.shock.material.opacity=Math.max(0,.65-age*1.3);
    if(age>=0&&!v.played){v.played=true;if(visible&&age<.65){WX.flash=.34;if(WX.sound&&D.AC){if(D.SND.buf.thunder1)D.playSnd(Math.random()<.5?'thunder1':'thunder2',.9,null,.1);else D.nz(D.AC.currentTime+.04,1.4,180,.4,.32,'lowpass','ambient');}}}
    if(e.resolved&&!WX_ROOM.seen.has(e.id)){
      WX_ROOM.seen.add(e.id);for(const hit of e.victims){const f=D.G.fighters.find((f,i)=>!f.remote&&weatherEntityId(f,i)===hit.id);lightningDamage(f,e,hit.damage);}
    }
  }
  for(const [id,v]of WX_ROOM.visuals)if(!active.has(id)){scene.remove(v.root);v.root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});WX_ROOM.visuals.delete(id);}
  if(WX_ROOM.seen.size>256)WX_ROOM.seen=new Set([...WX_ROOM.seen].slice(-128));
}

const WX_PRESETS=ROOM_ATMOSPHERE.presets;
function cityWeatherNow(){return WX.kind||ROOM_ATMOSPHERE.kind(WX_ROOM.state);}
const wxLite=()=>WX.quality==='light'||D.GFX.level>=2;
function saveCityWeather(){try{localStorage.setItem('bsb_atmosphere_v1',JSON.stringify({hour:WX.hour,cycle:WX.cycle,mode:WX.mode,quality:WX.quality,sound:WX.sound}));}catch(e){}}
function setCityTime(hour,cycle=false){if(!Number.isFinite(+hour))return;if(atmosphereCommand({hour:((+hour%24)+24)%24,cycle:!!cycle})){WX.hour=((+hour%24)+24)%24;WX.cycle=!!cycle;saveCityWeather();syncWeatherControls();}}
function setCityWeather(mode){if(mode!=='auto'&&!WX_PRESETS[mode])return;if(atmosphereCommand({mode})){WX.mode=mode;WX.elapsed=0;saveCityWeather();syncWeatherControls();}}

{
  const add=o=>{scene.add(o);o.userData.atmosphere=true;WX.objects.push(o);return o;};
  const skyUniforms={uSunDir:{value:new THREE.Vector3(0,1,0)},uSunset:{value:0},uSunVis:{value:1},uNight:ZZZ_U.night,uTop:{value:new THREE.Color(0x568fd0)},uHorizon:{value:new THREE.Color(SKY)},uLow:{value:new THREE.Color(0x7e9ab7)},uCloud:{value:0},uTime:{value:0}};
  WX.sky=add(new THREE.Mesh(new THREE.SphereGeometry(315,32,16),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,uniforms:skyUniforms,
    vertexShader:'varying vec3 vDir; void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vDir; uniform vec3 uTop,uHorizon,uLow,uSunDir; uniform float uCloud,uTime,uSunset,uSunVis,uNight;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(a),hash(a+vec2(1,0)),f.x),mix(hash(a+vec2(0,1)),hash(a+vec2(1,1)),f.x),f.y);}
      void main(){vec3 d=normalize(vDir);float y=d.y;
        vec3 c=mix(uHorizon,uTop,pow(max(y,0.),.45));c=mix(c,uLow,1.-smoothstep(-.5,0.,y));
        float horizGlow=smoothstep(-.08,.24,y)*(1.-smoothstep(.02,.48,y));
        c+=mix(vec3(.22,.16,.08),vec3(.32,.12,.02),uSunset)*horizGlow*.65*(1.-uNight*.9);
        vec2 p=d.xz/max(.13,y+.25)*2.5+vec2(uTime*.007,0.);
        float n=noise(p)*.65+noise(p*2.1)*.25+noise(p*4.3)*.1;
        float cloudEdge=smoothstep(.52-uCloud*.3,.58-uCloud*.25,n)*smoothstep(-.08,.2,y)*uCloud;
        float cloudShadow=smoothstep(.58-uCloud*.3,.74-uCloud*.22,n);
        vec3 dayCloud=mix(mix(vec3(.72,.78,.92),vec3(.88,.64,.72),uSunset),vec3(1.0,1.0,.98),cloudShadow);
        vec3 nightCloud=mix(vec3(.07,.10,.20),vec3(.16,.21,.36),cloudShadow);
        vec3 cloudColor=mix(dayCloud,nightCloud,uNight);
        c=mix(c,cloudColor,cloudEdge*(1.-uNight*.35)*.82);
        float sd=max(dot(d,uSunDir),0.);
        c+=vec3(1.,.52,.22)*pow(sd,5.)*uSunset*.65*smoothstep(-.25,.15,y+.1)+vec3(1.,.82,.5)*pow(sd,36.)*.5*uSunVis;
        c=mix(c,vec3(1.,.96,.82),smoothstep(.9984,.9993,sd)*uSunVis*(1.-uCloud*.75));
        c+=vec3(1.,.85,.55)*smoothstep(.994,.9984,sd)*.35*uSunVis*(1.-uCloud*.75);
        gl_FragColor=vec4(c,1.);
      }`
  })));WX.sky.renderOrder=-20;
  const moonTexture=pixTex(128,128,g=>{
    g.clearRect(0,0,128,128);g.fillStyle='#e1e9ef';g.beginPath();g.arc(64,64,56,0,TAU);g.fill();
    for(const [x,y,r]of [[40,37,13],[88,49,9],[58,88,15],[86,88,6],[35,73,7]]){g.fillStyle='rgba(130,157,181,.21)';g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
  });
  WX.moon=add(new THREE.Sprite(new THREE.SpriteMaterial({map:moonTexture,transparent:true,fog:false,depthWrite:false})));WX.moon.scale.set(15,15,1);
  WX.moonLight=new THREE.DirectionalLight(0x98baff,0);WX.moonLight.position.set(-25,50,-20);scene.add(WX.moonLight);
  WX.fillLight=new THREE.DirectionalLight(0xb7d0ff,0);scene.add(WX.fillLight,WX.fillLight.target);
  const glowTexture=pixTex(128,128,g=>{const q=g.createRadialGradient(64,64,0,64,64,64);q.addColorStop(0,'rgba(255,240,196,.8)');q.addColorStop(.2,'rgba(255,221,160,.25)');q.addColorStop(1,'rgba(255,221,160,0)');g.fillStyle=q;g.fillRect(0,0,128,128);});
  WX.sunGlow=add(new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,transparent:true})));WX.sunGlow.scale.set(58,58,1);
  const stars=new Float32Array(420*3),seeds=new Float32Array(420);
  for(let i=0;i<420;i++){
    const a=wxRandomValue()*TAU,y=.08+wxRandomValue()*.92,r=Math.sqrt(1-y*y)*260;
    stars.set([Math.cos(a)*r,y*260,Math.sin(a)*r],i*3);seeds[i]=wxRandomValue();
  }
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(stars,3));starGeo.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  WX.stars=add(new THREE.Points(starGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uOpacity:{value:0},uTime:{value:0}},
    vertexShader:'attribute float aSeed; varying float vSeed; void main(){vSeed=aSeed;gl_PointSize=1.2+aSeed*1.7;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float uOpacity,uTime;varying float vSeed;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d)*uOpacity*(.7+.3*sin(uTime*.7+vSeed*50.));gl_FragColor=vec4(.8,.89,1.,a);}'
  })));
  // Alturas de techos y toldos: la lluvia no atraviesa los edificios.
  const n=512,roof=new Uint8Array(n*n);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
    const wx=(x+.5)/n*256-128,wz=(z+.5)/n*256-128;let h=.1;
    const nearR=colQuery(wx,wz,0.16);
    for(let ci=0;ci<nearR.length;ci++){const c=nearR[ci];if(Math.abs(wx-c.x)<c.hx+.15&&Math.abs(wz-c.z)<c.hz+.15)h=Math.max(h,c.h+.1);}
    for(const b of CITY.buildings){const f=b.z<0?1:-1,front=b.z+f*b.d/2;if(b.label&&!b.model&&Math.abs(wx-b.x)<b.w/2&&Math.abs(wz-(front+f*.55))<.7)h=Math.max(h,2.42);}
    for(const p of CITY.parks)if(Math.abs(wx-p.x)<1.5&&Math.abs(wz-p.z)<1.5)h=Math.max(h,4.65);
    roof[z*n+x]=Math.round(Math.min(64,h)/64*255);
  }
  WX.roof=new THREE.DataTexture(roof,n,n,THREE.LuminanceFormat);WX.roof.magFilter=WX.roof.minFilter=THREE.NearestFilter;WX.roof.needsUpdate=true;
  const shared={uTime:{value:0},uRain:{value:0},uCenter:{value:new V3()},uRoof:{value:WX.roof},uWind:{value:new THREE.Vector2(1,0)},uNight:{value:0},uFog:{value:new THREE.Color(SKY)}};
  WX.rainUniforms=shared;
  const count=3200,rainGeo=new THREE.InstancedBufferGeometry().copy(new THREE.PlaneBufferGeometry(1,1)),offsets=new Float32Array(count*3),random=new Float32Array(count*2);
  for(let i=0;i<count;i++){offsets.set([(wxRandomValue()-.5)*58,wxRandomValue()*26,(wxRandomValue()-.5)*58],i*3);random.set([wxRandomValue(),wxRandomValue()],i*2);}
  rainGeo.setAttribute('aOffset',new THREE.InstancedBufferAttribute(offsets,3));rainGeo.setAttribute('aSeed',new THREE.InstancedBufferAttribute(random,2));rainGeo.instanceCount=count;
  WX.rainMesh=add(new THREE.Mesh(rainGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:shared,
    vertexShader:`attribute vec3 aOffset;attribute vec2 aSeed;uniform float uTime,uRain;uniform vec3 uCenter;uniform vec2 uWind;uniform sampler2D uRoof;varying vec2 vUv;varying float vAlpha;
      void main(){vec2 p=uCenter.xz+mod(aOffset.xz+uWind*uTime*.65+29.,58.)-29.;
        float floorY=texture2D(uRoof,clamp((p+128.)/256.,0.,1.)).r*64.;float y=mod(aOffset.y-uTime*(23.+aSeed.x*10.)+26000.,26.);
        vec3 center=vec3(p.x,floorY+y,p.y);vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
        vec3 down=vec3(-uWind.x*.06,1.,-uWind.y*.06);float len=.35+aSeed.y*.65;
        vec3 world=center+right*position.x*(.013+aSeed.x*.013)+down*position.y*len;
        vec4 mv=viewMatrix*vec4(world,1.);gl_Position=projectionMatrix*mv;vUv=uv;
        vAlpha=step(aSeed.x,uRain)*smoothstep(.08,.4,y)*(1.-smoothstep(16.,33.,-mv.z))*(.26+.28*aSeed.y);
      }`,
    fragmentShader:`varying vec2 vUv;varying float vAlpha;uniform float uNight;uniform vec3 uFog;
      void main(){float a=pow(max(0.,1.-abs(vUv.x-.5)*2.),1.3)*sin(vUv.y*3.14159)*vAlpha;
        gl_FragColor=vec4(mix(vec3(.7,.83,.9),vec3(.67,.79,.99),uNight),a);}`
  })));WX.rainMesh.frustumCulled=false;WX.rainMesh.renderOrder=4;
  // Anillos y pequeñas gotas de impacto, también sobre las azoteas.
  const splashCount=210,splashGeo=new THREE.InstancedBufferGeometry().copy(new THREE.PlaneBufferGeometry(1,1)),splashOffsets=new Float32Array(splashCount*3);
  for(let i=0;i<splashCount;i++)splashOffsets.set([(wxRandomValue()-.5)*44,wxRandomValue(),(wxRandomValue()-.5)*44],i*3);
  splashGeo.setAttribute('aOffset',new THREE.InstancedBufferAttribute(splashOffsets,3));splashGeo.instanceCount=splashCount;
  WX.splashes=add(new THREE.Mesh(splashGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:shared,
    vertexShader:`attribute vec3 aOffset;uniform vec3 uCenter;uniform float uTime,uRain;uniform sampler2D uRoof;varying vec2 vUv;varying float vPhase,vAlpha;
      void main(){vec2 p=floor(uCenter.xz/4.)*4.+aOffset.xz;float h=texture2D(uRoof,clamp((p+128.)/256.,0.,1.)).r*64.;
        vPhase=fract(uTime*1.85+aOffset.y);float size=.08+vPhase*.52;
        vec3 world=vec3(p.x+position.x*size,h+.025,p.y+position.y*size);gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
        vUv=uv;vAlpha=uRain*(1.-vPhase)*smoothstep(0.,.06,vPhase);}`,
    fragmentShader:`varying vec2 vUv;varying float vPhase,vAlpha;void main(){float d=length(vUv-.5)*2.;float ring=1.-smoothstep(.035,.13,abs(d-.72));float dots=pow(max(0.,cos(atan(vUv.y-.5,vUv.x-.5)*5.)),16.)*(1.-smoothstep(.03,.14,abs(d-.42)));gl_FragColor=vec4(.72,.86,.95,(ring*.45+dots*.65)*vAlpha);}`
  })));WX.splashes.frustumCulled=false;WX.splashes.renderOrder=3;
  const dropGeo=new THREE.BufferGeometry(),dropPos=new Float32Array(splashCount*9),dropSeeds=new Float32Array(splashCount*3);
  for(let i=0;i<splashCount;i++)for(let j=0;j<3;j++){
    dropPos.set([splashOffsets[i*3],splashOffsets[i*3+1],splashOffsets[i*3+2]],(i*3+j)*3);dropSeeds[i*3+j]=j/3+i*.137;
  }
  dropGeo.setAttribute('position',new THREE.BufferAttribute(dropPos,3));dropGeo.setAttribute('aSeed',new THREE.BufferAttribute(dropSeeds,1));
  WX.drops=add(new THREE.Points(dropGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:shared,
    vertexShader:`attribute float aSeed;uniform vec3 uCenter;uniform float uTime,uRain;uniform sampler2D uRoof;varying float vAlpha;
      void main(){float phase=fract(uTime*1.85+position.y);vec2 p=floor(uCenter.xz/4.)*4.+position.xz;
        p+=vec2(cos(aSeed*40.),sin(aSeed*40.))*phase*.38;
        float h=texture2D(uRoof,clamp((p+128.)/256.,0.,1.)).r*64.;
        vec4 mv=viewMatrix*vec4(p.x,h+.03+sin(min(1.,phase*1.8)*3.14159)*.24,p.y,1.);
        gl_Position=projectionMatrix*mv;gl_PointSize=clamp(22./max(1.,-mv.z),1.,3.);
        vAlpha=(1.-smoothstep(.1,.56,phase))*uRain*.6;}`,
    fragmentShader:'varying float vAlpha;void main(){float a=(1.-smoothstep(.1,.5,length(gl_PointCoord-.5)))*vAlpha;gl_FragColor=vec4(.76,.87,1.,a);}'
  })));WX.drops.frustumCulled=false;WX.drops.renderOrder=4;

  const puddles=[];
  for(let i=0;i<300&&puddles.length<42;i++){
    let x=(wxRandomValue()-.5)*68,z=(wxRandomValue()-.5)*68;
    if(Math.hypot(x,z)>36||Math.hypot(x,z)<4)continue;
    const road=Math.abs(x)<3.5||Math.abs(z)<3.5||Math.abs(Math.abs(x)-22)<1.9||Math.abs(Math.abs(z)-22)<1.9;
    if(!road||COL.some(c=>Math.abs(x-c.x)<c.hx+2&&Math.abs(z-c.z)<c.hz+2)||SPAWN_POINTS.some(p=>Math.hypot(x-p.x,z-p.z)<2.5))continue;
    puddles.push([x,z,.7+wxRandomValue()*1.5,.35+wxRandomValue()*.75,wxRandomValue()*TAU]);
  }
  WX.puddleUniforms={uTime:shared.uTime,uNight:shared.uNight,uBeta:ZZZ_U.beta,uSunset:ZZZ_U.sunset,uWet:{value:0},uSky:{value:WX.skyHorizon}};
  const puddleMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:WX.puddleUniforms,
    vertexShader:'varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vec4 p=modelMatrix*instanceMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
    fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform float uTime,uWet,uNight,uBeta,uSunset;uniform vec3 uSky;
      void main(){vec2 p=(vUv-.5)*2.;float a=atan(p.y,p.x);float boundary=.82+sin(a*5.+vWorld.x)*.08+sin(a*9.)*.035;
        float dist=length(p);float edge=1.-smoothstep(boundary-.1,boundary,dist);
        if(uBeta>.5){
          float ring1=sin(dist*24.-uTime*7.5+vWorld.x*3.1);
          float ring2=sin(length(p-vec2(.32,-.26))*28.-uTime*8.2+vWorld.z*2.7);
          float ripple=(ring1*.55+ring2*.45)*smoothstep(.75,.1,dist)*.035;
          vec3 view=normalize(cameraPosition-vWorld);float fresnel=pow(1.-max(0.,view.y),2.6);
          float streak=pow(max(0.,1.-abs(p.x+ripple*3.)*.82),9.)*(.45+.55*sin(p.y*24.+ripple*22.+uTime*.6));
          vec3 skyRefl=mix(uSky*.78+.08,mix(vec3(.07,.13,.28),vec3(.16,.30,.58),fresnel),uNight);
          skyRefl=mix(skyRefl,vec3(.96,.52,.38),uSunset*.45*(1.-uNight));
          vec3 neonCol=mix(vec3(.32,.86,1.),vec3(1.,.64,.30),step(0.,sin(vWorld.x*1.7+vWorld.z*1.3)));
          neonCol=mix(neonCol,vec3(1.,.36,.72),smoothstep(.5,1.,sin(vWorld.z*2.3)*.5+.5)*.45);
          vec3 c=mix(vec3(.08,.12,.22),skyRefl,.52+fresnel*.46);
          c+=neonCol*streak*(.22+uNight*.72+.30*uSunset);
          c+=vec3(.24,.38,.58)*smoothstep(boundary-.14,boundary-.03,dist)*(.35+fresnel*.4);
          gl_FragColor=vec4(c,edge*uWet*(.42+fresnel*.46));
        }else{
          float wave=sin(vWorld.x*12.+uTime*2.)*sin(vWorld.z*9.-uTime*1.6)*.018;
          vec3 view=normalize(cameraPosition-vWorld);float fresnel=pow(1.-max(0.,view.y),3.);
          float light=pow(max(0.,1.-abs(p.x+wave*2.)*.9),12.)*(.35+.65*sin(p.y*30.+wave*15.+uTime*.25)*sin(p.y*30.+wave*15.+uTime*.25));
          vec3 c=mix(vec3(.15,.24,.3),uSky*.65+.12,.55+fresnel*.35);
          c+=vec3(.85,.5,.19)*light*uNight*.45;c+=vec3(.15,.25,.3)*light*(1.-uNight)*.35;
          gl_FragColor=vec4(c,edge*uWet*(.32+fresnel*.4));
        }}`
  });
  WX.puddles=add(new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),puddleMat,puddles.length));
  const matrix=new THREE.Matrix4(),quat=new THREE.Quaternion(),pos=new V3(),scale=new V3();
  puddles.forEach(([x,z,w,d,angle],i)=>{
    quat.setFromEuler(new THREE.Euler(-Math.PI/2,0,angle));matrix.compose(pos.set(x,.058,z),quat,scale.set(w*2,d*2,1));WX.puddles.setMatrixAt(i,matrix);
  });WX.puddles.renderOrder=1;WX.puddles.frustumCulled=false;
  // Halo de las farolas: cuatro luces cercanas, sin mapas de sombra adicionales.
  WX.lampPoolMat=new THREE.MeshBasicMaterial({map:glowTexture,color:0xffbb6d,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  WX.lampHaloMat=new THREE.SpriteMaterial({map:glowTexture,color:0xffe0a2,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  for(const p of CITY.lamps){
    const pool=add(new THREE.Mesh(new THREE.PlaneGeometry(8,8),WX.lampPoolMat));pool.rotation.x=-Math.PI/2;pool.position.set(p.x,.11,p.z);
    const halo=add(new THREE.Sprite(WX.lampHaloMat));halo.position.set(p.x,3.65,p.z);halo.scale.set(1.8,1.8,1);
  }
  for(let i=0;i<4;i++){const light=new THREE.PointLight(0xffc584,0,12,2);scene.add(light);WX.lampLights.push(light);}
  // Chorros de agua de la fuente; permanecen dentro de su base de colisión.
  const jetMat=new THREE.MeshPhongMaterial({color:0xa9dfed,transparent:true,opacity:.62,shininess:95,emissive:0x1c3540});
  for(let i=0;i<6;i++){
    const angle=i/6*TAU,points=[];
    for(let j=0;j<=12;j++){const t=j/12,r=t*.95;points.push(new V3(CITY.fountain.x+Math.cos(angle)*r,1.25+Math.sin(t*Math.PI)*.65-t*.78,CITY.fountain.z+Math.sin(angle)*r));}
    const jet=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.019,4,false),jetMat);scene.add(jet);
  }
}
function cityWeatherAudio(dt,visible){
  if(!D.AC||!D.master)return;
  if(WX.audio&&((!WX.rainReal&&D.SND.buf.rain)||D.G.state!=='play')){
    const {source,filter,gain}=WX.audio;source.stop();source.disconnect();filter.disconnect();gain.disconnect();WX.audio=null;
  }
  if(!WX.audio&&(!visible||!WX.sound||WX.rain<.005))return;
  if(!WX.audio){
    const source=D.AC.createBufferSource();source.buffer=D.SND.buf.rain||D.NB;source.loop=true;WX.rainReal=!!D.SND.buf.rain;
    const filter=D.AC.createBiquadFilter();filter.type='lowpass';filter.frequency.value=WX.rainReal?9000:1800;
    const gain=D.AC.createGain();gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(D.soundChannel('ambient'));source.start();WX.audio={source,filter,gain};
  }
  const roof=WX.rainUniforms.uCenter.value,n=WX.roof.image.width,ix=clamp(Math.floor((roof.x+128)/256*n),0,n-1),iz=clamp(Math.floor((roof.z+128)/256*n),0,n-1);
  const underCover=WX.roof.image.data[iz*n+ix]/255*64>roof.y+1.8;
  const volume=visible&&WX.sound?WX.rain*(underCover?.018:.075)*(WX.rainReal?2.6:1):0;
  if(WX.audio.volume==null||Math.abs(WX.audio.volume-volume)>.0005){WX.audio.gain.gain.setTargetAtTime(volume,D.AC.currentTime,.3);WX.audio.volume=volume;}
}
function syncWeatherControls(){
  $('wx-weather').value=WX.mode;$('wx-cycle').checked=WX.cycle;$('wx-quality').value=WX.quality;$('wx-sound').checked=WX.sound;
  $('wx-hour').value=WX.hour;
}
// las cúpulas del cielo siguen a la cámara: si no, al alejarse del centro (orilla, mar) se veía la cúpula por fuera como una esfera gigante
const _cB = new THREE.Color();   // color auxiliar para mezclar el cielo
const _wxCache = { betaZzz: -1, blocked: -1, lights: -1, wet: -1, night: -1, cloud: -1, day: -1, zzz: -1, clk: '', fx: 1e9, fz: 1e9, lite: -1, bestIdx: [], bestDist: [] };
function updateCityWeather(dt,instant=false){
  dt=Number.isFinite(dt)?Math.max(0,dt):0;
  advanceAtmosphere(dt,instant);
  const kind=WX.kind,target=WX_PRESETS[kind],zzz=ZZZ_U.on.value>.5;
  const a=(WX.hour-6)/24*TAU,height=Math.sin(a),day=THREE.MathUtils.smoothstep(height,-.2,.32),night=1-day;   // crepusculo mas largo: el paso de dia a noche (y al reves) dura unas 2 horas del juego en vez de 1
  WX.night=night;const sunset=(1-THREE.MathUtils.smoothstep(Math.abs(height),.03,.46))*(1-WX.cloud*.75);
  if(CITY.cloudMat){const cm=CITY.cloudMat,cb=CITY.cloudBase;cm.color.set(0xffffff).lerp(_c.set(0xffc9b0),sunset*.8).lerp(_c.set(0x4a5578),night).lerp(_c.set(0x8d98a3),WX.cloud*.65*(1-night*.5));cb.color.copy(cm.color).multiplyScalar(.84);cm.opacity=cb.opacity=.9-night*.22;}
  WX.skyTop.set(zzz?0x081330:0x0a1c42).lerp(_c.set(zzz?0x186ee8:0x1a72e8),day).lerp(_c.set(zzz?0x7b337f:0x6c3f82),sunset*.78);
  WX.skyHorizon.set(zzz?0x151e3d:0x1e2c48).lerp(_c.set(zzz?0x9ae2ff:0x9ee0ff),day).lerp(_c.set(zzz?0xff7b4d:0xff9452),sunset*.88);
  WX.skyTop.lerp(_c.set(0x526a80).lerp(_cB.set(zzz?0x111a34:0x152137),night),WX.cloud*.83);   // mezclas continuas (antes habia un salto de color al pasar de dia a noche)
  WX.skyHorizon.lerp(_c.set(0x8e9da7).lerp(_cB.set(zzz?0x1a2648:0x2b3c50),night),WX.cloud*.8);
  WX.skyHorizon.lerp(_c.set(0xc3d6db).lerp(_cB.set(zzz?0x28365c:0x65718b),night),WX.fogAmount*(.28-(zzz?.1*THREE.MathUtils.smoothstep(night,.3,.7):0)));
  { const ap = D.G.apoc || 0; if (ap > .003) { WX.skyTop.lerp(_c.set(0x4a0606), ap * .88); WX.skyHorizon.lerp(_c.set(0xff4a1c), ap * .9); } }   // G.apoc: el cielo se vuelve rojo (Ojo del Cosmos de Redbird)
  const betaNow=ZZZ_U.beta.value>.5;
  if(betaNow&&zzz&&night>.01){
    const nk=night*night*.42;
    WX.skyTop.lerp(_c.set(0x04091a),nk);
    WX.skyHorizon.lerp(_c.set(0x0c142a),nk*.85);
  }
  const blocked=!!D.G.grade||D.STAGE.on,visible=D.G.state==='play'&&!blocked,lampB=blocked||(worldBig()&&MAPCUR.id!=='A');
  WX.sky.material.uniforms.uTop.value.copy(WX.skyTop);WX.sky.material.uniforms.uHorizon.value.copy(WX.skyHorizon);
  WX.sky.material.uniforms.uLow.value.copy(WX.skyHorizon).multiplyScalar(.8);
  WX.sky.material.uniforms.uCloud.value=WX.cloud;WX.sky.material.uniforms.uTime.value=WX.time;
  SUN_DIR.set(Math.cos(a)*55,height*70,22).normalize();WX.sunsetK=sunset;WX.sunVis=THREE.MathUtils.smoothstep(height,-.06,.03);
  WX.sky.material.uniforms.uSunDir.value.copy(SUN_DIR);WX.sky.material.uniforms.uSunset.value=sunset;WX.sky.material.uniforms.uSunVis.value=WX.sunVis;
  ZZZ_U.night.value=night;ZZZ_U.sunset.value=sunset;ZZZ_U.wet.value=WX.wet;ZZZ_U.sunDir.value.copy(SUN_DIR);ZZZ_U.skyCol.value.copy(WX.skyHorizon);
  ZZZ_U.rimCol.value.set(0x64d9ff).lerp(_c.set(0x4ee8ff),night).lerp(_c.set(0xff8ee0),sunset*.35);
  ZZZ_U.rimWarm.value.set(0xffc66d).lerp(_c.set(0xff7848),sunset*.7).lerp(_c.set(0xffb45a),night*.5);
  ZZZ_U.shadowTint.value.set(0x3a446e).lerp(_c.set(0x28305a),night*.6).lerp(_c.set(0x4d345c),sunset*.55);
  const focus=D.G.player?D.G.player.pos:camera.position,uniforms=WX.rainUniforms;
  uniforms.uCenter.value.copy(focus);uniforms.uTime.value=WX.time;uniforms.uRain.value=WX.rain;
  uniforms.uWind.value.set((.8+WX.wind*3)+Math.sin(WX.time*.15)*WX.wind,Math.cos(WX.time*.1)*WX.wind*1.6);uniforms.uNight.value=night;uniforms.uFog.value.copy(WX.skyHorizon);
  const isLite=wxLite();
  WX.rainMesh.geometry.instanceCount=isLite?850:3200;
  WX.splashes.geometry.instanceCount=isLite?70:210;
  WX.drops.geometry.setDrawRange(0,isLite?210:630);
  WX.puddleUniforms.uWet.value=WX.wet;
  WX.snowUniforms.uTime.value=WX.time;WX.snowUniforms.uSnow.value=WX.snow;WX.snowUniforms.uWind.value=WX.wind;WX.snowUniforms.uCenter.value.copy(focus);
  WX.snowMesh.geometry.setDrawRange(0,isLite?400:1000);WX.snowMesh.visible=visible&&WX.snow>.01;
  WX.mistUniforms.uTime.value=WX.time;WX.mistUniforms.uFog.value=WX.fogAmount*WX.fogStrength;WX.mistUniforms.uColor.value.copy(WX.skyHorizon);WX.mistUniforms.uCenter.value.copy(focus);
  WX.mist.visible=visible&&WX.fogAmount>.2;
  WX.rainMesh.visible=WX.splashes.visible=WX.drops.visible=visible&&WX.rain>.015;WX.puddles.visible=!blocked&&WX.wet>.015;
  WX.sky.visible=WX.sunGlow.visible=!blocked;WX.stars.visible=!blocked&&night>.1;WX.moon.visible=!blocked&&night>.05;
  WX.stars.material.uniforms.uOpacity.value=night*(1-WX.cloud)*.85;WX.stars.material.uniforms.uTime.value=WX.time;
  const lights=(night*.95+WX.cloud*.22)*(blocked?.12:1);
  const betaZzzKey=(betaNow&&zzz)?2:(zzz?1:0);
  const blkKey=blocked?1:0;
  if(instant||betaZzzKey!==_wxCache.betaZzz||blkKey!==_wxCache.blocked||Math.abs(lights-_wxCache.lights)>0.002||Math.abs(WX.wet-_wxCache.wet)>0.002||Math.abs(night-_wxCache.night)>0.002){
    _wxCache.betaZzz=betaZzzKey;_wxCache.blocked=blkKey;_wxCache.lights=lights;_wxCache.wet=WX.wet;_wxCache.night=night;
    if(betaNow&&zzz){
      const bbEm=(.44+lights*.88)*(blocked?.35:1);
      for(const m of CITY.bbEmissiveMaterials){m.emissive.setRGB(bbEm,bbEm*(.97+night*.02),bbEm*(.95+night*.06));}
      for(const m of CITY.windowMaterials){m.emissive.set(0xffcf88).multiplyScalar(lights*1.12);}
      for(const m of CITY.signMaterials){const se=.20+lights*1.12;m.emissive.setRGB(se,se,se*1.04);}
      for(const m of CITY.lampMaterials){m.emissive.set(0xffd699).multiplyScalar(lights*2.15);}
      for(const m of CITY.wetMaterials){m.shininess=20+WX.wet*125;m.specular.setRGB(.14+WX.wet*.38,.17+WX.wet*.44,.24+WX.wet*.54);}
      WX.lampPoolMat.opacity=lampB?0:lights*(.34+WX.wet*.22);WX.lampHaloMat.opacity=lampB?0:lights*(.38+WX.rain*.20);
    }else{
      for(const m of CITY.bbEmissiveMaterials){m.emissive.setHex(0xffffff);}
      for(const m of CITY.windowMaterials){m.emissive.set(0xffc57c).multiplyScalar(lights*(zzz?.88:.65));}
      for(const m of CITY.signMaterials){const se=(zzz?.22:.13)+lights*(zzz?.86:.65);m.emissive.setRGB(se,se,se);}
      for(const m of CITY.lampMaterials){m.emissive.set(0xffd095).multiplyScalar(lights*(zzz?1.75:1.4));}
      for(const m of CITY.wetMaterials){m.shininess=(zzz?18:8)+WX.wet*95;m.specular.setRGB((zzz?.14:.08)+WX.wet*.28,(zzz?.16:.10)+WX.wet*.32,(zzz?.22:.12)+WX.wet*.38);}
      WX.lampPoolMat.opacity=lampB?0:lights*((zzz?.28:.2)+WX.wet*.16);WX.lampHaloMat.opacity=lampB?0:lights*((zzz?.32:.24)+WX.rain*.17);
    }
  }else if(betaNow&&zzz){
    WX.lampHaloMat.opacity=lampB?0:lights*(.38+WX.rain*.20);
  }
  // Se reasignan las luces más próximas sin crear objetos ni ordenar todo el arreglo por cuadro.
  const kL=WX.lampLights.length;
  if(kL>0&&CITY.lamps.length>0){
    const dfx=focus.x-_wxCache.fx,dfz=focus.z-_wxCache.fz;
    const needLampMove=instant||(dfx*dfx+dfz*dfz>1.2)||(isLite?1:0)!==_wxCache.lite;
    if(needLampMove){
      _wxCache.fx=focus.x;_wxCache.fz=focus.z;_wxCache.lite=isLite?1:0;
      const bIdx=_wxCache.bestIdx,bDist=_wxCache.bestDist;
      bIdx.length=kL;bDist.length=kL;
      for(let i=0;i<kL;i++){bIdx[i]=-1;bDist[i]=1e18;}
      for(let i=0;i<CITY.lamps.length;i++){
        const p=CITY.lamps[i],dx=p.x-focus.x,dz=p.z-focus.z,d2=dx*dx+dz*dz;
        if(d2>=bDist[kL-1])continue;
        let pos=kL-1;
        while(pos>0&&d2<bDist[pos-1]){bDist[pos]=bDist[pos-1];bIdx[pos]=bIdx[pos-1];pos--;}
        bDist[pos]=d2;bIdx[pos]=i;
      }
      for(let i=0;i<kL;i++){
        const light=WX.lampLights[i];
        const li=_wxCache.bestIdx[i];
        light.visible=(!isLite||i<2)&&li>=0;
        if(li>=0){const p=CITY.lamps[li];light.position.set(p.x,3.45,p.z);}
      }
    }
    const lint=blocked?0:lights*(zzz?2.3:1.8);
    for(let i=0;i<kL;i++)WX.lampLights[i].intensity=lint;
  }
  WX.flash=Math.max(0,WX.flash-dt*2.5);

  if(!blocked){
    const beta=ZZZ_U.beta.value>0.5;
    scene.background.copy(WX.skyHorizon);scene.fog.color.copy(WX.skyHorizon);scene.fog.near=Math.max(15,(zzz?88:75)-WX.fogAmount*65*WX.fogStrength);scene.fog.far=Math.max(zzz?70:45,(zzz?280:260)-WX.fogAmount*180*WX.fogStrength);
    if(beta){
      const daySunFade=THREE.MathUtils.smoothstep(height,-0.02,0.14),moonCastFade=THREE.MathUtils.smoothstep(-height,0.08,0.24);
      HEMI.color.set(zzz?0x415ca6:0x7b92c1).lerp(_c.set(zzz?0xd4efff:0xe4f1ff),day);HEMI.groundColor.set(zzz?0x0f152a:0x26394d).lerp(_c.set(zzz?0x3b4462:0x657c54),day);
      HEMI.intensity=(zzz?(.19+day*.43):(.51+day*.12))+WX.flash*.25;   // un poco mas de luz de relleno: las sombras no quedan tan duras
      sun.color.set(zzz?0xfff3d8:0xfff0d0).lerp(_c.set(zzz?0xff9d66:0xffaf78),sunset*.78).lerp(_c.set(0x8ab4ff),moonCastFade);
      const daySunI=Math.sqrt(Math.max(0,height))*daySunFade*(zzz?.9:.69)*(1-WX.cloud*.6);
      const moonShadowI=night*moonCastFade*(zzz?.23:.18)*(1-WX.cloud*.45);
      sun.intensity=daySunI+moonShadowI+WX.flash;
      WX.moonLight.intensity=night*(zzz?(.38-.18*moonCastFade):(.36-.14*moonCastFade))*(1-WX.cloud*.45);
      WX.fillLight.intensity=night*(zzz?.22:.19);WX.fillLight.position.set(camera.position.x,camera.position.y+4,camera.position.z);WX.fillLight.target.position.copy(focus);
      WX.moonLight.position.set(-Math.cos(a)*45,Math.max(12,-height*65),-22);
      CITY.sunDisc.position.copy(SUN_DIR).multiplyScalar(245);CITY.sunDisc.lookAt(0,0,0);
      CITY.sunDisc.material.color.set(0xfff4c4).lerp(_c.set(0xffa26f),sunset);CITY.sunDisc.visible=false;   // el sol se dibuja redondo en el cielo
      const shX=moonCastFade>0.01?-Math.cos(a)*45:Math.cos(a)*55;
      const shY=moonCastFade>0.01?Math.max(24,-height*65):Math.max(16,height*70);
      const shZ=moonCastFade>0.01?-22:22;
      updateSunShadowFocus(shX,shY,shZ,focus.x,focus.z);
      ZZZ_U.keyDir.value.copy(sun.position).sub(sun.target.position).normalize();
    }else{
      HEMI.color.set(zzz?0x506cb8:0x7b92c1).lerp(_c.set(zzz?0xd4efff:0xe4f1ff),day);HEMI.groundColor.set(zzz?0x161c34:0x26394d).lerp(_c.set(zzz?0x454e68:0x657c54),day);
      HEMI.intensity=(zzz?(.26+day*.39):(.51+day*.12))+WX.flash*.25;
      sun.color.set(zzz?0xfff3d8:0xfff0d0).lerp(_c.set(zzz?0xff9d66:0xffaf78),sunset*.78);
      sun.intensity=Math.sqrt(Math.max(0,height))*(zzz?.78:.69)*(1-WX.cloud*.6)+WX.flash;
      WX.moonLight.intensity=night*(zzz?.46:.36)*(1-WX.cloud*.45);
      WX.fillLight.intensity=night*(zzz?.28:.19);WX.fillLight.position.set(camera.position.x,camera.position.y+4,camera.position.z);WX.fillLight.target.position.copy(focus);
      WX.moonLight.position.set(-Math.cos(a)*45,Math.max(12,-height*65),-22);
      CITY.sunDisc.position.copy(SUN_DIR).multiplyScalar(245);CITY.sunDisc.lookAt(0,0,0);
      CITY.sunDisc.material.color.set(0xfff4c4).lerp(_c.set(0xffa26f),sunset);CITY.sunDisc.visible=false;   // el sol se dibuja redondo en el cielo
      updateSunShadowFocus(Math.cos(a)*55,height*70,22,focus.x,focus.z);
      ZZZ_U.keyDir.value.copy(SUN_DIR);
    }
    WX.sunGlow.position.set(CITY.sunDisc.position.x+camera.position.x,CITY.sunDisc.position.y,CITY.sunDisc.position.z+camera.position.z);WX.sunGlow.material.opacity=day*(1-WX.cloud)*(zzz?.68:.6);
    WX.moon.position.copy(WX.moonLight.position).normalize().multiplyScalar(240);WX.moon.position.x+=camera.position.x;WX.moon.position.z+=camera.position.z;WX.moon.material.opacity=night*(1-WX.cloud*.8);
    if(instant||(zzz?1:0)!==_wxCache.zzz||Math.abs(day-_wxCache.day)>0.002||Math.abs(WX.cloud-_wxCache.cloud)>0.002){
      _wxCache.zzz=zzz?1:0;_wxCache.day=day;_wxCache.cloud=WX.cloud;
      const clOp=.75-WX.cloud*.22;
      // (el color de las nubes ahora lo calcula arriba cloudMat/cloudBase en cada cuadro: dia, atardecer, noche y tormenta)
    }
  }else {WX.moonLight.intensity=0;WX.fillLight.intensity=0;}
  cityWeatherAudio(dt,visible&&!D.G.paused);
  WX.hudWait-=dt;if(WX.hudWait<=0||instant){
    WX.hudWait=.2;const minutes=Math.floor(WX.hour*60+.0001)%1440,time=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
    const label={clear:'Despejado',cloudy:'Nublado',drizzle:'Llovizna',rain:'Lluvia',storm:'Tormenta eléctrica',fog:'Neblina',densefog:'Niebla densa',wind:'Viento',snow:'Nieve',blizzard:'Ventisca'}[kind];
    const clkStr=time+' · '+label;
    if(clkStr!==_wxCache.clk){_wxCache.clk=clkStr;$('weatherstate').textContent=clkStr;$('wx-clock').textContent=time;}
    if(document.activeElement!==$('wx-hour'))$('wx-hour').value=WX.hour;
  }
}
function initWeatherControls(){
  syncWeatherControls();
  document.querySelectorAll('[data-hour]').forEach(b=>b.addEventListener('click',()=>setCityTime(+b.dataset.hour)));
  $('wx-hour').addEventListener('input',e=>setCityTime(+e.target.value));
  $('wx-cycle').addEventListener('change',e=>{if(atmosphereCommand({cycle:e.target.checked})){WX.cycle=e.target.checked;saveCityWeather();}});
  $('wx-fog').addEventListener('input',e=>atmosphereCommand({fogStrength:+e.target.value}));
  $('wx-weather').addEventListener('change',e=>setCityWeather(e.target.value));
  $('wx-quality').addEventListener('change',e=>{WX.quality=e.target.value;saveCityWeather();});
  $('wx-sound').addEventListener('change',e=>{WX.sound=e.target.checked;saveCityWeather();});
  $('weatherbtn').addEventListener('click',()=>{D.togglePanel(true);$('weather-controls').scrollIntoView({block:'nearest'});});
  updateCityWeather(0,true);
}

// Nieve y bruma a ras de suelo. La hora y la intensidad vienen del estado compartido de sala.
{
  const n=1000,geo=new THREE.BufferGeometry(),positions=new Float32Array(n*3),seeds=new Float32Array(n);
  const rng=wxRandom(18322);
  for(let i=0;i<n;i++){positions.set([(rng()-.5)*50,rng()*20,(rng()-.5)*50],i*3);seeds[i]=rng();}
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  WX.snowUniforms={uTime:{value:0},uSnow:{value:0},uWind:{value:0},uCenter:{value:new V3()},uRoof:{value:WX.roof}};
  WX.snowMesh=new THREE.Points(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:WX.snowUniforms,
    vertexShader:`attribute float aSeed;uniform float uTime,uSnow,uWind;uniform vec3 uCenter;uniform sampler2D uRoof;varying float vAlpha;
      void main(){vec2 p=uCenter.xz+mod(position.xz+vec2(uTime*uWind*2.,sin(uTime*.6+aSeed*60.)*.8)+25.,50.)-25.;
        float floorY=texture2D(uRoof,clamp((p+128.)/256.,0.,1.)).r*64.;float h=mod(position.y-uTime*(1.4+aSeed*1.7)+20000.,20.);
        vec4 mv=viewMatrix*vec4(p.x,floorY+h,p.y,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((3.+aSeed*4.)*10./max(2.,-mv.z),1.,7.);
        vAlpha=step(aSeed,uSnow)*(1.-smoothstep(20.,32.,-mv.z))*.75;}`,
    fragmentShader:'varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float a=1.-smoothstep(.08,.5,length(p));gl_FragColor=vec4(.86,.94,1.,a*vAlpha);}'
  }));WX.snowMesh.frustumCulled=false;WX.snowMesh.userData.atmosphere=true;scene.add(WX.snowMesh);
  const mistGeo=new THREE.InstancedBufferGeometry().copy(new THREE.PlaneBufferGeometry(1,1)),offsets=new Float32Array(12*3);
  for(let i=0;i<12;i++)offsets.set([(rng()-.5)*46,rng(),(rng()-.5)*46],i*3);
  mistGeo.setAttribute('aOffset',new THREE.InstancedBufferAttribute(offsets,3));mistGeo.instanceCount=12;
  WX.mistUniforms={uTime:{value:0},uFog:{value:0},uColor:{value:new THREE.Color()},uCenter:{value:new V3()},uRoof:{value:WX.roof}};
  WX.mist=new THREE.Mesh(mistGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:WX.mistUniforms,
    vertexShader:`attribute vec3 aOffset;uniform float uTime;uniform vec3 uCenter;uniform sampler2D uRoof;varying vec2 vUv;varying float vSeed;
      void main(){vec2 p=floor(uCenter.xz/6.)*6.+mod(aOffset.xz+vec2(uTime*.16,0.)+25.,50.)-25.;float h=texture2D(uRoof,clamp((p+128.)/256.,0.,1.)).r*64.;
        vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);vec3 world=vec3(p.x,h+.65,p.y)+right*position.x*12.+vec3(0.,position.y*1.7,0.);
        vUv=uv;vSeed=aOffset.y;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
    fragmentShader:`varying vec2 vUv;varying float vSeed;uniform float uTime,uFog;uniform vec3 uColor;
      void main(){vec2 p=(vUv-.5)*2.;float edge=pow(max(0.,1.-dot(p,p)),2.);float wisps=.6+.4*sin(vUv.x*16.+sin(vUv.y*8.)+uTime*.3+vSeed*20.);gl_FragColor=vec4(uColor,edge*wisps*uFog*.14);}`
  }));WX.mist.frustumCulled=false;WX.mist.userData.atmosphere=true;scene.add(WX.mist);
}

// objetos del mundo (se ocultan durante los impact frames para dejar solo las siluetas)
const WORLD = scene.children.filter(o => o.isMesh || o.isSprite || o.isPoints || o.isLineSegments);
// gradación de la cinemática: el mundo se oscurece al color del personaje y una luz de contorno lo recorta
const SKY_OBJS = WORLD.filter(o => o.material && o.material.fog === false);
const CINE_RIM = new THREE.PointLight(0xffffff, 0, 9), CINE_KEY = new THREE.PointLight(0xffffff, 0, 7);
scene.add(CINE_RIM, CINE_KEY);

  return { CINE_KEY, CINE_RIM, ROOM_ATMOSPHERE, SKY_OBJS, WORLD, WX, WX_PRESETS, WX_ROOM, adoptAtmosphere, advanceAtmosphere, atmosphereCommand, atmosphereLeader, atmospherePayload, atmospherePlayers, buildLightningVisual, canEditAtmosphere, cityWeatherAudio, cityWeatherNow, initWeatherControls, lightningDamage, saveCityWeather, setCityTime, setCityWeather, syncWeatherControls, updateAtmosphereStrikes, updateCityWeather, weatherEntityId, wxLite, wxRandom, wxRandomValue };
};
