import paper from 'paper'
import type { ComponentSpec } from '@/types'
import { BaseComponent } from './BaseComponent'

export interface MirrorImageSpec extends ComponentSpec {
  type: 'mirror_image'
}

export class MirrorImageComponent extends BaseComponent {
  private body: paper.Path.Circle | null = null
  private ears: paper.Group | null = null
  private leftEye: paper.Path.Circle | null = null
  private rightEye: paper.Path.Circle | null = null

  protected shouldShowRotateHandles(): boolean {
    // Mirror images don't have rotate handles
    return false
  }

  render(): void {
    // Clean up existing items
    this.destroy()
    
    // Check if Paper.js is ready
    if (!this.isPaperReady()) { return }
    
    // Create main group
    this.paperItem = new paper.Group()
    
    // Render the mirror image shape
    const mirrorImageShape = this.renderShape()
    this.paperItem.addChild(mirrorImageShape)
    
    // Set up interaction
    this.setupEventHandlers()
    this.updateVisualState()
  }

  protected renderShape(): paper.Item {
    const mirrorImageGroup = new paper.Group()
    
    const position = this.convertPosition(this.spec.position)
    const bodyRadius = this.convertLength(0.24) // 24cm radius (same as bunny)
    
    console.log(`[Mirror Image] Rendering mirror image ${this.spec.id} at meters=(${this.spec.position.x.toFixed(2)}, ${this.spec.position.y.toFixed(2)}), pixels=(${position.x.toFixed(1)}, ${position.y.toFixed(1)}), radius=${bodyRadius.toFixed(1)}px`)

    // Create body (50% opacity)
    this.body = new paper.Path.Circle(position, bodyRadius)
    this.body.fillColor = new paper.Color('pink')
    this.body.fillColor.alpha = 0.5 // 50% opacity
    this.body.strokeColor = new paper.Color('hotpink')
    this.body.strokeColor.alpha = 0.5 // 50% opacity
    this.body.strokeWidth = 2
    this.body.dashArray = [8, 4] // Dashed outline to distinguish from real bunny

    // Create ears (50% opacity)
    this.ears = new paper.Group()
    const earHeight = this.convertLength(0.06)
    const earWidth = this.convertLength(0.03)

    const leftEar = new paper.Path.Ellipse({
      center: position.add(new paper.Point(-bodyRadius * 0.5, -bodyRadius * 0.8)),
      size: new paper.Size(earWidth, earHeight)
    })
    leftEar.fillColor = new paper.Color('pink')
    leftEar.fillColor.alpha = 0.5
    leftEar.strokeColor = new paper.Color('hotpink')
    leftEar.strokeColor.alpha = 0.5
    leftEar.strokeWidth = 1
    leftEar.dashArray = [4, 2]

    const rightEar = new paper.Path.Ellipse({
      center: position.add(new paper.Point(bodyRadius * 0.5, -bodyRadius * 0.8)),
      size: new paper.Size(earWidth, earHeight)
    })
    rightEar.fillColor = new paper.Color('pink')
    rightEar.fillColor.alpha = 0.5
    rightEar.strokeColor = new paper.Color('hotpink')
    rightEar.strokeColor.alpha = 0.5
    rightEar.strokeWidth = 1
    rightEar.dashArray = [4, 2]

    this.ears.addChild(leftEar)
    this.ears.addChild(rightEar)

    // Add eyes (50% opacity)
    const eyeSize = this.convertLength(0.01)
    this.leftEye = new paper.Path.Circle(position.add(new paper.Point(-bodyRadius * 0.3, -bodyRadius * 0.2)), eyeSize)
    this.leftEye.fillColor = new paper.Color('black')
    this.leftEye.fillColor.alpha = 0.5

    this.rightEye = new paper.Path.Circle(position.add(new paper.Point(bodyRadius * 0.3, -bodyRadius * 0.2)), eyeSize)
    this.rightEye.fillColor = new paper.Color('black')
    this.rightEye.fillColor.alpha = 0.5

    mirrorImageGroup.addChild(this.body)
    mirrorImageGroup.addChild(this.ears)
    mirrorImageGroup.addChild(this.leftEye)
    mirrorImageGroup.addChild(this.rightEye)

    return mirrorImageGroup
  }

  protected createRotateHandles(): paper.Group {
    // Mirror images don't have rotate handles
    return new paper.Group()
  }

  protected resetVisualState(): void {
    // Mirror images don't change appearance on selection
  }

  update(spec: MirrorImageSpec): void {
    super.update(spec)
  }

  getGeometry() {
    // Mirror images don't participate in physics
    return {
      id: this.spec.id,
      type: 'mirror_image',
      boundingLines: []
    }
  }

  // Override interaction behavior for mirror images
  protected canDrag(): boolean {
    // Mirror images are never draggable
    return false
  }

  protected onMouseDown(event: paper.MouseEvent): void {
    // Mirror images are not interactive
    event.stopPropagation()
  }
}