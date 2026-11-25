/**
 * Lista única de configuração dos simuladores do Laboratório de Física.
 * Permite adicionar novos simuladores apenas adicionando um objeto a esta lista,
 * sem necessidade de alterar o restante código da aplicação.
 */

export interface SimulatorConfig {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  iconName:
    | 'Rocket'
    | 'Activity'
    | 'RotateCw'
    | 'Shuffle'
    | 'Atom'
    | 'WaveSine'
    | 'MessageCircleQuestion'
    | 'SearchCheck';
  theme: {
    primary: string;
    accent: string;
    bgBadge: string;
    textBadge: string;
    border: string;
  };
  status: 'disponivel' | 'em_breve';
  hasChallenges?: boolean;
  curriculumBlock: string;
  route: string;
}

export const SIMULATORS_CONFIG: SimulatorConfig[] = [
  {
    id: 'lancamento-projeteis',
    name: 'Laboratório de Movimento',
    shortDescription: 'Lançamento de projéteis (horizontal e oblíquo) em campo gravítico uniforme.',
    longDescription:
      'Estudo analítico e experimental do movimento composto bidimensional: MRU na direção horizontal e MRUA na direção vertical sob a ação exclusiva da aceleração gravítica.',
    iconName: 'Rocket',
    theme: {
      primary: 'teal',
      accent: '#0d9488',
      bgBadge: 'bg-teal-500/10',
      textBadge: 'text-teal-400',
      border: 'border-teal-500/30',
    },
    status: 'disponivel',
    curriculumBlock: '12.º Ano • Mecânica e Cinemática Vetorial',
    route: 'simulador/lancamento-projeteis',
  },
  {
    id: 'movimento-retilineo',
    name: 'Movimento Retilíneo',
    shortDescription: 'Estudo comparativo de MRU e MRUA com gráficos s(t), v(t) e a(t).',
    longDescription:
      'Análise do movimento em linha reta, cálculo de velocidade média e instantânea, aceleração e determinação gráfica do deslocamento.',
    iconName: 'Activity',
    theme: {
      primary: 'amber',
      accent: '#d97706',
      bgBadge: 'bg-amber-500/10',
      textBadge: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    status: 'disponivel',
    curriculumBlock: '12.º Ano • Cinemática a 1 Dimensão (MRU e MRUA)',
    route: 'simulador/movimento-retilineo',
  },
  {
    id: 'tutor-socratico',
    name: 'Galileu',
    shortDescription: 'Tutor Socrático: acompanhamento passo a passo com perguntas orientadoras de Física do 12.º ano.',
    longDescription:
      'Conversa pedagógica guiada pelo método socrático: analisa dúvidas de mecânica, testa o teu raciocínio e descobre a resolução sem receber a resposta feita.',
    iconName: 'MessageCircleQuestion',
    theme: {
      primary: 'teal',
      accent: '#0d9488',
      bgBadge: 'bg-teal-500/10',
      textBadge: 'text-teal-300',
      border: 'border-teal-500/30',
    },
    status: 'disponivel',
    hasChallenges: false,
    curriculumBlock: '12.º Ano • Tutoria Socrática (Todas as Estações)',
    route: 'simulador/tutor-socratico',
  },
  {
    id: 'caca-ao-erro',
    name: 'Caça ao Erro',
    shortDescription: 'Identifica o passo errado e o tipo de erro em resoluções de Mecânica.',
    longDescription:
      'Análise crítica de 10 resoluções passo a passo (lançamento, MRU, MRUA e massa suspensa) para treinar a deteção de erros de unidades, sinal, fórmula e conceito.',
    iconName: 'SearchCheck',
    theme: {
      primary: 'teal',
      accent: '#0d9488',
      bgBadge: 'bg-teal-500/10',
      textBadge: 'text-teal-300',
      border: 'border-teal-500/30',
    },
    status: 'disponivel',
    hasChallenges: false,
    curriculumBlock: '12.º Ano • Análise Crítica de Resoluções',
    route: 'simulador/caca-ao-erro',
  },
  {
    id: 'movimento-circular',
    name: 'Movimento Circular',
    shortDescription: 'MCU e MCUV, velocidade angular, aceleração centrípeta e forças.',
    longDescription:
      'Investigação do movimento periódico em circunferência, relação entre grandezas lineares e angulares, aceleração centrípeta e resultante de forças.',
    iconName: 'RotateCw',
    theme: {
      primary: 'sky',
      accent: '#0284c7',
      bgBadge: 'bg-sky-500/10',
      textBadge: 'text-sky-400',
      border: 'border-sky-500/30',
    },
    status: 'em_breve',
    curriculumBlock: '12.º Ano • Dinâmica e Movimento Curvilíneo',
    route: 'simulador/movimento-circular',
  },
  {
    id: 'colisoes-momento',
    name: 'Colisões e Momento Linear',
    shortDescription: 'Conservação da quantidade de movimento e energia em choques a 1D e 2D.',
    longDescription:
      'Exploração de colisões perfeitamente elásticas e inelásticas, conservação do momento linear e coeficiente de restituição.',
    iconName: 'Shuffle',
    theme: {
      primary: 'orange',
      accent: '#ea580c',
      bgBadge: 'bg-orange-500/10',
      textBadge: 'text-orange-400',
      border: 'border-orange-500/30',
    },
    status: 'em_breve',
    curriculumBlock: '12.º Ano • Teorema da Quantidade de Movimento',
    route: 'simulador/colisoes-momento',
  },
];
