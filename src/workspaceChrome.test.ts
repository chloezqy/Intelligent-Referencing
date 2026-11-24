import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import WorkspaceNavigation from './components/WorkspaceNavigation';
import CollaborationPanel from './components/CollaborationPanel';
test('Navigation adds References alongside Figma sections and disables unused entries',()=>{
 const html=renderToStaticMarkup(React.createElement(WorkspaceNavigation,{active:'layers',open:true,pending:2,onOpen:()=>{}}));
 for(const label of ['Agents','Assets','Tools','Variables','Figma menu'])assert.ok(html.includes(`disabled="" aria-label="${label}"`));
 assert.doesNotMatch(html,/prototype-ai-icon|prototype-logo/);
 assert.match(html,/aria-label="Layers"/);assert.match(html,/aria-label="References"/);assert.match(html,/2 unread reference requests/);assert.doesNotMatch(html,/>Study</);
});
test('References keeps demo reset without study or simulated collaboration explanations',()=>{
 const c={mode:'demo',session:{userId:'A'},room:{members:[],references:[]}} as any;
 const html=renderToStaticMarkup(React.createElement(CollaborationPanel,{nodes:[],collaboration:c,hasDraft:false,onResumeDraft:()=>{},activeId:null,openRevision:0,onOpen:()=>{},onLocate:()=>{},onClear:()=>{}}));
 assert.match(html,/Reset demo/);assert.match(html,/References/);assert.doesNotMatch(html,/Simulated collaboration|Standalone demo|No automatic replies|Workspace mode|References stay in this browser/);
});

test('Editor keeps the Figma mark and a wider default inspector',async()=>{
 const {FigmaMark}=await import('./components/WorkspaceNavigation');
 const {default:ComparisonInspector}=await import('./components/ComparisonInspector');
 const logo=renderToStaticMarkup(React.createElement(FigmaMark));
 assert.match(logo,/fill="none"/);assert.match(logo,/stroke="currentColor"/);
 const inspector=renderToStaticMarkup(React.createElement(ComparisonInspector,{mode:'selection',contentRef:()=>{}}));
 assert.match(inspector,/width:320px/);assert.doesNotMatch(inspector,/avatar|Collaborators/);
});

test('Right sidebar contains moved profile and presentation controls, and Page sections match the reference',async()=>{
 const {default:InspectorHeaderControls}=await import('./components/InspectorHeaderControls');
 const {default:PageInspector}=await import('./components/PageInspector');
 const header=renderToStaticMarkup(React.createElement(InspectorHeaderControls,{session:{userId:'A'} as any,mode:'demo',onPerspective:()=>{}}));
 assert.match(header,/Demo perspective/);assert.match(header,/Present/);assert.match(header,/>Share</);assert.doesNotMatch(header,/Home|New file|Comments|Start audio/);
 const page=renderToStaticMarkup(React.createElement(PageInspector));
 for(const label of ['Page','Styles','Export','MCP','F5F5F5'])assert.ok(page.includes(label));
});
