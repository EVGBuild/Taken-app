/**
 * Provider-neutral sync boundary.
 * Local data remains authoritative until a separate activation decision.
 * Bidirectional sync requires an explicit conflict strategy.
 */
const SYNC_MODES=Object.freeze({PUSH:'push',PULL_PREVIEW:'pull-preview',BIDIRECTIONAL:'bidirectional'});
function cloneSyncValue(value){return value==null?value:structuredClone(value)}
function createSyncService({provider=null,conflictResolver=null}={}){
  const providerName=()=>String(provider?.name||'unavailable');
  async function status(){
    if(!provider)return{provider:'unavailable',available:false,mode:'local-only'};
    const available=typeof provider.available==='function'?!!(await provider.available()):true;
    return{provider:providerName(),available,mode:available?'provider-ready':'local-only'};
  }
  async function push(snapshot,meta={}){
    if(!provider||typeof provider.push!=='function')return{status:'unavailable',provider:providerName()};
    const result=await provider.push({snapshot:cloneSyncValue(snapshot),meta:cloneSyncValue(meta)});
    return{status:result?.status||'ok',provider:providerName(),remoteVersion:result?.remoteVersion??null};
  }
  async function pullPreview(meta={}){
    if(!provider||typeof provider.pull!=='function')return{status:'unavailable',provider:providerName(),snapshot:null};
    const result=await provider.pull(cloneSyncValue(meta));
    return{status:result?.status||'ok',provider:providerName(),snapshot:cloneSyncValue(result?.snapshot??null),remoteVersion:result?.remoteVersion??null};
  }
  async function bidirectional(localSnapshot,meta={}){
    if(!conflictResolver)return{status:'blocked',reason:'conflict-strategy-required',provider:providerName(),snapshot:null};
    const remote=await pullPreview(meta);
    if(remote.status!=='ok')return remote;
    const merged=await conflictResolver({local:cloneSyncValue(localSnapshot),remote:cloneSyncValue(remote.snapshot),meta:cloneSyncValue(meta)});
    return{status:'preview',provider:providerName(),snapshot:cloneSyncValue(merged),remoteVersion:remote.remoteVersion};
  }
  return{status,push,pullPreview,bidirectional,modes:SYNC_MODES};
}
