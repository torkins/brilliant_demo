# Mirror Image Computation Architecture

This document explains the flow of mirror image computation in the ray reflection game, from ray tracing to visual rendering.

## Overview

The mirror image system computes where a bunny appears to be located when viewed through mirrors, then renders this virtual image on the stage. The system works differently in sandbox mode (shows mirror image) vs game mode (generates phantom bunnies for guessing).

## Core Components

### 1. Ray Computation (`src/physics/index.ts`)

#### `computeRaySegments(geometries, viewer, maxLength)`
- **Input**: Component geometries, viewer position/orientation, max ray length
- **Process**: 
  - Traces ray from viewer through mirrors with reflections
  - Handles up to 10 bounces with reflection physics
  - Stops at walls or bunnies (absorbing surfaces)
- **Output**: Array of `RaySegment` objects with origin, direction, length, hit info

#### `computeMirrorImage(raySegments, bunnyPosition)`
- **Input**: Ray segments from ray tracing, bunny position that was hit
- **Process**:
  - Calculates total ray path length through all segments
  - Gets final ray direction from last segment
  - Places mirror image at same distance from viewer along final ray direction
  - Formula: `mirrorImagePos = viewer + normalize(finalDirection) * totalRayLength`
- **Output**: Computed mirror image position in world coordinates (meters)

### 2. Sandbox Mode Flow (`src/components/ControlPanel.vue`)

#### `runTest()` Function
1. **Ray Tracing**: Calls `computeRaySegments()` to trace rays from viewer
2. **Hit Detection**: Checks if final ray segment hit a bunny
3. **Mirror Image Computation**: If bunny hit, calls `computeMirrorImage()`
4. **Coordinate Conversion**: Converts meter coordinates to pixel coordinates for logging
5. **Visual Rendering**: Creates `MirrorImageSpec` and adds to stage components
6. **Cleanup**: Removes any existing mirror images before adding new one

```typescript
// Key flow in runTest()
const raySegments = computeRaySegments(geometries, viewer, 50)
if (lastSegment?.hitComponentId && hitComponent?.type === 'bunny') {
  const mirrorImagePos = computeMirrorImage(raySegments, hitComponent.position)
  // Create visual representation
  const mirrorImageSpec = {
    id: `mirror_image_${Date.now()}`,
    type: 'mirror_image',
    position: mirrorImagePos
  }
  store.stageSpec.components.push(mirrorImageSpec)
}
```

### 3. Game Mode Flow (`src/components/MainStage.vue`)

#### `startGame()` Function
1. **Ray Tracing**: Same as sandbox mode
2. **Mirror Image Computation**: Same calculation as sandbox
3. **Phantom Generation**: Calls `generatePhantomBunnies()` to create decoy positions
4. **Game Setup**: Marks correct phantom and adds all phantoms to stage
5. **Interactive Elements**: Makes phantoms clickable for guessing game

### 4. Visual Rendering (`src/components/stage/MirrorImageComponent.ts`)

#### `MirrorImageComponent`
- **Purpose**: Renders mirror image as 50% opacity bunny with dashed outline
- **Positioning**: Uses `convertPosition()` to transform meters to pixel coordinates
- **Visual Style**: 
  - 50% alpha on all colors (fill and stroke)
  - Dashed outline (`dashArray`) to distinguish from real bunny
  - Same size and shape as regular bunny
- **Interaction**: Non-interactive (no dragging, no selection)

## Coordinate System Flow

### 1. Physics Calculations (Meters)
- All ray tracing and mirror image computation done in meter coordinates
- World space: `{ x: meters, y: meters }`
- Consistent with component positions and physics

### 2. Coordinate Conversion (Meters → Pixels)
```typescript
// In BaseComponent.convertPosition()
const pixelPos = metersToPixelsVec2(position, this.metersToPixelsRatio)
return new paper.Point(pixelPos.x, pixelPos.y)
```

### 3. Paper.js Rendering (Pixels)
- All visual elements positioned in pixel coordinates
- Paper.js canvas coordinate system
- Scales with viewport and zoom level

## Data Flow Diagram

```
Viewer Position/Orientation
          ↓
    Ray Tracing (Physics)
          ↓
    Ray Segments Array
          ↓
    Hit Detection (Bunny?)
          ↓
  Mirror Image Computation
          ↓
  World Position (Meters)
          ↓
    ┌─────────────────┬─────────────────┐
    ↓                 ↓                 ↓
Sandbox Mode      Game Mode        Visual Rendering
    ↓                 ↓                 ↓
Mirror Image      Phantom Bunnies   Paper.js Canvas
Component         Generation        (Pixel Coords)
```

## Key Files and Responsibilities

| File | Responsibility |
|------|----------------|
| `src/physics/index.ts` | Ray tracing, mirror image math |
| `src/components/ControlPanel.vue` | Sandbox mode testing, ray triggering |
| `src/components/MainStage.vue` | Game mode, phantom generation |
| `src/components/stage/MirrorImageComponent.ts` | Visual mirror image rendering |
| `src/components/stage/ComponentFactory.ts` | Component creation and type handling |
| `src/types/index.ts` | Type definitions for mirror image specs |

## Logging and Debugging

The system includes comprehensive logging at each stage:

1. **Ray Computation**: Logs each ray segment with origin, direction, length, hits
2. **Mirror Image Math**: Logs total ray length, final direction, computed position
3. **Coordinate Conversion**: Logs both meter and pixel coordinates
4. **Component Rendering**: Logs exact pixel positions where components are drawn

## Mode Differences

| Aspect | Sandbox Mode | Game Mode |
|--------|-------------|-----------|
| **Purpose** | Visualization and testing | Interactive guessing game |
| **Mirror Image** | Rendered as semi-transparent bunny | Used to generate phantom positions |
| **Phantoms** | None generated | 5 phantoms including correct answer |
| **Interaction** | Visual only | Clickable phantoms for guessing |
| **Cleanup** | Replaces existing mirror images | Replaces existing phantoms |

## Future Considerations

- **Multiple Mirrors**: Current system handles complex multi-mirror reflections
- **Performance**: Ray tracing is O(n*m) where n=components, m=ray segments
- **Accuracy**: Limited by floating-point precision and pixel alignment
- **Visual Feedback**: Could add animation showing ray path to mirror image