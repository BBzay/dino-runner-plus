import { GameEngine } from './engine/GameEngine';
import { FIXED_TIMESTEP } from './utils/constants';

function boot(): void {
  const container = document.getElementById('game-container')!;

  if (!container) {
    console.error('Missing game-container element');
    return;
  }

  const engine = new GameEngine(container);

  let lastTime = performance.now();
  let accumulator = 0;

  function loop(now: number): void {
    const frameTime = Math.min(now - lastTime, 100); // Cap to prevent spiral of death
    lastTime = now;
    accumulator += frameTime;

    while (accumulator >= FIXED_TIMESTEP) {
      engine.update(FIXED_TIMESTEP);
      accumulator -= FIXED_TIMESTEP;
    }

    engine.render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
  console.log('Dino Runner Plus 3D loaded!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
