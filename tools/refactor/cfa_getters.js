// uso: node tools/refactor/cfa_getters.js js/game.js
// En el objeto api de CF_A, cambia las propiedades abreviadas (nombre,) de los nombres que ahora vienen de módulos por getters.
const fs=require('fs'),acorn=require('acorn'),walk=require('acorn-walk');
const p=process.argv[2];let s=fs.readFileSync(p,'utf8');
const names=new Set();for(const m of s.matchAll(/^const \{ ([^}]+) \} = CF_[A-Z0-9_]+\.crear\w+\(/gm))m[1].split(',').forEach(n=>names.add(n.trim()));
const ast=acorn.parse(s,{ecmaVersion:2022,ranges:true});
const a=s.indexOf('const CF_A = (() => {'),b=s.indexOf('return new Proxy(api',a);const reps=[];
walk.simple(ast,{Property(n){if(n.range[0]>a&&n.range[1]<b&&n.shorthand&&names.has(n.key.name))reps.push(n);}});
reps.sort((x,y)=>y.range[0]-x.range[0]);for(const n of reps)s=s.slice(0,n.range[0])+`get ${n.key.name}() { return ${n.key.name}; }`+s.slice(n.range[1]);
fs.writeFileSync(p,s);console.log('getters',reps.length);
