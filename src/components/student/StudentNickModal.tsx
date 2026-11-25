import React, { useState } from 'react';
import { setStudentNick } from '../../utils/storage';
import { User, ShieldCheck } from 'lucide-react';

interface StudentNickModalProps {
  isOpen: boolean;
  currentNick: string;
  onSave: (nick: string) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const StudentNickModal: React.FC<StudentNickModalProps> = ({
  isOpen,
  currentNick,
  onSave,
  onClose,
  canClose = false,
}) => {
  const [nick, setNick] = useState<string>(currentNick || '');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nick.trim();
    if (!clean) {
      setError('Por favor, indica um número ou alcunha para te identificares.');
      return;
    }
    setStudentNick(clean);
    onSave(clean);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Bem-vindo ao Laboratório de Física</h3>
            <p className="text-xs text-slate-400">Escola Secundária Viriato • 12.º Ano</p>
          </div>
        </div>

        <div className="p-3 bg-teal-950/30 border border-teal-500/20 rounded-xl text-teal-200 text-xs flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Privacidade Garantida:</span> Não utilizes o teu nome completo nem email. Escolhe apenas o teu número de turma ou uma alcunha escolar (ex: <span className="font-mono text-teal-300">"12ºB-N14"</span> ou <span className="font-mono text-teal-300">"Viriato_Fisica"</span>).
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Número de Aluno ou Alcunha:
            </label>
            <input
              type="text"
              autoFocus
              maxLength={30}
              placeholder="Ex: Aluno 12.º B - n.º 14"
              value={nick}
              onChange={(e) => {
                setNick(e.target.value);
                setError('');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          {error && <div className="text-xs text-rose-400 font-mono">{error}</div>}

          <div className="flex space-x-2 pt-2">
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition shadow-lg"
            >
              Começar Atividades
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
