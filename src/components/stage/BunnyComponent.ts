import paper from 'paper'
import type { BunnySpec } from '@/types'
import { BaseComponent } from './BaseComponent'

export class BunnyComponent extends BaseComponent {
  private body: paper.Path.Circle | null = null
  private ears: paper.Group | null = null
  private leftEye: paper.Path.Circle | null = null
  private rightEye: paper.Path.Circle | null = null

  protected shouldShowRotateHandles(): boolean {
    // Bunnies don't need rotation handles
    return false
  }

  render(): void {
    // Clean up existing items
    this.destroy()
    
    // Check if Paper.js is ready
    if (!this.isPaperReady()) { return }
    
    // Create main group
    this.paperItem = new paper.Group()
    
    // Render the bunny shape
    const bunnyShape = this.renderShape()
    this.paperItem.addChild(bunnyShape)
    
    // Set up interaction
    this.setupEventHandlers()
    this.updateVisualState()
  }

  protected renderShape(): paper.Item {
    const bunnyGroup = new paper.Group()
    
    const position = this.convertPosition(this.spec.position)
    const bodyRadius = this.convertLength(0.24) // 24cm radius (triple size)
    
    console.log(`[Real Bunny] Rendering bunny ${this.spec.id} at meters=(${this.spec.position.x.toFixed(2)}, ${this.spec.position.y.toFixed(2)}), pixels=(${position.x.toFixed(1)}, ${position.y.toFixed(1)}), radius=${bodyRadius.toFixed(1)}px`)

    // Create body
    this.body = new paper.Path.Circle(position, bodyRadius)
    this.body.fillColor = new paper.Color('pink')
    this.body.strokeColor = new paper.Color('hotpink')
    this.body.strokeWidth = 2

    // Create ears
    this.ears = new paper.Group()
    const earHeight = this.convertLength(0.06)
    const earWidth = this.convertLength(0.03)

    const leftEar = new paper.Path.Ellipse({
      center: position.add(new paper.Point(-bodyRadius * 0.5, -bodyRadius * 0.8)),
      size: new paper.Size(earWidth, earHeight)
    })
    leftEar.fillColor = new paper.Color('pink')
    leftEar.strokeColor = new paper.Color('hotpink')
    leftEar.strokeWidth = 1

    const rightEar = new paper.Path.Ellipse({
      center: position.add(new paper.Point(bodyRadius * 0.5, -bodyRadius * 0.8)),
      size: new paper.Size(earWidth, earHeight)
    })
    rightEar.fillColor = new paper.Color('pink')
    rightEar.strokeColor = new paper.Color('hotpink')
    rightEar.strokeWidth = 1

    this.ears.addChild(leftEar)
    this.ears.addChild(rightEar)

    // Add eyes
    const eyeSize = this.convertLength(0.01)
    this.leftEye = new paper.Path.Circle(position.add(new paper.Point(-bodyRadius * 0.3, -bodyRadius * 0.2)), eyeSize)
    this.leftEye.fillColor = new paper.Color('black')

    this.rightEye = new paper.Path.Circle(position.add(new paper.Point(bodyRadius * 0.3, -bodyRadius * 0.2)), eyeSize)
    this.rightEye.fillColor = new paper.Color('black')

    bunnyGroup.addChild(this.body)
    bunnyGroup.addChild(this.ears)
    bunnyGroup.addChild(this.leftEye)
    bunnyGroup.addChild(this.rightEye)

    return bunnyGroup
  }

  protected createRotateHandles(): paper.Group {
    // Bunnies don't have rotate handles
    return new paper.Group()
  }

  protected resetVisualState(): void {
    if (this.body) {
      this.body.strokeColor = new paper.Color('hotpink')
      this.body.strokeWidth = 2
    }
  }

  update(spec: BunnySpec): void {
    super.update(spec)
  }

  getGeometry() {
    const bunnySpec = this.spec as BunnySpec
    const size = 0.16 // 16cm square
    const half = size / 2

    const corners = [
      { x: bunnySpec.position.x - half, y: bunnySpec.position.y - half },
      { x: bunnySpec.position.x + half, y: bunnySpec.position.y - half },
      { x: bunnySpec.position.x + half, y: bunnySpec.position.y + half },
      { x: bunnySpec.position.x - half, y: bunnySpec.position.y + half }
    ]

    const boundingLines = []
    for (let i = 0; i < corners.length; i++) {
      const next = (i + 1) % corners.length
      boundingLines.push({
        p1: corners[i],
        p2: corners[next],
        componentId: bunnySpec.id,
        reflect: false
      })
    }

    return {
      id: bunnySpec.id,
      type: 'bunny',
      boundingLines
    }
  }

}