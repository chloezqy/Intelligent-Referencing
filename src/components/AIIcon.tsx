import React from 'react';
import {Sparkles,type LucideProps} from 'lucide-react';
/** One mark for AI assistance, Smart Gesture, and prototype branding. */
export default function AIIcon({size=14,className='',...props}:LucideProps & {className?:string}){
 return <Sparkles size={size} strokeWidth={1.75} aria-hidden="true" {...props} className={`prototype-ai-icon ${className}`.trim()}/>;
}
