const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),port=18990,html=process.env.MOBILE_HTML||path.join(root,'index.html'),deps=process.env.CF_TEST_DEPS?JSON.parse(fs.readFileSync(process.env.CF_TEST_DEPS)):{};const out=process.env.CF_OUT||path.join(root,'tests/artifacts/tactil');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[root+'/server/server.js'],{env:{...process.env,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false,browser;srv.stdout.on('data',d=>{if(String(d).includes('localhost:'))ready=true;});const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{for(let i=0;i<400&&!ready;i++)await wait(30);assert.ok(ready);browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});const errors=[];
async function page(touch){const c=await browser.newContext({viewport:{width:touch?844:1000,height:touch?390:700},hasTouch:touch,isMobile:touch});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});await p.route(`http://127.0.0.1:${port}/`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(html)}));for(const[u,f]of Object.entries(deps))await p.route(u,r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(f)}));await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForFunction(()=>typeof __ev==='function'&&__ev('CITY.modelsReady&&!!CHARS.javi.skinCanvas'),null,{polling:50,timeout:40000});return p;}
const p=await page(true),ev=(pg,fn,arg)=>pg.evaluate(({src,arg})=>__ev('('+src+')('+JSON.stringify(arg)+')'),{src:fn.toString(),arg});
await ev(p,()=>{stageExit();clearFighters();G.state='play';G.mp=false;G.paused=false;G.over=false;G.panelOpen=false;G.viewer=false;G.player=new Fighter({name:'Prueba',char:'sekza',isPlayer:true});G.fighters.push(G.player);buildSkillBar(G.player);$('title').classList.add('hidden');$('menu').classList.add('hidden');$('hud').classList.remove('hidden');touchUpdate();});

const cdp=await p.context().newCDPSession(p);
const info=await p.evaluate(()=>{const points=[];for(let y=70;y<innerHeight-90;y+=40)for(let x=180;x<innerWidth-220;x+=40){let e=document.elementFromPoint(x,y);points.push({x,y,target:e.id||e.tagName,cls:e.className});}return points;});
console.log('HIT TARGETS',JSON.stringify(info.slice(0,5)));
const target=info.find(q=>!['touch-joystick','skills'].includes(q.target));assert.ok(target);
const old=await ev(p,()=>({yaw:cam.yaw,pitch:cam.pitch}));
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:target.x,y:target.y,id:1}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:target.x+65,y:target.y+20,id:1}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
const moved=await ev(p,()=>({yaw:cam.yaw,pitch:cam.pitch,look:TOUCH.lookId,scrollX,scrollY}));console.log('REAL TOUCH',old,moved);assert.notEqual(moved.yaw,old.yaw);assert.equal(moved.look,null);assert.equal(moved.scrollY,0);
await ev(p,()=>{setPause(true);touchUpdate();});
assert.equal(await p.locator('#pause-fullscreen').isVisible(),true);
await p.evaluate(()=>{window._fullCalls=0;document.documentElement.requestFullscreen=()=>{window._fullCalls++;return Promise.resolve()}});
await p.locator('#pause-fullscreen').tap();assert.equal(await p.evaluate(()=>window._fullCalls),1);
for(const size of [{width:320,height:568},{width:390,height:844},{width:640,height:360},{width:844,height:390}]){
 await p.setViewportSize(size);
 const pause=await p.locator('#pause .obox').boundingBox();assert.ok(pause&&pause.x>=-1&&pause.y>=-1&&pause.x+pause.width<=size.width+1&&pause.y+pause.height<=size.height+1,JSON.stringify({size,pause}));
 await ev(p,()=>{setPause(false);G.state='menu';$('hud').classList.add('hidden');$('menu').classList.remove('hidden');$('menu').dataset.tab='sel';touchUpdate();});
 const menu=await p.evaluate(()=>{const m=document.querySelector('#menu'),b=document.querySelector('#play'),r=b.getBoundingClientRect();return {grid:getComputedStyle(m).gridTemplateColumns,children:[...m.children].map(e=>({id:e.id,rect:{x:e.getBoundingClientRect().x,w:e.getBoundingClientRect().width},grid:getComputedStyle(e).gridColumn,display:getComputedStyle(e).display})),scrollWidth:m.scrollWidth,clientWidth:m.clientWidth,overflow:getComputedStyle(m).overflowY,play:{x:r.x,y:r.y,w:r.width,h:r.height},display:getComputedStyle(b).display};});
 console.log('MENU',JSON.stringify({size,menu}));if(menu.scrollWidth>menu.clientWidth+2)console.log('OVERFLOW',await p.evaluate(()=>[...document.querySelector('#menu').querySelectorAll('*')].map(e=>({id:e.id,cl:e.className,tag:e.tagName,x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right,w:e.getBoundingClientRect().width})).filter(e=>e.right>innerWidth+1).slice(0,20)));assert.ok(menu.scrollWidth<=menu.clientWidth+2);assert.notEqual(menu.display,'none');assert.ok(menu.play.w>0&&menu.play.h>0);
 await p.locator('#play').scrollIntoViewIfNeeded();const b=await p.locator('#play').boundingBox();assert.ok(b.x>=-1&&b.x+b.width<=size.width+1&&b.y>=-1&&b.y+b.height<=size.height+1,JSON.stringify({size,b}));
 await ev(p,()=>{G.state='play';$('menu').classList.add('hidden');$('hud').classList.remove('hidden');setPause(true);touchUpdate();});
}
assert.deepEqual(errors,[]);console.log('Real touch and mobile layouts OK');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});

