import type { OrbitAreaAlignmentEnum, Point } from "../types";
import { OrbitAreaAlignmentEnum as Align } from "../types";
import { createDebug } from "./debug";
import { calculateBearing, normalizeAngle } from "./geo-utils";

const debug = createDebug("alignment");

/**
 * @internal
 */
export interface AlignmentQuadrant {
  name: string;
  minAngle: number;
  maxAngle: number;
  alignment: OrbitAreaAlignmentEnum;
}

/**
 * Quadrants relative to axis bearing (0° = ahead along first→second).
 * Used for both mouse alignment and debug overlays.
 * @internal
 */
export const ALIGNMENT_QUADRANTS: AlignmentQuadrant[] = [
  {
    name: "CENTER_FORWARD",
    minAngle: 315,
    maxAngle: 45,
    alignment: Align.CENTRE,
  },
  {
    name: "RIGHT",
    minAngle: 45,
    maxAngle: 135,
    alignment: Align.RIGHT,
  },
  {
    name: "CENTER_BACKWARD",
    minAngle: 135,
    maxAngle: 225,
    alignment: Align.CENTRE,
  },
  {
    name: "LEFT",
    minAngle: 225,
    maxAngle: 315,
    alignment: Align.LEFT,
  },
];

function matchQuadrant(relativeBearing: number): AlignmentQuadrant {
  const normalizedBearing = normalizeAngle(relativeBearing);
  for (const quadrant of ALIGNMENT_QUADRANTS) {
    if (quadrant.minAngle > quadrant.maxAngle) {
      if (normalizedBearing >= quadrant.minAngle || normalizedBearing <= quadrant.maxAngle) {
        return quadrant;
      }
    } else if (normalizedBearing >= quadrant.minAngle && normalizedBearing <= quadrant.maxAngle) {
      return quadrant;
    }
  }
  return {
    name: "DEFAULT",
    minAngle: 0,
    maxAngle: 360,
    alignment: Align.CENTRE,
  };
}

/**
 * @internal
 */
export function determineAlignmentFromBearing(
  firstPoint: Point,
  secondPoint: Point,
): { alignment: OrbitAreaAlignmentEnum; quadrantName: string; relativeBearing: number } {
  const bearing = calculateBearing(firstPoint, secondPoint);
  const normalizedBearing = normalizeAngle(bearing);
  const quadrant = matchQuadrant(normalizedBearing);
  return {
    alignment: quadrant.alignment,
    quadrantName: quadrant.name,
    relativeBearing: normalizedBearing,
  };
}

/**
 * Alignment from mouse position relative to first→second axis (bearing-relative quadrants).
 * Restores CENTRE for forward/back arcs; LEFT/RIGHT for side quadrants.
 * @internal
 */
export function determineAlignmentFromMousePosition(
  firstPoint: Point,
  secondPoint: Point,
  mousePoint: Point,
): OrbitAreaAlignmentEnum {
  const mainBearing = calculateBearing(firstPoint, secondPoint);
  const mouseBearing = calculateBearing(secondPoint, mousePoint);
  const relativeBearing = normalizeAngle(mouseBearing - mainBearing);
  debug("alignment: main=%s mouseRel=%s", mainBearing.toFixed(1), relativeBearing.toFixed(1));
  return matchQuadrant(relativeBearing).alignment;
}
