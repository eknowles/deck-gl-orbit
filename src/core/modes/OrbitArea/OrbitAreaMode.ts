import type { PickingInfo } from "@deck.gl/core";
import type { Point } from "../../types";
import { DistanceUnit, OrbitAreaAlignmentEnum } from "../../types";
import { calculateDistance } from "../../utils/geo-utils";
import { determineAlignmentFromMousePosition } from "../../utils/alignment-utils";
import { ModeEventEmitter, type GeometryMode, type ModeEventMap } from "../Mode";

/**
 * @alpha
 */
export interface OrbitArea {
  id?: string;
  first_point: Point;
  second_point: Point;
  width: number;
  alignment: OrbitAreaAlignmentEnum;
}

/**
 * Mode for creating orbit areas - handles all editing logic
 * Similar to nebula.gl's DrawPolygonMode
 * @alpha
 */
export class OrbitAreaMode
  implements
    GeometryMode<
      ReturnType<OrbitAreaMode["getState"]>,
      "first" | "second" | "width" | "inactive",
      OrbitArea
    >
{
  private firstPoint?: Point;
  private secondPoint?: Point;
  private mousePosition?: Point;
  private distanceUnit: DistanceUnit;
  private onComplete?: (orbitArea: OrbitArea) => void;
  private onUpdate?: () => void;
  private events = new ModeEventEmitter<OrbitArea>();

  constructor(
    options: {
      distanceUnit?: DistanceUnit;
      onComplete?: (orbitArea: OrbitArea) => void;
      onUpdate?: () => void;
    } = {},
  ) {
    this.distanceUnit = options.distanceUnit || DistanceUnit.METERS;
    this.onComplete = options.onComplete;
    this.onUpdate = options.onUpdate;
  }

  /**
   * Handle click - returns true if handled
   */
  handleClick(info: PickingInfo): boolean {
    if (!info.coordinate) return false;

    const point: Point = {
      longitude: info.coordinate[0] ?? 0,
      latitude: info.coordinate[1] ?? 0,
    };

    // Step 1: Set first point
    if (!this.firstPoint) {
      this.firstPoint = point;
      this.onUpdate?.();
      this.events.emitChange();
      return true;
    }

    // Step 2: Set second point
    if (!this.secondPoint) {
      this.secondPoint = point;
      this.onUpdate?.();
      this.events.emitChange();
      return true;
    }

    // Step 3: Complete with width
    if (this.firstPoint && this.secondPoint) {
      const distance = calculateDistance(this.secondPoint, point);
      const width = distance * 2;

      // Determine alignment from mouse position
      const alignment = this.mousePosition
        ? determineAlignmentFromMousePosition(this.firstPoint, this.secondPoint, this.mousePosition)
        : OrbitAreaAlignmentEnum.CENTRE;

      const orbitArea: OrbitArea = {
        first_point: this.firstPoint,
        second_point: this.secondPoint,
        width,
        alignment,
      };

      // Fire completion callback
      this.onComplete?.(orbitArea);
      this.events.emitComplete(orbitArea);

      // Reset for next orbit area
      this.reset();
      return true;
    }

    return false;
  }

  /**
   * Handle hover - returns true if handled
   */
  handleHover(info: PickingInfo): boolean {
    if (!info.coordinate) return false;

    this.mousePosition = {
      longitude: info.coordinate[0] ?? 0,
      latitude: info.coordinate[1] ?? 0,
    };

    this.onUpdate?.();
    this.events.emitChange();
    return true;
  }

  /**
   * Reset mode state
   */
  reset(): void {
    this.firstPoint = undefined;
    this.secondPoint = undefined;
    this.mousePosition = undefined;
    this.onUpdate?.();
    this.events.emitChange();
  }

  /**
   * Get current state for rendering
   */
  getState() {
    return {
      firstPoint: this.firstPoint,
      secondPoint: this.secondPoint,
      mousePosition: this.mousePosition,
      distanceUnit: this.distanceUnit,
    };
  }

  /**
   * Check if mode is active (has any points)
   */
  isActive(): boolean {
    return !!(this.firstPoint || this.secondPoint);
  }

  /**
   * Get current step (for UI feedback)
   */
  getStep(): "first" | "second" | "width" | "inactive" {
    if (!this.firstPoint) return "inactive";
    if (!this.secondPoint) return "first";
    return "width";
  }

  getInstruction(): string {
    switch (this.getStep()) {
      case "inactive":
        return "Click to place first point";
      case "first":
        return "Click to place second point";
      case "width":
        return "Click to select width and complete orbit";
      default:
        return "";
    }
  }

  on<E extends keyof ModeEventMap<OrbitArea>>(
    event: E,
    callback: (payload: ModeEventMap<OrbitArea>[E]) => void,
  ): () => void {
    return this.events.on(event, callback);
  }
}
