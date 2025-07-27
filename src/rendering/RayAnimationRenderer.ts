import paper from 'paper'
import type { RaySegment, Vec2 } from '@/types'
import { metersToPixelsVec2 } from '@/utils/conversion'

export class RayAnimationRenderer {
  private metersToPixelsRatio: number
  private animationGroup: paper.Group | null = null
  private isAnimating: boolean = false
  private animationId: number | null = null

  constructor(metersToPixelsRatio: number) {
    this.metersToPixelsRatio = metersToPixelsRatio
  }

  updateMetersToPixelsRatio(ratio: number): void {
    this.metersToPixelsRatio = ratio
  }

  private convertPosition(position: Vec2): paper.Point {
    const pixelPos = metersToPixelsVec2(position, this.metersToPixelsRatio)
    return new paper.Point(pixelPos.x, pixelPos.y)
  }

  private calculateSegmentEnd(segment: RaySegment): Vec2 {
    return {
      x: segment.origin.x + segment.direction.x * segment.length,
      y: segment.origin.y + segment.direction.y * segment.length
    }
  }

  private createAnimatedRayPath(): paper.Path {
    const path = new paper.Path()
    path.strokeColor = new paper.Color('#FFD700') // Gold color for light ray
    path.strokeWidth = 3
    path.shadowColor = new paper.Color('#FFD700')
    path.shadowBlur = 8
    path.opacity = 0.9
    return path
  }

  private createMirrorImageLine(start: Vec2, end: Vec2): paper.Path {
    const startPoint = this.convertPosition(start)
    const endPoint = this.convertPosition(end)
    
    const line = new paper.Path.Line(startPoint, endPoint)
    line.strokeColor = new paper.Color('#00BFFF') // Deep sky blue
    line.strokeWidth = 2
    line.dashArray = [8, 4] // Dotted line
    line.opacity = 0.7
    return line
  }

  async animateReverseRay(
    raySegments: RaySegment[], 
    mirrorImageData: Array<{position: Vec2, reflectionPointIndex: number}> = [],
    duration: number = 2000 // Default duration for reverse animation
  ): Promise<void> {
    if (this.isAnimating) {
      this.stopAnimation()
    }

    this.clear()
    
    if (!paper.project || raySegments.length === 0) return

    this.isAnimating = true
    this.animationGroup = new paper.Group()

    console.log('[Ray Animation] Starting reverse ray animation with', raySegments.length, 'segments')

    // Create the animated ray path
    const rayPath = this.createAnimatedRayPath()
    this.animationGroup.addChild(rayPath)

    // Calculate all segment points in reverse order (bunny to viewer)
    const allPoints: paper.Point[] = []
    
    // Start from the end of the last segment (bunny position)
    const lastSegment = raySegments[raySegments.length - 1]
    const bunnyPosition = this.calculateSegmentEnd(lastSegment)
    allPoints.push(this.convertPosition(bunnyPosition))

    // Add reflection points in reverse order
    for (let i = raySegments.length - 1; i >= 0; i--) {
      const segment = raySegments[i]
      allPoints.push(this.convertPosition(segment.origin))
    }

    console.log('[Ray Animation] Animation path has', allPoints.length, 'points')

    // Animate the ray traveling from bunny to viewer
    const animationDuration = 2000 // 2 seconds
    const startTime = Date.now()

    const animate = () => {
      if (!this.isAnimating) return

      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      // Calculate current position along the path
      const totalDistance = this.calculateTotalDistance(allPoints)
      const currentDistance = progress * totalDistance
      
      const pathSoFar = this.getPathToDistance(allPoints, currentDistance)

      // Update the ray path
      rayPath.removeSegments()
      if (pathSoFar.length > 1) {
        rayPath.moveTo(pathSoFar[0])
        for (let i = 1; i < pathSoFar.length; i++) {
          rayPath.lineTo(pathSoFar[i])
        }
      }

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate)
      } else {
        // Animation complete - add mirror image lines
        this.addMirrorImageLines(raySegments, mirrorImageData)
        this.isAnimating = false
        console.log('[Ray Animation] Reverse ray animation completed')
      }

