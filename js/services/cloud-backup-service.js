/**
 * Optional cloud-backup boundary.
 * Backups are remote copies, never the local product source of truth.
 */
function cloneCloudValue(value){return value==null?value:structuredClone(value)}
function createCloudBackupService({provider=null}={}){
  const providerName=()=>String(provider?.name||'unavailable');
  async function status(){
    if(!provider)return{provider:'unavailable',available:false};
    const available=typeof provider.available==='function'?!!(await provider.available()):true;
    return{provider:providerName(),available};
  }
  async function createBackup(snapshot,meta={}){
    if(!provider||typeof provider.createBackup!=='function')return{status:'unavailable',provider:providerName(),backupId:null};
    const result=await provider.createBackup({snapshot:cloneCloudValue(snapshot),meta:cloneCloudValue(meta)});
    return{status:result?.status||'ok',provider:providerName(),backupId:result?.backupId??null,createdAt:result?.createdAt??null};
  }
  async function listBackups(){
    if(!provider||typeof provider.listBackups!=='function')return{status:'unavailable',provider:providerName(),backups:[]};
    const result=await provider.listBackups();
    return{status:result?.status||'ok',provider:providerName(),backups:cloneCloudValue(result?.backups||[])};
  }
  async function restorePreview(backupId){
    if(!provider||typeof provider.readBackup!=='function')return{status:'unavailable',provider:providerName(),snapshot:null};
    const result=await provider.readBackup(String(backupId||''));
    return{status:result?.status||'ok',provider:providerName(),snapshot:cloneCloudValue(result?.snapshot??null),backupId:String(backupId||'')};
  }
  return{status,createBackup,listBackups,restorePreview};
}
