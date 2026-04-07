export interface CharacterDef {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  eyeColor: string;
  description: string;
  unlockCondition: string;
  unlockScore: number;
  jumpModifier: number;   // multiplied with JUMP_FORCE
  speedModifier: number;  // multiplied with movement
  sizeModifier: number;   // scale factor
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'classic',
    name: 'Rex',
    color: '#4CAF50',
    accentColor: '#388E3C',
    eyeColor: '#FFFFFF',
    description: 'The classic dino. Balanced stats.',
    unlockCondition: 'Available from the start',
    unlockScore: 0,
    jumpModifier: 1.0,
    speedModifier: 1.0,
    sizeModifier: 1.0,
  },
  {
    id: 'raptor',
    name: 'Blaze',
    color: '#FF5722',
    accentColor: '#E64A19',
    eyeColor: '#FFC107',
    description: 'Fast and fierce. Higher speed, lower jump.',
    unlockCondition: 'Score 500 points',
    unlockScore: 500,
    jumpModifier: 0.85,
    speedModifier: 1.2,
    sizeModifier: 0.9,
  },
  {
    id: 'trike',
    name: 'Tank',
    color: '#2196F3',
    accentColor: '#1565C0',
    eyeColor: '#E3F2FD',
    description: 'Tough and steady. Higher jump, larger hitbox.',
    unlockCondition: 'Score 1000 points',
    unlockScore: 1000,
    jumpModifier: 1.15,
    speedModifier: 0.9,
    sizeModifier: 1.15,
  },
  {
    id: 'ptero',
    name: 'Zephyr',
    color: '#9C27B0',
    accentColor: '#7B1FA2',
    eyeColor: '#CE93D8',
    description: 'Light as air. Highest jump, smallest size.',
    unlockCondition: 'Score 2000 points',
    unlockScore: 2000,
    jumpModifier: 1.3,
    speedModifier: 1.0,
    sizeModifier: 0.8,
  },
  {
    id: 'robo',
    name: 'Chrome',
    color: '#607D8B',
    accentColor: '#455A64',
    eyeColor: '#00E5FF',
    description: 'Robotic precision. Balanced with style.',
    unlockCondition: 'Score 3000 points',
    unlockScore: 3000,
    jumpModifier: 1.0,
    speedModifier: 1.1,
    sizeModifier: 1.0,
  },
];
