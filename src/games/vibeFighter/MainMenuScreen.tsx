import React from 'react';
import { Play, Swords, Users, Volume2, VolumeX } from 'lucide-react';

export type MatchMode = '1v1' | '2v2';
export type ControlOpponent = 'ai' | 'pvp';

interface MainMenuScreenProps {
  matchMode: MatchMode;
  opponentType: ControlOpponent;
  isMuted: boolean;
  onChangeMode: (mode: MatchMode) => void;
  onChangeOpponent: (opponent: ControlOpponent) => void;
  onGoToCharacterSelect: () => void;
  onToggleMute: () => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  matchMode,
  opponentType,
  isMuted,
  onChangeMode,
  onChangeOpponent,
  onGoToCharacterSelect,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 bg-black/82 backdrop-blur-sm p-4 sm:p-8 flex flex-col items-center justify-center overflow-y-auto">
      <div className="w-full max-w-xl space-y-5 text-center">
        {/* Retro Arcade Header */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-amber-300">
            16-BIT ARCADE · ГОЛ ЦЭС
          </div>
          <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            VIBE FIGHTER
          </h3>
          <p className="text-xs text-neutral-400">
            8 баатар · 4 дэвжээ · 1v1 ба 2v2 тулаан
          </p>
        </div>

        {/* Mode & Opponent Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Тулааны горим</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['1v1', '2v2'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeMode(m)}
                  className={`h-9 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    matchMode === m
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 text-neutral-300 border-white/15 hover:border-white/30'
                  }`}
                >
                  {m.toUpperCase()} {m === '2v2' ? '(Team)' : '(Solo)'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <span>Өрсөлдөгч</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'ai', label: 'vs Компьютер' },
                  { id: 'pvp', label: '2 Тоглогч' },
                ] as const
              ).map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => onChangeOpponent(op.id)}
                  className={`h-9 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    opponentType === op.id
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 text-neutral-300 border-white/15 hover:border-white/30'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Menu Primary Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGoToCharacterSelect}
            className="btn btn-solid h-11 px-7 text-sm font-semibold flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Баатар сонгох →</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="btn btn-ghost h-11 px-4 text-xs font-semibold flex items-center gap-1.5"
            title={isMuted ? 'Хөгжим асаах' : 'Хөгжим унтраах'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-neutral-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-sky-400" />
            )}
            <span>{isMuted ? 'Дуугүй' : 'Ая: Асаалттай'}</span>
          </button>
        </div>

        {/* Compact Controls Guide */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-neutral-400 space-y-1">
          <div>
            <span className="text-sky-400 font-semibold">P1:</span> [A / D] алхах · [W] үсрэх · [S] хамгаалах · [J] цохилт · [K] өшиглөлт · [L] супер · [Q] солих
          </div>
          {opponentType === 'pvp' && (
            <div>
              <span className="text-rose-400 font-semibold">P2:</span> [← / →] алхах · [↑] үсрэх · [↓] хамгаалах · [1 / N] цохилт · [2 / M] өшиглөлт · [3 / ,] супер
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
