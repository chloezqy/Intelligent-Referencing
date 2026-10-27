import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {designChangeContext,validateProposedChanges,decideDesignChange,designChangeKey} from './designChanges';
import {MOCK_NODES} from './data';
import {DESIGN_REFERENCE_PURPOSE,validateDesignReference,ComparisonContext} from './collaboration';
import {demoComparison,demoShare,freshDemo} from './demoCollaboration';
import {DraftDesignChanges,SharedDesignChanges} from './components/DesignChangeSuggestions';
const selection=(userId:'A'|'B',id:string)=>({userId,elementIds:[id],exemplarIds:[id],scope:'exemplars' as const,method:'conventional' as const,revision:1});
const comparison=():ComparisonContext=>({...demoComparison(selection('A','hc1'),selection('B','sc1'),'fixture'),purpose:DESIGN_REFERENCE_PURPOSE,designReference:{direction:{referenceUser:'A',targetUser:'B'} as const,properties:['typography','colors','spacing']}});
const evidence=()=>designChangeContext(['hc1'],['sc1'],['typography','colors','spacing'],MOCK_NODES);
function proposal(){const fact=evidence().facts[0];assert.ok(fact);return {id:'change-0',title:'Match recorded styling',explanation:'Use the reference styling for the related target element.',source:'model' as const,facts:[fact],status:'pending' as const};}
test('Design changes use recorded requested properties, including nested typography, with no fabricated spacing',()=>{
 const ctx=evidence();assert.ok(ctx.facts.length);assert.ok(designChangeContext(['hc1'],['detail-title'],['typography'],MOCK_NODES).facts.some(f=>f.property==='Font size'));assert.ok(!ctx.facts.some(f=>f.category==='spacing'));assert.ok(ctx.elements.length<=64);
 for(const fact of ctx.facts){assert.notEqual(fact.referenceValue,fact.targetValue);assert.ok(MOCK_NODES.some(n=>n.id===fact.referenceId));assert.ok(MOCK_NODES.some(n=>n.id===fact.targetId));}
 assert.deepEqual(designChangeContext(['hc1'],['sc1'],['spacing'],MOCK_NODES).facts,[]);
 assert.deepEqual(designChangeContext(['hc1-title'],['hc1-title'],['typography'],MOCK_NODES).facts,[]);
 assert.throws(()=>designChangeContext(['invented'],['sc1'],['colors'],MOCK_NODES));
});
test('Invented, reversed, stale and unselected-property proposal facts are rejected',()=>{
 const change=proposal();assert.equal(validateProposedChanges([change],evidence())[0].status,'pending');
 for(const fact of [{...change.facts[0],referenceValue:'invented'},{...change.facts[0],targetId:'invented'},{...change.facts[0],category:'spacing'}])assert.throws(()=>validateProposedChanges([{...change,facts:[fact]}],evidence()));
 assert.throws(()=>validateProposedChanges([change],designChangeContext(['sc1'],['hc1'],['colors'],MOCK_NODES)));
 assert.throws(()=>validateProposedChanges([change,change],evidence()));
 const ctx=comparison();assert.notEqual(designChangeKey(ctx),designChangeKey({...ctx,designReference:{...ctx.designReference,properties:['cornerRadius']}}));
});
test('Only explicitly included changes survive demo sharing with original direction and targets, then B may decide independently of review',()=>{
 const ctx=comparison(),change=proposal();ctx.designReference.proposedChanges=[change];
 const design=validateDesignReference(ctx.purpose,ctx.designReference,ctx.selections)!;assert.equal(design.proposedChanges!.length,1);
 const room=demoShare(freshDemo(),{comparison:ctx,elementIds:['hc1','sc1'],exemplarIds:['hc1'],label:'Fixture',scope:'document'},'Compare','Please discuss','fixture');
 const ref=room.references[0];assert.deepEqual(ref.elementIds,['hc1','sc1']);assert.equal(ref.comparison!.designReference!.direction.referenceUser,'A');
 const accepted=decideDesignChange(ref,'B',change.id,'accepted');assert.equal(accepted.comparison!.designReference!.proposedChanges![0].status,'accepted');assert.equal(accepted.status,'open');assert.equal(ref.comparison!.designReference!.proposedChanges![0].status,'pending');
 assert.equal(decideDesignChange(accepted,'B',change.id,'dismissed').comparison!.designReference!.proposedChanges![0].status,'dismissed');
 assert.throws(()=>decideDesignChange(ref,'A',change.id,'accepted'));assert.throws(()=>decideDesignChange({...ref,status:'reviewed'},'B',change.id,'accepted'));
});
test('Draft has explicit Suggest changes action, no automatic model request, and shared recipient controls are separate from review',()=>{
 const ctx=comparison();const html=renderToStaticMarkup(React.createElement(DraftDesignChanges,{context:ctx,onChange:()=>{}}));assert.match(html,/Suggest changes/);assert.match(html,/0 proposed changes selected/);assert.doesNotMatch(html,/type="checkbox"/);
 ctx.designReference.proposedChanges=[proposal()];const ref=demoShare(freshDemo(),{comparison:ctx,elementIds:['hc1','sc1'],exemplarIds:['hc1'],label:'Fixture',scope:'document'},'Compare','','fixture').references[0];
 const render=(userId:'A'|'B')=>renderToStaticMarkup(React.createElement(SharedDesignChanges,{reference:ref,collaboration:{session:{userId},connected:true,busy:false} as any}));
 assert.match(render('B'),/>Accept</);assert.match(render('B'),/>Dismiss</);assert.doesNotMatch(render('A'),/>Accept</);assert.match(render('B'),/A: /);
});
