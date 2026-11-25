import React, { useEffect, useState } from 'react';
import { ProjectileCanvas } from './ProjectileCanvas';
import { ProjectileControls } from './ProjectileControls';
import { KinematicGraphs } from './KinematicGraphs';
import { PhysicsEquationsPanel } from './PhysicsEquationsPanel';
import { LaunchRecordsTable } from './LaunchRecordsTable';
import {
  calculateProjectileResults,
  formatPtNumber,
  getKinematicInstant,
} from '../../physics/projectile';
import { KinematicInstant, LaunchRecord, ProjectileParams } from '../../types/physics';
import { Challenge } from '../../types/challenges';
import { TutorLaunchContext, TUTOR_DISPLAY_NAME } from '../../config/tutorSocratic';
import { SocraticTutorAvatar } from '../tutor/SocraticTutorAvatar';
import {
  getChallengeAttempts,
  getLaunchRecords,
  recordChallengeAttempt,
  saveLaunchRecord,
} from '../../utils/storage';

interface ProjectileSimulatorViewProps {
  challenges: Challenge[];
  activeChallenge: Challenge | null;
  setActiveChallenge: (ch: Challenge | null) => void;
  onRefreshAttempts?: () => void;
  onAskTutor?: (context: TutorLaunchContext) => void;
}

const DEFAULT_PARAMS: ProjectileParams = {
  v0: 20,
  angleDeg: 30,
  y0: 0,
  g: 9.8,
};

