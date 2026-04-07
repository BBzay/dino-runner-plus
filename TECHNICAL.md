# Technical Documentation

## Codebase Overview

| Metric | Value |
|--------|-------|
| Language | TypeScript (strict mode) |
| Total source lines | ~4,800 across 29 files |
| Test lines | ~250 across 4 files (29 tests) |
| Runtime dependency | `three` (Three.js r183) |
| Build tool | Vite 8 |
| Bundle size | 575 KB raw / 145 KB gzipped |

## Architecture

```
                    main.ts (bootstrap, 60Hz game loop)
                        |
                    GameEngine (orchestrator)
                   /    |    \         \
             Player  Systems  Input   Audio
              |      /  |  \    |       |
           Physics  Spawn Collision Score  Web Audio API
              |      |      |       |
         [2D pixel coordinates: x 0-1200, y 0-360]
              |      |      |       |
           Renderer3D (2D -> 3D coordinate mapping)
           /       |        \
      Scene3D  MeshFactory  InstancedMesh (particles)
         |         |
    Environment  Procedural 3D models
```

### Core Principle: 2D Logic + 3D Rendering

All game logic operates in 2D pixel coordinates. The rendering layer converts these to 3D world space via two functions:

```typescript
// src/rendering3d/Renderer3D.ts
function toWorldX(px: number): number {
  return (px - CANVAS_WIDTH / 2) * WORLD_SCALE;  // WORLD_SCALE = 0.05
}
function toWorldY(py: number): number {
  const groundSurface2D = GROUND_Y + PLAYER_HEIGHT;
  return (groundSurface2D - py) * WORLD_SCALE;
}
```

This separation means:
- All 29 tests run without Three.js
- Physics, collision, and scoring are deterministic
- The renderer can be swapped without touching game logic

## File-by-File Reference

### Entry Point

**`src/main.ts`** (40 lines)
- Creates `GameEngine` with the DOM container
- Runs fixed-timestep accumulator loop at 60Hz
- Clamps frame time to 100ms to prevent spiral-of-death after tab switches

### Engine Layer

**`src/engine/GameEngine.ts`** (449 lines)
- Central orchestrator. Owns all systems, entities, UI, audio, and renderer.
- State machine: Menu -> Playing -> GameOver (with Paused as a toggle)
- Wires input events to game actions (jump, duck, pause, character select)
- Manages character unlocking, power-up activation, difficulty scaling
- Auto-pauses on `visibilitychange`

**`src/engine/GameState.ts`** (7 lines)
- Enum: `Menu`, `Playing`, `Paused`, `GameOver`, `CharacterSelect`

### Entities

All entities use 2D pixel coordinates. No rendering code.

**`src/entities/Player.ts`** (174 lines)
- Position fixed at x=80, y varies with jump/gravity
- Jump physics: impulse-based (`JUMP_FORCE = -13`), gravity 0.6/tick
- Double jump support when power-up active
- Ducking shrinks height from 48 to 28, adjusts y to keep feet on ground
- `activePowerUps: Map<PowerUpType, expirationTimestamp>`
- `getHitbox()` returns AABB with 4px inset for forgiving collision
- `justLanded` flag set for exactly one frame on ground contact

**`src/entities/Obstacle.ts`** (58 lines)
- Spawns at x=CANVAS_WIDTH+20, scrolls left at game speed
- Flying obstacles (bird) positioned above ground by `flyHeight`
- `animFrame` toggles for bird wing animation
- Deactivated when scrolled off-screen (x < -width)

**`src/entities/PowerUp.ts`** (41 lines)
- Floating collectible with sine-wave bob animation
- Three types: speed, shield, double_jump

**`src/entities/Coin.ts`** (37 lines)
- Gold collectible with sparkle timer

### Systems

**`src/systems/SpawnSystem.ts`** (67 lines)
- Timer-based obstacle spawning: gap = `max(600, 1200 - score * 0.3)` ms
- Weighted random type selection from score-eligible types
- Power-up spawn: 0.8% per tick, max one on screen
- Coin spawn: 2% per tick

**`src/systems/CollisionSystem.ts`** (65 lines)
- Per-frame AABB overlap check: player vs all obstacles, power-ups, coins
- Obstacle hit: if shield active, break shield; else trigger death
- Power-up hit: add to player's active effects with timed expiration
- Coin hit: increment score (+5) and coin counter

**`src/systems/ScoreSystem.ts`** (83 lines)
- Distance score: increments continuously, scaled by speed
- Combo: near-miss detection, combo * 3 bonus, 2-second decay
- Milestones at: 100, 250, 500, 1000, 1500, 2000, 3000, 5000
- High score + total coins persisted to localStorage

