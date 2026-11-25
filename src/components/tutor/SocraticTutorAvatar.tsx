import React from 'react';

export type SocraticTutorAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface SocraticTutorAvatarProps {
  size?: SocraticTutorAvatarSize;
  isThinking?: boolean;
  isSpeaking?: boolean;
  framed?: boolean;
  className?: string;
  label?: string;
}

const SIZE_DIMENSIONS: Record<SocraticTutorAvatarSize, { px: number; boxClass: string }> = {
  xs: { px: 20, boxClass: 'w-5 h-5' },
  sm: { px: 28, boxClass: 'w-7 h-7' },
  md: { px: 38, boxClass: 'w-10 h-10 rounded-xl' },
  lg: { px: 46, boxClass: 'w-12 h-12 rounded-xl' },
};

/**
 * Avatar em pixel-art minimalista do tutor Galileu Galilei,
 * com oscilação suave em loop CSS constante (`animate-floating`).
 */
export const SocraticTutorAvatar: React.FC<SocraticTutorAvatarProps> = ({
  size = 'md',
  isThinking = false,
  isSpeaking = false,
  framed = false,
  className = '',
  label = 'Galileu — Tutor Socrático',
}) => {
  const dim = SIZE_DIMENSIONS[size];

  const svgElement = (
    <svg
      width={dim.px}
      height={dim.px}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      className={`animate-floating select-none shrink-0 ${
        isSpeaking
          ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.65)]'
          : isThinking
          ? 'drop-shadow-[0_0_8px_rgba(45,212,191,0.65)]'
          : 'drop-shadow-[0_2px_4px_rgba(13,148,136,0.35)]'
      }`}
    >
      {/* Topo da cabeça (calvície característica de Galileu) */}
      <rect x="6" y="1" width="4" height="1" fill="#f1c29b" />
      <rect x="6" y="2" width="4" height="1" fill="#f1c29b" />
      <rect x="6" y="3" width="4" height="1" fill="#f1c29b" />

      {/* Cabelo lateral prateado */}
      <rect x="5" y="2" width="1" height="1" fill="#cbd5e1" />
      <rect x="10" y="2" width="1" height="1" fill="#cbd5e1" />
      <rect x="4" y="3" width="2" height="1" fill="#e2e8f0" />
      <rect x="10" y="3" width="2" height="1" fill="#e2e8f0" />
      <rect x="4" y="4" width="1" height="3" fill="#94a3b8" />
      <rect x="11" y="4" width="1" height="3" fill="#94a3b8" />
      <rect x="5" y="4" width="1" height="1" fill="#e2e8f0" />
      <rect x="10" y="4" width="1" height="1" fill="#e2e8f0" />

      {/* Rosto, sobrancelhas e olhos */}
      <rect x="6" y="4" width="4" height="1" fill="#e8b48b" />
      <rect x="5" y="5" width="1" height="2" fill="#f1c29b" />
      <rect x="10" y="5" width="1" height="2" fill="#f1c29b" />
      <rect x="7" y="5" width="2" height="1" fill="#f1c29b" />
      <rect x="6" y="5" width="1" height="1" fill="#0f172a" />
      <rect x="9" y="5" width="1" height="1" fill="#0f172a" />
      <rect x="6" y="6" width="1" height="1" fill="#f1c29b" />
      <rect x="9" y="6" width="1" height="1" fill="#f1c29b" />
      <rect x="7" y="6" width="2" height="1" fill="#d99b72" />

      {/* Bigode e barba branca renascentista */}
      <rect x="4" y="7" width="1" height="2" fill="#cbd5e1" />
      <rect x="11" y="7" width="1" height="2" fill="#cbd5e1" />
      <rect x="5" y="7" width="6" height="1" fill="#e2e8f0" />
      <rect x="5" y="8" width="6" height="1" fill="#f8fafc" />
      <rect x="7" y="8" width="2" height="1" fill="#e2e8f0" />
      <rect x="5" y="9" width="1" height="1" fill="#cbd5e1" />
      <rect x="6" y="9" width="4" height="1" fill="#f8fafc" />
      <rect x="10" y="9" width="1" height="1" fill="#cbd5e1" />
      <rect x="6" y="10" width="4" height="1" fill="#f1f5f9" />
      <rect x="7" y="11" width="2" height="1" fill="#e2e8f0" />

      {/* Gola branca académica */}
      <rect x="5" y="10" width="1" height="1" fill="#f8fafc" />
      <rect x="10" y="10" width="1" height="1" fill="#f8fafc" />
      <rect x="5" y="11" width="2" height="1" fill="#cbd5e1" />
      <rect x="9" y="11" width="2" height="1" fill="#cbd5e1" />

      {/* Manto de estudioso (azul-petróleo Viriato + fecho âmbar) */}
      <rect x="4" y="11" width="1" height="1" fill="#0d9488" />
      <rect x="11" y="11" width="1" height="1" fill="#0d9488" />
      <rect x="3" y="12" width="2" height="3" fill="#0f766e" />
      <rect x="11" y="12" width="2" height="3" fill="#0f766e" />
      <rect x="5" y="12" width="2" height="3" fill="#0d9488" />
      <rect x="9" y="12" width="2" height="3" fill="#0d9488" />
      <rect x="7" y="12" width="2" height="1" fill="#f59e0b" />
      <rect x="7" y="13" width="2" height="2" fill="#14b8a6" />
      <rect x="4" y="14" width="8" height="1" fill="#0f766e" />
    </svg>
  );

  if (!framed) {
    return <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>{svgElement}</span>;
  }

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 border transition-colors ${dim.boxClass} ${
        isSpeaking
          ? 'bg-amber-500/15 border-amber-400/50'
          : isThinking
          ? 'bg-teal-500/20 border-teal-400/60'
          : 'bg-teal-500/10 border-teal-500/30'
      } ${className}`}
    >
      {svgElement}
      {(isThinking || isSpeaking) && (
        <span
          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-950 ${
            isSpeaking ? 'bg-amber-400 animate-ping' : 'bg-teal-400 animate-pulse'
          }`}
        />
      )}
    </span>
  );
};
