import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {compareReferenceElements} from './referencePresentation';
import {previewElements,visualDifferences} from './visualComparison';
import {ruleBasedInterpreter} from './comparisonContext';
import {MOCK_NODES} from './data';
import type {UIElement} from './types';
import type {ComparisonContext} from './collaboration';
import ComparisonOverview from './components/ComparisonOverview';
import ReferencePreviewCard from './components/ReferencePreviewCard';
import ReferenceConversation from './components/ReferenceConversation';
import type {CollaborationClient} from './collaborationClient';
import {demoShare,freshDemo} from './demoCollaboration';

const node=(id:string,extra:Partial<UIElement>={}):UIElement=>({id,type:'button',label:id,x:0,y:0,w:80,h:30,role:'primaryCTA',text:'Buy',bg:'#fff',color:'#000',radius:4,fontSize:12,fontWeight:'400',border:'1px solid #000',...extra});
const context=(a:string[],b:string[],nodes:UIElement[]):ComparisonContext=>({snapshotId:'visual',purpose:'Compare selected elements',selections:{A:{userId:'A',elementIds:a,exemplarIds:a,scope:'exemplars',method:'conventional',revision:1},B:{userId:'B',elementIds:b,exemplarIds:b,scope:'exemplars',method:'conventional',revision:1}},interpretation:ruleBasedInterpreter.interpret(a,b,nodes)});

