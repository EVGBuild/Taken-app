/**
 * Provider-neutral authentication boundary.
 * No vendor SDK, storage or network implementation belongs here.
 */
function cloneAuthValue(value){return value==null?value:structuredClone(value)}
function createAuthService({provider=null}={}){
  const providerName=()=>String(provider?.name||'unavailable');
  async function status(){
    if(!provider)return{provider:'unavailable',available:false,authenticated:false,session:null};
    const available=typeof provider.available==='function'?!!(await provider.available()):true;
    if(!available)return{provider:providerName(),available:false,authenticated:false,session:null};
    const session=typeof provider.session==='function'?await provider.session():null;
    return{provider:providerName(),available:true,authenticated:!!session,session:cloneAuthValue(session)};
  }
  async function signIn(input={}){
    if(!provider||typeof provider.signIn!=='function')return{status:'unavailable',session:null,provider:providerName()};
    const result=await provider.signIn(cloneAuthValue(input));
    return{status:result?.status||'ok',session:cloneAuthValue(result?.session??null),provider:providerName()};
  }
  async function signOut(){
    if(!provider||typeof provider.signOut!=='function')return{status:'unavailable',provider:providerName()};
    const result=await provider.signOut();
    return{status:result?.status||'ok',provider:providerName()};
  }
  async function session(){return (await status()).session}
  return{status,signIn,signOut,session};
}
