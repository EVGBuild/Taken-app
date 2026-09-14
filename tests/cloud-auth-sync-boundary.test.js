const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const files=['js/services/auth-service.js','js/services/sync-service.js','js/services/cloud-backup-service.js'];
const source=files.map(file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8')).join('\n');
const context=vm.createContext({console,structuredClone});
for(const file of files)vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
const run=expression=>vm.runInContext(expression,context);

test('auth service fails closed with no provider',async()=>{
  run('auth=createAuthService()');
  const status=await run('auth.status()');
  assert.equal(status.available,false);
  assert.equal(status.authenticated,false);
  assert.equal(status.provider,'unavailable');
  assert.equal((await run("auth.signIn({email:'a@example.test'})")).status,'unavailable');
});

test('auth provider can be swapped without changing consumer contract',async()=>{
  run(`authProvider={name:'auth-a',available:async()=>true,session:async()=>({userId:'u1'}),signIn:async input=>({status:'ok',session:{userId:'u1',email:input.email}}),signOut:async()=>({status:'ok'})};authWithProvider=createAuthService({provider:authProvider})`);
  const status=await run('authWithProvider.status()');
  const signedIn=await run("authWithProvider.signIn({email:'a@example.test'})");
  assert.equal(status.authenticated,true);
  assert.equal(signedIn.session.userId,'u1');
});

test('sync remains local-only with no provider',async()=>{
  run('sync=createSyncService()');
  const status=await run('sync.status()');
  assert.equal(status.mode,'local-only');
  assert.equal((await run("sync.push({records:[1]})")).status,'unavailable');
});

test('bidirectional sync is blocked until an explicit conflict strategy exists',async()=>{
  run(`syncProvider={name:'sync-a',available:async()=>true,pull:async()=>({status:'ok',snapshot:{records:['remote']},remoteVersion:'r1'}),push:async()=>({status:'ok',remoteVersion:'r2'})};unsafeSync=createSyncService({provider:syncProvider})`);
  const blocked=await run("unsafeSync.bidirectional({records:['local']})");
  assert.equal(blocked.status,'blocked');
  assert.equal(blocked.reason,'conflict-strategy-required');
});

test('sync conflict resolver only returns a preview and does not auto-apply it',async()=>{
  run(`resolver=async({local,remote})=>({records:[...local.records,...remote.records]});safeSync=createSyncService({provider:syncProvider,conflictResolver:resolver})`);
  const result=await run("safeSync.bidirectional({records:['local']})");
  assert.equal(result.status,'preview');
  assert.equal(JSON.stringify(result.snapshot.records),JSON.stringify(['local','remote']));
});

test('cloud backup is an optional remote copy and restore is preview-only',async()=>{
  run('cloud=createCloudBackupService()');
  assert.equal((await run('cloud.status()')).available,false);
  run(`cloudProvider={name:'cloud-a',available:async()=>true,createBackup:async()=>({status:'ok',backupId:'b1'}),listBackups:async()=>({status:'ok',backups:[{id:'b1'}]}),readBackup:async()=>({status:'ok',snapshot:{records:[1]}})};cloudReady=createCloudBackupService({provider:cloudProvider})`);
  const backup=await run("cloudReady.createBackup({records:[1]})");
  const preview=await run("cloudReady.restorePreview('b1')");
  assert.equal(backup.backupId,'b1');
  assert.equal(preview.snapshot.records[0],1);
});

test('service boundaries contain no vendor, storage, billing, UI or direct network implementation',()=>{
  assert.doesNotMatch(source,/supabase|firebase|aws|azure|google cloud|icloud|stripe|openai|anthropic/i);
  assert.doesNotMatch(source,/localStorage|indexedDB|StorageGateway|\bfetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(source,/document\.|window\.|innerHTML|renderHome|recommendationEngine|createDecisionEngineV2/);
});
