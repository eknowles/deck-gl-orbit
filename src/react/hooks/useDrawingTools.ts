import type { PickingInfo } from "@deck.gl/core";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DrawingToolsController,
  type CircleToolBindings,
  type CorridorToolBindings,
  type DrawingToolMode,
  type DrawingToolsControllerOptions,
  type OrbitToolBindings,
} from "../../core/controllers/DrawingToolsController";

/**
 * @beta
 */
export type UseDrawingToolsOptions = DrawingToolsControllerOptions;

/**
 * @beta
 */
export interface UseDrawingToolsResult {
  activeMode: DrawingToolMode | null;
  startMode: (mode: DrawingToolMode) => void;
  cancelDrawing: () => void;
  isDrawing: boolean;
  currentInstruction: string;
  handleMapClick: (info: PickingInfo) => void;
  handleMouseMove: (info: PickingInfo) => void;
  modes: {
    orbit: OrbitToolBindings;
    circle: CircleToolBindings;
    corridor: CorridorToolBindings;
  };
}

/**
 * Optional orchestrator hook for single-active drawing tool UX.
 * Keeps only one mode active at a time and routes click/hover events.
 *
 * @beta
 */
export function useDrawingTools(options: UseDrawingToolsOptions = {}) {
  const onOrbitCompleteRef = useRef(options.onOrbitComplete);
  const onCircleCompleteRef = useRef(options.onCircleComplete);
  const onCorridorCompleteRef = useRef(options.onCorridorComplete);
  onOrbitCompleteRef.current = options.onOrbitComplete;
  onCircleCompleteRef.current = options.onCircleComplete;
  onCorridorCompleteRef.current = options.onCorridorComplete;

  const controller = useMemo(
    () =>
      new DrawingToolsController({
        distanceUnit: options.distanceUnit,
        onOrbitComplete: (orbitArea) => {
          onOrbitCompleteRef.current?.(orbitArea);
        },
        onCircleComplete: (circle) => {
          onCircleCompleteRef.current?.(circle);
        },
        onCorridorComplete: (corridor) => {
          onCorridorCompleteRef.current?.(corridor);
        },
      }),
    [options.distanceUnit],
  );
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = controller.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, [controller]);

  return {
    activeMode: controller.activeMode,
    startMode: (mode: DrawingToolMode) => controller.startMode(mode),
    cancelDrawing: () => controller.cancelDrawing(),
    isDrawing: controller.isDrawing,
    currentInstruction: controller.currentInstruction,
    handleMapClick: (info: PickingInfo) => controller.handleMapClick(info),
    handleMouseMove: (info: PickingInfo) => controller.handleMouseMove(info),
    modes: controller.modes,
  };
}
