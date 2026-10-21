import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
interface Props { shareLabel:string; count: number; onShare: (note: string) => void }
export default function PromptBar({shareLabel,count,onShare}: Props) {
  const [note,setNote]=useState('');
  return <form className="ai-input reference-input" onSubmit={e=>{e.preventDefault();onShare(note);setNote('');}}><Share2 size={16}/><input aria-label="Reference request" value={note} maxLength={2000} onChange={e=>setNote(e.target.value)} placeholder={count ? `Why should your collaborator look at these ${count} objects?` : 'Select or gesture around objects to reference them'}/><button disabled={!count} type="submit">{shareLabel}</button></form>;
}
