import type { PickingInfo } from "@deck.gl/core";
import type { AngleValue, DistanceValue, Point } from "../../types";
import { calculateBearing, calculateDistance, normalizeAngle } from "../../utils/geo-utils";
import { type GeometryMode, ModeEventEmitter, type ModeEventMap } from "../Mode";

/**
 * Rectangle definition from centre point + side lengths + orientation.
 * @beta
 */
export interface RectangleByCentre {
  id?: string;
  /** The centre position of the rectangle. */
  centre: Point;
  /** The length of side1 of the rectangle. */
  length_side_1: DistanceValue;
  /** The length of side2 of the rectangle. */
  length_side_2: DistanceValue;
  /** The bearing of side1 of the rectangle which is relative to true north. */
  bearing_side_1: AngleValue;
}

/**
 * @internal
 */
export class RectangleByCentreMode
  implements
    GeometryMode<
      ReturnType<RectangleByCentreMode["getState"]>,
      "center" | "side1" | "side2" | "inactive",
      RectangleByCentre
    >
{
  private center?: Point;
  private side1Point?: Point;
  private mousePosition?: Point;
  private onComplete?: (rectangle: RectangleByCentre) => void;
  private onUpdate?: () => void;
  private events = new ModeEventEmitter<RectangleByCentre>();

  constructor(
    options: {
      onComplete?: (rectangle: RectangleByCentre) => void;
      onUpdate?: () => void;
    } = {},
  ) {
    this.onComplete = options.onComplete;
    this.onUpdate = options.onUpdate;
  }

  handleClick(info: PickingInfo): boolean {
    if (!info.coordinate) return false;

    const point: Point = {
      longitude: info.coordinate[0] ?? 0,
      latitude: info.coordinate[1] ?? 0,
    };

    if (!this.center) {
      this.center = point;
      this.onUpdate?.();
      this.events.emitChange();
      return true;
    }

    if (!this.side1Point) {
      this.side1Point = point;
      this.onUpdate?.();
      this.events.emitChange();
      return true;
    }

    const rectangle = this.buildRectangle(point);
    if (!rectangle) return false;

    this.onComplete?.(rectangle);
    this.events.emitComplete(rectangle);
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
    this.center = undefined;
    this.side1Point = undefined;
    this.mousePosition = undefined;
    this.onUpdate?.();
    this.events.emitChange();
  }

  getState() {
    const preview = this.mousePosition ? this.buildRectangle(this.mousePosition) : undefined;
    return {
      center: this.center,
      side1Point: this.side1Point,
      mousePosition: this.mousePosition,
      preview,
    };
  }

  isActive(): boolean {
    return !!(this.center || this.side1Point);
  }

  getStep(): "center" | "side1" | "side2" | "inactive" {
    if (!this.center) return "inactive";
    if (!this.side1Point) return "side1";
    return "side2";
  }

  getInstruction(): string {
    switch (this.getStep()) {
      case "inactive":
      case "center":
        return "Click to place center";
      case "side1":
        return "Click to set side1 length and orientation";
      case "side2":
        return "Click to set side2 length and complete rectangle";
      default:
        return "";
    }
  }

  on<E extends keyof ModeEventMap<RectangleByCentre>>(
    event: E,
    callback: (payload: ModeEventMap<RectangleByCentre>[E]) => void,
  ): () => void {
    return this.events.on(event, callback);
  }

  private buildRectangle(side2Point: Point): RectangleByCentre | undefined {
    if (!this.center || !this.side1Point) return undefined;

    const halfSide1 = calculateDistance(this.center, this.side1Point);
    if (halfSide1 <= 0) return undefined;

    const bearingSide1 = normalizeAngle(calculateBearing(this.center, this.side1Point));
    const centerToSide2Distance = calculateDistance(this.center, side2Point);
    const bearingToSide2 = normalizeAngle(calculateBearing(this.center, side2Point));
    const relativeAngleRad = ((bearingToSide2 - bearingSide1) * Math.PI) / 180;
    const halfSide2 = Math.abs(centerToSide2Distance * Math.sin(relativeAngleRad));

    return {
      centre: this.center,
      length_side_1: { meters: halfSide1 * 2 },
      length_side_2: { meters: halfSide2 * 2 },
      bearing_side_1: { degrees: bearingSide1 },
    };
  }
}
