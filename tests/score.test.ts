import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreSystem } from '../src/systems/ScoreSystem';

describe('ScoreSystem', () => {
  let score: ScoreSystem;

  beforeEach(() => {
    score = new ScoreSystem();
    score.reset();
  });

  it('starts at zero', () => {
    expect(score.score).toBe(0);
    expect(score.coins).toBe(0);
    expect(score.combo).toBe(0);
  });

  it('score increases over time', () => {
    score.update(16.67, 1);
    expect(score.score).toBeGreaterThan(0);
  });

  it('speed multiplier affects score rate', () => {
    const s1 = new ScoreSystem();
    s1.reset();
    const s2 = new ScoreSystem();
    s2.reset();

    s1.update(100, 1);
    s2.update(100, 2);
    expect(s2.score).toBeGreaterThan(s1.score);
  });

  it('addCoin increments coins and score', () => {
    score.addCoin();
    expect(score.coins).toBe(1);
    expect(score.score).toBe(5);
  });

  it('combo builds and decays', () => {
    score.addNearMiss();
    expect(score.combo).toBe(1);
    score.addNearMiss();
    expect(score.combo).toBe(2);

    // Simulate decay
    score.update(3000, 1);
    expect(score.combo).toBe(0);
  });

  it('detects milestones', () => {
    score.score = 99;
    expect(score.checkMilestone()).toBeNull();
    score.score = 100;
    expect(score.checkMilestone()).toBe(100);
    // Same milestone not triggered twice
    expect(score.checkMilestone()).toBeNull();
  });

  it('reset clears score but not high score', () => {
    score.score = 500;
    score.coins = 10;
    score.reset();
    expect(score.score).toBe(0);
    expect(score.coins).toBe(0);
  });
});
