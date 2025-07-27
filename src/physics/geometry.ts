import type { 
  ComponentSpec, 
  ComponentGeometry, 
  LineSegment, 
  ViewerSpec, 
  WallSpec, 
  MirrorSpec, 
  BunnySpec,
  PhantomSpec 
} from '@/types'
import { directionFromAngle, add, scale } from '@/utils/math'

const componentToGeometry: Record<string, (component: ComponentSpec) => ComponentGeometry> = {
  viewer: viewerToGeometry,
  wall: wallToGeometry,
  mirror: mirrorToGeometry,
  bunny: bunnyToGeometry,
  phantom: phantomToGeometry
}

function viewerToGeometry(spec: ComponentSpec): ComponentGeometry {
  const viewer = spec as ViewerSpec
  // Viewer has no collision geometry, just a reference point
  return {
    id: viewer.id,
    type: 'viewer',
    boundingLines: []
  }
}

function wallToGeometry(spec: ComponentSpec): ComponentGeometry {
  const wall = spec as WallSpec
  const direction = directionFromAngle(wall.orientation)
  const halfLength = wall.length / 2
  
  const p1 = add(wall.position, scale(direction, -halfLength))
  const p2 = add(wall.position, scale(direction, halfLength))

  return {
    id: wall.id,
    type: 'wall',
    boundingLines: [{
      p1,
      p2,
      componentId: wall.id,
      reflect: false
    }]
  }
}

function mirrorToGeometry(spec: ComponentSpec): ComponentGeometry {
  const mirror = spec as MirrorSpec
  const direction = directionFromAngle(mirror.orientation)
  const halfLength = mirror.length / 2
  
  const p1 = add(mirror.position, scale(direction, -halfLength))
  const p2 = add(mirror.position, scale(direction, halfLength))

  return {
    id: mirror.id,
    type: 'mirror',
    boundingLines: [{
      p1,
      p2,
      componentId: mirror.id,
      reflect: true
    }]
  }
}

function bunnyToGeometry(spec: ComponentSpec): ComponentGeometry {
  const bunny = spec as BunnySpec
  // Bunny is a small circle approximated by a square
  const size = 0.2 // 20cm square
  const half = size / 2

  const corners = [
    { x: bunny.position.x - half, y: bunny.position.y - half },
    { x: bunny.position.x + half, y: bunny.position.y - half },
    { x: bunny.position.x + half, y: bunny.position.y + half },
    { x: bunny.position.x - half, y: bunny.position.y + half }
  ]

  const boundingLines: LineSegment[] = []
  for (let i = 0; i < corners.length; i++) {
    const next = (i + 1) % corners.length
    boundingLines.push({
      p1: corners[i],
      p2: corners[next],
      componentId: bunny.id,
      reflect: false
    })
  }

  return {
    id: bunny.id,
    type: 'bunny',
    boundingLines
  }
}

function phantomToGeometry(spec: ComponentSpec): ComponentGeometry {
  const phantom = spec as PhantomSpec
  // Phantom bunnies have no collision geometry (they're just visual)
  return {
    id: phantom.id,
    type: 'phantom',
    boundingLines: []
  }
}

export function getAllGeometry(components: ComponentSpec[]): ComponentGeometry[] {
  //components with geometry
  return components.filter(c => c.type in componentToGeometry).map(c => componentToGeometry[c.type](c))
}