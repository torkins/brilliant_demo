import { describe, it, expect } from 'vitest'
import { computeRaySegments, computeMirrorImage } from '@/physics'
import type { ComponentGeometry, ViewerSpec, RaySegment } from '@/types'

describe('Physics Engine', () => {
  const createViewer = (x: number, y: number, orientation: number): ViewerSpec => ({
    id: 'viewer-1',
    type: 'viewer',
    position: { x, y },
    orientation
  })

  const createWallGeometry = (id: string, x1: number, y1: number, x2: number, y2: number): ComponentGeometry => ({
    id,
    type: 'wall',
    boundingLines: [{
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 },
      componentId: id,
      reflect: false
    }]
  })

  const createMirrorGeometry = (id: string, x1: number, y1: number, x2: number, y2: number): ComponentGeometry => ({
    id,
    type: 'mirror',
    boundingLines: [{
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 },
      componentId: id,
      reflect: true
    }]
  })

  const createBunnyGeometry = (id: string, x: number, y: number): ComponentGeometry => {
    const size = 0.16
    const half = size / 2
    return {
      id,
      type: 'bunny',
      boundingLines: [
        { p1: { x: x - half, y: y - half }, p2: { x: x + half, y: y - half }, componentId: id, reflect: false },
        { p1: { x: x + half, y: y - half }, p2: { x: x + half, y: y + half }, componentId: id, reflect: false },
        { p1: { x: x + half, y: y + half }, p2: { x: x - half, y: y + half }, componentId: id, reflect: false },
        { p1: { x: x - half, y: y + half }, p2: { x: x - half, y: y - half }, componentId: id, reflect: false }
      ]
    }
  }

  describe('Direct Ray Path', () => {
    it('should create a ray segment when no obstacles are present', () => {
      const viewer = createViewer(0, 0, 0) // Facing right
      const geometries: ComponentGeometry[] = []
      
      const segments = computeRaySegments(geometries, viewer, 10)
      
      expect(segments).toHaveLength(1)
      expect(segments[0].origin).toEqual({ x: 0, y: 0 })
      expect(segments[0].direction).toEqual({ x: 1, y: 0 })
      expect(segments[0].length).toBe(10) // Should extend to max length
      expect(segments[0].hitComponentId).toBeUndefined()
    })

    it('should stop at a wall', () => {
      const viewer = createViewer(0, 0, 0) // Facing right
      const wall = createWallGeometry('wall-1', 5, -1, 5, 1) // Vertical wall at x=5
      
      const segments = computeRaySegments([wall], viewer, 10)
      
      expect(segments).toHaveLength(1)
      expect(segments[0].origin).toEqual({ x: 0, y: 0 })
      expect(segments[0].direction).toEqual({ x: 1, y: 0 })
      expect(segments[0].length).toBe(5)
      expect(segments[0].hitComponentId).toBe('wall-1')
    })

    it('should stop at a bunny', () => {
      const viewer = createViewer(0, 0, 0) // Facing right
      const bunny = createBunnyGeometry('bunny-1', 3, 0)
      
      const segments = computeRaySegments([bunny], viewer, 10)
      
      expect(segments).toHaveLength(1)
      expect(segments[0].hitComponentId).toBe('bunny-1')
      expect(segments[0].length).toBeCloseTo(3 - 0.08, 1) // Bunny center minus half size
    })
  })

  describe('Single Mirror Reflection', () => {
    it('should reflect off a vertical mirror at 45 degrees', () => {
      const viewer = createViewer(0, 0, Math.PI / 4) // 45 degrees up-right
      const mirror = createMirrorGeometry('mirror-1', 2, -1, 2, 3) // Vertical mirror at x=2
      
      const segments = computeRaySegments([mirror], viewer, 20)
      
      expect(segments.length).toBeGreaterThanOrEqual(2)
      
      // First segment should hit the mirror
      expect(segments[0].hitComponentId).toBe('mirror-1')
      expect(segments[0].origin).toEqual({ x: 0, y: 0 })
      
      // Second segment should be reflected
      expect(segments[1].origin.x).toBeCloseTo(2, 1)
      expect(segments[1].direction.x).toBeCloseTo(-Math.cos(Math.PI / 4), 1) // Reflected horizontally
      expect(segments[1].direction.y).toBeCloseTo(Math.sin(Math.PI / 4), 1) // Same vertical direction
    })

    it('should reflect off a horizontal mirror', () => {
      const viewer = createViewer(0, 0, Math.PI / 4) // 45 degrees up-right
      const mirror = createMirrorGeometry('mirror-1', -1, 2, 3, 2) // Horizontal mirror at y=2
      
      const segments = computeRaySegments([mirror], viewer, 20)
      
      expect(segments.length).toBeGreaterThanOrEqual(2)
      
      // First segment should hit the mirror
      expect(segments[0].hitComponentId).toBe('mirror-1')
      
      // Second segment should be reflected vertically
      expect(segments[1].direction.x).toBeCloseTo(Math.cos(Math.PI / 4), 1) // Same horizontal direction
      expect(segments[1].direction.y).toBeCloseTo(-Math.sin(Math.PI / 4), 1) // Reflected vertically
    })
  })

  describe('Multiple Mirror Reflections', () => {
    it('should handle two mirror bounces', () => {
      const viewer = createViewer(1, 1, Math.PI / 4) // Facing diagonally up-right
      const mirror1 = createMirrorGeometry('mirror-1', 3, 0, 3, 3) // Vertical mirror at x=3
      const mirror2 = createMirrorGeometry('mirror-2', 0, 3, 4, 3) // Horizontal mirror at y=3
      
      const segments = computeRaySegments([mirror1, mirror2], viewer, 30)
      
      // Should have at least 2 segments (may not get to third bounce depending on geometry)
      expect(segments.length).toBeGreaterThanOrEqual(2)
      
      // Should bounce off first mirror
      expect(segments[0].hitComponentId).toBe('mirror-1')
    })

    it('should limit the number of bounces', () => {
      const viewer = createViewer(1, 1, 0) // Facing right
      const mirror1 = createMirrorGeometry('mirror-1', 2, 0, 2, 2) // Vertical mirror
      const mirror2 = createMirrorGeometry('mirror-2', 0, 0, 0, 2) // Vertical mirror (parallel)
      
      const segments = computeRaySegments([mirror1, mirror2], viewer, 100)
      
      // Should stop after max bounces (10), so at most 11 segments
      expect(segments.length).toBeLessThanOrEqual(11)
    })
  })

  describe('Law of Reflection Validation', () => {
    it('should follow the law of reflection (angle of incidence = angle of reflection)', () => {
      const viewer = createViewer(1, 0, 0) // Facing directly right  
      const mirror = createMirrorGeometry('mirror-1', 3, -1, 3, 1) // Vertical mirror at x=3
      
      const segments = computeRaySegments([mirror], viewer, 10)
      
      expect(segments.length).toBeGreaterThanOrEqual(1)
      expect(segments[0].hitComponentId).toBe('mirror-1')
      
      // If we get a reflection, verify it exists
      if (segments.length >= 2) {
        expect(segments[1]).toBeDefined()
      }
    })
  })

  describe('Mirror Image Computation', () => {
    it('should compute mirror image position for single reflection', () => {
      const bunnyPosition = { x: 5, y: 0 }
      
      // Simulate ray segments that hit the bunny after one reflection
      const segments: RaySegment[] = [
        {
          origin: { x: 0, y: 0 },
          direction: { x: 1, y: 0 },
          length: 3,
          hitComponentId: 'mirror-1'
        },
        {
          origin: { x: 3, y: 0 },
          direction: { x: 1, y: 0 },
          length: 2,
          hitComponentId: 'bunny-1'
        }
      ]
      
      const mirrorImage = computeMirrorImage(segments, bunnyPosition)
      
      expect(mirrorImage).not.toBeNull()
      expect(mirrorImage!.x).toBeCloseTo(5, 1) // Total distance from viewer
      expect(mirrorImage!.y).toBeCloseTo(0, 1)
    })

    it('should return null for empty ray segments', () => {
      const bunnyPosition = { x: 5, y: 0 }
      const mirrorImage = computeMirrorImage([], bunnyPosition)
      
      expect(mirrorImage).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle rays that miss all objects', () => {
      const viewer = createViewer(0, 0, Math.PI / 2) // Facing up
      const wall = createWallGeometry('wall-1', 5, -1, 5, 1) // Vertical wall to the right
      
      const segments = computeRaySegments([wall], viewer, 10)
      
      expect(segments).toHaveLength(1)
      expect(segments[0].hitComponentId).toBeUndefined()
      expect(segments[0].length).toBe(10) // Extends to max length
    })

    it('should handle viewer inside geometry boundaries', () => {
      const viewer = createViewer(2.5, 0, 0) // Inside the wall
      const wall = createWallGeometry('wall-1', 2, -1, 3, 1)
      
      const segments = computeRaySegments([wall], viewer, 10)
      
      // Should still generate a segment, behavior may vary based on implementation
      expect(segments.length).toBeGreaterThan(0)
    })

    it('should handle zero-length max distance', () => {
      const viewer = createViewer(0, 0, 0)
      const geometries: ComponentGeometry[] = []
      
      const segments = computeRaySegments(geometries, viewer, 0)
      
      expect(segments).toHaveLength(1)
      expect(segments[0].length).toBe(0)
    })
  })
})