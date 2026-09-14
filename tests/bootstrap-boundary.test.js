const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'js/core/bootstrap.js'), 'utf8');

function bootstrapDataBody() {
  const start = source.indexOf('function loadBootstrapData(){');
  const end = source.indexOf('\n}\n\nconst bootstrapData=loadBootstrapData();', start);
  assert.notEqual(start, -1, 'bootstrap must expose a dedicated persisted-data loading seam');
  assert.notEqual(end, -1, 'bootstrap data loading seam must have a stable explicit boundary');
  return source.slice(start, end + 2);
}

test('persisted product reads are owned by the bootstrap data seam', () => {
  const body = bootstrapDataBody();
  const reads = [...source.matchAll(/\bread\(KEYS\./g)].length;
  const seamReads = [...body.matchAll(/\bread\(KEYS\./g)].length;

  assert.ok(reads > 0, 'bootstrap should still load persisted data');
  assert.equal(seamReads, reads, 'persisted reads leaked outside loadBootstrapData');
});

test('bootstrap data loading does not own DOM or navigation wiring', () => {
  const body = bootstrapDataBody();
  assert.doesNotMatch(body, /\bdocument\b|querySelector|addEventListener|showScreen|render[A-Z]/);
});

test('mutable runtime state is initialized from the explicit bootstrap data result', () => {
  assert.match(source, /const bootstrapData=loadBootstrapData\(\);/);
  for (const name of ['actions','projects','wishlist','bucketlist','lists','ideas','inbox','financeItems','documents','appSettings','energy','checkin','feedbackDraft']) {
    assert.match(source, new RegExp(`${name}=bootstrapData\\.${name}`), `${name} must initialize from bootstrapData`);
  }
});
