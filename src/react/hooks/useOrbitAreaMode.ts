import type { PickingInfo } from "@deck.gl/core";
import { useCallback, useRef, useState } from "react";
import { type OrbitArea, OrbitAreaMode } from "../../core/modes/OrbitArea";
import { DistanceUnit } from "../../core/types";

interface UseOrbitAreaModeResult {
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
 * Simple React hook for OrbitAreaMode
 * Follows nebula.gl pattern - mode handles all logic
 * @alpha
 */
export function useOrbitAreaMode(
  onComplete: (orbitArea: OrbitArea) => void,
  distanceUnit: DistanceUnit = DistanceUnit.METERS,
): UseOrbitAreaModeResult {
  const [isDrawing, setIsDrawing] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);

  // Store mode in ref to persist across renders
  const modeRef = useRef<OrbitAreaMode | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date
  onCompleteRef.current = onComplete;

  // Force update by incrementing counter
  const forceUpdate = useCallback(() => {
    setUpdateCounter((c) => c + 1);
  }, []);

  // Create mode only once when starting to draw
  const startDrawing = useCallback(() => {
    // Create new mode instance
    const mode = new OrbitAreaMode({ distanceUnit });
    mode.on("complete", (orbitArea) => {
      onCompleteRef.current(orbitArea);
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
    updateCounter, // Expose for updateTriggers
  };
}
