<template>
  <div class="main-stage">
    <div class="canvas-container">
      <canvas 
        ref="canvasRef"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @click="onClick"
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import paper from 'paper'
import { useStageStore } from '@/store'
import { RayRenderer, RayAnimationRenderer } from '@/rendering'
import { ComponentFactory, type BaseComponent } from '@/components/stage'
import { computeRaySegments, computeMirrorImage, computeMirrorImages } from '@/physics'
import { getAllGeometry } from '@/physics/geometry'

const store = useStageStore()
const canvasRef = ref<HTMLCanvasElement>()

const components = new Map<string, BaseComponent>()
const rayRenderer = ref<RayRenderer>()
const rayAnimationRenderer = ref<RayAnimationRenderer>()
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  if (canvasRef.value) {
    setupPaper()
    setupEventListeners()
    renderAllComponents()
  }
})

onUnmounted(() => {
  cleanup()
})

// Watch for component changes
watch(() => store.stageSpec.components, () => {
  renderAllComponents()
}, { deep: true })

// Watch for mode changes
watch(() => store.currentMode, () => {
  if (store.currentMode === 'game') {
    startGame()
  } else {
    store.clearRays()
    // Remove computed phantoms when exiting game mode
    store.stageSpec.components = store.stageSpec.components.filter(
      c => !c.id.startsWith('computed_phantom_')
    )
  }
})

// Watch for window resize with debouncing
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
watch(() => [window.innerWidth, window.innerHeight], () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = setTimeout(() => {
    updateCanvasSize()
  }, 100) // Debounce resize events
})

function setupPaper() {
  if (!canvasRef.value) return
  
  paper.setup(canvasRef.value)
  
  // Enable Paper.js mouse events for global drag handling
  let draggingComponent: BaseComponent | null = null
  
  paper.view.onMouseMove = (event: paper.MouseEvent) => {
    if (draggingComponent) {
      // Delegate to the dragging component's onMouseMove
      draggingComponent.handleMouseMove(event)
    }
  }
  
  paper.view.onMouseUp = (event: paper.MouseEvent) => {
    if (draggingComponent) {
      draggingComponent.handleMouseUp(event)
      draggingComponent = null
    }
  }
  
  // Expose the dragging state setter for components
  ;(paper.view as any).setDraggingComponent = (component: BaseComponent | null) => {
    draggingComponent = component
  }
  
  rayRenderer.value = new RayRenderer(store.metersToPixelsRatio)
  rayAnimationRenderer.value = new RayAnimationRenderer(store.metersToPixelsRatio)
  
  updateCanvasSize()
}

function updateCanvasSize() {
  if (!canvasRef.value || !paper.project) return
  
  const container = canvasRef.value.parentElement
  if (!container) return
  
  // Get the actual available space - use full container size minus small padding
  const containerRect = container.getBoundingClientRect?.() || { width: container.clientWidth || 800, height: container.clientHeight || 600 }
  const containerWidth = Math.max(400, containerRect.width - 20) // Fill width with minimal padding
  const containerHeight = Math.max(300, containerRect.height - 20) // Fill height with minimal padding
  // Container size: ${containerWidth}x${containerHeight}
  
  // Ensure we have valid dimensions
  if (containerWidth <= 0 || containerHeight <= 0) {
    return
  }
  
  // Use store's world size as source of truth
  const worldWidth = store.stageSpec.worldSize.width
  
  // Pixels to meters ratio is determined by width
  const scale = containerWidth / worldWidth
  
  // Only update if scale changed significantly to prevent infinite loops
  const currentScale = store.metersToPixelsRatio
  if (currentScale > 0 && Math.abs(scale - currentScale) < 1) {
    // Allow the update but don't trigger excessive renders
    if (paper.view?.viewSize && components.size > 0) {
      return
    }
  }
  
  // Store's world size is the source of truth
  
  store.updateMetersToPixelsRatio(scale)
  
  // Canvas size should match container size
  const canvasWidth = Math.round(containerWidth)
  const canvasHeight = Math.round(containerHeight)
  
  // Only update canvas size if it actually changed
  if (canvasRef.value.width !== canvasWidth || canvasRef.value.height !== canvasHeight) {
    if (paper.view) {
      paper.view.viewSize = new paper.Size(canvasWidth, canvasHeight)
    }
  }
  
  // Update all components
  components.forEach(component => {
    component.updateMetersToPixelsRatio(scale)
  })
  
  if (rayRenderer.value) {
    rayRenderer.value.updateMetersToPixelsRatio(scale)
  }
  
  if (rayAnimationRenderer.value) {
    rayAnimationRenderer.value.updateMetersToPixelsRatio(scale)
  }
}

function setupEventListeners() {
  window.addEventListener('resize', updateCanvasSize)
  
  // Use ResizeObserver for better container size monitoring
  if (canvasRef.value?.parentElement && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      updateCanvasSize()
    })
    resizeObserver.observe(canvasRef.value.parentElement)
  }
}

