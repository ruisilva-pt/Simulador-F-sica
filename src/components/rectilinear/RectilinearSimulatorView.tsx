import React, { useEffect, useState } from 'react';
import { RectilinearCanvas } from './RectilinearCanvas';
import { RectilinearControls } from './RectilinearControls';
import { RectilinearGraphs } from './RectilinearGraphs';
import { RectilinearEquationsPanel } from './RectilinearEquationsPanel';
import { RectilinearRecordsTable } from './RectilinearRecordsTable';
import { ExperimentalSetupView } from './ExperimentalSetupView';
import { Activity, Camera } from 'lucide-react';
import {
  calculateRectilinearResults,
  getRectilinearInstant,
} from '../../physics/rectilinear';
import { formatPtNumber } from '../../physics/projectile';
import { RectilinearInstant, RectilinearParams } from '../../types/rectilinear';
import { LaunchRecord } from '../../types/physics';
import { Challenge } from '../../types/challenges';
import { TutorLaunchContext, TUTOR_DISPLAY_NAME } from '../../config/tutorSocratic';
import { SocraticTutorAvatar } from '../tutor/SocraticTutorAvatar';
import {
  clearLaunchRecords,
  getChallengeAttempts,
  getLaunchRecords,
  recordChallengeAttempt,
  saveLaunchRecord,
} from '../../utils/storage';

interface RectilinearSimulatorViewProps {
  challenges: Challenge[];
  activeChallenge: Challenge | null;
  setActiveChallenge: (ch: Challenge | null) => void;
  onRefreshAttempts?: () => void;
  isTeacherModeActive?: boolean;
  onAskTutor?: (context: TutorLaunchContext) => void;
}

const DEFAULT_RECTILINEAR_PARAMS: RectilinearParams = {
  x0: 0,
  v0: 10,
  a: 2,
  tMax: 6,
};

