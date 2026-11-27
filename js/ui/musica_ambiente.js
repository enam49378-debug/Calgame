// Música y ambiente sonoro
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_UI = window.CF_UI || {};

window.CF_UI.crearMusicaAmbiente = function crearMusicaAmbiente(D) {
  'use strict';
  const { ACTIVE_DIALOGUE, AUDIO_CFG, AUDIO_LEVELS, BEACH, CHARACTER_VOICE_FILES, CHARS, CITY, G, HTML_AUDIO_LEVELS, SHORE, STAGE, SUN_DIR, WX, _c, camera, clamp, initAudio, musFile, playBufferSound, playHtmlEffect, playTrackedAudio, refreshHtmlAudio, releaseHtmlAudio, sndUrl, soundCategory, soundChannel, stopMenuVoice, syncAudioControls, trackHtmlAudio, ultMusicRel } = D;

// ================= Música: menú y peleas (archivos en musica/) =================
const MUS = {
  tracks: {
    menu:[musFile('menu2','musica/calfight_arcade.mp3'),musFile('menu3','musica/calfight_nocturno.mp3'),musFile('menu','musica/menu.mp3')],
    fight:[musFile('fight1','musica/pelea1.mp3'),musFile('fight2','musica/pelea2.mp3'),musFile('fight3','musica/pelea3.mp3')]
  },
  track:null,old:null,want:'',idx:-1,menuIdx:-1,vol:.32,on:true,duck:1,failed:new Set()
};
try { MUS.on = localStorage.getItem('bsb_music') !== '0'; const v = parseFloat(localStorage.getItem('bsb_music_vol')); if (v >= 0 && v <= 1) MUS.vol = v; } catch (e) { }
// Ganancias de las pistas incluidas, medidas con FFmpeg y referidas a -16 LUFS.
const MUSIC_TRIM = {"musica/calfight_arcade.mp3":0.977,"musica/calfight_nocturno.mp3":0.966,"musica/green_room.mp3":0.87,"personajes/sunn/Skills/Ulti/Sound/ulti.mp3":0.841,"personajes/capitan/Skills/Ulti/Sound/ulti.mp3":0.813,"musica/calfight_intro.mp3":1.123,"musica/hypnotic_choques_arcade.mp3":1.0,"musica/hypnotic_choques_identico.mp3":1.0,"musica/hypnotic_choques_intermedio.mp3":1.0,"musica/hypnotic_data_arcade.mp3":1.0,"musica/hypnotic_data_intermedio.mp3":1.0,"musica/hypnotic_data_original.mp3":1.0,"musica/menu.mp3":0.989,"musica/pelea1.mp3":0.989,"musica/pelea2.mp3":1.002,"musica/pelea3.mp3":1.038,"musica/she_bugging_game.mp3":1.0,"musica/she_bugging_loop.mp3":1.0,"personajes/gato/Skills/Ulti/Sound/ulti.mp3":0.998,"personajes/javi/Skills/Ulti/Sound/ulti.mp3":0.845,"personajes/jesuluto/Skills/Ulti/Sound/ulti.mp3":0.844,"personajes/mattux/Skills/Ulti/Sound/ulti.mp3":0.846,"personajes/randi/Skills/Ulti/Sound/ulti.mp3":0.845,"personajes/redbird/Skills/Ulti/Sound/ulti.mp3":0.846,"personajes/rocket/Skills/Ulti/Sound/ulti.mp3":0.847,"personajes/sebolla/Skills/Ulti/Sound/ulti.mp3":0.536,"personajes/sekza/Skills/Ulti/Sound/ulti.mp3":0.844,"personajes/ukyo/Skills/Ulti/Sound/ulti.mp3":0.845};
function musicTrim(src,id){return (MUSIC_TRIM[src]??1)*(AUDIO_CFG.music[id]?.vol??1);}
function makeMusicTrack(src,id,loop,preloaded){
  const el=preloaded||new Audio(src);
  el.loop=loop;el.preload='auto';
  const track=trackHtmlAudio(el,0,'music');
  track.trim=musicTrim(src,id);
  if(MUS.on)playTrackedAudio(track,true);
  return track;
}
function musicPlay(src,id,loop){
  if(MUS.old)releaseHtmlAudio(MUS.old);
  MUS.old=MUS.track;
  const track=MUS.track=makeMusicTrack(src,id,loop);
  if(!loop){
    const mode=MUS.want;
    const next=()=>{if(MUS.track===track&&MUS.want===mode){if(mode==='fight')musicNextFight();else if(mode==='menu')musicNextMenu();}};
    track.el.addEventListener('ended',next,{once:true});
    track.el.addEventListener('error',()=>{MUS.failed.add(src);next();},{once:true});
  }
}
function musicNextFrom(rawList,idxKey,idOf){
  const list=Array.isArray(rawList)?rawList:[rawList];
  const candidates=list.map((src,i)=>({src,i})).filter(x=>x.src&&!MUS.failed.has(x.src));
  if(!candidates.length){MUS.track=null;return;}
  const other=candidates.filter(x=>x.i!==MUS[idxKey]),choices=other.length?other:candidates;
  const pick=choices[Math.floor(Math.random()*choices.length)];
  MUS[idxKey]=pick.i;
  musicPlay(pick.src,idOf(pick.i),false);
}
function musicNextMenu(){musicNextFrom(MUS.tracks.menu,'menuIdx',i=>i===2?'menu':'menu'+(i+2));}
function musicNextFight(){musicNextFrom(MUS.tracks.fight,'idx',i=>'fight'+(i+1));}
function fadeAudioTrack(track,target,dt,rise=.25,fall=.17){
  track.base+=(target-track.base)*(1-Math.exp(-dt/(target>track.base?rise:fall)));
  refreshHtmlAudio(track);
}
function dialogueAudible(){
  if(AUDIO_LEVELS.voices===0)return false;
  const now=performance.now();
  for(const voice of ACTIVE_DIALOGUE){
    if(voice.until<=now){ACTIVE_DIALOGUE.delete(voice);continue;}
    if(voice.level>.22 && (!voice.htmlRecord||!voice.htmlRecord.el.paused))return true;
  }
  for(const record of HTML_AUDIO_LEVELS)if(record.category==='voices'&&record.el.volume>.1&&!record.el.paused)return true;
  return false;
}
function updateMusic(dt){
  const xs=G.state==='play'&&window.CF_MUS_SCENE?CF_MUS_SCENE():null;   // {id, src}: pista propia de una zona (el abismo)
  const want=xs?'x:'+xs.id:G.state==='menu'?'menu':G.state==='play'?'fight':'';
  if(want!==MUS.want){
    if(MUS.want==='menu')stopMenuVoice();
    MUS.want=want;
    if(xs){musicPlay(xs.src,'x_'+xs.id,true);if(MUS.track&&MUS.track.el)MUS.track.el.addEventListener('error',()=>{if(window.CF_MUS_FAIL)CF_MUS_FAIL(xs.id);},{once:true});}
    else if(want==='menu'){MUS.failed.clear();musicNextMenu();}
    else if(want==='fight'){MUS.failed.clear();musicNextFight();}
    else {if(MUS.old)releaseHtmlAudio(MUS.old);MUS.old=MUS.track;MUS.track=null;}
  }
  const speech=dialogueAudible()? .50 : 1;
  MUS.duck+=(speech-MUS.duck)*(1-Math.exp(-dt/(speech<MUS.duck?.09:.42)));
  const pause=G.paused?.45:1;
  const ultimate=ULT_MUS.track;
  if(ultimate){
    if(!HTML_AUDIO_LEVELS.has(ultimate))ULT_MUS.track=null;
    else {
      if(G.state!=='play'||G.over||!MUS.on||ultimate.el.ended)ULT_MUS.fade=true;
      // la musica de la ulti manda: suena un poco mas fuerte que la de pelea y solo baja un poco con las voces
      fadeAudioTrack(ultimate,ULT_MUS.fade?0:MUS.vol*ultimate.trim*1.25*pause*(.4+.6*MUS.duck),dt,.08,.35);
      if(ULT_MUS.fade&&ultimate.base<.003){releaseHtmlAudio(ultimate);ULT_MUS.track=null;}
    }
  }
  const scoring=ULT_MUS.track&&!ULT_MUS.fade&&!ULT_MUS.track.el.paused;
  const sceneGain=scoring?0:(G.cine||STAGE.on)?.47:1;   // durante la ulti la cancion de la pelea se calla del todo
  if(MUS.track)fadeAudioTrack(MUS.track,MUS.vol*MUS.track.trim*pause*sceneGain*MUS.duck,dt,scoring?.25:.6,scoring?.12:.17);
  if(MUS.old){fadeAudioTrack(MUS.old,0,dt,.25,.20);if(MUS.old.base<.003){releaseHtmlAudio(MUS.old);MUS.old=null;}}
  // red de seguridad: nunca debe sonar más de una música a la vez (se apaga cualquier pista suelta que no sea la actual, la anterior en fundido, la de ulti o la del título)
  if((MUS.sweepT=(MUS.sweepT||0)-dt)<=0){MUS.sweepT=.5;const keep=new Set([MUS.track,MUS.old,ULT_MUS.track,D.TITLE.mus]);for(const r of [...HTML_AUDIO_LEVELS])if(r.category==='music'&&!keep.has(r))releaseHtmlAudio(r);
    if(G.state==='play'&&D.TITLE.mus&&!D.TITLE.on)releaseHtmlAudio(D.TITLE.mus),D.TITLE.mus=null;}
}
const ULT_MUS = {track:null,pre:null,fade:false};
function ultMusicPreload(id){
  try{const el=new Audio(musFile('ult_'+id,ultMusicRel(id)));el.preload='auto';ULT_MUS.pre={id,el};}catch(e){}
}
function ultMusic(id){
  if(!MUS.on||!CHARS[id])return;
  if(ULT_MUS.track)releaseHtmlAudio(ULT_MUS.track);
  const pre=ULT_MUS.pre?.id===id?ULT_MUS.pre.el:null;
  ULT_MUS.pre=null;
  ULT_MUS.fade=false;
  ULT_MUS.track=makeMusicTrack(musFile('ult_'+id,ultMusicRel(id)),'ult_'+id,false,pre);
  ultMusicPreload(id);
}
function musicKick(){
  if(D.AC&&(D.AC.state==='suspended'||D.AC.state==='interrupted'))initAudio();
  if(MUS.on)for(const record of [MUS.track,ULT_MUS.track,D.TITLE.mus])if(record?.el.paused)playTrackedAudio(record,true);
  for(const record of D.TITLE.amb)if(record.el.paused)playTrackedAudio(record,true);
  if(AMB.ready)for(const layer of AMB.L)if(layer.record?.el.paused)playTrackedAudio(layer.record,true);
}
addEventListener('pointerdown',musicKick,true);addEventListener('keydown',musicKick,true);
document.addEventListener('visibilitychange',()=>{   // pestaña oculta: todo en pausa; al volver se reanuda una sola vez
  const recs=[...HTML_AUDIO_LEVELS];
  if(document.hidden){for(const r of recs)if(!r.el.paused){r.hid=true;r.el.pause();}if(D.AC&&D.AC.state==='running')D.AC.suspend().catch(()=>{});}
  else{if(D.AC&&D.AC.state==='suspended')D.AC.resume().catch(()=>{});for(const r of recs)if(r.hid){r.hid=false;playTrackedAudio(r,true);}}
});
function toggleMusic(){
  MUS.on=!MUS.on;
  try{localStorage.setItem('bsb_music',MUS.on?'1':'0');}catch(e){}
  if(MUS.on)musicKick();
  else for(const record of [MUS.track,MUS.old,ULT_MUS.track,D.TITLE.mus])record?.el.pause();
  syncAudioControls();refreshHtmlAudio();
  if(G.state==='play')D.addFeedText(MUS.on?'Música activada':'Música desactivada','#9fd3ff');
}
addEventListener('keydown',e=>{if(e.code==='KeyM'&&!e.repeat&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)&&!e.target.isContentEditable)toggleMusic();});
// ================= Ambiente sonoro con grabaciones reales (carpeta sonidos/, ver sonidos/CREDITOS.md) =================
// Con servidor se decodifican con WebAudio (bucles sin cortes y apagado de la calle al entrar); abriendo el archivo sin servidor (file://)
// se reproducen con elementos <audio> (solo volumen).
const SND_LIST = ['city', 'birds', 'breeze', 'wind_strong', 'night', 'rain', 'thunder1', 'thunder2', 'cafe', 'clink1', 'clink2', 'sizzle', 'market', 'cash', 'arcade', 'library', 'page',
  'workshop', 'drill', 'hammer', 'mall', 'fountain', 'chime', 'lobby', 'elev_ride', 'door_close', 'door_open', 'waves', 'gull1', 'gull2', 'vhit', 'vland', 'whistle', 'applause', 'randi_voz1', 'randi_voz2', 'randi_waaa', ...CHARACTER_VOICE_FILES];
