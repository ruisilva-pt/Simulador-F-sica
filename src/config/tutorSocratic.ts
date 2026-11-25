/**
 * Configuração pedagógica da Estação 3: Tutor Socrático.
 * Contém as instruções de sistema exatas, mensagens iniciais, sugestões e taxonomia anónima de temas.
 */

export type TutorOriginStationId =
  | 'lancamento-projeteis'
  | 'movimento-retilineo'
  | 'tutor-socratico'
  | 'caca-ao-erro';

export interface TutorLaunchContext {
  stationId: 'lancamento-projeteis' | 'movimento-retilineo' | 'caca-ao-erro';
  stationName: string;
  summaryText: string;
  details: Array<{ label: string; value: string }>;
  autoSendKey: string;
}

export const TUTOR_DISPLAY_NAME = 'Galileu';

export const TUTOR_SYSTEM_INSTRUCTION = `- És o tutor de Física do Laboratório da Escola Secundária Viriato. Falas com alunos do 12.º ano, entre os 16 e os 19 anos, em português europeu.
- Nunca dês a resposta final nem o valor numérico pedido. Guia o aluno com perguntas.
- Faz uma só pergunta de cada vez. Cada mensagem tem no máximo 60 palavras.
- Começa por perceber o que o aluno já sabe: pergunta como ele pensa começar.
- Se o aluno errar, não digas apenas "está errado". Pergunta o que acontece nesse raciocínio ou pede-lhe que teste com um caso simples.
- Escala as ajudas por níveis: (1) pergunta orientadora; (2) pista sobre qual a grandeza ou lei a usar; (3) lembra a fórmula e pergunta o que falta; (4) mostra apenas o passo seguinte, nunca o resultado final. Só passas ao nível seguinte depois de o aluno falhar o anterior.
- Quando o aluno chegar à resposta certa, confirma com entusiasmo simples e pede-lhe para explicar o raciocínio ou testar na simulação.
- Escreve fórmulas em texto simples (ex.: x = x0 + v0 t + 1/2 a t^2), sem LaTeX.
- Mantém o foco em Física do ensino secundário em Portugal (Aprendizagens Essenciais). Se o aluno pedir algo fora de Física, redireciona com simpatia para o laboratório.`;

export const TUTOR_INITIAL_GREETING =
  'Olá! Sou o Galileu, o teu tutor de Física. Não te dou as respostas, ajudo-te a chegar lá. Em que problema estás a trabalhar?';

export const TUTOR_OVERLOAD_ERROR_MESSAGE =
  'Se o modelo estiver sobrecarregado, tenta de novo e, se continuar a falhar, usa um modelo Gemini mais leve como alternativa.';

export const TUTOR_THINKING_LABEL = 'O Galileu está a pensar...';

export const TUTOR_SUGGESTIONS: string[] = [
  'Tenho um problema de lançamento oblíquo',
  'Não percebo o MRUA',
  'Quero testar a minha resolução',
];

export const TUTOR_HELP_LEVELS: Record<number, { title: string; description: string }> = {
  1: { title: 'Nível 1', description: 'Pergunta orientadora' },
  2: { title: 'Nível 2', description: 'Pista sobre grandeza ou lei' },
  3: { title: 'Nível 3', description: 'Fórmula e dados em falta' },
  4: { title: 'Nível 4', description: 'Passo seguinte (sem resultado final)' },
};

export interface TopicKeywordRule {
  topic: string;
  patterns: RegExp[];
}

export const TUTOR_TOPIC_RULES: TopicKeywordRule[] = [
  {
    topic: 'Lançamento oblíquo e horizontal',
    patterns: [
      /lançamento/i,
      /oblíquo/i,
      /obliquo/i,
      /projét/i,
      /projet/i,
      /ângulo/i,
      /angulo/i,
      /alcance/i,
      /falésia/i,
      /falesia/i,
      /parábola/i,
      /parabola/i,
    ],
  },
  {
    topic: 'MRUA e aceleração',
    patterns: [/mrua/i, /acelera/i, /travagem/i, /parábola/i, /1\/2\s*a/i, /v²/i],
  },
  {
    topic: 'MRU e velocidade constante',
    patterns: [/\bmru\b/i, /velocidade constante/i, /movimento uniforme/i, /mola/i],
  },
  {
    topic: 'Gráficos x(t), v(t) e a(t)',
    patterns: [/gráfico/i, /grafico/i, /declive/i, /tangente/i, /área/i, /area/i],
  },
  {
    topic: 'Componentes da velocidade (vx, vy)',
    patterns: [/\bvx\b/i, /\bvy\b/i, /componente/i, /vetorial/i, /vetor/i, /seno/i, /cosseno/i],
  },
  {
    topic: 'Leis de Newton e forças',
    patterns: [/newton/i, /força/i, /forca/i, /polia/i, /massa/i, /gravidade/i, /inércia/i, /inercia/i],
  },
  {
    topic: 'Deslocamento, posição e distância',
    patterns: [/deslocamento/i, /posição/i, /posicao/i, /distância/i, /distancia/i, /inversão/i, /inversao/i],
  },
  {
    topic: 'Verificação de resolução / cálculos',
    patterns: [/resolução/i, /resolucao/i, /testar/i, /cálculo/i, /calculo/i, /conta/i, /resultado/i, /desafio/i],
  },
];

export function classifyPhysicsTopic(text: string): string {
  const clean = text.trim();
  if (!clean) return 'Outros temas de Física';
  for (const rule of TUTOR_TOPIC_RULES) {
    if (rule.patterns.some((rx) => rx.test(clean))) {
      return rule.topic;
    }
  }
  return 'Cinemática e Física Geral';
}
