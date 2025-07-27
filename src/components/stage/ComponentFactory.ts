import type { ComponentSpec, ViewerSpec, WallSpec, MirrorSpec, BunnySpec, PhantomSpec } from '@/types'
import type { StageStore } from '@/store'
import type { BaseComponent } from './BaseComponent'
import { ViewerComponent } from './ViewerComponent'
import { WallComponent } from './WallComponent'
import { MirrorComponent } from './MirrorComponent'
import { BunnyComponent } from './BunnyComponent'
import { PhantomBunnyComponent } from './PhantomBunnyComponent'
import { MirrorImageComponent, type MirrorImageSpec } from './MirrorImageComponent'

export class ComponentFactory {
  static create(
    spec: ComponentSpec, 
    store: StageStore, 
    metersToPixelsRatio: number,
    options: { isClickable?: boolean } = {}
  ): BaseComponent {
    switch (spec.type) {
      case 'viewer':
        return new ViewerComponent(spec as ViewerSpec, store, metersToPixelsRatio)
      
      case 'wall':
        return new WallComponent(spec as WallSpec, store, metersToPixelsRatio)
      
      case 'mirror':
        return new MirrorComponent(spec as MirrorSpec, store, metersToPixelsRatio)
      
      case 'bunny':
        return new BunnyComponent(spec as BunnySpec, store, metersToPixelsRatio)
      
      case 'phantom':
        return new PhantomBunnyComponent(
          spec as PhantomSpec, 
          store, 
          metersToPixelsRatio, 
          options.isClickable || false
        )
      
      case 'mirror_image':
        return new MirrorImageComponent(spec as MirrorImageSpec, store, metersToPixelsRatio)
      
      default:
        throw new Error(`Unknown component type: ${(spec as any).type}`)
    }
  }

  static getComponentTypes(): string[] {
    return ['viewer', 'wall', 'mirror', 'bunny', 'phantom', 'mirror_image']
  }

  static isValidComponentType(type: string): boolean {
    return this.getComponentTypes().includes(type)
  }
}