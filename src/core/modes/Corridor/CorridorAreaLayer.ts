import type { CompositeLayerProps } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { asDeckGLColor, COLORS } from "../../constants/colors";
import { getLayerId, OrbitLayerType } from "../../constants/layers";
import type { Point } from "../../types";
import { generateCorridorAreaPolygon } from "../../utils/geo-utils";
import type { CorridorArea } from "./CorridorMode";

/**
 * @alpha
 */
export interface CorridorAreaLayerProps extends CompositeLayerProps {
  data: CorridorArea[];
  getFillColor?: (d: CorridorArea) => number[];
  getLineColor?: (d: CorridorArea) => number[];
  getLineWidth?: number | ((d: CorridorArea) => number);
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
export default class CorridorAreaLayer extends CompositeLayer<CorridorAreaLayerProps> {
  static override layerName = "CorridorAreaLayer";
  static override defaultProps = defaultProps;

  override renderLayers() {
    const { data, getFillColor, getLineColor, getLineWidth, filled, stroked, pickable } =
      this.props;

    const polygons = data.map((corridor) => ({
      id: corridor.id,
      polygon: generateCorridorAreaPolygon(corridor.center_line, corridor.width?.meters ?? 0),
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
      data: data.flatMap((corridor) =>
        corridor.center_line.map((p) => ({ position: [p.longitude, p.latitude] })),
      ),
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
