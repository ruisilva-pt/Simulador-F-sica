/**
 * Configuração da Montagem Experimental da Estação 2 (Movimento Retilíneo - MRU e MRUA).
 * Contém: imagem, idioma, vozes, níveis por ano de escolaridade, posições dos marcadores,
 * textos por nível e conversor de símbolos para leitura em voz alta (TTS).
 */

export type SetupLevel = 'A' | 'B' | 'C';

export type GradeYear = '7.º' | '8.º' | '9.º' | '10.º' | '11.º' | '12.º';

export interface GradeOption {
  year: GradeYear;
  label: string;
  level: SetupLevel;
  levelLabel: string;
}

export interface SetupVoiceOption {
  id: string;
  label: string;
  description: string;
}

export interface SetupMarkerConfig {
  id: number;
  shortTitle: string;
  defaultX: number; // percentagem da largura (0 a 100)
  defaultY: number; // percentagem da altura (0 a 100)
}

/** Caminho da fotografia da montagem experimental (16:9). Substituir aqui para trocar a imagem. */
export const SETUP_IMAGE_PATH = '/assets/aistudio/image_e9811cc6.jpg';

/** Idioma principal da narração (alterar aqui para mudar o idioma enviado ao TTS e ao navegador). */
export const SETUP_TTS_LANGUAGE = 'pt-PT';

/** Frase curta fixa para testar a voz selecionada. */
export const SETUP_VOICE_SAMPLE_TEXT =
  'Olá! Bem-vindo ao Laboratório de Física da Escola Secundária Viriato.';

/** Mapeamento dos anos de escolaridade para os três níveis pedagógicos (A, B, C). */
export const GRADE_OPTIONS: GradeOption[] = [
  { year: '7.º', label: '7.º ano', level: 'A', levelLabel: 'Nível A (7.º e 8.º)' },
  { year: '8.º', label: '8.º ano', level: 'A', levelLabel: 'Nível A (7.º e 8.º)' },
  { year: '9.º', label: '9.º ano', level: 'B', levelLabel: 'Nível B (9.º e 10.º)' },
  { year: '10.º', label: '10.º ano', level: 'B', levelLabel: 'Nível B (9.º e 10.º)' },
  { year: '11.º', label: '11.º ano', level: 'C', levelLabel: 'Nível C (11.º e 12.º)' },
  { year: '12.º', label: '12.º ano', level: 'C', levelLabel: 'Nível C (11.º e 12.º)' },
];

export function getGradeLevelInfo(year: GradeYear): GradeOption {
  return GRADE_OPTIONS.find((g) => g.year === year) || GRADE_OPTIONS[GRADE_OPTIONS.length - 1];
}

/** Vozes pré-definidas do Gemini TTS disponíveis no seletor. Acrescentar novos objetos aqui para adicionar vozes. */
export const SETUP_TTS_VOICES: SetupVoiceOption[] = [
  { id: 'Kore', label: 'Kore', description: 'Feminina • Clara e pausada' },
  { id: 'Puck', label: 'Puck', description: 'Masculina • Expressiva' },
  { id: 'Charon', label: 'Charon', description: 'Masculina • Serena e grave' },
  { id: 'Aoede', label: 'Aoede', description: 'Feminina • Suave e natural' },
  { id: 'Fenrir', label: 'Fenrir', description: 'Masculina • Firme e articulada' },
  { id: 'Zephyr', label: 'Zephyr', description: 'Feminina • Luminosa' },
];

/** Posições iniciais (% largura, % altura) e títulos dos 6 marcadores numerados. */
export const SETUP_MARKERS: SetupMarkerConfig[] = [
  { id: 1, shortTitle: 'Pistas e régua', defaultX: 50, defaultY: 38 },
  { id: 2, shortTitle: 'Carro e sequência em MRU', defaultX: 57, defaultY: 31 },
  { id: 3, shortTitle: 'Carro e sequência em MRUA', defaultX: 47, defaultY: 65 },
  { id: 4, shortTitle: 'Impulsionador de mola', defaultX: 7, defaultY: 31 },
  { id: 5, shortTitle: 'Polia e massa suspensa', defaultX: 95, defaultY: 65 },
  { id: 6, shortTitle: 'Pórtico de sensores', defaultX: 91, defaultY: 30 },
];

/**
 * Textos pedagógicos fixos por nível (A, B, C) e por marcador (1 a 6).
 * O texto apresentado no ecrã usa símbolos físicos no Nível C, mantendo o conteúdo rigorosamente inalterado.
 */
