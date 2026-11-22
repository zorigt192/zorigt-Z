import React, { useEffect, useState } from 'react';
import { Gamepad2, Play } from 'lucide-react';
import { AnimeGuessGame } from './AnimeGuessGame';
import { MiniGame } from './MiniGame';
import { VibeFighterGame } from './VibeFighterGame';
import animeGuessCover from '../assets/images/anime_guess_cover_1794628425142.jpg';
import minigameCover from '../assets/images/minigame_cover_1794629639469.jpg';
import vibeFighterCover from '../assets/images/vibe_fighter_cover_1795273531904.jpg';
import { sound } from '../utils/audio';

export interface PortfolioGame {
  id: string;
  title: string;
  description?: string;
  image: string;
  wideModal?: boolean;
  render: () => React.ReactNode;
}

// Шинэ тоглоом нэмэх бол зөвхөн энэ жагсаалтад нэг объект нэмэхэд хангалттай.
export const PORTFOLIO_GAMES: PortfolioGame[] = [
  {
    id: 'anime-guess',
    title: 'Anime Guess',
    image: animeGuessCover,
    render: () => <AnimeGuessGame />,
  },
  {
    id: 'zorigt-minigame',
    title: 'Зоригтын Мини Тоглоом',
    image: minigameCover,
    render: () => <MiniGame />,
  },
  {
    id: 'vibe-fighter',
    title: 'Vibe Fighter (2D Retro Fighting Game)',
    description: '16-bit Pixel Art 2D тулааны тоглоом (8 баатар, 4 дэвжээ, 1v1 ба 2v2)',
    image: vibeFighterCover,
    wideModal: true,
    render: () => (
      <VibeFighterGame externalUrl="https://ais-pre-o4c27fhwicne72sxdipgqw-943642533778.asia-east1.run.app/?shell=game" />
    ),
  },
];

export const GamesSection: React.FC = () => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeGame = PORTFOLIO_GAMES.find((g) => g.id === activeGameId) || null;

  const openGame = (id: string) => {
    sound.playClick();
    setActiveGameId(id);
  };

  const closeGame = () => {
    sound.playClick();
    setActiveGameId(null);
  };

  useEffect(() => {
    if (!activeGame) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveGameId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeGame]);

  return (
    <section id="games" className="w-full scroll-mt-20 py-2">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center gap-1.5 text-xs text-neutral-400 mb-2 mx-auto">
          <Gamepad2 className="w-3.5 h-3.5 text-neutral-300" />
          <span>Интерактив бүтээлүүд</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Тоглоомууд
        </h2>
      </div>

      <div className="flex flex-wrap justify-center gap-5 w-full">
        {PORTFOLIO_GAMES.map((game) => {
          const imgFailed = failedImages[game.id];
          const isSingle = PORTFOLIO_GAMES.length === 1;
          return (
            <article
              key={game.id}
              className={`vesper-card overflow-hidden flex flex-col justify-between group transition-all w-full ${
                isSingle
                  ? 'max-w-md'
                  : 'sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.85rem)]'
              }`}
            >
              {/* Game Thumbnail */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black border-b border-white/10">
                {!imgFailed ? (
                  <img
                    src={game.image}
                    alt={game.title}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [game.id]: true }))
                    }
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-black to-neutral-950 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <Gamepad2 className="w-8 h-8 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-300">{game.title}</span>
                  </div>
                )}
              </div>

              {/* Card Body: Name + Description + Play button */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight m-0">
                    {game.title}
                  </h3>
                  {game.description && (
                    <p className="text-xs text-neutral-400 leading-relaxed m-0">
                      {game.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openGame(game.id)}
                  className="btn btn-solid w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 mt-auto"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Тоглох</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Fullscreen Game Modal */}
      {activeGame && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={activeGame.title}
        >
          {/* Modal Top Bar */}
          <div className="w-full flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 border-b border-white/10 bg-black/85 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <Gamepad2 className="w-5 h-5 text-white shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                {activeGame.title}
              </span>
            </div>

            <button
              type="button"
              onClick={closeGame}
              className="btn btn-ghost px-4 h-10 text-xs font-semibold flex items-center justify-center border-white/20 text-white hover:bg-white/10 shrink-0"
            >
              ✕ Хаах
            </button>
          </div>

          {/* Modal Content */}
          <div
            className={`flex-1 w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 flex items-start sm:items-center justify-center ${
              activeGame.wideModal ? 'max-w-[1186px]' : 'max-w-5xl'
            }`}
          >
            {activeGame.render()}
          </div>
        </div>
      )}
    </section>
  );
};
