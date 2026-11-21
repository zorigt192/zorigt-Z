import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, RotateCw } from 'lucide-react';
import { sound } from '../utils/audio';

interface IframeGamePlayerProps {
  title: string;
  url: string;
}

export const IframeGamePlayer: React.FC<IframeGamePlayerProps> = ({ title, url }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    sound.playClick();
    const el = containerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by nested iframe permissions; ignore gracefully
    }
  };

  const handleReload = () => {
    sound.playClick();
    setIsLoaded(false);
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className={`vesper-card w-full mx-auto overflow-hidden flex flex-col bg-black ${
        isFullscreen
          ? 'rounded-none border-0 w-screen h-screen max-w-none'
          : 'max-w-[1138px] shadow-2xl'
      }`}
    >
      {/* Player Controls Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-black/85 shrink-0">
        <span className="text-xs font-medium text-neutral-300 truncate">{title}</span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReload}
            className="btn btn-ghost h-8 px-3 text-xs font-medium flex items-center gap-1.5 border-white/15"
            title="Тоглоомыг дахин ачаалах"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Дахин ачаалах</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn btn-solid h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Гарах</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Бүтэн дэлгэц</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 16:9 Aspect Ratio (~640px height on desktop) iframe viewport */}
      <div
        className={`relative w-full bg-black ${
          isFullscreen
            ? 'flex-1 h-full'
            : 'aspect-video min-h-[320px] max-h-[640px]'
        }`}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-neutral-300 z-10 pointer-events-none">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <span className="text-xs text-neutral-400">Тоглоомыг ачааллаж байна...</span>
          </div>
        )}

        <iframe
          key={reloadKey}
          src={url}
          title={title}
          onLoad={() => setIsLoaded(true)}
          allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
          allowFullScreen
          loading="eager"
          referrerPolicy="no-referrer"
          className="w-full h-full border-0 block bg-black"
        />
      </div>
    </div>
  );
};
