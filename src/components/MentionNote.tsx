import React,{useRef,useState,useId} from 'react';
import {MentionParticipant,mentionQueryAt,insertMention} from '../mentions';
import {UserId} from '../collaboration';
interface Props {value:string;onChange:(text:string)=>void;members:MentionParticipant[];self?:UserId}
export default function MentionNote({value,onChange,members,self}:Props){
 const input=useRef<HTMLTextAreaElement>(null),listId=useId();
 const [query,setQuery]=useState<ReturnType<typeof mentionQueryAt>>(null),[active,setActive]=useState(0);
 const matches=query?members.filter(m=>`User ${m.userId}`.toLowerCase().includes(query.query.trim().toLowerCase())):[];
 const update=()=>{const el=input.current;if(el){setQuery(mentionQueryAt(el.value,el.selectionStart));setActive(0);}};
 const choose=(userId:UserId)=>{const el=input.current;if(!el||!query)return;const result=insertMention(value,query.start,el.selectionStart,userId);onChange(result.text);setQuery(null);requestAnimationFrame(()=>{el.focus({preventScroll:true});el.setSelectionRange(result.caret,result.caret);});};
 return <div className="mention-note"><label>Note (optional)<textarea ref={input} aria-label="Reference note" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={!!query} aria-controls={query?listId:undefined} aria-activedescendant={query&&matches.length?`${listId}-${Math.min(active,matches.length-1)}`:undefined} value={value} maxLength={2000} rows={2} placeholder="Why should they look? Type @ to mention a room participant." onChange={e=>{onChange(e.target.value);update();}} onClick={update} onKeyUp={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))update();}} onBlur={()=>setQuery(null)} onKeyDown={e=>{
  if(!query||e.nativeEvent.isComposing)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setQuery(null);}
  else if((e.key==='ArrowDown'||e.key==='ArrowUp')&&matches.length){e.preventDefault();setActive(i=>(i+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length);}
  else if(e.key==='Enter'&&matches.length){e.preventDefault();choose(matches[Math.min(active,matches.length-1)].userId);}
 }}/></label>
 {query&&<div data-mention-options className="mention-options"><div role="listbox" id={listId} aria-label="Room participants">{matches.map((member,index)=><button type="button" id={`${listId}-${index}`} role="option" aria-selected={active===index} className={active===index?'active':''} key={member.userId} onPointerDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(index)} onClick={()=>choose(member.userId)}><span className={`mention-avatar user-${member.userId}`} aria-hidden="true">{member.userId}</span><span><strong>User {member.userId}{member.userId===self?' (you)':''}</strong><small>{member.online?'Online':'Offline'}</small></span><i className={member.online?'online':''} aria-hidden="true"/></button>)}</div>{!matches.length&&<p role="status">{members.length?'No matching room participants.':'Join a room to mention its participants.'}</p>}</div>}
 </div>;
}
