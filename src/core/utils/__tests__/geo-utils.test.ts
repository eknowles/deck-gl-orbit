import { describe, expect, test } from "bun:test";
import type { Point } from "../../types";
import { OrbitAreaAlignmentEnum } from "../../types";
import { determineAlignmentFromMousePosition } from "../alignment-utils";
import {
  calculateBearing,
  calculateCrossTrackDistance,
  calculateDestinationPoint,
  calculateDistance,
  calculateFinalBearing,
  generateCorridorAreaPolygon,
  generateOrbitAreaPolygon,
  generateRectangleByCentrePolygon,
} from "../geo-utils";

const NM = 1852;
/**
 * geolib's computeDestinationPoint and getDistance use different Earth radii
 * (6 378 137 m vs 6 371 000 m), a 0.11 % discrepancy. Distance assertions use a
 * relative tolerance so they test the geometry rather than that library quirk.
 */
const REL_TOL = 0.002;
const SCOTLAND: Point = { latitude: 57.0, longitude: -4.0 };
const ST_JOHNS: Point = { latitude: 47.56, longitude: -52.71 };

/** Nearest distance from `p` to any vertex of `ring`, in metres. */
function nearestVertex(p: Point, ring: Point[]): number {
  return Math.min(...ring.map((q) => calculateDistance(p, q)));
}

describe("generateCorridorAreaPolygon", () => {
  test("is invariant under reversal of the centreline (Scotland ↔ St John's, 200 nm)", () => {
    const width = 200 * NM;
    const forward = generateCorridorAreaPolygon([SCOTLAND, ST_JOHNS], width);
    const reversed = generateCorridorAreaPolygon([ST_JOHNS, SCOTLAND], width);
    expect(forward.length).toBe(reversed.length);
    for (const v of forward) {
      // Same vertex set; ordering differs because the ring is traversed from the other end.
      expect(nearestVertex(v, reversed)).toBeLessThan(1);
    }
  });

  test("end corners lie abeam each endpoint at exactly half width", () => {
    const width = 200 * NM;
    const ring = generateCorridorAreaPolygon([SCOTLAND, ST_JOHNS], width, 32);
    const n = 32;
    const startLeft = ring[0]!;
    const endLeft = ring[n]!;
    const endRight = ring[n + 1]!;
    const startRight = ring[2 * n + 1]!;

    for (const [corner, endpoint] of [
      [startLeft, SCOTLAND],
      [startRight, SCOTLAND],
      [endLeft, ST_JOHNS],
      [endRight, ST_JOHNS],
    ] as const) {
      expect(Math.abs(calculateDistance(corner, endpoint) - width / 2)).toBeLessThan(
        (width / 2) * REL_TOL,
      );
    }

    // Perpendicularity: bearing endpoint→corner is 90° off the local course at that endpoint.
    const departure = calculateBearing(SCOTLAND, ST_JOHNS);
    const arrival = calculateFinalBearing(SCOTLAND, ST_JOHNS);
    const diff = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);
    expect(diff(calculateBearing(SCOTLAND, startLeft), departure - 90)).toBeLessThan(0.05);
    expect(diff(calculateBearing(ST_JOHNS, endLeft), arrival - 90)).toBeLessThan(0.05);
  });

  test("returns an empty ring for degenerate input", () => {
    expect(generateCorridorAreaPolygon([SCOTLAND], 1000)).toEqual([]);
    expect(generateCorridorAreaPolygon([SCOTLAND, ST_JOHNS], 0)).toEqual([]);
  });
});

describe("calculateCrossTrackDistance", () => {
  test("is zero for a point on the axis extension and half width abeam", () => {
    const course = calculateBearing(SCOTLAND, ST_JOHNS);
    const onAxis = calculateDestinationPoint(SCOTLAND, course, 50_000);
    const abeam = calculateDestinationPoint(SCOTLAND, course + 90, 50_000);
    expect(calculateCrossTrackDistance(SCOTLAND, ST_JOHNS, onAxis)).toBeLessThan(1);
    expect(Math.abs(calculateCrossTrackDistance(SCOTLAND, ST_JOHNS, abeam) - 50_000)).toBeLessThan(
      50_000 * REL_TOL,
    );
  });
});

