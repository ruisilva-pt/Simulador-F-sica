import React from 'react';
import { calculateRectilinearResults } from '../../physics/rectilinear';
import { formatPtNumber } from '../../physics/projectile';
import { RectilinearParams } from '../../types/rectilinear';
import { BookOpen } from 'lucide-react';

interface RectilinearEquationsPanelProps {
  params: RectilinearParams;
}

export const RectilinearEquationsPanel: React.FC<RectilinearEquationsPanelProps> = ({
  params,
}) => {
  const { x0, v0, a, tMax } = params;
  const results = calculateRectilinearResults(params);

  const isMRU = Math.abs(a) < 1e-6;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Equações do Movimento Retilíneo ({isMRU ? 'MRU' : 'MRUA'})
            </h3>
            <p className="text-xs text-slate-400">
              Regime atual: <span className="text-amber-300 font-semibold">{results.regimeLabel}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bloco 1: Lei das Posições */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            1. Equação das Posições x(t)
          </div>
          <div className="font-mono text-xs bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1 text-slate-300">
            <div>
              <span className="text-sky-300">x(t)</span> = x₀ + v₀·t {isMRU ? '' : '+ ½·a·t²'}
            </div>
            <div className="text-slate-400 text-[11px]">
              x(t) = {formatPtNumber(x0, 1)} + ({formatPtNumber(v0, 1)})·t
              {!isMRU && ` + (${formatPtNumber(0.5 * a, 2)})·t²`}
            </div>
            <div className="text-sky-400 font-bold pt-1 border-t border-slate-800">
              x({formatPtNumber(tMax, 1)} s) = {formatPtNumber(results.finalX, 2)} m
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {isMRU
              ? 'Como a = 0 m/s², o gráfico x(t) é uma reta de declive igual à velocidade constante v₀.'
              : 'Para a ≠ 0, o gráfico x(t) é uma parábola cuja concavidade depende do sinal da aceleração a.'}
          </p>
        </div>

        {/* Bloco 2: Lei das Velocidades e Inversão */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            2. Lei das Velocidades v(t) e Inversão
          </div>
          <div className="font-mono text-xs bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1 text-slate-300">
            <div>
              <span className="text-emerald-300">v(t)</span> = v₀ + a·t = {formatPtNumber(v0, 1)} + ({formatPtNumber(a, 1)})·t
            </div>
            <div className="text-emerald-400 font-bold">
              v({formatPtNumber(tMax, 1)} s) = {formatPtNumber(results.finalV, 2)} m/s
            </div>
            {results.reversalTime !== null && results.reversalX !== null ? (
              <div className="text-rose-300 text-[11px] pt-1 border-t border-slate-800">
                Inversão (v = 0): t_inv = −v₀/a = {formatPtNumber(results.reversalTime, 2)} s em x ={' '}
                {formatPtNumber(results.reversalX, 2)} m
              </div>
            ) : (
              <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-800">
                Sem inversão de sentido no intervalo [0; {formatPtNumber(tMax, 1)} s]
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            O movimento é acelerado quando <span className="font-mono">v·a &gt; 0</span> e retardado quando <span className="font-mono">v·a &lt; 0</span>.
          </p>
        </div>

        {/* Bloco 3: Deslocamento vs Distância Percorrida */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            3. Deslocamento (Δx) vs Distância Percorrida (d)
          </div>
          <div className="font-mono text-xs bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1 text-slate-300">
            <div>
              <span className="text-teal-300">Δx</span> = x_f − x₀ = {formatPtNumber(results.finalX, 2)} − ({formatPtNumber(x0, 1)}) ={' '}
              <span className="text-teal-400 font-bold">{formatPtNumber(results.displacement, 2)} m</span>
            </div>
            <div>
              <span className="text-amber-300">Distância (d)</span> ={' '}
              <span className="text-amber-400 font-bold">{formatPtNumber(results.distanceTraveled, 2)} m</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Quando há inversão de marcha, a distância percorrida (escalar ≥ 0) excede o módulo do deslocamento |Δx|.
          </p>
        </div>

        {/* Bloco 4: Velocidade Média, Rapidez Média e Torricelli */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            4. Velocidade Média, Rapidez Média e Equação de Torricelli
          </div>
          <div className="font-mono text-xs bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1 text-slate-300">
            <div>
              <span className="text-sky-300">v_m</span> = Δx / Δt = {formatPtNumber(results.avgVelocity, 2)} m/s
              {'  |  '}
              <span className="text-amber-300">r_m</span> = d / Δt = {formatPtNumber(results.avgSpeed, 2)} m/s
            </div>
            <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
              v² = v₀² + 2·a·Δx → ({formatPtNumber(results.finalV, 1)})² = ({formatPtNumber(v0, 1)})² + 2·({formatPtNumber(a, 1)})·({formatPtNumber(results.displacement, 1)})
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            A velocidade média depende apenas da variação da posição; a rapidez média reflete o espaço total percorrido.
          </p>
        </div>
      </div>
    </div>
  );
};
