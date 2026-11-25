/**
 * Motor físico puro para Movimento Retilíneo Uniforme (MRU) e Uniformemente Variado (MRUA)
 * Sem dependências de UI — alinhado com as Aprendizagens Essenciais de Física (12.º ano)
 */

import {
  RectilinearInstant,
  RectilinearParams,
  RectilinearResults,
} from '../types/rectilinear';

/**
 * Posição instantânea x(t) = x0 + v0 * t + 0.5 * a * t^2
 */
export function positionAtTime(params: RectilinearParams, t: number): number {
  const safeT = Math.max(0, t);
  return params.x0 + params.v0 * safeT + 0.5 * params.a * safeT * safeT;
}

/**
 * Velocidade instantânea v(t) = v0 + a * t
 */
export function velocityAtTime(params: RectilinearParams, t: number): number {
  const safeT = Math.max(0, t);
  return params.v0 + params.a * safeT;
}

/**
 * Instante de inversão do sentido do movimento (v(t) = 0), caso ocorra em (0, tMax]
 */
export function getReversalTime(params: RectilinearParams): number | null {
  if (Math.abs(params.a) < 1e-9) return null;
  const tInv = -params.v0 / params.a;
  if (tInv > 1e-6 && tInv <= params.tMax + 1e-9) {
    return tInv;
  }
  return null;
}

/**
 * Distância total percorrida (escalar s >= 0) até ao instante t,
 * somando os módulos dos trajetos antes e depois da inversão de marcha.
 */
export function distanceTraveledAtTime(params: RectilinearParams, t: number): number {
  const safeT = Math.max(0, t);
  const { x0, v0, a } = params;

  if (Math.abs(a) < 1e-9) {
    return Math.abs(v0 * safeT);
  }

  const tInv = -v0 / a;
  if (tInv > 1e-6 && tInv < safeT) {
    const xInv = x0 + v0 * tInv + 0.5 * a * tInv * tInv;
    const xNow = positionAtTime(params, safeT);
    return Math.abs(xInv - x0) + Math.abs(xNow - xInv);
  }

  return Math.abs(positionAtTime(params, safeT) - x0);
}

/**
 * Classificação pedagógica do regime do movimento no intervalo [0, tMax]
 */
export function classifyRectilinearMotion(
  params: RectilinearParams
): Pick<RectilinearResults, 'regime' | 'regimeLabel'> {
  const { v0, a, tMax } = params;

  if (Math.abs(v0) < 1e-6 && Math.abs(a) < 1e-6) {
    return { regime: 'repouso', regimeLabel: 'Repouso (v = 0, a = 0)' };
  }

  if (Math.abs(a) < 1e-6) {
    return {
      regime: 'mru',
      regimeLabel: 'MRU — Movimento Retilíneo Uniforme',
    };
  }

  const tInv = getReversalTime(params);
  if (tInv !== null && tInv < tMax - 1e-6) {
    return {
      regime: 'mrua_inversao',
      regimeLabel: 'MRUA com Inversão de Sentido',
    };
  }

  // Sem inversão interior: verifica se v0 e a têm o mesmo sinal (acelerado) ou oposto (retardado)
  if (Math.abs(v0) < 1e-6 || v0 * a > 0) {
    return {
      regime: 'mrua_acelerado',
      regimeLabel: 'MRUA Uniformemente Acelerado',
    };
  }

  return {
    regime: 'mrua_retardado',
    regimeLabel: 'MRUA Uniformemente Retardado',
  };
}

/**
 * Resultados teóricos completos para o intervalo [0, tMax]
 */
export function calculateRectilinearResults(params: RectilinearParams): RectilinearResults {
  const { x0, tMax } = params;
  const safeTMax = Math.max(0.1, tMax);

  const finalX = positionAtTime(params, safeTMax);
  const finalV = velocityAtTime(params, safeTMax);
  const displacement = finalX - x0;
  const distanceTraveled = distanceTraveledAtTime(params, safeTMax);
  const avgVelocity = displacement / safeTMax;
  const avgSpeed = distanceTraveled / safeTMax;

  const reversalTime = getReversalTime(params);
  const reversalX = reversalTime !== null ? positionAtTime(params, reversalTime) : null;

  let minX = Math.min(x0, finalX);
  let maxX = Math.max(x0, finalX);
  if (reversalX !== null) {
    minX = Math.min(minX, reversalX);
    maxX = Math.max(maxX, reversalX);
  }

  const { regime, regimeLabel } = classifyRectilinearMotion(params);

  return {
    regime,
    regimeLabel,
    tMax: safeTMax,
    finalX,
    finalV,
    displacement,
    distanceTraveled,
    avgVelocity,
    avgSpeed,
    reversalTime,
    reversalX,
    minX,
    maxX,
  };
}

/**
 * Estado cinemático num instante específico t
 */
export function getRectilinearInstant(params: RectilinearParams, t: number): RectilinearInstant {
  const safeT = Math.max(0, Math.min(t, params.tMax));
  const x = positionAtTime(params, safeT);
  return {
    t: safeT,
    x,
    v: velocityAtTime(params, safeT),
    a: params.a,
    displacement: x - params.x0,
    distanceTraveled: distanceTraveledAtTime(params, safeT),
  };
}

/**
 * Pontos igualmente espaçados no tempo para o rasto estroboscópico
 */
export function generateRectilinearStrobePoints(
  params: RectilinearParams,
  steps: number = 10
): RectilinearInstant[] {
  const points: RectilinearInstant[] = [];
  const count = Math.max(2, steps);
  const dt = params.tMax / count;

  for (let i = 0; i <= count; i++) {
    const t = i * dt;
    points.push(getRectilinearInstant(params, t));
  }

  return points;
}
