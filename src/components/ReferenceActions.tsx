import React from 'react';
import { ReferenceIntent } from '../collaboration';
interface Props { shareLabel:string; onAction:(intent?:ReferenceIntent)=>void }
export default function ReferenceActions({shareLabel,onAction}:Props){
  return <div className="reference-actions" aria-label="Selection reference actions">
    <button type="button" onClick={()=>onAction()}>{shareLabel}</button>
  </div>;
}
