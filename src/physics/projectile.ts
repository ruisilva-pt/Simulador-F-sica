/**
 * Cálculos cinemáticos exatos para o modelo ideal de lançamento de projéteis
 * Modelo sem resistência do ar (balística clássica, 12.º ano):
 *  x(t) = x0 + v0*cos(θ)*t
 *  y(t) = y0 + v0*sin(θ)*t - (1/2)*g*t^2
 *  vx(t) = v0*cos(θ)
 *  vy(t) = v0*sin(θ) - g*t
 */

import { KinematicInstant, ProjectileParams, ProjectileResults } from '../types/physics';

/**
 * Converte graus para radianos
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converte radianos para graus
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calcula todas as grandezas cinemáticas teóricas globais do lançamento.
 * O tempo de voo é obtido pela raiz positiva da equação y(t) = 0:
 * (1/2)*g*t^2 - v0y*t - y0 = 0
 * Δ = (v0y)^2 + 2*g*y0
 * t_voo = (v0y + sqrt(Δ)) / g
 */
export function calculateProjectileResults(params: ProjectileParams): ProjectileResults {
  const { v0, angleDeg, y0, g } = params;
  const angleRad = degreesToRadians(angleDeg);

  const v0x = v0 * Math.cos(angleRad);
  const v0y = v0 * Math.sin(angleRad);

  // Tratamento de caso degenerado (gravidade quase nula)
  const safeG = Math.max(0.001, g);

  // Resolução da equação de 2.º grau: -0.5*g*t^2 + v0y*t + y0 = 0
  // <=> 0.5*g*t^2 - v0y*t - y0 = 0
  // Multiplicando por 2: g*t^2 - 2*v0y*t - 2*y0 = 0
  // Discriminante: (2*v0y)^2 - 4*g*(-2*y0) = 4*(v0y^2 + 2*g*y0)
  // sqrt(Δ) = 2 * sqrt(v0y^2 + 2*g*y0)
  // t_voo = (2*v0y + 2*sqrt(v0y^2 + 2*g*y0)) / (2*g) = (v0y + sqrt(v0y^2 + 2*g*y0)) / g
  const discriminant = v0y * v0y + 2 * safeG * y0;
  const sqrtDisc = Math.sqrt(Math.max(0, discriminant));
  const tFlight = (v0y + sqrtDisc) / safeG;

  // Alcance horizontal total
  // Nota especial: para ângulo de 90°, cos(90°) = 0, logo range = 0
  let range = v0x * tFlight;
  if (Math.abs(angleDeg - 90) < 1e-6) {
    range = 0;
  }

  // Altura máxima:
  // Se o projétil for lançado para baixo ou horizontalmente a partir de y0 > 0,
  // a altura máxima é atingida logo no instante t = 0 (y_max = y0).
  // Caso contrário, vy = 0 em t_max = v0y / g.
  let tMaxHeight = 0;
  let maxHeight = y0;
  if (v0y > 0) {
    tMaxHeight = v0y / safeG;
    maxHeight = y0 + (v0y * v0y) / (2 * safeG);
  }

  // Componentes no instante do impacto
  const vImpactY = v0y - safeG * tFlight;
  const vImpact = Math.sqrt(v0x * v0x + vImpactY * vImpactY);

  return {
    v0x,
    v0y,
    angleRad,
    tFlight,
    range,
    maxHeight,
    tMaxHeight,
    vImpact,
    vImpactY,
  };
}

/**
 * Obtém o estado cinemático instantâneo (posição e velocidade) para o instante t
 */
export function getKinematicInstant(params: ProjectileParams, t: number, tFlight?: number): KinematicInstant {
  const { v0, angleDeg, y0, g } = params;
  const angleRad = degreesToRadians(angleDeg);
  const v0x = Math.abs(angleDeg - 90) < 1e-6 ? 0 : v0 * Math.cos(angleRad);
  const v0y = v0 * Math.sin(angleRad);

  const effectiveFlightTime = tFlight ?? calculateProjectileResults(params).tFlight;
  const currentT = Math.max(0, Math.min(t, effectiveFlightTime));

  const x = v0x * currentT;
  const yCalculated = y0 + v0y * currentT - 0.5 * g * currentT * currentT;
  const y = Math.max(0, yCalculated);

  const vx = v0x;
  const vy = v0y - g * currentT;
  const v = Math.sqrt(vx * vx + vy * vy);

  return {
    t: currentT,
    x,
    y,
    vx,
    vy,
    v,
  };
}

/**
 * Gera pontos de amostragem ao longo da trajetória para traçar no Canvas
 */
export function generateTrajectoryPoints(
  params: ProjectileParams,
  numPoints = 120
): { x: number; y: number; t: number }[] {
  const results = calculateProjectileResults(params);
  const points: { x: number; y: number; t: number }[] = [];

  if (results.tFlight <= 0) {
    return [{ x: 0, y: params.y0, t: 0 }];
  }

  const dt = results.tFlight / numPoints;
  for (let i = 0; i <= numPoints; i++) {
    const t = Math.min(i * dt, results.tFlight);
    const instant = getKinematicInstant(params, t, results.tFlight);
    points.push({ x: instant.x, y: instant.y, t: instant.t });
  }

  return points;
}

/**
 * Gera posições estroboscópicas a intervalos de tempo iguais (ex: a cada 0.2s ou 0.5s)
 */
export function generateStroboscopicPoints(
  params: ProjectileParams,
  dtInterval = 0.25
): { x: number; y: number; t: number; index: number }[] {
  const results = calculateProjectileResults(params);
  const points: { x: number; y: number; t: number; index: number }[] = [];

  if (results.tFlight <= 0) return [];

  // Ponto inicial t = 0
  let t = 0;
  let idx = 0;
  while (t <= results.tFlight) {
    const instant = getKinematicInstant(params, t, results.tFlight);
    points.push({
      x: instant.x,
      y: instant.y,
      t: instant.t,
      index: idx,
    });
    idx++;
    t += dtInterval;
  }

  // Ponto final de impacto
  const finalInstant = getKinematicInstant(params, results.tFlight, results.tFlight);
  const lastPoint = points[points.length - 1];
  if (!lastPoint || Math.abs(lastPoint.t - results.tFlight) > dtInterval * 0.3) {
    points.push({
      x: finalInstant.x,
      y: finalInstant.y,
      t: results.tFlight,
      index: idx,
    });
  }

  return points;
}

/**
 * Formata números com vírgula decimal segundo a norma de Portugal (ex: "35,3" m)
 */
export function formatPtNumber(value: number, maxDecimals = 2, minDecimals = 0): string {
  if (isNaN(value) || !isFinite(value)) return '0';
  
  // Arredonda para evitar artefactos de vírgula flutuante
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round(value * factor) / factor;
  
  const parts = rounded.toFixed(maxDecimals).split('.');
  const integerPart = parts[0];
  let decimalPart = parts[1] || '';

  if (minDecimals === 0) {
    decimalPart = decimalPart.replace(/0+$/, '');
  }

  return decimalPart.length > 0 ? `${integerPart},${decimalPart}` : integerPart;
}

/**
 * Formata número com unidade SI
 */
export function formatSI(value: number, unit: string, decimals = 2): string {
  return `${formatPtNumber(value, decimals)} ${unit}`;
}
