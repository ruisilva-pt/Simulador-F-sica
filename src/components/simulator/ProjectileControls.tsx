import React, { useState } from 'react';
import { GRAVITY_PRESETS, ProjectileParams } from '../../types/physics';
import { Challenge } from '../../types/challenges';
import { calculateProjectileResults, formatPtNumber } from '../../physics/projectile';
import {
  Compass,
  Gauge,
  Layers,
  Sparkles,
  Target,
  Sliders,
  Check,
  RotateCcw,
  HelpCircle,
  TrendingUp,
  Lock,
} from 'lucide-react';

interface ProjectileControlsProps {
  params: ProjectileParams;
  setParams: React.Dispatch<React.SetStateAction<ProjectileParams>>;
  comparisonParams: ProjectileParams | null;
  onSaveComparison: () => void;
  onClearComparison: () => void;
  showStroboscopic: boolean;
  setShowStroboscopic: (show: boolean) => void;
  showVectors: boolean;
  setShowVectors: (show: boolean) => void;
  mode: 'livre' | 'previsao' | 'desafio';
  setMode: (mode: 'livre' | 'previsao' | 'desafio') => void;
  predictedRange: string;
  setPredictedRange: (val: string) => void;
  predictionResult: {
    actual: number;
    predicted: number;
    errorMeters: number;
    errorPercent: number;
  } | null;
  activeChallenge: Challenge | null;
  onSelectChallenge: (ch: Challenge | null) => void;
  challengeResult: {
    hit: boolean;
    errorMeters: number;
    attemptNumber: number;
  } | null;
  challengeTotalAttempts: number;
  challengeSucceeded: boolean;
  isSimulating: boolean;
  onLaunch: () => void;
}

