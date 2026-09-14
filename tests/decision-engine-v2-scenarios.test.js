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
const compare=(actions,energy=3)=>run(`shadow.compare(${JSON.stringify(actions)},{checkin:{date:'2026-09-14',energy:${energy}},swappedIds:new Set(),orderIndex:()=>0})`);

test('low capacity: light fitting task stays visible while heavy optional work is deferred',()=>{
  const result=compare([
    {id:'light',title:'Kort telefoontje',energyDemand:1,durationExplicit:true,duration:10,necessity:2,impact:2},
    {id:'heavy',title:'Hele kast uitzoeken',energyDemand:5,mentalLoad:5,physicalLoad:4,necessity:1,impact:1}
  ],1);
  assert.equal(result.rows.find(row=>row.id==='light').v2Band,'fit');
  assert.equal(result.rows.find(row=>row.id==='light').v2Visible,true);
  assert.equal(result.rows.find(row=>row.id==='heavy').v2Band,'defer');
  assert.equal(result.rows.find(row=>row.id==='heavy').v2Visible,false);
});

test('deadline remains visible even when it exceeds current capacity',()=>{
  const result=compare([{id:'deadline',title:'Formulier vandaag regelen',dueDate:'2026-09-14',energyDemand:5,mentalLoad:5,necessity:3}],1);
  const row=result.rows[0];
  assert.equal(row.v2Band,'must');
  assert.equal(row.v2Visible,true);
});

test('waiting and future Later items never leak into active suggestions',()=>{
  const result=compare([
    {id:'waiting',title:'Wachten op antwoord',lifecycle:{state:'waiting'}},
    {id:'later',title:'Later bekijken',lifecycle:{state:'later',resurfaceDate:'2026-10-01'}}
  ],3);
  for(const row of result.rows){assert.equal(row.v2Visible,false);assert.equal(row.legacyVisible,false);}
});

test('resurfaced Later item becomes eligible again',()=>{
  const result=compare([{id:'return',title:'Nu weer bekijken',lifecycle:{state:'later',resurfaceDate:'2026-09-14'},energyDemand:2}],3);
  const row=result.rows[0];
  assert.equal(row.v2Band,'fit');
  assert.equal(row.v2Visible,true);
});

test('important fitting task is separated from ordinary fitting task without a universal score',()=>{
  const result=compare([
    {id:'important',title:'Belangrijk regelen',necessity:4,impact:3,energyDemand:2},
    {id:'ordinary',title:'Gewoon klusje',necessity:2,impact:2,energyDemand:2}
  ],3);
  assert.equal(result.rows.find(row=>row.id==='important').v2Band,'strong');
  assert.equal(result.rows.find(row=>row.id==='ordinary').v2Band,'fit');
  assert.deepEqual(result.v2VisibleIds,['important','ordinary']);
});

test('known intentional difference: V2 does not let a strong task hide another fitting task through score-window pruning',()=>{
  const result=compare([
    {id:'dominant',title:'Zeer belangrijke deadline',dueDate:'2026-09-14',necessity:5,impact:5,energyDemand:2},
    {id:'fit',title:'Ook passend',necessity:2,impact:2,energyDemand:2}
  ],3);
  const fit=result.rows.find(row=>row.id==='fit');
  assert.equal(fit.v2Visible,true);
  assert.equal(fit.legacyVisible,false);
  assert.equal(fit.changedVisibility,true);
});
