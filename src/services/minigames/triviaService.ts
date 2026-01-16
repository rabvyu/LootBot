// Serviço de Trivia
import { TriviaProfile, ITriviaProfile } from '../../database/models/Minigames';

// Definição de pergunta
interface TriviaQuestion {
  questionId: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  xpReward: number;
  coinReward: number;
}

// Banco de perguntas
const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Fácil - Conhecimentos Gerais
  {
    questionId: 'easy_1',
    category: 'Conhecimentos Gerais',
    difficulty: 'easy',
    question: 'Qual é a capital do Brasil?',
    correctAnswer: 'Brasília',
    wrongAnswers: ['São Paulo', 'Rio de Janeiro', 'Salvador'],
    xpReward: 10,
    coinReward: 5,
  },
  {
    questionId: 'easy_2',
    category: 'Conhecimentos Gerais',
    difficulty: 'easy',
    question: 'Quantos dias tem um ano bissexto?',
    correctAnswer: '366',
    wrongAnswers: ['365', '364', '367'],
    xpReward: 10,
    coinReward: 5,
  },
  {
    questionId: 'easy_3',
    category: 'Games',
    difficulty: 'easy',
    question: 'Qual é o nome do encanador famoso da Nintendo?',
    correctAnswer: 'Mario',
    wrongAnswers: ['Luigi', 'Wario', 'Toad'],
    xpReward: 10,
    coinReward: 5,
  },
  // Médio
  {
    questionId: 'medium_1',
    category: 'Ciências',
    difficulty: 'medium',
    question: 'Qual é o maior planeta do sistema solar?',
    correctAnswer: 'Júpiter',
    wrongAnswers: ['Saturno', 'Urano', 'Netuno'],
    xpReward: 25,
    coinReward: 15,
  },
  {
    questionId: 'medium_2',
    category: 'História',
    difficulty: 'medium',
    question: 'Em que ano o Brasil foi descoberto?',
    correctAnswer: '1500',
    wrongAnswers: ['1492', '1498', '1502'],
    xpReward: 25,
    coinReward: 15,
  },
  {
    questionId: 'medium_3',
    category: 'Games',
    difficulty: 'medium',
    question: 'Qual empresa criou o jogo Minecraft?',
    correctAnswer: 'Mojang',
    wrongAnswers: ['Microsoft', 'Epic Games', 'Valve'],
    xpReward: 25,
    coinReward: 15,
  },
  // Difícil
  {
    questionId: 'hard_1',
    category: 'Ciências',
    difficulty: 'hard',
    question: 'Qual é o símbolo químico do Tungstênio?',
    correctAnswer: 'W',
    wrongAnswers: ['T', 'Tu', 'Tg'],
    xpReward: 50,
    coinReward: 35,
  },
  {
    questionId: 'hard_2',
    category: 'Matemática',
    difficulty: 'hard',
    question: 'Qual é a raiz quadrada de 169?',
    correctAnswer: '13',
    wrongAnswers: ['11', '12', '14'],
    xpReward: 50,
    coinReward: 35,
  },
  {
    questionId: 'hard_3',
    category: 'Games',
    difficulty: 'hard',
    question: 'Em que ano foi lançado o primeiro jogo da série Dark Souls?',
    correctAnswer: '2011',
    wrongAnswers: ['2009', '2010', '2012'],
    xpReward: 50,
    coinReward: 35,
  },
];

// Obter ou criar perfil de trivia
export async function getOrCreateTriviaProfile(odiscordId: string): Promise<ITriviaProfile> {
  let profile = await TriviaProfile.findOne({ odiscordId });

  if (!profile) {
    profile = new TriviaProfile({
      odiscordId,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      currentStreak: 0,
      longestStreak: 0,
      dailyAnswered: false,
      lastDailyReset: new Date(),
      totalXpEarned: 0,
      totalCoinsEarned: 0,
    });
    await profile.save();
  }

  return profile.toObject();
}

// Obter pergunta aleatória
export function getRandomQuestion(
  difficulty?: 'easy' | 'medium' | 'hard',
  category?: string,
  excludeIds?: string[]
): TriviaQuestion | null {
  let questions = [...TRIVIA_QUESTIONS];

  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  if (category) {
    questions = questions.filter(q => q.category === category);
  }

  if (excludeIds && excludeIds.length > 0) {
    questions = questions.filter(q => !excludeIds.includes(q.questionId));
  }

  if (questions.length === 0) return null;

  return questions[Math.floor(Math.random() * questions.length)];
}

// Embaralhar respostas
export function shuffleAnswers(question: TriviaQuestion): string[] {
  const answers = [question.correctAnswer, ...question.wrongAnswers];
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  return answers;
}

