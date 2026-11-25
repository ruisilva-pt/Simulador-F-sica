import React from 'react';
import { SIMULATORS_CONFIG, SimulatorConfig } from '../../config/simulators';
import { Rocket, Activity, RotateCw, Shuffle, ArrowRight, Clock, CheckCircle, SearchCheck } from 'lucide-react';
import { SocraticTutorAvatar } from '../tutor/SocraticTutorAvatar';

interface SimulatorsCatalogViewProps {
  onSelectSimulator: (simId: string) => void;
}

export const SimulatorsCatalogView: React.FC<SimulatorsCatalogViewProps> = ({
  onSelectSimulator,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Rocket':
        return <Rocket className="w-6 h-6" />;
      case 'Activity':
        return <Activity className="w-6 h-6" />;
      case 'RotateCw':
        return <RotateCw className="w-6 h-6" />;
      case 'Shuffle':
        return <Shuffle className="w-6 h-6" />;
      case 'MessageCircleQuestion':
        return <SocraticTutorAvatar size="sm" />;
      case 'SearchCheck':
        return <SearchCheck className="w-6 h-6" />;
      default:
        return <Rocket className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h2 className="text-lg font-bold text-slate-100">
          Estações Experimentais Virtuais (Física 12.º Ano)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Simuladores interativos concebidos para apoiar a exploração experimental e o rigor analítico da mecânica no Ensino Secundário em Portugal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SIMULATORS_CONFIG.map((sim) => {
          const isAvailable = sim.status === 'disponivel';

          return (
            <div
              key={sim.id}
              className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between shadow-xl transition ${
                isAvailable
                  ? 'border-teal-500/40 hover:border-teal-400/80 cursor-pointer'
                  : 'border-slate-800 opacity-75'
              }`}
              onClick={() => isAvailable && onSelectSimulator(sim.id)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isAvailable
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {getIcon(sim.iconName)}
                  </div>

                  <span
                    className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full border ${
                      isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isAvailable ? 'Disponível Agora' : 'Em Breve'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100">{sim.name}</h3>
                  <div className="text-[11px] font-mono text-teal-400 mt-0.5">
                    {sim.curriculumBlock}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {sim.shortDescription}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  {sim.longDescription}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {isAvailable
                    ? sim.id === 'caca-ao-erro'
                      ? '10 Resoluções • Dicas • Sem Nota'
                      : sim.hasChallenges === false
                        ? 'Conversa Guiada • Áudio • Contexto'
                        : 'Canvas 2D • Gráficos • Desafios'
                    : 'Módulo curricular reservado'}
                </span>

                {isAvailable ? (
                  <button className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition shadow">
                    <span>{sim.hasChallenges === false ? 'Abrir Estação' : 'Entrar no Simulador'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="flex items-center space-x-1 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Em preparação</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
