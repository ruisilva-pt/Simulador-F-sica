import React, { useState } from 'react';
import {
  calculateProjectileResults,
  formatPtNumber,
  formatSI,
  getKinematicInstant,
} from '../../physics/projectile';
import { ProjectileParams } from '../../types/physics';

interface KinematicGraphsProps {
  params: ProjectileParams;
  currentTime: number;
}

type GraphTab = 'all' | 'pos' | 'vel';

export const KinematicGraphs: React.FC<KinematicGraphsProps> = ({ params, currentTime }) => {
  const [activeTab, setActiveTab] = useState<GraphTab>('all');
  const results = calculateProjectileResults(params);

  const tTotal = Math.max(0.1, results.tFlight);
  const currentInstant = getKinematicInstant(params, currentTime, tTotal);

  // Amostragem para as curvas
  const pointsCount = 60;
  const tStep = tTotal / pointsCount;
  const timePoints: number[] = [];
  for (let i = 0; i <= pointsCount; i++) {
    timePoints.push(Math.min(i * tStep, tTotal));
  }

  // Dimensões SVG dos mini-gráficos
  const width = 320;
  const height = 150;
  const padLeft = 45;
  const padBottom = 28;
  const padTop = 15;
  const padRight = 15;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Função para desenhar um gráfico individual
  const renderPlot = (
    title: string,
    yLabel: string,
    unitY: string,
    yMin: number,
    yMax: number,
    dataFn: (t: number) => number,
    color: string,
    currentValue: number
  ) => {
    // Normalização com folga visual
    const spanY = yMax - yMin === 0 ? 1 : yMax - yMin;
    const safeMinY = yMin - spanY * 0.08;
    const safeMaxY = yMax + spanY * 0.08;
    const safeSpanY = safeMaxY - safeMinY;

    const toSvgX = (t: number) => padLeft + (t / tTotal) * plotW;
    const toSvgY = (yVal: number) => height - padBottom - ((yVal - safeMinY) / safeSpanY) * plotH;

    // Gerar string de caminho SVG (Path)
    const pathD = timePoints
      .map((t, idx) => {
        const x = toSvgX(t);
        const y = toSvgY(dataFn(t));
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const curX = toSvgX(Math.min(currentTime, tTotal));
    const curY = toSvgY(currentValue);

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col shadow-md">
        <div className="flex items-center justify-between mb-1 text-xs">
          <span className="font-semibold text-slate-200">{title}</span>
          <span className="font-mono text-[11px] text-teal-400 font-medium">
            {formatPtNumber(currentValue, 2)} {unitY}
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Fundo do gráfico */}
          <rect
            x={padLeft}
            y={padTop}
            width={plotW}
            height={plotH}
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Linha zero de referência (se estiver no intervalo) */}
          {safeMinY < 0 && safeMaxY > 0 && (
            <line
              x1={padLeft}
              y1={toSvgY(0)}
              x2={width - padRight}
              y2={toSvgY(0)}
              stroke="#334155"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          )}

          {/* Curva física teórica */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />

          {/* Ponto / Cursor de tempo atual */}
          <circle cx={curX} cy={curY} r="4" fill="#ffffff" stroke={color} strokeWidth="2" />
          <line
            x1={curX}
            y1={padTop}
            x2={curX}
            y2={height - padBottom}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeDasharray="2 2"
          />

          {/* Eixos e rótulos */}
          <text
            x={padLeft - 6}
            y={toSvgY(yMax)}
            fill="#94a3b8"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            {formatPtNumber(yMax, 1)}
          </text>
          <text
            x={padLeft - 6}
            y={toSvgY(yMin)}
            fill="#94a3b8"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            {formatPtNumber(yMin, 1)}
          </text>

          <text
            x={width - padRight}
            y={height - padBottom + 16}
            fill="#94a3b8"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            {formatPtNumber(tTotal, 2)} s
          </text>
          <text
            x={padLeft}
            y={height - padBottom + 16}
            fill="#94a3b8"
            fontSize="9"
            textAnchor="start"
            fontFamily="monospace"
          >
            0 s
          </text>

          {/* Rótulo de grandeza no eixo Y */}
          <text
            x={padLeft - 24}
            y={padTop + plotH / 2}
            fill="#64748b"
            fontSize="10"
            textAnchor="middle"
            transform={`rotate(-90 ${padLeft - 24} ${padTop + plotH / 2})`}
          >
            {yLabel}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Abas de seleção de vista dos gráficos */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">
          Cinemática Gráfica em Tempo Real
        </h4>
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos (4)
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === 'pos'
                ? 'bg-teal-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Posição: x(t) & y(t)
          </button>
          <button
            onClick={() => setActiveTab('vel')}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === 'vel'
                ? 'bg-teal-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Velocidade: vx(t) & vy(t)
          </button>
        </div>
      </div>

      {/* Grelha de Gráficos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(activeTab === 'all' || activeTab === 'pos') && (
          <>
            {renderPlot(
              'Posição Horizontal: x(t)',
              'x / m',
              'm',
              0,
              Math.max(1, results.range),
              (t) => getKinematicInstant(params, t, tTotal).x,
              '#38bdf8', // Sky
              currentInstant.x
            )}
            {renderPlot(
              'Posição Vertical: y(t)',
              'y / m',
              'm',
              0,
              Math.max(1, results.maxHeight),
              (t) => getKinematicInstant(params, t, tTotal).y,
              '#14b8a6', // Teal
              currentInstant.y
            )}
          </>
        )}

        {(activeTab === 'all' || activeTab === 'vel') && (
          <>
            {renderPlot(
              'Componente Horizontal da Velocidade: vx(t)',
              'vx / m·s⁻¹',
              'm/s',
              Math.min(0, results.v0x * 0.9),
              Math.max(5, results.v0x * 1.1),
              (t) => getKinematicInstant(params, t, tTotal).vx,
              '#818cf8', // Indigo
              currentInstant.vx
            )}
            {renderPlot(
              'Componente Vertical da Velocidade: vy(t)',
              'vy / m·s⁻¹',
              'm/s',
              Math.min(-5, results.vImpactY),
              Math.max(5, results.v0y),
              (t) => getKinematicInstant(params, t, tTotal).vy,
              '#fb923c', // Orange
              currentInstant.vy
            )}
          </>
        )}
      </div>
    </div>
  );
};
