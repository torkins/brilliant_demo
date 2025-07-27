import paper from 'paper'
import type { ComponentSpec, Vec2, Meter } from '@/types'
import type { StageStore } from '@/store'
import { metersToPixelsVec2, pixelsToMetersVec2 } from '@/utils/conversion'

export abstract class BaseComponent {
  protected paperItem: paper.Group | null = null
  protected spec: ComponentSpec
  protected store: StageStore
  protected metersToPixelsRatio: number
  
  // State
  protected isSelected: boolean = false
  protected isDragging: boolean = false
  protected isHovered: boolean = false
  protected isHandleBeingDragged: boolean = false
  
  // Interaction handles
  protected isShowingHandles: boolean = false

  constructor(spec: ComponentSpec, store: StageStore, metersToPixelsRatio: number) {
    // Create a local copy of the spec to avoid reactive store updates during interactions
    this.spec = { ...spec }
    this.store = store
    this.metersToPixelsRatio = metersToPixelsRatio
  }

  // Abstract methods that subclasses must implement
  abstract render(): void
  abstract getGeometry(): any
  protected abstract renderShape(): paper.Item

  // Helper method to check if Paper.js is ready
  protected isPaperReady(): boolean {
    return !!(paper.project && paper.project.activeLayer)
  }

  // Lifecycle methods
  update(spec: ComponentSpec): void {
    this.spec = spec
    this.render()
  }

  destroy(): void {
    if (this.paperItem) {
      this.paperItem.remove()
      this.paperItem = null
    }
  }

  // State management
  setSelected(selected: boolean): void {
    if (this.isSelected === selected) return
    
    this.isSelected = selected
    this.updateVisualState()
  }

  setDragging(dragging: boolean): void {
    this.isDragging = dragging
    this.updateVisualState()
  }

  setHovered(hovered: boolean): void {
    if (this.isHovered === hovered) return
    
    this.isHovered = hovered
    
    this.updateVisualState()
  }

  updateMetersToPixelsRatio(ratio: number): void {
    this.metersToPixelsRatio = ratio
    this.render()
  }

  // Coordinate conversion utilities
  protected convertPosition(position: Vec2): paper.Point {
    const pixelPos = metersToPixelsVec2(position, this.metersToPixelsRatio)
    return new paper.Point(pixelPos.x, pixelPos.y)
  }

  protected convertLength(meters: Meter): number {
    return meters * this.metersToPixelsRatio
  }

  protected pixelPositionToMeters(pixelPos: paper.Point): Vec2 {
    return pixelsToMetersVec2({ x: pixelPos.x, y: pixelPos.y }, this.metersToPixelsRatio)
  }

  // Visual state management
  protected updateVisualState(): void {
    if (!this.paperItem) return
    
    if (this.isSelected) {
      this.paperItem.strokeColor = new paper.Color('blue')
      this.paperItem.strokeWidth = 3
    } else if (this.isHovered) {
      this.paperItem.strokeColor = new paper.Color('lightblue')
      this.paperItem.strokeWidth = 2
    } else {
      this.resetVisualState()
    }
  }

  protected abstract resetVisualState(): void

  // Mouse event handlers - can be overridden by subclasses
  protected onMouseDown(event: paper.MouseEvent): void {
    // Default behavior: start dragging if in appropriate mode
    if (this.canDrag()) {
      this.store.selectComponent(this.spec.id)
      this.setDragging(true)
      
      // Register this component as the dragging component with the global handler
      if (paper.view && (paper.view as any).setDraggingComponent) {
        (paper.view as any).setDraggingComponent(this)
      }
      
      event.stopPropagation()
    }
  }

  protected onMouseMove(event: paper.MouseEvent): void {
    // Default drag behavior - can be overridden by subclasses if needed
    if (!this.isDragging || !this.canDrag()) {
      return
    }
    
    // Convert mouse position to meters and update local spec
    const newPosition = this.pixelPositionToMeters(event.point)
    
    // Clamp to world bounds
    const worldSize = this.store.stageSpec.worldSize
    newPosition.x = Math.max(0, Math.min(worldSize.width, newPosition.x))
    newPosition.y = Math.max(0, Math.min(worldSize.height, newPosition.y))
    
    // Update local spec directly
    this.spec.position = newPosition
    
    // Move the Paper.js object directly without re-rendering
    if (this.paperItem) {
      const pixelPosition = this.convertPosition(newPosition)
      this.paperItem.position = pixelPosition
    }
  }

  protected onMouseUp(_event: paper.MouseEvent): void {
    if (this.isDragging) {
      this.setDragging(false)
      
      // Commit the local spec changes to the store
      this.commitSpecToStore()
      
      // Unregister from global drag handler
      if (paper.view && (paper.view as any).setDraggingComponent) {
        (paper.view as any).setDraggingComponent(null)
      }
    }
  }

  // Commit local spec changes back to the store
  public commitSpecToStore(): void {
    this.store.updateComponent(this.spec.id, this.spec)
  }

  // Get the current local spec (for export functionality)
  getSpec(): ComponentSpec {
    return { ...this.spec }
  }

  // Public methods for global drag handling
  handleMouseMove(event: paper.MouseEvent): void {
    this.onMouseMove(event)
  }

  handleMouseUp(event: paper.MouseEvent): void {
    this.onMouseUp(event)
  }

  protected onMouseEnter(_event: paper.MouseEvent): void {
    this.setHovered(true)
  }

  protected onMouseLeave(_event: paper.MouseEvent): void {
    this.setHovered(false)
  }

  // Interaction utilities
  protected canDrag(): boolean {
    const mode = this.store.currentMode
    if (mode === 'edit') return true
    if (mode === 'sandbox') {
      return this.spec.type === 'viewer' || this.spec.type === 'bunny'
    }
    return false
  }

  // Setup event handlers for the paper item
  protected setupEventHandlers(): void {
    if (!this.paperItem) {
      return
    }
    this.paperItem.onMouseDown = (event: paper.MouseEvent) => this.onMouseDown(event)
    this.paperItem.onMouseMove = (event: paper.MouseEvent) => this.onMouseMove(event)
    this.paperItem.onMouseUp = (event: paper.MouseEvent) => this.onMouseUp(event)
    this.paperItem.onMouseEnter = (event: paper.MouseEvent) => this.onMouseEnter(event)
    this.paperItem.onMouseLeave = (event: paper.MouseEvent) => this.onMouseLeave(event)
  }

  // Public accessors
  getPaperItem(): paper.Item | null {
    return this.paperItem
  }

  getId(): string {
    return this.spec.id
  }
}