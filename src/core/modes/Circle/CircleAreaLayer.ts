import type { CompositeLayerProps } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { ScatterplotLayer, PolygonLayer } from "@deck.gl/layers";
import { COLORS, asDeckGLColor } from "../../constants/colors";
import { OrbitLayerType, getLayerId } from "../../constants/layers";
import type { CircleArea } from "./CircleMode";
import { buildCircleLonLatRing } from "../../utils/geo-utils";

/**
 * @alpha
 */
export interface CircleAreaLayerProps extends CompositeLayerProps {
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
 * Layer for displaying completed circle areas
 * @alpha
 */
export default class CircleAreaLayer extends CompositeLayer<CircleAreaLayerProps> {
  static override layerName = "CircleAreaLayer";
  static override defaultProps = defaultProps;

  renderLayers() {
    const { data, getFillColor, getLineColor, getLineWidth, filled, stroked, pickable } =
      this.props;

    // Generate circle polygons
    const circles = data.map((circle) => {
      const { center, radius } = circle;
      const polygon = buildCircleLonLatRing(center, radius, 72);
      return {
        ...circle,
        polygon,
      };
    });

    // Circle polygons
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

    // Center points
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
