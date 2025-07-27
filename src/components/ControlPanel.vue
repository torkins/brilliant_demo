<template>
  <div class="sidebar">
    <h2>Ray Reflection Game</h2>
    
    <!-- Mode Selection -->
    <div class="mode-buttons">
      <button 
        v-for="mode in modes" 
        :key="mode"
        class="mode-button"
        :class="{ active: store.currentMode === mode }"
        @click="store.setMode(mode)"
      >
        {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
      </button>
    </div>

    <!-- Components (Edit Mode Only) -->
    <div v-if="store.isEditMode">
      <h3>Components</h3>
      <div class="component-buttons">
        <button 
          v-for="type in componentTypes" 
          :key="type"
          class="component-button"
          @click="store.addComponent(type)"
        >
          Add {{ type.charAt(0).toUpperCase() + type.slice(1) }}
        </button>
      </div>
      
      <!-- Clear Board Button -->
      <div style="text-align: center; margin-top: 15px;">
        <button 
          class="component-button clear-button"
          style="background-color: #dc3545; color: white; width: 100%;"
          @click="clearBoard"
        >
          Clear Board
        </button>
      </div>
    </div>

    <!-- Test Button (Sandbox Mode Only) -->
    <div v-if="store.isSandboxMode">
      <button 
        class="test-button"
        :disabled="!store.getViewer"
        style="margin-top: 8px;"
        @click="animateRay"
      >
        🎬 Animate Ray
      </button>
      
    </div>

    <!-- Game Instructions (Game Mode Only) -->
    <div v-if="store.isGameMode">
      <div class="game-instructions">
        <h3>🎯 Mirror Image Game</h3>
        <p>Watch the ray animation, then click on the phantom bunny that represents where the viewer sees the bunny through the mirrors.</p>
        <div class="instruction-hint">
          💡 The ray shows the light path from bunny to viewer - click where you think the viewer perceives the bunny to be!
        </div>

        <button 
          class="test-button"
          style="margin-top: 8px;"
          @click="unfoldRay"
        >
          📐 Show Solution
        </button>
      </div>
    </div>

    <!-- Game Feedback (Game Mode Only) -->
    <div v-if="store.isGameMode && store.gameResult">
      <div 
        class="game-feedback"
        :class="store.gameResult"
      >
        {{ store.gameResult === 'correct' ? '🎉 Correct!' : '❌ Try again!' }}
      </div>
    </div>

    <!-- AI Prompt Generator (Edit Mode Only) -->
    <div
      v-if="store.isEditMode"
      class="llm-generator"
    >
      <h3>AI Prompt Generator</h3>
      
      <div class="form-group">
        <label>Describe your scene</label>
        <textarea 
          v-model="userPrompt"
          placeholder="e.g., Create a scene with a viewer looking at a bunny through two mirrors..."
          rows="4"
          style="width: 100%; margin-bottom: 10px; resize: vertical;"
        />
      </div>
      
      <button 
        class="component-button"
        :disabled="!userPrompt"
        style="width: 100%; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 8px;"
        @click="generatePrompt"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect
            x="9"
            y="9"
            width="13"
            height="13"
            rx="2"
            ry="2"
          />
          <path d="m5 15-4 0 0-4" />
          <path d="m5 9-4 0 0-2" />
          <path d="m1 5l4 0 0-4" />
        </svg>
        Copy AI Prompt
      </button>
      
      <!-- Success overlay -->
      <div
        v-if="showCopySuccess"
        class="copy-success-overlay"
      >
        ✅ Prompt copied to clipboard!
      </div>
    </div>

    <!-- Component Options Panel -->
    <div
      v-if="selectedComponent"
      class="component-options"
    >
      <h3>{{ selectedComponent.type.charAt(0).toUpperCase() + selectedComponent.type.slice(1) }} Options</h3>
      
      <div class="form-group">
        <label>Position X (m)</label>
        <input 
          type="number" 
          step="0.25"
          :value="isEditingPositionX ? positionXInputValue : selectedComponent.position.x"
          @input="handlePositionInput('x', ($event.target as HTMLInputElement).value)"
          @focus="startEditingPosition('x')"
          @blur="finishEditingPosition('x')"
          @keydown.enter="finishEditingPosition('x')"
        >
      </div>
      
      <div class="form-group">
        <label>Position Y (m)</label>
        <input 
          type="number" 
          step="0.25"
          :value="isEditingPositionY ? positionYInputValue : selectedComponent.position.y"
          @input="handlePositionInput('y', ($event.target as HTMLInputElement).value)"
          @focus="startEditingPosition('y')"
          @blur="finishEditingPosition('y')"
          @keydown.enter="finishEditingPosition('y')"
        >
      </div>

      <div
        v-if="'orientation' in selectedComponent"
        class="form-group"
      >
        <label>Orientation (degrees)</label>
        <input 
          type="number" 
          step="5"
          :value="isEditingOrientation ? orientationInputValue : radiansToDegrees(selectedComponent.orientation)"
          @input="handleOrientationInput(($event.target as HTMLInputElement).value)"
          @focus="startEditingOrientation"
          @blur="finishEditingOrientation"
          @keydown.enter="finishEditingOrientation"
          @keydown="handleOrientationKeydown"
        >
      </div>

      <div
        v-if="'length' in selectedComponent"
        class="form-group"
      >
        <label>Length (m)</label>
        <input 
          type="number" 
          step="0.25"
          min="0.5"
          max="10"
          :value="isEditingLength ? lengthInputValue : selectedComponent.length"
          @input="handleLengthInput(($event.target as HTMLInputElement).value)"
          @focus="startEditingLength"
          @blur="finishEditingLength"
          @keydown.enter="finishEditingLength"
          @keydown="handleLengthKeydown"
        >
      </div>

      <button 
        class="component-button" 
        style="background-color: #dc3545; color: white; margin-top: 10px;"
        @click="deleteComponent"
      >
        Delete Component
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { radiansToDegrees, degreesToRadians } from '@/utils/conversion';

// Define emits
const emit = defineEmits<{
  'animate-ray': []
  'unfold-ray': []
}>()

import { useStageStore } from '@/store'
import type { AppMode, ComponentType } from '@/types'

const store = useStageStore()

// Local state for input fields to prevent re-render issues
const isEditingOrientation = ref(false)
const orientationInputValue = ref('')
const isEditingPositionX = ref(false)
const positionXInputValue = ref('')
const isEditingPositionY = ref(false)
const positionYInputValue = ref('')
const isEditingLength = ref(false)
const lengthInputValue = ref('')

// AI prompt generation state
const userPrompt = ref('')
const showCopySuccess = ref(false)

const modes: AppMode[] = ['edit', 'sandbox', 'game']
const componentTypes: ComponentType[] = ['viewer', 'wall', 'mirror', 'bunny', 'phantom']

const selectedComponent = computed(() => {
  return store.selectedComponentId ? store.getComponentById(store.selectedComponentId) : null
})

// New orientation input handlers to prevent re-render issues
function startEditingOrientation() {
  if (!selectedComponent.value || !('orientation' in selectedComponent.value)) return
  
  isEditingOrientation.value = true
  orientationInputValue.value = radiansToDegrees(selectedComponent.value.orientation).toString()
}

function handleOrientationInput(value: string) {
  if (isEditingOrientation.value) {
    orientationInputValue.value = value
    
    // Immediately update the component rotation for live feedback
    if (selectedComponent.value && 'orientation' in selectedComponent.value) {
      const degrees = parseFloat(value)
      if (!isNaN(degrees)) {
        const radians = degreesToRadians(degrees)
        store.rotateComponent(selectedComponent.value.id, radians)
      }
    }
  }
}

function handleOrientationKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement
  const currentValue = parseFloat(target.value) || 0
  const step = 5 // degrees
  
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    const snappedValue = Math.round((currentValue + step) / step) * step
    target.value = snappedValue.toString()
    handleOrientationInput(snappedValue.toString())
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    const snappedValue = Math.round((currentValue - step) / step) * step
    target.value = snappedValue.toString()
    handleOrientationInput(snappedValue.toString())
  }
}

