const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const navigation=fs.readFileSync(path.join(root,'js/core/navigation.js'),'utf8');

test('connected vault builds a typed cross-domain index',()=>{
  assert.match(navigation,/function connectedVaultIndex\(\)/);
  ['task','project','wishlist','list','idea','bucket-item','inbox','finance','document'].forEach(type=>assert.match(navigation,new RegExp(`connectedVaultRecord\\('${type}'`)));
  assert.match(navigation,/ref:createDomainRef\(type,id\)/);
});

test('connected vault search returns relation context',()=>{
  assert.match(navigation,/function searchConnectedVault\(query\)/);
  assert.match(navigation,/relations:domainRelationsFor\(record\.ref\)/);
});

test('vault visual search uses content matches instead of collection names only',()=>{
  assert.match(navigation,/function filterVaultCollections\(query\)/);
  assert.match(navigation,/matchedCollections/);
  assert.match(navigation,/filterVaultCollections\(\$\('vaultVisualSearch'\)\.value\)/);
});
