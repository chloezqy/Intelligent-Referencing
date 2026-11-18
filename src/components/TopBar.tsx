import React from 'react';
import {FileText,Home,Plus,X,ChevronDown,Play,MessageCircle,AudioLines} from 'lucide-react';
import {RoomSnapshot,Session} from '../collaboration';
interface Props {studyActive?:boolean;onToggleStudy?:()=>void;onPerspective?:(user:'A'|'B')=>void;mode:import('../collaborationClient').CollaborationMode;scale:number;onZoomIn:()=>void;onZoomOut:()=>void;onZoomFit:()=>void;onShowHelp:()=>void;session:Session|null;room:RoomSnapshot|null;connected:boolean;onOpenRoom:()=>void}
export default function TopBar({onPerspective,mode,scale,onZoomFit,session}:Props){
 return <header className="top-header">
  <div className="file-tab-strip"><button disabled type="button" aria-label="Home"><Home size={16}/></button><div className="document-tab"><FileText size={15}/><span>Mobile Commerce Workspace</span><button disabled type="button" aria-label="Close file"><X size={12}/></button></div><button disabled type="button" aria-label="New file"><Plus size={16}/></button></div>
  <div className="header-actions">
   {mode==='demo'&&<div className="perspective-control"><span className={`header-avatar user-${session?.userId||'A'}`} aria-hidden="true">{session?.userId||'A'}</span><select aria-label="Demo perspective" value={session?.userId||'A'} onChange={e=>onPerspective?.(e.target.value as 'A'|'B')}><option value="A">User A</option><option value="B">User B</option></select></div>}
   <button disabled type="button" aria-label="Comments"><MessageCircle size={17}/></button><button disabled type="button" aria-label="Start audio conversation"><AudioLines size={17}/></button>
   <button disabled type="button" aria-label="Present"><Play size={16}/><ChevronDown size={10}/></button>
   <button disabled type="button" className="figma-share-placeholder">Share</button>
   <button type="button" aria-label="Zoom to fit" onClick={onZoomFit}>{Math.round(scale*100)}%<ChevronDown size={12}/></button>
  </div>
 </header>;
}
