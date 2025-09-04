import type { CompositeLayerProps } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { COLORS, asDeckGLColor } from "../constants/colors";
import {
  OrbitLayerType,
  getLayerId
} from "../constants/layers";
import type { OrbitArea, Point } from "../types";
import { generateOrbitAreaPolygon } from "../utils/geo-utils";

// Define the properties for our OrbitAreaLayer
export interface OrbitAreaLayerProps extends CompositeLayerProps {
  data: OrbitArea[];
  getFillColor?: (d: OrbitArea) => number[];
  getLineColor?: (d: OrbitArea) => number[];
  getLineWidth?: number | ((d: OrbitArea) => number);
  filled?: boolean;
  stroked?: boolean;
  extruded?: boolean;
  wireframe?: boolean;
  pickable?: boolean;
  onClick?: (info: any, event: any) => void;
  onHover?: (info: any, event: any) => void;
}

// Default props for the layer
const defaultProps = {
  getFillColor: { type: "accessor", value: COLORS.ORBIT_AREA_FILL },
  getLineColor: { type: "accessor", value: COLORS.ORBIT_AREA_OUTLINE },
  getLineWidth: { type: "accessor", value: 2 },
  filled: true,
  stroked: true,
  extruded: false,
  wireframe: false,
  pickable: true,
};

export default class OrbitAreaLayer extends CompositeLayer<OrbitAreaLayerProps> {
  static override layerName = "OrbitAreaLayer";
  static override defaultProps = defaultProps;

  renderLayers() {
    const {
      data,
      getFillColor,
      getLineColor,
      getLineWidth,
      filled,
      stroked,
      extruded,
      wireframe,
      pickable,
      onClick,
      onHover,
    } = this.props;

    // Process the OrbitArea objects to generate polygon points
    const polygons = data.map((orbitArea) => {
      const { first_point, second_point, width, alignment, id } = orbitArea;

      // Generate polygon points for the OrbitArea
      const polygonPoints = generateOrbitAreaPolygon(
        first_point,
        second_point,
        width,
        alignment
      );

      return {
        id,
        polygon: polygonPoints,
        originalData: orbitArea,
      };
    });

    // Create a PolygonLayer to render the OrbitAreas
    const polygonLayer = new PolygonLayer({
      id: getLayerId(this.props.id, OrbitLayerType.ORBIT_AREA),
      data: polygons,
      getPolygon: (d) => d.polygon.map((p: Point) => [p.longitude, p.latitude]),
      getFillColor: getFillColor as any,
      getLineColor: getLineColor as any,
      getLineWidth,
      lineWidthUnits: "pixels",
      filled,
      stroked,
      extruded,
      wireframe,
      pickable,
      onClick,
      onHover,
      // Disable depth testing for proper overlay
      parameters: {
        depthTest: false,
      },
    });

    // Optional: Add markers for the center points
    const pointsLayer = new ScatterplotLayer({
      id: getLayerId(this.props.id, OrbitLayerType.POINTS),
      data: data.flatMap((orbitArea) => [
        {
          position: [
            orbitArea.first_point.longitude,
            orbitArea.first_point.latitude,
          ],
          originalData: orbitArea,
          isFirstPoint: true,
        },
        {
          position: [
            orbitArea.second_point.longitude,
            orbitArea.second_point.latitude,
          ],
          originalData: orbitArea,
          isFirstPoint: false,
        },
      ]),
      getPosition: (d) => d.position,
      getFillColor: asDeckGLColor(COLORS.POINT_COLOR), // Use consistent colors with editor
      getRadius: 3,
      radiusUnits: "pixels",
      pickable: true,
      visible: true,
      // Disable depth testing for proper overlay
      parameters: {
        depthTest: false,
      },
    });

    return [polygonLayer, pointsLayer];
  }
}
