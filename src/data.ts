import { UIElement, ResearchTask } from './types';

export const INITIAL_NODES: UIElement[] = [];

export const SCREEN_W = 375;
export const SCREEN_H = 812;
export const SCREEN_GAP = 140;
export const START_X = 80;
export const START_Y = 140;

// Screen positions
export const SCREEN_CONFIGS = [
  { name: 'Home' as const, label: '01 · Home Feed', desc: 'Discovery & featured items', x: START_X + 0 * (SCREEN_W + SCREEN_GAP) },
  { name: 'Search' as const, label: '02 · Search Results', desc: 'Catalog filtering & list view', x: START_X + 1 * (SCREEN_W + SCREEN_GAP) },
  { name: 'Detail' as const, label: '03 · Product Detail', desc: 'Item specification & gallery', x: START_X + 2 * (SCREEN_W + SCREEN_GAP) },
  { name: 'Favorites' as const, label: '04 · Favorites', desc: 'Saved wishlist & quick move', x: START_X + 3 * (SCREEN_W + SCREEN_GAP) },
  { name: 'Cart' as const, label: '05 · Shopping Cart', desc: 'Bag items, quantities & promo', x: START_X + 4 * (SCREEN_W + SCREEN_GAP) },
  { name: 'Checkout' as const, label: '06 · Checkout Flow', desc: 'Address, payment & confirmation', x: START_X + 5 * (SCREEN_W + SCREEN_GAP) }
];

