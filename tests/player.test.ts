import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../src/entities/Player';
import { CHARACTERS } from '../src/data/characters';
import { GROUND_Y } from '../src/utils/constants';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player(CHARACTERS[0]); // Rex — default
  });

  it('starts on the ground', () => {
    expect(player.y).toBe(GROUND_Y);
    expect(player.isOnGround()).toBe(true);
  });

  it('can jump from the ground', () => {
    const jumped = player.jump();
    expect(jumped).toBe(true);
    expect(player.vy).toBeLessThan(0);
    expect(player.isJumping).toBe(true);
  });

  it('cannot double jump without power-up', () => {
    player.jump();
    const secondJump = player.jump();
    expect(secondJump).toBe(false);
  });

  it('can double jump with power-up', () => {
    player.addPowerUp('double_jump', 10000);
    player.jump();
    player.y = GROUND_Y - 50; // mid-air
    const secondJump = player.jump();
    expect(secondJump).toBe(true);
  });

  it('shield absorbs one hit', () => {
    player.addPowerUp('shield', 10000);
    const died = player.hitObstacle();
    expect(died).toBe(false);
    expect(player.isHit).toBe(false);
  });

  it('dies without shield', () => {
    const died = player.hitObstacle();
    expect(died).toBe(true);
    expect(player.isHit).toBe(true);
  });

  it('falls with gravity', () => {
    player.jump();
    const initialVy = player.vy;
    player.update(16.67);
    expect(player.vy).toBeGreaterThan(initialVy);
  });

  it('lands back on ground', () => {
    player.jump();
    // Simulate many frames
    for (let i = 0; i < 120; i++) {
      player.update(16.67);
    }
    expect(player.y).toBe(GROUND_Y);
    expect(player.isOnGround()).toBe(true);
    expect(player.jumpsUsed).toBe(0);
  });

  it('reset clears all state', () => {
    player.jump();
    player.addPowerUp('shield', 10000);
    player.reset(CHARACTERS[1]);
    expect(player.character.id).toBe('raptor');
    expect(player.isJumping).toBe(false);
    expect(player.activePowerUps.size).toBe(0);
    expect(player.y).toBe(GROUND_Y);
  });
});