function renderAllComponents() {
  // Remove existing components
  components.forEach(component => component.destroy())
  components.clear()
  
  // Create new components
  store.stageSpec.components.forEach(spec => {
    // Handle phantom visibility based on mode
    if (spec.type === 'phantom') {
      if (store.currentMode !== 'game' && store.currentMode !== 'edit' && store.currentMode !== 'sandbox') {
        return // Hide phantoms in modes other than game, edit, and sandbox
      }
    }
    
    // Determine if phantom should be clickable in game mode
    const isClickable = store.currentMode === 'game' && spec.type === 'phantom'
    
    const component = ComponentFactory.create(spec, store, store.metersToPixelsRatio, { isClickable })
    component.render()
    components.set(spec.id, component)
    
    // Set selection and hover states
    if (spec.id === store.selectedComponentId) {
      component.setSelected(true)
    }
  })
  
  if (paper.view) paper.view.update()
}

function onMouseDown(_: MouseEvent) {
  // Handle canvas background clicks - deselect any selected component
  store.selectComponent(null)
}

function onMouseMove(_: MouseEvent) {
  // Mouse move handling is done by individual components
}

function onMouseUp(_: MouseEvent) {
  // Mouse up handling is done by individual components
}

function onClick(_: MouseEvent) {
  // Click handling is done by individual components
}

function startGame() {
  const viewer = store.getViewer
  if (!viewer) return
  
  // Compute rays to find if we hit a bunny
  const geometries = getAllGeometry(store.stageSpec.components)
  const raySegments = computeRaySegments(geometries, viewer, 50)
  
  // Check if we have mirror images
  const mirrorImageData = computeMirrorImages(raySegments)
  if (mirrorImageData.length === 0) {
    console.log('[Game Mode] No mirror images found - cannot start game')
    return
  }

  //we care about the first one
  const mirrorImage = mirrorImageData[0]
  
  //create a phantom at the mirror image position as the correct one
  const phantomId = `computed_phantom_${Date.now()}`
  const phantomSpec = {
    id: phantomId,
    type: 'phantom',
    position: mirrorImage.position,
    rotation: mirrorImage.rotation,
    scale: mirrorImage.scale || 1
  }
  store.stageSpec.components.push(phantomSpec)
  store.setCorrectPhantom(phantomId)

  setTimeout(async () => {
    if (rayAnimationRenderer.value && store.currentMode === 'game') {
      console.log(`[Game Mode] Starting automatic ray animation`)
      
      // Hide regular ray rendering
      if (rayRenderer.value) {
        rayRenderer.value.clear()
      }
      
      // Start animation without mirror image lines (empty array)
      await rayAnimationRenderer.value.animateReverseRay(raySegments, [])
    }
  }, 500) // Small delay to let components render first
  renderAllComponents()
}

async function animateReverseRay() {
  if (!rayAnimationRenderer.value ) {
    console.log('[MainStage] Cannot animate: no animation renderer')
    return
  }

  const viewer = store.getViewer
  if (!viewer) return
  
  // Compute rays to find if we hit a bunny
  const geometries = getAllGeometry(store.stageSpec.components)
  const raySegments = computeRaySegments(geometries, viewer, 50)

  // compute mirror image data for all segments but last, using the physics package
  const mirrorImageData = computeMirrorImages(raySegments)

  // clear previous mirror images and add new ones
  store.stageSpec.components = store.stageSpec.components.filter(c => !c.id.startsWith('computed_mirror_'))
  mirrorImageData.forEach((mirror, index) => {
    const imageId = `computed_mirror_${Date.now()}_${index}`
    const imageSpec = {
      id: imageId,
      type: 'mirror_image',
      position: mirror.position,
      rotation: mirror.rotation,
      scale: mirror.scale || 1
    }
    store.stageSpec.components.push(imageSpec)
  })
  
  console.log('[MainStage] Starting reverse ray animation with', raySegments.length, 'segments and', mirrorImageData.length, 'mirror images')
  
  // Hide the regular ray rendering during animation
  if (rayRenderer.value) {
    rayRenderer.value.clear()
  }
  
  // Start the animation
  await rayAnimationRenderer.value.animateReverseRay(raySegments, mirrorImageData)
}

async function animateUnfoldRay() {
  if (!rayAnimationRenderer.value || !store.getViewer) {
    console.log('[MainStage] Cannot animate unfold: no animation renderer')
    return
  }
  const geometries = getAllGeometry(store.stageSpec.components)
  const raySegments = computeRaySegments(geometries, store.getViewer, 50)

  // Start the unfold animation
  await rayAnimationRenderer.value.animateUnfoldRay(raySegments)
}

function cleanup() {
  window.removeEventListener('resize', updateCanvasSize)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  components.forEach(component => component.destroy())
  components.clear()
  rayRenderer.value?.destroy()
  rayAnimationRenderer.value?.destroy()
}

// Expose functions for external use
defineExpose({
  animateReverseRay,
  animateUnfoldRay
})
</script>