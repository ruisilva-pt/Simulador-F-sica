import React, { useState } from 'react';
import { SIMULATORS_CONFIG } from '../../config/simulators';
import { Challenge } from '../../types/challenges';
import {
  generateStudentProgressExport,
  getChallengeAttempts,
  getStudentNick,
  setStudentNick,
} from '../../utils/storage';
import { formatPtNumber } from '../../physics/projectile';
import {
  Award,
  CheckCircle,
  Copy,
  Download,
  AlertTriangle,
  FileText,
  User,
  Check,
  ExternalLink,
  Target,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface StudentProgressViewProps {
  allChallenges: Challenge[];
  onOpenChallenge: (challenge: Challenge) => void;
}

export const StudentProgressView: React.FC<StudentProgressViewProps> = ({
  allChallenges,
  onOpenChallenge,
}) => {
  const [nick, setNick] = useState<string>(getStudentNick());
  const [isEditingNick, setIsEditingNick] = useState<boolean>(!nick);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportData, setExportData] = useState<{
    jsonString: string;
    shortCode: string;
  } | null>(null);

  const attemptsMap = getChallengeAttempts();
  const attemptsList = Object.values(attemptsMap);

  const activeChallenges = allChallenges.filter((c) => c.active);
  const totalActiveChallenges = activeChallenges.length;
  const completedCount = activeChallenges.filter((c) => attemptsMap[c.id]?.succeeded).length;
  const progressPercent =
    totalActiveChallenges > 0 ? (completedCount / totalActiveChallenges) * 100 : 0;

  const availableSimsCount = SIMULATORS_CONFIG.filter((s) => s.status === 'disponivel').length;
  const totalSimsCount = SIMULATORS_CONFIG.length;
  const comingSoonSimsCount = totalSimsCount - availableSimsCount;

  const totalAttemptsCount = attemptsList.reduce((acc, curr) => acc + curr.attemptsCount, 0);
  const avgAttempts = completedCount > 0 ? totalAttemptsCount / completedCount : 0;

  const handleSaveNick = (e: React.FormEvent) => {
    e.preventDefault();
    if (nick.trim()) {
      setStudentNick(nick.trim());
      setIsEditingNick(false);
    }
  };

  const handleExport = () => {
    const data = generateStudentProgressExport();
    setExportData(data);
    setShowExportModal(true);
  };

  const handleDownloadJson = () => {
    if (!exportData) return;
    const blob = new Blob([exportData.jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeNick = (nick || 'aluno').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `progresso_${safeNick}_esviriato.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    if (!exportData) return;
    try {
      await navigator.clipboard.writeText(exportData.shortCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Aviso de LocalStorage */}
      <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Aviso sobre o armazenamento local:</span> Todos os teus registos e desafios concluídos são guardados exclusivamente na memória deste navegador (localStorage). Se limpares os dados de navegação ou utilizares um separador anónimo, o progresso será reiniciado. Utiliza o botão <span className="font-semibold text-white">"Exportar o meu progresso"</span> para guardar uma cópia e entregar ao professor.
        </div>
      </div>

      {/* Cartão de Identificação do Aluno */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Identificação do Aluno</div>
              {isEditingNick ? (
                <form onSubmit={handleSaveNick} className="flex items-center space-x-2 mt-1">
                  <input
                    type="text"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    placeholder="Ex: Aluno 12.º B - n.º 14"
                    maxLength={35}
                    className="bg-slate-950 border border-teal-500 rounded px-2.5 py-1 text-sm text-slate-100 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded transition"
                  >
                    Guardar
                  </button>
                </form>
              ) : (
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-lg font-bold text-slate-100">
                    {nick || 'Sem alcunha definida'}
                  </span>
                  <button
                    onClick={() => setIsEditingNick(true)}
                    className="text-xs text-teal-400 hover:underline"
                  >
                    Alterar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Exportação */}
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>Exportar o Meu Progresso</span>
          </button>
        </div>
      </div>

      {/* Visão Geral das Métricas do Aluno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-xs text-slate-400 mb-1">Desafios Concluídos</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-teal-400">{completedCount}</span>
            <span className="text-xs text-slate-500">de {totalActiveChallenges} ativos</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 mt-3 overflow-hidden border border-slate-800">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-xs text-slate-400 mb-1">Taxa de Sucesso Geral</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-emerald-400">
              {formatPtNumber(progressPercent, 0)}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Baseada nos desafios ativos
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-xs text-slate-400 mb-1">Média de Tentativas</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-amber-400">
              {formatPtNumber(avgAttempts, 1)}
            </span>
            <span className="text-xs text-slate-500">por acerto</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Total de {totalAttemptsCount} lançamentos efetuados
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-xs text-slate-400 mb-1">Simuladores Disponíveis</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-sky-400">{availableSimsCount}</span>
            <span className="text-xs text-slate-500">de {totalSimsCount} módulos</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            {comingSoonSimsCount} módulo(s) em breve
          </span>
        </div>
      </div>

      {/* Progresso Detalhado por Simulador */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <Target className="w-5 h-5 text-teal-400" />
          <span>Progresso por Simulador do 12.º Ano</span>
        </h3>

        {SIMULATORS_CONFIG.map((sim) => {
          const isAvailable = sim.status === 'disponivel';
          const simChallenges = activeChallenges.filter((c) => c.simulatorId === sim.id);
          const simCompleted = simChallenges.filter((c) => attemptsMap[c.id]?.succeeded).length;
          const simPercent =
            simChallenges.length > 0 ? (simCompleted / simChallenges.length) * 100 : 0;

          return (
            <div
              key={sim.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h4 className="font-bold text-slate-100 text-sm sm:text-base">{sim.name}</h4>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        isAvailable
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {isAvailable ? 'Ativo' : 'Em breve'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{sim.curriculumBlock}</p>
                </div>

                {isAvailable && sim.hasChallenges !== false && (
                  <div className="text-right">
                    <span className="text-xs font-mono text-teal-400 font-bold">
                      {simCompleted} / {simChallenges.length} Concluídos ({formatPtNumber(simPercent, 0)}%)
                    </span>
                  </div>
                )}
              </div>

              {isAvailable && sim.hasChallenges === false ? (
                <div className="py-3 text-xs text-slate-400">
                  Estação de apoio transversal: orienta o raciocínio em qualquer problema das Estações 1 e 2 sem contabilizar pontos ou tentativas.
                </div>
              ) : isAvailable ? (
                <div className="space-y-3">
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${simPercent}%` }}
                    ></div>
                  </div>

                  {/* Lista de Desafios do Simulador */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                    {simChallenges.map((ch) => {
                      const att = attemptsMap[ch.id];
                      const isCompleted = att?.succeeded;

                      return (
                        <div
                          key={ch.id}
                          onClick={() => onOpenChallenge(ch)}
                          className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                            isCompleted
                              ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                              : att && att.attemptsCount > 0
                              ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-400">
                                  {att?.attemptsCount || 0}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-slate-200">
                                {ch.title}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 pl-6">
                              {sim.id === 'movimento-retilineo'
                                ? `Alvo em x = ${formatPtNumber(ch.targetDistance, 1)} m`
                                : `Alvo a ${formatPtNumber(ch.targetDistance, 1)} m`}{' '}
                              •{' '}
                              {isCompleted
                                ? `Acertou em ${att.attemptsCount} tentativa(s)`
                                : att && att.attemptsCount > 0
                                ? `${att.attemptsCount} tentativa(s) efetuada(s)`
                                : 'Por iniciar'}
                            </div>
                          </div>

                          <span className="text-xs text-teal-400 hover:underline shrink-0 ml-2">
                            Resolver →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 font-mono">
                  Módulo reservado para os próximos períodos letivos do 12.º ano.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Exportação de Progresso */}
      {showExportModal && exportData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <span>Exportar o Meu Progresso</span>
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Entrega o teu progresso ao professor descarregando o ficheiro <span className="font-mono text-teal-400">.json</span> ou copiando o código curto de submissão abaixo:
            </p>

            {/* Código Curto para Copiar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Código Curto de Validação:</span>
                {copiedCode && <span className="text-emerald-400 font-semibold">Copiado!</span>}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={exportData.shortCode}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 select-all"
                />
                <button
                  onClick={handleCopyCode}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
                  title="Copiar Código"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão de Descarregar Ficheiro JSON */}
            <button
              onClick={handleDownloadJson}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition"
            >
              <Download className="w-4 h-4" />
              <span>Descarregar Ficheiro (.json)</span>
            </button>

            <button
              onClick={() => setShowExportModal(false)}
              className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
