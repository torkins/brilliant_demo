import paper from 'paper'
import type { WallSpec } from '@/types'
import { BaseComponent } from './BaseComponent'
import { directionFromAngle, add, scale } from '@/utils/math'

export class WallComponent extends BaseComponent {
  private wallPath: paper.Path | null = null

  render(): void {
    // Clean up existing items
    this.destroy()
    
    // Check if Paper.js is ready
    if (!this.isPaperReady()) { return }
    
    // Create main group
    this.paperItem = new paper.Group()
    
    // Render the wall shape
    const wallShape = this.renderShape()
    this.paperItem.addChild(wallShape)
    
    // Set up interaction
    this.setupEventHandlers()
    this.updateVisualState()
  }

  protected renderShape(): paper.Item {
    const position = this.convertPosition(this.spec.position)
    const wallSpec = this.spec as WallSpec
    const direction = directionFromAngle(wallSpec.orientation)
    const length = this.convertLength(wallSpec.length)
    const halfLength = length / 2

    const start = position.subtract(new paper.Point(direction.x * halfLength, direction.y * halfLength))
    const end = position.add(new paper.Point(direction.x * halfLength, direction.y * halfLength))

    this.wallPath = new paper.Path()
    this.wallPath.moveTo(start)
    this.wallPath.lineTo(end)
    this.wallPath.strokeColor = new paper.Color('brown')
    this.wallPath.strokeWidth = 12
    this.wallPath.strokeCap = 'round'

    return this.wallPath
  }

  private onRotate(angleDelta: number): void {
    const wallSpec = this.spec as WallSpec
    const newOrientation = wallSpec.orientation + angleDelta
    
    // Update local spec directly
    wallSpec.orientation = newOrientation
    
    // Update Paper.js object directly by re-rendering the shape
    if (this.paperItem && this.wallPath) {
      // Remove old shape and create new one with updated orientation
      this.wallPath.remove()
      const newShape = this.renderShape()
      this.paperItem.addChild(newShape)
    }
  }

  protected resetVisualState(): void {
    if (this.wallPath) {
      this.wallPath.strokeColor = new paper.Color('brown')
      this.wallPath.strokeWidth = 12
    }
  }

  update(spec: WallSpec): void {
    super.update(spec)
  }

  getGeometry() {
    const wallSpec = this.spec as WallSpec
    const direction = directionFromAngle(wallSpec.orientation)
    const halfLength = wallSpec.length / 2
    
    const p1 = add(wallSpec.position, scale(direction, -halfLength))
    const p2 = add(wallSpec.position, scale(direction, halfLength))

    return {
      id: wallSpec.id,
      type: 'wall',
      boundingLines: [{
        p1,
        p2,
        componentId: wallSpec.id,
        reflect: false
      }]
    }
  }


  destroy(): void {
    super.destroy()
  }
}