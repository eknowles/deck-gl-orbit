import type { CompositeLayerProps, Layer } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { LineLayer, PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { COLORS, asDeckGLColor } from "../../constants/colors";
import { OrbitLayerType, getLayerId } from "../../constants/layers";
import type { Point } from "../../types";
import { DISTANCE_UNIT_LABELS, OrbitAreaAlignmentEnum } from "../../types";
import {
  calculateBearing,
  calculateDistance,
  convertDistance,
  generateOrbitAreaPolygon,
} from "../../utils/geo-utils";
import { determineAlignmentFromMousePosition } from "../../utils/alignment-utils";
import type { OrbitAreaMode } from "./OrbitAreaMode";
import AlignmentDebugShaderLayer from "./AlignmentDebugShaderLayer";
import ToolInfoPanel from "../../layers/ToolInfoPanel";

/**
 * @alpha
 */
export interface OrbitAreaModeLayerProps extends CompositeLayerProps {
  mode: OrbitAreaMode | null;
  /** When true, draws bearing-relative quadrant wedges at the second point (width step). */
  debug?: boolean;
}

const defaultProps = {
  debug: false,
};

/**
 * Simplified layer that renders OrbitAreaMode state
 * Mode handles all logic, layer just visualizes
 * @alpha
 */
export default class OrbitAreaModeLayer extends CompositeLayer<OrbitAreaModeLayerProps> {
  static override layerName = "OrbitAreaModeLayer";
  static override defaultProps = defaultProps;

  override renderLayers(): Layer[] {
    const { mode, debug } = this.props;

    if (!mode) return [];

    const state = mode.getState();
    const { firstPoint, secondPoint, mousePosition, distanceUnit } = state;

    const layers: Layer[] = [];

    // First point marker
    if (firstPoint) {
      layers.push(
        new ScatterplotLayer({
          id: getLayerId(this.props.id, OrbitLayerType.FIRST_POINT),
          data: [{ position: [firstPoint.longitude, firstPoint.latitude] }],
          getPosition: (d) => d.position,
          getFillColor: asDeckGLColor(COLORS.POINT_COLOR),
          getRadius: 3,
          radiusUnits: "pixels",
          pickable: false,
        }),
      );
    }

    // Second point marker
    if (secondPoint) {
      layers.push(
        new ScatterplotLayer({
          id: getLayerId(this.props.id, OrbitLayerType.SECOND_POINT),
          data: [{ position: [secondPoint.longitude, secondPoint.latitude] }],
          getPosition: (d) => d.position,
          getFillColor: asDeckGLColor(COLORS.POINT_COLOR),
          getRadius: 3,
          radiusUnits: "pixels",
          pickable: false,
        }),
      );
    }

    // Line from first to second point (during second point selection)
    if (firstPoint && mousePosition && !secondPoint) {
      const distance = calculateDistance(firstPoint, mousePosition);
      const bearing = calculateBearing(firstPoint, mousePosition);
      const convertedDistance = convertDistance(distance, distanceUnit);
      const distanceText = `${convertedDistance.toFixed(2)} ${DISTANCE_UNIT_LABELS[distanceUnit]}`;
      const bearingText = `${bearing.toFixed(1)}°`;

      layers.push(
        new LineLayer({
          id: getLayerId(this.props.id, OrbitLayerType.AXIS_LINE),
          data: [
            {
              sourcePosition: [firstPoint.longitude, firstPoint.latitude],
              targetPosition: [mousePosition.longitude, mousePosition.latitude],
            },
          ],
          getSourcePosition: (d) => d.sourcePosition,
          getTargetPosition: (d) => d.targetPosition,
          getColor: asDeckGLColor(COLORS.LINE_COLOR),
          getWidth: 2,
          pickable: false,
        }),
      );

      layers.push(
        new ToolInfoPanel({
          id: `${this.props.id}-distance-text`,
          rows: [
            { key: "Distance", value: distanceText },
            { key: "Bearing", value: bearingText },
          ],
          position: [mousePosition.longitude, mousePosition.latitude],
          textColor: asDeckGLColor(COLORS.DEBUG_TEXT_COLOR),
          backgroundColor: asDeckGLColor(COLORS.DEBUG_BACKGROUND),
        } as any),
      );
    }

    // Preview polygon (during width selection)
    if (firstPoint && secondPoint && mousePosition) {
      const radius = calculateDistance(secondPoint, mousePosition);
      const width = radius * 2;
      const convertedWidth = convertDistance(width, distanceUnit);
      const widthText = `${convertedWidth.toFixed(2)} ${DISTANCE_UNIT_LABELS[distanceUnit]}`;

      const alignment = determineAlignmentFromMousePosition(firstPoint, secondPoint, mousePosition);

      const alignmentText =
        alignment === OrbitAreaAlignmentEnum.LEFT
          ? "LEFT"
          : alignment === OrbitAreaAlignmentEnum.RIGHT
            ? "RIGHT"
            : "CENTRE";

      const polygonPoints = generateOrbitAreaPolygon(firstPoint, secondPoint, width, alignment);

      // Debug under axis / preview so orbit stroke and width line read on top.
      if (debug) {
        const debugLayer = new AlignmentDebugShaderLayer({
          id: getLayerId(this.props.id, OrbitLayerType.DEBUG_QUADRANTS, "shader"),
          firstPoint,
          secondPoint,
          radiusMeters: radius,
          currentAlignment: alignment,
          visible: true,
        });
        layers.push(...debugLayer.renderLayers());
      }

      layers.push(
        new LineLayer({
          id: `${this.props.id}-axis-line`,
          data: [
            {
              sourcePosition: [firstPoint.longitude, firstPoint.latitude],
              targetPosition: [secondPoint.longitude, secondPoint.latitude],
            },
          ],
          getSourcePosition: (d) => d.sourcePosition,
          getTargetPosition: (d) => d.targetPosition,
          getColor: asDeckGLColor(COLORS.AXIS_LINE_COLOR),
          getWidth: 2,
          pickable: false,
        }),
      );

      layers.push(
        new LineLayer({
          id: `${this.props.id}-width-line`,
          data: [
            {
              sourcePosition: [secondPoint.longitude, secondPoint.latitude],
              targetPosition: [mousePosition.longitude, mousePosition.latitude],
            },
          ],
          getSourcePosition: (d) => d.sourcePosition,
          getTargetPosition: (d) => d.targetPosition,
          getColor: asDeckGLColor(COLORS.ALIGNMENT_INDICATOR_COLOR),
          getWidth: 2,
          pickable: false,
        }),
      );

      layers.push(
        new PolygonLayer({
          id: getLayerId(this.props.id, OrbitLayerType.PREVIEW_POLYGON, "area"),
          data: [{ polygon: polygonPoints }],
          getPolygon: (d) => d.polygon.map((p: Point) => [p.longitude, p.latitude]),
          getFillColor: asDeckGLColor(COLORS.AREA_FILL),
          getLineColor: asDeckGLColor(COLORS.AREA_OUTLINE),
          getLineWidth: 2,
          lineWidthUnits: "pixels",
          filled: true,
          stroked: true,
          pickable: false,
        }),
      );

      // Tool info
      layers.push(
        new ToolInfoPanel({
          id: `${this.props.id}-width-tool`,
          rows: [
            { key: "Alignment", value: alignmentText },
            { key: "Width", value: widthText },
          ],
          position: [mousePosition.longitude, mousePosition.latitude],
          textColor: asDeckGLColor(COLORS.DEBUG_TEXT_COLOR),
          backgroundColor: asDeckGLColor(COLORS.DEBUG_BACKGROUND),
        } as any),
      );
    }

    return layers;
  }
}
