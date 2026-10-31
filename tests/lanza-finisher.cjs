const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),candidate=process.env.BLOCKSTRIKE_TEST_HTML||'',port=18946,out=process.env.BLOCKSTRIKE_TEST_OUT||path.join(root,'tests/artifacts/lanza');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port),BLOCKSTRIKE_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false,log='';srv.stdout.on('data',d=>{log+=d;if(String(d).includes('localhost:'))ready=true;});srv.stderr.on('data',d=>log+=d);let browser;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 for(let i=0;i<100&&!ready;i++)await wait(30);assert.ok(ready,log);
 browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.stack));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
 if(candidate)await p.route(`http://127.0.0.1:${port}/`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(candidate,'utf8')}));
 await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'load'});await p.waitForFunction(()=>CHARS.javi.skinCanvas&&CITY.modelsReady);
 await p.evaluate(()=>{
  window.lanzaSetup=(hp=8)=>{
   clearFighters();G.state='play';G.paused=false;G.over=false;G.mp=false;G.panelOpen=false;G.viewer=false;G.goal=10;G.hitstop=0;
   const f=new Fighter({name:'Javi',char:'javi',isPlayer:true}),v=new Fighter({name:'Rival',char:'sekza'});
   G.fighters.push(f,v);G.player=f;f.pos.set(-45,0,82);f.yaw=Math.PI/2;cam.yaw=Math.PI/2;v.pos.set(-39,0,82);v.yaw=-Math.PI/2;v.hp=hp;v.lastHurtT=G.time;f.iframes=v.iframes=0;v.ai=null;v.dummy=true;
   animate(f,1/60);animate(v,1/60);buildSkillBar(f);$('menu').classList.add('hidden');$('death').classList.add('hidden');WX.hour=15;WX.mode='clear';WX.cycle=false;updateCityWeather(0,true);updateBeach(1);
   camera.position.set(-39,3.1,74);camera.lookAt(-40,1,82);camera.updateMatrixWorld();return {f,v};
  };
  window.lanzaTick=(n=1)=>{for(let i=0;i<n;i++){
   const dt=1/120;G.time+=dt;for(const f of G.fighters){updateAction(f,dt);physics(f,dt);tickTimers(f,dt);animate(f,dt);}updateProj(dt);updateSpearDrops(dt);updateFx(dt);PS.update(dt);
  }};
 });
 const first=await p.evaluate(()=>{const {f,v}=lanzaSetup();useSkill(f,1);lanzaTick(38);const d=f.spearLost;return {hp:v.hp,alive:v.alive,drop:!!d,projectiles:PROJ.length,heldVisible:f.spear.visible,jet:!!d?.jet,body:!!d?.body,id:d?.id,parts:['torso','head','armL','armR','legL','legR'].filter(k=>!!d?.body[k]).length};});
 assert.equal(first.hp,0);assert.equal(first.alive,false);assert.ok(first.drop&&first.jet&&first.body);assert.equal(first.projectiles,0);assert.equal(first.heldVisible,false);assert.equal(first.parts,6);
 await p.evaluate(()=>{lanzaTick(20);camera.position.set(-41.5,2.7,75.5);camera.lookAt(-41.5,.8,82);camera.updateMatrixWorld();renderView(scene,camera);});await p.screenshot({path:path.join(out,'impacto.png')});
 const blockedSkills=await p.evaluate(()=>{const f=G.player;endAction(f);f.cd.fill(0);const before=PROJ.length;for(let i=0;i<4;i++)useSkill(f,i);f.ult=100;useUlt(f);setSpear(f,true);drawSpear(f);doM1(f,false);return {noExtra:PROJ.length===before,cd:f.cd,awak:f.awak,unarmed:!!f.action?.unarmed,visible:f.spear.visible,out:f.spearOut,farPickup:recoverJaviSpear(f)};});
 assert.ok(blockedSkills.noExtra&&blockedSkills.unarmed);assert.deepEqual(blockedSkills.cd,[0,0,0,0]);assert.equal(blockedSkills.awak,0);assert.equal(blockedSkills.visible,false);assert.equal(blockedSkills.out,false);assert.equal(blockedSkills.farPickup,false);
 const respawned=await p.evaluate(()=>{endAction(G.player);lanzaTick(270);const d=G.player.spearLost,v=G.fighters[1],point=spearDropPoint(d).clone();const before=point.clone();v.pos.set(80,0,-70);animate(v,1/60);updateSpearDrops(0);return {alive:v.alive,drop:!!d,distance:before.distanceTo(spearDropPoint(d)),held:G.player.spear.visible,jet:!!d.jet,point:point.toArray(),differentTexture:d.body.tex!==v.model.tex};});
 assert.ok(respawned.alive&&respawned.drop&&respawned.differentTexture);assert.equal(respawned.distance,0);assert.equal(respawned.held,false);assert.equal(respawned.jet,false);
 await p.evaluate(()=>renderView(scene,camera));await p.screenshot({path:path.join(out,'recuperar.png')});
 const pickup=await p.evaluate(()=>{const f=G.player,d=f.spearLost,id=d.id,pt=spearDropPoint(d);f.pos.set(pt.x,0,pt.z);f.vel.set(0,0,0);updateSpearDrops(0);return {missing:!!f.spearLost,visible:f.spear.visible,out:f.spearOut,thrown:f.spearThrown,count:JAVI_SPEARS.drops.size,settled:JAVI_SPEARS.settled.has(id),receipt:!!createSpearDrop(d.data),hud:$('spear-recovery').classList.contains('hidden')};});
 assert.deepEqual(pickup,{missing:false,visible:true,out:true,thrown:false,count:0,settled:true,receipt:false,hud:true});
 const defenses=[];
 for(const mode of ['healthy','invulnerable','blocking','counter','awakened','miss']){
  const r=await p.evaluate(mode=>{const {f,v}=lanzaSetup(mode==='healthy'?100:8);if(mode==='invulnerable')v.iframes=10;if(mode==='blocking')v.blocking=true;if(mode==='counter')v.action={name:'test-counter',dur:10,t:0,counter:true,steps:[]};if(mode==='awakened')f.awak=10;if(mode==='miss')v.pos.z+=15;
   // Spawn the actual normal projectile directly so a defensive action remains active.
   f.spearThrown=true;f.spear.visible=false;spawnSpearProj(f,{dmg:8,color:f.ch.color});
   for(let i=0;i<260;i++){G.time+=1/120;updateProj(1/120);updateSpearDrops(1/120);}
   return {mode,hp:v.hp,missing:!!f.spearLost,projectiles:PROJ.length,visible:f.spear.visible};
  },mode);defenses.push(r);assert.equal(r.missing,false,mode);assert.equal(r.projectiles,0,mode);assert.equal(r.visible,true,mode);if(mode==='healthy')assert.equal(r.hp,92);if(mode==='invulnerable'||mode==='miss')assert.equal(r.hp,8);
 }
 const floor=await p.evaluate(()=>{const {f}=lanzaSetup();useSkill(f,1);lanzaTick(50);const d=f.spearLost;if(!d)return {error:'no-drop',hp:G.fighters[1].hp,skill:skillsOf(f)[1],pos:PROJ.map(p=>p.pos.toArray()),yaw:f.yaw,cd:f.cd,action:f.action?.name};G.fighters[1].pos.set(80,0,-70);G.fighters[1].alive=true;d.age=15.1;updateSpearDrops(0);const id=d.id;const result={bodyRemoved:!d.body,weaponRemains:!!d.mesh.parent,missing:!!f.spearLost,age:d.age};f.reset();result.resetRestores=!f.spearLost&&f.spear.visible&&!f.spearThrown;result.removed=!JAVI_SPEARS.drops.has(id);return result;});
 assert.ok(floor.bodyRemoved&&floor.weaponRemains&&floor.missing&&floor.resetRestores&&floor.removed);
 const report={ok:true,first,blockedSkills,respawned,pickup,defenses,floor,errors};fs.writeFileSync(path.join(out,'solo.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert.deepEqual(errors,[]);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
