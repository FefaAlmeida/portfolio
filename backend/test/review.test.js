import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageReview, completedDrafts } from '../src/review.js';
const doc = text => ({type:'doc',content:[{type:'paragraph',attrs:{i18nId:'stable'},content:[{type:'text',text}]}]});
const stage = (drafts,locale,payload) => stageReview({kind:'projetos',sourceLocale:'pt-BR',locale,payload,drafts,visibility:'publico'});
test('manual target block deletion survives unrelated source saves without source-language fallback',()=>{
 const source={titulo:'Título',descricao:doc('Português')};
 const target={titulo:'Title',descricao:{type:'doc',content:[]}};
 const state=stage({'pt-BR':source,'en-US':target},'pt-BR',{...source,tagDireita:'FINALIZADO'});
 assert.equal(state.units.length,0);
 assert.deepEqual(completedDrafts(state)['en-US'].descricao.content,[]);
 const changed=stage({'pt-BR':source,'en-US':target},'pt-BR',{...source,descricao:doc('Alterado')});
 assert.equal(changed.units.length,1);
 changed.units[0].proposal=doc('Changed').content[0];changed.units[0].status='approved';
 assert.equal(completedDrafts(changed)['en-US'].descricao.content[0].content[0].text,'Changed');
});
test('target-only captions and profiles never copy their English text into Portuguese',()=>{
 const source={titulo:'Título',detalhes:{perfis:[{categoria:'usuario',nome:'Leitor',funcionalidades:[]}]},midias:[]};
 const target={titulo:'Title',detalhes:{perfis:[]},midias:[]};
 const payload={...target,midias:[{assetId:'new-photo',alt:'English photo',legenda:'English caption'}]};
 const pair=completedDrafts(stage({'pt-BR':source,'en-US':target},'en-US',payload));
 assert.equal(pair['pt-BR'].detalhes.perfis[0].nome,'Leitor');
 assert.deepEqual(pair['en-US'].detalhes.perfis,[]);
 assert.equal(pair['pt-BR'].midias[0].legenda,'');
 assert.equal(pair['pt-BR'].midias[0].alt,'');
 assert.equal(pair['en-US'].midias[0].legenda,'English caption');
});
test('target-only rich text survives source no-op saves',()=>{
 const source={titulo:'Título',descricao:{type:'doc',content:[]}};
 const target={titulo:'Title',descricao:doc('An editorial addition')};
 const state=stage({'pt-BR':source,'en-US':target},'pt-BR',source);
 assert.equal(state.units.length,0);
 assert.equal(completedDrafts(state)['en-US'].descricao.content[0].content[0].text,'An editorial addition');
});
