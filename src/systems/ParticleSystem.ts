import { PARTICLE_POOL_SIZE } from '../utils/constants';
import { randomRange } from '../utils/math';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'dust' | 'spark' | 'trail' | 'explosion' | 'powerup' | 'coin';
  active: boolean;
}

export class ParticleSystem {
  private pool: Particle[] = [];
  private activeCount = 0;

  constructor() {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.pool.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, size: 2,
      color: '#fff', alpha: 1,
      type: 'dust', active: false,
    };
  }

  private getParticle(): Particle | null {
    for (const p of this.pool) {
      if (!p.active) return p;
    }
    return null;
  }

  emit(x: number, y: number, type: Particle['type'], count: number, color: string, opts?: Partial<{
    vxRange: [number, number];
    vyRange: [number, number];
    sizeRange: [number, number];
    lifeRange: [number, number];
  }>): void {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) return;

      p.active = true;
      p.x = x + randomRange(-4, 4);
      p.y = y + randomRange(-4, 4);
      p.vx = randomRange(opts?.vxRange?.[0] ?? -2, opts?.vxRange?.[1] ?? 2);
      p.vy = randomRange(opts?.vyRange?.[0] ?? -3, opts?.vyRange?.[1] ?? 0);
      p.size = randomRange(opts?.sizeRange?.[0] ?? 1, opts?.sizeRange?.[1] ?? 4);
      p.maxLife = randomRange(opts?.lifeRange?.[0] ?? 300, opts?.lifeRange?.[1] ?? 600);
      p.life = p.maxLife;
      p.color = color;
      p.alpha = 1;
      p.type = type;
    }
  }

  emitDust(x: number, y: number): void {
    this.emit(x, y, 'dust', 4, '#C8B88A', {
      vxRange: [-1.5, 0.5],
      vyRange: [-2, -0.5],
      sizeRange: [2, 5],
      lifeRange: [200, 400],
    });
  }

  emitJumpDust(x: number, y: number): void {
    this.emit(x, y, 'dust', 8, '#D4C4A0', {
      vxRange: [-3, 3],
      vyRange: [-2, -0.2],
      sizeRange: [3, 7],
      lifeRange: [300, 500],
    });
  }

  emitTrail(x: number, y: number, color: string): void {
    this.emit(x, y, 'trail', 1, color, {
      vxRange: [-1, -0.3],
      vyRange: [-0.5, 0.5],
      sizeRange: [2, 4],
      lifeRange: [150, 300],
    });
  }

  emitExplosion(x: number, y: number): void {
    const colors = ['#FF5722', '#FF9800', '#FFC107', '#FFEB3B', '#F44336'];
    for (const color of colors) {
      this.emit(x, y, 'explosion', 6, color, {
        vxRange: [-6, 6],
        vyRange: [-8, 2],
        sizeRange: [3, 8],
        lifeRange: [400, 800],
      });
    }
  }

  emitPowerUpPickup(x: number, y: number, color: string): void {
    this.emit(x, y, 'powerup', 15, color, {
      vxRange: [-4, 4],
      vyRange: [-5, 2],
      sizeRange: [2, 6],
      lifeRange: [400, 700],
    });
  }

  emitCoinPickup(x: number, y: number): void {
    this.emit(x, y, 'coin', 8, '#FFD700', {
      vxRange: [-3, 3],
      vyRange: [-4, 1],
      sizeRange: [2, 5],
      lifeRange: [300, 500],
    });
  }

  emitShieldBreak(x: number, y: number): void {
    this.emit(x, y, 'powerup', 20, '#4CAF50', {
      vxRange: [-5, 5],
      vyRange: [-6, 3],
      sizeRange: [3, 7],
      lifeRange: [500, 900],
    });
  }

  update(dt: number): void {
    this.activeCount = 0;
    for (const p of this.pool) {
      if (!p.active) continue;
      this.activeCount++;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.x += p.vx * (dt / 16.67);
      p.y += p.vy * (dt / 16.67);

      // Gravity for explosion/dust particles
      if (p.type === 'explosion' || p.type === 'dust') {
        p.vy += 0.1 * (dt / 16.67);
      }

      p.alpha = p.life / p.maxLife;
      p.size *= 0.998;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.active) continue;

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'powerup' || p.type === 'coin') {
        // Glowing particles
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }

      ctx.fillStyle = p.color;

      if (p.type === 'trail') {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getPool(): Particle[] {
    return this.pool;
  }

  reset(): void {
    for (const p of this.pool) {
      p.active = false;
    }
  }
}
