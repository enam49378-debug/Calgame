const{chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.BLOCKSTRIKE_TEST_ROOT||path.resolve(__dirname,'..'),dir=__dirname,port=18978,out=process.env.CF_OUT||path.join(root,'tests/artifacts/perfiles-v2');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,[path.join(root,'server/server.js')],{env:{...process.env,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false,browser;srv.stdout.on('data',d=>{if(String(d).includes('localhost:'))ready=true;});const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<400;i++){if(await fn())return;await wait(30);}throw Error('Timed out');}
(async()=>{await until(()=>ready);browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});const p=await browser.newPage({viewport:{width:1180,height:850}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
 await p.route(`http://127.0.0.1:${port}/`,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(process.env.BLOCKSTRIKE_TEST_HTML||path.join(root,'index.html'),'utf8')}));
 const deps=process.env.CF_TEST_DEPS?JSON.parse(fs.readFileSync(process.env.CF_TEST_DEPS,'utf8')):{};for(const[u,f]of Object.entries(deps))await p.route(u,r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(f)}));
 await p.route('**/assets/cal-role.png',r=>r.fulfill({contentType:'image/png',body:fs.readFileSync(process.env.CF_LOGO||path.join(root,'assets/cal-role.png'))}));
 await p.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForFunction(()=>typeof __ev==='function'&&__ev('CITY.modelsReady&&!!CHARS.javi.skinCanvas'),null,{polling:50,timeout:40000}).catch(e=>{console.log(errors);throw e;});
 const ev=(fn,arg)=>p.evaluate(({src,arg})=>__ev('('+src+')('+JSON.stringify(arg)+')'),{src:fn.toString(),arg});
 const boot=await ev(()=>({level:GFX.level,post:!!composer,particles:PS.mesh.count,errors:FRAME_HEALTH.errors}));assert.equal(boot.level,4);assert.equal(boot.post,false);assert.equal(boot.particles,0);
 await ev(()=>{ACCT.user={uid:'fixtureuser',email:'fixture@test.invalid',emailVerified:false,displayName:'JesulutoXD',photoURL:'',providerData:[]};$('pname-in').value='JesulutoXD';SOC.owner=true;localStorage.setItem(cosmeticKey(),JSON.stringify({theme:'ocean',aura:'aurora',accent:'#72e1d0',bio:'Animador de bloques.\nNos vemos en Ciudad Aurora.',status:'Creando algo épico ✨',pronouns:'él / he',stickers:['cal','clippy','diamond','sword']}));bannerSet({k:'pre:map_beach'});acctBuild();$('acctdlg').classList.remove('hidden');acctRender();});

 await p.locator('#acct-customize').click();await p.locator('#pe-bio').fill('Mi borrador sin guardar');
 assert.equal(await p.locator('.pe-preview .profile-bio').textContent(),'Mi borrador sin guardar');
 await p.setViewportSize({width:390,height:740});
 await p.getByRole('button',{name:'Vista previa',exact:true}).click();
 assert.ok(await p.locator('.pe-preview .profile-bio').isVisible());
 assert.equal(await p.locator('#pe-bio').isVisible(),false);
 await p.screenshot({path:path.join(out,'editor-vista-movil.png')});
 await p.getByRole('button',{name:'Personalizar',exact:true}).click();
 assert.equal(await p.locator('#pe-bio').inputValue(),'Mi borrador sin guardar');
 await p.setViewportSize({width:1180,height:850});
await p.locator('#pe-banner').click();await p.locator('#bn-back').click();assert.equal(await p.locator('#pe-bio').inputValue(),'Mi borrador sin guardar');assert.notEqual((await ev(()=>cosmeticsGet())).bio,'Mi borrador sin guardar');await p.locator('#pe-save').click();assert.equal((await ev(()=>cosmeticsGet())).bio,'Mi borrador sin guardar');
 await ev(()=>{acctClose();SOC.open=true;SOC.uid='fixtureuser';SOC.ready=true;SOC.links=new Map();SOC.profiles=new Map();socialBuild();$('socialdlg').classList.remove('hidden');SOC.thread='fixtureuser:friend';SOC.chatUid='friend';socialRenderMessages();});
 await p.locator('#dm-text').fill('Mensaje para mi amigo');assert.equal(await p.locator('#dm-count').textContent(),'21 / 1000');await ev(()=>socialChatStop());assert.equal(await ev(()=>dmDrafts.get('fixtureuser:fixtureuser:friend')),'Mensaje para mi amigo');
 await ev(()=>{SOC.thread='fixtureuser:friend';SOC.messages=[{from:'friend',text:'<b>hola</b>',at:{toDate:()=>new Date('2024-02-01T12:00:00Z')}}];socialRenderMessages();});assert.equal(await p.locator('.dm-message p').textContent(),'<b>hola</b>');assert.equal(await p.locator('.dm-message p b').count(),0);assert.equal(await p.locator('.dm-day').count(),1);
 await ev(()=>{SOC.links=new Map([['one',{id:'one',status:'accepted',members:['fixtureuser','f1']}],['two',{id:'two',status:'accepted',members:['fixtureuser','f2']}]]);SOC.profiles.set('f1',{n:'Ana'});SOC.profiles.set('f2',{n:'Beto'});socialGetProfile=async uid=>SOC.profiles.get(uid);});await p.locator('#friend-search').fill('ana');await p.waitForTimeout(100);assert.equal(await p.locator('.friend-row').count(),1);assert.equal(await p.locator('.friend-info b').textContent(),'Ana');
 await ev(()=>{ACCT.user.emailVerified=true;SOC.profiles.set('f1',cleanPublicProfile({v:1,uid:'f1',n:'Ana',g:42,m:90,f:'javi',status:'Lista para pelear'}));});
 await p.locator('.friend-row').getByRole('button',{name:'Perfil',exact:true}).click();
 assert.equal(await p.locator('#public-name').textContent(),'Ana');
 assert.equal(await p.locator('#playerdlg .public-status-slot').textContent(),'Lista para pelear');
 assert.equal(await p.locator('#playerdlg .public-stats b').first().textContent(),'42');
 await p.getByRole('button',{name:'Volver a amigos'}).click();
 assert.ok(await p.locator('#socialdlg').isVisible());
 assert.equal(await ev(()=>SOC.thread),'fixtureuser:friend');
 assert.deepEqual(errors,[]);console.log('Perfil y chat: OK');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();srv.kill();});

