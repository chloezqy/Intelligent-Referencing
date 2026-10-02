export type NodeType = 
  | 'screen' 
  | 'card' 
  | 'button' 
  | 'text' 
  | 'image' 
  | 'header' 
  | 'icon' 
  | 'badge' 
  | 'group' 
  | 'rect' 
  | 'tabbar' 
  | 'chip' 
  | 'input' 
  | 'stepper';

export interface UIElement {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  parent?: string;
  text?: string;
  subtext?: string;
  badge?: string;
  iconName?: string;
  
  // Semantic metadata for intelligent inference
  role?: 'price' | 'originalPrice' | 'primaryCTA' | 'secondaryCTA' | 'rating' | 'favorite' | 'productTitle' | 'filterChip' | 'stepper' | 'productImage' | 'navTitle' | 'card' | 'badge' | 'searchBar' | 'tabIcon' | 'errorBanner';
  component?: 'ProductCard' | 'CartItem' | 'NavBar' | 'TabBar' | 'FilterBar' | 'DetailHero' | 'CheckoutCard' | 'ReviewCard' | 'AddressCard' | 'PaymentCard';
  screen?: 'Home' | 'Search' | 'Detail' | 'Favorites' | 'Cart' | 'Checkout';
  group?: string;

  // Visual styling
  bg?: string;
  color?: string;
  fontSize?: number;
  radius?: number;
  border?: string;
  fontWeight?: string;
  originalBg?: string;
  originalText?: string;
}

export interface Point {
  x: number;
  y: number;
}

export type ToolMode = 'pointer' | 'smart-ref' | 'pan';

export type SelectionState = 'idle' | 'drawing' | 'interpreting' | 'disambiguating' | 'preview' | 'rect-selecting';

export type ScopeLevel = 'exemplars' | 'screen' | 'flow' | 'document';

export interface Interpretation {
  id: string;
  label: string;
  description: string;
  selectedIds: string[];
  exemplarIds: string[];
  inferredIds: string[];
  confidence: 'high' | 'medium' | 'low';
  scope: ScopeLevel;
  
  matchingRole?: string;
  matchingComponent?: string;
  targetScreen?: string;
  reasoning: string;
}

export interface InferredReference {
  selectedIds: string[];
  exemplarIds: string[];
  label: string;
  activeInterpretation?: Interpretation;
  matchingRole?: string;
  matchingComponent?: string;
  scope: ScopeLevel;
  selectionMethod?: 'smart-ref' | 'conventional';
  clicksCount?: number;
}

export interface ResearchTask {
  id: string;
  level: number;
  difficulty: 'Easy' | 'Easy-Medium' | 'Medium' | 'Hard' | 'Expert';
  title: string;
  description: string;
  hintSmartRef: string;
  hintConventional: string;
  targetRole?: string;
  targetComponent?: string;
  targetScope: ScopeLevel;
  screenTarget?: string;
  expectedCount: number;
  targetIds: string[];
  conventionalClicksNeeded: number;
}
