import type {UIElement} from './types';
import {validatePatches,type EditProposal} from './editing';
export function hexToHSV(hex:string){const rgb=hex.replace('#','').match(/../g)!.map(v=>parseInt(v,16)/255),[r,g,b]=rgb,max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;let h=d===0?0:max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;return {h:(h*60+360)%360,s:max===0?0:d/max*100,v:max*100};}
export function hsvToHex(h:number,s:number,v:number){s/=100;v/=100;const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c,rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('');}
export function adjustColorProposal(ids:string[],nodes:UIElement[],values:Partial<Record<'bg'|'color'|'border',string>>):EditProposal{
 const patches=nodes.filter(n=>ids.includes(n.id)&&!n.library).flatMap(n=>{const changes:Partial<UIElement>={};for(const [key,color] of Object.entries(values)){if(!/^#[0-9a-f]{6}$/i.test(color)||n[key as keyof UIElement]===undefined)continue;const property=key as 'bg'|'color'|'border',current=n[property]!;const next=property==='border'?/#[0-9a-f]{3,8}\b/i.test(current)?current.replace(/#[0-9a-f]{3,8}\b/i,color):current:color;if(next!==current)changes[property]=next;}return Object.keys(changes).length?[{id:n.id,changes}]:[];});
 validatePatches(nodes,ids,patches);return {title:'Adjust color',targetIds:ids,mappings:patches.map(p=>({id:p.id,label:'Color changes',patches:[p]}))};
}
