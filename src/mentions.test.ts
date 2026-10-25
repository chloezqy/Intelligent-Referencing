import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mentionedUsers,mentionQueryAt,insertMention,unreadMention,needsReferenceNotification} from './mentions';
import {SharedReference} from './collaboration';
const members=[{userId:'A' as const},{userId:'B' as const}];
test('Only canonical mentions of joined participants produce IDs; repeats deduplicate',()=>{
 assert.deepEqual(mentionedUsers('@User B please compare with @User A. @User B',members),['B','A']);
 assert.deepEqual(mentionedUsers('mail@User B and @Jenny and @User C',members),[]);
 assert.deepEqual(mentionedUsers('@User B',[{userId:'A'}]),[]);
 assert.deepEqual(mentionedUsers('No mentions',members),[]);
});
test('Mention queries respect caret position and do not open inside email addresses',()=>{
 assert.deepEqual(mentionQueryAt('Review @us',10),{start:7,query:'us'});
 assert.equal(mentionQueryAt('email@user',10),null);
 assert.equal(mentionQueryAt('@User B next',12),null);
 assert.deepEqual(mentionQueryAt('@',1),{start:0,query:''});
});
test('Mention insertion replaces only the active query and preserves text after the caret',()=>{
 assert.deepEqual(insertMention('Please @b compare',7,9,'B'),{text:'Please @User B  compare',caret:15});
 const first=insertMention('@',0,1,'A');const second=insertMention(first.text+'and @b',first.text.length+4,first.text.length+6,'B');
 assert.deepEqual(mentionedUsers(second.text,members),['A','B']);
});
const ref:SharedReference={id:'r',sourceUser:'A',targetUser:'B',elementIds:['x'],exemplarIds:['x'],scope:'exemplars',label:'Target',intent:'Review',message:'@User B review',createdAt:'now',status:'open',responses:[],mentions:['B'],notificationRecipients:['B']};
test('Mention notifications are targeted, clear on authenticated opening, and ignore archived references',()=>{
 assert.equal(unreadMention(ref,'B'),true);assert.equal(unreadMention(ref,'A'),false);
 assert.equal(unreadMention({...ref,activity:[{id:'o',userId:'B',kind:'opened',at:'now',elementIds:[]}]},'B'),false);
 assert.equal(unreadMention({...ref,archivedAt:'now'},'B'),false);
 assert.equal(needsReferenceNotification({...ref,mentions:[],notificationRecipients:[]},'B'),false);
 assert.equal(needsReferenceNotification({...ref,notificationRecipients:undefined},'B'),true);
});
