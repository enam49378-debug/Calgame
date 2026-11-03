const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc,collection,getDocs,query,where,orderBy,limit,serverTimestamp,Timestamp,addDoc,deleteDoc}=require('firebase/firestore');
const ownerHash=crypto.createHash('sha256').update('calfight:owner@test.invalid').digest('hex');
const rules=fs.readFileSync(process.env.CF_RULES||require('node:path').join(__dirname,'../firestore.rules'),'utf8').replace('9d146dbc10561ea319eaa1854c3852babfd5bb58c4082f7309a6f5b9d9073146',ownerHash);
const profile=(uid,n=uid)=>({v:1,uid,n,a:'',b:{k:'pre:sunset'},acct:true,g:2,m:60,f:'javi',bio:'Hola',pronouns:'',status:'',accent:'#a5a0ff',theme:'midnight',aura:'aurora',stickers:['cal','star'],updated:serverTimestamp()});
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-calfight-social',firestore:{host:'127.0.0.1',port:18982,rules}});
 try{
 await env.clearFirestore();const owner=env.authenticatedContext('owner',{email:'owner@test.invalid',email_verified:true}).firestore(),a=env.authenticatedContext('alice',{email:'alice@test.invalid',email_verified:true}).firestore(),b=env.authenticatedContext('bob',{email:'bob@test.invalid',email_verified:true}).firestore(),spy=env.authenticatedContext('spy',{email:'spy@test.invalid',email_verified:true}).firestore(),unverified=env.authenticatedContext('unverified',{email:'unverified@test.invalid',email_verified:false}).firestore(),guest=env.unauthenticatedContext().firestore();
 for(const[db,id]of[[owner,'owner'],[a,'alice'],[b,'bob'],[spy,'spy']])await assertSucceeds(setDoc(doc(db,'cf_profiles',id),profile(id)));
 await assertFails(setDoc(doc(a,'cf_profiles','bob'),profile('bob')));await assertFails(setDoc(doc(unverified,'cf_profiles','unverified'),profile('unverified')));
 await assertFails(setDoc(doc(a,'cf_profiles','alice'),{...profile('alice'),role:'owner'}));await assertFails(setDoc(doc(a,'cf_profiles','alice'),{...profile('alice'),bio:'x'.repeat(241)}));
 const decor={frame:'ember',effect:'scan',positions:[{id:'cal',x:800,y:250}]};
 await assertSucceeds(setDoc(doc(a,'cf_profiles','alice'),{...profile('alice'),decor}));
 await assertFails(setDoc(doc(a,'cf_profiles','alice'),{...profile('alice'),decor:{...decor,positions:[{id:'cal',x:1001,y:250}]}}));
 await assertFails(setDoc(doc(a,'cf_profiles','alice'),{...profile('alice'),decor:{...decor,positions:[{id:'wave',x:800,y:250}]}}));
 await assertSucceeds(getDoc(doc(guest,'cf_profiles','alice')));
 const role={role:'calsito',by:'owner',updated:serverTimestamp()};await assertFails(setDoc(doc(a,'cf_roles','alice'),{...role,by:'alice'}));await assertFails(setDoc(doc(unverified,'cf_roles','bob'),{...role,by:'unverified'}));
 await assertSucceeds(setDoc(doc(owner,'cf_roles','bob'),role));await assertSucceeds(getDoc(doc(guest,'cf_roles','bob')));await assertFails(setDoc(doc(owner,'cf_roles','bob'),{...role,role:'owner'}));await assertSucceeds(setDoc(doc(owner,'cf_roles','owner'),{...role,role:'owner'}));
 await assertSucceeds(setDoc(doc(a,'cf_sessions','uabc12345'),{uid:'alice',expires:Timestamp.fromMillis(Date.now()+120000)}));await assertFails(setDoc(doc(b,'cf_sessions','uabc12345'),{uid:'bob',expires:Timestamp.fromMillis(Date.now()+120000)}));await assertFails(setDoc(doc(a,'cf_sessions','uxyz12345'),{uid:'bob',expires:Timestamp.fromMillis(Date.now()+120000)}));
 const linkId='alice~bob',ref=db=>doc(db,'cf_links',linkId),msg=db=>collection(db,'cf_links',linkId,'messages'),pending={members:['alice','bob'],by:'alice',status:'pending',updated:serverTimestamp()};
 await assertFails(setDoc(ref(a),{...pending,status:'accepted'}));await assertSucceeds(setDoc(ref(a),pending));await assertFails(updateDoc(ref(a),{status:'accepted',updated:serverTimestamp()}));await assertFails(getDoc(ref(spy)));
 await assertFails(addDoc(msg(a),{from:'alice',text:'Antes de aceptar',at:serverTimestamp()}));await assertSucceeds(updateDoc(ref(b),{status:'accepted',updated:serverTimestamp()}));
 await assertSucceeds(addDoc(msg(a),{from:'alice',text:'Hola, Bob',at:serverTimestamp()}));await assertSucceeds(addDoc(msg(b),{from:'bob',text:'Hola, Alice',at:serverTimestamp()}));
 await assertSucceeds(getDocs(query(msg(b),orderBy('at','desc'),limit(50))));await assertFails(getDocs(msg(spy)));await assertFails(getDocs(msg(guest)));await assertFails(addDoc(msg(a),{from:'bob',text:'Suplantado',at:serverTimestamp()}));await assertFails(addDoc(msg(a),{from:'alice',text:'x'.repeat(1001),at:serverTimestamp()}));
 const links=await assertSucceeds(getDocs(query(collection(a,'cf_links'),where('members','array-contains','alice'),limit(100))));assert.equal(links.size,1);
 await assertSucceeds(setDoc(doc(b,'cf_blocks','bob','users','alice'),{at:serverTimestamp()}));await assertFails(addDoc(msg(a),{from:'alice',text:'Bloqueado',at:serverTimestamp()}));await assertFails(getDocs(msg(a)));await assertFails(deleteDoc(doc(a,'cf_blocks','bob','users','alice')));await assertSucceeds(deleteDoc(doc(b,'cf_blocks','bob','users','alice')));
 await assertSucceeds(updateDoc(ref(b),{status:'removed',updated:serverTimestamp()}));await assertFails(addDoc(msg(a),{from:'alice',text:'Ya no somos amigos',at:serverTimestamp()}));await assertSucceeds(updateDoc(ref(a),{status:'pending',by:'alice',updated:serverTimestamp()}));
 console.log(JSON.stringify({ok:true,ownerRoles:true,roleSpoofDenied:true,publicProfiles:true,verifiedAccounts:true,privateDM:true,friendAcceptance:true,blocking:true,sessionBinding:true}));
 }finally{await env.cleanup();}
})().catch(e=>{console.error(e);process.exitCode=1;});
