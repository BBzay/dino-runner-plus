export class ScoreSystem {
  score = 0;
  highScore = 0;
  coins = 0;
  totalCoins = 0;
  combo = 0;
  comboTimer = 0;
  bestCombo = 0;

  private milestones = new Set<number>();

  constructor() {
    this.loadHighScore();
  }

  update(dt: number, speedMultiplier: number): void {
    this.score += (dt / 16.67) * 0.15 * speedMultiplier;

    // Combo decay
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }
  }

  addCoin(): void {
    this.coins++;
    this.totalCoins++;
    this.score += 5;
  }

  addNearMiss(): void {
    this.combo++;
    this.comboTimer = 2000;
    this.score += this.combo * 3;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
  }

  checkMilestone(): number | null {
    const milestoneValues = [100, 250, 500, 1000, 1500, 2000, 3000, 5000];
    for (const m of milestoneValues) {
      if (Math.floor(this.score) >= m && !this.milestones.has(m)) {
        this.milestones.add(m);
        return m;
      }
    }
    return null;
  }

  saveHighScore(): boolean {
    const isNew = Math.floor(this.score) > this.highScore;
    if (isNew) {
      this.highScore = Math.floor(this.score);
      try {
        localStorage.setItem('dino-plus-highscore', String(this.highScore));
        localStorage.setItem('dino-plus-totalcoins', String(this.totalCoins));
      } catch {
        // localStorage unavailable
      }
    }
    return isNew;
  }

  private loadHighScore(): void {
    try {
      this.highScore = parseInt(localStorage.getItem('dino-plus-highscore') || '0', 10);
      this.totalCoins = parseInt(localStorage.getItem('dino-plus-totalcoins') || '0', 10);
    } catch {
      this.highScore = 0;
      this.totalCoins = 0;
    }
  }

  reset(): void {
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.milestones.clear();
  }
}