function buildDataset(): UIElement[] {
  const nodes: UIElement[] = [];

  // Helper to add screen container
  const addScreenFrame = (cfg: typeof SCREEN_CONFIGS[number]) => {
    nodes.push({
      id: `screen-${cfg.name.toLowerCase()}`,
      type: 'screen',
      x: cfg.x,
      y: START_Y,
      w: SCREEN_W,
      h: SCREEN_H,
      label: `${cfg.name} Screen`,
      screen: cfg.name,
      bg: '#ffffff',
      radius: 40,
      border: '1px solid #27272a'
    });
  };

  // Status bar helper
  const addStatusBar = (screen: typeof SCREEN_CONFIGS[number]['name'], sx: number, sy: number) => {
    nodes.push({
      id: `statusbar-${screen.toLowerCase()}`,
      type: 'group',
      parent: `screen-${screen.toLowerCase()}`,
      x: sx,
      y: sy,
      w: SCREEN_W,
      h: 44,
      label: 'Status Bar',
      screen,
      bg: 'transparent'
    });
  };

  // Nav bar helper
  const addNavBar = (screen: typeof SCREEN_CONFIGS[number]['name'], sx: number, sy: number, title: string, hasBack = false, rightAction = 'Cart') => {
    const parent = `screen-${screen.toLowerCase()}`;
    const navId = `nav-${screen.toLowerCase()}`;
    nodes.push({
      id: navId,
      type: 'header',
      parent,
      x: sx,
      y: sy + 44,
      w: SCREEN_W,
      h: 52,
      label: 'Navigation Bar',
      screen,
      component: 'NavBar',
      bg: '#ffffff',
      border: '1px solid #f4f4f5'
    });

    if (hasBack) {
      nodes.push({
        id: `${navId}-back`,
        type: 'icon',
        parent: navId,
        x: sx + 16,
        y: sy + 58,
        w: 24,
        h: 24,
        label: 'Back Arrow',
        screen,
        role: 'secondaryCTA',
        text: '←',
        fontSize: 16,
        color: '#18181b'
      });
    }

    nodes.push({
      id: `${navId}-title`,
      type: 'text',
      parent: navId,
      x: sx + (hasBack ? 52 : 20),
      y: sy + 58,
      w: 180,
      h: 24,
      label: 'Nav Title',
      text: title,
      screen,
      role: 'navTitle',
      fontSize: 18,
      fontWeight: '700',
      color: '#09090b'
    });

    nodes.push({
      id: `${navId}-action`,
      type: 'icon',
      parent: navId,
      x: sx + SCREEN_W - 48,
      y: sy + 58,
      w: 28,
      h: 24,
      label: 'Nav Action',
      text: rightAction === 'Cart' ? '🛒' : rightAction === 'Share' ? '↗' : '⋯',
      screen,
      role: 'secondaryCTA',
      fontSize: 15,
      color: '#52525b'
    });
  };

  // Tab bar helper
  const addTabBar = (screen: typeof SCREEN_CONFIGS[number]['name'], sx: number, sy: number, activeIndex = 0) => {
    const parent = `screen-${screen.toLowerCase()}`;
    const tabId = `tab-${screen.toLowerCase()}`;
    const ty = sy + SCREEN_H - 80;

    nodes.push({
      id: tabId,
      type: 'tabbar',
      parent,
      x: sx,
      y: ty,
      w: SCREEN_W,
      h: 80,
      label: 'Tab Bar',
      screen,
      component: 'TabBar',
      bg: '#ffffff',
      border: '1px solid #f4f4f5'
    });

    const items = [
      { name: 'Discover', icon: '✦' },
      { name: 'Search', icon: '🔍' },
      { name: 'Saved', icon: '♥' },
      { name: 'Cart', icon: '🛍' }
    ];

    items.forEach((item, i) => {
      const isActive = i === activeIndex;
      nodes.push({
        id: `${tabId}-item-${i}`,
        type: 'icon',
        parent: tabId,
        x: sx + 20 + i * 85,
        y: ty + 12,
        w: 65,
        h: 40,
        label: `Tab ${item.name}`,
        screen,
        role: 'tabIcon',
        text: `${item.icon} ${item.name}`,
        fontSize: 10,
        fontWeight: isActive ? '700' : '500',
        color: isActive ? '#4f46e5' : '#a1a1aa'
      });
    });
  };

  // Product Card helper (Vertical Grid)
  const addGridProductCard = (
    screen: typeof SCREEN_CONFIGS[number]['name'],
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    data: {
      title: string;
      price: string;
      origPrice?: string;
      rating: string;
      tag?: string;
      imageHue: string;
      category: string;
    }
  ) => {
    const parent = `screen-${screen.toLowerCase()}`;

    // Root card container
    nodes.push({
      id,
      type: 'card',
      parent,
      x,
      y,
      w,
      h,
      label: `Product Card (${data.title})`,
      screen,
      component: 'ProductCard',
      role: 'card',
      bg: '#ffffff',
      radius: 16,
      border: '1px solid #e4e4e7'
    });

    // Image container
    const imgH = 130;
    nodes.push({
      id: `${id}-img`,
      type: 'image',
      parent: id,
      x,
      y,
      w,
      h: imgH,
      label: `Image · ${data.title}`,
      screen,
      component: 'ProductCard',
      role: 'productImage',
      bg: data.imageHue,
      radius: 16,
      text: data.category,
      color: '#71717a',
      fontSize: 11,
      fontWeight: '600'
    });

    // Favorite heart button
    nodes.push({
      id: `${id}-fav`,
      type: 'button',
      parent: id,
      x: x + w - 34,
      y: y + 10,
      w: 24,
      h: 24,
      label: `Wishlist Heart · ${data.title}`,
      screen,
      component: 'ProductCard',
      role: 'favorite',
      bg: '#ffffff',
      radius: 12,
      text: '♥',
      fontSize: 12,
      color: '#ef4444',
      border: '1px solid #f4f4f5'
    });

    // Badge if present
    if (data.tag) {
      nodes.push({
        id: `${id}-badge`,
        type: 'badge',
        parent: id,
        x: x + 10,
        y: y + 10,
        w: 52,
        h: 20,
        label: `Badge · ${data.tag}`,
        screen,
        component: 'ProductCard',
        role: 'badge',
        bg: '#18181b',
        color: '#ffffff',
        radius: 6,
        text: data.tag,
        fontSize: 9,
        fontWeight: '700'
      });
    }

    // Title
    nodes.push({
      id: `${id}-title`,
      type: 'text',
      parent: id,
      x: x + 10,
      y: y + imgH + 8,
      w: w - 20,
      h: 18,
      label: `Title · ${data.title}`,
      screen,
      component: 'ProductCard',
      role: 'productTitle',
      text: data.title,
      fontSize: 13,
      fontWeight: '600',
      color: '#18181b'
    });

    // Rating
    nodes.push({
      id: `${id}-rating`,
      type: 'text',
      parent: id,
      x: x + 10,
      y: y + imgH + 28,
      w: 80,
      h: 16,
      label: `Rating · ${data.rating}`,
      screen,
      component: 'ProductCard',
      role: 'rating',
      text: `★ ${data.rating}`,
      fontSize: 11,
      fontWeight: '600',
      color: '#f59e0b'
    });

    // Price
    nodes.push({
      id: `${id}-price`,
      type: 'text',
      parent: id,
      x: x + 10,
      y: y + imgH + 48,
      w: 60,
      h: 18,
      label: `Price · ${data.price}`,
      screen,
      component: 'ProductCard',
      role: 'price',
      text: data.price,
      fontSize: 14,
      fontWeight: '700',
      color: '#09090b'
    });

    if (data.origPrice) {
      nodes.push({
        id: `${id}-origprice`,
        type: 'text',
        parent: id,
        x: x + 72,
        y: y + imgH + 50,
        w: 50,
        h: 16,
        label: `Original Price · ${data.origPrice}`,
        screen,
        component: 'ProductCard',
        role: 'originalPrice',
        text: data.origPrice,
        fontSize: 11,
        color: '#a1a1aa'
      });
    }

    // Add to Bag CTA
    nodes.push({
      id: `${id}-cta`,
      type: 'button',
      parent: id,
      x: x + 10,
      y: y + h - 38,
      w: w - 20,
      h: 30,
      label: `Add to Bag CTA · ${data.title}`,
      screen,
      component: 'ProductCard',
      role: 'primaryCTA',
      bg: '#09090b',
      color: '#ffffff',
      radius: 8,
      text: 'Add to Bag',
      fontSize: 11,
      fontWeight: '600'
    });
  };

  // Product Card helper (Horizontal List View in Search)
  const addListProductCard = (
    screen: typeof SCREEN_CONFIGS[number]['name'],
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    data: {
      title: string;
      price: string;
      origPrice?: string;
      rating: string;
      imageHue: string;
      subtitle: string;
    }
  ) => {
    const parent = `screen-${screen.toLowerCase()}`;

    // Root card
    nodes.push({
      id,
      type: 'card',
      parent,
      x,
      y,
      w,
      h,
      label: `Product Card (${data.title})`,
      screen,
      component: 'ProductCard',
      role: 'card',
      bg: '#ffffff',
      radius: 14,
      border: '1px solid #e4e4e7'
    });

    // Image (Left)
    nodes.push({
      id: `${id}-img`,
      type: 'image',
      parent: id,
      x: x + 8,
      y: y + 8,
      w: 88,
      h: h - 16,
      label: `Image · ${data.title}`,
      screen,
      component: 'ProductCard',
      role: 'productImage',
      bg: data.imageHue,
      radius: 10,
      text: 'Product',
      color: '#71717a',
      fontSize: 11
    });

    const cx = x + 106;

    // Title
    nodes.push({
      id: `${id}-title`,
      type: 'text',
      parent: id,
      x: cx,
      y: y + 12,
      w: 160,
      h: 18,
      label: `Title · ${data.title}`,
      screen,
      component: 'ProductCard',
      role: 'productTitle',
      text: data.title,
      fontSize: 13,
      fontWeight: '600',
      color: '#18181b'
    });

    // Rating
    nodes.push({
      id: `${id}-rating`,
      type: 'text',
      parent: id,
      x: cx,
      y: y + 32,
      w: 70,
      h: 16,
      label: `Rating · ${data.rating}`,
      screen,
      component: 'ProductCard',
      role: 'rating',
      text: `★ ${data.rating}`,
      fontSize: 11,
      fontWeight: '600',
      color: '#f59e0b'
    });

    // Price
    nodes.push({
      id: `${id}-price`,
      type: 'text',
      parent: id,
      x: cx,
      y: y + 54,
      w: 60,
      h: 18,
      label: `Price · ${data.price}`,
      screen,
      component: 'ProductCard',
      role: 'price',
      text: data.price,
      fontSize: 14,
      fontWeight: '700',
      color: '#09090b'
    });

    if (data.origPrice) {
      nodes.push({
        id: `${id}-origprice`,
        type: 'text',
        parent: id,
        x: cx + 62,
        y: y + 56,
        w: 50,
        h: 16,
        label: `Original Price · ${data.origPrice}`,
        screen,
        component: 'ProductCard',
        role: 'originalPrice',
        text: data.origPrice,
        fontSize: 11,
        color: '#a1a1aa'
      });
    }

    // Favorite heart
    nodes.push({
      id: `${id}-fav`,
      type: 'button',
      parent: id,
      x: x + w - 34,
      y: y + 10,
      w: 24,
      h: 24,
      label: `Wishlist Heart · ${data.title}`,
      screen,
      component: 'ProductCard',
      role: 'favorite',
      bg: '#f4f4f5',
      radius: 12,
      text: '♥',
      fontSize: 12,
      color: '#ef4444'
    });

    // Add to Cart button
    nodes.push({
      id: `${id}-cta`,
      type: 'button',
      parent: id,
      x: x + w - 90,
      y: y + h - 38,
      w: 80,
      h: 28,
      label: `Add to Bag CTA · ${data.title}`,
      screen,
      component: 'ProductCard',
      role: 'primaryCTA',
      bg: '#09090b',
      color: '#ffffff',
      radius: 6,
      text: 'Add',
      fontSize: 11,
      fontWeight: '600'
    });
  };

  // ---------------------------------------------
  // 1. SCREEN: HOME
  // ---------------------------------------------
  const sHome = SCREEN_CONFIGS[0];
  addScreenFrame(sHome);
  addStatusBar(sHome.name, sHome.x, START_Y);
  addNavBar(sHome.name, sHome.x, START_Y, 'Nordic Living');

  // Hero Banner
  nodes.push({
    id: 'home-hero',
    type: 'card',
    parent: `screen-home`,
    x: sHome.x + 16,
    y: START_Y + 104,
    w: 343,
    h: 140,
    label: 'Hero Promo Banner',
    screen: 'Home',
    bg: '#18181b',
    color: '#ffffff',
    radius: 18,
    text: 'Summer Architectural Collection · 30% Off',
    fontSize: 14,
    fontWeight: '700'
  });

  // Filter Chips Row
  const homeCategories = ['All Chairs', 'Desk Lamps', 'Oak Stools', 'Vases'];
  homeCategories.forEach((cat, i) => {
    nodes.push({
      id: `home-chip-${i}`,
      type: 'chip',
      parent: `screen-home`,
      x: sHome.x + 16 + i * 86,
      y: START_Y + 256,
      w: 80,
      h: 30,
      label: `Category Filter · ${cat}`,
      screen: 'Home',
      component: 'FilterBar',
      role: 'filterChip',
      bg: i === 0 ? '#09090b' : '#f4f4f5',
      color: i === 0 ? '#ffffff' : '#27272a',
      radius: 8,
      text: cat,
      fontSize: 11,
      fontWeight: '600'
    });
  });

  // 4 Grid Product Cards on Home
  addGridProductCard(sHome.name, 'hc1', sHome.x + 16, START_Y + 298, 165, 230, {
    title: 'Nordic Lounge Chair',
    price: '$289.00',
    origPrice: '$340.00',
    rating: '4.9',
    tag: 'Popular',
    imageHue: '#f1f5f9',
    category: 'Seating'
  });

  addGridProductCard(sHome.name, 'hc2', sHome.x + 194, START_Y + 298, 165, 230, {
    title: 'Minimalist Desk Lamp',
    price: '$85.00',
    origPrice: '$110.00',
    rating: '4.7',
    tag: 'Sale',
    imageHue: '#fef3c7',
    category: 'Lighting'
  });

  addGridProductCard(sHome.name, 'hc3', sHome.x + 16, START_Y + 540, 165, 180, {
    title: 'Oak Wood Stool',
    price: '$140.00',
    rating: '4.8',
    imageHue: '#e2e8f0',
    category: 'Woodwork'
  });

  addGridProductCard(sHome.name, 'hc4', sHome.x + 194, START_Y + 540, 165, 180, {
    title: 'Ceramic Vase',
    price: '$65.00',
    origPrice: '$80.00',
    rating: '4.6',
    imageHue: '#fae8ff',
    category: 'Decor'
  });

  addTabBar(sHome.name, sHome.x, START_Y, 0);

  // ---------------------------------------------
  // 2. SCREEN: SEARCH
  // ---------------------------------------------
  const sSearch = SCREEN_CONFIGS[1];
  addScreenFrame(sSearch);
  addStatusBar(sSearch.name, sSearch.x, START_Y);
  addNavBar(sSearch.name, sSearch.x, START_Y, 'Search Catalog', true);

  // Search input
  nodes.push({
    id: 'search-input-box',
    type: 'input',
    parent: `screen-search`,
    x: sSearch.x + 16,
    y: START_Y + 104,
    w: 343,
    h: 42,
    label: 'Search Field',
    screen: 'Search',
    role: 'searchBar',
    bg: '#f4f4f5',
    color: '#09090b',
    radius: 10,
    text: '🔍  "Lounge and dining chairs"',
    fontSize: 13,
    fontWeight: '500'
  });

  // Filter Chips in Search
  const searchFilters = ['In Stock', 'Price < $300', 'Rating 4.5+', 'Free Delivery'];
  searchFilters.forEach((fil, i) => {
    nodes.push({
      id: `search-filter-${i}`,
      type: 'chip',
      parent: `screen-search`,
      x: sSearch.x + 16 + i * 86,
      y: START_Y + 154,
      w: 80,
      h: 28,
      label: `Filter Chip · ${fil}`,
      screen: 'Search',
      component: 'FilterBar',
      role: 'filterChip',
      bg: i === 1 ? '#e0e7ff' : '#ffffff',
      color: i === 1 ? '#4338ca' : '#52525b',
      border: '1px solid #e4e4e7',
      radius: 14,
      text: fil,
      fontSize: 10,
      fontWeight: '600'
    });
  });

  // 4 Horizontal Product Cards in Search
  addListProductCard(sSearch.name, 'sc1', sSearch.x + 16, START_Y + 194, 343, 110, {
    title: 'Eames Style Rocker',
    price: '$320.00',
    origPrice: '$390.00',
    rating: '4.9 (128)',
    imageHue: '#f1f5f9',
    subtitle: 'Molded fiberglass shell'
  });

  addListProductCard(sSearch.name, 'sc2', sSearch.x + 16, START_Y + 314, 343, 110, {
    title: 'Solid Birch Armchair',
    price: '$275.00',
    rating: '4.8 (94)',
    imageHue: '#fef3c7',
    subtitle: 'Natural lacquer finish'
  });

  addListProductCard(sSearch.name, 'sc3', sSearch.x + 16, START_Y + 434, 343, 110, {
    title: 'Walnut Dining Chair',
    price: '$195.00',
    origPrice: '$240.00',
    rating: '4.7 (65)',
    imageHue: '#e2e8f0',
    subtitle: 'Solid American walnut'
  });

  addListProductCard(sSearch.name, 'sc4', sSearch.x + 16, START_Y + 554, 343, 110, {
    title: 'Upholstered Stool',
    price: '$130.00',
    rating: '4.5 (31)',
    imageHue: '#fae8ff',
    subtitle: 'Wool blend fabric'
  });

  addTabBar(sSearch.name, sSearch.x, START_Y, 1);

  // ---------------------------------------------
  // 3. SCREEN: PRODUCT DETAIL
  // ---------------------------------------------
  const sDetail = SCREEN_CONFIGS[2];
  addScreenFrame(sDetail);
  addStatusBar(sDetail.name, sDetail.x, START_Y);
  addNavBar(sDetail.name, sDetail.x, START_Y, 'Product Overview', true, 'Share');

  // Hero Image
  nodes.push({
    id: 'detail-hero-img',
    type: 'image',
    parent: `screen-detail`,
    x: sDetail.x,
    y: START_Y + 96,
    w: SCREEN_W,
    h: 280,
    label: 'Main Product Showcase Image',
    screen: 'Detail',
    component: 'DetailHero',
    role: 'productImage',
    bg: '#f8fafc',
    text: 'Eames Style Rocker in Natural Ash',
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600'
  });

  // Favorite button on Detail image
  nodes.push({
    id: 'detail-fav-btn',
    type: 'button',
    parent: 'detail-hero-img',
    x: sDetail.x + SCREEN_W - 50,
    y: START_Y + 110,
    w: 36,
    h: 36,
    label: 'Wishlist Button (Detail)',
    screen: 'Detail',
    role: 'favorite',
    bg: '#ffffff',
    radius: 18,
    text: '♥',
    fontSize: 16,
    color: '#ef4444',
    border: '1px solid #e2e8f0'
  });

  // Title
  nodes.push({
    id: 'detail-title',
    type: 'text',
    parent: `screen-detail`,
    x: sDetail.x + 20,
    y: START_Y + 390,
    w: 260,
    h: 24,
    label: 'Product Title (Detail)',
    screen: 'Detail',
    role: 'productTitle',
    text: 'Eames Style Rocker Chair',
    fontSize: 20,
    fontWeight: '700',
    color: '#09090b'
  });

  // Rating & Review Count
  nodes.push({
    id: 'detail-rating',
    type: 'text',
    parent: `screen-detail`,
    x: sDetail.x + 20,
    y: START_Y + 418,
    w: 160,
    h: 18,
    label: 'Rating (Detail)',
    screen: 'Detail',
    role: 'rating',
    text: '★ 4.9 · 128 Customer Reviews',
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b'
  });

  // Price & Savings
  nodes.push({
    id: 'detail-price',
    type: 'text',
    parent: `screen-detail`,
    x: sDetail.x + 20,
    y: START_Y + 444,
    w: 90,
    h: 26,
    label: 'Price (Detail)',
    screen: 'Detail',
    role: 'price',
    text: '$320.00',
    fontSize: 22,
    fontWeight: '800',
    color: '#09090b'
  });

  nodes.push({
    id: 'detail-origprice',
    type: 'text',
    parent: `screen-detail`,
    x: sDetail.x + 115,
    y: START_Y + 448,
    w: 80,
    h: 20,
    label: 'Original Price (Detail)',
    screen: 'Detail',
    role: 'originalPrice',
    text: '$390.00',
    fontSize: 14,
    color: '#a1a1aa'
  });

  // Color Swatch Options
  const colors = [
    { name: 'Oatmeal', bg: '#fef3c7' },
    { name: 'Charcoal', bg: '#334155' },
    { name: 'Sage Green', bg: '#cbd5e1' }
  ];
  colors.forEach((c, i) => {
    nodes.push({
      id: `detail-color-${i}`,
      type: 'button',
      parent: `screen-detail`,
      x: sDetail.x + 20 + i * 40,
      y: START_Y + 484,
      w: 30,
      h: 30,
      label: `Color Swatch · ${c.name}`,
      screen: 'Detail',
      role: 'secondaryCTA',
      bg: c.bg,
      radius: 15,
      border: i === 0 ? '2px solid #4f46e5' : '1px solid #cbd5e1'
    });
  });

  // Description snippet
  nodes.push({
    id: 'detail-desc-box',
    type: 'text',
    parent: `screen-detail`,
    x: sDetail.x + 20,
    y: START_Y + 528,
    w: 335,
    h: 60,
    label: 'Description Snippet',
    screen: 'Detail',
    text: 'Crafted with sustainably harvested ash wood and durable recyclable matte composite.',
    fontSize: 12,
    color: '#52525b'
  });

  // Sticky bottom action bar
  nodes.push({
    id: 'detail-bottom-bar',
    type: 'group',
    parent: `screen-detail`,
    x: sDetail.x,
    y: START_Y + SCREEN_H - 96,
    w: SCREEN_W,
    h: 96,
    label: 'Sticky CTA Bar',
    screen: 'Detail',
    bg: '#ffffff',
    border: '1px solid #f4f4f5'
  });

  nodes.push({
    id: 'detail-primary-cta',
    type: 'button',
    parent: 'detail-bottom-bar',
    x: sDetail.x + 20,
    y: START_Y + SCREEN_H - 74,
    w: SCREEN_W - 40,
    h: 52,
    label: 'Add to Bag CTA (Detail)',
    screen: 'Detail',
    role: 'primaryCTA',
    bg: '#09090b',
    color: '#ffffff',
    radius: 16,
    text: 'Add to Bag · $320.00',
    fontSize: 14,
    fontWeight: '700'
  });

  // ---------------------------------------------
  // 4. SCREEN: FAVORITES / WISHLIST
  // ---------------------------------------------
  const sFav = SCREEN_CONFIGS[3];
  addScreenFrame(sFav);
  addStatusBar(sFav.name, sFav.x, START_Y);
  addNavBar(sFav.name, sFav.x, START_Y, 'Saved Wishlist (3)');

  const favItems = [
    { id: 'fav1', title: 'Nordic Lounge Chair', price: '$289.00', rating: '4.9', hue: '#f1f5f9', stock: 'In Stock' },
    { id: 'fav2', title: 'Walnut Dining Chair', price: '$195.00', rating: '4.7', hue: '#e2e8f0', stock: 'Only 2 Left' },
    { id: 'fav3', title: 'Ceramic Vase', price: '$65.00', rating: '4.6', hue: '#fae8ff', stock: 'In Stock' }
  ];

  favItems.forEach((item, i) => {
    const cy = START_Y + 104 + i * 140;

    nodes.push({
      id: item.id,
      type: 'card',
      parent: `screen-favorites`,
      x: sFav.x + 16,
      y: cy,
      w: 343,
      h: 126,
      label: `Wishlist Item (${item.title})`,
      screen: 'Favorites',
      component: 'ProductCard',
      role: 'card',
      bg: '#ffffff',
      radius: 14,
      border: '1px solid #e4e4e7'
    });

    nodes.push({
      id: `${item.id}-img`,
      type: 'image',
      parent: item.id,
      x: sFav.x + 24,
      y: cy + 10,
      w: 96,
      h: 106,
      label: `Image · ${item.title}`,
      screen: 'Favorites',
      component: 'ProductCard',
      role: 'productImage',
      bg: item.hue,
      radius: 10,
      text: 'Item',
      color: '#71717a',
      fontSize: 11
    });

    const tx = sFav.x + 130;

    nodes.push({
      id: `${item.id}-title`,
      type: 'text',
      parent: item.id,
      x: tx,
      y: cy + 14,
      w: 160,
      h: 18,
      label: `Title · ${item.title}`,
      screen: 'Favorites',
      component: 'ProductCard',
      role: 'productTitle',
      text: item.title,
      fontSize: 13,
      fontWeight: '600',
      color: '#09090b'
    });

    nodes.push({
      id: `${item.id}-price`,
      type: 'text',
      parent: item.id,
      x: tx,
      y: cy + 36,
      w: 80,
      h: 18,
      label: `Price · ${item.price}`,
      screen: 'Favorites',
      component: 'ProductCard',
      role: 'price',
      text: item.price,
      fontSize: 14,
      fontWeight: '700',
      color: '#09090b'
    });

    nodes.push({
      id: `${item.id}-fav`,
      type: 'button',
      parent: item.id,
      x: sFav.x + 343 - 28,
      y: cy + 12,
      w: 24,
      h: 24,
      label: `Wishlist Heart · ${item.title}`,
      screen: 'Favorites',
      component: 'ProductCard',
      role: 'favorite',
      bg: '#fee2e2',
      radius: 12,
      text: '♥',
      fontSize: 12,
      color: '#ef4444'
    });

    // Move to Bag CTA
    nodes.push({
      id: `${item.id}-cta`,
      type: 'button',
      parent: item.id,
      x: tx,
      y: cy + 82,
      w: 130,
      h: 30,
      label: `Move to Bag CTA · ${item.title}`,
      screen: 'Favorites',
      component: 'ProductCard',
      role: 'primaryCTA',
      bg: '#09090b',
      color: '#ffffff',
      radius: 8,
      text: 'Move to Bag',
      fontSize: 11,
      fontWeight: '600'
    });
  });

  // Move all button
  nodes.push({
    id: 'fav-move-all-cta',
    type: 'button',
    parent: `screen-favorites`,
    x: sFav.x + 16,
    y: START_Y + 540,
    w: 343,
    h: 46,
    label: 'Move All to Bag CTA',
    screen: 'Favorites',
    role: 'primaryCTA',
    bg: '#4f46e5',
    color: '#ffffff',
    radius: 12,
    text: 'Move All 3 Items to Bag ($549.00)',
    fontSize: 13,
    fontWeight: '700'
  });

  addTabBar(sFav.name, sFav.x, START_Y, 2);

  // ---------------------------------------------
  // 5. SCREEN: SHOPPING CART
  // ---------------------------------------------
  const sCart = SCREEN_CONFIGS[4];
  addScreenFrame(sCart);
  addStatusBar(sCart.name, sCart.x, START_Y);
  addNavBar(sCart.name, sCart.x, START_Y, 'Shopping Cart (3)');

  const cartItems = [
    { id: 'cart1', title: 'Nordic Lounge Chair', price: '$289.00', qty: '1', hue: '#f1f5f9' },
    { id: 'cart2', title: 'Minimalist Desk Lamp', price: '$85.00', qty: '2', hue: '#fef3c7' },
    { id: 'cart3', title: 'Ceramic Vase', price: '$65.00', qty: '1', hue: '#fae8ff' }
  ];

  cartItems.forEach((item, i) => {
    const cy = START_Y + 104 + i * 110;

    nodes.push({
      id: item.id,
      type: 'card',
      parent: `screen-cart`,
      x: sCart.x + 16,
      y: cy,
      w: 343,
      h: 96,
      label: `Cart Item (${item.title})`,
      screen: 'Cart',
      component: 'CartItem',
      role: 'card',
      bg: '#ffffff',
      radius: 14,
      border: '1px solid #e4e4e7'
    });

    nodes.push({
      id: `${item.id}-img`,
      type: 'image',
      parent: item.id,
      x: sCart.x + 24,
      y: cy + 10,
      w: 76,
      h: 76,
      label: `Thumbnail · ${item.title}`,
      screen: 'Cart',
      component: 'CartItem',
      role: 'productImage',
      bg: item.hue,
      radius: 8,
      text: 'Thumb',
      color: '#71717a',
      fontSize: 10
    });

    const tx = sCart.x + 110;

    nodes.push({
      id: `${item.id}-title`,
      type: 'text',
      parent: item.id,
      x: tx,
      y: cy + 14,
      w: 160,
      h: 18,
      label: `Title · ${item.title}`,
      screen: 'Cart',
      component: 'CartItem',
      role: 'productTitle',
      text: item.title,
      fontSize: 13,
      fontWeight: '600',
      color: '#09090b'
    });

    nodes.push({
      id: `${item.id}-price`,
      type: 'text',
      parent: item.id,
      x: tx,
      y: cy + 34,
      w: 80,
      h: 18,
      label: `Price · ${item.price}`,
      screen: 'Cart',
      component: 'CartItem',
      role: 'price',
      text: item.price,
      fontSize: 13,
      fontWeight: '700',
      color: '#09090b'
    });

    // Quantity stepper
    nodes.push({
      id: `${item.id}-stepper`,
      type: 'stepper',
      parent: item.id,
      x: tx,
      y: cy + 58,
      w: 88,
      h: 26,
      label: `Quantity Stepper · ${item.qty}`,
      screen: 'Cart',
      component: 'CartItem',
      role: 'stepper',
      bg: '#f4f4f5',
      radius: 6,
      text: `–  ${item.qty}  +`,
      fontSize: 11,
      fontWeight: '600',
      color: '#18181b'
    });
  });

  // Promo code box
  nodes.push({
    id: 'cart-promo-box',
    type: 'input',
    parent: `screen-cart`,
    x: sCart.x + 16,
    y: START_Y + 448,
    w: 343,
    h: 40,
    label: 'Promo Code Field',
    screen: 'Cart',
    bg: '#f4f4f5',
    color: '#71717a',
    radius: 10,
    text: 'Promo Code: ARCHI30 [Applied -30%]',
    fontSize: 11
  });

  // Price Breakdown
  nodes.push({
    id: 'cart-total-price',
    type: 'text',
    parent: `screen-cart`,
    x: sCart.x + 16,
    y: START_Y + 500,
    w: 343,
    h: 22,
    label: 'Total Cart Price ($504.00)',
    screen: 'Cart',
    role: 'price',
    text: 'Total: $504.00 (Includes Free Shipping)',
    fontSize: 15,
    fontWeight: '800',
    color: '#09090b'
  });

  // Checkout CTA
  nodes.push({
    id: 'cart-checkout-cta',
    type: 'button',
    parent: `screen-cart`,
    x: sCart.x + 16,
    y: START_Y + 534,
    w: 343,
    h: 52,
    label: 'Proceed to Checkout CTA',
    screen: 'Cart',
    role: 'primaryCTA',
    bg: '#09090b',
    color: '#ffffff',
    radius: 16,
    text: 'Proceed to Checkout · $504.00',
    fontSize: 14,
    fontWeight: '700'
  });

  addTabBar(sCart.name, sCart.x, START_Y, 3);

  // ---------------------------------------------
  // 6. SCREEN: CHECKOUT
  // ---------------------------------------------
  const sCheckout = SCREEN_CONFIGS[5];
  addScreenFrame(sCheckout);
  addStatusBar(sCheckout.name, sCheckout.x, START_Y);
  addNavBar(sCheckout.name, sCheckout.x, START_Y, 'Order Confirmation', true);

  // Address card
  nodes.push({
    id: 'chk-address-card',
    type: 'card',
    parent: `screen-checkout`,
    x: sCheckout.x + 16,
    y: START_Y + 104,
    w: 343,
    h: 84,
    label: 'Shipping Address Card',
    screen: 'Checkout',
    component: 'AddressCard',
    role: 'card',
    bg: '#f8fafc',
    radius: 12,
    border: '1px solid #e2e8f0',
    text: '📍  Shipping to: 742 Evergreen Terr, Springfield, OR',
    fontSize: 12,
    fontWeight: '500'
  });

  // Payment card
  nodes.push({
    id: 'chk-payment-card',
    type: 'card',
    parent: `screen-checkout`,
    x: sCheckout.x + 16,
    y: START_Y + 200,
    w: 343,
    h: 84,
    label: 'Payment Method Card',
    screen: 'Checkout',
    component: 'PaymentCard',
    role: 'card',
    bg: '#f8fafc',
    radius: 12,
    border: '1px solid #e2e8f0',
    text: '💳  Visa ending in •••• 4242 (Express Checkout)',
    fontSize: 12,
    fontWeight: '500'
  });

  // Summary breakdown
  nodes.push({
    id: 'chk-summary-card',
    type: 'card',
    parent: `screen-checkout`,
    x: sCheckout.x + 16,
    y: START_Y + 296,
    w: 343,
    h: 110,
    label: 'Price Summary Card',
    screen: 'Checkout',
    component: 'CheckoutCard',
    role: 'card',
    bg: '#ffffff',
    radius: 12,
    border: '1px solid #e4e4e7'
  });

  nodes.push({
    id: 'chk-subtotal-price',
    type: 'text',
    parent: 'chk-summary-card',
    x: sCheckout.x + 28,
    y: START_Y + 310,
    w: 310,
    h: 18,
    label: 'Subtotal ($504.00)',
    screen: 'Checkout',
    role: 'price',
    text: 'Items Subtotal: $504.00',
    fontSize: 12,
    color: '#52525b'
  });

  nodes.push({
    id: 'chk-final-price',
    type: 'text',
    parent: 'chk-summary-card',
    x: sCheckout.x + 28,
    y: START_Y + 360,
    w: 310,
    h: 24,
    label: 'Final Grand Total ($504.00)',
    screen: 'Checkout',
    role: 'price',
    text: 'Grand Total: $504.00',
    fontSize: 16,
    fontWeight: '800',
    color: '#09090b'
  });

  // Simulated Intentional Exclusion: Error/Warning Alert
  nodes.push({
    id: 'chk-warning-banner',
    type: 'rect',
    parent: `screen-checkout`,
    x: sCheckout.x + 16,
    y: START_Y + 420,
    w: 343,
    h: 56,
    label: 'Excluded Delay Warning Banner',
    screen: 'Checkout',
    role: 'errorBanner',
    bg: '#fef2f2',
    border: '1px solid #fecaca',
    radius: 10,
    text: '⚠️  Notice: Oversized freight may require 2 extra days',
    fontSize: 11,
    color: '#b91c1c',
    fontWeight: '600'
  });

  // Place Order CTA
  nodes.push({
    id: 'chk-place-order-cta',
    type: 'button',
    parent: `screen-checkout`,
    x: sCheckout.x + 16,
    y: START_Y + 490,
    w: 343,
    h: 54,
    label: 'Place Order CTA (Checkout)',
    screen: 'Checkout',
    role: 'primaryCTA',
    bg: '#16a34a',
    color: '#ffffff',
    radius: 16,
    text: 'Place Order · $504.00',
    fontSize: 15,
    fontWeight: '700'
  });

  return nodes;
}

