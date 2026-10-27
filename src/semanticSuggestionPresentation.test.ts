import test from 'node:test';
import assert from 'node:assert/strict';
import {semanticSuggestionPresentation} from './semanticSuggestionPresentation';
import {SemanticCandidate} from './semanticInterpretation';
import {UIElement} from './types';
const candidate:SemanticCandidate={id:'mock',label:'Poor design consistency',reason:'A long model explanation with technical IDs fav1 and fav2.',elementIds:['fav1','fav2'],evidenceIds:['fav1'],source:'model',level:'semantic'};
const nodes:UIElement[]=[{id:'fav1',type:'button',role:'favorite',screen:'Search',label:'Save',x:0,y:0,w:20,h:20},{id:'fav2',type:'button',role:'favorite',screen:'Favorites',label:'Saved',x:0,y:0,w:20,h:20}];
test('AI cards describe actual objects instead of repeating model design judgments',()=>{
 const before=JSON.stringify(candidate);
 const summary=semanticSuggestionPresentation(candidate,nodes);
 assert.deepEqual(summary,{title:'Matching favorite buttons',context:'Search + Favorites',count:2});
 assert.equal(JSON.stringify(candidate),before);
 assert.ok(!('reason' in summary));
});
test('mixed roles describe the proposed selection, with unique screens and exact count',()=>{
 const summary=semanticSuggestionPresentation(candidate,[nodes[0],{...nodes[1],role:'primaryCTA',screen:'Search'}]);
 assert.equal(summary.title,'favorite buttons + primary actions');
 assert.equal(summary.context,'Search');
 assert.equal(summary.count,2);
});
test('unavailable objects never expose model explanations or technical IDs',()=>{
 const summary=semanticSuggestionPresentation(candidate,[]);
 assert.deepEqual(summary,{title:'Related design elements',context:'Selected design elements',count:2});
});
