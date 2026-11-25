/**
 * Armazenamento local (sem dados pessoais) dos resumos da Estação 4: Caça ao Erro.
 * Cada resumo é guardado no dispositivo e associado apenas ao código anónimo do aluno.
 */

import { ErrorType } from '../config/errorHuntData';
import { getStudentNick } from './storage';

const ERROR_HUNT_STORAGE_KEY = 'esv_error_hunt_summaries';

export interface ErrorHuntSummaryRecord {
  anonymousCode: string;
  completedAt: string;
  totalReviewed: number;
  foundFirstTry: number;
  foundWithHint: number;
  revealedCount: number;
  errorTypesToReview: Array<{ type: ErrorType; count: number }>;
}

function getAnonymousKey(): string {
  const nick = getStudentNick().trim();
  return nick || 'Aluno Sem Código';
}

export function getAllErrorHuntSummaries(): Record<string, ErrorHuntSummaryRecord> {
  try {
    const raw = localStorage.getItem(ERROR_HUNT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getSavedErrorHuntSummary(): ErrorHuntSummaryRecord | null {
  const code = getAnonymousKey();
  const all = getAllErrorHuntSummaries();
  return all[code] ?? null;
}

export function saveErrorHuntSummary(
  summary: Omit<ErrorHuntSummaryRecord, 'anonymousCode' | 'completedAt'>
): ErrorHuntSummaryRecord {
  const code = getAnonymousKey();
  const record: ErrorHuntSummaryRecord = {
    ...summary,
    anonymousCode: code,
    completedAt: new Date().toISOString(),
  };

  try {
    const all = getAllErrorHuntSummaries();
    all[code] = record;
    localStorage.setItem(ERROR_HUNT_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Ignorar erros de quota do navegador
  }

  return record;
}
