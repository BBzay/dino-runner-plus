import { aabbOverlap } from '../utils/math';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { PowerUp } from '../entities/PowerUp';
import { Coin } from '../entities/Coin';

export interface CollisionResult {
  hitObstacle: boolean;
  shieldBroken: boolean;
  collectedPowerUp: PowerUp | null;
  collectedCoins: Coin[];
}

export class CollisionSystem {
  check(player: Player, obstacles: Obstacle[], powerUps: PowerUp[], coins: Coin[]): CollisionResult {
    const result: CollisionResult = {
      hitObstacle: false,
      shieldBroken: false,
      collectedPowerUp: null,
      collectedCoins: [],
    };

    if (player.isHit) return result;

    const playerBox = player.getHitbox();

    // Check obstacles
    for (const obs of obstacles) {
      if (!obs.active) continue;
      if (aabbOverlap(playerBox, obs.getHitbox())) {
        const hadShield = player.hasPowerUp('shield');
        const died = player.hitObstacle();
        if (died) {
          result.hitObstacle = true;
        } else if (hadShield) {
          result.shieldBroken = true;
          obs.active = false;
        }
        break;
      }
    }

    // Check power-ups
    for (const pu of powerUps) {
      if (!pu.active) continue;
      if (aabbOverlap(playerBox, pu.getHitbox())) {
        player.addPowerUp(pu.def.type, pu.def.duration);
        pu.active = false;
        result.collectedPowerUp = pu;
        break;
      }
    }

    // Check coins
    for (const coin of coins) {
      if (!coin.active) continue;
      if (aabbOverlap(playerBox, coin.getHitbox())) {
        coin.active = false;
        result.collectedCoins.push(coin);
      }
    }

    return result;
  }
}
