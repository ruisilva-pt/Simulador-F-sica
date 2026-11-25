/**
 * Dados estruturados e estáticos da Estação 4: Caça ao Erro e exportação Moodle GIFT.
 * Contém as 10 resoluções fixas (enunciado, 3 passos, passo errado, tipo, dica, correção e explicação)
 * e os intervalos paramétricos + parâmetros de cálculo para geração de fichas A4 e exportação GIFT.
 * Esta estação não utiliza IA: todo o conteúdo pedagógico e numérico provém deste ficheiro.
 */

export type ErrorType =
  | 'Unidades'
  | 'Sinal'
  | 'Fórmula'
  | 'Componente'
  | 'Aritmética'
  | 'Conceito';

export const ERROR_HUNT_TYPES: ErrorType[] = [
  'Unidades',
  'Sinal',
  'Fórmula',
  'Componente',
  'Aritmética',
  'Conceito',
];

export interface ErrorHuntResolution {
  id: number;
  statement: string;
  steps: [string, string, string];
  wrongStep: 1 | 2 | 3;
  errorType: ErrorType;
  zoneHint: string;
  correctStepText: string;
  explanation: string;
}

export const ERROR_HUNT_GRAVITY = 9.8;

export const ERROR_HUNT_TEXTS = {
  stationTitle: 'Estação 4: Caça ao Erro',
  stationSubtitle:
    'Identifica o passo errado e classifica o tipo de erro em resoluções de Física do 12.º ano.',
  foundSuccessTitle: 'Encontraste o erro',
  stepPrompt: '1. Toca no passo que consideras errado:',
  typePrompt: '2. Escolhe o tipo de erro:',
  verifyButton: 'Verificar resposta',
  nextButton: 'Próxima resolução',
  finishButton: 'Terminar',
  restartButton: 'Nova ronda',
  level1HintPrefix: 'Dica (Nível 1):',
  level2HintPrefix: 'Dica (Nível 2 — Tipo de erro):',
  revealedTitle: 'Erro revelado após 3 tentativas:',
} as const;

