import type { CompositeLayerProps, Layer, PickingInfo } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import {
  LineLayer,
  PolygonLayer,
  ScatterplotLayer,
  TextLayer,
} from "@deck.gl/layers";
import { COLORS, asDeckGLColor } from "../constants/colors";
import { OrbitLayerType, getLayerId } from "../constants/layers";
import type { EditorState, OrbitArea, Point } from "../types";
import {
  DISTANCE_UNIT_LABELS,
  DistanceUnit,
  EditorMode,
  OrbitAreaAlignmentEnum,
} from "../types";
import {
  ALIGNMENT_QUADRANTS,
  determineAlignmentFromMousePosition,
} from "../utils/alignment-utils";
import { createDebug } from "../utils/debug";
import {
  calculateBearing,
  calculateDistance,
  convertDistance,
  generateOrbitAreaPolygon,
  normalizeAngle,
} from "../utils/geo-utils";

// Define props interface for OrbitAreaEditor
export interface OrbitAreaEditorProps extends CompositeLayerProps {
  editorState: EditorState;
  onStateChange?: (newState: EditorState) => void;
  distanceUnit?: DistanceUnit;
  previewColor?: [number, number, number, number];
  pointColor?: [number, number, number, number];
  lineColor?: [number, number, number, number];
  alignmentIndicatorColor?: [number, number, number, number];
  onOrbitAreaComplete?: (orbitArea: OrbitArea) => void;
  /** Enable debug mode with visual indicators and logging */
  debug?: boolean;
}

// Default props
const defaultProps = {
  distanceUnit: DistanceUnit.METERS,
  previewColor: COLORS.ORBIT_AREA_FILL,
  pointColor: COLORS.POINT_COLOR,
  lineColor: COLORS.LINE_COLOR,
  alignmentIndicatorColor: COLORS.ALIGNMENT_INDICATOR_COLOR,
  debug: true, // Debug mode disabled by default
};

export default class OrbitAreaEditor extends CompositeLayer<OrbitAreaEditorProps> {
  static override layerName = "OrbitAreaEditor";
  static override defaultProps = defaultProps;

  // Create debug logger for this component
  private debug = createDebug("editor");

  // Internal state for alignment (using private property instead of overriding state)
  private _currentAlignment: OrbitAreaAlignmentEnum =
    OrbitAreaAlignmentEnum.CENTRE;

  // Initialize alignment state from props if available
  override updateState(params: any) {
    super.updateState(params);

    if (this.props.editorState.alignment) {
      this._currentAlignment = this.props.editorState.alignment;
    }

    // Actively check for mouse position and update alignment if in WIDTH_SELECTION mode
    if (
      this.props.editorState.mode === EditorMode.WIDTH_SELECTION &&
      this.props.editorState.firstPoint &&
      this.props.editorState.secondPoint &&
      this.props.editorState.mousePosition
    ) {
      // Calculate alignment from mouse position
      this._currentAlignment = determineAlignmentFromMousePosition(
        this.props.editorState.firstPoint,
        this.props.editorState.secondPoint,
        this.props.editorState.mousePosition
      );
      this.debug(
        "updateState: determined alignment: %s",
        this._currentAlignment
      );
      this.setNeedsRedraw();
    }
  }

  // Process picking events
  override onClick(info: PickingInfo, event: any): boolean {
    const { editorState, onStateChange, onOrbitAreaComplete } = this.props;

    if (!onStateChange) return false; // No callback provided

    const { mode, firstPoint, secondPoint } = editorState;
    const pickedPoint: Point = {
      longitude: info.coordinate?.[0] || 0,
      latitude: info.coordinate?.[1] || 0,
    };

    switch (mode) {
      case EditorMode.FIRST_POINT:
        // First point selection
        onStateChange({
          ...editorState,
          firstPoint: pickedPoint,
          mode: EditorMode.SECOND_POINT,
        });
        break;

      case EditorMode.SECOND_POINT:
        // Second point selection
        onStateChange({
          ...editorState,
          secondPoint: pickedPoint,
          mode: EditorMode.WIDTH_SELECTION,
        });
        break;

      case EditorMode.WIDTH_SELECTION:
        // Width selection - finalize the OrbitArea
        if (firstPoint && secondPoint) {
          // Calculate width based on the distance from second point to clicked point
          const distance = calculateDistance(secondPoint, pickedPoint);
          const width = distance * 2; // Width is twice the radius

          // Use the current alignment from internal state (which is updated during hover)
          // This ensures we use the alignment that corresponds to the mouse position
          const effectiveAlignment = this._currentAlignment;

          // Create the final OrbitArea object
          const orbitArea: OrbitArea = {
            first_point: firstPoint,
            second_point: secondPoint,
            width,
            alignment: effectiveAlignment,
          }; // Notify completion
          if (onOrbitAreaComplete) {
            this.debug("Completing orbit area creation: %o", orbitArea);
            onOrbitAreaComplete(orbitArea);
          } else {
            this.debug("No onOrbitAreaComplete callback provided");
          }

          // Reset editor state
          onStateChange({
            ...editorState,
            firstPoint: undefined,
            secondPoint: undefined,
            width: undefined,
            mousePosition: undefined,
            mode: EditorMode.INACTIVE,
          });
        }
        break;

      default:
        break;
    }

    return true;
  }

