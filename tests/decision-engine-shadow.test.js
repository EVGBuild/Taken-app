const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const context=vm.createContext({Date,Intl,console,t:key=>key});
for(const file of ['js/utils/dates.js','js/core/task-model.js','js/features/recommendations.js','js/features/decision-engine-v2.js','js/features/decision-engine-shadow.js']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
}
const run=source=>vm.runInContext(source,context);
run("legacy=createRecommendationEngine({todayKey:()=> '2026-09-14'});v2=createDecisionEngineV2({todayKey:()=> '2026-09-14'});shadow=createDecisionEngineShadow({legacyEngine:legacy,v2Engine:v2})");

test('shadow comparison is diagnostic and exposes both visible selections',()=>{
  const result=run("shadow.compare([{id:'urgent',title:'Deadline',dueDate:'2026-09-15',energyDemand:5},{id:'fit',title:'Past',energyDemand:2},{id:'heavy',title:'Zwaar',necessity:1,impact:1,energyDemand:5}],{checkin:{date:'2026-09-14',energy:2},swappedIds:new Set(),orderIndex:()=>0})");
  assert.ok(Array.isArray(result.legacyVisibleIds));
  assert.ok(Array.isArray(result.v2VisibleIds));
  assert.ok(Array.isArray(result.differences));
  assert.equal(result.rows.length,3);
  assert.equal(result.rows.find(row=>row.id==='urgent').v2Band,'must');
});

test('comparison does not mutate task records',()=>{
  const result=run(`(()=>{const actions=[{id:'a',title:'Bewaar mij',energyDemand:2,custom:{x:1}}];const before=JSON.stringify(actions);shadow.compare(actions,{checkin:{date:'2026-09-14',energy:3},swappedIds:new Set(),orderIndex:()=>0});return{before,after:JSON.stringify(actions)}})()`);
  assert.equal(result.after,result.before);
});

test('shadow module has no persistence or rendering side effects',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','js/features/decision-engine-shadow.js'),'utf8');
  assert.doesNotMatch(source,/\bwrite\s*\(|\bremove\s*\(|localStorage|indexedDB/i);
  assert.doesNotMatch(source,/renderHome\s*\(|showScreen\s*\(|innerHTML|appendChild/);
});

test('Today remains on the legacy recommendation engine',()=>{
  const today=fs.readFileSync(path.join(__dirname,'..','js/features/today.js'),'utf8');
  assert.match(today,/recommendationEngine\.profile/);
  assert.match(today,/recommendationEngine\.sets/);
  assert.doesNotMatch(today,/decisionEngineShadow|decisionEngineV2/);
});
