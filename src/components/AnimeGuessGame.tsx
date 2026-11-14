import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Clock,
  Eye,
  Heart,
  Image as ImageIcon,
  RotateCcw,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Trophy,
  User,
  X,
} from 'lucide-react';
import rawData from '../../data.json';
import { AnimeCharacterItem, AnimeGameMode, AnimeGuessData, AnimeQuestionItem } from '../types';
import { sound } from '../utils/audio';
import { addLeaderboardEntry, getSavedPlayerName } from '../utils/leaderboard';
import { LeaderboardCard } from './LeaderboardCard';

import animeCoverImg from '../assets/images/anime_guess_cover_1794628425142.jpg';
import animeOnePieceImg from '../assets/images/anime_one_piece_1794628425156.jpg';
import animeNarutoImg from '../assets/images/anime_naruto_1794628426054.jpg';
import animeAttackTitanImg from '../assets/images/anime_attack_titan_1794628426533.jpg';
import animeDemonSlayerImg from '../assets/images/anime_demon_slayer_1794628426996.jpg';
import animeDragonBallImg from '../assets/images/anime_dragon_ball_1794628426671.jpg';
import animeSpiritedAwayImg from '../assets/images/anime_spirited_away_1794628426705.jpg';
import charLuffyImg from '../assets/images/char_luffy_1794628428059.jpg';
import charNarutoImg from '../assets/images/char_naruto_1794628427977.jpg';
import charGokuImg from '../assets/images/char_goku_1794628428294.jpg';

const ASSET_MAP: Record<string, string> = {
  '/src/assets/images/anime_guess_cover_1794628425142.jpg': animeCoverImg,
  '/src/assets/images/anime_one_piece_1794628425156.jpg': animeOnePieceImg,
  '/src/assets/images/anime_naruto_1794628426054.jpg': animeNarutoImg,
  '/src/assets/images/anime_attack_titan_1794628426533.jpg': animeAttackTitanImg,
  '/src/assets/images/anime_demon_slayer_1794628426996.jpg': animeDemonSlayerImg,
  '/src/assets/images/anime_dragon_ball_1794628426671.jpg': animeDragonBallImg,
  '/src/assets/images/anime_spirited_away_1794628426705.jpg': animeSpiritedAwayImg,
  '/src/assets/images/char_luffy_1794628428059.jpg': charLuffyImg,
  '/src/assets/images/char_naruto_1794628427977.jpg': charNarutoImg,
  '/src/assets/images/char_goku_1794628428294.jpg': charGokuImg,
};

export function resolveGameAsset(path?: string): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  return ASSET_MAP[trimmed] || trimmed;
}

const QUESTION_SECONDS = 15;
const MAX_LIVES = 3;
const POINTS_PER_CORRECT = 10;
const REVEAL_DURATION_MS = 2000;

interface NormalizedRound {
  id: string;
  emoji: string;
  image: string;
  answer: string;
  options: string[];
  subtitle?: string;
}

type GamePhase = 'MODE_SELECT' | 'PLAYING' | 'REVEAL' | 'FINISHED';

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function parseData(): { questions: NormalizedRound[]; characters: NormalizedRound[] } {
  const parsed = rawData as AnimeGuessData | AnimeQuestionItem[];
  const rawQuestions: AnimeQuestionItem[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.questions)
    ? parsed.questions
    : [];

  const rawCharacters: AnimeCharacterItem[] = !Array.isArray(parsed) && Array.isArray(parsed?.characters)
    ? parsed.characters
    : [];

  const questions: NormalizedRound[] = rawQuestions
    .map((q, idx) => {
      const answer = (q.answer || q.title || q.name || q.correct || q.options?.[0] || '').trim();
      return {
        id: `q-${q.id ?? idx}`,
        emoji: (q.emoji || '').trim(),
        image: resolveGameAsset(q.image),
        answer,
        options: Array.isArray(q.options) ? q.options.filter(Boolean) : [],
      };
    })
    .filter((q) => q.answer && q.options.length > 0);

  const characters: NormalizedRound[] = rawCharacters
    .map((c, idx) => ({
      id: `c-${c.id ?? idx}`,
      emoji: '',
      image: resolveGameAsset(c.image),
      answer: (c.name || '').trim(),
      options: Array.isArray(c.options) ? c.options.filter(Boolean) : [],
      subtitle: c.anime,
    }))
    .filter((c) => c.answer && c.options.length > 0);

  return { questions, characters };
}