  // Handle mouse movement for visual feedback
  override onHover(info: PickingInfo, event: any): boolean {
    const { editorState, onStateChange, debug: debugEnabled } = this.props;

    if (debugEnabled) {
      this.debug("onHover called with editor mode: %s", editorState.mode);
    }

    if (!onStateChange) {
      this.debug("No onStateChange callback provided");
      return false;
    }

    // Only process if we have valid coordinates
    if (!info.coordinate) {
      this.debug("No coordinates in hover event");
      return false;
    }

    // Update mouse position for visual feedback
    const mousePosition: Point = {
      longitude: info.coordinate[0] ?? 0,
      latitude: info.coordinate[1] ?? 0,
    };

    // If in width selection mode and we have both points, determine alignment from mouse position
    if (
      editorState.mode === EditorMode.WIDTH_SELECTION &&
      editorState.firstPoint &&
      editorState.secondPoint
    ) {
      if (this.props.debug) {
        this.debug("Width selection mode active, determining alignment");
        this.debug("First point: %o", editorState.firstPoint);
        this.debug("Second point: %o", editorState.secondPoint);
        this.debug("Mouse position: %o", mousePosition);
      }
      // Get alignment from mouse position relative to the line
      const detectedAlignment = determineAlignmentFromMousePosition(
        editorState.firstPoint,
        editorState.secondPoint,
        mousePosition
      );

      // Log the detected alignment for debugging
      if (this.props.debug) {
        this.debug("Hover detected alignment: %s", detectedAlignment);
      }

      // Update our internal alignment state
      this._currentAlignment = detectedAlignment;

      // Only update the mouse position in the parent state, not the alignment
      onStateChange({
        ...editorState,
        mousePosition,
      });
    } else {
      // Just update mouse position in other modes
      onStateChange({
        ...editorState,
        mousePosition,
      });
    }

    return true;
  }

  override renderLayers(): Layer[] {
    const {
      editorState,
      distanceUnit = DistanceUnit.METERS,
      previewColor,
      pointColor,
      lineColor,
      alignmentIndicatorColor,
    } = this.props;

    const { mode, firstPoint, secondPoint, mousePosition } = editorState;
    // Use our internal alignment state instead of the one from props
    const alignment = this._currentAlignment;
    // Initialize layers array
    let layers: Layer[] = [];

    // We'll collect all layers by type and then add them in the right order at the end
    let polygonLayers: Layer[] = [];
    let lineLayers: Layer[] = [];
    let pointLayers: Layer[] = [];

    // Placed points layer (first and second point markers)
    if (firstPoint) {
      pointLayers.push(
        new ScatterplotLayer({
          id: getLayerId(this.props.id, OrbitLayerType.FIRST_POINT),
          data: [{ position: [firstPoint.longitude, firstPoint.latitude] }],
          getPosition: (d) => d.position,
          getFillColor: pointColor,
          getRadius: 3,
          radiusUnits: "pixels",
          pickable: false,
          parameters: {
            depthTest: false,
          },
        })
      );
    }

    if (secondPoint) {
      pointLayers.push(
        new ScatterplotLayer({
          id: getLayerId(this.props.id, OrbitLayerType.SECOND_POINT),
          data: [{ position: [secondPoint.longitude, secondPoint.latitude] }],
          getPosition: (d) => d.position,
          getFillColor: pointColor,
          getRadius: 3,
          radiusUnits: "pixels",
          pickable: false,
          parameters: {
            depthTest: false,
          },
        })
      );
    }

    // Distance line and bearing text (in second point selection mode)
    if (mode === EditorMode.SECOND_POINT && firstPoint && mousePosition) {
      const distance = calculateDistance(firstPoint, mousePosition);
      const bearing = calculateBearing(firstPoint, mousePosition);
      const convertedDistance = convertDistance(distance, distanceUnit);
      const distanceText = `${convertedDistance.toFixed(2)} ${
        DISTANCE_UNIT_LABELS[distanceUnit]
      } / ${bearing.toFixed(1)}deg`;

      // Line from first point to mouse
      lineLayers.push(
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
          getColor: lineColor,
          getWidth: 2,
          pickable: false,
          parameters: {
            depthTest: false,
          },
        })
      );

