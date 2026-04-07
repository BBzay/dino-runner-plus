export type InputAction = 'jump' | 'duck' | 'pause' | 'select' | 'back';

type ActionCallback = () => void;

export class InputHandler {
  private actions = new Map<InputAction, ActionCallback[]>();
  private keysDown = new Set<string>();
  private duckActive = false;

  constructor(container: HTMLElement) {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    container.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    container.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    container.addEventListener('mousedown', (e) => {
      // Don't emit jump if clicking on a UI element (button, etc.)
      if ((e.target as HTMLElement).closest('[data-ui]') || (e.target as HTMLElement).style.pointerEvents === 'auto') return;
      this.emit('jump');
    });
  }

  on(action: InputAction, callback: ActionCallback): void {
    if (!this.actions.has(action)) this.actions.set(action, []);
    this.actions.get(action)!.push(callback);
  }

  off(action: InputAction, callback: ActionCallback): void {
    const callbacks = this.actions.get(action);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx !== -1) callbacks.splice(idx, 1);
    }
  }

  isDucking(): boolean {
    return this.duckActive;
  }

  private emit(action: InputAction): void {
    const callbacks = this.actions.get(action);
    if (callbacks) callbacks.forEach((cb) => cb());
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.keysDown.has(e.code)) return;
    this.keysDown.add(e.code);

    switch (e.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        this.emit('jump');
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        this.duckActive = true;
        this.emit('duck');
        break;
      case 'Escape':
      case 'KeyP':
        this.emit('pause');
        break;
      case 'Enter':
        this.emit('select');
        break;
      case 'Backspace':
        this.emit('back');
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.duckActive = false;
    }
  }

  private touchStartY = 0;

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.touchStartY = e.touches[0].clientY;
    this.emit('jump');
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    const deltaY = e.changedTouches[0].clientY - this.touchStartY;
    if (deltaY > 30) {
      this.duckActive = true;
      this.emit('duck');
      setTimeout(() => { this.duckActive = false; }, 300);
    }
  }
}
