export type ObstacleType = 'small_cactus' | 'large_cactus' | 'cactus_cluster' | 'rock' | 'bird';

export interface ObstacleDef {
  type: ObstacleType;
  width: number;
  height: number;
  color: string;
  accentColor: string;
  isFlying: boolean;
  flyHeight: number;
  minScore: number;    // minimum score before this type can spawn
  spawnWeight: number; // relative likelihood
}

export const OBSTACLES: ObstacleDef[] = [
  {
    type: 'small_cactus',
    width: 20,
    height: 40,
    color: '#66BB6A',
    accentColor: '#43A047',
    isFlying: false,
    flyHeight: 0,
    minScore: 0,
    spawnWeight: 3,
  },
  {
    type: 'large_cactus',
    width: 28,
    height: 56,
    color: '#4CAF50',
    accentColor: '#2E7D32',
    isFlying: false,
    flyHeight: 0,
    minScore: 100,
    spawnWeight: 2,
  },
  {
    type: 'cactus_cluster',
    width: 50,
    height: 44,
    color: '#81C784',
    accentColor: '#388E3C',
    isFlying: false,
    flyHeight: 0,
    minScore: 300,
    spawnWeight: 2,
  },
  {
    type: 'rock',
    width: 36,
    height: 28,
    color: '#8D6E63',
    accentColor: '#6D4C41',
    isFlying: false,
    flyHeight: 0,
    minScore: 200,
    spawnWeight: 1.5,
  },
  {
    type: 'bird',
    width: 40,
    height: 30,
    color: '#EF5350',
    accentColor: '#D32F2F',
    isFlying: true,
    flyHeight: 18,
    minScore: 400,
    spawnWeight: 1.5,
  },
];
