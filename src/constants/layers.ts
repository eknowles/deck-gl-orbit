/**
 * Enumeration of layer types used for generating consistent layer IDs
 */
export enum OrbitLayerType {
  // Base layers
  BASE_POLYGON,

  // Orbit area polygons
  ORBIT_AREA,
  ORBIT_AREA_OUTLINE,

  // Lines
  LINES,
  AXIS_LINE,

  // Points
  POINTS,
  FIRST_POINT,
  SECOND_POINT,

  // Preview elements
  PREVIEW,
  PREVIEW_POLYGON,

  // Interactive elements
  INTERACTIVE,
  MOUSE_POSITION,

  // Debug visualization
  DEBUG_BASE,
  DEBUG_QUADRANTS,
  DEBUG_LABELS,
}

// The getLayerZIndex function has been removed as we now control
// layer ordering through the order of layers in the array

/**
 * Generate a consistent layer ID with proper namespacing
 * @param baseId The base ID of the parent layer
 * @param layerType The type of layer
 * @param suffix An optional suffix for more specific identification
 * @returns A formatted layer ID
 */
export function getLayerId(
  baseId: string,
  layerType: OrbitLayerType,
  suffix?: string
): string {
  const typeStr = OrbitLayerType[layerType].toLowerCase();
  return suffix ? `${baseId}-${typeStr}-${suffix}` : `${baseId}-${typeStr}`;
}
