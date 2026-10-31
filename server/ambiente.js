const ROOM_ATMOSPHERE = (() => {
  const presets={
    clear:{rain:0,cloud:.04,fog:.08,snow:0,wind:.2},cloudy:{rain:0,cloud:.8,fog:.25,snow:0,wind:.35},
    drizzle:{rain:.28,cloud:.75,fog:.48,snow:0,wind:.25},rain:{rain:.72,cloud:.9,fog:.6,snow:0,wind:.55},
    storm:{rain:1,cloud:1,fog:.78,snow:0,wind:1},fog:{rain:0,cloud:.55,fog:.85,snow:0,wind:.1},
    densefog:{rain:.08,cloud:.7,fog:1,snow:0,wind:.08},wind:{rain:0,cloud:.48,fog:.3,snow:0,wind:1},
    snow:{rain:0,cloud:.7,fog:.5,snow:.7,wind:.3},blizzard:{rain:0,cloud:.95,fog:.92,snow:1,wind:1}
  };
  const map=require('./mapa.json'),buildings=map.buildings,ARENA=map.radius,CITY={bounds:map.bounds};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const round=v=>Math.round(v*1000)/1000;
  function hash(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
  function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
  function kind(s){if(s.mode!=='auto')return s.mode;const seq=[['clear',80],['cloudy',50],['drizzle',65],['rain',85],['storm',85],['fog',70],['densefog',60],['wind',55],['snow',80],['blizzard',65]];let t=s.elapsed%695;for(const [k,d]of seq){if(t<d)return k;t-=d;}return 'clear';}
  function create(seed=8197){return {v:3,t:0,hour:11,cycle:true,mode:'auto',elapsed:0,rain:0,cloud:.04,fog:.08,snow:0,wind:.2,wet:0,fogStrength:1.15,seed:seed>>>0,rng:seed>>>0,seq:0,nextStrike:12,strikes:[]};}
  function command(s,c){
    if(!c||typeof c!=='object')return false;
    let ok=false;
    if(typeof c.mode==='string'&&(c.mode==='auto'||presets[c.mode])){s.mode=c.mode;s.elapsed=0;s.nextStrike=s.t+5;ok=true;}
    if(Number.isFinite(c.hour)&&c.hour>=0&&c.hour<24){s.hour=c.hour;ok=true;}
    if(typeof c.cycle==='boolean'){s.cycle=c.cycle;ok=true;}
    if(Number.isFinite(c.fogStrength)){s.fogStrength=clamp(c.fogStrength,.6,1.65);ok=true;}
    return ok;
  }
  function sheltered(p){
    for(const [x,z,w,d,h]of buildings){
      if(Math.abs(p.x-x)<w/2-.1&&Math.abs(p.z-z)<d/2-.1&&p.y+1.85<h-.1)return true;
      const f=z<0?1:-1;
      if(Math.abs(p.x-x)<w/2-.2&&Math.abs(p.z-(z+f*(d/2+.5)))<.7&&p.y+1.85<2.38)return true;
    }
    return false;
  }
  function surfaceAt(x,z){for(const [bx,bz,w,d,h]of buildings)if(Math.abs(x-bx)<w/2&&Math.abs(z-bz)<d/2)return h+.3;return .1;}
  function warn(s,x,z,delay=0){
    const strike={id:s.seed.toString(36)+'-'+(++s.seq),x:round(clamp(x,-(CITY.bounds-1),CITY.bounds-1)),z:round(clamp(z,-(CITY.bounds-1),CITY.bounds-1)),y:surfaceAt(x,z),at:round(s.t+delay),radius:3.1,damage:28,resolved:false,victims:[]};
    s.strikes.push(strike);return strike;
  }
  function advance(s,dt,players=[],hazards=true){
    dt=clamp(Number.isFinite(dt)?dt:0,0,60);s.t+=dt;s.elapsed+=dt;if(s.cycle)s.hour=(s.hour+dt*.05)%24;
    const p=presets[kind(s)],blend=1-Math.exp(-dt*.28);
    for(const k of ['rain','cloud','fog','snow','wind'])s[k]+=(p[k]-s[k])*blend;
    s.wet=clamp(s.wet+dt*(s.rain>.1?s.rain*.035:s.snow>.2?.003:-.008),0,1);
    if(hazards){
      if(kind(s)==='storm'&&s.t>=s.nextStrike){
        s.nextStrike=s.t+4.5+random(s)*4;
        const exposed=players.filter(p=>p.alive&&!p.safe&&!sheltered(p));
        const target=exposed.length&&random(s)<.9?exposed[Math.floor(random(s)*exposed.length)]:null;
        if(target)warn(s,target.x+(random(s)-.5)*.6,target.z+(random(s)-.5)*.6);
        else {const a=random(s)*Math.PI*2,r=5+random(s)*(CITY.bounds-9);warn(s,Math.cos(a)*r,Math.sin(a)*r);}
      }
      for(const e of s.strikes)if(!e.resolved&&s.t>=e.at){
        e.resolved=true;
        for(const p of players){if(!p.alive||p.safe||sheltered(p))continue;const d=Math.hypot(p.x-e.x,p.z-e.z);if(d<e.radius&&Math.abs(p.y-e.y)<2.8)e.victims.push({id:String(p.id),damage:Math.round(e.damage*(1-d/e.radius*.55))});}
      }
    }
    s.strikes=s.strikes.filter(e=>s.t-e.at<6).slice(-8);return s;
  }
  function warm(s){const p=presets[kind(s)];for(const k of ['rain','cloud','fog','snow','wind'])s[k]=p[k];s.wet=p.rain;return s;}
  function snapshot(s){const d={...s,strikes:s.strikes.map(e=>({...e,victims:e.victims.map(v=>({...v}))}))};for(const k of ['t','hour','elapsed','rain','cloud','fog','snow','wind','wet'])d[k]=round(d[k]);return d;}
  function parse(d){
    if(!d||d.v!==3||!['t','hour','elapsed','rain','cloud','fog','snow','wind','wet','seed','rng','seq','nextStrike','fogStrength'].every(k=>Number.isFinite(d[k]))||!(d.mode==='auto'||presets[d.mode])||typeof d.cycle!=='boolean')return null;
    if(d.t<0||d.t>1e9||d.hour<0||d.hour>=24||['rain','cloud','fog','snow','wind','wet'].some(k=>d[k]<0||d[k]>1))return null;
    const s={...d,strikes:[]};s.fogStrength=clamp(d.fogStrength,.6,1.65);
    for(const e of Array.isArray(d.strikes)?d.strikes.slice(-8):[]){
      if(!e||typeof e.id!=='string'||e.id.length>64||!['x','y','z','at','radius','damage'].every(k=>Number.isFinite(e[k]))||Math.abs(e.x)>ARENA||Math.abs(e.z)>ARENA||e.radius<0||e.radius>4||e.damage<0||e.damage>35)continue;
      s.strikes.push({...e,resolved:!!e.resolved,victims:(Array.isArray(e.victims)?e.victims:[]).filter(v=>v&&typeof v.id==='string'&&v.id.length<80&&Number.isFinite(v.damage)&&v.damage>0&&v.damage<=35).map(v=>({id:v.id,damage:v.damage}))});
    }
    return s;
  }
  return {presets,buildings,create,hash,kind,command,sheltered,surfaceAt,warn,advance,warm,snapshot,parse};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ROOM_ATMOSPHERE;

