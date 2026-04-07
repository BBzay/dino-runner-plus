import { GameState } from './GameState';
import { BASE_SPEED, MAX_SPEED, SPEED_INCREMENT, CANVAS_WIDTH } from '../utils/constants';
import { InputHandler } from '../input/InputHandler';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { PowerUp } from '../entities/PowerUp';
import { Coin } from '../entities/Coin';
import { Renderer3D } from '../rendering3d/Renderer3D';
import { ParticleSystem } from '../systems/ParticleSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { HUD } from '../ui/HUD';
import { MenuScreen } from '../ui/MenuScreen';
import { GameOverScreen } from '../ui/GameOverScreen';
import { CHARACTERS } from '../data/characters';
import { AudioManager } from '../audio/AudioManager';

export class GameEngine {
  private state = GameState.Menu;
  private input: InputHandler;
  private renderer: Renderer3D;
  private particles: ParticleSystem;
  private spawner: SpawnSystem;
  private collision: CollisionSystem;
  private scoreSystem: ScoreSystem;
  private hud: HUD;
  private menu: MenuScreen;
  private gameOver: GameOverScreen;
  private pauseOverlay: HTMLElement;

  private player: Player;
  private obstacles: Obstacle[] = [];
  private powerUps: PowerUp[] = [];
  private coins: Coin[] = [];

  private audio: AudioManager;
  private scrollSpeed = BASE_SPEED;
  private unlockedCharacters = new Set<string>();
  private runTrailTimer = 0;
  private audioInitialized = false;

