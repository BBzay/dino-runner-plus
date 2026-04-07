import { describe, it, expect } from 'vitest';
import { CollisionSystem } from '../src/systems/CollisionSystem';
import { Player } from '../src/entities/Player';
import { Obstacle } from '../src/entities/Obstacle';
import { PowerUp } from '../src/entities/PowerUp';
import { CHARACTERS } from '../src/data/characters';
import { OBSTACLES } from '../src/data/obstacles';
import { POWERUPS } from '../src/data/powerups';

describe('CollisionSystem', () => {
  const cs = new CollisionSystem();

  it('detects obstacle collision causing death', () => {
    const player = new Player(CHARACTERS[0]);
    const obs = new Obstacle(OBSTACLES[0], 6);
    obs.x = player.x; // Put obstacle on top of player
    obs.y = player.y;

    const result = cs.check(player, [obs], [], []);
    expect(result.hitObstacle).toBe(true);
  });

  it('shield absorbs hit and breaks', () => {
    const player = new Player(CHARACTERS[0]);
    player.addPowerUp('shield', 10000);

    const obs = new Obstacle(OBSTACLES[0], 6);
    obs.x = player.x;
    obs.y = player.y;

    const result = cs.check(player, [obs], [], []);
    expect(result.hitObstacle).toBe(false);
    expect(result.shieldBroken).toBe(true);
  });

  it('collects power-ups', () => {
    const player = new Player(CHARACTERS[0]);
    const pu = new PowerUp(POWERUPS[0]);
    pu.x = player.x;
    pu.y = player.y;

    const result = cs.check(player, [], [pu], []);
    expect(result.collectedPowerUp).toBe(pu);
    expect(pu.active).toBe(false);
  });
});
