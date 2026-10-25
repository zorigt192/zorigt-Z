import React, { useState } from 'react';
import { Gamepad2, Sparkles, Plus, Copy, Check, Trash2 } from 'lucide-react';
import { GameIdea } from '../types';
import { sound } from '../utils/audio';

const PRESET_IDEAS: GameIdea[] = [
  {
    id: 'preset-1',
    title: 'Монгол Кибер Баатар (Cyber Mongol)',
    genre: '2D Action Platformer',
    platform: 'Вэб ба PC',
    heroName: 'Тэмүүжин 2099',
    mechanic: 'Цахилгаан сэлэм, ханаар гүйх, робот хүлэг унах',
    story: 'Ирээдүйн нийслэлийг хорт вирусийн довтолгооноос хамгаалж буй баатар найзуудтайгаа хамтарч тулалдана.',
    color: '#38bdf8',
  },
  {
    id: 'preset-2',
    title: 'Ангийнхан: Сансрын сорилт (Space Race)',
    genre: 'Multiplayer Co-op',
    platform: 'Вэб хөтөч',
    heroName: 'Зоригт ба Найзууд',
    mechanic: 'Кодын оньсого тааж хурдаа нэмэх, саад болох пуужин тавих',
    story: '4 найз сансрын хөлгөөр хамтдаа шинэ гариг нээхээр аялж, хамгийн хурдан кодолсон нь ялагч болно.',
    color: '#a855f7',
  },
];

export const GameIdeaGenerator: React.FC = () => {
  const [ideas, setIdeas] = useState<GameIdea[]>(PRESET_IDEAS);
  const [title, setTitle] = useState<string>('');
  const [genre, setGenre] = useState<string>('2D Platformer');
  const [platform, setPlatform] = useState<string>('Вэб хөтөч');
  const [heroName, setHeroName] = useState<string>('');
  const [mechanic, setMechanic] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !heroName.trim()) return;

    sound.playLevelUp();
    const colors = ['#ffffff', '#e2e8f0', '#94a3b8', '#38bdf8', '#c084fc'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newIdea: GameIdea = {
      id: Date.now().toString(),
      title: title.trim(),
      genre,
      platform,
      heroName: heroName.trim(),
      mechanic: mechanic.trim() || 'Үсрэх, гүйх, кодоор ур чадвараа нэмэгдүүлэх',
      story: `Гол баатар ${heroName.trim()} найзуудтайгаа хамт адал явдалд орж сорилтыг даван туулна.`,
      color: randomColor,
    };

    setIdeas([newIdea, ...ideas]);
    setTitle('');
    setHeroName('');
    setMechanic('');
  };

  const handleCopy = (idea: GameIdea) => {
    sound.playClick();
    const text = `🎮 Тоглоомын нэр: ${idea.title}\nТөрөл: ${idea.genre}\nПлатформ: ${idea.platform}\nГол дүр: ${idea.heroName}\nМеханик: ${idea.mechanic}\nТүүх: ${idea.story}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    sound.playClick();
    setIdeas(ideas.filter((i) => i.id !== id));
  };

  return (
    <div className="vesper-card p-4 sm:p-6 my-6 sm:my-8 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center text-white shrink-0">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-200" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white m-0">
              Миний тоглоомын санаа бүтээгч
            </h3>
            <p className="text-xs text-neutral-400 m-0">
              Найзуудтайгаа хамт тоглохыг хүссэн шинэ тоглоомын төслөө энд төлөвлөөрэй!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Creator Form */}
        <form onSubmit={handleCreate} className="lg:col-span-5 bg-black/40 p-4 rounded-xl border border-white/10">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-white" /> Шинэ тоглоом зохиох
          </h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Тоглоомын нэр:</label>
              <input
                type="text"
                placeholder="Жишээ: Монгол Адал Явдал"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-md text-white focus:outline-none focus:border-white/40"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-neutral-400 mb-1">Төрөл (Genre):</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-2.5 py-2 bg-black border border-white/15 rounded-md text-white focus:outline-none focus:border-white/40"
                >
                  <option value="2D Platformer">2D Platformer</option>
                  <option value="Multiplayer Co-op">Multiplayer</option>
                  <option value="Puzzle / Оньсого">Оньсого / Puzzle</option>
                  <option value="RPG / Түүхт">RPG / Түүхт</option>
                  <option value="Racing / Уралдаан">Racing</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Платформ:</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-2.5 py-2 bg-black border border-white/15 rounded-md text-white focus:outline-none focus:border-white/40"
                >
                  <option value="Вэб хөтөч">Вэб хөтөч</option>
                  <option value="PC Компьютер">PC Компьютер</option>
                  <option value="Гар утас">Гар утас</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Гол дүр (Hero):</label>
              <input
                type="text"
                placeholder="Жишээ: Зоригт, Баатар робот"
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-md text-white focus:outline-none focus:border-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Онцлог чадвар ба дүрэм (Mechanics):</label>
              <input
                type="text"
                placeholder="Жишээ: 2 давхар үсрэх, найздаа туслах"
                value={mechanic}
                onChange={(e) => setMechanic(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-md text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <button
              type="submit"
              className="w-full btn btn-solid text-xs font-semibold py-2.5 mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Төсөл үүсгэх
            </button>
          </div>
        </form>

        {/* Ideas List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
            <span>Зоригтын тоглоомын санаанууд ({ideas.length})</span>
            <span>Хуулж аваад найзууддаа үзүүлээрэй</span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="p-3.5 rounded-xl border border-white/10 bg-black/40 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: idea.color }}
                    />
                    <h5 className="font-semibold text-white text-xs m-0">{idea.title}</h5>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(idea)}
                      className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                      title="Төслийг хуулах"
                    >
                      {copiedId === idea.id ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-white/10 transition-colors"
                      title="Устгах"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[10px] bg-white/5 text-neutral-300 px-2 py-0.5 rounded border border-white/10">
                    🎮 {idea.genre}
                  </span>
                  <span className="text-[10px] bg-white/5 text-neutral-300 px-2 py-0.5 rounded border border-white/10">
                    🖥️ {idea.platform}
                  </span>
                  <span className="text-[10px] bg-white/10 text-neutral-200 px-2 py-0.5 rounded border border-white/10">
                    👤 Дүр: {idea.heroName}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 mb-1 leading-relaxed">
                  <span className="text-white">Онцлог:</span> {idea.mechanic}
                </p>
                <p className="text-[11px] text-neutral-500 italic m-0">"{idea.story}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
