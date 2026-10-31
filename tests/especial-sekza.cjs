const{chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path');const{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tests/artifacts/sekza-r');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1366,height:820}}),errors=[];
 p.on('pageerror',e=>errors.push(e.stack));p.on('console',m=>{if(m.type()==='error'&&m.text().includes('WebGLProgram'))errors.push(m.text());});
 await p.addInitScript(()=>{requestAnimationFrame=()=>0;setInterval=()=>0;});await p.goto(pathToFileURL(path.join(root,fs.existsSync(path.join(root,'blockstrike.html'))?'blockstrike.html':'index.html')).href,{waitUntil:'load'});
 await p.waitForFunction(()=>CITY.modelsReady&&CHARS.sekza.skinCanvas,{timeout:45000});
 const initial=await p.evaluate(()=>{
  clearFighters();G.state='play';G.paused=false;G.over=false;G.mp=false;G.viewer=null;G.cine=null;G.panelOpen=false;
  const f=new Fighter({name:'Sekza',char:'sekza',isPlayer:true});G.player=f;G.fighters.push(f);f.pos.set(-20,0,44);f.iframes=0;f.yaw=-Math.PI/2;cam.yaw=-Math.PI/2;G.time=10;
  $('menu').classList.add('hidden');$('hud').classList.add('hidden');$('plates').classList.add('hidden');
  return {buildings:CITY.buildings.length,casino:CITY.interiors.find(b=>b.label==='CASINO AURORA'),modelsReady:CITY.modelsReady};
 });
 await p.keyboard.press('r');
 const flight=await p.evaluate(()=>{
  const f=G.player;keys.KeyW=true;let top=0;
  for(let i=0;i<300;i++){const dt=1/120;G.time+=dt;applyCtl(f,playerCtl(),dt);physics(f,dt);tickTimers(f,dt);animate(f,dt);updateSekzaSpecials(dt);top=Math.max(top,f.pos.y);}
  keys.KeyW=false;const flying=f.rFlightT>0&&f.pos.y>1;const moved=Math.hypot(f.pos.x+20,f.pos.z-44);
  const high=f.pos.y;keys.KeyC=true;for(let i=0;i<40;i++){const dt=1/120;G.time+=dt;applyCtl(f,playerCtl(),dt);physics(f,dt);updateSekzaSpecials(dt);}keys.KeyC=false;const descended=f.pos.y<high-.1;
  for(let i=0;i<280;i++){const dt=1/120;G.time+=dt;applyCtl(f,playerCtl(),dt);physics(f,dt);tickTimers(f,dt);animate(f,dt);updateSekzaSpecials(dt);}
  return {flying,top,moved,descended,ended:f.rFlightT===0,landed:f.onGround,cooldown:f.rFlightCD,attackCooldowns:f.cd.slice(),hp:f.hp};
 });
 const gulls=await p.evaluate(()=>{
  const f=G.player;f.reset();f.pos.set(-20,0,82);f.iframes=0;
  for(const [i,x]of [-16,-9,4,28].entries()){const t=new Fighter({name:'Rival '+i,char:'javi'});t.pos.set(x,0,82);t.iframes=0;t.ai=null;G.fighters.push(t);}
  sekzaSpecialKey(f);G.time+=.1;updateSekzaSpecials(.1);const pendingOnly=f.rFlightT===0;
  sekzaSpecialKey(f);const targets=SEKZA_R.flocks.map(g=>g.target.name),count=SEKZA_R.flocks.length;
  for(let i=0;i<350;i++){const dt=1/120;G.time+=dt;for(const q of G.fighters){physics(q,dt);tickTimers(q,dt);}updateSekzaSpecials(dt);}
  const victims=G.fighters.slice(1).map(t=>({name:t.name,damage:t.maxHp-t.hp}));
  const ownerDamage=f.maxHp-f.hp,flightFromDouble=f.rFlightT,cd=f.rGullCD;
  const noRepeat=summonSekzaGulls(f)===false;f.rGullCD=0;f.pos.set(-20,0,40);const outsideRejected=summonSekzaGulls(f)===false;
  return {pendingOnly,count,targets,victims,ownerDamage,flightFromDouble,cd,noRepeat,outsideRejected,left:SEKZA_R.flocks.length};
 });
 const replay=await p.evaluate(()=>{
  clearSekzaFlocks();const own=G.player,remote=new Fighter({name:'Remote',char:'sekza',remote:true,peer:'uremote111'});remote.pos.set(-24,0,82);G.fighters.push(remote);own.reset();own.iframes=0;own.pos.set(-20,0,82);
  const hp=own.hp;replayAct(remote,{k:'r',mode:'gulls',ids:[gullTargetId(own)],from:[-24,0,82],seed:123});
  for(let i=0;i<250;i++){G.time+=1/120;updateSekzaSpecials(1/120);}
  const noDuplicateDamage=own.hp===hp;clearSekzaFlocks();return {noDuplicateDamage};
 });
 const failures=[];if(!flight.flying||!flight.descended||!flight.ended||!flight.landed||flight.moved<10||flight.top>6||flight.attackCooldowns.some(Boolean))failures.push('Flight lifecycle');
 if(!gulls.pendingOnly||gulls.count!==6||gulls.ownerDamage||gulls.flightFromDouble||!gulls.noRepeat||!gulls.outsideRejected||gulls.victims.slice(0,3).some(t=>t.damage<=0)||gulls.victims[3].damage)failures.push('Gull targeting/damage');
 if(!replay.noDuplicateDamage)failures.push('Remote replay damage');
 for(const [name,pos,look]of [['playa',[-45,3.6,73],[-45,1.6,97]],['casino',[78,4,-20],[78,2,-36]]]){
  await p.evaluate(({name,pos,look})=>{clearSekzaFlocks();for(let i=0;i<30;i++){updateFx(.1);PS.update(.1);}$('nums').innerHTML='';WX.mode='clear';WX.hour=12;WX.cycle=false;updateCityWeather(0,true);gfxSet(0,false,false);const f=G.player;f.reset();f.iframes=0;f.pos.set(name==='casino'?78:-20,0,name==='casino'?-23:82);animate(f,1/60);camera.position.set(...pos);camera.lookAt(...look);camera.fov=62;camera.updateProjectionMatrix();IMPACT.t=0;renderView(scene,camera);},{name,pos,look});
  await p.screenshot({path:path.join(out,name+'.png')});
 }
 const plan=await p.evaluate(()=>({radius:ARENA,buildings:CITY_PLAN.map(b=>[b.x,b.z,b.w,b.d,b.h,b.accessible])}));fs.writeFileSync(path.join(out,'mapa.json'),JSON.stringify(plan));
 const report={initial,flight,gulls,replay,failures,errors};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await b.close();if(failures.length||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
