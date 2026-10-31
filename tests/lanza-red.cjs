const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),candidate=process.env.BLOCKSTRIKE_TEST_HTML||'',port=18947,out=process.env.BLOCKSTRIKE_TEST_OUT||path.join(root,'tests/artifacts/lanza');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port),BLOCKSTRIKE_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';srv.stdout.on('data',d=>log+=d);srv.stderr.on('data',d=>log+=d);let browser;
const wait=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,timeout=20000){const at=Date.now();while(Date.now()-at<timeout){const v=await fn();if(v)return v;await wait(15);}throw Error('Timeout '+log);}
(async()=>{
 await until(()=>log.includes('localhost:'));browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[],pages=[];
 const connect=async i=>{
  const p=await browser.newPage({viewport:{width:900,height:650}});await p.context().grantPermissions(['local-network-access']);p.on('pageerror',e=>errors.push(e.stack));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
  if(candidate)await p.route(`http://127.0.0.1:${port}/?rtc=off`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(candidate,'utf8')}));
  await p.goto(`http://127.0.0.1:${port}/?rtc=off`,{waitUntil:'load'});await p.waitForFunction(()=>CHARS.javi.skinCanvas&&CITY.modelsReady);
  await p.evaluate(async i=>{clearFighters();G.state='play';G.mp=true;G.paused=false;G.over=false;G.panelOpen=false;G.viewer=false;G.charId=i===1?'sekza':'javi';NET.room='relay';NET.local=true;NET.named=await localRoom('codex-lanza-finisher');NET.myPeer=NET.named.myId;NET.joinT=1000+i;
   const f=new Fighter({name:['Javi','Rival','Testigo'][i],char:G.charId,isPlayer:true});G.player=f;G.fighters.push(f);f.pos.set(i===0?-45:i===1?-39:-60,0,82);f.yaw=i===0?Math.PI/2:-Math.PI/2;cam.yaw=f.yaw;f.iframes=0;f.hp=i===1?8:f.maxHp;buildSkillBar(f);netSendPlay();
  },i);pages.push(p);return p;
 };
 const a=await connect(0),b=await connect(1);
 const pump=async(n=1)=>{for(let k=0;k<n;k++)await Promise.all(pages.map(p=>p.evaluate(()=>{const dt=1/60;G.time+=dt;netTick(dt);const f=G.player;updateAction(f,dt);physics(f,dt);tickTimers(f,dt);animate(f,dt);updateProj(dt);updateSpearDrops(dt);updateFx(dt);PS.update(dt);netSendPlay();})));};
 await until(async()=>{await pump();return await a.evaluate(()=>NET.proxies.size===1)&&await b.evaluate(()=>NET.proxies.size===1);});
 await a.evaluate(()=>useSkill(G.player,1));
 await until(async()=>{await pump();return await a.evaluate(()=>!!G.player.spearLost)&&await b.evaluate(()=>!G.player.alive);});
 const impact=await Promise.all(pages.map(p=>p.evaluate(()=>({ids:[...JAVI_SPEARS.drops.keys()],hp:G.player.hp,deaths:G.player.deaths,held:G.player.spear?.visible,projectiles:PROJ.filter(p=>p.loyal).length,receipts:(G.player.spearReceipts||[]).length}))));
 assert.equal(impact[1].hp,0);assert.equal(impact[1].deaths,1);assert.equal(impact[0].held,false);assert.equal(impact[0].projectiles,0);assert.equal(impact[0].ids[0],impact[1].ids[0]);
 await pump(265);assert.ok(await b.evaluate(()=>G.player.alive));assert.ok(await a.evaluate(()=>!!G.player.spearLost));
 const c=await connect(2);await until(async()=>{await pump();return await c.evaluate(()=>JAVI_SPEARS.drops.size===1);});
 const late=await c.evaluate(()=>{const d=[...JAVI_SPEARS.drops.values()][0];return {id:d.id,body:!!d.body,owner:d.owner.name,held:d.owner.spear.visible,point:spearDropPoint(d).toArray()};});assert.equal(late.id,impact[0].ids[0]);assert.ok(late.body&&!late.held);await pump(3);const ownerPoint=await a.evaluate(()=>spearDropPoint(G.player.spearLost).toArray());const guestPoint=await c.evaluate(()=>spearDropPoint([...JAVI_SPEARS.drops.values()][0]).toArray());assert.ok(Math.hypot(...ownerPoint.map((v,i)=>v-guestPoint[i]))<.03,'Late joiner receives the frozen corpse pose');
 const before=await a.evaluate(()=>spearDropPoint(G.player.spearLost).toArray());
 await b.evaluate(()=>{G.player.pos.set(80,0,-70);netSendPlay();});await pump(12);
 const displacement=await a.evaluate(point=>new V3(...point).distanceTo(spearDropPoint(G.player.spearLost)),before);assert.ok(displacement<.15,'Corpse stays at the kill location after respawn');
 await a.evaluate(()=>{const f=G.player,point=spearDropPoint(f.spearLost);endAction(f);f.pos.set(point.x,0,point.z);f.vel.set(0,0,0);recoverJaviSpear(f);netSendPlay();});
 await until(async()=>{await pump();return (await Promise.all(pages.map(p=>p.evaluate(()=>JAVI_SPEARS.drops.size===0)))).every(Boolean);});
 await pump(20);const recovered=await Promise.all(pages.map(p=>p.evaluate(()=>({drops:JAVI_SPEARS.drops.size,ownerHeld:G.player.ch===CHARS.javi&&G.player.name==='Javi'?G.player.spear.visible:[...NET.proxies.values()].find(f=>f.name==='Javi')?.spear.visible,deaths:G.player.deaths}))));assert.ok(recovered.every(s=>s.drops===0&&s.ownerHeld));assert.equal(recovered[1].deaths,1);
 // A protected low-health victim cannot confirm a finisher. Its owner decides actual damage.
 await b.evaluate(()=>{G.player.pos.set(-39,0,82);G.player.hp=8;G.player.iframes=30;netSendPlay();});
 await a.evaluate(()=>{G.player.pos.set(-45,0,82);G.player.yaw=cam.yaw=Math.PI/2;G.player.cd.fill(0);netSendPlay();});await pump(15);
 await a.evaluate(()=>useSkill(G.player,1));await pump(170);
 const protectedHit=await Promise.all(pages.slice(0,2).map(p=>p.evaluate(()=>({hp:G.player.hp,missing:!!G.player.spearLost,drops:JAVI_SPEARS.drops.size,held:G.player.spear?.visible}))));assert.equal(protectedHit[1].hp,8);assert.equal(protectedHit[0].missing,false);assert.equal(protectedHit[0].held,true);assert.ok(protectedHit.every(s=>s.drops===0));
 assert.deepEqual(errors,[]);const report={ok:true,impact,late,corpseDisplacement:displacement,recovered,protectedHit,duplicateDamage:false,errors};fs.writeFileSync(path.join(out,'network.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e,log);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
