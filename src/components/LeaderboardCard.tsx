import React, { useEffect, useMemo, useState } from 'react';
import { Award, Medal, Play, Trash2, Trophy } from 'lucide-react';
import { AnimeGameMode, LeaderboardEntry, LeaderboardGameId } from '../types';
import {
  clearLeaderboardEntries,
  getLeaderboardEntries,
  subscribeLeaderboard,
} from '../utils/leaderboard';
import { sound } from '../utils/audio';

interface LeaderboardCardProps {
  compact?: boolean;
  defaultGameFilter?: 'all' | LeaderboardGameId;
  defaultModeFilter?: 'all' | AnimeGameMode;
  onStartPlay?: () => void;
}

const MODE_LABELS: Record<AnimeGameMode, string> = {
  emoji: 'Emoji',
  anime: 'Anime',
  character: 'Баатар',
};

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  compact = false,
  defaultGameFilter = 'all',
  defaultModeFilter = 'all',
  onStartPlay,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => getLeaderboardEntries());
  const [gameFilter, setGameFilter] = useState<'all' | LeaderboardGameId>(defaultGameFilter);
  const [modeFilter, setModeFilter] = useState<'all' | AnimeGameMode>(defaultModeFilter);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  useEffect(() => {
    setEntries(getLeaderboardEntries());
    return subscribeLeaderboard(() => {
      setEntries(getLeaderboardEntries());
    });
  }, []);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        if (gameFilter !== 'all' && entry.game !== gameFilter) return false;
        if (
          (gameFilter === 'anime-guess' || gameFilter === 'all') &&
          modeFilter !== 'all' &&
          entry.game === 'anime-guess' &&
          entry.mode !== modeFilter
        ) {
          return false;
        }
        if (gameFilter === 'all' && modeFilter !== 'all' && entry.game !== 'anime-guess') {
          return false;
        }
        return true;
      })
      .slice(0, compact ? 5 : 10);
  }, [entries, gameFilter, modeFilter, compact]);

  const handleClear = () => {
    if (!confirmClear) {
      sound.playClick();
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 3500);
      return;
    }
    sound.playClick();
    clearLeaderboardEntries();
    setConfirmClear(false);
  };

  const renderRankIcon = (index: number) => {
    if (index === 0) {
      return <Trophy className="w-4 h-4 text-amber-300 shrink-0" />;
    }
    if (index === 1) {
      return <Medal className="w-4 h-4 text-neutral-300 shrink-0" />;
    }
    if (index === 2) {
      return <Award className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    return (
      <span className="w-4 text-center font-mono text-xs text-neutral-500 tabular-nums shrink-0">
        {index + 1}
      </span>
    );
  };

  return (
    <div id={!compact ? 'leaderboard' : undefined} className="vesper-card p-5 sm:p-6 w-full scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center text-white shrink-0">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight m-0">
              Лидерборд (Шилдэг оноо)
            </h3>
            <p className="text-xs text-neutral-400 m-0">
              Хамгийн өндөр оноо авсан тоглогчдын жагсаалт
            </p>
          </div>
        </div>

        {entries.length > 0 && !compact && (
          <button
            type="button"
            onClick={handleClear}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              confirmClear
                ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:border-white/25'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmClear ? 'Баталгаажуулах' : 'Цэвэрлэх'}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {!compact && (
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10 text-xs overflow-x-auto max-w-full">
            {(
              [
                { id: 'all', label: 'Бүгд' },
                { id: 'anime-guess', label: 'Anime Guess' },
                { id: 'mini-game', label: 'Мини тоглоом' },
                { id: 'vibe-fighter', label: 'Vibe Fighter' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setGameFilter(tab.id);
                  if (tab.id !== 'anime-guess' && tab.id !== 'all') setModeFilter('all');
                }}
                className={`px-3 py-2 sm:py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  gameFilter === tab.id
                    ? 'bg-white text-black font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {(gameFilter === 'all' || gameFilter === 'anime-guess') && (
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10 text-xs overflow-x-auto max-w-full">
            {(
              [
                { id: 'all', label: 'Бүх горим' },
                { id: 'emoji', label: 'Emoji' },
                { id: 'anime', label: 'Anime' },
                { id: 'character', label: 'Баатар' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setModeFilter(m.id);
                }}
                className={`px-2.5 py-2 sm:py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  modeFilter === m.id
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <div className="mt-5 py-8 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-center flex flex-col items-center gap-3">
          <p className="text-xs sm:text-sm text-neutral-400 m-0 max-w-md">
            Одоогоор оноо бүртгэгдээгүй байна. Тоглоод анхны дээд амжилтыг тогтоогоорой!
          </p>
          {onStartPlay && (
            <button
              type="button"
              onClick={onStartPlay}
              className="btn btn-solid h-9 px-4 text-xs font-semibold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Anime Guess тоглох</span>
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden bg-black/40">
          {filteredEntries.map((entry, idx) => {
            const gameName =
              entry.game === 'anime-guess'
                ? 'Anime Guess'
                : entry.game === 'vibe-fighter'
                ? 'Vibe Fighter'
                : 'Мини тоглоом';
            const modeText = entry.mode ? MODE_LABELS[entry.mode] : null;
            return (
              <div
                key={entry.id}
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderRankIcon(idx)}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {entry.playerName}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
                      <span>{gameName}</span>
                      {modeText && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{modeText}</span>
                        </>
                      )}
                      {entry.detail && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{entry.detail}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-sm text-white tabular-nums whitespace-nowrap shrink-0">
                  {entry.score} оноо
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
