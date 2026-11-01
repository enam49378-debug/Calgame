const{chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),candidate=process.env.BLOCKSTRIKE_TEST_HTML||'',port=18951,out=process.env.BLOCKSTRIKE_TEST_OUT||path.join(root,'tests/artifacts/estabilidad');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port),BLOCKSTRIKE_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false;srv.stdout.on('data',d=>{if(String(d).includes('localhost:'))ready=true;});let browser;const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 for(let i=0;i<100&&!ready;i++)await wait(30);assert.ok(ready);
 browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];
 p.on('pageerror',e=>errors.push(e.stack));p.on('console',m=>{if(m.type()==='error'&&m.text().includes('WebGLProgram'))errors.push(m.text());});await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
 if(candidate)await p.route(`http://127.0.0.1:${port}/`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(candidate,'utf8')}));
 await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'load'});await p.waitForFunction(()=>CITY.modelsReady&&CHARS.sebolla.skinCanvas);
 await p.evaluate(()=>{
  window.combatSetup=(ch='sebolla',gap=8)=>{
   stageExit();clearFighters();destRestore(true);G.state='play';G.mp=false;G.viewer=false;G.cine=null;G.chore=null;G.paused=false;G.over=false;G.panelOpen=false;G.charId=ch;G.goal=1000;G.hitstop=G.slowT=0;IMPACT.t=IMPACT.cd=0;G.rules={...RULES_DEF,p:{...RULES_DEF.p}};
   const f=new Fighter({name:CHARS[ch].name,char:ch,isPlayer:true}),v=new Fighter({name:'Rival',char:'javi'});G.player=f;G.fighters.push(f,v);f.pos.set(-45,0,82);f.yaw=cam.yaw=Math.PI/2;v.pos.set(-45+gap,0,82);v.yaw=-Math.PI/2;v.dummy='idle';v.maxHp=v.hp=5000;f.iframes=v.iframes=0;f.prevYaw=f.yaw;f.flourT=v.flourT=999;
   for(const k of Object.keys(keys))delete keys[k];pressed.clear();f.cd.fill(0);animate(f,1/120);animate(v,1/120);buildSkillBar(f);$('menu').classList.add('hidden');$('death').classList.add('hidden');$('hud').classList.remove('hidden');camera.position.set(-43,3,75);camera.lookAt(-42,1,82);return f;
  };
 });
 const stationary=[];
 for(const slot of [1,2,3]){
  const result=await p.evaluate(slot=>{const f=combatSetup();f.vel.set(9,0,-3);f.dashT=.15;useSkill(f,slot);const start=f.pos.clone(),initial=f.vel.toArray(),dash=f.dashT;let visualOffset=0;
   for(let i=0;i<240;i++){step(1/120);visualOffset=Math.max(visualOffset,Math.hypot(f.model.inner.position.x,f.model.inner.position.z));}
   const distance=f.pos.distanceTo(start),finished=!f.action;keys.KeyW=true;step(1/60);delete keys.KeyW;return{slot,initial,dash,distance,finished,visualOffset,controlRestored:Math.hypot(f.vel.x,f.vel.z)>0};
  },slot);stationary.push(result);assert.equal(result.distance,0);assert.deepEqual(result.initial,[0,0,0]);assert.equal(result.dash,0);assert.ok(result.finished&&result.controlRestored);assert.ok(result.visualOffset<.5);
 }
 const brawl=await p.evaluate(()=>{const f=combatSetup('sebolla',15),start=f.pos.clone();f.vel.set(0,0,9);useSkill(f,0);for(let i=0;i<30;i++)step(1/120);const rush=f.pos.x-start.x;for(let i=0;i<140;i++)step(1/120);const stopped=Math.hypot(f.vel.x,f.vel.z),sideDrift=Math.abs(f.pos.z-start.z);endAction(f);
  const v=G.fighters[1];v.pos.set(f.pos.x+2.5,0,f.pos.z);f.cd.fill(0);useSkill(f,0);f.action.t=.4;updateAction(f,1/120);const approach=Math.hypot(f.vel.x,f.vel.z);v.alive=false;updateAction(f,1/120);const lostTargetSpeed=Math.hypot(f.vel.x,f.vel.z);f.vel.set(7,0,2);endAction(f);return{rush,stopped,sideDrift,approach,lostTargetSpeed,cancelSpeed:Math.hypot(f.vel.x,f.vel.z)};});
 assert.ok(brawl.rush>3);assert.equal(brawl.stopped,0);assert.equal(brawl.sideDrift,0);assert.ok(brawl.approach>0);assert.equal(brawl.lostTargetSpeed,0);assert.equal(brawl.cancelSpeed,0);
 const flash=await p.evaluate(()=>{
  combatSetup('sebolla',1.8);GFX.post=false;const visibility=WORLD.map(o=>o.visible),override=scene.overrideMaterial,background=scene.background,fog=scene.fog,native=renderer.render;let rendered=0,failed=false;
  IMPACT.cd=0;impactFrame('#ffd91a',.11);renderer.render=()=>{rendered++;throw Error('Injected render failure');};try{renderMain();}catch(e){failed=true;}finally{renderer.render=native;}
  const unchanged=scene.overrideMaterial===override&&scene.background===background&&scene.fog===fog&&WORLD.every((o,i)=>o.visible===visibility[i]);
  renderer.render=()=>{rendered++;};try{renderMain();}finally{renderer.render=native;}
  for(let i=0;i<20;i++){IMPACT.cd=0;impactFrame('#ffd91a',.11);}
  drawLines(0);return{failed,unchanged,rendered,animations:$('impact-flash').getAnimations().length,pointerEvents:getComputedStyle($('impact-flash')).pointerEvents};
 });assert.ok(flash.failed&&flash.unchanged);assert.equal(flash.rendered,2);assert.equal(flash.animations,1);assert.equal(flash.pointerEvents,'none');
 // No animation frames or game ticks run during this wait: the compositor must clear the flash itself.
 await wait(200);
 const expired=await p.evaluate(()=>{const opacity=+getComputedStyle($('impact-flash')).opacity;drawLines(0);return{opacity,impact:IMPACT.t,animations:$('impact-flash').getAnimations().length};});assert.equal(expired.opacity,0);assert.equal(expired.impact,0);assert.equal(expired.animations,0);
 const skills=await p.evaluate(()=>{
  const checked=[];
  for(const ch of CHAR_IDS.filter(k=>!CHARS[k].hidden))for(const awake of [false,true])for(let slot=0;slot<4;slot++){
   const f=combatSetup(ch,1.8);if(awake)f.awak=30;buildSkillBar(f);useSkill(f,slot);
   try{for(let i=0;i<300;i++){if(G.cine)updateCine(1/60);else step(1/60);updateCamFx(1/60);updateCamera(1/60);if(!Number.isFinite(f.pos.x)||!Object.values(f.anim.x).every(Number.isFinite))throw Error('Non-finite animation or position');}}
   catch(e){throw Error(ch+' / '+slot+' / awake='+awake+': '+e.stack);}
   checked.push({ch,awake,slot});
  }return checked;
 });
 const mountCleanup=await p.evaluate(()=>{
  const result=[];
  for(const mode of ['reset','dispose']){
   const f=combatSetup();MOVES.sebMount(f,{});const M=f.mount;let disposed=0;
   M.geos[0].addEventListener('dispose',()=>disposed++);M.head.tex.addEventListener('dispose',()=>disposed++);
   f[mode]();result.push({mode,bodyRemoved:!M.g.parent,headRemoved:!M.head.g.parent,ownerReleased:!f.mount,disposed});
   if(mode==='dispose'){G.fighters=G.fighters.filter(x=>x!==f);G.player=null;}
  }return result;
 });assert.ok(mountCleanup.every(x=>x.bodyRemoved&&x.headRemoved&&x.ownerReleased&&x.disposed===2));
 const rendered=[];
 for(const post of [false,true]){
  const result=await p.evaluate(post=>{
   const f=combatSetup('sebolla',1.8);GFX.auto=false;GFX.post=post;renderer.shadowMap.enabled=false;renderer.setPixelRatio(.5);renderer.setSize(innerWidth,innerHeight,false);if(composer)composer.setSize(innerWidth*.5,innerHeight*.5);
   WX.mode='clear';WX.cycle=false;WX.hour=15;updateCityWeather(0,true);const visibility=WORLD.map(o=>o.visible);useSkill(f,0);const start=G.time;
   for(let i=0;i<100;i++)loop(last+1000/30);
   return{post,timeAdvanced:G.time-start,action:f.action?.name,override:scene.overrideMaterial===null,worldPreserved:WORLD.every((o,i)=>o.visible===visibility[i]),targetHp:G.fighters[1].hp,impact:IMPACT.t};
  },post);rendered.push(result);assert.ok(result.timeAdvanced>1.6&&result.override&&result.worldPreserved);assert.equal(result.action,undefined);assert.ok(result.targetHp<5000);
 }
 await p.screenshot({path:path.join(out,'sebolla-despues-del-ataque.png')});assert.deepEqual(errors,[]);const report={ok:true,stationary,brawl,flash,expired,skillsChecked:skills.length,mountCleanup,rendered,errors};fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
