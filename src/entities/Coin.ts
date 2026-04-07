import { CANVAS_WIDTH, GROUND_Y } from '../utils/constants';
import { AABB, randomRange } from '../utils/math';

export class Coin {
  x: number;
  y: number;
  width = 16;
  height = 16;
  active = true;
  floatTimer: number;
  baseY: number;
  sparkle = 0;

  constructor() {
    this.x = CANVAS_WIDTH + 20;
    this.baseY = GROUND_Y - randomRange(10, 60);
    this.y = this.baseY;
    this.floatTimer = Math.random() * Math.PI * 2;
  }

  update(dt: number, scrollSpeed: number): void {
    this.x -= scrollSpeed * (dt / 16.67);
    if (this.x + this.width < -20) {
      this.active = false;
    }

    this.floatTimer += dt * 0.004;
    this.y = this.baseY + Math.sin(this.floatTimer) * 4;

    this.sparkle += dt * 0.005;
  }

  getHitbox(): AABB {
    return { x: this.x - 4, y: this.y - 4, width: this.width + 8, height: this.height + 8 };
  }
}
