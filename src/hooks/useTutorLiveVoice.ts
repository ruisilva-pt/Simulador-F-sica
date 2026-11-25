import { useCallback, useEffect, useRef, useState } from 'react';

export type LiveVoiceStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface UseTutorLiveVoiceOptions {
  onInputTranscript?: (chunk: string) => void;
  onOutputTranscript?: (chunk: string) => void;
  onTurnComplete?: () => void;
  onError?: (message: string) => void;
}

export interface UseTutorLiveVoiceResult {
  status: LiveVoiceStatus;
  isMicMuted: boolean;
  isTutorSpeaking: boolean;
  micLevel: number;
  errorMessage: string | null;
  startSession: (opts: { voiceName: string; initialContextText?: string }) => Promise<void>;
  stopSession: () => void;
  toggleMute: () => void;
}

function downsampleFloat32(
  input: Float32Array,
  sourceRate: number,
  targetRate: number
): Float32Array {
  if (sourceRate === targetRate || sourceRate <= 0) {
    return input;
  }
  const ratio = sourceRate / targetRate;
  const newLength = Math.max(1, Math.round(input.length / ratio));
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] ?? 0;
    const b = input[Math.min(idx + 1, input.length - 1)] ?? a;
    result[i] = a + (b - a) * frac;
  }
  return result;
}

function float32PcmToBase64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64PcmToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768;
  }
  return float32;
}

