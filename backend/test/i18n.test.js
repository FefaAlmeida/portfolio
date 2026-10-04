import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';
import { geminiTranslate, reconcileEntry, translationBudget } from '../src/translate.js';
const block = (id, text) => ({ type: 'paragraph', attrs: { i18nId: id }, content: [{ type: 'text', text }] });
const doc = (...blocks) => ({ type: 'doc', content: blocks });
const translator = (calls) => async (units) => {
  calls.push(structuredClone(units));
  const walk = value => typeof value === 'string' ? `EN:${value}` : Array.isArray(value) ? value.map(walk) : value?.type === 'text' ? { ...value, text: `EN:${value.text}` } : value?.content ? { ...value, content: value.content.map(walk) } : value;
  return units.map(walk);
};
test('manual target edits leave source unchanged, survive reorder/deletion, and only changed unprotected blocks translate', async () => {
  const calls = [];
  const translate = translator(calls);
  const original = { titulo: 'Projeto', descricao: doc(block('a', 'Primeiro'), block('b', 'Segundo')) };
  let pair = await reconcileEntry({ kind:'projetos', sourceLocale:'pt-BR', editedLocale:'pt-BR', newPayload:original, translate });
  assert.equal(calls.length, 1);
  const originalSource = structuredClone(pair.pt);
  const target = structuredClone(pair.en);
  target.descricao.content[0].content[0].text = 'My custom introduction';
  pair = await reconcileEntry({ kind:'projetos', sourceLocale:'pt-BR', editedLocale:'en-US', oldPt:pair.pt, oldEn:pair.en, newPayload:target, translate });
  assert.deepEqual(pair.pt, originalSource);
  assert.equal(calls.length, 1);
  const next = { ...pair.pt, descricao:doc(block('b','Segundo'), block('a','Primeiro alterado'), block('c','Terceiro')) };
  pair = await reconcileEntry({ kind:'projetos', sourceLocale:'pt-BR', editedLocale:'pt-BR', oldPt:pair.pt, oldEn:pair.en, newPayload:next, protectedUnits:pair.protectedUnits, translate });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].length, 1);
  assert.equal(calls[1][0].attrs.i18nId, 'c');
  assert.equal(pair.en.descricao.content[1].content[0].text, 'My custom introduction');
  assert.deepEqual(pair.pendingUnits, ['descricao.content.@a']);
  const without = { ...pair.pt, descricao:doc(block('b','Segundo'), block('c','Terceiro')) };
  pair = await reconcileEntry({ kind:'projetos', sourceLocale:'pt-BR', editedLocale:'pt-BR', oldPt:pair.pt, oldEn:pair.en, newPayload:without, protectedUnits:pair.protectedUnits, pendingUnits:pair.pendingUnits, translate });
  assert.equal(calls.length, 2);
  assert.equal(pair.en.descricao.content.at(-1).content[0].text, 'My custom introduction');
  assert.deepEqual(pair.pendingUnits, ['descricao.content.@a']);
});
test('English source items translate toward Portuguese; manual deletion remains protected', async () => {
  const calls=[]; const translate=translator(calls);
  let pair=await reconcileEntry({kind:'experiencias',sourceLocale:'en-US',editedLocale:'en-US',newPayload:{titulo:'Title',descricao:doc(block('a','Text'))},translate});
  assert.equal(pair.en.titulo,'Title'); assert.equal(pair.pt.titulo,'EN:Title');
  pair=await reconcileEntry({kind:'experiencias',sourceLocale:'en-US',editedLocale:'pt-BR',oldPt:pair.pt,oldEn:pair.en,newPayload:{...pair.pt,descricao:doc()},translate});
  const changed={...pair.en,descricao:doc(block('a','Changed'))};
  pair=await reconcileEntry({kind:'experiencias',sourceLocale:'en-US',editedLocale:'en-US',oldPt:pair.pt,oldEn:pair.en,newPayload:changed,protectedUnits:pair.protectedUnits,translate});
  assert.equal(pair.pt.descricao.content.length,0);assert.deepEqual(pair.pendingUnits,['descricao.content.@a']);assert.equal(calls.length,1);
});
test('no-op saves, status changes and unchanged media never invoke translation', async () => {
  const translate=()=>{throw new Error('Unexpected charge');};
  const oldPt={titulo:'Projeto',descricao:doc(block('a','Texto')),tagDireita:'EM DESENVOLVIMENTO'};
  const oldEn={titulo:'Project',descricao:doc(block('a','Text')),tagDireita:'EM DESENVOLVIMENTO'};
  const paired=await reconcileEntry({kind:'projetos',sourceLocale:'pt-BR',editedLocale:'pt-BR',oldPt,oldEn,newPayload:{...oldPt,tagDireita:'FINALIZADO'},translate});
  assert.equal(paired.en.titulo,'Project'); assert.equal(paired.en.tagDireita,'FINALIZADO');
});
test('Gemini only receives text leaves, cache avoids charges and formatting/URLs never depend on model output', async (t) => {
  const db=openDatabase(':memory:');t.after(()=>db.close());let calls=0;
  const config={geminiApiKey:'test-key',i18nUsdBrlRate:7};
  t.mock.method(globalThis,'fetch',async (_url, init)=>{
    calls++;const body=JSON.parse(init.body);const data=JSON.parse(body.contents[0].parts[0].text);
    assert.deepEqual(data.texts,['Olá']);
    return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'["Hello"]'}]}}],usageMetadata:{promptTokenCount:10,candidatesTokenCount:5,thoughtsTokenCount:1}}));
  });
  const input=block('a','Olá');input.content[0].marks=[{type:'link',attrs:{href:'https://example.org',target:'_blank'}}];
  const options={from:'pt-BR',to:'en-US',glossary:'Keep brand names.'};
  const result=await geminiTranslate(db,config,[input],options);
  assert.equal(result[0].content[0].text,'Hello');assert.deepEqual(result[0].content[0].marks,input.content[0].marks);assert.equal(result[0].attrs.i18nId,'a');
  await geminiTranslate(db,config,[input],options);assert.equal(calls,1);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM translation_usage').get().n,1);
  await geminiTranslate(db,config,[input],{...options,glossary:'Changed'});assert.equal(calls,2);
});
test('budget blocks before HTTP, retains uncertain charges, and renews on calendar anniversary', async(t)=>{
  const db=openDatabase(':memory:');t.after(()=>db.close());const config={geminiApiKey:'test',i18nUsdBrlRate:7};
  let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw new Error('Network failure');});
  await assert.rejects(geminiTranslate(db,config,['Texto'],{from:'pt-BR',to:'en-US'}),{status:503});
  assert.equal(db.prepare('SELECT status FROM translation_usage').get().status,'uncertain');assert.ok(translationBudget(db,config).usedBrl>0);
  db.prepare("INSERT INTO translation_usage(created_at,reserved_usd_micros,status,usd_brl_rate,request_key) VALUES(?,12000000,'reserved',7,'full')").run(new Date().toISOString());
  await assert.rejects(geminiTranslate(db,config,['Outro'],{from:'pt-BR',to:'en-US'}),{status:402});assert.equal(calls,1);
  db.prepare("UPDATE i18n_settings SET value=? WHERE key='budget_started_at'").run(String(Date.parse('2024-02-29T12:00:00Z')));
  const cycle=translationBudget(db,config,Date.parse('2025-03-01T00:00:00Z'));
  assert.equal(cycle.cycleStartedAt,'2025-02-28T12:00:00.000Z');assert.equal(cycle.cycleEndsAt,'2026-02-28T12:00:00.000Z');
});
test('malformed/truncated Gemini responses fail closed and keep the incurred charge',async(t)=>{
 const db=openDatabase(':memory:');t.after(()=>db.close());
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'["Hi"]'}]}}],usageMetadata:{promptTokenCount:10,candidatesTokenCount:5}})));
 await assert.rejects(geminiTranslate(db,{geminiApiKey:'test',i18nUsdBrlRate:7},['Olá'],{from:'pt-BR',to:'en-US'}),{status:503});
 assert.ok(db.prepare('SELECT actual_usd_micros FROM translation_usage').get().actual_usd_micros>0);
});

