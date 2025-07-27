import type { Vec2, Meter } from '@/types'

export function distance(a: Vec2, b: Vec2): Meter {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function normalize(vector: Vec2): Vec2 {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
  if (length === 0) return { x: 0, y: 0 }
  return { x: vector.x / length, y: vector.y / length }
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function subtract(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(vector: Vec2, scalar: number): Vec2 {
  return { x: vector.x * scalar, y: vector.y * scalar }
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function reflect(incident: Vec2, normal: Vec2): Vec2 {
  const normalizedNormal = normalize(normal)
  const dotProduct = dot(incident, normalizedNormal)
  return subtract(incident, scale(normalizedNormal, 2 * dotProduct))
}

export function directionFromAngle(angle: number): Vec2 {
  return { x: Math.cos(angle), y: Math.sin(angle) }
}

export function angleFromDirection(direction: Vec2): number {
  return Math.atan2(direction.y, direction.x)
}

export function lineIntersection(
  p1: Vec2, p2: Vec2, // First line segment
  p3: Vec2, p4: Vec2  // Second line segment
): Vec2 | null {
  const x1 = p1.x, y1 = p1.y
  const x2 = p2.x, y2 = p2.y
  const x3 = p3.x, y3 = p3.y
  const x4 = p4.x, y4 = p4.y

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 1e-10) return null // Lines are parallel

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    }
  }

  return null
}

export function rayLineIntersection(
  rayOrigin: Vec2,
  rayDirection: Vec2,
  lineStart: Vec2,
  lineEnd: Vec2
): { point: Vec2; distance: Meter } | null {
  const rayEnd = add(rayOrigin, scale(rayDirection, 1000)) // Extend ray far
  const intersection = lineIntersection(rayOrigin, rayEnd, lineStart, lineEnd)
  
  if (!intersection) return null

  // Check if intersection is in the direction of the ray
  const toIntersection = subtract(intersection, rayOrigin)
  if (dot(toIntersection, rayDirection) < 0) return null

  return {
    point: intersection,
    distance: distance(rayOrigin, intersection)
  }
}

export function getNormalFromLine(lineStart: Vec2, lineEnd: Vec2): Vec2 {
  const direction = subtract(lineEnd, lineStart)
  // Return normal pointing "left" relative to line direction (standard convention)
  return normalize({ x: direction.y, y: -direction.x })
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}