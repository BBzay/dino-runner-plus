# Dino Runner Plus 3D

Enhanced Chrome dino runner game with **Three.js 3D graphics**, colorful procedural models, power-ups, multiple characters, and particle effects.

## Tech Stack
- **Language:** TypeScript (strict mode)
- **Rendering:** Three.js WebGL (was Canvas 2D, converted to 3D)
- **UI:** HTML/CSS overlays (HUD, menus, game over screen)
- **Audio:** Web Audio API (synthesized SFX + procedural chip-tune music)
- **Build:** Vite
- **Testing:** Vitest
- **Package Manager:** npm
- **Dependencies:** `three` (runtime), `@types/three` (dev)

## Project Status
- **Phase:** 3D conversion complete — all game logic intact, 3D renderer active
- **Next step:** Polish 3D models, add shadows/fog detail, environment art, PWA

## Build / Run / Test Commands
- `npm install` — install dependencies (includes Three.js)
- `npm run dev` — start Vite dev server with HMR
- `npm run build` — production build to `dist/` (~144KB gzipped with Three.js)
- `npm run test` — run Vitest (29 tests across 4 files)
- Press `M` in-game to toggle mute

## Project Structure
```
src/
  main.ts              — Bootstrap, game loop (fixed 60Hz timestep)
  engine/              — GameEngine (orchestrator), GameState (enum)
  audio/               — AudioManager (Web Audio API synth, no external files)
  entities/            — Player, Obstacle, PowerUp, Coin (2D physics/state, rendering-independent)
  systems/             — ParticleSystem, SpawnSystem, CollisionSystem, ScoreSystem
  rendering/           — [LEGACY] Old 2D Canvas renderer + background (kept for reference)
  rendering3d/         — NEW: Renderer3D, Scene3D, MeshFactory (Three.js 3D rendering)
  input/               — InputHandler (keyboard + touch + mouse)
  ui/                  — HUD, MenuScreen, GameOverScreen (HTML/CSS overlays, not canvas)
  data/                — characters.ts, obstacles.ts, powerups.ts
  utils/               — constants.ts, math.ts
tests/                 — math, player, score, collision tests (test game logic, not rendering)
```

## Architecture: 2D Physics + 3D Rendering
- **Entities stay in 2D pixel coordinates** (x: 0-1200, y: 0-360, GROUND_Y=290)
- **Renderer3D converts 2D positions to 3D world coords** via `toWorldX()` / `toWorldY()`
- This means all physics, collision, spawning, and scoring code is **unchanged**
- Tests pass without modification because they test game logic, not rendering

## Key Decisions
- Fixed timestep game loop (60Hz update) with render interpolation for smooth visuals
- Data-driven design: obstacle types, characters, difficulty curves in `src/data/`
- 3D models built procedurally with Three.js geometry (no external 3D assets)
- UI is HTML/CSS overlays on top of WebGL canvas (not Canvas2D text or Three.js sprites)
- Object pooling for 3D meshes: obstacles, coins, power-ups reuse mesh instances
- All audio synthesized via Web Audio API — zero external files
- Old 2D rendering code kept in `src/rendering/` as reference

## Gotchas
- Three.js canvas is appended by Renderer3D, not in index.html
- Mute button is a real DOM element now (not canvas coordinate hit-testing)
- `PLAYER_HEIGHT_APPROX` in Obstacle.ts is a module-level const below the class — works because constructors run after module init
- Three.js bundle adds ~144KB gzipped — expected for WebGL
- Touch input must prevent default browser behaviors on game container
- Game pauses on `visibilitychange` event (tab switch, screen lock)
