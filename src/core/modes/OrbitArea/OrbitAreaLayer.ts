import type { CompositeLayerProps } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { asDeckGLColor, COLORS } from "../../constants/colors";
import { getLayerId, OrbitLayerType } from "../../constants/layers";
import type { Point } from "../../types";
import { generateOrbitAreaPolygon } from "../../utils/geo-utils";
import type { OrbitArea } from "./OrbitAreaMode";

/**
 * @alpha
 */
export interface OrbitAreaLayerProps extends CompositeLayerProps {
  data: OrbitArea[];
  getFillColor?: (d: OrbitArea) => number[];
  getLineColor?: (d: OrbitArea) => number[];
  getLineWidth?: number | ((d: OrbitArea) => number);
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
export default class OrbitAreaLayer extends CompositeLayer<OrbitAreaLayerProps> {
  static override layerName = "OrbitAreaLayer";
  static override defaultProps = defaultProps;

  override renderLayers() {
    const { data, getFillColor, getLineColor, getLineWidth, filled, stroked, pickable } =
      this.props;

    const polygons = data.map((orbitArea) => ({
      id: orbitArea.id,
      polygon: generateOrbitAreaPolygon(
        orbitArea.first_point,
        orbitArea.second_point,
        orbitArea.width,
        orbitArea.alignment,
      ),
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
      data: data.flatMap((orbitArea) => [
        { position: [orbitArea.first_point.longitude, orbitArea.first_point.latitude] },
        { position: [orbitArea.second_point.longitude, orbitArea.second_point.latitude] },
      ]),
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
