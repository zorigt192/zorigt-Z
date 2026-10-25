import React, { useState } from 'react';
import { CheckCircle2, Circle, Code2, Palette, Users, BookOpen, Plus } from 'lucide-react';
import { SkillItem } from '../types';
import { sound } from '../utils/audio';

interface SkillsTrackerProps {
  onXpChange?: (totalXp: number) => void;
}

const INITIAL_SKILLS: SkillItem[] = [
  {
    id: '1',
    title: 'Код бичих (HTML, CSS, JavaScript, TypeScript)',
    category: 'code',
    categoryName: 'Програмчлал',
    xp: 200,
    completed: true,
    notes: 'Интерактив тоглоомын дүрэм, удирдлага, хөдөлгөөний логик кодлох.',
  },
  {
    id: '2',
    title: 'Зураг, дизайн (2D Pixel Art & UI)',
    category: 'art',
    categoryName: 'График дизайн',
    xp: 150,
    completed: true,
    notes: 'Тоглоомын дүрүүд, дайсан, орчны харагдах өнгө төрхийг бүтээх.',
  },
  {
    id: '3',
    title: 'Багаар ажиллах & Тоглоом туршилт',
    category: 'team',
    categoryName: 'Багийн ажиллагаа',
    xp: 120,
    completed: false,
    notes: 'Найзуудтайгаа санаа солилцож, алдааг хамтдаа шалгаж турших.',
  },
  {
    id: '4',
    title: 'Сургуульд: Математик ба Англи хэлээ сайжруулах',
    category: 'study',
    categoryName: 'Сургуулийн хичээл',
    xp: 180,
    completed: false,
    notes: 'Координат, физик тооцоолол болон англи хэл дээрх гарын авлага унших.',
  },
];

export const SkillsTracker: React.FC<SkillsTrackerProps> = ({ onXpChange }) => {
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [filter, setFilter] = useState<string>('all');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<SkillItem['category']>('code');
  const [newXp, setNewXp] = useState<number>(100);

  const toggleSkill = (id: string) => {
    sound.playClick();
    const updated = skills.map((s) => {
      if (s.id === id) {
        const nextState = !s.completed;
        if (nextState) sound.playCollect();
        return { ...s, completed: nextState };
      }
      return s;
    });
    setSkills(updated);

    const total = updated.filter((s) => s.completed).reduce((acc, curr) => acc + curr.xp, 0);
    onXpChange?.(total);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const categoryNames: Record<SkillItem['category'], string> = {
      code: 'Програмчлал',
      art: 'График дизайн',
      team: 'Багийн ажиллагаа',
      study: 'Сургуулийн хичээл',
    };

    const newSkill: SkillItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory,
      categoryName: categoryNames[newCategory],
      xp: newXp,
      completed: false,
      notes: 'Зоригтын нэмсэн шинэ ур чадвар.',
    };

    setSkills([...skills, newSkill]);
    setNewTitle('');
    setIsAdding(false);
    sound.playLevelUp();
  };

  const completedCount = skills.filter((s) => s.completed).length;
  const totalXp = skills.filter((s) => s.completed).reduce((sum, s) => sum + s.xp, 0);
  const maxPossibleXp = skills.reduce((sum, s) => sum + s.xp, 0);
  const percentage = Math.round((totalXp / (maxPossibleXp || 1)) * 100);

  const filteredSkills = filter === 'all' ? skills : skills.filter((s) => s.category === filter);

  return (
    <div className="vesper-card p-4 sm:p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center text-white shrink-0">
              <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-200" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white m-0">Хэрэгтэй ур чадвар</h3>
              <p className="text-xs text-neutral-400 m-0">
                Код бичих, зураг дизайн, багаар ажиллах
              </p>
            </div>
          </div>

          <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2.5">
            <div className="text-xs font-medium text-neutral-300">
              {completedCount}/{skills.length} ({totalXp} XP)
            </div>
            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-white text-black font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Бүгд
            </button>
            <button
              onClick={() => setFilter('code')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filter === 'code' ? 'bg-white text-black font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Код
            </button>
            <button
              onClick={() => setFilter('art')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filter === 'art' ? 'bg-white text-black font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Дизайн
            </button>
            <button
              onClick={() => setFilter('team')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filter === 'team' ? 'bg-white text-black font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Баг
            </button>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="btn btn-ghost text-xs px-2.5 py-1 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Нэмэх
          </button>
        </div>

        {/* Add Skill Form */}
        {isAdding && (
          <form onSubmit={handleAddSkill} className="mb-4 p-3 bg-white/5 rounded-xl border border-white/15">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <input
                type="text"
                placeholder="Чадварын нэр (жишээ: Game physics)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 text-xs bg-black/60 border border-white/15 rounded text-white focus:outline-none focus:border-white/40"
                required
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as SkillItem['category'])}
                className="px-2 py-1.5 text-xs bg-black/60 border border-white/15 rounded text-white focus:outline-none focus:border-white/40"
              >
                <option value="code">Код бичих</option>
                <option value="art">Зураг, дизайн</option>
                <option value="team">Багаар ажиллах</option>
                <option value="study">Сургуулийн хичээл</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
              >
                Болих
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs btn btn-solid text-black font-medium rounded"
              >
                Хадгалах
              </button>
            </div>
          </form>
        )}

        {/* Skills list */}
        <div className="space-y-2.5">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              onClick={() => toggleSkill(skill.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 ${
                skill.completed
                  ? 'bg-white/5 border-white/20'
                  : 'bg-black/40 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  className="mt-0.5 text-white shrink-0"
                  aria-label={skill.completed ? 'Дуусгасан' : 'Хийгээгүй'}
                >
                  {skill.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-xs font-medium break-words ${
                        skill.completed ? 'text-neutral-400 line-through' : 'text-neutral-200'
                      }`}
                    >
                      {skill.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 font-mono shrink-0">
                      {skill.categoryName}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 m-0 break-words">{skill.notes}</p>
                </div>
              </div>

              <div className="shrink-0 ml-1.5">
                <span className="text-[11px] font-mono font-medium text-neutral-300 bg-white/5 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                  +{skill.xp} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
