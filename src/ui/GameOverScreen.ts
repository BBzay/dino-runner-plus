import { ScoreSystem } from '../systems/ScoreSystem';

export class GameOverScreen {
  private container: HTMLElement;
  private titleEl: HTMLElement;
  private scoreEl: HTMLElement;
  private coinsEl: HTMLElement;
  private comboEl: HTMLElement;
  private newHighEl: HTMLElement;
  private highScoreEl: HTMLElement;
  private restartHintEl: HTMLElement;
  private overlay: HTMLElement;

  private timer = 0;
  isNewHighScore = false;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'gameover-overlay';
    this.container.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: none; flex-direction: column; align-items: center;
      justify-content: center; pointer-events: none;
      font-family: "Segoe UI", system-ui, sans-serif;
      z-index: 20;
    `;

    // Dim background
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6); opacity: 0; transition: opacity 0.5s;
    `;
    this.container.appendChild(this.overlay);

    // Content wrapper (centered above overlay)
    const content = document.createElement('div');
    content.style.cssText = `
      position: relative; z-index: 1; display: flex; flex-direction: column;
      align-items: center; text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    `;

    this.titleEl = document.createElement('div');
    this.titleEl.textContent = 'GAME OVER';
    this.titleEl.style.cssText = 'font-size: clamp(22px, 6vw, 36px); font-weight: bold; color: #FF5722; margin-bottom: clamp(8px, 2vw, 16px);';
    content.appendChild(this.titleEl);

    this.scoreEl = document.createElement('div');
    this.scoreEl.style.cssText = 'font-size: clamp(16px, 4vw, 24px); font-weight: bold; color: #fff; margin-bottom: 6px;';
    content.appendChild(this.scoreEl);

    this.coinsEl = document.createElement('div');
    this.coinsEl.style.cssText = 'font-size: clamp(13px, 3vw, 18px); color: #FFD700; margin-bottom: 4px;';
    content.appendChild(this.coinsEl);

    this.comboEl = document.createElement('div');
    this.comboEl.style.cssText = 'font-size: clamp(13px, 3vw, 18px); color: #FF9800; margin-bottom: 8px;';
    content.appendChild(this.comboEl);

    this.newHighEl = document.createElement('div');
    this.newHighEl.textContent = 'NEW HIGH SCORE!';
    this.newHighEl.style.cssText = `
      font-size: clamp(14px, 3.5vw, 20px); font-weight: bold; color: #FFC107;
      margin-bottom: 6px; display: none;
      animation: pulse 1s infinite;
    `;
    content.appendChild(this.newHighEl);

    this.highScoreEl = document.createElement('div');
    this.highScoreEl.style.cssText = 'font-size: clamp(10px, 2.5vw, 14px); color: rgba(255,255,255,0.6); margin-bottom: clamp(10px, 3vw, 20px);';
    content.appendChild(this.highScoreEl);

    this.restartHintEl = document.createElement('div');
    this.restartHintEl.style.cssText = 'text-align: center; opacity: 0; transition: opacity 0.5s;';
    this.restartHintEl.innerHTML = `
      <div style="font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 6px;">
        Press SPACE or TAP to restart
      </div>
      <div style="font-size: 12px; color: rgba(255,255,255,0.4);">
        Press BACKSPACE for menu
      </div>
    `;
    content.appendChild(this.restartHintEl);

    this.container.appendChild(content);
    parent.appendChild(this.container);

    // Inject pulse animation
    if (!document.getElementById('dino-keyframes')) {
      const style = document.createElement('style');
      style.id = 'dino-keyframes';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  show(isNewHigh: boolean): void {
    this.timer = 0;
    this.isNewHighScore = isNewHigh;
    this.container.style.display = 'flex';
    // Trigger overlay fade
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });
  }

  hide(): void {
    this.container.style.display = 'none';
    this.overlay.style.opacity = '0';
    this.restartHintEl.style.opacity = '0';
  }

  update(dt: number): void {
    this.timer += dt;
    // Show restart hint after delay
    if (this.timer > 1000) {
      this.restartHintEl.style.opacity = '1';
    }
  }

  render(scoreSystem: ScoreSystem): void {
    this.scoreEl.textContent = `Score: ${Math.floor(scoreSystem.score)}`;
    this.coinsEl.textContent = `Coins: ${scoreSystem.coins}`;

    if (scoreSystem.bestCombo > 1) {
      this.comboEl.textContent = `Best Combo: x${scoreSystem.bestCombo}`;
      this.comboEl.style.display = '';
    } else {
      this.comboEl.style.display = 'none';
    }

    this.newHighEl.style.display = this.isNewHighScore ? '' : 'none';
    this.highScoreEl.textContent = `High Score: ${scoreSystem.highScore}`;
  }

  canRestart(): boolean {
    return this.timer > 800;
  }
}
