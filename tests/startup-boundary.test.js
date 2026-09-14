const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ui = fs.readFileSync(path.join(__dirname, '..', 'js/core/ui.js'), 'utf8');
const init = fs.readFileSync(path.join(__dirname, '..', 'js/core/init.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('ui helpers do not trigger initial application rendering while loading', () => {
  assert.doesNotMatch(ui, /populateProjects\(\);refresh\(\);renderSettings\(\);/);
});

test('initial presentation rendering has one explicit init seam', () => {
  assert.match(init, /function initializeRuntimePresentation\(\)/);
  assert.match(init, /populateProjects\(\);/);
  assert.match(init, /refresh\(\);/);
  assert.match(init, /renderSettings\(\);/);
  assert.match(init, /initializeRuntimePresentation\(\);/);
});

test('init runs only after Today and task capture feature definitions are loaded', () => {
  const today = index.indexOf('./js/features/today.js');
  const taskCapture = index.indexOf('./js/features/task-capture.js');
  const initScript = index.indexOf('./js/core/init.js');
  assert.ok(today >= 0 && taskCapture >= 0 && initScript >= 0, 'required startup scripts must be present');
  assert.ok(today < initScript, 'Today must load before init');
  assert.ok(taskCapture < initScript, 'Task capture must load before init');
});
