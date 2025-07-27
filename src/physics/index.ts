import type { 
  ComponentGeometry, 
  ViewerSpec, 
  RaySegment, 
  Vec2, 
  Meter
} from '@/types'
import { 
  normalize, 
  add, 
  scale, 
  reflect, 
  directionFromAngle,
  rayLineIntersection,
  getNormalFromLine
} from '@/utils/math'

interface RayHit {
  point: Vec2
  distance: Meter
  componentId: string
  segmentIndex: number
  normal?: Vec2
  isReflective?: boolean
}

export function computeRaySegments(
  geometries: ComponentGeometry[], 
  viewer: ViewerSpec, 
  maxLength: Meter = 50
): RaySegment[] {
  const segments: RaySegment[] = []
  let currentOrigin = viewer.position
  let currentDirection = directionFromAngle(viewer.orientation)
  let totalLength = 0
  let bounces = 0
  const maxBounces = 10

  // Handle zero-length case
  if (maxLength <= 0) {
    segments.push({
      origin: currentOrigin,
      direction: currentDirection,
      length: 0
    })
    return segments
  }

  while (bounces < maxBounces && totalLength < maxLength) {
    const hit = findClosestHit(currentOrigin, currentDirection, geometries)
    
    if (!hit) {
      // Ray extends to max length without hitting anything
      const remainingLength = maxLength - totalLength
      if (remainingLength > 0) {
        const segmentLength = Math.min(remainingLength, 20) // Cap at 20m for infinite rays
        segments.push({
          origin: currentOrigin,
          direction: currentDirection,
          length: segmentLength
        })
      }
      break
    }

    const segmentLength = hit.distance
    segments.push({
      origin: currentOrigin,
      direction: currentDirection,
      length: segmentLength,
      hitComponentId: hit.componentId
    })

    totalLength += segmentLength
    
    // Check if we hit a wall or bunny (stops ray)
    const hitGeometry = geometries.find(g => g.id === hit.componentId)
    if (!hitGeometry || hitGeometry.type === 'wall' || hitGeometry.type === 'bunny') {
      break
    }

    // Handle mirror reflection
    if (hitGeometry.type === 'mirror' && hit.normal && hit.isReflective) {
      currentOrigin = hit.point
      currentDirection = reflect(currentDirection, hit.normal)
      bounces++
    } else {
      break
    }
  }

  return segments
}

function findClosestHit(
  rayOrigin: Vec2, 
  rayDirection: Vec2, 
  geometries: ComponentGeometry[]
): RayHit | null {
  let closestHit: RayHit | null = null
  let closestDistance = Infinity

  for (const geometry of geometries) {
    // Skip viewer geometry (don't hit yourself)
    if (geometry.type === 'viewer') continue

    for (let i = 0; i < geometry.boundingLines.length; i++) {
      const line = geometry.boundingLines[i]
      const intersection = rayLineIntersection(rayOrigin, rayDirection, line.p1, line.p2)
      
      if (intersection && intersection.distance > 0.001 && intersection.distance < closestDistance) {
        const normal = getNormalFromLine(line.p1, line.p2)
        
        closestDistance = intersection.distance
        closestHit = {
          point: intersection.point,
          distance: intersection.distance,
          componentId: geometry.id,
          segmentIndex: i,
          normal,
          isReflective: line.reflect || false
        }
      }
    }
  }

  return closestHit
}

export function computeMirrorImage(
  raySegments: RaySegment[], 
): Vec2 | null {
  if (raySegments.length === 0) {
    console.log('[Mirror Image] No ray segments provided')
    return null
  }

  // Log each ray segment
  raySegments.forEach((segment, index) => {
    console.log(`[Mirror Image] Segment ${index}: origin=(${segment.origin.x.toFixed(2)}, ${segment.origin.y.toFixed(2)}), direction=(${segment.direction.x.toFixed(2)}, ${segment.direction.y.toFixed(2)}), length=${segment.length.toFixed(2)}${segment.hitComponentId ? `, hit=${segment.hitComponentId}` : ''}`)
  })

  // Calculate total ray path length
  const totalLength = raySegments.reduce((sum, segment) => sum + segment.length, 0)
  console.log(`[Mirror Image] Total ray path length: ${totalLength.toFixed(2)}m`)
  
  // Get ray direction
  const firstSegment = raySegments[0]
  const rayDirection = firstSegment.direction
  console.log(`[Mirror Image] Final ray direction: (${rayDirection.x.toFixed(2)}, ${rayDirection.y.toFixed(2)})`)

  // Place mirror image at the same distance from viewer along the ray path
  const viewer = raySegments[0].origin
  const imagePosition = add(viewer, scale(normalize(rayDirection), totalLength))
  
  console.log(`[Mirror Image] Viewer position: (${viewer.x.toFixed(2)}, ${viewer.y.toFixed(2)})`)
  console.log(`[Mirror Image] Computed mirror image position: (${imagePosition.x.toFixed(2)}, ${imagePosition.y.toFixed(2)})`)

  return imagePosition
}

interface MirrorImageData {
  position: Vec2
  reflectionPointIndex: number
}

export function computeMirrorImages(raySegments: RaySegment[]): MirrorImageData[] {
  if (raySegments.length === 0) {
    console.log('[Mirror Images] No ray segments provided')
    return []
  }

  // Check if the last segment hits a bunny
  const lastSegment = raySegments[raySegments.length - 1]
  if (!lastSegment.hitComponentId) {
    console.log('[Mirror Images] Ray does not hit any object')
    return []
  }

  // For now, we assume the hit object is a bunny since we don't have access to store here
  // This function computes mirror images for all reflection points
  
  const mirrorImages: MirrorImageData[] = []
  
  // Process each segment except the last one (which hits the bunny)
  for (let i = 0; i < raySegments.length - 1; i++) {
    const segment = raySegments[i]
    
    // Only compute mirror image for segments that hit something (reflection points)
    if (segment.hitComponentId) {
      // Compute mirror image using segments from this reflection point to the end
      const segmentsFromReflection = raySegments.slice(i)
      
      const mirrorImagePos = computeMirrorImage(segmentsFromReflection)
      
      if (mirrorImagePos) {
        mirrorImages.push({
          position: mirrorImagePos,
          reflectionPointIndex: i
        })
        console.log(`[Mirror Images] Created mirror image ${i} at (${mirrorImagePos.x.toFixed(2)}, ${mirrorImagePos.y.toFixed(2)}) from reflection point ${i}`)
      }
    }
  }
  
  console.log(`[Mirror Images] Computed ${mirrorImages.length} mirror images from ${raySegments.length} ray segments`)
  return mirrorImages
}