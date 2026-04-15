import type { CompositeLayerProps } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { asDeckGLColor, COLORS } from "../../constants/colors";
import { getLayerId, OrbitLayerType } from "../../constants/layers";
import type { Point } from "../../types";
import { generateRectangleByCentrePolygon } from "../../utils/geo-utils";
import type { RectangleByCentre } from "./RectangleByCentreMode";

/**
 * @alpha
 */
export interface RectangleByCentreDisplayLayerProps extends CompositeLayerProps {
  data: RectangleByCentre[];
  getFillColor?: (d: RectangleByCentre) => number[];
  getLineColor?: (d: RectangleByCentre) => number[];
  getLineWidth?: number | ((d: RectangleByCentre) => number);
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
 * @alpha
 */
export default class RectangleByCentreDisplayLayer extends CompositeLayer<RectangleByCentreDisplayLayerProps> {
  static override layerName = "RectangleByCentreDisplayLayer";
  static override defaultProps = defaultProps;

  override renderLayers() {
    const { data, getFillColor, getLineColor, getLineWidth, filled, stroked, pickable } =
      this.props;

    const polygons = data.map((rectangle) => ({
      id: rectangle.id,
      polygon: generateRectangleByCentrePolygon(rectangle),
    }));

    const polygonLayer = new PolygonLayer({
      id: getLayerId(this.props.id, OrbitLayerType.ORBIT_AREA),
      data: polygons,
      getPolygon: (d) => d.polygon.map((p: Point) => [p.longitude, p.latitude]),
      getFillColor: getFillColor as never,
      getLineColor: getLineColor as never,
      getLineWidth,
      lineWidthUnits: "pixels",
      filled,
      stroked,
      pickable,
      parameters: { depthTest: false },
    });

    const pointsLayer = new ScatterplotLayer({
      id: getLayerId(this.props.id, OrbitLayerType.POINTS),
      data: data.map((rectangle) => ({
        position: [rectangle.centre.longitude, rectangle.centre.latitude],
      })),
      getPosition: (d) => d.position,
      getFillColor: asDeckGLColor(COLORS.POINT_COLOR),
      getRadius: 3,
      radiusUnits: "pixels",
      pickable: false,
      parameters: { depthTest: false },
    });

    return [polygonLayer, pointsLayer];
  }
}
