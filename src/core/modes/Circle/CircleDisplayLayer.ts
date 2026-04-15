import type { CompositeLayerProps } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { asDeckGLColor, COLORS } from "../../constants/colors";
import { getLayerId, OrbitLayerType } from "../../constants/layers";
import { buildCircleLonLatRing } from "../../utils/geo-utils";
import type { CircleArea } from "./CircleMode";

/**
 * @alpha
 */
export interface CircleDisplayLayerProps extends CompositeLayerProps {
  data: CircleArea[];
  getFillColor?: (d: CircleArea) => number[];
  getLineColor?: (d: CircleArea) => number[];
  getLineWidth?: number | ((d: CircleArea) => number);
  filled?: boolean;
  stroked?: boolean;
  pickable?: boolean;
}

const defaultProps = {
  getFillColor: { type: "accessor", value: COLORS.AREA_FILL },
  getLineColor: { type: "accessor", value: COLORS.AREA_OUTLINE },
  getLineWidth: { type: "accessor", value: 2 },
  filled: true,
  stroked: true,
  pickable: true,
};

/**
 * Layer for displaying completed circles.
 * @alpha
 */
export default class CircleDisplayLayer extends CompositeLayer<CircleDisplayLayerProps> {
  static override layerName = "CircleDisplayLayer";
  static override defaultProps = defaultProps;

  renderLayers() {
    const { data, getFillColor, getLineColor, getLineWidth, filled, stroked, pickable } =
      this.props;

    const circles = data.map((circle) => {
      const { center, radius } = circle;
      const polygon = buildCircleLonLatRing(center, radius, 72);
      return {
        ...circle,
        polygon,
      };
    });

    const polygonLayer = new PolygonLayer({
      id: getLayerId(this.props.id, OrbitLayerType.ORBIT_AREA),
      data: circles,
      getPolygon: (d) => d.polygon,
      getFillColor: getFillColor as any,
      getLineColor: getLineColor as any,
      getLineWidth,
      lineWidthUnits: "pixels",
      filled,
      stroked,
      pickable,
      parameters: {
        depthTest: false,
      },
    });

    const pointsLayer = new ScatterplotLayer({
      id: getLayerId(this.props.id, OrbitLayerType.POINTS),
      data,
      getPosition: (d) => [d.center.longitude, d.center.latitude],
      getFillColor: asDeckGLColor(COLORS.POINT_COLOR),
      getRadius: 3,
      radiusUnits: "pixels",
      pickable: true,
      parameters: {
        depthTest: false,
      },
    });

    return [polygonLayer, pointsLayer];
  }
}
