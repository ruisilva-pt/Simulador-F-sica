import React from 'react';
import { calculateRectilinearResults } from '../../physics/rectilinear';
import { formatPtNumber } from '../../physics/projectile';
import { RectilinearParams } from '../../types/rectilinear';
import { Challenge } from '../../types/challenges';
import { Check, Layers, Lock, Target, TrendingUp } from 'lucide-react';

interface RectilinearControlsProps {
  params: RectilinearParams;
  setParams: React.Dispatch<React.SetStateAction<RectilinearParams>>;
  comparisonParams: RectilinearParams | null;
  onSaveComparison: () => void;
  onClearComparison: () => void;
  showStroboscopic: boolean;
  setShowStroboscopic: (show: boolean) => void;
  showVectors: boolean;
  setShowVectors: (show: boolean) => void;
  mode: 'livre' | 'previsao' | 'desafio';
  setMode: (mode: 'livre' | 'previsao' | 'desafio') => void;
  predictedFinalX: string;
  setPredictedFinalX: (val: string) => void;
  predictionResult: {
    actual: number;
    predicted: number;
    errorMeters: number;
    errorPercent: number;
  } | null;
  activeChallenge: Challenge | null;
  challengeResult: {
    hit: boolean;
    errorMeters: number;
    attemptNumber: number;
  } | null;
  challengeTotalAttempts: number;
  challengeSucceeded: boolean;
  isSimulating: boolean;
}