      // Text label for distance and bearing
      const midPoint = {
        longitude: (firstPoint.longitude + mousePosition.longitude) / 2,
        latitude: (firstPoint.latitude + mousePosition.latitude) / 2,
      };

      pointLayers.push(
        new TextLayer({
          id: `${this.props.id}-distance-text`,
          data: [
            {
              position: [midPoint.longitude, midPoint.latitude],
              text: distanceText,
            },
          ],
          getPosition: (d) => d.position,
          getText: (d) => d.text,
          getColor: asDeckGLColor(COLORS.DEBUG_TEXT_COLOR),
          getSize: 10,
          getAngle: 0,
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          getPixelOffset: [0, 0],
          background: true,
          backgroundPadding: [8, 4],
          getBackgroundColor: asDeckGLColor(COLORS.DEBUG_BACKGROUND),
          pickable: false,
        })
      );
    }

    // Width selection visualization and preview
    if (
      mode === EditorMode.WIDTH_SELECTION &&
      firstPoint &&
      secondPoint &&
      mousePosition
    ) {
      // Calculate the distance from second point to mouse position (the radius)
      const radius = calculateDistance(secondPoint, mousePosition);
      const width = radius * 2;
      const convertedWidth = convertDistance(width, distanceUnit);
      const widthText = `Width: ${convertedWidth.toFixed(2)} ${
        DISTANCE_UNIT_LABELS[distanceUnit]
      }`;

      // Get the current alignment from our internal state (updated during onHover based on mouse position)
      // This should be dynamically changing as the mouse moves
      const currentAlignment = alignment; // Now coming from our internal state

      this.debug(`Rendering with alignment: ${currentAlignment}`);

      // Get current quadrant name for display
      let quadrantName = "UNKNOWN";
      for (const quadrant of ALIGNMENT_QUADRANTS) {
        if (quadrant.alignment === currentAlignment) {
          quadrantName = quadrant.name;
          break;
        }
      }

      // Always use the current alignment from state (which is updated on hover)
      // This ensures the preview updates as the mouse moves
      const effectiveAlignment = currentAlignment;

      // Show alignment text based on the quadrant name
      const alignmentText =
        currentAlignment === OrbitAreaAlignmentEnum.LEFT
          ? "LEFT"
          : currentAlignment === OrbitAreaAlignmentEnum.RIGHT
          ? "RIGHT"
          : "CENTRE";

      // Debug line between first and second point (axis line)
      lineLayers.push(
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
        })
      );

      // Line from second point to mouse
      lineLayers.push(
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
          getColor: alignmentIndicatorColor,
          getWidth: 2,
          pickable: false,
        })
      );

      // Text label for width and alignment
      const midPoint = {
        longitude: (secondPoint.longitude + mousePosition.longitude) / 2,
        latitude: (secondPoint.latitude + mousePosition.latitude) / 2,
      };

      pointLayers.push(
        new TextLayer({
          id: `${this.props.id}-width-text`,
          data: [
            {
              position: [midPoint.longitude, midPoint.latitude],
              text: `${widthText} | Alignment: ${alignmentText}`,
            },
          ],
          getPosition: (d) => d.position,
          getText: (d) => d.text,
          getColor: [255, 255, 255],
          getSize: 10,
          getAngle: 0,
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          getPixelOffset: [0, 0],
          background: true,
          backgroundPadding: [8, 4],
          getBackgroundColor: [0, 0, 0, 200],
          pickable: false,
        })
      );

      // Preview OrbitArea polygon with detected alignment
      // Use the enum value directly - it already contains the string format needed
      this.debug(`Using alignment: ${effectiveAlignment}`);

      const polygonPoints = generateOrbitAreaPolygon(
        firstPoint,
        secondPoint,
        width,
        effectiveAlignment
      );

      // Use default green if previewColor is undefined
      const defaultColor: [number, number, number, number] = [0, 255, 255, 120];

      // Create a more transparent fill color
      const fillColor: [number, number, number, number] = [
        previewColor?.[0] ?? defaultColor[0],
        previewColor?.[1] ?? defaultColor[1],
        previewColor?.[2] ?? defaultColor[2],
        previewColor?.[3] !== undefined ? previewColor[3] * 0.5 : 60, // Make fill more transparent
      ];

      // Create a solid outline color
      const lineColor: [number, number, number, number] = [
        previewColor?.[0] ?? defaultColor[0],
        previewColor?.[1] ?? defaultColor[1],
        previewColor?.[2] ?? defaultColor[2],
        255, // Fully opaque
      ];

      // Add the filled polygon with semi-transparent fill
      polygonLayers.push(
        new PolygonLayer({
          id: getLayerId(this.props.id, OrbitLayerType.PREVIEW_POLYGON, "fill"),
          data: [
            {
              polygon: polygonPoints,
            },
          ],
          getPolygon: (d) =>
            d.polygon.map((p: Point) => [p.longitude, p.latitude]),
          getFillColor: asDeckGLColor(COLORS.ORBIT_AREA_FILL),
          getLineColor: [0, 0, 0, 0], // No border on the fill
          getLineWidth: 0,
          filled: true,
          stroked: false,
          pickable: false,
          parameters: {
            depthTest: false,
          },
        })
      );

      // Add a solid line around the polygon outline
      polygonLayers.push(
        new PolygonLayer({
          id: `${this.props.id}-preview-outline`,
          data: [
            {
              polygon: polygonPoints,
            },
          ],
          getPolygon: (d) =>
            d.polygon.map((p: Point) => [p.longitude, p.latitude]),
          getFillColor: [0, 0, 0, 0], // Transparent fill
          getLineColor: asDeckGLColor(COLORS.ORBIT_AREA_OUTLINE),
          getLineWidth: 2, // Thicker line
          lineWidthUnits: "pixels",
          filled: false,
          stroked: true,
          pickable: false,
          parameters: {
            depthTest: false,
          },
        })
      );

      // Only add debug visualization for the quadrants if debug is enabled
      if (this.props.debug) {
        // Calculate the quadrant areas around the second point
        const QUADRANT_RADIUS_METERS = radius * 1.5; // Make quadrants a bit larger than the width
        const quadrantLayers = ALIGNMENT_QUADRANTS.map((quadrant, index) => {
          const startAngle = quadrant.minAngle;
          const endAngle = quadrant.maxAngle;

          // Calculate the main bearing
          const mainBearing = calculateBearing(firstPoint, secondPoint);

          // Calculate quadrant vertices (arc around second point)
          const vertices: Point[] = [];

          // Start with the center point
          vertices.push({
            longitude: secondPoint.longitude,
            latitude: secondPoint.latitude,
          });

          // Add points along the arc at 5-degree intervals
          // Handle the case where we need to go the long way around
          let adjustedEndAngle = endAngle;
          if (startAngle > endAngle) {
            adjustedEndAngle += 360;
          }

          for (let angle = startAngle; angle <= adjustedEndAngle; angle += 5) {
            const normalizedAngle = normalizeAngle(angle);
            const absoluteAngle = normalizeAngle(mainBearing + normalizedAngle);
            const radians = (absoluteAngle * Math.PI) / 180;

            // Calculate point at this angle and the defined radius
            const dx = (Math.sin(radians) * QUADRANT_RADIUS_METERS) / 111111; // Convert meters to degrees (approximate)
            const dy = (Math.cos(radians) * QUADRANT_RADIUS_METERS) / 111111;

            vertices.push({
              longitude: secondPoint.longitude + dx,
              latitude: secondPoint.latitude + dy,
            });
          }

          // Add one more vertex to close the arc if we're handling the wrap-around case
          if (startAngle > endAngle) {
            const absoluteAngle = normalizeAngle(mainBearing + endAngle);
            const radians = (absoluteAngle * Math.PI) / 180;

            const dx = (Math.sin(radians) * QUADRANT_RADIUS_METERS) / 111111;
            const dy = (Math.cos(radians) * QUADRANT_RADIUS_METERS) / 111111;

            vertices.push({
              longitude: secondPoint.longitude + dx,
              latitude: secondPoint.latitude + dy,
            });
          }

          // Close the polygon by duplicating the center point
          vertices.push({
            longitude: secondPoint.longitude,
            latitude: secondPoint.latitude,
          });

          // Determine color based on quadrant alignment
          let color: [number, number, number, number] = [0, 255, 0, 80]; // Default green with low opacity
          switch (quadrant.alignment) {
            case OrbitAreaAlignmentEnum.LEFT:
              color = asDeckGLColor(COLORS.LEFT_COLOR || [255, 100, 100, 200]);
              break;
            case OrbitAreaAlignmentEnum.RIGHT:
              color = asDeckGLColor(COLORS.RIGHT_COLOR || [100, 100, 255, 200]);
              break;
            case OrbitAreaAlignmentEnum.CENTRE:
            default:
              color = asDeckGLColor(
                COLORS.CENTER_COLOR || [100, 255, 100, 200]
              );
              break;
          }

          // Highlight the active quadrant by making it more visible
          if (quadrant.alignment === currentAlignment) {
            color = [color[0], color[1], color[2], 200]; // Increased opacity for active quadrant
          } else {
            color = [color[0], color[1], color[2], 80]; // More transparent for inactive quadrants
          }

          return new PolygonLayer({
            id: getLayerId(
              this.props.id,
              OrbitLayerType.DEBUG_QUADRANTS,
              `${index}`
            ),
            data: [
              {
                polygon: vertices,
                name: quadrant.name,
              },
            ],
            getPolygon: (d) =>
              d.polygon.map((p: Point) => [p.longitude, p.latitude]),
            getFillColor: color,
            getLineColor:
              quadrant.alignment === currentAlignment
                ? asDeckGLColor(COLORS.ACTIVE_QUADRANT_COLOR)
                : asDeckGLColor(COLORS.INACTIVE_QUADRANT_COLOR),
            getLineWidth: 1,
            filled: true,
            stroked: true,
            pickable: false,
            parameters: {
              depthTest: false,
            },
          });
        });

        layers.push(...quadrantLayers);

        // Add text labels for the quadrants
        const labelLayers = ALIGNMENT_QUADRANTS.map((quadrant, index) => {
          const midAngle = (quadrant.minAngle + quadrant.maxAngle) / 2;
          // Handle wrap-around case
          const normalizedMidAngle =
            quadrant.minAngle > quadrant.maxAngle
              ? ((quadrant.minAngle + quadrant.maxAngle + 360) / 2) % 360
              : midAngle;

          // Calculate the main bearing
          const mainBearing = calculateBearing(firstPoint, secondPoint);

          // Calculate the absolute angle for this quadrant
          const absoluteAngle = normalizeAngle(
            mainBearing + normalizedMidAngle
          );
          const radians = (absoluteAngle * Math.PI) / 180;

          // Position label at 75% of the radius
          const labelRadius = QUADRANT_RADIUS_METERS * 0.75;
          const dx = (Math.sin(radians) * labelRadius) / 111111;
          const dy = (Math.cos(radians) * labelRadius) / 111111;

          const labelPosition = {
            longitude: secondPoint.longitude + dx,
            latitude: secondPoint.latitude + dy,
          };

          return new TextLayer({
            id: getLayerId(
              this.props.id,
              OrbitLayerType.DEBUG_LABELS,
              `${index}`
            ),
            data: [
              {
                position: [labelPosition.longitude, labelPosition.latitude],
                text: quadrant.name,
              },
            ],
            getPosition: (d) => d.position,
            getText: (d) => d.text,
            getColor: asDeckGLColor(COLORS.DEBUG_TEXT_COLOR),
            getSize: 9,
            getAngle: 0,
            getTextAnchor: "middle",
            getAlignmentBaseline: "center",
            getPixelOffset: [0, 0],
            background: true,
            backgroundPadding: [4, 2],
            getBackgroundColor: asDeckGLColor(COLORS.DEBUG_BACKGROUND),
            pickable: false,
            parameters: {
              depthTest: false,
            },
          });
        });

        // Add debug layers directly to main layers array
        layers.push(...labelLayers);
      }
    }

    // Combine all layers in the desired order for proper rendering:
    // 1. Polygons (bottom)
    // 2. Lines (middle)
    // 3. Points (top)
    return [
      ...polygonLayers, // Orbit polygons and outlines first (bottom)
      ...lineLayers, // Lines connecting points in the middle
      ...pointLayers, // Points and labels on top
      ...layers, // Any other layers that were directly added
    ];
  }
}