export const SETUP_TEXTS_BY_LEVEL: Record<SetupLevel, Record<number, string>> = {
  A: {
    1: 'As duas pistas são retas e paralelas. Os traços da régua servem para medir a posição do carro, isto é, onde ele está em cada momento. Medindo a posição ao longo do tempo, percebemos como o carro se move.',
    2: 'Este carro avança sempre com a mesma rapidez. As imagens foram tiradas a intervalos de tempo iguais e a distância entre elas é sempre a mesma: em tempos iguais, percorre distâncias iguais. É um movimento retilíneo e uniforme.',
    3: 'Este carro parte parado e vai cada vez mais depressa. Por isso, as imagens, tiradas a intervalos de tempo iguais, ficam cada vez mais afastadas: em cada intervalo, percorre uma distância maior do que no anterior.',
    4: 'A mola dá um empurrão ao carro no início. Depois disso, como quase não há atrito na pista, o carro continua com a mesma rapidez, sem que nada o continue a empurrar.',
    5: 'A massa pendurada é puxada para baixo pela Terra e, através do fio e da polia, puxa o carro. Esse puxão contínuo faz o carro ir cada vez mais depressa.',
    6: 'Os sensores detetam o momento em que o carro passa e medem o tempo. Com a distância e o tempo, calcula-se a rapidez média: a distância percorrida a dividir pelo tempo gasto.',
  },
  B: {
    1: 'As pistas são retas, por isso uma só linha chega para descrever o movimento. Escolhemos uma origem e um sentido positivo, o referencial. A régua mede a posição x do carro em cada instante, e a variação da posição é o deslocamento.',
    2: 'Neste carro a velocidade é constante, por isso a aceleração é nula. Em intervalos de tempo iguais, o deslocamento é igual. O gráfico posição-tempo é uma reta cujo declive é a velocidade, e o gráfico velocidade-tempo é uma reta horizontal.',
    3: 'Neste carro a velocidade aumenta de forma uniforme: em tempos iguais, o aumento de velocidade é o mesmo. A aceleração, que é a variação da velocidade por unidade de tempo, é constante. O gráfico velocidade-tempo é uma reta inclinada e o gráfico posição-tempo é uma curva.',
    4: 'A mola dá ao carro a velocidade inicial. Com atrito desprezável, a força resultante sobre o carro é nula, e a velocidade mantém-se constante. É a lei da inércia, a 1.ª lei de Newton.',
    5: 'A Terra puxa a massa suspensa e, pelo fio, esta puxa o carro com uma força que se mantém praticamente constante. Havendo uma força resultante constante, a aceleração é constante, como indica a 2.ª lei de Newton.',
    6: 'Os sensores medem o intervalo de tempo entre duas passagens. Com o deslocamento e esse intervalo, calcula-se a velocidade média: o deslocamento a dividir pelo intervalo de tempo. Quanto menor o intervalo, mais a velocidade média se aproxima da velocidade num instante.',
  },
  C: {
    1: 'As pistas definem um eixo orientado, com origem à nossa escolha. A posição x é uma coordenada com sinal e o deslocamento é Δx, igual a x final menos x inicial. Só coincide com a distância percorrida se o carro não inverter o sentido.',
    2: 'Com aceleração nula, a velocidade é constante e x = x₀ + v t. No gráfico x(t), o declive da reta é a velocidade. No gráfico v(t), a área sob a reta, entre dois instantes, é o deslocamento nesse intervalo.',
    3: 'Com aceleração constante, v = v₀ + a t, e x = x₀ + v₀ t + ½ a t². O gráfico v(t) é uma reta de declive a e o gráfico x(t) é uma parábola. A velocidade instantânea é o declive da tangente ao gráfico x(t), e a área sob v(t) dá o deslocamento. Eliminando o tempo, obtém-se v² = v₀² + 2 a Δx.',
    4: 'A mola comunica a velocidade inicial v₀. Com atrito desprezável, a força resultante é nula e, pela 1.ª lei de Newton, o carro mantém a velocidade constante.',
    5: 'A massa suspensa m e o carro de massa M estão ligados pelo fio. Desprezando atritos e as massas do fio e da polia, a aceleração é constante, com o valor m g / (M + m), sempre inferior a g.',
    6: 'Os sensores de barreira ótica medem o intervalo de tempo entre passagens. A velocidade média é Δx / Δt. Quando o intervalo de tempo é muito pequeno, aproxima-se da velocidade instantânea, que é o declive da tangente ao gráfico x(t).',
  },
};

/**
 * Converte símbolos matemáticos e físicos para leitura por extenso em português europeu antes de enviar ao TTS.
 */
export function expandSymbolsForTTS(text: string): string {
  return text
    .replace(/m\s*g\s*\/\s*\(\s*M\s*\+\s*m\s*\)/g, 'm g a dividir por M mais m')
    .replace(/Δx\s*\/\s*Δt/g, 'delta x sobre delta t')
    .replace(/delta\s*x\s*\/\s*delta\s*t/gi, 'delta x sobre delta t')
    .replace(/v0\^2|v₀²/g, 'v zero ao quadrado')
    .replace(/v\^2|v²/g, 'v ao quadrado')
    .replace(/t\^2|t²/g, 't ao quadrado')
    .replace(/x0|x₀/g, 'x zero')
    .replace(/y0|y₀/g, 'y zero')
    .replace(/v0x|v₀ₓ/g, 'v zero x')
    .replace(/v0y|v₀ᵧ/g, 'v zero y')
    .replace(/v0|v₀/g, 'v zero')
    .replace(/\bvx\b/gi, 'v x')
    .replace(/\bvy\b/gi, 'v y')
    .replace(/Δx/g, 'delta x')
    .replace(/Δt/g, 'delta t')
    .replace(/Δv/g, 'delta v')
    .replace(/(^|\s)1\/2(?=\s|$|[a-zA-Z])/g, '$1meio ')
    .replace(/½/g, 'meio')
    .replace(/x\(t\)/g, 'x de t')
    .replace(/v\(t\)/g, 'v de t')
    .replace(/a\(t\)/g, 'a de t')
    .replace(/(^|\s)1\.ª(?=\s|$|[.,;])/g, '$1primeira')
    .replace(/(^|\s)2\.ª(?=\s|$|[.,;])/g, '$1segunda')
    .replace(/\s*\+\s*/g, ' mais ')
    .replace(/\s*=\s*/g, ' é igual a ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
