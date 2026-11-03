import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_NODES} from './data';
import {COLORS} from './designSystem';
import {colorPalette,colorStyleFacts,colorStyleProposal,validateColorSuggestions} from './colorStyleMatching';
import {tokenContext,tokenPayload,parseTokenOutput} from '../server/designSystemReferencing';
import {applyPatches} from './editing';
test('complete real palette is offered for recorded color properties and excludes invented tokens',()=>{
 assert.deepEqual(colorPalette(MOCK_NODES).map(t=>t.value),Object.values(COLORS));
 const facts=colorStyleFacts(['hc2-title'],MOCK_NODES),palette=colorPalette(MOCK_NODES);
 for(const token of palette)assert.ok(facts.some(f=>f.tokenId===token.id&&f.property==='color'));
 const fact=facts[0],s={fact,source:'model' as const,reason:'Suitable text role'};
 assert.throws(()=>validateColorSuggestions([{...s,fact:{...fact,proposed:'#123456'}}],facts));
});
test('ranked palette recommendations allow alternatives, preserving order and real values',()=>{
 const context=tokenContext({contextId:'palette',targetIds:['hc2-title'],document:MOCK_NODES,properties:['colors'],colorPalette:true});
 const facts=context.facts.filter(f=>f.property==='color').slice(0,3);
 const output={status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions:facts.map(f=>({factId:f.id,reason:'Relevant role'}))})}]}]};
 const ranked=parseTokenOutput(output,context);assert.deepEqual(ranked.map(s=>s.fact.id),facts.map(f=>f.id));
 assert.match(tokenPayload(context,'fixture').instructions,/Rank up to three/);
});
test('manual palette override previews only chosen colors without changing content; exact styles are no-ops',()=>{
 const ids=['hc2-title'],facts=colorStyleFacts(ids,MOCK_NODES),fact=facts.find(f=>f.proposed===COLORS.Primary&&f.property==='color')!;
 const original=MOCK_NODES.find(n=>n.id===ids[0])!,proposal=colorStyleProposal([{fact,source:'deterministic',reason:'Manual'}],ids,MOCK_NODES),after=applyPatches(MOCK_NODES,proposal.mappings.flatMap(m=>m.patches)).find(n=>n.id===original.id)!;
 assert.equal(after.color,COLORS.Primary);assert.equal(after.text,original.text);assert.equal(after.fontSize,original.fontSize);assert.equal(original.color,MOCK_NODES.find(n=>n.id===original.id)!.color);
 const nodes=MOCK_NODES.map(n=>n.id===original.id?{...n,color:COLORS.Primary}:n),exact=colorStyleFacts(ids,nodes).find(f=>f.proposed===COLORS.Primary&&f.property==='color')!;
 assert.equal(colorStyleProposal([{fact:exact,reason:'Manual',source:'deterministic'}],ids,nodes).mappings.length,0);
});
