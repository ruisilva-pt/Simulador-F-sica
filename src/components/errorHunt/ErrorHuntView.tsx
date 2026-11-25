import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Flag,
  RotateCcw,
  SearchCheck,
  History,
} from 'lucide-react';
import {
  ERROR_HUNT_RESOLUTIONS,
  ERROR_HUNT_TEXTS,
  ERROR_HUNT_TYPES,
  ErrorHuntResolution,
  ErrorType,
} from '../../config/errorHuntData';
import {
  ErrorHuntSummaryRecord,
  getSavedErrorHuntSummary,
  saveErrorHuntSummary,
} from '../../utils/errorHuntStorage';
import { getStudentNick } from '../../utils/storage';
import { TUTOR_DISPLAY_NAME, TutorLaunchContext } from '../../config/tutorSocratic';
import { SocraticTutorAvatar } from '../tutor/SocraticTutorAvatar';

interface ErrorHuntViewProps {
  onAskTutor?: (context: TutorLaunchContext) => void;
}

type OutcomeKind = 'first_try' | 'with_hint' | 'revealed';

interface QuestionOutcome {
  resolutionId: number;
  errorType: ErrorType;
  outcome: OutcomeKind;
  hadWrongAttempt: boolean;
}

function shuffleResolutionOrder(items: ErrorHuntResolution[]): ErrorHuntResolution[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const ErrorHuntView: React.FC<ErrorHuntViewProps> = ({ onAskTutor }) => {
  const [deck, setDeck] = useState<ErrorHuntResolution[]>(() =>
    shuffleResolutionOrder(ERROR_HUNT_RESOLUTIONS)
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedStep, setSelectedStep] = useState<1 | 2 | 3 | null>(null);
  const [selectedType, setSelectedType] = useState<ErrorType | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [status, setStatus] = useState<'answering' | 'found' | 'revealed'>('answering');
  const [outcomes, setOutcomes] = useState<QuestionOutcome[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [activeSummary, setActiveSummary] = useState<ErrorHuntSummaryRecord | null>(null);
  const [savedPreviousSummary, setSavedPreviousSummary] = useState<ErrorHuntSummaryRecord | null>(() =>
    getSavedErrorHuntSummary()
  );

  const currentResolution = deck[currentIndex];
  const anonymousCode = useMemo(() => getStudentNick().trim() || 'Aluno Sem Código', []);
  const totalCount = deck.length;
  const isFinalQuestion = currentIndex === totalCount - 1;
  const currentResolved = status === 'found' || status === 'revealed';

  const handleVerify = () => {
    if (!currentResolution || selectedStep === null || selectedType === null || currentResolved) {
      return;
    }

    const isExactMatch =
      selectedStep === currentResolution.wrongStep && selectedType === currentResolution.errorType;

    if (isExactMatch) {
      const outcome: OutcomeKind = failedAttempts === 0 ? 'first_try' : 'with_hint';
      setStatus('found');
      setOutcomes((prev) => [
        ...prev.filter((o) => o.resolutionId !== currentResolution.id),
        {
          resolutionId: currentResolution.id,
          errorType: currentResolution.errorType,
          outcome,
          hadWrongAttempt: failedAttempts > 0,
        },
      ]);
      return;
    }

    const nextFailures = failedAttempts + 1;
    setFailedAttempts(nextFailures);

    if (nextFailures >= 3) {
      setStatus('revealed');
      setOutcomes((prev) => [
        ...prev.filter((o) => o.resolutionId !== currentResolution.id),
        {
          resolutionId: currentResolution.id,
          errorType: currentResolution.errorType,
          outcome: 'revealed',
          hadWrongAttempt: true,
        },
      ]);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalCount) {
      handleFinish();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedStep(null);
    setSelectedType(null);
    setFailedAttempts(0);
    setStatus('answering');
  };

  const handleFinish = () => {
    const foundFirstTry = outcomes.filter((o) => o.outcome === 'first_try').length;
    const foundWithHint = outcomes.filter((o) => o.outcome === 'with_hint').length;
    const revealedCount = outcomes.filter((o) => o.outcome === 'revealed').length;

    const reviewMap: Partial<Record<ErrorType, number>> = {};
    outcomes.forEach((o) => {
      if (o.hadWrongAttempt || o.outcome === 'revealed') {
        reviewMap[o.errorType] = (reviewMap[o.errorType] || 0) + 1;
      }
    });

    const errorTypesToReview = Object.entries(reviewMap)
      .map(([type, count]) => ({ type: type as ErrorType, count: count as number }))
      .sort((a, b) => b.count - a.count);

    const saved = saveErrorHuntSummary({
      totalReviewed: outcomes.length,
      foundFirstTry,
      foundWithHint,
      revealedCount,
      errorTypesToReview,
    });

    setActiveSummary(saved);
    setSavedPreviousSummary(saved);
    setIsFinished(true);
  };

  const handleRestart = () => {
    setDeck(shuffleResolutionOrder(ERROR_HUNT_RESOLUTIONS));
    setCurrentIndex(0);
    setSelectedStep(null);
    setSelectedType(null);
    setFailedAttempts(0);
    setStatus('answering');
    setOutcomes([]);
    setIsFinished(false);
    setActiveSummary(null);
  };

  const handleShowSavedSummary = () => {
    if (!savedPreviousSummary) return;
    setActiveSummary(savedPreviousSummary);
    setIsFinished(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 overflow-x-hidden">
      {/* Cabeçalho da Estação 4 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <SearchCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug">
                {ERROR_HUNT_TEXTS.stationTitle}
              </h2>
              <p className="text-base text-slate-300 mt-0.5 leading-relaxed">
                {ERROR_HUNT_TEXTS.stationSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isFinished && (
              <span className="text-base font-mono font-bold text-teal-300 bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg min-h-[44px] inline-flex items-center">
                {currentIndex + 1} de {totalCount}
              </span>
            )}
            {onAskTutor && currentResolution && !isFinished && (
              <button
                type="button"
                onClick={() => {
                  const details: TutorLaunchContext['details'] = [
                    {
                      label: 'Resolução',
                      value: `${currentIndex + 1} de ${totalCount} (n.º ${currentResolution.id})`,
                    },
                  ];
                  if (selectedStep !== null) {
                    details.push({ label: 'Passo escolhido', value: `Passo ${selectedStep}` });
                  }
                  if (selectedType !== null) {
                    details.push({ label: 'Tipo escolhido', value: selectedType });
                  }
                  if (currentResolved) {
                    details.push({
                      label: 'Estado',
                      value: status === 'found' ? 'Erro encontrado' : 'Erro revelado',
                    });
                  } else if (failedAttempts > 0) {
                    details.push({ label: 'Tentativas', value: `${failedAttempts} de 3` });
                  }

                  const stepsList = `(1) ${currentResolution.steps[0]}; (2) ${currentResolution.steps[1]}; (3) ${currentResolution.steps[2]}`;
                  const summaryText = currentResolved
                    ? `Enunciado: "${currentResolution.statement}". Passos: ${stepsList}. Erro já identificado: Passo ${currentResolution.wrongStep} (${currentResolution.errorType}). Correção: ${currentResolution.correctStepText} Explicação: ${currentResolution.explanation} Ajuda o aluno a consolidar o conceito físico subjacente.`
                    : `Enunciado: "${currentResolution.statement}". Passos apresentados: ${stepsList}.${
                        selectedStep ? ` O aluno selecionou até agora o Passo ${selectedStep}` : ''
                      }${
                        selectedType ? ` (tipo "${selectedType}")` : ''
                      }. IMPORTANTE: não reveles diretamente qual é o passo errado nem o tipo de erro; guia o aluno passo a passo com perguntas socráticas.`;

                  onAskTutor({
                    stationId: 'caca-ao-erro',
                    stationName: 'Estação 4: Caça ao Erro',
                    summaryText,
                    details,
                    autoSendKey: `est4-${currentResolution.id}-${Date.now()}`,
                  });
                }}
                className="min-h-[44px] px-3.5 py-2 bg-teal-600/20 hover:bg-teal-600/35 text-teal-200 border border-teal-500/40 rounded-lg text-base font-semibold inline-flex items-center gap-2 transition shadow"
              >
                <SocraticTutorAvatar size="xs" />
                <span>Perguntar ao {TUTOR_DISPLAY_NAME}</span>
              </button>
            )}
            {savedPreviousSummary && !isFinished && (
              <button
                type="button"
                onClick={handleShowSavedSummary}
                className="min-h-[44px] px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-base font-medium inline-flex items-center gap-2 transition"
              >
                <History className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Último resumo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ecrã de Resumo Sem Nota */}
      {isFinished && activeSummary ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xl space-y-5">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <h3 className="text-lg sm:text-xl font-bold text-slate-100">
              Resumo da Sessão — Caça ao Erro
            </h3>
            <p className="text-base text-slate-400">
              Código anónimo associado:{' '}
              <span className="font-mono text-teal-300 font-semibold">
                {activeSummary.anonymousCode}
              </span>
              {' · '}
              {activeSummary.totalReviewed} de {totalCount} resoluções analisadas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-1">
              <div className="text-base text-slate-300">Encontrados à primeira</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
                {activeSummary.foundFirstTry}
              </div>
            </div>

            <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-1">
              <div className="text-base text-slate-300">Precisaram de dica</div>
              <div className="text-2xl font-mono font-bold text-amber-300 tabular-nums">
                {activeSummary.foundWithHint}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-1">
              <div className="text-base text-slate-300">Revelados ao fim de 3 tentativas</div>
              <div className="text-2xl font-mono font-bold text-slate-200 tabular-nums">
                {activeSummary.revealedCount}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-base font-bold text-slate-100">Tipos de erro a rever</h4>
            {activeSummary.errorTypesToReview.length === 0 ? (
              <p className="text-base text-emerald-300">
                Nenhum tipo de erro a rever nesta sessão — acertaste todas à primeira!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeSummary.errorTypesToReview.map((item) => (
                  <span
                    key={item.type}
                    className="text-base font-medium bg-slate-900 border border-amber-500/40 text-amber-200 px-3 py-1.5 rounded-lg"
                  >
                    {item.type} ({item.count})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="min-h-[48px] px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-base font-bold inline-flex items-center justify-center gap-2 transition shadow"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>{ERROR_HUNT_TEXTS.restartButton} (ordem aleatória)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Ecrã Principal da Resolução Ativa */
        currentResolution && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xl space-y-6">
            {/* Enunciado em cima */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5">
              <div className="text-base font-semibold text-teal-400">
                Enunciado (g = 9,8 m/s²)
              </div>
              <p className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed">
                {currentResolution.statement}
              </p>
            </div>

            {/* 3 Passos Numerados (seleção do passo errado) */}
            <div className="space-y-3">
              <div className="text-base font-semibold text-slate-200">
                {ERROR_HUNT_TEXTS.stepPrompt}
              </div>

              <div className="space-y-2.5">
                {currentResolution.steps.map((stepText, idx) => {
                  const stepNumber = (idx + 1) as 1 | 2 | 3;
                  const isSelected = selectedStep === stepNumber;
                  const isConfirmedWrongStep =
                    currentResolved && currentResolution.wrongStep === stepNumber;

                  let buttonClasses =
                    'bg-slate-950 border-slate-800 text-slate-100 hover:border-teal-500/60';
                  if (isConfirmedWrongStep) {
                    buttonClasses =
                      status === 'found'
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-100'
                        : 'bg-rose-950/50 border-rose-500 text-rose-100';
                  } else if (isSelected) {
                    buttonClasses = 'bg-teal-950/60 border-teal-400 text-white ring-1 ring-teal-400/50';
                  }

                  return (
                    <button
                      key={stepNumber}
                      type="button"
                      disabled={currentResolved}
                      onClick={() => setSelectedStep(stepNumber)}
                      className={`w-full min-h-[48px] text-left p-3.5 rounded-xl border transition flex items-start gap-3 disabled:cursor-default ${buttonClasses}`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg font-mono font-bold text-base flex items-center justify-center shrink-0 border ${
                          isConfirmedWrongStep
                            ? status === 'found'
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-rose-500/20 border-rose-400 text-rose-300'
                            : isSelected
                            ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        {stepNumber}
                      </span>
                      <span className="text-base leading-relaxed break-words min-w-0">
                        {stepText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seleção do Tipo de Erro */}
            <div className="space-y-3">
              <div className="text-base font-semibold text-slate-200">
                {ERROR_HUNT_TEXTS.typePrompt}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ERROR_HUNT_TYPES.map((errType) => {
                  const isSelected = selectedType === errType;
                  const isRevealedType =
                    (currentResolved || failedAttempts >= 2) &&
                    currentResolution.errorType === errType;

                  let typeClasses =
                    'bg-slate-950 border-slate-800 text-slate-200 hover:border-teal-500/60';
                  if (isSelected) {
                    typeClasses =
                      'bg-teal-600/25 border-teal-400 text-white ring-1 ring-teal-400/40';
                  } else if (isRevealedType && currentResolved) {
                    typeClasses = 'bg-amber-950/40 border-amber-500/60 text-amber-200';
                  }

                  return (
                    <button
                      key={errType}
                      type="button"
                      disabled={currentResolved}
                      onClick={() => setSelectedType(errType)}
                      className={`min-h-[46px] px-3 py-2.5 rounded-xl border text-base font-semibold text-center transition disabled:cursor-default ${typeClasses}`}
                    >
                      {errType}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dicas progressivas (só mostradas após tentativa falhada e antes da revelação) */}
            {!currentResolved && failedAttempts >= 1 && (
              <div className="space-y-2.5">
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-base font-bold text-amber-300">
                    <Lightbulb className="w-5 h-5 shrink-0" />
                    <span>
                      Tentativa {failedAttempts} de 3 sem sucesso · {ERROR_HUNT_TEXTS.level1HintPrefix}
                    </span>
                  </div>
                  <p className="text-base text-amber-100 leading-relaxed">
                    {currentResolution.zoneHint}
                  </p>
                </div>

                {failedAttempts >= 2 && (
                  <div className="bg-amber-950/60 border border-amber-400/50 rounded-xl p-4 space-y-1.5">
                    <div className="text-base font-bold text-amber-200">
                      {ERROR_HUNT_TEXTS.level2HintPrefix}{' '}
                      <span className="underline">{currentResolution.errorType}</span>
                    </div>
                    <p className="text-base text-amber-100 leading-relaxed">
                      Tens mais uma tentativa para indicar o passo errado e confirmar o tipo de erro.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Resultado final da resolução (apenas quando acerta ou na 3.ª tentativa falhada) */}
            {currentResolved && (
              <div
                className={`rounded-xl p-4 border space-y-2.5 ${
                  status === 'found'
                    ? 'bg-emerald-950/40 border-emerald-500/50'
                    : 'bg-rose-950/40 border-rose-500/50'
                }`}
              >
                <div className="flex items-center gap-2 text-base sm:text-lg font-bold">
                  {status === 'found' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">
                        {ERROR_HUNT_TEXTS.foundSuccessTitle}
                        {failedAttempts === 0 ? ' à primeira!' : '!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span className="text-rose-300">{ERROR_HUNT_TEXTS.revealedTitle}</span>
                    </>
                  )}
                </div>

                <div className="text-base text-slate-100 leading-relaxed">
                  <span className="font-bold text-slate-200">
                    Passo errado: Passo {currentResolution.wrongStep} ({currentResolution.errorType})
                  </span>
                </div>

                <div className="text-base text-slate-100 bg-slate-950/80 border border-slate-800 rounded-lg p-3 leading-relaxed">
                  <span className="font-bold text-teal-300">Certo: </span>
                  <span>{currentResolution.correctStepText}</span>
                </div>

                <div className="text-base text-slate-200 leading-relaxed">
                  <span className="font-bold text-amber-300">Explicação: </span>
                  <span>{currentResolution.explanation}</span>
                </div>
              </div>
            )}

            {/* Barra de Ações (botões >= 44px de altura) */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {!currentResolved ? (
                <button
                  type="button"
                  disabled={selectedStep === null || selectedType === null}
                  onClick={handleVerify}
                  className="min-h-[48px] px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-base font-bold transition shadow disabled:opacity-45 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {ERROR_HUNT_TEXTS.verifyButton}
                </button>
              ) : (
                !isFinalQuestion && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="min-h-[48px] px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-base font-bold inline-flex items-center justify-center gap-2 transition shadow w-full sm:w-auto"
                  >
                    <span>{ERROR_HUNT_TEXTS.nextButton}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                )
              )}

              <button
                type="button"
                onClick={handleFinish}
                className={`min-h-[48px] px-5 py-2.5 rounded-xl text-base font-bold inline-flex items-center justify-center gap-2 transition w-full sm:w-auto ${
                  currentResolved && isFinalQuestion
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Flag className="w-4 h-4 shrink-0" />
                <span>{ERROR_HUNT_TEXTS.finishButton}</span>
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
