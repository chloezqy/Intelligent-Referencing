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
test('Typography confirmation hides unchanged values and metadata, retaining token and ordered actions',()=>{
 const node=MOCK_NODES.find(n=>n.id==='hc2-title')!;
 const proposal={title:'Typography / Body',targetIds:[node.id],mappings:[{id:'batch',label:'Typography / Body',patches:[{id:node.id,changes:{fontSize:node.fontSize,fontWeight:node.fontWeight,fontFamily:'Arial',token:'Typography / Body'}}]}]};
 const html=renderToStaticMarkup(React.createElement(ComparisonPreview,{...props,variant:'typography',proposal,enabled:['batch']}));
 assert.match(html,/Typography \/ Body/);assert.match(html,/<dt>Font family<\/dt>/);assert.doesNotMatch(html,/<dt>Font size|<dt>Font weight|<dt>token|type="checkbox"|Rule-based proposal|No changes applied yet/);
 assert.ok(html.indexOf('>Apply changes<')<html.indexOf('>Cancel<'));
 const same={...proposal,mappings:[{...proposal.mappings[0],patches:[{id:node.id,changes:{fontSize:node.fontSize,token:'Typography / Body'}}]}]};
 const unchanged=renderToStaticMarkup(React.createElement(ComparisonPreview,{...props,variant:'typography',proposal:same,enabled:['batch']}));
 assert.match(unchanged,/Already matches this style/);assert.match(unchanged,/disabled="">Apply changes/);
});
test('unified typography preview keeps reference options between visual comparison and changed properties',()=>{
 const node=MOCK_NODES.find(n=>n.id==='hc2-title')!,proposal={title:'Text styles',targetIds:[node.id],mappings:[{id:'text',label:'Caption',patches:[{id:node.id,changes:{fontSize:11}}]}]};
 const html=renderToStaticMarkup(React.createElement(ComparisonPreview,{...props,compact:true,selectable:false,variant:'typography',proposal,enabled:['text'],beforeChanges:React.createElement('section',null,'Choose another reference')}));
 assert.ok(html.indexOf('comparison-before-after')<html.indexOf('Choose another reference'));
 assert.ok(html.indexOf('Choose another reference')<html.indexOf('confirmation-changes'));
 assert.doesNotMatch(html,/>Preview changes<|type="checkbox"/);
 assert.equal((html.match(/>Before</g)||[]).length,1);assert.equal((html.match(/>After</g)||[]).length,1);
});
