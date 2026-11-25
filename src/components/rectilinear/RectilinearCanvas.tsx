import React, { useEffect, useRef, useState } from 'react';
import {
  calculateRectilinearResults,
  generateRectilinearStrobePoints,
  getRectilinearInstant,
} from '../../physics/rectilinear';
import { formatPtNumber } from '../../physics/projectile';
import { RectilinearInstant, RectilinearParams } from '../../types/rectilinear';
import { Pause, Play, RotateCcw } from 'lucide-react';

interface RectilinearCanvasProps {
  params: RectilinearParams;
  comparisonParams: RectilinearParams | null;
  showStroboscopic: boolean;
  showVectors: boolean;
  target?: {
    distance: number;
    tolerancePercent: number;
  } | null;
  onInstantUpdate?: (instant: RectilinearInstant, isFinished: boolean) => void;
  onLaunchComplete?: (finalX: number) => void;
  isSimulating: boolean;
  setIsSimulating: (simulating: boolean) => void;
  onReset: () => void;
  onLaunch: () => void;
}

export const RectilinearCanvas: React.FC<RectilinearCanvasProps> = ({
  params,
  comparisonParams,
  showStroboscopic,
  showVectors,
  target,
  onInstantUpdate,
  onLaunchComplete,
  isSimulating,
  setIsSimulating,
  onReset,
  onLaunch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const hasCompletedRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);

  const currentResults = calculateRectilinearResults(params);
  const compResults = comparisonParams ? calculateRectilinearResults(comparisonParams) : null;

  const onInstantUpdateRef = useRef(onInstantUpdate);
  onInstantUpdateRef.current = onInstantUpdate;
  const onLaunchCompleteRef = useRef(onLaunchComplete);
  onLaunchCompleteRef.current = onLaunchComplete;

  useEffect(() => {
    if (isSimulating) {
      setCurrentTime(0);
      currentTimeRef.current = 0;
      hasCompletedRef.current = false;
      setIsPaused(false);
      lastTimeRef.current = null;
    }
  }, [isSimulating]);

  // Se os parâmetros mudarem fora de simulação, repor t = 0 visualmente
  useEffect(() => {
    if (!isSimulating && currentTimeRef.current > params.tMax) {
      currentTimeRef.current = 0;
      setCurrentTime(0);
    }
  }, [params, isSimulating]);

  // Loop de animação
  useEffect(() => {
    if (!isSimulating || isPaused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const totalT = currentResults.tMax;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const deltaSeconds = ((timestamp - lastTimeRef.current) / 1000) * speedMultiplier;
      lastTimeRef.current = timestamp;

      const nextTime = currentTimeRef.current + deltaSeconds;
      if (nextTime >= totalT) {
        currentTimeRef.current = totalT;
        setCurrentTime(totalT);
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setIsSimulating(false);
          const finalInstant = getRectilinearInstant(params, totalT);
          onInstantUpdateRef.current?.(finalInstant, true);
          onLaunchCompleteRef.current?.(currentResults.finalX);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      } else {
        currentTimeRef.current = nextTime;
        setCurrentTime(nextTime);
        const instant = getRectilinearInstant(params, nextTime);
        onInstantUpdateRef.current?.(instant, false);
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isSimulating, isPaused, speedMultiplier, currentResults.tMax, params, setIsSimulating, currentResults.finalX]);

  // Desenho no Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const marginLeft = 40;
    const marginRight = 40;
    const plotWidth = width - marginLeft - marginRight;

    // Limites físicos auto-ajustáveis ao longo do eixo Ox
    let minX = Math.min(0, currentResults.minX, compResults ? compResults.minX : 0);
    let maxX = Math.max(20, currentResults.maxX, compResults ? compResults.maxX : 0);

    if (target) {
      minX = Math.min(minX, target.distance);
      maxX = Math.max(maxX, target.distance);
    }

    const span = Math.max(20, maxX - minX);
    const padX = span * 0.12;
    const domainMin = Math.floor((minX - padX) / 5) * 5;
    const domainMax = Math.ceil((maxX + padX) / 5) * 5;
    const domainSpan = Math.max(10, domainMax - domainMin);

    const toCanvasX = (xMeters: number) =>
      marginLeft + ((xMeters - domainMin) / domainSpan) * plotWidth;

    // Limpar fundo
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Calcular passo da régua métrica
    const rawStep = domainSpan / 8;
    const step =
      rawStep > 50
        ? 50
        : rawStep > 25
        ? 25
        : rawStep > 10
        ? 10
        : rawStep > 5
        ? 5
        : 2;

    const firstTick = Math.ceil(domainMin / step) * step;

    // Posições verticais das pistas
    const mainTrackY = comparisonParams ? height * 0.44 : height * 0.54;
    const compTrackY = height * 0.72;
    const rulerY = height - 42;

    // Grelha vertical subtil
    ctx.lineWidth = 1;
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    for (let xVal = firstTick; xVal <= domainMax; xVal += step) {
      const cx = toCanvasX(xVal);
      ctx.strokeStyle = xVal === 0 ? '#475569' : '#1e293b';
      ctx.lineWidth = xVal === 0 ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(cx, 24);
      ctx.lineTo(cx, rulerY);
      ctx.stroke();

      // Marca da régua inferior
      ctx.fillStyle = xVal === 0 ? '#38bdf8' : '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(`${xVal} m`, cx, rulerY + 18);
    }

    // Rótulo de origem O
    if (domainMin <= 0 && domainMax >= 0) {
      const zeroX = toCanvasX(0);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('O (0 m)', zeroX, 18);
    }

    // Linha principal da régua graduada
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marginLeft - 10, rulerY);
    ctx.lineTo(width - marginRight + 10, rulerY);
    ctx.stroke();

    // Pista principal (carril)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(marginLeft - 10, mainTrackY + 12, plotWidth + 20, 6);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(marginLeft - 10, mainTrackY + 12, plotWidth + 20, 6);

    // Pista secundária (Comparação)
    if (comparisonParams && compResults) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(marginLeft - 10, compTrackY + 12, plotWidth + 20, 5);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Comparação (Fixado)', marginLeft, compTrackY - 22);
    }

    // Rasto de deslocamento percorrido na pista principal
    const effectiveT = isSimulating ? currentTime : currentTime > 0 ? currentTime : 0;
    const currentInstant = getRectilinearInstant(params, effectiveT);
    const startX = toCanvasX(params.x0);
    const currX = toCanvasX(currentInstant.x);

    // Barra de deslocamento Δx (azul/teal translúcido)
    ctx.fillStyle = 'rgba(20, 184, 166, 0.22)';
    const dispLeft = Math.min(startX, currX);
    const dispW = Math.abs(currX - startX);
    if (dispW > 1) {
      ctx.fillRect(dispLeft, mainTrackY + 4, dispW, 8);
    }

    // Ponto de partida x0
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(startX, mainTrackY - 26);
    ctx.lineTo(startX, mainTrackY + 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`x₀=${formatPtNumber(params.x0, 1)}m`, startX, mainTrackY - 30);

    // Marcador de inversão de marcha (se existir)
    if (currentResults.reversalX !== null && currentResults.reversalTime !== null) {
      const revX = toCanvasX(currentResults.reversalX);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(revX, mainTrackY + 15, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Inversão (${formatPtNumber(currentResults.reversalTime, 1)}s)`,
        revX,
        mainTrackY + 34
      );
    }

    // Alvo no Modo Desafio
    if (target) {
      const targetX = toCanvasX(target.distance);
      const refMag = Math.abs(target.distance) > 0.01 ? Math.abs(target.distance) : 10;
      const tolMeters = (refMag * target.tolerancePercent) / 100;
      const tolL = toCanvasX(target.distance - tolMeters);
      const tolR = toCanvasX(target.distance + tolMeters);

      ctx.fillStyle = 'rgba(234, 179, 8, 0.22)';
      ctx.fillRect(tolL, mainTrackY + 8, Math.max(4, tolR - tolL), 14);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.strokeRect(tolL, mainTrackY + 8, Math.max(4, tolR - tolL), 14);

      // Bandeira / Sensor alvo
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(targetX, mainTrackY + 12);
      ctx.lineTo(targetX, mainTrackY - 36);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(targetX, mainTrackY - 36);
      ctx.lineTo(targetX + 16, mainTrackY - 28);
      ctx.lineTo(targetX, mainTrackY - 20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Alvo: ${formatPtNumber(target.distance, 1)} m`, targetX, mainTrackY - 42);
    }

    // Rasto estroboscópico (10 intervalos iguais)
    if (showStroboscopic) {
      const strobePts = generateRectilinearStrobePoints(params, 10);
      strobePts.forEach((pt) => {
        const sx = toCanvasX(pt.x);
        ctx.beginPath();
        ctx.arc(sx, mainTrackY + 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, mainTrackY + 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      });
    }

    // Desenho do carrinho de comparação (se ativo)
    if (comparisonParams && compResults) {
      const compT = Math.min(effectiveT, comparisonParams.tMax);
      const compInst = getRectilinearInstant(comparisonParams, compT);
      const compCx = toCanvasX(compInst.x);

      if (showStroboscopic) {
        const compStrobe = generateRectilinearStrobePoints(comparisonParams, 10);
        compStrobe.forEach((pt) => {
          const sx = toCanvasX(pt.x);
          ctx.beginPath();
          ctx.arc(sx, compTrackY + 2, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.55)';
          ctx.fill();
        });
      }

      drawCart(ctx, compCx, compTrackY, '#f59e0b', '#fef3c7');
      ctx.fillStyle = '#fcd34d';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `x=${formatPtNumber(compInst.x, 1)}m | v=${formatPtNumber(compInst.v, 1)}m/s`,
        compCx,
        compTrackY - 14
      );
    }

    // Desenho do carrinho principal
    drawCart(ctx, currX, mainTrackY, '#14b8a6', '#ccfbf1');

    // Vetores velocidade e aceleração no carrinho principal
    if (showVectors) {
      // Vetor Velocidade v (Verde esmeralda)
      if (Math.abs(currentInstant.v) > 0.05) {
        const vScale = 3.2;
        const vPix = Math.max(-110, Math.min(110, currentInstant.v * vScale));
        const vY = mainTrackY - 14;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(currX, vY);
        ctx.lineTo(currX + vPix, vY);
        ctx.stroke();
        drawHorizontalArrowHead(ctx, currX + vPix, vY, currentInstant.v >= 0 ? 1 : -1, '#22c55e');

        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = currentInstant.v >= 0 ? 'left' : 'right';
        ctx.fillText(
          `v=${formatPtNumber(currentInstant.v, 1)} m/s`,
          currX + vPix + (currentInstant.v >= 0 ? 6 : -6),
          vY + 3
        );
      }

      // Vetor Aceleração a (Laranja)
      if (Math.abs(params.a) > 0.05) {
        const aScale = 6.5;
        const aPix = Math.max(-90, Math.min(90, params.a * aScale));
        const aY = mainTrackY - 28;
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(currX, aY);
        ctx.lineTo(currX + aPix, aY);
        ctx.stroke();
        drawHorizontalArrowHead(ctx, currX + aPix, aY, params.a >= 0 ? 1 : -1, '#fb923c');

        ctx.fillStyle = '#fdba74';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = params.a >= 0 ? 'left' : 'right';
        ctx.fillText(
          `a=${formatPtNumber(params.a, 1)} m/s²`,
          currX + aPix + (params.a >= 0 ? 6 : -6),
          aY + 3
        );
      }
    }
  }, [
    params,
    comparisonParams,
    currentResults,
    compResults,
    currentTime,
    isSimulating,
    showStroboscopic,
    showVectors,
    target,
  ]);

  const drawCart = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    trackY: number,
    bodyColor: string,
    highlightColor: string
  ) => {
    const cartW = 34;
    const cartH = 16;
    const x = cx - cartW / 2;
    const y = trackY - 6;

    // Carroçaria
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(x, y, cartW, cartH, 4);
    ctx.fill();
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rodas
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    [-10, 10].forEach((dx) => {
      ctx.beginPath();
      ctx.arc(cx + dx, trackY + 11, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  };

  const drawHorizontalArrowHead = (
    ctx: CanvasRenderingContext2D,
    tipX: number,
    tipY: number,
    dir: 1 | -1,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - dir * 7, tipY - 4);
    ctx.lineTo(tipX - dir * 7, tipY + 4);
    ctx.closePath();
    ctx.fill();
  };

  const handleTogglePlayPause = () => {
    if (!isSimulating) {
      onLaunch();
    } else {
      setIsPaused(!isPaused);
    }
  };

  const displayedInstant = getRectilinearInstant(
    params,
    isSimulating ? currentTime : currentTime > 0 ? currentTime : currentResults.tMax
  );

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Barra Superior */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs gap-2">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">
            Pista Retilínea 1D (Eixo Ox Graduado)
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            | {currentResults.regime === 'mru' ? 'MRU' : currentResults.regime === 'repouso' ? 'Repouso' : 'MRUA'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  speedMultiplier === spd
                    ? 'bg-amber-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {formatPtNumber(spd, 1)}x
              </button>
            ))}
          </div>

          {comparisonParams && compResults && (
            <div className="flex flex-wrap items-center space-x-2 px-2.5 py-1 rounded bg-amber-950/70 border border-amber-600/50 text-amber-300 font-mono text-[11px]">
              <span className="w-2.5 h-0.5 bg-amber-400"></span>
              <span className="font-bold text-amber-200">Comparação ativa:</span>
              <span>x_f = {formatPtNumber(compResults.finalX, 1)} m</span>
              <span>|</span>
              <span>d = {formatPtNumber(compResults.distanceTraveled, 1)} m</span>
              <span>|</span>
              <span>v_f = {formatPtNumber(compResults.finalV, 1)} m/s</span>
            </div>
          )}
        </div>
      </div>

      {/* Área do Canvas */}
      <div className="relative w-full h-[290px] sm:h-[330px] bg-slate-950">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {showVectors && (
          <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-sm border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 pointer-events-none shadow-lg">
            <div className="font-semibold text-slate-100 mb-1 border-b border-slate-800 pb-0.5">
              Vetores Instantâneos:
            </div>
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400"></span>
              <span>v(t) = v₀ + a·t</span>
            </div>
            <div className="flex items-center space-x-2 text-orange-400">
              <span className="w-3 h-0.5 bg-orange-400"></span>
              <span>a (constante)</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra Inferior */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950 border-t border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTogglePlayPause}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-semibold text-sm transition shadow-lg ${
              isSimulating
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            {isSimulating ? (
              isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Retomar</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pausar</span>
                </>
              )
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Movimento</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setCurrentTime(0);
              currentTimeRef.current = 0;
              onReset();
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repor</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 font-mono text-xs text-slate-300">
          <div>
            <span className="text-slate-500">t:</span>{' '}
            <span className="text-teal-400 font-bold">
              {formatPtNumber(displayedInstant.t, 2)} s
            </span>
          </div>
          <div>
            <span className="text-slate-500">x(t):</span>{' '}
            <span className="text-sky-400 font-bold">
              {formatPtNumber(displayedInstant.x, 1)} m
            </span>
          </div>
          <div>
            <span className="text-slate-500">v(t):</span>{' '}
            <span className="text-emerald-400 font-bold">
              {formatPtNumber(displayedInstant.v, 1)} m/s
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-500">Distância (d):</span>{' '}
            <span className="text-amber-400 font-bold">
              {formatPtNumber(displayedInstant.distanceTraveled, 1)} m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
