const{chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),candidate=process.env.BLOCKSTRIKE_TEST_HTML||'',port=18956,out=process.env.BLOCKSTRIKE_TEST_OUT||path.join(root,'tests/artifacts/recuperacion');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port),BLOCKSTRIKE_ROOT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false;srv.stdout.on('data',d=>{if(String(d).includes('localhost:'))ready=true;});let browser;const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 for(let i=0;i<100&&!ready;i++)await wait(30);assert.ok(ready);
 browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required','--mute-audio']});const p=await browser.newPage({viewport:{width:900,height:650}}),errors=[];
 p.on('pageerror',e=>errors.push(e.stack));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
 if(candidate)await p.route(`http://127.0.0.1:${port}/`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(candidate,'utf8')}));
 await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'load'});await p.waitForFunction(()=>CITY.modelsReady&&CHARS.randi.skinCanvas);
 await p.evaluate(()=>{
  clearFighters();G.state='play';G.mp=false;G.paused=false;G.over=false;G.viewer=false;G.cine=null;G.panelOpen=false;G.goal=1000;G.auto=false;
  const f=new Fighter({name:'Randi',char:'randi',isPlayer:true}),v=new Fighter({name:'Rival',char:'javi'});G.player=f;G.fighters.push(f,v);f.pos.set(0,0,0);v.pos.set(3,0,0);v.dummy='idle';f.iframes=v.iframes=0;f.flourT=v.flourT=999;buildSkillBar(f);$('menu').classList.add('hidden');GFX.auto=false;GFX.post=false;
  window.savedRenderMain=renderMain;window.drawCount=0;renderMain=()=>{drawCount++;};window.testTick=(count=6)=>{const failures=[];for(let i=0;i<count;i++)try{loop(last+1000/60);}catch(e){failures.push(e.message);}return failures;};
 });
 // This fails on the old game: its expiry throws every frame before renderMain is reached.
 const group=await p.evaluate(()=>{const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial()));addFx(g,.02,()=>{});const at=G.time,draws=drawCount,errors=testTick();return{errors,draws:drawCount-draws,time:G.time-at,removed:!g.parent};});
 fs.writeFileSync(path.join(out,'grupo.json'),JSON.stringify(group,null,2));assert.deepEqual(group.errors,[]);assert.equal(group.draws,6);assert.ok(group.removed&&group.time>.09);
 const faults=await p.evaluate(()=>{
  const result=[];let good=0;
  for(const mode of ['cleanup','animation','timer','audio','action']){
   const start=drawCount,time=G.time;
   if(mode==='cleanup')addFx(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()),.001,()=>{},()=>{throw Error('TEST cleanup');});
   if(mode==='animation')addFx(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()),.5,(o,k)=>{if(k>0)throw Error('TEST animation');});
   if(mode==='timer'){later(0,()=>{throw Error('TEST timer');});later(0,()=>good++);}
   let music;if(mode==='audio'){music=updateMusic;updateMusic=()=>{throw Error('TEST audio');};}
   if(mode==='action')startAction(G.player,{name:'test-bad-action',noControl:true,speedMul:0,dur:50,tick:()=>{throw Error('TEST action');}});
   const errors=testTick();if(music)updateMusic=music;
   result.push({mode,draws:drawCount-start,time:G.time-time,errors,action:G.player.action?.name});
  }
  return{result,good,diagnostics:getBlockstrikeDiagnostics(),effects:FX.length};
 });assert.equal(faults.good,1);assert.ok(faults.result.every(r=>r.draws===6&&r.errors.length===0&&r.time>.09));assert.equal(faults.result.at(-1).action,undefined);assert.equal(faults.effects,0);
 const post=await p.evaluate(()=>{
  const native=composer.render,nativeRender=renderer.render,target=renderer.getRenderTarget(),auto=renderer.autoClear,color=renderer.getClearColor(new THREE.Color()).getHex(),alpha=renderer.getClearAlpha(),badTarget=new THREE.WebGLRenderTarget(8,8);let direct=0,onscreen=false;
  GFX.post=true;composer.render=()=>{renderer.setRenderTarget(badTarget);renderer.autoClear=false;renderer.setClearColor(0,0);throw Error('TEST postprocessing');};
  renderer.render=()=>{direct++;onscreen=renderer.getRenderTarget()===target;};
  try{renderView(scene,camera);}finally{composer.render=native;renderer.render=nativeRender;}
  const result={direct,onscreen,post:GFX.post,target:renderer.getRenderTarget()===target,auto:renderer.autoClear===auto,color:renderer.getClearColor(new THREE.Color()).getHex()===color,alpha:renderer.getClearAlpha()===alpha};badTarget.dispose();return result;
 });assert.deepEqual(post,{direct:1,onscreen:true,post:false,target:true,auto:true,color:true,alpha:true});
 const panels=await p.evaluate(()=>{const native=renderer.render;let threw=false;renderer.render=()=>{throw Error('TEST panels');};try{renderPanels({f:G.player,t:SHOTS[0]+.1});}catch(e){threw=true;}finally{renderer.render=native;}const view=renderer.getViewport(new THREE.Vector4());return{threw,scissor:renderer.getScissorTest(),viewport:[view.x,view.y,view.z,view.w],width:innerWidth,height:innerHeight};});assert.ok(panels.threw&&!panels.scissor);assert.deepEqual(panels.viewport,[0,0,panels.width,panels.height]);
 const backwards=await p.evaluate(()=>{const before=G.time;loop(last-3000);return{time:G.time-before,finite:Number.isFinite(G.player.pos.x)&&Number.isFinite(camera.position.x)};});assert.equal(backwards.time,0);assert.ok(backwards.finite);
 await p.evaluate(()=>{renderMain=savedRenderMain;renderer.shadowMap.enabled=false;renderer.setPixelRatio(.35);renderer.setSize(innerWidth,innerHeight,false);window.testGlLoss=renderer.getContext().getExtension('WEBGL_lose_context');testGlLoss.loseContext();});
 await p.waitForFunction(()=>FRAME_HEALTH.contextLost&&renderer.getContext().isContextLost());assert.ok(await p.locator('#graphics-recovery').isVisible());await wait(350);await p.evaluate(()=>testGlLoss.restoreContext());await p.waitForFunction(()=>!FRAME_HEALTH.contextLost&&!renderer.getContext().isContextLost(),{timeout:20000});
 const restored=await p.evaluate(()=>{const before=FRAME_HEALTH.rendered;loop(last+1000/60);return{drawn:FRAME_HEALTH.rendered>before,post:GFX.post,statusHidden:$('graphics-recovery').hidden};});assert.ok(restored.drawn&&!restored.post&&restored.statusHidden);
 assert.deepEqual(errors,[]);const report={ok:true,group,faults,post,panels,backwards,restored,errors};fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});
