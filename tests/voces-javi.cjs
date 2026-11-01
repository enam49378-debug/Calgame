const{chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),candidate=process.env.BLOCKSTRIKE_TEST_HTML||'',assets=process.env.BLOCKSTRIKE_VOICE_ASSETS||'',port=18958,out=process.env.BLOCKSTRIKE_TEST_OUT||path.join(root,'tests/artifacts/voces-javi');fs.mkdirSync(out,{recursive:true});
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
  });await p.waitForFunction(()=>AC.state==='running'&&SND.state==='ready'&&JAVI_VOICE_FILES.every(k=>SND.buf[k]),null,{polling:50,timeout:30000}).catch(async e=>{console.log('LOAD',await p.evaluate(()=>({state:AC?.state,sounds:SND.state,loaded:Object.keys(SND.buf).length,missing:JAVI_VOICE_FILES.filter(k=>!SND.buf[k])})));console.log('ERRORS',errors);throw e;});return p;
 };
 const a=await create();
 const decoded=await a.evaluate(()=>JAVI_VOICE_FILES.map(k=>({key:k,duration:SND.buf[k].duration,channel:soundCategory(k)})));assert.equal(decoded.length,15);assert.ok(decoded.every(c=>c.duration>.5&&c.duration<5&&c.channel==='game'));
 const triggers=await a.evaluate(()=>{
  const result={};let f=voiceSetup(),enemy=G.fighters[1];applyHit(enemy,f,{dmg:5,kb:0});applyHit(enemy,f,{dmg:5,kb:0});result.hurt=voiceEvents.map(x=>x.key);
  const keys=[];for(let i=0;i<8;i++){f.reset();kill(f,enemy);keys.push(voiceEvents.at(-1).key);kill(f,enemy);}result.death=keys;result.deathCount=voiceEvents.filter(x=>x.key.includes('muerte')).length;
  f=voiceSetup();enemy=G.fighters[1];enemy.hp=12;applyHit(f,enemy,{dmg:3,kb:0});applyHit(f,enemy,{dmg:3,kb:0});result.near=voiceEvents.map(x=>x.key);kill(enemy,f);result.kill=voiceEvents.at(-1).key;
  f=voiceSetup();f.ult=100;updateCharacterVoices();updateCharacterVoices();result.ready=voiceEvents.map(x=>x.key);f.ult=0;updateCharacterVoices();stopCharacterVoice(f);f.ult=100;updateCharacterVoices();result.recharged=voiceEvents.map(x=>x.key);
  f=voiceSetup();javiSpeak(f,'kill');f.ult=100;updateCharacterVoices();result.queuedReady=!!f.voicePlayback.pendingReady;stopCharacterVoice(f);updateCharacterVoices();result.afterQueue=voiceEvents.map(x=>x.key);
  f=voiceSetup();f.ult=100;useUlt(f);result.activationAtStart=voiceEvents.map(x=>x.key);runUlt(f);result.activationOnce=voiceEvents.filter(x=>x.key==='javi/activar_ulti').length;G.cine=null;
  f=voiceSetup();f.voicePlayback.idleAfter=G.time-1;updateCharacterVoices();updateCharacterVoices();result.idle=voiceEvents.map(x=>x.key);f=voiceSetup();f.voicePlayback.idleAfter=G.time-1;f.vel.x=9;updateCharacterVoices();result.movingIdle=voiceEvents.length;
  f=voiceSetup('sekza');javiSpeak(f,'death');javiSpeak(f,'activate');result.otherCharacter=voiceEvents.length;return result;
 });
 assert.equal(triggers.hurt.length,1);assert.ok(triggers.hurt[0].includes('dano'));assert.equal(triggers.deathCount,8);assert.ok(triggers.death.every((k,i)=>!i||k!==triggers.death[i-1]));assert.equal(triggers.near.length,1);assert.ok(triggers.near[0].includes('casi_baja'));assert.ok(triggers.kill.includes('/baja_'));assert.equal(triggers.ready.length,1);assert.equal(triggers.recharged.length,2);assert.ok(triggers.queuedReady&&triggers.afterQueue[1].includes('ulti_lista'));assert.equal(triggers.activationOnce,1);assert.deepEqual(triggers.activationAtStart,['javi/activar_ulti']);assert.equal(triggers.idle.length,1);assert.ok(triggers.idle[0].includes('reposo'));assert.equal(triggers.movingIdle,0);assert.equal(triggers.otherCharacter,0);
 const life=await a.evaluate(()=>{const f=voiceSetup();javiSpeak(f,'idle');const first=f.voicePlayback.audio;javiSpeak(f,'hurt');const interrupted=f.voicePlayback.audio!==first;kill(f,G.fighters[1]);const death=f.voicePlayback.audio.key;f.dispose();G.fighters=G.fighters.filter(x=>x!==f);G.player=null;return{interrupted,death,cleaned:f.voicePlayback.audio===null};});assert.ok(life.interrupted&&life.death.includes('muerte')&&life.cleaned);
 await a.evaluate(()=>{const f=voiceSetup();setAudioLevel('general',100);setAudioLevel('game',100);setAudioLevel('ambient',0);window.voiceAnalyzers={};for(const[k,node]of[['game',gameAudioBus],['master',master]]){const an=AC.createAnalyser(),silent=AC.createGain();an.fftSize=2048;silent.gain.value=0;node.connect(an);an.connect(silent);silent.connect(AC.destination);voiceAnalyzers[k]=an;}playCharacterClip(f,'javi/activar_ulti',4);});
 const peak=async()=>{let value={game:0,master:0};for(let i=0;i<8;i++){await wait(85);const data=await a.evaluate(()=>Object.fromEntries(Object.entries(voiceAnalyzers).map(([k,an])=>{const b=new Float32Array(2048);an.getFloatTimeDomainData(b);return[k,Math.sqrt(b.reduce((s,x)=>s+x*x,0)/b.length)];})));for(const k of Object.keys(value))value[k]=Math.max(value[k],data[k]);}return value;};
 const audible=await peak();assert.ok(audible.game>.001&&audible.master>.0005);
 await a.evaluate(()=>{setAudioLevel('game',0);playCharacterClip(G.player,'javi/activar_ulti',4);});await wait(200);const gameMuted=await peak();assert.ok(gameMuted.game<.0001);
 await a.evaluate(()=>{setAudioLevel('game',100);setAudioLevel('general',0);playCharacterClip(G.player,'javi/activar_ulti',4);});await wait(200);const allMuted=await peak();assert.ok(allMuted.game>.001&&allMuted.master<.0001);
 const fallback=await a.evaluate(()=>{setAudioLevel('general',100);setAudioLevel('game',100);const f=G.player,key='javi/ulti_lista_1',buf=SND.buf[key],native=window.Audio;delete SND.buf[key];let audio;
  window.Audio=function(src){audio=document.createElement('audio');audio.src=src;audio.play=()=>Promise.resolve();return audio;};playCharacterClip(f,key,3);const before=audio.volume;setAudioLevel('game',0);const muted=audio.volume===0,record=f.voicePlayback.audio.htmlRecord;stopCharacterVoice(f);const removed=!HTML_AUDIO_LEVELS.has(record);SND.buf[key]=buf;window.Audio=native;setAudioLevel('game',100);return{before,muted,removed};});assert.ok(fallback.before>0&&fallback.muted&&fallback.removed);
 // Two real room clients must hear the owner's chosen variant once, including death and confirmed K.O.
 const b=await create(),pages=[a,b];
 for(let i=0;i<2;i++)await pages[i].evaluate(async i=>{voiceSetup(i?'sekza':'javi');G.mp=true;NET.room='relay';NET.local=true;NET.named=await localRoom('codex-voces-javi');NET.myPeer=NET.named.myId;NET.joinT=1000+i;netSendPlay();},i);
 const pump=async(n=1)=>{for(let i=0;i<n;i++)await Promise.all(pages.map(p=>p.evaluate(()=>{G.time+=.04;netTick(.04);updateCharacterVoices();netSendPlay();})));};
 await until(async()=>{await pump();return await a.evaluate(()=>NET.proxies.size===1)&&await b.evaluate(()=>NET.proxies.size===1);});
 await b.evaluate(()=>{G.player.pos.set(-42,0,82);netSendPlay();});await a.evaluate(()=>javiSpeak(G.player,'hurt'));
 await until(async()=>{await pump();return await b.evaluate(()=>voiceEvents.some(x=>x.remote&&x.key.includes('/dano_')));});
 const chosen=await a.evaluate(()=>G.player.characterVoiceCue.k);await pump(20);const repeated=await b.evaluate(()=>voiceEvents.filter(x=>x.remote));assert.equal(repeated.length,1);assert.equal(repeated[0].key,chosen);
 await a.evaluate(()=>{G.time+=5;stopCharacterVoice(G.player);G.player.iframes=0;G.player.ragdoll=0;netSendPlay();});await pump(4);
 await b.evaluate(()=>applyHit(G.player,[...NET.proxies.values()][0],{dmg:5,kb:0,color:'#ffffff'}));
 await until(async()=>{await pump();return await a.evaluate(()=>G.player.hp<G.player.maxHp)&&await b.evaluate(()=>voiceEvents.filter(x=>x.remote&&x.key.includes('/dano_')).length===2);});
 await b.evaluate(()=>{G.player.hp=1;G.player.iframes=0;G.player.ragdoll=0;netSendPlay();});await pump(5);await a.evaluate(()=>applyHit(G.player,[...NET.proxies.values()][0],{dmg:10,kb:0,color:'#ffffff'}));
 await until(async()=>{await pump();return await b.evaluate(()=>!G.player.alive&&voiceEvents.some(x=>x.remote&&x.key.includes('/baja_')));});
 await a.evaluate(()=>kill(G.player,null));await until(async()=>{await pump();return await b.evaluate(()=>voiceEvents.some(x=>x.remote&&x.key.includes('/muerte_')));});
 const network=await b.evaluate(()=>voiceEvents.filter(x=>x.remote));assert.equal(network.length,4);assert.deepEqual(errors,[]);
 const report={ok:true,decoded,triggers,life,audible,gameMuted,allMuted,fallback,network,errors};fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:true,decoded:decoded.length,triggers,life,audible,gameMuted,allMuted,fallback,network,errors}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