**`src/systems/ParticleSystem.ts`** (199 lines)
- Object pool of 200 `Particle` instances (position, velocity, color, size, alpha, lifetime)
- Emitter methods: `emitDust()`, `emitJumpDust()`, `emitExplosion()`, `emitSpeedTrail()`, `emitPowerUpPickup()`, `emitCoinPickup()`, `emitShieldBreak()`
- `getPool()` accessor for 3D renderer to read particle state

### 3D Rendering

**`src/rendering3d/Renderer3D.ts`** (495 lines)
- Creates `WebGLRenderer` with antialias, PCFShadowMap, ACES filmic tone mapping
- `PerspectiveCamera` at FOV 45, positioned at side angle looking ahead
- Pre-allocated mesh pools: 25 obstacles, 15 coins, 6 power-ups, 1 shield, 1 speed aura, 1 wings
- `drawPlayer()`: swaps standing/ducking mesh, animates legs/feet/body tilt, attaches power-up visuals
- `drawObstacle()`: assigns pooled mesh, positions in 3D, animates bird wings
- `drawParticles()`: updates 200-instance `InstancedMesh` with per-instance transforms and colors
- Reusable `_color` and `_dummy` objects prevent per-frame allocation
- Screen shake: sine/cosine oscillation with decay
- Flash overlay: transparent plane attached to camera

**`src/rendering3d/Scene3D.ts`** (270 lines)
- Ground plane with darker runner lane strip
- 30 scattered rocks + 20 grass tufts (scroll with game speed, wrap around)
- 8 far mountains (ConeGeometry) + 12 mid-range hills (hemisphere SphereGeometry)
- 6 cloud groups drifting across sky
- 100 star points with smooth fade during night phase
- FogExp2 with color lerping
- Day/night cycle: smooth color interpolation across 4 phases (day, sunset, night, dawn)
- Sun intensity and ambient light lerp smoothly (no phase snapping)

**`src/rendering3d/MeshFactory.ts`** (385 lines)
- `createPlayerMesh(char)`: body, head, snout, eye, pupil, tail, legs, feet, arms + character-specific features (spikes, horn+frill, antenna+LED)
- `createPlayerDuckMesh(char)`: wide low body, flat head, eye
- `createObstacleMesh(def)`: cactus (cylinder trunk + arms), cluster (3 cylinders), rock (dodecahedron), bird (sphere body + cone beak + box wings + eye)
- `createPowerUpMesh(def)`: emissive box with point light + icon sphere
- `createCoinMesh()`: gold metallic cylinder
- `createShieldMesh()`: transparent green sphere, double-sided
- `createSpeedAuraMesh()`: 3 blue translucent horizontal streaks
- `createDoubleJumpWingsMesh()`: custom BufferGeometry golden wing pair

### Input

**`src/input/InputHandler.ts`** (98 lines)
- Keyboard: Space/Up = jump, Down = duck (hold), Left/Right = character select, Escape/P = pause, Enter = start, Backspace = menu, M = mute
- Touch: tap = jump, hold low = duck. `preventDefault()` blocks browser gestures
- Mouse: click = jump (excluding elements with `pointerEvents: auto` or `[data-ui]`)
- Event-based: callbacks registered by GameEngine

### UI (HTML/CSS Overlays)

**`src/ui/HUD.ts`** (191 lines)
- DOM elements: score (top right), high score, coins (top left), combo (top center, capped font size), power-up countdown bars, mute button (clickable, `pointerEvents: auto`), milestone pop
- `pointer-events: none` on container so clicks pass through to game

**`src/ui/MenuScreen.ts`** (201 lines)
- Gradient title "DINO RUNNER" + "PLUS"
- 5 character cards with selection highlight, lock icons, bobbing animation
- Left/right arrows for navigation
- High score display

**`src/ui/GameOverScreen.ts`** (144 lines)
- Dimmed overlay with fade-in transition
- Score, coins, best combo summary
- "NEW HIGH SCORE!" with CSS pulse animation
- 800ms cooldown before restart accepted

### Audio

**`src/audio/AudioManager.ts`** (505 lines)
- `AudioContext` created on first user gesture (browser autoplay compliance)
- Master gain -> SFX gain (0.6) + Music gain (0.3)
- 12 synthesized SFX: jump (sine chirp), land (triangle thud), death (sawtooth sweep + crunch), coin (two-note ding), shield break (square + noise), 3 power-up arpeggios, milestone fanfare, unlock celebration, menu select/move
- Procedural chip-tune music: 140 BPM, 32-step pentatonic melody (square), alternating bass (triangle), hi-hat (filtered noise), kick (sine sweep)
- Mute state persisted in localStorage

### Data Configuration