function finishEditingOrientation() {
  if (!isEditingOrientation.value) return
  
  isEditingOrientation.value = false
  // Rotation is already applied during typing, just stop editing
}

// Position input handlers
function startEditingPosition(axis: 'x' | 'y') {
  if (!selectedComponent.value) return
  
  if (axis === 'x') {
    isEditingPositionX.value = true
    positionXInputValue.value = selectedComponent.value.position.x.toString()
  } else {
    isEditingPositionY.value = true
    positionYInputValue.value = selectedComponent.value.position.y.toString()
  }
}

function handlePositionInput(axis: 'x' | 'y', value: string) {
  if (axis === 'x' && isEditingPositionX.value) {
    positionXInputValue.value = value
  } else if (axis === 'y' && isEditingPositionY.value) {
    positionYInputValue.value = value
  }
  
  // Immediately update the component position for live feedback
  if (selectedComponent.value) {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      const newPosition = { ...selectedComponent.value.position }
      newPosition[axis] = numValue
      store.moveComponent(selectedComponent.value.id, newPosition)
    }
  }
}

function finishEditingPosition(axis: 'x' | 'y') {
  if (axis === 'x' && isEditingPositionX.value) {
    isEditingPositionX.value = false
  } else if (axis === 'y' && isEditingPositionY.value) {
    isEditingPositionY.value = false
  }
  // Position is already applied during typing, just stop editing
}

