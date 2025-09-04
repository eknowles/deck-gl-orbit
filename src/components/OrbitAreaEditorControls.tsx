import type { DeckGLRef } from "@deck.gl/react";
import React, { useEffect, useRef } from "react";
import { useOrbitAreaEditor } from "../hooks/useOrbitAreaEditor";
import { DistanceUnit } from "../types";

interface OrbitAreaEditorControlsProps {
  deckRef: React.RefObject<DeckGLRef | null>;
  onComplete?: (orbitArea: any) => void;
  initialDistanceUnit?: DistanceUnit;
}

/**
 * Component to add keyboard controls and event handlers for OrbitAreaEditor
 */
export const OrbitAreaEditorControls: React.FC<
  OrbitAreaEditorControlsProps
> = ({ deckRef, onComplete, initialDistanceUnit = DistanceUnit.METERS }) => {
  // Use our editor hook
  const {
    editorState,
    handleMapClick,
    handleMouseMove,
    startEditing,
    cancelEditing,
    isEditing,
  } = useOrbitAreaEditor((orbitArea) => {
    if (onComplete) {
      onComplete(orbitArea);
    }
  }, initialDistanceUnit);

  const isEditingRef = useRef(isEditing);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingRef.current) {
        // Escape key cancels editing
        if (e.key === "Escape") {
          cancelEditing();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cancelEditing]);

  // Set up deck.gl event handlers
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    // Instead of trying to use deck.gl's internal event system,
    // let's just add event listeners to the canvas directly
    const deckEl = deck as any;
    const canvas = deckEl.canvas || deckEl._canvas;
    if (!canvas) return;

    const handleCanvasClick = (e: MouseEvent) => {
      if (!isEditingRef.current) return;

      // Get click coordinates relative to the canvas
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create a mock info object - just need the coordinate property for our hooks
      // Cast to any to avoid type issues, since we're only interested in coordinates
      const mockInfo: any = {
        x,
        y,
        coordinate: [x, y],
        color: null,
        layer: null,
        pixelRatio: window.devicePixelRatio || 1,
      };

      handleMapClick(mockInfo);
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      if (!isEditingRef.current) return;

      // Get mouse coordinates relative to the canvas
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create a mock info object - just need the coordinate property for our hooks
      // Cast to any to avoid type issues, since we're only interested in coordinates
      const mockInfo: any = {
        x,
        y,
        coordinate: [x, y],
        color: null,
        layer: null,
        pixelRatio: window.devicePixelRatio || 1,
      };

      handleMouseMove(mockInfo);
    };

    // Add event listeners
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleCanvasMouseMove);

    return () => {
      // Clean up event listeners
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handleCanvasMouseMove);
    };
  }, [deckRef, handleMapClick, handleMouseMove]);

  return null; // This is a controller component with no UI
};