**`src/data/characters.ts`** (81 lines) -- 5 `CharacterDef` objects with id, name, colors, description, unlock score, jump/speed/size modifiers

**`src/data/obstacles.ts`** (71 lines) -- 5 `ObstacleDef` objects with type, dimensions, colors, flying flag, min score gate, spawn weight

**`src/data/powerups.ts`** (42 lines) -- 3 `PowerUpDef` objects with type, name, color, duration, description

### Utilities

**`src/utils/constants.ts`** (21 lines) -- Canvas size (1200x360), physics (gravity 0.6, jump force -13), spawn rates, pool sizes, fixed timestep

**`src/utils/math.ts`** (32 lines) -- `clamp`, `lerp`, `randomRange`, `randomInt`, `aabbOverlap`, `AABB` interface

### Legacy (Reference Only)

**`src/rendering/Renderer.ts`**, **`src/rendering/Background.ts`** -- Original Canvas 2D renderer from before Three.js conversion. Not imported by any active code.

## Testing

### Framework
Vitest 4.1, runs via `npm test`. Tests import game logic directly -- no Three.js, no DOM, no canvas.

### Test Files

**`tests/math.test.ts`** (6 tests)
- `clamp()`: value within range, below min, above max
- `lerp()`: t=0 returns start, t=1 returns end, t=0.5 returns midpoint
- `aabbOverlap()`: overlapping boxes, non-overlapping boxes

**`tests/player.test.ts`** (8 tests)
- Starts on ground at correct position
- Jump sets negative vy and isJumping flag
- Double jump fails without power-up
- Double jump succeeds with power-up active
- Shield absorbs hit (returns false)
- No shield means death (returns true)
- Gravity pulls player down over time
- Reset clears all state

**`tests/score.test.ts`** (11 tests)
- Score starts at 0
- Score increases over time
- Speed multiplier scales scoring
- Coins increment correctly
- Combo builds on successive pickups
- Combo decays after timeout
- Milestones fire at correct thresholds
- Milestones don't repeat
- Reset preserves high score
- Reset clears current score and combo
- High score updates when current exceeds previous

**`tests/collision.test.ts`** (4 tests)
- Overlapping obstacle without shield = death
- Overlapping obstacle with shield = survival + shield consumed
- Overlapping power-up = collected
- Overlapping coin = collected

### Running Tests
```bash
npm test           # 29 tests, ~600ms
npm run test:watch # watch mode
```

## Build & Deploy

### Development
```bash
npm run dev    # Vite dev server, auto-opens browser, HMR
```

### Production
```bash
npm run build  # tsc --noEmit && vite build -> dist/
npm run preview # serve dist/ locally
```

### Deployment
GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on push to `main`:
1. `npm ci` + `npm run build`
2. Uploads `dist/` as Pages artifact
3. Deploys via `actions/deploy-pages@v4`

Vite `base: '/dino-runner-plus/'` ensures asset paths resolve on GitHub Pages.

### Quality Checks
```bash
npm run check  # tsc + eslint + prettier (all-in-one)
npm run lint   # eslint only
npm run format # prettier format
```

## Performance Design

| Technique | Where | Impact |
|-----------|-------|--------|
| Fixed 60Hz timestep | `main.ts` | Deterministic physics regardless of display refresh rate |
| Mesh pooling | `Renderer3D` constructor | Zero THREE.Mesh allocation during gameplay |
| InstancedMesh particles | `Renderer3D.drawParticles()` | 200 particles in one draw call |
| Reusable Color/Object3D | `Renderer3D` module scope | No per-frame garbage for particle updates |
| Pre-computed particle z-offsets | `Renderer3D` constructor | Deterministic positioning, no Math.random per frame |
| Time-based rotation | `drawCoin()`, `drawPowerUp()` | No accumulating `+=` drift |
| DPR cap at 2 | `Renderer3D` constructor | Prevents GPU strain on 3x displays |
| Frame time clamp | `main.ts` | Prevents spiral-of-death after tab switch |
| Visibility pause | `GameEngine` | Stops updates when tab hidden |

## Key Patterns

**Data-driven entities**: Characters, obstacles, power-ups defined as typed config arrays in `src/data/`. Adding a new type = add an object to the array; rendering and spawning handle it generically.

**Event-driven input**: InputHandler emits action callbacks. GameEngine binds them to state-specific behavior. No polling.

**Pool-and-toggle rendering**: All 3D meshes pre-allocated at startup. Active entities assigned a visible mesh from the pool. Inactive entities return meshes to the pool. Map tracks entity-to-mesh assignments.

**Separation of concerns**: Entities know nothing about rendering. Systems know nothing about Three.js. The renderer reads entity state each frame and positions meshes accordingly.
