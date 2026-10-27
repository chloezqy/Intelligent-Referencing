import test from 'node:test';
import assert from 'node:assert/strict';
import {semanticSuggestionPresentation} from './semanticSuggestionPresentation';
import {SemanticCandidate} from './semanticInterpretation';
import {UIElement} from './types';
const candidate:SemanticCandidate={id:'mock',label:'A lengthy model explanation about the function of these selected controls across multiple contexts',reason:'These controls share the same wishlist action across different shopping screens and contexts.',elementIds:['fav1','fav2'],evidenceIds:['fav1'],source:'model',level:'semantic'};
const nodes:UIElement[]=[{id:'fav1',type:'button',role:'favorite',screen:'Search',label:'Save',x:0,y:0,w:20,h:20},{id:'fav2',type:'button',role:'favorite',screen:'Favorites',label:'Saved',x:0,y:0,w:20,h:20}];
test('AI card summarizes validated objects and contexts without changing candidate data',()=>{
 const before=JSON.stringify(candidate);
 const summary=semanticSuggestionPresentation(candidate,nodes);
 assert.equal(summary.title,'Matching favorite buttons');
 assert.equal(summary.context,'Search + Favorites');
 assert.equal(summary.count,2);
 assert.ok(summary.reason.split(/\s+/).length<=9);
 assert.equal(JSON.stringify(candidate),before);
});
test('mixed roles retain a bounded model title, unique screens, and exact target count',()=>{
 const summary=semanticSuggestionPresentation(candidate,[nodes[0],{...nodes[1],role:'primaryCTA',screen:'Search'}]);
 assert.equal(summary.title,'A lengthy model explanation about the…');
 assert.equal(summary.context,'Search');
 assert.equal(summary.count,2);
});
test('long unbroken text and technical IDs do not dominate the compact summary',()=>{
 const summary=semanticSuggestionPresentation({...candidate,label:'x'.repeat(250),reason:'fav1 relates to fav2 '+ 'y'.repeat(200)},[]);
 assert.ok(summary.title.length<=36);
 assert.ok(!summary.reason.includes('fav1'));
 assert.ok(!summary.reason.includes('fav2'));
 assert.equal(summary.context,'Selected design elements');
 assert.equal(summary.count,2);
});
test('short model titles keep their specific relationship instead of being replaced by a generic role',()=>{
 const summary=semanticSuggestionPresentation({...candidate,label:'Wishlist action across screens'},nodes);
 assert.equal(summary.title,'Wishlist action across screens');
});
