import type { CompositeLayerProps, Layer } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { LineLayer, PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { asDeckGLColor, COLORS } from "../../constants/colors";
import { getLayerId, OrbitLayerType } from "../../constants/layers";
import ToolInfoPanel from "../../layers/ToolInfoPanel";
import { DISTANCE_UNIT_LABELS, DistanceUnit } from "../../types";
import { buildCircleLonLatRing, convertDistance } from "../../utils/geo-utils";
import type { CircleMode } from "./CircleMode";

/**
 * @alpha
 */
export interface CircleCreateLayerProps extends CompositeLayerProps {
  mode: CircleMode | null;
  distanceUnit?: DistanceUnit;
}

const defaultProps = {
  distanceUnit: DistanceUnit.METERS,
};

/**
 * Layer that renders `CircleMode` state while creating.
 * @alpha
 */
export default class CircleCreateLayer extends CompositeLayer<CircleCreateLayerProps> {
  static override layerName = "CircleCreateLayer";
  static override defaultProps = defaultProps;

  override renderLayers(): Layer[] {
    const { mode, distanceUnit = DistanceUnit.METERS } = this.props;

    if (!mode) return [];

    const state = mode.getState();
    const { center, mousePosition, radius } = state;

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

    if (center && mousePosition && radius) {
      layers.push(
        new LineLayer({
          id: `${this.props.id}-radius-line`,
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

      const circlePolygon = buildCircleLonLatRing(center, radius, 72);

      layers.push(
        new PolygonLayer({
          id: `${this.props.id}-circle-preview`,
          data: [{ polygon: circlePolygon }],
          getPolygon: (d) => d.polygon,
          getFillColor: asDeckGLColor(COLORS.AREA_FILL),
          getLineColor: asDeckGLColor(COLORS.AREA_OUTLINE),
          getLineWidth: 2,
          lineWidthUnits: "pixels",
          filled: true,
          stroked: true,
          pickable: false,
        }),
      );

      const convertedRadius = convertDistance(radius, distanceUnit);
      const radiusText = `${convertedRadius.toFixed(2)} ${DISTANCE_UNIT_LABELS[distanceUnit]}`;

      layers.push(
        new ToolInfoPanel({
          id: `${this.props.id}-radius-info`,
          rows: [{ key: "Radius", value: radiusText }],
          position: [mousePosition.longitude, mousePosition.latitude],
          textColor: asDeckGLColor(COLORS.DEBUG_TEXT_COLOR),
          backgroundColor: asDeckGLColor(COLORS.DEBUG_BACKGROUND),
        } as any),
      );
    }

    return layers;
  }
}
