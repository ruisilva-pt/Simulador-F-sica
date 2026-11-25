/**
 * Gerador determinístico de fichas de exercícios de Física (12.º ano) e exportador Moodle GIFT.
 * O mesmo número de série gera rigorosamente a mesma folha de exercícios.
 */

import {
  WORKSHEET_G,
  WORKSHEET_GIFT_TOLERANCE_PERCENT,
  WORKSHEET_RANGES,
  WORKSHEET_THEME_LABELS,
  WorksheetCount,
  WorksheetParameterRange,
  WorksheetTheme,
  WorksheetVersion,
} from '../config/errorHuntData';

export type WorksheetQuestionType =
  | 'alcance'
  | 'tempo_voo'
  | 'altura_maxima'
  | 'mrua_posicao'
  | 'mrua_velocidade_final'
  | 'massa_suspensa_aceleracao';

export interface WorksheetExercise {
  index: number;
  type: WorksheetQuestionType;
  title: string;
  statement: string;
  giftStatement: string;
  unit: string;
  exactValue: number;
  formattedValuePt: string;
  formattedValueGift: string;
  giftTolerance: string;
  solutionSteps: string[];
}

export interface GeneratedWorksheet {
  serialNumber: string;
  theme: WorksheetTheme;
  themeLabel: string;
  questionCount: WorksheetCount;
  version: WorksheetVersion;
  exercises: WorksheetExercise[];
}

function hashStringToUint32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickFromRange(rng: () => number, range: WorksheetParameterRange): number {
  const stepsCount = Math.round((range.max - range.min) / range.step);
  const chosenStep = Math.floor(rng() * (stepsCount + 1));
  const val = range.min + chosenStep * range.step;
  return Math.round(val * 1000) / 1000;
}

export function formatPtDecimal(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace('.', ',');
}

export function formatParamValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace('.', ',');
}

/**
 * Escapa os caracteres especiais do formato GIFT (: = ~ { } #) no texto da pergunta/título.
 */
