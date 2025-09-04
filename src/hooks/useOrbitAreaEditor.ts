import type { PickingInfo } from "@deck.gl/core";
import { useCallback, useState } from "react";
import type { OrbitArea, Point } from "../types";
import { DistanceUnit, EditorMode, OrbitAreaAlignmentEnum } from "../types";
import { createDebug } from "../utils/debug";

// Create a debug instance for the orbit area editor hook
const debug = createDebug("orbit-editor-hook");

// Interface for the hook return value
interface OrbitAreaEditorHook {
  editorState: {
    mode: EditorMode;
    firstPoint?: Point;
    secondPoint?: Point;
    width?: number;
    mousePosition?: Point;
    alignment: OrbitAreaAlignmentEnum;
  };
  startEditing: () => void;
  cancelEditing: () => void;
  handleMapClick: (info: PickingInfo) => void;
  handleMouseMove: (info: PickingInfo) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  isEditing: boolean;
  setAlignment: (alignment: OrbitAreaAlignmentEnum) => void;
  currentAlignment: OrbitAreaAlignmentEnum;
  distanceUnit: DistanceUnit;
}

/**
 * Hook for managing OrbitArea editor state and interactions
 * @param onOrbitAreaComplete Callback function for when an OrbitArea is completed
 * @param initialDistanceUnit Initial distance unit for measurements
 * @param initialAlignment Initial alignment mode
 */
export function useOrbitAreaEditor(
  onOrbitAreaComplete: (orbitArea: OrbitArea) => void,
  initialDistanceUnit: DistanceUnit = DistanceUnit.METERS
): OrbitAreaEditorHook {
  // Editor state
  const [editorState, setEditorState] = useState({
    mode: EditorMode.INACTIVE,
    firstPoint: undefined as Point | undefined,
    secondPoint: undefined as Point | undefined,
    width: undefined as number | undefined,
    mousePosition: undefined as Point | undefined,
    alignment: OrbitAreaAlignmentEnum.CENTRE, // Default alignment, will be updated by mouse position
  });

  // Distance unit state
  const [distanceUnit, setDistanceUnit] =
    useState<DistanceUnit>(initialDistanceUnit);

  // Computed property to determine if editing is active
  const isEditing = editorState.mode !== EditorMode.INACTIVE;

  // Start the editing process
  const startEditing = useCallback(() => {
    setEditorState({
      mode: EditorMode.FIRST_POINT,
      firstPoint: undefined,
      secondPoint: undefined,
      width: undefined,
      mousePosition: undefined,
      alignment: OrbitAreaAlignmentEnum.CENTRE, // Default alignment, will be updated by mouse position
    });
  }, []);

  // Cancel the editing process
  const cancelEditing = useCallback(() => {
    setEditorState({
      mode: EditorMode.INACTIVE,
      firstPoint: undefined,
      secondPoint: undefined,
      width: undefined,
      mousePosition: undefined,
      alignment: OrbitAreaAlignmentEnum.CENTRE, // Reset to default alignment
    });
  }, []);

  // Handle map click events
  const handleMapClick = useCallback(
    (info: PickingInfo) => {
      const { mode, firstPoint, secondPoint, alignment } = editorState;

      if (!info.coordinate) return; // No valid coordinate picked

      const pickedPoint: Point = {
        longitude: info.coordinate?.[0] ?? 0,
        latitude: info.coordinate?.[1] ?? 0,
      };

      switch (mode) {
        case EditorMode.FIRST_POINT:
          // First point selection
          setEditorState({
            ...editorState,
            firstPoint: pickedPoint,
            mode: EditorMode.SECOND_POINT,
          });
          break;

        case EditorMode.SECOND_POINT:
          // Second point selection
          setEditorState({
            ...editorState,
            secondPoint: pickedPoint,
            mode: EditorMode.WIDTH_SELECTION,
          });
          break;

        case EditorMode.WIDTH_SELECTION:
          // Width selection - finalize the OrbitArea
          if (firstPoint && secondPoint) {
            // Use the distance from second point to clicked point as the radius
            // We'll calculate this in the click handler of our editor layer

            // For now, just complete the editing process
            setEditorState({
              mode: EditorMode.INACTIVE,
              firstPoint: undefined,
              secondPoint: undefined,
              width: undefined,
              mousePosition: undefined,
              alignment,
            });
          }
          break;

        default:
          break;
      }
    },
    [editorState, setEditorState]
  );

  // Handle mouse move events for visual feedback
  const handleMouseMove = useCallback(
    (info: PickingInfo) => {
      if (!info.coordinate) return; // No valid coordinate

      const mousePosition: Point = {
        longitude: info.coordinate?.[0] ?? 0,
        latitude: info.coordinate?.[1] ?? 0,
      };

      debug("handleMouseMove called with mode:", editorState.mode);
      debug("Has firstPoint:", !!editorState.firstPoint);
      debug("Has secondPoint:", !!editorState.secondPoint);
      debug("Mouse position:", mousePosition);

      // Important: Force a state update with a new object reference
      // to ensure React detects the change
      setEditorState({
        ...editorState,
        mousePosition: {
          ...mousePosition,
        },
      });
    },
    [editorState, setEditorState]
  );

  // Set the alignment mode
  const setAlignment = useCallback(
    (alignment: OrbitAreaAlignmentEnum) => {
      setEditorState((prevState) => ({
        ...prevState,
        alignment,
      }));
    },
    [setEditorState]
  );

  return {
    editorState,
    startEditing,
    cancelEditing,
    handleMapClick,
    handleMouseMove,
    setDistanceUnit,
    isEditing,
    setAlignment,
    currentAlignment: editorState.alignment || OrbitAreaAlignmentEnum.CENTRE,
    distanceUnit,
  };
}
