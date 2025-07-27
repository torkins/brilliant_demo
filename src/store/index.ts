import { defineStore } from 'pinia'
import type { 
  StageSpec, 
  ComponentSpec, 
  AppMode, 
  ComponentType, 
  ViewerSpec,
  WallSpec,
  MirrorSpec,
  BunnySpec,
  PhantomSpec,
  RaySegment,
  Vec2,
  Meter 
} from '@/types'

export const useStageStore = defineStore('stage', {
  state: () => ({
    currentMode: 'edit' as AppMode,
    selectedComponentId: null as string | null,
    stageSpec: {
      version: '1.0.0',
      worldSize: {
        width: 16,
        height: 12
      },
      components: []
    } as StageSpec,
    raySegments: [] as RaySegment[],
    mirrorImageBunnies: [] as ComponentSpec[],
    metersToPixelsRatio: 50,
    gridSize: 0.5,
    correctPhantomId: null as string | null,
    gameResult: null as 'correct' | 'incorrect' | null
  }),

  getters: {
    getComponentById: (state) => (id: string): ComponentSpec | undefined => {
      return state.stageSpec.components.find(comp => comp.id === id)
    },

    getViewer: (state): ViewerSpec | undefined => {
      return state.stageSpec.components.find(comp => comp.type === 'viewer') as ViewerSpec
    },

    getComponentsByType: (state) => (type: ComponentType): ComponentSpec[] => {
      return state.stageSpec.components.filter(comp => comp.type === type)
    },

    getBunnies: (state): ComponentSpec[] => {
      return state.stageSpec.components.filter(comp => comp.type === 'bunny')
    },

    getPhantoms: (state): ComponentSpec[] => {
      return state.stageSpec.components.filter(comp => comp.type === 'phantom')
    },

    isEditMode: (state): boolean => state.currentMode === 'edit',
    isSandboxMode: (state): boolean => state.currentMode === 'sandbox',
    isGameMode: (state): boolean => state.currentMode === 'game'
  },

  actions: {
    setMode(mode: AppMode) {
      this.currentMode = mode
      this.selectedComponentId = null
      this.clearRays()
      this.gameResult = null
    },

    selectComponent(id: string | null) {
      this.selectedComponentId = id
    },

    addComponent(type: ComponentType) {
      const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const centerX = this.stageSpec.worldSize.width / 2
      const centerY = this.stageSpec.worldSize.height / 2
      
      let newComponent: ComponentSpec

      switch (type) {
        case 'viewer':
          newComponent = {
            id,
            type: 'viewer',
            position: { x: centerX, y: centerY },
            orientation: 0
          } as ViewerSpec
          break
        case 'wall':
          newComponent = {
            id,
            type: 'wall',
            position: { x: centerX, y: centerY },
            orientation: 0,
            length: 2
          } as WallSpec
          break
        case 'mirror':
          newComponent = {
            id,
            type: 'mirror',
            position: { x: centerX, y: centerY },
            orientation: 0,
            length: 2
          } as MirrorSpec
          break
        case 'bunny':
          newComponent = {
            id,
            type: 'bunny',
            position: { x: centerX, y: centerY }
          } as BunnySpec
          break
        case 'phantom':
          newComponent = {
            id,
            type: 'phantom',
            position: { x: centerX, y: centerY }
          } as PhantomSpec
          break
        default:
          throw new Error(`Unknown component type: ${type}`)
      }

      this.stageSpec.components.push(newComponent)
      this.selectedComponentId = id
    },

    updateComponent(id: string, updates: Partial<ComponentSpec>) {
      const index = this.stageSpec.components.findIndex(comp => comp.id === id)
      if (index !== -1) {
        this.stageSpec.components[index] = { ...this.stageSpec.components[index], ...updates }
      }
    },

    deleteComponent(id: string) {
      this.stageSpec.components = this.stageSpec.components.filter(comp => comp.id !== id)
      if (this.selectedComponentId === id) {
        this.selectedComponentId = null
      }
    },

    moveComponent(id: string, position: Vec2) {
      const snappedPosition = this.snapToGrid(position)
      
      // Constrain to world bounds
      const constrainedPosition = {
        x: Math.max(0, Math.min(this.stageSpec.worldSize.width, snappedPosition.x)),
        y: Math.max(0, Math.min(this.stageSpec.worldSize.height, snappedPosition.y))
      }
      
      this.updateComponent(id, { position: constrainedPosition })
    },

    rotateComponent(id: string, orientation: number) {
      const snappedOrientation = this.snapAngle(orientation)
      this.updateComponent(id, { orientation: snappedOrientation })
    },

    resizeComponent(id: string, length: Meter) {
      const clampedLength = Math.max(0.5, Math.min(10, length))
      this.updateComponent(id, { length: clampedLength })
    },

    snapToGrid(position: Vec2): Vec2 {
      return {
        x: Math.round(position.x / this.gridSize) * this.gridSize,
        y: Math.round(position.y / this.gridSize) * this.gridSize
      }
    },

    snapAngle(angle: number): number {
      // 5 degrees in radians
      const snapIncrement = Math.PI / 36 // 5 degrees
      return Math.round(angle / snapIncrement) * snapIncrement
    },

    setRaySegments(segments: RaySegment[]) {
      this.raySegments = segments
    },

    setMirrorImageBunnies(bunnies: ComponentSpec[]) {
      this.mirrorImageBunnies = bunnies
    },

    clearRays() {
      this.raySegments = []
      this.mirrorImageBunnies = []
    },

    updateMetersToPixelsRatio(ratio: number) {
      this.metersToPixelsRatio = ratio
    },

    loadStageSpec(spec: StageSpec) {
      this.stageSpec = spec
      this.selectedComponentId = null
      this.clearRays()
    },

    setCorrectPhantom(phantomId: string) {
      this.correctPhantomId = phantomId
    },

    checkPhantomGuess(phantomId: string) {
      this.gameResult = phantomId === this.correctPhantomId ? 'correct' : 'incorrect'
    },

    resetGame() {
      this.gameResult = null
      this.correctPhantomId = null
    }
  },

  persist: true
})

export type StageStore = ReturnType<typeof useStageStore>