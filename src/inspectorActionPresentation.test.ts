import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectorActionPresentation} from './inspectorActionPresentation';
import {inspectorActions} from './inspectorEditing';
import {MOCK_NODES} from './data';
import {localComparison} from './comparisonSides';
import {applyPatches} from './editing';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import ComparisonOverview from './components/ComparisonOverview';
test('Contextual cards prioritize actual style differences and retain every other tool without duplication',()=>{
 const ids=['hc1','sc1'],context=localComparison('A',ids,'cards',MOCK_NODES),available=inspectorActions(ids,MOCK_NODES,context).actions;
 const p=inspectorActionPresentation(available,ids,MOCK_NODES,context);assert.equal(p.primary[0],'Match Styles');assert.match(p.matchDetails,/Corner radius/);assert.ok(p.primary.length<=3);assert.ok(!p.primary.includes('Typography'));assert.deepEqual(new Set([...p.primary,...p.secondary]),new Set(available));assert.equal(new Set([...p.primary,...p.secondary]).size,available.length);
 const nodes=applyPatches(MOCK_NODES,[{id:'sc1',changes:{bg:'#123456'}}]);assert.ok(inspectorActionPresentation(available,ids,nodes,context).primary.includes('Colors'));
});
test('Missing values and equal properties do not become primary typography or color recommendations',()=>{
 const ids=['hc1-img'],p=inspectorActionPresentation(['Colors','Typography','Ask AI','Design System'],ids,MOCK_NODES);assert.ok(!p.primary.includes('Typography'));assert.ok(!p.primary.includes('Colors'));assert.ok(p.primary.includes('Ask AI'));
});
test('Comparison details and its internal detailed-properties disclosure precede purpose options',()=>{
 const context=localComparison('A',['hc1','sc1'],'order',MOCK_NODES);
 const html=renderToStaticMarkup(React.createElement(ComparisonOverview,{context,contextId:'order',ids:['hc1','sc1'],nodes:MOCK_NODES,purposeControls:React.createElement('div',null,'Comparison purpose options')}));
 assert.ok(html.indexOf('Comparison details')<html.indexOf('Comparison purpose options'));assert.ok(html.indexOf('View detailed properties')<html.indexOf('Comparison purpose options'));assert.equal((html.match(/View detailed properties/g)||[]).length,1);
});
