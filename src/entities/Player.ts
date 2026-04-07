import { GRAVITY, JUMP_FORCE, DOUBLE_JUMP_FORCE, GROUND_Y, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DUCK_HEIGHT, PLAYER_X } from '../utils/constants';
import { AABB } from '../utils/math';
import { CharacterDef } from '../data/characters';
import { PowerUpType } from '../data/powerups';

export class Player {
  x = PLAYER_X;
  y = GROUND_Y;
  vy = 0;
  width = PLAYER_WIDTH;
  height = PLAYER_HEIGHT;
  isJumping = false;
  isDucking = false;
  isHit = false;
  jumpsUsed = 0;
  maxJumps = 1;
  character: CharacterDef;

  // Power-up state
  activePowerUps = new Map<PowerUpType, number>(); // type -> expiration timestamp
  shieldHits = 0;

  // Animation
  runFrame = 0;
  runTimer = 0;
  eyeBlink = 0;
  hitTimer = 0;

  // Landing detection — set to true the frame the player touches down
  justLanded = false;
  private wasInAir = false;

  constructor(character: CharacterDef) {
    this.character = character;
    this.width = PLAYER_WIDTH * character.sizeModifier;
    this.height = PLAYER_HEIGHT * character.sizeModifier;
  }

  jump(): boolean {
    if (this.isHit) return false;

    const hasDoubleJump = this.hasPowerUp('double_jump');
    const maxJ = hasDoubleJump ? 2 : this.maxJumps;

    if (this.jumpsUsed < maxJ) {
      const force = this.jumpsUsed === 0
        ? JUMP_FORCE * this.character.jumpModifier
        : DOUBLE_JUMP_FORCE * this.character.jumpModifier;
      this.vy = force;
      this.isJumping = true;
      this.isDucking = false;
      this.jumpsUsed++;
      return true;
    }
    return false;
  }

  duck(active: boolean): void {
    if (this.isHit) return;
    if (!this.isOnGround()) return;
    this.isDucking = active;
  }

  update(dt: number): void {
    this.justLanded = false;

    // Gravity
    if (!this.isOnGround() || this.vy < 0) {
      this.wasInAir = true;
      this.vy += GRAVITY * (dt / 16.67);
      this.y += this.vy * (dt / 16.67);
    }

    // Land
    if (this.y >= GROUND_Y) {
      if (this.wasInAir) {
        this.justLanded = true;
        this.wasInAir = false;
      }
      this.y = GROUND_Y;
      this.vy = 0;
      this.isJumping = false;
      this.jumpsUsed = 0;
    }

    // Update height for ducking
    const baseH = PLAYER_HEIGHT * this.character.sizeModifier;
    const duckH = PLAYER_DUCK_HEIGHT * this.character.sizeModifier;
    this.height = this.isDucking ? duckH : baseH;

    // If ducking, adjust Y so bottom stays on ground
    if (this.isDucking && this.isOnGround()) {
      this.y = GROUND_Y + (baseH - duckH);
    }

    // Animation timer
    this.runTimer += dt;
    if (this.runTimer > 80) {
      this.runFrame = (this.runFrame + 1) % 6;
      this.runTimer = 0;
    }

    // Blink
    this.eyeBlink += dt;
    if (this.eyeBlink > 3000) this.eyeBlink = 0;

    // Hit flash timer
    if (this.isHit) {
      this.hitTimer += dt;
    }

    // Expire power-ups
    const now = performance.now();
    for (const [type, expiry] of this.activePowerUps) {
      if (now >= expiry) {
        this.activePowerUps.delete(type);
      }
    }
  }

  isOnGround(): boolean {
    return this.y >= GROUND_Y;
  }

  hasPowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.has(type);
  }

  addPowerUp(type: PowerUpType, duration: number): void {
    this.activePowerUps.set(type, performance.now() + duration);
    if (type === 'shield') this.shieldHits = 1;
  }

  hitObstacle(): boolean {
    if (this.hasPowerUp('shield') && this.shieldHits > 0) {
      this.shieldHits--;
      if (this.shieldHits <= 0) this.activePowerUps.delete('shield');
      return false; // survived
    }
    this.isHit = true;
    this.hitTimer = 0;
    return true; // dead
  }

  getHitbox(): AABB {
    const shrink = 4;
    return {
      x: this.x + shrink,
      y: this.y + shrink,
      width: this.width - shrink * 2,
      height: this.height - shrink * 2,
    };
  }

  reset(character: CharacterDef): void {
    this.character = character;
    this.x = PLAYER_X;
    this.y = GROUND_Y;
    this.vy = 0;
    this.width = PLAYER_WIDTH * character.sizeModifier;
    this.height = PLAYER_HEIGHT * character.sizeModifier;
    this.isJumping = false;
    this.isDucking = false;
    this.isHit = false;
    this.jumpsUsed = 0;
    this.maxJumps = 1;
    this.activePowerUps.clear();
    this.shieldHits = 0;
    this.runFrame = 0;
    this.hitTimer = 0;
    this.justLanded = false;
    this.wasInAir = false;
  }
}
