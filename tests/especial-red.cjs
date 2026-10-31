const{chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),port=18943,out=path.join(root,'tests/artifacts/sekza-r');
fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';srv.stdout.on('data',x=>log+=x);srv.stderr.on('data',x=>log+=x);
const wait=ms=>new Promise(r=>setTimeout(r,ms));let browser;
async function until(fn,timeout=20000){const start=Date.now();while(Date.now()-start<timeout){const v=await fn();if(v)return v;await wait(30);}throw Error('Timeout: '+log);}
(async()=>{
 await until(()=>log.includes('localhost:'));browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[];
 const pages=[];for(const i of [0,1]){
  const p=await browser.newPage({viewport:{width:900,height:650}});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
  await p.goto(`http://127.0.0.1:${port}/?rtc=off&q=3`,{waitUntil:'load'});await p.waitForFunction(()=>CHARS.sekza.skinCanvas&&CITY.modelsReady);
  await p.evaluate(async i=>{clearFighters();G.state='play';G.mp=true;G.paused=false;G.over=false;G.panelOpen=false;G.charId=i?'javi':'sekza';
   NET.room='relay';NET.local=true;NET.named=await localRoom('codex-r-special');NET.myPeer=NET.named.myId;NET.joinT=1000+i;
   const f=new Fighter({name:i?'Rival':'Sekza',char:G.charId,isPlayer:true});G.player=f;G.fighters.push(f);f.pos.set(i?-15:-20,0,82);f.iframes=0;netSendPlay();},i);pages.push(p);
 }
 const [a,b]=pages;
 const pump=async(n=1)=>{for(let k=0;k<n;k++)await Promise.all(pages.map(p=>p.evaluate(()=>{const dt=.04;G.time+=dt;netTick(dt);updateCityWeather(dt);updateSekzaSpecials(dt);tickTimers(G.player,dt);animate(G.player,dt);netSendPlay();})));};
 await until(async()=>{await pump();return (await a.evaluate(()=>NET.proxies.size))===1&&(await b.evaluate(()=>NET.proxies.size))===1;});
 await a.evaluate(()=>{setCityTime(17.5);setCityWeather('fog');});
 await until(async()=>{await pump();return await b.evaluate(()=>WX.mode==='fog'&&Math.abs(WX.hour-17.5)<.01);});
 const rejected=await b.evaluate(()=>{const before=WX.mode;setCityWeather('clear');return WX.mode===before;});assert.ok(rejected);
 const shared=await Promise.all(pages.map(p=>p.evaluate(()=>({mode:WX.mode,hour:WX.hour,seed:WX_ROOM.state.seed}))));assert.equal(shared[0].mode,shared[1].mode);assert.equal(shared[0].seed,shared[1].seed);
 await a.evaluate(()=>startSekzaFlight(G.player));await pump(12);
 const flight=await b.evaluate(()=>{const px=[...NET.proxies.values()][0];return {character:px.ch.id,remaining:px.rFlightT,wings:px.model.wings.k};});assert.equal(flight.character,'sekza');assert.ok(flight.remaining>0&&flight.wings>0);
 await a.evaluate(()=>{stopSekzaFlight(G.player);G.player.rGullCD=0;summonSekzaGulls(G.player);});await pump(90);
 const health=await Promise.all(pages.map(p=>p.evaluate(()=>({hp:G.player.hp,max:G.player.maxHp,flocks:SEKZA_R.flocks.length}))));assert.equal(health[0].hp,health[0].max);assert.equal(health[1].max-health[1].hp,18);
 // Rayos compartidos, sin aviso de suelo: el evento nace ya resuelto.
 await a.evaluate(()=>{G.player.iframes=90;netSendPlay();setCityWeather('storm');});
 const strike=await until(async()=>{await pump();return await b.evaluate(()=>NET.named.environment?.strikes.find(e=>e.resolved&&e.victims.some(v=>v.id===NET.myPeer)));},25000);
 await pump(3);const strikes=await Promise.all(pages.map(p=>p.evaluate(id=>({event:WX_ROOM.state.strikes.find(e=>e.id===id),seen:WX_ROOM.seen.has(id)}),strike.id)));
 assert.equal(strikes[0].event.x,strikes[1].event.x);assert.equal(strikes[0].event.at,strikes[1].event.at);assert.ok(strikes.every(s=>s.seen));
 const once=await b.evaluate(()=>G.player.hp);await pump(4);assert.equal(await b.evaluate(()=>G.player.hp),once);
 const report={ok:true,shared,nonHostRejected:rejected,flight,health,sharedLightning:true,lightningDamage:health[1].hp-once,duplicateDamage:false,errors};fs.writeFileSync(path.join(out,'network.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
