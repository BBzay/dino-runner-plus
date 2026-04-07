import * as THREE from 'three';

// Day/night phase color stops for smooth lerping
const SKY_COLORS = {
  day:    new THREE.Color(0x2d4a7a),
  sunset: new THREE.Color(0x8b3a62),
  night:  new THREE.Color(0x0a0a1a),
  dawn:   new THREE.Color(0x3a2a5e),
};
const FOG_COLORS = {
  day:    new THREE.Color(0x4a6a9a),
  sunset: new THREE.Color(0x6a3a52),
  night:  new THREE.Color(0x0a0a2a),
  dawn:   new THREE.Color(0x4a3a5e),
};

// Reusable color for lerping
const _skyLerp = new THREE.Color();
const _fogLerp = new THREE.Color();

function lerpPhase(
  phase: number,
  dayEnd: number,
  sunsetEnd: number,
  nightEnd: number,
  colors: { day: THREE.Color; sunset: THREE.Color; night: THREE.Color; dawn: THREE.Color },
  out: THREE.Color,
): THREE.Color {
  if (phase < dayEnd) {
    // Day
    out.copy(colors.day);
  } else if (phase < sunsetEnd) {
    // Day → Sunset
    const t = (phase - dayEnd) / (sunsetEnd - dayEnd);
    out.copy(colors.day).lerp(colors.sunset, t);
  } else if (phase < nightEnd) {
    const midNight = (sunsetEnd + nightEnd) / 2;
    if (phase < midNight) {
      // Sunset → Night
      const t = (phase - sunsetEnd) / (midNight - sunsetEnd);
      out.copy(colors.sunset).lerp(colors.night, t);
    } else {
      // Night
      out.copy(colors.night);
    }
  } else {
    // Night → Dawn → Day
    const dawnMid = (nightEnd + 1) / 2;
    if (phase < dawnMid) {
      const t = (phase - nightEnd) / (dawnMid - nightEnd);
      out.copy(colors.night).lerp(colors.dawn, t);
    } else {
      const t = (phase - dawnMid) / (1 - dawnMid);
      out.copy(colors.dawn).lerp(colors.day, t);
    }
  }
  return out;
}

export class Scene3D {
  private scene: THREE.Scene;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  // Environment objects
  private groundMesh!: THREE.Mesh;
  private groundMaterial!: THREE.MeshStandardMaterial;
  private groundDetailGroup!: THREE.Group;
  private mountains: THREE.Group;
  private clouds: THREE.Group;
  private stars: THREE.Points;

