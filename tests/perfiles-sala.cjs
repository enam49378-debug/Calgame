const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),html=process.env.BLOCKSTRIKE_TEST_HTML,server=process.env.BLOCKSTRIKE_TEST_SERVER||path.join(root,'server/server.js'),port=18967,out=process.env.BLOCKSTRIKE_TEST_OUT||path.join(root,'tests/artifacts/perfiles-sala');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[server],{env:{...process.env,PORT:String(port),BLOCKSTRIKE_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false,browser;srv.stdout.on('data',d=>{if(String(d).includes('localhost:'))ready=true;});srv.stderr.on('data',d=>process.stderr.write(d));
const wait=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,ms=20000){const at=Date.now();while(Date.now()-at<ms){if(await fn())return;await wait(40);}throw Error('Timed out');}
(async()=>{
 await until(()=>ready); browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio']}); const errors=[],pages=[];
 async function create(name,char){
  const p=await browser.newPage({viewport:{width:1100,height:760}});pages.push(p);await p.context().grantPermissions(['local-network-access']);p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
  if(html)await p.route(`http://127.0.0.1:${port}/`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(html,'utf8')}));
  if(process.env.BLOCKSTRIKE_TEST_DEPS)for(const[url,file]of Object.entries(JSON.parse(fs.readFileSync(process.env.BLOCKSTRIKE_TEST_DEPS,'utf8'))))await p.route(url,r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(file)}));
  await p.route('https://lh3.googleusercontent.com/**',async r=>r.fulfill({contentType:'image/png',body:fs.readFileSync(path.join(root,'assets/calfight_icon.png'))}));
  const consoleErrors=[];p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForFunction(()=>typeof __ev==='function'&&__ev('CITY.modelsReady && !!CHARS.javi.skinCanvas'),null,{polling:50,timeout:30000}).catch(async e=>{console.log('BOOT ERRORS',errors,consoleErrors);throw e;});
  // La puerta de pruebas ya existente solo se habilita en localhost; se conserva la protección de la versión pública.
  const evaluate=p.evaluate.bind(p);p.evaluate=(fn,arg)=>evaluate(({source,arg})=>window.__ev('('+source+')('+JSON.stringify(arg)+')'),{source:fn.toString(),arg});
  await p.evaluate(({name,char})=>{
   ST.on=false;stageExit();clearFighters();G.state='play';G.mp=true;G.paused=false;G.over=false;G.viewer=false;G.cine=null;G.panelOpen=false;G.charId=char;G.goal=1000;
   const f=G.player=new Fighter({name,char,isPlayer:true});G.fighters.push(f);f.pos.set(0,0,0);f.iframes=0;buildSkillBar(f);
   $('pname-in').value=name;$('hud').classList.remove('hidden');$('menu').classList.add('hidden');$('pause').classList.add('hidden');$('title').classList.add('hidden');
   ACCT.user={uid:'private-uid-'+name,email:'private@example.com',displayName:name,photoURL:'https://lh3.googleusercontent.com/a/test-'+name,emailVerified:true};
   ST.d.c={javi:[4,1,3,2,20]};ST.d.dy={1:[0,0,90]};
  },{name,char});console.log('Ready:',name);return p;
 }
 const a=await create('JaviFan','javi'),b=await create('Amiga','sekza');
 await a.evaluate(()=>bannerSet({k:'pre:aurora'}));
 await b.evaluate(()=>{const c=document.createElement('canvas');c.width=1000;c.height=286;const g=c.getContext('2d');g.fillStyle='#ec4597';g.fillRect(0,0,1000,286);g.fillStyle='#26264a';g.font='bold 100px sans-serif';g.fillText('AMIGA',420,190);bannerSet({k:'img',d:c.toDataURL('image/jpeg',.9)});});
 for(const p of [a,b])await p.evaluate(async()=>{NET.room='relay';NET.local=true;NET.code='bs-codex-perfiles';NET.named=await localRoom('codex-perfiles');NET.myPeer=NET.named.myId;NET.joinT=Date.now();await netShareProfile();netSendPlay();});
 const pump=async()=>{for(const p of pages)await p.evaluate(()=>{G.time+=.04;netTick(.04);});};
 await until(async()=>{await pump();return await a.evaluate(()=>NET.proxies.size===1&&NET.named.profiles.size===2)&&await b.evaluate(()=>NET.proxies.size===1&&NET.named.profiles.size===2);});
 const wire=await a.evaluate(()=>{const pr=[...NET.named.profiles.values()].find(p=>p.n==='Amiga');return{profile:pr,bytes:JSON.stringify(pr).length,presence:JSON.stringify(NET.named.my)};});
 assert.equal(wire.profile.b.k,'img');assert.ok(wire.profile.b.d.startsWith('data:image/jpeg;base64,'));assert.ok(wire.bytes<48000);assert.ok(!wire.presence.includes('data:image'));assert.ok(!JSON.stringify(wire.profile).includes('private'));assert.equal(wire.profile.g,4);assert.equal(wire.profile.m,90);assert.equal(wire.profile.f,'javi');
 await a.keyboard.press('Tab');await assert.doesNotReject(()=>a.locator('#board').waitFor({state:'visible'}));assert.equal(await a.evaluate(()=>ROOM_UI.open&&!G.paused),true);
 const remote=await a.evaluate(()=>[...NET.proxies.keys()][0]);
 const remoteButton=a.locator('#board .room-player').filter({hasText:'Amiga'});await remoteButton.waitFor();
 assert.equal(await remoteButton.locator('img').getAttribute('src'),'https://lh3.googleusercontent.com/a/test-Amiga');
 await a.evaluate(()=>{window.savedButton=[...$('board').querySelectorAll('.room-player')].find(b=>b.querySelector('b').textContent==='Amiga');for(let i=0;i<20;i++)refreshRoomBoard();});assert.equal(await a.evaluate(()=>savedButton.isConnected),true);
 await remoteButton.click();await a.locator('#playerdlg').waitFor({state:'visible'});assert.equal(await a.locator('#public-name').textContent(),'Amiga');assert.ok((await a.locator('.public-career').textContent()).includes('4 partidas'));
 await a.keyboard.press('KeyW');await a.keyboard.press('Digit1');const input=await a.evaluate(()=>({ctl:playerCtl(),paused:G.paused,hasKey:keys.KeyW,profile:ROOM_UI.profile}));assert.equal(input.ctl.mx,0);assert.equal(input.ctl.skill,-1);assert.equal(input.hasKey,false);assert.equal(input.paused,false);assert.equal(input.profile,remote);
 await a.keyboard.press('Tab');assert.equal(await a.evaluate(()=>$('playerdlg').contains(document.activeElement)),true);
 // Imágenes realmente cargadas y captura del perfil público.
 await a.waitForFunction(()=>[...document.querySelectorAll('#playerdlg img')].every(i=>i.complete&&i.naturalWidth>0),null,{polling:50});await a.screenshot({path:path.join(out,'perfil.png')});
 await a.keyboard.press('Escape');assert.equal(await a.evaluate(()=>ROOM_UI.profile),null);assert.equal(await a.evaluate(()=>document.activeElement===savedButton),true);assert.equal(await a.evaluate(()=>ROOM_UI.open),true);
 await a.screenshot({path:path.join(out,'tabla.png')});
 await a.keyboard.press('Escape');assert.equal(await a.evaluate(()=>ROOM_UI.open),false);
 // Cambio de banner durante la partida, sin reingresar ni duplicar la imagen en estados.
 await b.evaluate(()=>bannerSet({k:'char:sekza'}));await until(async()=>await a.evaluate(()=>[...NET.named.profiles.values()].some(p=>p.n==='Amiga'&&p.b.k==='char:sekza')));
 await a.evaluate(()=>{G.fighters.find(f=>f.remote).kills=3;setRoomBoard(true);});assert.equal(await a.locator('#board tbody tr').first().locator('.room-player b').textContent(),'Amiga');
 // Tercero entra desde el menú y recibe los perfiles conservados por el servidor.
 const c=await create('Visitante','javi');await c.evaluate(async()=>{clearFighters();G.state='menu';NET.room='relay';NET.local=true;NET.code='bs-codex-perfiles';NET.named=await localRoom('codex-perfiles');NET.myPeer=NET.named.myId;netMenuPresence();await netShareProfile();});
 await until(async()=>await c.evaluate(()=>NET.named.profiles.size===3)&&await a.evaluate(()=>NET.named.profiles.size===3));
 await a.evaluate(()=>refreshRoomBoard());assert.equal(await a.locator('#board .room-player').count(),3);await a.locator('#board .room-player').filter({hasText:'Visitante'}).click();assert.ok((await a.locator('.public-badges').textContent()).includes('En el menú'));await a.keyboard.press('Escape');
 await c.evaluate(()=>NET.named.leave());await until(async()=>await a.evaluate(()=>!NET.named.peers().some(p=>p.presence.nm==='Visitante')));await a.evaluate(()=>refreshRoomBoard());assert.equal(await a.locator('#board .room-player').count(),2);
 // Contenido extraño no llega a HTML ni ejecuta URLs o SVG; los campos privados se descartan.
 const validation=await a.evaluate(()=>{
  const p=cleanPublicProfile({v:1,n:'<img onerror=alert(1)>',a:'javascript:alert(1)',b:{k:'img',d:'data:image/svg+xml;base64,PHN2Zz4='},g:Infinity,m:-1,f:'<svg>',email:'secret'});
  const many=cleanPublicProfile({v:1,n:'x',b:{k:'img',d:'data:image/jpeg;base64,'+'A'.repeat(PROFILE_IMAGE_MAX+1)}});
  return{p,many,serialized:JSON.stringify(p),bad:cleanPublicProfile({v:7})};
 });assert.equal(validation.p.a,'');assert.equal(validation.p.b.k,'pre:sunset');assert.equal(validation.many.b.k,'pre:sunset');assert.equal(validation.p.g,0);assert.equal(validation.p.m,0);assert.equal(validation.bad,null);assert.ok(!validation.serialized.includes('secret'));assert.ok(!validation.p.n.includes('<'));
 // Invitados, bots distintos, regreso al menú y tamaño pequeño.
 await a.evaluate(()=>{setRoomBoard(false,false);G.mp=false;ACCT.user=null;const one=new Fighter({name:'Bot Uno',char:'javi'}),two=new Fighter({name:'Bot Dos',char:'sekza'});G.fighters.push(one,two);setRoomBoard(true);});
 const keys=await a.evaluate(()=>roomEntries().map(e=>e.key));assert.equal(new Set(keys).size,keys.length);assert.ok(await a.locator('#board .room-player').filter({hasText:'INVITADO'}).count());await a.locator('#board .room-player').filter({hasText:'Bot Dos'}).click();assert.ok((await a.locator('.public-badges').textContent()).includes('Bot de entrenamiento'));await a.keyboard.press('Escape');
 await a.setViewportSize({width:390,height:740});await a.screenshot({path:path.join(out,'tabla-movil.png')});const fit=await a.locator('#board').evaluate(el=>({w:el.scrollWidth,client:el.clientWidth,right:el.getBoundingClientRect().right}));assert.ok(fit.w<=fit.client+1,JSON.stringify(fit));assert.ok(fit.right<=390);
 await a.evaluate(()=>toMenu());assert.equal(await a.evaluate(()=>!roomInputBlocked()&&$('board').classList.contains('hidden')&&$('playerdlg').classList.contains('hidden')),true);
 // Transporte de la web pública: relays simulados para probar retención, reconexión y salida sin tocar salas reales.
 const relay=await a.evaluate(async()=>{
  const native=window.mqtt,clients=[],retained=new Map(),published=[];
  window.mqtt={connect:()=>{
   const handlers={},c={connected:true,subscribed:false,on(event,fn){(handlers[event]||(handlers[event]=[])).push(fn);return c;},emit(event,...args){for(const fn of handlers[event]||[])fn(...args);},
    subscribe(topic,options,callback){c.subscribed=true;callback();for(const[t,d]of retained)c.emit('message',t,{toString:()=>d});},
    publish(topic,data,options={}){published.push({topic,data});if(options.retain){if(data)retained.set(topic,data);else retained.delete(topic);}for(const x of clients)if(x.connected&&x.subscribed)x.emit('message',topic,{toString:()=>data});},
    end(){c.connected=false;}};clients.push(c);setTimeout(()=>c.emit('connect'),0);return c;
  }};
  let r1,r2;try{
   r1=await relayRoom('codex-fake-profile');r1.setProfile({v:1,n:'RelayUno',b:{k:'pre:ice'},acct:true});
   r2=await relayRoom('codex-fake-profile');await new Promise(r=>setTimeout(r,30));
   const late=r2.profiles.get(r1.myId)?.n==='RelayUno';
   r1.setProfile({v:1,n:'RelayCambio',b:{k:'char:javi'},acct:true});const live=r2.profiles.get(r1.myId)?.n==='RelayCambio';
   r1.presence({st:'menu',nm:'RelayCambio',ch:'javi'});
   const separate=published.filter(p=>p.topic.includes('/p/')).every(p=>!p.data.includes('data:image')&&!p.data.includes('"b":'));
   await r1.leave();const removed=!r2.profiles.has(r1.myId)&&![...retained.keys()].some(k=>k.endsWith('/pf/'+r1.myId));
   return{late,live,separate,removed};
  }finally{if(r1&&!r1.closed)await r1.leave();if(r2)await r2.leave();window.mqtt=native;}
 });assert.ok(relay.late&&relay.live&&relay.separate&&relay.removed,JSON.stringify(relay));
 assert.deepEqual(errors,[]);const report={ok:true,players:3,customBannerBytes:wire.bytes,privateFieldsShared:false,keyboard:true,lateJoin:true,liveUpdate:true,bots:true,mobile:fit,relay,errors};fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
