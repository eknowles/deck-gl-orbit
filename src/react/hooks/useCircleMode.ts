import type { PickingInfo } from "@deck.gl/core";
import { useCallback, useRef, useState } from "react";
import { type CircleArea, CircleMode } from "@/core/index.ts";

interface UseCircleModeResult {
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
 * React hook for CircleMode
 * @alpha
 */
export function useCircleMode(onComplete: (circle: CircleArea) => void): UseCircleModeResult {
  const [isDrawing, setIsDrawing] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);
  const modeRef = useRef<CircleMode | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date
  onCompleteRef.current = onComplete;

  // Force update by incrementing counter
  const forceUpdate = useCallback(() => {
    setUpdateCounter((c) => c + 1);
  }, []);

  // Create mode when starting to draw
  const startDrawing = useCallback(() => {
    const mode = new CircleMode();
    mode.on("complete", (circle) => {
      onCompleteRef.current(circle);
      forceUpdate();
    });
    mode.on("change", () => {
      forceUpdate();
    });
    modeRef.current = mode;
    setIsDrawing(true);
  }, [forceUpdate]);

  const stopDrawing = useCallback(() => {
    modeRef.current?.reset();
    modeRef.current = null;
    setIsDrawing(false);
  }, []);

  const handleClick = useCallback((info: PickingInfo) => {
    if (modeRef.current) {
      modeRef.current.handleClick(info);
    }
  }, []);

  const handleHover = useCallback((info: PickingInfo) => {
    if (modeRef.current) {
      modeRef.current.handleHover(info);
    }
  }, []);

  const currentStep = modeRef.current?.getStep() || "inactive";
  const currentInstruction = modeRef.current?.getInstruction() || "Click to place center";

  return {
    mode: modeRef.current,
    startDrawing,
    stopDrawing,
    handleClick,
    handleHover,
    isDrawing,
    currentStep,
    currentInstruction,
    updateCounter, // Expose for updateTriggers
  };
}
