import React from 'react';
import PrototypeAIIcon from './AIIcon';
export function AIIcon({name='ai'}:{name?:string}){if(['ai','spark','spark-active'].includes(name))return <PrototypeAIIcon className={`ai-flow-icon ai-flow-icon-${name}`}/>;return <img className={`ai-flow-icon ai-flow-icon-${name}`} src={`/ai-actions/${name}.svg`} alt="" aria-hidden="true"/>;}
export default function AIActionsPanel({count,children}:{count:number;children?:React.ReactNode}){
 return <section className={`design-ai-actions ${count?'':'is-empty'}`} aria-label="AI Actions">
  <div className="ai-actions-heading"><span className="ai-actions-emblem"><AIIcon/></span><strong>AI Actions</strong>{count>0&&<small>{count} {count===1?'layer':'layers'}</small>}</div>
  <div className="ai-actions-body">{count?children:<p className="ai-actions-empty">Select layers to see AI suggestions.</p>}</div>
 </section>;
}
