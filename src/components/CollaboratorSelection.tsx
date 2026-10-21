import React, { useEffect, useRef, useState } from 'react';
import { useCollaboration } from '../useCollaboration';
import { InferredReference, UIElement } from '../types';
import { CanvasTransform } from '../workspace';
interface Props {selection:InferredReference|null;nodes:UIElement[];camera:CanvasTransform;collaboration:ReturnType<typeof useCollaboration>}
export default function CollaboratorSelection({selection,nodes,camera,collaboration:c}:Props){
 const latest=useRef({selection,c});latest.current={selection,c};
 const [error,setError]=useState('');
 useEffect(()=>{let last='',busy=false,disposed=false;
  const publish=async()=>{const {selection:s,c:connection}=latest.current;if(!connection.connected){last='';return;}const body={elementIds:s?.selectedIds||[],exemplarIds:s?.exemplarIds||[],scope:s?.scope||'exemplars' as const,method:s?.selectionMethod||'conventional' as const};const key=connection.session?.code+JSON.stringify(body);if(busy||key===last)return;busy=true;try{await connection.publishSelection(body);last=key;if(!disposed)setError('');}catch{if(!disposed)setError('Selection sharing interrupted. Retrying…');}finally{busy=false;}};
  const timer=setInterval(()=>void publish(),200);void publish();return()=>{disposed=true;clearInterval(timer);};
 },[]);
 const other=c.session?.userId==='A'?'B':'A',remote=c.selections[other];
 const visible=c.connected&&c.room?.members.some(m=>m.userId===other&&m.online);
 return <div className="collaborator-selection-layer" aria-hidden={!error}>{error&&<span className="selection-sync-error" role="status">{error}</span>}{visible&&remote&&nodes.filter(n=>remote.elementIds.includes(n.id)).map((n,i)=><div key={n.id} className={`collaborator-selection user-${other}`} style={{left:n.x*camera.scale+camera.x,top:n.y*camera.scale+camera.y,width:n.w*camera.scale,height:n.h*camera.scale}}>{i===0&&<span>User {other}’s selection · {remote.elementIds.length}</span>}</div>)}</div>;
}