test('Visual summary prioritizes fully recorded differences, caps at five and preserves raw comparison rows',()=>{
 const nodes=[node('a'),node('b',{role:'secondaryCTA',text:'Save',w:100,bg:'#eee',color:'#111',radius:8,fontSize:14,fontWeight:'600',border:'2px solid #333'})];
 const comparison=compareReferenceElements(['a','b'],nodes),before=JSON.stringify(comparison);
 const summary=visualDifferences(comparison,context(['a'],['b'],nodes));
 assert.equal(summary.total,9);assert.equal(summary.rows.length,5);
 assert.deepEqual(summary.rows.map(r=>r.row.key),['role','text','dimensions','background','color']);
 assert.deepEqual(summary.rows[0].groups.map(g=>g.label),['User A','User B']);
 assert.equal(JSON.stringify(comparison),before);
});
test('Group summary compares distinct sets without pairing objects or treating equal mixtures as user differences',()=>{
 const nodes=[node('a',{bg:'#fff'}),node('b',{bg:'#000'}),node('c',{bg:'#000'}),node('d',{bg:'#fff'}),node('e',{bg:'#eee'})];
 const ids=nodes.map(n=>n.id),comparison=compareReferenceElements(ids,nodes);
 assert.equal(visualDifferences(comparison,context(['a','b'],['c','d'],nodes)).total,0);
 const summary=visualDifferences(comparison,context(['a','b'],['b','c','e'],nodes));
 assert.deepEqual(summary.rows[0].groups.map(g=>g.values),[['#fff','#000'],['#000','#eee']]);
 assert.equal(visualDifferences(comparison,context(['a'],['missing'],nodes)).total,0);
});
test('Missing values are not differences; incomplete details remain collapsed and wholly absent rows are omitted',()=>{
 const nodes=[node('a',{bg:undefined,border:undefined}),node('b',{bg:'#fff',border:undefined,text:'Save'})];
 const ctx=context(['a'],['b'],nodes);
 const html=renderToStaticMarkup(React.createElement(ComparisonOverview,{context:ctx,contextId:'missing',ids:['a','b'],nodes}));
 assert.ok(!html.includes('data-summary-property="background"'));assert.ok(!html.includes('data-property="border"'));
 assert.ok(html.includes('data-property="background"'));
 assert.match(html,/class="visual-property-details"><summary>View detailed properties/);
 assert.match(html,/class="incomplete-properties"><summary>Show/);
 assert.ok(html.indexOf('data-property="background"')>html.indexOf('incomplete-properties'));
 assert.ok(!html.includes('AI-generated'));
});
test('Preview cards preserve selection order, show at most three actual tiles, and label missing elements',()=>{
 const nodes=[node('c'),node('a'),node('b'),node('d')];
 const html=renderToStaticMarkup(React.createElement(ReferencePreviewCard,{ids:['b','missing','a','c'],nodes,user:'B',self:'B'}));
 assert.match(html,/User B/);assert.match(html,/You/);assert.match(html,/4 objects/);assert.match(html,/\+1 more selected/);
 assert.equal((html.match(/<figure/g)||[]).length,3);
 assert.ok(html.indexOf('Preview of b')<html.indexOf('Element unavailable'));
 assert.ok(html.indexOf('Element unavailable')<html.indexOf('Preview of a'));
 assert.ok(!html.includes('<image'));assert.ok(!html.includes('https://'));
});
test('Preview geometry includes existing descendants once, is bounded, and tolerates cycles',()=>{
 const root=node('root',{type:'card',w:300,h:200,parent:'child'});
 const child=node('child',{parent:'root',x:20,y:30});
 const nodes=[root,child,...Array.from({length:100},(_,i)=>node(String(i),{parent:'root'}))];
 const preview=previewElements(root,nodes);
 assert.equal(preview.length,64);assert.equal(new Set(preview.map(n=>n.id)).size,64);
 assert.equal(preview[1],child);
 const html=renderToStaticMarkup(React.createElement(ReferencePreviewCard,{ids:['root'],nodes}));
 assert.match(html,/viewBox="0 0 300 200"/);assert.match(html,/x="20" y="30"/);
});
test('An unowned Compare reference shows actual targets without inventing A/B assignment',()=>{
 const html=renderToStaticMarkup(React.createElement(ComparisonOverview,{contextId:'unowned',ids:['hc1-title','hc1-cta'],nodes:MOCK_NODES}));
 assert.match(html,/Selected references/);assert.ok(!html.includes('User A references'));assert.ok(!html.includes('User B references'));
 assert.ok(!html.includes('Rule-based insight')); // No frozen interpretation exists to display.
});
test('Group values remain bounded in the visual summary while exact details and labels remain inspectable',()=>{
 const nodes=[node('a',{text:'A'}),node('b',{text:'B'}),node('c',{text:'C'}),node('d',{text:'D'}),node('e',{text:'E'})];
 const html=renderToStaticMarkup(React.createElement(ComparisonOverview,{contextId:'groups',context:context(['a','b','c'],['d','e'],nodes),ids:nodes.map(n=>n.id),nodes}));
 assert.match(html,/\+1 more/);assert.match(html,/data-property="text"/);
 assert.match(html,/data-summary-property="text"/);
});
test('Saved Compare uses the same overview and keeps replies/review, while ordinary Review retains its presentation',()=>{
 const room=demoShare(freshDemo(),{elementIds:['hc1-title','sc1-cta'],exemplarIds:['hc1-title'],scope:'document',label:'Compare',comparison:context(['hc1-title'],['sc1-cta'],MOCK_NODES)},'Compare','@User B check this','ref',false);
 const ref={...room.references[0],responses:[{id:'reply',userId:'B' as const,message:'Checked both',createdAt:'2026-10-26T10:00:00Z'}]};
 const c={session:{userId:'B'},connected:true,busy:false} as CollaborationClient;
 const html=renderToStaticMarkup(React.createElement(ReferenceConversation,{active:ref,nodes:MOCK_NODES,collaboration:c,onLocate:()=>{},onClear:()=>{}}));
 assert.equal((html.match(/class="comparison-overview"/g)||[]).length,1);assert.ok(!html.includes('Rule-based insight'));
 assert.match(html,/Checked both/);assert.match(html,/Mark reviewed/);assert.match(html,/Reply to User A/);
 const normal=renderToStaticMarkup(React.createElement(ReferenceConversation,{active:{...ref,intent:'Review'},nodes:MOCK_NODES,collaboration:c,onLocate:()=>{},onClear:()=>{}}));
 assert.ok(!normal.includes('class="comparison-overview"'));assert.match(normal,/Property comparison · rule-based/);
});
