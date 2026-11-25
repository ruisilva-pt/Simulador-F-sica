import React, { useState } from 'react';
import { Challenge } from '../../types/challenges';
import { SIMULATORS_CONFIG } from '../../config/simulators';
import { getChallengeAttempts } from '../../utils/storage';
import { formatPtNumber } from '../../physics/projectile';
import { Target, CheckCircle2, Play, Filter } from 'lucide-react';

interface ChallengesListViewProps {
  challenges: Challenge[];
  onSelectChallenge: (challenge: Challenge) => void;
}

export const ChallengesListView: React.FC<ChallengesListViewProps> = ({
  challenges,
  onSelectChallenge,
}) => {
  const [filterDifficulty, setFilterDifficulty] = useState<string>('todos');
  const [filterSimulator, setFilterSimulator] = useState<string>('todos');
  const attempts = getChallengeAttempts();

  const availableSims = SIMULATORS_CONFIG.filter(
    (s) => s.status === 'disponivel' && s.hasChallenges !== false
  );

  const filtered = challenges.filter((c) => {
    if (!c.active) return false;
    if (filterSimulator !== 'todos' && c.simulatorId !== filterSimulator) return false;
    if (filterDifficulty !== 'todos' && c.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Target className="w-5 h-5 text-amber-400" />
              <span>Desafios Práticos de Cinemática</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Testa as tuas deduções teóricas. Calcula os parâmetros necessários, insere os valores no respetivo simulador e acerta no alvo!
            </p>
          </div>

          {/* Filtros de Simulador e Dificuldade */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSimulator}
              onChange={(e) => setFilterSimulator(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="todos">Todos os simuladores</option>
              {availableSims.map((sim) => (
                <option key={sim.id} value={sim.id}>
                  {sim.name}
                </option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="todos">Todas as dificuldades</option>
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grelha de Desafios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((ch) => {
          const attempt = attempts[ch.id];
          const isCompleted = attempt?.succeeded;
          const attemptCount = attempt?.attemptsCount || 0;
          const simConfig = SIMULATORS_CONFIG.find((s) => s.id === ch.simulatorId);
          const isRect = ch.simulatorId === 'movimento-retilineo';

          return (
            <div
              key={ch.id}
              className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between shadow-lg transition hover:border-teal-500/50 ${
                isCompleted
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : attemptCount > 0
                  ? 'border-amber-500/40'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border inline-block ${
                          isRect
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                        }`}
                      >
                        {simConfig?.name || ch.simulatorId}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border inline-block ${
                          ch.difficulty === 'facil'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : ch.difficulty === 'medio'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {ch.difficulty}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100">{ch.title}</h3>
                  </div>

                  {isCompleted ? (
                    <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Concluído</span>
                    </span>
                  ) : attemptCount > 0 ? (
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                      {attemptCount} tentativa(s)
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                      Não iniciado
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {ch.statement}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {isRect ? 'Alvo na trajetória:' : 'Alvo no solo:'}
                    </span>
                    <span className="text-slate-200 font-bold">
                      {isRect ? `x = ${formatPtNumber(ch.targetDistance, 1)}` : formatPtNumber(ch.targetDistance, 1)} m (±{ch.targetTolerance}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Objetivo:</span>
                    <span className="text-amber-400 font-medium truncate block">
                      {ch.targetQuantity}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {isCompleted
                    ? `Melhor erro: ${formatPtNumber(attempt.bestDistanceError, 2)} m`
                    : 'Solução avaliada no simulador'}
                </span>

                <button
                  onClick={() => onSelectChallenge(ch)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isCompleted ? 'Repetir Desafio' : 'Resolver Agora'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
