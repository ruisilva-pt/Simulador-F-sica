import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Send,
  RotateCcw,
  Volume2,
  Square,
  Sparkles,
  AlertTriangle,
  Compass,
  HelpCircle,
  Loader2,
  RefreshCw,
  Mic,
  MicOff,
  PhoneOff,
} from 'lucide-react';
import {
  TUTOR_DISPLAY_NAME,
  TUTOR_HELP_LEVELS,
  TUTOR_INITIAL_GREETING,
  TUTOR_OVERLOAD_ERROR_MESSAGE,
  TUTOR_SUGGESTIONS,
  TUTOR_THINKING_LABEL,
  TutorLaunchContext,
  TutorOriginStationId,
} from '../../config/tutorSocratic';
import { SocraticTutorAvatar } from './SocraticTutorAvatar';
import { getGradeLevelInfo, SETUP_TTS_VOICES } from '../../config/experimentalSetup';
import { getSavedGradeYear, getSavedTtsVoice, saveTtsVoice } from '../../utils/setupStorage';
import { useSetupNarration } from '../../hooks/useSetupNarration';
import { useTutorLiveVoice } from '../../hooks/useTutorLiveVoice';
import {
  recordTutorConversationStart,
  recordTutorMessageTopic,
} from '../../utils/tutorAnalytics';

interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  text: string;
  isContextMessage?: boolean;
}

interface SocraticTutorViewProps {
  launchContext: TutorLaunchContext | null;
  onClearLaunchContext: () => void;
}

const DOUBT_OR_HELP_PATTERN =
  /\b(n[aã]o\s+sei|ajuda|pista|f[oó]rmula|equa[cç][aã]o|n[aã]o\s+percebo|n[aã]o\s+entendo|d[uú]vida|preso|bloqueado|erro|errado|passo)\b/i;

