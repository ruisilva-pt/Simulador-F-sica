import React, { useMemo, useState } from 'react';
import {
  Printer,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  WORKSHEET_THEME_LABELS,
  WorksheetCount,
  WorksheetTheme,
  WorksheetVersion,
} from '../../config/errorHuntData';
import {
  buildMoodleGiftContent,
  createSerialNumber,
  generateWorksheet,
  parseSerialConfig,
} from '../../utils/worksheetGenerator';

type PrintVariant = 'student' | 'teacher';

export const TeacherWorksheetSection: React.FC = () => {
  const [theme, setTheme] = useState<WorksheetTheme>('misto');
  const [questionCount, setQuestionCount] = useState<WorksheetCount>(5);
  const [version, setVersion] = useState<WorksheetVersion>('A');
  const [serialNumber, setSerialNumber] = useState<string>(() =>
    createSerialNumber('misto', 5, 'A')
  );
  const [showPreviewSolutions, setShowPreviewSolutions] = useState<boolean>(true);
  const [printVariant, setPrintVariant] = useState<PrintVariant>('student');
  const [exportFeedback, setExportFeedback] = useState<string>('');

  const worksheet = useMemo(
    () =>
      generateWorksheet({
        theme,
        questionCount,
        version,
        serialNumber,
      }),
    [theme, questionCount, version, serialNumber]
  );

  const handleThemeChange = (nextTheme: WorksheetTheme) => {
    setTheme(nextTheme);
    const suffix = serialNumber.split('-').pop() || '';
    const numericSeed = /^\d+$/.test(suffix) ? Number(suffix) : undefined;
    setSerialNumber(createSerialNumber(nextTheme, questionCount, version, numericSeed));
  };

  const handleCountChange = (nextCount: WorksheetCount) => {
    setQuestionCount(nextCount);
    const suffix = serialNumber.split('-').pop() || '';
    const numericSeed = /^\d+$/.test(suffix) ? Number(suffix) : undefined;
    setSerialNumber(createSerialNumber(theme, nextCount, version, numericSeed));
  };

  const handleVersionChange = (nextVersion: WorksheetVersion) => {
    setVersion(nextVersion);
    const suffix = serialNumber.split('-').pop() || '';
    const numericSeed = /^\d+$/.test(suffix) ? Number(suffix) : undefined;
    setSerialNumber(createSerialNumber(theme, questionCount, nextVersion, numericSeed));
  };

  const handleSerialInput = (val: string) => {
    setSerialNumber(val);
    const parsed = parseSerialConfig(val);
    if (parsed.theme) setTheme(parsed.theme);
    if (parsed.questionCount) setQuestionCount(parsed.questionCount);
    if (parsed.version) setVersion(parsed.version);
  };

  const handleNewSerial = () => {
    setSerialNumber(createSerialNumber(theme, questionCount, version));
  };

  const handlePrint = (variant: PrintVariant) => {
    setPrintVariant(variant);
    window.setTimeout(() => {
      window.print();
    }, 60);
  };

  const handleExportGift = () => {
    const giftText = buildMoodleGiftContent(worksheet);
    const blob = new Blob([giftText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeSerial = worksheet.serialNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `moodle_gift_${safeSerial}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportFeedback(
      `Ficheiro GIFT exportado (${worksheet.exercises.length} questões numéricas, tolerância 4%).`
    );
    window.setTimeout(() => setExportFeedback(''), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Painel de Configuração (oculto na impressão) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Folha de Exercícios (A4) & Exportação para o Moodle (GIFT)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gera fichas determinísticas por número de série (g = 9,8 m/s²), com cálculo exato exibido a 2 casas decimais.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tema */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Tema</label>
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value as WorksheetTheme)}
              className="w-full min-h-[44px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {(Object.keys(WORKSHEET_THEME_LABELS) as WorksheetTheme[]).map((key) => (
                <option key={key} value={key}>
                  {WORKSHEET_THEME_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          {/* Número de Questões */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Número de questões
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {([5, 8, 10] as WorksheetCount[]).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleCountChange(cnt)}
                  className={`min-h-[44px] rounded-lg text-sm font-mono font-bold border transition ${
                    questionCount === cnt
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Versão */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Versão</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['A', 'B'] as WorksheetVersion[]).map((ver) => (
                <button
                  key={ver}
                  type="button"
                  onClick={() => handleVersionChange(ver)}
                  className={`min-h-[44px] rounded-lg text-sm font-mono font-bold border transition ${
                    version === ver
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  Versão {ver}
                </button>
              ))}
            </div>
          </div>

          {/* Número de Série */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Número de série (reprodutível)
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => handleSerialInput(e.target.value)}
                className="flex-1 min-w-0 min-h-[44px] bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleNewSerial}
                title="Gerar novo número de série"
                className="min-h-[44px] px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Botões de Impressão e Exportação GIFT */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => handlePrint('student')}
            className="min-h-[44px] px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-bold inline-flex items-center gap-2 transition shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir folha do aluno</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrint('teacher')}
            className="min-h-[44px] px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold inline-flex items-center gap-2 transition shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir folha do professor</span>
          </button>

          <button
            type="button"
            onClick={handleExportGift}
            className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 rounded-lg text-sm font-bold inline-flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar GIFT</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewSolutions((prev) => !prev)}
            className="min-h-[44px] px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition sm:ml-auto"
          >
            {showPreviewSolutions ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Ocultar soluções na pré-visualização</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Mostrar soluções na pré-visualização</span>
              </>
            )}
          </button>
        </div>

        {exportFeedback && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
        )}
      </div>

      {/* Pré-visualização em Ecrã (oculta na impressão) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="text-sm font-bold text-slate-100">
              Pré-visualização da Ficha · {worksheet.themeLabel} · Versão {worksheet.version}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              N.º de série: <span className="text-amber-300">{worksheet.serialNumber}</span> ·{' '}
              {worksheet.questionCount} questões
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {worksheet.exercises.map((ex) => (
            <div
              key={ex.index}
              className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2.5"
            >
              <div className="text-sm font-semibold text-slate-100 leading-relaxed">
                <span className="font-mono text-teal-400 mr-2">{ex.index}.</span>
                {ex.statement}
              </div>

              {showPreviewSolutions && (
                <div className="bg-slate-900/90 border border-amber-500/20 rounded-lg p-3 space-y-1.5">
                  <div className="text-xs font-bold text-amber-300">
                    Solução: {ex.formattedValuePt} {ex.unit}
                  </div>
                  <ul className="space-y-1 text-xs font-mono text-slate-300">
                    {ex.solutionSteps.map((step, sIdx) => (
                      <li key={sIdx}>• {step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Área Dedicada para Impressão A4 (visível apenas em @media print) */}
      <div className="hidden print:block print-worksheet-sheet bg-white text-slate-900 p-0">
        <div className="border-b-2 border-slate-800 pb-3 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Laboratório de Física · Escola Secundária Viriato
              </h1>
              <p className="text-sm text-slate-700 mt-0.5">
                Ficha de Exercícios (12.º Ano) — {worksheet.themeLabel} · Versão {worksheet.version}
              </p>
            </div>
            <div className="text-right font-mono text-xs text-slate-700">
              <div>N.º de série: {worksheet.serialNumber}</div>
              <div>{worksheet.questionCount} questões · g = 9,8 m/s²</div>
            </div>
          </div>

          {printVariant === 'student' ? (
            <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-sm font-medium text-slate-900">
              <span>Código: ____</span>
              <span className="text-xs text-slate-600">Folha do Aluno</span>
            </div>
          ) : (
            <div className="mt-3 pt-2 border-t border-slate-300 text-sm font-bold text-slate-900">
              Folha do Professor — Soluções e Passos de Cálculo
            </div>
          )}
        </div>

        <div className="space-y-4">
          {worksheet.exercises.map((ex) => (
            <div
              key={ex.index}
              className="border border-slate-300 rounded-md p-3 break-inside-avoid"
            >
              <div className="text-sm font-semibold text-slate-900 leading-snug">
                <span className="font-mono mr-1.5">{ex.index}.</span>
                {ex.statement}
              </div>

              {printVariant === 'student' ? (
                <div className="mt-3 h-20 border-t border-dashed border-slate-300" />
              ) : (
                <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 text-xs text-slate-800">
                  {ex.solutionSteps.map((step, idx) => (
                    <div key={idx} className="font-mono">
                      • {step}
                    </div>
                  ))}
                  <div className="font-bold text-sm text-slate-900 pt-1">
                    Resultado: {ex.formattedValuePt} {ex.unit}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
