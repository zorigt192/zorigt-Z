/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Heart,
  Users,
  Trophy,
  Rocket,
  CheckCircle2,
  Terminal,
  Volume2,
  VolumeX,
  Code2,
  Play,
  ArrowRight,
  X,
  Menu,
} from 'lucide-react';
import { MiniGame } from './components/MiniGame';
import { SkillsTracker } from './components/SkillsTracker';
import { PlanTimeline } from './components/PlanTimeline';
import { GameIdeaGenerator } from './components/GameIdeaGenerator';
import { GameDevQuiz } from './components/GameDevQuiz';
import { sound } from './utils/audio';

export default function App() {
  const [totalXp, setTotalXp] = useState<number>(350);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showTsModal, setShowTsModal] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setIsMuted(!sound.enabled);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.classList.remove('menu-open');
  };

  const toggleMenu = () => {
    const nextState = !menuOpen;
    setMenuOpen(nextState);
    if (nextState) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', handleKeyDown);

    const appears = document.querySelectorAll('.appear');
    appears.forEach((el) => {
      el.addEventListener(
        'animationend',
        () => {
          el.classList.add('is-in');
        },
        { once: true }
      );
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let running = false;
        if (document.getAnimations) {
          const anims = document.getAnimations();
          for (let i = 0; i < anims.length; i++) {
            if (anims[i].playState === 'running' || anims[i].playState === 'finished') {
              running = true;
              break;
            }
          }
        }
        if (!running) {
          appears.forEach((el) => el.classList.add('is-in'));
        }
      });
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="w-full max-w-full min-h-screen text-white relative z-10 selection:bg-white selection:text-black flex flex-col items-center overflow-x-hidden">
      {/* Mobile Drawer Navigation (Sleek full-screen overlay) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl p-6 flex flex-col justify-between md:hidden animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <a
                href="#top"
                onClick={closeMenu}
                className="flex items-center gap-2.5 text-base font-semibold text-white tracking-tight"
              >
                <svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ width: '22px', height: '22px' }}
                >
                  <g transform="rotate(-30 12 12)">
                    <circle cx="7.3" cy="3.2" r="1.45" />
                    <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                    <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                    <circle cx="16.7" cy="20.8" r="1.45" />
                  </g>
                </svg>
                <span>
                  Zorigt<span className="text-neutral-400 font-normal">.dev</span>
                </span>
              </a>

              <button
                onClick={closeMenu}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white"
                aria-label="Хаах"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2.5 mt-6">
              {[
                { label: 'Нүүр', href: '#top' },
                { label: '🕹️ Мини тоглоом', href: '#minigame' },
                { label: '⚡ Ур чадвар & Төлөвлөгөө', href: '#skills' },
                { label: '🤝 Яагаад энэ ажил вэ?', href: '#reason' },
                { label: '💡 Санаа зохиох', href: '#studio' },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  onClick={() => {
                    closeMenu();
                    sound.playClick();
                  }}
                  className="h-12 px-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-sm font-medium text-neutral-200 active:bg-white/15 active:text-white"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-neutral-500" />
                </a>
              ))}
            </nav>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
              <span>Дууны эффект:</span>
              <button
                onClick={toggleSound}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white font-medium"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isMuted ? 'Хаагдсан' : 'Идэвхтэй'}</span>
              </button>
            </div>

            <a
              href="#minigame"
              onClick={() => {
                closeMenu();
                sound.playClick();
              }}
              className="w-full btn btn-solid text-sm font-semibold h-12 flex items-center justify-center"
            >
              Тоглож эхлэх
            </a>
          </div>
        </div>
      )}

      {/* HEADER (3-Column Liquid-Metal Architecture) */}
      <header className="header w-full">
        {/* Left: Logo */}
        <a
          href="#top"
          className="logo appear appear--scale"
          style={{ ['--d' as string]: '0.08s' }}
          aria-label="Zorigt Game Developer"
          onClick={() => {
            closeMenu();
            sound.playClick();
          }}
        >
          <svg
            className="logo-mark"
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            style={{ width: '22px', height: '22px', minWidth: '22px' }}
          >
            <g transform="rotate(-30 12 12)">
              <circle cx="7.3" cy="3.2" r="1.45" />
              <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <circle cx="16.7" cy="20.8" r="1.45" />
            </g>
          </svg>
          <span className="font-semibold text-sm sm:text-base">
            Zorigt<span className="logo-suffix">.dev</span>
          </span>
        </a>

        {/* Center: Nav links (Desktop) */}
        <nav id="site-nav" aria-label="Primary">
          <a
            href="#top"
            className="appear appear--scale"
            style={{ ['--d' as string]: '0.16s' }}
            onClick={() => sound.playClick()}
          >
            Нүүр
          </a>
          <a
            href="#minigame"
            className="appear appear--soft"
            style={{ ['--d' as string]: '0.28s' }}
            onClick={() => sound.playClick()}
          >
            Мини тоглоом
          </a>
          <a
            href="#skills"
            className="appear appear--scale"
            style={{ ['--d' as string]: '0.40s' }}
            onClick={() => sound.playClick()}
          >
            Ур чадвар & Төлөвлөгөө
          </a>
          <a
            href="#reason"
            className="appear appear--soft"
            style={{ ['--d' as string]: '0.52s' }}
            onClick={() => sound.playClick()}
          >
            Яагаад энэ ажил вэ?
          </a>
          <a
            href="#studio"
            className="appear appear--soft"
            style={{ ['--d' as string]: '0.60s' }}
            onClick={() => sound.playClick()}
          >
            Санаа зохиох
          </a>
        </nav>

        {/* Right: CTA & Actions */}
        <div className="header-actions">
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors border border-white/10 cursor-pointer"
            title={isMuted ? 'Дуу асаах' : 'Дуу хаах'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>

          <a
            href="#minigame"
            onClick={() => sound.playClick()}
            className="btn btn-solid header-cta appear appear--scale hidden sm:inline-flex text-xs font-semibold px-4 h-9"
            style={{ ['--d' as string]: '0.34s' }}
          >
            Тоглож эхлэх
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={toggleMenu}
            className="burger appear appear--scale"
            style={{ ['--d' as string]: '0.34s' }}
            aria-label="Цэс нээх"
          >
            <span className="burger-bar" />
            <span className="burger-bar" />
            <span className="burger-bar" />
          </button>
        </div>
      </header>

      {/* HERO SECTION (PERFECTLY CENTERED IN VIEWPORT) */}
      <main className="w-full min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 sm:py-16 max-w-3xl mx-auto" id="top">
        {/* Badge */}
        <div
          className="badge appear appear--pop mb-4 sm:mb-6 self-center mx-auto"
          style={{ ['--d' as string]: '0.22s' }}
        >
          <svg
            className="badge-star shrink-0"
            width={18}
            height={20}
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ width: '18px', height: '20px', minWidth: '18px' }}
          >
            <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
          </svg>
          <span className="text-xs sm:text-sm font-medium">
            Миний мөрөөдлийн мэргэжил — Тоглоом хөгжүүлэгч
          </span>
        </div>

        {/* Two-Line Masked Headline (Centered) */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-[1.2] sm:leading-[1.12] mb-4 sm:mb-5 text-center flex flex-col items-center justify-center w-full">
          <span className="headline-line block text-center">
            <span className="appear appear--mask" style={{ ['--d' as string]: '0.42s' }}>
              10 жилийн дараа <em className="vesper-em">тоглоом бүтээдэг</em>
            </span>
          </span>
          <span className="headline-line block text-center">
            <span className="appear appear--mask" style={{ ['--d' as string]: '0.62s' }}>
              хүн болно.
            </span>
          </span>
        </h1>

        {/* Lede (Centered) */}
        <p
          className="text-xs sm:text-base text-neutral-400 max-w-lg mx-auto leading-relaxed mb-6 sm:mb-8 text-center px-2"
          style={{ ['--d' as string]: '0.82s' }}
        >
          <b className="text-neutral-200">Юу хийдэг вэ:</b> дүр, түвшин, дүрмийг кодоор бүтээдэг.
          Найзуудтайгаа хамт тоглох өөрийн тоглоомтой болмоор байна.
        </p>

        {/* Action buttons (Centered) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto px-4 mx-auto">
          <a
            href="#minigame"
            onClick={() => sound.playClick()}
            className="w-full sm:w-auto btn btn-solid text-xs sm:text-sm font-semibold h-11 px-6 flex items-center justify-center"
            style={{ ['--d' as string]: '0.96s' }}
          >
            <Play className="w-4 h-4 mr-2 fill-current" /> Мини тоглоом тоглох
          </a>
          <a
            href="#skills"
            onClick={() => sound.playClick()}
            className="w-full sm:w-auto btn btn-ghost hero-ghost text-xs sm:text-sm font-semibold h-11 px-6 flex items-center justify-center"
            style={{ ['--d' as string]: '1.10s' }}
          >
            Ур чадвар & Төлөвлөгөө
          </a>
        </div>
      </main>

      {/* STATS SECTION (PERFECTLY CENTERED WITH NEAT SVG LOGOS) */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
          {/* Stat 1: Dual-pill workflow icon */}
          <div className="flex items-center justify-center text-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all">
            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ width: '20px', height: '20px', minWidth: '20px', maxWidth: '20px' }}
              >
                <defs>
                  <linearGradient id="pill-grad-left" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.38" />
                    <stop offset="100%" stop-color="#3a3a3a" stop-opacity="0.62" />
                  </linearGradient>
                  <linearGradient id="pill-grad-right" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#3a3a3a" stop-opacity="0.38" />
                    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.62" />
                  </linearGradient>
                </defs>
                <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#pill-grad-left)" />
                <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#pill-grad-right)" />
                <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
              </svg>
            </div>
            <span className="text-xs text-neutral-300 font-medium leading-tight">
              4.2M+ кодын мөр & логик
            </span>
          </div>

          {/* Stat 2: Download tile icon */}
          <div className="flex items-center justify-center text-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all">
            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ width: '20px', height: '20px', minWidth: '20px', maxWidth: '20px' }}
              >
                <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#ffffff" />
                <path d="M12 7.1v7.4" stroke="#111111" strokeWidth="1.85" strokeLinecap="round" />
                <path d="M8.15 12.35L12 16.2l3.85-3.85" stroke="#111111" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <span className="text-xs text-neutral-300 font-medium leading-tight">
              92% өсөлттэй суралцах хүсэл
            </span>
          </div>

          {/* Stat 3: 3-Avatar cluster icon */}
          <div className="flex items-center justify-center text-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all">
            <div className="w-11 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <svg
                width={38}
                height={21}
                viewBox="0 0 40 22"
                aria-hidden="true"
                style={{ width: '38px', height: '21px', minWidth: '38px', maxWidth: '38px' }}
              >
                <circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" />
                <polygon points="7.2,4.8 6.0,8.2 9.2,7.4" fill="#2b2b2b" />
                <polygon points="13.2,4.8 14.4,8.2 11.2,7.4" fill="#2b2b2b" />
                <ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" />
                <circle cx="8.9" cy="11.6" r="0.7" fill="#1a1a1a" />
                <circle cx="11.5" cy="11.6" r="0.7" fill="#1a1a1a" />

                <circle cx="20.2" cy="11" r="9.2" fill="#ffffff" />
                <circle cx="18.2" cy="9.8" r="1.7" fill="#111111" />
                <circle cx="22.2" cy="9.8" r="1.7" fill="#111111" />
                <ellipse cx="20.2" cy="12.2" rx="1.1" ry="0.8" fill="#111111" />
                <path d="M18.2 13.8 Q20.2 16 22.2 13.8" stroke="#111111" strokeWidth="1.2" strokeLinecap="round" fill="none" />

                <circle cx="30.2" cy="11" r="9.2" fill="#f26b1d" />
                <text x="30.2" y="15.1" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="12.5" textAnchor="middle" fill="#ffffff">e</text>
              </svg>
            </div>
            <span className="text-xs text-neutral-300 font-medium leading-tight">
              180+ найзуудтайгаа тоглох зорилго
            </span>
          </div>
        </div>
      </div>

      {/* DETAILED CONTENT CONTAINER (CENTERED) */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14 flex flex-col items-center">
        {/* INTRO CARD (CENTERED PROMINENT LAYOUT) */}
        <section id="intro" className="w-full vesper-card p-6 sm:p-8 scroll-mt-20 text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/15 text-xs text-neutral-300 mb-3 mx-auto">
            <Rocket className="w-3.5 h-3.5 text-white" /> Мөрөөдлийн зорилго
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-3 text-center">
            Тоглоом хөгжүүлэгч болох замнал
          </h2>

          <p className="text-neutral-200 text-sm sm:text-base leading-relaxed mb-3 max-w-xl mx-auto text-center font-medium">
            10 жилийн дараа би дэлхийн олон сая хүүхэд, найзууддаа баяр баясгалан бэлэглэх
            өөрийн тоглоомыг бие даан бүтээдэг хүн болно.
          </p>

          <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-6 max-w-xl mx-auto text-center">
            <b>Юу хийдэг вэ:</b> дүр, түвшин, логик, дүрмийг кодоор амилуулан бүтээдэг.
            Вэб технологиос эхлээд орчин үеийн 2D/3D хөдөлгүүрүүд хүртэл тасралтгүй суралцаж байна.
          </p>

          {/* Centered preview image */}
          <div className="w-full max-w-md relative group rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-2xl mb-6 mx-auto">
            <img
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80"
              alt="Компьютер тоглоом хөгжүүлж буй хүн"
              className="w-full h-[200px] sm:h-[240px] object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-300">🎮 Game Dev Core</span>
              <span className="text-emerald-400">● 60 FPS</span>
            </div>
          </div>

          {/* Centered badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 border-t border-white/10 w-full max-w-lg mx-auto">
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-neutral-300 font-mono">
              <Terminal className="w-3.5 h-3.5 text-white" />
              <span>TypeScript + Canvas 2D</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-neutral-300 font-mono">
              <Trophy className="w-3.5 h-3.5 text-white" />
              <span>Нийт XP: {totalXp}</span>
            </div>
            <button
              onClick={() => setShowTsModal(true)}
              className="text-xs text-neutral-300 hover:text-white underline font-medium cursor-pointer"
            >
              TypeScript бүтэц харах →
            </button>
          </div>
        </section>

        {/* PLAYABLE MINI-GAME */}
        <section id="minigame" className="w-full scroll-mt-20">
          <MiniGame />
        </section>

        {/* SKILLS & PLANS GRID */}
        <section id="skills" className="w-full scroll-mt-20">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/15 text-xs text-neutral-300 mb-2.5 mx-auto">
              <Sparkles className="w-3.5 h-3.5 text-white" /> Суралцах төлөвлөгөө
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Ур чадвар ба Ирээдүйн төлөвлөгөө
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch w-full">
            <div className="w-full min-w-0">
              <SkillsTracker onXpChange={(xp) => setTotalXp(350 + xp)} />
            </div>
            <div className="w-full min-w-0">
              <PlanTimeline />
            </div>
          </div>
        </section>

        {/* REASON SECTION (CENTERED) */}
        <section id="reason" className="w-full vesper-card p-6 sm:p-8 scroll-mt-20 text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/15 text-xs text-neutral-300 mb-3 mx-auto">
            <Users className="w-3.5 h-3.5 text-white" /> Найзуудын хамтын хүч
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3 text-center">
            Яагаад энэ ажил вэ?
          </h2>

          <p className="text-base sm:text-lg text-neutral-100 font-semibold leading-relaxed mb-3 max-w-lg mx-auto text-center">
            "Найзуудтайгаа тоглох өөрийн тоглоомтой болмоор байна."
          </p>

          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6 max-w-xl mx-auto text-center">
            Би найзуудтайгаа хамт сууж шинэ дүрэм зохиох, хамтдаа сорилт давах дуртай.
            Өөрөө тоглоом хөгжүүлэгч болсноор өөрсдийн хүссэн сонирхолтой дүрэм, дайсан, адал
            явдлыг өөрсдийн гараар бодитой болгож, хамгийн нандин дурсамжаа хамтдаа бүтээж чадна!
          </p>

          {/* Centered Co-op visual banner */}
          <div className="w-full max-w-md h-[180px] sm:h-[200px] rounded-2xl border border-white/15 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 p-5 flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl mb-6 mx-auto">
            <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded text-neutral-200 border border-white/10 font-mono">
              Co-op Multiplayer 👥
            </span>

            <div className="my-auto">
              <div className="text-3xl sm:text-4xl mb-1.5">🎮 🤝 👾</div>
              <p className="text-xs font-semibold text-neutral-200">
                Хамтдаа тоглох нь хамгийн гоё дурсамж
              </p>
            </div>

            <div className="w-full text-[11px] text-neutral-400 flex items-center justify-between border-t border-white/10 pt-1.5">
              <span>Найзуудын баг</span>
              <span className="text-emerald-400">● Онлайн холболт</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mx-auto text-xs">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-neutral-200 flex items-center justify-center gap-2 text-center">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>Найзуудтайгаа баяр хуваалцах</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-neutral-200 flex items-center justify-center gap-2 text-center">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>Төсөөллөө кодоор бүтээх</span>
            </div>
          </div>
        </section>

        {/* GAME IDEA GENERATOR STUDIO */}
        <section id="studio" className="w-full scroll-mt-20">
          <GameIdeaGenerator />
        </section>

        {/* GAME DEV QUIZ */}
        <section className="w-full">
          <GameDevQuiz />
        </section>
      </div>

      {/* FOOTER (CENTERED) */}
      <footer className="text-center text-xs text-neutral-500 py-10 mt-14 border-t border-white/10 px-4 w-full flex flex-col items-center">
        <p className="font-semibold text-neutral-300 text-xs sm:text-sm mb-1.5">
          🎮 Zorigt — Тоглоом хөгжүүлэгч (Game Developer)
        </p>
        <p className="text-[11px] text-neutral-500">
          Vesper.ai Liquid-Metal Design System • React & TypeScript Architecture
        </p>
      </footer>

      {/* TYPESCRIPT CODE EXPLANATION MODAL */}
      {showTsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="vesper-card max-w-2xl w-full p-5 sm:p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-white" />
                <h3 className="font-semibold text-white text-sm sm:text-base m-0">
                  TypeScript тоглоом хөгжүүлэлтийн код
                </h3>
              </div>
              <button
                onClick={() => setShowTsModal(false)}
                className="text-neutral-400 hover:text-white px-2 py-1 rounded text-xs font-mono cursor-pointer"
              >
                ✕ Хаах
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-3 leading-relaxed text-center sm:text-left">
              Зоригтын вэб хуудас нь бүхэлдээ TypeScript дээр найдвартай ажиллаж байна:
            </p>

            <div className="bg-black/90 rounded-xl p-3.5 font-mono text-xs text-neutral-300 space-y-3.5 border border-white/15 overflow-x-auto">
              <div>
                <span className="text-neutral-500">// 1. Тоглоомын дүрийн загвар</span>
                <pre>{`interface Player {
  x: number;          // Хэвтээ байрлал
  y: number;          // Босоо байрлал
  speed: number;      // Гүйх хурд
  vy: number;         // Үсрэлтийн хурдатгал
  isGrounded: boolean;// Газар дээр байгаа эсэх
}`}</pre>
              </div>

              <div>
                <span className="text-neutral-500">// 2. Мөргөлдөөн шалгах алгоритм (Collision Detection)</span>
                <pre>{`function checkCollision(a: Entity, b: Entity): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}`}</pre>
              </div>

              <div>
                <span className="text-neutral-500">// 3. Web Audio 8-bit дуу үүсгэх функц</span>
                <pre>{`function playJumpSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(160, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.12);
  osc.start();
  osc.stop(ctx.currentTime + 0.13);
}`}</pre>
              </div>
            </div>

            <div className="mt-4 flex justify-center sm:justify-end">
              <button
                onClick={() => setShowTsModal(false)}
                className="btn btn-solid text-xs font-semibold px-4 py-2 cursor-pointer"
              >
                Ойлголоо, баярлалаа!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