export const SocraticTutorView: React.FC<SocraticTutorViewProps> = ({
  launchContext,
  onClearLaunchContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'model', text: TUTOR_INITIAL_GREETING },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [helpLevel, setHelpLevel] = useState<number>(1);
  const [activeContextCard, setActiveContextCard] = useState<TutorLaunchContext | null>(
    launchContext
  );

  // Sincronizar ano e voz guardados na Estação 2
  const savedGradeYear = getSavedGradeYear();
  const gradeInfo = getGradeLevelInfo(savedGradeYear);
  const [selectedVoice, setSelectedVoice] = useState<string>(getSavedTtsVoice());

  const { speakingMarkerId, isLoadingAudio, fallbackNotice, playSingle, stop } =
    useSetupNarration();

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const nextIdRef = useRef<number>(2);
  const conversationStartedRef = useRef<boolean>(false);
  const handledAutoSendKeyRef = useRef<string | null>(null);
  const lastFailedHistoryRef = useRef<{
    history: ChatMessage[];
    helpLevel: number;
  } | null>(null);

  const liveInputMsgIdRef = useRef<number | null>(null);
  const liveOutputMsgIdRef = useRef<number | null>(null);
  const liveInputTranscriptAccumRef = useRef<string>('');

  const liveVoice = useTutorLiveVoice({
    onInputTranscript: (chunk) => {
      liveOutputMsgIdRef.current = null;
      liveInputTranscriptAccumRef.current = `${liveInputTranscriptAccumRef.current}${chunk}`;
      if (liveInputMsgIdRef.current === null) {
        const newId = nextIdRef.current++;
        liveInputMsgIdRef.current = newId;
        setMessages((prev) => [...prev, { id: newId, role: 'user', text: chunk.trimStart() }]);
      } else {
        const targetId = liveInputMsgIdRef.current;
        setMessages((prev) =>
          prev.map((m) => (m.id === targetId ? { ...m, text: `${m.text}${chunk}` } : m))
        );
      }
    },
    onOutputTranscript: (chunk) => {
      if (liveInputTranscriptAccumRef.current.trim()) {
        recordTutorMessageTopic(liveInputTranscriptAccumRef.current.trim());
        liveInputTranscriptAccumRef.current = '';
      }
      liveInputMsgIdRef.current = null;
      if (liveOutputMsgIdRef.current === null) {
        const newId = nextIdRef.current++;
        liveOutputMsgIdRef.current = newId;
        setMessages((prev) => [...prev, { id: newId, role: 'model', text: chunk.trimStart() }]);
      } else {
        const targetId = liveOutputMsgIdRef.current;
        setMessages((prev) =>
          prev.map((m) => (m.id === targetId ? { ...m, text: `${m.text}${chunk}` } : m))
        );
      }
    },
    onTurnComplete: () => {
      if (liveInputTranscriptAccumRef.current.trim()) {
        recordTutorMessageTopic(liveInputTranscriptAccumRef.current.trim());
        liveInputTranscriptAccumRef.current = '';
      }
      liveInputMsgIdRef.current = null;
      liveOutputMsgIdRef.current = null;
    },
    onError: (msg) => {
      setErrorBanner(msg);
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, errorBanner, liveVoice.status]);

  const computeNextHelpLevel = useCallback(
    (studentText: string, currentLevel: number, forceEscalate = false): number => {
      if (forceEscalate) {
        return Math.min(4, currentLevel + 1);
      }
      const userTurnsCount = messages.filter((m) => m.role === 'user').length;
      if (userTurnsCount === 0) {
        return 1;
      }
      if (DOUBT_OR_HELP_PATTERN.test(studentText) && currentLevel < 4) {
        return Math.min(4, currentLevel + 1);
      }
      return currentLevel;
    },
    [messages]
  );

  const requestTutorReply = useCallback(
    async (conversation: ChatMessage[], targetHelpLevel: number) => {
      setIsLoading(true);
      setErrorBanner(null);

      const apiMessages: Array<{ role: 'user' | 'model'; text: string }> = [];
      for (const m of conversation) {
        if (m.id === 1 && m.role === 'model') continue;
        const last = apiMessages[apiMessages.length - 1];
        if (last && last.role === m.role) {
          last.text = `${last.text}\n\n${m.text}`;
        } else {
          apiMessages.push({ role: m.role, text: m.text });
        }
      }

      try {
        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            helpLevel: targetHelpLevel,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as { reply?: string };
        if (!data.reply || !data.reply.trim()) {
          throw new Error('Resposta vazia do tutor');
        }

        const replyMsg: ChatMessage = {
          id: nextIdRef.current++,
          role: 'model',
          text: data.reply.trim(),
        };

        lastFailedHistoryRef.current = null;
        setMessages((prev) => [...prev, replyMsg]);
      } catch {
        lastFailedHistoryRef.current = {
          history: conversation,
          helpLevel: targetHelpLevel,
        };
        setErrorBanner(TUTOR_OVERLOAD_ERROR_MESSAGE);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (
      rawText: string,
      options?: {
        isContextMessage?: boolean;
        originStationId?: TutorOriginStationId;
        forceEscalate?: boolean;
        baseMessages?: ChatMessage[];
        baseHelpLevel?: number;
      }
    ) => {
      const text = rawText.trim();
      if (!text || isLoading) return;

      stop();

      const origin = options?.originStationId ?? 'tutor-socratico';
      if (!conversationStartedRef.current) {
        conversationStartedRef.current = true;
        recordTutorConversationStart(origin);
      }
      recordTutorMessageTopic(text);

      const base = options?.baseMessages ?? messages;
      const baseLevel = options?.baseHelpLevel ?? helpLevel;
      const nextLevel = options?.isContextMessage
        ? 1
        : computeNextHelpLevel(text, baseLevel, options?.forceEscalate);

      setHelpLevel(nextLevel);

      const userMsg: ChatMessage = {
        id: nextIdRef.current++,
        role: 'user',
        text,
        isContextMessage: options?.isContextMessage,
      };

      const nextConversation = [...base, userMsg];
      setMessages(nextConversation);
      if (!options?.isContextMessage) {
        setInputValue('');
      }

      await requestTutorReply(nextConversation, nextLevel);
    },
    [computeNextHelpLevel, helpLevel, isLoading, messages, requestTutorReply, stop]
  );

  // Quando o aluno chega através do botão "Perguntar ao tutor" nas Estações 1 ou 2
  useEffect(() => {
    if (!launchContext) return;
    if (handledAutoSendKeyRef.current === launchContext.autoSendKey) return;
    handledAutoSendKeyRef.current = launchContext.autoSendKey;

    stop();
    const initialGreeting: ChatMessage = {
      id: 1,
      role: 'model',
      text: TUTOR_INITIAL_GREETING,
    };
    nextIdRef.current = 2;
    conversationStartedRef.current = false;
    lastFailedHistoryRef.current = null;
    setActiveContextCard(launchContext);
    setHelpLevel(1);
    setErrorBanner(null);

    const contextPrompt =
      launchContext.stationId === 'caca-ao-erro'
        ? `Contexto da ${launchContext.stationName}: ${launchContext.summaryText}`
        : `Contexto do simulador (${launchContext.stationName}): ${launchContext.summaryText}. Ajuda-me a raciocinar sobre o que estou a observar.`;

    void sendMessage(contextPrompt, {
      isContextMessage: true,
      originStationId: launchContext.stationId,
      baseMessages: [initialGreeting],
      baseHelpLevel: 1,
    });
  }, [launchContext, sendMessage, stop]);

  const handleNewConversation = () => {
    stop();
    liveVoice.stopSession();
    liveInputMsgIdRef.current = null;
    liveOutputMsgIdRef.current = null;
    liveInputTranscriptAccumRef.current = '';
    nextIdRef.current = 2;
    conversationStartedRef.current = false;
    lastFailedHistoryRef.current = null;
    setMessages([{ id: 1, role: 'model', text: TUTOR_INITIAL_GREETING }]);
    setInputValue('');
    setErrorBanner(null);
    setHelpLevel(1);
    setActiveContextCard(null);
    onClearLaunchContext();
  };

  const handleToggleLiveDialogue = async () => {
    if (liveVoice.status === 'connected' || liveVoice.status === 'connecting') {
      liveVoice.stopSession();
      liveInputMsgIdRef.current = null;
      liveOutputMsgIdRef.current = null;
      liveInputTranscriptAccumRef.current = '';
      return;
    }

    stop();
    setErrorBanner(null);

    if (!conversationStartedRef.current) {
      conversationStartedRef.current = true;
      recordTutorConversationStart(activeContextCard?.stationId ?? 'tutor-socratico');
    }

    const contextPieces: string[] = [];
    if (activeContextCard) {
      contextPieces.push(
        `Contexto do simulador (${activeContextCard.stationName}): ${activeContextCard.summaryText}.`
      );
    }

    const recentMessages = messages
      .filter((m) => !(m.id === 1 && m.role === 'model'))
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Aluno' : 'Tutor'}: ${m.text}`);

    if (recentMessages.length > 0) {
      contextPieces.push(`Resumo da conversa até agora:\n${recentMessages.join('\n')}`);
    }

    contextPieces.push(
      `Nível de ajuda socrática atual: ${helpLevel} de 4. O aluno ativou agora o diálogo falado em português europeu. Cumprimenta brevemente ou continua com uma pergunta socrática curta (máximo 60 palavras).`
    );

    await liveVoice.startSession({
      voiceName: selectedVoice,
      initialContextText: contextPieces.join('\n\n'),
    });
  };

  const handleRetryLast = async () => {
    if (isLoading || !lastFailedHistoryRef.current) return;
    await requestTutorReply(
      lastFailedHistoryRef.current.history,
      lastFailedHistoryRef.current.helpLevel
    );
  };

  const handleEscalateHelp = () => {
    if (isLoading || helpLevel >= 4) return;
    const nextLvl = helpLevel + 1;
    const promptByLevel: Record<number, string> = {
      2: 'Preciso de uma pista sobre que grandeza ou lei física usar.',
      3: 'Podes lembrar-me a fórmula e ajudar-me a ver o que falta?',
      4: 'Continuo bloqueado. Mostra-me apenas o passo seguinte, sem o resultado final.',
    };
    void sendMessage(promptByLevel[nextLvl] || 'Preciso de mais uma pista.', {
      forceEscalate: true,
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(inputValue);
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    saveTtsVoice(voiceId);
  };

  const handleToggleAudio = (msg: ChatMessage) => {
    if (speakingMarkerId === msg.id) {
      stop();
    } else {
      void playSingle({
        text: msg.text,
        markerId: msg.id,
        level: gradeInfo.level,
        voiceName: selectedVoice,
      });
    }
  };

  const activeLevelInfo = TUTOR_HELP_LEVELS[helpLevel] || TUTOR_HELP_LEVELS[1];
  const isTutorSpeakingNow = liveVoice.isTutorSpeaking || speakingMarkerId !== null;
  const hasStartedInteraction =
    messages.length > 1 ||
    isLoading ||
    activeContextCard !== null ||
    liveVoice.status === 'connected' ||
    liveVoice.status === 'connecting';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Cabeçalho da Estação 3 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <SocraticTutorAvatar
              size="lg"
              framed
              isThinking={isLoading}
              isSpeaking={isTutorSpeakingNow}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Estação 3: {TUTOR_DISPLAY_NAME} — Tutor Socrático
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  Física 12.º Ano
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Orientação passo a passo pelo método socrático — perguntas certas para descobrires a resposta por ti próprio
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleToggleLiveDialogue()}
              disabled={isLoading}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition shadow ${
                liveVoice.status === 'connected'
                  ? 'bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border-rose-500/50'
                  : liveVoice.status === 'connecting'
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                  : 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500/40'
              } disabled:opacity-50`}
            >
              {liveVoice.status === 'connected' ? (
                <>
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>Terminar diálogo falado</span>
                </>
              ) : liveVoice.status === 'connecting' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>A ligar microfone...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Diálogo falado</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleNewConversation}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
              <span>Nova conversa</span>
            </button>
          </div>
        </div>

        {/* Barra de Estado: Contador de Ajudas (1 a 4) + Voz da Narração */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Contador de ajudas usadas na conversa (1 a 4) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-300">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">Ajudas usadas:</span>
              <span className="font-mono font-bold text-amber-300">{helpLevel} / 4</span>
            </div>

            <div className="flex items-center space-x-1" aria-label={`Nível de ajuda ${helpLevel} de 4`}>
              {[1, 2, 3, 4].map((lvl) => (
                <span
                  key={lvl}
                  title={TUTOR_HELP_LEVELS[lvl].description}
                  className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold flex items-center justify-center border transition ${
                    lvl <= helpLevel
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  {lvl}
                </span>
              ))}
            </div>

            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              ({activeLevelInfo.description})
            </span>

            {helpLevel < 4 && (
              <button
                type="button"
                onClick={handleEscalateHelp}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 rounded-md bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 font-semibold transition disabled:opacity-50"
              >
                + Pedir pista (Nível {helpLevel + 1})
              </button>
            )}
          </div>

          {/* Voz e Ano de Escolaridade (partilhados com a Estação 2) */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[11px] text-slate-400 font-mono">
              {gradeInfo.label} • Voz:
            </span>
            <select
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              aria-label="Voz de leitura das respostas do tutor"
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {SETUP_TTS_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cartão Compacto de Contexto do Simulador (quando aberto a partir das Estações 1 ou 2) */}
      {activeContextCard && (
        <div className="bg-slate-900/90 border border-teal-500/30 rounded-xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start space-x-2.5">
            <Compass className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-teal-300">
                Contexto ativo: {activeContextCard.stationName}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeContextCard.details.map((d, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded"
                  >
                    <span className="text-slate-500">{d.label}: </span>
                    <span className="text-slate-100 font-semibold">{d.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveContextCard(null);
              onClearLaunchContext();
            }}
            className="text-[11px] text-slate-400 hover:text-slate-200 font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800"
          >
            Ocultar contexto
          </button>
        </div>
      )}

      {/* Aviso de fallback do TTS se ocorrer */}
      {fallbackNotice && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg px-3.5 py-2 text-xs text-amber-200">
          {fallbackNotice}
        </div>
      )}

      {/* Área de Conversa */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
        {/* Presença flutuante do Galileu sempre que uma interação é iniciada */}
        {hasStartedInteraction && (
          <div className="px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <SocraticTutorAvatar
                size="sm"
                framed
                isThinking={isLoading}
                isSpeaking={isTutorSpeakingNow}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-teal-300 truncate">
                  {TUTOR_DISPLAY_NAME} em acompanhamento
                  {isLoading
                    ? ' • a analisar o teu raciocínio...'
                    : isTutorSpeakingNow
                    ? ' • a falar...'
                    : ''}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {activeContextCard
                    ? `Contexto ativo: ${activeContextCard.stationName}`
                    : 'Contexto de Física e dúvidas da sessão mantido'}
                  {' · '}Nível {helpLevel}/4
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Mensagens */}
        <div className="p-4 sm:p-5 space-y-4 min-h-[340px] max-h-[540px] overflow-y-auto bg-slate-950/50">
          {messages.map((msg) => {
            const isTutor = msg.role === 'model';
            const isSpeakingThis = speakingMarkerId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex ${isTutor ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ${
                    isTutor
                      ? 'bg-slate-900 border border-teal-500/30 text-slate-100 rounded-tl-sm'
                      : msg.isContextMessage
                      ? 'bg-amber-950/40 border border-amber-500/30 text-amber-100 rounded-tr-sm'
                      : 'bg-teal-600/25 border border-teal-500/40 text-slate-100 rounded-tr-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-bold ${
                        isTutor
                          ? 'text-teal-400'
                          : msg.isContextMessage
                          ? 'text-amber-300'
                          : 'text-sky-300'
                      }`}
                    >
                      {isTutor && <SocraticTutorAvatar size="xs" isSpeaking={isSpeakingThis} />}
                      <span>
                        {isTutor
                          ? `${TUTOR_DISPLAY_NAME} • Tutor de Física`
                          : msg.isContextMessage
                          ? 'Contexto enviado'
                          : 'Aluno'}
                      </span>
                    </span>

                    {isTutor && (
                      <button
                        type="button"
                        onClick={() => handleToggleAudio(msg)}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                          isSpeakingThis
                            ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-950 hover:bg-slate-800 text-teal-300 border border-slate-700'
                        }`}
                        title={isSpeakingThis ? 'Parar leitura' : 'Ouvir resposta do tutor'}
                      >
                        {isSpeakingThis ? (
                          isLoadingAudio ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>A carregar...</span>
                            </>
                          ) : (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Parar</span>
                            </>
                          )
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Ouvir</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap text-xs sm:text-sm text-slate-100">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-teal-500/30 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-teal-300 flex items-center space-x-2.5 shadow">
                <SocraticTutorAvatar size="xs" isThinking />
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                <span className="font-mono">{TUTOR_THINKING_LABEL}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Banner de Erro com Preservação da Conversa */}
        {errorBanner && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorBanner}</span>
            </div>
            {lastFailedHistoryRef.current && (
              <button
                type="button"
                onClick={handleRetryLast}
                disabled={isLoading}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-white font-semibold transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tentar de novo</span>
              </button>
            )}
          </div>
        )}

        {/* Barra de Diálogo Falado em Tempo Real */}
        {liveVoice.status === 'connected' && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-teal-950/50 border border-teal-500/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <SocraticTutorAvatar
                size="sm"
                framed
                isSpeaking={liveVoice.isTutorSpeaking}
              />

              <div>
                <div className="text-xs font-bold text-slate-100">
                  {liveVoice.isTutorSpeaking
                    ? `O ${TUTOR_DISPLAY_NAME} está a falar...`
                    : liveVoice.isMicMuted
                    ? 'Microfone silenciado'
                    : `Diálogo falado com o ${TUTOR_DISPLAY_NAME} ativo — podes falar naturalmente`}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] font-mono text-slate-400">Microfone:</span>
                  <div className="w-28 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-teal-400 transition-all duration-75"
                      style={{
                        width: `${Math.round(
                          (liveVoice.isMicMuted ? 0 : liveVoice.micLevel) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={liveVoice.toggleMute}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  liveVoice.isMicMuted
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                {liveVoice.isMicMuted ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Ativar microfone</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-teal-400" />
                    <span>Silenciar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => void handleToggleLiveDialogue()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 text-xs font-semibold transition"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Terminar</span>
              </button>
            </div>
          </div>
        )}

        {/* Campo de Texto + Botão Enviar + Sugestões */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleToggleLiveDialogue()}
              disabled={isLoading}
              title={
                liveVoice.status === 'connected'
                  ? 'Terminar diálogo falado'
                  : 'Falar com o tutor pelo microfone'
              }
              className={`p-2.5 rounded-xl border transition shrink-0 ${
                liveVoice.status === 'connected'
                  ? 'bg-rose-600/25 border-rose-500/50 text-rose-300 hover:bg-rose-600/40'
                  : 'bg-slate-950 border-slate-700 text-teal-400 hover:border-teal-500 hover:text-teal-300'
              } disabled:opacity-50`}
            >
              {liveVoice.status === 'connected' ? (
                <PhoneOff className="w-4 h-4" />
              ) : liveVoice.status === 'connecting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || liveVoice.status === 'connected'}
              placeholder={
                liveVoice.status === 'connected'
                  ? 'Diálogo falado ativo — fala para o microfone ou termina a chamada para escrever...'
                  : 'Escreve a tua dúvida, fórmula ou tentativa de resolução...'
              }
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || liveVoice.status === 'connected' || !inputValue.trim()}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>
          </form>

          {/* Três botões de sugestão por baixo do campo de texto */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Sugestões:</span>
            </span>
            {TUTOR_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isLoading}
                onClick={() => void sendMessage(suggestion)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 hover:border-teal-500/40 transition disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
