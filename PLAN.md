# Dino Runner Plus - Implementation Plan

## Goal
Build a visually polished, feature-rich browser-based endless runner inspired by the Chrome dino game. Differentiate with colorful art, power-ups, multiple characters, particle effects, biome transitions, and mobile-first design.

## Architecture
- **GameEngine** — central orchestrator with state machine (Menu/Playing/Paused/GameOver)
- **Systems** — Physics, Collision, Spawn, Score, Particle (updated each tick)
- **Entities** — Player, Obstacle, PowerUp, Coin (managed by EntityManager with object pooling)
- **Rendering** — Layered renderer: Background → Ground → Entities → Player → Particles → HUD → Effects
- **Input** — Unified keyboard + touch handler mapped to actions (Jump, Duck, Pause)
- **Data** — Config-driven: characters, obstacles, power-ups, difficulty curves as typed objects

## Implementation Phases

### Phase 1: Core Infrastructure
Scaffold project, canvas setup, game loop, state machine, input handling, utility functions.

### Phase 2: Basic Gameplay
Player movement, obstacle spawning, collision detection, scoring, difficulty curve, duck mechanic.

### Phase 3: Visual Enhancements
Sprite system, animations, parallax backgrounds, particle effects, screen effects, color/art.

### Phase 4: Plus Features
Power-ups, coins, multiple characters, character select/unlock, combos, biome transitions, day/night.

### Phase 5: Polish & Performance
Audio, persistence, performance optimization, mobile polish, accessibility, PWA, final QA.

## Current Phase
**Pre-development** — PROJECT.md roadmap complete. Ready to begin Phase 1.

## Open Questions
- Asset sourcing: create original pixel art, use free asset packs, or procedurally generate?
- Online leaderboard: build or skip for MVP?
- Music: original composition or royalty-free?
