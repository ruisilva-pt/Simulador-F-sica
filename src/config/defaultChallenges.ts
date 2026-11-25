import { Challenge } from '../types/challenges';

export const DEFAULT_PROJECTILE_CHALLENGES: Challenge[] = [
  {
    id: 'proj-desafio-1',
    simulatorId: 'lancamento-projeteis',
    title: 'Desafio 1: Lançamento horizontal do cimo de uma falésia',
    statement:
      'No lançamento horizontal do cimo de uma falésia com altura inicial y₀ = 20,0 m, na Terra (g = 9,8 m/s²), uma esfera é lançada com ângulo θ = 0°. Pretende-se que a esfera atinja o centro de um alvo colocado no solo à distância de 30,0 m da base da falésia.',
    difficulty: 'facil',
    targetDistance: 30.0,
    targetTolerance: 4.0, // ±4% (28,8 m a 31,2 m)
    fixedParams: {
      y0: 20.0,
      angleDeg: 0,
      g: 9.8,
      gravityName: 'Terra',
    },
    targetQuantity: 'Velocidade inicial v₀ (com θ = 0° e y₀ = 20,0 m)',
    solutionExplanation:
      '1. No movimento horizontal (θ = 0°): v₀x = v₀ e v₀y = 0 m/s.\n' +
      '2. Equação do movimento vertical: y(t) = y₀ - ½ g t².\n' +
      '3. No instante do impacto (y = 0): 0 = 20,0 - 0,5 × 9,8 × t² <=> 4,9 t² = 20,0 <=> t_voo = √(20,0 / 4,9) ≈ 2,020 s.\n' +
      '4. Equação do movimento horizontal: x(t) = v₀x × t <=> x = v₀ × t_voo.\n' +
      '5. Para x = 30,0 m: v₀ = x / t_voo = 30,0 / 2,020 ≈ 14,85 m/s (aceita-se entre 14,3 m/s e 15,4 m/s).',
    solutionParameters: {
      v0: 14.85,
      angleDeg: 0,
      y0: 20.0,
      g: 9.8,
    },
    active: true,
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'proj-desafio-2',
    simulatorId: 'lancamento-projeteis',
    title: 'Desafio 2: O Alcance aos 45° ao Nível do Solo',
    statement:
      'Ao nível do solo (y₀ = 0,0 m), um projétil é lançado sob um ângulo de 45,0° na Terra (g = 9,8 m/s²). O objetivo é acertar num sensor localizado no solo a 40,0 m de distância.',
    difficulty: 'facil',
    targetDistance: 40.0,
    targetTolerance: 3.5,
    fixedParams: {
      y0: 0.0,
      angleDeg: 45,
      g: 9.8,
      gravityName: 'Terra',
    },
    targetQuantity: 'Velocidade inicial v₀ necessária',
    solutionExplanation:
      '1. Para y₀ = 0 m, a fórmula analítica do alcance é X = (v₀² × sen(2θ)) / g.\n' +
      '2. Para θ = 45°, temos 2θ = 90° e sen(90°) = 1, logo X = v₀² / g (alcance máximo para a mesma velocidade).\n' +
      '3. Isolando v₀: v₀ = √(g × X) = √(9,8 × 40,0) = √392 ≈ 19,80 m/s.\n' +
      '4. Tempo de voo correspondente: t_voo = 2 v₀ sen(45°) / g = 2 × 19,80 × 0,7071 / 9,8 ≈ 2,86 s.',
    solutionParameters: {
      v0: 19.8,
      angleDeg: 45,
      y0: 0.0,
      g: 9.8,
    },
    active: true,
    createdAt: '2025-01-15T09:15:00Z',
  },
  {
    id: 'proj-desafio-3',
    simulatorId: 'lancamento-projeteis',
    title: 'Desafio 3: O Teorema dos Ângulos Complementares',
    statement:
      'Com velocidade inicial fixa v₀ = 22,0 m/s a partir do solo (y₀ = 0,0 m, g = 9,8 m/s²), determina o ângulo de lançamento θ (com 0° < θ < 90°) para atingir um alvo a 45,0 m de distância. Observa que existem dois ângulos possíveis que são complementares (a sua soma é 90°)!',
    difficulty: 'medio',
    targetDistance: 45.0,
    targetTolerance: 4.0,
    fixedParams: {
      y0: 0.0,
      v0: 22.0,
      g: 9.8,
      gravityName: 'Terra',
    },
    targetQuantity: 'Ângulo de tiro θ (ajustando o seletor angular)',
    solutionExplanation:
      '1. A partir de X = (v₀² × sen(2θ)) / g, isolamos sen(2θ):\n' +
      '   sen(2θ) = (g × X) / v₀² = (9,8 × 45,0) / (22,0)² = 441 / 484 ≈ 0,91116.\n' +
      '2. O arco-seno dá: 2θ₁ = arcsen(0,91116) ≈ 65,67° => θ₁ ≈ 32,8°.\n' +
      '3. Pela propriedade trigonométrica sen(180° - α) = sen(α), a outra solução é:\n' +
      '   2θ₂ = 180° - 65,67° = 114,33° => θ₂ ≈ 57,2°.\n' +
      '4. Repara que θ₁ + θ₂ = 32,8° + 57,2° = 90,0° (ângulos complementares). Qualquer um dos dois é válido!',
    solutionParameters: {
      v0: 22.0,
      angleDeg: 32.8,
      y0: 0.0,
      g: 9.8,
    },
    active: true,
    createdAt: '2025-01-15T09:30:00Z',
  },
  {
    id: 'proj-desafio-4',
    simulatorId: 'lancamento-projeteis',
    title: 'Desafio 4: Exploração Lunar com Gravidade Reduzida',
    statement:
      'Numa missão de amostragem geológica na Lua (onde g = 1,6 m/s²), um pequeno projétil transmissor é disparado de uma rampa a y₀ = 5,0 m de altura sob um ângulo de 30,0°. Ajusta a velocidade inicial v₀ para que o transmissor aterre exatamente a 35,0 m de distância.',
    difficulty: 'medio',
    targetDistance: 35.0,
    targetTolerance: 4.0,
    fixedParams: {
      y0: 5.0,
      angleDeg: 30,
      g: 1.6,
      gravityName: 'Lua',
    },
    targetQuantity: 'Velocidade inicial v₀ em ambiente lunar',
    solutionExplanation:
      '1. Na Lua, g = 1,6 m/s². θ = 30° => cos(30°) = √3/2 ≈ 0,8660; sen(30°) = 0,5.\n' +
      '2. Equação da trajetória: y(x) = y₀ + x tg(θ) - (g x²) / (2 v₀² cos²(θ)).\n' +
      '3. No solo y = 0 com x = 35,0 m:\n' +
      '   0 = 5,0 + 35,0 × tg(30°) - (1,6 × 35,0²) / (2 × v₀² × (cos 30°)²)\n' +
      '   0 = 5,0 + 35,0 × 0,57735 - (1,6 × 1225) / (2 × v₀² × 0,75)\n' +
      '   0 = 5,0 + 20,207 - 1960 / (1,5 × v₀²)\n' +
      '   25,207 = 1306,67 / v₀² <=> v₀² = 1306,67 / 25,207 ≈ 51,838\n' +
      '4. v₀ = √51,838 ≈ 7,20 m/s.\n' +
      '5. Verificação: com v₀ = 7,20 m/s, v₀x = 6,24 m/s, v₀y = 3,60 m/s. t_voo = (3,60 + √(3,60² + 2×1,6×5)) / 1,6 = (3,60 + √(12,96 + 16)) / 1,6 = (3,60 + 5,381) / 1,6 ≈ 5,61 s. x = 6,24 × 5,61 ≈ 35,0 m.',
    solutionParameters: {
      v0: 7.2,
      angleDeg: 30,
      y0: 5.0,
      g: 1.6,
    },
    active: true,
    createdAt: '2025-01-15T09:45:00Z',
  },
  {
    id: 'proj-desafio-5',
    simulatorId: 'lancamento-projeteis',
    title: 'Desafio 5: Lançamento Balístico com Desnível de 15 m',
    statement:
      'A partir de uma plataforma fortificada a y₀ = 15,0 m de altitude, é disparado um projétil com ângulo de elevação fixo θ = 35,0° na Terra (g = 9,8 m/s²). O objetivo é acertar num alvo situado a 65,0 m da base da plataforma. Determina a velocidade inicial v₀ necessária.',
    difficulty: 'avancado',
    targetDistance: 65.0,
    targetTolerance: 3.5,
    fixedParams: {
      y0: 15.0,
      angleDeg: 35,
      g: 9.8,
      gravityName: 'Terra',
    },
    targetQuantity: 'Velocidade inicial exata v₀',
    solutionExplanation:
      '1. Equação da trajetória balística sem atrito do ar:\n' +
      '   y(x) = y₀ + x tg(θ) - [g / (2 cos²θ)] × (x² / v₀²)\n' +
      '2. Inserindo as condições de fronteira (impacto no solo y = 0 para x = 65,0 m):\n' +
      '   0 = 15,0 + 65,0 × tg(35°) - [9,8 / (2 × cos²(35°))] × (65,0² / v₀²)\n' +
      '3. tg(35°) ≈ 0,700208; cos(35°) ≈ 0,819152 => cos²(35°) ≈ 0,67101\n' +
      '   Termo linear: 15,0 + 65,0 × 0,700208 = 15,0 + 45,5135 = 60,5135 m\n' +
      '   Termo gravitítico no numerador: 9,8 × 65,0² = 9,8 × 4225 = 41405\n' +
      '   Denominador auxiliar: 2 × 0,67101 = 1,34202\n' +
      '   Fator: 41405 / 1,34202 ≈ 30852,7\n' +
      '4. 60,5135 = 30852,7 / v₀² <=> v₀² = 30852,7 / 60,5135 ≈ 509,85\n' +
      '5. v₀ = √509,85 ≈ 22,58 m/s (aceita-se entre 21,8 m/s e 23,4 m/s).',
    solutionParameters: {
      v0: 22.58,
      angleDeg: 35,
      y0: 15.0,
      g: 9.8,
    },
    active: true,
    createdAt: '2025-01-15T10:00:00Z',
  },
];

