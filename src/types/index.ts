// Core types and interfaces for OrbitArea

/**
 * Represents a geographical point with latitude and longitude
 */
export interface Point {
  latitude: number;
  longitude: number;
  altitude?: number;
  frame?: any; // Base.Pose.Frame - can be ignored for now
}

/**
 * Base interface for surface types
 */
export interface SurfaceBase {
  id?: string;
}

/**
 * Available alignment options for OrbitArea
 */
export enum OrbitAreaAlignmentEnum {
  CENTRE = "OrbitAreaAlignmentEnum_CENTRE",
  LEFT = "OrbitAreaAlignmentEnum_LEFT",
  RIGHT = "OrbitAreaAlignmentEnum_RIGHT",
}

/**
 * Defines the OrbitArea - a racetrack-shaped geographical surface
 */
export interface OrbitArea extends SurfaceBase {
  /** The initial Point of the axis of the OrbitArea. */
  first_point: Point;
  /** The final Point of the axis of the OrbitArea. */
  second_point: Point;
  /** The horizontal distance measured from side to side for the OrbitArea. */
  width: number; // in meters
  alignment: OrbitAreaAlignmentEnum;
}

/**
 * Editor modes for the OrbitArea creation workflow
 */
export enum EditorMode {
  INACTIVE = "INACTIVE",
  FIRST_POINT = "FIRST_POINT",
  SECOND_POINT = "SECOND_POINT",
  WIDTH_SELECTION = "WIDTH_SELECTION",
}

/**
 * Distance units supported by the editor
 */
export enum DistanceUnit {
  METERS = "METERS",
  KILOMETERS = "KILOMETERS",
  NAUTICAL_MILES = "NAUTICAL_MILES",
  FEET = "FEET",
}

/**
 * Editor state for the OrbitArea editor
 */
export interface EditorState {
  mode: EditorMode;
  firstPoint?: Point;
  secondPoint?: Point;
  width?: number;
  mousePosition?: Point;
  alignment?: OrbitAreaAlignmentEnum; // Make alignment optional since we'll manage it internally
}

/**
 * Conversion factors for different distance units
 */
export const DISTANCE_UNIT_CONVERSIONS = {
  [DistanceUnit.METERS]: 1,
  [DistanceUnit.KILOMETERS]: 0.001,
  [DistanceUnit.NAUTICAL_MILES]: 0.000539957,
  [DistanceUnit.FEET]: 3.28084,
};

/**
 * Distance unit labels for display
 */
export const DISTANCE_UNIT_LABELS = {
  [DistanceUnit.METERS]: "m",
  [DistanceUnit.KILOMETERS]: "km",
  [DistanceUnit.NAUTICAL_MILES]: "nm",
  [DistanceUnit.FEET]: "ft",
};
