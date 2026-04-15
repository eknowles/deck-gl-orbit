import type { PickingInfo } from "@deck.gl/core";
import type { DistanceValue, Point } from "../../types";
import { DistanceUnit } from "../../types";
import { calculateDistance } from "../../utils/geo-utils";
import { type GeometryMode, ModeEventEmitter, type ModeEventMap } from "../Mode";

/**
 * @alpha
 */
export interface CorridorArea {
  id?: string;
  /** Central line of corridor (currently two points from 3-click workflow). */
  center_line: Point[];
  /** Side-to-side distance distributed equally around center_line. */
  width?: DistanceValue;
}

/**
 * @alpha
 */
export class CorridorMode
  implements
    GeometryMode<
      ReturnType<CorridorMode["getState"]>,
      "first" | "second" | "width" | "inactive",
      CorridorArea
    >
{
  private firstPoint?: Point;
  private secondPoint?: Point;
  private mousePosition?: Point;
  private distanceUnit: DistanceUnit;
  private onComplete?: (corridor: CorridorArea) => void;
  private onUpdate?: () => void;
  private events = new ModeEventEmitter<CorridorArea>();

  constructor(
    options: {
      distanceUnit?: DistanceUnit;
      onComplete?: (corridor: CorridorArea) => void;
      onUpdate?: () => void;
    } = {},
  ) {
    this.distanceUnit = options.distanceUnit || DistanceUnit.METERS;
    this.onComplete = options.onComplete;
    this.onUpdate = options.onUpdate;
  }

  handleClick(info: PickingInfo): boolean {
    if (!info.coordinate) return false;

    const point: Point = {
      longitude: info.coordinate[0] ?? 0,
      latitude: info.coordinate[1] ?? 0,
    };

    if (!this.firstPoint) {
      this.firstPoint = point;
      this.onUpdate?.();
      this.events.emitChange();
      return true;
    }

    if (!this.secondPoint) {
      this.secondPoint = point;
      this.onUpdate?.();
      this.events.emitChange();
      return true;
    }

    const widthMeters = calculateDistance(this.secondPoint, point) * 2;
    const corridor: CorridorArea = {
      center_line: [this.firstPoint, this.secondPoint],
      width: { meters: widthMeters },
    };

    this.onComplete?.(corridor);
    this.events.emitComplete(corridor);
    this.reset();
    return true;
  }

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

  reset(): void {
    this.firstPoint = undefined;
    this.secondPoint = undefined;
    this.mousePosition = undefined;
    this.onUpdate?.();
    this.events.emitChange();
  }

  getState() {
    return {
      firstPoint: this.firstPoint,
      secondPoint: this.secondPoint,
      mousePosition: this.mousePosition,
      distanceUnit: this.distanceUnit,
    };
  }

  isActive(): boolean {
    return !!(this.firstPoint || this.secondPoint);
  }

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
        return "Click to set width and complete corridor";
      default:
        return "";
    }
  }

  on<E extends keyof ModeEventMap<CorridorArea>>(
    event: E,
    callback: (payload: ModeEventMap<CorridorArea>[E]) => void,
  ): () => void {
    return this.events.on(event, callback);
  }
}
