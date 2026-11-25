import React from 'react';
import { formatPtNumber } from '../../physics/projectile';
import { LaunchRecord } from '../../types/physics';
import { RectilinearInstant, RectilinearResults } from '../../types/rectilinear';
import { exportLaunchRecordsCsv } from '../../utils/storage';
import { Activity, Check, Download, Table, Trash2, X } from 'lucide-react';

interface RectilinearRecordsTableProps {
  records: LaunchRecord[];
  onClearRecords: () => void;
  currentInstant: RectilinearInstant;
  currentResults: RectilinearResults;
}

export const RectilinearRecordsTable: React.FC<RectilinearRecordsTableProps> = ({
  records,
  onClearRecords,
  currentInstant,
  currentResults,
}) => {
  const rectRecords = records.filter((r) => r.simulatorId === 'movimento-retilineo');

  const handleExportCsv = () => {
    if (records.length === 0) return;
    const csvContent = exportLaunchRecordsCsv(records);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `registos_experimentais_esviriato_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Telemetria Instantânea */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Telemetria Instantânea e Resultados do Movimento</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Instante (t)</span>
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
            <span className="text-slate-500 block text-[10px]">Velocidade v(t)</span>
            <span className="text-emerald-400 font-bold text-sm">
              {formatPtNumber(currentInstant.v, 2)} m/s
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Deslocamento (Δx)</span>
            <span className="text-indigo-400 font-bold text-sm">
              {formatPtNumber(currentResults.displacement, 1)} m
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Distância Total (d)</span>
            <span className="text-amber-400 font-bold text-sm">
              {formatPtNumber(currentResults.distanceTraveled, 1)} m
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Velocidade Média (v_m)</span>
            <span className="text-teal-300 font-bold text-sm">
              {formatPtNumber(currentResults.avgVelocity, 2)} m/s
            </span>
          </div>
        </div>
      </div>

      {/* Tabela Partilhada (Registos de Movimento Retilíneo) */}
      <div className="pt-2">
        <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-slate-200">
              Tabela de Registos — Movimento Retilíneo ({rectRecords.length})
            </h4>
            {records.length > rectRecords.length && (
              <span className="text-[11px] font-mono text-slate-500">
                ({records.length} no total global)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              disabled={records.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-700/30 hover:bg-amber-700/50 text-amber-300 border border-amber-600/40 rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
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

        {rectRecords.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            Nenhum ensaio de movimento retilíneo registado nesta sessão. Clica em "Iniciar Movimento" para adicionar registos.
          </div>
        ) : (
          <div className="overflow-x-auto mt-2 max-h-64 overflow-y-auto">
            <table className="w-full text-left font-mono text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2.5">#</th>
                  <th className="py-2 px-2.5">Modo</th>
                  <th className="py-2 px-2.5">x₀ (m)</th>
                  <th className="py-2 px-2.5">v₀ (m/s)</th>
                  <th className="py-2 px-2.5">a (m/s²)</th>
                  <th className="py-2 px-2.5">Δt (s)</th>
                  <th className="py-2 px-2.5">x_final (m)</th>
                  <th className="py-2 px-2.5">Δx (m)</th>
                  <th className="py-2 px-2.5">Distância d (m)</th>
                  <th className="py-2 px-2.5">v_final (m/s)</th>
                  <th className="py-2 px-2.5">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rectRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-2.5 text-slate-500 font-bold">{rectRecords.length - idx}</td>
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
                    <td className="py-2 px-2.5">{formatPtNumber(r.x0 ?? 0, 1)}</td>
                    <td className="py-2 px-2.5 text-teal-300 font-medium">{formatPtNumber(r.v0, 1)}</td>
                    <td className="py-2 px-2.5 text-orange-300">{formatPtNumber(r.a ?? 0, 1)}</td>
                    <td className="py-2 px-2.5 text-slate-400">{formatPtNumber(r.tMax ?? r.tFlight, 1)}</td>
                    <td className="py-2 px-2.5 text-sky-300 font-bold">{formatPtNumber(r.finalX ?? r.range, 1)}</td>
                    <td className="py-2 px-2.5">{formatPtNumber(r.displacement ?? 0, 1)}</td>
                    <td className="py-2 px-2.5 text-amber-300">{formatPtNumber(r.distanceTraveled ?? 0, 1)}</td>
                    <td className="py-2 px-2.5 text-emerald-300">{formatPtNumber(r.finalV ?? 0, 1)}</td>
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
                      {r.mode === 'livre' && <span className="text-slate-500">Ensaio livre</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
