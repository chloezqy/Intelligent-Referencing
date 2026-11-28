import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {meaningfulShareNote,validateShareNoteInterpretation} from './shareNoteInterpretation';
import {createShareNoteRequests,type ShareNoteInput,type ShareNoteState} from './shareNoteClient';
import {MOCK_NODES} from './data';
import {freshDemo,demoShare} from './demoCollaboration';
import {validateShareRecipients} from './mentions';
import SenderNote from './components/SenderNote';
import ShareRecipients from './components/ShareRecipients';
const input:ShareNoteInput={ids:['hc1-img'],note:'review the shape',request:'Review',nodes:MOCK_NODES};
const result={source:'model' as const,kind:'rewrite' as const,text:'Review this image and share your feedback.',referencedIds:['hc1-img'],relatedIds:[],properties:[]};
test('Empty and mention-only notes do not request AI; meaningful input debounces and stale responses are ignored',async()=>{
 let scheduled:(()=>void)|undefined,calls=0,resolve:(r:typeof result)=>void=()=>{};const states:ShareNoteState[]=[];
 const manager=createShareNoteRequests(s=>states.push(s),async()=>{calls++;return new Promise(r=>resolve=r);},(fn,delay)=>{assert.equal(delay,1000);scheduled=fn;return 1;},()=>{scheduled=undefined;});
 manager.update({...input,note:''});assert.equal(states.at(-1)!.status,'empty');assert.equal(calls,0);
 manager.update({...input,note:'@User B'});assert.equal(states.at(-1)!.status,'empty');
 manager.update(input);assert.equal(states.at(-1)!.status,'waiting');manager.update({...input,note:'review the shape please'});scheduled!();assert.equal(calls,1);assert.equal(states.at(-1)!.status,'generating');
 manager.update({...input,note:'newer note'});resolve(result);await Promise.resolve();await Promise.resolve();assert.equal(states.at(-1)!.status,'waiting');manager.cancel();
});
test('Clear notes and unavailable AI preserve normal note entry',async()=>{
 let trigger:()=>void=()=>{};const states:ShareNoteState[]=[];
 const manager=createShareNoteRequests(s=>states.push(s),async()=>({...result,kind:'clear',text:''}),(fn)=>{trigger=fn;return 1;},()=>{});
 manager.update(input);trigger();await Promise.resolve();await Promise.resolve();assert.equal(states.at(-1)!.status,'empty');
 const failed=createShareNoteRequests(s=>states.push(s),async()=>{throw Error('Unavailable');},fn=>{trigger=fn;return 1;},()=>{});failed.update(input);trigger();await Promise.resolve();await Promise.resolve();assert.equal(states.at(-1)!.status,'error');
});
test('Vague notes receive grounded rewrites; invented objects, values and properties are rejected',()=>{
 assert.equal(meaningfulShareNote('look at this'),true);assert.equal(meaningfulShareNote('...'),false);
 const {source,...payload}=result;
 assert.equal(validateShareNoteInterpretation(payload,input.ids,'look at this',MOCK_NODES).kind,'rewrite');
 assert.throws(()=>validateShareNoteInterpretation({...payload,kind:'rewrite',properties:['radius']},input.ids,'look at this',MOCK_NODES),/specific changes/);
 assert.throws(()=>validateShareNoteInterpretation({...payload,referencedIds:['invented']},input.ids,input.note,MOCK_NODES));
 assert.throws(()=>validateShareNoteInterpretation({...payload,text:'Use 98765px radius.'},input.ids,input.note,MOCK_NODES));
 assert.throws(()=>validateShareNoteInterpretation({...payload,properties:['padding']},input.ids,input.note,MOCK_NODES));
});
test('Recipients notify actual room members without altering the sender-approved note',()=>{
 assert.deepEqual(validateShareRecipients(['B'],'A',freshDemo().members),['B']);assert.throws(()=>validateShareRecipients(['A'],'A',freshDemo().members));assert.throws(()=>validateShareRecipients(['C'],'A',freshDemo().members));
 const room=demoShare(freshDemo(),{elementIds:['hc1-img'],exemplarIds:['hc1-img'],scope:'exemplars',label:'Image'},'Review','look at this','sender-note',true,'A',['B']);
 const ref=room.references[0];assert.equal(ref.message,'look at this');assert.deepEqual(ref.notificationRecipients,['B']);assert.equal(ref.targetUser,'B');assert.equal(ref.attention.length,1);
});
test('Empty sender note has no AI panel or generation button; recipient chips use real users',()=>{
 const html=renderToStaticMarkup(React.createElement(SenderNote,{note:'',onNote:()=>{},request:'Review',ids:input.ids,nodes:MOCK_NODES,members:freshDemo().members,self:'A'}));
 assert.match(html,/Add context\.\.\./);assert.doesNotMatch(html,/AI interpretation|Interpret reference with AI|Accept suggestion|Try again/);
 const picker=renderToStaticMarkup(React.createElement(ShareRecipients,{members:freshDemo().members,self:'A',selected:['B'],onChange:()=>{}}));assert.match(picker,/@User B/);assert.match(picker,/Remove User B/);assert.match(picker,/Add people…/);
});

test('Writing decoration isolates the changed words and suppression ignores cosmetic edits',async()=>{
 const {noteSuggestionRange,noteIdentity}=await import('./shareNoteInterpretation');
 assert.deepEqual(noteSuggestionRange('Please review this today.','Please review the Product Card today.'),{start:14,end:18});
 assert.equal(noteIdentity('Look at this! '),noteIdentity('look  at this'));
});

test('Quick Share avatars reflect actual presence and empty messages use the neutral sharing intent',()=>{
 const room=freshDemo();
 const picker=renderToStaticMarkup(React.createElement(ShareRecipients,{quick:true,members:room.members.map(m=>({...m,online:false})),self:'A',selected:['B'],onChange:()=>{}}));
 assert.match(picker,/Teammates in this file/);assert.match(picker,/Share with User B/);assert.match(picker,/aria-pressed="true"/);assert.match(picker,/Offline/);assert.doesNotMatch(picker,/● Online|User C|combobox/);
 const shared=demoShare(room,{elementIds:['hc1'],exemplarIds:['hc1'],scope:'exemplars',label:'Card'},'Look at this','','quick-empty',false,'A',['B']);
 assert.equal(shared.references[0].intent,'Look at this');assert.equal(shared.references[0].message,'');assert.deepEqual(shared.references[0].notificationRecipients,['B']);
});
