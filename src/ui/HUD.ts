import { POWERUPS } from '../data/powerups';
import { ScoreSystem } from '../systems/ScoreSystem';
import { Player } from '../entities/Player';

export class HUD {
  private container: HTMLElement;
  private scoreEl: HTMLElement;
  private highScoreEl: HTMLElement;
  private coinsEl: HTMLElement;
  private comboEl: HTMLElement;
  private powerUpContainer: HTMLElement;
  private muteBtn: HTMLElement;
  private milestoneEl: HTMLElement;

  private milestoneText = '';
  private milestoneTimer = 0;
  private muted = false;
  private onMuteClick: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'hud-overlay';
    this.container.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; font-family: "Segoe UI", system-ui, sans-serif;
      z-index: 10;
    `;

    // Score (top right)
    this.scoreEl = this.makeEl('div', `
      position: absolute; top: 6px; right: 12px;
      font-size: clamp(14px, 3vw, 20px); font-weight: bold; color: #fff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    `);

    // High score
    this.highScoreEl = this.makeEl('div', `
      position: absolute; top: clamp(24px, 5vw, 34px); right: 12px;
      font-size: clamp(9px, 2vw, 12px); color: rgba(255,255,255,0.6);
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    `);

    // Coins (top left)
    this.coinsEl = this.makeEl('div', `
      position: absolute; top: 6px; left: 12px;
      font-size: clamp(12px, 2.5vw, 16px); font-weight: bold; color: #FFD700;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    `);

    // Combo (top center)
    this.comboEl = this.makeEl('div', `
      position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
      font-weight: bold; color: #FF9800;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      transition: font-size 0.1s;
    `);

    // Active power-ups
    this.powerUpContainer = this.makeEl('div', `
      position: absolute; top: 50px; left: 20px;
      display: flex; gap: 8px;
    `);

    // Mute button
    this.muteBtn = this.makeEl('div', `
      position: absolute; top: 56px; right: 14px;
      width: 28px; height: 20px; border-radius: 4px;
      background: rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; color: #fff; opacity: 0.7;
      cursor: pointer; pointer-events: auto;
      user-select: none;
    `);
    this.muteBtn.textContent = 'M';
    this.muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onMuteClick?.();
    });

    // Milestone
    this.milestoneEl = this.makeEl('div', `
      position: absolute; top: clamp(30px, 20%, 70px); left: 50%; transform: translateX(-50%);
      font-size: clamp(20px, 5vw, 32px); font-weight: bold; color: #FFC107;
      text-shadow: 0 0 10px #FF9800, 0 2px 4px rgba(0,0,0,0.5);
      transition: opacity 0.3s, transform 0.3s;
      opacity: 0;
    `);

    parent.appendChild(this.container);
  }

  private makeEl(tag: string, css: string): HTMLElement {
    const el = document.createElement(tag);
    el.style.cssText = css;
    this.container.appendChild(el);
    return el;
  }

  setMuteCallback(cb: () => void): void {
    this.onMuteClick = cb;
  }

  showMilestone(score: number): void {
    this.milestoneText = `${score}!`;
    this.milestoneTimer = 2000;
  }

  update(dt: number): void {
    if (this.milestoneTimer > 0) {
      this.milestoneTimer -= dt;
    }
  }

  render(scoreSystem: ScoreSystem, player: Player, muted: boolean): void {
    this.muted = muted;

    // Score
    const scoreText = String(Math.floor(scoreSystem.score)).padStart(5, '0');
    this.scoreEl.textContent = scoreText;

    // High score
    if (scoreSystem.highScore > 0) {
      this.highScoreEl.textContent = `HI ${String(scoreSystem.highScore).padStart(5, '0')}`;
      this.highScoreEl.style.display = '';
    } else {
      this.highScoreEl.style.display = 'none';
    }

    // Coins
    this.coinsEl.textContent = `$ ${scoreSystem.coins}`;

    // Combo
    if (scoreSystem.combo > 1) {
      const fontSize = Math.min(40, 16 + scoreSystem.combo * 2);
      this.comboEl.style.fontSize = `${fontSize}px`;
      this.comboEl.textContent = `x${scoreSystem.combo} COMBO!`;
      this.comboEl.style.display = '';
    } else {
      this.comboEl.style.display = 'none';
    }

    // Power-ups
    this.powerUpContainer.innerHTML = '';
    for (const [type, expiry] of player.activePowerUps) {
      const remaining = expiry - performance.now();
      if (remaining <= 0) continue;
      const def = POWERUPS.find((p) => p.type === type);
      if (!def) continue;
      const ratio = remaining / def.duration;

      const bar = document.createElement('div');
      bar.style.cssText = `
        width: 80px; height: 20px; border-radius: 4px;
        background: rgba(0,0,0,0.4); position: relative; overflow: hidden;
      `;
      const fill = document.createElement('div');
      fill.style.cssText = `
        width: ${ratio * 100}%; height: 100%; border-radius: 4px;
        background: ${def.color}; position: absolute; top: 0; left: 0;
      `;
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute; top: 0; left: 6px; line-height: 20px;
        font-size: 11px; font-weight: bold; color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      `;
      label.textContent = def.name;
      bar.appendChild(fill);
      bar.appendChild(label);
      this.powerUpContainer.appendChild(bar);
    }

    // Mute
    this.muteBtn.style.color = muted ? '#FF5722' : '#fff';
    this.muteBtn.style.textDecoration = muted ? 'line-through' : 'none';

    // Milestone
    if (this.milestoneTimer > 0) {
      const alpha = Math.min(1, this.milestoneTimer / 500);
      const scale = 1 + (1 - this.milestoneTimer / 2000) * 0.5;
      this.milestoneEl.textContent = this.milestoneText;
      this.milestoneEl.style.opacity = String(alpha);
      this.milestoneEl.style.transform = `translateX(-50%) scale(${scale})`;
    } else {
      this.milestoneEl.style.opacity = '0';
    }
  }

  show(): void { this.container.style.display = ''; }
  hide(): void { this.container.style.display = 'none'; }
}