export const ProjectileControls: React.FC<ProjectileControlsProps> = ({
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
  predictedRange,
  setPredictedRange,
  predictionResult,
  activeChallenge,
  onSelectChallenge,
  challengeResult,
  challengeTotalAttempts,
  challengeSucceeded,
  isSimulating,
  onLaunch,
}) => {
  const [selectedGravityId, setSelectedGravityId] = useState<string>('earth');

  const compResults = comparisonParams ? calculateProjectileResults(comparisonParams) : null;

  const handleGravityPresetChange = (presetId: string) => {
    setSelectedGravityId(presetId);
    const preset = GRAVITY_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setParams((prev) => ({ ...prev, g: preset.g }));
    }
  };

  // Se estiver num desafio com parâmetros fixos, certos controlos são bloqueados
  const isAngleFixed = mode === 'desafio' && activeChallenge?.fixedParams.angleDeg !== undefined;
  const isV0Fixed = mode === 'desafio' && activeChallenge?.fixedParams.v0 !== undefined;
  const isY0Fixed = mode === 'desafio' && activeChallenge?.fixedParams.y0 !== undefined;
  const isGFixed = mode === 'desafio' && activeChallenge?.fixedParams.g !== undefined;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 text-slate-100 shadow-xl space-y-5">
      {/* Seletor de Modo: Livre / Previsão / Desafio */}
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

      {/* Caixa do Modo Previsão */}
      {mode === 'previsao' && (
        <div className="bg-slate-950/90 border border-teal-500/30 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>Previsão Teórica do Alcance</span>
          </div>
          <p className="text-xs text-slate-400">
            Aplica as fórmulas teóricas no teu caderno, calcula o alcance previsto (X) e introduz o valor antes de lançar:
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex: 35,3"
              value={predictedRange}
              onChange={(e) => setPredictedRange(e.target.value)}
              disabled={isSimulating}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
            />
            <span className="text-xs font-mono text-slate-400">metros (m)</span>
          </div>

          {predictionResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Alcance Previsto:</span>
                <span className="text-slate-200">{formatPtNumber(predictionResult.predicted, 1)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Alcance Real (X):</span>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
              <Target className="w-4 h-4" />
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
            <span className="text-slate-400">Alvo no solo:</span>
            <span className="text-amber-300 font-bold">
              {formatPtNumber(activeChallenge.targetDistance, 1)} m (±{activeChallenge.targetTolerance}%)
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
                  <>
                    <span>TENTATIVA {challengeResult.attemptNumber}: FALHOU O ALVO</span>
                  </>
                )}
              </div>
              <div className="text-[11px] opacity-90">
                {challengeResult.hit
                  ? `Excelente precisão! Desvio de apenas ${formatPtNumber(challengeResult.errorMeters, 2)} m.`
                  : `O projétil aterrou a ${formatPtNumber(challengeResult.errorMeters, 2)} m do centro do alvo. Ajusta os parâmetros e tenta de novo!`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controlos Físicos de Entrada */}
      <div className="space-y-4">
        {/* Velocidade Inicial v0 */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <span>Velocidade Inicial (v₀)</span>
              {isV0Fixed && <span className="text-[10px] text-amber-400 font-mono">(Fixa)</span>}
            </span>
            <span className="font-mono text-teal-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {formatPtNumber(params.v0, 1)} m/s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="0.5"
            value={params.v0}
            disabled={isV0Fixed || isSimulating}
            onChange={(e) => setParams((prev) => ({ ...prev, v0: parseFloat(e.target.value) }))}
            className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 m/s</span>
            <span>25 m/s</span>
            <span>50 m/s</span>
          </div>
        </div>

        {/* Ângulo de Lançamento θ */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <span>Ângulo com a Horizontal (θ)</span>
              {isAngleFixed && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Fixo pelo desafio</span>
                </span>
              )}
            </span>
            <span className="font-mono text-teal-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {formatPtNumber(params.angleDeg, 1)}°
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={params.angleDeg}
            disabled={isAngleFixed || isSimulating}
            onChange={(e) => {
              if (!isAngleFixed) {
                setParams((prev) => ({ ...prev, angleDeg: parseFloat(e.target.value) }));
              }
            }}
            className={`w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg ${
              isAngleFixed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0° (Horizontal)</span>
            <span>45° (Alcance Máx)</span>
            <span>90° (Vertical)</span>
          </div>
        </div>

        {/* Altura Inicial y0 */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <span>Altura Inicial (y₀)</span>
              {isY0Fixed && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Fixa pelo desafio</span>
                </span>
              )}
            </span>
            <span className="font-mono text-teal-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {formatPtNumber(params.y0, 1)} m
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="0.5"
            value={params.y0}
            disabled={isY0Fixed || isSimulating}
            onChange={(e) => {
              if (!isY0Fixed) {
                setParams((prev) => ({ ...prev, y0: parseFloat(e.target.value) }));
              }
            }}
            className={`w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg ${
              isY0Fixed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 m (Solo)</span>
            <span>25 m</span>
            <span>50 m</span>
          </div>
        </div>

        {/* Aceleração Gravítica g */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Aceleração Gravítica (g)</span>
            <span className="font-mono text-teal-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {formatPtNumber(params.g, 1)} m/s²
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {GRAVITY_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleGravityPresetChange(p.id)}
                disabled={isGFixed || isSimulating}
                className={`py-1.5 px-1 rounded text-center text-[11px] font-mono transition border ${
                  Math.abs(params.g - p.g) < 0.05
                    ? 'bg-teal-950 border-teal-500 text-teal-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                } ${isGFixed ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={p.description}
              >
                <div>{p.name}</div>
                <div className="text-[10px] text-slate-500">{formatPtNumber(p.g, 1)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visualização de Ferramentas Didáticas Adicionais */}
      <div className="space-y-2.5 pt-3 border-t border-slate-800">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Instrumentos e Opções de Observação
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <label className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={showVectors}
              onChange={(e) => setShowVectors(e.target.checked)}
              className="accent-teal-500 rounded"
            />
            <span className="text-slate-300">Vetor Velocidade & Componentes (vx, vy)</span>
          </label>

          <label className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={showStroboscopic}
              onChange={(e) => setShowStroboscopic(e.target.checked)}
              className="accent-teal-500 rounded"
            />
            <span className="text-slate-300">Rasto Estroboscópico (Δt igual)</span>
          </label>
        </div>

        {/* Comparação de Dois Lançamentos */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-slate-200 font-semibold">
                {comparisonParams
                  ? 'Comparação ativa'
                  : 'Comparação de Dois Lançamentos (ex: 30° vs 60°)'}
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
                Lançamento fixado (θ = {formatPtNumber(comparisonParams.angleDeg, 0)}°, v₀ = {formatPtNumber(comparisonParams.v0, 1)} m/s, y₀ = {formatPtNumber(comparisonParams.y0, 1)} m):
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800 text-center">
                <div className="bg-slate-950/80 p-1.5 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">Alcance</span>
                  <span className="font-bold text-amber-300">{formatPtNumber(compResults.range, 1)} m</span>
                </div>
                <div className="bg-slate-950/80 p-1.5 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">Altura Máx</span>
                  <span className="font-bold text-amber-300">{formatPtNumber(compResults.maxHeight, 1)} m</span>
                </div>
                <div className="bg-slate-950/80 p-1.5 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">Tempo Voo</span>
                  <span className="font-bold text-amber-300">{formatPtNumber(compResults.tFlight, 2)} s</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
