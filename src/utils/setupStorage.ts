import {
  GradeYear,
  SETUP_MARKERS,
  SETUP_TTS_VOICES,
} from '../config/experimentalSetup';

const SETUP_KEYS = {
  GRADE_YEAR: 'esv_setup_grade_year',
  TTS_VOICE: 'esv_setup_tts_voice',
  MARKER_POSITIONS: 'esv_setup_marker_positions',
};

export interface MarkerPosition {
  x: number;
  y: number;
}

export function getSavedGradeYear(): GradeYear {
  try {
    const val = localStorage.getItem(SETUP_KEYS.GRADE_YEAR) as GradeYear | null;
    if (val && ['7.º', '8.º', '9.º', '10.º', '11.º', '12.º'].includes(val)) {
      return val;
    }
  } catch {
    // ignore storage errors
  }
  return '12.º';
}

export function saveGradeYear(year: GradeYear): void {
  try {
    localStorage.setItem(SETUP_KEYS.GRADE_YEAR, year);
  } catch {
    // ignore
  }
}

export function getSavedTtsVoice(): string {
  try {
    const val = localStorage.getItem(SETUP_KEYS.TTS_VOICE);
    if (val && SETUP_TTS_VOICES.some((v) => v.id === val)) {
      return val;
    }
  } catch {
    // ignore
  }
  return SETUP_TTS_VOICES[0].id;
}

export function saveTtsVoice(voiceId: string): void {
  try {
    localStorage.setItem(SETUP_KEYS.TTS_VOICE, voiceId);
  } catch {
    // ignore
  }
}

export function getDefaultMarkerPositions(): Record<number, MarkerPosition> {
  const map: Record<number, MarkerPosition> = {};
  for (const m of SETUP_MARKERS) {
    map[m.id] = { x: m.defaultX, y: m.defaultY };
  }
  return map;
}

export function getSavedMarkerPositions(): Record<number, MarkerPosition> {
  const defaults = getDefaultMarkerPositions();
  try {
    const raw = localStorage.getItem(SETUP_KEYS.MARKER_POSITIONS);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, { x?: number; y?: number }>;
    for (const m of SETUP_MARKERS) {
      const entry = parsed[String(m.id)];
      if (
        entry &&
        typeof entry.x === 'number' &&
        typeof entry.y === 'number' &&
        !Number.isNaN(entry.x) &&
        !Number.isNaN(entry.y)
      ) {
        defaults[m.id] = {
          x: Math.max(2, Math.min(98, entry.x)),
          y: Math.max(2, Math.min(98, entry.y)),
        };
      }
    }
  } catch {
    // fallback to defaults
  }
  return defaults;
}

export function saveMarkerPositions(positions: Record<number, MarkerPosition>): void {
  try {
    localStorage.setItem(SETUP_KEYS.MARKER_POSITIONS, JSON.stringify(positions));
  } catch {
    // ignore
  }
}

export function resetSavedMarkerPositions(): Record<number, MarkerPosition> {
  try {
    localStorage.removeItem(SETUP_KEYS.MARKER_POSITIONS);
  } catch {
    // ignore
  }
  return getDefaultMarkerPositions();
}