      paper.view?.update()
    }

    this.animationId = requestAnimationFrame(animate)
  }

  private addMirrorImageLines(raySegments: RaySegment[], mirrorImageData: Array<{position: Vec2, reflectionPointIndex: number}>): void {
    if (!this.animationGroup || mirrorImageData.length === 0) return

    console.log('[Ray Animation] Adding', mirrorImageData.length, 'mirror image lines')

    // Calculate reflection points (segment end points where there's a hit)
    const reflectionPoints: Vec2[] = []
    
    for (let i = 0; i < raySegments.length - 1; i++) {
      const segment = raySegments[i]
      if (segment.hitComponentId) {
        const endPoint = this.calculateSegmentEnd(segment)
        reflectionPoints.push(endPoint)
        console.log(`[Ray Animation] Reflection point ${reflectionPoints.length - 1}: (${endPoint.x.toFixed(2)}, ${endPoint.y.toFixed(2)}) from segment ${i}`)
      }
    }

    // Create dotted lines from specific reflection points to their corresponding mirror images
    mirrorImageData.forEach((mirrorData, index) => {
      const reflectionPointIndex = mirrorData.reflectionPointIndex
      
      if (reflectionPointIndex >= 0 && reflectionPointIndex < reflectionPoints.length) {
        const reflectionPoint = reflectionPoints[reflectionPointIndex]
        const line = this.createMirrorImageLine(reflectionPoint, mirrorData.position)
        this.animationGroup!.addChild(line)
        
        console.log(`[Ray Animation] Mirror image ${index}: line from reflection point ${reflectionPointIndex} (${reflectionPoint.x.toFixed(2)}, ${reflectionPoint.y.toFixed(2)}) to image (${mirrorData.position.x.toFixed(2)}, ${mirrorData.position.y.toFixed(2)})`)
        
        // Animate the line appearing
        line.opacity = 0
        line.tween({ opacity: 0.7 }, 500)
      } else {
        console.warn(`[Ray Animation] Invalid reflection point index ${reflectionPointIndex} for mirror image ${index}`)
      }
    })
  }

  private calculateTotalDistance(points: paper.Point[]): number {
    let total = 0
    for (let i = 1; i < points.length; i++) {
      total += points[i].getDistance(points[i - 1])
    }
    return total
  }

  private getPointAtDistance(points: paper.Point[], targetDistance: number): paper.Point {
    if (points.length === 0) return new paper.Point(0, 0)
    if (targetDistance <= 0) return points[0]

    let currentDistance = 0
    for (let i = 1; i < points.length; i++) {
      const segmentDistance = points[i].getDistance(points[i - 1])
      
      if (currentDistance + segmentDistance >= targetDistance) {
        const ratio = (targetDistance - currentDistance) / segmentDistance
        return points[i - 1].add(points[i].subtract(points[i - 1]).multiply(ratio))
      }
      
      currentDistance += segmentDistance
    }
    
    return points[points.length - 1]
  }

  private getPathToDistance(points: paper.Point[], targetDistance: number): paper.Point[] {
    if (points.length === 0) return []
    if (targetDistance <= 0) return [points[0]]

    const result: paper.Point[] = [points[0]]
    let currentDistance = 0

    for (let i = 1; i < points.length; i++) {
      const segmentDistance = points[i].getDistance(points[i - 1])
      
      if (currentDistance + segmentDistance <= targetDistance) {
        result.push(points[i])
        currentDistance += segmentDistance
      } else {
        const ratio = (targetDistance - currentDistance) / segmentDistance
        const finalPoint = points[i - 1].add(points[i].subtract(points[i - 1]).multiply(ratio))
        result.push(finalPoint)
        break
      }
    }

    return result
  }

  stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.isAnimating = false
  }

  async animateUnfoldRay(raySegments: RaySegment[]): Promise<void> {
    if (this.isAnimating) {
      this.stopAnimation()
    }

    this.clear()
    
    if (!paper.project || raySegments.length < 2) return

    this.isAnimating = true
    this.animationGroup = new paper.Group()

    console.log('[Ray Animation] Starting unfold ray animation with', raySegments.length, 'segments')

    // Create visual segments for each ray segment
    const segmentPaths: paper.Path[] = []
    const segmentVectors: {start: paper.Point, end: paper.Point, originalDirection: paper.Point}[] = []

    // Create all segments and store their information
    for (let i = 0; i < raySegments.length; i++) {
      const segment = raySegments[i]
      const startPoint = this.convertPosition(segment.origin)
      const endPoint = this.convertPosition(this.calculateSegmentEnd(segment))
      
      const path = new paper.Path()
      path.moveTo(startPoint)
      path.lineTo(endPoint)
      path.strokeColor = new paper.Color('#FF6B6B') // Red color for unfolding rays
      path.strokeWidth = 3
      path.opacity = 0.8
      
      segmentPaths.push(path)
      this.animationGroup.addChild(path)
      
      segmentVectors.push({
        start: startPoint.clone(),
        end: endPoint.clone(),
        originalDirection: endPoint.subtract(startPoint).normalize()
      })

      console.log(`[Ray Animation] Segment ${i}: (${startPoint.x.toFixed(1)}, ${startPoint.y.toFixed(1)}) to (${endPoint.x.toFixed(1)}, ${endPoint.y.toFixed(1)})`)
    }

    // Unfold segments one by one, starting from the last
    for (let unfoldIndex = raySegments.length - 1; unfoldIndex >= 1; unfoldIndex--) {
      console.log(`[Ray Animation] Unfolding segment ${unfoldIndex}`)

      const segment = raySegments[unfoldIndex]
      const prevSegment = raySegments[unfoldIndex - 1]
      console.log('Segment points: ', segment.origin, this.calculateSegmentEnd(segment))
      console.log(' Prev segment points: ', prevSegment.origin, this.calculateSegmentEnd(prevSegment))
      const reflectionPoint = this.convertPosition(segment.origin)
      
      const rotationAngle = this.rotationToAlign(segment, prevSegment) 
      
      console.log(`[Ray Animation] Rotating segment ${unfoldIndex} by ${(rotationAngle)} radians around reflection point`)
      
      // Animate the rotation
      await this.animateSegmentRotation(segmentPaths, segmentVectors, unfoldIndex, reflectionPoint, rotationAngle)
    }

    this.isAnimating = false
    console.log('[Ray Animation] Unfold ray animation completed')
  }

  private rotationToAlign(targetSegment: RaySegment, previousSegment: RaySegment): number {
    const ax = this.calculateSegmentEnd(targetSegment).x - targetSegment.origin.x
    const ay = (this.calculateSegmentEnd(targetSegment).y - targetSegment.origin.y)*-1 //invert y due to screen coords 
    const bx = previousSegment.origin.x - this.calculateSegmentEnd(previousSegment).x
    const by = (previousSegment.origin.y - this.calculateSegmentEnd(previousSegment).y)*-1 // invert y due to screen coords;
    //const bx = this.calculateSegmentEnd(previousSegment).x - previousSegment.origin.x;
//    const by = this.calculateSegmentEnd(previousSegment).y - previousSegment.origin.y;
    console.info(`[Ray Animation] Calculating rotation to align segments: target (${ax.toFixed(4)}, ${ay.toFixed(4)}), previous (${bx.toFixed(4)}, ${by.toFixed(4)})`)

    const dot = ax * bx + ay * by
    const det = ax * by - ay * bx
    
    let angle = Math.atan2(det, dot)
    console.log(`[Ray Animation] Calculated angle between segments: ${angle.toFixed(4)} radians`)
    angle += Math.PI
    console.log(`[Ray Animation] Adjusted angle for unfolding: ${angle.toFixed(4)} radians`)
  
    // Normalize to [-π, π]
    if (angle > Math.PI) angle -= 2 * Math.PI
    if (angle < -Math.PI) angle += 2 * Math.PI
    console.log(`[Ray Animation] Normalized angle: ${angle.toFixed(4)} radians`)
  
    console.log(`[Ray Animation] Calculated rotation angle: ${angle.toFixed(4)} radians`)
    return angle * -1
  }

  private async animateSegmentRotation(
    segmentPaths: paper.Path[], 
    segmentVectors: {start: paper.Point, end: paper.Point, originalDirection: paper.Point}[], 
    startIndex: number, 
    pivotPoint: paper.Point, 
    totalRotation: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const animationDuration = 2000 // 1 second per unfold
      const startTime = Date.now()
      let lastTime = startTime

      const animate = () => {
        if (!this.isAnimating) {
          resolve()
          return
        }

        const elapsed = Date.now() - startTime
        const elapsedSinceLastFrame = Date.now() - lastTime
        const fractionOfElapsedSinceLastFrame = elapsedSinceLastFrame / animationDuration
        const currentRotation = totalRotation * fractionOfElapsedSinceLastFrame
        const progress = Math.min(elapsed / animationDuration, 1)

        // Rotate all segments from startIndex to the end
        for (let i = startIndex; i < segmentPaths.length; i++) {
          const path = segmentPaths[i]
          const vector = segmentVectors[i]
          
          // Calculate rotated positions
          const rotatedStart = this.rotatePointAround(vector.start, pivotPoint, currentRotation)
          const rotatedEnd = this.rotatePointAround(vector.end, pivotPoint, currentRotation)
          
          // Update the path
          path.removeSegments()
          path.moveTo(rotatedStart)
          path.lineTo(rotatedEnd)
          
          // Update vector data for subsequent rotations
          vector.start = rotatedStart
          vector.end = rotatedEnd
        }

        if (progress < 1) {
          lastTime = Date.now()
          requestAnimationFrame(animate)
        } else {
          resolve()
        }

        paper.view?.update()
      }

      requestAnimationFrame(animate)
    })
  }

  private rotatePointAround(point: paper.Point, pivot: paper.Point, angle: number): paper.Point {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    
    const dx = point.x - pivot.x
    const dy = point.y - pivot.y

    const rx = dx * cos - dy * sin
    const ry = dx * sin + dy * cos

    return new paper.Point(
      pivot.x + rx,
      pivot.y + ry
    )
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  clear(): void {
    this.stopAnimation()
    if (this.animationGroup) {
      this.animationGroup.remove()
      this.animationGroup = null
    }
  }

  destroy(): void {
    this.clear()
  }
}