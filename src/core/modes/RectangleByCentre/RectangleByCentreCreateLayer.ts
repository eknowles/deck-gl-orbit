import type { CompositeLayerProps, Layer } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { LineLayer, PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { asDeckGLColor, COLORS } from "../../constants/colors";
import { getLayerId, OrbitLayerType } from "../../constants/layers";
import ToolInfoPanel from "../../layers/ToolInfoPanel";
import type { Point } from "../../types";
import { DISTANCE_UNIT_LABELS, DistanceUnit } from "../../types";
import {
  calculateBearing,
  calculateDistance,
  convertDistance,
  generateRectangleByCentrePolygon,
} from "../../utils/geo-utils";
import type { RectangleByCentreMode } from "./RectangleByCentreMode";

/**
 * @alpha
 */
export interface RectangleByCentreCreateLayerProps extends CompositeLayerProps {
  mode: RectangleByCentreMode | null;
  distanceUnit?: DistanceUnit;
}

const defaultProps = {
  distanceUnit: DistanceUnit.METERS,
};

/**
 * @alpha
 */
export default class RectangleByCentreCreateLayer extends CompositeLayer<RectangleByCentreCreateLayerProps> {
  static override layerName = "RectangleByCentreCreateLayer";
  static override defaultProps = defaultProps;

  override renderLayers(): Layer[] {
    const { mode, distanceUnit = DistanceUnit.METERS } = this.props;
    if (!mode) return [];

    const state = mode.getState();
    const { center, side1Point, mousePosition, preview } = state;
    const layers: Layer[] = [];

    if (center) {
      layers.push(
        new ScatterplotLayer({
          id: getLayerId(this.props.id, OrbitLayerType.FIRST_POINT),
          data: [{ position: [center.longitude, center.latitude] }],
          getPosition: (d) => d.position,
          getFillColor: asDeckGLColor(COLORS.POINT_COLOR),
          getRadius: 3,
          radiusUnits: "pixels",
          pickable: false,
        }),
      );
    }

    if (side1Point) {
      layers.push(
        new ScatterplotLayer({
          id: getLayerId(this.props.id, OrbitLayerType.SECOND_POINT),
          data: [{ position: [side1Point.longitude, side1Point.latitude] }],
          getPosition: (d) => d.position,
          getFillColor: asDeckGLColor(COLORS.POINT_COLOR),
          getRadius: 3,
          radiusUnits: "pixels",
          pickable: false,
        }),
      );
    }

    if (center && mousePosition && !side1Point) {
      const side1Distance = calculateDistance(center, mousePosition) * 2;
      const side1Bearing = calculateBearing(center, mousePosition);
      const convertedSide1 = convertDistance(side1Distance, distanceUnit);
      const side1Text = `${convertedSide1.toFixed(2)} ${DISTANCE_UNIT_LABELS[distanceUnit]}`;
      const bearingText = `${side1Bearing.toFixed(1)}°`;

      layers.push(
        new LineLayer({
          id: getLayerId(this.props.id, OrbitLayerType.AXIS_LINE),
          data: [
            {
              sourcePosition: [center.longitude, center.latitude],
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
          id: `${this.props.id}-side1-info`,
          rows: [
            { key: "Side 1", value: side1Text },
            { key: "Bearing", value: bearingText },
          ],
          position: [mousePosition.longitude, mousePosition.latitude],
          textColor: asDeckGLColor(COLORS.DEBUG_TEXT_COLOR),
          backgroundColor: asDeckGLColor(COLORS.DEBUG_BACKGROUND),
        } as any),
      );
    }

    if (center && side1Point && mousePosition) {
      layers.push(
        new LineLayer({
          id: `${this.props.id}-side1-line`,
          data: [
            {
              sourcePosition: [center.longitude, center.latitude],
              targetPosition: [side1Point.longitude, side1Point.latitude],
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
          id: `${this.props.id}-side2-line`,
          data: [
            {
              sourcePosition: [center.longitude, center.latitude],
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
    }

    if (preview) {
      const convertedSide1 = convertDistance(preview.length_side_1.meters, distanceUnit);
      const convertedSide2 = convertDistance(preview.length_side_2.meters, distanceUnit);
      const side1Text = `${convertedSide1.toFixed(2)} ${DISTANCE_UNIT_LABELS[distanceUnit]}`;
      const side2Text = `${convertedSide2.toFixed(2)} ${DISTANCE_UNIT_LABELS[distanceUnit]}`;
      const bearingText = `${preview.bearing_side_1.degrees.toFixed(1)}°`;

      layers.push(
        new PolygonLayer({
          id: getLayerId(this.props.id, OrbitLayerType.PREVIEW_POLYGON, "area"),
          data: [{ polygon: generateRectangleByCentrePolygon(preview) }],
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

      if (mousePosition) {
        layers.push(
          new ToolInfoPanel({
            id: `${this.props.id}-rectangle-info`,
            rows: [
              { key: "Side 1", value: side1Text },
              { key: "Side 2", value: side2Text },
              { key: "Bearing", value: bearingText },
            ],
            position: [mousePosition.longitude, mousePosition.latitude],
            textColor: asDeckGLColor(COLORS.DEBUG_TEXT_COLOR),
            backgroundColor: asDeckGLColor(COLORS.DEBUG_BACKGROUND),
          } as any),
        );
      }
    }

    return layers;
  }
}
