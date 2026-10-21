import { SCREEN_CONFIGS, SCREEN_W, SCREEN_H, START_Y } from './data';

export interface CanvasTransform { x: number; y: number; scale: number }

export function fitWorkspace(width: number, height: number): CanvasTransform {
  const left = SCREEN_CONFIGS[0].x;
  const contentWidth = SCREEN_CONFIGS[SCREEN_CONFIGS.length - 1].x + SCREEN_W - left;
  const scale = Math.max(0.08, Math.min(1, (width - 64) / contentWidth, (height - 96) / SCREEN_H));
  return {
    scale,
    x: (width - contentWidth * scale) / 2 - left * scale,
    y: (height - SCREEN_H * scale) / 2 - START_Y * scale + 12,
  };
}

export function zoomAtPoint(previous: CanvasTransform, factor: number, x: number, y: number): CanvasTransform {
  const scale = Math.max(0.08, Math.min(2.5, previous.scale * factor));
  const ratio = scale / previous.scale;
  return { scale, x: x - (x - previous.x) * ratio, y: y - (y - previous.y) * ratio };
}
