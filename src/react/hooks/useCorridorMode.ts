import type { PickingInfo } from "@deck.gl/core";
import { useCallback, useRef, useState } from "react";
import { type CorridorArea, CorridorMode } from "../../core/modes/Corridor/CorridorMode";
import { DistanceUnit } from "../../core/types";

interface UseCorridorModeResult {
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
 * @alpha
 * @param onComplete - callback when drawing is complete
 * @param distanceUnit - distance unit for drawing
 */
export function useCorridorMode(
  onComplete: (corridor: CorridorArea) => void,
  distanceUnit: DistanceUnit = DistanceUnit.METERS,
): UseCorridorModeResult {
  const [isDrawing, setIsDrawing] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);
  const modeRef = useRef<CorridorMode | null>(null);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const forceUpdate = useCallback(() => {
    setUpdateCounter((c) => c + 1);
  }, []);

  const startDrawing = useCallback(() => {
    const mode = new CorridorMode({ distanceUnit });
    mode.on("complete", (corridor) => {
      onCompleteRef.current(corridor);
      forceUpdate();
    });
    mode.on("change", () => {
      forceUpdate();
    });
    modeRef.current = mode;
    setIsDrawing(true);
  }, [distanceUnit, forceUpdate]);

  const stopDrawing = useCallback(() => {
    modeRef.current?.reset();
    modeRef.current = null;
    setIsDrawing(false);
  }, []);

  const handleClick = useCallback((info: PickingInfo) => {
    modeRef.current?.handleClick(info);
  }, []);

  const handleHover = useCallback((info: PickingInfo) => {
    modeRef.current?.handleHover(info);
  }, []);

  const currentStep = modeRef.current?.getStep() || "inactive";
  const currentInstruction = modeRef.current?.getInstruction() || "Click to place first point";

  return {
    mode: modeRef.current,
    startDrawing,
    stopDrawing,
    handleClick,
    handleHover,
    isDrawing,
    currentStep,
    currentInstruction,
    updateCounter,
  };
}
