// used in deck.gl layer IDs
export enum OrbitLayerType {
  ORBIT_AREA = "orbit-area",
  POINTS = "points",
  FIRST_POINT = "first-point",
  SECOND_POINT = "second-point",
  AXIS_LINE = "axis-line",
  PREVIEW_POLYGON = "preview-polygon",
  DEBUG_QUADRANTS = "debug-quadrants",
  DEBUG_LABELS = "debug-labels",
}

export function getLayerId(baseId: string, type: OrbitLayerType, suffix?: string): string {
  return suffix ? `${baseId}-${type}-${suffix}` : `${baseId}-${type}`;
}
