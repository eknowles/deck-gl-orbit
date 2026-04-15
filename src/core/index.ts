// Core exports - no React dependency
// Can be used in vanilla JS, Vue, Angular, Svelte, etc.

export {
  type CircleToolBindings,
  type CorridorToolBindings,
  type DrawingToolMode,
  DrawingToolsController,
  type DrawingToolsControllerOptions,
  type OrbitToolBindings,
  type RectangleByCentreToolBindings,
} from "./controllers/DrawingToolsController";
export {
  type CircleDisplayLayerProps,
  default as CircleDisplayLayer,
} from "./modes/Circle/CircleDisplayLayer";
export { type CircleArea, CircleMode } from "./modes/Circle/CircleMode";
export {
  type CircleCreateLayerProps,
  default as CircleCreateLayer,
} from "./modes/Circle/CircleCreateLayer";
export {
  type CorridorDisplayLayerProps,
  default as CorridorDisplayLayer,
} from "./modes/Corridor/CorridorDisplayLayer";
export { type CorridorArea, CorridorMode } from "./modes/Corridor/CorridorMode";
export {
  type CorridorCreateLayerProps,
  default as CorridorCreateLayer,
} from "./modes/Corridor/CorridorCreateLayer";
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
  default as OrbitAreaDisplayLayer,
  type OrbitAreaDisplayLayerProps,
} from "./modes/OrbitArea/OrbitAreaDisplayLayer";
// Modes (nebula.gl style)
export { type OrbitArea, OrbitAreaMode } from "./modes/OrbitArea/OrbitAreaMode";
export {
  default as OrbitAreaCreateLayer,
  type OrbitAreaCreateLayerProps,
} from "./modes/OrbitArea/OrbitAreaCreateLayer";
export {
  type RectangleByCentreDisplayLayerProps,
  default as RectangleByCentreDisplayLayer,
} from "./modes/RectangleByCentre/RectangleByCentreDisplayLayer";
export {
  type RectangleByCentre,
  RectangleByCentreMode,
} from "./modes/RectangleByCentre/RectangleByCentreMode";
export {
  type RectangleByCentreCreateLayerProps,
  default as RectangleByCentreCreateLayer,
} from "./modes/RectangleByCentre/RectangleByCentreCreateLayer";
// Types
export type { AngleValue, DeckGLColor, DistanceValue, Point } from "./types";
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
  generateRectangleByCentrePolygon,
} from "./utils/geo-utils";
