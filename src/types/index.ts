export type Meter = number;
export type Orientation = number; // Radians from +X axis
export type Vec2 = { x: Meter; y: Meter };

export type ViewerSpec = {
  id: string;
  type: 'viewer';
  position: Vec2;
  orientation: Orientation;
};

export type WallSpec = {
  id: string;
  type: 'wall';
  position: Vec2;
  orientation: Orientation;
  length: Meter;
};

export type MirrorSpec = {
  id: string;
  type: 'mirror';
  position: Vec2;
  orientation: Orientation;
  length: Meter;
};

export type BunnySpec = {
  id: string;
  type: 'bunny';
  position: Vec2;
};

export type PhantomSpec = {
  id: string;
  type: 'phantom';
  position: Vec2;
};

export type MirrorImageSpec = {
  id: string;
  type: 'mirror_image';
  position: Vec2;
};

export type ComponentSpec = ViewerSpec | WallSpec | MirrorSpec | BunnySpec | PhantomSpec | MirrorImageSpec;

export type StageSpec = {
  version: string;
  worldSize: {
    width: Meter;
    height: Meter;
  };
  components: ComponentSpec[];
};

export type LineSegment = {
  p1: Vec2;
  p2: Vec2;
  componentId: string;
  reflect?: boolean; // true for mirrors
};

export type ComponentGeometry = {
  id: string;
  type: 'wall' | 'mirror' | 'bunny' | 'viewer' | 'phantom';
  boundingLines: LineSegment[];
};

export type RaySegment = {
  origin: Vec2;
  direction: Vec2; // normalized unit vector
  length: Meter;
  hitComponentId?: string;
};

export type AppMode = 'edit' | 'sandbox' | 'game';

export type ComponentType = 'viewer' | 'wall' | 'mirror' | 'bunny' | 'phantom' | 'mirror_image';