const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function activeProductScripts() {
  return [...indexHtml.matchAll(/<script\s+src=["']\.\/(js\/[^"']+?\.js)(?:\?[^"']*)?["']/g)]
    .map(match => match[1]);
}

test('active product scripts access localStorage only through js/core/storage.js', () => {
  const scripts = activeProductScripts();
  assert.ok(scripts.includes('js/core/storage.js'), 'storage gateway must be loaded by index.html');

  const bypasses = scripts
    .filter(file => file !== 'js/core/storage.js')
    .filter(file => /\blocalStorage\b/.test(fs.readFileSync(path.join(root, file), 'utf8')));

  assert.deepEqual(
    bypasses,
    [],
    `Direct localStorage access found outside the active storage boundary: ${bypasses.join(', ')}`
  );
});

test('the active storage contract exposes read, write and remove through the gateway', () => {
  const source = fs.readFileSync(path.join(root, 'js/core/storage.js'), 'utf8');
  assert.match(source, /function\s+read\s*\(/);
  assert.match(source, /function\s+write\s*\(/);
  assert.match(source, /function\s+remove\s*\(/);
  assert.match(source, /storageGateway\.removeRaw\s*\(/);
});
