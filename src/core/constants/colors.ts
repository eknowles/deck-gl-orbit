import type { DeckGLColor } from "@/core/types.ts";

export const FONT_FAMILY = "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

export const COLORS: Record<string, DeckGLColor> = {
  AREA_FILL: [255, 165, 2, 30],
  AREA_OUTLINE: [255, 165, 2, 255],
  POINT_COLOR: [30, 144, 255, 255],
  LINE_COLOR: [30, 144, 255, 255],
  AXIS_LINE_COLOR: [255, 99, 132, 255],
  ALIGNMENT_INDICATOR_COLOR: [255, 71, 87, 255],
  DEBUG_TEXT_COLOR: [255, 255, 255, 255],
  DEBUG_BACKGROUND: [0, 0, 0, 190],
  /** Active alignment wedge (debug overlay) */
  ACTIVE_QUADRANT_COLOR: [0, 255, 100, 120],
  INACTIVE_QUADRANT_COLOR: [128, 128, 128, 70],
};

export function asDeckGLColor(color: number[] | undefined): DeckGLColor {
  if (!color || color.length < 4) return [255, 255, 255, 255];
  return [color[0] ?? 255, color[1] ?? 255, color[2] ?? 255, color[3] ?? 255];
}
