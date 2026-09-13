const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({ Date, Intl, console, t: (key) => key });
for (const file of ['js/utils/dates.js', 'js/core/task-model.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
}
const run = (source) => vm.runInContext(source, context);

test('legacy deadline, waiting and later fields map without removing their source fields', () => {
  const normalized = run(`normalizeTaskModel({
    id:'legacy', text:'Brontekst', custom:{keep:true},
    deadline:{enabled:true,date:'2026-09-30'},
    blocker:{enabled:true,text:'Sharon',availableFrom:'2026-09-20'}
  })`);
  assert.equal(normalized.id, 'legacy');
  assert.equal(normalized.text, 'Brontekst');
  assert.equal(normalized.custom.keep, true);
  assert.equal(normalized.dueDate, '2026-09-30');
  assert.equal(normalized.lifecycle.state, 'waiting');
  assert.equal(normalized.waitingFor, 'Sharon');
  assert.equal(normalized.followUpDate, '2026-09-20');

  const later = run("normalizeTaskModel({lifecycle:{state:'deferred',deferredUntil:'2026-10-01'}})");
  assert.equal(later.lifecycle.state, 'later');
  assert.equal(later.resurfaceDate, '2026-10-01');
});

test('waiting is not actionable but becomes attention on its follow-up date', () => {
  const before = run("getTaskRelevance({blocker:{enabled:true,text:'Ander'}},{today:'2026-09-19'})");
  assert.equal(before.actionable, false);
  assert.equal(before.attention, false);
  const due = run("getTaskRelevance({blocker:{enabled:true,text:'Ander',availableFrom:'2026-09-20'}},{today:'2026-09-20'})");
  assert.equal(due.actionable, false);
  assert.equal(due.attention, true);
});

test('Later stays out of action until the chosen resurface date', () => {
  const task = "{lifecycle:{state:'deferred',deferredUntil:'2026-10-01'}}";
  assert.equal(run(`getTaskRelevance(${task},{today:'2026-09-30'}).actionable`), false);
  assert.equal(run(`getTaskRelevance(${task},{today:'2026-10-01'}).actionable`), true);
});

test('waiting and later transitions are reversible without changing id or title', () => {
  const result = run(`(()=>{
    const task={id:'task-1',title:'Bel garage'};
    setTaskWaiting(task,{waitingFor:'Garage',followUpDate:'2026-09-20',today:'2026-09-13'});
    const waiting=JSON.parse(JSON.stringify(task));
    makeTaskActionable(task);
    setTaskLater(task,'2026-10-01');
    const later=JSON.parse(JSON.stringify(task));
    makeTaskActionable(task);
    return {waiting,later,open:task};
  })()`);
  for (const state of [result.waiting, result.later, result.open]) {
    assert.equal(state.id, 'task-1');
    assert.equal(state.title, 'Bel garage');
  }
  assert.equal(result.waiting.lifecycle.state, 'waiting');
  assert.equal(result.later.lifecycle.state, 'later');
  assert.equal(result.open.lifecycle.state, 'open');
});
