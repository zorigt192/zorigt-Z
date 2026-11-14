export type SkillCategory = 'code' | 'art' | 'team' | 'study';

export interface SkillItem {
  id: string;
  title: string;
  category: SkillCategory;
  categoryName: string;
  xp: number;
  completed: boolean;
  notes: string;
}

export interface PlanItem {
  id: string;
  timeframe: string;
  title: string;
  description: string;
  status: 'done' | 'in_progress' | 'future';
  iconName: string;
}

export interface GameIdea {
  id: string;
  title: string;
  genre: string;
  platform: string;
  heroName: string;
  mechanic: string;
  story: string;
  color: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type AnimeGameMode = 'emoji' | 'anime' | 'character';

export interface AnimeQuestionItem {
  id?: number | string;
  emoji?: string;
  answer?: string;
  title?: string;
  name?: string;
  correct?: string;
  image?: string;
  options: string[];
}

export interface AnimeCharacterItem {
  id?: number | string;
  name: string;
  anime?: string;
  image: string;
  options: string[];
}

export interface AnimeGuessData {
  questions?: AnimeQuestionItem[];
  characters?: AnimeCharacterItem[];
}

export type LeaderboardGameId = 'anime-guess' | 'mini-game';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  game: LeaderboardGameId;
  mode?: AnimeGameMode;
  score: number;
  detail: string;
  createdAt: number;
}


