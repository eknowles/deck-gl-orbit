import type { LayerProps } from "@deck.gl/core";
import { Layer } from "@deck.gl/core";
import { PolygonLayer, LineLayer } from "@deck.gl/layers";
import { ALIGNMENT_QUADRANTS } from "../utils/alignment-utils";
import { OrbitAreaAlignmentEnum } from "../types";
import { normalizeAngle, calculateDestinationPoint } from "../utils/geo-utils";
import { asDeckGLColor } from "../constants/colors";
import { OrbitLayerType, getLayerId } from "../constants/layers";
import type { Point } from "../types";

// Props interface for the shader layer
export interface AlignmentDebugShaderLayerProps extends LayerProps {
  // Center point of the debug overlay (second point of the orbit area)
  center: [number, number];
  // Main bearing from first to second point
  mainBearing: number;
  // Current alignment being used
  currentAlignment: OrbitAreaAlignmentEnum;
  // Radius of the debug overlay in meters
  radius: number;
  // Whether to show the debug overlay
  visible?: boolean;
  // Base layer ID for consistent naming
  baseId?: string;
}

// Default props
const defaultProps = {
  visible: true,
  radius: 1000, // 1km default radius
};

/**
 * A clean alignment debug layer that shows a circle around the second point
 * with quadrant divisions that exactly match the alignment calculation logic.
 * 
 * This creates a visual representation of the quadrants used for alignment detection,
 * helping users understand which quadrant their mouse is in.
 */
export default class AlignmentDebugShaderLayer extends Layer<
  AlignmentDebugShaderLayerProps
