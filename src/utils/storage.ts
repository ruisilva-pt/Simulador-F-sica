/**
 * Gestão de armazenamento local (localStorage) para a plataforma
 * Todos os dados permanecem no dispositivo do utilizador (offline, sem servidores externos).
 */

import {
  DEFAULT_PROJECTILE_CHALLENGES,
  DEFAULT_RECTILINEAR_CHALLENGES,
} from '../config/defaultChallenges';
import { SIMULATORS_CONFIG } from '../config/simulators';
import { Challenge, ExportedStudentProgress, StudentChallengeAttempt } from '../types/challenges';
import { LaunchRecord } from '../types/physics';

const STORAGE_KEYS = {
  STUDENT_NICK: 'esv_student_nick',
  TEACHER_PIN: 'esv_teacher_pin',
  CUSTOM_CHALLENGES: 'esv_custom_challenges',
  DISABLED_CHALLENGES: 'esv_disabled_challenges',
  CHALLENGE_ATTEMPTS: 'esv_challenge_attempts',
  LAUNCH_RECORDS: 'esv_launch_records',
  CLASS_SUBMISSIONS: 'esv_class_submissions',
};

// =================== ALUNO ===================

export function getStudentNick(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.STUDENT_NICK) || '';
  } catch {
    return '';
  }
}

export function setStudentNick(nick: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENT_NICK, nick.trim());
  } catch (e) {
    console.error('Erro ao guardar alcunha:', e);
  }
}

// =================== PROFESSOR PIN ===================

export function getTeacherPin(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.TEACHER_PIN) || '1234';
  } catch {
    return '1234';
  }
}

export function setTeacherPin(newPin: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHER_PIN, newPin.trim());
  } catch (e) {
    console.error('Erro ao guardar PIN:', e);
  }
}

export function verifyTeacherPin(enteredPin: string): boolean {
  const currentPin = getTeacherPin();
  return enteredPin.trim() === currentPin;
}

// =================== DESAFIOS ===================

export function getAllChallenges(): Challenge[] {
  try {
    const disabledIds = new Set<string>(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.DISABLED_CHALLENGES) || '[]')
    );
    const customList: Challenge[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CUSTOM_CHALLENGES) || '[]'
    );

    const allDefaults = [
      ...DEFAULT_PROJECTILE_CHALLENGES,
      ...DEFAULT_RECTILINEAR_CHALLENGES,
    ];

    const defaultList = allDefaults.map((ch) => ({
      ...ch,
      active: !disabledIds.has(ch.id),
    }));

    return [...defaultList, ...customList];
  } catch (e) {
    console.error('Erro ao ler desafios:', e);
    return [...DEFAULT_PROJECTILE_CHALLENGES, ...DEFAULT_RECTILINEAR_CHALLENGES];
  }
}

export function getActiveChallenges(simulatorId?: string): Challenge[] {
  const all = getAllChallenges();
  return all.filter(
    (ch) => ch.active && (!simulatorId || ch.simulatorId === simulatorId)
  );
}

export function saveCustomChallenge(challenge: Challenge): void {
  try {
    const customList: Challenge[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CUSTOM_CHALLENGES) || '[]'
    );
    const existingIndex = customList.findIndex((c) => c.id === challenge.id);
    if (existingIndex >= 0) {
      customList[existingIndex] = challenge;
    } else {
      customList.push(challenge);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CHALLENGES, JSON.stringify(customList));
  } catch (e) {
    console.error('Erro ao guardar desafio:', e);
  }
}

export function toggleChallengeActive(challengeId: string): void {
  try {
    const customList: Challenge[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CUSTOM_CHALLENGES) || '[]'
    );
    const customIndex = customList.findIndex((c) => c.id === challengeId);
    if (customIndex >= 0) {
      customList[customIndex].active = !customList[customIndex].active;
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CHALLENGES, JSON.stringify(customList));
      return;
    }

    // Se for desafio padrão, guardamos no conjunto de desativados
    const disabledIds: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.DISABLED_CHALLENGES) || '[]'
    );
    const idx = disabledIds.indexOf(challengeId);
    if (idx >= 0) {
      disabledIds.splice(idx, 1);
    } else {
      disabledIds.push(challengeId);
    }
    localStorage.setItem(STORAGE_KEYS.DISABLED_CHALLENGES, JSON.stringify(disabledIds));
  } catch (e) {
    console.error('Erro ao alternar estado do desafio:', e);
  }
}

