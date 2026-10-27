import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TASKS,evaluateAttempt,ResearchAttempt,TaskLevel} from './research';
import {MOCK_NODES} from './data';
import {applyPatches,libraryProposal,proposalPatches,layoutPatches} from './editing';
const attempt=(level:TaskLevel):ResearchAttempt=>({id:'attempt',level,startedAt:'2026-10-27',baseline:structuredClone(MOCK_NODES),events:[]});
function select(a:ResearchAttempt,ids:string[]){a.events.push({id:'s',type:'selection',at:'now',ids,method:'conventional'});}
function action(a:ResearchAttempt){a.events.push({id:'a',type:'action_applied',at:'now',ids:TASKS[a.level-1].targets});}
test('Task 1 requires exactly four category chips; both selection methods qualify',()=>{
 for(const method of ['conventional','smart-ref']){const a=attempt(1);select(a,TASKS[0].targets.slice(1));assert.equal(evaluateAttempt(a,[]).complete,false);select(a,[...TASKS[0].targets,'hc1']);assert.equal(evaluateAttempt(a,[]).complete,false);select(a,TASKS[0].targets);a.events.at(-1)!.method=method;assert.equal(evaluateAttempt(a,[]).complete,true);}
});
test('Task 2 verifies final grid geometry; action events and previews cannot fake completion',()=>{
 const a=attempt(2),ids=TASKS[1].targets;select(a,ids);assert.equal(evaluateAttempt(a,[]).complete,false);action(a);
 const irregular=structuredClone(MOCK_NODES);for(const n of irregular)if(n.id==='hc2'||n.parent==='hc2')n.x+=6;assert.equal(evaluateAttempt(a,[],irregular).complete,false);const after=applyPatches(irregular,layoutPatches(ids,irregular,'spacing'));assert.equal(evaluateAttempt(a,[],after).complete,true);
});
test('Task 3 requires correct buttons, a new matching fill, and unchanged content',()=>{
 const a=attempt(3),ids=TASKS[2].targets;select(a,ids);action(a);assert.equal(evaluateAttempt(a,[]).complete,false);const after=applyPatches(MOCK_NODES,ids.map(id=>({id,changes:{bg:'#ff0000'}})));assert.equal(evaluateAttempt(a,[],after).complete,true);after.find(n=>n.id===ids[0])!.text='Changed';assert.equal(evaluateAttempt(a,[],after).complete,false);
});
for(const level of [4,5] as const)test(`Task ${level}: library state and exact production targets required`,()=>{
 const a=attempt(level),ids=TASKS[level-1].targets;select(a,ids);action(a);assert.equal(evaluateAttempt(a,[]).complete,false);const proposal=libraryProposal(ids,MOCK_NODES),after=applyPatches(MOCK_NODES,proposalPatches(proposal,proposal.mappings.map(m=>m.id),MOCK_NODES));assert.equal(evaluateAttempt(a,[],after).complete,true);select(a,[...ids,'home-chip-0']);assert.equal(evaluateAttempt(a,[],after).complete,false);
});
test('Whole-file research excludes read-only library examples and includes checkout CTAs',()=>{assert.equal(TASKS[4].targets.length,15);assert.ok(TASKS[4].targets.includes('chk-place-order-cta'));assert.ok(!TASKS[4].targets.includes('ds-product-card-cta'));});
