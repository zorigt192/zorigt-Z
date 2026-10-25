import React, { useState } from 'react';
import { HelpCircle, Check, X, RotateCcw, Award } from 'lucide-react';
import { QuizQuestion } from '../types';
import { sound } from '../utils/audio';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Тоглоом дахь "Game Loop" (Үндсэн давталт) гэж юу вэ?',
    options: [
      'Секунд тутам дүрсийн байрлал, товчлуурын даралтыг 60 удаа шинэчилж зурах тасралтгүй цикл',
      'Зөвхөн хөгжим давтаж тоглуулдаг хэсэг',
      'Тоглоом дууссаны дараа гарах бичиг',
      'Дэлгэцийн өнгө тохируулагч',
    ],
    correctIndex: 0,
    explanation: 'Зөв! Game Loop нь товчлуурын даралтыг шалгах, дүрийг хөдөлгөх, дэлгэц дээр зурах үйлдлийг секундэд 60 хүртэл удаа тасралтгүй давтаж ажилладаг.',
  },
  {
    id: 2,
    question: 'Програмчлалд "Bug" (Алдаа) гэж юуг хэлдэг вэ?',
    options: [
      'Компьютер дотор явж буй жинхэнэ шавьж',
      'Код буруу бичигдсэний улмаас тоглоом гацах эсвэл буруу ажиллах логик алдаа',
      'Тоглоомын гол баатар',
      'Шинэ гар (Keyboard)',
    ],
    correctIndex: 1,
    explanation: 'Тийм ээ! Bug гэдэг нь кодын логик алдааг хэлдэг. Алдаагаа олж засахыг "Debugging" гэдэг.',
  },
  {
    id: 3,
    question: 'TypeScript яагаад тоглоом бүтээхэд маш найдвартай байдаг вэ?',
    options: [
      'Интернетгүй ажилладаг',
      'Өгөгдлийн төрлийг хатуу шалгаж (Type Safety), алдааг кодолж байх үед нь шууд анхааруулдаг',
      'Зөвхөн зураг зурдаг хэл учраас',
      'Дүрийн хурдыг 10 дахин ихэсгэдэг',
    ],
    correctIndex: 1,
    explanation: 'Яг зөв! TypeScript нь өгөгдлийн төрлийг хатуу хянаж, тоглоомын код томорсон ч тогтвортой, найдвартай ажиллах нөхцөлийг хангадаг.',
  },
];

export const GameDevQuiz: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const currentQ = QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctIndex) {
      sound.playCollect();
      setScore(score + 1);
    } else {
      sound.playHit();
    }
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      sound.playLevelUp();
    }
  };

  const handleRestart = () => {
    sound.playClick();
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="vesper-card p-4 sm:p-6 my-6 sm:my-8 w-full">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center text-white shrink-0">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-200" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base m-0">
              Тоглоом бүтээгчийн сорилт (Quiz)
            </h4>
            <p className="text-xs text-neutral-400 m-0">Код болон тоглоомын суурь мэдлэг</p>
          </div>
        </div>

        <span className="text-xs font-mono font-medium px-2.5 py-1 bg-white/5 rounded border border-white/10 text-neutral-300">
          0{currentIdx + 1} / 0{QUESTIONS.length}
        </span>
      </div>

      {!isFinished ? (
        <div>
          <h5 className="text-sm font-medium text-white mb-3">{currentQ.question}</h5>

          <div className="space-y-2 mb-4">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedOpt === i;
              const isCorrect = i === currentQ.correctIndex;

              let btnStyle = 'bg-black/40 border-white/10 hover:border-white/20 text-neutral-300';
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-white/15 border-white text-white font-semibold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-950/40 border-rose-500 text-rose-200';
                } else {
                  btnStyle = 'bg-black/20 border-white/5 text-neutral-600 opacity-40';
                }
              }

              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-colors cursor-pointer ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isAnswered && isSelected && !isCorrect && (
                    <X className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="p-3 bg-white/5 border border-white/15 rounded-lg text-xs text-neutral-300 mb-4">
              <p className="font-semibold text-white mb-0.5">Тайлбар:</p>
              <p className="m-0 leading-relaxed text-neutral-300">{currentQ.explanation}</p>
            </div>
          )}

          {isAnswered && (
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="btn btn-solid text-xs font-semibold px-4 py-2 cursor-pointer"
              >
                {currentIdx + 1 < QUESTIONS.length ? 'Дараагийн асуулт →' : 'Дүнг харах 🎉'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
            <Award className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1">Сорилт дууслаа!</h4>
          <p className="text-xs text-neutral-400 mb-4">
            Та {QUESTIONS.length} асуултаас <b className="text-white font-bold">{score}</b> зөв хариуллаа.
          </p>
          <button
            onClick={handleRestart}
            className="btn btn-solid text-xs font-semibold px-5 py-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Дахин турших
          </button>
        </div>
      )}
    </div>
  );
};
