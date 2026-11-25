import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { TUTOR_SYSTEM_INSTRUCTION } from './src/config/tutorSocratic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const PRIMARY_TTS_MODEL = 'gemini-3.8-flash-tts';
const LIGHT_FALLBACK_TTS_MODEL = 'gemini-3.8-flash-lite-tts';
const PRIMARY_TUTOR_MODEL = 'gemini-4-hydrogen';
const LIGHT_FALLBACK_TUTOR_MODEL = 'gemini-3.1-flash-lite';
const LIVE_TUTOR_MODEL = 'gemini-3.8-live';

const VALID_VOICES = new Set(['Kore', 'Puck', 'Charon', 'Aoede', 'Fenrir', 'Zephyr']);
const VALID_LIVE_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 12000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildSpeechStyle(level: string, language: string): string {
  const langInstruction =
    language === 'pt-PT'
      ? 'Fala exclusivamente em português europeu (Portugal, pt-PT), com sotaque natural de Portugal.'
      : `Fala no idioma ${language}.`;

  if (level === 'A') {
    return `${langInstruction} Adota um ritmo calmo, pausado e ligeiramente mais lento, com dicção muito clara e didática para alunos do 7.º e 8.º ano.`;
  }
  if (level === 'B') {
    return `${langInstruction} Adota um ritmo calmo, equilibrado e dicção clara, como um professor de Física a explicar a alunos do 9.º e 10.º ano.`;
  }
  return `${langInstruction} Adota um ritmo calmo, preciso e dicção clara e rigorosa, como um professor de Física do 11.º e 12.º ano.`;
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /overloaded|unavailable|resource_exhausted|429|503|timeout|rate/i.test(msg)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateAudioWithModel(
  ai: GoogleGenAI,
  model: string,
  text: string,
  voiceName: string,
  style: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text,
            speechMetadata: {
              style,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName,
          },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('O modelo não devolveu dados de áudio.');
  }
  return base64Audio;
}

interface TutorTurnInput {
  role: 'user' | 'model';
  text: string;
}