export const DEFAULT_RECTILINEAR_CHALLENGES: Challenge[] = [
  {
    id: 'ret-desafio-1',
    simulatorId: 'movimento-retilineo',
    title: 'Desafio 1: Movimento Retilíneo Uniforme (MRU)',
    statement:
      'Um carrinho parte da origem (x₀ = 0,0 m) com aceleração nula (a = 0,0 m/s²). Pretende-se que passe exatamente pelo sensor de posição situado em x = 60,0 m ao fim de t = 5,0 s. Determina a velocidade inicial v₀ necessária.',
    difficulty: 'facil',
    targetDistance: 60.0,
    targetTolerance: 3.0,
    fixedParams: {
      x0: 0.0,
      a: 0.0,
      tMax: 5.0,
    },
    targetQuantity: 'Velocidade constante v₀ (m/s)',
    solutionExplanation:
      '1. Como a = 0 m/s², trata-se de um Movimento Retilíneo Uniforme (MRU): x(t) = x₀ + v₀ · t.\n' +
      '2. Substituindo x₀ = 0,0 m, x = 60,0 m e t = 5,0 s:\n' +
      '   60,0 = 0 + v₀ × 5,0\n' +
      '3. v₀ = 60,0 / 5,0 = 12,0 m/s.\n' +
      '4. Verificação: o gráfico v(t) é uma reta horizontal em v = 12,0 m/s cuja área até t = 5,0 s vale 12,0 × 5,0 = 60,0 m.',
    solutionParameters: {
      x0: 0.0,
      v0: 12.0,
      a: 0.0,
      tMax: 5.0,
    },
    active: true,
    createdAt: '2026-11-17T08:00:00Z',
  },
  {
    id: 'ret-desafio-2',
    simulatorId: 'movimento-retilineo',
    title: 'Desafio 2: MRUA a Partir do Repouso',
    statement:
      'Um móvel parte do repouso (v₀ = 0,0 m/s) na posição inicial x₀ = 0,0 m e desloca-se durante t = 6,0 s em trajetória retilínea. Ajusta a aceleração constante a para que o móvel alcance exatamente a marca x = 72,0 m no final dos 6,0 s.',
    difficulty: 'facil',
    targetDistance: 72.0,
    targetTolerance: 3.5,
    fixedParams: {
      x0: 0.0,
      v0: 0.0,
      tMax: 6.0,
    },
    targetQuantity: 'Aceleração constante a (m/s²)',
    solutionExplanation:
      '1. Equação das posições no MRUA: x(t) = x₀ + v₀ · t + ½ · a · t².\n' +
      '2. Como x₀ = 0,0 m e v₀ = 0,0 m/s, simplifica-se para: x(t) = ½ · a · t².\n' +
      '3. Para x = 72,0 m e t = 6,0 s:\n' +
      '   72,0 = 0,5 × a × (6,0)² <=> 72,0 = 18,0 · a\n' +
      '4. a = 72,0 / 18,0 = 4,0 m/s².\n' +
      '5. A velocidade final será v(6,0) = 0 + 4,0 × 6,0 = 24,0 m/s.',
    solutionParameters: {
      x0: 0.0,
      v0: 0.0,
      a: 4.0,
      tMax: 6.0,
    },
    active: true,
    createdAt: '2026-11-17T08:15:00Z',
  },
  {
    id: 'ret-desafio-3',
    simulatorId: 'movimento-retilineo',
    title: 'Desafio 3: Travagem Uniformemente Retardada',
    statement:
      'Um veículo desloca-se no sentido positivo a v₀ = 20,0 m/s ao passar pela origem (x₀ = 0,0 m). O condutor trava uniformemente durante t = 5,0 s até se imobilizar junto a um sinal em x = 50,0 m. Determina a aceleração de travagem a.',
    difficulty: 'medio',
    targetDistance: 50.0,
    targetTolerance: 4.0,
    fixedParams: {
      x0: 0.0,
      v0: 20.0,
      tMax: 5.0,
    },
    targetQuantity: 'Aceleração de travagem a (m/s²)',
    solutionExplanation:
      '1. Para parar em t = 5,0 s partindo de v₀ = 20,0 m/s:\n' +
      '   v(t) = v₀ + a · t => 0 = 20,0 + a × 5,0 => a = −4,0 m/s².\n' +
      '2. Confirmação pela lei das posições:\n' +
      '   x(5,0) = 0 + 20,0 × 5,0 + 0,5 × (−4,0) × (5,0)² = 100,0 − 50,0 = 50,0 m.\n' +
      '3. Também se pode usar a equação de Torricelli: v² = v₀² + 2·a·Δx => 0 = 20² + 2·a·50 => a = −4,0 m/s².',
    solutionParameters: {
      x0: 0.0,
      v0: 20.0,
      a: -4.0,
      tMax: 5.0,
    },
    active: true,
    createdAt: '2026-11-17T08:30:00Z',
  },
  {
    id: 'ret-desafio-4',
    simulatorId: 'movimento-retilineo',
    title: 'Desafio 4: Inversão do Sentido do Movimento',
    statement:
      'Um corpo parte da posição x₀ = 10,0 m sob aceleração constante a = −3,0 m/s² durante t = 8,0 s. Determina a velocidade inicial v₀ (positiva) para que, após inverter o sentido da marcha, o corpo regresse exatamente ao sensor situado em x = 10,0 m no instante t = 8,0 s.',
    difficulty: 'medio',
    targetDistance: 10.0,
    targetTolerance: 4.0,
    fixedParams: {
      x0: 10.0,
      a: -3.0,
      tMax: 8.0,
    },
    targetQuantity: 'Velocidade inicial v₀ (m/s)',
    solutionExplanation:
      '1. Pretende-se que o deslocamento total Δx = x(8,0) − x₀ seja nulo (regresso a x = 10,0 m em t = 8,0 s).\n' +
      '2. x(8,0) = 10,0 + v₀ × 8,0 + 0,5 × (−3,0) × (8,0)² = 10,0 + 8,0 v₀ − 96,0.\n' +
      '3. Igualando x(8,0) = 10,0 m: 8,0 v₀ − 96,0 = 0 => v₀ = 96,0 / 8,0 = 12,0 m/s.\n' +
      '4. A inversão de sentido ocorre em t_inv = −v₀ / a = 12,0 / 3,0 = 4,0 s, na posição x = 34,0 m.\n' +
      '5. Nota pedagógica: Δx = 0 m, mas a distância percorrida total é d = 24,0 + 24,0 = 48,0 m!',
    solutionParameters: {
      x0: 10.0,
      v0: 12.0,
      a: -3.0,
      tMax: 8.0,
    },
    active: true,
    createdAt: '2026-11-17T08:45:00Z',
  },
  {
    id: 'ret-desafio-5',
    simulatorId: 'movimento-retilineo',
    title: 'Desafio 5: Posição e Velocidade Iniciais Não Nulas',
    statement:
      'Um móvel inicia o cronómetro na posição x₀ = −15,0 m com velocidade inicial v₀ = 5,0 m/s e acelera uniformemente durante t = 6,0 s até alcançar o marco x = 69,0 m. Determina o valor exato da aceleração a.',
    difficulty: 'avancado',
    targetDistance: 69.0,
    targetTolerance: 3.5,
    fixedParams: {
      x0: -15.0,
      v0: 5.0,
      tMax: 6.0,
    },
    targetQuantity: 'Aceleração constante a (m/s²)',
    solutionExplanation:
      '1. Lei das posições: x(t) = x₀ + v₀ · t + ½ · a · t².\n' +
      '2. Substituindo x(6,0) = 69,0 m, x₀ = −15,0 m, v₀ = 5,0 m/s e t = 6,0 s:\n' +
      '   69,0 = −15,0 + 5,0 × 6,0 + 0,5 × a × (6,0)²\n' +
      '   69,0 = −15,0 + 30,0 + 18,0 · a\n' +
      '   69,0 = 15,0 + 18,0 · a\n' +
      '3. Isolando a: 18,0 · a = 69,0 − 15,0 = 54,0 => a = 54,0 / 18,0 = 3,0 m/s².\n' +
      '4. Velocidade ao passar em x = 69,0 m: v(6,0) = 5,0 + 3,0 × 6,0 = 23,0 m/s.',
    solutionParameters: {
      x0: -15.0,
      v0: 5.0,
      a: 3.0,
      tMax: 6.0,
    },
    active: true,
    createdAt: '2026-11-17T09:00:00Z',
  },
];

