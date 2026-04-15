import type { DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
// @ts-expect-error
import "maplibre-gl/dist/maplibre-gl.css";
import type React from "react";
import { useState } from "react";
import {
  FullscreenControl,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  useControl,
} from "react-map-gl/maplibre";

// core
import {
  type CircleArea,
  CircleCreateLayer,
  CircleDisplayLayer,
  type CorridorArea,
  CorridorCreateLayer,
  CorridorDisplayLayer,
  createDebug,
  DistanceUnit,
  type OrbitArea,
  OrbitAreaCreateLayer,
  OrbitAreaDisplayLayer,
  type RectangleByCentre,
  RectangleByCentreCreateLayer,
  RectangleByCentreDisplayLayer,
} from "../../../src/core.ts";

// react
import { useDrawingTools } from "../../../src/react.ts";

const debug = createDebug("orbit-area-demo");

const INITIAL_VIEW_STATE = {
  longitude: 31.504455891715537,
  latitude: 45.3845874136542,
  zoom: 7,
  pitch: 0,
  bearing: 0,
};

const GlobeProjectionControl: React.FC = () => {
  useControl(() => new maplibregl.GlobeControl(), {
    position: "top-right",
  });
  return null;
};

type DeckGLOverlayProps = DeckProps & {
  interleaved?: boolean;
};

const DeckGLOverlay: React.FC<DeckGLOverlayProps> = (props) => {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
};

export const OrbitAreaDemo: React.FC = () => {
  // State for completed areas
  const [orbitAreas, setOrbitAreas] = useState<OrbitArea[]>([]);
  const [circleAreas, setCircleAreas] = useState<CircleArea[]>([]);
  const [corridorAreas, setCorridorAreas] = useState<CorridorArea[]>([]);
  const [rectangleAreas, setRectangleAreas] = useState<RectangleByCentre[]>([]);
  const [distanceUnit, setDistanceUnit] = useState(DistanceUnit.METERS);
  const [alignmentDebug, setAlignmentDebug] = useState(true);

  const tools = useDrawingTools({
    distanceUnit,
    onOrbitComplete(orbitArea: OrbitArea) {
      debug("Orbit area completed:", orbitArea);
      setOrbitAreas((prev) => [...prev, orbitArea]);
    },
    onCircleComplete(circle: CircleArea) {
      debug("Circle completed:", circle);
      setCircleAreas((prev) => [...prev, circle]);
    },
    onCorridorComplete(corridor: CorridorArea) {
      debug("Corridor completed:", corridor);
      setCorridorAreas((prev) => [...prev, corridor]);
    },
    onRectangleByCentreComplete(rectangle: RectangleByCentre) {
      debug("Rectangle by centre completed:", rectangle);
      setRectangleAreas((prev) => [...prev, rectangle]);
    },
  });

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDistanceUnit(e.target.value as DistanceUnit);
  };

  const handleClear = () => {
    setOrbitAreas([]);
    setCircleAreas([]);
    setCorridorAreas([]);
    setRectangleAreas([]);
  };

  debug(
    "Orbit:",
    orbitAreas.length,
    "Circle:",
    circleAreas.length,
    "Corridor:",
    corridorAreas.length,
    "RectangleByCentre:",
    rectangleAreas.length,
  );

  // Layers - use updateCounter from hooks for precise change detection
  const layers = [
    new OrbitAreaDisplayLayer({
      id: "orbit-areas",
      data: orbitAreas,
      pickable: true,
    }),
    new CircleDisplayLayer({
      id: "circle-areas",
      data: circleAreas,
      pickable: true,
    }),
    new CorridorDisplayLayer({
      id: "corridor-areas",
      data: corridorAreas,
      pickable: true,
    }),
    new RectangleByCentreDisplayLayer({
      id: "rectangle-by-centre-areas",
      data: rectangleAreas,
      pickable: true,
    }),
    new OrbitAreaCreateLayer({
      id: "orbit-mode-layer",
      mode: tools.modes.orbit.mode,
      debug: alignmentDebug,
      updateTriggers: {
        mode: tools.modes.orbit.updateCounter, // Updates only when mode changes
        debug: alignmentDebug,
      },
    }),
    new CircleCreateLayer({
      id: "circle-mode-layer",
      mode: tools.modes.circle.mode,
      distanceUnit,
      updateTriggers: {
        mode: tools.modes.circle.updateCounter, // Updates only when mode changes
      },
    }),
    new CorridorCreateLayer({
      id: "corridor-mode-layer",
      mode: tools.modes.corridor.mode,
      updateTriggers: {
        mode: tools.modes.corridor.updateCounter,
      },
    }),
    new RectangleByCentreCreateLayer({
      id: "rectangle-by-centre-mode-layer",
      mode: tools.modes.rectangleByCentre.mode,
      distanceUnit,
      updateTriggers: {
        mode: tools.modes.rectangleByCentre.updateCounter,
      },
    }),
  ];

  const modeButtons: Array<{
    id: "orbit" | "circle" | "corridor" | "rectangleByCentre";
    label: string;
  }> = [
    { id: "orbit", label: "Orbit" },
    { id: "circle", label: "Circle" },
    { id: "corridor", label: "Corridor" },
    { id: "rectangleByCentre", label: "Rectangle" },
  ];
  const stats = [
    { key: "Orbits", value: orbitAreas.length },
    { key: "Circles", value: circleAreas.length },
    { key: "Corridors", value: corridorAreas.length },
    { key: "Rectangles", value: rectangleAreas.length },
  ];

  return (
    <div className="demo-root">
      <MapLibreMap
        initialViewState={INITIAL_VIEW_STATE}
        mapLib={maplibregl}
        mapStyle="https://tiles.openfreemap.org/styles/dark"
        attributionControl={{ compact: false }}
        reuseMaps
      >
        <DeckGLOverlay
          interleaved={false}
          layers={layers}
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          onClick={(info) => {
            if (tools.isDrawing && info.coordinate) {
              tools.handleMapClick(info);
            }
          }}
          onHover={(info) => {
            if (tools.isDrawing && info.coordinate) {
              tools.handleMouseMove(info);
            }
          }}
        />
        <GlobeProjectionControl />
        <NavigationControl position="top-right" showCompass showZoom />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-right" unit="metric" />
      </MapLibreMap>

      <div className="demo-toolbar">
        <div className="demo-mode-buttons">
          {modeButtons.map((button) => {
            const isActive = tools.activeMode === button.id;
            return (
              <button
                key={button.id}
                type="button"
                className={`demo-btn ${isActive ? "active" : "primary"}`}
                onClick={() => tools.startMode(button.id)}
                disabled={isActive}
              >
                {button.label}
              </button>
            );
          })}
          {tools.isDrawing && (
            <button type="button" className="demo-btn danger" onClick={tools.cancelDrawing}>
              Cancel
            </button>
          )}
          <button type="button" className="demo-btn clear" onClick={handleClear}>
            Clear
          </button>
        </div>

        <label className="demo-checkbox">
          <input
            type="checkbox"
            checked={alignmentDebug}
            onChange={(e) => setAlignmentDebug(e.target.checked)}
          />
          Alignment debug
        </label>

        <div className="demo-unit-row">
          <label htmlFor="demo-distance-unit">Units</label>
          <select id="demo-distance-unit" value={distanceUnit} onChange={handleUnitChange}>
            <option value={DistanceUnit.METERS}>m</option>
            <option value={DistanceUnit.KILOMETERS}>km</option>
            <option value={DistanceUnit.NAUTICAL_MILES}>nm</option>
            <option value={DistanceUnit.FEET}>ft</option>
          </select>
        </div>

        <div className="demo-stats">
          {stats.map((stat) => (
            <div key={stat.key}>
              {stat.key}: {stat.value}
            </div>
          ))}
        </div>
      </div>

      {tools.isDrawing && <div className="demo-instruction">{tools.currentInstruction}</div>}
    </div>
  );
};
