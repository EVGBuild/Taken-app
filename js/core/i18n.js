window.LUMI_LOCALES=window.LUMI_LOCALES||{};
if(!window.LUMI_LOCALES.nl||!window.LUMI_LOCALES.en){
  document.write('<script src="./js/i18n/locales/nl.js?v=1"><\/script><script src="./js/i18n/locales/en.js?v=1"><\/script>');
}

const LUMI_SUPPORTED_LOCALES=['nl','en'];
const LUMI_FALLBACK_LOCALE='nl';
const LUMI_TRANSLATIONS=window.LUMI_LOCALES;

function normalizeLumiLocale(code){
  const value=String(code||'').trim().toLowerCase();
  const base=value.split('-')[0];
  return LUMI_SUPPORTED_LOCALES.includes(base)?base:LUMI_FALLBACK_LOCALE;
}

function lumiLocale(){
  return normalizeLumiLocale(document.documentElement.lang||navigator.language||LUMI_FALLBACK_LOCALE);
}

function t(key,values={}){
  const locale=lumiLocale();
  const template=LUMI_TRANSLATIONS[locale]?.[key]??LUMI_TRANSLATIONS[LUMI_FALLBACK_LOCALE]?.[key]??key;
  return String(template).replace(/\{(\w+)\}/g,(_,name)=>values[name]??'');
}

function applyI18n(root=document){
  root.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=t(node.dataset.i18n)});
}
