import React, { useState } from 'react';
import { getTeacherPin, verifyTeacherPin } from '../../utils/storage';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentSavedPin = getTeacherPin();
  const isDefaultPin = currentSavedPin === '1234';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyTeacherPin(pin)) {
      setErrorMsg('');
      setPin('');
      onSuccess();
    } else {
      setErrorMsg('PIN incorreto. Tenta novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Acesso ao Modo Professor</h3>
            <p className="text-xs text-slate-400">Escola Secundária Viriato</p>
          </div>
        </div>

        {/* Aviso Pedagógico Explicativo Obrigatório */}
        <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl text-sky-200 text-xs flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Aviso da Sala de Aula:</span> O PIN serve
            exclusivamente para alternar entre a interface do aluno e do professor na sala de aula
            (evitando a exposição indevida das soluções analíticas). Não protege dados confidenciais
            fora deste navegador.
          </div>
        </div>

        {isDefaultPin && (
          <div className="text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-lg">
            PIN inicial pré-definido: <span className="font-bold text-white">1234</span> (pode ser alterado nas configurações).
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Introduz o PIN do Professor:
            </label>
            <input
              type="password"
              autoFocus
              maxLength={10}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-center text-lg font-mono tracking-widest text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-400 text-center font-mono">{errorMsg}</div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition shadow-lg"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
