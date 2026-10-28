import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ComparisonInspector from './components/ComparisonInspector';
import SelectionDetails from './components/SelectionDetails';
import EditingToolbar from './components/EditingToolbar';
import {MOCK_NODES} from './data';
test('Selection inspector has its own identity, details and no implicit comparison UI',()=>{
 const html=renderToStaticMarkup(React.createElement(ComparisonInspector,{mode:'selection',open:true,count:1,onClose:()=>{},contentRef:()=>{}},React.createElement(SelectionDetails,{ids:['hc1'],nodes:MOCK_NODES})));
 assert.match(html,/Selection inspector/);assert.match(html,/>Selection</);assert.match(html,/1 object/);assert.match(html,/Nordic Lounge Chair/);assert.match(html,/Home/);assert.doesNotMatch(html,/Object B|Comparison purpose|Compare differences/);
 const compare=renderToStaticMarkup(React.createElement(ComparisonInspector,{mode:'compare',open:true,count:2,onClose:()=>{},contentRef:()=>{}}));assert.match(compare,/Comparison inspector/);assert.match(compare,/>Compare</);
});
test('Selection group details preserve every target, aggregate recorded values and omit absent properties',()=>{
 const html=renderToStaticMarkup(React.createElement(SelectionDetails,{ids:['hc1','hc2'],nodes:MOCK_NODES}));assert.match(html,/2 objects/);assert.match(html,/Nordic Lounge Chair/);assert.match(html,/Minimalist Desk Lamp/);assert.doesNotMatch(html,/Font family|Unavailable|Object B/);
});
test('Selection actions share the existing editor and present Design system once in its own section',()=>{
 const noop=()=>{};const html=renderToStaticMarkup(React.createElement(EditingToolbar,{selectionInspector:true,inline:true,selection:{selectedIds:['hc1','hc2'],exemplarIds:['hc1','hc2'],label:'Cards',scope:'exemplars'},nodes:MOCK_NODES,onPreview:noop,onApply:noop,onUndo:noop,onRedo:noop,canUndo:false,canRedo:false,sourceId:null,onSource:noop,picking:false,onPicking:noop,onState:noop}));
 assert.match(html,/Suggested actions/);assert.match(html,/Align elements/);assert.match(html,/Ask AI for recommendations/);assert.equal((html.match(/>Find design system matches</g)||[]).length,1);assert.match(html,/Editing history/);assert.doesNotMatch(html,/<form/);
});
test('Selection summary reuses actual previews, caps groups, and only calls equal recorded values shared',()=>{
 const ids=['hc1','hc2','hc3','hc4','sc1','sc2','sc3','sc4'];
 const html=renderToStaticMarkup(React.createElement(SelectionDetails,{ids,nodes:MOCK_NODES}));
 assert.equal((html.match(/class="element-preview"/g)||[]).length,3);assert.match(html,/\+5 more/);assert.match(html,/View all properties/);
 const summary=html.slice(0,html.indexOf('View all properties'));assert.doesNotMatch(summary,/<dt>Corner radius<\/dt>|<dt>Dimensions<\/dt>/);
 const single=renderToStaticMarkup(React.createElement(SelectionDetails,{ids:['hc1'],nodes:MOCK_NODES}));assert.equal((single.match(/class="element-preview"/g)||[]).length,1);assert.match(single,/165 × 230 px/);
 const unavailable=renderToStaticMarkup(React.createElement(SelectionDetails,{ids:['hc1','missing'],nodes:MOCK_NODES}));assert.doesNotMatch(unavailable,/selection-shared-properties/);assert.match(unavailable,/1 unavailable objects/);
});
