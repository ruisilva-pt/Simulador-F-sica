import React from 'react';
import { KinematicInstant, LaunchRecord, ProjectileResults } from '../../types/physics';
import { exportLaunchRecordsCsv } from '../../utils/storage';
import { formatPtNumber, formatSI } from '../../physics/projectile';
import { Download, Trash2, Table, Check, X, Compass, Activity } from 'lucide-react';

interface LaunchRecordsTableProps {
  records: LaunchRecord[];
  onClearRecords: () => void;
  currentInstant: KinematicInstant;
  currentResults: ProjectileResults;
}

export const LaunchRecordsTable: React.FC<LaunchRecordsTableProps> = ({
  records,
  onClearRecords,
  currentInstant,
  currentResults,
}) => {
  const handleExportCsv = () => {
    if (records.length === 0) return;
    const csvContent = exportLaunchRecordsCsv(records);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `registos_lancamentos_esviriato_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Barra de Telemetria Instantânea em Destaque */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <Activity className="w-4 h-4 text-teal-400" />
          <span>Telemetria Instantânea e Resultados Teóricos</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Tempo Instantâneo (t)</span>
            <span className="text-teal-400 font-bold text-sm">
              {formatPtNumber(currentInstant.t, 2)} s
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Posição x(t)</span>
            <span className="text-sky-400 font-bold text-sm">
              {formatPtNumber(currentInstant.x, 2)} m
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Posição y(t)</span>
            <span className="text-emerald-400 font-bold text-sm">
              {formatPtNumber(currentInstant.y, 2)} m
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Velocidade Instantânea (v)</span>
            <span className="text-amber-400 font-bold text-sm">
              {formatPtNumber(currentInstant.v, 2)} m/s
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Alcance Total (X)</span>
            <span className="text-teal-300 font-bold text-sm">
              {formatPtNumber(currentResults.range, 1)} m
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Altura Máxima (y_máx)</span>
            <span className="text-indigo-400 font-bold text-sm">
              {formatPtNumber(currentResults.maxHeight, 1)} m
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Histórico de Lançamentos */}
      {(() => {
        const projRecords = records.filter(
          (r) => !r.simulatorId || r.simulatorId === 'lancamento-projeteis'
        );
        return (
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <Table className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-semibold text-slate-200">
                  Tabela de Registos Experimentais ({projRecords.length})
                </h4>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCsv}
                  disabled={records.length === 0}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-700/30 hover:bg-teal-700/50 text-teal-300 border border-teal-600/40 rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={onClearRecords}
                  disabled={records.length === 0}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Limpar todos os registos"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              </div>
            </div>

            {projRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-mono">
                Nenhum lançamento registado nesta sessão. Clica em "Lançar Projétil" para adicionar registos.
              </div>
            ) : (
              <div className="overflow-x-auto mt-2 max-h-64 overflow-y-auto">
                <table className="w-full text-left font-mono text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-2.5">#</th>
                      <th className="py-2 px-2.5">Modo</th>
                      <th className="py-2 px-2.5">v₀ (m/s)</th>
                      <th className="py-2 px-2.5">θ (°)</th>
                      <th className="py-2 px-2.5">y₀ (m)</th>
                      <th className="py-2 px-2.5">g (m/s²)</th>
                      <th className="py-2 px-2.5">t_voo (s)</th>
                      <th className="py-2 px-2.5">Alcance (m)</th>
                      <th className="py-2 px-2.5">y_máx (m)</th>
                      <th className="py-2 px-2.5">v_impacto (m/s)</th>
                      <th className="py-2 px-2.5">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {projRecords.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-2.5 text-slate-500 font-bold">{projRecords.length - idx}</td>
                    <td className="py-2 px-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          r.mode === 'desafio'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : r.mode === 'previsao'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.mode}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-teal-300 font-medium">{formatPtNumber(r.v0, 1)}</td>
                    <td className="py-2 px-2.5">{formatPtNumber(r.angleDeg, 0)}°</td>
                    <td className="py-2 px-2.5">{formatPtNumber(r.y0, 1)}</td>
                    <td className="py-2 px-2.5">{formatPtNumber(r.g, 1)}</td>
                    <td className="py-2 px-2.5 text-slate-400">{formatPtNumber(r.tFlight, 2)}</td>
                    <td className="py-2 px-2.5 text-amber-300 font-bold">{formatPtNumber(r.range, 1)}</td>
                    <td className="py-2 px-2.5 text-sky-300">{formatPtNumber(r.maxHeight, 1)}</td>
                    <td className="py-2 px-2.5 text-slate-400">{formatPtNumber(r.vImpact, 1)}</td>
                    <td className="py-2 px-2.5 text-[11px]">
                      {r.mode === 'previsao' && r.predictedRange !== undefined && (
                        <span className="text-teal-400">
                          Previsto: {formatPtNumber(r.predictedRange, 1)}m (Erro {formatPtNumber(r.errorPercentage ?? 0, 1)}%)
                        </span>
                      )}
                      {r.mode === 'desafio' && r.hitTarget !== undefined && (
                        <span
                          className={`flex items-center space-x-1 ${
                            r.hitTarget ? 'text-emerald-400 font-bold' : 'text-rose-400'
                          }`}
                        >
                          {r.hitTarget ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{r.hitTarget ? 'Acertou no Alvo' : 'Falhou Alvo'}</span>
                        </span>
                      )}
                      {r.mode === 'livre' && <span className="text-slate-500">Lançamento livre</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
