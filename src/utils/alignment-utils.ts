import type { Point } from "../types";
import { OrbitAreaAlignmentEnum } from "../types";
import { calculateBearing, normalizeAngle } from "./geo-utils";
import { createDebug } from "./debug";

// Create a debug instance for alignment utilities
const debug = createDebug("alignment");

/**
 * Represents a quadrant with its range and associated alignment
 */
interface AlignmentQuadrant {
  name: string;
  minAngle: number;
  maxAngle: number;
  alignment: OrbitAreaAlignmentEnum;
}

/**
 * Define quadrants for alignment determination
 * These quadrants are defined relative to the main bearing.
 * The coordinate system is:
 * - 0 degrees: directly ahead (along the main bearing)
 * - 90 degrees: to the right of the main bearing
 * - 180 degrees: directly behind (opposite to main bearing)
 * - 270 degrees: to the left of the main bearing
 */
export const ALIGNMENT_QUADRANTS: AlignmentQuadrant[] = [
  {
    name: "CENTER_FORWARD",
    minAngle: 315, // Forward arc: 315-45 degrees
    maxAngle: 45, // (wraps around 0)
    alignment: OrbitAreaAlignmentEnum.CENTRE,
  },
  {
    name: "RIGHT",
    minAngle: 45, // Right side: 45-135 degrees
    maxAngle: 135,
    alignment: OrbitAreaAlignmentEnum.RIGHT,
  },
  {
    name: "CENTER_BACKWARD",
    minAngle: 135, // Back arc: 135-225 degrees
    maxAngle: 225,
    alignment: OrbitAreaAlignmentEnum.CENTRE,
  },
  {
    name: "LEFT",
    minAngle: 225, // Left side: 225-315 degrees
    maxAngle: 315,
    alignment: OrbitAreaAlignmentEnum.LEFT,
  },
];

/**
 * Utility function to determine the alignment of an OrbitArea based on the bearing
 * from the first point to the second point, split into quadrants offset by 45 degrees
 *
 * @param firstPoint The first point of the OrbitArea axis
 * @param secondPoint The second point of the OrbitArea axis
 * @returns The alignment enum value based on the bearing
 */
export function determineAlignmentFromBearing(
  firstPoint: Point,
  secondPoint: Point
): {
  alignment: OrbitAreaAlignmentEnum;
  quadrantName: string;
  relativeBearing: number;
} {
  // Calculate the bearing from first to second point
  const bearing = calculateBearing(firstPoint, secondPoint);

  // Normalize the bearing to 0-360 degrees
  const normalizedBearing = normalizeAngle(bearing);

  // Determine which quadrant the bearing falls into
  for (const quadrant of ALIGNMENT_QUADRANTS) {
    if (quadrant.minAngle > quadrant.maxAngle) {
      // Handle the wrap-around case (e.g., 315° to 45°)
      if (
        normalizedBearing >= quadrant.minAngle ||
        normalizedBearing <= quadrant.maxAngle
      ) {
        return {
          alignment: quadrant.alignment,
          quadrantName: quadrant.name,
          relativeBearing: normalizedBearing,
        };
      }
    } else if (
      normalizedBearing >= quadrant.minAngle &&
      normalizedBearing <= quadrant.maxAngle
    ) {
      return {
        alignment: quadrant.alignment,
        quadrantName: quadrant.name,
        relativeBearing: normalizedBearing,
      };
    }
  }

  // Default to CENTRE if something goes wrong
  return {
    alignment: OrbitAreaAlignmentEnum.CENTRE,
    quadrantName: "DEFAULT",
    relativeBearing: normalizedBearing,
  };
}

/**
 * Utility function to determine the alignment of an OrbitArea based on mouse position
 * relative to the line between the first and second points
 *
 * @param firstPoint The first point of the OrbitArea axis
 * @param secondPoint The second point of the OrbitArea axis
 * @param mousePoint The current mouse position
 * @returns The suggested alignment enum value
 */
export function determineAlignmentFromMousePosition(
  firstPoint: Point,
  secondPoint: Point,
  mousePoint: Point
): OrbitAreaAlignmentEnum {
  debug("determineAlignmentFromMousePosition called!");

  // Calculate the bearing from first to second point
  const mainBearing = calculateBearing(firstPoint, secondPoint);
  debug(`Main bearing: ${mainBearing.toFixed(2)} degrees`);

  // Calculate bearing from second point to mouse
  const mouseBearing = calculateBearing(secondPoint, mousePoint);
  debug(`Mouse bearing: ${mouseBearing.toFixed(2)} degrees`);

  // Normalize the difference between the bearings to get the relative angle
  const relativeBearing = normalizeAngle(mouseBearing - mainBearing);

  // Log for debugging
  debug(`Mouse relative bearing: ${relativeBearing.toFixed(2)} degrees`);

  // Check which quadrant the mouse is in and return the corresponding alignment
  for (const quadrant of ALIGNMENT_QUADRANTS) {
    if (quadrant.minAngle > quadrant.maxAngle) {
      // Handle the wrap-around case
      if (
        relativeBearing >= quadrant.minAngle ||
        relativeBearing <= quadrant.maxAngle
      ) {
        debug(`Detected alignment: ${quadrant.name}`);
        return quadrant.alignment;
      }
    } else if (
      relativeBearing >= quadrant.minAngle &&
      relativeBearing <= quadrant.maxAngle
    ) {
      debug(`Detected alignment: ${quadrant.name}`);
      return quadrant.alignment;
    }
  }

  // Default to CENTER if something goes wrong
  debug("No quadrant matched, defaulting to CENTRE");
  return OrbitAreaAlignmentEnum.CENTRE;
}
