import {
  computeDestinationPoint,
  getDistance,
  getGreatCircleBearing,
} from "geolib";
import type { Point } from "../types";
import { DISTANCE_UNIT_CONVERSIONS, DistanceUnit } from "../types";

/**
 * Calculate the great circle distance between two points
 * @param point1 The first point
 * @param point2 The second point
 * @returns Distance in meters
 */
export function calculateDistance(point1: Point, point2: Point): number {
  return getDistance(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude }
  );
}

/**
 * Calculate the bearing between two points (in degrees)
 * @param point1 The start point
 * @param point2 The end point
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(point1: Point, point2: Point): number {
  return getGreatCircleBearing(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude }
  );
}

/**
 * Calculate a destination point given a start point, bearing and distance
 * @param start The starting point
 * @param bearing The bearing in degrees
 * @param distance The distance in meters
 * @returns Destination point
 */
export function calculateDestinationPoint(
  start: Point,
  bearing: number,
  distance: number
): Point {
  const result = computeDestinationPoint(
    { latitude: start.latitude, longitude: start.longitude },
    distance,
    bearing
  );

  return {
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

/**
 * Calculate a point that is perpendicular to a line at a given distance
 * @param start The start of the line
 * @param bearing The bearing of the line
 * @param distance The perpendicular distance
 * @param isRight Whether to calculate the right or left perpendicular
 * @returns Perpendicular point
 */
export function calculatePerpendicularPoint(
  start: Point,
  bearing: number,
  distance: number,
  isRight: boolean
): Point {
  // For a perpendicular point, we add or subtract 90 degrees from the bearing
  const perpendicularBearing = normalizeAngle(bearing + (isRight ? 90 : -90));
  return calculateDestinationPoint(start, perpendicularBearing, distance);
}

/**
 * Normalize an angle to be between 0-360 degrees
 * @param angle The angle to normalize in degrees
 * @returns Normalized angle between 0-360
 */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Convert meters to the specified distance unit
 * @param meters Distance in meters
 * @param unit The target unit
 * @returns Converted distance
 */
export function convertDistance(meters: number, unit: DistanceUnit): number {
  return meters * DISTANCE_UNIT_CONVERSIONS[unit];
}

/**
 * Format a distance for display with the appropriate unit
 * @param meters Distance in meters
 * @param unit The target unit
 * @param decimals Number of decimal places
 * @returns Formatted distance string
 */
export function formatDistance(
  meters: number,
  unit: DistanceUnit,
  decimals: number = 2
): string {
  const converted = convertDistance(meters, unit);
  const unitLabel = DistanceUnit[unit].toLowerCase();
  return `${converted.toFixed(decimals)} ${unitLabel}`;
}

/**
 * Generate points for a semicircle
 * @param center The center point of the semicircle
 * @param radius Radius in meters
 * @param startBearing Starting bearing in degrees
 * @param endBearing Ending bearing in degrees
 * @param segments Number of segments to use (more = smoother curve)
 * @returns Array of points forming the semicircle
 */
export function generateSemicirclePoints(
  center: Point,
  radius: number,
  startBearing: number,
  endBearing: number,
  segments: number = 20
): Point[] {
  const points: Point[] = [];
  const angleStep = (endBearing - startBearing) / segments;

  for (let i = 0; i <= segments; i++) {
    const bearing = normalizeAngle(startBearing + i * angleStep);
    points.push(calculateDestinationPoint(center, bearing, radius));
  }

  return points;
}

/**
 * Generate polygon points for an OrbitArea
 * This function will be used to generate the actual polygon shape based on
 * the first point, second point, width and alignment
 */
export function generateOrbitAreaPolygon(
  firstPoint: Point,
  secondPoint: Point,
  width: number,
  alignment: string
): Point[] {
  const bearing = calculateBearing(firstPoint, secondPoint);
  const distance = calculateDistance(firstPoint, secondPoint);
  const radius = width / 2;

  // Define the centerline based on alignment
  let centerline: [Point, Point] = [firstPoint, secondPoint];

  // Adjust center line based on alignment
  // Support both direct enum values and string representation
  if (alignment === "OrbitAreaAlignmentEnum_LEFT") {
    // For LEFT alignment, offset to the left (-90 degrees from bearing)
    const leftBearing = normalizeAngle(bearing - 90);
    centerline = [
      calculateDestinationPoint(firstPoint, leftBearing, radius),
      calculateDestinationPoint(secondPoint, leftBearing, radius),
    ];
  } else if (alignment === "OrbitAreaAlignmentEnum_RIGHT") {
    // For RIGHT alignment, offset to the right (+90 degrees from bearing)
    const rightBearing = normalizeAngle(bearing + 90);
    centerline = [
      calculateDestinationPoint(firstPoint, rightBearing, radius),
      calculateDestinationPoint(secondPoint, rightBearing, radius),
    ];
  }

  // Calculate perpendicular bearings relative to the main axis
  const rightBearing = normalizeAngle(bearing + 90);
  const leftBearing = normalizeAngle(bearing - 90);

  // Generate a pill shape (racetrack) with proper semicircular caps
  const polygonPoints: Point[] = [];

  // First add points for the first semicircle (at the first centerline point)
  // We need to go from right to left (clockwise)
  // Calculate angular range for the semicircle
  let startAngle = normalizeAngle(bearing + 90); // Right side of main axis
  let endAngle = normalizeAngle(bearing - 90); // Left side of main axis

  // Handle the case where we need to go the long way around
  if (startAngle > endAngle) {
    endAngle += 360;
  }

  // Generate first semicircle points
  const segments = 20;
  const angleStep = (endAngle - startAngle) / segments;

  for (let i = 0; i <= segments; i++) {
    const angle = normalizeAngle(startAngle + i * angleStep);
    const point = calculateDestinationPoint(centerline[0], angle, radius);
    polygonPoints.push(point);
  }

  // Now add points for the second semicircle (at the second centerline point)
  // We need to go from left to right (clockwise) for the bottom cap
  startAngle = normalizeAngle(bearing - 90); // Left side of main axis
  endAngle = normalizeAngle(bearing + 90); // Right side of main axis

  // Handle the case where we need to go the long way around
  if (startAngle > endAngle) {
    endAngle += 360;
  }

  // Generate second semicircle points
  for (let i = 0; i <= segments; i++) {
    const angle = normalizeAngle(startAngle + i * angleStep);
    const point = calculateDestinationPoint(centerline[1], angle, radius);
    polygonPoints.push(point);
  }

  // Add the first point again to close the polygon
  if (polygonPoints.length > 0 && polygonPoints[0]) {
    const firstPoint = polygonPoints[0];
    polygonPoints.push({
      latitude: firstPoint.latitude,
      longitude: firstPoint.longitude,
    });
  }

  return polygonPoints;
}
