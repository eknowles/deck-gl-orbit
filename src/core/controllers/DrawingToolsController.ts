import type { PickingInfo } from "@deck.gl/core";
import { type CircleArea, type CircleMode, CircleMode as CircleModeImpl } from "../modes/Circle";
import {
  type CorridorArea,
  type CorridorMode,
  CorridorMode as CorridorModeImpl,
} from "../modes/Corridor";
import {
  type OrbitArea,
  type OrbitAreaMode,
  OrbitAreaMode as OrbitAreaModeImpl,
} from "../modes/OrbitArea";
import {
  type RectangleByCentre,
  type RectangleByCentreMode,
  RectangleByCentreMode as RectangleByCentreModeImpl,
} from "../modes/RectangleByCentre";
import { DistanceUnit } from "../types";

/**
 * @beta
 */
export type DrawingToolMode = "orbit" | "circle" | "corridor" | "rectangleByCentre";

/**
 * @alpha
 */
export interface DrawingToolsControllerOptions {
  distanceUnit?: DistanceUnit;
  onOrbitComplete?: (orbitArea: OrbitArea) => void;
  onCircleComplete?: (circle: CircleArea) => void;
  onCorridorComplete?: (corridor: CorridorArea) => void;
  onRectangleByCentreComplete?: (rectangle: RectangleByCentre) => void;
}

/**
 * @beta
 */
export interface OrbitToolBindings {
  mode: OrbitAreaMode | null;
  startDrawing: () => void;
  stopDrawing: () => void;
  handleClick: (info: PickingInfo) => void;
  handleHover: (info: PickingInfo) => void;
  isDrawing: boolean;
  currentStep: "first" | "second" | "width" | "inactive";
  currentInstruction: string;
  updateCounter: number;
}

/**
 * @beta
 */
export interface CircleToolBindings {
  mode: CircleMode | null;
  startDrawing: () => void;
  stopDrawing: () => void;
  handleClick: (info: PickingInfo) => void;
  handleHover: (info: PickingInfo) => void;
  isDrawing: boolean;
  currentStep: "center" | "radius" | "inactive";
  currentInstruction: string;
  updateCounter: number;
}

/**
 * @beta
 */
export interface CorridorToolBindings {
  mode: CorridorMode | null;
  startDrawing: () => void;
  stopDrawing: () => void;
  handleClick: (info: PickingInfo) => void;
  handleHover: (info: PickingInfo) => void;
  isDrawing: boolean;
  currentStep: "first" | "second" | "width" | "inactive";
  currentInstruction: string;
  updateCounter: number;
}

/**
 * @beta
 */
export interface RectangleByCentreToolBindings {
  mode: RectangleByCentreMode | null;
  startDrawing: () => void;
  stopDrawing: () => void;
  handleClick: (info: PickingInfo) => void;
  handleHover: (info: PickingInfo) => void;
  isDrawing: boolean;
  currentStep: "center" | "side1" | "side2" | "inactive";
  currentInstruction: string;
  updateCounter: number;
}

type Listener = () => void;

/**
 * @internal
 */
export class DrawingToolsController {
  private readonly listeners = new Set<Listener>();
  private readonly onOrbitComplete: (orbitArea: OrbitArea) => void;
  private readonly onCircleComplete: (circle: CircleArea) => void;
  private readonly onCorridorComplete: (corridor: CorridorArea) => void;
  private readonly onRectangleByCentreComplete: (rectangle: RectangleByCentre) => void;
  private readonly distanceUnit: DistanceUnit;
  private _activeMode: DrawingToolMode | null = null;

  readonly modes: {
    orbit: OrbitToolBindings;
    circle: CircleToolBindings;
    corridor: CorridorToolBindings;
    rectangleByCentre: RectangleByCentreToolBindings;
  };

