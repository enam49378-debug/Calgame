const{chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),candidate=process.env.BLOCKSTRIKE_TEST_HTML||'',port=18945,out=path.join(root,'tests/artifacts/pausa');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port),BLOCKSTRIKE_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false;srv.stdout.on('data',d=>{if(String(d).includes('localhost:'))ready=true;});let browser;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 for(let i=0;i<100&&!ready;i++)await wait(30);assert.ok(ready,'Server ready');
 browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.stack));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
 if(candidate)await p.route(`http://127.0.0.1:${port}/`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(candidate,'utf8')}));
 const setup=async()=>{
  await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'load'});await p.waitForFunction(()=>CHARS.javi.skinCanvas&&CITY.modelsReady);
  await p.evaluate(()=>{G.state='play';G.paused=false;G.over=false;G.mp=false;G.panelOpen=false;const f=new Fighter({name:'Jugador',char:'javi',isPlayer:true});G.fighters.push(f);G.player=f;f.pos.set(-45,0,82);f.iframes=0;animate(f,1/60);WX.hour=12;WX.mode='clear';WX.cycle=false;updateCityWeather(0,true);updateBeach(1);$('menu').classList.add('hidden');camera.position.set(-45,3.6,74);camera.lookAt(-45,1.7,95);renderView(scene,camera);setPause(true);});
 };
 await setup();assert.deepEqual(await p.locator('#pause-home button:visible').allTextContents(),['Reanudar','Opciones','Menú']);
 await p.screenshot({path:path.join(out,'pausa.png')});await p.locator('#pause-options').click();assert.ok(await p.evaluate(()=>G.paused));
 await p.waitForFunction(()=>AC&&AC.state==='running');await p.screenshot({path:path.join(out,'opciones.png')});
 await p.evaluate(()=>{
  const test={};
  for(const [key,node,freq]of [['game',gameAudioBus,375],['ambient',ambientAudioBus,750],['master',master,0]]){
   const an=AC.createAnalyser();an.fftSize=2048;node.connect(an);const zero=AC.createGain();zero.gain.value=0;an.connect(zero);zero.connect(AC.destination);test[key]=an;
   if(freq){const osc=AC.createOscillator(),gain=AC.createGain();osc.frequency.value=freq;gain.gain.value=.1;osc.connect(gain);gain.connect(node);osc.start();test[key+'Osc']=osc;}
  }
  window.PAUSE_AUDIO_TEST=test;
 });
 const levels=()=>p.evaluate(()=>{const out={};for(const key of ['game','ambient','master']){const data=new Float32Array(2048);PAUSE_AUDIO_TEST[key].getFloatTimeDomainData(data);out[key]=Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length);}return out;});
 await wait(400);const baseline=await levels();assert.ok(baseline.game>.04&&baseline.ambient>.04);
 await p.locator('#volume-ambient').press('Home');await wait(220);const ambientMuted=await levels();assert.ok(ambientMuted.ambient<.0003&&ambientMuted.game>.04);
 await p.locator('#volume-game').press('ArrowLeft');assert.equal(await p.locator('#volume-game-value').textContent(),'99%');
 await p.locator('#volume-game').evaluate(el=>{el.value='65';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await p.locator('#volume-general').press('Home');await wait(250);const allMuted=await levels();assert.ok(allMuted.master<.0003);
 await p.locator('#volume-general').evaluate(el=>{el.value='50';el.dispatchEvent(new Event('input',{bubbles:true}));});await wait(180);
 const saved=await p.evaluate(()=>({...AUDIO_LEVELS}));assert.deepEqual(saved,{general:50,ambient:0,game:65});
 await p.keyboard.press('Escape');assert.ok(await p.locator('#pause-home').isVisible());assert.ok(await p.evaluate(()=>G.paused));
 await p.locator('#resume').click();await p.waitForFunction(()=>!G.paused);assert.ok(await p.locator('#pause').isHidden());
 await setup();await p.locator('#pause-options').click();assert.deepEqual(await p.evaluate(()=>({...AUDIO_LEVELS})),saved);
 assert.equal(await p.locator('#volume-general-value').textContent(),'50%');
 const initialGains=await p.evaluate(()=>({master:master.gain.value,game:gameAudioBus.gain.value,ambient:ambientAudioBus.gain.value}));assert.ok(Math.abs(initialGains.master-.25)<.001&&Math.abs(initialGains.game-.65)<.001&&initialGains.ambient===0);
 // Verificar la ruta de audio HTML usada al abrir el juego sin servidor.
 const fallback=await p.evaluate(async()=>{
  const native=window.Audio,captured=[];window.Audio=function(src){const el=document.createElement('audio');el.src=src;el.play=()=>Promise.resolve();captured.push(el);return el;};
  SND.state='fallback';delete SND.buf.vhit;WX.sound=false;playSnd('vhit',1);await new Promise(r=>setTimeout(r,10));
  const gameWithEnvironmentOff=captured[0]?.volume;WX.sound=true;
  const el=new Audio('sonidos/city.mp3'),r=trackHtmlAudio(el,.3,'ambient');setAudioLevel('ambient',40);const ambientScaled=el.volume;
  setAudioLevel('general',0);const bothMuted=captured.every(el=>el.volume===0);window.Audio=native;
  setAudioLevel('general',50);setAudioLevel('ambient',0);return {gameWithEnvironmentOff,ambientScaled,bothMuted};
 });
 assert.ok(Math.abs(fallback.gameWithEnvironmentOff-.1625)<.001&&Math.abs(fallback.ambientScaled-.06)<.001&&fallback.bothMuted);
 await p.setViewportSize({width:900,height:600});await p.screenshot({path:path.join(out,'opciones-600.png')});
 await p.locator('#pause-back').click();await p.locator('#tomenu').click();assert.ok(await p.locator('#menu').isVisible());assert.equal(await p.evaluate(()=>G.state),'menu');
 const report={ok:true,menu:['Reanudar','Opciones','Menú'],baseline,ambientMuted,allMuted,saved,reloadGains:initialGains,fallback,keyboardAndNavigation:true,errors};
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
