import { CANVAS_WIDTH, POWERUP_SPAWN_CHANCE, COIN_SPAWN_CHANCE } from '../utils/constants';
import { Obstacle } from '../entities/Obstacle';
import { PowerUp } from '../entities/PowerUp';
import { Coin } from '../entities/Coin';
import { OBSTACLES, ObstacleDef } from '../data/obstacles';
import { POWERUPS } from '../data/powerups';

export class SpawnSystem {
  private obstacleTimer = 0;
  private minGap = 1200;

  update(
    dt: number,
    score: number,
    scrollSpeed: number,
    obstacles: Obstacle[],
    powerUps: PowerUp[],
    coins: Coin[],
  ): void {
    this.obstacleTimer += dt;

    // Dynamic gap based on speed — faster = shorter gap, but with minimum
    const gap = Math.max(600, this.minGap - score * 0.3);

    if (this.obstacleTimer >= gap) {
      this.obstacleTimer = 0;
      const def = this.pickObstacle(score);
      if (def) {
        obstacles.push(new Obstacle(def, scrollSpeed));
      }
    }

    // Power-up spawning
    if (Math.random() < POWERUP_SPAWN_CHANCE * (dt / 16.67)) {
      // Don't spawn if one is already on screen
      const anyOnScreen = powerUps.some((p) => p.active && p.x < CANVAS_WIDTH);
      if (!anyOnScreen) {
        const def = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
        powerUps.push(new PowerUp(def));
      }
    }

    // Coin spawning
    if (Math.random() < COIN_SPAWN_CHANCE * (dt / 16.67)) {
      coins.push(new Coin());
    }
  }

  private pickObstacle(score: number): ObstacleDef | null {
    const eligible = OBSTACLES.filter((o) => score >= o.minScore);
    if (eligible.length === 0) return OBSTACLES[0];

    const totalWeight = eligible.reduce((sum, o) => sum + o.spawnWeight, 0);
    let roll = Math.random() * totalWeight;

    for (const o of eligible) {
      roll -= o.spawnWeight;
      if (roll <= 0) return o;
    }

    return eligible[eligible.length - 1];
  }

  reset(): void {
    this.obstacleTimer = 0;
  }
}