  constructor(options: DrawingToolsControllerOptions = {}) {
    this.distanceUnit = options.distanceUnit ?? DistanceUnit.METERS;
    this.onOrbitComplete = options.onOrbitComplete ?? (() => undefined);
    this.onCircleComplete = options.onCircleComplete ?? (() => undefined);
    this.onCorridorComplete = options.onCorridorComplete ?? (() => undefined);
    this.onRectangleByCentreComplete = options.onRectangleByCentreComplete ?? (() => undefined);

    this.modes = {
      orbit: {
        mode: null,
        startDrawing: () => this.startMode("orbit"),
        stopDrawing: () => this.stopMode("orbit"),
        handleClick: (info) => this.modes.orbit.mode?.handleClick(info),
        handleHover: (info) => this.modes.orbit.mode?.handleHover(info),
        isDrawing: false,
        currentStep: "inactive",
        currentInstruction: "Click to place first point",
        updateCounter: 0,
      },
      circle: {
        mode: null,
        startDrawing: () => this.startMode("circle"),
        stopDrawing: () => this.stopMode("circle"),
        handleClick: (info) => this.modes.circle.mode?.handleClick(info),
        handleHover: (info) => this.modes.circle.mode?.handleHover(info),
        isDrawing: false,
        currentStep: "inactive",
        currentInstruction: "Click to place center",
        updateCounter: 0,
      },
      corridor: {
        mode: null,
        startDrawing: () => this.startMode("corridor"),
        stopDrawing: () => this.stopMode("corridor"),
        handleClick: (info) => this.modes.corridor.mode?.handleClick(info),
        handleHover: (info) => this.modes.corridor.mode?.handleHover(info),
        isDrawing: false,
        currentStep: "inactive",
        currentInstruction: "Click to place first point",
        updateCounter: 0,
      },
      rectangleByCentre: {
        mode: null,
        startDrawing: () => this.startMode("rectangleByCentre"),
        stopDrawing: () => this.stopMode("rectangleByCentre"),
        handleClick: (info) => this.modes.rectangleByCentre.mode?.handleClick(info),
        handleHover: (info) => this.modes.rectangleByCentre.mode?.handleHover(info),
        isDrawing: false,
        currentStep: "inactive",
        currentInstruction: "Click to place center",
        updateCounter: 0,
      },
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get activeMode(): DrawingToolMode | null {
    return this._activeMode;
  }

  get isDrawing(): boolean {
    return (
      this.modes.orbit.isDrawing ||
      this.modes.circle.isDrawing ||
      this.modes.corridor.isDrawing ||
      this.modes.rectangleByCentre.isDrawing
    );
  }

  get currentInstruction(): string {
    if (this._activeMode === "orbit") return this.modes.orbit.currentInstruction;
    if (this._activeMode === "circle") return this.modes.circle.currentInstruction;
    if (this._activeMode === "corridor") return this.modes.corridor.currentInstruction;
    if (this._activeMode === "rectangleByCentre") {
      return this.modes.rectangleByCentre.currentInstruction;
    }
    return "";
  }

  startMode(mode: DrawingToolMode): void {
    this.stopAll();
    this._activeMode = mode;

    if (mode === "orbit") {
      const orbit = new OrbitAreaModeImpl({
        distanceUnit: this.distanceUnit,
      });
      orbit.on("change", () => {
        this.modes.orbit.updateCounter += 1;
        this.modes.orbit.currentStep = orbit.getStep();
        this.modes.orbit.currentInstruction = orbit.getInstruction();
        this.emitChange();
      });
      orbit.on("complete", (area) => {
        this.onOrbitComplete(area);
      });
      this.modes.orbit.mode = orbit;
      this.modes.orbit.isDrawing = true;
    } else if (mode === "circle") {
      const circle = new CircleModeImpl();
      circle.on("change", () => {
        this.modes.circle.updateCounter += 1;
        this.modes.circle.currentStep = circle.getStep();
        this.modes.circle.currentInstruction = circle.getInstruction();
        this.emitChange();
      });
      circle.on("complete", (area) => {
        this.onCircleComplete(area);
      });
      this.modes.circle.mode = circle;
      this.modes.circle.isDrawing = true;
    } else if (mode === "corridor") {
      const corridor = new CorridorModeImpl({
        distanceUnit: this.distanceUnit,
      });
      corridor.on("change", () => {
        this.modes.corridor.updateCounter += 1;
        this.modes.corridor.currentStep = corridor.getStep();
        this.modes.corridor.currentInstruction = corridor.getInstruction();
        this.emitChange();
      });
      corridor.on("complete", (area) => {
        this.onCorridorComplete(area);
      });
      this.modes.corridor.mode = corridor;
      this.modes.corridor.isDrawing = true;
    } else {
      const rectangleByCentre = new RectangleByCentreModeImpl();
      rectangleByCentre.on("change", () => {
        this.modes.rectangleByCentre.updateCounter += 1;
        this.modes.rectangleByCentre.currentStep = rectangleByCentre.getStep();
        this.modes.rectangleByCentre.currentInstruction = rectangleByCentre.getInstruction();
        this.emitChange();
      });
      rectangleByCentre.on("complete", (area) => {
        this.onRectangleByCentreComplete(area);
      });
      this.modes.rectangleByCentre.mode = rectangleByCentre;
      this.modes.rectangleByCentre.isDrawing = true;
    }

    this.emitChange();
  }

  cancelDrawing(): void {
    this.stopAll();
    this._activeMode = null;
    this.emitChange();
  }

  handleMapClick(info: PickingInfo): void {
    if (this._activeMode === "orbit") this.modes.orbit.mode?.handleClick(info);
    else if (this._activeMode === "circle") this.modes.circle.mode?.handleClick(info);
    else if (this._activeMode === "corridor") this.modes.corridor.mode?.handleClick(info);
    else if (this._activeMode === "rectangleByCentre") {
      this.modes.rectangleByCentre.mode?.handleClick(info);
    }
  }

  handleMouseMove(info: PickingInfo): void {
    if (this._activeMode === "orbit") this.modes.orbit.mode?.handleHover(info);
    else if (this._activeMode === "circle") this.modes.circle.mode?.handleHover(info);
    else if (this._activeMode === "corridor") this.modes.corridor.mode?.handleHover(info);
    else if (this._activeMode === "rectangleByCentre") {
      this.modes.rectangleByCentre.mode?.handleHover(info);
    }
  }

  private stopMode(mode: DrawingToolMode): void {
    if (mode === "orbit") {
      this.modes.orbit.mode?.reset();
      this.modes.orbit.mode = null;
      this.modes.orbit.isDrawing = false;
      this.modes.orbit.currentStep = "inactive";
      this.modes.orbit.currentInstruction = "Click to place first point";
    } else if (mode === "circle") {
      this.modes.circle.mode?.reset();
      this.modes.circle.mode = null;
      this.modes.circle.isDrawing = false;
      this.modes.circle.currentStep = "inactive";
      this.modes.circle.currentInstruction = "Click to place center";
    } else if (mode === "corridor") {
      this.modes.corridor.mode?.reset();
      this.modes.corridor.mode = null;
      this.modes.corridor.isDrawing = false;
      this.modes.corridor.currentStep = "inactive";
      this.modes.corridor.currentInstruction = "Click to place first point";
    } else {
      this.modes.rectangleByCentre.mode?.reset();
      this.modes.rectangleByCentre.mode = null;
      this.modes.rectangleByCentre.isDrawing = false;
      this.modes.rectangleByCentre.currentStep = "inactive";
      this.modes.rectangleByCentre.currentInstruction = "Click to place center";
    }
  }

  private stopAll(): void {
    this.stopMode("orbit");
    this.stopMode("circle");
    this.stopMode("corridor");
    this.stopMode("rectangleByCentre");
  }

  private emitChange(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