> {
  static override layerName = "AlignmentDebugShaderLayer";
  static override defaultProps = defaultProps;

  initializeState() {
    // No special initialization needed for this layer
  }

  /**
   * Generate vertices for a quadrant arc that exactly matches the alignment calculation logic
   * Uses the same calculateDestinationPoint function as the orbit area for consistency
   */
  private generateQuadrantVertices(
    center: [number, number],
    mainBearing: number,
    quadrant: any,
    radius: number
  ): Point[] {
    const vertices: Point[] = [];
    const centerPoint: Point = {
      longitude: center[0],
      latitude: center[1],
    };

    // Start with the center point
    vertices.push(centerPoint);

    const startAngle = quadrant.minAngle;
    const endAngle = quadrant.maxAngle;

    // Handle the wrap-around case (e.g., 315° to 45°)
    let adjustedEndAngle = endAngle;
    if (startAngle > endAngle) {
      adjustedEndAngle += 360;
    }

    // Add points along the arc at 2-degree intervals for smooth curves
    for (let angle = startAngle; angle <= adjustedEndAngle; angle += 2) {
      // The angle is relative to the main bearing, just like in the alignment calculation
      const absoluteAngle = normalizeAngle(mainBearing + angle);
      
      // Use the same calculateDestinationPoint function as the orbit area
      // This ensures proper geographic calculations without longitude distortion
      const point = calculateDestinationPoint(centerPoint, absoluteAngle, radius);
      vertices.push(point);
    }

    // Close the arc if we're handling the wrap-around case
    if (startAngle > endAngle) {
      const absoluteAngle = normalizeAngle(mainBearing + endAngle);
      const point = calculateDestinationPoint(centerPoint, absoluteAngle, radius);
      vertices.push(point);
    }

    // Close the polygon by duplicating the center point
    vertices.push(centerPoint);

    return vertices;
  }

  /**
   * Get color for a quadrant based on its alignment
   */
  private getQuadrantColor(
    alignment: OrbitAreaAlignmentEnum,
    isActive: boolean
  ): [number, number, number, number] {
    let color: [number, number, number, number];

    switch (alignment) {
      case OrbitAreaAlignmentEnum.LEFT:
        color = [255, 100, 100, 0]; // Red
        break;
      case OrbitAreaAlignmentEnum.RIGHT:
        color = [100, 100, 255, 0]; // Blue
        break;
      case OrbitAreaAlignmentEnum.CENTRE:
      default:
        color = [100, 255, 100, 0]; // Green
        break;
    }

    // Adjust opacity based on whether this is the active quadrant
    if (isActive) {
      color[3] = 128; // 50% opacity for active quadrant (128/255)
    } else {
      color[3] = 13; // 5% opacity for inactive quadrants (13/255)
    }

    return color;
  }

  /**
   * Generate points for a dashed outer circle
   * Fixed number of segments regardless of radius for consistent performance
   */
  private generateDashedCircle(
    center: [number, number],
    radius: number,
    dashLength: number = 10,
    gapLength: number = 5
  ): Point[] {
    const centerPoint: Point = {
      longitude: center[0],
      latitude: center[1],
    };

    const points: Point[] = [];
    const totalSegments = 72; // Fixed 5-degree segments for consistent performance
    const dashSegments = 8; // Fixed number of dash segments
    const gapSegments = 4; // Fixed number of gap segments

    for (let i = 0; i < totalSegments; i += dashSegments + gapSegments) {
      // Add dash segments
      for (let j = 0; j < dashSegments && i + j < totalSegments; j++) {
        const angle = ((i + j) * 360) / totalSegments;
        const point = calculateDestinationPoint(centerPoint, angle, radius);
        points.push(point);
      }
    }

    return points;
  }

  /**
   * Generate dotted quadrant divider lines
   * Fixed number of dots regardless of radius for consistent performance
   */
  private generateQuadrantDividers(
    center: [number, number],
    mainBearing: number,
    radius: number,
    dotSpacing: number = 5
  ): Point[][] {
    const centerPoint: Point = {
      longitude: center[0],
      latitude: center[1],
    };

    const dividers: Point[][] = [];
    
    // Generate dividers at 45, 135, 225, 315 degrees relative to main bearing
    const dividerAngles = [45, 135, 225, 315];
    
    for (const angle of dividerAngles) {
      const absoluteAngle = normalizeAngle(mainBearing + angle);
      const divider: Point[] = [];
      
      // Create dotted line from center to edge with fixed number of dots
      const numDots = 20; // Fixed number of dots for consistent performance
      for (let i = 0; i <= numDots; i++) {
        const distance = (i * radius) / numDots;
        const point = calculateDestinationPoint(centerPoint, absoluteAngle, distance);
        divider.push(point);
      }
      
      dividers.push(divider);
    }

    return dividers;
  }

  renderLayers() {
    const { center, mainBearing, currentAlignment, radius, baseId = "alignment-debug" } = this.props;

    if (!this.props.visible) {
      return [];
    }

    const layers: any[] = [];

    // Generate polygon layers for each quadrant
    const quadrantLayers = ALIGNMENT_QUADRANTS.map((quadrant, index) => {
      const vertices = this.generateQuadrantVertices(
        center,
        mainBearing,
        quadrant,
        radius
      );

      const isActive = quadrant.alignment === currentAlignment;
      const color = this.getQuadrantColor(quadrant.alignment, isActive);

      return new PolygonLayer({
        id: getLayerId(baseId, OrbitLayerType.DEBUG_QUADRANTS, `${index}`),
        data: [
          {
            polygon: vertices,
            name: quadrant.name,
            alignment: quadrant.alignment,
          },
        ],
        getPolygon: (d) =>
          d.polygon.map((p: Point) => [p.longitude, p.latitude]),
        getFillColor: asDeckGLColor(color),
        getLineColor: asDeckGLColor([0, 0, 0, 0]), // No outline for quadrants
        getLineWidth: 0,
        lineWidthUnits: "pixels",
        filled: true,
        stroked: false,
        pickable: false,
        parameters: {
          depthTest: false,
        },
      });
    });

    layers.push(...quadrantLayers);

    // Add dashed outer circle
    const dashedCirclePoints = this.generateDashedCircle(center, radius);
    const dashedCircleLayer = new LineLayer({
      id: getLayerId(baseId, OrbitLayerType.DEBUG_QUADRANTS, "dashed-circle"),
      data: [
        {
          path: dashedCirclePoints.map(p => [p.longitude, p.latitude]),
        },
      ],
      getPath: (d: any) => d.path,
      getColor: asDeckGLColor([0, 0, 0, 200]), // Semi-transparent black
      getWidth: 2,
      widthUnits: "pixels",
      pickable: false,
      parameters: {
        depthTest: false,
      },
    });

    layers.push(dashedCircleLayer);

    // Add dotted quadrant dividers
    const quadrantDividers = this.generateQuadrantDividers(center, mainBearing, radius);
    const dividerLayers = quadrantDividers.map((divider, index) => {
      return new LineLayer({
        id: getLayerId(baseId, OrbitLayerType.DEBUG_QUADRANTS, `divider-${index}`),
        data: [
          {
            path: divider.map(p => [p.longitude, p.latitude]),
          },
        ],
        getPath: (d: any) => d.path,
        getColor: asDeckGLColor([0, 0, 0, 100]), // Semi-transparent black
        getWidth: 1,
        widthUnits: "pixels",
        pickable: false,
        parameters: {
          depthTest: false,
        },
      });
    });

    layers.push(...dividerLayers);

    return layers;
  }
}