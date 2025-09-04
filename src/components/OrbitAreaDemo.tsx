import type { DeckGLRef } from "@deck.gl/react";
import { DeckGL } from "@deck.gl/react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import React, { useRef, useState } from "react";
import { Map } from "react-map-gl/maplibre";
import { createDebug } from "../utils/debug";

// Create a debug instance for the orbit area demo component
const debug = createDebug("orbit-area-demo");

import { useOrbitAreaEditor } from "../hooks/useOrbitAreaEditor";
import OrbitAreaEditor from "../layers/OrbitAreaEditor";
import OrbitAreaLayer from "../layers/OrbitAreaLayer";
import type { OrbitArea } from "../types";
import { DistanceUnit } from "../types";

// Initial viewport settings
const INITIAL_VIEW_STATE = {
  longitude: 31.504455891715537,
  latitude: 45.3845874136542,
  zoom: 7,
  pitch: 0,
  bearing: 0,
};

export const OrbitAreaDemo: React.FC = () => {
  // State for completed OrbitAreas
  const [orbitAreas, setOrbitAreas] = useState<OrbitArea[]>([]);

  // Distance unit state
  const [distanceUnit, setDistanceUnit] = useState(DistanceUnit.METERS);

  // Use our custom hook for editor state management
  const {
    editorState,
    handleMapClick,
    handleMouseMove,
    startEditing,
    cancelEditing,
    isEditing,
  } = useOrbitAreaEditor(
    // Handle completed OrbitArea
    (orbitArea: OrbitArea) => {
      setOrbitAreas((prev) => [...prev, orbitArea]);
    },
    distanceUnit
  );

  // Update distance unit
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDistanceUnit(e.target.value as DistanceUnit);
  };

  // Clear all orbit areas
  const handleClear = () => {
    setOrbitAreas([]);
  };

  debug("Current orbit areas:", orbitAreas);

  // Layers for rendering
  const layers = [
    // Display layer for completed OrbitAreas
    new OrbitAreaLayer({
      id: "orbit-areas",
      data: orbitAreas,
      pickable: true,
    }),

    // Editor layer for creating new OrbitAreas
    new OrbitAreaEditor({
      id: "orbit-area-editor",
      editorState,
      distanceUnit,
      pickable: true,
      autoHighlight: false,
      debug: false,
      // Pass the callback to handle completed orbit areas
      onOrbitAreaComplete: (orbitArea: OrbitArea) => {
        debug("Orbit area completed in OrbitAreaDemo:", orbitArea);
        setOrbitAreas((prev) => {
          const newAreas = [...prev, orbitArea];
          debug("Updated orbit areas:", newAreas);
          return newAreas;
        });
      },
    }),
  ];

  // Reference to DeckGL component for event handling
  const deckRef = useRef<DeckGLRef | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <DeckGL
        ref={deckRef}
        layers={layers}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        onClick={(info, event) => {
          if (isEditing && info.coordinate) {
            // Pass the click info to our handler
            handleMapClick(info);
          }
        }}
        onHover={(info, event) => {
          // console.log("DeckGL onHover called", {
          //   isEditing,
          //   hasCoordinate: !!info.coordinate,
          // });
          if (isEditing && info.coordinate) {
            // Pass the hover info to our handler
            handleMouseMove(info);
          }
        }}
      >
        <Map
          mapLib={maplibregl}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
          // mapStyle="https://demotiles.maplibre.org/globe.json"
          attributionControl={{
            compact: false,
          }}
          reuseMaps
        />
      </DeckGL>

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: "10px",
          borderRadius: "4px",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <button
            onClick={isEditing ? cancelEditing : startEditing}
            style={{
              backgroundColor: isEditing ? "#ff4757" : "#2ed573",
              color: "black",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {isEditing ? "Cancel" : "Create Orbit Area"}
          </button>

          <button
            onClick={handleClear}
            style={{
              backgroundColor: "#5352ed",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              marginLeft: "10px",
              cursor: "pointer",
            }}
          >
            Clear All
          </button>
        </div>

        {/* Alignment selection removed - now determined dynamically */}

        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{ marginRight: "10px" }}>Units:</label>
          <select
            value={distanceUnit}
            onChange={handleUnitChange}
            style={{ padding: "4px" }}
          >
            <option value={DistanceUnit.METERS}>Meters</option>
            <option value={DistanceUnit.KILOMETERS}>Kilometers</option>
            <option value={DistanceUnit.NAUTICAL_MILES}>Nautical Miles</option>
            <option value={DistanceUnit.FEET}>Feet</option>
          </select>
        </div>
      </div>

      {isEditing && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "10px",
            borderRadius: "4px",
            textAlign: "center",
          }}
        >
          {editorState.mode === "FIRST_POINT" && "Click to place first point"}
          {editorState.mode === "SECOND_POINT" && "Click to place second point"}
          {editorState.mode === "WIDTH_SELECTION" &&
            "Click to select width and complete the OrbitArea"}
        </div>
      )}
    </div>
  );
};
