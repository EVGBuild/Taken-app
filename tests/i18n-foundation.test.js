const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

function loadLocale(file){
  const context={window:{}};
  vm.createContext(context);
  vm.runInContext(read(file),context);
  return context.window.LUMI_LOCALES;
}

test('Dutch and English translations live in dedicated locale files with matching keys',()=>{
  const nl=loadLocale('js/i18n/locales/nl.js').nl;
  const en=loadLocale('js/i18n/locales/en.js').en;
  assert.ok(nl&&en);
  assert.deepEqual(Object.keys(nl).sort(),Object.keys(en).sort());
  assert.ok(Object.keys(nl).length>50,'locale foundation unexpectedly lost translation coverage');
});

test('application feature code does not mutate the translation registry',()=>{
  const consolidation=read('js/features/consolidation.js');
  assert.doesNotMatch(consolidation,/Object\.assign\(LUMI_TRANSLATIONS|LUMI_TRANSLATIONS\.(nl|en)\s*=/);
});

test('i18n core owns locale selection and fallback but not translation copy',()=>{
  const core=read('js/core/i18n.js');
  assert.match(core,/LUMI_SUPPORTED_LOCALES=\['nl','en'\]/);
  assert.match(core,/LUMI_FALLBACK_LOCALE='nl'/);
  assert.match(core,/normalizeLumiLocale/);
  assert.doesNotMatch(core,/'task\.load'|'energy\.question'|'purchase\.need'/);
});

test('unsupported locale codes fall back to Dutch at the locale boundary',()=>{
  const source=read('js/core/i18n.js');
  const functionMatch=source.match(/function normalizeLumiLocale\(code\)\{[\s\S]*?\n\}/);
  assert.ok(functionMatch,'normalizeLumiLocale must remain explicit');
  const context={LUMI_SUPPORTED_LOCALES:['nl','en'],LUMI_FALLBACK_LOCALE:'nl'};
  vm.createContext(context);
  vm.runInContext(`${functionMatch[0]};this.normalizeLumiLocale=normalizeLumiLocale;`,context);
  assert.equal(context.normalizeLumiLocale('en-GB'),'en');
  assert.equal(context.normalizeLumiLocale('nl-NL'),'nl');
  assert.equal(context.normalizeLumiLocale('de-DE'),'nl');
});
