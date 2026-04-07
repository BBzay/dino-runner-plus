import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from '../utils/constants';

interface ParallaxLayer {
  speed: number;
  offset: number;
  draw: (ctx: CanvasRenderingContext2D, offset: number, time: number) => void;
}

export class Background {
  private layers: ParallaxLayer[] = [];
  private time = 0;
  private dayPhase = 0; // 0-1 for day/night cycle

  constructor() {
    this.layers = [
      { speed: 0.1, offset: 0, draw: this.drawSky.bind(this) },
      { speed: 0.3, offset: 0, draw: this.drawMountains.bind(this) },
      { speed: 0.6, offset: 0, draw: this.drawHills.bind(this) },
      { speed: 1.0, offset: 0, draw: this.drawGround.bind(this) },
    ];
  }

  update(dt: number, scrollSpeed: number): void {
    this.time += dt;
    this.dayPhase = (this.dayPhase + dt * 0.00002) % 1;

    for (const layer of this.layers) {
      layer.offset = (layer.offset + scrollSpeed * layer.speed * (dt / 16.67)) % CANVAS_WIDTH;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.layers) {
      layer.draw(ctx, layer.offset, this.time);
    }
  }

  private drawSky(ctx: CanvasRenderingContext2D, _offset: number, time: number): void {
    // Gradient sky with day/night tint
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);

    const phase = this.dayPhase;
    if (phase < 0.4) {
      // Day
      grad.addColorStop(0, '#1a1a4e');
      grad.addColorStop(0.4, '#2d4a7a');
      grad.addColorStop(1, '#e8a87c');
    } else if (phase < 0.5) {
      // Sunset
      grad.addColorStop(0, '#1a0a2e');
      grad.addColorStop(0.4, '#8b3a62');
      grad.addColorStop(1, '#ff6b35');
    } else if (phase < 0.8) {
      // Night
      grad.addColorStop(0, '#0a0a1a');
      grad.addColorStop(0.5, '#151530');
      grad.addColorStop(1, '#1a1a3e');
    } else {
      // Dawn
      grad.addColorStop(0, '#0f1535');
      grad.addColorStop(0.4, '#3a2a5e');
      grad.addColorStop(1, '#e88a5c');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y + 20);

    // Stars (at night)
    if (phase > 0.45 && phase < 0.85) {
      const starAlpha = phase < 0.55 ? (phase - 0.45) * 10 : phase > 0.75 ? (0.85 - phase) * 10 : 1;
      ctx.save();
      ctx.globalAlpha = starAlpha * 0.8;
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137.5 + 50) % CANVAS_WIDTH;
        const sy = (i * 89.3 + 20) % (GROUND_Y * 0.6);
        const twinkle = Math.sin(time * 0.003 + i * 2) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        const starSize = (i % 3 === 0) ? 2 : 1;
        ctx.fillRect(sx, sy, starSize, starSize);
      }
      ctx.restore();
    }

    // Clouds
    ctx.save();
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 280 + time * 0.01) % (CANVAS_WIDTH + 200)) - 100;
      const cy = 30 + i * 25;
      this.drawCloud(ctx, cx, cy, 40 + i * 10);
    }
    ctx.restore();
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMountains(ctx: CanvasRenderingContext2D, offset: number, _time: number): void {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#2a2a5a';

    const w = CANVAS_WIDTH;
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      const segW = 120 + pass * 40;
      const h = 80 + pass * 30;
      const off = offset * (0.8 + pass * 0.3);
      for (let x = -segW; x <= w + segW; x += segW) {
        const px = x - (off % segW);
        ctx.lineTo(px + segW * 0.5, GROUND_Y - h + Math.sin(px * 0.01) * 20);
        ctx.lineTo(px + segW, GROUND_Y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha -= 0.1;
      ctx.fillStyle = '#3a3a6a';
    }
    ctx.restore();
  }

  private drawHills(ctx: CanvasRenderingContext2D, offset: number, _time: number): void {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 10);
    for (let x = 0; x <= CANVAS_WIDTH; x += 4) {
      const worldX = x + offset;
      const h = Math.sin(worldX * 0.008) * 20 + Math.sin(worldX * 0.015) * 10;
      ctx.lineTo(x, GROUND_Y - 10 + h);
    }
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawGround(ctx: CanvasRenderingContext2D, offset: number, _time: number): void {
    // Ground surface — starts at the player foot level
    const surfaceY = GROUND_Y + 48; // player feet = GROUND_Y + PLAYER_HEIGHT
    const groundGrad = ctx.createLinearGradient(0, surfaceY, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#C8A96E');
    groundGrad.addColorStop(0.4, '#B8955A');
    groundGrad.addColorStop(1, '#8B7240');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, surfaceY, CANVAS_WIDTH, CANVAS_HEIGHT - surfaceY);

    // Dirt transition — thin strip above the surface for visual softness
    const transGrad = ctx.createLinearGradient(0, surfaceY - 6, 0, surfaceY);
    transGrad.addColorStop(0, 'rgba(200, 169, 110, 0)');
    transGrad.addColorStop(1, 'rgba(200, 169, 110, 0.6)');
    ctx.fillStyle = transGrad;
    ctx.fillRect(0, surfaceY - 6, CANVAS_WIDTH, 6);

    // Ground line
    ctx.strokeStyle = '#A0844A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, surfaceY);
    ctx.lineTo(CANVAS_WIDTH, surfaceY);
    ctx.stroke();

    // Ground details — pebbles and lines
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#9E8050';
    for (let i = 0; i < 40; i++) {
      const px = (((i * 47 + 20) - offset * 0.7) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      const py = surfaceY + 4 + (i % 5) * 6;
      const w = 2 + (i % 3) * 2;
      ctx.fillRect(px, py, w, 1);
    }
    ctx.restore();
  }

  reset(): void {
    this.time = 0;
    this.dayPhase = 0;
    for (const layer of this.layers) {
      layer.offset = 0;
    }
  }
}
