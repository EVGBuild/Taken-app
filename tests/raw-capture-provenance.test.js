const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const storage = fs.readFileSync(path.join(root, 'js/core/storage.js'), 'utf8');
const capture = fs.readFileSync(path.join(root, 'js/features/capture.js'), 'utf8');
const consolidation = fs.readFileSync(path.join(root, 'js/features/consolidation.js'), 'utf8');

test('raw capture data has a dedicated non-legacy storage namespace', () => {
  assert.match(storage, /const\s+CAPTURE_KEYS\s*=\s*Object\.freeze/);
  assert.match(storage, /raw:\s*'lumiRawCaptures'/);
  const legacyBlock = storage.slice(storage.indexOf('const KEYS'), storage.indexOf('const CAPTURE_KEYS'));
  assert.doesNotMatch(legacyBlock, /lumiRawCaptures/);
});

test('user text is durably persisted before classification', () => {
  assert.match(capture, /universalCaptureText'\)\.addEventListener\('input'/);
  assert.match(capture, /persistRawCapture/);
  assert.match(capture, /write\(CAPTURE_KEYS\.raw,records\)/);
  const submit = capture.match(/universalCaptureForm'\)\.onsubmit=([^\n]+)/)?.[1] || '';
  assert.ok(submit.indexOf('persistRawCapture') < submit.indexOf("open('captureTypeOverlay')"), 'raw capture must be written before type selection opens');
});

test('unknown remains a first-class unresolved capture path', () => {
  assert.doesNotMatch(consolidation, /capture-type=\\?"unknown\\?"\]\?\.remove/);
  assert.match(capture, /type==='unknown'/);
  assert.match(capture, /status:type==='unknown'\?'unresolved':'classified'/);
  assert.match(capture, /rawCaptureId/);
});
