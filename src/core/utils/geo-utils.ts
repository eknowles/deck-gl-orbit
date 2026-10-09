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
 * Bearing of the great circle from `from` to `to`, measured at `to` (the arrival course).
 * Differs from the departure bearing whenever the track crosses meridians at latitude.
 * @internal
 */
export function calculateFinalBearing(from: Point, to: Point): number {
  return normalizeAngle(calculateBearing(to, from) + 180);
}

/**
 * Point at fraction `t` (0..1) along the great circle from `from` to `to`.
 * @internal
 */
export function interpolateGreatCircle(from: Point, to: Point, t: number): Point {
  if (t <= 0) return { latitude: from.latitude, longitude: from.longitude };
  if (t >= 1) return { latitude: to.latitude, longitude: to.longitude };
  const toRad = Math.PI / 180;
  const lat1 = from.latitude * toRad;
  const lon1 = from.longitude * toRad;
  const lat2 = to.latitude * toRad;
  const lon2 = to.longitude * toRad;
  const ax = Math.cos(lat1) * Math.cos(lon1);
  const ay = Math.cos(lat1) * Math.sin(lon1);
  const az = Math.sin(lat1);
  const bx = Math.cos(lat2) * Math.cos(lon2);
  const by = Math.cos(lat2) * Math.sin(lon2);
  const bz = Math.sin(lat2);
  const omega = Math.acos(Math.min(1, Math.max(-1, ax * bx + ay * by + az * bz)));
  if (omega < 1e-12) return { latitude: from.latitude, longitude: from.longitude };
  const s1 = Math.sin((1 - t) * omega) / Math.sin(omega);
  const s2 = Math.sin(t * omega) / Math.sin(omega);
  const x = ax * s1 + bx * s2;
  const y = ay * s1 + by * s2;
  const z = az * s1 + bz * s2;
  return {
    latitude: Math.atan2(z, Math.sqrt(x * x + y * y)) / toRad,
    longitude: Math.atan2(y, x) / toRad,
  };
}

/**
 * Perpendicular (cross-track) distance in meters from `point` to the great circle
 * through `start` and `end`, measured against the course at `start`.
 * Used for width capture so that a click along the axis extension yields zero width.
 * @internal
 */
export function calculateCrossTrackDistance(start: Point, end: Point, point: Point): number {
  const course = calculateBearing(start, end);
  const bearingToPoint = calculateBearing(start, point);
  const distance = calculateDistance(start, point);
  const relativeAngleRad = ((bearingToPoint - course) * Math.PI) / 180;
  return Math.abs(distance * Math.sin(relativeAngleRad));
}

/**
 * Corridor polygon from centerline + width.
 *
 * Each sample along the great-circle centerline is offset perpendicular to the LOCAL
 * course at that sample. The course of a great circle rotates as it crosses meridians,
 * so reusing the departure bearing at the far end places that end's corners off-axis
 * and beyond the endpoint. Sampling the edges also makes the long edges follow the
 * true parallel curves rather than a straight line in the map projection.
 * The result is invariant under reversal of the centerline.
 * @internal
 */
export function generateCorridorAreaPolygon(
  centerLine: Point[],
  widthMeters: number,
  segments: number = 32,
): Point[] {
  if (centerLine.length < 2 || widthMeters <= 0) return [];
  const start = centerLine[0]!;
  const end = centerLine[centerLine.length - 1]!;
  const halfWidth = widthMeters / 2;
  const n = Math.max(1, Math.floor(segments));

  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = interpolateGreatCircle(start, end, t);
    // Local course: departure bearing at the start, arrival bearing at the end,
    // and the bearing towards the end elsewhere.
    const course =
      i === 0
        ? calculateBearing(start, end)
        : i === n
          ? calculateFinalBearing(start, end)
          : calculateBearing(p, end);
    left.push(calculateDestinationPoint(p, normalizeAngle(course - 90), halfWidth));
    right.push(calculateDestinationPoint(p, normalizeAngle(course + 90), halfWidth));
  }

  // Left edge forward, then right edge back, closed.
  const ring = [...left, ...right.reverse()];
  ring.push({ latitude: ring[0]!.latitude, longitude: ring[0]!.longitude });
  return ring;
}

/**
 * Rectangle polygon from centre + two side lengths + side1 bearing.
 *
 * The rectangle is defined on the local tangent plane at `centre` (azimuthal
 * equidistant frame): every vertex is reached by ONE geodesic step from the centre,
 * using the polar form of its planar offset. Chaining two geodesic steps with a
 * fixed perpendicular bearing produced a trapezoid, because the perpendicular to
 * side1 rotates between the centre and the ends of the axis.
 * Long edges are sampled so they follow the plane's straight lines on the sphere.
 * @internal
 */
export function generateRectangleByCentrePolygon(
  rectangle: RectangleByCentre,
  segmentsPerEdge: number = 8,
): Point[] {
  const halfSide1 = rectangle.length_side_1.meters / 2;
  const halfSide2 = rectangle.length_side_2.meters / 2;
  const bearingSide1 = rectangle.bearing_side_1.degrees;
  const n = Math.max(1, Math.floor(segmentsPerEdge));

  // Planar corners (along side1, across side2), clockwise.
  const corners: [number, number][] = [
    [halfSide1, halfSide2],
    [halfSide1, -halfSide2],
    [-halfSide1, -halfSide2],
    [-halfSide1, halfSide2],
  ];

  const toGeo = (along: number, across: number): Point => {
    const distance = Math.hypot(along, across);
    if (distance === 0) return { ...rectangle.centre };
    const bearing = normalizeAngle(bearingSide1 + (Math.atan2(across, along) * 180) / Math.PI);
    return calculateDestinationPoint(rectangle.centre, bearing, distance);
  };

  const ring: Point[] = [];
  for (let c = 0; c < 4; c++) {
    const [a0, x0] = corners[c]!;
    const [a1, x1] = corners[(c + 1) % 4]!;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      ring.push(toGeo(a0 + (a1 - a0) * t, x0 + (x1 - x0) * t));
    }
  }
  ring.push({ latitude: ring[0]!.latitude, longitude: ring[0]!.longitude });
  return ring;
}
