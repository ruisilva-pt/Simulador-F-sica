import { useCallback, useEffect, useRef, useState } from 'react';
import {
  expandSymbolsForTTS,
  SETUP_TTS_LANGUAGE,
  SetupLevel,
  SetupMarkerConfig,
} from '../config/experimentalSetup';

export interface UseSetupNarrationResult {
  speakingMarkerId: number | 'sample' | null;
  isPlayingAll: boolean;
  isLoadingAudio: boolean;
  fallbackNotice: string | null;
  playSingle: (opts: {
    text: string;
    markerId: number | 'sample';
    level: SetupLevel;
    voiceName: string;
  }) => Promise<void>;
  playAll: (opts: {
    markers: SetupMarkerConfig[];
    textsByMarker: Record<number, string>;
    level: SetupLevel;
    voiceName: string;
    onMarkerActive: (markerId: number) => void;
  }) => Promise<void>;
  stop: () => void;
}

function base64ToWavUrl(base64: string, mimeType = 'audio/wav'): string {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export function useSetupNarration(): UseSetupNarrationResult {
  const [speakingMarkerId, setSpeakingMarkerId] = useState<number | 'sample' | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Cache em memória: chave -> URL do Blob WAV gerado
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const playbackTokenRef = useRef<number>(0);

  const stopInternal = useCallback(() => {
    playbackTokenRef.current += 1;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setSpeakingMarkerId(null);
    setIsPlayingAll(false);
    setIsLoadingAudio(false);
  }, []);

  useEffect(() => {
    const cache = audioCacheRef.current;
    return () => {
      stopInternal();
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, [stopInternal]);

  const speakWithBrowserFallback = useCallback(
    (spokenText: string, level: SetupLevel, token: number): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          setFallbackNotice(
            'Voz Gemini indisponível e síntese de voz não suportada neste navegador.'
          );
          resolve();
          return;
        }

        if (token !== playbackTokenRef.current) {
          resolve();
          return;
        }

        setFallbackNotice(
          'Voz Gemini indisponível de momento — a usar a síntese de voz do navegador (pt-PT).'
        );

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = SETUP_TTS_LANGUAGE;
        utterance.rate = level === 'A' ? 0.88 : 0.98;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const ptPtVoice =
          voices.find((v) => v.lang.toLowerCase() === 'pt-pt') ||
          voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
        if (ptPtVoice) {
          utterance.voice = ptPtVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      });
    },
    []
  );

  const playUrl = useCallback((url: string, token: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (token !== playbackTokenRef.current) {
        resolve();
        return;
      }

      const audio = new Audio(url);
      audioElRef.current = audio;

      audio.onended = () => {
        if (audioElRef.current === audio) {
          audioElRef.current = null;
        }
        resolve();
      };
      audio.onerror = () => {
        if (audioElRef.current === audio) {
          audioElRef.current = null;
        }
        reject(new Error('Erro ao reproduzir áudio WAV.'));
      };

      audio.play().catch((err) => {
        if (audioElRef.current === audio) {
          audioElRef.current = null;
        }
        reject(err);
      });
    });
  }, []);

  const fetchOrGetCachedAudio = useCallback(
    async (
      spokenText: string,
      level: SetupLevel,
      voiceName: string,
      token: number
    ): Promise<string> => {
      const cacheKey = `${SETUP_TTS_LANGUAGE}|${level}|${voiceName}|${spokenText}`;
      const cached = audioCacheRef.current.get(cacheKey);
      if (cached) {
        return cached;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: spokenText,
          voiceName,
          level,
          language: SETUP_TTS_LANGUAGE,
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error((errPayload as { error?: string }).error || `Erro HTTP ${response.status}`);
      }

      const data = (await response.json()) as { audioBase64?: string; mimeType?: string };
      if (!data.audioBase64) {
        throw new Error('Áudio vazio recebido do servidor.');
      }

      if (token !== playbackTokenRef.current) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const wavUrl = base64ToWavUrl(data.audioBase64, data.mimeType || 'audio/wav');
      audioCacheRef.current.set(cacheKey, wavUrl);
      return wavUrl;
    },
    []
  );

  const playClipInternal = useCallback(
    async (
      rawText: string,
      markerId: number | 'sample',
      level: SetupLevel,
      voiceName: string,
      token: number
    ) => {
      if (token !== playbackTokenRef.current) return;

      const spokenText = expandSymbolsForTTS(rawText);
      setSpeakingMarkerId(markerId);
      setIsLoadingAudio(true);

      try {
        const wavUrl = await fetchOrGetCachedAudio(spokenText, level, voiceName, token);
        if (token !== playbackTokenRef.current) return;
        setFallbackNotice(null);
        setIsLoadingAudio(false);
        await playUrl(wavUrl, token);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError' || token !== playbackTokenRef.current) {
          return;
        }
        setIsLoadingAudio(false);
        await speakWithBrowserFallback(spokenText, level, token);
      }
    },
    [fetchOrGetCachedAudio, playUrl, speakWithBrowserFallback]
  );

  const playSingle = useCallback(
    async (opts: {
      text: string;
      markerId: number | 'sample';
      level: SetupLevel;
      voiceName: string;
    }) => {
      stopInternal();
      const token = playbackTokenRef.current;
      await playClipInternal(opts.text, opts.markerId, opts.level, opts.voiceName, token);
      if (token === playbackTokenRef.current) {
        setSpeakingMarkerId(null);
        setIsLoadingAudio(false);
      }
    },
    [playClipInternal, stopInternal]
  );

  const playAll = useCallback(
    async (opts: {
      markers: SetupMarkerConfig[];
      textsByMarker: Record<number, string>;
      level: SetupLevel;
      voiceName: string;
      onMarkerActive: (markerId: number) => void;
    }) => {
      stopInternal();
      const token = playbackTokenRef.current;
      setIsPlayingAll(true);

      for (const marker of opts.markers) {
        if (token !== playbackTokenRef.current) break;
        const text = opts.textsByMarker[marker.id];
        if (!text) continue;
        opts.onMarkerActive(marker.id);
        await playClipInternal(text, marker.id, opts.level, opts.voiceName, token);
      }

      if (token === playbackTokenRef.current) {
        setIsPlayingAll(false);
        setSpeakingMarkerId(null);
        setIsLoadingAudio(false);
      }
    },
    [playClipInternal, stopInternal]
  );

  return {
    speakingMarkerId,
    isPlayingAll,
    isLoadingAudio,
    fallbackNotice,
    playSingle,
    playAll,
    stop: stopInternal,
  };
}