export const RectilinearControls: React.FC<RectilinearControlsProps> = ({
  params,
  setParams,
  comparisonParams,
  onSaveComparison,
  onClearComparison,
  showStroboscopic,
  setShowStroboscopic,
  showVectors,
  setShowVectors,
  mode,
  setMode,
  predictedFinalX,
  setPredictedFinalX,
  predictionResult,
  activeChallenge,
  challengeResult,
  challengeTotalAttempts,
  challengeSucceeded,
  isSimulating,
}) => {
  const compResults = comparisonParams ? calculateRectilinearResults(comparisonParams) : null;

  const isX0Fixed = mode === 'desafio' && activeChallenge?.fixedParams.x0 !== undefined;
  const isV0Fixed = mode === 'desafio' && activeChallenge?.fixedParams.v0 !== undefined;
  const isAFixed = mode === 'desafio' && activeChallenge?.fixedParams.a !== undefined;
  const isTMaxFixed = mode === 'desafio' && activeChallenge?.fixedParams.tMax !== undefined;

  const applyPreset = (preset: 'mru' | 'mrua_acel' | 'mrua_ret') => {
    if (isSimulating || mode === 'desafio') return;
    if (preset === 'mru') {
      setParams({ x0: 0, v0: 10, a: 0, tMax: 6 });
    } else if (preset === 'mrua_acel') {
      setParams({ x0: 0, v0: 2, a: 3, tMax: 6 });
    } else {
      setParams({ x0: 0, v0: 20, a: -4, tMax: 8 });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 text-slate-100 shadow-xl space-y-5">
      {/* Seletor de Modo */}
      <div className="flex flex-col space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Modo Experimental
        </label>
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setMode('livre')}
            className={`py-2 px-2 text-xs font-semibold rounded-md transition text-center ${
              mode === 'livre'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Modo Livre
          </button>
          <button
            onClick={() => setMode('previsao')}
            className={`py-2 px-2 text-xs font-semibold rounded-md transition text-center ${
              mode === 'previsao'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Modo Previsão
          </button>
          <button
            onClick={() => setMode('desafio')}
            className={`py-2 px-2 text-xs font-semibold rounded-md transition text-center ${
              mode === 'desafio'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Modo Desafio
          </button>
        </div>
      </div>

      {/* Presets Didáticos Rápidos (fora do Modo Desafio) */}
      {mode !== 'desafio' && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Regimes de Movimento (Atalhos)
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
            <button
              onClick={() => applyPreset('mru')}
              disabled={isSimulating}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-sky-300 transition"
            >
              MRU (a = 0)
            </button>
            <button
              onClick={() => applyPreset('mrua_acel')}
              disabled={isSimulating}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-emerald-300 transition"
            >
              Acelerado
            </button>
            <button
              onClick={() => applyPreset('mrua_ret')}
              disabled={isSimulating}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-orange-300 transition"
            >
              Retardado
            </button>
          </div>
        </div>
      )}

      {/* Caixa do Modo Previsão */}
      {mode === 'previsao' && (
        <div className="bg-slate-950/90 border border-teal-500/30 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>Previsão da Posição Final x(t_máx)</span>
          </div>
          <p className="text-xs text-slate-400">
            Calcula x(t) = x₀ + v₀·t + ½·a·t² no teu caderno e escreve a posição final prevista antes de iniciar:
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 60,0"
              value={predictedFinalX}
              onChange={(e) => setPredictedFinalX(e.target.value)}
              disabled={isSimulating}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
            />
            <span className="text-xs font-mono text-slate-400">metros (m)</span>
          </div>

          {predictionResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Posição Prevista:</span>
                <span className="text-slate-200">{formatPtNumber(predictionResult.predicted, 1)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Posição Real x_f:</span>
                <span className="text-teal-400 font-bold">{formatPtNumber(predictionResult.actual, 1)} m</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1">
                <span className="text-slate-400">Erro Percentual:</span>
                <span
                  className={`font-bold ${
                    predictionResult.errorPercent <= 2
                      ? 'text-emerald-400'
                      : predictionResult.errorPercent <= 5
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {formatPtNumber(predictionResult.errorPercent, 1)}% (
                  {formatPtNumber(predictionResult.errorMeters, 2)} m)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Caixa do Modo Desafio */}
      {mode === 'desafio' && activeChallenge && (
        <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
              <Target className="w-4 h-4 shrink-0" />
              <span>{activeChallenge.title}</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {activeChallenge.difficulty}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            {activeChallenge.statement}
          </p>
          <div className="flex items-center justify-between text-xs font-mono bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-slate-400">Alvo na trajetória:</span>
            <span className="text-amber-300 font-bold">
              x = {formatPtNumber(activeChallenge.targetDistance, 1)} m (±{activeChallenge.targetTolerance}%)
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-slate-400">Total de tentativas:</span>
            <span className="text-amber-300 font-bold">
              {challengeTotalAttempts} {challengeTotalAttempts === 1 ? 'tentativa' : 'tentativas'}
            </span>
          </div>

          {challengeSucceeded && (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/30 p-2 rounded">
              <Check className="w-4 h-4" />
              <span>Desafio já concluído com sucesso!</span>
            </div>
          )}

          {challengeResult && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                challengeResult.hit
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="font-bold flex items-center space-x-1.5">
                {challengeResult.hit ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>ALVO ATINGIDO COM SUCESSO!</span>
                  </>
                ) : (
                  <span>TENTATIVA {challengeResult.attemptNumber}: FALHOU O ALVO</span>
                )}
              </div>
              <div className="text-[11px] opacity-90">
                {challengeResult.hit
                  ? `Excelente precisão! Desvio de apenas ${formatPtNumber(challengeResult.errorMeters, 2)} m.`
                  : `O móvel terminou a ${formatPtNumber(challengeResult.errorMeters, 2)} m do alvo. Ajusta os parâmetros e tenta de novo!`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controlos Físicos */}
      <div className="space-y-4">
        {/* Posição Inicial x0 */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <span>Posição Inicial (x₀)</span>
              {isX0Fixed && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Fixa pelo desafio</span>
                </span>
              )}
            </span>
            <span className="font-mono text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {formatPtNumber(params.x0, 1)} m
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={params.x0}
            disabled={isX0Fixed || isSimulating}
            onChange={(e) => {
              if (!isX0Fixed) {
                setParams((prev) => ({ ...prev, x0: parseFloat(e.target.value) }));
              }
            }}
            className={`w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg ${
              isX0Fixed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>−50 m</span>
            <span>0 m</span>
            <span>+50 m</span>
          </div>
        </div>

        {/* Velocidade Inicial v0 */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <span>Velocidade Inicial (v₀)</span>
              {isV0Fixed && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Fixa pelo desafio</span>
                </span>
              )}
            </span>
            <span className="font-mono text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {formatPtNumber(params.v0, 1)} m/s
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            step="0.5"
            value={params.v0}
            disabled={isV0Fixed || isSimulating}
            onChange={(e) => {
              if (!isV0Fixed) {
                setParams((prev) => ({ ...prev, v0: parseFloat(e.target.value) }));
              }
            }}
            className={`w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg ${
              isV0Fixed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>−30 m/s</span>
            <span>0 m/s</span>
            <span>+30 m/s</span>
          </div>
        </div>

        {/* Aceleração constante a */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <span>Aceleração Constante (a)</span>
              {isAFixed && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Fixa pelo desafio</span>
                </span>
              )}
            </span>
            <span className="font-mono text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {formatPtNumber(params.a, 1)} m/s²
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={params.a}
            disabled={isAFixed || isSimulating}
            onChange={(e) => {
              if (!isAFixed) {
                setParams((prev) => ({ ...prev, a: parseFloat(e.target.value) }));
              }
            }}
            className={`w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg ${
              isAFixed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>−10 m/s²</span>
            <span>0 (MRU)</span>
            <span>+10 m/s²</span>
          </div>
        </div>

        {/* Intervalo de tempo tMax */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <span>Duração de Observação (Δt)</span>
              {isTMaxFixed && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Fixa pelo desafio</span>
                </span>
              )}
            </span>
            <span className="font-mono text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {formatPtNumber(params.tMax, 1)} s
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="15"
            step="0.5"
            value={params.tMax}
            disabled={isTMaxFixed || isSimulating}
            onChange={(e) => {
              if (!isTMaxFixed) {
                setParams((prev) => ({ ...prev, tMax: parseFloat(e.target.value) }));
              }
            }}
            className={`w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg ${
              isTMaxFixed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>2 s</span>
            <span>8 s</span>
            <span>15 s</span>
          </div>
        </div>
      </div>

      {/* Opções e Comparação */}
      <div className="space-y-2.5 pt-3 border-t border-slate-800">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Instrumentos e Comparação
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <label className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={showVectors}
              onChange={(e) => setShowVectors(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span className="text-slate-300">Vetores v e a</span>
          </label>

          <label className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={showStroboscopic}
              onChange={(e) => setShowStroboscopic(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span className="text-slate-300">Rasto Estroboscópico</span>
          </label>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-slate-200 font-semibold">
                {comparisonParams
                  ? 'Comparação ativa'
                  : 'Comparação MRU vs MRUA'}
              </span>
            </div>
            {comparisonParams ? (
              <button
                onClick={onClearComparison}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
              >
                Limpar
              </button>
            ) : (
              <button
                onClick={onSaveComparison}
                className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded text-xs transition"
              >
                Fixar Atual
              </button>
            )}
          </div>

          {comparisonParams && compResults && (
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-2.5 text-[11px] font-mono text-amber-300 space-y-1.5">
              <div className="text-slate-400 text-[10px]">
                Fixado (x₀={formatPtNumber(comparisonParams.x0, 1)}m, v₀={formatPtNumber(comparisonParams.v0, 1)}m/s, a={formatPtNumber(comparisonParams.a, 1)}m/s²):
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800 text-center">
                <div className="bg-slate-950/80 p-1.5 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">Posição Final</span>
                  <span className="font-bold text-amber-300">{formatPtNumber(compResults.finalX, 1)} m</span>
                </div>
                <div className="bg-slate-950/80 p-1.5 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">Distância</span>
                  <span className="font-bold text-amber-300">{formatPtNumber(compResults.distanceTraveled, 1)} m</span>
                </div>
                <div className="bg-slate-950/80 p-1.5 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">v Final</span>
                  <span className="font-bold text-amber-300">{formatPtNumber(compResults.finalV, 1)} m/s</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
