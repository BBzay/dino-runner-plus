export type PowerUpType = 'speed' | 'shield' | 'double_jump';

export interface PowerUpDef {
  type: PowerUpType;
  name: string;
  color: string;
  glowColor: string;
  icon: string; // drawn procedurally
  duration: number; // ms
  description: string;
}

export const POWERUPS: PowerUpDef[] = [
  {
    type: 'speed',
    name: 'Speed Boost',
    color: '#2196F3',
    glowColor: 'rgba(33, 150, 243, 0.4)',
    icon: 'lightning',
    duration: 5000,
    description: 'Move faster and score more!',
  },
  {
    type: 'shield',
    name: 'Shield',
    color: '#4CAF50',
    glowColor: 'rgba(76, 175, 80, 0.4)',
    icon: 'bubble',
    duration: 6000,
    description: 'Survive one hit!',
  },
  {
    type: 'double_jump',
    name: 'Double Jump',
    color: '#FFC107',
    glowColor: 'rgba(255, 193, 7, 0.4)',
    icon: 'wings',
    duration: 8000,
    description: 'Jump again in mid-air!',
  },
];
