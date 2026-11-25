/**
 * Registo estatístico estritamente anónimo do Tutor Socrático (Modo Professor).
 * Guarda apenas contadores agregados por estação de origem e por tema de Física.
 * Não armazena nomes, alcunhas, identificadores de aluno nem transcrições das mensagens.
 */

import { TutorOriginStationId, classifyPhysicsTopic } from '../config/tutorSocratic';

const STORAGE_KEY = 'esv_tutor_anonymous_stats';

export interface TutorAnonymousStats {
  totalConversations: number;
  byStation: Record<TutorOriginStationId, number>;
  topicCounts: Record<string, number>;
  updatedAt: string;
}

const DEFAULT_STATS: TutorAnonymousStats = {
  totalConversations: 0,
  byStation: {
    'lancamento-projeteis': 0,
    'movimento-retilineo': 0,
    'tutor-socratico': 0,
    'caca-ao-erro': 0,
  },
  topicCounts: {},
  updatedAt: '',
};

export function getTutorAnonymousStats(): TutorAnonymousStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_STATS,
        byStation: { ...DEFAULT_STATS.byStation },
        topicCounts: {},
      };
    }
    const parsed = JSON.parse(raw) as Partial<TutorAnonymousStats>;
    return {
      totalConversations: typeof parsed.totalConversations === 'number' ? parsed.totalConversations : 0,
      byStation: {
        'lancamento-projeteis': parsed.byStation?.['lancamento-projeteis'] ?? 0,
        'movimento-retilineo': parsed.byStation?.['movimento-retilineo'] ?? 0,
        'tutor-socratico': parsed.byStation?.['tutor-socratico'] ?? 0,
        'caca-ao-erro': parsed.byStation?.['caca-ao-erro'] ?? 0,
      },
      topicCounts:
        parsed.topicCounts && typeof parsed.topicCounts === 'object' ? { ...parsed.topicCounts } : {},
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return {
      ...DEFAULT_STATS,
      byStation: { ...DEFAULT_STATS.byStation },
      topicCounts: {},
    };
  }
}

function saveStats(stats: TutorAnonymousStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignorar falhas de armazenamento silenciosamente
  }
}

export function recordTutorConversationStart(stationId: TutorOriginStationId): TutorAnonymousStats {
  const current = getTutorAnonymousStats();
  const next: TutorAnonymousStats = {
    totalConversations: current.totalConversations + 1,
    byStation: {
      ...current.byStation,
      [stationId]: (current.byStation[stationId] ?? 0) + 1,
    },
    topicCounts: { ...current.topicCounts },
    updatedAt: new Date().toISOString(),
  };
  saveStats(next);
  return next;
}

export function recordTutorMessageTopic(messageText: string): TutorAnonymousStats {
  const topic = classifyPhysicsTopic(messageText);
  const current = getTutorAnonymousStats();
  const next: TutorAnonymousStats = {
    ...current,
    topicCounts: {
      ...current.topicCounts,
      [topic]: (current.topicCounts[topic] ?? 0) + 1,
    },
    updatedAt: new Date().toISOString(),
  };
  saveStats(next);
  return next;
}

export function clearTutorAnonymousStats(): TutorAnonymousStats {
  const empty: TutorAnonymousStats = {
    totalConversations: 0,
    byStation: {
      'lancamento-projeteis': 0,
      'movimento-retilineo': 0,
      'tutor-socratico': 0,
      'caca-ao-erro': 0,
    },
    topicCounts: {},
    updatedAt: '',
  };
  saveStats(empty);
  return empty;
}
