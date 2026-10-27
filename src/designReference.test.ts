import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DESIGN_REFERENCE_PURPOSE,validateDesignReference,ComparisonContext,DesignReference} from './collaboration';
import {demoShare,freshDemo,demoComparison} from './demoCollaboration';
import {MOCK_NODES} from './data';
import {ComparisonPurpose} from './components/ComparisonContext';
import ComparisonOverview from './components/ComparisonOverview';
const direction={referenceUser:'A',targetUser:'B'} as const;
const selection=(userId:'A'|'B',id:string)=>({userId,elementIds:[id],exemplarIds:[id],scope:'exemplars' as const,method:'conventional' as const,revision:1});
const original=()=>demoComparison(selection('A','hc1-title'),selection('B','sc1-cta'),'frozen');
const intent:DesignReference={direction,properties:['typography','colors']};

test('Design reference intent is bounded, directional and optional for existing purposes',()=>{
 const ctx=original();
 assert.deepEqual(validateDesignReference(DESIGN_REFERENCE_PURPOSE,intent,ctx.selections),intent);
 assert.equal(validateDesignReference('Compare selected elements',undefined,ctx.selections),undefined);
 assert.equal(validateDesignReference('Custom purpose',intent,ctx.selections),undefined);
 for(const value of [undefined,{direction,properties:[]},{direction,properties:['unknown']},{direction,properties:['colors','colors']},{direction:{referenceUser:'A',targetUser:'A'},properties:['colors']}]){
  assert.throws(()=>validateDesignReference(DESIGN_REFERENCE_PURPOSE,value,ctx.selections));
 }
 assert.throws(()=>validateDesignReference(DESIGN_REFERENCE_PURPOSE,intent,{...ctx.selections,B:{...ctx.selections.B,elementIds:[]}}));
});
test('Demo handoff preserves purpose, frozen ownership, intent, mentions and invitation after storage round trip without editing nodes',()=>{
 const before=JSON.stringify(MOCK_NODES);
 const comparison={...original(),purpose:DESIGN_REFERENCE_PURPOSE,designReference:intent};
 const room=demoShare(freshDemo(),{comparison,elementIds:['hc1-title','sc1-cta'],exemplarIds:['hc1-title'],scope:'document',label:'Use this design'},'Compare','@User B use these colors','design-ref',true);
 const restored=JSON.parse(JSON.stringify(room)),ref=restored.references[0];
 assert.equal(ref.comparison.purpose,DESIGN_REFERENCE_PURPOSE);assert.deepEqual(ref.comparison.designReference,intent);
 assert.deepEqual(ref.comparison.selections.A.elementIds,['hc1-title']);assert.deepEqual(ref.comparison.selections.B.elementIds,['sc1-cta']);
 assert.deepEqual(ref.notificationRecipients,['B']);assert.equal(ref.attention[0].targetUser,'B');
 assert.equal(JSON.stringify(MOCK_NODES),before);
 comparison.designReference.properties.push('spacing');
 assert.deepEqual(ref.comparison.designReference.properties,['typography','colors']);
});
test('Purpose controls show two modes and design properties only in reference mode',()=>{
 const ctx=original();
 const render=(context:ComparisonContext)=>renderToStaticMarkup(React.createElement(ComparisonPurpose,{context,onPurpose:()=>{},onDesignReference:()=>{}}));
 const normal=render({...ctx,purpose:'Compare selected elements'});
 assert.match(normal,/Use as a design reference/);assert.ok(!normal.includes('type="checkbox"'));
 const design=render({...ctx,purpose:DESIGN_REFERENCE_PURPOSE,designReference:intent});
 assert.match(design,/Properties to reference/);assert.match(design,/User A · Reference/);assert.match(design,/User B · Target/);
 assert.equal((design.match(/type="checkbox"/g)||[]).length,4);
 const custom=render({...ctx,purpose:'Check the purchase flow'});
 assert.match(custom,/Compare differences/);assert.match(custom,/Use as a design reference/);assert.ok(!custom.includes('<select'));
 assert.ok(!custom.includes('type="checkbox"'));
});
test('Recipients see stored design intent; old references without the optional field render normally',()=>{
 const ctx={...original(),purpose:DESIGN_REFERENCE_PURPOSE,designReference:intent};
 const render=(context:ComparisonContext)=>renderToStaticMarkup(React.createElement(ComparisonOverview,{context,contextId:'saved',ids:['hc1-title','sc1-cta'],nodes:MOCK_NODES,user:'B'}));
 const html=render(ctx);
 assert.match(html,/User A · Reference/);assert.match(html,/User B · Target/);assert.match(html,/Typography · Colors/);
 assert.ok(!html.includes('type="checkbox"'));
 assert.ok(!render(original()).includes('Design reference intent'));
});
