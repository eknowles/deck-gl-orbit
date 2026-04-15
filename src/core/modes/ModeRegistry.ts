import type { DistanceUnit } from "../types";
import { DistanceUnit as DistanceUnitEnum } from "../types";
import { CircleMode } from "./Circle/CircleMode";
import { CorridorMode } from "./Corridor/CorridorMode";
import type { GeometryMode } from "./Mode";
import { OrbitAreaMode } from "./OrbitArea/OrbitAreaMode";

/**
 * Options passed to `createMode` — mode-specific; unknown keys ignored by each mode.
 * @internal
 */
export type ModeRegistryOptions = Record<string, unknown>;

/**
 * @internal
 */
export type ModeFactory = (options?: ModeRegistryOptions) => GeometryMode<any, string, any>;

const modes = new Map<string, ModeFactory>();

/**
 * Register or replace a geometry mode factory. Returns unregister function.
 * Built-ins `orbit` and `circle` are registered on module load; you may replace them.
 * @internal
 */
export function registerMode(id: string, factory: ModeFactory): () => void {
  modes.set(id, factory);
  return () => {
    modes.delete(id);
  };
}

/**
 * @internal
 */
export function createMode(
  id: string,
  options?: ModeRegistryOptions,
): GeometryMode<any, string, any> | null {
  const factory = modes.get(id);
  return factory ? factory(options) : null;
}

/**
 * @internal
 */
export function listRegisteredModeIds(): string[] {
  return [...modes.keys()];
}

registerMode(
  "orbit",
  (opts) =>
    new OrbitAreaMode({
      distanceUnit: (opts?.distanceUnit as DistanceUnit | undefined) ?? DistanceUnitEnum.METERS,
    }),
);

registerMode("circle", () => new CircleMode());

registerMode(
  "corridor",
  (opts) =>
    new CorridorMode({
      distanceUnit: (opts?.distanceUnit as DistanceUnit | undefined) ?? DistanceUnitEnum.METERS,
    }),
);