const SND = {buf:{},state:'idle',base:'sonidos/',ambientReady:false,missing:new Set(),loading:new Set(),voiceQueue:[]};
function lazyLoadVoice(name){
  if(!D.AC||location.protocol==='file:'||SND.buf[name]||SND.missing.has(name)||SND.loading.has(name))return;
  SND.loading.add(name);
  fetch(sndUrl(name)).then(r=>{if(r.status===404)SND.missing.add(name);if(!r.ok)throw 0;return r.arrayBuffer();})
    .then(ab=>D.AC.decodeAudioData(ab)).then(buf=>{
      SND.buf[name]=buf;SND.voiceQueue.push(name);
      while(SND.voiceQueue.length>24){const old=SND.voiceQueue.shift();if(old&&old!==name)delete SND.buf[old];}
    }).catch(()=>{}).finally(()=>SND.loading.delete(name));
}
async function preloadSounds(names){
  let next=0;
  const context=D.AC;
  async function worker(){
    while(next<names.length){
      const name=names[next++];
      try{
        const response=await fetch(sndUrl(name));
        if(response.status===404)SND.missing.add(name);
        if(response.ok)SND.buf[name]=await context.decodeAudioData(await response.arrayBuffer());
      }catch(e){/* Se prueba el reproductor HTML cuando se necesita el archivo. */}
    }
  }
  await Promise.all(Array.from({length:Math.min(2,names.length)},worker));
}
function loadSounds(){
  if(SND.state!=='idle'||!D.AC)return;
  if(location.protocol==='file:'){SND.state='fallback';SND.ambientReady=true;return;}
  SND.state='loading';
  const voices=new Set(CHARACTER_VOICE_FILES);
  (async()=>{
    await preloadSounds(SND_LIST.filter(name=>!voices.has(name)));
    SND.ambientReady=true;
    SND.state=Object.keys(SND.buf).length?'ready':'fallback';
  })();
}
function playSnd(name,vol=1,pos=null,delay=0){
  const category=soundCategory(name),player=G.player;
  if(!D.AC||G.state!=='play'||AUDIO_LEVELS.general===0||AUDIO_LEVELS[category]===0)return;
  const origin=pos?{x:pos.x,y:pos.y,z:pos.z}:null;
  const play=()=>{
    if(G.state!=='play'||G.player!==player||(category==='ambient'&&(!WX.sound||G.paused)))return;
    const distance=origin?Math.hypot(camera.position.x-origin.x,camera.position.y-origin.y,camera.position.z-origin.z):0;
    const gain=clamp(1-distance/40,0,1)*vol*(AUDIO_CFG.amb[name]?.vol??1);
    if(gain<.02)return;
    if(SND.buf[name]&&D.AC.state==='running')playBufferSound(SND.buf[name],gain,category,origin);
    else if(!SND.missing.has(name))playHtmlEffect(sndUrl(name),gain*.5,category,'play');
  };
  if(delay>0)setTimeout(play,delay*1000);else play();
}
const AMB = { ready: false, ins: 0, kind: '', t: {}, acc: 0, L: [] };
const AMB_KIND = { cafe: 'cafe', arcade: 'arcade', mercado: 'mercado', biblioteca: 'biblioteca', ramen: 'ramen', taller: 'taller', centro_comercial: 'mall', torre_aurora: 'lobby' };
// nombre, grupo ('out' = calle; o el local), volumen base
const AMB_LAYERS = [['city', 'out', 1.5], ['breeze', 'out', 1.3], ['birds', 'out', .9], ['wind_strong', 'out', 1.6], ['night', 'out', 1.5], ['waves', 'out', 1.9],
  ['cafe', 'cafe', 1.7], ['arcade', 'arcade', 1.2], ['market', 'mercado', 1.7], ['library', 'biblioteca', 1.9], ['cafe', 'ramen', 1.3], ['sizzle', 'ramen', 1.1],
  ['workshop', 'taller', 1.6], ['mall', 'mall', 1.7], ['fountain', 'mall', 1.1], ['lobby', 'lobby', 2.2]];
