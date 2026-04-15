import type { CompositeLayerProps, Layer } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { LineLayer, PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { asDeckGLColor, COLORS } from "../../constants/colors";
import { getLayerId, OrbitLayerType } from "../../constants/layers";
import ToolInfoPanel from "../../layers/ToolInfoPanel";
import type { Point } from "../../types";
import { DISTANCE_UNIT_LABELS } from "../../types";
import {
  calculateBearing,
  calculateDistance,
  convertDistance,
  generateCorridorAreaPolygon,
} from "../../utils/geo-utils";
import type { CorridorMode } from "./CorridorMode";

/**
 * @alpha
 */
export interface CorridorModeLayerProps extends CompositeLayerProps {
  mode: CorridorMode | null;
}

const defaultProps = {};

/**
 * @alpha
 */
export default class CorridorModeLayer extends CompositeLayer<CorridorModeLayerProps> {
  static override layerName = "CorridorModeLayer";
  static override defaultProps = defaultProps;

  override renderLayers(): Layer[] {
    const { mode } = this.props;
    if (!mode) return [];

    const state = mode.getState();
    const { firstPoint, secondPoint, mousePosition, distanceUnit } = state;
    const layers: Layer[] = [];

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

    if (firstPoint && secondPoint && mousePosition) {
      const radius = calculateDistance(secondPoint, mousePosition);
      const width = radius * 2;
      const convertedWidth = convertDistance(width, distanceUnit);
      const widthText = `${convertedWidth.toFixed(2)} ${DISTANCE_UNIT_LABELS[distanceUnit]}`;

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

      const polygonPoints = generateCorridorAreaPolygon([firstPoint, secondPoint], width);
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

      layers.push(
        new ToolInfoPanel({
          id: `${this.props.id}-width-tool`,
          rows: [{ key: "Width", value: widthText }],
          position: [mousePosition.longitude, mousePosition.latitude],
          textColor: asDeckGLColor(COLORS.DEBUG_TEXT_COLOR),
          backgroundColor: asDeckGLColor(COLORS.DEBUG_BACKGROUND),
        } as any),
      );
    }

    return layers;
  }
}