  constructor(container: HTMLElement) {
    this.renderer = new Renderer3D(container);
    this.input = new InputHandler(container);
    this.particles = new ParticleSystem();
    this.spawner = new SpawnSystem();
    this.collision = new CollisionSystem();
    this.scoreSystem = new ScoreSystem();
    this.hud = new HUD(container);
    this.menu = new MenuScreen(container);
    this.gameOver = new GameOverScreen(container);
    this.audio = new AudioManager();
    this.player = new Player(CHARACTERS[0]);

    // Pause overlay (HTML)
    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.id = 'pause-overlay';
    this.pauseOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: none;
      flex-direction: column; align-items: center; justify-content: center;
      font-family: "Segoe UI", system-ui, sans-serif;
      z-index: 25; pointer-events: none;
    `;
    this.pauseOverlay.innerHTML = `
      <div style="font-size: 32px; font-weight: bold; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
        PAUSED
      </div>
      <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 8px;">
        Press ESC or P to resume
      </div>
    `;
    container.appendChild(this.pauseOverlay);

    this.loadUnlocks();
    this.bindInput();
    this.bindVisibility();

    // Wire mute button to audio
    this.hud.setMuteCallback(() => {
      this.ensureAudio();
      this.audio.toggleMute();
      if (this.audio.isMuted()) {
        this.audio.stopMusic();
      } else if (this.state === GameState.Playing) {
        this.audio.startMusic();
      }
    });

    // Initial UI state
    this.menu.show();
    this.gameOver.hide();
    this.hud.hide();
  }

  private loadUnlocks(): void {
    this.unlockedCharacters.add('classic');
    try {
      const saved = localStorage.getItem('dino-plus-unlocks');
      if (saved) {
        JSON.parse(saved).forEach((id: string) => this.unlockedCharacters.add(id));
      }
    } catch { /* ignore */ }
  }

  private saveUnlocks(): void {
    try {
      localStorage.setItem('dino-plus-unlocks', JSON.stringify([...this.unlockedCharacters]));
    } catch { /* ignore */ }
  }

  private checkUnlocks(): void {
    const score = Math.floor(this.scoreSystem.score);
    for (const char of CHARACTERS) {
      if (!this.unlockedCharacters.has(char.id) && score >= char.unlockScore) {
        this.unlockedCharacters.add(char.id);
        this.saveUnlocks();
      }
    }
  }

  private ensureAudio(): void {
    if (!this.audioInitialized) {
      this.audio.init();
      this.audioInitialized = true;
    }
  }

  private bindInput(): void {
    this.input.on('jump', () => {
      this.ensureAudio();
      switch (this.state) {
        case GameState.Menu:
          this.audio.play('menu_select');
          this.startGame();
          break;
        case GameState.Playing:
          if (this.player.jump()) {
            this.audio.play('jump');
            this.particles.emitJumpDust(
              this.player.x + this.player.width / 2,
              this.player.y + this.player.height,
            );
          }
          break;
        case GameState.Paused:
          this.state = GameState.Playing;
          this.pauseOverlay.style.display = 'none';
          this.audio.startMusic();
          break;
        case GameState.GameOver:
          if (this.gameOver.canRestart()) {
            this.audio.play('menu_select');
            this.startGame();
          }
          break;
      }
    });

    this.input.on('duck', () => {
      if (this.state === GameState.Playing) {
        this.player.duck(true);
      }
      if (this.state === GameState.Menu) {
        this.ensureAudio();
        this.audio.play('menu_move');
        this.menu.nextCharacter();
      }
    });

    this.input.on('pause', () => {
      if (this.state === GameState.Playing) {
        this.state = GameState.Paused;
        this.pauseOverlay.style.display = 'flex';
        this.audio.stopMusic();
      } else if (this.state === GameState.Paused) {
        this.state = GameState.Playing;
        this.pauseOverlay.style.display = 'none';
        this.audio.startMusic();
      }
    });

    this.input.on('back', () => {
      if (this.state === GameState.GameOver) {
        this.audio.play('menu_move');
        this.gameOver.hide();
        this.menu.show();
        this.hud.hide();
        this.state = GameState.Menu;
      }
    });

    this.input.on('select', () => {
      if (this.state === GameState.Menu) {
        this.ensureAudio();
        this.audio.play('menu_select');
        this.startGame();
      }
    });

    // Arrow key character select + mute toggle
    window.addEventListener('keydown', (e) => {
      if (this.state === GameState.Menu) {
        if (e.code === 'ArrowRight') {
          this.ensureAudio();
          this.audio.play('menu_move');
          this.menu.nextCharacter();
        }
        if (e.code === 'ArrowLeft') {
          this.ensureAudio();
          this.audio.play('menu_move');
          this.menu.prevCharacter();
        }
      }
      if (e.code === 'KeyM') {
        this.ensureAudio();
        this.audio.toggleMute();
      }
    });
  }

  private bindVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === GameState.Playing) {
        this.state = GameState.Paused;
        this.pauseOverlay.style.display = 'flex';
        this.audio.stopMusic();
      }
    });
  }

  private startGame(): void {
    const selected = this.menu.getSelectedCharacter();
    if (!this.unlockedCharacters.has(selected.id)) return;

    this.state = GameState.Playing;
    this.scrollSpeed = BASE_SPEED;
    this.obstacles = [];
    this.powerUps = [];
    this.coins = [];
    this.scoreSystem.reset();
    this.spawner.reset();
    this.particles.reset();
    this.renderer.reset();
    this.player.reset(selected);
    this.renderer.updatePlayerCharacter(selected);
    this.runTrailTimer = 0;
    this.audio.startMusic();

    // UI transitions
    this.menu.hide();
    this.gameOver.hide();
    this.hud.show();
    this.pauseOverlay.style.display = 'none';
  }

  update(dt: number): void {
    switch (this.state) {
      case GameState.Menu:
        this.menu.update(dt);
        this.renderer.background.update(dt, 1);
        break;

      case GameState.Playing:
        this.updatePlaying(dt);
        break;

      case GameState.Paused:
        break;

      case GameState.GameOver:
        this.gameOver.update(dt);
        this.particles.update(dt);
        break;
    }

    this.renderer.updateEffects(dt);
  }

  private updatePlaying(dt: number): void {
    // Duck state from held key
    if (!this.input.isDucking()) {
      this.player.duck(false);
    }

    // Dynamic difficulty
    const speedMod = this.player.hasPowerUp('speed') ? 1.4 : 1;
    this.scrollSpeed = Math.min(
      MAX_SPEED,
      BASE_SPEED + this.scoreSystem.score * SPEED_INCREMENT,
    ) * speedMod * this.player.character.speedModifier;

    // Update systems
    this.player.update(dt);
    this.renderer.background.update(dt, this.scrollSpeed);
    this.hud.update(dt);
    this.particles.update(dt);

    // Landing sound
    if (this.player.justLanded) {
      this.audio.play('land');
    }

    // Running trail particles
    if (!this.player.isJumping && !this.player.isDucking) {
      this.runTrailTimer += dt;
      if (this.runTrailTimer > 50) {
        this.runTrailTimer = 0;
        this.particles.emitDust(
          this.player.x + 5,
          this.player.y + this.player.height,
        );
      }
    }

    // Speed trail when boosted
    if (this.player.hasPowerUp('speed')) {
      this.particles.emitTrail(
        this.player.x,
        this.player.y + this.player.height / 2,
        '#2196F3',
      );
    }

    // Spawn entities
    this.spawner.update(dt, this.scoreSystem.score, this.scrollSpeed, this.obstacles, this.powerUps, this.coins);

    // Update entities
    for (const obs of this.obstacles) obs.update(dt, this.scrollSpeed);
    for (const pu of this.powerUps) pu.update(dt, this.scrollSpeed);
    for (const coin of this.coins) coin.update(dt, this.scrollSpeed);

    // Clean up inactive
    this.obstacles = this.obstacles.filter((o) => o.active);
    this.powerUps = this.powerUps.filter((p) => p.active);
    this.coins = this.coins.filter((c) => c.active);

    // Collision
    const result = this.collision.check(this.player, this.obstacles, this.powerUps, this.coins);

    if (result.hitObstacle) {
      this.onDeath();
    }

    if (result.shieldBroken) {
      this.audio.play('shield_break');
      this.particles.emitShieldBreak(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
      );
      this.renderer.triggerShake(4);
    }

    if (result.collectedPowerUp) {
      const pu = result.collectedPowerUp;
      const soundMap: Record<string, 'powerup_speed' | 'powerup_shield' | 'powerup_double_jump'> = {
        speed: 'powerup_speed',
        shield: 'powerup_shield',
        double_jump: 'powerup_double_jump',
      };
      this.audio.play(soundMap[pu.def.type] ?? 'powerup_speed');
      this.particles.emitPowerUpPickup(
        pu.x + pu.width / 2,
        pu.y + pu.height / 2,
        pu.def.color,
      );
    }

    for (const coin of result.collectedCoins) {
      this.audio.play('coin');
      this.scoreSystem.addCoin();
      this.particles.emitCoinPickup(coin.x + coin.width / 2, coin.y + coin.height / 2);
    }

    // Score
    this.scoreSystem.update(dt, speedMod);

    // Milestones
    const milestone = this.scoreSystem.checkMilestone();
    if (milestone) {
      this.audio.play('milestone');
      this.hud.showMilestone(milestone);
      this.particles.emitExplosion(CANVAS_WIDTH / 2, 80);
    }

    // Unlock check
    const prevUnlocks = this.unlockedCharacters.size;
    this.checkUnlocks();
    if (this.unlockedCharacters.size > prevUnlocks) {
      this.audio.play('unlock');
    }
  }

  private onDeath(): void {
    this.state = GameState.GameOver;
    this.audio.stopMusic();
    this.audio.play('death');
    const isNew = this.scoreSystem.saveHighScore();
    this.gameOver.show(isNew);

    this.particles.emitExplosion(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
    );
    this.renderer.triggerShake(10);
    this.renderer.triggerFlash();
  }

  render(): void {
    this.renderer.clear();
    this.renderer.beginFrame();

    switch (this.state) {
      case GameState.Menu:
        this.menu.render(this.scoreSystem.highScore, this.unlockedCharacters);
        break;

      case GameState.Playing:
      case GameState.Paused:
      case GameState.GameOver:
        this.renderGameplay();
        break;
    }

    this.renderer.endFrame();
  }

  private renderGameplay(): void {
    // 3D entities
    for (const coin of this.coins) this.renderer.drawCoin(coin);
    for (const pu of this.powerUps) this.renderer.drawPowerUp(pu);
    for (const obs of this.obstacles) this.renderer.drawObstacle(obs);

    // Particles
    this.renderer.drawParticles(this.particles);

    // Player
    this.renderer.drawPlayer(this.player);

    // HUD (HTML overlay)
    this.hud.render(this.scoreSystem, this.player, this.audio.isMuted());

    // Game Over overlay (HTML)
    if (this.state === GameState.GameOver) {
      this.gameOver.render(this.scoreSystem);
    }
  }
}
