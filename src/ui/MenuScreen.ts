import { CHARACTERS, CharacterDef } from '../data/characters';

export class MenuScreen {
  selectedIndex = 0;
  private container: HTMLElement;
  private titleEl: HTMLElement;
  private charCards: HTMLElement;
  private descEl: HTMLElement;
  private instructEl: HTMLElement;
  private highScoreEl: HTMLElement;
  private bobTimer = 0;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'menu-overlay';
    this.container.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; pointer-events: none;
      font-family: "Segoe UI", system-ui, sans-serif;
      z-index: 20;
    `;

    // Title
    this.titleEl = document.createElement('div');
    this.titleEl.innerHTML = `
      <span style="
        font-size: clamp(24px, 6vw, 42px); font-weight: bold;
        background: linear-gradient(90deg, #4CAF50, #FFC107, #FF5722);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: none;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      ">DINO RUNNER</span>
      <span style="
        font-size: clamp(12px, 3vw, 18px); font-weight: bold; color: #FF5722;
        margin-left: 8px; vertical-align: super;
      ">PLUS</span>
    `;
    this.titleEl.style.cssText = 'margin-bottom: 8px; text-align: center;';
    this.container.appendChild(this.titleEl);

    // "Select your dino"
    const subtitle = document.createElement('div');
    subtitle.textContent = 'SELECT YOUR DINO';
    subtitle.style.cssText = `
      font-size: 14px; font-weight: bold; color: #ddd;
      margin-bottom: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    `;
    this.container.appendChild(subtitle);

    // Character cards row
    this.charCards = document.createElement('div');
    this.charCards.style.cssText = `
      display: flex; gap: clamp(4px, 1.5vw, 10px); align-items: center;
      margin-bottom: 12px; max-width: 100%; padding: 0 8px;
    `;
    this.container.appendChild(this.charCards);

    // Description
    this.descEl = document.createElement('div');
    this.descEl.style.cssText = `
      font-size: 12px; color: rgba(255,255,255,0.7);
      margin-bottom: 20px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      min-height: 16px;
    `;
    this.container.appendChild(this.descEl);

    // Instructions
    this.instructEl = document.createElement('div');
    this.instructEl.style.cssText = `
      text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    `;
    this.instructEl.innerHTML = `
      <div style="font-size: 16px; color: rgba(255,255,255,0.8); margin-bottom: 6px;">
        Press SPACE or TAP to start
      </div>
      <div style="font-size: 11px; color: rgba(255,255,255,0.4);">
        Arrow keys to select character | SPACE to jump | DOWN to duck
      </div>
    `;
    this.container.appendChild(this.instructEl);

    // High score
    this.highScoreEl = document.createElement('div');
    this.highScoreEl.style.cssText = `
      font-size: 14px; font-weight: bold;
      color: rgba(255,193,7,0.8); margin-top: 12px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    `;
    this.container.appendChild(this.highScoreEl);

    parent.appendChild(this.container);
  }

  update(dt: number): void {
    this.bobTimer += dt * 0.003;
  }

  render(highScore: number, unlockedIds: Set<string>): void {
    // Rebuild character cards
    this.charCards.innerHTML = '';

    // Left arrow
    const arrowL = document.createElement('div');
    arrowL.textContent = '<';
    arrowL.style.cssText = 'font-size: 24px; color: rgba(255,255,255,0.5); cursor: pointer; pointer-events: auto; user-select: none; padding: 0 8px;';
    arrowL.addEventListener('click', () => this.prevCharacter());
    this.charCards.appendChild(arrowL);

    for (let i = 0; i < CHARACTERS.length; i++) {
      const char = CHARACTERS[i];
      const isSelected = i === this.selectedIndex;
      const isUnlocked = unlockedIds.has(char.id);
      const dist = Math.abs(i - this.selectedIndex);

      const card = document.createElement('div');
      card.style.cssText = `
        width: clamp(52px, 12vw, 80px); height: clamp(60px, 14vw, 90px); border-radius: 8px;
        background: ${isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'};
        border: ${isSelected ? `2px solid ${char.color}` : '1px solid rgba(255,255,255,0.1)'};
        opacity: ${dist === 0 ? 1 : 0.5};
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; position: relative; transition: all 0.2s;
        cursor: pointer; pointer-events: auto; flex-shrink: 0;
      `;
      card.addEventListener('click', () => {
        this.selectedIndex = i;
      });

      if (!isUnlocked) {
        // Lock icon + condition
        card.innerHTML = `
          <div style="font-size: 24px; opacity: 0.5;">&#128274;</div>
          <div style="font-size: 9px; color: #999; margin-top: 4px; text-align: center; padding: 0 4px;">
            ${char.unlockCondition}
          </div>
        `;
      } else {
        // Mini dino preview (colored box)
        const bob = isSelected ? Math.sin(this.bobTimer + i) * 3 : 0;
        card.innerHTML = `
          <div style="
            width: 24px; height: 30px; border-radius: 5px;
            background: ${char.color}; margin-top: ${-bob}px;
            transition: margin-top 0.1s;
          "></div>
        `;
      }

      // Name
      const name = document.createElement('div');
      name.textContent = char.name;
      name.style.cssText = `
        font-size: 12px; font-weight: bold; margin-top: 4px;
        color: ${isUnlocked ? '#fff' : '#666'};
      `;
      card.appendChild(name);

      this.charCards.appendChild(card);
    }

    // Right arrow
    const arrowR = document.createElement('div');
    arrowR.textContent = '>';
    arrowR.style.cssText = 'font-size: 24px; color: rgba(255,255,255,0.5); cursor: pointer; pointer-events: auto; user-select: none; padding: 0 8px;';
    arrowR.addEventListener('click', () => this.nextCharacter());
    this.charCards.appendChild(arrowR);

    // Description
    const selected = CHARACTERS[this.selectedIndex];
    if (unlockedIds.has(selected.id)) {
      this.descEl.textContent = selected.description;
    } else {
      this.descEl.textContent = '';
    }

    // High score
    if (highScore > 0) {
      this.highScoreEl.textContent = `HIGH SCORE: ${highScore}`;
      this.highScoreEl.style.display = '';
    } else {
      this.highScoreEl.style.display = 'none';
    }
  }

  nextCharacter(): void {
    this.selectedIndex = (this.selectedIndex + 1) % CHARACTERS.length;
  }

  prevCharacter(): void {
    this.selectedIndex = (this.selectedIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
  }

  getSelectedCharacter(): CharacterDef {
    return CHARACTERS[this.selectedIndex];
  }

  show(): void { this.container.style.display = 'flex'; }
  hide(): void { this.container.style.display = 'none'; }
}
