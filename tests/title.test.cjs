const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../src/title.js');
const CR=require('../src/credits.js');
const C=require('../src/core.js');
const BANNED=/prototype|realm 10|luna|epoch|provisional|not a claim|sentient|language model/i;
test('key rows name every action once and never use developer words',()=>{
 const actions=T.KEY_ROWS.map(r=>r[0]);
 assert.equal(new Set(actions).size,actions.length);
 for(const [action,keys] of T.KEY_ROWS){assert.ok(action.trim()&&keys.trim(),action);assert.doesNotMatch(action+' '+keys,BANNED);}
});
test('key table renders one row per action with real key caps',()=>{
 const html=T.keyTable();
 assert.equal((html.match(/<tr>/g)||[]).length,T.KEY_ROWS.length);
 for(const k of['E','F','V','P','Esc','Tab'])assert.ok(html.includes('<kbd>'+k+'</kbd>'),k);
});
test('credits normalize to non-empty trimmed sections and carry no developer words',()=>{
 assert.deepEqual(CR.normalize(null),[]);
 assert.deepEqual(CR.normalize([{title:'  ',lines:[]},{title:' Made by ',lines:[' Eternities ','']}]),[{title:'Made by',lines:['Eternities']}]);
 const sections=CR.normalize(T.CREDITS);
 assert.ok(sections.length>=3);
 for(const s of sections)assert.doesNotMatch(s.title+' '+s.lines.join(' '),BANNED);
});
test('new worlds carry the settings defaults and an open first-steps card',()=>{
 const w=C.fresh();
 assert.equal(w.settings.textScale,'standard');
 assert.deepEqual(w.settings.volume,{music:.8,effects:.8,ambience:.8,ui:.8});
 assert.deepEqual(w.firstRun,{move:false,camera:false,attack:false,interact:false,dismissed:false});
});
test('settings validation keeps valid values and falls back on bad ones',()=>{
 const raw=settings=>({...C.fresh(),settings:{...C.fresh().settings,...settings}});
 assert.equal(C.validate(raw({textScale:'large'})).settings.textScale,'large');
 assert.equal(C.validate(raw({textScale:'huge'})).settings.textScale,'standard');
 assert.deepEqual(C.validate(raw({volume:{music:.3,effects:2,ambience:-1,ui:'x'}})).settings.volume,{music:.3,effects:.8,ambience:.8,ui:.8});
});
test('old saves load with the first steps already done and default settings',()=>{
 const old=C.fresh();delete old.firstRun;delete old.settings.textScale;delete old.settings.volume;
 const w=C.validate(old);
 assert.equal(w.firstRun.dismissed,true);
 assert.equal(w.settings.textScale,'standard');
 assert.equal(w.settings.volume.music,.8);
});
test('new worlds follow the device motion setting',()=>{
 const had=Object.prototype.hasOwnProperty.call(globalThis,'matchMedia'),prior=globalThis.matchMedia;
 try{
  globalThis.matchMedia=q=>({matches:q.includes('reduce')});
  assert.equal(C.fresh().settings.reducedMotion,true);
 }finally{if(had)globalThis.matchMedia=prior;else delete globalThis.matchMedia;}
 assert.equal(C.fresh().settings.reducedMotion,false);
});
