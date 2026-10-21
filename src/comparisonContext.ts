import { UIElement } from './types';
import { compareReferenceElements } from './referencePresentation';
export interface ContextInterpretation {summary:string;evidence:string[];purposes:string[];provenance:'rule-based'}
export interface ContextInterpreter {interpret:(a:string[],b:string[],nodes:UIElement[])=>ContextInterpretation}
export const ruleBasedInterpreter:ContextInterpreter={interpret(a,b,nodes){
 const ids=[...new Set([...a,...b])],targets=nodes.filter(n=>ids.includes(n.id));
 const same=a.length===b.length&&a.every(id=>b.includes(id));
 const roles=[...new Set(targets.map(n=>n.role).filter(Boolean))],screens=[...new Set(targets.map(n=>n.screen).filter(Boolean))];
 let summary='These selections contain different kinds of objects. What relationship would you like to discuss?',purposes=['Explain the relationship','Review selected objects'];
 if(same){summary='Both users selected the same objects. Choose what you want to review together.';purposes=['Review together','Discuss wording','Discuss styling'];}
 else if(targets.length&&targets.every(n=>n.role==='primaryCTA')){summary='Both selections contain primary actions. You could compare their visual consistency or wording.';purposes=['Visual consistency','Wording consistency'];}
 else if(targets.length&&targets.every(n=>n.role==='price'||n.role==='originalPrice')){summary='Both selections contain prices. You could compare formatting or price differences.';purposes=['Price formatting','Price differences'];}
 else if(targets.length&&targets.every(n=>n.type==='image'||n.type==='card')){summary='Both selections contain images or cards. You could compare dimensions and styling.';purposes=['Dimensions and styling','Component consistency'];}
 else if(roles.length===1&&targets.every(n=>n.role)){summary=`The selections share the ${roles[0]} role. You could compare their properties or purpose.`;purposes=['Component consistency','Property differences'];}
 const differences=compareReferenceElements(ids,nodes).rows.filter(r=>r.state==='different').map(r=>r.label);
 return {summary,evidence:[`${targets.length} unique objects across ${screens.length} screen(s)`,...(roles.length===1?[`Shared role: ${roles[0]}`]:[]),...(differences.length?[`Authored differences: ${differences.join(', ')}`]:[]),...(targets.length<ids.length?['Some target metadata is unavailable.']:[])],purposes:purposes.slice(0,3),provenance:'rule-based'};
}};
