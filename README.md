# Dino Runner Plus 3D

A vibrant 3D endless runner inspired by the Chrome dinosaur game, built with Three.js and TypeScript. Dodge obstacles, collect coins, grab power-ups, and unlock new characters as you run through a dynamic 3D world with day/night cycles.

## Features

### 3D Graphics
- Fully procedural 3D models built with Three.js (no external assets)
- Dynamic day/night cycle with smooth sky, lighting, and fog transitions
- Layered environment: scrolling ground detail, mid-range hills, distant mountains, drifting clouds, and starry nights
- ACES filmic tone mapping and shadow mapping for polished visuals

### Playable Characters

| Character | Unlock | Traits |
|-----------|--------|--------|
| **Rex** (green) | Start | Balanced all-around stats |
| **Blaze** (red) | 500 pts | Faster speed, lower jump |
| **Tank** (blue) | 1,000 pts | Higher jump, larger hitbox |
| **Zephyr** (purple) | 2,000 pts | Highest jump, smallest size |
| **Chrome** (gray) | 3,000 pts | Balanced with a speed edge |

Each character has unique 3D models with distinct colors, accessories, and animations.

### Power-Ups

| Power-Up | Color | Duration | Effect |
|----------|-------|----------|--------|
| **Speed Boost** | Blue | 5s | Move faster, score multiplier |
| **Shield** | Green | 6s | Survive one hit (bubble visual) |
| **Double Jump** | Yellow | 8s | Jump again in mid-air (wing visual) |

Active power-ups display as timed progress bars in the HUD.

### Obstacles

- **Small Cactus** -- Short green cacti (from the start)
- **Large Cactus** -- Taller cacti with side arms (100+ pts)
- **Rock** -- Low dodecahedron boulders, duck to clear (200+ pts)
- **Cactus Cluster** -- Triple cacti formation (300+ pts)
- **Bird** -- Flying enemies with flapping wings, duck under them (400+ pts)

New obstacle types appear as your score increases, keeping the challenge fresh.

### Gameplay Systems
- **Coins** -- Collect golden spinning coins scattered along the track
- **Combo system** -- Chain coin pickups for score multipliers
- **Milestone celebrations** -- Visual pop at score milestones (100, 500, 1000...)
- **Progressive difficulty** -- Speed increases over time up to a cap
- **Screen shake and flash** -- Impact feedback on hits
- **Particle effects** -- 200-particle instanced pool for dust, sparks, and power-up trails
- **High score persistence** -- Saved to localStorage along with unlocked characters

### Audio
- 12 synthesized sound effects via Web Audio API (jump, land, hit, coin, power-up, etc.)
- Procedural chip-tune background music
- Press **M** to toggle mute (persisted across sessions)
- Zero external audio files

## How to Play

### Controls

| Action | Keyboard | Mobile/Touch |
|--------|----------|--------------|
| Jump | `Space` or `Up Arrow` | Tap screen |
| Duck | `Down Arrow` | Swipe down / hold bottom half |
| Double Jump | `Space` while airborne (with power-up) | Tap while airborne |
| Select Character | `Left/Right Arrow` on menu | Tap character cards or arrows |
| Start Game | `Space` or `Enter` | Tap screen |
| Restart | `Space` after game over | Tap screen |
| Return to Menu | `Backspace` after game over | -- |
| Mute Audio | `M` | Tap mute button (top right) |

### Objectives
1. **Run** as far as you can without hitting obstacles
2. **Jump** over ground obstacles and **duck** under birds
3. **Collect coins** for bonus points and chain combos
4. **Grab power-ups** for temporary abilities (speed, shield, double jump)
5. **Unlock characters** by reaching score thresholds
6. **Beat your high score** -- it's saved automatically

### Tips
- Birds always fly at the same height. Duck to go under them.
- The shield power-up absorbs exactly one hit, then disappears.
- Speed boost increases your score rate but also makes obstacles arrive faster.
- Double jump is great for last-second corrections when you misjudge a jump.
- New obstacle types appear at score milestones, so the difficulty ramps naturally.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- npm (included with Node.js)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd dino-runner-plus

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`) in your browser.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run all 29 tests |
| `npm run test:watch` | Run tests in watch mode |

## Browser Compatibility

### Recommended
- Chrome 90+ (best WebGL performance)
- Firefox 90+
- Edge 90+
- Safari 15.4+

### Requirements
- **WebGL 2.0** support (required for Three.js rendering)
- **Web Audio API** (required for sound effects and music)
- **ES2020 modules** (modern browsers only, no IE11)
- Hardware-accelerated graphics recommended for smooth 60fps

### Mobile
- Touch input fully supported (tap to jump, swipe/hold to duck)
- Responsive layout scales to any screen size
- `touch-action: none` prevents browser gesture interference
- Game pauses automatically when the tab loses focus

## Tech Stack

- **TypeScript** (strict mode) -- type-safe game logic
- **Three.js** -- WebGL 3D rendering engine
- **Vite** -- fast dev server and optimized production builds
- **Vitest** -- unit testing framework
- **Web Audio API** -- synthesized sound (zero external audio files)
- **HTML/CSS overlays** -- UI layer (HUD, menus) on top of WebGL canvas

## Project Structure

```
src/
  main.ts              -- Bootstrap, game loop (fixed 60Hz timestep)
  engine/              -- GameEngine (orchestrator), GameState (enum)
  audio/               -- AudioManager (Web Audio API synth)
  entities/            -- Player, Obstacle, PowerUp, Coin (2D physics)
  systems/             -- ParticleSystem, SpawnSystem, CollisionSystem, ScoreSystem
  rendering3d/         -- Renderer3D, Scene3D, MeshFactory (Three.js)
  rendering/           -- Legacy 2D Canvas renderer (reference only)
  input/               -- InputHandler (keyboard + touch + mouse)
  ui/                  -- HUD, MenuScreen, GameOverScreen (HTML/CSS)
  data/                -- characters.ts, obstacles.ts, powerups.ts
  utils/               -- constants.ts, math.ts
tests/                 -- Unit tests (math, player, score, collision)
```

## Architecture

The game uses a **2D physics + 3D rendering** architecture:

- All game logic (physics, collisions, spawning, scoring) operates in 2D pixel coordinates
- `Renderer3D` converts 2D positions to 3D world coordinates for visual display
- This separation means game logic is fully testable without any 3D dependencies
- UI uses HTML/CSS overlays positioned on top of the WebGL canvas

## License

MIT