export const AnimeGuessGame: React.FC = () => {
  const { questions: allQuestions, characters: allCharacters } = useMemo(() => parseData(), []);

  const [phase, setPhase] = useState<GamePhase>('MODE_SELECT');
  const [mode, setMode] = useState<AnimeGameMode>('emoji');
  const [deck, setDeck] = useState<NormalizedRound[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_SECONDS);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState<number>(0);
  const [revealImageError, setRevealImageError] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>(() => getSavedPlayerName());
  const [scoreSaved, setScoreSaved] = useState<boolean>(false);

  const revealTimeoutRef = useRef<number | null>(null);

  const clearRevealTimeout = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearRevealTimeout();
  }, [clearRevealTimeout]);

  const buildDeck = useCallback(
    (selectedMode: AnimeGameMode): NormalizedRound[] => {
      let source: NormalizedRound[] = [];
      if (selectedMode === 'emoji') {
        source = allQuestions.filter((q) => Boolean(q.emoji));
      } else if (selectedMode === 'anime') {
        source = allQuestions.filter((q) => Boolean(q.image));
      } else {
        source = allCharacters;
      }

      return shuffleArray(source).map((item) => ({
        ...item,
        options: shuffleArray(item.options),
      }));
    },
    [allQuestions, allCharacters]
  );

  const startMode = useCallback(
    (selectedMode: AnimeGameMode) => {
      clearRevealTimeout();
      sound.playLevelUp();
      const nextDeck = buildDeck(selectedMode);
      setMode(selectedMode);
      setDeck(nextDeck);
      setCurrentIdx(0);
      setScore(0);
      setLives(MAX_LIVES);
      setTimeLeft(QUESTION_SECONDS);
      setSelectedOption(null);
      setTimedOut(false);
      setCorrectCount(0);
      setTotalAnswered(0);
      setRevealImageError(false);
      setShowLeaderboard(false);
      setScoreSaved(false);
      setPhase(nextDeck.length > 0 ? 'PLAYING' : 'FINISHED');
    },
    [buildDeck, clearRevealTimeout]
  );

  const currentRound = deck[currentIdx];

  const advanceAfterReveal = useCallback(
    (nextLives: number, idx: number, total: number) => {
      clearRevealTimeout();
      revealTimeoutRef.current = window.setTimeout(() => {
        if (nextLives <= 0 || idx + 1 >= total) {
          setPhase('FINISHED');
          sound.playLevelUp();
        } else {
          setCurrentIdx(idx + 1);
          setTimeLeft(QUESTION_SECONDS);
          setSelectedOption(null);
          setTimedOut(false);
          setRevealImageError(false);
          setPhase('PLAYING');
        }
      }, REVEAL_DURATION_MS);
    },
    [clearRevealTimeout]
  );

  const handleResolveRound = useCallback(
    (choice: string | null, isTimeout: boolean) => {
      if (phase !== 'PLAYING' || !currentRound) return;

      const isCorrect = !isTimeout && choice === currentRound.answer;
      const nextLives = isCorrect ? lives : Math.max(0, lives - 1);

      if (isCorrect) {
        sound.playCollect();
        setScore((prev) => prev + POINTS_PER_CORRECT);
        setCorrectCount((prev) => prev + 1);
      } else {
        sound.playHit();
        setLives(nextLives);
      }

      setTotalAnswered((prev) => prev + 1);
      setSelectedOption(choice);
      setTimedOut(isTimeout);
      setRevealImageError(false);
      setPhase('REVEAL');
      advanceAfterReveal(nextLives, currentIdx, deck.length);
    },
    [phase, currentRound, lives, currentIdx, deck.length, advanceAfterReveal]
  );

  // 15-second question timer
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [phase, currentIdx]);

  // Trigger timeout resolution when timer hits 0
  useEffect(() => {
    if (phase === 'PLAYING' && timeLeft === 0) {
      handleResolveRound(null, true);
    }
  }, [phase, timeLeft, handleResolveRound]);

  // Skip question in Anime mode if image fails to load
  const handleAnimeImageError = useCallback(() => {
    if (mode !== 'anime' || phase !== 'PLAYING') return;
    if (currentIdx + 1 >= deck.length) {
      setPhase('FINISHED');
    } else {
      setCurrentIdx((prev) => prev + 1);
      setTimeLeft(QUESTION_SECONDS);
      setSelectedOption(null);
      setTimedOut(false);
    }
  }, [mode, phase, currentIdx, deck.length]);

  // Progressive blur for Mode 2 (Anime): starts heavy and clears every 3 seconds
  const getBlurPx = (): number => {
    if (phase === 'REVEAL') return 0;
    if (mode !== 'anime') return 0;
    const elapsed = QUESTION_SECONDS - timeLeft;
    const step = Math.floor(elapsed / 3); // 0, 1, 2, 3, 4
    const blurSteps = [24, 16, 10, 5, 2];
    return blurSteps[Math.min(step, blurSteps.length - 1)];
  };

  const modeLabel =
    mode === 'emoji' ? 'Emoji горим' : mode === 'anime' ? 'Anime зураг горим' : 'Баатар таах горим';

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (scoreSaved) return;
    sound.playCollect();
    addLeaderboardEntry({
      playerName: playerName.trim() || 'Тоглогч',
      game: 'anime-guess',
      mode,
      score,
      detail: `${correctCount}/${totalAnswered} зөв`,
    });
    setScoreSaved(true);
  };

  // ==================== MODE SELECTION ====================
  if (phase === 'MODE_SELECT') {
    if (showLeaderboard) {
      return (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 py-4 px-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowLeaderboard(false);
              }}
              className="btn btn-ghost px-4 h-9 text-xs font-semibold"
            >
              ← Горим сонгох
            </button>
          </div>
          <LeaderboardCard defaultGameFilter="anime-guess" />
        </div>
      );
    }

    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center py-6 px-2">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs text-neutral-400 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
            <span>Anime Guess · 15 сек / асуулт · 3 амь · +10 оноо</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white mb-2">
            Ямар горимоор тоглох вэ?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-4">
            Тоглох бүрт асуултын дараалал шинээр холигдоно. Өөрийн сонирхсон горимоо сонгоорой.
          </p>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowLeaderboard(true);
            }}
            className="btn btn-ghost h-9 px-4 text-xs font-semibold gap-2"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Лидерборд харах</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {/* Mode 1: Emoji */}
          <button
            type="button"
            onClick={() => startMode('emoji')}
            className="vesper-card p-6 text-left flex flex-col justify-between gap-5 hover:border-white/35 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Smile className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">1. Emoji</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Том хэмжээтэй emoji дүрсүүдийг хараад аль анимэ болохыг 4 сонголтоос таана.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-medium text-neutral-200">
              <span>{allQuestions.filter((q) => q.emoji).length} асуулт</span>
              <span className="group-hover:translate-x-0.5 transition-transform">Эхлэх →</span>
            </div>
          </button>

          {/* Mode 2: Anime */}
          <button
            type="button"
            onClick={() => startMode('anime')}
            className="vesper-card p-6 text-left flex flex-col justify-between gap-5 hover:border-white/35 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">2. Anime</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Бүдэг зураг 3 секунд тутам тодорно. Аль болох хурдан анимийн нэрийг таагаарай.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-medium text-neutral-200">
              <span>{allQuestions.filter((q) => q.image).length} асуулт</span>
              <span className="group-hover:translate-x-0.5 transition-transform">Эхлэх →</span>
            </div>
          </button>

          {/* Mode 3: Баатар */}
          <button
            type="button"
            onClick={() => startMode('character')}
            className="vesper-card p-6 text-left flex flex-col justify-between gap-5 hover:border-white/35 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">3. Баатар</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Баатрын зургийг хараад нэрийг нь 4 сонголтоос зөв таана.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-medium text-neutral-200">
              <span>{allCharacters.length} баатар</span>
              <span className="group-hover:translate-x-0.5 transition-transform">Эхлэх →</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ==================== END SCREEN ====================
  if (phase === 'FINISHED') {
    const outOfLives = lives <= 0;
    return (
      <div className="w-full max-w-lg mx-auto vesper-card p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-7 h-7 text-amber-300" />
        </div>

        <p className="text-xs text-neutral-400 mb-1">{modeLabel}</p>
        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
          {outOfLives ? 'Амь дууслаа!' : 'Тоглоом дууслаа!'}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mb-6">
          Та {totalAnswered} асуултаас <span className="text-white font-semibold">{correctCount}</span> зөв таалаа.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
            <div className="text-xs text-neutral-400 mb-1">Нийт оноо</div>
            <div className="text-2xl font-mono font-bold text-white tabular-nums">{score}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
            <div className="text-xs text-neutral-400 mb-1">Үлдсэн амь</div>
            <div className="text-2xl font-mono font-bold text-white tabular-nums">
              {lives} / {MAX_LIVES}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => startMode(mode)}
            className="w-full sm:w-auto btn btn-solid text-xs sm:text-sm font-semibold px-6 h-11 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Дахин тоглох</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              clearRevealTimeout();
              setPhase('MODE_SELECT');
            }}
            className="w-full sm:w-auto btn btn-ghost text-xs sm:text-sm font-semibold px-6 h-11 gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Горим солих</span>
          </button>
        </div>

        {/* Save score to Leaderboard */}
        <div className="mt-6 pt-5 border-t border-white/10 text-left">
          {!scoreSaved ? (
            <form onSubmit={handleSaveScore} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                maxLength={24}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Таны нэр (Лидерборд)"
                className="flex-1 h-10 px-3.5 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                className="btn btn-ghost h-10 px-4 text-xs font-semibold border-white/25 shrink-0"
              >
                Оноо хадгалах
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Лидерборд-д амжилттай хадгалагдлаа!</span>
              </div>
              <LeaderboardCard
                compact
                defaultGameFilter="anime-guess"
                defaultModeFilter={mode}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== PLAYING & REVEAL ====================
  if (!currentRound) return null;

  const isRevealing = phase === 'REVEAL';
  const blurPx = getBlurPx();
  const timerUrgent = timeLeft <= 5 && phase === 'PLAYING';
  const isCorrectChoice = selectedOption === currentRound.answer && !timedOut;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      {/* Persistent HUD: Score, Lives, Time */}
      <div className="vesper-card px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-3 text-xs">
          <span className="text-neutral-400 font-medium">{modeLabel}</span>
          <span className="text-neutral-600 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="font-mono tabular-nums text-neutral-200">
            {currentIdx + 1} / {deck.length}
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          {/* Score */}
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs text-neutral-400">Оноо:</span>
            <span className="font-mono font-bold text-sm text-white tabular-nums">{score}</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Lives */}
          <div className="flex items-center gap-1.5" aria-label={`Үлдсэн амь: ${lives}`}>
            <div className="flex items-center gap-1">
              {Array.from({ length: MAX_LIVES }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 transition-all ${
                    idx < lives ? 'fill-rose-500 text-rose-500' : 'text-neutral-700'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-xs text-neutral-300 tabular-nums">
              {lives}/{MAX_LIVES}
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-xs font-semibold tabular-nums transition-colors ${
              timerUrgent
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                : 'bg-white/5 border-white/15 text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{timeLeft}с</span>
          </div>
        </div>
      </div>

      {/* Main Prompt / Visual Stage */}
      <div className="vesper-card p-5 sm:p-6 flex flex-col gap-5">
        {/* Progress bar for timer */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              timerUrgent ? 'bg-rose-500' : 'bg-white'
            }`}
            style={{ width: `${(timeLeft / QUESTION_SECONDS) * 100}%` }}
          />
        </div>

        {/* Question Stimulus / 2-Second Clear Image Reveal */}
        {isRevealing ? (
          <div className="flex flex-col items-center gap-3">
            {currentRound.image && !revealImageError ? (
              <div className="relative w-full aspect-[16/9] max-h-[300px] rounded-xl overflow-hidden border border-white/15 bg-black">
                <img
                  src={currentRound.image}
                  alt={currentRound.answer}
                  referrerPolicy="no-referrer"
                  onError={() => setRevealImageError(true)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-end justify-between gap-3">
                  <div>
                    <div
                      className={`text-xs font-semibold mb-0.5 ${
                        isCorrectChoice ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isCorrectChoice
                        ? 'Зөв хариуллаа! (+10 оноо)'
                        : timedOut
                        ? 'Хугацаа дууслаа!'
                        : 'Буруу хариуллаа! (-1 амь)'}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      Зөв хариу: {currentRound.answer}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full py-10 px-4 rounded-xl border border-white/15 bg-white/[0.03] flex flex-col items-center justify-center text-center gap-2">
                {currentRound.emoji && (
                  <div className="text-5xl sm:text-6xl mb-2 select-none">{currentRound.emoji}</div>
                )}
                <div
                  className={`text-xs font-semibold ${
                    isCorrectChoice ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isCorrectChoice
                    ? 'Зөв хариуллаа! (+10 оноо)'
                    : timedOut
                    ? 'Хугацаа дууслаа!'
                    : 'Буруу хариуллаа! (-1 амь)'}
                </div>
                <div className="text-xl font-bold text-white">
                  Зөв хариу: {currentRound.answer}
                </div>
              </div>
            )}
          </div>
        ) : mode === 'emoji' ? (
          <div className="py-8 sm:py-10 px-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-xs text-neutral-400">Энэ Emoji ямар анимэ вэ?</span>
            <div className="text-6xl sm:text-7xl tracking-widest select-none leading-tight">
              {currentRound.emoji}
            </div>
          </div>
        ) : mode === 'anime' ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
              <span>Энэ аль анимийн зураг вэ?</span>
              <span className="flex items-center gap-1 font-mono text-neutral-300">
                <Eye className="w-3.5 h-3.5" />
                <span>3с тутам тодорно</span>
              </span>
            </div>
            <div className="relative w-full aspect-[16/9] max-h-[300px] rounded-xl overflow-hidden border border-white/15 bg-black">
              <img
                src={currentRound.image}
                alt="Таах анимийн зураг"
                referrerPolicy="no-referrer"
                onError={handleAnimeImageError}
                className="w-full h-full object-cover transition-[filter] duration-300 scale-105"
                style={{ filter: `blur(${blurPx}px)` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs text-neutral-400">Энэ баатрын нэр хэн бэ?</span>
            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl">
              <img
                src={currentRound.image}
                alt="Таах баатар"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* 4 Multiple Choice Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentRound.options.map((option) => {
            const isCorrectOpt = option === currentRound.answer;
            const isSelectedOpt = option === selectedOption;

            let optionClasses =
              'bg-white/[0.04] border-white/15 text-neutral-100 hover:bg-white/[0.1] hover:border-white/35';

            if (isRevealing) {
              if (isCorrectOpt) {
                optionClasses =
                  'bg-emerald-500/20 border-emerald-400 text-emerald-100 font-semibold';
              } else if (isSelectedOpt) {
                optionClasses =
                  'bg-rose-500/20 border-rose-500 text-rose-200';
              } else {
                optionClasses = 'bg-black/30 border-white/5 text-neutral-500 opacity-50';
              }
            }

            return (
              <button
                key={option}
                type="button"
                disabled={isRevealing}
                onClick={() => handleResolveRound(option, false)}
                className={`min-h-[48px] px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between gap-2 text-left transition-all cursor-pointer disabled:cursor-default ${optionClasses}`}
              >
                <span className="truncate">{option}</span>
                {isRevealing && isCorrectOpt && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {isRevealing && isSelectedOpt && !isCorrectOpt && (
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
