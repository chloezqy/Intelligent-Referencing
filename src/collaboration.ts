import {comparisonSides} from './comparisonSides.js';
import {designChangeContext,validateProposedChanges} from './designChanges.js';
import {MOCK_NODES} from './data.js';
import { ScopeLevel } from './types.js';
export type UserId = 'A' | 'B';
export type ReferenceIntent = string;
export interface SharedReference {
  simulated?: boolean;
  id: string; sourceUser: UserId; targetUser: UserId;
  elementIds: string[]; exemplarIds: string[]; scope: ScopeLevel;
  label: string; intent: ReferenceIntent; message: string; createdAt: string;
  status: 'open' | 'reviewed';
  mentions?:UserId[];
  notificationRecipients?:UserId[];
  attention?:AttentionRequest[];
  comparison?: ComparisonContext;
  research?: { level: 4 | 5; attemptId: string };
  reviewedAt?: string;
  archivedAt?: string;
  archivedBy?: UserId;
  activity?: { id: string; userId: UserId; kind: 'opened' | 'located'; elementIds: string[]; at: string }[];
  responses: { id: string; userId: UserId; message: string; createdAt: string }[];
}
export interface RoomSnapshot {
  code: string; documentId: string; revision: number;
  members: { userId: UserId; online: boolean }[];
  references: SharedReference[];
}
export interface Session { code: string; userId: UserId; token: string }
export interface ReferenceDraft { document?:import('./types').UIElement[];comparison?:ComparisonContext; elementIds: string[]; exemplarIds: string[]; scope: ScopeLevel; label: string; research?: { level: 4 | 5; attemptId: string } }
export const DOCUMENT_ID = 'mobile-commerce-v1';
export const INTENTS: ReferenceIntent[] = ['Review', 'Compare', 'Help', 'Look at this'];

export interface CollaboratorCursor { userId:UserId; x:number; y:number; visible:boolean; at:number }
export interface SelectionPresence {userId:UserId;elementIds:string[];exemplarIds:string[];scope:ScopeLevel;method:'conventional'|'smart-ref';revision:number}
export interface ComparisonContext {tokenSuggestions?:import('./designSystemReferencing').TokenSuggestion[];sides?:Record<'A'|'B',import('./comparisonSides').ComparisonSideSelection>;snapshotId:string;selections:Record<UserId,SelectionPresence>;purpose:string;designReference?:DesignReference;interpretation:import('./comparisonContext').ContextInterpretation}

export interface AttentionRequest {id:string;sourceUser:UserId;targetUser:UserId;createdAt:string;viewedAt?:string}


/** Completed references belong in Archived without rewriting their review evidence. */
export function referenceLists(references:SharedReference[],isPending?:(reference:SharedReference)=>boolean){
 const archived=(reference:SharedReference)=>!!reference.archivedAt||reference.status==='reviewed'&&!isPending?.(reference);
 return {active:references.filter(reference=>!archived(reference)),archived:references.filter(archived)};
}


export const DESIGN_REFERENCE_PURPOSE='Use as a design reference';
export const DESIGN_REFERENCE_PROPERTIES={typography:'Typography',spacing:'Spacing',colors:'Colors',cornerRadius:'Corner radius'} as const;
export interface DesignReference {proposedChanges?:import('./designChanges').ProposedDesignChange[];direction:{referenceUser:UserId;targetUser:UserId;referenceSide?:'A'|'B';targetSide?:'A'|'B'};properties:(keyof typeof DESIGN_REFERENCE_PROPERTIES)[]}
/** Optional, backwards-compatible comparison intent; IDs remain in the frozen selections. */
export function validateDesignReference(purpose:string,value:unknown,selections:ComparisonContext['selections'],sides?:ComparisonContext['sides'],nodes=MOCK_NODES):DesignReference|undefined {
 if(purpose!==DESIGN_REFERENCE_PURPOSE)return undefined;
 const input=value as DesignReference|undefined;
 const context={selections,sides} as ComparisonContext;
 const groups=comparisonSides(context),direction=input?.direction;
 const referenceSide=direction?.referenceSide||(direction?.referenceUser==='B'?'B':'A'),targetSide=referenceSide==='A'?'B':'A';
 if(!['A','B'].includes(referenceSide))throw new Error('Invalid reference side.');
 if(!input||!direction||!groups.A.elementIds.length||!groups.B.elementIds.length||direction.referenceUser!==groups[referenceSide].selectedBy||direction.targetUser!==groups[targetSide].selectedBy||direction.targetSide!==undefined&&direction.targetSide!==targetSide||!Array.isArray(input.properties)||!input.properties.length||input.properties.length>4||new Set(input.properties).size!==input.properties.length||!input.properties.every(key=>Object.hasOwn(DESIGN_REFERENCE_PROPERTIES,key)))throw new Error('Choose valid reference and target sides and at least one property.');
 const reference=groups[referenceSide],target=groups[targetSide];
 return {direction:{...direction},properties:[...input.properties],...(input.proposedChanges!==undefined?{proposedChanges:validateProposedChanges(input.proposedChanges,designChangeContext(reference.elementIds,target.elementIds,input.properties,nodes))}:{})};
}
