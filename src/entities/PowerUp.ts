import { CANVAS_WIDTH, GROUND_Y } from '../utils/constants';
import { AABB, randomRange } from '../utils/math';
import { PowerUpDef } from '../data/powerups';

export class PowerUp {
  x: number;
  y: number;
  width = 28;
  height = 28;
  def: PowerUpDef;
  active = true;
  floatTimer = 0;
  baseY: number;
  glowTimer = 0;

  constructor(def: PowerUpDef) {
    this.def = def;
    this.x = CANVAS_WIDTH + 20;
    this.baseY = GROUND_Y - randomRange(30, 70);
    this.y = this.baseY;
  }

  update(dt: number, scrollSpeed: number): void {
    this.x -= scrollSpeed * (dt / 16.67);
    if (this.x + this.width < -20) {
      this.active = false;
    }

    // Float bob
    this.floatTimer += dt * 0.003;
    this.y = this.baseY + Math.sin(this.floatTimer) * 6;

    // Glow pulse
    this.glowTimer += dt * 0.004;
  }

  getHitbox(): AABB {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}
