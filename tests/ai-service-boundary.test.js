const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','js/services/ai-service.js'),'utf8');
const context=vm.createContext({console,structuredClone});
vm.runInContext(source,context,{filename:'js/services/ai-service.js'});
const run=expression=>vm.runInContext(expression,context);

test('AI service is usable with no provider and fails closed',async()=>{
  run('service=createAIService()');
  const status=await run('service.status()');
  assert.equal(status.provider,'unavailable');
  assert.equal(status.available,false);
  const result=await run("service.run(AI_CAPABILITIES.INTERPRET_CAPTURE,{text:'Ted trimmen'})");
  assert.equal(result.status,'unavailable');
  assert.equal(result.output,null);
});

test('provider adapters can be swapped without changing consumer calls',async()=>{
  run(`providerA={name:'provider-a',capabilities:[AI_CAPABILITIES.SUMMARIZE],available:async()=>true,invoke:async request=>({status:'ok',output:{summary:'A:'+request.input.text},confidence:.8,model:'a1'})}`);
  run(`providerB={name:'provider-b',capabilities:[AI_CAPABILITIES.SUMMARIZE],available:async()=>true,invoke:async request=>({status:'ok',output:{summary:'B:'+request.input.text},confidence:.9,model:'b1'})}`);
  run('serviceA=createAIService({provider:providerA});serviceB=createAIService({provider:providerB})');
  const a=await run("serviceA.run(AI_CAPABILITIES.SUMMARIZE,{text:'test'},{requestId:'r1'})");
  const b=await run("serviceB.run(AI_CAPABILITIES.SUMMARIZE,{text:'test'},{requestId:'r2'})");
  assert.equal(a.status,'ok');
  assert.equal(b.status,'ok');
  assert.equal(a.output.summary,'A:test');
  assert.equal(b.output.summary,'B:test');
  assert.equal(a.provenance.provider,'provider-a');
  assert.equal(b.provenance.provider,'provider-b');
});

test('capability checks happen at the service boundary',async()=>{
  run(`limited={name:'limited',capabilities:[AI_CAPABILITIES.SUMMARIZE],available:async()=>true,invoke:async()=>({status:'ok',output:'should-not-run'})};limitedService=createAIService({provider:limited})`);
  const unavailable=await run("limitedService.run(AI_CAPABILITIES.EXPLAIN_DECISION,{id:'x'})");
  const unsupported=await run("limitedService.run('invent-new-capability',{id:'x'})");
  assert.equal(unavailable.status,'unavailable');
  assert.equal(unsupported.status,'unsupported');
});

test('provider receives cloned inputs so it cannot mutate caller-owned data',async()=>{
  run(`mutating={name:'mutating',capabilities:[AI_CAPABILITIES.ENRICH_RECORD],available:async()=>true,invoke:async request=>{request.input.title='changed';return{status:'ok',output:{ok:true}}}};mutatingService=createAIService({provider:mutating})`);
  const result=await run(`(async()=>{const input={title:'original'};await mutatingService.run(AI_CAPABILITIES.ENRICH_RECORD,input);return input.title})()`);
  assert.equal(result,'original');
});

test('AI service contains no vendor, storage, billing or network implementation',()=>{
  assert.doesNotMatch(source,/openai|anthropic|gemini|supabase|stripe/i);
  assert.doesNotMatch(source,/localStorage|indexedDB|StorageGateway|\bfetch\s*\(|XMLHttpRequest/);
  assert.doesNotMatch(source,/recommendationEngine|createDecisionEngineV2|getTaskRelevance/);
});
