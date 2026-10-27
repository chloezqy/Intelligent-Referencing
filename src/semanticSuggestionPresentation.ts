import {SemanticCandidate} from './semanticInterpretation';
import {UIElement} from './types';

const roleNames:Record<string,string>={favorite:'favorite buttons',primaryCTA:'primary actions',secondaryCTA:'secondary actions',productTitle:'product titles',productImage:'product images',price:'prices',rating:'ratings',filterChip:'filters',card:'product cards'};
function shortText(text:string,limit:number){
 const words=text.trim().split(/\s+/).filter(Boolean);
 return words.slice(0,limit).map(word=>word.length>36?`${word.slice(0,33)}…`:word).join(' ')+(words.length>limit?'…':'');
}
/** Presentation only: keep the original candidate and its validated targets intact. */
export function semanticSuggestionPresentation(candidate:SemanticCandidate,nodes:UIElement[]){
 const targets=candidate.elementIds.map(id=>nodes.find(node=>node.id===id)).filter((node):node is UIElement=>!!node);
 const roles=new Set(targets.map(node=>node.role));
 const role=roles.size===1?targets[0]?.role:undefined;
 const compactModelTitle=candidate.label.trim().split(/\s+/).length<=6&&!candidate.elementIds.some(id=>candidate.label.split(/\W+/).includes(id));
 const title=compactModelTitle?shortText(candidate.label,6):role&&roleNames[role]?(targets.length>1?`Matching ${roleNames[role]}`:shortText(targets[0].label,6)):shortText(candidate.label,6);
 const screens=[...new Set(targets.map(node=>node.screen).filter(Boolean))];
 const ids=new Set(candidate.elementIds);
 const reason=candidate.reason.split(/\s+/).filter(word=>!ids.has(word.replace(/[(),.;:]/g,''))).join(' ');
 return {title,context:screens.join(' + ')||'Selected design elements',count:candidate.elementIds.length,reason:shortText(reason,9)};
}