export const ProjectileSimulatorView: React.FC<ProjectileSimulatorViewProps> = ({
  challenges,
  activeChallenge,
  setActiveChallenge,
  onRefreshAttempts,
  onAskTutor,
}) => {
  // Parâmetros de lançamento
  const [params, setParams] = useState<ProjectileParams>(DEFAULT_PARAMS);

  // Parâmetros do lançamento de comparação (ex: 30° vs 60°)
  const [comparisonParams, setComparisonParams] = useState<ProjectileParams | null>(null);

  // Modos e opções visuais
  const [mode, setMode] = useState<'livre' | 'previsao' | 'desafio'>(
    activeChallenge ? 'desafio' : 'livre'
  );
  const [showStroboscopic, setShowStroboscopic] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);

  // Estado da simulação
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentInstant, setCurrentInstant] = useState<KinematicInstant>(
    getKinematicInstant(DEFAULT_PARAMS, 0)
  );

  // Modo Previsão
  const [predictedRangeInput, setPredictedRangeInput] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<{
    actual: number;
    predicted: number;
    errorMeters: number;
    errorPercent: number;
  } | null>(null);

  // Modo Desafio
  const [challengeResult, setChallengeResult] = useState<{
    hit: boolean;
    errorMeters: number;
    attemptNumber: number;
  } | null>(null);

  // Mapa de tentativas sincronizado
  const [attemptsMap, setAttemptsMap] = useState<Record<string, any>>(getChallengeAttempts());

  // Tabela de registos guardados
  const [records, setRecords] = useState<LaunchRecord[]>(getLaunchRecords());

  // Aplica e bloqueia imediatamente os parâmetros fixos quando um desafio ativo é selecionado
  useEffect(() => {
    if (activeChallenge) {
      setMode('desafio');
      setParams((prev) => ({
        v0: activeChallenge.fixedParams.v0 !== undefined ? activeChallenge.fixedParams.v0 : prev.v0,
        angleDeg:
          activeChallenge.fixedParams.angleDeg !== undefined
            ? activeChallenge.fixedParams.angleDeg
            : prev.angleDeg,
        y0: activeChallenge.fixedParams.y0 !== undefined ? activeChallenge.fixedParams.y0 : prev.y0,
        g: activeChallenge.fixedParams.g !== undefined ? activeChallenge.fixedParams.g : prev.g,
      }));
      setChallengeResult(null);
      setAttemptsMap(getChallengeAttempts());
    }
  }, [activeChallenge]);

  // Alternância controlada de modo
  const handleModeChange = (newMode: 'livre' | 'previsao' | 'desafio') => {
    setMode(newMode);
    if (newMode === 'desafio') {
      const challengeToUse = activeChallenge || challenges.find((c) => c.active) || challenges[0];
      if (challengeToUse) {
        setActiveChallenge(challengeToUse);
        setParams((prev) => ({
          v0: challengeToUse.fixedParams.v0 !== undefined ? challengeToUse.fixedParams.v0 : prev.v0,
          angleDeg:
            challengeToUse.fixedParams.angleDeg !== undefined
              ? challengeToUse.fixedParams.angleDeg
              : prev.angleDeg,
          y0: challengeToUse.fixedParams.y0 !== undefined ? challengeToUse.fixedParams.y0 : prev.y0,
          g: challengeToUse.fixedParams.g !== undefined ? challengeToUse.fixedParams.g : prev.g,
        }));
      }
    } else {
      setActiveChallenge(null);
      setChallengeResult(null);
    }
  };

  const currentResults = calculateProjectileResults(params);

  // Disparo do Lançamento
  const handleLaunch = () => {
    if (mode === 'desafio' && activeChallenge) {
      // Garante rigorosamente que o lançamento é sempre avaliado com os valores fixos
      setParams((prev) => ({
        v0: activeChallenge.fixedParams.v0 !== undefined ? activeChallenge.fixedParams.v0 : prev.v0,
        angleDeg:
          activeChallenge.fixedParams.angleDeg !== undefined
            ? activeChallenge.fixedParams.angleDeg
            : prev.angleDeg,
        y0: activeChallenge.fixedParams.y0 !== undefined ? activeChallenge.fixedParams.y0 : prev.y0,
        g: activeChallenge.fixedParams.g !== undefined ? activeChallenge.fixedParams.g : prev.g,
      }));
    }
    setIsSimulating(true);
    setPredictionResult(null);
  };

  // Repor valores pré-definidos (Critério de aceitação)
  const handleReset = () => {
    setIsSimulating(false);
    if (mode === 'desafio' && activeChallenge) {
      // Repõe os controlos mantendo rigorosamente os parâmetros fixados pelo desafio
      const challengeResetParams: ProjectileParams = {
        v0: activeChallenge.fixedParams.v0 !== undefined ? activeChallenge.fixedParams.v0 : DEFAULT_PARAMS.v0,
        angleDeg:
          activeChallenge.fixedParams.angleDeg !== undefined
            ? activeChallenge.fixedParams.angleDeg
            : DEFAULT_PARAMS.angleDeg,
        y0: activeChallenge.fixedParams.y0 !== undefined ? activeChallenge.fixedParams.y0 : DEFAULT_PARAMS.y0,
        g: activeChallenge.fixedParams.g !== undefined ? activeChallenge.fixedParams.g : DEFAULT_PARAMS.g,
      };
      setParams(challengeResetParams);
      setCurrentInstant(getKinematicInstant(challengeResetParams, 0));
    } else {
      setParams(DEFAULT_PARAMS);
      setCurrentInstant(getKinematicInstant(DEFAULT_PARAMS, 0));
    }
    setPredictionResult(null);
    setChallengeResult(null);
  };

  // Conclusão do Lançamento
  const handleLaunchComplete = (finalRange: number) => {
    // Modo Previsão: calcular erro percentual
    let calculatedErrorPercent: number | undefined = undefined;
    const predValue = parseFloat(predictedRangeInput.replace(',', '.'));
    if (mode === 'previsao' && !isNaN(predValue) && predValue > 0) {
      const errMeters = Math.abs(finalRange - predValue);
      const errPerc = (errMeters / Math.max(0.01, finalRange)) * 100;
      calculatedErrorPercent = errPerc;
      setPredictionResult({
        actual: finalRange,
        predicted: predValue,
        errorMeters: errMeters,
        errorPercent: errPerc,
      });
    }

    // Modo Desafio: verificar alvo e registar tentativa uma única vez
    let isHit: boolean | undefined = undefined;
    if (mode === 'desafio' && activeChallenge) {
      const effectiveV0 =
        activeChallenge.fixedParams.v0 !== undefined ? activeChallenge.fixedParams.v0 : params.v0;
      const effectiveAngle =
        activeChallenge.fixedParams.angleDeg !== undefined
          ? activeChallenge.fixedParams.angleDeg
          : params.angleDeg;
      const effectiveY0 =
        activeChallenge.fixedParams.y0 !== undefined ? activeChallenge.fixedParams.y0 : params.y0;

      const res = recordChallengeAttempt({
        challengeId: activeChallenge.id,
        simulatorId: activeChallenge.simulatorId,
        v0: effectiveV0,
        angleDeg: effectiveAngle,
        y0: effectiveY0,
        actualRange: finalRange,
        targetDistance: activeChallenge.targetDistance,
        tolerancePercent: activeChallenge.targetTolerance,
      });
      isHit = res.hit;
      setChallengeResult(res);
      setAttemptsMap(getChallengeAttempts());
      onRefreshAttempts?.();
    }

    // Guardar registo de lançamento
    const newRecord: LaunchRecord = {
      id: `launch-${Date.now()}`,
      timestamp: new Date().toISOString(),
      v0: mode === 'desafio' && activeChallenge?.fixedParams.v0 !== undefined ? activeChallenge.fixedParams.v0 : params.v0,
      angleDeg: mode === 'desafio' && activeChallenge?.fixedParams.angleDeg !== undefined ? activeChallenge.fixedParams.angleDeg : params.angleDeg,
      y0: mode === 'desafio' && activeChallenge?.fixedParams.y0 !== undefined ? activeChallenge.fixedParams.y0 : params.y0,
      g: params.g,
      range: finalRange,
      tFlight: currentResults.tFlight,
      maxHeight: currentResults.maxHeight,
      vImpact: currentResults.vImpact,
      mode,
      predictedRange: !isNaN(predValue) && mode === 'previsao' ? predValue : undefined,
      errorPercentage: calculatedErrorPercent,
      targetDistance: activeChallenge && mode === 'desafio' ? activeChallenge.targetDistance : undefined,
      targetTolerance: activeChallenge && mode === 'desafio' ? activeChallenge.targetTolerance : undefined,
      hitTarget: isHit,
    };

    saveLaunchRecord(newRecord);
    setRecords(getLaunchRecords());
  };

  const handleInstantUpdate = (instant: KinematicInstant) => {
    setCurrentInstant(instant);
  };

  const handleSaveComparison = () => {
    setComparisonParams({ ...params });
  };

  const handleClearComparison = () => {
    setComparisonParams(null);
  };

  const handleClearRecords = () => {
    if (window.confirm('Tem a certeza de que deseja limpar a tabela de registos?')) {
      localStorage.removeItem('esv_launch_records');
      setRecords([]);
    }
  };

  // Alvo para o Canvas
  const canvasTarget =
    mode === 'desafio' && activeChallenge
      ? {
          distance: activeChallenge.targetDistance,
          tolerancePercent: activeChallenge.targetTolerance,
        }
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho da Estação */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">
            Estação 1: Laboratório de Movimento
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lançamento de projéteis em campo gravítico uniforme (Modelo ideal sem resistência do ar)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Indicador de Desafio Selecionado */}
          {activeChallenge && mode === 'desafio' && (
            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300">
              <span>Desafio ativo: {activeChallenge.title}</span>
              <button
                onClick={() => {
                  setActiveChallenge(null);
                  setMode('livre');
                  setChallengeResult(null);
                }}
                className="text-slate-400 hover:text-white ml-2 text-sm"
                title="Sair do desafio"
              >
                ✕
              </button>
            </div>
          )}

          {onAskTutor && (
            <button
              type="button"
              onClick={() => {
                const v0Str = `${formatPtNumber(params.v0, 1)} m/s`;
                const angleStr = `${formatPtNumber(params.angleDeg, 0)}°`;
                const y0Str = `${formatPtNumber(params.y0, 1)} m`;
                const gStr = `${formatPtNumber(params.g, 1)} m/s²`;
                const launchKind = params.angleDeg === 0 ? 'Lançamento horizontal' : 'Lançamento oblíquo';
                const details: TutorLaunchContext['details'] = [
                  { label: 'Tipo', value: launchKind },
                  { label: 'v₀', value: v0Str },
                  { label: 'Ângulo θ', value: angleStr },
                  { label: 'y₀', value: y0Str },
                  { label: 'g', value: gStr },
                ];
                if (activeChallenge && mode === 'desafio') {
                  details.push({
                    label: 'Desafio',
                    value: `${activeChallenge.title} (alvo a ${formatPtNumber(activeChallenge.targetDistance, 1)} m)`,
                  });
                }
                const summaryParts = [
                  launchKind,
                  `v0 = ${v0Str}`,
                  `ângulo = ${params.angleDeg} graus`,
                  `y0 = ${y0Str}`,
                  `g = ${gStr}`,
                  activeChallenge && mode === 'desafio'
                    ? `Desafio ativo: "${activeChallenge.title}" com alvo a ${formatPtNumber(activeChallenge.targetDistance, 1)} m`
                    : `Modo: ${mode}`,
                ];
                onAskTutor({
                  stationId: 'lancamento-projeteis',
                  stationName: 'Estação 1: Laboratório de Movimento',
                  summaryText: summaryParts.join(', '),
                  details,
                  autoSendKey: `est1-${Date.now()}`,
                });
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-teal-600/20 hover:bg-teal-600/35 text-teal-300 border border-teal-500/40 text-xs font-semibold transition shadow"
            >
              <SocraticTutorAvatar size="xs" />
              <span>Perguntar ao {TUTOR_DISPLAY_NAME}</span>
            </button>
          )}
        </div>
      </div>

      {/* Secção Central: Canvas Interativo + Painel de Controlos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas da Trajetória (Coluna Esquerda/Topo) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-5">
          <ProjectileCanvas
            params={params}
            comparisonParams={comparisonParams}
            showStroboscopic={showStroboscopic}
            showVectors={showVectors}
            target={canvasTarget}
            onInstantUpdate={handleInstantUpdate}
            onLaunchComplete={handleLaunchComplete}
            isSimulating={isSimulating}
            setIsSimulating={setIsSimulating}
            onReset={handleReset}
            onLaunch={handleLaunch}
          />

          {/* Gráficos Cinemáticos em Tempo Real */}
          <KinematicGraphs params={params} currentTime={currentInstant.t} />
        </div>

        {/* Painel Lateral de Controlos Físicos e Modos */}
        <div className="lg:col-span-5 xl:col-span-4">
          <ProjectileControls
            params={params}
            setParams={setParams}
            comparisonParams={comparisonParams}
            onSaveComparison={handleSaveComparison}
            onClearComparison={handleClearComparison}
            showStroboscopic={showStroboscopic}
            setShowStroboscopic={setShowStroboscopic}
            showVectors={showVectors}
            setShowVectors={setShowVectors}
            mode={mode}
            setMode={handleModeChange}
            predictedRange={predictedRangeInput}
            setPredictedRange={setPredictedRangeInput}
            predictionResult={predictionResult}
            activeChallenge={activeChallenge}
            onSelectChallenge={setActiveChallenge}
            challengeResult={challengeResult}
            challengeTotalAttempts={activeChallenge ? attemptsMap[activeChallenge.id]?.attemptsCount || 0 : 0}
            challengeSucceeded={!!(activeChallenge && attemptsMap[activeChallenge.id]?.succeeded)}
            isSimulating={isSimulating}
            onLaunch={handleLaunch}
          />
        </div>
      </div>

      {/* Painel Didático: Equações Usadas */}
      <PhysicsEquationsPanel params={params} />

      {/* Tabela de Registos e Telemetria com Exportação CSV */}
      <LaunchRecordsTable
        records={records}
        onClearRecords={handleClearRecords}
        currentInstant={currentInstant}
        currentResults={currentResults}
      />
    </div>
  );
};