  // State
  private dayPhase = 0;
  private groundOffset = 0;
  private time = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x8888aa, 0.6);
    scene.add(this.ambientLight);

    // Sun (directional light with shadows)
    this.sunLight = new THREE.DirectionalLight(0xffe0b0, 1.2);
    this.sunLight.position.set(5, 10, 5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.left = -15;
    this.sunLight.shadow.camera.right = 15;
    this.sunLight.shadow.camera.top = 10;
    this.sunLight.shadow.camera.bottom = -5;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 30;
    scene.add(this.sunLight);

    this.createGround();
    this.createGroundScatter();
    this.mountains = this.createMountains();
    this.clouds = this.createClouds();
    this.stars = this.createStars();
    this.createFog();
    this.updateSkyColor();
  }

  private createGround(): void {
    const geo = new THREE.PlaneGeometry(60, 30, 1, 1);
    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xC8A96E,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true,
    });
    this.groundMesh = new THREE.Mesh(geo, this.groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.set(0, 0, 0);
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Ground detail — a slightly darker strip right at the runner lane
    const laneGeo = new THREE.PlaneGeometry(60, 2, 1, 1);
    const laneMat = new THREE.MeshStandardMaterial({
      color: 0xB8955A,
      roughness: 0.95,
      metalness: 0.0,
    });
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.005, 0);
    lane.receiveShadow = true;
    this.scene.add(lane);
  }

  /** Small rocks and tufts along the ground for visual depth */
  private createGroundScatter(): void {
    this.groundDetailGroup = new THREE.Group();

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x8a7a5a,
      flatShading: true,
      roughness: 0.95,
    });
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x6a8a3a,
      flatShading: true,
    });

    // Scatter small rocks along the sides of the track
    for (let i = 0; i < 30; i++) {
      const x = (Math.sin(i * 5.17) * 0.5 + Math.cos(i * 3.23) * 0.5) * 25;
      const z = 1.5 + Math.abs(Math.sin(i * 7.31)) * 4 + (i % 2 === 0 ? 0 : -3 - Math.abs(Math.sin(i * 2.1)) * 3);
      const s = 0.05 + Math.abs(Math.sin(i * 4.67)) * 0.1;

      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
      rock.position.set(x, s * 0.3, z);
      rock.rotation.set(i * 1.3, i * 2.1, i * 0.7);
      this.groundDetailGroup.add(rock);
    }

    // Scatter grass tufts
    for (let i = 0; i < 20; i++) {
      const x = (Math.cos(i * 4.31) * 0.5 + Math.sin(i * 6.13) * 0.5) * 22;
      const z = 1.8 + Math.abs(Math.cos(i * 3.71)) * 5 + (i % 2 === 0 ? 0 : -4 - Math.abs(Math.cos(i * 1.9)) * 2);

      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 4), grassMat);
      tuft.position.set(x, 0.07, z);
      this.groundDetailGroup.add(tuft);
    }

    this.scene.add(this.groundDetailGroup);
  }

  private createMountains(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3a3a6a,
      flatShading: true,
    });

    // Far mountains
    for (let i = 0; i < 8; i++) {
      const h = 3 + Math.sin(i * 1.7) * 1.5;
      const w = 2 + Math.sin(i * 2.3) * 0.8;
      const geo = new THREE.ConeGeometry(w, h, 5);
      const mountain = new THREE.Mesh(geo, mat);
      mountain.position.set(i * 4.5 - 16, h / 2, -20);
      group.add(mountain);
    }

    // Mid-range hills
    const hillMat = new THREE.MeshStandardMaterial({
      color: 0x4a3a2a,
      flatShading: true,
    });
    for (let i = 0; i < 12; i++) {
      const h = 1.0 + Math.sin(i * 2.1) * 0.5;
      const geo = new THREE.SphereGeometry(1.5, 5, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      const hill = new THREE.Mesh(geo, hillMat);
      hill.position.set(i * 3 - 18, 0, -8 - (i % 2) * 2);
      hill.scale.set(1, h * 0.5, 1);
      group.add(hill);
    }

    this.scene.add(group);
    return group;
  }

  private createClouds(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      flatShading: true,
    });

    for (let i = 0; i < 6; i++) {
      const cloudGroup = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const r = 0.5 + Math.random() * 0.5;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 4), mat);
        puff.position.set(j * 0.6 - 0.6, Math.random() * 0.2, Math.random() * 0.3);
        cloudGroup.add(puff);
      }
      cloudGroup.position.set(
        i * 6 - 15 + Math.random() * 3,
        6 + Math.random() * 3,
        -15 - Math.random() * 10,
      );
      group.add(cloudGroup);
    }

    this.scene.add(group);
    return group;
  }

  private createStars(): THREE.Points {
    const positions = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = 8 + Math.random() * 12;
      positions[i * 3 + 2] = -20 - Math.random() * 20;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    return points;
  }

  private createFog(): void {
    this.scene.fog = new THREE.FogExp2(0x2d4a7a, 0.015);
  }

  private updateSkyColor(): void {
    const phase = this.dayPhase;
    // Phase boundaries: 0–0.35 day, 0.35–0.5 sunset, 0.5–0.8 night, 0.8–1.0 dawn
    const dayEnd = 0.35;
    const sunsetEnd = 0.5;
    const nightEnd = 0.8;

    // Smooth sky color lerp
    lerpPhase(phase, dayEnd, sunsetEnd, nightEnd, SKY_COLORS, _skyLerp);
    lerpPhase(phase, dayEnd, sunsetEnd, nightEnd, FOG_COLORS, _fogLerp);

    this.scene.background = _skyLerp.clone();
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(_fogLerp);
    }

    // Smooth sun and ambient intensities
    let sunIntensity: number;
    let ambientIntensity: number;
    if (phase < dayEnd) {
      sunIntensity = 1.2;
      ambientIntensity = 0.6;
    } else if (phase < sunsetEnd) {
      const t = (phase - dayEnd) / (sunsetEnd - dayEnd);
      sunIntensity = 1.2 - t * 0.3;  // 1.2 → 0.9
      ambientIntensity = 0.6 - t * 0.2; // 0.6 → 0.4
    } else if (phase < nightEnd) {
      const t = (phase - sunsetEnd) / (nightEnd - sunsetEnd);
      sunIntensity = 0.9 - t * 0.7;  // 0.9 → 0.2
      ambientIntensity = 0.4 - t * 0.25; // 0.4 → 0.15
    } else {
      const t = (phase - nightEnd) / (1 - nightEnd);
      sunIntensity = 0.2 + t * 1.0;  // 0.2 → 1.2
      ambientIntensity = 0.15 + t * 0.45; // 0.15 → 0.6
    }
    this.sunLight.intensity = sunIntensity;
    this.ambientLight.intensity = ambientIntensity;

    // Stars visibility — smooth fade
    const starMat = this.stars.material as THREE.PointsMaterial;
    if (phase > 0.45 && phase < 0.85) {
      const a = phase < 0.55 ? (phase - 0.45) * 10 : phase > 0.75 ? (0.85 - phase) * 10 : 1;
      starMat.opacity = a * 0.8;
    } else {
      starMat.opacity = 0;
    }
  }

  update(dt: number, scrollSpeed: number): void {
    this.time += dt;
    this.dayPhase = (this.dayPhase + dt * 0.00002) % 1;
    this.updateSkyColor();

    // Scroll ground detail objects to simulate movement
    this.groundOffset += scrollSpeed * 0.001 * (dt / 16.67);
    if (this.groundDetailGroup) {
      for (const obj of this.groundDetailGroup.children) {
        obj.position.x -= scrollSpeed * 0.0003 * (dt / 16.67);
        // Wrap around
        if (obj.position.x < -28) obj.position.x += 56;
      }
    }

    // Drift clouds
    for (const cloud of this.clouds.children) {
      cloud.position.x += 0.002 * (dt / 16.67);
      if (cloud.position.x > 25) cloud.position.x = -25;
    }
  }

  reset(): void {
    this.time = 0;
    this.dayPhase = 0;
    this.groundOffset = 0;
    this.updateSkyColor();
  }
}
