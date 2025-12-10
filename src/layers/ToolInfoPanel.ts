import type { CompositeLayerProps } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { TextLayer } from "@deck.gl/layers";
import { asDeckGLColor } from "../constants/colors";
import { FONT_FAMILY } from "../constants/colors";
import ToolInfoBackgroundLayer from "./ToolInfoBackgroundLayer";

// Interface for a single row in the tool info panel
export interface ToolInfoRow {
  key: string;
  value: string;
  icon?: string; // Optional icon character or symbol
}

// Props interface for the ToolInfoPanel
export interface ToolInfoPanelProps extends CompositeLayerProps {
  // Array of rows to display
  rows: ToolInfoRow[];
  // Position coordinates
  position: [number, number];
  // Optional overrides for styling
  textColor?: [number, number, number, number];
  backgroundColor?: [number, number, number, number];
  fontSize?: number;
  textAnchor?: "start" | "middle" | "end";
  alignmentBaseline?: "top" | "center" | "bottom";
  pixelOffset?: [number, number];
  backgroundPadding?: [number, number];
  rowSpacing?: number; // Spacing between rows
  columnSpacing?: number; // Spacing between key and value columns
  iconSize?: number; // Size of icons
}

// Default props
const defaultProps = {
  textColor: [0, 0, 0, 255], // Black text
  backgroundColor: [255, 255, 255, 255], // White background with slight transparency
  fontSize: 11,
  textAnchor: "start" as const,
  alignmentBaseline: "middle" as const,
  pixelOffset: [16, 6] as [number, number],
  backgroundPadding: [6, 4] as [number, number],
  rowSpacing: 4, // Spacing between rows
  columnSpacing: 11, // Spacing between key and value columns
  iconSize: 10, // Size of icons
};

/**
 * A composite layer for tool information displays
 * Renders a panel with background, icons, keys, and values in table format
 */
export default class ToolInfoPanel extends CompositeLayer<ToolInfoPanelProps> {
  static override layerName = "ToolInfoPanel";
  static override defaultProps = defaultProps;

  // Cache for text measurements
  private textMeasurements: Map<string, { width: number; height: number }> = new Map();

  // Measure text dimensions using Canvas API
  private measureText(text: string, fontSize: number, fontWeight: string = "normal"): { width: number; height: number } {
    const cacheKey = `${text}-${fontSize}-${fontWeight}`;
    
    if (this.textMeasurements.has(cacheKey)) {
      return this.textMeasurements.get(cacheKey)!;
    }

    // Create a temporary canvas to measure text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      // Fallback to estimation if canvas is not available
      return { width: text.length * fontSize * 0.6, height: fontSize };
    }

    context.font = `${fontWeight} ${fontSize}px ${FONT_FAMILY}`;
    const metrics = context.measureText(text);
    
    const measurement = {
      width: metrics.width,
      height: fontSize * 1.2 // Approximate line height
    };

    this.textMeasurements.set(cacheKey, measurement);
    return measurement;
  }

  renderLayers() {
    const {
      rows,
      position,
      textColor,
      backgroundColor,
      fontSize,
      pixelOffset,
      backgroundPadding,
      rowSpacing,
      columnSpacing,
      ...otherProps
    } = this.props;

    const layers = [];

    // Measure actual text dimensions for accurate sizing
    const keyMeasurements = rows.map(row => this.measureText(row.key, fontSize ?? 11, "bold"));
    const valueMeasurements = rows.map(row => this.measureText(row.value, fontSize ?? 11, "normal"));

    // Calculate content dimensions based on actual measurements
    const maxKeyWidth = Math.max(...keyMeasurements.map(m => m.width));
    const maxValueWidth = Math.max(...valueMeasurements.map(m => m.width));
    const rowHeight = Math.max(...keyMeasurements.map(m => m.height), ...valueMeasurements.map(m => m.height));

    const contentWidth = maxKeyWidth + (columnSpacing ?? 4) + maxValueWidth;
    const contentHeight = (rows.length * rowHeight) + ((rows.length - 1) * (rowSpacing ?? 14));

    // Add background layer first (renders behind text)
    layers.push(
      new ToolInfoBackgroundLayer({
        id: `${this.props.id}-background`,
        position,
        backgroundColor,
        backgroundPadding,
        pixelOffset,
        contentDimensions: [contentWidth, contentHeight],
        pickable: false,
      })
    );

    // Create text layers with proper alignment
    const textLayers = this.createTextLayers(
      rows,
      position,
      keyMeasurements,
      valueMeasurements,
      maxKeyWidth,
      rowHeight,
      textColor,
      fontSize,
      pixelOffset,
      backgroundPadding,
      rowSpacing,
      columnSpacing
    );

    layers.push(...textLayers);

    return layers;
  }

  private createTextLayers(
    rows: ToolInfoRow[],
    position: [number, number],
    keyMeasurements: { width: number; height: number }[],
    valueMeasurements: { width: number; height: number }[],
    maxKeyWidth: number,
    rowHeight: number,
    textColor: [number, number, number, number] | undefined,
    fontSize: number | undefined,
    pixelOffset: [number, number] | undefined,
    backgroundPadding: [number, number] | undefined,
    rowSpacing: number | undefined,
    columnSpacing: number | undefined
  ) {
    const layers = [];

    // Key text layer (left column)
    const keyData = rows.map((row, index) => ({
      position,
      text: row.key,
      pixelOffset: [
        (pixelOffset?.[0] ?? 0) + (backgroundPadding?.[0] ?? 0),
        (pixelOffset?.[1] ?? 0) + (backgroundPadding?.[1] ?? 0) + (index * (rowHeight + (rowSpacing ?? 14)))
      ]
    }));

    layers.push(
      new TextLayer({
        id: `${this.props.id}-keys`,
        data: keyData,
        getPosition: (d) => d.position,
        getText: (d) => d.text,
        getPixelOffset: (d) => d.pixelOffset,
        fontFamily: FONT_FAMILY,
        fontWeight: "bold",
        getColor: asDeckGLColor(textColor),
        getSize: fontSize,
        getAngle: 0,
        getTextAnchor: "start",
        getAlignmentBaseline: "top",
        pickable: false,
        parameters: {
          depthTest: false,
        },
      })
    );

    // Value text layer (right column)
    const valueData = rows.map((row, index) => ({
      position,
      text: row.value,
      pixelOffset: [
        (pixelOffset?.[0] ?? 0) + (backgroundPadding?.[0] ?? 0) + maxKeyWidth + (columnSpacing ?? 4),
        (pixelOffset?.[1] ?? 0) + (backgroundPadding?.[1] ?? 0) + (index * (rowHeight + (rowSpacing ?? 14)))
      ]
    }));

    layers.push(
      new TextLayer({
        id: `${this.props.id}-values`,
        data: valueData,
        getPosition: (d) => d.position,
        getText: (d) => d.text,
        getPixelOffset: (d) => d.pixelOffset,
        fontFamily: FONT_FAMILY,
        getColor: asDeckGLColor(textColor),
        getSize: fontSize,
        getAngle: 0,
        getTextAnchor: "start",
        getAlignmentBaseline: "top",
        pickable: false,
        parameters: {
          depthTest: false,
        },
      })
    );

    return layers;
  }
}