export function deleteChallenge(challengeId: string): void {
  try {
    let customList: Challenge[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CUSTOM_CHALLENGES) || '[]'
    );
    customList = customList.filter((c) => c.id !== challengeId);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CHALLENGES, JSON.stringify(customList));

    // Se for padrão, desativamos permanentemente
    toggleChallengeActive(challengeId);
  } catch (e) {
    console.error('Erro ao apagar desafio:', e);
  }
}

export function exportChallengesJson(): string {
  const challenges = getAllChallenges();
  return JSON.stringify(challenges, null, 2);
}

export function importChallengesJson(jsonContent: string): { success: boolean; count: number } {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!Array.isArray(parsed)) throw new Error('Formato inválido');
    
    const validChallenges: Challenge[] = parsed.filter(
      (c) => c.id && c.title && c.targetDistance
    );

    localStorage.setItem(STORAGE_KEYS.CUSTOM_CHALLENGES, JSON.stringify(validChallenges));
    return { success: true, count: validChallenges.length };
  } catch (e) {
    console.error('Falha ao importar desafios:', e);
    return { success: false, count: 0 };
  }
}

// =================== TENTATIVAS DE DESAFIOS (ALUNO) ===================

export function getChallengeAttempts(): Record<string, StudentChallengeAttempt> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHALLENGE_ATTEMPTS) || '{}');
  } catch {
    return {};
  }
}

export function recordChallengeAttempt(params: {
  challengeId: string;
  simulatorId: string;
  v0: number;
  angleDeg: number;
  y0: number;
  actualRange: number;
  targetDistance: number;
  tolerancePercent: number;
}): { hit: boolean; errorMeters: number; attemptNumber: number } {
  const {
    challengeId,
    simulatorId,
    v0,
    angleDeg,
    y0,
    actualRange,
    targetDistance,
    tolerancePercent,
  } = params;

  const errorMeters = Math.abs(actualRange - targetDistance);
  const referenceMag = Math.abs(targetDistance) > 0.01 ? Math.abs(targetDistance) : 10;
  const maxAllowedError = (referenceMag * tolerancePercent) / 100;
  const hit = errorMeters <= maxAllowedError;

  const attemptsMap = getChallengeAttempts();
  const existing = attemptsMap[challengeId] || {
    challengeId,
    simulatorId,
    attemptsCount: 0,
    succeeded: false,
    bestDistanceError: 999999,
    lastAttemptTimestamp: '',
    history: [],
  };

  const attemptNumber = existing.attemptsCount + 1;
  const now = new Date().toISOString();

  existing.attemptsCount = attemptNumber;
  if (hit) existing.succeeded = true;
  if (errorMeters < existing.bestDistanceError) {
    existing.bestDistanceError = errorMeters;
  }
  existing.lastAttemptTimestamp = now;
  existing.history.push({
    attemptNumber,
    v0,
    angleDeg,
    y0,
    actualRange,
    errorMeters,
    hit,
    timestamp: now,
  });

  attemptsMap[challengeId] = existing;
  try {
    localStorage.setItem(STORAGE_KEYS.CHALLENGE_ATTEMPTS, JSON.stringify(attemptsMap));
  } catch (e) {
    console.error('Erro ao guardar tentativa:', e);
  }

  return { hit, errorMeters, attemptNumber };
}

// =================== TABELA DE REGISTOS DE LANÇAMENTOS ===================

export function getLaunchRecords(): LaunchRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LAUNCH_RECORDS) || '[]');
  } catch {
    return [];
  }
}

export function saveLaunchRecord(record: LaunchRecord): void {
  try {
    const list = getLaunchRecords();
    list.unshift(record);
    // Limitar a 100 registos recentes para poupar memória local
    const trimmed = list.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.LAUNCH_RECORDS, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Erro ao guardar registo de lançamento:', e);
  }
}

export function clearLaunchRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.LAUNCH_RECORDS);
  } catch (e) {
    console.error('Erro ao limpar registos:', e);
  }
}

/**
 * Exporta a tabela de registos em formato CSV formatado para Excel/Calc com vírgula decimal e separador de ponto e vírgula
 */
