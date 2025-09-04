# OrbitArea Interactive Editor

An interactive Deck.GL layer system for creating and editing OrbitArea objects using a three-click workflow. An OrbitArea is a racetrack-shaped geographic surface consisting of a rectangle with semicircular caps at both ends.

## Features

- Three-click workflow for creating OrbitArea shapes
- Supports different alignment modes (Centre, Left, Right)
- Real-time visual feedback with distance, bearing, and width measurements
- Customizable distance units (meters, kilometers, nautical miles, feet)
- Live preview of the OrbitArea shape during creation

## Project Structure

- `/src/types/index.ts` - Core data structures and interfaces
- `/src/utils/geo-utils.ts` - Geographic calculation utilities
- `/src/layers/OrbitAreaLayer.ts` - Display layer for rendering OrbitArea objects
- `/src/layers/OrbitAreaEditor.ts` - Interactive layer for creating OrbitArea objects
- `/src/hooks/useOrbitAreaEditor.ts` - React hook for editor state management
- `/src/components/OrbitAreaDemo.tsx` - Demo component showcasing the editor
- `/src/components/OrbitAreaEditorControls.tsx` - Event handling and keyboard controls

## Usage

```jsx
import { useRef, useState } from 'react';
import { DeckGL } from '@deck.gl/react';
import OrbitAreaLayer from './layers/OrbitAreaLayer';
import { OrbitAreaEditorControls } from './components/OrbitAreaEditorControls';
import type { OrbitArea } from './types';

const App = () => {
  const [orbitAreas, setOrbitAreas] = useState<OrbitArea[]>([]);
  const deckRef = useRef(null);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DeckGL
        ref={deckRef}
        initialViewState={{
          longitude: -122.4,
          latitude: 37.74,
          zoom: 11
        }}
        controller={true}
        layers={[
          new OrbitAreaLayer({
            id: 'orbit-areas',
            data: orbitAreas
          })
        ]}
      />
      
      <OrbitAreaEditorControls 
        deckRef={deckRef}
        onComplete={(orbitArea) => {
          setOrbitAreas(prev => [...prev, orbitArea]);
        }}
      />
    </div>
  );
};
```

## Three-Click Workflow

1. **First Point Selection**: Click on the map to place the first point.
2. **Second Point Selection**: Click again to place the second point. A line with distance and bearing information is displayed.
3. **Width Selection**: Click a third time to set the width of the OrbitArea and complete the creation. A preview of the OrbitArea is displayed during this step.

## Implementation Notes

- Uses great circle distance calculations for geographic accuracy
- Generates smooth semicircular caps using parametric equations
- Handles all three alignment modes correctly:
  - **CENTRE**: Axis line passes through both points
  - **LEFT**: OrbitArea extends only to the right of the axis line
  - **RIGHT**: OrbitArea extends only to the left of the axis line

## Dependencies

- `@deck.gl/core`
- `@deck.gl/layers`
- `@deck.gl/react`
- `geolib`
- `react`
- `react-dom`

## Development

```bash
# Install dependencies
bun install

# Run the development server
bun dev
```
