import * as THREE from 'three';
import { CharacterDef } from '../data/characters';
import { ObstacleDef } from '../data/obstacles';
import { PowerUpDef } from '../data/powerups';

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function roundedBox(w: number, h: number, d: number, _r: number): THREE.BufferGeometry {
  // Simple box when radius isn't critical for performance
  return new THREE.BoxGeometry(w, h, d);
}

/** Builds the dino character as a THREE.Group from config data */
export function createPlayerMesh(char: CharacterDef): THREE.Group {
  const group = new THREE.Group();
  const color = hexToColor(char.color);
  const accent = hexToColor(char.accentColor);
  const eyeColor = hexToColor(char.eyeColor);

  const bodyMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, flatShading: true });
  const eyeMat = new THREE.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  // Body
  const body = new THREE.Mesh(roundedBox(0.7, 0.8, 0.6, 0.1), bodyMat);
  body.position.set(0, 0.4, 0);
  body.castShadow = true;
  group.add(body);

  // Head
  const head = new THREE.Mesh(roundedBox(0.5, 0.45, 0.5, 0.08), bodyMat);
  head.position.set(0.15, 0.95, 0);
  head.castShadow = true;
  group.add(head);

  // Snout
  const snout = new THREE.Mesh(roundedBox(0.25, 0.18, 0.3, 0.04), accentMat);
  snout.position.set(0.42, 0.88, 0);
  group.add(snout);

  // Eye (right side - facing camera)
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.06), eyeMat);
  eye.position.set(0.3, 1.0, 0.22);
  eye.name = 'eye';
  group.add(eye);

  // Pupil
  const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), pupilMat);
  pupil.position.set(0.3, 0.99, 0.26);
  group.add(pupil);

  // Tail
  const tail = new THREE.Mesh(roundedBox(0.35, 0.2, 0.2, 0.04), accentMat);
  tail.position.set(-0.45, 0.35, 0);
  tail.rotation.z = 0.3;
  group.add(tail);

  // Left leg
  const leftLeg = new THREE.Mesh(roundedBox(0.15, 0.3, 0.15, 0.02), accentMat);
  leftLeg.position.set(0.12, 0, 0.12);
  leftLeg.name = 'leftLeg';
  leftLeg.castShadow = true;
  group.add(leftLeg);

  // Right leg
  const rightLeg = new THREE.Mesh(roundedBox(0.15, 0.3, 0.15, 0.02), accentMat);
  rightLeg.position.set(0.12, 0, -0.12);
  rightLeg.name = 'rightLeg';
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Left foot
  const leftFoot = new THREE.Mesh(roundedBox(0.2, 0.06, 0.16, 0.02), bodyMat);
  leftFoot.position.set(0.14, -0.12, 0.12);
  leftFoot.name = 'leftFoot';
  group.add(leftFoot);

  // Right foot
  const rightFoot = new THREE.Mesh(roundedBox(0.2, 0.06, 0.16, 0.02), bodyMat);
  rightFoot.position.set(0.14, -0.12, -0.12);
  rightFoot.name = 'rightFoot';
  group.add(rightFoot);

  // Arms
  const arm = new THREE.Mesh(roundedBox(0.22, 0.08, 0.1, 0.02), accentMat);
  arm.position.set(0.35, 0.45, 0.28);
  group.add(arm);

  // Character-specific features
  if (char.id === 'trike') {
    // Horn
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6), accentMat);
    horn.position.set(0.4, 1.25, 0);
    horn.rotation.z = -0.2;
    group.add(horn);
    // Frill
    const frill = new THREE.Mesh(new THREE.CircleGeometry(0.2, 8, 0, Math.PI), accentMat);
    frill.position.set(0.0, 1.15, 0);
    frill.rotation.y = Math.PI / 2;
    group.add(frill);
  } else if (char.id === 'robo') {
    // Antenna
    const antennaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), accentMat);
    antennaPole.position.set(0.15, 1.3, 0);
    group.add(antennaPole);
    const antennaTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x00E5FF, emissiveIntensity: 0.8 }),
    );
    antennaTip.position.set(0.15, 1.45, 0);
    group.add(antennaTip);
  } else {
    // Back spikes (default for Rex, Blaze, Zephyr)
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2 + i * 0.05, 6), accentMat);
      spike.position.set(-0.15 + i * 0.15, 0.95 + i * 0.03, 0);
      group.add(spike);
    }
  }

  return group;
}

/** Duck pose: squished body, no legs visible */
export function createPlayerDuckMesh(char: CharacterDef): THREE.Group {
  const group = new THREE.Group();
  const color = hexToColor(char.color);
  const accent = hexToColor(char.accentColor);
  const eyeColor = hexToColor(char.eyeColor);

  const bodyMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, flatShading: true });
  const eyeMat = new THREE.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  // Wide, low body
  const body = new THREE.Mesh(roundedBox(1.0, 0.4, 0.6, 0.08), bodyMat);
  body.position.set(0, 0.2, 0);
  body.castShadow = true;
  group.add(body);

  // Flat head
  const head = new THREE.Mesh(roundedBox(0.35, 0.3, 0.45, 0.06), bodyMat);
  head.position.set(0.45, 0.35, 0);
  head.castShadow = true;
  group.add(head);

  // Eye
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.05), eyeMat);
  eye.position.set(0.55, 0.4, 0.2);
  group.add(eye);

  const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), pupilMat);
  pupil.position.set(0.55, 0.39, 0.24);
  group.add(pupil);

  // Tail stub
  const tail = new THREE.Mesh(roundedBox(0.2, 0.15, 0.18, 0.03), accentMat);
  tail.position.set(-0.5, 0.2, 0);
  group.add(tail);

  return group;
}