// Length input handlers
function startEditingLength() {
  if (!selectedComponent.value || !('length' in selectedComponent.value)) return
  
  isEditingLength.value = true
  lengthInputValue.value = selectedComponent.value.length.toString()
}

function handleLengthInput(value: string) {
  if (isEditingLength.value) {
    lengthInputValue.value = value
    
    // Immediately update the component length for live feedback
    if (selectedComponent.value && 'length' in selectedComponent.value) {
      const length = parseFloat(value)
      if (!isNaN(length) && length >= 0.5 && length <= 10) {
        store.resizeComponent(selectedComponent.value.id, length)
      }
    }
  }
}

function handleLengthKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement
  const currentValue = parseFloat(target.value) || 0
  const step = 0.25 // meters
  
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    const snappedValue = Math.round((currentValue + step) / step) * step
    if (snappedValue <= 10) {
      target.value = snappedValue.toString()
      handleLengthInput(snappedValue.toString())
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    const snappedValue = Math.round((currentValue - step) / step) * step
    if (snappedValue >= 0.5) {
      target.value = snappedValue.toString()
      handleLengthInput(snappedValue.toString())
    }
  }
}

function finishEditingLength() {
  if (!isEditingLength.value) return
  
  isEditingLength.value = false
  // Length is already applied during typing, just stop editing
}

function deleteComponent() {
  if (!selectedComponent.value) return
  store.deleteComponent(selectedComponent.value.id)
}

function clearBoard() {
  // Remove all components from the stage
  store.stageSpec.components = []
  // Clear any selected component
  store.selectComponent(null)
  // Clear any rays
  store.clearRays()
}

function animateRay() {
  console.log('[ControlPanel] Triggering ray animation')
  emit('animate-ray')
}

function unfoldRay() {
  console.log('[ControlPanel] Triggering unfold ray animation')
  emit('unfold-ray')
  console.log('[Clear Board] All components removed from stage')
}

