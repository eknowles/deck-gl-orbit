/**
 * @internal
 */
export type DeckGLColor = [number, number, number, number];

/**
 * @beta
 */
export interface Point {
  longitude: number;
  latitude: number;
}

/**
 * @internal
 */
export enum OrbitAreaAlignmentEnum {
  CENTRE = "OrbitAreaAlignmentEnum_CENTRE",
  LEFT = "OrbitAreaAlignmentEnum_LEFT",
  RIGHT = "OrbitAreaAlignmentEnum_RIGHT",
}

/**
 * @beta
 */
export interface DistanceValue {
  meters: number;
}

/**
 * @beta
 */
export enum DistanceUnit {
  METERS = "METERS",
  KILOMETERS = "KILOMETERS",
  NAUTICAL_MILES = "NAUTICAL_MILES",
  FEET = "FEET",
}

/**
 * @internal
 */
export const DISTANCE_UNIT_CONVERSIONS: Record<DistanceUnit, number> = {
  [DistanceUnit.METERS]: 1,
  [DistanceUnit.KILOMETERS]: 0.001,
  [DistanceUnit.NAUTICAL_MILES]: 1 / 1852,
  [DistanceUnit.FEET]: 3.28084,
};

/**
 * @internal
 */
export const DISTANCE_UNIT_LABELS: Record<DistanceUnit, string> = {
  [DistanceUnit.METERS]: "m",
  [DistanceUnit.KILOMETERS]: "km",
  [DistanceUnit.NAUTICAL_MILES]: "nm",
  [DistanceUnit.FEET]: "ft",
};
