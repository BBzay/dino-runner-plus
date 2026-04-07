export type SoundName =
  | 'jump'
  | 'land'
  | 'death'
  | 'powerup_speed'
  | 'powerup_shield'
  | 'powerup_double_jump'
  | 'shield_break'
  | 'coin'
  | 'milestone'
  | 'unlock'
  | 'menu_select'
  | 'menu_move';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = false;
  private sfxVolume = 0.6;
  private musicVolume = 0.3;

  // Background music state
  private musicPlaying = false;
  private musicOscillators: OscillatorNode[] = [];
  private musicGains: GainNode[] = [];
  private musicInterval: number | null = null;
  private musicStep = 0;

  constructor() {
    this.loadSettings();
  }

  /** Must be called from a user gesture (click/tap/keydown) to unlock Web Audio */
  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.applyMute();
    } catch {
      // Web Audio not supported — degrade silently
    }
  }

  play(name: SoundName): void {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    switch (name) {
      case 'jump':          this.playJump(); break;
      case 'land':          this.playLand(); break;
      case 'death':         this.playDeath(); break;
      case 'powerup_speed': this.playPowerUp(440, 660); break;
      case 'powerup_shield': this.playPowerUp(330, 550); break;
      case 'powerup_double_jump': this.playPowerUp(550, 880); break;
      case 'shield_break':  this.playShieldBreak(); break;
      case 'coin':          this.playCoin(); break;
      case 'milestone':     this.playMilestone(); break;
      case 'unlock':        this.playUnlock(); break;
      case 'menu_select':   this.playMenuSelect(); break;
      case 'menu_move':     this.playMenuMove(); break;
    }
  }

  startMusic(): void {
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicStep = 0;
    this.scheduleMusic();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    for (const osc of this.musicOscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.musicOscillators = [];
    this.musicGains = [];
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.applyMute();
    this.saveSettings();
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
    this.saveSettings();
  }

  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
    this.saveSettings();
  }

  getSfxVolume(): number { return this.sfxVolume; }
  getMusicVolume(): number { return this.musicVolume; }

  // ── Sound synthesis ────────────────────────────────────────────

  private playJump(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Quick ascending chirp
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  private playLand(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Low thud with noise
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.1);

    // Noise burst for texture
    this.playNoiseBurst(0.08, 0.15);
  }

  private playDeath(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Descending impact
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.exponentialRampToValueAtTime(60, now + 0.4);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc1.connect(gain1).connect(this.sfxGain!);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Crunch noise
    this.playNoiseBurst(0.25, 0.3);

    // Low rumble
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(60, now);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.6);
    gain2.gain.setValueAtTime(0.2, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc2.connect(gain2).connect(this.sfxGain!);
    osc2.start(now);
    osc2.stop(now + 0.6);
  }

  private playPowerUp(freqStart: number, freqEnd: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Sparkly ascending arpeggio
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.07;
      const freq = freqStart + (freqEnd - freqStart) * (i / 2);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    // Shimmer
    const shimmer = ctx.createOscillator();
    const sGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(freqEnd * 1.5, now + 0.15);
    sGain.gain.setValueAtTime(0.1, now + 0.15);
    sGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    shimmer.connect(sGain).connect(this.sfxGain!);
    shimmer.start(now + 0.15);
    shimmer.stop(now + 0.4);
  }

  private playShieldBreak(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Glass shatter — descending with noise
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.25);

    this.playNoiseBurst(0.2, 0.2);
  }

  private playCoin(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Classic coin ding — two quick notes
    const freqs = [988, 1319]; // B5, E6
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.06;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  private playMilestone(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Triumphant ascending fanfare
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.1;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  private playUnlock(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Celebration — major chord arpeggio then sustain
    const notes = [392, 494, 587, 784, 988]; // G4, B4, D5, G5, B5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.08;
      osc.type = i < 3 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.setValueAtTime(0.15, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  private playMenuSelect(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  private playMenuMove(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 330;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  private playNoiseBurst(duration: number, volume: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length); // Decaying white noise
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    source.connect(gain).connect(this.sfxGain!);
    source.start(now);
  }

  // ── Background Music (procedural chip-tune loop) ───────────────

  private scheduleMusic(): void {
    if (!this.ctx || !this.musicPlaying) return;

    // Upbeat major pentatonic melody loop
    const bpm = 140;
    const beatMs = 60000 / bpm / 2; // eighth notes

    // Melody: pentatonic pattern with rests (0 = rest)
    const melody = [
      523, 587, 659, 784,   0, 784, 659, 587,
      523, 659, 784, 880, 784, 659, 523,   0,
      659, 784, 880, 1047, 880, 784, 659, 523,
      587, 659, 523,   0, 440, 523, 587,   0,
    ];

    // Bass line
    const bass = [
      131, 0, 131, 0,  165, 0, 165, 0,
      175, 0, 175, 0,  131, 0, 131, 0,
      131, 0, 131, 0,  165, 0, 165, 0,
      175, 0, 175, 0,  131, 0, 131, 0,
    ];

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicPlaying || this.muted) return;
      if (this.ctx.state === 'suspended') return;

      const now = this.ctx.currentTime;
      const noteIdx = this.musicStep % melody.length;

      // Melody note
      const melodyFreq = melody[noteIdx];
      if (melodyFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = melodyFreq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.setValueAtTime(0.06, now + (beatMs / 1000) * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (beatMs / 1000) * 0.95);
        osc.connect(gain).connect(this.musicGain!);
        osc.start(now);
        osc.stop(now + beatMs / 1000);
      }

      // Bass note
      const bassFreq = bass[noteIdx];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = bassFreq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (beatMs / 1000) * 0.9);
        osc.connect(gain).connect(this.musicGain!);
        osc.start(now);
        osc.stop(now + beatMs / 1000);
      }

      // Hi-hat on every step
      if (noteIdx % 2 === 0) {
        this.playMusicHat(now);
      }

      // Kick on beats 0, 4, 8, etc.
      if (noteIdx % 4 === 0) {
        this.playMusicKick(now);
      }

      this.musicStep++;
    }, beatMs);
  }

  private playMusicHat(time: number): void {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    // High-pass to make it sizzly
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    source.connect(filter).connect(gain).connect(this.musicGain!);
    source.start(time);
  }

  private playMusicKick(time: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(gain).connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  // ── Persistence ────────────────────────────────────────────────

  private applyMute(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('dino-plus-audio', JSON.stringify({
        muted: this.muted,
        sfxVolume: this.sfxVolume,
        musicVolume: this.musicVolume,
      }));
    } catch { /* ignore */ }
  }

  private loadSettings(): void {
    try {
      const raw = localStorage.getItem('dino-plus-audio');
      if (raw) {
        const data = JSON.parse(raw);
        this.muted = data.muted ?? false;
        this.sfxVolume = data.sfxVolume ?? 0.6;
        this.musicVolume = data.musicVolume ?? 0.3;
      }
    } catch { /* ignore */ }
  }
}
