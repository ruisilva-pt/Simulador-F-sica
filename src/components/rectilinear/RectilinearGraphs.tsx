import React, { useState } from 'react';
import {
  calculateRectilinearResults,
  getRectilinearInstant,
  positionAtTime,
  velocityAtTime,
} from '../../physics/rectilinear';
import { formatPtNumber } from '../../physics/projectile';
import { RectilinearParams } from '../../types/rectilinear';

interface RectilinearGraphsProps {
  params: RectilinearParams;
  comparisonParams: RectilinearParams | null;
  currentTime: number;
}

type GraphTab = 'all' | 'pos' | 'vel_acc';

export const RectilinearGraphs: React.FC<RectilinearGraphsProps> = ({
  params,
  comparisonParams,
  currentTime,
}) => {
  const [activeTab, setActiveTab] = useState<GraphTab>('all');
  const results = calculateRectilinearResults(params);
  const compResults = comparisonParams ? calculateRectilinearResults(comparisonParams) : null;

  const tTotal = Math.max(0.5, results.tMax, comparisonParams ? comparisonParams.tMax : 0);
  const currentInstant = getRectilinearInstant(params, Math.min(currentTime, params.tMax));

  const pointsCount = 60;
  const timePoints: number[] = [];
  for (let i = 0; i <= pointsCount; i++) {
    timePoints.push((i / pointsCount) * params.tMax);
  }

  const compTimePoints: number[] = [];
  if (comparisonParams) {
    for (let i = 0; i <= pointsCount; i++) {
      compTimePoints.push((i / pointsCount) * comparisonParams.tMax);
    }
  }

  const width = 320;
  const height = 155;
  const padLeft = 48;
  const padBottom = 28;
  const padTop = 16;
  const padRight = 16;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const renderPlot = (
    title: string,
    yLabel: string,
    unitY: string,
    yMin: number,
    yMax: number,
    dataFn: (t: number) => number,
    compFn: ((t: number) => number) | null,
    color: string,
    currentValue: number,
    shadeAreaUnderZero = false
  ) => {
    const rawSpan = Math.abs(yMax - yMin) < 1e-6 ? 4 : yMax - yMin;
    const safeMinY = yMin - rawSpan * 0.12;
    const safeMaxY = yMax + rawSpan * 0.12;
    const safeSpanY = safeMaxY - safeMinY;

    const toSvgX = (t: number) => padLeft + (t / tTotal) * plotW;
    const toSvgY = (yVal: number) =>
      height - padBottom - ((yVal - safeMinY) / safeSpanY) * plotH;

    const pathD = timePoints
      .map((t, idx) => {
        const x = toSvgX(t);
        const y = toSvgY(dataFn(t));
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    let compPathD = '';
    if (comparisonParams && compFn) {
      compPathD = compTimePoints
        .map((t, idx) => {
          const x = toSvgX(t);
          const y = toSvgY(compFn(t));
          return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');
    }

    // Área sob v(t) até t atual (Δx)
    let areaPathD = '';
    if (shadeAreaUnderZero) {
      const clampedT = Math.min(currentTime, params.tMax);
      const zeroY = toSvgY(0);
      const steps = 30;
      const areaPts: string[] = [];
      areaPts.push(`M ${toSvgX(0).toFixed(1)} ${zeroY.toFixed(1)}`);
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * clampedT;
        areaPts.push(`L ${toSvgX(t).toFixed(1)} ${toSvgY(dataFn(t)).toFixed(1)}`);
      }
      areaPts.push(`L ${toSvgX(clampedT).toFixed(1)} ${zeroY.toFixed(1)} Z`);
      areaPathD = areaPts.join(' ');
    }

    const curX = toSvgX(Math.min(currentTime, params.tMax));
    const curY = toSvgY(currentValue);

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col shadow-md">
        <div className="flex items-center justify-between mb-1 text-xs">
          <span className="font-semibold text-slate-200">{title}</span>
          <span className="font-mono text-[11px] text-amber-400 font-medium">
            {formatPtNumber(currentValue, 2)} {unitY}
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <rect
            x={padLeft}
            y={padTop}
            width={plotW}
            height={plotH}
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {safeMinY <= 0 && safeMaxY >= 0 && (
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

          {shadeAreaUnderZero && areaPathD && (
            <path d={areaPathD} fill="rgba(20, 184, 166, 0.18)" />
          )}

          {compPathD && (
            <path
              d={compPathD}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          )}

          <path d={pathD} fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" />

          <circle cx={curX} cy={curY} r="4" fill="#ffffff" stroke={color} strokeWidth="2" />
          <line
            x1={curX}
            y1={padTop}
            x2={curX}
            y2={height - padBottom}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeDasharray="2 2"
          />

          <text
            x={padLeft - 6}
            y={toSvgY(yMax) + 3}
            fill="#94a3b8"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            {formatPtNumber(yMax, 1)}
          </text>
          <text
            x={padLeft - 6}
            y={toSvgY(yMin) + 3}
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
            {formatPtNumber(tTotal, 1)} s
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

          <text
            x={padLeft - 28}
            y={padTop + plotH / 2}
            fill="#64748b"
            fontSize="10"
            textAnchor="middle"
            transform={`rotate(-90 ${padLeft - 28} ${padTop + plotH / 2})`}
          >
            {yLabel}
          </text>
        </svg>
      </div>
    );
  };

  const posMin = Math.min(results.minX, compResults ? compResults.minX : results.minX);
  const posMax = Math.max(results.maxX, compResults ? compResults.maxX : results.maxX);

  const velMin = Math.min(
    params.v0,
    results.finalV,
    comparisonParams && compResults ? Math.min(comparisonParams.v0, compResults.finalV) : params.v0
  );
  const velMax = Math.max(
    params.v0,
    results.finalV,
    comparisonParams && compResults ? Math.max(comparisonParams.v0, compResults.finalV) : params.v0
  );

  const accMin = Math.min(
    -2,
    params.a,
    comparisonParams ? comparisonParams.a : params.a
  );
  const accMax = Math.max(
    2,
    params.a,
    comparisonParams ? comparisonParams.a : params.a
  );

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            Gráficos Cinemáticos x(t), v(t) e a(t)
          </h4>
          <p className="text-[11px] text-slate-400">
            A área sombreada sob a curva v(t) representa o deslocamento Δx no intervalo decorrido.
          </p>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === 'all'
                ? 'bg-amber-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos (3)
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === 'pos'
                ? 'bg-amber-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Posição x(t)
          </button>
          <button
            onClick={() => setActiveTab('vel_acc')}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === 'vel_acc'
                ? 'bg-amber-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            v(t) e a(t)
          </button>
        </div>
      </div>

      <div
        className={`grid gap-3 ${
          activeTab === 'all'
            ? 'grid-cols-1 md:grid-cols-3'
            : activeTab === 'pos'
            ? 'grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {(activeTab === 'all' || activeTab === 'pos') &&
          renderPlot(
            'Posição: x(t)',
            'x / m',
            'm',
            posMin,
            posMax,
            (t) => positionAtTime(params, t),
            comparisonParams ? (t) => positionAtTime(comparisonParams, t) : null,
            '#38bdf8',
            currentInstant.x
          )}

        {(activeTab === 'all' || activeTab === 'vel_acc') && (
          <>
            {renderPlot(
              'Velocidade: v(t)',
              'v / m·s⁻¹',
              'm/s',
              velMin,
              velMax,
              (t) => velocityAtTime(params, t),
              comparisonParams ? (t) => velocityAtTime(comparisonParams, t) : null,
              '#22c55e',
              currentInstant.v,
              true
            )}
            {renderPlot(
              'Aceleração: a(t)',
              'a / m·s⁻²',
              'm/s²',
              accMin,
              accMax,
              () => params.a,
              comparisonParams ? () => comparisonParams.a : null,
              '#fb923c',
              params.a
            )}
          </>
        )}
      </div>
    </div>
  );
};
