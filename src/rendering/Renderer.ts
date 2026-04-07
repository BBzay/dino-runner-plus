import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { PowerUp } from '../entities/PowerUp';
import { Coin } from '../entities/Coin';
import { Background } from './Background';
import { CharacterDef } from '../data/characters';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  background: Background;
  private screenShake = 0;
  private shakeIntensity = 0;
  private flashAlpha = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.background = new Background();
    this.setupCanvas();

    window.addEventListener('resize', () => this.setupCanvas());
  }

  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = CANVAS_WIDTH * dpr;
    this.canvas.height = CANVAS_HEIGHT * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  triggerShake(intensity: number): void {
    this.shakeIntensity = intensity;
    this.screenShake = 300;
  }

  triggerFlash(): void {
    this.flashAlpha = 0.6;
  }

  updateEffects(dt: number): void {
    if (this.screenShake > 0) {
      this.screenShake -= dt;
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 0.003);
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  beginFrame(): void {
    this.ctx.save();
    if (this.screenShake > 0) {
      const decay = this.screenShake / 300;
      const dx = (Math.random() - 0.5) * this.shakeIntensity * decay;
      const dy = (Math.random() - 0.5) * this.shakeIntensity * decay;
      this.ctx.translate(dx, dy);
    }
  }

  endFrame(): void {
    // Flash overlay
    if (this.flashAlpha > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    this.ctx.restore();
  }

  drawPlayer(player: Player): void {
    const ctx = this.ctx;
    const { x, y, width, height, character, isJumping, isDucking, isHit, runFrame } = player;

    ctx.save();

    // Hit flash
    if (isHit) {
      ctx.globalAlpha = Math.sin(player.hitTimer * 0.02) > 0 ? 1 : 0.3;
    }

    // Shield visual
    if (player.hasPowerUp('shield')) {
      ctx.save();
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.005) * 0.2;
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height / 2, width * 0.8, height * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
      ctx.fill();
      ctx.restore();
    }

    // Speed boost aura
    if (player.hasPowerUp('speed')) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#2196F3';
      for (let i = 0; i < 3; i++) {
        const trailX = x - 8 - i * 6;
        const trailW = 4;
        const trailH = height * (0.8 - i * 0.2);
        ctx.fillRect(trailX, y + (height - trailH) / 2, trailW, trailH);
      }
      ctx.restore();
    }

    // Double jump wings
    if (player.hasPowerUp('double_jump')) {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.008) * 0.2;
      ctx.fillStyle = '#FFC107';
      // Left wing
      ctx.beginPath();
      ctx.moveTo(x, y + height * 0.3);
      ctx.quadraticCurveTo(x - 14, y - 5, x - 6, y + height * 0.5);
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(x + width, y + height * 0.3);
      ctx.quadraticCurveTo(x + width + 14, y - 5, x + width + 6, y + height * 0.5);
      ctx.fill();
      ctx.restore();
    }

    // Draw the dino character
    this.drawDino(ctx, x, y, width, height, character, isJumping, isDucking, runFrame);

    ctx.restore();
  }

  private drawDino(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    char: CharacterDef,
    jumping: boolean, ducking: boolean, frame: number
  ): void {
    const color = char.color;
    const accent = char.accentColor;

    if (ducking) {
      // Ducking pose — wide and low
      ctx.fillStyle = color;
      this.roundRect(ctx, x, y + 4, w + 10, h - 4, 6);
      ctx.fill();

      // Head
      ctx.fillStyle = color;
      this.roundRect(ctx, x + w - 2, y, 18, h - 6, 4);
      ctx.fill();

      // Eye
      ctx.fillStyle = char.eyeColor;
      ctx.fillRect(x + w + 8, y + 4, 4, 4);
      ctx.fillStyle = '#222';
      ctx.fillRect(x + w + 9, y + 5, 2, 2);
    } else {
      // Body
      ctx.fillStyle = color;
      this.roundRect(ctx, x + 4, y + 4, w - 8, h - 12, 8);
      ctx.fill();

      // Head
      ctx.fillStyle = color;
      this.roundRect(ctx, x + w * 0.3, y - 6, w * 0.6, h * 0.55, 6);
      ctx.fill();

      // Snout
      ctx.fillStyle = accent;
      this.roundRect(ctx, x + w * 0.7, y - 2, w * 0.25, h * 0.25, 3);
      ctx.fill();

      // Eye
      const blinkY = Math.abs(Math.sin(performance.now() * 0.001)) < 0.05 ? 2 : 5;
      ctx.fillStyle = char.eyeColor;
      ctx.fillRect(x + w * 0.65, y + 2, 5, blinkY);
      ctx.fillStyle = '#222';
      ctx.fillRect(x + w * 0.67, y + 3, 3, Math.min(blinkY, 3));

      // Back spikes (character-specific)
      ctx.fillStyle = accent;
      if (char.id === 'trike') {
        // Horn
        ctx.beginPath();
        ctx.moveTo(x + w * 0.8, y - 6);
        ctx.lineTo(x + w * 0.85, y - 16);
        ctx.lineTo(x + w * 0.9, y - 6);
        ctx.fill();
        // Frill
        ctx.beginPath();
        ctx.arc(x + w * 0.3, y - 2, 10, Math.PI, 0);
        ctx.fill();
      } else if (char.id === 'robo') {
        // Antenna
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y - 6);
        ctx.lineTo(x + w * 0.5, y - 16);
        ctx.stroke();
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y - 18, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Default spikes
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const sx = x + 8 + i * 8;
          ctx.moveTo(sx, y + 4);
          ctx.lineTo(sx + 4, y - 4 - i * 2);
          ctx.lineTo(sx + 8, y + 4);
          ctx.fill();
        }
      }

      // Tail
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.3);
      ctx.quadraticCurveTo(x - 12, y + h * 0.2, x - 8, y + h * 0.5);
      ctx.quadraticCurveTo(x - 4, y + h * 0.55, x + 4, y + h * 0.4);
      ctx.fill();

      // Legs with run animation
      ctx.fillStyle = accent;
      const legOffset = jumping ? 0 : Math.sin(frame * 1.2) * 5;

      // Left leg
      ctx.fillRect(x + 10, y + h - 12 + legOffset, 7, 12 - legOffset);
      // Right leg
      ctx.fillRect(x + w - 18, y + h - 12 - legOffset, 7, 12 + legOffset);

      // Feet
      ctx.fillStyle = color;
      ctx.fillRect(x + 8, y + h - 2, 11, 3);
      ctx.fillRect(x + w - 20, y + h - 2, 11, 3);

      // Arms (small)
      ctx.fillStyle = accent;
      ctx.fillRect(x + w * 0.6, y + h * 0.35, 8, 4);
      ctx.fillRect(x + w * 0.6 + 6, y + h * 0.35 + 2, 4, 6);
    }
  }

  drawObstacle(obs: Obstacle): void {
    const ctx = this.ctx;
    const { x, y, width, height, def } = obs;

    ctx.save();

    switch (def.type) {
      case 'small_cactus':
      case 'large_cactus':
        this.drawCactus(ctx, x, y, width, height, def.color, def.accentColor);
        break;
      case 'cactus_cluster':
        this.drawCactusCluster(ctx, x, y, width, height, def.color, def.accentColor);
        break;
      case 'rock':
        this.drawRock(ctx, x, y, width, height, def.color, def.accentColor);
        break;
      case 'bird':
        this.drawBird(ctx, x, y, width, height, def.color, def.accentColor, obs.animFrame);
        break;
    }

    ctx.restore();
  }

  private drawCactus(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, accent: string): void {
    // Main trunk
    ctx.fillStyle = color;
    this.roundRect(ctx, x + w * 0.25, y, w * 0.5, h, 4);
    ctx.fill();

    // Arms
    ctx.fillStyle = accent;
    // Left arm
    ctx.fillRect(x, y + h * 0.25, w * 0.3, w * 0.25);
    ctx.fillRect(x, y + h * 0.1, w * 0.2, h * 0.2);
    // Right arm
    ctx.fillRect(x + w * 0.7, y + h * 0.4, w * 0.3, w * 0.25);
    ctx.fillRect(x + w * 0.8, y + h * 0.25, w * 0.2, h * 0.2);

    // Spines
    ctx.fillStyle = '#A5D6A7';
    for (let i = 0; i < 5; i++) {
      const sy = y + 5 + i * (h / 6);
      ctx.fillRect(x + w * 0.2, sy, 2, 2);
      ctx.fillRect(x + w * 0.7, sy + 3, 2, 2);
    }
  }

  private drawCactusCluster(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, accent: string): void {
    this.drawCactus(ctx, x, y + 4, w * 0.35, h - 4, color, accent);
    this.drawCactus(ctx, x + w * 0.3, y, w * 0.4, h, color, accent);
    this.drawCactus(ctx, x + w * 0.65, y + 8, w * 0.35, h - 8, color, accent);
  }

  private drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, accent: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h);
    ctx.lineTo(x, y + h * 0.6);
    ctx.lineTo(x + w * 0.3, y + h * 0.1);
    ctx.lineTo(x + w * 0.6, y);
    ctx.lineTo(x + w * 0.9, y + h * 0.3);
    ctx.lineTo(x + w, y + h * 0.7);
    ctx.lineTo(x + w * 0.85, y + h);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.15);
    ctx.lineTo(x + w * 0.55, y + h * 0.05);
    ctx.lineTo(x + w * 0.7, y + h * 0.3);
    ctx.lineTo(x + w * 0.4, y + h * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  private drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, accent: string, frame: number): void {
    const wingY = frame === 0 ? -8 : 8;

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.4);
    ctx.quadraticCurveTo(x + w * 0.15, y + h * 0.4 + wingY, x, y + h * 0.5 + wingY);
    ctx.quadraticCurveTo(x + w * 0.2, y + h * 0.5, x + w * 0.35, y + h * 0.45);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + w * 0.7, y + h * 0.4);
    ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.4 + wingY, x + w, y + h * 0.5 + wingY);
    ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.5, x + w * 0.65, y + h * 0.45);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FFA726';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.7, y + h * 0.35);
    ctx.lineTo(x + w * 0.95, y + h * 0.45);
    ctx.lineTo(x + w * 0.7, y + h * 0.5);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + w * 0.55, y + h * 0.3, 4, 4);
    ctx.fillStyle = '#222';
    ctx.fillRect(x + w * 0.56, y + h * 0.32, 2, 2);
  }

  drawPowerUp(pu: PowerUp): void {
    const ctx = this.ctx;
    const { x, y, width, height, def } = pu;
    const cx = x + width / 2;
    const cy = y + height / 2;

    ctx.save();

    // Glow
    const glowSize = 20 + Math.sin(pu.glowTimer) * 5;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
    glow.addColorStop(0, def.glowColor);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 10, y - 10, width + 20, height + 20);

    // Box
    ctx.fillStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 10;
    this.roundRect(ctx, x, y, width, height, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Icon
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    switch (def.type) {
      case 'speed':
        // Lightning bolt
        ctx.beginPath();
        ctx.moveTo(cx + 2, y + 4);
        ctx.lineTo(cx - 5, cy + 2);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx - 2, y + height - 4);
        ctx.lineTo(cx + 5, cy - 2);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();
        break;
      case 'shield':
        // Shield shape
        ctx.beginPath();
        ctx.moveTo(cx, y + 4);
        ctx.quadraticCurveTo(x + width - 3, y + 6, x + width - 3, cy);
        ctx.quadraticCurveTo(x + width - 3, y + height - 5, cx, y + height - 3);
        ctx.quadraticCurveTo(x + 3, y + height - 5, x + 3, cy);
        ctx.quadraticCurveTo(x + 3, y + 6, cx, y + 4);
        ctx.stroke();
        break;
      case 'double_jump':
        // Double arrow up
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy);
        ctx.lineTo(cx, cy - 6);
        ctx.lineTo(cx + 6, cy);
        ctx.moveTo(cx - 6, cy + 6);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + 6, cy + 6);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }

  drawCoin(coin: Coin): void {
    const ctx = this.ctx;
    const { x, y, width, height } = coin;
    const cx = x + width / 2;
    const cy = y + height / 2;

    ctx.save();

    // Glow
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 6;

    // Coin body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx, cy, width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle
    ctx.fillStyle = '#FFA000';
    ctx.beginPath();
    ctx.arc(cx, cy, width / 2 - 3, 0, Math.PI * 2);
    ctx.fill();

    // Dollar sign or star
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${width - 4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy + 1);

    // Sparkle
    const sparkleAlpha = Math.sin(coin.sparkle) * 0.5 + 0.5;
    ctx.globalAlpha = sparkleAlpha;
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 1, cy - width / 2 - 2, 2, 3);

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  reset(): void {
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.background.reset();
  }
}
