/**
 * Tipos e interfaces de física para o simulador de Movimento Retilíneo (MRU e MRUA)
 * Alinhado com as Aprendizagens Essenciais de Física do Ensino Secundário (Portugal)
 */

export interface RectilinearParams {
  x0: number; // Posição inicial em m (-50 a 50)
  v0: number; // Velocidade inicial em m/s (-30 a 30)
  a: number; // Aceleração constante em m/s² (-10 a 10)
  tMax: number; // Duração da observação em s (2 a 15)
}

export interface RectilinearInstant {
  t: number; // s
  x: number; // m
  v: number; // m/s
  a: number; // m/s²
  displacement: number; // Δx = x(t) - x0 (m)
  distanceTraveled: number; // distância percorrida acumulada s(t) (m)
}

export interface RectilinearResults {
  regime: 'repouso' | 'mru' | 'mrua_acelerado' | 'mrua_retardado' | 'mrua_inversao';
  regimeLabel: string;
  tMax: number; // s
  finalX: number; // m
  finalV: number; // m/s
  displacement: number; // Δx = x(tMax) - x0 (m)
  distanceTraveled: number; // d total (m)
  avgVelocity: number; // vm = Δx / Δt (m/s)
  avgSpeed: number; // rm = d / Δt (m/s)
  reversalTime: number | null; // instante de inversão de sentido (vy=0 / v=0) dentro de (0, tMax]
  reversalX: number | null; // posição na inversão de sentido
  minX: number; // posição mínima no intervalo [0, tMax]
  maxX: number; // posição máxima no intervalo [0, tMax]
}
