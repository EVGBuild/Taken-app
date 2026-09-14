const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const context=vm.createContext({Date,Intl,console,t:key=>key});
for(const file of ['js/utils/dates.js','js/core/task-model.js','js/features/recommendations.js','js/features/decision-engine-v2.js','js/features/decision-engine-activation.js']){
  let source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  if(file.endsWith('recommendations.js'))source=source.replace(/document\.write\([^\n]+\);/g,'');
  vm.runInContext(source,context,{filename:file});
}
const run=source=>vm.runInContext(source,context);
run("legacy=createRecommendationEngine({todayKey:()=> '2026-09-14'});v2=createDecisionEngineV2({todayKey:()=> '2026-09-14'});adapter=createDecisionEngineAdapter({legacyEngine:legacy,v2Engine:v2,initialMode:'v2'})");

test('adapter starts on v2 and exposes Today-compatible sets',()=>{
  const result=run("adapter.sets([{id:'a',title:'Past',energyDemand:2}],{checkin:{date:'2026-09-14',energy:3},swappedIds:new Set(),orderIndex:()=>0,broaden:false})");
  assert.equal(run('adapter.mode()'),'v2');
  assert.equal(result.visible.length,1);
  assert.equal(result.visible[0].item.id,'a');
  assert.ok('profile' in result.visible[0]);
});

test('legacy fallback remains immediately available without rebuilding the engine',()=>{
  assert.equal(run('adapter.useLegacy()'),'legacy');
  assert.equal(run('adapter.mode()'),'legacy');
  const legacyResult=run("adapter.profile({id:'a',title:'A',energyDemand:2},{checkin:{date:'2026-09-14',energy:3},dayLoad:0})");
  assert.equal('score' in legacyResult,true);
  assert.equal(run('adapter.useV2()'),'v2');
  const v2Result=run("adapter.profile({id:'a',title:'A',energyDemand:2},{checkin:{date:'2026-09-14',energy:3},dayLoad:0})");
  assert.equal('score' in v2Result,false);
});

test('bootstrap activates v2 but retains explicit legacy engine',()=>{
  const bootstrap=fs.readFileSync(path.join(__dirname,'..','js/core/bootstrap.js'),'utf8');
  assert.match(bootstrap,/const legacyRecommendationEngine = createRecommendationEngine/);
  assert.match(bootstrap,/const decisionEngineV2 = createDecisionEngineV2/);
  assert.match(bootstrap,/initialMode:'v2'/);
  assert.match(bootstrap,/const recommendationEngine = createDecisionEngineAdapter/);
});