export const RectilinearSimulatorView: React.FC<RectilinearSimulatorViewProps> = ({
  challenges,
  activeChallenge,
  setActiveChallenge,
  onRefreshAttempts,
  isTeacherModeActive = false,
  onAskTutor,
}) => {
  const [stationTab, setStationTab] = useState<'simulador' | 'montagem'>('simulador');
  const simChallenges = challenges.filter(
    (c) => c.simulatorId === 'movimento-retilineo' && c.active
  );

  const [params, setParams] = useState<RectilinearParams>(DEFAULT_RECTILINEAR_PARAMS);
  const [comparisonParams, setComparisonParams] = useState<RectilinearParams | null>(null);

  const isChallengeForThisSim = activeChallenge?.simulatorId === 'movimento-retilineo';
  const [mode, setMode] = useState<'livre' | 'previsao' | 'desafio'>(
    isChallengeForThisSim ? 'desafio' : 'livre'
  );
  const [showStroboscopic, setShowStroboscopic] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentInstant, setCurrentInstant] = useState<RectilinearInstant>(
    getRectilinearInstant(DEFAULT_RECTILINEAR_PARAMS, 0)
  );

  const [predictedFinalXInput, setPredictedFinalXInput] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<{
    actual: number;
    predicted: number;
    errorMeters: number;
    errorPercent: number;
  } | null>(null);

  const [challengeResult, setChallengeResult] = useState<{
    hit: boolean;
    errorMeters: number;
    attemptNumber: number;
  } | null>(null);

  const [attemptsMap, setAttemptsMap] = useState<Record<string, any>>(getChallengeAttempts());
  const [records, setRecords] = useState<LaunchRecord[]>(getLaunchRecords());

  // Sincronizar desafio selecionado e bloquear parâmetros fixos
  useEffect(() => {
    if (activeChallenge && activeChallenge.simulatorId === 'movimento-retilineo') {
      setStationTab('simulador');
      setMode('desafio');
      const nextParams: RectilinearParams = {
        x0: activeChallenge.fixedParams.x0 !== undefined ? activeChallenge.fixedParams.x0 : 0,
        v0: activeChallenge.fixedParams.v0 !== undefined ? activeChallenge.fixedParams.v0 : 10,
        a: activeChallenge.fixedParams.a !== undefined ? activeChallenge.fixedParams.a : 0,
        tMax: activeChallenge.fixedParams.tMax !== undefined ? activeChallenge.fixedParams.tMax : 6,
      };
      setParams(nextParams);
      setCurrentInstant(getRectilinearInstant(nextParams, 0));
      setChallengeResult(null);
      setAttemptsMap(getChallengeAttempts());
    }
  }, [activeChallenge]);

  const handleModeChange = (newMode: 'livre' | 'previsao' | 'desafio') => {
    setMode(newMode);
    setPredictionResult(null);
    if (newMode === 'desafio') {
      const challengeToUse =
        (activeChallenge?.simulatorId === 'movimento-retilineo' ? activeChallenge : null) ||
        simChallenges[0] ||
        null;
      if (challengeToUse) {
        setActiveChallenge(challengeToUse);
        const nextParams: RectilinearParams = {
          x0: challengeToUse.fixedParams.x0 !== undefined ? challengeToUse.fixedParams.x0 : 0,
          v0: challengeToUse.fixedParams.v0 !== undefined ? challengeToUse.fixedParams.v0 : 10,
          a: challengeToUse.fixedParams.a !== undefined ? challengeToUse.fixedParams.a : 0,
          tMax: challengeToUse.fixedParams.tMax !== undefined ? challengeToUse.fixedParams.tMax : 6,
        };
        setParams(nextParams);
        setCurrentInstant(getRectilinearInstant(nextParams, 0));
      }
    } else {
      if (activeChallenge?.simulatorId === 'movimento-retilineo') {
        setActiveChallenge(null);
      }
      setChallengeResult(null);
    }
  };

  const currentResults = calculateRectilinearResults(params);

  const handleLaunch = () => {
    if (mode === 'desafio' && activeChallenge && activeChallenge.simulatorId === 'movimento-retilineo') {
      setParams((prev) => ({
        x0: activeChallenge.fixedParams.x0 !== undefined ? activeChallenge.fixedParams.x0 : prev.x0,
        v0: activeChallenge.fixedParams.v0 !== undefined ? activeChallenge.fixedParams.v0 : prev.v0,
        a: activeChallenge.fixedParams.a !== undefined ? activeChallenge.fixedParams.a : prev.a,
        tMax: activeChallenge.fixedParams.tMax !== undefined ? activeChallenge.fixedParams.tMax : prev.tMax,
      }));
    }
    setIsSimulating(true);
    setPredictionResult(null);
  };

  const handleReset = () => {
    setIsSimulating(false);
    if (mode === 'desafio' && activeChallenge && activeChallenge.simulatorId === 'movimento-retilineo') {
      const resetChallengeParams: RectilinearParams = {
        x0: activeChallenge.fixedParams.x0 !== undefined ? activeChallenge.fixedParams.x0 : DEFAULT_RECTILINEAR_PARAMS.x0,
        v0: activeChallenge.fixedParams.v0 !== undefined ? activeChallenge.fixedParams.v0 : DEFAULT_RECTILINEAR_PARAMS.v0,
        a: activeChallenge.fixedParams.a !== undefined ? activeChallenge.fixedParams.a : DEFAULT_RECTILINEAR_PARAMS.a,
        tMax: activeChallenge.fixedParams.tMax !== undefined ? activeChallenge.fixedParams.tMax : DEFAULT_RECTILINEAR_PARAMS.tMax,
      };
      setParams(resetChallengeParams);
      setCurrentInstant(getRectilinearInstant(resetChallengeParams, 0));
    } else {
      setParams(DEFAULT_RECTILINEAR_PARAMS);
      setCurrentInstant(getRectilinearInstant(DEFAULT_RECTILINEAR_PARAMS, 0));
    }
    setPredictionResult(null);
    setChallengeResult(null);
  };

  const handleLaunchComplete = (finalX: number) => {
    let calculatedErrorPercent: number | undefined = undefined;
    const predValue = parseFloat(predictedFinalXInput.replace(',', '.'));
    if (mode === 'previsao' && !isNaN(predValue)) {
      const errMeters = Math.abs(finalX - predValue);
      const denom = Math.abs(finalX) > 0.01 ? Math.abs(finalX) : 1;
      const errPerc = (errMeters / denom) * 100;
      calculatedErrorPercent = errPerc;
      setPredictionResult({
        actual: finalX,
        predicted: predValue,
        errorMeters: errMeters,
        errorPercent: errPerc,
      });
    }

    let isHit: boolean | undefined = undefined;
    if (mode === 'desafio' && activeChallenge && activeChallenge.simulatorId === 'movimento-retilineo') {
      const effX0 = activeChallenge.fixedParams.x0 !== undefined ? activeChallenge.fixedParams.x0 : params.x0;
      const effV0 = activeChallenge.fixedParams.v0 !== undefined ? activeChallenge.fixedParams.v0 : params.v0;

      const res = recordChallengeAttempt({
        challengeId: activeChallenge.id,
        simulatorId: activeChallenge.simulatorId,
        v0: effV0,
        angleDeg: 0,
        y0: effX0,
        actualRange: finalX,
        targetDistance: activeChallenge.targetDistance,
        tolerancePercent: activeChallenge.targetTolerance,
      });
      isHit = res.hit;
      setChallengeResult(res);
      setAttemptsMap(getChallengeAttempts());
      onRefreshAttempts?.();
    }

    const newRecord: LaunchRecord = {
      id: `rect-${Date.now()}`,
      simulatorId: 'movimento-retilineo',
      timestamp: new Date().toISOString(),
      v0: params.v0,
      angleDeg: 0,
      y0: 0,
      g: 0,
      range: finalX,
      tFlight: params.tMax,
      maxHeight: currentResults.distanceTraveled,
      vImpact: currentResults.finalV,
      x0: params.x0,
      a: params.a,
      tMax: params.tMax,
      finalX,
      displacement: currentResults.displacement,
      distanceTraveled: currentResults.distanceTraveled,
      finalV: currentResults.finalV,
      avgVelocity: currentResults.avgVelocity,
      mode,
      predictedRange: !isNaN(predValue) && mode === 'previsao' ? predValue : undefined,
      errorPercentage: calculatedErrorPercent,
      targetDistance:
        activeChallenge && mode === 'desafio' ? activeChallenge.targetDistance : undefined,
      targetTolerance:
        activeChallenge && mode === 'desafio' ? activeChallenge.targetTolerance : undefined,
      hitTarget: isHit,
    };

    saveLaunchRecord(newRecord);
    setRecords(getLaunchRecords());
  };

  const handleClearRecords = () => {
    if (window.confirm('Tem a certeza de que deseja limpar a tabela global de registos?')) {
      clearLaunchRecords();
      setRecords([]);
    }
  };

  const canvasTarget =
    mode === 'desafio' && activeChallenge && activeChallenge.simulatorId === 'movimento-retilineo'
      ? {
          distance: activeChallenge.targetDistance,
          tolerancePercent: activeChallenge.targetTolerance,
        }
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho da Estação 2 com Separadores */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-100">
                Estação 2: Movimento Retilíneo (MRU e MRUA)
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Cinemática 1D
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Estudo comparativo de movimento uniforme e uniformemente variado, montagem experimental e interpretação gráfica
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor rápido de desafio no cabeçalho em Modo Desafio */}
            {stationTab === 'simulador' && mode === 'desafio' && simChallenges.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeChallenge?.simulatorId === 'movimento-retilineo' ? activeChallenge.id : ''}
                  onChange={(e) => {
                    const chosen = simChallenges.find((c) => c.id === e.target.value) || null;
                    setActiveChallenge(chosen);
                  }}
                  className="bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300 focus:outline-none"
                >
                  {simChallenges.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleModeChange('livre')}
                  className="text-slate-400 hover:text-white px-2 py-1 text-xs bg-slate-800 rounded"
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
                  const isMru = Math.abs(params.a) < 1e-6;
                  const motionType = isMru
                    ? 'MRU (Movimento Retilíneo Uniforme)'
                    : 'MRUA (Movimento Retilíneo Uniformemente Variado)';
                  const x0Str = `${formatPtNumber(params.x0, 1)} m`;
                  const v0Str = `${formatPtNumber(params.v0, 1)} m/s`;
                  const aStr = `${formatPtNumber(params.a, 1)} m/s²`;
                  const tMaxStr = `${formatPtNumber(params.tMax, 1)} s`;
                  const details: TutorLaunchContext['details'] = [
                    { label: 'Regime', value: isMru ? 'MRU' : 'MRUA' },
                    { label: 'x₀', value: x0Str },
                    { label: 'v₀', value: v0Str },
                    { label: 'a', value: aStr },
                    { label: 'Δt', value: tMaxStr },
                  ];
                  if (stationTab === 'montagem') {
                    details.push({ label: 'Separador', value: 'Montagem experimental' });
                  }
                  if (activeChallenge && activeChallenge.simulatorId === 'movimento-retilineo' && mode === 'desafio') {
                    details.push({
                      label: 'Desafio',
                      value: `${activeChallenge.title} (alvo x = ${formatPtNumber(activeChallenge.targetDistance, 1)} m)`,
                    });
                  }
                  const summaryParts = [
                    motionType,
                    `x0 = ${x0Str}`,
                    `v0 = ${v0Str}`,
                    `a = ${aStr}`,
                    `duração = ${tMaxStr}`,
                    stationTab === 'montagem'
                      ? 'Separador: Montagem experimental'
                      : activeChallenge && activeChallenge.simulatorId === 'movimento-retilineo' && mode === 'desafio'
                      ? `Desafio ativo: "${activeChallenge.title}" com alvo em x = ${formatPtNumber(activeChallenge.targetDistance, 1)} m`
                      : `Modo: ${mode}`,
                  ];
                  onAskTutor({
                    stationId: 'movimento-retilineo',
                    stationName: 'Estação 2: Movimento Retilíneo (MRU e MRUA)',
                    summaryText: summaryParts.join(', '),
                    details,
                    autoSendKey: `est2-${Date.now()}`,
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

        {/* Separadores da Estação 2 */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setStationTab('simulador')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              stationTab === 'simulador'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Simulador (MRU e MRUA)</span>
          </button>

          <button
            type="button"
            onClick={() => setStationTab('montagem')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              stationTab === 'montagem'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Montagem experimental</span>
          </button>
        </div>
      </div>

      {stationTab === 'montagem' ? (
        <ExperimentalSetupView isTeacherModeActive={isTeacherModeActive} />
      ) : (
        <>
      {/* Área Principal: Canvas + Gráficos e Controlos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-5">
          <RectilinearCanvas
            params={params}
            comparisonParams={comparisonParams}
            showStroboscopic={showStroboscopic}
            showVectors={showVectors}
            target={canvasTarget}
            onInstantUpdate={(inst) => setCurrentInstant(inst)}
            onLaunchComplete={handleLaunchComplete}
            isSimulating={isSimulating}
            setIsSimulating={setIsSimulating}
            onReset={handleReset}
            onLaunch={handleLaunch}
          />

          <RectilinearGraphs
            params={params}
            comparisonParams={comparisonParams}
            currentTime={currentInstant.t}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <RectilinearControls
            params={params}
            setParams={setParams}
            comparisonParams={comparisonParams}
            onSaveComparison={() => setComparisonParams({ ...params })}
            onClearComparison={() => setComparisonParams(null)}
            showStroboscopic={showStroboscopic}
            setShowStroboscopic={setShowStroboscopic}
            showVectors={showVectors}
            setShowVectors={setShowVectors}
            mode={mode}
            setMode={handleModeChange}
            predictedFinalX={predictedFinalXInput}
            setPredictedFinalX={setPredictedFinalXInput}
            predictionResult={predictionResult}
            activeChallenge={isChallengeForThisSim ? activeChallenge : null}
            challengeResult={challengeResult}
            challengeTotalAttempts={
              isChallengeForThisSim && activeChallenge
                ? attemptsMap[activeChallenge.id]?.attemptsCount || 0
                : 0
            }
            challengeSucceeded={
              !!(isChallengeForThisSim && activeChallenge && attemptsMap[activeChallenge.id]?.succeeded)
            }
            isSimulating={isSimulating}
          />
        </div>
      </div>

      {/* Equações Usadas */}
      <RectilinearEquationsPanel params={params} />

      {/* Tabela de Registos Partilhada */}
      <RectilinearRecordsTable
        records={records}
        onClearRecords={handleClearRecords}
        currentInstant={currentInstant}
        currentResults={currentResults}
      />
        </>
      )}
    </div>
  );
};
