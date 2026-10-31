const assert=require('node:assert/strict');
const A=require(process.argv[2]||require('node:path').resolve(__dirname,'../server/ambiente.js'));
const state=A.create(123);A.command(state,{mode:'storm',hour:23,cycle:false});A.warm(state);
const e=A.warn(state,0,0,1);
const players=[{id:'outside',x:0,y:0,z:0,alive:true,safe:false},{id:'safe',x:0,y:0,z:0,alive:true,safe:true},{id:'inside',x:-14,y:0,z:-14,alive:true,safe:false}];
A.advance(state,.9,players);assert.equal(e.resolved,false);A.advance(state,.2,players);assert.equal(e.resolved,true);assert.deepEqual(e.victims,[{id:'outside',damage:28}]);
assert.equal(A.sheltered({x:-14,y:0,z:-14}),true);assert.equal(A.sheltered({x:-14,y:7.5,z:-14}),false);
const flee=A.create(1);const warning=A.warn(flee,0,0,1);A.advance(flee,1.1,[{id:'run',x:4,y:0,z:0,alive:true}]);assert.deepEqual(warning.victims,[]);
const clone=A.parse(A.snapshot(state));assert.ok(clone);assert.deepEqual(A.snapshot(clone),A.snapshot(state));
assert.equal(A.parse({...A.snapshot(state),rain:9}),null);assert.equal(A.parse({...A.snapshot(state),t:NaN}),null);
const a=A.create(52),b=A.create(52);for(const s of[a,b]){A.command(s,{mode:'storm'});A.warm(s);}
for(let i=0;i<500;i++){A.advance(a,.05,players);A.advance(b,.05,players);}assert.deepEqual(A.snapshot(a),A.snapshot(b));
for(const mode of Object.keys(A.presets)){const s=A.create();assert.equal(A.command(s,{mode}),true);A.advance(s,8,[]);assert.ok(A.parse(A.snapshot(s)));}
console.log(JSON.stringify({ok:true,weatherModes:Object.keys(A.presets).length,damage:28,shelter:true,spawnProtection:true,dodge:true,deterministic:true}));

const instant=A.create(123);A.command(instant,{mode:'storm'});instant.nextStrike=0;A.advance(instant,.1,players);assert.ok(instant.strikes.length&&instant.strikes.every(e=>e.resolved&&e.at<=instant.t));
