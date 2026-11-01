const{chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),port=18955,out=process.env.BLOCKSTRIKE_TEST_OUT||path.join(root,'tests/artifacts/recuperacion');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port),BLOCKSTRIKE_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false;srv.stdout.on('data',d=>{if(String(d).includes('localhost:'))ready=true;});let browser;const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 for(let i=0;i<100&&!ready;i++)await wait(30);
 browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required','--mute-audio']});const p=await browser.newPage({viewport:{width:900,height:650}}),errors=[];
 p.on('pageerror',e=>errors.push(e.stack));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,450));});await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
 if(process.env.BLOCKSTRIKE_TEST_HTML)await p.route(`http://127.0.0.1:${port}/`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(process.env.BLOCKSTRIKE_TEST_HTML,'utf8')}));
 await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'load'});await p.waitForFunction(()=>CITY.modelsReady&&CHARS.randi.skinCanvas);
 await p.evaluate(()=>{
  window.STRESS={stage:'',seed:19223,steps:0,error:null,history:[]};const nativeRandom=Math.random;Math.random=()=>{STRESS.seed=(Math.imul(STRESS.seed,1664525)+1013904223)>>>0;return STRESS.seed/4294967296;};
  for(const name of ['applyCtl','updateAction','physics','tickTimers','animate','updateProj','updateZones','updateFx','updateCamera','updateVerity','updateFace','updateCapitan','destRestore','destUpdate','updateHUD','drawLines']){
   const fn=window[name];window[name]=function(...args){const before=STRESS.stage;STRESS.stage=name+(args[0]?.ch?':'+args[0].ch.id:'');try{return fn.apply(this,args);}catch(e){if(!STRESS.error)STRESS.error={stage:STRESS.stage,message:e.message,stack:e.stack};throw e;}finally{STRESS.stage=before;}};
  }
  const neutral=()=>({mx:0,mz:0,jump:false,dash:false,m1:false,block:false,skill:-1,ult:false,up:false});
  window.stressSetup=(characters,awake)=>{
   stageExit();clearFighters();destRestore(true);G.state='play';G.mp=false;G.viewer=false;G.cine=null;G.chore=null;G.paused=false;G.over=false;G.panelOpen=false;G.goal=100000;G.hitstop=G.slowT=0;G.auto=false;G.botLvl=5;G.rules={...RULES_DEF,p:{...RULES_DEF.p}};GFX.auto=false;GFX.post=false;renderer.shadowMap.enabled=false;renderer.setPixelRatio(.4);STRESS.steps=0;STRESS.error=null;STRESS.awake=awake;
   characters.forEach((char,i)=>{const f=new Fighter({name:char+i,char});f.pos.set((i%2)*2-1,0,Math.floor(i/2)*2-1);f.home=f.pos.clone();f.yaw=i%2?Math.PI:0;f.iframes=0;f.ai.P=Object.assign(aiParams(7),{skill:1,think:.15});f.flourT=99;G.fighters.push(f);if(!i){G.player=f;f.isPlayer=true;G.charId=char;}});
   playerCtl=()=>{const f=G.player;if(!f.ai)return neutral();const target=pickTarget(f);if(target)cam.yaw=yawTo(f,target);const c=aiCtl(f,1/60);if(!STRESS.awake)c.ult=false;return c;};
   buildSkillBar(G.player);$('menu').classList.add('hidden');$('hud').classList.remove('hidden');
  };
 });
 await p.evaluate(()=>{initAudio();renderMain=()=>{};});await wait(4000);console.log('AUDIO STATE',await p.evaluate(()=>({context:AC?.state,sounds:SND.state,buffers:Object.keys(SND.buf).length})));const cases=[];
 for(const [chars,awake]of [[['randi','javi','javi','javi'],false],[['randi','randi','javi','sebolla'],false],[['javi','randi','sebolla','rocket'],true]]){
  await p.evaluate(({chars,awake})=>stressSetup(chars,awake),{chars,awake});let failure=null;
  for(let batch=0;batch<60;batch++){
   const state=await p.evaluate(()=>{
    try{for(let j=0;j<90;j++){
     if(!STRESS.awake)for(const f of G.fighters){f.ult=0;f.awak=0;}
     loop(last+1000/90);STRESS.steps++;
     if(STRESS.steps%240===0){STRESS.history.push({step:STRESS.steps,actors:G.fighters.map(f=>({ch:f.ch.id,hp:f.hp,a:f.action?.name,r:f.ragdoll,pos:f.pos.toArray()})),fx:FX.length,timers:TIMERS.length});if(STRESS.history.length>8)STRESS.history.shift();}
     if(G.fighters.some(f=>!Number.isFinite(f.pos.x)||!Object.values(f.anim.x).every(Number.isFinite)))throw Error('Non-finite fighter');
    }}catch(e){return {error:STRESS.error||{message:e.message,stack:e.stack},steps:STRESS.steps,time:G.time,history:STRESS.history,fx:FX.map(f=>({type:f.obj.type,t:f.t,dur:f.dur,custom:!!f.dispose})),actors:G.fighters.map(f=>({ch:f.ch.id,alive:f.alive,a:f.action?.name,at:f.action?.t,hp:f.hp})),timers:TIMERS.length};}
    if(STRESS.error||FRAME_HEALTH.errors.length)return{error:STRESS.error||FRAME_HEALTH.errors[0],steps:STRESS.steps};return{steps:STRESS.steps,fx:FX.length,timers:TIMERS.length};
   });if(state.error){failure=state;console.log('FAILURE',JSON.stringify(state));break;}if(batch%15===0)console.log('PROGRESS',chars.join(','),state.steps,state.fx,state.timers);
  }
  cases.push({chars,awake,failure});if(failure)break;
 }
 fs.writeFileSync(path.join(out,'combate-prolongado.json'),JSON.stringify({cases,errors},null,2));console.log('RESULT',JSON.stringify(cases.map(c=>({chars:c.chars,awake:c.awake,failed:!!c.failure}))));if(cases.some(c=>c.failure)||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
