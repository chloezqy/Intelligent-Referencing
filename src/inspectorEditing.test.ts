import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {inspectorActions,inspectorTargets,referenceTransfer,proposedReferenceEdits} from './inspectorEditing';
import {MOCK_NODES} from './data';
import {localComparison,sideDirection} from './comparisonSides';
import {DESIGN_REFERENCE_PURPOSE} from './collaboration';
import {applyPatches,proposalPatches} from './editing';
import EditingToolbar from './components/EditingToolbar';
import {designChangeContext} from './designChanges';
test('Inspector filters actions by object compatibility, sibling layout and recorded properties',()=>{
 const cards=inspectorActions(['sc2','sc3'],MOCK_NODES);assert.ok(cards.actions.includes('Align'));assert.ok(cards.actions.includes('Match Styles'));assert.ok(cards.actions.includes('Typography'));assert.ok(cards.actions.includes('Colors'));
 const mixed=inspectorActions(['sc2','detail-title'],MOCK_NODES);assert.deepEqual(mixed.actions,[]);assert.match(mixed.reason,/different roles/);
 const cross=inspectorActions(['hc1','sc1'],MOCK_NODES);assert.ok(!cross.actions.includes('Align'));assert.ok(cross.actions.includes('Match Styles'));
 assert.ok(!inspectorActions(['hc1-img'],MOCK_NODES).actions.includes('Typography'));
 assert.deepEqual(inspectorActions(['ds-product-card'],MOCK_NODES).actions,[]);
});
test('Reference editing uses only the target and explicitly chosen property categories',()=>{
 const c=localComparison('A',['hc1','sc1'],'fixture',MOCK_NODES);c.purpose=DESIGN_REFERENCE_PURPOSE;c.designReference={direction:sideDirection(c),properties:['colors']};
 assert.deepEqual(inspectorTargets(c,['hc1','sc1']),['sc1']);
 const proposal=referenceTransfer(c,MOCK_NODES);assert.ok(proposal.mappings.length);
 assert.ok(proposal.mappings.flatMap(m=>m.patches).every(p=>Object.keys(p.changes).every(key=>['bg','color','border'].includes(key))));
 assert.ok(!inspectorActions(['sc1'],MOCK_NODES,c).actions.includes('Typography'));assert.ok(!inspectorActions(['sc1'],MOCK_NODES,c).actions.includes('Ask AI'));
});
test('Accepted AI design facts compile to validated preview patches without mutating objects and reject stale values',()=>{
 const c=localComparison('A',['hc1-title','detail-title'],'fixture',MOCK_NODES);c.purpose=DESIGN_REFERENCE_PURPOSE;c.designReference={direction:sideDirection(c),properties:['typography']};
 const fact=designChangeContext(['hc1-title'],['detail-title'],['typography'],MOCK_NODES).facts[0];c.designReference.proposedChanges=[{id:'mock',title:'Match typography',explanation:'Use reference typography.',source:'model',status:'pending',facts:[fact]}];
 const before=JSON.stringify(MOCK_NODES),proposal=proposedReferenceEdits(c,MOCK_NODES),patches=proposalPatches(proposal,['mock'],MOCK_NODES),preview=applyPatches(MOCK_NODES,patches);
 assert.equal(JSON.stringify(MOCK_NODES),before);assert.equal(proposal.targetIds[0],'detail-title');assert.notDeepEqual(preview,MOCK_NODES);assert.deepEqual(preview.find(n=>n.id==='hc1-title'),MOCK_NODES.find(n=>n.id==='hc1-title'));
 assert.throws(()=>proposedReferenceEdits(c,applyPatches(MOCK_NODES,[{id:fact.targetId,changes:{fontSize:99}}])),/changed/);
});
test('Reused editor renders inline, with filtered categories and no nested form or implicit submit controls',()=>{
 const html=renderToStaticMarkup(React.createElement(EditingToolbar,{inline:true,selection:{selectedIds:['sc2','detail-title'],exemplarIds:[],scope:'document',label:'Mixed',selectionMethod:'conventional'},nodes:MOCK_NODES,onPreview:()=>{},onApply:()=>{},onUndo:()=>{},onRedo:()=>{},canUndo:true,canRedo:false,sourceId:null,onSource:()=>{},picking:false,onPicking:()=>{},onState:()=>{}}));
 assert.match(html,/inspector-editing/);assert.match(html,/different roles/);assert.doesNotMatch(html,/selection-context/);assert.doesNotMatch(html,/<form/);assert.doesNotMatch(html,/>Ask AI</);assert.ok((html.match(/type="button"/g)||[]).length>=2);
});
test('Single and grouped local inspection retain selected objects without inventing a second side',()=>{
 for(const ids of [['sc2'],['sc1','sc2','sc3']]){const context=localComparison('A',ids,'fixture',MOCK_NODES);assert.deepEqual(context.sides!.A.elementIds,ids);assert.deepEqual(context.sides!.B.elementIds,[]);assert.deepEqual(inspectorTargets(context,ids),ids);assert.ok(inspectorActions(ids,MOCK_NODES,context).actions.includes('Typography'));}
});
test('Overlapping reference and target sets remain inspectable but cannot edit their shared source objects',()=>{
 const c=localComparison('A',['hc1','hc1-title'],'overlap',MOCK_NODES);c.purpose=DESIGN_REFERENCE_PURPOSE;c.designReference={direction:sideDirection(c),properties:['typography']};
 assert.deepEqual(inspectorActions(['hc1-title'],MOCK_NODES,c).actions,[]);assert.match(inspectorActions(['hc1-title'],MOCK_NODES,c).reason,/overlap/);assert.throws(()=>referenceTransfer(c,MOCK_NODES),/overlap/);assert.throws(()=>proposedReferenceEdits(c,MOCK_NODES),/overlap/);
});