export function useTutorLiveVoice(
  options: UseTutorLiveVoiceOptions
): UseTutorLiveVoiceResult {
  const [status, setStatus] = useState<LiveVoiceStatus>('idle');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const zeroGainRef = useRef<GainNode | null>(null);
  const activeAudioNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const isMutedRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const callbacksRef = useRef<UseTutorLiveVoiceOptions>(options);
  callbacksRef.current = options;

  const clearAudioOutputQueue = useCallback(() => {
    activeAudioNodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Ignorar nó já terminado
      }
    });
    activeAudioNodesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsTutorSpeaking(false);
  }, []);

  const stopSessionInternal = useCallback(
    (preserveError = false) => {
      isStoppingRef.current = true;

      clearAudioOutputQueue();

      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
        } catch {
          // ignore
        }
        processorRef.current.onaudioprocess = null;
        processorRef.current = null;
      }

      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch {
          // ignore
        }
        sourceNodeRef.current = null;
      }

      if (zeroGainRef.current) {
        try {
          zeroGainRef.current.disconnect();
        } catch {
          // ignore
        }
        zeroGainRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (inputCtxRef.current) {
        void inputCtxRef.current.close().catch(() => {});
        inputCtxRef.current = null;
      }

      if (outputCtxRef.current) {
        void outputCtxRef.current.close().catch(() => {});
        outputCtxRef.current = null;
      }

      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }

      setMicLevel(0);
      setIsMicMuted(false);
      isMutedRef.current = false;
      if (!preserveError) {
        setStatus('idle');
        setErrorMessage(null);
      }
    },
    [clearAudioOutputQueue]
  );

  useEffect(() => {
    return () => {
      stopSessionInternal();
    };
  }, [stopSessionInternal]);

  const scheduleOutputPcmChunk = useCallback((base64Audio: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const float32 = base64PcmToFloat32(base64Audio);
    if (float32.length === 0) return;

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.02, nextStartTimeRef.current);
    nextStartTimeRef.current = startAt + buffer.duration;

    activeAudioNodesRef.current.add(node);
    setIsTutorSpeaking(true);

    node.onended = () => {
      activeAudioNodesRef.current.delete(node);
      if (activeAudioNodesRef.current.size === 0) {
        setIsTutorSpeaking(false);
      }
    };

    node.start(startAt);
  }, []);

  const startSession = useCallback(
    async ({
      voiceName,
      initialContextText,
    }: {
      voiceName: string;
      initialContextText?: string;
    }) => {
      stopSessionInternal();
      isStoppingRef.current = false;
      setStatus('connecting');
      setErrorMessage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = 'O teu navegador não suporta acesso ao microfone para diálogo em voz.';
        setStatus('error');
        setErrorMessage(msg);
        callbacksRef.current.onError?.(msg);
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        const msg =
          'Não foi possível aceder ao microfone. Verifica as permissões do navegador e tenta novamente.';
        setStatus('error');
        setErrorMessage(msg);
        callbacksRef.current.onError?.(msg);
        return;
      }

      if (isStoppingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;

      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/tutor-live?voice=${encodeURIComponent(
        voiceName
      )}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      const zeroGain = inputCtx.createGain();
      zeroGain.gain.value = 0;

      sourceNodeRef.current = source;
      processorRef.current = processor;
      zeroGainRef.current = zeroGain;

      source.connect(processor);
      processor.connect(zeroGain);
      zeroGain.connect(inputCtx.destination);

      processor.onaudioprocess = (event) => {
        if (
          isStoppingRef.current ||
          isMutedRef.current ||
          !wsRef.current ||
          wsRef.current.readyState !== WebSocket.OPEN
        ) {
          setMicLevel(0);
          return;
        }

        const rawSamples = event.inputBuffer.getChannelData(0);
        let sumSq = 0;
        for (let i = 0; i < rawSamples.length; i++) {
          sumSq += rawSamples[i] * rawSamples[i];
        }
        const rms = Math.sqrt(sumSq / rawSamples.length);
        setMicLevel(Math.min(1, rms * 5));

        const resampled = downsampleFloat32(rawSamples, inputCtx.sampleRate, 16000);
        const base64 = float32PcmToBase64(resampled);
        wsRef.current.send(JSON.stringify({ type: 'audio', audio: base64 }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as {
            type?: string;
            data?: string;
            text?: string;
            message?: string;
          };

          if (payload.type === 'ready') {
            setStatus('connected');
            if (initialContextText && initialContextText.trim()) {
              ws.send(
                JSON.stringify({
                  type: 'text',
                  text: initialContextText.trim(),
                })
              );
            }
          } else if (payload.type === 'audio' && payload.data) {
            scheduleOutputPcmChunk(payload.data);
          } else if (payload.type === 'inputTranscript' && payload.text) {
            callbacksRef.current.onInputTranscript?.(payload.text);
          } else if (payload.type === 'outputTranscript' && payload.text) {
            callbacksRef.current.onOutputTranscript?.(payload.text);
          } else if (payload.type === 'interrupted') {
            clearAudioOutputQueue();
          } else if (payload.type === 'turnComplete') {
            callbacksRef.current.onTurnComplete?.();
          } else if (payload.type === 'error') {
            const msg = payload.message || 'Erro na sessão de diálogo em voz.';
            setStatus('error');
            setErrorMessage(msg);
            callbacksRef.current.onError?.(msg);
            stopSessionInternal(true);
          }
        } catch {
          // Ignorar payload inválido
        }
      };

      ws.onerror = () => {
        if (isStoppingRef.current) return;
        const msg =
          'Não foi possível estabelecer ligação em tempo real com o Tutor Socrático.';
        setStatus('error');
        setErrorMessage(msg);
        callbacksRef.current.onError?.(msg);
        stopSessionInternal(true);
      };

      ws.onclose = () => {
        if (isStoppingRef.current) return;
        stopSessionInternal();
      };
    },
    [clearAudioOutputQueue, scheduleOutputPcmChunk, stopSessionInternal]
  );

  const stopSession = useCallback(() => {
    stopSessionInternal(false);
  }, [stopSessionInternal]);

  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMicMuted(next);
    if (next) {
      setMicLevel(0);
    }
  }, []);

  return {
    status,
    isMicMuted,
    isTutorSpeaking,
    micLevel,
    errorMessage,
    startSession,
    stopSession,
    toggleMute,
  };
}
