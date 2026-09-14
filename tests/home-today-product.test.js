const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const context=vm.createContext({Date,Intl,console,t:key=>key});
for(const file of ['js/utils/dates.js','js/core/task-model.js','js/features/decision-engine-v2.js']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
}
const run=source=>vm.runInContext(source,context);
run("engineV2=createDecisionEngineV2({todayKey:()=> '2026-09-14'})");

test('missing current check-in remains unknown instead of fabricating average capacity',()=>{
  const decision=run("engineV2.stage({id:'x',title:'Onbekende taak',energyDemand:2},{checkin:{}})");
  assert.equal(decision.band,'context');
  assert.equal(decision.reason,'context-unknown');
  assert.equal(decision.signals.capacity.known,false);
  assert.equal(decision.signals.capacity.available,null);
});

test('missing task demand remains unknown even with a current check-in',()=>{
  const decision=run("engineV2.stage({id:'x',title:'Geen belasting bekend'},{checkin:{date:'2026-09-14',energy:3}})");
  assert.equal(decision.band,'context');
  assert.equal(decision.signals.demand,null);
  assert.equal(decision.signals.fitKnown,false);
});

test('urgent deadlines remain visible when fit context is unknown',()=>{
  const decision=run("engineV2.stage({id:'u',title:'Deadline',dueDate:'2026-09-14'},{checkin:{}})");
  assert.equal(decision.band,'must');
  assert.ok(decision.reasons.includes('deadline'));
  assert.ok(decision.reasons.includes('context-unknown'));
});

test('Home empty state is independent of whether a check-in exists',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','js/features/home.js'),'utf8');
  assert.match(source,/const noOptions=!primary\.length&&!attention\.length/);
  assert.doesNotMatch(source,/const noOptions=current&&/);
});

test('Home recovery action explicitly overrides legacy CSS hiding when broader options exist',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','js/features/home.js'),'utf8');
  assert.match(source,/recovery\.style\.setProperty\('display',canBroaden\?'block':'none','important'\)/);
  assert.match(source,/sets\.standard\.length<3&&sets\.extra\.length>0/);
});
