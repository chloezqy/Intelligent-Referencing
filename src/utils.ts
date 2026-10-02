import { Point, UIElement, Interpretation, ScopeLevel } from './types';

// Check if a point is inside a polygon using ray casting
export function pointInPolygon(point: Point, vs: Point[]): boolean {
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Line segment intersection with axis-aligned rectangle
function lineIntersectsSegment(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const ccw = (A: Point, B: Point, C: Point) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

export function strokeIntersectsRect(stroke: Point[], rect: { x: number; y: number; w: number; h: number }): boolean {
  if (stroke.length < 2) return false;
  
  const rLeft = rect.x;
  const rRight = rect.x + rect.w;
  const rTop = rect.y;
  const rBottom = rect.y + rect.h;

  const rectLines: [Point, Point][] = [
    [{ x: rLeft, y: rTop }, { x: rRight, y: rTop }],
    [{ x: rRight, y: rTop }, { x: rRight, y: rBottom }],
    [{ x: rRight, y: rBottom }, { x: rLeft, y: rBottom }],
    [{ x: rLeft, y: rBottom }, { x: rLeft, y: rTop }]
  ];

  // Sample every few points for performance
  const step = Math.max(1, Math.floor(stroke.length / 80));
  for (let i = 0; i < stroke.length - 1; i += step) {
    const p1 = stroke[i];
    const p2 = stroke[Math.min(i + step, stroke.length - 1)];

    // Check if points are inside
    if (p1.x >= rLeft && p1.x <= rRight && p1.y >= rTop && p1.y <= rBottom) return true;
    if (p2.x >= rLeft && p2.x <= rRight && p2.y >= rTop && p2.y <= rBottom) return true;

    // Check segment intersection
    for (const [r1, r2] of rectLines) {
      if (lineIntersectsSegment(p1, p2, r1, r2)) return true;
    }
  }

  return false;
}

// Distance from point to rect center
export function distanceToCenter(pt: Point, rect: { x: number; y: number; w: number; h: number }): number {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return Math.hypot(pt.x - cx, pt.y - cy);
}

// Calculate how much of a node is covered by a closed gesture loop
export function getNodeCoverage(node: UIElement, polygon: Point[]): number {
  if (polygon.length < 3) return 0;
  
  let insideCount = 0;
  const rows = 4;
  const cols = 4;
  const total = rows * cols;
  
  for(let i = 0; i < cols; i++) {
    for(let j = 0; j < rows; j++) {
      const pt = {
        x: node.x + (node.w * i / (cols - 1)),
        y: node.y + (node.h * j / (rows - 1))
      };
      if (pointInPolygon(pt, polygon)) {
        insideCount++;
      }
    }
  }
  return insideCount / total;
}

// Check intersection of two rects (used for conventional marquee selection)
export function rectIntersect(r1: {x:number,y:number,w:number,h:number}, r2: {x:number,y:number,w:number,h:number}): boolean {
  return !(r2.x > r1.x + r1.w || 
           r2.x + r2.w < r1.x || 
           r2.y > r1.y + r1.h ||
           r2.y + r2.h < r1.y);
}

export function getBoundingBox(ids: string[], nodes: UIElement[]): { x: number; y: number; w: number; h: number } | null {
  const selectedNodes = nodes.filter(n => ids.includes(n.id) && n.type !== 'screen');
  if (selectedNodes.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  selectedNodes.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w);
    maxY = Math.max(maxY, n.y + n.h);
  });
  
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function getAllDescendants(parentId: string, nodes: UIElement[]): string[] {
  const children = nodes.filter(n => n.parent === parentId).map(n => n.id);
  let all = [...children];
  children.forEach(c => all = all.concat(getAllDescendants(c, nodes)));
  return all;
}

const ROLE_LABELS: Record<string, { single: string; plural: string }> = {
  price: { single: 'Product Price', plural: 'Product Prices' },
  originalPrice: { single: 'Original Price', plural: 'Original Prices' },
  primaryCTA: { single: 'Primary CTA Button', plural: 'Primary "Add to Bag" CTAs' },
  secondaryCTA: { single: 'Action Button', plural: 'Action Buttons' },
  favorite: { single: 'Wishlist Heart Button', plural: 'Wishlist Heart Buttons' },
  rating: { single: 'Star Rating', plural: 'Review Star Ratings' },
  productTitle: { single: 'Product Title', plural: 'Product Titles' },
  productImage: { single: 'Product Image', plural: 'Product Images' },
  filterChip: { single: 'Filter Chip', plural: 'Filter Chips' },
  stepper: { single: 'Quantity Stepper', plural: 'Quantity Steppers' },
  card: { single: 'Product Card', plural: 'Product Cards' },
  badge: { single: 'Status Badge', plural: 'Status Badges' }
};

/**
 * Dynamically generates candidate interpretations specifically tailored to the active scope level.
 * When user toggles between 'exemplars' (Touched), 'screen', and 'document' (All Screens),
 * this updates the list of smart suggestions in the HUD.
 */
export function generateScopeInterpretations(
  exemplarIds: string[],
  nodes: UIElement[],
  scope: ScopeLevel,
  roleHint?: string,
  compHint?: string,
  screenHint?: string
): Interpretation[] {
  const exemplarNodes = nodes.filter(n => exemplarIds.includes(n.id));
  if (exemplarNodes.length === 0) return [];

  // Determine dominant role
  let role = roleHint;
  if (!role) {
    const rCounts = new Map<string, number>();
    exemplarNodes.forEach(n => { if (n.role) rCounts.set(n.role, (rCounts.get(n.role) || 0) + 1); });
    let maxR = 0;
    rCounts.forEach((cnt, r) => { if (cnt > maxR) { maxR = cnt; role = r; } });
  }

  // Determine dominant component
  let comp = compHint;
  if (!comp) {
    const cCounts = new Map<string, number>();
    exemplarNodes.forEach(n => {
      if (n.component) cCounts.set(n.component, (cCounts.get(n.component) || 0) + 1);
      if (n.parent) {
        const parent = nodes.find(p => p.id === n.parent);
        if (parent?.component) cCounts.set(parent.component, (cCounts.get(parent.component) || 0) + 1);
      }
    });
    let maxC = 0;
    cCounts.forEach((cnt, c) => { if (cnt > maxC) { maxC = cnt; comp = c; } });
  }

  // Determine dominant screen
  const screen = screenHint || exemplarNodes[0]?.screen || 'Home';
  const roleInfo = (role && ROLE_LABELS[role]) || { single: role || 'element', plural: role ? `${role}s` : 'elements' };

  const interpretations: Interpretation[] = [];

  // Helper for full card selection
  const getFullCards = (cards: UIElement[]) => {
    const ids = new Set<string>();
    cards.forEach(c => {
      ids.add(c.id);
      getAllDescendants(c.id, nodes).forEach(d => ids.add(d));
    });
    return Array.from(ids);
  };

  // -------------------------------------------------------------
  // 1. SCOPE: EXEMPLARS ("Touched")
  // -------------------------------------------------------------
  if (scope === 'exemplars') {
    // A. Exact gestured items
    interpretations.push({
      id: 'exemplar-exact',
      label: `Only the ${exemplarNodes.length} touched ${role ? roleInfo.plural : 'layers'}`,
      description: 'Exact gesture touchpoints without pattern expansion',
      selectedIds: exemplarIds,
      exemplarIds: exemplarIds,
      inferredIds: [],
      confidence: 'high',
      scope: 'exemplars',
      matchingRole: role,
      matchingComponent: comp,
      targetScreen: screen,
      reasoning: `Selected strictly the ${exemplarNodes.length} specific elements your gesture touched.`
    });

    // B. Parent Card Container of touched exemplars
    const touchedCardRoots = new Set<string>();
    exemplarNodes.forEach(n => {
      if (n.type === 'card') touchedCardRoots.add(n.id);
      else if (n.parent) {
        const p = nodes.find(x => x.id === n.parent && x.type === 'card');
        if (p) touchedCardRoots.add(p.id);
      }
    });

    if (touchedCardRoots.size > 0) {
      const cards = nodes.filter(n => touchedCardRoots.has(n.id));
      interpretations.push({
        id: 'exemplar-containers',
        label: `Parent ${cards.length} ${cards[0].component || 'Card'}${cards.length > 1 ? 's' : ''} containing touched items`,
        description: 'Component container granularity for touched exemplars',
        selectedIds: getFullCards(cards),
        exemplarIds: exemplarIds,
        inferredIds: getFullCards(cards).filter(id => !exemplarIds.includes(id)),
        confidence: 'medium',
        scope: 'exemplars',
        matchingComponent: comp,
        targetScreen: screen,
        reasoning: `Inferred that the gesture targets the ${cards.length} parent container card(s).`
      });
    }

    // C. Atomic leaf text/icon items
    const leaves = exemplarNodes.filter(n => n.type === 'text' || n.type === 'icon' || n.type === 'badge');
    if (leaves.length > 0 && leaves.length !== exemplarNodes.length) {
      interpretations.push({
        id: 'exemplar-leaves',
        label: `${leaves.length} atomic leaf layers (text/icons only)`,
        description: 'Exclude surrounding cards or backgrounds',
        selectedIds: leaves.map(n => n.id),
        exemplarIds: exemplarIds,
        inferredIds: [],
        confidence: 'low',
        scope: 'exemplars',
        matchingRole: role,
        reasoning: `Filtered selection down to only the text and icon layers touched.`
      });
    }
  }

  // -------------------------------------------------------------
  // 2. SCOPE: SCREEN ("Screen")
  // -------------------------------------------------------------
  else if (scope === 'screen') {
    // A. All matching role items in current screen
    if (role) {
      const screenRoleNodes = nodes.filter(n => n.role === role && n.screen === screen);
      interpretations.push({
        id: `screen-role-${role}`,
        label: `All ${screenRoleNodes.length} ${roleInfo.plural} in ${screen}`,
        description: `Repeating pattern scoped to ${screen} artboard`,
        selectedIds: screenRoleNodes.map(n => n.id),
        exemplarIds: exemplarIds.filter(id => nodes.find(n => n.id === id)?.role === role),
        inferredIds: screenRoleNodes.map(n => n.id).filter(id => !exemplarIds.includes(id)),
        confidence: 'high',
        scope: 'screen',
        matchingRole: role,
        targetScreen: screen,
        reasoning: `Recognized repeating ${roleInfo.single} pattern — selected all ${screenRoleNodes.length} in ${screen}.`
      });
    }

    // B. All product cards in this screen
    const screenCards = nodes.filter(n => n.component === 'ProductCard' && n.type === 'card' && n.screen === screen);
    if (screenCards.length > 0) {
      interpretations.push({
        id: `screen-cards-${screen}`,
        label: `All ${screenCards.length} Product Cards in ${screen}`,
        description: `Component container granularity for ${screen}`,
        selectedIds: getFullCards(screenCards),
        exemplarIds: exemplarIds,
        inferredIds: getFullCards(screenCards).filter(id => !exemplarIds.includes(id)),
        confidence: comp === 'ProductCard' ? 'high' : 'medium',
        scope: 'screen',
        matchingComponent: 'ProductCard',
        targetScreen: screen,
        reasoning: `Selected all ${screenCards.length} repeated product card containers in ${screen}.`
      });
    }

    // C. All interactive action buttons in this screen
    const screenCTAs = nodes.filter(n => (n.role === 'primaryCTA' || n.type === 'button') && n.screen === screen);
    if (screenCTAs.length > 0 && role !== 'primaryCTA') {
      interpretations.push({
        id: `screen-ctas-${screen}`,
        label: `All ${screenCTAs.length} action buttons in ${screen}`,
        description: `Interactive controls on ${screen} artboard`,
        selectedIds: screenCTAs.map(n => n.id),
        exemplarIds: exemplarIds.filter(id => screenCTAs.some(c => c.id === id)),
        inferredIds: screenCTAs.map(n => n.id).filter(id => !exemplarIds.includes(id)),
        confidence: 'medium',
        scope: 'screen',
        matchingRole: 'primaryCTA',
        targetScreen: screen,
        reasoning: `Selected all actionable buttons within the ${screen} artboard.`
      });
    }
  }

  // -------------------------------------------------------------
  // 3. SCOPE: DOCUMENT ("All Screens")
  // -------------------------------------------------------------
  else {
    // A. All matching role items across ALL 6 screens
    if (role) {
      const allRoleNodes = nodes.filter(n => n.role === role);
      interpretations.push({
        id: `doc-role-${role}`,
        label: `All ${allRoleNodes.length} ${roleInfo.plural} across Catalog`,
        description: `Universal reference across all 6 artboards`,
        selectedIds: allRoleNodes.map(n => n.id),
        exemplarIds: exemplarIds.filter(id => nodes.find(n => n.id === id)?.role === role),
        inferredIds: allRoleNodes.map(n => n.id).filter(id => !exemplarIds.includes(id)),
        confidence: 'high',
        scope: 'document',
        matchingRole: role,
        reasoning: `Global reference: recognized repeating ${roleInfo.single} pattern across Home, Search, Detail, Favorites, Cart, and Checkout.`
      });
    }

    // B. All Product Cards across Catalog
    const allCards = nodes.filter(n => (n.component === 'ProductCard' || n.component === 'CartItem') && n.type === 'card');
    if (allCards.length > 0) {
      interpretations.push({
        id: 'doc-all-cards',
        label: `All ${allCards.length} Product Cards across Catalog`,
        description: `All card components across 4 shopping screens`,
        selectedIds: getFullCards(allCards),
        exemplarIds: exemplarIds,
        inferredIds: getFullCards(allCards).filter(id => !exemplarIds.includes(id)),
        confidence: comp === 'ProductCard' ? 'high' : 'medium',
        scope: 'document',
        matchingComponent: 'ProductCard',
        reasoning: `Expanded card component granularity across the entire shopping catalog.`
      });
    }

    // C. All Primary CTAs across all screens
    const allCTAs = nodes.filter(n => n.role === 'primaryCTA');
    if (allCTAs.length > 0 && role !== 'primaryCTA') {
      interpretations.push({
        id: 'doc-all-ctas',
        label: `All ${allCTAs.length} Primary Action CTAs in Flow`,
        description: `Add to Bag & Checkout buttons across all 6 screens`,
        selectedIds: allCTAs.map(n => n.id),
        exemplarIds: exemplarIds.filter(id => allCTAs.some(c => c.id === id)),
        inferredIds: allCTAs.map(n => n.id).filter(id => !exemplarIds.includes(id)),
        confidence: 'medium',
        scope: 'document',
        matchingRole: 'primaryCTA',
        reasoning: `Referenced all primary call-to-action buttons across the entire flow.`
      });
    }

    // D. All Wishlist Hearts across catalog
    const allFavs = nodes.filter(n => n.role === 'favorite');
    if (allFavs.length > 0 && role !== 'favorite') {
      interpretations.push({
        id: 'doc-all-favs',
        label: `All ${allFavs.length} Wishlist Heart Buttons in Catalog`,
        description: `Saved favorite toggles across design`,
        selectedIds: allFavs.map(n => n.id),
        exemplarIds: exemplarIds.filter(id => allFavs.some(f => f.id === id)),
        inferredIds: allFavs.map(n => n.id).filter(id => !exemplarIds.includes(id)),
        confidence: 'medium',
        scope: 'document',
        matchingRole: 'favorite',
        reasoning: `Selected all wishlist toggle buttons across the catalog.`
      });
    }
  }

  return interpretations;
}

/**
 * Intelligent Exemplar & Pattern Inference Engine
 * 
 * Takes a rough user gesture (points) and the canvas nodes.
 * Infers initial exemplars and generates scope-aware interpretations.
 */
export function inferSelection(stroke: Point[], nodes: UIElement[]): Interpretation[] {
  if (stroke.length < 3) return [];

  // Filter out screen containers from atomic touch detection
  const selectableNodes = nodes.filter(n => n.type !== 'screen' && n.type !== 'tabbar' && n.type !== 'header');

  // Detect which nodes were touched or intersected by the gesture
  const touchedMap = new Map<string, { coverage: number; intersected: boolean }>();

  selectableNodes.forEach(node => {
    const coverage = getNodeCoverage(node, stroke);
    const intersected = strokeIntersectsRect(stroke, node);
    
    if (coverage > 0.08 || intersected) {
      touchedMap.set(node.id, { coverage, intersected });
    }
  });

  const exemplarIds = Array.from(touchedMap.keys());
  if (exemplarIds.length === 0) {
    const anyCovered = nodes.filter(n => getNodeCoverage(n, stroke) > 0.05);
    if (anyCovered.length > 0) {
      return [{
        id: 'fallback-region',
        label: `${anyCovered.length} items loosely enclosed`,
        description: 'Enclosed region selection',
        selectedIds: anyCovered.map(n => n.id),
        exemplarIds: anyCovered.map(n => n.id),
        inferredIds: [],
        confidence: 'low',
        scope: 'exemplars',
        reasoning: 'Geometric fallback without distinct semantic pattern'
      }];
    }
    return [];
  }

  // Default initial scope to 'screen' or 'document'
  return generateScopeInterpretations(exemplarIds, nodes, 'screen');
}

/**
 * Scope switcher: expands or contracts a selection based on the chosen scope level.
 */
export function expandScope(
  nodes: UIElement[], 
  exemplarIds: string[], 
  targetScope: ScopeLevel, 
  role?: string, 
  component?: string, 
  targetScreen?: string
): string[] {
  if (targetScope === 'exemplars') {
    return exemplarIds;
  }

  // Derive role, component, or screen if not explicitly provided
  const exemplarNodes = nodes.filter(n => exemplarIds.includes(n.id));
  let resolvedRole = role;
  let resolvedComponent = component;
  let resolvedScreen = targetScreen;

  if (!resolvedRole && !resolvedComponent && exemplarNodes.length > 0) {
    const rCounts = new Map<string, number>();
    exemplarNodes.forEach(n => {
      if (n.role) rCounts.set(n.role, (rCounts.get(n.role) || 0) + 1);
    });
    let maxR = 0;
    rCounts.forEach((count, r) => {
      if (count > maxR) { maxR = count; resolvedRole = r; }
    });

    if (!resolvedRole) {
      const cCounts = new Map<string, number>();
      exemplarNodes.forEach(n => {
        if (n.component) cCounts.set(n.component, (cCounts.get(n.component) || 0) + 1);
      });
      let maxC = 0;
      cCounts.forEach((count, c) => {
        if (count > maxC) { maxC = count; resolvedComponent = c; }
      });
    }
  }

  if (!resolvedScreen && exemplarNodes.length > 0) {
    resolvedScreen = exemplarNodes[0].screen;
  }

  const results = new Set<string>();

  if (resolvedRole) {
    if (targetScope === 'screen' && resolvedScreen) {
      nodes.filter(n => n.role === resolvedRole && n.screen === resolvedScreen).forEach(n => results.add(n.id));
    } else if (targetScope === 'flow') {
      nodes.filter(n => n.role === resolvedRole && (n.screen === 'Home' || n.screen === 'Search' || n.screen === 'Detail')).forEach(n => results.add(n.id));
    } else {
      // Document: ALL 6 screens across the catalog!
      nodes.filter(n => n.role === resolvedRole).forEach(n => results.add(n.id));
    }
  } else if (resolvedComponent) {
    let targetCards: UIElement[] = [];
    if (targetScope === 'screen' && resolvedScreen) {
      targetCards = nodes.filter(n => n.component === resolvedComponent && n.type === 'card' && n.screen === resolvedScreen);
    } else if (targetScope === 'flow') {
      targetCards = nodes.filter(n => n.component === resolvedComponent && n.type === 'card' && (n.screen === 'Home' || n.screen === 'Search' || n.screen === 'Detail'));
    } else {
      targetCards = nodes.filter(n => n.component === resolvedComponent && n.type === 'card');
    }

    targetCards.forEach(c => {
      results.add(c.id);
      getAllDescendants(c.id, nodes).forEach(d => results.add(d));
    });
  } else if (exemplarNodes.length > 0) {
    const dominantType = exemplarNodes[0].type;
    if (dominantType && dominantType !== 'screen') {
      if (targetScope === 'screen' && resolvedScreen) {
        nodes.filter(n => n.type === dominantType && n.screen === resolvedScreen).forEach(n => results.add(n.id));
      } else {
        nodes.filter(n => n.type === dominantType).forEach(n => results.add(n.id));
      }
    }
  }

  return results.size > 0 ? Array.from(results) : exemplarIds;
}
