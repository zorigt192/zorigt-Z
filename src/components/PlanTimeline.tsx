import React, { useState } from 'react';
import { PlanItem } from '../types';
import { Calendar, Target, Award, Rocket, CheckCircle, Clock } from 'lucide-react';
import { sound } from '../utils/audio';

const INITIAL_PLANS: PlanItem[] = [
  {
    id: '1',
    timeframe: 'Одоо',
    title: 'HTML, CSS, JavaScript сурах',
    description: 'Энэ курсээр HTML, CSS, JavaScript сурч, хөтөч дээр ажилладаг анхны интерактив хуудсаа кодолно.',
    status: 'in_progress',
    iconName: 'clock',
  },
  {
    id: '2',
    timeframe: 'Энэ жил',
    title: 'Өөрийн анхны тоглоомоо хийх',
    description: 'Өөрийн анхны тоглоомоо хийж найзууддаа тоглох боломжтой болгоно. Дүр, оноо, саадын хөдөлгөөн угсрах.',
    status: 'in_progress',
    iconName: 'target',
  },
  {
    id: '3',
    timeframe: 'Сургуульд',
    title: 'Математик, Англи хэлээ сайжруулах',
    description: 'Сургуулийн математик, англи хэлээ сайжруулж, тоглоомын физик, гадаад ном заавруудыг чөлөөтэй ойлгох.',
    status: 'future',
    iconName: 'award',
  },
  {
    id: '4',
    timeframe: 'Ирээдүйд',
    title: 'Програмчлалын чиглэлээр сурах',
    description: 'Мэргэжлийн түвшинд програмчлалын чиглэлээр суралцаж, олон улсад өрсөлдөхүйц студи байгуулах.',
    status: 'future',
    iconName: 'rocket',
  },
];

export const PlanTimeline: React.FC = () => {
  const [plans, setPlans] = useState<PlanItem[]>(INITIAL_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('1');

  const toggleStatus = (id: string) => {
    sound.playClick();
    setPlans(
      plans.map((p) => {
        if (p.id === id) {
          const nextStatus =
            p.status === 'done' ? 'in_progress' : p.status === 'in_progress' ? 'done' : 'in_progress';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const getStatusBadge = (status: PlanItem['status']) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Биелсэн
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-200 bg-white/5 px-2 py-0.5 rounded border border-white/15">
            <Clock className="w-3 h-3 text-sky-400 animate-spin" /> Идэвхтэй
          </span>
        );
      case 'future':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
            Зорилт
          </span>
        );
    }
  };

  return (
    <div className="vesper-card p-4 sm:p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center text-white shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-200" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white m-0">Миний төлөвлөгөө</h3>
            <p className="text-xs text-neutral-400 m-0">
              Мөрөөдөлдөө хүрэх 4 үндсэн шат
            </p>
          </div>
        </div>

        <div className="relative border-l border-white/15 ml-3 pl-5 space-y-4">
          {plans.map((item, index) => {
            const isSelected = selectedPlanId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedPlanId(item.id);
                  sound.playClick();
                }}
                className={`relative p-3.5 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white/10 border-white/30 shadow-lg'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Step indicator node */}
                <div
                  className={`absolute -left-[27px] top-4 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    item.status === 'done'
                      ? 'bg-white text-black border-white'
                      : item.status === 'in_progress'
                      ? 'bg-neutral-800 text-white border-white/40'
                      : 'bg-black text-neutral-400 border-white/20'
                  }`}
                >
                  {index + 1}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-mono text-xs font-semibold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 shrink-0">
                      {item.timeframe}:
                    </span>
                    <h4 className="font-medium text-white text-xs m-0 break-words">{item.title}</h4>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed m-0 mt-1">{item.description}</p>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(item.id);
                    }}
                    className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    {item.status === 'done' ? 'Буцаах' : 'Төлөв солих'}
                  </button>
                  <span className="text-[10px] text-neutral-500 font-mono">0{index + 1} / 04</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
