import React from 'react';
import { SIMULATORS_CONFIG } from '../../config/simulators';
import { Challenge } from '../../types/challenges';
import { getChallengeAttempts, getStudentNick } from '../../utils/storage';
import { formatPtNumber } from '../../physics/projectile';
import {
  Rocket,
  Activity,
  Target,
  Award,
  BookOpen,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

interface HomeViewProps {
  challenges: Challenge[];
  onNavigate: (route: string) => void;
  onOpenSimulator: (simId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  challenges,
  onNavigate,
  onOpenSimulator,
}) => {
  const nick = getStudentNick();
  const attempts = getChallengeAttempts();
  const activeChallenges = challenges.filter((c) => c.active);
  const completedCount = activeChallenges.filter((c) => attempts[c.id]?.succeeded).length;
  const availableSimCount = SIMULATORS_CONFIG.filter((s) => s.status === 'disponivel').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner Principal de Boas-Vindas com Identidade Pedagógica */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Física 12.º Ano • Aprendizagens Essenciais</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Laboratório de Física Virtual
            <span className="block text-teal-400 text-xl sm:text-2xl font-bold mt-1">
              Escola Secundária Viriato
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Explora a cinemática de forma rigorosa, visual e quantitativa. Simula o movimento retilíneo (MRU e MRUA) a 1D e lançamentos horizontais e oblíquos a 2D, analisa vetores e gráficos em tempo real e resolve desafios concebidos para o teu exame nacional.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onOpenSimulator('lancamento-projeteis')}
              className="flex items-center space-x-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-teal-900/30"
            >
              <Rocket className="w-4 h-4" />
              <span>Estação 1: Projéteis</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={() => onOpenSimulator('movimento-retilineo')}
              className="flex items-center space-x-2 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-amber-900/30"
            >
              <Activity className="w-4 h-4" />
              <span>Estação 2: MRU e MRUA</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={() => onNavigate('desafios')}
              className="flex items-center space-x-2 px-4 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition border border-slate-700"
            >
              <Target className="w-4 h-4 text-amber-400" />
              <span>Ver {activeChallenges.length} Desafios</span>
            </button>
          </div>
        </div>

        {/* Efeito de Fundo Decorativo Suave */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Cartões Rápidos de Acesso e Resumo de Aprendizagens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cartão 1: Estação 1 */}
        <div
          onClick={() => onOpenSimulator('lancamento-projeteis')}
          className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl p-5 shadow-lg cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500/20 transition">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Estação 1
            </span>
          </div>
          <h3 className="font-bold text-slate-100 text-sm mb-1 group-hover:text-teal-400 transition">
            Lançamento de Projéteis
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trajetória parabólica, rasto estroboscópico, componentes vx e vy, modos Livre, Previsão e Desafio.
          </p>
        </div>

        {/* Cartão 2: Estação 2 */}
        <div
          onClick={() => onOpenSimulator('movimento-retilineo')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 shadow-lg cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Estação 2
            </span>
          </div>
          <h3 className="font-bold text-slate-100 text-sm mb-1 group-hover:text-amber-400 transition">
            Movimento Retilíneo
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            MRU e MRUA a 1D, gráficos x(t), v(t) e a(t), inversão de sentido, deslocamento vs distância e desafios.
          </p>
        </div>

        {/* Cartão 3: O Teu Progresso */}
        <div
          onClick={() => onNavigate('progresso')}
          className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl p-5 shadow-lg cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-teal-400 font-bold">
              {completedCount} / {activeChallenges.length}
            </span>
          </div>
          <h3 className="font-bold text-slate-100 text-sm mb-1 group-hover:text-teal-400 transition">
            O Meu Progresso
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Identificado como <span className="text-slate-200 font-semibold">{nick || 'Aluno'}</span>. Guarda tentativas e exporta código para o professor.
          </p>
        </div>

        {/* Cartão 4: Catálogo */}
        <div
          onClick={() => onNavigate('simuladores')}
          className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl p-5 shadow-lg cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:bg-sky-500/20 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
              {availableSimCount} de {SIMULATORS_CONFIG.length} Ativas
            </span>
          </div>
          <h3 className="font-bold text-slate-100 text-sm mb-1 group-hover:text-sky-400 transition">
            Catálogo de Simuladores
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Acede às estações ativas e às próximas estações de Movimento Circular e Colisões.
          </p>
        </div>
      </div>

      {/* Síntese Conceitual das Aprendizagens Essenciais */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-teal-400" />
          <span>Fórmulas Fundamentais em Uso nas Estações</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">MRU / Eixo Ox (Projéteis)</div>
            <div className="text-sky-300 font-bold mt-1">x(t) = x₀ + v₀ₓ · t</div>
            <div className="text-slate-500 text-[10px] mt-0.5">Velocidade constante (a = 0)</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">MRUA (1D e Eixo Oy)</div>
            <div className="text-teal-300 font-bold mt-1">x(t) = x₀ + v₀t + ½at²</div>
            <div className="text-slate-500 text-[10px] mt-0.5">v(t) = v₀ + a · t</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">Alcance Máximo (y₀ = 0)</div>
            <div className="text-amber-300 font-bold mt-1">X_máx para θ = 45°</div>
            <div className="text-slate-500 text-[10px] mt-0.5">Ângulos complementares</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">Deslocamento Gráfico v(t)</div>
            <div className="text-emerald-300 font-bold mt-1">Δx = Área sob curva v(t)</div>
            <div className="text-slate-500 text-[10px] mt-0.5">v² = v₀² + 2aΔx</div>
          </div>
        </div>
      </div>
    </div>
  );
};