describe("generateRectangleByCentrePolygon", () => {
  const rect = {
    centre: { latitude: 52.5, longitude: -28 },
    length_side_1: { meters: 2_000_000 },
    length_side_2: { meters: 200 * NM },
    bearing_side_1: { degrees: 273 },
  };

  test("opposite sides are equal and corners are equidistant from the centre", () => {
    const n = 8;
    const ring = generateRectangleByCentrePolygon(rect, n);
    const c = [ring[0]!, ring[n]!, ring[2 * n]!, ring[3 * n]!];
    const d01 = calculateDistance(c[0]!, c[1]!);
    const d23 = calculateDistance(c[2]!, c[3]!);
    const d12 = calculateDistance(c[1]!, c[2]!);
    const d30 = calculateDistance(c[3]!, c[0]!);
    expect(Math.abs(d01 - d23)).toBeLessThan(1);
    expect(Math.abs(d12 - d30)).toBeLessThan(1);
    const radii = c.map((p) => calculateDistance(rect.centre, p));
    for (const r of radii) expect(Math.abs(r - radii[0]!)).toBeLessThan(1);
  });

  test("is invariant under a 180° rotation of bearing_side_1", () => {
    const a = generateRectangleByCentrePolygon(rect);
    const b = generateRectangleByCentrePolygon({
      ...rect,
      bearing_side_1: { degrees: rect.bearing_side_1.degrees + 180 },
    });
    for (const v of a) expect(nearestVertex(v, b)).toBeLessThan(1);
  });
});

describe("generateOrbitAreaPolygon", () => {
  const width = 200 * NM;

  test("CENTRE is invariant under reversal of the axis (Scotland ↔ St John's, 200 nm)", () => {
    const forward = generateOrbitAreaPolygon(
      SCOTLAND,
      ST_JOHNS,
      width,
      OrbitAreaAlignmentEnum.CENTRE,
    );
    const reversed = generateOrbitAreaPolygon(
      ST_JOHNS,
      SCOTLAND,
      width,
      OrbitAreaAlignmentEnum.CENTRE,
    );
    expect(forward.length).toBe(reversed.length);
    for (const v of forward) expect(nearestVertex(v, reversed)).toBeLessThan(1);
  });

  test("LEFT on the reversed axis matches RIGHT on the forward axis", () => {
    const right = generateOrbitAreaPolygon(SCOTLAND, ST_JOHNS, width, OrbitAreaAlignmentEnum.RIGHT);
    const left = generateOrbitAreaPolygon(ST_JOHNS, SCOTLAND, width, OrbitAreaAlignmentEnum.LEFT);
    for (const v of right) expect(nearestVertex(v, left)).toBeLessThan(1);
  });

  test("LEFT and RIGHT keep both axis endpoints on the polygon edge", () => {
    for (const alignment of [OrbitAreaAlignmentEnum.LEFT, OrbitAreaAlignmentEnum.RIGHT]) {
      const ring = generateOrbitAreaPolygon(SCOTLAND, ST_JOHNS, width, alignment);
      expect(nearestVertex(SCOTLAND, ring)).toBeLessThan(1);
      expect(nearestVertex(ST_JOHNS, ring)).toBeLessThan(1);
    }
  });

  test("the far cap is centred on the arrival course", () => {
    const ring = generateOrbitAreaPolygon(SCOTLAND, ST_JOHNS, width, OrbitAreaAlignmentEnum.CENTRE);
    const tip = calculateDestinationPoint(
      ST_JOHNS,
      calculateFinalBearing(SCOTLAND, ST_JOHNS),
      width / 2,
    );
    expect(nearestVertex(tip, ring)).toBeLessThan(1);
  });
});

describe("determineAlignmentFromMousePosition", () => {
  test("measures quadrants against the arrival course at the second point", () => {
    // 60° right of the arrival course, but only ~21° right of the departure course.
    const mouse = calculateDestinationPoint(
      ST_JOHNS,
      calculateFinalBearing(SCOTLAND, ST_JOHNS) + 60,
      50_000,
    );
    expect(determineAlignmentFromMousePosition(SCOTLAND, ST_JOHNS, mouse)).toBe(
      OrbitAreaAlignmentEnum.RIGHT,
    );
  });
});
