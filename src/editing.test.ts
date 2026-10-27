import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_NODES} from './data';
import {applyPatches,layoutPatches,libraryProposal,proposalPatches,matchStyles,textTargets,colorTargets,validatePatches,changedPatches,roots} from './editing';
import {compileActionPlan,validateActionPlan,ActionStep} from './actionIntent';
import {gestureTouched,scopeElements,distinctCandidates,resolveScopeIds} from './gestureContext';
const cards=['hc1','hc2','hc3','hc4'];
const fixture=()=>structuredClone(MOCK_NODES);
const baseStep:ActionStep={action:'library',role:'all',layout:null,sourceId:null,token:null,property:null,value:null};
test('A library preview has real patches but cannot mutate targets, source, or product content',()=>{
 const nodes=fixture(),before=JSON.stringify(nodes),p=libraryProposal(cards,nodes),patches=proposalPatches(p,p.mappings.map(m=>m.id),nodes),after=applyPatches(nodes,patches);
 assert.equal(JSON.stringify(nodes),before);assert.equal(after.find(n=>n.id==='hc1-cta')!.bg,'#4f46e5');assert.equal(after.find(n=>n.id==='hc1')!.radius,12);
 assert.deepEqual(after.filter(n=>n.library),nodes.filter(n=>n.library));assert.deepEqual(after.filter(n=>n.screen!=='Home'),nodes.filter(n=>n.screen!=='Home'));
 for(const n of after){const original=nodes.find(o=>o.id===n.id)!;for(const key of ['text','label','parent','role','component'] as const)assert.equal(n[key],original[key]);}
 const repeat=libraryProposal(cards,after);assert.equal(changedPatches(after,proposalPatches(repeat,repeat.mappings.map(m=>m.id),after)).length,0);
});
test('Library mappings are individually optional and are sourced from objects in the file',()=>{
 const nodes=fixture(),lib=nodes.find(n=>n.id==='ds-product-card')!;lib.radius=19;
 const p=libraryProposal(cards,nodes),after=applyPatches(nodes,proposalPatches(p,['cards'],nodes));assert.equal(after.find(n=>n.id==='hc1')!.radius,19);assert.equal(after.find(n=>n.id==='hc1-cta')!.bg,nodes.find(n=>n.id==='hc1-cta')!.bg);
});
test('Style sources and targets remain separate; matching preserves text, prices and images',()=>{
 const nodes=fixture(),before=JSON.stringify(nodes),p=matchStyles(cards,nodes,'ds-product-card'),after=applyPatches(nodes,proposalPatches(p,p.mappings.map(m=>m.id),nodes));
 assert.equal(JSON.stringify(nodes),before);assert.equal(after.find(n=>n.id==='hc2-cta')!.bg,'#4f46e5');assert.equal(after.find(n=>n.id==='hc2-title')!.text,'Minimalist Desk Lamp');assert.equal(after.find(n=>n.id==='hc2-img')!.bg,nodes.find(n=>n.id==='hc2-img')!.bg);assert.equal(p.sourceId,'ds-product-card');assert.deepEqual(p.targetIds,cards);
 assert.throws(()=>validatePatches(nodes,cards,[{id:'sc1',changes:{bg:'#ffffff'}}]));assert.throws(()=>validatePatches(nodes,cards,[{id:'ds-product-card',changes:{radius:0}}]));assert.throws(()=>validatePatches(nodes,cards,[{id:'hc1-title',changes:{text:'Overwritten'}}]));
});
test('Typography and CTA colors resolve semantic descendants without touching sibling roles',()=>{
 const nodes=fixture(),titles=textTargets(cards,nodes,'productTitle');assert.equal(titles.length,4);assert.ok(titles.every(n=>n.role==='productTitle'));
 const ctas=colorTargets(cards,nodes,'primaryCTA');assert.equal(ctas.length,4);assert.ok(ctas.every(n=>n.type==='button'&&n.role!=='favorite'));
 const plan=compileActionPlan({title:'Semibold titles',steps:[{...baseStep,action:'typography',role:'productTitle',property:'fontWeight',value:'700'}]},cards,nodes);const after=applyPatches(nodes,plan.mappings.flatMap(m=>m.patches));assert.equal(after.find(n=>n.id==='hc1-title')!.fontWeight,'700');assert.equal(after.find(n=>n.id==='hc1-price')!.fontWeight,nodes.find(n=>n.id==='hc1-price')!.fontWeight);
});
test('All eleven layout operations move descendants together and reject broken constraints',()=>{
 for(const op of ['left','center','right','top','middle','bottom','horizontal','vertical','width','height','spacing'] as const){const nodes=fixture();const ids=op==='vertical'?['sc1','sc2','sc3','sc4']:['hc1','hc2'];const patches=layoutPatches(ids,nodes,op),after=applyPatches(nodes,patches);for(const id of ids){const root=after.find(n=>n.id===id)!,old=nodes.find(n=>n.id===id)!;const child=after.find(n=>n.id===`${id}-title`)!,oldChild=nodes.find(n=>n.id===child.id)!;assert.equal(child.x-root.x,oldChild.x-old.x);assert.equal(child.y-root.y,oldChild.y-old.y);}}
 assert.throws(()=>layoutPatches(['hc1','sc1'],MOCK_NODES,'left'),/same parent/);assert.throws(()=>layoutPatches(cards,MOCK_NODES,'horizontal'),/overlap/);
 const nodes=fixture();nodes.find(n=>n.id==='hc2')!.w=40;assert.throws(()=>layoutPatches(['hc2','hc1'],nodes,'width'),/outside/);
});
test('Even spacing repairs an irregular two-dimensional grid and is idempotent',()=>{
 const nodes=fixture();for(const n of nodes)if(n.id==='hc2'||n.parent==='hc2')n.x+=5;const after=applyPatches(nodes,layoutPatches(cards,nodes,'spacing'));assert.equal(after.find(n=>n.id==='hc2')!.x,after.find(n=>n.id==='hc4')!.x);assert.equal(changedPatches(after,layoutPatches(cards,after,'spacing')).length,0);
 assert.deepEqual(roots(['hc1','hc1-title','hc2'],nodes).map(n=>n.id),['hc1','hc2']);
});
test('AI edit plans are allowlisted, selection-bound and never execute arbitrary content',()=>{
 const nodes=fixture();assert.throws(()=>validateActionPlan({title:'Oops',steps:[{...baseStep,action:'eval',value:'alert(1)'}]},nodes));assert.throws(()=>compileActionPlan({title:'Oops',steps:[{...baseStep,action:'matchStyles',sourceId:'invented'}]},cards,nodes));assert.throws(()=>compileActionPlan({title:'Oops',steps:[{...baseStep,action:'typography',property:'fontSize',value:'NaN'}]},cards,nodes));
 const p=compileActionPlan({title:'Brand CTAs',steps:[{...baseStep,action:'color',role:'primaryCTA',token:'Primary',property:'bg'}]},cards,nodes);assert.equal(p.mappings[0].patches.length,4);assert.ok(p.mappings[0].patches.every(p=>cards.some(id=>p.id===`${id}-cta`)));
});
test('Scope eligibility retains gesture hierarchy and only broadens after scope changes',()=>{
 const touched=gestureTouched([{x:100,y:450},{x:420,y:450}],MOCK_NODES);assert.ok(touched.includes('hc1'));assert.ok(touched.includes('hc2'));
 const eligible=scopeElements(['hc1-title'],MOCK_NODES,'exemplars');assert.ok(eligible.some(n=>n.id==='hc1-cta'));assert.ok(!eligible.some(n=>n.id==='hc2-title'));
 assert.ok(scopeElements(['hc1-title'],MOCK_NODES,'screen').every(n=>n.screen==='Home'));assert.ok(scopeElements(['hc1-title'],MOCK_NODES,'document').some(n=>n.id==='chk-place-order-cta'));assert.ok(!scopeElements(['hc1-title'],MOCK_NODES,'document').some(n=>n.library));
 assert.equal(distinctCandidates([{elementIds:['hc1','hc2']},{elementIds:['hc2','hc1']},{elementIds:['hc1-title']}]).length,2);
});

test('AI-chosen semantic granularity resolves every eligible instance, while touched and mixed groups stay exact',()=>{
 const screen=scopeElements(['hc1-img','hc2-img'],MOCK_NODES,'screen'),file=scopeElements(['hc1-cta'],MOCK_NODES,'document');
 assert.deepEqual(resolveScopeIds(['hc1','hc2'],screen,'screen'),cards);
 assert.equal(resolveScopeIds(['hc1-cta'],file,'document').length,15);
 assert.deepEqual(resolveScopeIds(['hc1-title','hc1-price'],file,'document'),['hc1-title','hc1-price']);
 assert.deepEqual(resolveScopeIds(['hc1','hc1-img'],screen,'exemplars'),['hc1']);
});

test('AI proposal presentation names real operations and retains the separate library source',()=>{
 const p=compileActionPlan({title:'Match hc1 and hc2',steps:[baseStep]},cards,MOCK_NODES);assert.equal(p.sourceId,'ds-product-card');assert.ok(!p.title.includes('hc1'));assert.equal(new Set(p.mappings.map(m=>m.id)).size,p.mappings.length);
});
