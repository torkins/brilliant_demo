<template>
  <div class="sidebar">
    <h2>Debug Panel</h2>
    
    <div class="debug-panel">
      <textarea 
        v-model="jsonString"
        placeholder="Stage specification JSON..."
      />
      
      <div class="debug-buttons">
        <button 
          class="debug-button"
          @click="saveJson"
        >
          Save
        </button>
        <button 
          class="debug-button"
          @click="resetJson"
        >
          Reset
        </button>
      </div>
      
      <div
        v-if="error"
        style="color: red; font-size: 12px; margin-top: 10px;"
      >
        {{ error }}
      </div>
    </div>

    <!-- Current Stats -->
    <div style="margin-top: 20px; font-size: 12px; color: #666;">
      <div><strong>Mode:</strong> {{ currentMode }}</div>
      <div><strong>Components:</strong> {{ componentCount }}</div>
      <div><strong>Selected:</strong> {{ selectedComponentId }}</div>
      <div><strong>World Size:</strong> {{ worldSize.width }}m × {{ worldSize.height }}m</div>
      <div><strong>Scale:</strong> {{ metersToPixelsRatio.toFixed(1) }} px/m</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useStageStore } from '@/store'
import type { StageSpec } from '@/types'

const store = useStageStore()
const jsonString = ref('')
const error = ref('')

// Initialize with current stage spec
resetJson()

// Watch for changes in the store to update the JSON display
watch(() => store.stageSpec, () => {
  if (!error.value) {
    resetJson()
  }
}, { deep: true })

// Computed properties for template access
const currentMode = computed(() => store.currentMode)
const componentCount = computed(() => store.stageSpec.components.length)
const selectedComponentId = computed(() => store.selectedComponentId || 'None')
const worldSize = computed(() => store.stageSpec.worldSize)
const metersToPixelsRatio = computed(() => store.metersToPixelsRatio)

function saveJson() {
  try {
    const parsedSpec = JSON.parse(jsonString.value) as StageSpec
    
    // Basic validation
    if (!parsedSpec.version || !parsedSpec.worldSize || !parsedSpec.components) {
      throw new Error('Invalid stage specification format')
    }
    
    if (typeof parsedSpec.worldSize.width !== 'number' || typeof parsedSpec.worldSize.height !== 'number') {
      throw new Error('World size must contain numeric width and height')
    }
    
    if (!Array.isArray(parsedSpec.components)) {
      throw new Error('Components must be an array')
    }
    
    // Validate each component has required fields
    for (const component of parsedSpec.components) {
      if (!component.id || !component.type || !component.position) {
        throw new Error(`Invalid component: ${JSON.stringify(component)}`)
      }
      
      if (typeof component.position.x !== 'number' || typeof component.position.y !== 'number') {
        throw new Error(`Component position must be numeric: ${component.id}`)
      }
    }
    
    store.loadStageSpec(parsedSpec)
    error.value = ''
  } catch (e) {
    error.value = `JSON Error: ${e instanceof Error ? e.message : 'Unknown error'}`
  }
}

function resetJson() {
  jsonString.value = JSON.stringify(store.stageSpec, null, 2)
  error.value = ''
}
</script>