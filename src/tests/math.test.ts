import { describe, it, expect } from 'vitest'
import { 
  distance, 
  normalize, 
  add, 
  subtract, 
  scale, 
  dot, 
  reflect, 
  directionFromAngle, 
  angleFromDirection,
  lineIntersection,
  rayLineIntersection,
  getNormalFromLine
} from '@/utils/math'

describe('Math Utilities', () => {
  describe('Vector Operations', () => {
    it('should calculate distance between two points', () => {
      const a = { x: 0, y: 0 }
      const b = { x: 3, y: 4 }
      expect(distance(a, b)).toBe(5)
    })

    it('should normalize vectors correctly', () => {
      const vector = { x: 3, y: 4 }
      const normalized = normalize(vector)
      expect(normalized.x).toBeCloseTo(0.6)
      expect(normalized.y).toBeCloseTo(0.8)
      expect(distance({ x: 0, y: 0 }, normalized)).toBeCloseTo(1)
    })

    it('should handle zero vector normalization', () => {
      const zero = { x: 0, y: 0 }
      const normalized = normalize(zero)
      expect(normalized).toEqual({ x: 0, y: 0 })
    })

    it('should add vectors correctly', () => {
      const a = { x: 1, y: 2 }
      const b = { x: 3, y: 4 }
      const result = add(a, b)
      expect(result).toEqual({ x: 4, y: 6 })
    })

    it('should subtract vectors correctly', () => {
      const a = { x: 5, y: 7 }
      const b = { x: 2, y: 3 }
      const result = subtract(a, b)
      expect(result).toEqual({ x: 3, y: 4 })
    })

    it('should scale vectors correctly', () => {
      const vector = { x: 2, y: 3 }
      const scaled = scale(vector, 2.5)
      expect(scaled).toEqual({ x: 5, y: 7.5 })
    })

    it('should calculate dot product correctly', () => {
      const a = { x: 1, y: 2 }
      const b = { x: 3, y: 4 }
      const dotProduct = dot(a, b)
      expect(dotProduct).toBe(11) // 1*3 + 2*4
    })
  })

  describe('Reflection', () => {
    it('should reflect vector off horizontal surface', () => {
      const incident = { x: 1, y: 1 } // 45 degrees down-right
      const normal = { x: 0, y: 1 } // Pointing up
      const reflected = reflect(incident, normal)
      
      expect(reflected.x).toBeCloseTo(1)
      expect(reflected.y).toBeCloseTo(-1) // Reflected vertically
    })

    it('should reflect vector off vertical surface', () => {
      const incident = { x: 1, y: 1 } // 45 degrees up-right
      const normal = { x: 1, y: 0 } // Pointing right
      const reflected = reflect(incident, normal)
      
      expect(reflected.x).toBeCloseTo(-1) // Reflected horizontally
      expect(reflected.y).toBeCloseTo(1)
    })

    it('should reflect vector off diagonal surface', () => {
      const incident = { x: 1, y: 0 } // Horizontal right
      const normal = normalize({ x: 1, y: 1 }) // 45-degree normal
      const reflected = reflect(incident, normal)
      
      expect(reflected.x).toBeCloseTo(0, 1)
      expect(reflected.y).toBeCloseTo(-1, 1)
    })
  })

  describe('Angle Conversions', () => {
    it('should convert angle to direction vector', () => {
      const angle = Math.PI / 4 // 45 degrees
      const direction = directionFromAngle(angle)
      
      expect(direction.x).toBeCloseTo(Math.cos(Math.PI / 4))
      expect(direction.y).toBeCloseTo(Math.sin(Math.PI / 4))
    })

    it('should convert direction vector to angle', () => {
      const direction = { x: 1, y: 1 }
      const angle = angleFromDirection(direction)
      
      expect(angle).toBeCloseTo(Math.PI / 4)
    })

    it('should be consistent in both directions', () => {
      const originalAngle = Math.PI / 3 // 60 degrees
      const direction = directionFromAngle(originalAngle)
      const recoveredAngle = angleFromDirection(direction)
      
      expect(recoveredAngle).toBeCloseTo(originalAngle)
    })
  })

  describe('Line Intersection', () => {
    it('should find intersection of crossing lines', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 2, y: 2 }
      const p3 = { x: 0, y: 2 }
      const p4 = { x: 2, y: 0 }
      
      const intersection = lineIntersection(p1, p2, p3, p4)
      
      expect(intersection).not.toBeNull()
      expect(intersection!.x).toBeCloseTo(1)
      expect(intersection!.y).toBeCloseTo(1)
    })

    it('should return null for parallel lines', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 1, y: 0 }
      const p3 = { x: 0, y: 1 }
      const p4 = { x: 1, y: 1 }
      
      const intersection = lineIntersection(p1, p2, p3, p4)
      
      expect(intersection).toBeNull()
    })

    it('should return null for non-overlapping segments', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 1, y: 0 }
      const p3 = { x: 2, y: -1 }
      const p4 = { x: 2, y: 1 }
      
      const intersection = lineIntersection(p1, p2, p3, p4)
      
      expect(intersection).toBeNull()
    })
  })

  describe('Ray-Line Intersection', () => {
    it('should find intersection when ray hits line segment', () => {
      const rayOrigin = { x: 0, y: 0 }
      const rayDirection = { x: 1, y: 0 } // Right
      const lineStart = { x: 5, y: -1 }
      const lineEnd = { x: 5, y: 1 }
      
      const result = rayLineIntersection(rayOrigin, rayDirection, lineStart, lineEnd)
      
      expect(result).not.toBeNull()
      expect(result!.point.x).toBeCloseTo(5)
      expect(result!.point.y).toBeCloseTo(0)
      expect(result!.distance).toBeCloseTo(5)
    })

    it('should return null when ray points away from line', () => {
      const rayOrigin = { x: 0, y: 0 }
      const rayDirection = { x: -1, y: 0 } // Left
      const lineStart = { x: 5, y: -1 }
      const lineEnd = { x: 5, y: 1 }
      
      const result = rayLineIntersection(rayOrigin, rayDirection, lineStart, lineEnd)
      
      expect(result).toBeNull()
    })

    it('should return null when ray misses line segment', () => {
      const rayOrigin = { x: 0, y: 0 }
      const rayDirection = { x: 1, y: 1 } // Up-right diagonal
      const lineStart = { x: 5, y: -1 }
      const lineEnd = { x: 5, y: 0.5 } // Ray passes above this line
      
      const result = rayLineIntersection(rayOrigin, rayDirection, lineStart, lineEnd)
      
      expect(result).toBeNull()
    })
  })

  describe('Normal Calculation', () => {
    it('should calculate normal for horizontal line', () => {
      const lineStart = { x: 0, y: 0 }
      const lineEnd = { x: 1, y: 0 }
      const normal = getNormalFromLine(lineStart, lineEnd)
      
      expect(normal.x).toBeCloseTo(0)
      expect(normal.y).toBeCloseTo(-1) // Points down (perpendicular to right direction)
    })

    it('should calculate normal for vertical line', () => {
      const lineStart = { x: 0, y: 0 }
      const lineEnd = { x: 0, y: 1 }
      const normal = getNormalFromLine(lineStart, lineEnd)
      
      expect(normal.x).toBeCloseTo(1) // Points right (perpendicular to up direction)
      expect(normal.y).toBeCloseTo(0)
    })

    it('should calculate normal for diagonal line', () => {
      const lineStart = { x: 0, y: 0 }
      const lineEnd = { x: 1, y: 1 }
      const normal = getNormalFromLine(lineStart, lineEnd)
      
      // Normal should be perpendicular and normalized
      expect(distance({ x: 0, y: 0 }, normal)).toBeCloseTo(1)
      expect(normal.x).toBeCloseTo(1 / Math.sqrt(2))
      expect(normal.y).toBeCloseTo(-1 / Math.sqrt(2))
    })
  })
})