export const MOCK_NODES = buildDataset();

// Curated 5 HCI Research Tasks strictly ordered from Easy to Expert
export const RESEARCH_STUDY_TASKS: ResearchTask[] = [
  {
    id: 'task-1-chips',
    level: 1,
    difficulty: 'Easy',
    title: 'Select 4 Category Chips on Home Screen',
    description: 'Select the 4 category filter chips ("All Chairs", "Desk Lamps", "Oak Stools", "Vases") on the Home screen.',
    hintConventional: 'In Select mode (V), drag a small marquee box over the 4 chips, or Shift+Click each chip.',
    hintSmartRef: 'In Smart Reference mode (S), draw a quick line stroke crossing 2 chips — AI infers the 4 category chips.',
    targetRole: 'filterChip',
    targetScope: 'screen',
    screenTarget: 'Home',
    expectedCount: 4,
    conventionalClicksNeeded: 4,
    targetIds: ['home-chip-0', 'home-chip-1', 'home-chip-2', 'home-chip-3']
  },
  {
    id: 'task-2-cards',
    level: 2,
    difficulty: 'Easy-Medium',
    title: 'Select 4 Product Cards in Search Results',
    description: 'Select all 4 product card components in the Search Results screen at the container granularity level.',
    hintConventional: 'In Select mode (V), drag a selection marquee over the cards, or Shift+Click each of the 4 cards.',
    hintSmartRef: 'In Smart Reference mode (S), roughly circle 2 cards — AI infers component container scope for Search.',
    targetComponent: 'ProductCard',
    targetScope: 'screen',
    screenTarget: 'Search',
    expectedCount: 4,
    conventionalClicksNeeded: 4,
    targetIds: ['sc1', 'sc2', 'sc3', 'sc4']
  },
  {
    id: 'task-3-hearts',
    level: 3,
    difficulty: 'Medium',
    title: 'Select 4 Wishlist Heart Buttons in Search',
    description: 'Select the 4 small wishlist heart buttons nestled inside each search result card.',
    hintConventional: 'In Select mode (V), precisely Shift+Click the 4 small 24px heart icons individually.',
    hintSmartRef: 'In Smart Reference mode (S), make a rough stroke intersecting 2 heart icons — AI infers all 4 in this screen.',
    targetRole: 'favorite',
    targetScope: 'screen',
    screenTarget: 'Search',
    expectedCount: 4,
    conventionalClicksNeeded: 4,
    targetIds: ['sc1-fav', 'sc2-fav', 'sc3-fav', 'sc4-fav']
  },
  {
    id: 'task-4-cta',
    level: 4,
    difficulty: 'Hard',
    title: 'Select all "Add to Bag" CTAs across Flow',
    description: 'Select all primary action buttons ("Add to Bag", "Proceed to Checkout", "Place Order") across the screens.',
    hintConventional: 'In Select mode (V), pan across the canvas and Shift+Click 13 individual action buttons across 6 screens.',
    hintSmartRef: 'In Smart Reference mode (S), stroke across 2 "Add to Bag" buttons on Home, then toggle scope to "All Screens".',
    targetRole: 'primaryCTA',
    targetScope: 'document',
    expectedCount: 13,
    conventionalClicksNeeded: 13,
    targetIds: MOCK_NODES.filter(n => n.role === 'primaryCTA').map(n => n.id)
  },
  {
    id: 'task-5-prices',
    level: 5,
    difficulty: 'Expert',
    title: 'Select all 13 Product Prices across Catalog',
    description: 'Select all product price tags ($289.00, $85.00, etc.) across the entire 6-screen workspace.',
    hintConventional: 'In Select mode (V), pan horizontally and Shift+Click each tiny price text across all 6 artboards.',
    hintSmartRef: 'In Smart Reference mode (S), scribble across 2 price labels on any screen, then toggle scope to "All Screens".',
    targetRole: 'price',
    targetScope: 'document',
    expectedCount: 13,
    conventionalClicksNeeded: 13,
    targetIds: MOCK_NODES.filter(n => n.role === 'price').map(n => n.id)
  }
];

