import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {validateDesignReference,DESIGN_REFERENCE_PURPOSE} from './collaboration';
import {MOCK_NODES} from './data';
import {localComparison} from './comparisonSides';
import {referenceProperties,unifiedReferenceProposal,unifiedPatches,referenceSharingContext} from './unifiedReference';
import {applyPatches,validatePatches} from './editing';
import {tokenFacts,type TokenSuggestion} from './designSystemReferencing';
import UnifiedReferenceWorkflow from './components/UnifiedReferenceWorkflow';
const pair=(nodes=MOCK_NODES)=>localComparison('A',['hc1','sc2'],'unified',nodes);
const noop=()=>{};
test('Only recorded compatible differing properties transfer; content stays informational',()=>{
 const c=pair(),props=referenceProperties(c,MOCK_NODES,'A');
 assert.ok(props.transferable.some(r=>r.key==='radius'));assert.ok(props.transferable.some(r=>r.key==='dimensions'));
 assert.ok(props.other.some(r=>r.key==='label'));assert.ok(!props.transferable.some(r=>['text','label','location'].includes(r.key)));
 const before=JSON.stringify(MOCK_NODES),p=unifiedReferenceProposal(c,MOCK_NODES,'A',['radius','dimensions'],[])!;
 const after=applyPatches(MOCK_NODES,unifiedPatches(p));assert.equal(JSON.stringify(MOCK_NODES),before);
 assert.deepEqual(after.find(n=>n.id==='hc1'),MOCK_NODES.find(n=>n.id==='hc1'));
 assert.equal(after.find(n=>n.id==='sc2')!.radius,16);assert.equal(after.find(n=>n.id==='sc2-title')!.text,MOCK_NODES.find(n=>n.id==='sc2-title')!.text);
 assert.equal(unifiedReferenceProposal(c,MOCK_NODES,'A',[],[]),null);
});
test('Swap changes only transfer direction and proposal target; missing values are never invented',()=>{
 const c=pair(),p=unifiedReferenceProposal(c,MOCK_NODES,'B',['radius'],[])!;
 assert.deepEqual(p.targetIds,['hc1']);assert.equal(unifiedPatches(p)[0].changes.radius,14);
 const nodes=MOCK_NODES.map(n=>n.id==='sc2'?{...n,radius:undefined}:n);
 assert.ok(!referenceProperties(pair(nodes),nodes,'A').transferable.some(r=>r.key==='radius'));
 assert.equal(unifiedReferenceProposal(pair(nodes),nodes,'A',['radius'],[]),null);
});
test('Library overrides affect only their layer/property and deselection restores reference-derived values',()=>{
 const nodes=MOCK_NODES.map(n=>n.id==='hc1'?{...n,radius:18,bg:'#112233'}:n.id==='sc2'?{...n,radius:14,bg:'#445566'}:n),c=pair(nodes);
 const fact=tokenFacts(['sc2'],nodes).find(f=>f.targetId==='sc2'&&f.property==='radius'&&!f.exact)!;assert.ok(fact);
 const override:TokenSuggestion={fact,source:'model',reason:'Existing library radius.'};
 const proposal=unifiedReferenceProposal(c,nodes,'A',['radius','background'],[override])!,after=applyPatches(nodes,unifiedPatches(proposal));
 assert.equal(after.find(n=>n.id==='sc2')!.radius,fact.proposed);assert.equal(after.find(n=>n.id==='sc2')!.bg,'#112233');
 assert.equal(after.find(n=>n.id==='hc1')!.radius,18);
 const restored=applyPatches(nodes,unifiedPatches(unifiedReferenceProposal(c,nodes,'A',['radius','background'],[])));
 assert.equal(restored.find(n=>n.id==='sc2')!.radius,18);
 assert.throws(()=>unifiedReferenceProposal(c,nodes,'A',[],[{...override,fact:{...fact,proposed:999}}]),/Unsupported or stale/);
});
test('Groups retain read-only comparison; one reference supports multiple independent targets',()=>{
 const c=pair();c.sides!.B.elementIds=['sc2','sc3'];
 assert.ok(referenceProperties(c,MOCK_NODES,'A').transferable.some(r=>r.key==='radius'));
 assert.deepEqual(unifiedReferenceProposal(c,MOCK_NODES,'A',['radius'],[])!.targetIds,['sc2','sc3']);
 assert.equal(referenceProperties(c,MOCK_NODES,'B').transferable.length,0);
 const same=localComparison('A',['hc1','hc2'],'same',MOCK_NODES);
 assert.equal(referenceProperties(same,MOCK_NODES,'A').transferable.length,0);
 assert.ok(referenceProperties(same,MOCK_NODES,'A').other.length);
});
test('Unified presentation has no purpose modes, Resolve or duplicated preview controls',()=>{
 const html=renderToStaticMarkup(React.createElement(UnifiedReferenceWorkflow,{context:pair(),nodes:MOCK_NODES,onPreview:noop,onApply:()=>true,onUndo:noop,onRedo:noop,canUndo:false,canRedo:false,onCancel:noop,sharing:()=>React.createElement('span',null,'Sharing controls')}));
 assert.match(html,/Properties to match/);assert.match(html,/Reference Object A/);assert.match(html,/Target Object B/);assert.match(html,/Swap reference and target/);
 assert.match(html,/Other differences \(/);assert.match(html,/Find design system matches/);assert.match(html,/Sharing options/);
 assert.doesNotMatch(html,/Comparison purpose|Resolve selected differences|Next steps|type="radio"|>Preview changes<|checked=""|Choose which design properties|Optional assistance|These differences remain unchanged/);
 assert.doesNotMatch(html,/>Apply changes</);
 assert.match(html,/<section class="reference-sharing" aria-label="Sharing options"><h3>Sharing options<\/h3><span>Sharing controls<\/span><\/section>/);
 const footer=html.match(/<footer class="reference-workflow-footer">(.*?)<\/footer>/)![1];assert.match(footer,/>Cancel</);assert.doesNotMatch(footer,/Apply|selected/);
});
test('Actual fill swatches and atomic patch validation preserve unrelated properties',()=>{
 const nodes=MOCK_NODES.map(n=>n.id==='hc1'?{...n,bg:'#123456'}:n.id==='sc2'?{...n,bg:'#abcdef'}:n),c=pair(nodes);
 const html=renderToStaticMarkup(React.createElement(UnifiedReferenceWorkflow,{context:c,nodes,onPreview:noop,onApply:()=>true,onUndo:noop,onRedo:noop,canUndo:false,canRedo:false,onCancel:noop,sharing:()=>null}));
 assert.match(html,/background-color:#123456/);assert.match(html,/background-color:#abcdef/);
 const p=unifiedReferenceProposal(c,nodes,'A',['background'],[])!,patches=unifiedPatches(p),after=applyPatches(nodes,patches);
 assert.equal(after.find(n=>n.id==='sc2')!.bg,'#123456');assert.equal(after.find(n=>n.id==='sc2')!.radius,nodes.find(n=>n.id==='sc2')!.radius);
 assert.throws(()=>validatePatches(nodes,p.targetIds,[...patches,{id:'hc1',changes:{radius:5}}]),/outside/);
 const matched=referenceProperties(c,after,'A');assert.ok(!matched.transferable.some(r=>r.key==='background'));
});

test('Sharing preserves swapped roles using the existing validated comparison format',()=>{
 const c=pair(),shared=referenceSharingContext(c,{summary:'Reference B to target A',direction:'B',keys:['radius','fontSize']});
 assert.equal(shared.purpose,DESIGN_REFERENCE_PURPOSE);assert.equal(shared.designReference!.direction.referenceSide,'B');
 assert.deepEqual(shared.designReference!.properties,['cornerRadius','typography']);
 assert.deepEqual(validateDesignReference(shared.purpose,shared.designReference,shared.selections,shared.sides),shared.designReference);
 const sizeOnly=referenceSharingContext(shared,{summary:'Size',direction:'A',keys:['dimensions']});
 assert.equal(sizeOnly.designReference,undefined);assert.notEqual(sizeOnly.purpose,DESIGN_REFERENCE_PURPOSE);
 assert.equal(c.designReference,undefined);assert.deepEqual(shared.sides,c.sides);
});
test('External preview footer has no duplicate Apply or Cancel and renders every target',async()=>{
 const {default:ComparisonPreview}=await import('./components/ComparisonPreview');
 const c=pair();c.sides!.B.elementIds=['sc2','sc3'];const proposal=unifiedReferenceProposal(c,MOCK_NODES,'A',['radius'],[])!;
 const html=renderToStaticMarkup(React.createElement(ComparisonPreview,{proposal,enabled:proposal.mappings.map(m=>m.id),nodes:MOCK_NODES,hideActions:true,selectable:false,onToggle:noop,onApply:noop,onCancel:noop,supportingMessage:null}));
 assert.equal((html.match(/>Before</g)||[]).length,2);assert.equal((html.match(/>After</g)||[]).length,2);
 assert.doesNotMatch(html,/Apply changes|>Cancel<|type="checkbox"/);assert.doesNotMatch(html,/Only selected properties will change|confirmation-note/);
});

test('Existing saved reference direction is honored without preselecting properties',()=>{
 const context=pair();context.purpose=DESIGN_REFERENCE_PURPOSE;context.designReference={direction:{referenceSide:'B',targetSide:'A',referenceUser:'A',targetUser:'A'},properties:['cornerRadius']};
 const html=renderToStaticMarkup(React.createElement(UnifiedReferenceWorkflow,{context,nodes:MOCK_NODES,onPreview:noop,onApply:()=>true,onUndo:noop,onRedo:noop,canUndo:false,canRedo:false,onCancel:noop,sharing:()=>null}));
 assert.match(html,/aria-label="Reference Object B"/);assert.match(html,/aria-label="Target Object A"/);assert.doesNotMatch(html,/checked=""/);
});
