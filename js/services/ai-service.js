/**
 * Provider-independent AI application service.
 *
 * AI is optional in LumiVault. This boundary never owns core product rules,
 * storage, user corrections, or provenance history. Concrete vendors plug in
 * through a provider adapter later.
 */
const AI_CAPABILITIES=Object.freeze({
  INTERPRET_CAPTURE:'interpret-capture',
  ENRICH_RECORD:'enrich-record',
  SUGGEST_RELATIONS:'suggest-relations',
  EXPLAIN_DECISION:'explain-decision',
  SUMMARIZE:'summarize'
});

function createUnavailableAIProvider(){
  return Object.freeze({
    name:'unavailable',
    capabilities:[],
    available:async()=>false,
    invoke:async()=>({status:'unavailable'})
  });
}

function normalizeAIProvider(provider){
  const source=provider||createUnavailableAIProvider();
  if(typeof source.invoke!=='function')throw new TypeError('AI provider must implement invoke(request)');
  const capabilities=Array.isArray(source.capabilities)?source.capabilities.slice():[];
  return Object.freeze({
    name:String(source.name||'anonymous'),
    capabilities:Object.freeze(capabilities),
    available:typeof source.available==='function'?source.available:async()=>true,
    invoke:source.invoke
  });
}

function createAIService({provider}={}){
  const adapter=normalizeAIProvider(provider);

  async function status(){
    let available=false;
    try{available=!!(await adapter.available());}catch{available=false;}
    return{provider:adapter.name,available,capabilities:adapter.capabilities.slice()};
  }

  async function run(capability,input,{context={},requestId=null}={}){
    if(!Object.values(AI_CAPABILITIES).includes(capability)){
      return{status:'unsupported',provider:adapter.name,capability,output:null,provenance:{source:'ai-service',requestId}};
    }
    const current=await status();
    if(!current.available||!adapter.capabilities.includes(capability)){
      return{status:'unavailable',provider:adapter.name,capability,output:null,provenance:{source:'ai-service',requestId}};
    }
    const request=Object.freeze({capability,input:structuredCloneSafe(input),context:structuredCloneSafe(context),requestId});
    try{
      const response=await adapter.invoke(request);
      return{
        status:response?.status==='ok'?'ok':'error',
        provider:adapter.name,
        capability,
        output:response?.status==='ok'?structuredCloneSafe(response.output):null,
        confidence:Number.isFinite(Number(response?.confidence))?Number(response.confidence):null,
        provenance:{source:'ai-provider',provider:adapter.name,requestId,model:response?.model||null}
      };
    }catch(error){
      return{status:'error',provider:adapter.name,capability,output:null,errorCode:error?.code||'AI_PROVIDER_ERROR',provenance:{source:'ai-provider',provider:adapter.name,requestId}};
    }
  }

  return Object.freeze({provider:adapter.name,status,run,capabilities:adapter.capabilities.slice()});
}

function structuredCloneSafe(value){
  if(value==null)return value;
  if(typeof structuredClone==='function')return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