async function generatePrompt() {
  if (!userPrompt.value) return
  
  try {
    const fullPrompt = `You are an AI assistant helping to generate specifications for a ray reflection physics game. The game simulates light rays bouncing off mirrors and hitting objects.

GAME WORLD:
- 2D coordinate system with positions in meters
- World size is typically 15m wide × 10m high  
- Origin (0,0) is at top-left corner
- X increases rightward, Y increases downward

AVAILABLE COMPONENTS:
1. VIEWER: Emits light rays
   - Has position (x, y) and orientation (radians)
   - 0 radians = pointing right, π/2 = pointing down, π = pointing left, 3π/2 = pointing up
   - Example: { "id": "viewer1", "type": "viewer", "position": {"x": 2, "y": 5}, "orientation": 0 }

2. MIRROR: Reflects light rays
   - Has position (x, y), orientation (radians), and length (meters)
   - Orientation is the angle of the mirror surface
   - Example: { "id": "mirror1", "type": "mirror", "position": {"x": 7, "y": 3}, "orientation": 0.785, "length": 2 }

3. WALL: Absorbs light rays (stops them)
   - Has position (x, y), orientation (radians), and length (meters)
   - Example: { "id": "wall1", "type": "wall", "position": {"x": 10, "y": 4}, "orientation": 1.57, "length": 3 }

4. BUNNY: Target object that stops rays
   - Has position (x, y) only
   - Example: { "id": "bunny1", "type": "bunny", "position": {"x": 12, "y": 6} }
5. PHANTOM: In Game mode, PHANTOMs represent possible locations for the mirror image the Bunny forms.  They should be placed at plausible but incorrect 
where a viewer with a misunderstanding of mirror image positioning might think the bunny is (for example a plausible but incorrect distance). The positions
should be located to be clearly distinct from the actual mirror image so it isn't confusing for the player.
   - Has position (x, y) only
   - Example: { "id": "phantom1", "type": "phantom", "position": {"x": 14, "y": 8} }


COMPLETE EXAMPLE SCENES:

Example 1 - Simple mirror reflection:
{
  "version": "1.0",
  "worldSize": {
    "width": 15,
    "height": 10
  },
  "components": [
    { "id": "viewer1", "type": "viewer", "position": {"x": 2, "y": 5}, "orientation": 0 },
    { "id": "mirror1", "type": "mirror", "position": {"x": 8, "y": 5}, "orientation": 0.785, "length": 2 },
    { "id": "bunny1", "type": "bunny", "position": {"x": 8, "y": 2} }
  ]
}

Example 2 - Complex multi-mirror setup:
{
  "version": "1.0",
  "worldSize": {
    "width": 15,
    "height": 10
  },
  "components": [
    { "id": "viewer1", "type": "viewer", "position": {"x": 1, "y": 8}, "orientation": 0 },
    { "id": "mirror1", "type": "mirror", "position": {"x": 5, "y": 8}, "orientation": 1.57, "length": 2 },
    { "id": "mirror2", "type": "mirror", "position": {"x": 5, "y": 3}, "orientation": 0, "length": 2 },
    { "id": "wall1", "type": "wall", "position": {"x": 12, "y": 5}, "orientation": 1.57, "length": 4 },
    { "id": "bunny1", "type": "bunny", "position": {"x": 10, "y": 3} }
  ]
}

Example 3 - Maze-like puzzle:
{
  "version": "1.0",
  "worldSize": {
    "width": 15,
    "height": 10
  },
  "components": [
    { "id": "viewer1", "type": "viewer", "position": {"x": 1, "y": 1}, "orientation": 1.57 },
    { "id": "wall1", "type": "wall", "position": {"x": 7, "y": 2}, "orientation": 0, "length": 3 },
    { "id": "wall2", "type": "wall", "position": {"x": 3, "y": 6}, "orientation": 1.57, "length": 2 },
    { "id": "mirror1", "type": "mirror", "position": {"x": 6, "y": 8}, "orientation": 2.356, "length": 2 },
    { "id": "mirror2", "type": "mirror", "position": {"x": 12, "y": 7}, "orientation": 0.785, "length": 2 },
    { "id": "bunny1", "type": "bunny", "position": {"x": 13, "y": 3} }
  ]
}

IMPORTANT RULES:
- Onleate coypes: "viewer", "mirror", "wall", "bunny"
- Do NOT create "phantom" or "mirror_image" components (these are generated automatically)
- Always include exactly one viewer
- Use realistic positions within the 15×10 world bounds
- Orientations are in radians (0 to 2π): 0=right, π/2=down, π=left, 3π/2=up
- Mirror/wall lengths should be 1-4 meters typically
- Generate unique IDs for each component
- Consider ray physics: light reflects off mirrors at equal angles, walls absorb rays
- Plan the ray path so the viewer can potentially see the bunny through reflections

OUTPUT FORMAT: Provide only a valid JSON object with the complete StageSpec structure (version, worldSize, components). No other text.

User Request: "${userPrompt.value}"`
    
    // Copy to clipboard
    await navigator.clipboard.writeText(fullPrompt)
    
    // Show success message
    showCopySuccess.value = true
    setTimeout(() => {
      showCopySuccess.value = false
    }, 2000)
    
    console.log('[Prompt Generator] Prompt copied to clipboard')
    
  } catch (error) {
    console.error('[Prompt Generator] Error copying to clipboard:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = fullPrompt
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    
    showCopySuccess.value = true
    setTimeout(() => {
      showCopySuccess.value = false
    }, 2000)
  }
}
</script>

<style scoped>
.copy-success-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #28a745;
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
}

.llm-generator {;
}

.game-instructions {
  background-color: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.game-instructions h3 {
  margin: 0 0 12px 0;
  color: #1976d2;
}

.game-instructions p {
  margin: 0 0 12px 0;
  line-height: 1.4;
  color: #333;
}

.instruction-hint {
  background-color: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 8px 12px;
  font-size: 14px;
  color: #e65100;
  border-radius: 0 4px 4px 0;
  position: relative;
}
</style>