// Responder pergunta
export async function answerQuestion(
  odiscordId: string,
  questionId: string,
  answer: string
): Promise<{
  success: boolean;
  correct: boolean;
  correctAnswer?: string;
  xpEarned: number;
  coinsEarned: number;
  newStreak: number;
  streakBonus: number;
  message: string;
}> {
  const question = TRIVIA_QUESTIONS.find(q => q.questionId === questionId);
  if (!question) {
    return {
      success: false,
      correct: false,
      xpEarned: 0,
      coinsEarned: 0,
      newStreak: 0,
      streakBonus: 0,
      message: 'Pergunta não encontrada.',
    };
  }

  let profile = await TriviaProfile.findOne({ odiscordId });
  if (!profile) {
    await getOrCreateTriviaProfile(odiscordId);
    profile = await TriviaProfile.findOne({ odiscordId });
    if (!profile) {
      return {
        success: false,
        correct: false,
        xpEarned: 0,
        coinsEarned: 0,
        newStreak: 0,
        streakBonus: 0,
        message: 'Erro ao criar perfil.',
      };
    }
  }

  const correct = answer.toLowerCase() === question.correctAnswer.toLowerCase();

  profile.totalQuestionsAnswered++;
  profile.lastAnsweredAt = new Date();

  let xpEarned = 0;
  let coinsEarned = 0;
  let streakBonus = 0;

  if (correct) {
    profile.totalCorrect++;
    profile.currentStreak++;
    profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);

    // Calcular bônus de streak
    if (profile.currentStreak >= 5) {
      streakBonus = Math.floor(profile.currentStreak / 5) * 0.1; // 10% extra a cada 5 acertos
    }

    xpEarned = Math.floor(question.xpReward * (1 + streakBonus));
    coinsEarned = Math.floor(question.coinReward * (1 + streakBonus));

    profile.totalXpEarned += xpEarned;
    profile.totalCoinsEarned += coinsEarned;
  } else {
    profile.totalWrong++;
    profile.currentStreak = 0;
  }

  await profile.save();

  return {
    success: true,
    correct,
    correctAnswer: correct ? undefined : question.correctAnswer,
    xpEarned,
    coinsEarned,
    newStreak: profile.currentStreak,
    streakBonus: Math.floor(streakBonus * 100),
    message: correct
      ? `✅ Correto! +${xpEarned} XP, +${coinsEarned} moedas${streakBonus > 0 ? ` (Streak: ${profile.currentStreak})` : ''}!`
      : `❌ Errado! A resposta era: ${question.correctAnswer}`,
  };
}

// Obter pergunta diária
export async function getDailyQuestion(
  odiscordId: string
): Promise<{
  available: boolean;
  question?: TriviaQuestion;
  answers?: string[];
  message: string;
}> {
  let profile = await TriviaProfile.findOne({ odiscordId });
  if (!profile) {
    await getOrCreateTriviaProfile(odiscordId);
    profile = await TriviaProfile.findOne({ odiscordId });
  }

  if (!profile) {
    return { available: false, message: 'Erro ao acessar perfil.' };
  }

  // Resetar diário se necessário
  const now = new Date();
  if (profile.lastDailyReset.toDateString() !== now.toDateString()) {
    profile.dailyAnswered = false;
    profile.lastDailyReset = now;
    await profile.save();
  }

  if (profile.dailyAnswered) {
    return { available: false, message: 'Você já respondeu a pergunta diária de hoje!' };
  }

  // Pegar uma pergunta difícil para o diário
  const question = getRandomQuestion('hard');
  if (!question) {
    return { available: false, message: 'Nenhuma pergunta disponível.' };
  }

  return {
    available: true,
    question,
    answers: shuffleAnswers(question),
    message: `Pergunta diária de ${question.category}:`,
  };
}

// Responder pergunta diária
export async function answerDailyQuestion(
  odiscordId: string,
  questionId: string,
  answer: string
): Promise<{
  success: boolean;
  correct: boolean;
  correctAnswer?: string;
  xpEarned: number;
  coinsEarned: number;
  message: string;
}> {
  const profile = await TriviaProfile.findOne({ odiscordId });
  if (!profile) {
    return { success: false, correct: false, xpEarned: 0, coinsEarned: 0, message: 'Perfil não encontrado.' };
  }

  if (profile.dailyAnswered) {
    return { success: false, correct: false, xpEarned: 0, coinsEarned: 0, message: 'Já respondeu o diário hoje!' };
  }

  profile.dailyAnswered = true;
  await profile.save();

  // Recompensas diárias são 3x maiores
  const result = await answerQuestion(odiscordId, questionId, answer);

  if (result.correct) {
    // Adicionar bônus diário
    const bonusXp = result.xpEarned * 2;
    const bonusCoins = result.coinsEarned * 2;

    await TriviaProfile.updateOne(
      { odiscordId },
      {
        $inc: {
          totalXpEarned: bonusXp,
          totalCoinsEarned: bonusCoins,
        },
      }
    );

    return {
      ...result,
      xpEarned: result.xpEarned + bonusXp,
      coinsEarned: result.coinsEarned + bonusCoins,
      message: `🌟 Diário Correto! +${result.xpEarned + bonusXp} XP, +${result.coinsEarned + bonusCoins} moedas!`,
    };
  }

  return result;
}

// Obter estatísticas
export async function getTriviaStats(odiscordId: string): Promise<ITriviaProfile | null> {
  return await TriviaProfile.findOne({ odiscordId }).lean();
}

// Obter ranking de trivia
export async function getTriviaLeaderboard(
  type: 'correct' | 'streak' | 'xp',
  limit: number = 10
): Promise<Array<{ odiscordId: string; value: number }>> {
  const sortField = type === 'correct' ? 'totalCorrect' : type === 'streak' ? 'longestStreak' : 'totalXpEarned';

  const profiles = await TriviaProfile.find()
    .sort({ [sortField]: -1 })
    .limit(limit)
    .lean();

  return profiles.map(p => ({
    odiscordId: p.odiscordId,
    value: type === 'correct' ? p.totalCorrect : type === 'streak' ? p.longestStreak : p.totalXpEarned,
  }));
}

// Obter categorias disponíveis
export function getCategories(): string[] {
  return [...new Set(TRIVIA_QUESTIONS.map(q => q.category))];
}

// Obter estatísticas por categoria
export function getCategoryStats(): Array<{ category: string; total: number; byDifficulty: Record<string, number> }> {
  const categories = getCategories();

  return categories.map(category => {
    const questions = TRIVIA_QUESTIONS.filter(q => q.category === category);
    const byDifficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };

    questions.forEach(q => {
      byDifficulty[q.difficulty]++;
    });

    return {
      category,
      total: questions.length,
      byDifficulty,
    };
  });
}
