import type {UIElement} from './types';
/** Multiline content is limited to authored blocks with room for more than one line. */
export function wrapsMockText(node:UIElement){return !!node.text&&node.role!=='price'&&node.role!=='originalPrice'&&['text','card','rect'].includes(node.type)&&node.h>=(node.fontSize||12)*2;}
export function mockTextLines(node:UIElement){
 const text=node.text||'';if(!wrapsMockText(node))return [text];
 const available=node.id==='home-hero'?node.w*.62:node.w-(node.type==='text'?0:24),capacity=Math.max(8,Math.floor(available/((node.fontSize||12)*.54)));
 const lines:string[]=[];
 for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(line&&line.length+word.length+1>capacity){lines.push(line);line=word;}else line+=(line?' ':'')+word;}lines.push(line);}
 return lines;
}

/** Small glyph controls must retain drawable space inside their authored bounds. */
export function mockContentPadding(node:UIElement){
 if(node.type==='icon'||node.role==='favorite'||node.role==='productImage')return 0;
 if(node.type==='text')return node.library&&node.bg?8:0;
 if(node.type==='badge')return 4;
 if(node.type==='chip'||node.type==='stepper')return 6;
 if(node.type==='button')return 8;
 return node.text?12:0;
}
