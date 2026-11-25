import React from 'react';
import { calculateProjectileResults, formatPtNumber } from '../../physics/projectile';
import { ProjectileParams } from '../../types/physics';
import { BookOpen, Calculator, CheckCircle2 } from 'lucide-react';

interface PhysicsEquationsPanelProps {
  params: ProjectileParams;
}

export const PhysicsEquationsPanel: React.FC<PhysicsEquationsPanelProps> = ({ params }) => {
  const { v0, angleDeg, y0, g } = params;
  const results = calculateProjectileResults(params);

  const cosVal = Math.cos((angleDeg * Math.PI) / 180);
  const sinVal = Math.sin((angleDeg * Math.PI) / 180);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 shadow-xl space-y-4">
      <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
        <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">
            Equações do Movimento Composto (Física 12.º Ano)
          </h3>
          <p className="text-xs text-slate-400">
            Dedução analítica e substituição numérica direta para o lançamento atual
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bloco 1: Decomposição Inicial da Velocidade */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            1. Decomposição da Velocidade Inicial
          </div>
          <div className="font-mono text-xs bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1 text-slate-300">
            <div>
              <span className="text-sky-300">v₀x</span> = v₀ · cos(θ) = {formatPtNumber(v0, 1)} × cos({angleDeg}°) ={' '}
              <span className="text-sky-400 font-bold">{formatPtNumber(results.v0x, 2)} m/s</span>
            </div>
            <div>
              <span className="text-orange-300">v₀y</span> = v₀ · sen(θ) = {formatPtNumber(v0, 1)} × sen({angleDeg}°) ={' '}
              <span className="text-orange-400 font-bold">{formatPtNumber(results.v0y, 2)} m/s</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            O movimento desdobra-se em dois eixos independentes: retilíneo uniforme no eixo Ox e retilíneo uniformemente variado no eixo Oy.
          </p>
        </div>

        {/* Bloco 2: Equações das Posições x(t) e y(t) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            2. Equações Paramétricas do Movimento
          </div>
          <div className="font-mono text-xs bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1.5 text-slate-300">
            <div>
              <span className="text-sky-300">x(t)</span> = x₀ + v₀x · t ={' '}
              <span className="text-slate-100">{formatPtNumber(results.v0x, 2)} · t</span>
            </div>
            <div>
              <span className="text-teal-300">y(t)</span> = y₀ + v₀y · t − ½ g · t²
            </div>
            <div className="text-slate-400 text-[11px]">
              y(t) = {formatPtNumber(y0, 1)} + {formatPtNumber(results.v0y, 2)} · t − {formatPtNumber(0.5 * g, 2)} · t²
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            A aceleração gravítica atua exclusivamente na vertical: <span className="font-mono">ay = −g</span> e <span className="font-mono">ax = 0</span>.
          </p>
        </div>

        {/* Bloco 3: Tempo de Voo Total */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            3. Determinação do Tempo de Voo (y = 0)
          </div>
          <div className="font-mono text-xs bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1 text-slate-300">
            <div>0 = y₀ + v₀y · t − ½ g · t²</div>
            <div className="text-amber-300">
              t_voo = (v₀y + √(v₀y² + 2·g·y₀)) / g
            </div>
            <div className="text-slate-400 text-[11px]">
              = ({formatPtNumber(results.v0y, 2)} + √({formatPtNumber(results.v0y * results.v0y, 1)} + {formatPtNumber(2 * g * y0, 1)})) / {formatPtNumber(g, 1)}
            </div>
            <div className="text-teal-400 font-bold pt-1 border-t border-slate-800">
              t_voo = {formatPtNumber(results.tFlight, 2)} s
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Resolvida através da raiz positiva da equação de 2.º grau em y(t) = 0.
          </p>
        </div>

        {/* Bloco 4: Alcance e Altura Máxima */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            4. Alcance Horizontal (X) e Altura Máxima (y_máx)
          </div>
          <div className="font-mono text-xs bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1 text-slate-300">
            <div>
              <span className="text-amber-300">Alcance (X)</span> = x(t_voo) = v₀x × t_voo
            </div>
            <div className="text-slate-400 text-[11px]">
              = {formatPtNumber(results.v0x, 2)} × {formatPtNumber(results.tFlight, 2)} ={' '}
              <span className="text-amber-400 font-bold">{formatPtNumber(results.range, 1)} m</span>
            </div>
            <div className="pt-1 border-t border-slate-800">
              <span className="text-sky-300">y_máx</span> = y₀ + (v₀y² / 2g) = {formatPtNumber(y0, 1)} + ({formatPtNumber(results.v0y * results.v0y, 1)} / {formatPtNumber(2 * g, 1)}) ={' '}
              <span className="text-sky-400 font-bold">{formatPtNumber(results.maxHeight, 1)} m</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            No vértice da parábola, a componente vertical da velocidade anula-se (<span className="font-mono">vy = 0</span>).
          </p>
        </div>
      </div>
    </div>
  );
};
