import paper from 'paper'
import type { PhantomSpec } from '@/types'
import type { StageStore } from '@/store'
import { BaseComponent } from './BaseComponent'

export class PhantomBunnyComponent extends BaseComponent {
  private isClickable: boolean = false

  constructor(spec: PhantomSpec, store: StageStore, metersToPixelsRatio: number, isClickable: boolean = false) {
    super(spec, store, metersToPixelsRatio)
    this.isClickable = isClickable
  }

  protected shouldShowRotateHandles(): boolean {
    // Phantom bunnies don't have rotate handles
    return false
  }

  render(): void {
    // Clean up existing items
    this.destroy()
    
    // Check if Paper.js is ready
    if (!this.isPaperReady()) { return }
    
    // Create main group
    this.paperItem = new paper.Group()
    
    // Render the phantom bunny shape
    const phantomShape = this.renderShape()
    this.paperItem.addChild(phantomShape)
    
    // Set up interaction
    this.setupEventHandlers()
    this.updateVisualState()
  }

  protected renderShape(): paper.Item {
    const phantomGroup = new paper.Group()
    
    const position = this.convertPosition(this.spec.position)
    const bodyRadius = this.convertLength(0.24) // 24cm radius (triple size)
    
    console.log(`[Phantom Bunny] Rendering phantom ${this.spec.id} at meters=(${this.spec.position.x.toFixed(2)}, ${this.spec.position.y.toFixed(2)}), pixels=(${position.x.toFixed(1)}, ${position.y.toFixed(1)}), radius=${bodyRadius.toFixed(1)}px`)

    // Create body (semi-transparent)
    const body = new paper.Path.Circle(position, bodyRadius)
    body.fillColor = new paper.Color('lightblue')
    body.fillColor.alpha = 0.5
    body.strokeColor = new paper.Color('blue')
    body.strokeColor.alpha = 0.7
    body.strokeWidth = 2
    body.dashArray = [4, 4] // Dashed outline

    // Create ears (semi-transparent)
    const earHeight = this.convertLength(0.06)
    const earWidth = this.convertLength(0.03)

    const leftEar = new paper.Path.Ellipse({
      center: position.add(new paper.Point(-bodyRadius * 0.5, -bodyRadius * 0.8)),
      size: new paper.Size(earWidth, earHeight)
    })
    leftEar.fillColor = new paper.Color('lightblue')
    leftEar.fillColor.alpha = 0.5
    leftEar.strokeColor = new paper.Color('blue')
    leftEar.strokeColor.alpha = 0.7
    leftEar.strokeWidth = 1
    leftEar.dashArray = [2, 2]

    const rightEar = new paper.Path.Ellipse({
      center: position.add(new paper.Point(bodyRadius * 0.5, -bodyRadius * 0.8)),
      size: new paper.Size(earWidth, earHeight)
    })
    rightEar.fillColor = new paper.Color('lightblue')
    rightEar.fillColor.alpha = 0.5
    rightEar.strokeColor = new paper.Color('blue')
    rightEar.strokeColor.alpha = 0.7
    rightEar.strokeWidth = 1
    rightEar.dashArray = [2, 2]

    // Add eyes (more transparent)
    const eyeSize = this.convertLength(0.01)
    const leftEye = new paper.Path.Circle(position.add(new paper.Point(-bodyRadius * 0.3, -bodyRadius * 0.2)), eyeSize)
    leftEye.fillColor = new paper.Color('darkblue')
    leftEye.fillColor.alpha = 0.6

    const rightEye = new paper.Path.Circle(position.add(new paper.Point(bodyRadius * 0.3, -bodyRadius * 0.2)), eyeSize)
    rightEye.fillColor = new paper.Color('darkblue')
    rightEye.fillColor.alpha = 0.6

    phantomGroup.addChild(body)
    phantomGroup.addChild(leftEar)
    phantomGroup.addChild(rightEar)
    phantomGroup.addChild(leftEye)
    phantomGroup.addChild(rightEye)

    // Add click indicator if clickable
    if (this.isClickable) {
      const clickIndicator = new paper.Path.Circle(position, bodyRadius + this.convertLength(0.02))
      clickIndicator.strokeColor = new paper.Color('yellow')
      clickIndicator.strokeWidth = 3
      clickIndicator.dashArray = [6, 6]
      clickIndicator.opacity = 0.8
      phantomGroup.addChild(clickIndicator)
    }

    return phantomGroup
  }

  protected createRotateHandles(): paper.Group {
    // Phantom bunnies don't have rotate handles
    return new paper.Group()
  }

  setClickable(clickable: boolean): void {
    if (this.isClickable === clickable) return
    
    this.isClickable = clickable
    this.render() // Re-render to show/hide click indicator
  }

  protected resetVisualState(): void {
    // Phantom appearance doesn't change on selection
  }

  update(spec: PhantomSpec): void {
    super.update(spec)
  }

  getGeometry() {
    return {
      id: this.spec.id,
      type: 'phantom',
      boundingLines: []
    }
  }

  // Override interaction behavior for phantom bunnies
  protected canDrag(): boolean {
    // Phantom bunnies are draggable in edit mode, but not in other modes
    return this.store.currentMode === 'edit'
  }

  protected onMouseDown(event: paper.MouseEvent): void {
    // In game mode, clicking a phantom should trigger guess checking
    if (this.store.currentMode === 'game' && this.isClickable) {
      this.store.checkPhantomGuess(this.spec.id)
      event.stopPropagation()
    } else if (this.store.currentMode === 'edit') {
      // In edit mode, use default dragging behavior
      super.onMouseDown(event)
    }
  }

  protected onMouseEnter(event: paper.MouseEvent): void {
    if (this.store.currentMode === 'game' && this.isClickable) {
      // Add visual feedback for clickable phantoms
      if (this.paperItem) {
        this.paperItem.opacity = 0.8
      }
    }
    super.onMouseEnter(event)
  }

  protected onMouseLeave(event: paper.MouseEvent): void {
    if (this.store.currentMode === 'game' && this.isClickable) {
      // Remove visual feedback
      if (this.paperItem) {
        this.paperItem.opacity = 1.0
      }
    }
    super.onMouseLeave(event)
  }
}