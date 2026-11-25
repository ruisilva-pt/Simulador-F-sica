import React, { useRef, useState } from 'react';
import {
  GRADE_OPTIONS,
  GradeYear,
  SETUP_IMAGE_PATH,
  SETUP_MARKERS,
  SETUP_TEXTS_BY_LEVEL,
  SETUP_TTS_VOICES,
  SETUP_VOICE_SAMPLE_TEXT,
  getGradeLevelInfo,
} from '../../config/experimentalSetup';
import { useSetupNarration } from '../../hooks/useSetupNarration';
import {
  MarkerPosition,
  getSavedGradeYear,
  getSavedMarkerPositions,
  getSavedTtsVoice,
  resetSavedMarkerPositions,
  saveGradeYear,
  saveMarkerPositions,
  saveTtsVoice,
} from '../../utils/setupStorage';
import {
  AlertCircle,
  GraduationCap,
  ImageOff,
  ListOrdered,
  Loader2,
  Lock,
  Move,
  RotateCcw,
  Square,
  Volume2,
} from 'lucide-react';

interface ExperimentalSetupViewProps {
  isTeacherModeActive: boolean;
}

export const ExperimentalSetupView: React.FC<ExperimentalSetupViewProps> = ({
  isTeacherModeActive,
}) => {
  const [gradeYear, setGradeYear] = useState<GradeYear>(getSavedGradeYear);
  const [selectedVoice, setSelectedVoice] = useState<string>(getSavedTtsVoice);
  const [selectedMarkerId, setSelectedMarkerId] = useState<number>(1);
  const [positions, setPositions] = useState<Record<number, MarkerPosition>>(
    getSavedMarkerPositions
  );
  const [imageFailed, setImageFailed] = useState<boolean>(!SETUP_IMAGE_PATH);
  const [draggingMarkerId, setDraggingMarkerId] = useState<number | null>(null);

  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const dragMovedRef = useRef<boolean>(false);

  const {
    speakingMarkerId,
    isPlayingAll,
    isLoadingAudio,
    fallbackNotice,
    playSingle,
    playAll,
    stop,
  } = useSetupNarration();

  const levelInfo = getGradeLevelInfo(gradeYear);
  const levelTexts = SETUP_TEXTS_BY_LEVEL[levelInfo.level];
  const activeMarker =
    SETUP_MARKERS.find((m) => m.id === selectedMarkerId) || SETUP_MARKERS[0];
  const activeText = levelTexts[activeMarker.id] || '';
  const speakingMarker =
    typeof speakingMarkerId === 'number'
      ? SETUP_MARKERS.find((m) => m.id === speakingMarkerId)
      : null;

  const handleGradeChange = (year: GradeYear) => {
    stop();
    setGradeYear(year);
    saveGradeYear(year);
  };

  const handleVoiceChange = (voiceId: string) => {
    stop();
    setSelectedVoice(voiceId);
    saveTtsVoice(voiceId);
  };

  const handleListenCurrent = () => {
    playSingle({
      text: activeText,
      markerId: activeMarker.id,
      level: levelInfo.level,
      voiceName: selectedVoice,
    });
  };

  const handleListenSample = () => {
    playSingle({
      text: SETUP_VOICE_SAMPLE_TEXT,
      markerId: 'sample',
      level: levelInfo.level,
      voiceName: selectedVoice,
    });
  };

  const handleListenAll = () => {
    playAll({
      markers: SETUP_MARKERS,
      textsByMarker: levelTexts,
      level: levelInfo.level,
      voiceName: selectedVoice,
      onMarkerActive: (id) => setSelectedMarkerId(id),
    });
  };

  const handleMarkerPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    markerId: number
  ) => {
    if (!isTeacherModeActive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingMarkerId(markerId);
    dragMovedRef.current = false;
  };

  const handleMarkerPointerMove = (
    e: React.PointerEvent<HTMLButtonElement>,
    markerId: number
  ) => {
    if (!isTeacherModeActive || draggingMarkerId !== markerId) return;
    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const x = Math.round(Math.max(2, Math.min(98, rawX)) * 10) / 10;
    const y = Math.round(Math.max(2, Math.min(98, rawY)) * 10) / 10;

    dragMovedRef.current = true;
    setPositions((prev) => {
      const updated = { ...prev, [markerId]: { x, y } };
      saveMarkerPositions(updated);
      return updated;
    });
  };

  const handleMarkerPointerUp = (
    e: React.PointerEvent<HTMLButtonElement>,
    markerId: number
  ) => {
    if (draggingMarkerId === markerId) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      setDraggingMarkerId(null);
    }
  };

  const handleResetPositions = () => {
    const reset = resetSavedMarkerPositions();
    setPositions(reset);
  };

  const isAnyPlaying = speakingMarkerId !== null || isPlayingAll || isLoadingAudio;

  return (
    <div className="space-y-5">
      {/* Barra de Controlos Pedagógicos e Narração */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Seletor: Ano de Escolaridade */}
          <div className="md:col-span-4 space-y-1.5">
            <label
              htmlFor="setup-grade-select"
              className="flex items-center justify-between text-xs font-semibold text-slate-300"
            >
              <span className="flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4 text-teal-400" />
                <span>Ano de escolaridade</span>
              </span>
              <span className="text-[11px] font-mono text-teal-400">{levelInfo.levelLabel}</span>
            </label>
            <select
              id="setup-grade-select"
              value={gradeYear}
              onChange={(e) => handleGradeChange(e.target.value as GradeYear)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-teal-500 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none"
            >
              {GRADE_OPTIONS.map((opt) => (
                <option key={opt.year} value={opt.year}>
                  {opt.label} — Nível {opt.level}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor: Voz + Botão Ouvir Amostra */}
          <div className="md:col-span-5 space-y-1.5">
            <label
              htmlFor="setup-voice-select"
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Voz (Português Europeu)</span>
            </label>
            <div className="flex items-stretch gap-2">
              <select
                id="setup-voice-select"
                value={selectedVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="flex-1 min-w-0 bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-amber-500 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none"
              >
                {SETUP_TTS_VOICES.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label} ({voice.description})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleListenSample}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition shrink-0 flex items-center space-x-1.5"
              >
                {speakingMarkerId === 'sample' && isLoadingAudio ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Ouvir amostra</span>
              </button>
            </div>
          </div>

          {/* Controlo Global: Ouvir Tudo e Parar */}
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleListenAll}
              disabled={isPlayingAll}
              className="flex-1 flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow"
            >
              <ListOrdered className="w-4 h-4" />
              <span>Ouvir tudo</span>
            </button>
            <button
              type="button"
              onClick={stop}
              disabled={!isAnyPlaying}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600/40 disabled:opacity-40 text-rose-300 border border-rose-500/40 rounded-lg text-xs sm:text-sm font-bold transition"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Parar</span>
            </button>
          </div>
        </div>

        {/* Estado de Reprodução Sequencial ou Aviso de Recurso */}
        {(isPlayingAll || fallbackNotice) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
            {isPlayingAll && speakingMarker ? (
              <div className="flex items-center space-x-2 text-teal-300 font-medium">
                {isLoadingAudio ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-teal-400 animate-pulse" />
                )}
                <span>
                  A ler ponto {speakingMarker.id} de {SETUP_MARKERS.length}:{' '}
                  <strong className="text-white">{speakingMarker.shortTitle}</strong>
                </span>
              </div>
            ) : (
              <span />
            )}

            {fallbackNotice && (
              <div
                role="status"
                className="flex items-center space-x-1.5 text-amber-300 text-xs font-mono"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fallbackNotice}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barra do Modo Professor para Afinação de Marcadores */}
      {isTeacherModeActive && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-950/30 border border-amber-500/40 rounded-xl px-4 py-2.5 text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <Move className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Professor:</strong> arrasta os marcadores numerados sobre a fotografia para afinar a posição (guardada automaticamente neste dispositivo).
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetPositions}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-lg font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repor posições iniciais</span>
          </button>
        </div>
      )}

      {/* Área Principal: Fotografia 16:9 com Marcadores + Painel de Leitura */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Fotografia Interativa em 16:9 (Sem Cortes) */}
        <div className="xl:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-2 sm:p-3 shadow-xl">
          <div
            ref={imageContainerRef}
            className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800 select-none"
          >
            {imageFailed ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-400">
                <ImageOff className="w-10 h-10 text-slate-600" />
                <div className="text-sm font-semibold text-slate-300">
                  Espaço reservado para a fotografia da montagem experimental (16:9)
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  Anexa ou substitui a imagem configurada para visualizar a bancada de MRU e MRUA com os marcadores interativos.
                </p>
              </div>
            ) : (
              <img
                src={SETUP_IMAGE_PATH}
                alt="Montagem experimental de bancada com duas pistas paralelas de alumínio para MRU e MRUA, régua graduada, mola impulsionadora, polia com massa suspensa e pórtico de sensores óticos."
                className="w-full h-full object-contain block"
                draggable={false}
                onError={() => setImageFailed(true)}
              />
            )}

            {/* Marcadores Clicáveis (1 a 6) */}
            {SETUP_MARKERS.map((marker) => {
              const pos = positions[marker.id] || { x: marker.defaultX, y: marker.defaultY };
              const isSelected = selectedMarkerId === marker.id;
              const isSpeaking = speakingMarkerId === marker.id;
              const tooltipBelow = pos.y < 22;

              return (
                <button
                  key={marker.id}
                  type="button"
                  aria-label={`${marker.id}. ${marker.shortTitle}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (dragMovedRef.current) {
                      dragMovedRef.current = false;
                      return;
                    }
                    setSelectedMarkerId(marker.id);
                  }}
                  onPointerDown={(e) => handleMarkerPointerDown(e, marker.id)}
                  onPointerMove={(e) => handleMarkerPointerMove(e, marker.id)}
                  onPointerUp={(e) => handleMarkerPointerUp(e, marker.id)}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    touchAction: isTeacherModeActive ? 'none' : 'auto',
                  }}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none ${
                    isTeacherModeActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${isSelected || isSpeaking ? 'z-20' : 'z-10'}`}
                >
                  {/* Anel discreto a pulsar */}
                  <span
                    className={`absolute inset-0 rounded-full animate-ping ${
                      isSpeaking
                        ? 'bg-amber-400/55'
                        : isSelected
                        ? 'bg-teal-400/50'
                        : 'bg-teal-400/30'
                    }`}
                  />

                  {/* Círculo numerado */}
                  <span
                    className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full font-mono text-xs sm:text-sm font-extrabold border-2 shadow-lg transition-transform group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-white ${
                      isSpeaking
                        ? 'bg-amber-500 text-slate-950 border-white scale-110'
                        : isSelected
                        ? 'bg-teal-500 text-slate-950 border-white scale-105'
                        : 'bg-slate-950/90 text-teal-300 border-teal-400 hover:bg-teal-600 hover:text-white'
                    }`}
                  >
                    {marker.id}
                  </span>

                  {/* Legenda curta ao passar o rato ou focar */}
                  <span
                    className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-950/95 text-slate-100 border border-slate-700 text-[11px] font-semibold shadow-xl transition-opacity ${
                      tooltipBelow ? 'top-full mt-2' : 'bottom-full mb-2'
                    } ${
                      isSelected
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                    }`}
                  >
                    {marker.id}. {marker.shortTitle}
                    {isTeacherModeActive && (
                      <span className="ml-1.5 text-amber-400 font-mono">
                        ({pos.x.toFixed(0)}%, {pos.y.toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel do Elemento Selecionado + Navegação Direta 1-6 */}
        <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
          {/* Seletor rápido de marcadores (acessível por teclado e telemóvel) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
              Elementos da Montagem (1 a 6)
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {SETUP_MARKERS.map((m) => {
                const isSelected = m.id === activeMarker.id;
                const isSpeaking = speakingMarkerId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMarkerId(m.id)}
                    className={`py-2 rounded-lg font-mono text-xs font-bold border transition ${
                      isSpeaking
                        ? 'bg-amber-600 text-white border-amber-400'
                        : isSelected
                        ? 'bg-teal-600 text-white border-teal-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                    title={`${m.id}. ${m.shortTitle}`}
                  >
                    {m.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cabeçalho do Elemento Selecionado */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                Ponto {activeMarker.id} de {SETUP_MARKERS.length}
              </span>
              <span className="text-xs font-mono text-amber-400">{levelInfo.levelLabel}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 pt-1">
              {activeMarker.id}. {activeMarker.shortTitle}
            </h3>
          </div>

          {/* Texto Pedagógico do Nível Selecionado */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm sm:text-base text-slate-100 leading-relaxed">
            {activeText}
          </div>

          {/* Botões Ouvir / Parar do Painel */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleListenCurrent}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold transition shadow"
            >
              {speakingMarkerId === activeMarker.id && isLoadingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A preparar áudio...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>
                    {speakingMarkerId === activeMarker.id ? 'A reproduzir...' : 'Ouvir'}
                  </span>
                </>
              )}
            </button>

            {isAnyPlaying && (
              <button
                type="button"
                onClick={stop}
                className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40 rounded-lg text-sm font-semibold transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Parar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
