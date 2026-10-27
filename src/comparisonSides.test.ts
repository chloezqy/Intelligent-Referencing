import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {comparisonSides,localComparison,referenceSides,sideDirection} from './comparisonSides';
import {MOCK_NODES} from './data';
import {DESIGN_REFERENCE_PURPOSE,validateDesignReference,ComparisonContext} from './collaboration';
import {demoComparison,demoShare,freshDemo} from './demoCollaboration';
import {designChangeContext,designChangeKey,decideDesignChange} from './designChanges';
import ComparisonOverview from './components/ComparisonOverview';
import {ComparisonPurpose} from './components/ComparisonContext';
const selection=(userId:'A'|'B',elementIds:string[])=>({userId,elementIds,exemplarIds:elementIds,scope:'exemplars' as const,method:'conventional' as const,revision:1});
test('Local comparisons keep object order and true selector identity without inventing a peer selection',()=>{
 for(const user of ['A','B'] as const){const c=localComparison(user,['sc2','sc3'],'fixture',MOCK_NODES),sides=comparisonSides(c);assert.deepEqual(sides.A,{elementIds:['sc2'],selectedBy:user});assert.deepEqual(sides.B,{elementIds:['sc3'],selectedBy:user});assert.deepEqual(c.selections[user==='A'?'B':'A'].elementIds,[]);
 const html=renderToStaticMarkup(React.createElement(ComparisonOverview,{context:c,contextId:c.snapshotId,ids:['sc2','sc3'],nodes:MOCK_NODES,user}));assert.match(html,/Object A/);assert.match(html,/Object B/);assert.equal((html.match(new RegExp(`Selected by User ${user}`,'g'))||[]).length,2);assert.doesNotMatch(html,/0 differences/);assert.match(html,/Differences are available in detailed properties/);
 }
 assert.throws(()=>localComparison('A',['sc2','sc2'],'invalid',MOCK_NODES));
});
test('Legacy cross-user references resolve unchanged, while either direction uses correct evidence',()=>{
 const legacy=demoComparison(selection('A',['hc1-title']),selection('B',['detail-title']),'legacy');assert.equal(comparisonSides(legacy).A.selectedBy,'A');assert.equal(comparisonSides(legacy).B.selectedBy,'B');
 for(const context of [legacy,localComparison('A',['hc1-title','detail-title'],'local',MOCK_NODES)]){
 const base={...context,purpose:DESIGN_REFERENCE_PURPOSE,designReference:{direction:sideDirection(context),properties:['typography'] as const as any}};
 const swapped={...base,designReference:{...base.designReference,direction:sideDirection(context,'B')}};
 assert.notEqual(designChangeKey(base),designChangeKey(swapped));
 const before=referenceSides(base),after=referenceSides(swapped);assert.deepEqual(before.reference.elementIds,after.target.elementIds);
 assert.ok(validateDesignReference(swapped.purpose,swapped.designReference,swapped.selections,swapped.sides));
 const facts=designChangeContext(after.reference.elementIds,after.target.elementIds,['typography'],MOCK_NODES).facts;assert.ok(facts.length);assert.equal(facts[0].referenceId,'detail-title');assert.equal(facts[0].targetId,'hc1-title');
 }
});
test('Swapped local references share both true owners and recipient review remains independent of selection ownership',()=>{
 const context=localComparison('B',['hc1-title','detail-title'],'local',MOCK_NODES);context.purpose=DESIGN_REFERENCE_PURPOSE;context.designReference={direction:sideDirection(context,'B'),properties:['typography']};
 const fact=designChangeContext(['detail-title'],['hc1-title'],['typography'],MOCK_NODES).facts[0];
 context.designReference.proposedChanges=[{id:'change',title:'Match typography',explanation:'Use the reference title style.',source:'model',status:'pending',facts:[fact]}];
 const draft={comparison:context,elementIds:['hc1-title','detail-title'],exemplarIds:['hc1-title'],scope:'document' as const,label:'Local comparison'};
 const ref=demoShare(freshDemo(),draft,'Compare','@User A discuss','local',true,'B').references[0];
 assert.deepEqual(ref.comparison!.sides,context.sides);assert.equal(ref.attention![0].targetUser,'A');
 assert.equal(decideDesignChange(ref,'A','change','accepted').comparison!.designReference!.proposedChanges![0].status,'accepted');assert.throws(()=>decideDesignChange(ref,'B','change','accepted'));
});
test('One purpose control follows previews and never appears inside compact Sharing options',()=>{
 const context=localComparison('A',['sc2','sc3'],'local',MOCK_NODES);
 const controls=React.createElement(ComparisonPurpose,{context,onPurpose:()=>{},onDesignReference:()=>{}});
 const html=renderToStaticMarkup(React.createElement(ComparisonOverview,{context,contextId:'local',ids:['sc2','sc3'],nodes:MOCK_NODES,purposeControls:controls}));
 assert.ok(html.indexOf('reference-card-pair')<html.indexOf('Comparison purpose'));assert.ok(html.indexOf('Comparison purpose')<html.indexOf('Comparison details'));assert.equal((html.match(/Comparison purpose/g)||[]).length,1);assert.doesNotMatch(html,/Rule-based insight/);

});
