# Architecture

## Overview

Ray reflection physics game built with Vue 3 + TypeScript + Paper.js. Users place mirrors and objects, trace light rays, and play guessing games about mirror images.

## Directory Structure

```
src/
├── types/           # TypeScript type definitions
├── store/           # Pinia state management  
├── utils/           # Math and conversion utilities
├── physics/         # Ray tracing and mirror image calculations
├── rendering/       # Canvas rendering classes
├── components/      # Vue components
│   ├── stage/       # Interactive canvas components
│   └── *.vue        # UI panels
└── tests/           # Test files
```

## Core Architecture

### 1. Types (`/src/types/`)
- Foundation layer with zero dependencies
- Defines all interfaces: `ComponentSpec`, `RaySegment`, `Vec2`, etc.
- Shared by all other modules

### 2. Store (`/src/store/`)
- Centralized Pinia store for all application state
- Manages: components, ray segments, current mode, selections
- Key methods: `addComponent()`, `setRaySegments()`, `setMode()`

### 3. Physics (`/src/physics/`)
- `index.ts`: Ray computation and mirror image calculation
- `geometry.ts`: Converts component specs to collision geometry
- Pure functions, no side effects

### 4. Rendering (`/src/rendering/`)
- `RayRenderer.ts`: Static ray visualization
- `RayAnimationRenderer.ts`: Animated ray effects
- Paper.js integration for canvas drawing

### 5. Components (`/src/components/`)
- **UI Panels**: `ControlPanel.vue`, `MainStage.vue`, `DebugPanel.vue`
- **Stage Components**: Interactive canvas objects inheriting from `BaseComponent`
- **ComponentFactory**: Creates stage components based on type

## Key Data Flows

### Component Management Flow
1. User clicks "Add Mirror" in ControlPanel
2. ControlPanel calls `store.addComponent('mirror')`
3. Store creates component spec and adds to `stageSpec.components`
4. MainStage watches store and re-renders all components
5. ComponentFactory creates MirrorComponent instance
6. Component renders on Paper.js canvas

### Ray Tracing Flow
1. User clicks "Test Rays" in ControlPanel (sandbox mode)
2. ControlPanel calls physics functions directly
3. `computeRaySegments()` traces ray through geometry
4. `computeMirrorImage()` calculates where bunny appears to viewer
5. Store updates with ray segments and mirror image components
6. MainStage re-renders to show rays and mirror images

### Mode Switching Flow
1. User clicks mode button in ControlPanel
2. ControlPanel calls `store.setMode(newMode)`
3. MainStage watches mode changes:
   - Game mode: runs `startGame()`, computes phantoms, starts animation
   - Other modes: clears rays and computed phantoms
4. Components update visibility based on mode

### Game Flow
1. Switch to game mode triggers `startGame()`
2. Computes mirror image position
3. Creates computed phantom at mirror image location
4. Finds user-placed phantom closest to computed position
5. Sets closest phantom as correct answer
6. Automatically starts ray animation
7. User clicks phantom to guess
8. Store validates guess and shows result

## Component Architecture

### BaseComponent
- Abstract base class for all interactive canvas objects
- Handles: Paper.js rendering, mouse events, selection, transforms
- Provides: `render()`, `update()`, `destroy()`, event handlers

### Specialized Components
- **ViewerComponent**: Emits rays, has orientation
- **MirrorComponent**: Reflects rays, has orientation and length
- **WallComponent**: Absorbs rays, has orientation and length  
- **BunnyComponent**: Target object, stops rays
- **PhantomBunnyComponent**: Semi-transparent, for game mode

### ComponentFactory
- Creates appropriate component instance based on spec type
- Handles component configuration and options
- Single entry point for component creation

## State Management

### Core State Structure
```typescript
{
  stageSpec: {
    worldSize: { width: 15, height: 10 },
    components: ComponentSpec[]
  },
  currentMode: 'edit' | 'sandbox' | 'game',
  selectedComponentId: string | null,
  raySegments: RaySegment[],
  gameResult: 'correct' | 'incorrect' | null,
  correctPhantomId: string | null
}
```

### Key Store Methods
- `addComponent(type)`: Creates new component
- `selectComponent(id)`: Sets selection
- `setMode(mode)`: Changes application mode
- `setRaySegments(segments)`: Updates ray visualization
- `checkPhantomGuess(id)`: Game logic for phantom selection

## Rendering System

### Paper.js Integration
- Each component creates Paper.js items for visualization
- MainStage manages Paper.js view and coordinates rendering
- Components handle their own visual state and interactions

### Animation System
- `RayAnimationRenderer` creates smooth ray animations
- Supports reverse ray (bunny to viewer) and unfold animations
- Uses Paper.js animation framework for smooth transitions

## Physics Engine

### Ray Computation
- `computeRaySegments()`: Traces ray through scene geometry
- Handles reflections off mirrors, absorption by walls
- Returns array of ray segments with hit information

### Mirror Image Calculation
- `computeMirrorImage()`: Calculates apparent position of object
- Uses ray path and object position to determine image location
- Accounts for multiple reflections

## Testing Strategy

### Test Categories
- **Unit Tests**: Math utilities, physics calculations (pure functions)
- **Component Tests**: UI behavior, state management
- **Integration Tests**: Full workflows across multiple components

### Key Test Files
- `physics.test.ts`: Ray tracing and mirror image logic
- `math.test.ts`: Vector operations and geometric calculations
- `ui-components.test.ts`: Vue component behavior
- `integration.test.ts`: End-to-end workflows

## Build and Development

### Tech Stack
- Vue 3 with Composition API
- TypeScript for type safety
- Pinia for state management
- Paper.js for canvas rendering
- Vite for build tooling
- Vitest for testing

### Key Scripts
- `npm run dev`: Development server
- `npm run build`: Production build
- `npm run test`: Run test suite
- `npm run lint`: Code linting