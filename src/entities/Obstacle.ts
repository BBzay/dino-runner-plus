import { CANVAS_WIDTH, GROUND_Y } from '../utils/constants';
import { AABB } from '../utils/math';
import { ObstacleDef } from '../data/obstacles';

export class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  def: ObstacleDef;
  active = true;
  animTimer = 0;
  animFrame = 0;

  constructor(def: ObstacleDef, _scrollSpeed: number) {
    this.def = def;
    this.width = def.width;
    this.height = def.height;
    this.x = CANVAS_WIDTH + 20;

    if (def.isFlying) {
      // Position relative to ground surface (player feet), not player top
      // flyHeight is how far above the ground surface the bird's bottom sits
      const groundSurface = GROUND_Y + PLAYER_HEIGHT_APPROX;
      this.y = groundSurface - def.flyHeight - def.height;
    } else {
      this.y = GROUND_Y + (PLAYER_HEIGHT_APPROX - def.height);
    }
  }

  update(dt: number, scrollSpeed: number): void {
    this.x -= scrollSpeed * (dt / 16.67);
    if (this.x + this.width < -20) {
      this.active = false;
    }

    // Bird wing flap animation
    if (this.def.type === 'bird') {
      this.animTimer += dt;
      if (this.animTimer > 150) {
        this.animFrame = (this.animFrame + 1) % 2;
        this.animTimer = 0;
      }
    }
  }

  getHitbox(): AABB {
    const shrink = 3;
    return {
      x: this.x + shrink,
      y: this.y + shrink,
      width: this.width - shrink * 2,
      height: this.height - shrink * 2,
    };
  }
}

const PLAYER_HEIGHT_APPROX = 48;