export function exportLaunchRecordsCsv(records: LaunchRecord[]): string {
  const header = [
    'N.º',
    'Simulador',
    'Data/Hora',
    'Modo',
    'v0 (m/s)',
    'Ângulo (°) / a (m/s²)',
    'y0 (m) / x0 (m)',
    'g (m/s²) / Δt (s)',
    'Tempo (s)',
    'Alcance / Posição Final (m)',
    'Altura Máx / Distância Percorrida (m)',
    'v Final / Impacto (m/s)',
    'Previsto (m)',
    'Erro (%)',
    'Alvo (m)',
    'Acertou?',
  ].join(';');

  const rows = records.map((r, idx) => {
    const dateFormatted = new Date(r.timestamp).toLocaleString('pt-PT');
    const toPt = (n?: number) => (n !== undefined && !isNaN(n) ? String(n).replace('.', ',') : '');
    const isRect = r.simulatorId === 'movimento-retilineo';

    return [
      idx + 1,
      isRect ? 'Movimento Retilíneo' : 'Laboratório de Movimento',
      `"${dateFormatted}"`,
      r.mode.toUpperCase(),
      toPt(r.v0),
      isRect ? toPt(r.a) : toPt(r.angleDeg),
      isRect ? toPt(r.x0) : toPt(r.y0),
      isRect ? toPt(r.tMax) : toPt(r.g),
      isRect ? toPt(r.tMax) : toPt(r.tFlight),
      isRect ? toPt(r.finalX) : toPt(r.range),
      isRect ? toPt(r.distanceTraveled) : toPt(r.maxHeight),
      isRect ? toPt(r.finalV) : toPt(r.vImpact),
      toPt(r.predictedRange),
      toPt(r.errorPercentage),
      toPt(r.targetDistance),
      r.hitTarget === undefined ? '' : r.hitTarget ? 'SIM' : 'NÃO',
    ].join(';');
  });

  // Byte Order Mark (BOM) para compatibilidade com Excel em UTF-8
  return '\uFEFF' + [header, ...rows].join('\r\n');
}

// =================== EXPORTAÇÃO E IMPORTAÇÃO DE PROGRESSO DO ALUNO ===================

export function generateStudentProgressExport(): { jsonString: string; shortCode: string; data: ExportedStudentProgress } {
  const studentNick = getStudentNick() || 'Aluno Sem Identificação';
  const attempts = getChallengeAttempts();
  const allCh = getAllChallenges();
  const activeChallenges = allCh.filter((c) => c.active);

  const attemptsList = Object.values(attempts);
  const totalCompleted = activeChallenges.filter((c) => attempts[c.id]?.succeeded).length;
  const totalAttempts = attemptsList.reduce((acc, curr) => acc + curr.attemptsCount, 0);
  const averageAttempts = totalCompleted > 0 ? totalAttempts / totalCompleted : 0;
  const successRate = activeChallenges.length > 0 ? (totalCompleted / activeChallenges.length) * 100 : 0;

  const simulatorProgress: ExportedStudentProgress['simulatorProgress'] = {};
  SIMULATORS_CONFIG.filter((s) => s.status === 'disponivel' && s.hasChallenges !== false).forEach((sim) => {
    const simActive = activeChallenges.filter((c) => c.simulatorId === sim.id);
    const simCompleted = simActive.filter((c) => attempts[c.id]?.succeeded).length;
    const simAttempts = attemptsList.filter((a) => a.simulatorId === sim.id);

    simulatorProgress[sim.id] = {
      simulatorId: sim.id,
      completedCount: simCompleted,
      totalAvailable: simActive.length,
      challenges: simAttempts,
    };
  });

  const data: ExportedStudentProgress = {
    version: '1.0',
    studentNick,
    exportedAt: new Date().toISOString(),
    appTitle: 'Laboratório de Física - ES Viriato',
    summary: {
      totalCompleted,
      totalAttempts,
      averageAttempts: Math.round(averageAttempts * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
    },
    simulatorProgress,
  };

  const jsonString = JSON.stringify(data, null, 2);

  // Código curto em base64 com compressão simplificada
  let shortCode = '';
  try {
    const compactObj = {
      n: studentNick,
      t: data.exportedAt,
      c: totalCompleted,
      a: totalAttempts,
      r: attemptsList.map((at) => ({
        id: at.challengeId,
        sim: at.simulatorId,
        s: at.succeeded ? 1 : 0,
        n: at.attemptsCount,
        err: Math.round(at.bestDistanceError * 100) / 100,
      })),
    };
    shortCode = btoa(unescape(encodeURIComponent(JSON.stringify(compactObj))));
  } catch (e) {
    console.error('Erro ao gerar código curto:', e);
    shortCode = btoa(unescape(encodeURIComponent(jsonString)));
  }

  return { jsonString, shortCode, data };
}

// =================== PAINEL DO PROFESSOR (SUBMISSÕES DA TURMA) ===================

export function getClassSubmissions(): ExportedStudentProgress[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASS_SUBMISSIONS) || '[]');
  } catch {
    return [];
  }
}

