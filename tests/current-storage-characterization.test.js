const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class MemoryStorage {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function contextWith(values = {}) {
  const localStorage = new MemoryStorage(values);
  const context = vm.createContext({ localStorage });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/core/storage.js'), 'utf8'), context);
  return { context, localStorage, run: (source) => vm.runInContext(source, context) };
}

test('the sixteen persisted key names are a compatibility contract', () => {
  const { run } = contextWith();
  assert.deepEqual(Array.from(run('Object.values(KEYS)')), [
    'mijnTaken', 'lumiEnergy', 'lumiMorningCheckin', 'lumiProjects', 'lumiWishlist', 'lumiLists',
    'lumiIdeas', 'lumiInbox', 'lumiFinance', 'lumiDocuments', 'lumiActionDraft',
    'lumiWishlistDragTip', 'lumiFeedbackDraft', 'lumiSettings', 'lumiTodayOrder', 'lumiBucketlist',
  ]);
});

test('read returns stored falsey values and only falls back for null or invalid JSON', () => {
  const { run } = contextWith({ zero: '0', no: 'false', empty: '""', broken: '{' });
  assert.equal(run("read('zero', 9)"), 0);
  assert.equal(run("read('no', true)"), false);
  assert.equal(run("read('empty', 'fallback')"), '');
  assert.equal(run("read('missing', 'fallback')"), 'fallback');
  assert.equal(run("read('broken', 'fallback')"), 'fallback');
});

test('write persists the exact JSON representation expected by the current app', () => {
  const { run, localStorage } = contextWith();
  run("write('example', {title:'Taak', done:false, value:null})");
  assert.equal(localStorage.getItem('example'), '{"title":"Taak","done":false,"value":null}');
});

test('the StorageGateway keeps legacy localStorage as the only active product adapter', () => {
  const { run, localStorage } = contextWith({ original: '{"kept":true}' });
  assert.equal(run('storageGateway.activeAdapter'), 'legacy-localStorage');
  assert.equal(run("storageGateway.getRaw('original')"), '{"kept":true}');
  run("storageGateway.write('newValue', {ok:true})");
  assert.equal(localStorage.getItem('newValue'), '{"ok":true}');
  assert.equal(run("storageGateway.read('newValue').ok"), true);
});