async function generateTutorReplyWithModel(
  ai: GoogleGenAI,
  model: string,
  turns: TutorTurnInput[]
): Promise<string> {
  const contents = turns.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  const isPrimaryHydrogen = model === PRIMARY_TUTOR_MODEL;
  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
      ...(isPrimaryHydrogen
        ? {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
          }
        : {}),
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('O tutor não devolveu resposta.');
  }
  return text;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/tts', async (req, res) => {
    const body = req.body as {
      text?: unknown;
      voiceName?: unknown;
      level?: unknown;
      language?: unknown;
    };

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const rawVoice = typeof body.voiceName === 'string' ? body.voiceName.trim() : 'Kore';
    const voiceName = VALID_VOICES.has(rawVoice) ? rawVoice : 'Kore';
    const level =
      body.level === 'A' || body.level === 'B' || body.level === 'C' ? body.level : 'C';
    const language =
      typeof body.language === 'string' && body.language.trim() ? body.language.trim() : 'pt-PT';

    if (!text || text.length > 2000) {
      res.status(400).json({ error: 'Texto inválido para síntese de voz.', code: 'INVALID_TEXT' });
      return;
    }

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Serviço de voz Gemini não configurado.',
        code: 'API_KEY_MISSING',
      });
      return;
    }

    const style = buildSpeechStyle(level, language);
    const modelsToTry = [PRIMARY_TTS_MODEL, PRIMARY_TTS_MODEL, LIGHT_FALLBACK_TTS_MODEL];

    let lastError: unknown = null;

    for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
      const model = modelsToTry[attempt];
      try {
        if (attempt === 1) {
          await sleep(600);
        } else if (attempt === 2) {
          await sleep(400);
        }
        const audioBase64 = await generateAudioWithModel(ai, model, text, voiceName, style);
        res.json({
          audioBase64,
          mimeType: 'audio/wav',
          modelUsed: model,
        });
        return;
      } catch (err) {
        lastError = err;
        if (!isRetryableError(err) && attempt === 0) {
          // Mesmo em erros não transitórios do modelo principal, tentar o modelo mais leve
          attempt = 1;
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : 'Erro desconhecido no TTS';
    const status = (lastError as { status?: number })?.status;
    res.status(status === 429 ? 429 : 503).json({
      error: message,
      code: status === 429 ? 'QUOTA_EXCEEDED' : 'TTS_UNAVAILABLE',
    });
  });

  app.post('/api/tutor', async (req, res) => {
    const body = req.body as {
      messages?: unknown;
      helpLevel?: unknown;
    };

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({
        error: 'Histórico de conversa inválido.',
        code: 'INVALID_HISTORY',
      });
      return;
    }

    const sanitizedTurns: TutorTurnInput[] = body.messages
      .filter(
        (m): m is { role: unknown; text: unknown } =>
          !!m && typeof m === 'object' && 'role' in m && 'text' in m
      )
      .map((m): TutorTurnInput => ({
        role: m.role === 'model' ? 'model' : 'user',
        text: typeof m.text === 'string' ? m.text.trim().slice(0, 2000) : '',
      }))
      .filter((m) => m.text.length > 0)
      .slice(-24);

    if (sanitizedTurns.length === 0 || sanitizedTurns[sanitizedTurns.length - 1].role !== 'user') {
      res.status(400).json({
        error: 'A última mensagem deve ser do aluno.',
        code: 'INVALID_LAST_TURN',
      });
      return;
    }

    const helpLevelRaw = typeof body.helpLevel === 'number' ? body.helpLevel : 1;
    const helpLevel = Math.min(4, Math.max(1, Math.round(helpLevelRaw)));

    // Acrescentar apenas uma nota discreta na última mensagem do utilizador para alinhar o nível de ajuda (1..4)
    const turnsWithLevel = sanitizedTurns.map((turn, idx) => {
      if (idx === sanitizedTurns.length - 1) {
        return {
          role: turn.role,
          text: `${turn.text}\n\n[Nível de ajuda socrática atual nesta conversa: ${helpLevel} de 4. Mantém resposta <= 60 palavras, uma única pergunta, em texto simples sem LaTeX.]`,
        };
      }
      return turn;
    });

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Chave Gemini não configurada no servidor.',
        code: 'API_KEY_MISSING',
      });
      return;
    }

    const modelsToTry = [PRIMARY_TUTOR_MODEL, PRIMARY_TUTOR_MODEL, LIGHT_FALLBACK_TUTOR_MODEL];
    let lastError: unknown = null;

    for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
      const model = modelsToTry[attempt];
      try {
        if (attempt === 1) {
          await sleep(500);
        } else if (attempt === 2) {
          await sleep(300);
        }
        const reply = await generateTutorReplyWithModel(ai, model, turnsWithLevel);
        res.json({
          reply,
          modelUsed: model,
        });
        return;
      } catch (err) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Tutor] Tentativa ${attempt + 1} (${model}) falhou:`, errMsg);
        if ((!isRetryableError(err) || /abort|timeout/i.test(errMsg)) && attempt === 0) {
          // Em timeout ou erro não transitório do modelo principal, avançar logo para o modelo mais leve
          attempt = 1;
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : 'Erro desconhecido no tutor';
    const status = (lastError as { status?: number })?.status;
    res.status(status === 429 ? 429 : 503).json({
      error: message,
      code: status === 429 ? 'QUOTA_EXCEEDED' : 'TUTOR_UNAVAILABLE',
    });
  });

  const distPath = path.join(__dirname, 'dist');
  const useProdStatic =
    process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distPath, 'index.html'));

  if (!useProdStatic) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Ponte WebSocket para diálogo falado em tempo real (Gemini Live API)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const reqUrl = request.url || '';
    const pathname = reqUrl.split('?')[0];
    if (pathname === '/api/tutor-live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket, request) => {
    const ai = createGeminiClient();
    if (!ai) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message: 'Chave Gemini não configurada no servidor.',
        })
      );
      clientWs.close();
      return;
    }

    const parsedUrl = new URL(request.url || '/api/tutor-live', `http://localhost:${PORT}`);
    const requestedVoice = parsedUrl.searchParams.get('voice') || 'Kore';
    const liveVoice = VALID_LIVE_VOICES.has(requestedVoice)
      ? requestedVoice
      : requestedVoice === 'Aoede'
      ? 'Zephyr'
      : 'Kore';

    let closed = false;
    let liveSession: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
    const pendingMessages: Array<{ type?: string; audio?: string; text?: string }> = [];

    const safeSend = (payload: Record<string, unknown>) => {
      if (!closed && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    const forwardToLiveSession = (
      session: Awaited<ReturnType<typeof ai.live.connect>>,
      msg: { type?: string; audio?: string; text?: string }
    ) => {
      if (msg.type === 'audio' && typeof msg.audio === 'string' && msg.audio.length > 0) {
        session.sendRealtimeInput({
          audio: {
            data: msg.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      } else if (msg.type === 'text' && typeof msg.text === 'string' && msg.text.trim()) {
        session.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [{ text: msg.text.trim().slice(0, 2000) }],
            },
          ],
          turnComplete: true,
        });
      }
    };

    clientWs.on('message', (raw) => {
      if (closed) return;
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: string;
          audio?: string;
          text?: string;
        };
        if (liveSession) {
          forwardToLiveSession(liveSession, msg);
        } else {
          pendingMessages.push(msg);
        }
      } catch {
        // Ignorar frames malformados
      }
    });

    try {
      const session = await ai.live.connect({
        model: LIVE_TUTOR_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: liveVoice,
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;
            if (!content) return;

            if (content.inputTranscription?.text) {
              safeSend({
                type: 'inputTranscript',
                text: content.inputTranscription.text,
              });
            }

            if (content.outputTranscription?.text) {
              safeSend({
                type: 'outputTranscript',
                text: content.outputTranscription.text,
              });
            }

            for (const part of content.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                safeSend({
                  type: 'audio',
                  data: part.inlineData.data,
                });
              }
            }

            if (content.interrupted) {
              safeSend({ type: 'interrupted' });
            }

            if (content.turnComplete) {
              safeSend({ type: 'turnComplete' });
            }
          },
          onerror: (err) => {
            console.warn('[Tutor Live] Erro na sessão Live:', err);
            safeSend({
              type: 'error',
              message:
                'A ligação de voz em tempo real falhou ou foi interrompida. Podes tentar novamente ou continuar por escrito.',
            });
          },
          onclose: () => {
            if (!closed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
        },
      });

      if (closed) {
        session.close();
        return;
      }

      liveSession = session;
      while (pendingMessages.length > 0) {
        const queued = pendingMessages.shift();
        if (queued) forwardToLiveSession(session, queued);
      }
      safeSend({ type: 'ready', model: LIVE_TUTOR_MODEL, voice: liveVoice });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Tutor Live] Falha ao iniciar Gemini Live:', msg);
      safeSend({
        type: 'error',
        message:
          'Não foi possível iniciar o diálogo em voz em tempo real neste momento. Tenta novamente ou usa o chat escrito.',
      });
      clientWs.close();
      return;
    }

    const cleanup = () => {
      if (closed) return;
      closed = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // Ignorar erro ao fechar sessão
        }
        liveSession = null;
      }
    };

    clientWs.on('close', cleanup);
    clientWs.on('error', cleanup);
  });

  server.on('error', (err) => {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('Falha crítica no arranque do servidor:', err);
  process.exit(1);
});
