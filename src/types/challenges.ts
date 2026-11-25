export type ChallengeDifficulty = 'facil' | 'medio' | 'avancado';

export interface Challenge {
  id: string;
  simulatorId: string;
  title: string;
  statement: string; // Enunciado pedagógico com rigor físico
  difficulty: ChallengeDifficulty;
  targetDistance: number; // Distância do alvo a partir da origem x=0 (em metros)
  targetTolerance: number; // Tolerância aceitável em percentagem (ex: 5%)
  fixedParams: {
    y0?: number;
    g?: number;
    angleDeg?: number;
    v0?: number;
    gravityName?: string;
    x0?: number;
    a?: number;
    tMax?: number;
  };
  targetQuantity: string; // Grandeza a determinar pelo aluno
  solutionExplanation: string; // Resolução analítica passo a passo visível APENAS no Modo Professor
  solutionParameters: {
    v0?: number;
    angleDeg?: number;
    y0?: number;
    g?: number;
    x0?: number;
    a?: number;
    tMax?: number;
  };
  active: boolean;
  createdAt: string;
  isCustom?: boolean; // Se foi adicionado pelo professor na app
}

export interface StudentChallengeAttempt {
  challengeId: string;
  simulatorId: string;
  attemptsCount: number;
  succeeded: boolean;
  bestDistanceError: number; // menor erro em metros
  lastAttemptTimestamp: string;
  history: {
    attemptNumber: number;
    v0: number;
    angleDeg: number;
    y0: number;
    actualRange: number;
    errorMeters: number;
    hit: boolean;
    timestamp: string;
  }[];
}

export interface StudentProgressSummary {
  studentNick: string;
  completedChallengesCount: number;
  totalChallengesAvailable: number;
  totalAttempts: number;
  averageAttempts: number;
  successRate: number; // percentagem 0-100
  lastActivity: string;
}

export interface ExportedStudentProgress {
  version: '1.0';
  studentNick: string;
  exportedAt: string;
  appTitle: string;
  summary: {
    totalCompleted: number;
    totalAttempts: number;
    averageAttempts: number;
    successRate: number;
  };
  simulatorProgress: Record<
    string,
    {
      simulatorId: string;
      completedCount: number;
      totalAvailable: number;
      challenges: StudentChallengeAttempt[];
    }
  >;
}
