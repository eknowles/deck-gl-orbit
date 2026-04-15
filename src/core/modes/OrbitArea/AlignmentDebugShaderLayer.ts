import type { CompositeLayerProps, Layer } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { PolygonLayer } from "@deck.gl/layers";
import { asDeckGLColor, COLORS } from "../../constants/colors";
import { getLayerId, OrbitLayerType } from "../../constants/layers";
import type { OrbitAreaAlignmentEnum, Point } from "../../types";
import { ALIGNMENT_QUADRANTS } from "../../utils/alignment-utils";
import { calculateBearing, calculateDestinationPoint, normalizeAngle } from "../../utils/geo-utils";

/**
 * @internal
 */
export interface AlignmentDebugShaderLayerProps extends CompositeLayerProps {
  firstPoint: Point;
  secondPoint: Point;
  /** Semicircle / width radius in meters (same as preview). */
  radiusMeters: number;
  currentAlignment: OrbitAreaAlignmentEnum;
  visible?: boolean;
}

const defaultProps = {
  visible: true,
};

/**
 * Bearing-relative quadrant wedges around the second axis point.
 * Highlights wedges whose alignment matches `currentAlignment` (CENTRE → two wedges).
 * @internal
 */
export default class AlignmentDebugShaderLayer extends CompositeLayer<AlignmentDebugShaderLayerProps> {
  static override layerName = "AlignmentDebugShaderLayer";
  static override defaultProps = defaultProps;

  override renderLayers(): Layer[] {
    const { firstPoint, secondPoint, radiusMeters, currentAlignment, visible } = this.props;
    if (visible === false || radiusMeters <= 0) return [];

    const axisBearing = calculateBearing(firstPoint, secondPoint);
    const center = secondPoint;
    const segments = 24;

    const wedges = ALIGNMENT_QUADRANTS.map((q, index) => {
      const ring = wedgeRing(center, axisBearing, q.minAngle, q.maxAngle, radiusMeters, segments);
      const active = q.alignment === currentAlignment;
      return { index, ring, active };
    });

    const makeLayer = (index: number, ring: number[][], active: boolean) =>
      new PolygonLayer({
        id: getLayerId(this.props.id, OrbitLayerType.DEBUG_QUADRANTS, `${index}`),
        data: [{ polygon: ring }],
        getPolygon: (d) => d.polygon,
        getFillColor: asDeckGLColor(
          active ? COLORS.ACTIVE_QUADRANT_COLOR : COLORS.INACTIVE_QUADRANT_COLOR,
        ),
        getLineColor: [255, 255, 255, 40],
        getLineWidth: 1,
        lineWidthUnits: "pixels",
        filled: true,
        stroked: true,
        pickable: false,
        parameters: { depthTest: false },
      });

    const inactive = wedges.filter((w) => !w.active).map((w) => makeLayer(w.index, w.ring, false));
    const active = wedges.filter((w) => w.active).map((w) => makeLayer(w.index, w.ring, true));
    return [...inactive, ...active];
  }
}

function wedgeRing(
  center: Point,
  axisBearingDeg: number,
  relMin: number,
  relMax: number,
  radiusMeters: number,
  segments: number,
): number[][] {
  const ring: number[][] = [[center.longitude, center.latitude]];

  const pushArc = (fromRel: number, toRel: number, n: number) => {
    const steps = Math.max(2, n);
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const rel = fromRel + (toRel - fromRel) * t;
      const abs = normalizeAngle(axisBearingDeg + rel);
      const p = calculateDestinationPoint(center, abs, radiusMeters);
      ring.push([p.longitude, p.latitude]);
    }
  };

  if (relMin > relMax) {
    const half = Math.max(6, Math.ceil(segments / 2));
    pushArc(relMin, 360, half);
    pushArc(0, relMax, half);
  } else {
    pushArc(relMin, relMax, segments);
  }

  ring.push([center.longitude, center.latitude]);
  return ring;
}