for (const L of AMB_LAYERS) { const o = AUDIO_CFG.amb[L[0]]; if (o && o.vol != null) L[2] *= o.vol; }
function initAmbience() {
  if (!D.AC || !D.master) return;
  if (SND.state === 'idle') { loadSounds(); return; }
  if ((!SND.ambientReady&&SND.state==='loading') || AMB.ready || G.state!=='play' || !G.player) return;
  AMB.ready = true;
  AMB.bus = D.AC.createGain(); AMB.bus.gain.value = 0; AMB.bus.connect(soundChannel('ambient'));
  AMB.out = D.AC.createGain(); AMB.outLP = D.AC.createBiquadFilter(); AMB.outLP.type = 'lowpass'; AMB.outLP.frequency.value = 18000;
  AMB.out.connect(AMB.outLP); AMB.outLP.connect(AMB.bus);
  AMB.inn = D.AC.createGain(); AMB.inn.connect(AMB.bus);
  for (const [name, group, gain] of AMB_LAYERS) {
    const L = { name, group, gain, set() { } };
    if (SND.buf[name]) {
      const s = D.AC.createBufferSource(); s.buffer = SND.buf[name]; s.loop = true;
      const g = D.AC.createGain(); g.gain.value = 0; s.connect(g); g.connect(group === 'out' ? AMB.out : AMB.inn); s.start(0, Math.random() * SND.buf[name].duration * .9);
      L.set = (v, t = .38) => g.gain.setTargetAtTime(v * gain, D.AC.currentTime, t);
      L.stop=()=>{s.stop();s.disconnect();g.disconnect();};
    } else if (!SND.missing.has(name)) {
      const el=new Audio(sndUrl(name));el.loop=true;
      const tracked=trackHtmlAudio(el,0,'ambient');
      L.record=tracked;
      playTrackedAudio(tracked,true);
      L.set=v=>{tracked.base=v*gain*.5*(G.paused?.4:1);refreshHtmlAudio(tracked);};
      L.stop=()=>releaseHtmlAudio(tracked);
    }
    AMB.L.push(L);
  }
}
function updateBeach(dt) {
  BEACH.t += dt; BEACH.sea.uTime.value = BEACH.t; const t = BEACH.t;
  const cp = camera.position;
  const outCity = cp.z > 560 || cp.y < -45 || cp.y > 480;
  if (!outCity && BEACH.water && BEACH.water.visible) {
    const S = BEACH.sea; S.uSky.value.copy(WX.skyHorizon); S.uSunV.value.copy(SUN_DIR).transformDirection(camera.matrixWorldInverse); S.uSunC.value.set(0xfff2d0).lerp(_c.set(0xff9a5a), WX.sunsetK || 0); S.uSunK.value = WX.sunVis == null ? 1 : WX.sunVis;
  }
  if (!outCity && D.SEA.root && D.SEA.root.visible) {
    for (const b of BEACH.boats) { b.mesh.position.y = b.y0 + Math.sin(t * 1.1 + b.ph) * .06; b.mesh.rotation.z = Math.sin(t * .9 + b.ph) * .035 + (b.kick || 0); b.mesh.rotation.x = Math.sin(t * .7 + b.ph) * .02; }
  }
  const maxGullSq = (D.CULL.range * 0.95 + 8) ** 2;
  for (const g of BEACH.gulls) {
    if (outCity) { g.g.visible = false; continue; }
    const a = g.ph + t * g.sp;
    const gx = g.cx + Math.cos(a) * g.r, gy = g.h + Math.sin(t * .6 + g.ph) * 1.5, gz = g.cz + Math.sin(a) * g.r;
    const dx = cp.x - gx, dy = cp.y - gy, dz = cp.z - gz, dSq = dx * dx + dy * dy + dz * dz;
    D.CULL.sp.center.set(gx, gy, gz); D.CULL.sp.radius = 2.5;
    const vis = dSq < maxGullSq && D.CULL.fr.intersectsSphere(D.CULL.sp);
    g.g.visible = vis;
    if (!vis) continue;
    g.g.position.set(gx, gy, gz);
    g.g.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); const f = Math.sin(t * 6 + g.ph * 3) * .45; g.wl.rotation.z = f; g.wr.rotation.z = -f;
  }
}
function updateAmbience(dt) {
  refreshHtmlAudio();
  if (!D.AC) return;
  if(G.state!=='play'||!G.player){
    if(AMB.ready){
      const {bus,out,outLP,inn,L}=AMB;
      bus.gain.setTargetAtTime(0,D.AC.currentTime,.08);
      AMB.ready=false;AMB.L=[];AMB.ins=0;AMB.acc=0;AMB.t={};
      setTimeout(()=>{for(const layer of L)layer.stop?.();bus.disconnect();out.disconnect();outLP.disconnect();inn.disconnect();},400);
    }
    return;
  }
  if (!AMB.ready) { initAmbience(); if (!AMB.ready) return; }
  const now = D.AC.currentTime, p = G.player;
  let kind = '', inside = 0;
  for (const b of CITY.buildings) if (b.accessible && b.model && Math.abs(p.pos.x - b.x) < b.w / 2 - .2 && Math.abs(p.pos.z - b.z) < b.d / 2 - .2 && p.pos.y < b.base + .6) { kind = AMB_KIND[b.model] || ''; inside = 1; break; }
  AMB.ins += (inside - AMB.ins) * Math.min(1, dt * 3);
  const ab0 = !!p.abyss, on = WX.sound && !ab0 ? 1 : 0, ins = AMB.ins, outs = 1 - ins * .84, high = clamp((p.pos.y - 8) / 30, 0, 1), storm = clamp((WX.rain || 0) * 2, 0, 1), cloud = WX.cloud || 0, night = WX.night || 0;
  AMB.acc += dt;
  if (AMB.acc > .12) {
    AMB.acc = 0;
    AMB.bus.gain.setTargetAtTime(on*(G.paused?.4:1), now, .25);
    AMB.out.gain.setTargetAtTime(1, now, .25); AMB.outLP.frequency.setTargetAtTime(18000 - ins * 17400, now, .3);
    const day = (1 - night) * (1 - storm * .8);
    const target = {
      city: outs * (1 - high * .55), breeze: outs * day * (1 - high * .7) * (1 - storm), birds: outs * day * (1 - high * .8) * (1 - storm),
      wind_strong: outs * clamp(high * 1.1 + storm * .8 + cloud * .25 - .05, 0, 1.15), night: outs * night * (1 - storm * .7),
      waves: outs * Math.pow(clamp(1 - (SHORE(p.pos.x) - p.pos.z) / 62, 0, 1), 1.3) * (1 - high * .5)
    };
    for (const L of AMB.L) L.set(ab0 ? 0 : L.group === 'out' ? target[L.name] : (L.group === kind ? ins : 0));
  }
  if (!on||G.paused) return;
  const due = (key, a, b) => { if (now < (AMB.t[key] || 0)) return false; AMB.t[key] = now + a + Math.random() * (b - a); return true; };
  const near = clamp(1 - (SHORE(p.pos.x) - p.pos.z) / 50, 0, 1) * outs;
  if (near > .15 && WX.night < .6 && due('gull', 5, 13)) playSnd(Math.random() < .5 ? 'gull1' : 'gull2', .5 * near);
  const vi = kind ? ins : 0;
  if (!vi) return;
  switch (kind) {
    case 'cafe': if (due('clink', 2, 6)) playSnd(Math.random() < .5 ? 'clink1' : 'clink2', .55 * vi); break;
    case 'ramen': if (due('clink', 5, 12)) playSnd('clink2', .4 * vi); break;
    case 'mercado': if (due('cash', 8, 18)) playSnd('cash', .6 * vi); break;
    case 'biblioteca': if (due('page', 6, 14)) playSnd('page', .6 * vi); break;
    case 'taller': if (due('hammer', 5, 11)) playSnd('hammer', .6 * vi); if (due('drill', 16, 30)) playSnd('drill', .6 * vi); break;
    case 'mall': if (due('chime', 20, 40)) playSnd('chime', .45 * vi); break;
    case 'lobby': if (due('chime', 14, 26)) playSnd('chime', .35 * vi); break;
  }
}

  return { AMB, AMB_KIND, AMB_LAYERS, MUS, MUSIC_TRIM, SND, SND_LIST, ULT_MUS, dialogueAudible, fadeAudioTrack, initAmbience, lazyLoadVoice, loadSounds, makeMusicTrack, musicKick, musicNextFight, musicPlay, musicTrim, playSnd, preloadSounds, toggleMusic, ultMusic, ultMusicPreload, updateAmbience, updateBeach, updateMusic };
};
