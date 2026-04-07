import * as THREE from 'three';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, PLAYER_HEIGHT, PLAYER_X } from '../utils/constants';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { PowerUp } from '../entities/PowerUp';
import { Coin } from '../entities/Coin';
import { ParticleSystem } from '../systems/ParticleSystem';
import { Scene3D } from './Scene3D';
import {
  createPlayerMesh,
  createPlayerDuckMesh,
  createObstacleMesh,
  createPowerUpMesh,
  createCoinMesh,
  createShieldMesh,
  createSpeedAuraMesh,
  createDoubleJumpWingsMesh,
} from './MeshFactory';
import { CHARACTERS } from '../data/characters';
import { OBSTACLES } from '../data/obstacles';
import { POWERUPS } from '../data/powerups';

// 2D-to-3D coordinate mapping
const WORLD_SCALE = 0.05;

export function toWorldX(px: number): number {
  return (px - CANVAS_WIDTH / 2) * WORLD_SCALE;
}

export function toWorldY(py: number): number {
  const groundSurface2D = GROUND_Y + PLAYER_HEIGHT;
  return (groundSurface2D - py) * WORLD_SCALE;
}

// Reusable objects to avoid per-frame allocation
const _color = new THREE.Color();
const _dummy = new THREE.Object3D();

export class Renderer3D {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  background: Scene3D;

  // Effects
  private screenShake = 0;
  private shakeIntensity = 0;
  private flashAlpha = 0;
  private flashPlane: THREE.Mesh;
  private time = 0;

  // Entity meshes
  private playerStandMesh: THREE.Group;
  private playerDuckMesh: THREE.Group;
  private shieldMesh: THREE.Mesh;
  private speedAura: THREE.Group;
  private doubleJumpWings: THREE.Group;
  private obstaclePool: Map<string, THREE.Group[]> = new Map();
  private activeObstacleMeshes: Map<Obstacle, THREE.Group> = new Map();
  private coinPool: THREE.Mesh[] = [];
  private activeCoinMeshes: Map<Coin, THREE.Mesh> = new Map();
  private powerUpPool: Map<string, THREE.Group[]> = new Map();
  private activePowerUpMeshes: Map<PowerUp, THREE.Group> = new Map();

  // Particles
  private particleMesh: THREE.InstancedMesh;
  private particleZOffsets: Float32Array; // deterministic z per slot

  // Camera
  private cameraBasePos = new THREE.Vector3();
  private cameraLookAt = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.updateRendererSize(container);

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.borderRadius = '12px';
    container.appendChild(canvas);

    // Scene
    this.scene = new THREE.Scene();

    // Camera — side view, slightly elevated, looking ahead along the track
    this.camera = new THREE.PerspectiveCamera(45, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 200);
    const playerWorldX = toWorldX(PLAYER_X);
    this.cameraBasePos.set(playerWorldX + 1, 2.8, 9);
    this.cameraLookAt.set(playerWorldX + 5, 0.8, 0);
    this.camera.position.copy(this.cameraBasePos);
    this.camera.lookAt(this.cameraLookAt);

    // Environment
    this.background = new Scene3D(this.scene);

