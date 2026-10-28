import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MOCK_NODES} from './data';
import {localComparison,sideDirection} from './comparisonSides';
import {resolveComparison,editableDifferences,reviewComparisonNote,referencePropertyIssue} from './comparisonResolution';
import {referenceTransfer} from './inspectorEditing';
import {applyPatches,proposalPatches} from './editing';
import PropertyComparison from './components/PropertyComparison';
import {demoShare,freshDemo} from './demoCollaboration';
const context=()=>localComparison('A',['hc1','sc2'],'comparison',MOCK_NODES);
test('Selected differences resolve in either direction; preview and cancel never mutate the document',()=>{
 const nodes=structuredClone(MOCK_NODES),before=JSON.stringify(nodes),c=context();assert.ok(editableDifferences(c,nodes).includes('radius'));
 for(const direction of ['A','B'] as const){const proposal=resolveComparison(c,nodes,['radius'],direction),patches=proposalPatches(proposal,proposal.mappings.map(m=>m.id),nodes),after=applyPatches(nodes,patches);
 assert.equal(JSON.stringify(nodes),before);assert.ok(patches.every(p=>Object.keys(p.changes).every(key=>key==='radius')));
 const source=direction==='A'?'hc1':'sc2',target=direction==='A'?'sc2':'hc1';assert.equal(after.find(n=>n.id===target)!.radius,nodes.find(n=>n.id===source)!.radius);assert.deepEqual(after.find(n=>n.id===source),nodes.find(n=>n.id===source));
 assert.deepEqual(applyPatches(nodes,proposalPatches(proposal,[],nodes)),nodes);assert.deepEqual(applyPatches(nodes,[]),nodes);
 }
 assert.throws(()=>resolveComparison(c,nodes,['text'],'A'));assert.throws(()=>resolveComparison(c,nodes,[],'A'));
});
test('Missing, overlapping, incompatible and ambiguous group transfers stay informational',()=>{
 const c=context();c.sides!.B.elementIds=['detail-title'];assert.ok(!editableDifferences(c,MOCK_NODES).includes('text'));assert.throws(()=>resolveComparison(c,MOCK_NODES,['text'],'A'));
 c.sides!.B.elementIds=['hc1'];assert.throws(()=>resolveComparison(c,MOCK_NODES,['radius'],'A'));
 c.sides!.A.elementIds=['hc1','hc2'];c.sides!.B.elementIds=['sc2','sc3'];assert.deepEqual(editableDifferences(c,MOCK_NODES),[]);
 const missing=MOCK_NODES.map(n=>n.id==='sc2'?{...n,radius:undefined}:n);assert.ok(!editableDifferences(context(),missing).includes('radius'));
});
test('Design reference uses chosen recorded properties and direction, with individually selectable changes',()=>{
 const c=context();c.purpose='Use as a design reference';c.designReference={direction:sideDirection(c),properties:['cornerRadius']};
 assert.equal(referencePropertyIssue(c,MOCK_NODES,'cornerRadius'),'');assert.ok(referencePropertyIssue(c,MOCK_NODES,'spacing'));
 const proposal=referenceTransfer(c,MOCK_NODES),first=proposal.mappings[0];const patches=proposalPatches(proposal,[first.id],MOCK_NODES);assert.equal(patches.length,1);assert.deepEqual(Object.keys(patches[0].changes),['radius']);
 const preview=applyPatches(MOCK_NODES,patches);assert.notDeepEqual(preview,MOCK_NODES);assert.deepEqual(applyPatches(MOCK_NODES,[]),MOCK_NODES);
 c.designReference.direction=sideDirection(c,'B');const swapped=referenceTransfer(c,MOCK_NODES);assert.deepEqual(swapped.targetIds,['hc1']);
});
test('Review handoff preserves objects and ownership, adds selected values as note, and remains unsent until sharing',()=>{
 const c=context(),note=reviewComparisonNote(c,MOCK_NODES,['radius']),room=freshDemo();assert.match(note,/Corner radius: 16 px vs. 14 px/);assert.equal(room.references.length,freshDemo().references.length);
 const next=demoShare(room,{comparison:c,elementIds:['hc1','sc2'],exemplarIds:['hc1'],scope:'document',label:'Comparison'},'Compare',note,'review-handoff',false,'A');const ref=next.references.find(r=>r.id==='review-handoff')!;assert.deepEqual(ref.comparison!.sides,c.sides);assert.equal(ref.message,note);assert.deepEqual(ref.elementIds,['hc1','sc2']);
});
test('Difference selection supports size independently of recommendations and keeps content informational',()=>{
 const html=renderToStaticMarkup(React.createElement(PropertyComparison,{ownership:context(),contextId:'comparison',ids:['hc1','sc2'],nodes:MOCK_NODES,expanded:true,visual:true,selectedKeys:['radius'],onSelectedKeys:()=>{}}));
 assert.match(html,/Resolve Corner radius/);assert.match(html,/Informational/);assert.match(html,/Resolve Dimensions/);
});

test('Purpose-specific next steps render separately, including empty comparison and unavailable properties',async()=>{
 const {default:EditingToolbar}=await import('./components/EditingToolbar');
 const props={inline:true,selection:{selectedIds:['hc1','sc2'],exemplarIds:['hc1','sc2'],scope:'exemplars' as const,label:'Cards',selectionMethod:'conventional' as const},nodes:MOCK_NODES,onPreview:()=>{},onApply:()=>{},onUndo:()=>{},onRedo:()=>{},canUndo:false,canRedo:false,sourceId:null,onSource:()=>{},picking:false,onPicking:()=>{},onState:()=>{},onDesignReference:()=>{},onRequestReview:()=>{}};
 const compare=renderToStaticMarkup(React.createElement(EditingToolbar,{...props,context:context(),comparisonKeys:['radius']}));
 assert.match(compare,/Resolve selected differences/);assert.match(compare,/Request collaborator review/);assert.doesNotMatch(compare,/Properties to match/);
 const c=context();c.purpose='Use as a design reference';c.designReference={direction:sideDirection(c),properties:['cornerRadius']};
 const design=renderToStaticMarkup(React.createElement(EditingToolbar,{...props,context:c}));assert.match(design,/Preview changes/);assert.match(design,/Properties to match/);assert.match(design,/unavailable/);assert.doesNotMatch(design,/Resolve selected differences|Request collaborator review/);
 const single=localComparison('A',['hc1'],'single',MOCK_NODES),html=renderToStaticMarkup(React.createElement(EditingToolbar,{...props,context:single}));assert.match(html,/No compatible editable differences/);assert.match(html,/Request collaborator review/);
});
