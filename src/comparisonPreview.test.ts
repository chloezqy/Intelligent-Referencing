import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ComparisonPreview from './components/ComparisonPreview';
import {resolveComparison} from './comparisonResolution';
import {localComparison} from './comparisonSides';
import {MOCK_NODES} from './data';
import {applyPatches,proposalPatches} from './editing';
const context=localComparison('A',['hc1','sc2'],'preview',MOCK_NODES);
const props={nodes:MOCK_NODES,onToggle:()=>{},onApply:()=>{},onCancel:()=>{}};
test('Single-change confirmation shows only concise description, visual comparison, values and Apply/Cancel',()=>{
 const proposal=resolveComparison(context,MOCK_NODES,['radius'],'A'),enabled=proposal.mappings.map(m=>m.id),html=renderToStaticMarkup(React.createElement(ComparisonPreview,{...props,proposal,enabled}));
 assert.match(html,/Preview changes/);assert.match(html,/1 change/);assert.match(html,/Corner radius · Solid Birch Armchair/);assert.match(html,/Before/);assert.match(html,/After/);assert.match(html,/14 px/);assert.match(html,/16 px/);assert.match(html,/No changes applied yet/);assert.match(html,/Apply changes/);assert.match(html,/>Cancel</);
 assert.doesNotMatch(html,/type="checkbox"|Rule-based proposal|Source:|Targets:|confirmed objects|affected layers|<details|Customize|Show Current/);
 assert.ok(html.indexOf('comparison-before-after')<html.indexOf('confirmation-changes'));
 assert.equal((html.match(/type="button"/g)||[]).length,2);
});
test('Multiple mappings retain optional inclusion and preview only enabled changes without mutation',()=>{
 const proposal=resolveComparison(context,MOCK_NODES,['dimensions','radius'],'A'),before=JSON.stringify(MOCK_NODES),enabled=[proposal.mappings[0].id],html=renderToStaticMarkup(React.createElement(ComparisonPreview,{...props,proposal,enabled}));
 assert.equal((html.match(/type="checkbox"/g)||[]).length,proposal.mappings.length);assert.equal((html.match(/checked=""/g)||[]).length,1);assert.match(html,/is-excluded/);assert.equal(JSON.stringify(MOCK_NODES),before);
 const preview=applyPatches(MOCK_NODES,proposalPatches(proposal,enabled,MOCK_NODES));assert.equal(preview.find(n=>n.id==='sc2')!.radius,14);assert.equal(preview.find(n=>n.id==='sc2')!.w,165);
 const empty=renderToStaticMarkup(React.createElement(ComparisonPreview,{...props,proposal,enabled:[]}));assert.match(empty,/disabled=""[^>]*>Apply changes/);assert.deepEqual(applyPatches(MOCK_NODES,[]),MOCK_NODES);
});
