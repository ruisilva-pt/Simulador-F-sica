/**
 * Laboratório de Física, Escola Secundária Viriato
 * Plataforma didática para o Ensino Secundário (12.º Ano)
 * Desenvolvido segundo as Aprendizagens Essenciais de Física (Portugal)
 */

import React, { useEffect, useState } from 'react';
import { Navigation } from './components/layout/Navigation';
import { HomeView } from './components/home/HomeView';
import { ProjectileSimulatorView } from './components/simulator/ProjectileSimulatorView';
import { RectilinearSimulatorView } from './components/rectilinear/RectilinearSimulatorView';
import { SocraticTutorView } from './components/tutor/SocraticTutorView';
import { ErrorHuntView } from './components/errorHunt/ErrorHuntView';
import { SimulatorsCatalogView } from './components/simulator/SimulatorsCatalogView';
import { ChallengesListView } from './components/challenges/ChallengesListView';
import { StudentProgressView } from './components/student/StudentProgressView';
import { TeacherPortal } from './components/teacher/TeacherPortal';
import { PinModal } from './components/teacher/PinModal';
import { StudentNickModal } from './components/student/StudentNickModal';
import { getAllChallenges } from './utils/storage';
import { getStudentNick } from './utils/storage';
import { Challenge } from './types/challenges';
import { TutorLaunchContext } from './config/tutorSocratic';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('inicio');
  const [studentNick, setStudentNickState] = useState<string>(getStudentNick());
  const [challenges, setChallenges] = useState<Challenge[]>(getAllChallenges());
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [tutorLaunchContext, setTutorLaunchContext] = useState<TutorLaunchContext | null>(null);

  // Estados dos Modais
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isNickModalOpen, setIsNickModalOpen] = useState<boolean>(!getStudentNick());
  const [isTeacherModeActive, setIsTeacherModeActive] = useState<boolean>(false);

  const handleAskTutor = (context: TutorLaunchContext) => {
    setTutorLaunchContext(context);
    setCurrentRoute('simulador/tutor-socratico');
  };

  // Atualizar lista de desafios
  const handleRefreshChallenges = () => {
    setChallenges(getAllChallenges());
  };

  const handleOpenChallenge = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    setCurrentRoute(`simulador/${challenge.simulatorId}`);
  };

  const handleTeacherSuccess = () => {
    setIsTeacherModeActive(true);
    setIsPinModalOpen(false);
    setCurrentRoute('professor');
  };

  const handleExitTeacherMode = () => {
    setIsTeacherModeActive(false);
    setCurrentRoute('inicio');
  };

  const handleSaveNick = (newNick: string) => {
    setStudentNickState(newNick);
    setIsNickModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Barra de Navegação Superior com Logotipo da ES Viriato */}
      <Navigation
        currentRoute={currentRoute}
        onNavigate={(route) => {
          if (route === 'professor' && !isTeacherModeActive) {
            setIsPinModalOpen(true);
          } else {
            setCurrentRoute(route);
          }
        }}
        studentNick={studentNick}
        onOpenNickModal={() => setIsNickModalOpen(true)}
        onOpenTeacherPinModal={() => setIsPinModalOpen(true)}
        isTeacherModeActive={isTeacherModeActive}
      />

      {/* Conteúdo Principal da Rota Ativa */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0 print:m-0">
        {currentRoute === 'inicio' && (
          <HomeView
            challenges={challenges}
            onNavigate={(route) => setCurrentRoute(route)}
            onOpenSimulator={(simId) => setCurrentRoute(`simulador/${simId}`)}
          />
        )}

        {currentRoute === 'simulador/lancamento-projeteis' && (
          <ProjectileSimulatorView
            challenges={challenges}
            activeChallenge={activeChallenge}
            setActiveChallenge={setActiveChallenge}
            onRefreshAttempts={handleRefreshChallenges}
            onAskTutor={handleAskTutor}
          />
        )}

        {currentRoute === 'simulador/movimento-retilineo' && (
          <RectilinearSimulatorView
            challenges={challenges}
            activeChallenge={activeChallenge}
            setActiveChallenge={setActiveChallenge}
            onRefreshAttempts={handleRefreshChallenges}
            isTeacherModeActive={isTeacherModeActive}
            onAskTutor={handleAskTutor}
          />
        )}

        {currentRoute === 'simulador/tutor-socratico' && (
          <SocraticTutorView
            launchContext={tutorLaunchContext}
            onClearLaunchContext={() => setTutorLaunchContext(null)}
          />
        )}

        {currentRoute === 'simulador/caca-ao-erro' && (
          <ErrorHuntView onAskTutor={handleAskTutor} />
        )}

        {currentRoute === 'simuladores' && (
          <SimulatorsCatalogView
            onSelectSimulator={(simId) => {
              setCurrentRoute(`simulador/${simId}`);
            }}
          />
        )}

        {currentRoute === 'desafios' && (
          <ChallengesListView
            challenges={challenges}
            onSelectChallenge={handleOpenChallenge}
          />
        )}

        {currentRoute === 'progresso' && (
          <StudentProgressView
            allChallenges={challenges}
            onOpenChallenge={handleOpenChallenge}
          />
        )}

        {currentRoute === 'professor' && isTeacherModeActive && (
          <TeacherPortal
            challenges={challenges}
            onRefreshChallenges={handleRefreshChallenges}
            onExitTeacherMode={handleExitTeacherMode}
          />
        )}
      </main>

      {/* Rodapé Institucional */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-6 text-center text-xs text-slate-500 font-mono print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>Escola Secundária Viriato • Viseu</span>
            <span>|</span>
            <span className="text-slate-400">Departamento de Física e Química</span>
          </div>
          <div>
            12.º Ano de Escolaridade • Modelo Físico Ideal (Sem Resistência do Ar)
          </div>
        </div>
      </footer>

      {/* Modal de PIN do Professor */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleTeacherSuccess}
      />

      {/* Modal de Alcunha / Número do Aluno */}
      <StudentNickModal
        isOpen={isNickModalOpen}
        currentNick={studentNick}
        onSave={handleSaveNick}
        onClose={() => setIsNickModalOpen(false)}
        canClose={!!studentNick}
      />
    </div>
  );
}
