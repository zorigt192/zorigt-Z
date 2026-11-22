import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Shield, Swords, Zap } from 'lucide-react';
import {
  FIGHTER_ROSTER,
  FighterSpec,
  createFighter,
  drawPixelFighter,
} from './fighters';
import { ControlOpponent, MatchMode } from './MainMenuScreen';
import { sound } from '../../utils/audio';

type SelectionSlot = 'p1Lead' | 'p1Partner' | 'p2Lead' | 'p2Partner';

interface CharacterSelectScreenProps {
  matchMode: MatchMode;
  opponentType: ControlOpponent;
  p1LeadIdx: number;
  p1PartnerIdx: number;
  p2LeadIdx: number;
  p2PartnerIdx: number;
  onSelectFighter: (slot: SelectionSlot, rosterIdx: number) => void;
  onBackToMenu: () => void;
  onGoToMapSelect: () => void;
}

const FighterPreviewSprite: React.FC<{
  fighter: FighterSpec;
  facing: 1 | -1;
  team: 1 | 2;
}> = ({ fighter, facing, team }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const render = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      const previewState = createFighter(fighter, 38, facing);
      previewState.y = 26;
      drawPixelFighter(ctx, previewState, team, now, { hideShadow: true });
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [fighter, facing, team]);

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={128}
      className="w-20 h-20 sm:w-24 sm:h-24 mx-auto block"
    />
  );
};

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  matchMode,
  opponentType,
  p1LeadIdx,
  p1PartnerIdx,
  p2LeadIdx,
  p2PartnerIdx,
  onSelectFighter,
  onBackToMenu,
  onGoToMapSelect,
}) => {
  const [activeSlot, setActiveSlot] = useState<SelectionSlot>('p1Lead');

  const p1Lead = FIGHTER_ROSTER[p1LeadIdx];
  const p2Lead = FIGHTER_ROSTER[p2LeadIdx];

  const slots: { id: SelectionSlot; label: string; team: 1 | 2 }[] =
    matchMode === '2v2'
      ? [
          { id: 'p1Lead', label: 'P1 Гол баатар', team: 1 },
          { id: 'p1Partner', label: 'P1 Хамтрагч', team: 1 },
          {
            id: 'p2Lead',
            label: opponentType === 'ai' ? 'CPU Гол баатар' : 'P2 Гол баатар',
            team: 2,
          },
          {
            id: 'p2Partner',
            label: opponentType === 'ai' ? 'CPU Хамтрагч' : 'P2 Хамтрагч',
            team: 2,
          },
        ]
      : [
          { id: 'p1Lead', label: 'P1 Баатар', team: 1 },
          {
            id: 'p2Lead',
            label: opponentType === 'ai' ? 'CPU Өрсөлдөгч' : 'P2 Баатар',
            team: 2,
          },
        ];

  const handleCardClick = (idx: number) => {
    sound.playClick();
    onSelectFighter(activeSlot, idx);
  };

  return (
    <div className="absolute inset-0 bg-black/88 backdrop-blur-sm p-3.5 sm:p-6 flex flex-col justify-between overflow-y-auto">
      {/* Header & Slot Selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-sky-400">
              АЛХАМ 1 / 2 · БААТАР СОНГОЛТ
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Дүрээ сонгоно уу ({FIGHTER_ROSTER.length} баатар)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {slots.map((slot) => {
              const isSelected = activeSlot === slot.id;
              const isTeam1 = slot.team === 1;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveSlot(slot.id);
                  }}
                  className={`px-2.5 h-8 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? isTeam1
                        ? 'bg-sky-500/25 border-sky-400 text-white'
                        : 'bg-rose-500/25 border-rose-400 text-white'
                      : 'bg-white/[0.04] border-white/15 text-neutral-400 hover:text-white'
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* VS Preview Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* P1 Preview */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-sky-500/30 flex items-center gap-3">
            <div className="shrink-0 bg-black/50 rounded-lg p-1 border border-white/10">
              <FighterPreviewSprite fighter={p1Lead} facing={1} team={1} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-sky-400 font-bold">TEAM 1</span>
                <span className="text-sm font-bold text-white truncate">{p1Lead.name}</span>
                {matchMode === '2v2' && (
                  <span className="text-[11px] text-neutral-400 truncate">
                    + {FIGHTER_ROSTER[p1PartnerIdx].name}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-300 shrink-0" />
                <span className="truncate">Супер: {p1Lead.specialName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-0.5 text-[10px] text-neutral-300">
                <div>Хурд: {Math.round((p1Lead.speed / 5.5) * 100)}%</div>
                <div className="flex items-center gap-1">
                  <Swords className="w-3 h-3 text-rose-400" />
                  {Math.round(p1Lead.power * 100)}%
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-sky-400" />
                  {Math.round(p1Lead.defense * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* P2 Preview */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-rose-500/30 flex items-center gap-3">
            <div className="min-w-0 flex-1 space-y-1 text-right">
              <div className="flex items-center justify-end gap-2">
                {matchMode === '2v2' && (
                  <span className="text-[11px] text-neutral-400 truncate">
                    {FIGHTER_ROSTER[p2PartnerIdx].name} +
                  </span>
                )}
                <span className="text-sm font-bold text-white truncate">{p2Lead.name}</span>
                <span className="text-xs font-mono text-rose-400 font-bold">
                  {opponentType === 'ai' ? 'CPU' : 'TEAM 2'}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center justify-end gap-1">
                <span className="truncate">Супер: {p2Lead.specialName}</span>
                <Zap className="w-3 h-3 text-amber-300 shrink-0" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-0.5 text-[10px] text-neutral-300">
                <div>Хурд: {Math.round((p2Lead.speed / 5.5) * 100)}%</div>
                <div>Хүч: {Math.round(p2Lead.power * 100)}%</div>
                <div>Хамг: {Math.round(p2Lead.defense * 100)}%</div>
              </div>
            </div>
            <div className="shrink-0 bg-black/50 rounded-lg p-1 border border-white/10">
              <FighterPreviewSprite fighter={p2Lead} facing={-1} team={2} />
            </div>
          </div>
        </div>

        {/* 8-Fighter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FIGHTER_ROSTER.map((fighter, idx) => {
            const tags: { label: string; color: string }[] = [];
            if (p1LeadIdx === idx) tags.push({ label: 'P1', color: 'text-sky-400' });
            if (matchMode === '2v2' && p1PartnerIdx === idx)
              tags.push({ label: 'P1-B', color: 'text-sky-300' });
            if (p2LeadIdx === idx)
              tags.push({ label: opponentType === 'ai' ? 'CPU' : 'P2', color: 'text-rose-400' });
            if (matchMode === '2v2' && p2PartnerIdx === idx)
              tags.push({
                label: opponentType === 'ai' ? 'CPU-B' : 'P2-B',
                color: 'text-rose-300',
              });

            const highlighted = tags.length > 0;
            return (
              <button
                key={fighter.id}
                type="button"
                onClick={() => handleCardClick(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  highlighted
                    ? 'bg-white/12 border-white/45'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: fighter.accentColor }}
                    />
                    <span className="text-xs font-bold text-white truncate">{fighter.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {tags.map((t) => (
                      <span key={t.label} className={`text-[10px] font-mono font-bold ${t.color}`}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-[11px] text-neutral-400 truncate">{fighter.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-white/10">
        <button
          type="button"
          onClick={onBackToMenu}
          className="btn btn-ghost h-10 px-4 text-xs font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Гол цэс</span>
        </button>

        <button
          type="button"
          onClick={onGoToMapSelect}
          className="btn btn-solid h-10 px-6 text-xs sm:text-sm font-semibold flex items-center gap-1.5"
        >
          <span>Газрын зураг сонгох</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
