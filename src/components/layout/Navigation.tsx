import React, { useState } from 'react';
import { SIMULATORS_CONFIG } from '../../config/simulators';
import {
  Rocket,
  Activity,
  RotateCw,
  Shuffle,
  Target,
  Award,
  Lock,
  Menu,
  X,
  User,
  Home,
  SlidersHorizontal,
  ChevronRight,
  SearchCheck,
} from 'lucide-react';
import { SocraticTutorAvatar } from '../tutor/SocraticTutorAvatar';

interface NavigationProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  studentNick: string;
  onOpenNickModal: () => void;
  onOpenTeacherPinModal: () => void;
  isTeacherModeActive: boolean;
}

const getSimulatorNavIcon = (iconName: string) => {
  switch (iconName) {
    case 'Rocket':
      return <Rocket className="w-4 h-4" />;
    case 'Activity':
      return <Activity className="w-4 h-4" />;
    case 'RotateCw':
      return <RotateCw className="w-4 h-4" />;
    case 'Shuffle':
      return <Shuffle className="w-4 h-4" />;
    case 'MessageCircleQuestion':
      return <SocraticTutorAvatar size="xs" />;
    case 'SearchCheck':
      return <SearchCheck className="w-4 h-4" />;
    default:
      return <Rocket className="w-4 h-4" />;
  }
};

export const Navigation: React.FC<NavigationProps> = ({
  currentRoute,
  onNavigate,
  studentNick,
  onOpenNickModal,
  onOpenTeacherPinModal,
  isTeacherModeActive,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (route: string) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  const availableSimItems = SIMULATORS_CONFIG.filter((s) => s.status === 'disponivel').map(
    (sim) => ({
      id: sim.route,
      label: sim.name,
      icon: getSimulatorNavIcon(sim.iconName),
    })
  );

  const navItems = [
    { id: 'inicio', label: 'Início', icon: <Home className="w-4 h-4" /> },
    ...availableSimItems,
    { id: 'simuladores', label: 'Simuladores', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'desafios', label: 'Os Meus Desafios', icon: <Target className="w-4 h-4" /> },
    { id: 'progresso', label: 'O Meu Progresso', icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 shadow-xl print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Lado Esquerdo: Logotipo da Escola Secundária Viriato e Título */}
          <div
            onClick={() => handleNav('inicio')}
            className="flex items-center space-x-3 sm:space-x-4 cursor-pointer select-none group"
          >
            {/* Logotipo da Escola Secundária Viriato carregado pelo utilizador */}
            <div className="flex-shrink-0 flex items-center justify-center bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 group-hover:border-teal-500/50 transition">
              <img
                src="/assets/aistudio/Logo_Viriato_Alta_Resolucao_7b6078bd.svg"
                alt="Logotipo Escola Secundária Viriato"
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => {
                  // Fallback se porventura não carregar
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-extrabold text-slate-100 tracking-tight leading-tight group-hover:text-teal-400 transition">
                Laboratório de Física
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                Escola Secundária Viriato • 12.º Ano
              </span>
            </div>
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Lado Direito: Identificador de Aluno & Botão Modo Professor */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Identificação do Aluno */}
            <button
              onClick={onOpenNickModal}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition"
              title="Clique para alterar a sua alcunha / número"
            >
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-medium max-w-[110px] sm:max-w-[150px] truncate">
                {studentNick || 'Definir Aluno'}
              </span>
            </button>

            {/* Modo Professor */}
            {isTeacherModeActive ? (
              <button
                onClick={() => handleNav('professor')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Painel Professor</span>
              </button>
            ) : (
              <button
                onClick={onOpenTeacherPinModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-600/40 hover:bg-amber-950/40 text-amber-300 text-xs font-semibold transition"
                title="Acesso reservado ao professor mediante PIN"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Modo Professor</span>
              </button>
            )}

            {/* Botão de Menu Hambúrguer Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Gaveta Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800 flex justify-between gap-2">
            <button
              onClick={onOpenNickModal}
              className="flex-1 py-2 text-xs bg-slate-900 text-slate-300 rounded-lg border border-slate-800 flex items-center justify-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span className="truncate">{studentNick || 'Identificar Aluno'}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (isTeacherModeActive) handleNav('professor');
                else onOpenTeacherPinModal();
              }}
              className="flex-1 py-2 text-xs bg-amber-600/20 text-amber-300 rounded-lg border border-amber-600/40 font-bold flex items-center justify-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Professor</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
