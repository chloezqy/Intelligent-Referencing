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
 const kinds=[...new Set(targets.map(node=>roleNames[node.role||'']||({text:'text elements',button:'buttons',image:'images',icon:'icons',card:'cards',chip:'filters'}[node.type]||'design elements')))];
 // Derive visible titles from actual targets, never from model design judgments.
 const title=role&&roleNames[role]?`Matching ${roleNames[role]}`:kinds.length?shortText(kinds.slice(0,2).join(' + ')+(kinds.length>2?' + related objects':''),8):'Related design elements';
 const screens=[...new Set(targets.map(node=>node.screen).filter(Boolean))];
 return {title,context:screens.join(' + ')||'Selected design elements',count:candidate.elementIds.length};
}
