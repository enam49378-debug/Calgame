// Destello Negro, lanzas de Javi y proyectiles
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_COMBATE = window.CF_COMBATE || {};

window.CF_COMBATE.crearDestelloNegro = function crearDestelloNegro(D) {
  'use strict';
  const { $, ABY, ARENA, Animator, CHARS, DUMMY_CH, G, JAVI_SPEARS, PROJ, PX, ROOM_ATMOSPHERE, SPEAR_BODY_PARTS, TAU, V3, applyHit, applyNetDest, buildModel, buildSpear, burst, camera, chestOf, copyCanvas, disposeModel, emit, enemiesOf, explode, front, fwd, ghost, groundAt, hitArea, impactStar, makeSkinCanvas, outLand, popText, rand, ringAt, scene, setSpear, sfx, slashLine, spearActor, spearActorId, sphereFlash, worldDamage, wxRandom } = D;

// ===== Destello Negro (Javi sin lanza): se vuelve a pulsar la habilidad (o clic) justo al impactar =====
function bfInput(f, slot) {
  if (!f.isPlayer) return false;
  const e = D.pressed.has('Digit' + (slot + 1)) || (D.mouse.left && !f._bfM); f._bfM = D.mouse.left; return e;
}
function bfFx(f, p, big) {
  burst(p, big ? 36 : 26, '#0a0a0a', 10, .22, .6, .3); burst(p, big ? 32 : 24, '#ff2a3c', 13, .18, .5, 0);
  impactStar(p, '#ff2a3c', big ? 4.4 : 3.4, .38); impactStar(p, '#000000', big ? 3 : 2.2, .5); ringAt(p, '#ff2a3c', big ? 7 : 5.5, .5); ringAt(p, '#000000', 3.5, .4); sphereFlash(p, '#ff2a3c', 2.2, .3);
  for (let k = 0; k < 9; k++) { const a = rand(0, TAU), d = new V3(Math.cos(a), rand(-.3, .6), Math.sin(a)); slashLine(p, p.clone().addScaledVector(d, rand(2, 4)), k % 2 ? '#ff2a3c' : '#14141c', .22, .06); }
  popText(p, '¡DESTELLO NEGRO!', '#ff4a5a', big ? 34 : 28); sfx('break', f.pos); sfx('ult', f.pos, .5); G.hitstop = Math.max(G.hitstop, big ? .2 : .15); G.linesI = Math.max(G.linesI, 1);
}
function bfStrike(f, o, set, flash, dmg, big) {
  const p = front(f, 1.5, 1.25), F = fwd(f.yaw); f.vel.x += F.x * (flash ? 4 : 2); f.vel.z += F.z * (flash ? 4 : 2);
  const n = hitArea(f, p, flash ? 1.9 : 1.3, { dmg: flash ? dmg : dmg * .32, kb: flash ? 27 : 6, up: flash ? 7 : 2, ragdoll: flash ? (big ? 2.2 : 1.7) : .4, stun: .5, color: flash ? '#ff2a3c' : (o.color || '#ffffff'), guardBreak: flash, set, hitstop: flash ? .16 : .05, shake: flash ? 1 : .2 });
  if (flash) { bfFx(f, p, big); ghost(f, '#ff2a3c', .5, .3); } else { impactStar(p, '#ffffff', 1.4, .15); if (f.isPlayer) popText(p, n ? 'Golpe normal' : 'Fallaste el momento', '#aab', 15); }
  worldDamage(p, flash ? 4.4 : 2.4, flash ? 1.6 : .6, flash ? dmg + 4 : 8, flash ? 1.5 : .6);
}
// pierde la lanza por un golpe fuerte, una guardia rota o un golpe que lo manda a volar: queda en el suelo y se recupera acercándose
function loseSpear(f) {
  if (f.ch !== CHARS.javi || f.remote || f.spearLost || !f.spear || !f.spearOut) return;
  const F = fwd(f.yaw), id = spearActorId(f) + ':perdida' + (++JAVI_SPEARS.sequence);
  const d = createSpearDrop({ id, owner: spearActorId(f), victim: spearActorId(f), character: 'javi', n: f.deaths || 0, at: [f.pos.x + F.x * 1.4, f.pos.y, f.pos.z + F.z * 1.4], dir: [rand(-1, 1), -.2, rand(-1, 1)], yaw: f.yaw, age: 1.2, floor: true }, false);
  if (!d) return;
  popText(chestOf(f), '¡PERDISTE LA LANZA!', '#ff8a5a', 24); sfx('break', f.pos, .7); burst(chestOf(f), 12, '#bce5f6', 6, .14, .4, .2); D.NET.sendT = 0;
}
function ownsMissingSpear(f){return !!(f.ch===CHARS.javi&&(f.spearLost||f._fistKit));}
function spearVector(values){return Array.isArray(values)&&values.length===3&&values.every(v=>Number.isFinite(v)&&Math.abs(v)<ARENA+80);}
function validSpearRecord(e){return !!(e&&typeof e.id==='string'&&/^[a-zA-Z0-9_.:-]{1,100}$/.test(e.id)&&typeof e.owner==='string'&&typeof e.victim==='string'&&e.id.startsWith(e.owner+':')&&spearVector(e.at)&&spearVector(e.dir)&&Number.isFinite(e.n)&&Number.isFinite(e.yaw)&&Number.isFinite(e.age)&&e.age>=0&&e.age<7200);}
function copySpearBody(d){
  const t=d.victim;
  if(!d.body||!t||t.alive||t.deaths!==d.data.n||!G.fighters.includes(t))return false;
  for(const key of SPEAR_BODY_PARTS){
    d.body[key].position.copy(t.model[key].position);d.body[key].quaternion.copy(t.model[key].quaternion);d.body[key].scale.copy(t.model[key].scale);
  }
  t.model.root.visible=false;d.body.root.visible=true;return true;
}
function spearBodyPose(d){return d.body?SPEAR_BODY_PARTS.map(k=>{const p=d.body[k];return [...p.position.toArray(),...p.quaternion.toArray(),...p.scale.toArray()].map(v=>Math.round(v*1000)/1000);}):null;}
function restoreSpearBodyPose(d,pose){
  if(!d.body||!Array.isArray(pose)||pose.length!==8||!pose.every(row=>Array.isArray(row)&&row.length===10&&row.every(Number.isFinite)&&row.slice(0,3).every(v=>Math.abs(v)<ARENA+80)&&row.slice(3,7).every(v=>Math.abs(v)<=1.01)&&row.slice(7).every(v=>v>=.1&&v<=4)))return false;
  SPEAR_BODY_PARTS.forEach((k,i)=>{const p=d.body[k],row=pose[i];p.position.fromArray(row);p.quaternion.fromArray(row,3).normalize();p.scale.fromArray(row,7);});d.body.root.updateMatrixWorld(true);return true;
}
function spearDropPoint(d){
  if(d.body){d.body.root.updateMatrixWorld(true);return d.body.torso.localToWorld(new V3(0,6*PX,0));}
  return d.point.clone();
}
function retireLoyalSpear(p){
  if(!p||p.removed)return;p.removed=true;p.mesh.parent?.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();
  const i=PROJ.indexOf(p);if(i>=0)PROJ.splice(i,1);
}
function removeSpearDrop(id,settle=true){
  const d=JAVI_SPEARS.drops.get(id);if(!d)return;
  d.mesh.parent?.remove(d.mesh);d.mesh.geometry.dispose();d.mesh.material.dispose();
  if(d.body)disposeModel(d.body);
  if(d.jet){scene.remove(d.jet.mesh);d.jet.mesh.geometry.dispose();d.jet.mesh.material.dispose();}
  JAVI_SPEARS.drops.delete(id);if(settle)JAVI_SPEARS.settled.add(id);
}
function releaseOwnerSpear(f){
  if(!f.spearLost)return;
  const id=f.spearLost.id;removeSpearDrop(id);f.spearLost=null;f.spearRecovery=id;f.spearRecoveryUntil=G.time+12;
}
function createSpearBlood(d){
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xb5223b}),48),rng=wxRandom(ROOM_ATMOSPHERE.hash(d.id)),drops=[];
  for(let i=0;i<48;i++)drops.push({delay:i*.011,size:.05+rng()*.045,pos:null,vel:new V3((rng()-.5)*1.3,1+rng()*2,(rng()-.5)*1.3).addScaledVector(d.direction,-3.5-rng()*2.5)});
  mesh.frustumCulled=false;scene.add(mesh);d.jet={mesh,drops,time:0};updateSpearBlood(d,0);
}
function updateSpearBlood(d,dt){
  const jet=d.jet;if(!jet)return;jet.time+=dt;
  if(jet.time>1.4){scene.remove(jet.mesh);jet.mesh.geometry.dispose();jet.mesh.material.dispose();d.jet=null;return;}
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),scale=new V3(),center=spearDropPoint(d).addScaledVector(d.direction,-.18);
  for(let i=0;i<jet.drops.length;i++){
    const drop=jet.drops[i],t=jet.time-drop.delay;
    if(t<0){matrix.makeScale(0,0,0);jet.mesh.setMatrixAt(i,matrix);continue;}
    if(!drop.pos)drop.pos=center.clone();
    const p=drop.pos.clone().addScaledVector(drop.vel,t);p.y-=10*t*t;
    const floor=Math.min(drop.pos.y-.06,groundAt(p.x,p.z,drop.pos.y));p.y=Math.max(floor+.025,p.y);
    const size=drop.size*Math.max(0,1-t/.8);matrix.compose(p,q,scale.set(size,size*.8,size));jet.mesh.setMatrixAt(i,matrix);
  }
  jet.mesh.instanceMatrix.needsUpdate=true;
}
function createSpearDrop(data,blood=true){
  if(!validSpearRecord(data)||JAVI_SPEARS.settled.has(data.id))return null;
  if(JAVI_SPEARS.drops.has(data.id))return JAVI_SPEARS.drops.get(data.id);
  const owner=spearActor(data.owner);if(!owner||owner.ch!==CHARS.javi)return null;
  if(owner.spearLost&&owner.spearLost.id!==data.id)return null;
  const victim=spearActor(data.victim),direction=new V3(...data.dir).normalize();if(direction.lengthSq()<.1)return null;
  const d={id:data.id,data:{...data},owner,victim,direction,age:data.age,point:new V3(...(spearVector(data.anchor)?data.anchor:data.at)),body:null,mesh:buildSpear(1.25),jet:null};
  if(!data.floor&&data.age<JAVI_SPEARS.bodyLife){
    const ch=CHARS[data.character]||(data.character==='dummy'?DUMMY_CH:CHARS.javi),skin=victim?.skin||ch.skinCanvas||makeSkinCanvas(ch.skin);
    d.body=buildModel(copyCanvas(skin),!!(victim?.ch.slim||ch.slim),scene);
    if(!copySpearBody(d)){
      const anim=new Animator(d.body);anim.x.ix=Math.PI/2;anim.x.alx=-.4;anim.x.arx=-.25;anim.x.llx=.1;anim.apply();d.body.root.position.set(...data.at);d.body.root.rotation.y=data.yaw;
      if(spearVector(data.anchor)){const at=spearDropPoint(d);d.body.root.position.add(new V3(...data.anchor).sub(at));}
      restoreSpearBodyPose(d,data.pose);
    }
    d.body.root.updateMatrixWorld(true);const localDirection=direction.clone().applyQuaternion(d.body.torso.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
    d.mesh.quaternion.setFromUnitVectors(new V3(0,0,1),localDirection);d.mesh.position.set(0,6*PX,0).addScaledVector(localDirection,-(26*PX*1.25-.23));d.body.torso.add(d.mesh);
  }else{
    d.point.y=groundAt(d.point.x,d.point.z,d.point.y)+.15;d.mesh.position.copy(d.point).addScaledVector(direction,-.9);d.mesh.quaternion.setFromUnitVectors(new V3(0,0,1),direction);scene.add(d.mesh);
  }
  JAVI_SPEARS.drops.set(data.id,d);owner.spearLost=d;owner.spearThrown=true;owner.spearOut=false;if(owner.spear)owner.spear.visible=false;
  for(const p of [...PROJ])if(p.loyal&&p.owner===owner)retireLoyalSpear(p);
  if(blood&&data.age<1)createSpearBlood(d);
  return d;
}
function confirmSpearFinisher(owner,victim,shot){
  if(owner.ch!==CHARS.javi||victim.alive||!shot||typeof shot.id!=='string'||!shot.id.startsWith(spearActorId(owner)+':')||!spearVector(shot.dir))return;
  const record={id:shot.id,owner:spearActorId(owner),victim:spearActorId(victim),character:victim.ch.id,n:victim.deaths,at:victim.pos.toArray(),yaw:victim.yaw,dir:shot.dir,age:0};
  const d=createSpearDrop(record,true);if(!d)return;
  victim.spearReceipts=(victim.spearReceipts||[]).filter(e=>G.time-e.time<12&&e.data.id!==record.id);victim.spearReceipts.push({time:G.time,data:record});victim.spearReceipts=victim.spearReceipts.slice(-4);D.NET.sendT=0;
}
function loyalSpearHit(p,victim,hit){
  const eligible=p.finisherEligible,local=!victim.remote,lethal=local&&victim.hp<=hit.dmg*(p.owner.ai?p.owner.ai.P.dmg:1);
  const shot=eligible?{id:p.spearId,dir:p.vel.clone().normalize().toArray()}:null;
  if(shot){hit.spearFinish=shot;if(lethal){hit.kb=3.2;hit.up=1.2;}}
  const alive=victim.alive,result=applyHit(p.owner,victim,hit);
  if(shot&&local&&alive&&!victim.alive&&result===true)confirmSpearFinisher(p.owner,victim,shot);
  if(p.removed)return true;
  if(eligible&&victim.remote&&victim.hp<=hit.dmg+.05){p.phase='finish-wait';p.finishWait=.8;p.waitVictim=victim;}
  return false;
}
function recoverJaviSpear(f){
  const d=f.spearLost;if(!d||f.remote||!f.alive||f.ragdoll>0||f.stun>0||f.grabbed||f.cineLock||d.age<.8)return false;
  const point=spearDropPoint(d);if(Math.hypot(f.pos.x-point.x,f.pos.z-point.z)>JAVI_SPEARS.pickupRange||Math.abs(f.pos.y-point.y)>2.4)return false;
  releaseOwnerSpear(f);f.spearThrown=false;f.catchT=.4;setSpear(f,true);if(f.spear)f.spear.visible=true;sfx('draw',f.pos,.7);D.NET.sendT=0;return true;
}
function serializeLostSpear(f){
  const d=f.spearLost;if(!d)return null;
  return {...d.data,at:(d.body?d.body.root.position:d.point).toArray().map(D.r2),anchor:spearDropPoint(d).toArray().map(D.r2),pose:spearBodyPose(d),age:D.r2(d.age),floor:!d.body};
}
function spearReceiptList(f){return(f.spearReceipts||[]).filter(e=>G.time-e.time<12).map(e=>({...e.data,age:D.r2(Math.max(0,G.time-e.time))}));}
function synchronizeSpearDrops(peer,pr){
  if(Array.isArray(pr.dx)&&pr.dx.length){let seen=peer.destSeen||0;const mx=Math.max(...pr.dx.map(e=>+e?.s||0));if(mx<seen)seen=0;let top=seen;for(const e of pr.dx.slice(-8)){if(e&&e.s>seen){top=Math.max(top,e.s);applyNetDest(e);}}peer.destSeen=top;}
  if(typeof pr.sr==='string'&&pr.sr.length<=100&&pr.sr.startsWith(spearActorId(peer)+':')){JAVI_SPEARS.settled.add(pr.sr);const d=JAVI_SPEARS.drops.get(pr.sr);if(d){if(d.owner.spearLost?.id===d.id)d.owner.spearLost=null;removeSpearDrop(d.id);}}
  for(const record of (Array.isArray(pr.jf)?pr.jf.slice(-4):[]))if(record?.victim===spearActorId(peer)&&validSpearRecord(record))createSpearDrop(record,true);
  if(pr.sd&&pr.sd.owner===spearActorId(peer)&&validSpearRecord(pr.sd)){
    const d=createSpearDrop(pr.sd,true);if(d&&peer.remote){
      d.age=pr.sd.age;
      if(!d.victim||d.victim.alive||d.victim.deaths!==d.data.n)restoreSpearBodyPose(d,pr.sd.pose);
    }
  }
}
function updateSpearDrops(dt){
  for(const d of [...JAVI_SPEARS.drops.values()]){
    if(!G.fighters.includes(d.owner)){removeSpearDrop(d.id);continue;}
    d.age+=dt;
    if(d.body){copySpearBody(d);d.point.copy(spearDropPoint(d));if(d.age>JAVI_SPEARS.bodyLife){
      const dir=d.mesh.getWorldDirection(new V3());d.mesh.parent?.remove(d.mesh);disposeModel(d.body);d.body=null;d.point.y=groundAt(d.point.x,d.point.z,d.point.y)+.15;d.mesh.position.copy(d.point).addScaledVector(dir,-.9);d.mesh.quaternion.setFromUnitVectors(new V3(0,0,1),dir);scene.add(d.mesh);
    }}
    updateSpearBlood(d,dt);if(!d.owner.remote)recoverJaviSpear(d.owner);
  }
  if(JAVI_SPEARS.settled.size>256)JAVI_SPEARS.settled=new Set([...JAVI_SPEARS.settled].slice(-128));
  const f=G.player,el=$('spear-recovery');
  const marker=$('spear-marker');
  if(f?.spearLost&&f.alive&&!G.viewer){
    const p=spearDropPoint(f.spearLost),dist=Math.round(Math.hypot(f.pos.x-p.x,f.pos.z-p.z));el.classList.remove('hidden');el.textContent='Recupera tu lanza · '+dist+' m';$('skills').classList.add('no-spear');
    p.y+=.6;p.project(camera);const visible=p.z>=-1&&p.z<=1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.9;
    marker.classList.toggle('hidden',!visible);if(visible){marker.style.left=(p.x*.5+.5)*innerWidth+'px';marker.style.top=(-p.y*.5+.5)*innerHeight+'px';}
  }
  else{el.classList.add('hidden');marker.classList.add('hidden');$('skills').classList.remove('no-spear');}
}
function clearSpearDrops(){for(const id of [...JAVI_SPEARS.drops.keys()])removeSpearDrop(id,false);JAVI_SPEARS.settled.clear();$('spear-recovery').classList.add('hidden');$('spear-marker').classList.add('hidden');}
function missingSpearHint(f){if(f.isPlayer&&G.time>(f.spearHintAt||0)){f.spearHintAt=G.time+.8;popText(chestOf(f),'Recupera tu lanza','#bce5f6',17);}}
function spawnProj(f, yaw, o) {
  const F = fwd(yaw), size = o.size || .4, speed = o.speed || 32;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size * (o.long || 1)), new THREE.MeshBasicMaterial({ color: o.color }));
  const p = { owner: f, pos: o.from ? o.from.clone() : o.eyes ? front(f, .5, 1.72) : front(f, .8, 1.15), vel: F.multiplyScalar(speed), speed, life: (o.range || 30) / speed, o, mesh, size };
  mesh.position.copy(p.pos); scene.add(mesh); PROJ.push(p);
}
function updateProj(dt) {
  for (let i = PROJ.length - 1; i >= 0; i--) {
    const p = PROJ[i];
    if (p.loyal) { updLoyal(p, i, dt); continue; }
    const o = p.o; p.life -= dt;
    if (o.homing) {
      let best = null, bd = 1e9;
      for (const g of enemiesOf(p.owner)) { const to = chestOf(g).sub(p.pos), d = to.length(); if (d < 16 && to.dot(p.vel) / (d * p.speed) > .6 && d < bd) { bd = d; best = g; } }
      if (best) { const des = chestOf(best).sub(p.pos).normalize().multiplyScalar(p.speed); p.vel.lerp(des, Math.min(1, o.homing * dt)).setLength(p.speed); }
    }
    p.pos.addScaledVector(p.vel, dt); p.mesh.position.copy(p.pos);
    if (o.long) p.mesh.lookAt(p.pos.clone().add(p.vel)); else { p.mesh.rotation.x += dt * 10; p.mesh.rotation.z += dt * 7; }
    emit(p.pos.x, p.pos.y, p.pos.z, rand(-.5, .5), rand(-.5, .5), rand(-.5, .5), o.color, p.size * .5, .25, 0, 2);
    const abP = !!(p.owner && p.owner.abyss);
    let boom = p.life <= 0 || p.pos.y < (abP ? ABY.y + .1 : .1) || groundAt(p.pos.x, p.pos.z) > p.pos.y || (!abP && outLand(p.pos.x, p.pos.z));
    if (!boom) for (const g of enemiesOf(p.owner)) {
      if (chestOf(g).distanceTo(p.pos) < .9 + p.size / 2 + (g.hitR || 0)) {
        if (o.onHit) o.onHit(g);
        else if (!o.explode) applyHit(p.owner, g, { dmg: o.dmg || 5, stun: o.stun != null ? o.stun : .5, kb: o.kb || 4, up: o.up || 0, dir: p.vel.clone(), color: o.color });
        boom = true; break;
      }
    }
    if (boom) {
      if (o.explode) explode(p.owner, p.pos.clone(), o.explode, { dmg: o.dmg || 8, kb: 12, up: 8, ragdoll: .9, color: o.color });
      else { burst(p.pos, 8, o.color, 4, .12, .25); impactStar(p.pos, o.color, .9, .15); }
      scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); PROJ.splice(i, 1);
    }
  }
}

