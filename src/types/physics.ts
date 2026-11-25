/**
 * Tipos e interfaces de física para o simulador de lançamento de projéteis
 * Alinhado com as Aprendizagens Essenciais de Física do 12.º ano (Portugal)
 */

export interface ProjectileParams {
  v0: number; // Velocidade inicial em m/s (0 a 50)
  angleDeg: number; // Ângulo com a horizontal em graus (0 a 90)
  y0: number; // Altura inicial em metros (0 a 50)
  g: number; // Aceleração da gravidade em m/s² (ex: 9.8 para a Terra)
}

export interface GravityPreset {
  id: string;
  name: string;
  g: number;
  description: string;
}

export const GRAVITY_PRESETS: GravityPreset[] = [
  { id: 'earth', name: 'Terra', g: 9.8, description: 'g = 9,8 m/s²' },
  { id: 'moon', name: 'Lua', g: 1.6, description: 'g = 1,6 m/s²' },
  { id: 'mars', name: 'Marte', g: 3.7, description: 'g = 3,7 m/s²' },
  { id: 'jupiter', name: 'Júpiter', g: 24.8, description: 'g = 24,8 m/s²' },
];

export interface KinematicInstant {
  t: number; // s
  x: number; // m
  y: number; // m
  vx: number; // m/s
  vy: number; // m/s
  v: number; // m/s (módulo)
}

export interface ProjectileResults {
  v0x: number; // m/s
  v0y: number; // m/s
  angleRad: number; // rad
  tFlight: number; // s (tempo total de voo até atingir o solo y=0)
  range: number; // m (alcance x ao atingir o solo)
  maxHeight: number; // m (altura máxima em relação ao solo y=0)
  tMaxHeight: number; // s (instante em que atinge y_max)
  vImpact: number; // m/s (módulo da velocidade no impacto)
  vImpactY: number; // m/s (componente vy no impacto)
}

export interface LaunchRecord {
  id: string;
  simulatorId?: string; // 'lancamento-projeteis' | 'movimento-retilineo' (opcional para retrocompatibilidade)
  timestamp: string;
  v0: number;
  angleDeg: number;
  y0: number;
  g: number;
  gravityName?: string;
  range: number;
  tFlight: number;
  maxHeight: number;
  vImpact: number;
  // Campos opcionais para Movimento Retilíneo (Estação 2)
  x0?: number;
  a?: number;
  tMax?: number;
  finalX?: number;
  displacement?: number;
  distanceTraveled?: number;
  finalV?: number;
  avgVelocity?: number;
  mode: 'livre' | 'previsao' | 'desafio';
  predictedRange?: number;
  errorPercentage?: number;
  targetDistance?: number;
  targetTolerance?: number;
  hitTarget?: boolean;
}
