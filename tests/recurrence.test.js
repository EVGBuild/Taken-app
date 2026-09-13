const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const context=vm.createContext({Date,Intl,console,t:key=>key});
for(const file of ['js/utils/dates.js','js/utils/formatting.js','js/core/task-model.js','js/features/checkin.js']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
}
const run=source=>vm.runInContext(source,context);

test('completion is anchored to the actual completion date',()=>{
  const result=run(`completeTaskOccurrence({title:'Kattenbakken geheel verschonen',context:'household',repeat:{enabled:true,every:3,unit:'months'},completionCount:0,completionHistory:[]},{completedDate:'2026-09-07'})`);
  assert.equal(result.recurrence.lastCompletedDate,'2026-09-07');
  assert.equal(result.recurrence.nextDate,'2026-12-07');
  assert.equal(result.repeat.lastDone,'2026-09-07');
  assert.equal(result.repeat.nextDue,'2026-12-07');
  assert.deepEqual(Array.from(result.completionHistory),['2026-09-07']);
  assert.equal(run(`getTaskRelevance(${JSON.stringify(result)},{today:'2026-09-07'}).actionable`),false);
});

for(const[name,every,unit,completed,expected]of[
  ['daily',1,'days','2026-09-07','2026-09-08'],
  ['weekly',1,'weeks','2026-09-07','2026-09-14'],
  ['monthly',1,'months','2026-09-07','2026-10-07'],
  ['monthly at month end',1,'months','2026-01-31','2026-02-28'],
  ['yearly at leap day',1,'years','2024-02-29','2025-02-28']
])test(`${name} recurrence calculates one next occurrence`,()=>{
  const result=run(`completeTaskOccurrence({repeat:{enabled:true,every:${every},unit:'${unit}'},completionCount:0,completionHistory:[]},{completedDate:'${completed}'})`);
  assert.equal(result.recurrence.nextDate,expected);assert.equal(result.completionCount,1);assert.equal(result.completionHistory.length,1);
});

test('one-time task keeps normal completion semantics',()=>{const result=run(`completeTaskOccurrence({title:'Losse taak',completionCount:0,completionHistory:[]},{completedDate:'2026-09-07'})`);assert.equal(result.done,true);assert.equal(result.lifecycle.state,'completed')});

test('household and recurrence are independent classifications',()=>{
  assert.equal(run(`isHouseholdTask({context:'household',repeat:{enabled:true,every:1,unit:'weeks'}})`),true);
  assert.equal(run(`isHouseholdTask({context:'general',repeat:{enabled:true,every:1,unit:'weeks'}})`),false);
  assert.equal(run(`normalizeTaskModel({type:'household'}).context`),'household');
});

test('legacy localStorage task shapes remain readable without data loss',()=>{
  const result=run(`normalizeTaskModel({id:'legacy',text:'Oude taak',repeat:{enabled:true,every:2,unit:'weeks',lastDone:'2026-08-01',nextDue:'2026-08-15'},blocker:{enabled:false}})`);
  assert.equal(result.recurrence.interval,2);assert.equal(result.recurrence.lastCompletedDate,'2026-08-01');assert.equal(result.repeat.nextDue,'2026-08-15');assert.equal(result.context,'general');
});

test('future occurrence is inactive until its due date',()=>{const task=`{context:'household',repeat:{enabled:true,every:1,unit:'weeks',lastDone:'2026-09-07',nextDue:'2026-09-14'}}`;assert.equal(run(`getTaskRelevance(${task},{today:'2026-09-08'}).actionable`),false);assert.equal(run(`getTaskRelevance(${task},{today:'2026-09-14'}).actionable`),true)});

test('energy input accepts exactly levels 1 through 5',()=>{for(let level=1;level<=5;level++)assert.equal(run(`normalizeEnergyLevel(${level})`),level);for(const invalid of [0,6,-1,2.5,'bad',null])assert.equal(run(`normalizeEnergyLevel(${JSON.stringify(invalid)})`),null)});

test('Vault search normalization keeps items findable',()=>{const indexed=run(`normalizeSearchText('Café kattenbak','Huishouden')`);assert.equal(indexed.includes('cafe'),true);assert.equal(indexed.includes('kattenbak'),true);assert.equal(indexed.includes('huishouden'),true)});
