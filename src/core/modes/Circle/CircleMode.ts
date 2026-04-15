import type { PickingInfo } from "@deck.gl/core";
import type { Point } from "../../types";
import { calculateDistance } from "../../utils/geo-utils";
import { ModeEventEmitter, type GeometryMode, type ModeEventMap } from "../Mode";

/**
 * Circle area with center and radius
 * @beta
 */
export interface CircleArea {
  id?: string;
  center: Point;
  radius: number; // in meters
}

/**
 * Mode for creating circle areas
 * First click = center, second click = radius
 * @internal
 */
export class CircleMode
  implements
    GeometryMode<ReturnType<CircleMode["getState"]>, "center" | "radius" | "inactive", CircleArea>
{
  private center?: Point;
  private mousePosition?: Point;
  private onComplete?: (circle: CircleArea) => void;
  private onUpdate?: () => void;
  private events = new ModeEventEmitter<CircleArea>();

  constructor(
    options: {
      onComplete?: (circle: CircleArea) => void;
      onUpdate?: () => void;
    } = {},
  ) {
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

    // Step 1: Set center
    if (!this.center) {
      this.center = point;
      this.onUpdate?.();
      this.events.emitChange();
      return true;
    }

    // Step 2: Complete with radius
    if (this.center) {
      const radius = calculateDistance(this.center, point);

      const circle: CircleArea = {
        center: this.center,
        radius,
      };

      // Fire completion callback
      this.onComplete?.(circle);
      this.events.emitComplete(circle);

      // Reset for next circle
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
    this.center = undefined;
    this.mousePosition = undefined;
    this.onUpdate?.();
    this.events.emitChange();
  }

  /**
   * Get current state for rendering
   */
  getState() {
    return {
      center: this.center,
      mousePosition: this.mousePosition,
      radius:
        this.center && this.mousePosition
          ? calculateDistance(this.center, this.mousePosition)
          : undefined,
    };
  }

  /**
   * Check if mode is active
   */
  isActive(): boolean {
    return !!this.center;
  }

  /**
   * Get current step (for UI feedback)
   */
  getStep(): "center" | "radius" | "inactive" {
    if (!this.center) return "inactive";
    return "radius";
  }

  getInstruction(): string {
    switch (this.getStep()) {
      case "inactive":
      case "center":
        return "Click to place center";
      case "radius":
        return "Click to set radius and complete circle";
      default:
        return "";
    }
  }

  on<E extends keyof ModeEventMap<CircleArea>>(
    event: E,
    callback: (payload: ModeEventMap<CircleArea>[E]) => void,
  ): () => void {
    return this.events.on(event, callback);
  }
}
