const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const storage = fs.readFileSync(path.join(root, 'js/core/storage.js'), 'utf8');
const capture = fs.readFileSync(path.join(root, 'js/features/capture.js'), 'utf8');

test('domain relations live outside immutable legacy storage keys', () => {
  assert.match(storage, /const\s+DOMAIN_KEYS\s*=\s*Object\.freeze/);
  assert.match(storage, /relations:\s*'lumiDomainRelations'/);
  const legacyBlock = storage.slice(storage.indexOf('const KEYS'), storage.indexOf('const CAPTURE_KEYS'));
  assert.doesNotMatch(legacyBlock, /lumiDomainRelations/);
});

test('relations use typed refs instead of a universal item model', () => {
  assert.match(storage, /function createDomainRef\(type,id\)/);
  assert.match(storage, /function createDomainRelation/);
  assert.match(storage, /kind:relationKind,from:fromRef,to:toRef/);
  assert.doesNotMatch(storage, /class\s+Item\b|function\s+createItem\b/);
});

test('capture provenance is represented as an explicit relation', () => {
  assert.match(capture, /kind:'derived-from'/);
  assert.match(capture, /type:'raw-capture'/);
  assert.match(capture, /linkRawCaptureTo\('inbox'/);
  assert.match(capture, /linkRawCaptureTo\('bucket-item'/);
});