// Lanza Leal: sale, atraviesa y vuelve a la mano de su dueño
function updLoyal(p, i, dt) {
  const f=p.owner,o=p.o;p.life-=dt;p.age+=dt;
  if(p.phase==='finish-wait'){
    p.finishWait-=dt;
    if(p.finishWait>0&&f.alive&&G.fighters.includes(f))return;
    p.phase='back';p.set.clear();
  }
  if(p.phase==='out'){
    p.pos.addScaledVector(p.vel,dt);
    for(const g of enemiesOf(f))if(!p.set.has(g)&&chestOf(g).distanceTo(p.pos)<1.1+(g.hitR||0)){
      p.set.add(g);
      if(loyalSpearHit(p,g,{dmg:o.dmg||8,kb:9,up:5,ragdoll:.7,dir:p.vel.clone(),color:o.color,hitstop:.05}))return;
      if(p.phase==='finish-wait')break;
    }
    if(p.phase==='out'&&(p.life<=0||p.pos.y<.2||groundAt(p.pos.x,p.pos.z)>p.pos.y||outLand(p.pos.x,p.pos.z))){
      p.phase='back';p.set.clear();burst(p.pos,10,'#c9a94a',5,.15,.3);sfx('block',p.pos,.6);
    }
  }else{
    const to=chestOf(f).sub(p.pos),d=to.length();p.vel.copy(to.normalize().multiplyScalar(40));p.pos.addScaledVector(p.vel,dt);
    for(const g of enemiesOf(f))if(!p.set.has(g)&&chestOf(g).distanceTo(p.pos)<1.1+(g.hitR||0)){
      p.set.add(g);
      if(loyalSpearHit(p,g,{dmg:(o.dmg||8)*.6,kb:6,up:3,stun:.5,dir:p.vel.clone(),color:o.color}))return;
      if(p.phase==='finish-wait')break;
    }
    if(p.phase!=='finish-wait'&&(d<1.3||!f.alive||p.age>3||!G.fighters.includes(f))){
      retireLoyalSpear(p);
      if(!ownsMissingSpear(f)){f.spearThrown=false;if(f.spear)f.spear.visible=true;f.catchT=.4;}
      if(f.alive){sfx('draw',f.pos);burst(chestOf(f),8,o.color,4,.12,.25);}return;
    }
  }
  p.mesh.position.copy(p.pos);p.mesh.lookAt(p.pos.clone().add(p.vel));
  emit(p.pos.x,p.pos.y,p.pos.z,rand(-.5,.5),rand(-.5,.5),rand(-.5,.5),o.color,.15,.25,0,2);
}

  return { bfFx, bfInput, bfStrike, clearSpearDrops, confirmSpearFinisher, copySpearBody, createSpearBlood, createSpearDrop, loseSpear, loyalSpearHit, missingSpearHint, ownsMissingSpear, recoverJaviSpear, releaseOwnerSpear, removeSpearDrop, restoreSpearBodyPose, retireLoyalSpear, serializeLostSpear, spawnProj, spearBodyPose, spearDropPoint, spearReceiptList, spearVector, synchronizeSpearDrops, updLoyal, updateProj, updateSpearBlood, updateSpearDrops, validSpearRecord };
};
