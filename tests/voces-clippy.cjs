const{chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),candidate=process.env.BLOCKSTRIKE_TEST_HTML||'',assets=process.env.BLOCKSTRIKE_VOICE_ASSETS||'',port=18959,out=process.env.BLOCKSTRIKE_TEST_OUT||path.join(root,'tests/artifacts/voces-clippy');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port),BLOCKSTRIKE_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false;srv.stdout.on('data',d=>{if(String(d).includes('localhost:'))ready=true;});let browser;const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=20000){const at=Date.now();while(Date.now()-at<timeout){const result=await fn();if(result)return result;await wait(20);}throw Error('Timed out');}
(async()=>{
 await until(()=>ready);browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});const errors=[];
 const create=async()=>{
  const p=await browser.newPage({viewport:{width:900,height:650}});await p.context().grantPermissions(['local-network-access']);p.on('pageerror',e=>errors.push(e.stack));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
  if(candidate)await p.route(`http://127.0.0.1:${port}/`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(candidate,'utf8')}));
  if(assets)for(const folder of ['javi','clippy'])await p.route('**/sonidos/'+folder+'/*.mp3',r=>r.fulfill({contentType:'audio/mpeg',body:fs.readFileSync(path.join(assets,folder,path.basename(new URL(r.request().url()).pathname)))}));
  await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'load'});await p.waitForFunction(()=>CITY.modelsReady&&CHARS.javi.skinCanvas,null,{polling:50,timeout:45000});
  await p.evaluate(()=>{
   initAudio();master.disconnect();const sink=AC.createGain();sink.gain.value=0;master.connect(sink);sink.connect(AC.destination);sfx=()=>{};
   window.voiceEvents=[];const original=playCharacterClip;playCharacterClip=(f,key,priority)=>{const h=original(f,key,priority);if(h)voiceEvents.push({key,priority,remote:f.remote,ch:f.ch.id});return h;};
   window.voiceSetup=(ch='javi')=>{stageExit();clearFighters();G.state='play';G.mp=false;G.paused=false;G.over=false;G.viewer=false;G.cine=null;G.panelOpen=false;G.goal=1000;G.charId=ch;
    const f=new Fighter({name:ch,char:ch,isPlayer:true}),v=new Fighter({name:'Rival',char:'sekza'});G.player=f;G.fighters.push(f,v);f.pos.set(-45,0,82);v.pos.set(-42,0,82);f.iframes=v.iframes=0;v.dummy='idle';f.flourT=v.flourT=999;f.yaw=cam.yaw=Math.PI/2;camera.position.set(-45,3,75);buildSkillBar(f);voiceEvents.length=0;return f;};
  });await p.waitForFunction(()=>AC.state==='running'&&SND.state==='ready'&&CHARACTER_VOICE_FILES.every(k=>SND.buf[k]),null,{polling:50,timeout:30000}).catch(async e=>{console.log('LOAD',await p.evaluate(()=>({state:AC?.state,sounds:SND.state,loaded:Object.keys(SND.buf).length,missing:CHARACTER_VOICE_FILES.filter(k=>!SND.buf[k])})));console.log('ERRORS',errors);throw e;});return p;
 };
 const a=await create();

 const decoded=await a.evaluate(()=>CLIPPY_VOICE_FILES.map(k=>({key:k,duration:SND.buf[k].duration,channel:soundCategory(k)})));assert.equal(decoded.length,9);assert.ok(decoded.every(x=>x.duration>.5&&x.channel==='game'));
 const phrases=await a.evaluate(()=>{
  const f=voiceSetup('jesuluto');animate(f,1/60);const c=f.clippy,hello=voiceEvents.at(-1).key,results=[];
  for(const[text,def]of Object.entries(CLIPPY_VOICES)){
   stopCharacterVoice(f);f.voicePlayback.cooldowns={};f.voicePlayback.clippyNextAt=0;const lines=[],native=c.bctx.fillText;
   c.bctx.fillText=function(t,...args){lines.push(t);return native.call(this,t,...args);};c.say(text);c.bctx.fillText=native;
   results.push({text,key:voiceEvents.at(-1).key,caption:lines.join(' '),bubble:c.bub.visible,duration:c.sayT});
  }return{hello,results};
 });assert.equal(phrases.hello,'clippy/hola');assert.ok(phrases.results.every(x=>x.caption===x.text&&x.bubble&&x.key.startsWith('clippy/')));
 const triggers=await a.evaluate(()=>{
  let f=voiceSetup('jesuluto');animate(f,1/60);useSkill(f,1);const attack=voiceEvents.at(-1).key;const before=voiceEvents.length;f.clippy.say('¡Parece que estás atacando!');f.clippy.say('¿Necesitas ayuda?');const noSpam=voiceEvents.length===before;
  runUlt(f);const awaken=voiceEvents.at(-1).key;
  f=voiceSetup('jesuluto');animate(f,1/60);MOVES.jlGiant(f,{color:f.ch.color});const giant=voiceEvents.at(-1).key;
  f=voiceSetup('jesuluto');animate(f,1/60);stopCharacterVoice(f);f.voicePlayback.cooldowns={};f.voicePlayback.clippyNextAt=0;f.clippy.sayT=0;
  const native=Math.random;Math.random=()=>0;try{updateJesuluto(f,f.model,1/60,G.time);}finally{Math.random=native;}const random=voiceEvents.at(-1).key;
  const handle=f.voicePlayback.audio;f.dispose();G.fighters=G.fighters.filter(x=>x!==f);G.player=null;
  return{attack,awaken,giant,noSpam,random,cleaned:f.voicePlayback.audio===null,handle:!!handle};
 });assert.equal(triggers.attack,'clippy/atacando');assert.equal(triggers.awaken,'clippy/pantalla_azul');assert.equal(triggers.giant,'clippy/vas_a_perder');assert.equal(triggers.random,'clippy/ayuda');assert.ok(triggers.noSpam&&triggers.cleaned&&triggers.handle);
 const b=await create(),pages=[a,b];
 for(let i=0;i<2;i++)await pages[i].evaluate(async i=>{voiceSetup(i?'sekza':'jesuluto');G.mp=true;NET.room='relay';NET.local=true;NET.named=await localRoom('codex-clippy-voces');NET.myPeer=NET.named.myId;NET.joinT=1000+i;netSendPlay();},i);
 const pump=async(n=1)=>{for(let i=0;i<n;i++)await Promise.all(pages.map(p=>p.evaluate(()=>{G.time+=.04;netTick(.04);updateCharacterVoices();netSendPlay();})));};
 await until(async()=>{await pump();return await a.evaluate(()=>NET.proxies.size===1)&&await b.evaluate(()=>NET.proxies.size===1);});
 await a.evaluate(()=>animate(G.player,1/60));await until(async()=>{await pump();return await b.evaluate(()=>voiceEvents.some(x=>x.remote&&x.key==='clippy/hola'));});
 const once=await b.evaluate(()=>voiceEvents.filter(x=>x.remote).length);await pump(12);assert.equal(await b.evaluate(()=>voiceEvents.filter(x=>x.remote).length),once);
 await a.evaluate(()=>useSkill(G.player,1));await until(async()=>{await pump();return await b.evaluate(()=>voiceEvents.some(x=>x.remote&&x.key==='clippy/atacando'));});
 const peerSubtitle=await b.evaluate(()=>{const f=[...NET.proxies.values()][0];return{present:!!f.clippy,bubble:f.clippy.bub.visible,owner:f.clippy.owner===f,key:f.voicePlayback.audio.key};});assert.ok(peerSubtitle.present&&peerSubtitle.bubble&&peerSubtitle.owner);assert.equal(peerSubtitle.key,'clippy/atacando');
 const remoteNoRandom=await b.evaluate(()=>{const f=[...NET.proxies.values()][0],before=voiceEvents.length,native=Math.random;f.clippy.sayT=0;Math.random=()=>0;try{updateJesuluto(f,f.model,1/60,G.time);f.clippy.say('¿Guardo los cambios?');}finally{Math.random=native;}return voiceEvents.length===before;});assert.ok(remoteNoRandom);
 await a.evaluate(()=>runUlt(G.player));await until(async()=>{await pump();return await b.evaluate(()=>voiceEvents.some(x=>x.remote&&x.key==='clippy/pantalla_azul'));});await pump(8);
 const network=await b.evaluate(()=>voiceEvents.filter(x=>x.remote));assert.equal(network.filter(x=>x.key==='clippy/pantalla_azul').length,1);assert.deepEqual(errors,[]);
 const report={ok:true,decoded,phrases,triggers,peerSubtitle,remoteNoRandom,network,errors};fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:true,decoded:decoded.length,phrases:phrases.results.map(p=>({key:p.key,caption:p.caption})),triggers,peerSubtitle,remoteNoRandom,network,errors}));

})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
