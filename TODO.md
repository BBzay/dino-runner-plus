# Dino Runner Plus - TODO

## Phase 1: Core Infrastructure
- [x] Create PROJECT.md with full technical roadmap
- [x] Create CLAUDE.md, PLAN.md, TODO.md project files
- [x] Initialize npm project and install Vite + TypeScript
- [x] Configure tsconfig.json (strict mode)
- [x] Create index.html with centered canvas container
- [x] Implement responsive canvas with DPI scaling
- [x] Define game constants (`src/utils/constants.ts`)
- [x] Implement utility functions — clamp, lerp, randomRange, aabbOverlap (`src/utils/math.ts`)
- [x] Build game loop with fixed timestep (60Hz) in `src/main.ts`
- [x] Implement GameState enum and state machine (`src/engine/GameState.ts`)
- [x] Create GameEngine orchestrator (`src/engine/GameEngine.ts`)
- [x] Build unified input handler — keyboard + touch (`src/input/InputHandler.ts`)
- [x] Create renderer with sky gradient + ground (`src/rendering/Renderer.ts`)

## Phase 2: Basic Gameplay
- [x] Implement Player entity with jump physics
- [x] Add ground scrolling (parallax background)
- [x] Build SpawnSystem for obstacle generation
- [x] Implement AABB collision detection
- [x] Add score system with HUD display
- [x] Build GameOver and restart flow
- [x] Implement difficulty curve (speed + spawn rate)
- [x] Add duck mechanic and flying obstacles (bird)

## Phase 3: Visual Enhancements
- [x] Procedural dino character rendering with per-character features
- [x] Add obstacle variety — cactus, large cactus, cluster, rock, bird (all drawn procedurally)
- [x] Build parallax background (sky, mountains, hills, ground with details)
- [x] Implement particle system (dust, jump dust, trail, explosion, powerup, coin, shield break)
- [x] Add screen effects (shake on collision, white flash on death)
- [x] Day/night sky cycle with stars and clouds

## Phase 4: Plus Features
- [x] Power-up system — Speed Boost (blue), Shield (green), Double Jump (yellow)
- [x] Power-up visuals — glow, float bob, HUD countdown bars, player auras
- [x] Coin collection system with sparkle animation
- [x] 5 playable characters — Rex, Blaze, Tank, Zephyr, Chrome (unique colors, stats, features)
- [x] Character select menu with unlock system (score-based milestones)
- [x] Combo system for near-miss scoring
- [x] Score milestones with particle celebrations
- [x] localStorage persistence — high scores, unlocked characters, total coins

## Phase 5: Polish & Performance
- [x] Implement audio system — 12 synthesized SFX + procedural chip-tune music via Web Audio API
- [x] Mute toggle (M key + clickable HUD button) with localStorage persistence
- [x] localStorage persistence (scores, unlocks, settings)
- [x] Object pooling for particles (200 pool)
- [x] Mobile touch controls (tap to jump, swipe to duck)
- [x] Final QA review — visual polish, mobile, balance, performance, audio
- [x] Fix bird collision (flyHeight 50→18), mute-click-jump conflict, pebble negative X

## Phase 6: 3D Conversion (Three.js)
- [x] Install Three.js and @types/three
- [x] Create Renderer3D with WebGL scene, camera, lighting
- [x] Create Scene3D — ground plane, mountains, hills, clouds, stars, fog, day/night cycle
- [x] Create MeshFactory — procedural 3D models for all entities
- [x] Implement mesh pooling (obstacles, coins, power-ups, particles)
- [x] Convert HUD to HTML/CSS overlay
- [x] Convert MenuScreen to HTML/CSS overlay
- [x] Convert GameOverScreen to HTML/CSS overlay
- [x] Rewire GameEngine to use Renderer3D instead of Canvas 2D Renderer
- [x] Update main.ts — pass container (Three.js creates its own canvas)
- [x] Update index.html — remove canvas element, Three.js manages it
- [x] Add particle pool accessor (getPool) for 3D particle rendering
- [x] All 29 tests passing (game logic untouched)
- [x] TypeScript clean, production build successful
- [x] Update CLAUDE.md and PROJECT.md for 3D architecture

## Phase 7: 3D Polish
- [x] Fix Renderer3D per-frame allocations (reusable Color, Object3D)
- [x] Fix particle z-axis jitter (deterministic offsets via pre-computed Float32Array)
- [x] Fix coin/power-up rotation accumulation (time-based instead of +=)
- [x] Fix PCFSoftShadowMap deprecation warning
- [x] Add body tilt during jump (lean forward/back based on vy)
- [x] Add foot animation synced with leg swing
- [x] Add speed aura mesh (blue streaks) for speed power-up
- [x] Add double-jump wings mesh (golden flapping wings)
- [x] Add shield bubble pulse and rotation
- [x] Fix screen shake to use sine/cosine oscillation (no random jitter)
- [x] Tune camera angle (FOV 45, better position/lookAt)
- [x] Add ACES filmic tone mapping
- [x] Smooth day/night color lerping (no phase snapping)
- [x] Smooth sun/ambient intensity transitions
- [x] Add ground scatter objects (rocks, grass tufts along track)
- [x] Add scrolling ground detail (scatter objects move with game speed)
- [x] Power-up pools per type (correct colors/lights)
- [ ] Add MeshToonMaterial option for stylized look
- [ ] Optimize Three.js tree-shaking for smaller bundle
- [ ] Add accessibility options (reduced motion)
- [ ] Set up PWA (service worker, manifest)
- [ ] Final 3D playtesting and tuning

## Phase 8: Documentation & Deployment
- [x] Create comprehensive README.md (features, controls, install, browser compat)
- [x] Create DEPLOYMENT.md (build, deploy options, testing checklist, troubleshooting)
- [x] Update PROJECT.md with current state (3D polish, linting, all phases)
- [x] ESLint + Prettier configured with npm scripts
- [x] .gitignore added
- [x] Unused import cleanup across 6 files
- [x] Full verification: TypeScript clean, 29/29 tests pass, production build OK

## Final Deployment Tasks (Prioritized)

### Priority 1: Ship-blocking
- [ ] Cross-browser manual playtest (Chrome, Firefox, Edge, Safari)
- [ ] Mobile device manual playtest (iOS Safari, Android Chrome)
- [ ] Initial git commit with all current work
- [ ] Deploy to hosting (GitHub Pages, Netlify, or Vercel)

### Priority 2: Quality of life
- [ ] Add `<meta>` OG tags (title, description, image) for social sharing
- [ ] Add favicon (procedural SVG or small PNG)
- [ ] Suppress Vite chunk size warning via `chunkSizeWarningLimit` in config
- [ ] Final 3D playtesting and difficulty tuning

### Priority 3: Nice to have
- [ ] PWA setup (service worker + manifest for offline play)
- [ ] Reduced motion accessibility option (disable particles, screen shake)
- [ ] MeshToonMaterial toggle for stylized cartoon look
- [ ] Three.js tree-shaking audit for smaller bundle
- [ ] Loading spinner for slower connections (currently near-instant)
