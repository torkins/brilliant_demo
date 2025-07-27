import paper from 'paper'
import type { RaySegment } from '@/types'
import { metersToPixelsVec2 } from '@/utils/conversion'
import { add, scale } from '@/utils/math'

export class RayRenderer {
  private rayGroup: paper.Group | null = null
  private metersToPixelsRatio: number

  constructor(metersToPixelsRatio: number) {
    this.metersToPixelsRatio = metersToPixelsRatio
  }

  render(raySegments: RaySegment[]): paper.Group {
    this.clear()
    this.rayGroup = new paper.Group()

    raySegments.forEach((segment, index) => {
      const startPos = metersToPixelsVec2(segment.origin, this.metersToPixelsRatio)
      const endPos = metersToPixelsVec2(
        add(segment.origin, scale(segment.direction, segment.length)),
        this.metersToPixelsRatio
      )

      const rayPath = new paper.Path()
      rayPath.moveTo(new paper.Point(startPos.x, startPos.y))
      rayPath.lineTo(new paper.Point(endPos.x, endPos.y))
      
      // Color rays differently based on bounce count
      const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
      const colorIndex = index % colors.length
      rayPath.strokeColor = new paper.Color(colors[colorIndex])
      rayPath.strokeWidth = 3
      rayPath.opacity = 0.8

      // Add small circle at ray origin for first segment
      if (index === 0) {
        const originCircle = new paper.Path.Circle(new paper.Point(startPos.x, startPos.y), 3)
        originCircle.fillColor = new paper.Color('red')
        this.rayGroup!.addChild(originCircle)
      }

      // Add small circle at hit points
      if (segment.hitComponentId) {
        const hitCircle = new paper.Path.Circle(new paper.Point(endPos.x, endPos.y), 2)
        hitCircle.fillColor = new paper.Color('darkred')
        this.rayGroup!.addChild(hitCircle)
      }

      this.rayGroup!.addChild(rayPath)
    })

    return this.rayGroup
  }

  updateMetersToPixelsRatio(ratio: number) {
    this.metersToPixelsRatio = ratio
  }

  clear() {
    if (this.rayGroup) {
      this.rayGroup.remove()
      this.rayGroup = null
    }
  }

  destroy() {
    this.clear()
  }
}