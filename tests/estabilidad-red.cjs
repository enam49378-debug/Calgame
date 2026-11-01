const{chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),candidate=process.env.BLOCKSTRIKE_TEST_HTML||'',port=18952,out=process.env.BLOCKSTRIKE_TEST_OUT||path.join(root,'tests/artifacts/estabilidad');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port),BLOCKSTRIKE_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';srv.stdout.on('data',d=>log+=d);srv.stderr.on('data',d=>log+=d);let browser;
const wait=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,timeout=25000){const at=Date.now();while(Date.now()-at<timeout){if(await fn())return;await wait(15);}throw Error('Timeout '+log);}
(async()=>{
 await until(()=>log.includes('localhost:'));browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[],pages=[];
 for(let i=0;i<2;i++){
  const p=await browser.newPage({viewport:{width:900,height:650}});await p.context().grantPermissions(['local-network-access']);p.on('pageerror',e=>errors.push(e.stack));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
  const url=`http://127.0.0.1:${port}/?rtc=off`;if(candidate)await p.route(url,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(candidate,'utf8')}));
  await p.goto(url,{waitUntil:'load'});await p.waitForFunction(()=>CITY.modelsReady&&CHARS.sebolla.skinCanvas);
  await p.evaluate(async i=>{
   clearFighters();G.state='play';G.mp=true;G.viewer=false;G.cine=null;G.over=false;G.paused=false;G.panelOpen=false;G.charId=i?'javi':'sebolla';NET.room='relay';NET.local=true;NET.named=await localRoom('codex-estabilidad');NET.myPeer=NET.named.myId;NET.joinT=1000+i;G.rules={...RULES_DEF,p:{...RULES_DEF.p}};
   const f=new Fighter({name:i?'Rival':'Seb0lla',char:G.charId,isPlayer:true});G.player=f;G.fighters.push(f);f.pos.set(i?-43.2:-45,0,82);f.yaw=cam.yaw=i?-Math.PI/2:Math.PI/2;f.prevYaw=f.yaw;f.iframes=0;f.maxHp=f.hp=2000;f.flourT=999;buildSkillBar(f);GFX.post=false;renderer.shadowMap.enabled=false;renderer.setPixelRatio(.4);netSendPlay();window.networkSawImpact=false;
  },i);pages.push(p);
 }
 const[a,b]=pages,pump=async(n=1)=>{for(let i=0;i<n;i++)await Promise.all(pages.map(p=>p.evaluate(()=>{step(1/60);netTick(1/60);networkSawImpact ||= IMPACT.t>0;IMPACT.t-=1/60;IMPACT.cd-=1/60;G.hitstop=0;G.slowT=0;netSendPlay();})));};
 await until(async()=>{await pump();return await a.evaluate(()=>NET.proxies.size===1)&&await b.evaluate(()=>NET.proxies.size===1);});
 const stationary=[];
 for(const slot of [1,2,3]){
  await b.evaluate(()=>{const f=G.player;f.reset();f.hp=2000;f.iframes=0;f.pos.set(-43.2,0,82);f.flourT=999;netSendPlay();});
  await a.evaluate(()=>{const f=G.player;endAction(f);f.cd.fill(0);f.vel.set(0,0,0);f.pos.set(-45,0,82);netSendPlay();});await pump(10);
  await a.evaluate(slot=>{const f=G.player;f.vel.set(9,0,-3);useSkill(f,slot);},slot);await pump(135);
  const state=await a.evaluate(()=>({x:G.player.pos.x,z:G.player.pos.z,speed:Math.hypot(G.player.vel.x,G.player.vel.z),busy:!!G.player.action}));stationary.push({slot,...state});assert.ok(Math.abs(state.x+45)<.001&&Math.abs(state.z-82)<.001);assert.equal(state.speed,0);assert.equal(state.busy,false);
  const remote=await b.evaluate(()=>{const f=[...NET.proxies.values()][0];return{x:f.net.x,z:f.net.z};});assert.ok(Math.abs(remote.x-state.x)<.02&&Math.abs(remote.z-state.z)<.02);
 }
 await a.evaluate(()=>{G.player.cd.fill(0);G.player.vel.set(0,0,0);G.player.pos.set(-45,0,82);netSendPlay();});await b.evaluate(()=>{G.player.reset();G.player.iframes=0;G.player.hp=2000;G.player.pos.set(-37,0,82);G.player.flourT=999;netSendPlay();});await until(async()=>{await pump();return await a.evaluate(()=>Math.abs([...NET.proxies.values()][0].pos.x+37)<.05);});
 await a.evaluate(()=>useSkill(G.player,0));await pump(150);
 const final=await Promise.all(pages.map(p=>p.evaluate(()=>{camera.position.set(-42,3,75);camera.lookAt(-40,1,82);renderMain();return{hp:G.player.hp,speed:Math.hypot(G.player.vel.x,G.player.vel.z),busy:!!G.player.action,x:G.player.pos.x,sawImpact:networkSawImpact,override:scene.overrideMaterial===null};})));
 assert.ok(final[0].x>-43&&final[0].speed===0&&!final[0].busy);assert.ok(final[1].hp<2000);assert.ok(final.every(x=>x.override));assert.ok(final.some(x=>x.sawImpact));assert.deepEqual(errors,[]);
 const report={ok:true,stationary,final,errors};fs.writeFileSync(path.join(out,'multijugador.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
