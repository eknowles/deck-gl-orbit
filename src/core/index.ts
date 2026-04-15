// Core exports - no React dependency
// Can be used in vanilla JS, Vue, Angular, Svelte, etc.

// Types
export type { Point, DistanceValue, DeckGLColor } from "./types";
export { OrbitAreaAlignmentEnum, DistanceUnit } from "./types";
export { DISTANCE_UNIT_CONVERSIONS, DISTANCE_UNIT_LABELS } from "./types";

// Layers (DeckGL only)
export {
  default as OrbitAreaLayer,
  type OrbitAreaLayerProps,
} from "./modes/OrbitArea/OrbitAreaLayer";
export {
  default as OrbitAreaModeLayer,
  type OrbitAreaModeLayerProps,
} from "./modes/OrbitArea/OrbitAreaModeLayer";
export {
  default as CircleAreaLayer,
  type CircleAreaLayerProps,
} from "./modes/Circle/CircleAreaLayer";
export {
  default as CircleModeLayer,
  type CircleModeLayerProps,
} from "./modes/Circle/CircleModeLayer";
export {
  default as CorridorAreaLayer,
  type CorridorAreaLayerProps,
} from "./modes/Corridor/CorridorAreaLayer";
export {
  default as CorridorModeLayer,
  type CorridorModeLayerProps,
} from "./modes/Corridor/CorridorModeLayer";

// Modes (nebula.gl style)
export { OrbitAreaMode, type OrbitArea } from "./modes/OrbitArea/OrbitAreaMode";
export { CircleMode, type CircleArea } from "./modes/Circle/CircleMode";
export { CorridorMode, type CorridorArea } from "./modes/Corridor/CorridorMode";
export type { GeometryMode, ModeEventMap } from "./modes/Mode";
export {
  registerMode,
  createMode,
  listRegisteredModeIds,
  type ModeFactory,
  type ModeRegistryOptions,
} from "./modes/ModeRegistry";
export {
  DrawingToolsController,
  type DrawingToolMode,
  type DrawingToolsControllerOptions,
  type OrbitToolBindings,
  type CircleToolBindings,
  type CorridorToolBindings,
} from "./controllers/DrawingToolsController";

// Utilities
export {
  buildCircleLonLatRing,
  calculateDistance,
  calculateBearing,
  calculateDestinationPoint,
  convertDistance,
  generateCorridorAreaPolygon,
} from "./utils/geo-utils";
export { createDebug } from "./utils/debug";
export {
  type AlignmentQuadrant,
  ALIGNMENT_QUADRANTS,
  determineAlignmentFromBearing,
  determineAlignmentFromMousePosition,
} from "./utils/alignment-utils";
