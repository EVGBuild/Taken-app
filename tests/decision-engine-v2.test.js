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

test('waiting and later are filtered before recommendation ranking',()=>{
  assert.equal(run("engineV2.stage({id:'w',title:'Wacht',lifecycle:{state:'waiting'}}).band"),'excluded');
  assert.equal(run("engineV2.stage({id:'l',title:'Later',lifecycle:{state:'later',resurfaceDate:'2026-10-01'}}).band"),'excluded');
});

test('urgent deadline is a must even when capacity is low',()=>{
  const decision=run("engineV2.stage({id:'u',title:'Deadline',dueDate:'2026-09-15',energyDemand:5},{checkin:{date:'2026-09-14',energy:1}})");
  assert.equal(decision.band,'must');
  assert.equal(decision.reason,'deadline');
});

test('important fitting work and ordinary fitting work remain distinct bands',()=>{
  assert.equal(run("engineV2.stage({id:'i',title:'Belangrijk',necessity:4,energyDemand:2},{checkin:{date:'2026-09-14',energy:3}}).band"),'strong');
  assert.equal(run("engineV2.stage({id:'f',title:'Past',necessity:2,impact:2,energyDemand:2},{checkin:{date:'2026-09-14',energy:3}}).band"),'fit');
});

test('heavy low-priority work is deferred instead of rescued by a composite score',()=>{
  const decision=run("engineV2.stage({id:'h',title:'Zwaar',necessity:1,impact:1,energyDemand:5,mentalLoad:5,physicalLoad:5},{checkin:{date:'2026-09-14',energy:1}})");
  assert.equal(decision.band,'defer');
});

test('selection exposes bands and never emits a universal score',()=>{
  const result=run("engineV2.select([{id:'a',title:'A',dueDate:'2026-09-15'},{id:'b',title:'B',energyDemand:2},{id:'c',title:'C',energyDemand:5}],{checkin:{date:'2026-09-14',energy:3},orderIndex:()=>0})");
  assert.equal(result.buckets.must.length,1);
  assert.equal(result.buckets.fit.length,1);
  assert.equal(result.buckets.defer.length,1);
  for(const bucket of Object.values(result.buckets))for(const entry of bucket)assert.equal('score' in entry.decision,false);
});

test('legacy recommendation engine remains untouched and active Today adapter still points to it',()=>{
  const legacy=fs.readFileSync(path.join(__dirname,'..','js/features/recommendations.js'),'utf8');
  const today=fs.readFileSync(path.join(__dirname,'..','js/features/today.js'),'utf8');
  assert.match(legacy,/const score = priority \+ fit/);
  assert.match(today,/recommendationEngine\.profile/);
  assert.match(today,/recommendationEngine\.sets/);
  assert.doesNotMatch(today,/engineV2|decisionEngineV2/);
});
