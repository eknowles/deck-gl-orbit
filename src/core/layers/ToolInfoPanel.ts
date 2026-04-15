import type { CompositeLayerProps } from "@deck.gl/core";
import { CompositeLayer } from "@deck.gl/core";
import { TextLayer } from "@deck.gl/layers";
import { FONT_FAMILY, asDeckGLColor } from "../constants/colors";
import ToolInfoBackgroundLayer from "./ToolInfoBackgroundLayer";

export interface ToolInfoRow {
  key: string;
  value: string;
}

export interface ToolInfoPanelProps extends CompositeLayerProps {
  rows: ToolInfoRow[];
  position: [number, number];
  textColor?: [number, number, number, number];
  backgroundColor?: [number, number, number, number];
  fontSize?: number;
  pixelOffset?: [number, number];
  backgroundPadding?: [number, number];
  rowSpacing?: number;
  columnSpacing?: number;
}

const defaultProps = {
  textColor: [255, 255, 255, 255] as [number, number, number, number],
  backgroundColor: [0, 0, 0, 190] as [number, number, number, number],
  fontSize: 11,
  pixelOffset: [16, 6] as [number, number],
  backgroundPadding: [6, 4] as [number, number],
  rowSpacing: 14,
  columnSpacing: 10,
};

/**
 * @internal
 */
export default class ToolInfoPanel extends CompositeLayer<ToolInfoPanelProps> {
  static override layerName = "ToolInfoPanel";
  static override defaultProps = defaultProps;

  override renderLayers() {
    const {
      rows,
      position,
      textColor,
      backgroundColor,
      fontSize = 11,
      pixelOffset = [16, 6],
      backgroundPadding = [6, 4],
      rowSpacing = 14,
      columnSpacing = 10,
    } = this.props;

    const maxKeyLen = Math.max(...rows.map((row) => row.key.length), 1);
    const maxValueLen = Math.max(...rows.map((row) => row.value.length), 1);
    const contentWidth = (maxKeyLen + maxValueLen + 2) * (fontSize * 0.6) + columnSpacing;
    const contentHeight = Math.max(rows.length, 1) * rowSpacing;
    const keyX = pixelOffset[0] + backgroundPadding[0];
    const valueX = keyX + maxKeyLen * (fontSize * 0.6) + columnSpacing;

    return [
      new ToolInfoBackgroundLayer({
        id: `${this.props.id}-bg`,
        position,
        backgroundColor,
        backgroundPadding,
        pixelOffset,
        contentDimensions: [contentWidth, contentHeight],
      }),
      new TextLayer({
        id: `${this.props.id}-keys`,
        data: rows.map((row, index) => ({
          position,
          text: row.key,
          pixelOffset: [keyX, pixelOffset[1] + backgroundPadding[1] + index * rowSpacing],
        })),
        getPosition: (d) => d.position,
        getText: (d) => d.text,
        getPixelOffset: (d) => d.pixelOffset,
        fontFamily: FONT_FAMILY,
        fontWeight: "bold",
        getColor: asDeckGLColor(textColor),
        getSize: fontSize,
        getTextAnchor: "start",
        getAlignmentBaseline: "top",
        pickable: false,
        parameters: { depthTest: false },
      }),
      new TextLayer({
        id: `${this.props.id}-values`,
        data: rows.map((row, index) => ({
          position,
          text: row.value,
          pixelOffset: [valueX, pixelOffset[1] + backgroundPadding[1] + index * rowSpacing],
        })),
        getPosition: (d) => d.position,
        getText: (d) => d.text,
        getPixelOffset: (d) => d.pixelOffset,
        fontFamily: FONT_FAMILY,
        getColor: asDeckGLColor(textColor),
        getSize: fontSize,
        getTextAnchor: "start",
        getAlignmentBaseline: "top",
        pickable: false,
        parameters: { depthTest: false },
      }),
    ];
  }
}