    // Flash overlay attached to camera
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    this.flashPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), flashMat);
    this.flashPlane.renderOrder = 999;
    this.flashPlane.frustumCulled = false;
    this.camera.add(this.flashPlane);
    this.flashPlane.position.set(0, 0, -3);
    this.scene.add(this.camera);

    // Player meshes
    this.playerStandMesh = createPlayerMesh(CHARACTERS[0]);
    this.playerDuckMesh = createPlayerDuckMesh(CHARACTERS[0]);
    this.playerDuckMesh.visible = false;
    this.scene.add(this.playerStandMesh);
    this.scene.add(this.playerDuckMesh);

    // Shield (hidden)
    this.shieldMesh = createShieldMesh();
    this.shieldMesh.visible = false;
    this.scene.add(this.shieldMesh);

    // Speed aura (hidden)
    this.speedAura = createSpeedAuraMesh();
    this.speedAura.visible = false;
    this.scene.add(this.speedAura);

    // Double-jump wings (hidden)
    this.doubleJumpWings = createDoubleJumpWingsMesh();
    this.doubleJumpWings.visible = false;
    this.scene.add(this.doubleJumpWings);

    // Obstacle pools
    for (const def of OBSTACLES) {
      const pool: THREE.Group[] = [];
      for (let i = 0; i < 5; i++) {
        const mesh = createObstacleMesh(def);
        mesh.visible = false;
        this.scene.add(mesh);
        pool.push(mesh);
      }
      this.obstaclePool.set(def.type, pool);
    }

    // Coin pool
    for (let i = 0; i < 15; i++) {
      const mesh = createCoinMesh();
      mesh.visible = false;
      this.scene.add(mesh);
      this.coinPool.push(mesh);
    }

    // Power-up pools (per type, so each gets the right color/light)
    for (const def of POWERUPS) {
      const pool: THREE.Group[] = [];
      for (let i = 0; i < 2; i++) {
        const mesh = createPowerUpMesh(def);
        mesh.visible = false;
        this.scene.add(mesh);
        pool.push(mesh);
      }
      this.powerUpPool.set(def.type, pool);
    }

    // Particle instanced mesh with vertex colors
    const particleGeo = new THREE.SphereGeometry(0.06, 4, 3);
    const particleMat = new THREE.MeshBasicMaterial({ vertexColors: false });
    this.particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, 200);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;
    this.scene.add(this.particleMesh);

    // Pre-compute deterministic z offsets for particles
    this.particleZOffsets = new Float32Array(200);
    for (let i = 0; i < 200; i++) {
      this.particleZOffsets[i] = (Math.sin(i * 7.13) * 0.5 + Math.cos(i * 3.71) * 0.3) * 0.4;
    }

    window.addEventListener('resize', () => this.updateRendererSize(container));
  }

  private updateRendererSize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  // --- Effects ---

  triggerShake(intensity: number): void {
    this.shakeIntensity = intensity * 0.015;
    this.screenShake = 300;
  }

  triggerFlash(): void {
    this.flashAlpha = 0.7;
  }

  updateEffects(dt: number): void {
    this.time += dt;
    if (this.screenShake > 0) this.screenShake -= dt;
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 0.004);
  }

  reset(): void {
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.background.reset();
    this.hideAllPooled();
  }

  private hideAllPooled(): void {
    for (const [, pool] of this.obstaclePool) {
      for (const m of pool) m.visible = false;
    }
    for (const m of this.coinPool) m.visible = false;
    for (const [, pool] of this.powerUpPool) {
      for (const m of pool) m.visible = false;
    }
    this.activeObstacleMeshes.clear();
    this.activeCoinMeshes.clear();
    this.activePowerUpMeshes.clear();
    this.shieldMesh.visible = false;
    this.speedAura.visible = false;
    this.doubleJumpWings.visible = false;
  }

  updatePlayerCharacter(char: typeof CHARACTERS[0]): void {
    this.scene.remove(this.playerStandMesh);
    this.scene.remove(this.playerDuckMesh);
    this.playerStandMesh = createPlayerMesh(char);
    this.playerDuckMesh = createPlayerDuckMesh(char);
    this.playerDuckMesh.visible = false;
    this.scene.add(this.playerStandMesh);
    this.scene.add(this.playerDuckMesh);
  }

  // --- Draw methods ---

  drawPlayer(player: Player): void {
    const wx = toWorldX(player.x);
    const wy = toWorldY(player.y + player.height);
    const t = this.time;

    if (player.isDucking) {
      this.playerStandMesh.visible = false;
      this.playerDuckMesh.visible = true;
      this.playerDuckMesh.position.set(wx, wy, 0);
      this.playerDuckMesh.rotation.z = 0;
    } else {
      this.playerStandMesh.visible = true;
      this.playerDuckMesh.visible = false;
      this.playerStandMesh.position.set(wx, wy, 0);

      // Run animation — legs and feet swing together
      const legAngle = player.isJumping ? 0 : Math.sin(player.runFrame * 1.2) * 0.6;
      const leftLeg = this.playerStandMesh.getObjectByName('leftLeg');
      const rightLeg = this.playerStandMesh.getObjectByName('rightLeg');
      const leftFoot = this.playerStandMesh.getObjectByName('leftFoot');
      const rightFoot = this.playerStandMesh.getObjectByName('rightFoot');
      if (leftLeg) leftLeg.rotation.x = legAngle;
      if (rightLeg) rightLeg.rotation.x = -legAngle;
      if (leftFoot) leftFoot.position.y = -0.12 + Math.abs(legAngle) * 0.06;
      if (rightFoot) rightFoot.position.y = -0.12 + Math.abs(legAngle) * 0.06;

      // Body tilt: lean forward when jumping up, lean back when falling
      if (player.isJumping) {
        const tilt = player.vy < 0 ? -0.12 : 0.08;
        this.playerStandMesh.rotation.z = tilt;
      } else {
        this.playerStandMesh.rotation.z = 0;
      }
    }

    // Hit flash
    if (player.isHit) {
      const vis = Math.sin(player.hitTimer * 0.02) > 0;
      this.playerStandMesh.visible = vis && !player.isDucking;
      this.playerDuckMesh.visible = vis && player.isDucking;
    }

    // Active mesh reference for attachments
    const activeMesh = player.isDucking ? this.playerDuckMesh : this.playerStandMesh;

    // Shield bubble
    if (player.hasPowerUp('shield')) {
      this.shieldMesh.visible = true;
      this.shieldMesh.position.copy(activeMesh.position);
      this.shieldMesh.position.y += 0.5;
      const pulse = 1 + Math.sin(t * 0.005) * 0.08;
      this.shieldMesh.scale.setScalar(pulse);
      this.shieldMesh.rotation.y = t * 0.001;
    } else {
      this.shieldMesh.visible = false;
    }

    // Speed aura (blue streaks behind)
    if (player.hasPowerUp('speed')) {
      this.speedAura.visible = true;
      this.speedAura.position.copy(activeMesh.position);
      this.speedAura.position.x -= 0.5;
      this.speedAura.position.y += 0.4;
      // Pulsing stretch
      const stretch = 1 + Math.sin(t * 0.008) * 0.15;
      this.speedAura.scale.set(stretch, 1, 1);
    } else {
      this.speedAura.visible = false;
    }

    // Double-jump wings
    if (player.hasPowerUp('double_jump')) {
      this.doubleJumpWings.visible = true;
      this.doubleJumpWings.position.copy(activeMesh.position);
      this.doubleJumpWings.position.y += 0.55;
      // Wing flap animation
      const flapAngle = Math.sin(t * 0.01) * 0.25;
      const wingL = this.doubleJumpWings.getObjectByName('wingL');
      const wingR = this.doubleJumpWings.getObjectByName('wingR');
      if (wingL) wingL.rotation.z = 0.3 + flapAngle;
      if (wingR) wingR.rotation.z = -(0.3 + flapAngle);
    } else {
      this.doubleJumpWings.visible = false;
    }
  }

  drawObstacle(obs: Obstacle): void {
    let mesh = this.activeObstacleMeshes.get(obs);
    if (!mesh) {
      const pool = this.obstaclePool.get(obs.def.type);
      if (!pool) return;
      mesh = pool.find((m) => !m.visible);
      if (!mesh) return;
      this.activeObstacleMeshes.set(obs, mesh);
    }

    mesh.visible = true;
    mesh.position.set(
      toWorldX(obs.x + obs.width / 2),
      toWorldY(obs.y + obs.height),
      0,
    );

    // Bird wing animation
    if (obs.def.type === 'bird') {
      const wingAngle = obs.animFrame === 0 ? -0.5 : 0.5;
      const wingL = mesh.getObjectByName('wingL');
      const wingR = mesh.getObjectByName('wingR');
      if (wingL) wingL.rotation.x = wingAngle;
      if (wingR) wingR.rotation.x = -wingAngle;
    }
  }

  drawPowerUp(pu: PowerUp): void {
    let mesh = this.activePowerUpMeshes.get(pu);
    if (!mesh) {
      const pool = this.powerUpPool.get(pu.def.type);
      if (!pool) return;
      mesh = pool.find((m) => !m.visible);
      if (!mesh) return;
      this.activePowerUpMeshes.set(pu, mesh);
    }

    mesh.visible = true;
    mesh.position.set(
      toWorldX(pu.x + pu.width / 2),
      toWorldY(pu.y + pu.height / 2),
      0,
    );
    // Time-based rotation (not accumulating)
    mesh.rotation.y = this.time * 0.003;
  }

  drawCoin(coin: Coin): void {
    let mesh = this.activeCoinMeshes.get(coin);
    if (!mesh) {
      mesh = this.coinPool.find((m) => !m.visible);
      if (!mesh) return;
      this.activeCoinMeshes.set(coin, mesh);
    }

    mesh.visible = true;
    mesh.position.set(
      toWorldX(coin.x + coin.width / 2),
      toWorldY(coin.y + coin.height / 2),
      0,
    );
    // Face sideways and spin (time-based, not accumulating)
    mesh.rotation.set(Math.PI / 2, this.time * 0.005, 0);
  }

  drawParticles(particles: ParticleSystem): void {
    const pool = particles.getPool();
    let count = 0;

    for (let i = 0; i < pool.length && count < 200; i++) {
      const p = pool[i];
      if (!p.active) continue;

      _dummy.position.set(
        toWorldX(p.x),
        toWorldY(p.y),
        this.particleZOffsets[count], // deterministic z
      );
      const scale = p.size * 0.25 * (0.3 + p.alpha * 0.7);
      _dummy.scale.setScalar(Math.max(0.01, scale));
      _dummy.updateMatrix();
      this.particleMesh.setMatrixAt(count, _dummy.matrix);

      _color.set(p.color);
      this.particleMesh.setColorAt(count, _color);
      count++;
    }

    // Hide remaining by placing off-screen
    for (let i = count; i < 200; i++) {
      _dummy.position.set(0, -100, 0);
      _dummy.scale.setScalar(0);
      _dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummy.matrix);
    }

    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }
  }

  // --- Frame rendering ---

  beginFrame(): void {
    // Reclaim meshes for entities that went inactive
    for (const [obs, mesh] of this.activeObstacleMeshes) {
      if (!obs.active) {
        mesh.visible = false;
        this.activeObstacleMeshes.delete(obs);
      }
    }
    for (const [coin, mesh] of this.activeCoinMeshes) {
      if (!coin.active) {
        mesh.visible = false;
        this.activeCoinMeshes.delete(coin);
      }
    }
    for (const [pu, mesh] of this.activePowerUpMeshes) {
      if (!pu.active) {
        mesh.visible = false;
        this.activePowerUpMeshes.delete(pu);
      }
    }
  }

  endFrame(): void {
    // Screen shake applied to camera
    if (this.screenShake > 0) {
      const decay = this.screenShake / 300;
      const dx = (Math.sin(this.time * 0.3) + Math.cos(this.time * 0.7)) * this.shakeIntensity * decay * 0.5;
      const dy = (Math.cos(this.time * 0.4) + Math.sin(this.time * 0.5)) * this.shakeIntensity * decay * 0.5;
      this.camera.position.set(
        this.cameraBasePos.x + dx,
        this.cameraBasePos.y + dy,
        this.cameraBasePos.z,
      );
    } else {
      this.camera.position.copy(this.cameraBasePos);
    }
    this.camera.lookAt(this.cameraLookAt);

    // Flash overlay
    const flashMat = this.flashPlane.material as THREE.MeshBasicMaterial;
    flashMat.opacity = this.flashAlpha;
    this.flashPlane.visible = this.flashAlpha > 0.001;

    this.renderer.render(this.scene, this.camera);
  }

  clear(): void {
    // Three.js autoClear handles this
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}