export function importStudentProgress(input: string): { success: boolean; studentNick?: string; message: string } {
  try {
    let parsed: any = null;

    const trimmed = input.trim();
    if (trimmed.startsWith('{')) {
      parsed = JSON.parse(trimmed);
    } else {
      // Tentativa de decifrar o código curto base64
      const decoded = decodeURIComponent(escape(atob(trimmed)));
      const compact = JSON.parse(decoded);
      if (compact.n) {
        const allChallenges = getAllChallenges();
        const activeChallenges = allChallenges.filter((c) => c.active);
        const activeCount = activeChallenges.length;
        const compCount = compact.c || 0;
        const rate = activeCount > 0 ? (compCount / activeCount) * 100 : 0;

        const mappedChallenges: StudentChallengeAttempt[] = (compact.r || []).map((item: any) => {
          const inferredSim =
            item.sim ||
            allChallenges.find((c) => c.id === item.id)?.simulatorId ||
            (String(item.id).startsWith('ret-') ? 'movimento-retilineo' : 'lancamento-projeteis');
          return {
            challengeId: item.id,
            simulatorId: inferredSim,
            attemptsCount: item.n,
            succeeded: item.s === 1,
            bestDistanceError: item.err,
            lastAttemptTimestamp: compact.t,
            history: [],
          };
        });

        const simProg: ExportedStudentProgress['simulatorProgress'] = {};
        SIMULATORS_CONFIG.filter((s) => s.status === 'disponivel' && s.hasChallenges !== false).forEach((sim) => {
          const simActiveCount = activeChallenges.filter((c) => c.simulatorId === sim.id).length;
          const simItems = mappedChallenges.filter((c) => c.simulatorId === sim.id);
          simProg[sim.id] = {
            simulatorId: sim.id,
            completedCount: simItems.filter((c) => c.succeeded).length,
            totalAvailable: simActiveCount,
            challenges: simItems,
          };
        });

        parsed = {
          version: '1.0',
          studentNick: compact.n,
          exportedAt: compact.t || new Date().toISOString(),
          appTitle: 'Laboratório de Física - ES Viriato',
          summary: {
            totalCompleted: compCount,
            totalAttempts: compact.a || 0,
            averageAttempts: compCount > 0 ? Math.round(((compact.a || 0) / compCount) * 10) / 10 : 0,
            successRate: Math.round(rate * 10) / 10,
          },
          simulatorProgress: simProg,
        };
      }
    }

    if (!parsed || !parsed.studentNick) {
      return { success: false, message: 'Dados de progresso inválidos ou corrompidos.' };
    }

    const currentSubmissions = getClassSubmissions();
    const existingIdx = currentSubmissions.findIndex((s) => s.studentNick === parsed.studentNick);

    if (existingIdx >= 0) {
      currentSubmissions[existingIdx] = parsed;
    } else {
      currentSubmissions.push(parsed);
    }

    localStorage.setItem(STORAGE_KEYS.CLASS_SUBMISSIONS, JSON.stringify(currentSubmissions));

    return {
      success: true,
      studentNick: parsed.studentNick,
      message: `Progresso de "${parsed.studentNick}" importado com sucesso!`,
    };
  } catch (e: any) {
    return { success: false, message: 'Não foi possível ler o código ou ficheiro fornecido.' };
  }
}

export function clearClassSubmissions(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CLASS_SUBMISSIONS);
  } catch (e) {
    console.error('Erro ao limpar submissões:', e);
  }
}

export function exportClassSubmissionsCsv(
  submissions: ExportedStudentProgress[],
  activeChallengesCount?: number
): string {
  const activeCount =
    activeChallengesCount !== undefined
      ? activeChallengesCount
      : getAllChallenges().filter((c) => c.active).length;

  const header = [
    'N.º / Alcunha do Aluno',
    'Desafios Concluídos',
    'Total de Tentativas',
    'Média de Tentativas / Desafio',
    'Taxa de Sucesso (%)',
    'Data de Submissão',
  ].join(';');

  const rows = submissions.map((sub) => {
    const toPt = (n: number) => String(n).replace('.', ',');
    const dateFormatted = new Date(sub.exportedAt).toLocaleString('pt-PT');
    const successRateCalc =
      activeCount > 0 ? Math.round((sub.summary.totalCompleted / activeCount) * 1000) / 10 : 0;

    return [
      `"${sub.studentNick}"`,
      sub.summary.totalCompleted,
      sub.summary.totalAttempts,
      toPt(sub.summary.averageAttempts),
      toPt(successRateCalc),
      `"${dateFormatted}"`,
    ].join(';');
  });

  return '\uFEFF' + [header, ...rows].join('\r\n');
}
