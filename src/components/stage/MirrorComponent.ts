import paper from 'paper'
import type { MirrorSpec } from '@/types'
import { BaseComponent } from './BaseComponent'
import { directionFromAngle, add, scale } from '@/utils/math'

export class MirrorComponent extends BaseComponent {
  private mirrorPath: paper.Path | null = null

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
    this.mirrorPath.strokeColor = new paper.Color('lightblue')
    this.mirrorPath.strokeWidth = 5
    this.mirrorPath.strokeCap = 'round'

    const mirrorGroup = new paper.Group([this.mirrorPath])
    return mirrorGroup
  }

  protected resetVisualState(): void {
    if (this.mirrorPath) {
      this.mirrorPath.strokeColor = new paper.Color('silver')
      this.mirrorPath.strokeWidth = 5
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