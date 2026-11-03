import React from 'react';
import type {RoomSnapshot,Session} from '../collaboration';
import type {CollaborationMode} from '../collaborationClient';
export default function InspectorUserControls({mode,session,room}:{mode:CollaborationMode;session:Session|null;room:RoomSnapshot|null}){
 return <div className="inspector-user-controls" aria-label="Collaborators">
 {session&&<div className="header-presence">{(['A','B'] as const).map(user=>{const online=!!room?.members.find(m=>m.userId===user)?.online;return <span key={user} className={'avatar user-'+user+(online?' is-online':'')} aria-label={'User '+user+': '+(online?'online':'offline / not joined')} title={(mode==='demo'?'Simulated ':'')+'User '+user+': '+(online?'online':'offline / not joined')}>{user}</span>;})}</div>}
 {!session&&mode!=='demo'&&<span className="inspector-user-placeholder">No room joined</span>}
 </div>;
}