export const ERROR_HUNT_RESOLUTIONS: ErrorHuntResolution[] = [
  {
    id: 1,
    statement: 'Lançamento oblíquo, v0 = 20 m/s, ângulo 30°. Pedido: alcance.',
    steps: [
      'v0x = v0 cos 30° = 17,3 m/s e v0y = v0 sen 30° = 10 m/s',
      'tempo de voo = 2 v0y / g = 2,04 s',
      'R = v0y × t = 10 × 2,04 = 20,4 m',
    ],
    wrongStep: 3,
    errorType: 'Componente',
    zoneHint: 'O erro está na zona final da resolução, ao calcular o alcance.',
    correctStepText: 'R = v0x × t = 17,3 × 2,04 = 35,4 m.',
    explanation:
      'o alcance é uma distância horizontal, por isso usa-se a componente horizontal da velocidade.',
  },
  {
    id: 2,
    statement: 'Lançamento oblíquo, v0 = 20 m/s, ângulo 30°. Pedido: altura máxima.',
    steps: [
      'v0y = v0 sen 30° = 10 m/s',
      'ymáx = v0² / (2g) = 400 / 19,6',
      'ymáx = 20,4 m',
    ],
    wrongStep: 2,
    errorType: 'Componente',
    zoneHint: 'O erro está na zona intermédia, ao aplicar a expressão para a subida.',
    correctStepText: 'ymáx = v0y² / (2g) = 100 / 19,6 = 5,1 m.',
    explanation: 'só a componente vertical da velocidade conta para a subida.',
  },
  {
    id: 3,
    statement: 'Lançamento oblíquo. Pedido: aceleração no ponto mais alto.',
    steps: [
      'no ponto mais alto, vy = 0',
      'como vy = 0, a aceleração também é 0',
      'logo, nesse ponto o projétil deixa de ser acelerado',
    ],
    wrongStep: 2,
    errorType: 'Conceito',
    zoneHint: 'O erro está na zona intermédia, na relação estabelecida entre vy e a aceleração.',
    correctStepText: 'a aceleração é g, dirigida para baixo, em todos os pontos da trajetória.',
    explanation: 'vy = 0 só durante um instante, e a velocidade vertical continua a mudar.',
  },
  {
    id: 4,
    statement: 'MRUA, parte do repouso com a = 2 m/s², durante 5 s. Pedido: posição final.',
    steps: [
      'x = x0 + v0 t + 1/2 a t²',
      'x = 0 + 0 + 1/2 × 2 × 5 = 5',
      'x = 5 m',
    ],
    wrongStep: 2,
    errorType: 'Fórmula',
    zoneHint: 'O erro está na zona intermédia, durante a substituição numérica na equação.',
    correctStepText: 'x = 1/2 × 2 × 5² = 25 m.',
    explanation: 'o tempo está ao quadrado.',
  },
  {
    id: 5,
    statement: 'MRU, velocidade 72 km/h durante 10 s. Pedido: distância percorrida.',
    steps: [
      'v = 72 km/h',
      'x = v × t = 72 × 10',
      'x = 720 m',
    ],
    wrongStep: 2,
    errorType: 'Unidades',
    zoneHint: 'O erro está na zona intermédia, ao multiplicar diretamente os valores dados.',
    correctStepText: '72 km/h = 20 m/s, logo x = 20 × 10 = 200 m.',
    explanation: 'é preciso converter para m/s antes de multiplicar por segundos.',
  },
  {
    id: 6,
    statement:
      'Sistema com massa suspensa, M = 1,0 kg (carro), m = 0,2 kg (massa suspensa). Pedido: aceleração.',
    steps: [
      'a força que acelera o sistema é o peso da massa suspensa, m g = 0,2 × 9,8 = 1,96 N',
      'a = F / M = 1,96 / 1,0 = 1,96 m/s²',
      'a = 1,96 m/s²',
    ],
    wrongStep: 2,
    errorType: 'Fórmula',
    zoneHint: 'O erro está na zona intermédia, ao aplicar a 2.ª lei de Newton para obter a aceleração.',
    correctStepText: 'a = m g / (M + m) = 1,96 / 1,2 = 1,63 m/s².',
    explanation: 'a massa a acelerar é a do carro mais a da massa suspensa.',
  },
  {
    id: 7,
    statement: 'MRUA, v0 = 4 m/s, a = 2 m/s². Pedido: tempo até v = 10 m/s.',
    steps: [
      'v = v0 + a t',
      't = (v + v0) / a = (10 + 4) / 2',
      't = 7 s',
    ],
    wrongStep: 2,
    errorType: 'Sinal',
    zoneHint: 'O erro está na zona intermédia, ao isolar o tempo t na equação das velocidades.',
    correctStepText: 't = (v - v0) / a = (10 - 4) / 2 = 3 s.',
    explanation: 'passa-se v0 para o outro membro com o sinal trocado.',
  },
  {
    id: 8,
    statement: 'Lançamento oblíquo, v0 = 20 m/s. Pedido: comparar os alcances a 30° e a 60°.',
    steps: [
      'R = v0² sen(2θ) / g',
      'o ângulo maior dá maior alcance',
      'logo, R(60°) > R(30°)',
    ],
    wrongStep: 2,
    errorType: 'Conceito',
    zoneHint: 'O erro está na zona intermédia, na interpretação de como o alcance depende do ângulo.',
    correctStepText: 'sen 60° = sen 120°, por isso os dois alcances são iguais (35,4 m).',
    explanation: 'ângulos complementares dão o mesmo alcance, e o máximo está nos 45°.',
  },
  {
    id: 9,
    statement: 'Lançamento oblíquo, v0 = 20 m/s, ângulo 45°. Pedido: alcance.',
    steps: [
      'R = v0² sen(2θ) / g',
      'R = 400 × sen 45° / 9,8',
      'R = 28,9 m',
    ],
    wrongStep: 2,
    errorType: 'Fórmula',
    zoneHint: 'O erro está na zona intermédia, na substituição do ângulo na função trigonométrica.',
    correctStepText: 'R = 400 × sen 90° / 9,8 = 40,8 m.',
    explanation: 'na fórmula entra o dobro do ângulo.',
  },
  {
    id: 10,
    statement: 'MRUA, parte do repouso com a = 3 m/s², Δx = 6 m. Pedido: velocidade final.',
    steps: [
      'v² = v0² + 2 a Δx',
      'v² = 0 + 2 × 3 × 6 = 36',
      'v = 36 m/s',
    ],
    wrongStep: 3,
    errorType: 'Aritmética',
    zoneHint: 'O erro está na zona final da resolução, ao concluir o valor da velocidade.',
    correctStepText: 'v = raiz quadrada de 36 = 6 m/s.',
    explanation: 'calculou-se v² e faltou extrair a raiz.',
  },
];

// ================= INTERVALOS DE CÁLCULO PARA FICHAS A4 E EXPORTAÇÃO MOODLE GIFT =================

export type WorksheetTheme =
  | 'lancamento-obliquo'
  | 'movimento-retilineo'
  | 'massa-suspensa'
  | 'misto';

export type WorksheetCount = 5 | 8 | 10;
export type WorksheetVersion = 'A' | 'B';

export interface WorksheetParameterRange {
  min: number;
  max: number;
  step: number;
  unit: string;
}

export const WORKSHEET_RANGES: Record<
  'v0' | 'angleDeg' | 'a' | 't' | 'M' | 'm' | 'deltaX',
  WorksheetParameterRange
> = {
  v0: { min: 10, max: 30, step: 1, unit: 'm/s' },
  angleDeg: { min: 20, max: 70, step: 5, unit: '°' },
  a: { min: 1, max: 5, step: 0.5, unit: 'm/s²' },
  t: { min: 2, max: 10, step: 1, unit: 's' },
  M: { min: 0.5, max: 2.0, step: 0.1, unit: 'kg' },
  m: { min: 0.1, max: 0.5, step: 0.1, unit: 'kg' },
  deltaX: { min: 10, max: 50, step: 2, unit: 'm' },
};

export const WORKSHEET_G = 9.8;
export const WORKSHEET_GIFT_TOLERANCE_PERCENT = 4;

export const WORKSHEET_THEME_LABELS: Record<WorksheetTheme, string> = {
  'lancamento-obliquo': 'Lançamento oblíquo',
  'movimento-retilineo': 'Movimento retilíneo',
  'massa-suspensa': 'Massa suspensa',
  misto: 'Misto',
};
