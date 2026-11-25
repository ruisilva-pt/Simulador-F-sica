import React, { useState } from 'react';
import { Challenge, ChallengeDifficulty, ExportedStudentProgress } from '../../types/challenges';
import { SIMULATORS_CONFIG } from '../../config/simulators';
import {
  clearClassSubmissions,
  deleteChallenge,
  exportChallengesJson,
  exportClassSubmissionsCsv,
  getClassSubmissions,
  getTeacherPin,
  importChallengesJson,
  importStudentProgress,
  saveCustomChallenge,
  setTeacherPin,
  toggleChallengeActive,
} from '../../utils/storage';
import {
  clearTutorAnonymousStats,
  getTutorAnonymousStats,
  TutorAnonymousStats,
} from '../../utils/tutorAnalytics';
import { formatPtNumber } from '../../physics/projectile';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  FilePlus,
  KeyRound,
  Download,
  Upload,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Filter,
  ArrowUpDown,
  BookOpen,
  Edit,
  Power,
  FileSpreadsheet,
  MessageCircleQuestion,
  Printer,
} from 'lucide-react';
import { TeacherWorksheetSection } from './TeacherWorksheetSection';

interface TeacherPortalProps {
  challenges: Challenge[];
  onRefreshChallenges: () => void;
  onExitTeacherMode: () => void;
}

