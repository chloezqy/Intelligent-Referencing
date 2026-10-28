import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MOCK_NODES} from './data';
import {localComparison} from './comparisonSides';
import {ruleBasedRecommendations,validateRecommendations} from './comparisonRecommendations';
import {resolveComparison,editableDifferences} from './comparisonResolution';
import {proposalPatches,applyPatches} from './editing';
import PropertyComparison from './components/PropertyComparison';
const context=(a:string,b:string)=>localComparison('A',[a,b],'comparison',MOCK_NODES);
test('Similar cards separate potential radius inconsistency from intentional layout and content differences',()=>{
 const c=context('hc1','sc2'),r=ruleBasedRecommendations(c,MOCK_NODES);
 assert.equal(r.find(r=>r.key==='radius')!.category,'suggested');assert.equal(r.find(r=>r.key==='dimensions')!.category,'review');assert.equal(r.find(r=>r.key==='label')!.category,'informational');assert.ok(r.every(r=>r.source==='rule-based'));
 const prices=ruleBasedRecommendations(context('hc1-price','hc2-price'),MOCK_NODES);assert.equal(prices.find(r=>r.key==='text')!.reason,'content_specific');
});
test('Image sizing is technically editable even when semantic recommendations differ',()=>{
 const image=context('hc1-img','sc2-img'),mixed=context('hc1-img','sc2-cta');
 assert.ok(editableDifferences(image,MOCK_NODES).includes('dimensions'));assert.equal(ruleBasedRecommendations(image,MOCK_NODES).find(r=>r.key==='dimensions')!.category,'review');
 assert.ok(editableDifferences(mixed,MOCK_NODES).includes('dimensions'));assert.equal(ruleBasedRecommendations(mixed,MOCK_NODES).find(r=>r.key==='dimensions')!.category,'informational');
 const before=JSON.stringify(MOCK_NODES),proposal=resolveComparison(mixed,MOCK_NODES,['dimensions'],'B'),patches=proposalPatches(proposal,proposal.mappings.map(m=>m.id),MOCK_NODES),after=applyPatches(MOCK_NODES,patches);
 assert.equal(after.find(n=>n.id==='hc1-img')!.w,MOCK_NODES.find(n=>n.id==='sc2-cta')!.w);assert.equal(JSON.stringify(MOCK_NODES),before);assert.deepEqual(applyPatches(MOCK_NODES,[]),MOCK_NODES);assert.deepEqual(proposalPatches(proposal,[],MOCK_NODES),[]);
 assert.throws(()=>resolveComparison(mixed,MOCK_NODES,['text'],'A'));
});
test('Classification cannot invent keys, actions, values, duplicate rows or freeform explanations',()=>{
 const row={key:'dimensions',category:'informational',reason:'different_roles'};
 assert.equal(validateRecommendations([row],['dimensions'])[0].source,'model');
 for(const invalid of [[{...row,key:'invented'}],[{...row,action:'resize'}],[{...row,value:999}],[{...row,reason:'use 99px'}],[row,row],[]])assert.throws(()=>validateRecommendations(invalid,['dimensions']));
 // A recommendation never changes technical editability or preselects an operation.
 const c=context('hc1','sc2'),keys=editableDifferences(c,MOCK_NODES);validateRecommendations([{...row,key:'radius'}],['radius']);assert.deepEqual(editableDifferences(c,MOCK_NODES),keys);
});
test('Every recorded difference is visible and counted, with rule-based labels and manual Resolve controls',()=>{
 const c=context('hc1','sc2'),html=renderToStaticMarkup(React.createElement(PropertyComparison,{ownership:c,contextId:'c',ids:['hc1','sc2'],nodes:MOCK_NODES,expanded:true,visual:true,selectedKeys:[],onSelectedKeys:()=>{}})),r=ruleBasedRecommendations(c,MOCK_NODES);
 assert.equal((html.match(/data-summary-property=/g)||[]).length,r.length);assert.match(html,new RegExp(`${r.length} recorded differences`));assert.match(html,/Analyzing differences…/);assert.doesNotMatch(html,/Analyze again with AI|AI recommendations/);assert.match(html,/Resolve Dimensions/);assert.match(html,/Review recommended/);assert.doesNotMatch(html,/AI recommendations|checked=""/);
});
