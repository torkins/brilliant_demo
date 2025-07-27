import paper from 'paper'
import type { MirrorSpec } from '@/types'
import { BaseComponent } from './BaseComponent'
import { directionFromAngle, add, scale } from '@/utils/math'

export class MirrorComponent extends BaseComponent {
  private mirrorPath: paper.Path | null = null
  private shinePath: paper.Path | null = null

  render(): void {
    // Clean up existing items
    this.destroy()
    
    // Check if Paper.js is ready
    if (!this.isPaperReady()) { return }
    
    // Create main group
    this.paperItem = new paper.Group()
    
    // Render the mirror shape
    const mirrorShape = this.renderShape()
    this.paperItem.addChild(mirrorShape)
    
    // Set up interaction
    this.setupEventHandlers()
    this.updateVisualState()
  }

  protected renderShape(): paper.Item {
    const position = this.convertPosition(this.spec.position)
    const mirrorSpec = this.spec as MirrorSpec
    const direction = directionFromAngle(mirrorSpec.orientation)
    const length = this.convertLength(mirrorSpec.length)
    const halfLength = length / 2

    const start = position.subtract(new paper.Point(direction.x * halfLength, direction.y * halfLength))
    const end = position.add(new paper.Point(direction.x * halfLength, direction.y * halfLength))

    // Main mirror line
    this.mirrorPath = new paper.Path()
    this.mirrorPath.moveTo(start)
    this.mirrorPath.lineTo(end)
    this.mirrorPath.strokeColor = new paper.Color('silver')
    this.mirrorPath.strokeWidth = 9
    this.mirrorPath.strokeCap = 'round'

    // Add mirror shine effect
    const shineLength = length * 0.8
    const shineHalf = shineLength / 2
    const shineStart = position.subtract(new paper.Point(direction.x * shineHalf, direction.y * shineHalf))
    const shineEnd = position.add(new paper.Point(direction.x * shineHalf, direction.y * shineHalf))
    
    this.shinePath = new paper.Path()
    this.shinePath.moveTo(shineStart)
    this.shinePath.lineTo(shineEnd)
    this.shinePath.strokeColor = new paper.Color('white')
    this.shinePath.strokeWidth = 2
    this.shinePath.opacity = 0.7

    const mirrorGroup = new paper.Group([this.mirrorPath, this.shinePath])
    return mirrorGroup
  }

  private onRotate(angleDelta: number): void {
    const mirrorSpec = this.spec as MirrorSpec
    const newOrientation = mirrorSpec.orientation + angleDelta
    
    // Update local spec directly
    mirrorSpec.orientation = newOrientation
    
    // Update Paper.js object directly by re-rendering the shape
    if (this.paperItem && this.mirrorPath && this.shinePath) {
      // Remove old shapes and create new ones with updated orientation
      this.mirrorPath.remove()
      this.shinePath.remove()
      const newShape = this.renderShape()
      this.paperItem.addChild(newShape)
    }
  }

  protected resetVisualState(): void {
    if (this.mirrorPath) {
      this.mirrorPath.strokeColor = new paper.Color('silver')
      this.mirrorPath.strokeWidth = 9
    }
  }

  update(spec: MirrorSpec): void {
    super.update(spec)
  }

  getGeometry() {
    const mirrorSpec = this.spec as MirrorSpec
    const direction = directionFromAngle(mirrorSpec.orientation)
    const halfLength = mirrorSpec.length / 2
    
    const p1 = add(mirrorSpec.position, scale(direction, -halfLength))
    const p2 = add(mirrorSpec.position, scale(direction, halfLength))

    return {
      id: mirrorSpec.id,
      type: 'mirror',
      boundingLines: [{
        p1,
        p2,
        componentId: mirrorSpec.id,
        reflect: true
      }]
    }
  }


  destroy(): void {
    super.destroy()
  }
}