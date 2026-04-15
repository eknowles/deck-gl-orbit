// Core exports - no React dependency
// Can be used in vanilla JS, Vue, Angular, Svelte, etc.

export {
  type CircleToolBindings,
  type CorridorToolBindings,
  type DrawingToolMode,
  DrawingToolsController,
  type DrawingToolsControllerOptions,
  type OrbitToolBindings,
} from "./controllers/DrawingToolsController";
export {
  type CircleAreaLayerProps,
  default as CircleAreaLayer,
} from "./modes/Circle/CircleAreaLayer";
export { type CircleArea, CircleMode } from "./modes/Circle/CircleMode";
export {
  type CircleModeLayerProps,
  default as CircleModeLayer,
} from "./modes/Circle/CircleModeLayer";
export {
  type CorridorAreaLayerProps,
  default as CorridorAreaLayer,
} from "./modes/Corridor/CorridorAreaLayer";
export { type CorridorArea, CorridorMode } from "./modes/Corridor/CorridorMode";
export {
  type CorridorModeLayerProps,
  default as CorridorModeLayer,
} from "./modes/Corridor/CorridorModeLayer";
export type { GeometryMode, ModeEventMap } from "./modes/Mode";
export {
  createMode,
  listRegisteredModeIds,
  type ModeFactory,
  type ModeRegistryOptions,
  registerMode,
} from "./modes/ModeRegistry";
// Layers (DeckGL only)
export {
  default as OrbitAreaLayer,
  type OrbitAreaLayerProps,
} from "./modes/OrbitArea/OrbitAreaLayer";
// Modes (nebula.gl style)
export { type OrbitArea, OrbitAreaMode } from "./modes/OrbitArea/OrbitAreaMode";
export {
  default as OrbitAreaModeLayer,
  type OrbitAreaModeLayerProps,
} from "./modes/OrbitArea/OrbitAreaModeLayer";
// Types
export type { DeckGLColor, DistanceValue, Point } from "./types";
export {
  DISTANCE_UNIT_CONVERSIONS,
  DISTANCE_UNIT_LABELS,
  DistanceUnit,
  OrbitAreaAlignmentEnum,
} from "./types";
export {
  ALIGNMENT_QUADRANTS,
  type AlignmentQuadrant,
  determineAlignmentFromBearing,
  determineAlignmentFromMousePosition,
} from "./utils/alignment-utils";
export { createDebug } from "./utils/debug";
// Utilities
export {
  buildCircleLonLatRing,
  calculateBearing,
  calculateDestinationPoint,
  calculateDistance,
  convertDistance,
  generateCorridorAreaPolygon,
} from "./utils/geo-utils";