type TeacherTab = 'turma' | 'solucoes' | 'criar' | 'fichas' | 'seguranca';

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  challenges,
  onRefreshChallenges,
  onExitTeacherMode,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('turma');

  // Submissões da turma
  const [submissions, setSubmissions] = useState<ExportedStudentProgress[]>(getClassSubmissions());
  const [tutorStats, setTutorStats] = useState<TutorAnonymousStats>(getTutorAnonymousStats());
  const [importInput, setImportInput] = useState<string>('');
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );

  // Ordenação e filtragem da tabela da turma
  const [sortBy, setSortBy] = useState<'nick' | 'completed' | 'attempts' | 'successRate'>('completed');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterSimulator, setFilterSimulator] = useState<string>('todos');

  // PIN do Professor
  const [newPin, setNewPin] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string>('');

  // Formulário de Criação / Edição de Desafio
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [newSimulatorId, setNewSimulatorId] = useState<string>('lancamento-projeteis');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newStatement, setNewStatement] = useState<string>('');
  const [newDifficulty, setNewDifficulty] = useState<ChallengeDifficulty>('medio');
  const [newTargetDistance, setNewTargetDistance] = useState<number>(35.0);
  const [newTolerance, setNewTolerance] = useState<number>(5.0);
  const [newQuantity, setNewQuantity] = useState<string>('Velocidade inicial v₀');
  const [newFixedY0, setNewFixedY0] = useState<string>('0');
  const [newFixedAngle, setNewFixedAngle] = useState<string>('45');
  const [newFixedV0, setNewFixedV0] = useState<string>('');
  const [newFixedG, setNewFixedG] = useState<string>('9.8');
  const [newFixedX0, setNewFixedX0] = useState<string>('0');
  const [newFixedA, setNewFixedA] = useState<string>('');
  const [newFixedTMax, setNewFixedTMax] = useState<string>('5');
  const [newSolutionExplanation, setNewSolutionExplanation] = useState<string>('');
  const [formFeedback, setFormFeedback] = useState<string>('');

  // Filtro da aba de soluções
  const [solutionsFilterSim, setSolutionsFilterSim] = useState<string>('todos');

  // Importar / Exportar JSON do banco de desafios
  const [jsonBankInput, setJsonBankInput] = useState<string>('');
  const [jsonBankFeedback, setJsonBankFeedback] = useState<string>('');

  // Importar submissão de aluno
  const handleImportSubmission = () => {
    if (!importInput.trim()) return;
    const res = importStudentProgress(importInput);
    setImportFeedback(res);
    if (res.success) {
      setSubmissions(getClassSubmissions());
      setImportInput('');
    }
  };

  const handleClearAllSubmissions = () => {
    if (window.confirm('Tem a certeza de que pretende apagar todas as submissões da turma?')) {
      clearClassSubmissions();
      setSubmissions([]);
    }
  };

  const handleExportClassCsv = () => {
    if (submissions.length === 0) return;
    const csv = exportClassSubmissionsCsv(submissions, activeChallengesCount);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_turma_esviriato_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Alterar PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      setTeacherPin(newPin.trim());
      setPinChangeMsg('PIN atualizado com sucesso!');
      setNewPin('');
      setTimeout(() => setPinChangeMsg(''), 3000);
    } else {
      setPinChangeMsg('O PIN deve conter pelo menos 4 caracteres.');
    }
  };

  // Guardar Desafio (Novo ou Editado)
  const handleSaveChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStatement.trim()) {
      setFormFeedback('Por favor, preenche o título e o enunciado do desafio.');
      return;
    }

    const isRect = newSimulatorId === 'movimento-retilineo';
    const fixedParams: Challenge['fixedParams'] = {};
    if (isRect) {
      if (newFixedX0.trim() !== '') fixedParams.x0 = parseFloat(newFixedX0);
      if (newFixedV0.trim() !== '') fixedParams.v0 = parseFloat(newFixedV0);
      if (newFixedA.trim() !== '') fixedParams.a = parseFloat(newFixedA);
      if (newFixedTMax.trim() !== '') fixedParams.tMax = parseFloat(newFixedTMax);
    } else {
      if (newFixedY0.trim() !== '') fixedParams.y0 = parseFloat(newFixedY0);
      if (newFixedAngle.trim() !== '') fixedParams.angleDeg = parseFloat(newFixedAngle);
      if (newFixedV0.trim() !== '') fixedParams.v0 = parseFloat(newFixedV0);
      if (newFixedG.trim() !== '') fixedParams.g = parseFloat(newFixedG);
    }

    const challengeToSave: Challenge = {
      id: editingChallengeId || `${isRect ? 'ret-custom' : 'custom-ch'}-${Date.now()}`,
      simulatorId: newSimulatorId,
      title: newTitle.trim(),
      statement: newStatement.trim(),
      difficulty: newDifficulty,
      targetDistance: Number(newTargetDistance),
      targetTolerance: Number(newTolerance),
      fixedParams,
      targetQuantity: newQuantity.trim(),
      solutionExplanation: newSolutionExplanation.trim() || 'Resolução analítica registada pelo docente.',
      solutionParameters: isRect
        ? {
            x0: fixedParams.x0,
            v0: fixedParams.v0,
            a: fixedParams.a,
            tMax: fixedParams.tMax,
          }
        : {
            y0: fixedParams.y0,
            angleDeg: fixedParams.angleDeg,
            v0: fixedParams.v0,
            g: fixedParams.g,
          },
      active: true,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    saveCustomChallenge(challengeToSave);
    onRefreshChallenges();
    setFormFeedback('Desafio guardado com sucesso no catálogo!');
    resetChallengeForm();
  };

  const resetChallengeForm = () => {
    setEditingChallengeId(null);
    setNewSimulatorId('lancamento-projeteis');
    setNewTitle('');
    setNewStatement('');
    setNewDifficulty('medio');
    setNewTargetDistance(35.0);
    setNewTolerance(5.0);
    setNewQuantity('Velocidade inicial v₀');
    setNewFixedY0('0');
    setNewFixedAngle('45');
    setNewFixedV0('');
    setNewFixedG('9.8');
    setNewFixedX0('0');
    setNewFixedA('');
    setNewFixedTMax('5');
    setNewSolutionExplanation('');
  };

  const startEditChallenge = (ch: Challenge) => {
    setEditingChallengeId(ch.id);
    setNewSimulatorId(ch.simulatorId);
    setNewTitle(ch.title);
    setNewStatement(ch.statement);
    setNewDifficulty(ch.difficulty);
    setNewTargetDistance(ch.targetDistance);
    setNewTolerance(ch.targetTolerance);
    setNewQuantity(ch.targetQuantity);
    setNewFixedY0(ch.fixedParams.y0 !== undefined ? String(ch.fixedParams.y0) : '');
    setNewFixedAngle(ch.fixedParams.angleDeg !== undefined ? String(ch.fixedParams.angleDeg) : '');
    setNewFixedV0(ch.fixedParams.v0 !== undefined ? String(ch.fixedParams.v0) : '');
    setNewFixedG(ch.fixedParams.g !== undefined ? String(ch.fixedParams.g) : '9.8');
    setNewFixedX0(ch.fixedParams.x0 !== undefined ? String(ch.fixedParams.x0) : '');
    setNewFixedA(ch.fixedParams.a !== undefined ? String(ch.fixedParams.a) : '');
    setNewFixedTMax(ch.fixedParams.tMax !== undefined ? String(ch.fixedParams.tMax) : '');
    setNewSolutionExplanation(ch.solutionExplanation);
    setActiveTab('criar');
  };

  const handleToggleActive = (id: string) => {
    toggleChallengeActive(id);
    onRefreshChallenges();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem a certeza de que deseja remover este desafio?')) {
      deleteChallenge(id);
      onRefreshChallenges();
    }
  };

  const handleExportBank = () => {
    const json = exportChallengesJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `banco_desafios_esviriato_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBank = () => {
    if (!jsonBankInput.trim()) return;
    const res = importChallengesJson(jsonBankInput);
    if (res.success) {
      setJsonBankFeedback(`${res.count} desafios importados com sucesso!`);
      onRefreshChallenges();
      setJsonBankInput('');
    } else {
      setJsonBankFeedback('Falha na importação: formato JSON inválido.');
    }
  };

  const availableSims = SIMULATORS_CONFIG.filter(
    (s) => s.status === 'disponivel' && s.hasChallenges !== false
  );
  const activeChallengesCount =
    filterSimulator === 'todos'
      ? challenges.filter((c) => c.active).length
      : challenges.filter((c) => c.active && c.simulatorId === filterSimulator).length;

  const getSubmissionMetrics = (sub: ExportedStudentProgress) => {
    if (filterSimulator === 'todos') {
      const rate =
        activeChallengesCount > 0 ? (sub.summary.totalCompleted / activeChallengesCount) * 100 : 0;
      return {
        completed: sub.summary.totalCompleted,
        avgAttempts: sub.summary.averageAttempts,
        rate,
      };
    }
    const simProg = sub.simulatorProgress?.[filterSimulator];
    const completed = simProg?.completedCount ?? 0;
    const totalSimAttempts =
      simProg?.challenges.reduce((acc, c) => acc + c.attemptsCount, 0) ?? 0;
    const avgAttempts = completed > 0 ? totalSimAttempts / completed : 0;
    const rate = activeChallengesCount > 0 ? (completed / activeChallengesCount) * 100 : 0;
    return { completed, avgAttempts, rate };
  };

  // Ordenar lista de submissões
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const mA = getSubmissionMetrics(a);
    const mB = getSubmissionMetrics(b);

    if (sortBy === 'nick') {
      return sortAsc
        ? a.studentNick.localeCompare(b.studentNick)
        : b.studentNick.localeCompare(a.studentNick);
    }
    if (sortBy === 'completed') {
      return sortAsc ? mA.completed - mB.completed : mB.completed - mA.completed;
    }
    if (sortBy === 'attempts') {
      return sortAsc ? mA.avgAttempts - mB.avgAttempts : mB.avgAttempts - mA.avgAttempts;
    }
    if (sortBy === 'successRate') {
      return sortAsc ? mA.rate - mB.rate : mB.rate - mA.rate;
    }
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Aviso de Isolamento do PIN na Sala de Aula */}
      <div className="print:hidden flex items-start space-x-3 p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-xs">
        <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Aviso Pedagógico de Separação de Vistas:</span> O PIN serve
          apenas para separar o ambiente de trabalho do professor das vistas dos alunos na sala de
          aula (evitando a revelação acidental de soluções no projetor). Os dados permanecem guardados
          localmente no navegador deste dispositivo.
        </div>
      </div>

      {/* Cabeçalho do Modo Professor e Navegação de Abas */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Área de Gestão Pedagógica</h2>
              <p className="text-xs text-slate-400">
                Escola Secundária Viriato • Painel do Professor de Física (12.º Ano)
              </p>
            </div>
          </div>

          <button
            onClick={onExitTeacherMode}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition border border-slate-700"
          >
            <Power className="w-4 h-4 text-rose-400" />
            <span>Sair do Modo Professor</span>
          </button>
        </div>

        {/* Abas */}
        <div className="flex flex-wrap gap-2 pt-4">
          <button
            onClick={() => setActiveTab('turma')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'turma'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Painel da Turma ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('solucoes')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'solucoes'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Soluções Analíticas dos Desafios</span>
          </button>

          <button
            onClick={() => setActiveTab('criar')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'criar'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            <span>{editingChallengeId ? 'Editar Desafio' : 'Criar & Gerir Desafios'}</span>
          </button>

          <button
            onClick={() => setActiveTab('fichas')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'fichas'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Fichas & Moodle</span>
          </button>

          <button
            onClick={() => setActiveTab('seguranca')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'seguranca'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Configurações & PIN</span>
          </button>
        </div>
      </div>

      {/* ================= ABA 1: PAINEL DA TURMA ================= */}
      {activeTab === 'turma' && (
        <div className="space-y-5">
          {/* Caixa de Importação de Submissões */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Importar Códigos de Progresso dos Alunos</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cola aqui o código curto ou o ficheiro JSON entregue pelo aluno na aula para registar o seu progresso no painel da turma:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="Cola aqui o código curto do aluno (base64) ou o conteúdo do ficheiro .json..."
                rows={2}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleImportSubmission}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition shrink-0 self-end sm:self-stretch flex items-center justify-center space-x-1"
              >
                <Upload className="w-4 h-4" />
                <span>Importar Aluno</span>
              </button>
            </div>

            {importFeedback && (
              <div
                className={`text-xs p-2.5 rounded-lg font-mono ${
                  importFeedback.success
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                }`}
              >
                {importFeedback.message}
              </div>
            )}
          </div>

          {/* Tabela de Alunos da Turma */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Quadro Consolidado da Turma ({submissions.length} alunos registados)
                </h3>
                <p className="text-xs text-slate-400">
                  Resultados consolidados de desafios concluídos e eficiência de tentativas
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filterSimulator}
                    onChange={(e) => setFilterSimulator(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="todos">Todos os simuladores</option>
                    {availableSims.map((sim) => (
                      <option key={sim.id} value={sim.id}>
                        {sim.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleExportClassCsv}
                  disabled={submissions.length === 0}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Relatório CSV</span>
                </button>
                <button
                  onClick={handleClearAllSubmissions}
                  disabled={submissions.length === 0}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg transition disabled:opacity-40"
                  title="Limpar submissões"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {submissions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                Ainda não foram importadas submissões de alunos. Solicita aos teus alunos o código gerado no botão "Exportar o meu progresso".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th
                        className="py-2.5 px-3 cursor-pointer hover:text-white"
                        onClick={() => {
                          setSortBy('nick');
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Aluno / Alcunha</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-2.5 px-3">Simuladores</th>
                      <th
                        className="py-2.5 px-3 cursor-pointer hover:text-white"
                        onClick={() => {
                          setSortBy('completed');
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Desafios Concluídos</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-2.5 px-3 cursor-pointer hover:text-white"
                        onClick={() => {
                          setSortBy('attempts');
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Tentativas Médias</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-2.5 px-3 cursor-pointer hover:text-white"
                        onClick={() => {
                          setSortBy('successRate');
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Taxa de Sucesso</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-2.5 px-3">Data de Submissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sortedSubmissions.map((sub, idx) => {
                      const metrics = getSubmissionMetrics(sub);

                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-100">{sub.studentNick}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {availableSims.map((sim) => {
                                const sp = sub.simulatorProgress?.[sim.id];
                                if (!sp) return null;
                                return (
                                  <span
                                    key={sim.id}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                                  >
                                    {sim.id === 'movimento-retilineo' ? 'MRU/A' : 'Projéteis'}:{' '}
                                    {sp.completedCount}/{sp.totalAvailable}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-teal-400 font-semibold">
                            {metrics.completed} / {activeChallengesCount}
                          </td>
                          <td className="py-2.5 px-3 text-amber-400">
                            {formatPtNumber(metrics.avgAttempts, 1)}
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                            {formatPtNumber(metrics.rate, 0)}%
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {new Date(sub.exportedAt).toLocaleString('pt-PT')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumo Anónimo do Tutor Socrático Galileu (Estação 3) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <MessageCircleQuestion className="w-4 h-4 text-teal-400" />
                  <span>Galileu (Tutor Socrático) — Resumo de Utilização (Anónimo)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contagem agregada de conversas por estação de origem e temas mais perguntados, sem nomes nem dados pessoais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Tem a certeza de que pretende reiniciar os contadores anónimos do Tutor Socrático?'
                    )
                  ) {
                    setTutorStats(clearTutorAnonymousStats());
                  }
                }}
                disabled={tutorStats.totalConversations === 0}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Limpar resumo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conversas por Estação */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Conversas por Estação</span>
                  <span className="text-xs font-mono text-teal-400 font-bold">
                    Total: {tutorStats.totalConversations}
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300 bg-slate-900/70 px-3 py-2 rounded border border-slate-800">
                    <span>Estação 1 (Projéteis)</span>
                    <span className="text-teal-400 font-bold">
                      {tutorStats.byStation['lancamento-projeteis']}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 bg-slate-900/70 px-3 py-2 rounded border border-slate-800">
                    <span>Estação 2 (Movimento Retilíneo)</span>
                    <span className="text-amber-400 font-bold">
                      {tutorStats.byStation['movimento-retilineo']}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 bg-slate-900/70 px-3 py-2 rounded border border-slate-800">
                    <span>Estação 3 (Acesso direto)</span>
                    <span className="text-sky-400 font-bold">
                      {tutorStats.byStation['tutor-socratico']}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 bg-slate-900/70 px-3 py-2 rounded border border-slate-800">
                    <span>Estação 4 (Caça ao Erro)</span>
                    <span className="text-emerald-400 font-bold">
                      {tutorStats.byStation['caca-ao-erro'] ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Temas Mais Perguntados */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-200">Temas Mais Perguntados</div>
                {Object.keys(tutorStats.topicCounts).length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 font-mono">
                    Ainda sem perguntas registadas no Tutor Socrático neste dispositivo.
                  </div>
                ) : (
                  <div className="space-y-2 text-xs font-mono">
                    {Object.entries(tutorStats.topicCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([topic, count]) => (
                        <div
                          key={topic}
                          className="flex items-center justify-between text-slate-300 bg-slate-900/70 px-3 py-2 rounded border border-slate-800"
                        >
                          <span className="truncate pr-2">{topic}</span>
                          <span className="text-teal-400 font-bold shrink-0">{count}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 2: SOLUÇÕES ANALÍTICAS ================= */}
      {activeTab === 'solucoes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200">
            <div>
              <span className="font-bold">Acesso Restrito ao Corpo Docente:</span> Esta secção contém
              as deduções matemáticas e as soluções analíticas exatas de cada desafio. Estes dados nunca
              são exibidos nem acessíveis no modo aluno.
            </div>
            <select
              value={solutionsFilterSim}
              onChange={(e) => setSolutionsFilterSim(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="todos">Todos os simuladores</option>
              {availableSims.map((sim) => (
                <option key={sim.id} value={sim.id}>
                  {sim.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {challenges
              .filter((c) => solutionsFilterSim === 'todos' || c.simulatorId === solutionsFilterSim)
              .map((ch) => {
                const isRect = ch.simulatorId === 'movimento-retilineo';
                const simConfig = SIMULATORS_CONFIG.find((s) => s.id === ch.simulatorId);

                return (
                  <div
                    key={ch.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                            isRect
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                          }`}
                        >
                          {simConfig?.name || ch.simulatorId}
                        </span>
                        <span className="font-bold text-sm text-slate-100">{ch.title}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {ch.difficulty}
                        </span>
                        {!ch.active && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-teal-400">
                        {isRect
                          ? `Alvo em x = ${formatPtNumber(ch.targetDistance, 1)} m`
                          : `Alvo a ${formatPtNumber(ch.targetDistance, 1)} m`}{' '}
                        (±{ch.targetTolerance}%)
                      </div>
                    </div>

                    {/* Enunciado */}
                    <div className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                      <span className="font-semibold text-slate-400 block mb-1">Enunciado proposto:</span>
                      {ch.statement}
                    </div>

                    {/* Parâmetros Solução */}
                    {isRect ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Posição x₀</span>
                          <span className="text-slate-200 font-bold">
                            {ch.solutionParameters.x0 !== undefined
                              ? `${formatPtNumber(ch.solutionParameters.x0, 1)} m`
                              : 'Livre'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Velocidade v₀</span>
                          <span className="text-teal-400 font-bold">
                            {ch.solutionParameters.v0 !== undefined
                              ? `${formatPtNumber(ch.solutionParameters.v0, 2)} m/s`
                              : 'Livre'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Aceleração a</span>
                          <span className="text-amber-400 font-bold">
                            {ch.solutionParameters.a !== undefined
                              ? `${formatPtNumber(ch.solutionParameters.a, 2)} m/s²`
                              : 'Livre'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Duração Δt</span>
                          <span className="text-slate-200 font-bold">
                            {ch.solutionParameters.tMax !== undefined
                              ? `${formatPtNumber(ch.solutionParameters.tMax, 1)} s`
                              : 'Livre'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">y₀ inicial</span>
                          <span className="text-slate-200 font-bold">
                            {ch.solutionParameters.y0 !== undefined
                              ? `${formatPtNumber(ch.solutionParameters.y0, 1)} m`
                              : 'Livre'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Ângulo θ</span>
                          <span className="text-slate-200 font-bold">
                            {ch.solutionParameters.angleDeg !== undefined
                              ? `${formatPtNumber(ch.solutionParameters.angleDeg, 1)}°`
                              : 'Livre'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Velocidade v₀ Solução</span>
                          <span className="text-teal-400 font-bold">
                            {ch.solutionParameters.v0 !== undefined
                              ? `${formatPtNumber(ch.solutionParameters.v0, 2)} m/s`
                              : 'Livre'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Gravidade g</span>
                          <span className="text-slate-200 font-bold">
                            {ch.solutionParameters.g !== undefined
                              ? `${formatPtNumber(ch.solutionParameters.g, 1)} m/s²`
                              : '9,8 m/s²'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Resolução Passo a Passo */}
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-teal-500/20 space-y-1.5">
                      <span className="text-xs font-semibold text-teal-400 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Dedução e Resolução Passo a Passo:</span>
                      </span>
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {ch.solutionExplanation}
                      </pre>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ================= ABA 3: CRIAR & GERIR DESAFIOS ================= */}
      {activeTab === 'criar' && (
        <div className="space-y-6">
          {/* Formulário de Criação/Edição */}
          <form
            onSubmit={handleSaveChallenge}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FilePlus className="w-5 h-5 text-amber-400" />
                <span>{editingChallengeId ? 'Editar Desafio Existente' : 'Criar Novo Desafio'}</span>
              </h3>
              {editingChallengeId && (
                <button
                  type="button"
                  onClick={resetChallengeForm}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Simulador Associado *</label>
                <select
                  value={newSimulatorId}
                  onChange={(e) => setNewSimulatorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {availableSims.map((sim) => (
                    <option key={sim.id} value={sim.id}>
                      {sim.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Título do Desafio *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    newSimulatorId === 'movimento-retilineo'
                      ? 'Ex: Desafio: Travagem de Precisão antes do Cruzamento'
                      : 'Ex: Desafio: Tiro Certeiro com Vento Nulo'
                  }
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">
                  Enunciado Pedagógico para o Aluno *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreve o cenário físico, condições iniciais e objetivo do aluno..."
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Grau de Dificuldade</label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value as ChallengeDifficulty)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="facil">Fácil (Iniciação / 12.º ano)</option>
                  <option value="medio">Médio (Consolidação)</option>
                  <option value="avancado">Avançado (Exame Nacional)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Grandeza a Determinar</label>
                <input
                  type="text"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder={
                    newSimulatorId === 'movimento-retilineo'
                      ? 'Ex: Aceleração a (m/s²)'
                      : 'Ex: Velocidade inicial v₀ (m/s)'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {newSimulatorId === 'movimento-retilineo'
                    ? 'Posição do Alvo x_alvo (m) *'
                    : 'Distância do Alvo (m) *'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newTargetDistance}
                  onChange={(e) => setNewTargetDistance(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tolerância de Acerto (%) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="20"
                  required
                  value={newTolerance}
                  onChange={(e) => setNewTolerance(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                />
              </div>

              {/* Parâmetros Fixados */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-amber-400 block mb-2">
                  Parâmetros Fixados (Deixar em branco para permitir ajuste livre ao aluno):
                </span>
                {newSimulatorId === 'movimento-retilineo' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Posição x₀ (m)</label>
                      <input
                        type="text"
                        placeholder="Livre"
                        value={newFixedX0}
                        onChange={(e) => setNewFixedX0(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Velocidade v₀ (m/s)</label>
                      <input
                        type="text"
                        placeholder="Livre"
                        value={newFixedV0}
                        onChange={(e) => setNewFixedV0(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Aceleração a (m/s²)</label>
                      <input
                        type="text"
                        placeholder="Livre"
                        value={newFixedA}
                        onChange={(e) => setNewFixedA(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Duração Δt (s)</label>
                      <input
                        type="text"
                        placeholder="Livre"
                        value={newFixedTMax}
                        onChange={(e) => setNewFixedTMax(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div>
                      <label className="text-[10px] text-slate-400 block">y₀ inicial (m)</label>
                      <input
                        type="text"
                        placeholder="Livre"
                        value={newFixedY0}
                        onChange={(e) => setNewFixedY0(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Ângulo θ (°)</label>
                      <input
                        type="text"
                        placeholder="Livre"
                        value={newFixedAngle}
                        onChange={(e) => setNewFixedAngle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Velocidade v₀ (m/s)</label>
                      <input
                        type="text"
                        placeholder="Livre"
                        value={newFixedV0}
                        onChange={(e) => setNewFixedV0(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Gravidade g (m/s²)</label>
                      <input
                        type="text"
                        value={newFixedG}
                        onChange={(e) => setNewFixedG(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Explicação da Solução para o Professor */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">
                  Resolução e Explicação Pedagógica (Visível apenas ao Professor) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Apresenta os passos matemáticos, fórmulas aplicadas e a velocidade/ângulo exatos que acertam no alvo..."
                  value={newSolutionExplanation}
                  onChange={(e) => setNewSolutionExplanation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {formFeedback && (
              <div className="text-xs text-teal-400 font-mono bg-teal-950/40 p-2.5 rounded-lg border border-teal-500/30">
                {formFeedback}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              {editingChallengeId && (
                <button
                  type="button"
                  onClick={resetChallengeForm}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow-lg"
              >
                {editingChallengeId ? 'Atualizar Desafio' : 'Guardar Novo Desafio'}
              </button>
            </div>
          </form>

          {/* Lista de Gestão dos Desafios (Ativar / Desativar / Editar / Apagar) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                Catálogo de Desafios Disponíveis ({challenges.length})
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportBank}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Exportar Banco (JSON)</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {challenges.map((ch) => {
                const simConfig = SIMULATORS_CONFIG.find((s) => s.id === ch.simulatorId);
                const isRect = ch.simulatorId === 'movimento-retilineo';
                return (
                <div
                  key={ch.id}
                  className={`p-3.5 rounded-lg border transition flex flex-wrap items-center justify-between gap-3 ${
                    ch.active
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                          isRect
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                        }`}
                      >
                        {simConfig?.name || ch.simulatorId}
                      </span>
                      <span className="font-bold text-xs text-slate-200">{ch.title}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {ch.difficulty}
                      </span>
                      {ch.isCustom && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          Personalizado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{ch.statement}</p>
                    <div className="text-[11px] font-mono text-slate-500">
                      {isRect
                        ? `Alvo: x = ${formatPtNumber(ch.targetDistance, 1)} m`
                        : `Alvo: ${formatPtNumber(ch.targetDistance, 1)} m`}{' '}
                      (±{ch.targetTolerance}%) • {ch.targetQuantity}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(ch.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                        ch.active
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {ch.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      onClick={() => startEditChallenge(ch)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
                      title="Editar Desafio"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {ch.isCustom && (
                      <button
                        onClick={() => handleDelete(ch.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded transition"
                        title="Apagar Desafio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Importar Banco JSON */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400">
                Importar Banco de Desafios em JSON:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jsonBankInput}
                  onChange={(e) => setJsonBankInput(e.target.value)}
                  placeholder="Cola aqui o JSON com novos desafios para adicionar ao banco..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
                />
                <button
                  onClick={handleImportBank}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition shrink-0"
                >
                  Importar JSON
                </button>
              </div>
              {jsonBankFeedback && (
                <div className="text-xs font-mono text-teal-400">{jsonBankFeedback}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 4: FICHAS A4 E EXPORTAÇÃO MOODLE GIFT ================= */}
      {activeTab === 'fichas' && <TeacherWorksheetSection />}

      {/* ================= ABA 5: CONFIGURAÇÕES E SEGURANÇA ================= */}
      {activeTab === 'seguranca' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 max-w-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <span>Configuração do PIN de Acesso</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            O PIN é guardado no armazenamento local deste computador e serve para impedir a visualização acidental das soluções pelos alunos durante as aulas ou projeções.
          </p>

          <form onSubmit={handleChangePin} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Novo PIN do Professor</label>
              <input
                type="password"
                maxLength={8}
                placeholder="Introduz pelo menos 4 dígitos..."
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono tracking-widest focus:outline-none focus:border-amber-500"
              />
            </div>

            {pinChangeMsg && (
              <div className="text-xs font-mono text-amber-400">{pinChangeMsg}</div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow"
            >
              Guardar Novo PIN
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