export function escapeGiftText(text: string): string {
  return text.replace(/([:=~{}#])/g, '\\$1');
}

const THEME_CODES: Record<WorksheetTheme, string> = {
  'lancamento-obliquo': 'LO',
  'movimento-retilineo': 'MR',
  'massa-suspensa': 'MS',
  misto: 'MX',
};

const CODE_TO_THEME: Record<string, WorksheetTheme> = {
  LO: 'lancamento-obliquo',
  MR: 'movimento-retilineo',
  MS: 'massa-suspensa',
  MX: 'misto',
};

export function createSerialNumber(
  theme: WorksheetTheme,
  questionCount: WorksheetCount,
  version: WorksheetVersion,
  numericSeed?: number
): string {
  const seed =
    numericSeed !== undefined
      ? Math.abs(Math.floor(numericSeed)) % 1000000
      : Math.floor(100000 + Math.random() * 900000);
  const padded = String(seed).padStart(6, '0');
  return `ESV-${THEME_CODES[theme]}${questionCount}${version}-${padded}`;
}

export function parseSerialConfig(serial: string): {
  theme?: WorksheetTheme;
  questionCount?: WorksheetCount;
  version?: WorksheetVersion;
} {
  const match = serial
    .trim()
    .toUpperCase()
    .match(/^ESV-(LO|MR|MS|MX)(5|8|10)(A|B)-([A-Z0-9]+)$/);
  if (!match) return {};
  const countNum = Number(match[2]);
  const questionCount: WorksheetCount = countNum === 5 ? 5 : countNum === 8 ? 8 : 10;
  return {
    theme: CODE_TO_THEME[match[1]],
    questionCount,
    version: match[3] === 'B' ? 'B' : 'A',
  };
}

function getTypesForTheme(theme: WorksheetTheme): WorksheetQuestionType[] {
  switch (theme) {
    case 'lancamento-obliquo':
      return ['alcance', 'tempo_voo', 'altura_maxima'];
    case 'movimento-retilineo':
      return ['mrua_posicao', 'mrua_velocidade_final'];
    case 'massa-suspensa':
      return ['massa_suspensa_aceleracao'];
    case 'misto':
    default:
      return [
        'alcance',
        'tempo_voo',
        'altura_maxima',
        'mrua_posicao',
        'mrua_velocidade_final',
        'massa_suspensa_aceleracao',
      ];
  }
}

export function generateWorksheet(options: {
  theme: WorksheetTheme;
  questionCount: WorksheetCount;
  version: WorksheetVersion;
  serialNumber: string;
}): GeneratedWorksheet {
  const cleanSerial = options.serialNumber.trim() || createSerialNumber(
    options.theme,
    options.questionCount,
    options.version
  );

  // O mesmo número de série (+ parâmetros da folha) garante sempre a mesma sequência exata
  const seedInput = `${cleanSerial}|${options.theme}|${options.questionCount}|${options.version}`;
  const rng = createMulberry32(hashStringToUint32(seedInput));

  const availableTypes = getTypesForTheme(options.theme);
  const exercises: WorksheetExercise[] = [];
  const g = WORKSHEET_G;
  const gPt = formatParamValue(g);

  for (let i = 0; i < options.questionCount; i++) {
    const index = i + 1;
    // Garante variedade equilibrada no tema misto e nos subtipos
    const type = availableTypes[(i + Math.floor(rng() * availableTypes.length)) % availableTypes.length];

    let title = '';
    let statement = '';
    let giftStatement = '';
    let unit = 'm';
    let exactValue = 0;
    let solutionSteps: string[] = [];

    if (type === 'alcance') {
      const v0 = pickFromRange(rng, WORKSHEET_RANGES.v0);
      const angle = pickFromRange(rng, WORKSHEET_RANGES.angleDeg);
      const rad = (angle * Math.PI) / 180;
      exactValue = (v0 * v0 * Math.sin(2 * rad)) / g;
      unit = 'm';
      title = `Q${index} - Alcance em lançamento oblíquo (${options.version})`;
      statement = `Um projétil é lançado do solo com velocidade inicial v0 = ${v0} m/s, formando um ângulo de ${angle}° com a horizontal (g = ${gPt} m/s²). Calcula o alcance horizontal do projétil (em m).`;
      giftStatement = statement;
      const v0x = v0 * Math.cos(rad);
      const v0y = v0 * Math.sin(rad);
      const tFlight = (2 * v0y) / g;
      solutionSteps = [
        `v0x = ${v0} × cos(${angle}°) = ${formatPtDecimal(v0x)} m/s ; v0y = ${v0} × sen(${angle}°) = ${formatPtDecimal(v0y)} m/s`,
        `Tempo de voo: t = 2 v0y / g = ${formatPtDecimal(tFlight)} s`,
        `R = v0² sen(2 × ${angle}°) / ${gPt} = ${formatPtDecimal(exactValue)} m`,
      ];
    } else if (type === 'tempo_voo') {
      const v0 = pickFromRange(rng, WORKSHEET_RANGES.v0);
      const angle = pickFromRange(rng, WORKSHEET_RANGES.angleDeg);
      const rad = (angle * Math.PI) / 180;
      const v0y = v0 * Math.sin(rad);
      exactValue = (2 * v0y) / g;
      unit = 's';
      title = `Q${index} - Tempo de voo (${options.version})`;
      statement = `Um projétil é lançado a partir do solo com v0 = ${v0} m/s e ângulo de ${angle}° acima da horizontal (g = ${gPt} m/s²). Calcula o tempo total de voo até regressar ao solo (em s).`;
      giftStatement = statement;
      solutionSteps = [
        `v0y = ${v0} × sen(${angle}°) = ${formatPtDecimal(v0y)} m/s`,
        `t = 2 v0y / g = (2 × ${formatPtDecimal(v0y)}) / ${gPt} = ${formatPtDecimal(exactValue)} s`,
      ];
    } else if (type === 'altura_maxima') {
      const v0 = pickFromRange(rng, WORKSHEET_RANGES.v0);
      const angle = pickFromRange(rng, WORKSHEET_RANGES.angleDeg);
      const rad = (angle * Math.PI) / 180;
      const v0y = v0 * Math.sin(rad);
      exactValue = (v0y * v0y) / (2 * g);
      unit = 'm';
      title = `Q${index} - Altura máxima (${options.version})`;
      statement = `Um projétil parte do solo com velocidade inicial v0 = ${v0} m/s segundo um ângulo de ${angle}° com a horizontal (g = ${gPt} m/s²). Determina a altura máxima atingida (em m).`;
      giftStatement = statement;
      solutionSteps = [
        `v0y = ${v0} × sen(${angle}°) = ${formatPtDecimal(v0y)} m/s`,
        `ymáx = v0y² / (2 g) = (${formatPtDecimal(v0y)})² / (2 × ${gPt}) = ${formatPtDecimal(exactValue)} m`,
      ];
    } else if (type === 'mrua_posicao') {
      const a = pickFromRange(rng, WORKSHEET_RANGES.a);
      const t = pickFromRange(rng, WORKSHEET_RANGES.t);
      exactValue = 0.5 * a * t * t;
      unit = 'm';
      title = `Q${index} - Posição em MRUA (${options.version})`;
      statement = `Um móvel parte do repouso (x0 = 0 m, v0 = 0 m/s) em movimento retilíneo uniformemente acelerado com aceleração constante a = ${formatParamValue(a)} m/s². Calcula a posição x(t) ao fim de t = ${t} s (em m).`;
      giftStatement = statement;
      solutionSteps = [
        `x(t) = x0 + v0 t + 1/2 a t²`,
        `x(${t}) = 0 + 0 + 1/2 × ${formatParamValue(a)} × ${t}² = ${formatPtDecimal(exactValue)} m`,
      ];
    } else if (type === 'mrua_velocidade_final') {
      const v0 = pickFromRange(rng, WORKSHEET_RANGES.v0);
      const a = pickFromRange(rng, WORKSHEET_RANGES.a);
      const deltaX = pickFromRange(rng, WORKSHEET_RANGES.deltaX);
      const vSquared = v0 * v0 + 2 * a * deltaX;
      exactValue = Math.sqrt(vSquared);
      unit = 'm/s';
      title = `Q${index} - Velocidade final em MRUA (${options.version})`;
      statement = `Um carrinho desloca-se em trajetória retilínea com velocidade inicial v0 = ${v0} m/s e aceleração constante a = ${formatParamValue(a)} m/s² ao longo de um deslocamento Δx = ${deltaX} m. Usa v² = v0² + 2 a Δx para calcular a velocidade final v (em m/s).`;
      giftStatement = statement;
      solutionSteps = [
        `v² = ${v0}² + 2 × ${formatParamValue(a)} × ${deltaX} = ${formatPtDecimal(vSquared)} m²/s²`,
        `v = √(${formatPtDecimal(vSquared)}) = ${formatPtDecimal(exactValue)} m/s`,
      ];
    } else {
      const M = pickFromRange(rng, WORKSHEET_RANGES.M);
      const m = pickFromRange(rng, WORKSHEET_RANGES.m);
      exactValue = (m * g) / (M + m);
      unit = 'm/s²';
      title = `Q${index} - Aceleração com massa suspensa (${options.version})`;
      statement = `Numa pista horizontal sem atrito, um carro de massa M = ${formatParamValue(M)} kg está ligado por um fio ideal, através de uma polia, a uma massa suspensa m = ${formatParamValue(m)} kg (g = ${gPt} m/s²). Calcula o módulo da aceleração do sistema (em m/s²).`;
      giftStatement = statement;
      solutionSteps = [
        `Força motora: P = m g = ${formatParamValue(m)} × ${gPt} = ${formatPtDecimal(m * g)} N`,
        `Massa total: M + m = ${formatParamValue(M + m)} kg`,
        `a = m g / (M + m) = ${formatPtDecimal(m * g)} / ${formatParamValue(M + m)} = ${formatPtDecimal(exactValue)} m/s²`,
      ];
    }

    const roundedGiftNum = Number(exactValue.toFixed(2));
    const tol = Math.max(
      0.01,
      Number(((roundedGiftNum * WORKSHEET_GIFT_TOLERANCE_PERCENT) / 100).toFixed(2))
    );

    exercises.push({
      index,
      type,
      title,
      statement,
      giftStatement,
      unit,
      exactValue,
      formattedValuePt: formatPtDecimal(exactValue, 2),
      formattedValueGift: roundedGiftNum.toFixed(2),
      giftTolerance: tol.toFixed(2),
      solutionSteps,
    });
  }

  return {
    serialNumber: cleanSerial,
    theme: options.theme,
    themeLabel: WORKSHEET_THEME_LABELS[options.theme],
    questionCount: options.questionCount,
    version: options.version,
    exercises,
  };
}

export function buildMoodleGiftContent(worksheet: GeneratedWorksheet): string {
  const blocks = worksheet.exercises.map((ex) => {
    const escapedTitle = escapeGiftText(ex.title);
    const escapedQuestion = escapeGiftText(ex.giftStatement);
    return `::${escapedTitle}:: ${escapedQuestion} {#${ex.formattedValueGift}:${ex.giftTolerance}}`;
  });

  return `${blocks.join('\n\n')}\n`;
}
