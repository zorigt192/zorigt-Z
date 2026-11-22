import React, { useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Swords } from 'lucide-react';
import { ARENA_H, ARENA_W } from './fighters';
import { ARENA_MAPS, ArenaMapId, drawArenaMap } from './maps';
import { sound } from '../../utils/audio';

interface MapSelectScreenProps {
  selectedMapId: ArenaMapId;
  onSelectMap: (mapId: ArenaMapId) => void;
  onBackToCharacters: () => void;
  onStartFight: () => void;
}

const MapPreviewCanvas: React.FC<{ mapId: ArenaMapId }> = ({ mapId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const render = (now: number) => {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(canvas.width / ARENA_W, canvas.height / ARENA_H);
      ctx.imageSmoothingEnabled = false;
      drawArenaMap(ctx, mapId, now);
      ctx.restore();
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [mapId]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={180}
      className="w-full aspect-video block bg-black"
    />
  );
};

export const MapSelectScreen: React.FC<MapSelectScreenProps> = ({
  selectedMapId,
  onSelectMap,
  onBackToCharacters,
  onStartFight,
}) => {
  return (
    <div className="absolute inset-0 bg-black/88 backdrop-blur-sm p-3.5 sm:p-6 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300">
            АЛХАМ 2 / 2 · ДЭВЖЭЭ СОНГОЛТ
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Тулааны газрын зургаа сонгоно уу
          </h3>
        </div>

        {/* 4 Maps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ARENA_MAPS.map((stage) => {
            const isSelected = selectedMapId === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectMap(stage.id);
                }}
                className={`rounded-xl border overflow-hidden text-left transition-all cursor-pointer flex flex-col ${
                  isSelected
                    ? 'border-white bg-white/10 ring-1 ring-white/40'
                    : 'border-white/15 bg-white/[0.03] hover:border-white/35'
                }`}
              >
                <div className="relative border-b border-white/10">
                  <MapPreviewCanvas mapId={stage.id} />
                  {isSelected && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-white/30 text-[10px] font-semibold text-white">
                      Сонгосон
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: stage.accentColor }}
                    />
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {stage.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-300 truncate">{stage.subtitle}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{stage.atmosphere}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-white/10">
        <button
          type="button"
          onClick={onBackToCharacters}
          className="btn btn-ghost h-10 px-4 text-xs font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Баатар солих</span>
        </button>

        <button
          type="button"
          onClick={onStartFight}
          className="btn btn-solid h-11 px-7 text-sm font-semibold flex items-center gap-2"
        >
          <Swords className="w-4 h-4" />
          <span>Тулаан эхлүүлэх!</span>
        </button>
      </div>
    </div>
  );
};
