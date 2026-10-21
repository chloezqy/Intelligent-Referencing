import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitWorkspace, zoomAtPoint } from './workspace';
import { MOCK_NODES, SCREEN_CONFIGS, SCREEN_W, SCREEN_H, START_Y } from './data';

for (const [width, height] of [[1024, 768], [1280, 800], [1366, 768], [1440, 900], [1920, 1080]]) {
  for (const panelWidth of [0, 260, 300, 380]) {
    test(`Fit all screens at ${width}×${height}, panel ${panelWidth}`, () => {
      const canvasWidth = width - 60 - panelWidth;
      // Header and dock occupy layout space outside the canvas.
      const canvasHeight = height - 56 - 100;
      const view = fitWorkspace(canvasWidth, canvasHeight);
      for (const screen of SCREEN_CONFIGS) {
        assert.ok(screen.x * view.scale + view.x >= 0);
        assert.ok((screen.x + SCREEN_W) * view.scale + view.x <= canvasWidth);
        assert.ok((START_Y - 50) * view.scale + view.y >= 0);
        assert.ok((START_Y + SCREEN_H) * view.scale + view.y <= canvasHeight);
      }
    });
  }
}

test('Zoom preserves the world point under the cursor, including scale limits', () => {
  const previous = { x: -300, y: 20, scale: 0.46 };
  for (const factor of [0.01, 0.92, 1.2, 100]) {
    const next = zoomAtPoint(previous, factor, 500, 300);
    assert.ok(Math.abs((500 - next.x) / next.scale - (500 - previous.x) / previous.scale) < 1e-8);
    assert.ok(Math.abs((300 - next.y) / next.scale - (300 - previous.y) / previous.scale) < 1e-8);
    assert.ok(next.scale >= 0.08 && next.scale <= 2.5);
  }
});

test('All commerce content fits its parent and retains the six original screen bounds', () => {
  assert.deepEqual(MOCK_NODES.filter(n => n.type === 'screen').map(n => [n.x, n.y, n.w, n.h]),
    SCREEN_CONFIGS.map(s => [s.x, START_Y, 375, 812]));
  for (const node of MOCK_NODES) {
    const parent = MOCK_NODES.find(p => p.id === node.parent);
    if (!parent) continue;
    assert.ok(node.x >= parent.x && node.y >= parent.y && node.x + node.w <= parent.x + parent.w && node.y + node.h <= parent.y + parent.h, node.id);
  }
  for (const text of MOCK_NODES.filter(n => n.type === 'text')) {
    for (const button of MOCK_NODES.filter(n => n.type === 'button' && n.parent === text.parent)) {
      assert.ok(!(text.x < button.x + button.w && text.x + text.w > button.x && text.y < button.y + button.h && text.y + text.h > button.y), `${text.id} overlaps ${button.id}`);
    }
  }
});
