/**
 * Color constants for the application
 * All colors use the RGBA format: [R, G, B, A] where each component is in the range 0-255
 */

// Helper type for Deck.GL colors
export type DeckGLColor = [number, number, number, number];

// Helper function to cast colors to DeckGL compatible format
export function asDeckGLColor(color: number[] | undefined): DeckGLColor {
  if (!color) {
    return [255, 255, 255, 255]; // Default white if color is undefined
  }
  return color as DeckGLColor;
}

// Main map colors
export const COLORS: { [key: string]: DeckGLColor } = {
  // Editor colors
  POINT_COLOR: [0, 0, 255, 255],
  LINE_COLOR: [20, 20, 255, 255],
  AXIS_LINE_COLOR: [20, 20, 255, 100],

  // Alignment indicator colors
  ALIGNMENT_INDICATOR_COLOR: [255, 0, 255, 255], // Magenta for general alignment indicators
  ACTIVE_QUADRANT_COLOR: [0, 255, 0, 200], // Green for active quadrant
  INACTIVE_QUADRANT_COLOR: [128, 128, 128, 100], // Gray for inactive quadrants

  // Orbit area colors
  ORBIT_AREA_FILL: [0, 255, 0, 10], // green, semi-transparent
  ORBIT_AREA_OUTLINE: [255, 0, 0, 200], // Darker cyan for the outline

  // Debug colors
  DEBUG_TEXT_COLOR: [255, 255, 255, 255], // White
  DEBUG_BACKGROUND: [0, 0, 0, 180], // Semi-transparent black

  // Left/Right/Center colors
  LEFT_COLOR: [255, 100, 100, 200], // Red
  RIGHT_COLOR: [100, 100, 255, 200], // Blue
  CENTER_COLOR: [100, 255, 100, 200], // Green
};
