/**
 * Provider-independent entitlement boundary.
 *
 * Product code asks this service whether a capability is available. Billing
 * providers may later translate purchases/subscriptions into entitlement
 * snapshots, but provider concepts never become product rules.
 */
const ENTITLEMENTS=Object.freeze({
  CORE_LOCAL:'coreLocal',
  AI_ASSIST:'aiAssist',
  CLOUD_SYNC:'cloudSync',
  CLOUD_BACKUP:'cloudBackup',
  EXTENDED_STORAGE:'extendedStorage'
});

function createEntitlementService({provider=null,base=null}={}){
  const baseline=Object.freeze({
    [ENTITLEMENTS.CORE_LOCAL]:true,
    [ENTITLEMENTS.AI_ASSIST]:false,
    [ENTITLEMENTS.CLOUD_SYNC]:false,
    [ENTITLEMENTS.CLOUD_BACKUP]:false,
    [ENTITLEMENTS.EXTENDED_STORAGE]:false,
    ...(base||{})
  });

  function normalizeSnapshot(snapshot){
    const source=snapshot&&typeof snapshot==='object'?snapshot:{};
    const values={...baseline};
    for(const key of Object.values(ENTITLEMENTS)){
      if(Object.prototype.hasOwnProperty.call(source,key))values[key]=source[key]===true;
    }
    // The local core is never disabled by billing state.
    values[ENTITLEMENTS.CORE_LOCAL]=true;
    return Object.freeze(values);
  }

  async function snapshot(){
    if(!provider||typeof provider.getEntitlements!=='function'){
      return{status:'local',provider:'none',entitlements:normalizeSnapshot(null),updatedAt:null};
    }
    try{
      const remote=await provider.getEntitlements();
      return{
        status:'ok',
        provider:String(provider.name||'custom'),
        entitlements:normalizeSnapshot(remote?.entitlements||remote),
        updatedAt:remote?.updatedAt||null
      };
    }catch(error){
      return{
        status:'unavailable',
        provider:String(provider.name||'custom'),
        entitlements:normalizeSnapshot(null),
        updatedAt:null,
        errorCode:String(error?.code||'ENTITLEMENT_PROVIDER_UNAVAILABLE')
      };
    }
  }

  async function has(capability){
    if(!Object.values(ENTITLEMENTS).includes(capability))return false;
    const current=await snapshot();
    return current.entitlements[capability]===true;
  }

  async function explain(capability){
    if(!Object.values(ENTITLEMENTS).includes(capability)){
      return{capability,known:false,allowed:false,reason:'unknown-capability'};
    }
    const current=await snapshot();
    return{
      capability,
      known:true,
      allowed:current.entitlements[capability]===true,
      reason:current.entitlements[capability]===true?'entitled':'not-entitled',
      source:current.provider,
      status:current.status
    };
  }

  return{snapshot,has,explain,capabilities:ENTITLEMENTS};
}
