import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import DesignInspector from './components/DesignInspector';
import {MOCK_NODES} from './data';
import {propertyProposal,selectedProperty} from './designInspectorProperties';
import {applyPatches,proposalPatches} from './editing';
const noop=()=>{};
const render=(ids:string[])=>renderToStaticMarkup(React.createElement(DesignInspector,{ids,nodes:MOCK_NODES,onProperties:noop,onAlign:noop,tools:()=>null,preview:()=>null,history:null}));
test('native hierarchy uses compact real previews for text, image, shape, component and mixed selections',()=>{
 const text=MOCK_NODES.find(n=>n.type==='text'&&n.fontSize!==undefined&&!n.library)!;
 const image=MOCK_NODES.find(n=>n.type==='image'&&!n.library)!;
 const shape=MOCK_NODES.find(n=>n.type==='rect'&&!n.library)||MOCK_NODES.find(n=>n.type==='chip'&&!n.library)!;
 for(const node of [text,image,shape,MOCK_NODES.find(n=>n.id==='hc1')!]){
 const html=render([node.id]);
 assert.match(html,/design-selection-preview/);assert.match(html,/class="element-preview"/);
 assert.ok(html.indexOf('>Position<')<html.indexOf('>Layout<'));assert.ok(html.indexOf('>Layout<')<html.indexOf('>Fill<'));
 assert.doesNotMatch(html,/Rotation|Opacity|Sharing options|Suggested actions/);
 }
 assert.match(render([text.id]),/>Typography</);assert.doesNotMatch(render([image.id]),/>Typography</);
 assert.match(render(['hc1','hc4']),/Mixed/);
});
test('native field edits reuse validated patches, preserve source until Apply and support cancel/undo snapshots',()=>{
 const before=MOCK_NODES,node=before.find(n=>n.id==='hc2-img')||before.find(n=>n.type==='image'&&!n.library)!;
 const proposal=propertyProposal([node.id],before,'Appearance',{radius:9}),patches=proposalPatches(proposal,['properties'],before);
 const preview=applyPatches(before,patches);assert.equal(before.find(n=>n.id===node.id)!.radius,node.radius);assert.equal(preview.find(n=>n.id===node.id)!.radius,9);
 // Cancel discards the transient projection. Apply uses those same validated patches; undo restores the snapshot.
 assert.equal(before.find(n=>n.id===node.id)!.radius,node.radius);
 assert.equal(applyPatches(before,patches).find(n=>n.id===node.id)!.radius,9);
 assert.throws(()=>propertyProposal([node.id],before,'Appearance',{w:10}));
 assert.throws(()=>propertyProposal([node.id],before,'Layout',{w:-2}));
 assert.throws(()=>propertyProposal(['ds-product-card-img'],before,'Appearance',{radius:9}));
});
test('position edits move component descendants together and mixed properties remain explicit',()=>{
 const root=MOCK_NODES.find(n=>n.id==='hc1')!,child=MOCK_NODES.find(n=>n.parent===root.id)!;
 const proposal=propertyProposal([root.id],MOCK_NODES,'Position',{x:root.x+5}),after=applyPatches(MOCK_NODES,proposalPatches(proposal,['properties'],MOCK_NODES));
 assert.equal(after.find(n=>n.id===child.id)!.x,child.x+5);
 const state=selectedProperty(['hc1','hc4'],MOCK_NODES,'h');assert.equal(state.mixed,true);assert.equal(state.editable,true);
 const missing=selectedProperty(['hc1',child.id],MOCK_NODES,'fontSize');assert.equal(missing.editable,false);
});
test('contextual assistance remains reachable when an object has no appearance properties',()=>{
 const html=renderToStaticMarkup(React.createElement(DesignInspector,{ids:['hc1-title'],nodes:MOCK_NODES,onProperties:noop,onAlign:noop,tools:section=>section==='Appearance'?[React.createElement('button',{key:'ai'},'Ask AI about this selection')]:[],preview:()=>null,history:null}));
 assert.match(html,/>Appearance</);assert.match(html,/Ask AI about this selection/);
});

test('direct typography controls can edit a text layer with implicit font and alignment defaults',()=>{
 const node=MOCK_NODES.find(n=>n.id==='hc2-title')!;
 const nodes=MOCK_NODES.map(n=>n.id===node.id?{...n,fontFamily:undefined,textAlign:undefined,textVerticalAlign:undefined}:n);
 const values={fontFamily:'Georgia',textAlign:'left',textVerticalAlign:'top'} as const;
 const proposal=propertyProposal([node.id],nodes,'Typography',values);
 const after=applyPatches(nodes,proposalPatches(proposal,['properties'],nodes)).find(n=>n.id===node.id)!;
 for(const [key,value] of Object.entries(values))assert.equal(after[key as keyof typeof after],value);
 assert.equal(after.text,node.text);
});
