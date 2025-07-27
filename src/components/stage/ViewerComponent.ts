import paper from 'paper'
import type { ViewerSpec } from '@/types'
import { BaseComponent } from './BaseComponent'
import { directionFromAngle } from '@/utils/math'

export class ViewerComponent extends BaseComponent {
  private eyeShape: paper.Path.Circle | null = null
  private directionArrow: paper.Group | null = null

  render(): void {
    // Clean up existing items
    this.destroy()
    
    // Check if Paper.js is ready
    if (!this.isPaperReady()) {
      return
    }
    
    // Create main group
    this.paperItem = new paper.Group()
    
    // Render the viewer shape
    const viewerShape = this.renderShape()
    this.paperItem.addChild(viewerShape)
    
    // Set up interaction
    this.setupEventHandlers()
    this.updateVisualState()
  }

  protected renderShape(): paper.Item {
    const viewerGroup = new paper.Group()
    
    const position = this.convertPosition(this.spec.position)
    const radius = this.convertLength(0.30) // 30cm radius (double size)

    // Create eye shape
    this.eyeShape = new paper.Path.Circle(position, radius)
    this.eyeShape.fillColor = new paper.Color('green')
    this.eyeShape.strokeColor = new paper.Color('darkgreen')
    this.eyeShape.strokeWidth = 2

    // Create direction arrow
    this.updateDirectionArrow()

    viewerGroup.addChild(this.eyeShape)
    if (this.directionArrow) {
      viewerGroup.addChild(this.directionArrow)
    }

    return viewerGroup
  }

  private updateDirectionArrow(): void {
    if (this.directionArrow) {
      this.directionArrow.remove()
    }

    const position = this.convertPosition(this.spec.position)
    const direction = directionFromAngle((this.spec as ViewerSpec).orientation)
    const arrowLength = this.convertLength(0.4)
    
    const endPoint = position.add(new paper.Point(
      direction.x * arrowLength,
      direction.y * arrowLength
    ))

    this.directionArrow = new paper.Group()

    // Arrow line
    const arrowLine = new paper.Path()
    arrowLine.moveTo(position)
    arrowLine.lineTo(endPoint)
    arrowLine.strokeColor = new paper.Color('darkgreen')
    arrowLine.strokeWidth = 3

    // Add arrowhead
    const arrowHeadSize = this.convertLength(0.1)
    const perpendicular = new paper.Point(-direction.y, direction.x)
    
    const arrowHead = new paper.Path()
    arrowHead.moveTo(endPoint)
    arrowHead.lineTo(endPoint.subtract(new paper.Point(direction.x * arrowHeadSize, direction.y * arrowHeadSize))
                           .add(perpendicular.multiply(arrowHeadSize * 0.5)))
    arrowHead.lineTo(endPoint.subtract(new paper.Point(direction.x * arrowHeadSize, direction.y * arrowHeadSize))
                           .subtract(perpendicular.multiply(arrowHeadSize * 0.5)))
    arrowHead.closePath()
    arrowHead.fillColor = new paper.Color('darkgreen')

    this.directionArrow.addChild(arrowLine)
    this.directionArrow.addChild(arrowHead)
  }

  private onRotate(angle: number): void {
    const viewerSpec = this.spec as ViewerSpec
    const newOrientation = angle 
    
    // Update local spec directly
    viewerSpec.orientation = newOrientation
    
    // Update Paper.js object directly - rotate the direction arrow
    this.updateDirectionArrow()
  }

  protected resetVisualState(): void {
    if (this.eyeShape) {
      this.eyeShape.strokeColor = new paper.Color('darkgreen')
      this.eyeShape.strokeWidth = 2
    }
  }

  update(spec: ViewerSpec): void {
    super.update(spec)
    this.updateDirectionArrow()
  }

  getGeometry() {
    return {
      id: this.spec.id,
      type: 'viewer',
      boundingLines: []
    }
  }

  private getOrientation(): number {
    return (this.spec as ViewerSpec).orientation || 0
  }

  destroy(): void {
    super.destroy()
  }
}