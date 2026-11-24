import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_NODES} from './data';
import {categoryProposal,selectionStyleChanges,unevenSpacing} from './selectionAIActions';
import {applyPatches,proposalPatches,descendants} from './editing';
import {compileActionPlan,validateActionPlan,type ActionStep} from './actionIntent';
import {actionContext,actionPayload,parseActionOutput} from '../server/actionIntent';
const step:ActionStep={action:'appearance',role:'buttons',layout:null,sourceId:null,token:null,property:'radius',value:'999'};
test('library category application preserves all unselected properties and content',()=>{
 const ids=['hc1','hc2'],changes=selectionStyleChanges(ids,MOCK_NODES),p=categoryProposal(ids,MOCK_NODES,changes,['Colors','Corners']);
 const patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES),after=applyPatches(MOCK_NODES,patches);
 assert.ok(patches.length);assert.ok(patches.every(p=>Object.keys(p.changes).every(k=>['bg','color','border','radius'].includes(k))));
 const allowed=new Set(descendants(ids,MOCK_NODES).map(n=>n.id));
 for(const node of after){const original=MOCK_NODES.find(n=>n.id===node.id)!;if(!allowed.has(node.id))assert.deepEqual(node,original);for(const key of ['text','label','x','y','w','h','fontSize','spacing','token'])assert.equal(node[key],original[key]);}
 assert.throws(()=>categoryProposal(ids,MOCK_NODES,changes,[]));
 const stale=MOCK_NODES.map(n=>n.id===changes[0].targetId?{...n,[changes[0].property]:'changed'}:n);
 assert.throws(()=>categoryProposal(ids,stale,changes,[changes[0].category]));
});
test('source copying is scoped to chosen categories and leaves source untouched',()=>{
 const ids=['hc2'],changes=selectionStyleChanges(ids,MOCK_NODES,'sc1');assert.ok(changes.length);
 const p=categoryProposal(ids,MOCK_NODES,changes,['Corners'],'sc1'),patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES),after=applyPatches(MOCK_NODES,patches);
 assert.ok(patches.length);assert.ok(patches.every(p=>Object.keys(p.changes).every(k=>k==='radius')));
 assert.deepEqual(after.find(n=>n.id==='sc1'),MOCK_NODES.find(n=>n.id==='sc1'));
 assert.throws(()=>selectionStyleChanges(ids,MOCK_NODES,'hc2-title'));
});
test('uneven gap suggestion uses measured geometry and preserves endpoint positions',()=>{
 const nodes=[{id:'frame',type:'screen',x:0,y:0,w:500,h:500,label:'Frame'},...([0,62,132].map((x,i)=>({id:`n${i}`,type:'rect',x,y:10,w:50,h:50,label:'Rect',parent:'frame'})))] as typeof MOCK_NODES;
 const ids=['n0','n1','n2'],suggestion=unevenSpacing(ids,nodes)!;assert.deepEqual(suggestion.gaps,[12,20]);assert.equal(suggestion.gap,16);
 const after=applyPatches(nodes,suggestion.patches);assert.equal(after[2].x,66);assert.equal(after[1].x,0);assert.equal(after[3].x,132);assert.equal(unevenSpacing(ids,after),null);
 assert.equal(unevenSpacing(['n0','n1'],nodes),null);
});
test('pill-shaped AI command passes server schema and changes only selected nested buttons',()=>{
 const ids=['hc1','hc2'],plan={title:'Made buttons pill-shaped',steps:[step]},valid=validateActionPlan(plan,MOCK_NODES),proposal=compileActionPlan(valid,ids,MOCK_NODES);
 const patches=proposalPatches(proposal,proposal.mappings.map(m=>m.id),MOCK_NODES);assert.ok(patches.length);assert.ok(patches.every(p=>MOCK_NODES.find(n=>n.id===p.id)?.type==='button'&&p.changes.radius===999));
 const context=actionContext({contextId:'pill',targetIds:ids,instruction:'Make the buttons pill-shaped',document:MOCK_NODES});
 const payload=actionPayload(context,'fixture');assert.match(JSON.stringify(payload.text),/appearance/);assert.match(JSON.stringify(payload.text),/radius/);
 assert.deepEqual(parseActionOutput({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(plan)}]}]},context),plan);
 for(const value of ['NaN','-1','10000',''])assert.throws(()=>compileActionPlan({...plan,steps:[{...step,value}]},ids,MOCK_NODES));
 assert.throws(()=>compileActionPlan({...plan,steps:[{...step,property:'bg'}]},ids,MOCK_NODES));
});
