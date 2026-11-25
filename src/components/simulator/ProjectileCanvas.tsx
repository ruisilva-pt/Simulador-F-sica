import React, { useEffect, useRef, useState } from 'react';
import {
  calculateProjectileResults,
  formatPtNumber,
  formatSI,
  generateStroboscopicPoints,
  generateTrajectoryPoints,
  getKinematicInstant,
} from '../../physics/projectile';
import { KinematicInstant, ProjectileParams } from '../../types/physics';
import { Eye, Layers, Maximize2, Pause, Play, RotateCcw, Zap } from 'lucide-react';

interface ProjectileCanvasProps {
  params: ProjectileParams;
  comparisonParams: ProjectileParams | null;
  showStroboscopic: boolean;
  showVectors: boolean;
  target?: {
    distance: number;
    tolerancePercent: number;
  } | null;
  onInstantUpdate?: (instant: KinematicInstant, isFinished: boolean) => void;
  onLaunchComplete?: (finalRange: number) => void;
  isSimulating: boolean;
  setIsSimulating: (simulating: boolean) => void;
  onReset: () => void;
  onLaunch: () => void;
}

export const ProjectileCanvas: React.FC<ProjectileCanvasProps> = ({
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

  // Animação e estado do tempo
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Cálculos teóricos
  const currentResults = calculateProjectileResults(params);
  const compResults = comparisonParams ? calculateProjectileResults(comparisonParams) : null;

  // Manter referência estável aos callbacks
  const onInstantUpdateRef = useRef(onInstantUpdate);
  onInstantUpdateRef.current = onInstantUpdate;
  const onLaunchCompleteRef = useRef(onLaunchComplete);
  onLaunchCompleteRef.current = onLaunchComplete;

  const hasCompletedLaunchRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);

  // Efeito para iniciar ou reiniciar o lançamento
  useEffect(() => {
    if (isSimulating) {
      setCurrentTime(0);
      currentTimeRef.current = 0;
      hasCompletedLaunchRef.current = false;
      setIsPaused(false);
      lastTimeRef.current = null;
    }
  }, [isSimulating]);

  // Loop de animação do Canvas
  useEffect(() => {
    if (!isSimulating || isPaused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const tFlight = currentResults.tFlight;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const deltaSeconds = ((timestamp - lastTimeRef.current) / 1000) * speedMultiplier;
      lastTimeRef.current = timestamp;

      const nextTime = currentTimeRef.current + deltaSeconds;

      if (nextTime >= tFlight) {
        currentTimeRef.current = tFlight;
        setCurrentTime(tFlight);
        if (!hasCompletedLaunchRef.current) {
          hasCompletedLaunchRef.current = true;
          setIsSimulating(false);
          const finalInstant = getKinematicInstant(params, tFlight, tFlight);
          onInstantUpdateRef.current?.(finalInstant, true);
          onLaunchCompleteRef.current?.(currentResults.range);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      } else {
        currentTimeRef.current = nextTime;
        setCurrentTime(nextTime);
        const instant = getKinematicInstant(params, nextTime, tFlight);
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
  }, [isSimulating, isPaused, speedMultiplier, currentResults.tFlight, params]);

  // Renderização gráfica em Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolução nítida para telas de alta densidade (Retina/DPI)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Margens e área útil
    const marginLeft = 65;
    const marginBottom = 45;
    const marginTop = 30;
    const marginRight = 35;

    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    // Determinar limites físicos máximos para auto-escala
    const maxPhysicalX = Math.max(
      30,
      currentResults.range * 1.15,
      compResults ? compResults.range * 1.15 : 0,
      target ? target.distance * 1.2 : 0
    );

    const maxPhysicalY = Math.max(
      15,
      params.y0 * 1.25,
      currentResults.maxHeight * 1.25,
      comparisonParams ? comparisonParams.y0 * 1.25 : 0,
      compResults ? compResults.maxHeight * 1.25 : 0
    );

    // Funções de conversão métrica (m) -> píxel no canvas
    const toCanvasX = (xMeters: number) => marginLeft + (xMeters / maxPhysicalX) * plotWidth;
    const toCanvasY = (yMeters: number) => height - marginBottom - (yMeters / maxPhysicalY) * plotHeight;

    // Limpar fundo
    ctx.fillStyle = '#090d16'; // Fundo escuro azul-ardósia de alto contraste
    ctx.fillRect(0, 0, width, height);

    // Grade métrica (Grid)
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b'; // Slate 800
    ctx.fillStyle = '#64748b'; // Slate 500
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';

    // Intervalo inteligente para linhas de grelha
    const stepX = maxPhysicalX > 150 ? 50 : maxPhysicalX > 70 ? 20 : maxPhysicalX > 30 ? 10 : 5;
    const stepY = maxPhysicalY > 70 ? 20 : maxPhysicalY > 30 ? 10 : 5;

    // Linhas verticais da grelha
    for (let x = 0; x <= maxPhysicalX; x += stepX) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, marginTop);
      ctx.lineTo(cx, height - marginBottom);
      ctx.stroke();

      // Legenda do eixo X (em metros)
      ctx.textAlign = 'center';
      ctx.fillText(`${x} m`, cx, height - marginBottom + 18);
    }

    // Linhas horizontais da grelha
    for (let y = 0; y <= maxPhysicalY; y += stepY) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(marginLeft, cy);
      ctx.lineTo(width - marginRight, cy);
      ctx.stroke();

      // Legenda do eixo Y
      ctx.textAlign = 'right';
      ctx.fillText(`${y} m`, marginLeft - 10, cy + 4);
    }

    // Linha do solo (Eixo Ox)
    const groundY = toCanvasY(0);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#10b981'; // Verde relva brilhante
    ctx.beginPath();
    ctx.moveTo(marginLeft - 10, groundY);
    ctx.lineTo(width - marginRight + 10, groundY);
    ctx.stroke();

    // Textura do solo
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(marginLeft - 10, groundY, plotWidth + 20, marginBottom);

    // Eixo Oy
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop - 10);
    ctx.lineTo(marginLeft, groundY);
    ctx.stroke();

    // Marcador do Alvo (se existir no modo Desafio)
    if (target && target.distance > 0) {
      const targetCanvasX = toCanvasX(target.distance);
      const tolMeters = (target.distance * target.tolerancePercent) / 100;
      const tolLeftX = toCanvasX(target.distance - tolMeters);
      const tolRightX = toCanvasX(target.distance + tolMeters);

      // Zona de tolerância sombreada no chão
      ctx.fillStyle = 'rgba(234, 179, 8, 0.2)'; // Amarelo translúcido
      ctx.fillRect(tolLeftX, groundY, Math.max(4, tolRightX - tolLeftX), 12);
      ctx.strokeStyle = '#eab308';
      ctx.strokeRect(tolLeftX, groundY, Math.max(4, tolRightX - tolLeftX), 12);

      // Bandeira / Alvo
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ef4444'; // Vermelho
      ctx.beginPath();
      ctx.moveTo(targetCanvasX, groundY);
      ctx.lineTo(targetCanvasX, groundY - 32);
      ctx.stroke();

      // Flâmula do alvo
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(targetCanvasX, groundY - 32);
      ctx.lineTo(targetCanvasX + 16, groundY - 24);
      ctx.lineTo(targetCanvasX, groundY - 16);
      ctx.closePath();
      ctx.fill();

      // Círculo concêntrico de alvo no solo
      ctx.beginPath();
      ctx.arc(targetCanvasX, groundY + 5, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Rótulo da distância do alvo
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Alvo: ${formatPtNumber(target.distance, 1)} m`, targetCanvasX, groundY - 38);
    }

    // Trajetória de Comparação (se ativa - Cor Âmbar)
    if (comparisonParams && compResults) {
      const compPoints = generateTrajectoryPoints(comparisonParams, 100);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f59e0b'; // Amber 500
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      compPoints.forEach((p, idx) => {
        const px = toCanvasX(p.x);
        const py = toCanvasY(p.y);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Ponto de impacto de comparação
      const compLandingX = toCanvasX(compResults.range);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(compLandingX, groundY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Trajetória do Lançamento Atual (Cor Teal / Ciano)
    const currentPoints = generateTrajectoryPoints(params, 120);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#14b8a6'; // Teal 500
    ctx.setLineDash([]);
    ctx.beginPath();
    currentPoints.forEach((p, idx) => {
      const px = toCanvasX(p.x);
      const py = toCanvasY(p.y);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Rasto Estroboscópico (se ativado pelo utilizador)
    if (showStroboscopic) {
      const dtStrobe = Math.max(0.15, currentResults.tFlight / 14);
      const strobePoints = generateStroboscopicPoints(params, dtStrobe);
      strobePoints.forEach((sp) => {
        const sx = toCanvasX(sp.x);
        const sy = toCanvasY(sp.y);

        // Halo suave
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45, 212, 191, 0.25)';
        ctx.fill();

        // Ponto central
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#5eead4';
        ctx.fill();

        // Rótulo de instante t
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${formatPtNumber(sp.t, 2)}s`, sx, sy - 8);
      });
    }

    // Torre / Plataforma de lançamento inicial (y0)
    if (params.y0 > 0) {
      const platformX = toCanvasX(0);
      const platformTopY = toCanvasY(params.y0);

      // Pilar da bancada
      ctx.fillStyle = '#334155'; // Slate 700
      ctx.fillRect(platformX - 16, platformTopY, 16, groundY - platformTopY);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(platformX - 16, platformTopY, 16, groundY - platformTopY);

      // Marcador de altura
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`y₀=${formatPtNumber(params.y0, 1)}m`, platformX - 20, platformTopY + 12);
    }

    // Canhão de lançamento (mostra a inclinação do ângulo)
    const launchOriginX = toCanvasX(0);
    const launchOriginY = toCanvasY(params.y0);
    const barrelLength = 26;
    const barrelRad = (params.angleDeg * Math.PI) / 180;
    const barrelEndX = launchOriginX + Math.cos(barrelRad) * barrelLength;
    const barrelEndY = launchOriginY - Math.sin(barrelRad) * barrelLength;

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0284c7'; // Azul vibrante
    ctx.beginPath();
    ctx.moveTo(launchOriginX, launchOriginY);
    ctx.lineTo(barrelEndX, barrelEndY);
    ctx.stroke();

    // Base circular do canhão
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(launchOriginX, launchOriginY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Posição atual do projétil durante o voo
    const effectiveT = isSimulating ? currentTime : 0;
    const currentInstant = getKinematicInstant(params, effectiveT, currentResults.tFlight);
    const projCanvasX = toCanvasX(currentInstant.x);
    const projCanvasY = toCanvasY(currentInstant.y);

    // Vetores de velocidade (se ativados)
    if (showVectors && currentInstant.v > 0.05) {
      // Fator de escala visual para os vetores (píxeis por m/s)
      const vectorScale = Math.min(2.8, Math.max(1.2, 55 / Math.max(15, params.v0)));

      const vxPix = currentInstant.vx * vectorScale;
      // No canvas, Oy aponta para baixo, logo invertemos o sinal de vy
      const vyPix = -currentInstant.vy * vectorScale;

      // Componente Horizontal vx (azul claro pontilhado)
      if (Math.abs(currentInstant.vx) > 0.1) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(projCanvasX, projCanvasY);
        ctx.lineTo(projCanvasX + vxPix, projCanvasY);
        ctx.stroke();

        // Seta vx
        drawArrowHead(ctx, projCanvasX, projCanvasY, projCanvasX + vxPix, projCanvasY, '#38bdf8');
      }

      // Componente Vertical vy (laranja pontilhado)
      if (Math.abs(currentInstant.vy) > 0.1) {
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(projCanvasX, projCanvasY);
        ctx.lineTo(projCanvasX, projCanvasY + vyPix);
        ctx.stroke();

        // Seta vy
        drawArrowHead(ctx, projCanvasX, projCanvasY, projCanvasX, projCanvasY + vyPix, '#fb923c');
      }

      ctx.setLineDash([]);

      // Vetor Velocidade Total v (linha contínua verde/esmeralda com seta)
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(projCanvasX, projCanvasY);
      ctx.lineTo(projCanvasX + vxPix, projCanvasY + vyPix);
      ctx.stroke();
      drawArrowHead(ctx, projCanvasX, projCanvasY, projCanvasX + vxPix, projCanvasY + vyPix, '#22c55e');
    }

    // Projétil (esfera vermelha/laranja brilhante com iluminação 3D)
    const gradient = ctx.createRadialGradient(
      projCanvasX - 3,
      projCanvasY - 3,
      2,
      projCanvasX,
      projCanvasY,
      8
    );
    gradient.addColorStop(0, '#fca5a5');
    gradient.addColorStop(0.5, '#ef4444');
    gradient.addColorStop(1, '#991b1b');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(projCanvasX, projCanvasY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ponto de aterragem final previsto
    const finalLandingX = toCanvasX(currentResults.range);
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(finalLandingX, groundY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Marcador de altura máxima
    const maxH_X = toCanvasX(currentInstant.vx * currentResults.tMaxHeight);
    const maxH_Y = toCanvasY(currentResults.maxHeight);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(maxH_X, groundY);
    ctx.lineTo(maxH_X, maxH_Y);
    ctx.stroke();
    ctx.setLineDash([]);
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

  // Auxiliar para desenhar cabeça de seta em vetores
  const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string
  ) => {
    const headLength = 7;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
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

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Barra de Ferramentas Superior do Canvas */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">Plano Balístico 2D (Escala Métrica)</span>
          <span className="text-slate-500 font-mono text-[11px]">| g = {formatPtNumber(params.g, 1)} m/s²</span>
        </div>

        {/* Controlos de Visualização e Velocidade */}
        <div className="flex items-center space-x-2 mt-1 sm:mt-0">
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setSpeedMultiplier(0.5)}
              className={`px-2 py-0.5 text-xs rounded transition ${
                speedMultiplier === 0.5
                  ? 'bg-teal-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Câmara Lenta (0,5x)"
            >
              0,5x
            </button>
            <button
              onClick={() => setSpeedMultiplier(1)}
              className={`px-2 py-0.5 text-xs rounded transition ${
                speedMultiplier === 1
                  ? 'bg-teal-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Velocidade Normal (1x)"
            >
              1x
            </button>
            <button
              onClick={() => setSpeedMultiplier(2)}
              className={`px-2 py-0.5 text-xs rounded transition ${
                speedMultiplier === 2
                  ? 'bg-teal-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Velocidade Acelerada (2x)"
            >
              2x
            </button>
          </div>

          {comparisonParams && compResults && (
            <div className="flex flex-wrap items-center space-x-2 px-2.5 py-1 rounded bg-amber-950/70 border border-amber-600/50 text-amber-300 font-mono text-[11px]">
              <span className="w-2.5 h-0.5 bg-amber-400"></span>
              <span className="font-bold text-amber-200">Comparação ativa:</span>
              <span>X = {formatPtNumber(compResults.range, 1)} m</span>
              <span>|</span>
              <span>y_máx = {formatPtNumber(compResults.maxHeight, 1)} m</span>
              <span>|</span>
              <span>t_voo = {formatPtNumber(compResults.tFlight, 2)} s</span>
            </div>
          )}
        </div>
      </div>

      {/* Área do Canvas Interativo */}
      <div className="relative w-full h-[380px] sm:h-[460px] bg-slate-950">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

        {/* Legenda de Vetores e Cores no Canto */}
        {showVectors && (
          <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-sm border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 pointer-events-none shadow-lg">
            <div className="font-semibold text-slate-100 mb-1 border-b border-slate-800 pb-0.5">
              Vetores de Velocidade:
            </div>
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400"></span>
              <span>v (Módulo)</span>
            </div>
            <div className="flex items-center space-x-2 text-sky-400">
              <span className="w-3 h-0.5 bg-sky-400"></span>
              <span>vx = v₀ cos(θ)</span>
            </div>
            <div className="flex items-center space-x-2 text-orange-400">
              <span className="w-3 h-0.5 bg-orange-400"></span>
              <span>vy = v₀ sen(θ) - gt</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra Inferior com Botões de Ação Imediata: Lançar, Pausar e Repor */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950 border-t border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTogglePlayPause}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-semibold text-sm transition shadow-lg ${
              isSimulating
                ? isPaused
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-amber-600/90 hover:bg-amber-500 text-white'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            {isSimulating ? (
              isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Retomar Voo</span>
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
                <span>Lançar Projétil</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repor</span>
          </button>
        </div>

        {/* Telemetria Compacta de Destaque */}
        <div className="flex items-center space-x-4 font-mono text-xs text-slate-300">
          <div>
            <span className="text-slate-500">t:</span>{' '}
            <span className="text-teal-400 font-bold">
              {formatPtNumber(isSimulating ? currentTime : currentResults.tFlight, 2)} s
            </span>
          </div>
          <div>
            <span className="text-slate-500">Alcance (X):</span>{' '}
            <span className="text-amber-400 font-bold">{formatPtNumber(currentResults.range, 1)} m</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-500">y_máx:</span>{' '}
            <span className="text-sky-400 font-bold">{formatPtNumber(currentResults.maxHeight, 1)} m</span>
          </div>
        </div>
      </div>
    </div>
  );
};
