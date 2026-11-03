import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MOCK_NODES} from './data';
import {TYPOGRAPHY} from './designSystem';
import {textStyleLibrary,textStyleProposal,validateTextStyleSuggestions} from './textStyleMatching';
import {applyPatches,proposalPatches} from './editing';
import {textStyleContext,textStylePayload,parseTextStyleOutput} from '../server/textStyleMatching';
import TextStyleReview from './components/TextStyleReview';
test('all actual library typography styles are available without inventing values',()=>{
 const styles=textStyleLibrary(MOCK_NODES);assert.deepEqual(styles.map(s=>s.token?.replace('Typography / ','')),Object.keys(TYPOGRAPHY));
 for(const s of styles){const style=TYPOGRAPHY[s.token!.slice(13) as keyof typeof TYPOGRAPHY];for(const [key,value] of Object.entries(style))assert.equal(s[key as keyof typeof s],value);}
});
test('ranked AI text references validate actual targets and styles and preserve model provenance',()=>{
 const ids=['hc2-title'],context=textStyleContext({contextId:'text-test',targetIds:ids,document:MOCK_NODES}),styles=textStyleLibrary(MOCK_NODES);
 const output={status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions:styles.slice(0,3).map(s=>({targetId:ids[0],styleId:s.id,reason:'Supporting product information'}))})}]}]};
 const suggestions=parseTextStyleOutput(output,context);assert.equal(suggestions.length,3);assert.ok(suggestions.every(s=>s.source==='model'));assert.match(textStylePayload(context,'fixture').instructions,/not just font size/);
 assert.throws(()=>validateTextStyleSuggestions([{...suggestions[0],styleId:'invented'}],ids,MOCK_NODES));
 assert.throws(()=>validateTextStyleSuggestions([{...suggestions[0],targetId:'sc2-title'}],ids,MOCK_NODES));
});
test('manual style changes preserve content and unrelated appearance and exact styles create no edits',()=>{
 const ids=['hc2-title','hc1-title'],style=textStyleLibrary(MOCK_NODES).find(s=>s.token==='Typography / Caption')!,before=JSON.stringify(MOCK_NODES),choices=ids.map(targetId=>({targetId,styleId:style.id})),p=textStyleProposal(choices,ids,MOCK_NODES),patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES),after=applyPatches(MOCK_NODES,patches);
 for(const id of ids){const target=after.find(n=>n.id===id)!,original=MOCK_NODES.find(n=>n.id===id)!;assert.equal(target.fontSize,style.fontSize);assert.equal(target.color,style.color);for(const key of ['text','label','bg','radius','x','y','w','h'] as const)assert.equal(target[key],original[key]);}
 assert.equal(JSON.stringify(MOCK_NODES),before);assert.equal(textStyleProposal(choices,ids,after).mappings.length,0);
});
test('text style browser remains available before AI responds with actual styled samples',()=>{
 const noop=()=>{},html=renderToStaticMarkup(React.createElement(TextStyleReview,{ids:['hc2-title'],nodes:MOCK_NODES,onPreview:noop,onApply:noop,onCancel:noop}));
 assert.match(html,/Other available text styles/);for(const name of Object.keys(TYPOGRAPHY))assert.ok(html.includes(name));
 assert.match(html,/text-style-sample/);assert.doesNotMatch(html,/>Propose|>Preview</);assert.ok(html.indexOf('>Apply changes<')<html.indexOf('>Cancel<'));
});
test('unified references accept compatible canvas text and reject self, descendants and invented sources',()=>{
 const ids=['hc2-title'],suggestion={targetId:ids[0],styleId:'hc1-title',reason:'Corresponding product title',source:'model'};
 assert.equal(validateTextStyleSuggestions([suggestion],ids,MOCK_NODES,true)[0].styleId,'hc1-title');
 assert.throws(()=>validateTextStyleSuggestions([{...suggestion,styleId:ids[0]}],ids,MOCK_NODES,true));
 assert.throws(()=>textStyleProposal([{targetId:ids[0],styleId:ids[0]}],ids,MOCK_NODES));
 assert.throws(()=>textStyleProposal([{targetId:ids[0],styleId:'hc1-img'}],ids,MOCK_NODES));
 const nodes=MOCK_NODES.map(n=>n.id==='hc1-title'?{...n,fontSize:30,color:'#ff0000'}:n),p=textStyleProposal([{targetId:ids[0],styleId:'hc1-title'}],ids,nodes),after=applyPatches(nodes,p.mappings.flatMap(m=>m.patches)),target=after.find(n=>n.id===ids[0])!,before=nodes.find(n=>n.id===ids[0])!;
 assert.equal(target.fontSize,30);assert.equal(target.color,'#ff0000');assert.equal(target.text,before.text);assert.equal(target.x,before.x);
 const c=textStyleContext({contextId:'unified',targetIds:ids,document:MOCK_NODES,canvasReferences:true});
 assert.ok(c.styles.some(s=>s.id==='hc1-title'));assert.match(textStylePayload(c,'fixture').instructions,/Prefer a relevant design system style/);
});
test('unified browser exposes source picking alongside actual library styles',()=>{
 const noop=()=>{},html=renderToStaticMarkup(React.createElement(TextStyleReview,{ids:['hc2-title'],nodes:MOCK_NODES,picking:true,onPicking:noop,onPreview:noop,onApply:noop,onCancel:noop}));
 assert.match(html,/Choose another reference/);assert.match(html,/Pick source/);assert.match(html,/Escape to cancel/);assert.match(html,/Other available text styles/);
 assert.doesNotMatch(html,/Source object|Find source in file|Propose changes/);
});