test('secondary-language profile removal never removes source profiles, and source removal preserves manual profiles',async()=>{
 const profile={categoria:'admin',nome:'Administrador',funcionalidades:['Gerenciar']};
 const oldPt={titulo:'Projeto',detalhes:{perfis:[profile]}};
 const oldEn={titulo:'Project',detalhes:{perfis:[{...profile,nome:'Manager',funcionalidades:['Manage everything']}]}};
 const translate=()=>{throw new Error('Unexpected translation');};
 const removed=await reconcileEntry({kind:'projetos',sourceLocale:'pt-BR',editedLocale:'en-US',oldPt,oldEn,newPayload:{...oldEn,detalhes:{perfis:[]}},translate});
 assert.deepEqual(removed.pt,oldPt);
 const retained=await reconcileEntry({kind:'projetos',sourceLocale:'pt-BR',editedLocale:'pt-BR',oldPt,oldEn,newPayload:{...oldPt,detalhes:{perfis:[]}},protectedUnits:['detalhes.perfis.@admin.funcionalidades'],translate});
 assert.deepEqual(retained.en.detalhes.perfis,oldEn.detalhes.perfis);
 assert.deepEqual(retained.pendingUnits,['detalhes.perfis.@admin.funcionalidades']);
});
test('new secondary-language media shares the asset without copying the caption into the source',async()=>{
 const oldPt={titulo:'Projeto',midias:[],detalhes:{perfis:[]}};const oldEn={...oldPt,titulo:'Project'};
 const result=await reconcileEntry({kind:'projetos',sourceLocale:'pt-BR',editedLocale:'en-US',oldPt,oldEn,newPayload:{...oldEn,midias:[{assetId:'asset-one',alt:'English alt',legenda:'English caption'}]},translate:()=>{throw new Error('Unexpected call');}});
 assert.equal(result.pt.midias[0].assetId,'asset-one');assert.equal(result.pt.midias[0].alt,'');assert.equal(result.pt.midias[0].legenda,'');assert.equal(result.en.midias[0].legenda,'English caption');
});
