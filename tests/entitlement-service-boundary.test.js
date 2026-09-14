const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','js/services/entitlement-service.js'),'utf8');
const context=vm.createContext({console,Object});
vm.runInContext(source,context,{filename:'js/services/entitlement-service.js'});
const run=expression=>vm.runInContext(expression,context);

test('core local capability remains available without billing provider',async()=>{
  run('service=createEntitlementService()');
  assert.equal(await run('service.has(ENTITLEMENTS.CORE_LOCAL)'),true);
  assert.equal(await run('service.has(ENTITLEMENTS.AI_ASSIST)'),false);
  const snapshot=await run('service.snapshot()');
  assert.equal(snapshot.status,'local');
  assert.equal(snapshot.provider,'none');
});

test('provider snapshots translate into product capabilities without exposing provider concepts',async()=>{
  run(`provider={name:'billing-a',getEntitlements:async()=>({entitlements:{aiAssist:true,cloudSync:true,cloudBackup:false},updatedAt:'2026-09-14T10:00:00Z'})};service=createEntitlementService({provider})`);
  const snapshot=await run('service.snapshot()');
  assert.equal(snapshot.entitlements.aiAssist,true);
  assert.equal(snapshot.entitlements.cloudSync,true);
  assert.equal(snapshot.entitlements.cloudBackup,false);
  assert.equal(snapshot.entitlements.coreLocal,true);
  assert.equal(snapshot.updatedAt,'2026-09-14T10:00:00Z');
});

test('billing provider cannot disable local core',async()=>{
  run(`provider={name:'billing-b',getEntitlements:async()=>({coreLocal:false,aiAssist:true})};service=createEntitlementService({provider})`);
  assert.equal(await run('service.has(ENTITLEMENTS.CORE_LOCAL)'),true);
});

test('provider failure fails closed for paid capabilities but preserves local core',async()=>{
  run(`provider={name:'offline',getEntitlements:async()=>{const error=new Error('offline');error.code='OFFLINE';throw error}};service=createEntitlementService({provider})`);
  const snapshot=await run('service.snapshot()');
  assert.equal(snapshot.status,'unavailable');
  assert.equal(snapshot.entitlements.coreLocal,true);
  assert.equal(snapshot.entitlements.cloudSync,false);
  assert.equal(snapshot.errorCode,'OFFLINE');
});

test('unknown capabilities are rejected centrally',async()=>{
  run('service=createEntitlementService()');
  assert.equal(await run("service.has('madeUpPremiumFlag')"),false);
  const explanation=await run("service.explain('madeUpPremiumFlag')");
  assert.equal(explanation.known,false);
  assert.equal(explanation.allowed,false);
});

test('entitlement boundary has no billing vendor, storage, network or product-engine dependency',()=>{
  assert.doesNotMatch(source,/stripe|paddle|revenuecat|supabase|firebase/i);
  assert.doesNotMatch(source,/localStorage|indexedDB|StorageGateway|\bfetch\s*\(|XMLHttpRequest/);
  assert.doesNotMatch(source,/recommendationEngine|createDecisionEngineV2|createAIService|createSyncService/);
});
