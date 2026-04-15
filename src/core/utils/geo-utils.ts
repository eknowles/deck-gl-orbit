import { computeDestinationPoint, getDistance, getGreatCircleBearing } from "geolib";
import type { DistanceUnit, Point } from "../types";
import { DISTANCE_UNIT_CONVERSIONS, OrbitAreaAlignmentEnum } from "../types";
import type { RectangleByCentre } from "../modes/RectangleByCentre/RectangleByCentreMode";

/**
 * @internal
 */
export function calculateDistance(point1: Point, point2: Point): number {
  return getDistance(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude },
  );
}

/**
 * @internal
 */
export function calculateBearing(point1: Point, point2: Point): number {
  return getGreatCircleBearing(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude },
  );
}

/**
 * @internal
 */
export function calculateDestinationPoint(
  start: Point,
  bearingDeg: number,
  distanceMeters: number,
): Point {
  const result = computeDestinationPoint(
    { latitude: start.latitude, longitude: start.longitude },
    distanceMeters,
    bearingDeg,
  );
  return { latitude: result.latitude, longitude: result.longitude };
}

/**
 * @internal
 */
export function convertDistance(distanceMeters: number, unit: DistanceUnit): number {
  return distanceMeters * DISTANCE_UNIT_CONVERSIONS[unit];
}

/**
 * @internal
 */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Closed geographic ring for a constant-radius circle (meters) around `center`.
 * Uses great-circle steps so the shape reads as a circle on the map, not an axis-aligned ellipse.
 * @internal
 */
export function buildCircleLonLatRing(
  center: Point,
  radiusMeters: number,
  segments: number = 64,
): number[][] {
  const n = Math.max(12, Math.floor(segments));
  const ring: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const bearingDeg = (i / n) * 360;
    const p = calculateDestinationPoint(center, bearingDeg, radiusMeters);
    ring.push([p.longitude, p.latitude]);
  }
  return ring;
}

/**
 * Racetrack (orbit) polygon: straight section between offset axis endpoints + semicircular caps.
 * Uses great-circle math via geolib.
 * @internal
 */
export function generateOrbitAreaPolygon(
  firstPoint: Point,
  secondPoint: Point,
  width: number,
  alignment: OrbitAreaAlignmentEnum,
): Point[] {
  const bearing = calculateBearing(firstPoint, secondPoint);
  const radius = width / 2;

  let centerline: [Point, Point] = [firstPoint, secondPoint];

  if (alignment === OrbitAreaAlignmentEnum.LEFT) {
    const leftBearing = normalizeAngle(bearing - 90);
    centerline = [
      calculateDestinationPoint(firstPoint, leftBearing, radius),
      calculateDestinationPoint(secondPoint, leftBearing, radius),
    ];
  } else if (alignment === OrbitAreaAlignmentEnum.RIGHT) {
    const rightBearing = normalizeAngle(bearing + 90);
    centerline = [
      calculateDestinationPoint(firstPoint, rightBearing, radius),
      calculateDestinationPoint(secondPoint, rightBearing, radius),
    ];
  }

  const polygonPoints: Point[] = [];
  const segments = 20;

  // Cap at first centerline endpoint: from +90° to -90° of axis (clockwise along perimeter)
  let startAngle = normalizeAngle(bearing + 90);
  let endAngle = normalizeAngle(bearing - 90);
  if (startAngle > endAngle) {
    endAngle += 360;
  }
  let angleStep = (endAngle - startAngle) / segments;
  for (let i = 0; i <= segments; i++) {
    const angle = normalizeAngle(startAngle + i * angleStep);
    polygonPoints.push(calculateDestinationPoint(centerline[0], angle, radius));
  }

  // Cap at second centerline endpoint
  startAngle = normalizeAngle(bearing - 90);
  endAngle = normalizeAngle(bearing + 90);
  if (startAngle > endAngle) {
    endAngle += 360;
  }
  angleStep = (endAngle - startAngle) / segments;
  for (let i = 0; i <= segments; i++) {
    const angle = normalizeAngle(startAngle + i * angleStep);
    polygonPoints.push(calculateDestinationPoint(centerline[1], angle, radius));
  }

  const first = polygonPoints[0];
  if (first) {
    polygonPoints.push({
      latitude: first.latitude,
      longitude: first.longitude,
    });
  }

  return polygonPoints;
}

/**
 * Corridor polygon from centerline + width.
 * Reuses orbit center-aligned capsule for two-point centerlines.
 * @internal
 */
export function generateCorridorAreaPolygon(centerLine: Point[], widthMeters: number): Point[] {
  if (centerLine.length < 2 || widthMeters <= 0) return [];
  const start = centerLine[0]!;
  const end = centerLine[centerLine.length - 1]!;
  const halfWidth = widthMeters / 2;
  const bearing = calculateBearing(start, end);
  const leftBearing = normalizeAngle(bearing - 90);
  const rightBearing = normalizeAngle(bearing + 90);

  const startLeft = calculateDestinationPoint(start, leftBearing, halfWidth);
  const startRight = calculateDestinationPoint(start, rightBearing, halfWidth);
  const endLeft = calculateDestinationPoint(end, leftBearing, halfWidth);
  const endRight = calculateDestinationPoint(end, rightBearing, halfWidth);

  // Rectangular corridor (flat ends): left edge forward, then right edge back.
  return [startLeft, endLeft, endRight, startRight, startLeft];
}

/**
 * Rectangle polygon from centre + two side lengths + side1 bearing.
 * @internal
 */
export function generateRectangleByCentrePolygon(rectangle: RectangleByCentre): Point[] {
  const halfSide1 = rectangle.length_side_1.meters / 2;
  const halfSide2 = rectangle.length_side_2.meters / 2;
  const bearingSide1 = rectangle.bearing_side_1.degrees;
  const perpendicularBearing = bearingSide1 + 90;

  const forward = calculateDestinationPoint(rectangle.centre, bearingSide1, halfSide1);
  const backward = calculateDestinationPoint(rectangle.centre, bearingSide1 + 180, halfSide1);

  const corner1 = calculateDestinationPoint(forward, perpendicularBearing, halfSide2);
  const corner2 = calculateDestinationPoint(forward, perpendicularBearing + 180, halfSide2);
  const corner3 = calculateDestinationPoint(backward, perpendicularBearing + 180, halfSide2);
  const corner4 = calculateDestinationPoint(backward, perpendicularBearing, halfSide2);

  return [corner1, corner2, corner3, corner4, corner1];
}
