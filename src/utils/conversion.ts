import type { Vec2, Meter } from '@/types'

export function metersToPixels(meters: Meter, ratio: number): number {
  return meters * ratio
}

export function pixelsToMeters(pixels: number, ratio: number): Meter {
  return pixels / ratio
}

export function metersToPixelsVec2(position: Vec2, ratio: number): Vec2 {
  return {
    x: metersToPixels(position.x, ratio),
    y: metersToPixels(position.y, ratio)
  }
}

export function pixelsToMetersVec2(position: Vec2, ratio: number): Vec2 {
  return {
    x: pixelsToMeters(position.x, ratio),
    y: pixelsToMeters(position.y, ratio)
  }
}

export function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180
}

export function radiansToDegrees(radians: number): number {
  return radians * 180 / Math.PI
}