/** Creates obstacle meshes by type */
export function createObstacleMesh(def: ObstacleDef): THREE.Group {
  const group = new THREE.Group();
  const color = hexToColor(def.color);
  const accent = hexToColor(def.accentColor);

  const mainMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, flatShading: true });

  switch (def.type) {
    case 'small_cactus':
    case 'large_cactus': {
      const h = def.type === 'small_cactus' ? 0.8 : 1.2;
      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, h, 8), mainMat);
      trunk.position.y = h / 2;
      trunk.castShadow = true;
      group.add(trunk);
      // Left arm
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 6), accentMat);
      armL.position.set(-0.15, h * 0.55, 0);
      armL.rotation.z = Math.PI / 3;
      group.add(armL);
      // Right arm
      const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 6), accentMat);
      armR.position.set(0.12, h * 0.4, 0);
      armR.rotation.z = -Math.PI / 4;
      group.add(armR);
      break;
    }
    case 'cactus_cluster': {
      for (let i = 0; i < 3; i++) {
        const h = 0.7 + Math.random() * 0.4;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, h, 7), mainMat);
        c.position.set((i - 1) * 0.25, h / 2, (i % 2) * 0.1 - 0.05);
        c.castShadow = true;
        group.add(c);
      }
      break;
    }
    case 'rock': {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), mainMat);
      rock.position.y = 0.2;
      rock.scale.set(1.2, 0.7, 1.0);
      rock.rotation.y = Math.random() * Math.PI;
      rock.castShadow = true;
      group.add(rock);
      // Highlight face
      const highlight = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), accentMat);
      highlight.position.set(0.05, 0.3, 0.1);
      group.add(highlight);
      break;
    }
    case 'bird': {
      // Body ellipsoid
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mainMat);
      body.scale.set(1.4, 0.8, 0.9);
      body.castShadow = true;
      group.add(body);
      // Beak
      const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.18, 6),
        new THREE.MeshStandardMaterial({ color: 0xFFA726, flatShading: true }),
      );
      beak.position.set(0.3, 0.02, 0);
      beak.rotation.z = -Math.PI / 2;
      group.add(beak);
      // Left wing
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.35), accentMat);
      wingL.position.set(-0.05, 0.08, 0.25);
      wingL.name = 'wingL';
      group.add(wingL);
      // Right wing
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.35), accentMat);
      wingR.position.set(-0.05, 0.08, -0.25);
      wingR.name = 'wingR';
      group.add(wingR);
      // Eye
      const eye = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
      eye.position.set(0.18, 0.08, 0.14);
      group.add(eye);
      break;
    }
  }

  return group;
}

/** Glowing power-up box */
export function createPowerUpMesh(def: PowerUpDef): THREE.Group {
  const group = new THREE.Group();
  const color = hexToColor(def.color);

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.4,
    flatShading: true,
  });

  const box = new THREE.Mesh(roundedBox(0.4, 0.4, 0.4, 0.06), mat);
  box.castShadow = true;
  group.add(box);

  // Point light for glow
  const glow = new THREE.PointLight(color, 1.5, 3);
  glow.position.set(0, 0, 0);
  group.add(glow);

  // Icon marker — small sphere on top
  const iconMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
  const icon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), iconMat);
  icon.position.set(0, 0.3, 0);
  group.add(icon);

  return group;
}

/** Golden spinning coin */
export function createCoinMesh(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.15, 0.15, 0.04, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0xFFA000,
    emissiveIntensity: 0.3,
    metalness: 0.7,
    roughness: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

/** Transparent green shield bubble around the player */
export function createShieldMesh(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.7, 16, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x4CAF50,
    emissive: 0x4CAF50,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

/** Blue speed streaks behind the player */
export function createSpeedAuraMesh(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x42A5F5,
    emissive: 0x42A5F5,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.35,
  });

  // Three horizontal streaks at slightly different heights
  for (let i = 0; i < 3; i++) {
    const streak = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.04, 0.06),
      mat,
    );
    streak.position.set(-0.1 * i, (i - 1) * 0.15, (i - 1) * 0.12);
    group.add(streak);
  }

  return group;
}

/** Small golden wings for double-jump power-up */
export function createDoubleJumpWingsMesh(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xFFD740,
    emissive: 0xFFA000,
    emissiveIntensity: 0.3,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  // Left wing
  const wingLGeo = new THREE.BufferGeometry();
  const verts = new Float32Array([
    0, 0, 0,
    -0.15, 0.25, 0.15,
    -0.35, 0.1, 0.25,
    -0.25, -0.1, 0.2,
  ]);
  const indices = [0, 1, 2, 0, 2, 3];
  wingLGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  wingLGeo.setIndex(indices);
  wingLGeo.computeVertexNormals();
  const wingL = new THREE.Mesh(wingLGeo, mat);
  wingL.name = 'wingL';
  group.add(wingL);

  // Right wing (mirrored z)
  const vertsR = new Float32Array([
    0, 0, 0,
    -0.15, 0.25, -0.15,
    -0.35, 0.1, -0.25,
    -0.25, -0.1, -0.2,
  ]);
  const wingRGeo = new THREE.BufferGeometry();
  wingRGeo.setAttribute('position', new THREE.BufferAttribute(vertsR, 3));
  wingRGeo.setIndex(indices);
  wingRGeo.computeVertexNormals();
  const wingR = new THREE.Mesh(wingRGeo, mat);
  wingR.name = 'wingR';
  group.add(wingR);

  return group;
}
