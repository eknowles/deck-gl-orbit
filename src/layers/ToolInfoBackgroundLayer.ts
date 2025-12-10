import { CompositeLayer } from "@deck.gl/core";
import { TextLayer } from "@deck.gl/layers";
import type { CompositeLayerProps } from "@deck.gl/core";
import { asDeckGLColor } from "../constants/colors";

// Props interface for the background layer
export interface ToolInfoBackgroundLayerProps extends CompositeLayerProps {
  // Position coordinates
  position: [number, number];
  // Background color
  backgroundColor?: [number, number, number, number];
  // Padding around the content
  backgroundPadding?: [number, number];
  // Pixel offset from the position
  pixelOffset?: [number, number];
  // Content dimensions (width, height) in pixels
  contentDimensions: [number, number];
}

// Default props
const defaultProps = {
  backgroundColor: [255, 255, 255, 255], // White background
  backgroundPadding: [8, 8] as [number, number],
  pixelOffset: [0, 0] as [number, number],
};

/**
 * A composite layer that renders a single background rectangle
 * for tool info panels using TextLayer's built-in background feature
 */
export default class ToolInfoBackgroundLayer extends CompositeLayer<ToolInfoBackgroundLayerProps> {
  static override layerName = "ToolInfoBackgroundLayer";
  static override defaultProps = defaultProps;

  override renderLayers() {
    const {
      position,
      backgroundColor,
      backgroundPadding,
      pixelOffset,
      contentDimensions,
      ...otherProps
    } = this.props;

    const [width, height] = contentDimensions;
    const [paddingX, paddingY] = backgroundPadding || [0, 0];
    const [offsetX, offsetY] = pixelOffset || [0, 0];

    // Calculate total background dimensions including padding
    const totalWidth = width + paddingX * 2;
    const totalHeight = height + paddingY * 2;

    // Create background using TextLayer's built-in background feature
    // Position the invisible text at the center of the background area
    return new TextLayer({
      ...otherProps,
      id: `${this.props.id}-tool-background`,
      data: [{
        position,
        text: " ", // Invisible space character
        pixelOffset: [offsetX + totalWidth/2, offsetY + totalHeight/2]
      }],
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getPixelOffset: (d) => d.pixelOffset,
      getBackgroundColor: asDeckGLColor(backgroundColor),
      backgroundBorderRadius: 4,
      background: true,
      backgroundPadding: [totalWidth/2, totalHeight/2],
      getSize: 1, // Minimal text size
      getColor: [0, 0, 0, 0], // Transparent text
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      pickable: false,
      parameters: {
        depthTest: false,
      },
    });
  }
}