import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_NODES} from './data';
import {tokenFacts,exactTokenSuggestions,validateTokenSuggestions,tokenProposal} from './designSystemReferencing';
import {applyPatches,proposalPatches} from './editing';
import {localComparison} from './comparisonSides';
import {demoShare,freshDemo} from './demoCollaboration';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import DesignSystemReview,{SharedTokenSuggestions} from './components/DesignSystemReview';
test('Library facts use recorded properties, relevant component roles and exact color matches',()=>{
 const facts=tokenFacts(['hc1'],MOCK_NODES);assert.ok(facts.some(f=>f.tokenId==='ds-product-card'&&f.property==='radius'));
 assert.ok(facts.every(f=>MOCK_NODES.find(n=>n.id===f.targetId)?.[f.property]!==undefined));
 assert.ok(!facts.some(f=>f.tokenId==='ds-property-2'));
 assert.ok(!facts.some(f=>f.tokenLabel.startsWith('Color / ')&&!f.exact));
 const partial=tokenFacts(['hc1-img'],MOCK_NODES);assert.ok(partial.length<facts.length);assert.ok(!partial.some(f=>f.property==='fontSize'));
 assert.deepEqual(tokenFacts(['statusbar-home'],MOCK_NODES),[]);assert.deepEqual(tokenFacts(['missing'],MOCK_NODES),[]);assert.deepEqual(tokenFacts(['ds-product-card'],MOCK_NODES),[]);
});
test('Model choices cannot invent token IDs, properties, values, duplicate target properties or stale evidence',()=>{
 const facts=tokenFacts(['hc1'],MOCK_NODES),fact=facts.find(f=>!f.exact)!;
 const suggestion={fact,source:'model',reason:'Corresponding product card library style.'};assert.equal(validateTokenSuggestions([suggestion],facts).length,1);
 for(const invalid of [{...fact,tokenId:'invented'},{...fact,proposed:999},{...fact,property:'x'}])assert.throws(()=>validateTokenSuggestions([{...suggestion,fact:invalid}],facts));
 assert.throws(()=>validateTokenSuggestions([suggestion,suggestion],facts));
 const changed=applyPatches(MOCK_NODES,[{id:fact.targetId,changes:{[fact.property]:fact.proposed}}]);assert.throws(()=>tokenProposal([suggestion] as any,['hc1'],changed));
});
test('Token review compiles selected properties only; preview is immutable and application uses exact values',()=>{
 const facts=tokenFacts(['hc1'],MOCK_NODES),fact=facts.find(f=>!f.exact)!;
 const selected=[{fact,source:'model' as const,reason:'Corresponding component property.'}];
 const proposal=tokenProposal(selected,['hc1'],MOCK_NODES),patches=proposalPatches(proposal,proposal.mappings.map(m=>m.id),MOCK_NODES);
 const before=MOCK_NODES,preview=applyPatches(before,patches);assert.notEqual(preview.find(n=>n.id===fact.targetId)?.[fact.property],before.find(n=>n.id===fact.targetId)?.[fact.property]);
 assert.deepEqual(applyPatches(before,patches),preview);
 assert.throws(()=>tokenProposal(exactTokenSuggestions(facts),['hc1'],MOCK_NODES));
});
test('Same-user comparison shares only checked token properties without applying them; old comparisons remain valid',()=>{
 const comparison=localComparison('A',['hc1','sc1'],'tokens',MOCK_NODES),fact=tokenFacts(['hc1','sc1'],MOCK_NODES).find(f=>!f.exact)!;
 comparison.tokenSuggestions=[{fact,source:'model',reason:'Existing corresponding component style.'}];
 const room=demoShare(freshDemo(),{elementIds:['hc1','sc1'],exemplarIds:['hc1'],scope:'document',label:'Compare',comparison},'Compare','Review this proposal','tokens-share');
 assert.deepEqual(room.references[0].comparison?.tokenSuggestions,comparison.tokenSuggestions);assert.equal(MOCK_NODES.find(n=>n.id===fact.targetId)?.[fact.property],fact.current);
 const html=renderToStaticMarkup(React.createElement(SharedTokenSuggestions,{suggestions:comparison.tokenSuggestions,nodes:MOCK_NODES}));assert.match(html,/AI suggestion/);assert.ok(html.includes(fact.tokenLabel));
});

test('Design system review omits the explanatory sentence and manual AI trigger',()=>{
 const html=renderToStaticMarkup(React.createElement(DesignSystemReview,{ids:['hc1'],nodes:MOCK_NODES,onPropose:()=>{},onSelected:()=>{}}));
 assert.doesNotMatch(html,/Selected objects →|Changes are optional|Suggest relevant tokens/);
 const empty=renderToStaticMarkup(React.createElement(DesignSystemReview,{ids:[],nodes:MOCK_NODES,onPropose:()=>{},onSelected:()=>{}}));assert.match(empty,/No recorded properties support a library match/);
});
