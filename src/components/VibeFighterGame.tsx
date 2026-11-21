import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  Shield,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { addLeaderboardEntry, getSavedPlayerName } from '../utils/leaderboard';
import { LeaderboardCard } from './LeaderboardCard';

interface VibeFighterGameProps {
  externalUrl?: string;
}

type MatchMode = '1v1' | '2v2';
type ControlOpponent = 'ai' | 'pvp';
type ScreenPhase = 'MENU' | 'FIGHTING' | 'MATCH_OVER';

interface FighterSpec {
  id: string;
  name: string;
  title: string;
  giColor: string;
  accentColor: string;
  skinColor: string;
  hairColor: string;
  energyColor: string;
  speed: number;
  power: number;
}

const ROSTER: FighterSpec[] = [
  {
    id: 'kazu',
    name: 'KAZU',
    title: 'Кибер Карате',
    giColor: '#f8fafc',
    accentColor: '#38bdf8',
    skinColor: '#f5cba7',
    hairColor: '#1e293b',
    energyColor: '#38bdf8',
    speed: 4.5,
    power: 1.0,
  },
  {
    id: 'ryuken',
    name: 'RYUKEN',
    title: 'Сүүдрийн Нинжа',
    giColor: '#18181b',
    accentColor: '#ef4444',
    skinColor: '#f3d2b3',
    hairColor: '#09090b',
    energyColor: '#fb7185',
    speed: 5.2,
    power: 0.92,
  },
  {
    id: 'titan',
    name: 'TITAN',
    title: 'Меха Тулаанч',
    giColor: '#27272a',
    accentColor: '#f59e0b',
    skinColor: '#e5b88b',
    hairColor: '#78350f',
    energyColor: '#fbbf24',
    speed: 3.9,
    power: 1.18,
  },
  {
    id: 'nova',
    name: 'NOVA',
    title: 'Плазм Довтлогч',
    giColor: '#312e81',
    accentColor: '#c084fc',
    skinColor: '#fbdcc4',
    hairColor: '#e879f9',
    energyColor: '#c084fc',
    speed: 4.9,
    power: 1.02,
  },
];

interface FighterState {
  spec: FighterSpec;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  trailHp: number;
  maxHp: number;
  energy: number;
  state: 'idle' | 'walk' | 'jump' | 'punch' | 'kick' | 'special' | 'block' | 'hit' | 'ko';
  stateTimer: number;
  hitCooldown: number;
  hasHitThisAttack: boolean;
  comboCount: number;
}

interface EnergyBall {
  x: number;
  y: number;
  vx: number;
  ownerTeam: 1 | 2;
  color: string;
  damage: number;
  radius: number;
}

interface HitSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const ARENA_W = 960;
const ARENA_H = 540; // Exact 16:9 retro internal resolution
const FLOOR_Y = 456;
const GRAVITY = 0.72;

function createFighter(spec: FighterSpec, x: number, facing: 1 | -1): FighterState {
  return {
    spec,
    x,
    y: FLOOR_Y - 96,
    vx: 0,
    vy: 0,
    facing,
    hp: 100,
    trailHp: 100,
    maxHp: 100,
    energy: 35,
    state: 'idle',
    stateTimer: 0,
    hitCooldown: 0,
    hasHitThisAttack: false,
    comboCount: 0,
  };
}

export const VibeFighterGame: React.FC<VibeFighterGameProps> = ({ externalUrl }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [phase, setPhase] = useState<ScreenPhase>('MENU');
  const [matchMode, setMatchMode] = useState<MatchMode>('1v1');
  const [opponentType, setOpponentType] = useState<ControlOpponent>('ai');
  const [p1LeadIdx, setP1LeadIdx] = useState<number>(0);
  const [p2LeadIdx, setP2LeadIdx] = useState<number>(1);
  const [winnerText, setWinnerText] = useState<string>('');
  const [finalScore, setFinalScore] = useState<number>(0);
  const [playerName, setPlayerName] = useState<string>(() => getSavedPlayerName());
  const [scoreSaved, setScoreSaved] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  const keysRef = useRef<Record<string, boolean>>({});
  const touchRef = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    block: boolean;
    punch: boolean;
    kick: boolean;
    special: boolean;
    tag: boolean;
  }>({
    left: false,
    right: false,
    up: false,
    block: false,
    punch: false,
    kick: false,
    special: false,
    tag: false,
  });

  const engineRef = useRef<{
    team1: FighterState[];
    team2: FighterState[];
    active1: number;
    active2: number;
    projectiles: EnergyBall[];
    sparks: HitSpark[];
    texts: FloatingText[];
    timer: number;
    timerAcc: number;
    shake: number;
    koBannerTimer: number;
    aiThinkTimer: number;
    aiAction: 'approach' | 'retreat' | 'block' | 'idle';
    tagCooldown1: number;
    tagCooldown2: number;
    maxCombo1: number;
  }>({
    team1: [createFighter(ROSTER[0], 220, 1)],
    team2: [createFighter(ROSTER[1], ARENA_W - 220 - 52, -1)],
    active1: 0,
    active2: 0,
    projectiles: [],
    sparks: [],
    texts: [],
    timer: 99,
    timerAcc: 0,
    shake: 0,
    koBannerTimer: 0,
    aiThinkTimer: 0,
    aiAction: 'approach',
    tagCooldown1: 0,
    tagCooldown2: 0,
    maxCombo1: 0,
  });

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
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
      // Ignore fullscreen denial in sandboxed iframes
    }
  };

  const startMatch = useCallback(
    (selectedMode: MatchMode = matchMode, selectedOpponent: ControlOpponent = opponentType) => {
      sound.playLevelUp();
      const p1First = ROSTER[p1LeadIdx];
      const p1Second = ROSTER[(p1LeadIdx + 2) % ROSTER.length];
      const p2First = ROSTER[p2LeadIdx];
      const p2Second = ROSTER[(p2LeadIdx + 2) % ROSTER.length];

      const team1 =
        selectedMode === '2v2'
          ? [createFighter(p1First, 200, 1), createFighter(p1Second, 200, 1)]
          : [createFighter(p1First, 200, 1)];

      const team2 =
        selectedMode === '2v2'
          ? [
              createFighter(p2First, ARENA_W - 252, -1),
              createFighter(p2Second, ARENA_W - 252, -1),
            ]
          : [createFighter(p2First, ARENA_W - 252, -1)];

      engineRef.current = {
        team1,
        team2,
        active1: 0,
        active2: 0,
        projectiles: [],
        sparks: [],
        texts: [
          {
            x: ARENA_W / 2,
            y: 220,
            text: selectedMode === '2v2' ? '2v2 TEAM BATTLE — FIGHT!' : '1v1 DUEL — FIGHT!',
            color: '#fbbf24',
            life: 1.4,
          },
        ],
        timer: 99,
        timerAcc: 0,
        shake: 0,
        koBannerTimer: 0,
        aiThinkTimer: 0,
        aiAction: 'approach',
        tagCooldown1: 0,
        tagCooldown2: 0,
        maxCombo1: 0,
      };

      setMatchMode(selectedMode);
      setOpponentType(selectedOpponent);
      setScoreSaved(false);
      setShowLeaderboard(false);
      setPhase('FIGHTING');
    },
    [matchMode, opponentType, p1LeadIdx, p2LeadIdx]
  );

  // Keyboard listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) &&
        phase === 'FIGHTING'
      ) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [phase]);

  // Main 60 FPS Fighting Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const spawnSparks = (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i++) {
        engineRef.current.sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 11,
          vy: (Math.random() - 0.5) * 11 - 2,
          color,
          life: 0.35 + Math.random() * 0.2,
          size: 4 + Math.floor(Math.random() * 4),
        });
      }
    };

    const applyHit = (
      attacker: FighterState,
      defender: FighterState,
      attackerTeam: 1 | 2,
      rawDamage: number,
      knockback: number,
      label: string
    ) => {
      if (defender.hp <= 0 || defender.hitCooldown > 0) return;

      const isBlocked = defender.state === 'block' && attacker.facing !== defender.facing;
      const dmg = Math.max(2, Math.round((isBlocked ? rawDamage * 0.25 : rawDamage) * attacker.spec.power));

      defender.hp = Math.max(0, defender.hp - dmg);
      defender.hitCooldown = 0.28;
      defender.vx = attacker.facing * (isBlocked ? knockback * 0.45 : knockback);

      attacker.energy = Math.min(100, attacker.energy + (isBlocked ? 8 : 16));
      defender.energy = Math.min(100, defender.energy + 10);

      if (!isBlocked) {
        defender.state = defender.hp <= 0 ? 'ko' : 'hit';
        defender.stateTimer = defender.hp <= 0 ? 1.5 : 0.22;
        defender.comboCount += 1;
        if (attackerTeam === 1) {
          engineRef.current.maxCombo1 = Math.max(engineRef.current.maxCombo1, defender.comboCount);
        }
        engineRef.current.shake = 9;
        sound.playBossHit();
        spawnSparks(defender.x + 26, defender.y + 42, attacker.spec.energyColor, 14);
        engineRef.current.texts.push({
          x: defender.x + 26,
          y: defender.y - 10,
          text: `${label} -${dmg}`,
          color: '#fbbf24',
          life: 0.7,
        });
      } else {
        sound.playClick();
        spawnSparks(defender.x + 26, defender.y + 40, '#94a3b8', 6);
        engineRef.current.texts.push({
          x: defender.x + 26,
          y: defender.y - 10,
          text: `BLOCK -${dmg}`,
          color: '#94a3b8',
          life: 0.55,
        });
      }
    };

    const updateFighterPhysics = (f: FighterState, dt: number) => {
      if (f.hitCooldown > 0) f.hitCooldown = Math.max(0, f.hitCooldown - dt);
      if (f.trailHp > f.hp) {
        f.trailHp = Math.max(f.hp, f.trailHp - dt * 38);
      }

      if (f.stateTimer > 0) {
        f.stateTimer -= dt;
        if (f.stateTimer <= 0 && f.hp > 0) {
          f.state = 'idle';
          f.hasHitThisAttack = false;
        }
      }

      if (f.hp <= 0) {
        f.state = 'ko';
      }

      f.vy += GRAVITY;
      f.x += f.vx;
      f.y += f.vy;

      // Ground friction
      if (f.y + 96 >= FLOOR_Y) {
        f.y = FLOOR_Y - 96;
        f.vy = 0;
        if (f.state === 'jump') f.state = 'idle';
        f.vx *= 0.76;
      } else {
        f.vx *= 0.96;
      }

      if (f.x < 36) f.x = 36;
      if (f.x > ARENA_W - 88) f.x = ARENA_W - 88;
    };

    const drawPixelFighter = (f: FighterState, teamNum: 1 | 2) => {
      const px = Math.round(f.x);
      const py = Math.round(f.y);
      const s = f.spec;
      const isKO = f.state === 'ko';
      const bob = f.state === 'idle' ? Math.round(Math.sin(performance.now() / 160) * 2) : 0;

      ctx.save();
      ctx.translate(px + 26, py + 48);
      ctx.scale(f.facing, 1);

      if (isKO) {
        ctx.rotate(-Math.PI / 2);
        ctx.translate(-18, 12);
      }

      // Ground shadow
      if (!isKO) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(-22, 42 - (py - (FLOOR_Y - 96)) * 0.2, 44, 8);
      }

      // Team ring indicator
      ctx.fillStyle = teamNum === 1 ? 'rgba(56,189,248,0.28)' : 'rgba(239,68,68,0.28)';
      ctx.fillRect(-20, 44, 40, 4);

      const hitFlash = f.state === 'hit' && Math.floor(performance.now() / 50) % 2 === 0;

      // Legs (16-bit blocky pixel proportions)
      const stride = f.state === 'walk' ? Math.round(Math.sin(performance.now() / 80) * 7) : 0;
      ctx.fillStyle = hitFlash ? '#ffffff' : '#18181b';
      // Back leg
      ctx.fillRect(-14 - stride, 16, 12, 30);
      // Front leg (or kick)
      if (f.state === 'kick') {
        ctx.fillRect(4, 8, 34, 12);
        ctx.fillStyle = s.accentColor;
        ctx.fillRect(30, 8, 10, 12);
      } else {
        ctx.fillRect(2 + stride, 16, 12, 30);
      }

      // Torso / Gi
      ctx.fillStyle = hitFlash ? '#ffffff' : s.giColor;
      ctx.fillRect(-16, -18 + bob, 32, 36);

      // Belt / Accent trim
      ctx.fillStyle = s.accentColor;
      ctx.fillRect(-16, 6 + bob, 32, 6);
      ctx.fillRect(-4, -18 + bob, 8, 24);

      // Head
      ctx.fillStyle = hitFlash ? '#ffffff' : s.skinColor;
      ctx.fillRect(-12, -42 + bob, 24, 24);

      // Hair
      ctx.fillStyle = s.hairColor;
      ctx.fillRect(-14, -48 + bob, 28, 10);
      ctx.fillRect(-14, -42 + bob, 6, 10);

      // Headband / Visor
      ctx.fillStyle = s.accentColor;
      ctx.fillRect(-13, -38 + bob, 26, 5);
      // Flowing headband tails
      ctx.fillRect(-22, -37 + bob, 9, 4);

      // Pixel Eye
      ctx.fillStyle = '#09090b';
      ctx.fillRect(4, -32 + bob, 5, 5);

      // Arms (idle, block, punch, special)
      if (f.state === 'block') {
        ctx.fillStyle = s.accentColor;
        ctx.fillRect(10, -24 + bob, 10, 34);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.fillRect(18, -32 + bob, 6, 48);
      } else if (f.state === 'punch') {
        ctx.fillStyle = s.skinColor;
        ctx.fillRect(8, -14 + bob, 34, 10);
        ctx.fillStyle = s.accentColor;
        ctx.fillRect(34, -15 + bob, 10, 12);
      } else if (f.state === 'special') {
        ctx.fillStyle = s.skinColor;
        ctx.fillRect(6, -14 + bob, 28, 12);
        ctx.fillStyle = s.energyColor;
        ctx.fillRect(28, -20 + bob, 16, 22);
      } else {
        ctx.fillStyle = s.skinColor;
        ctx.fillRect(6, -12 + bob, 16, 10);
        ctx.fillRect(-18, -10 + bob, 10, 14);
      }

      ctx.restore();
    };

    const drawArena = () => {
      // Night retro sky
      const sky = ctx.createLinearGradient(0, 0, 0, ARENA_H);
      sky.addColorStop(0, '#070712');
      sky.addColorStop(0.65, '#120f24');
      sky.addColorStop(1, '#1c1129');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, ARENA_W, ARENA_H);

      // Pixel Moon
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(760, 110, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(735, 92, 16, 12);
      ctx.fillRect(768, 118, 12, 10);

      // Pixel stars
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 28; i++) {
        ctx.fillRect((i * 137) % ARENA_W, (i * 59) % 240, 2, 2);
      }

      // Distant city skyline
      const buildings = [
        { x: 20, w: 72, h: 170, c: '#0f172a' },
        { x: 105, w: 60, h: 210, c: '#111827' },
        { x: 180, w: 84, h: 150, c: '#0f172a' },
        { x: 670, w: 80, h: 185, c: '#111827' },
        { x: 765, w: 92, h: 220, c: '#0f172a' },
        { x: 870, w: 76, h: 160, c: '#111827' },
      ];
      buildings.forEach((b) => {
        ctx.fillStyle = b.c;
        ctx.fillRect(b.x, FLOOR_Y - b.h, b.w, b.h);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        for (let wy = FLOOR_Y - b.h + 16; wy < FLOOR_Y - 30; wy += 22) {
          ctx.fillRect(b.x + 12, wy, 8, 8);
          ctx.fillRect(b.x + b.w - 22, wy, 8, 8);
        }
      });

      // Dojo rooftop pagoda frame
      ctx.fillStyle = '#18181b';
      ctx.fillRect(250, FLOOR_Y - 190, 460, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(240, FLOOR_Y - 194, 480, 4);
      ctx.fillStyle = '#27272a';
      ctx.fillRect(275, FLOOR_Y - 176, 18, 176);
      ctx.fillRect(667, FLOOR_Y - 176, 18, 176);

      // Glowing pixel lanterns
      [284, 676].forEach((lx) => {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(lx - 10, FLOOR_Y - 150, 20, 28);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lx - 6, FLOOR_Y - 144, 12, 16);
      });

      // Wooden rooftop floor
      ctx.fillStyle = '#1f1612';
      ctx.fillRect(0, FLOOR_Y, ARENA_W, ARENA_H - FLOOR_Y);
      ctx.fillStyle = '#3f2e24';
      ctx.fillRect(0, FLOOR_Y, ARENA_W, 6);
      ctx.strokeStyle = '#120c09';
      ctx.lineWidth = 2;
      for (let fx = 0; fx < ARENA_W; fx += 48) {
        ctx.beginPath();
        ctx.moveTo(fx, FLOOR_Y + 6);
        ctx.lineTo(fx - 24, ARENA_H);
        ctx.stroke();
      }
    };

    const drawHud = () => {
      const e = engineRef.current;
      const f1 = e.team1[e.active1];
      const f2 = e.team2[e.active2];
      if (!f1 || !f2) return;

      // Top HUD bars
      const barW = 340;
      const barH = 22;

      // P1 HP
      ctx.fillStyle = '#09090b';
      ctx.fillRect(36, 24, barW + 4, barH + 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(38 + (barW * (100 - f1.trailHp)) / 100, 26, (barW * f1.trailHp) / 100, barH);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(38 + (barW * (100 - f1.hp)) / 100, 26, (barW * f1.hp) / 100, barH);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 24, barW + 4, barH + 4);

      // P2 HP
      const p2X = ARENA_W - 36 - barW - 4;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(p2X, 24, barW + 4, barH + 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p2X + 2, 26, (barW * f2.trailHp) / 100, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p2X + 2, 26, (barW * f2.hp) / 100, barH);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(p2X, 24, barW + 4, barH + 4);

      // Names & Energy bars
      ctx.font = 'bold 13px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(f1.spec.name, 38, 68);
      ctx.textAlign = 'right';
      ctx.fillText(f2.spec.name, ARENA_W - 38, 68);

      // Energy bars
      ctx.fillStyle = '#18181b';
      ctx.fillRect(38, 76, 170, 8);
      ctx.fillStyle = f1.energy >= 50 ? '#fbbf24' : '#38bdf8';
      ctx.fillRect(38, 76, (170 * f1.energy) / 100, 8);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(ARENA_W - 208, 76, 170, 8);
      ctx.fillStyle = f2.energy >= 50 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(ARENA_W - 208 + (170 * (100 - f2.energy)) / 100, 76, (170 * f2.energy) / 100, 8);

      // 2v2 Partner Indicators
      if (e.team1.length > 1) {
        const partner1 = e.team1[e.active1 === 0 ? 1 : 0];
        ctx.font = '11px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = partner1.hp > 0 ? '#94a3b8' : '#ef4444';
        ctx.fillText(`Хамтрагч [Q]: ${partner1.spec.name} (${partner1.hp} HP)`, 38, 102);
      }
      if (e.team2.length > 1) {
        const partner2 = e.team2[e.active2 === 0 ? 1 : 0];
        ctx.font = '11px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = partner2.hp > 0 ? '#94a3b8' : '#ef4444';
        ctx.fillText(`Хамтрагч: ${partner2.spec.name} (${partner2.hp} HP)`, ARENA_W - 38, 102);
      }

      // Center Round Timer
      ctx.fillStyle = '#09090b';
      ctx.fillRect(ARENA_W / 2 - 38, 18, 76, 48);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(ARENA_W / 2 - 38, 18, 76, 48);
      ctx.font = 'bold 22px "Press Start 2P", monospace';
      ctx.fillStyle = e.timer <= 15 ? '#ef4444' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(String(e.timer).padStart(2, '0'), ARENA_W / 2, 53);
    };

    const finishMatch = (team1Won: boolean, reason: string) => {
      const e = engineRef.current;
      const remainingHp = e.team1.reduce((sum, f) => sum + f.hp, 0);
      const computedScore = team1Won
        ? remainingHp * 5 + e.timer * 3 + e.maxCombo1 * 25 + (matchMode === '2v2' ? 200 : 100)
        : Math.max(0, e.maxCombo1 * 15);
      setWinnerText(reason);
      setFinalScore(computedScore);
      setPhase('MATCH_OVER');
      if (team1Won) {
        sound.playBossDefeated();
      } else {
        sound.playHit();
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const e = engineRef.current;

      if (phase === 'FIGHTING') {
        if (e.shake > 0) e.shake = Math.max(0, e.shake - dt * 35);
        if (e.tagCooldown1 > 0) e.tagCooldown1 = Math.max(0, e.tagCooldown1 - dt);
        if (e.tagCooldown2 > 0) e.tagCooldown2 = Math.max(0, e.tagCooldown2 - dt);

        // Timer countdown
        e.timerAcc += dt;
        if (e.timerAcc >= 1) {
          e.timerAcc -= 1;
          e.timer = Math.max(0, e.timer - 1);
          if (e.timer === 0) {
            const hp1 = e.team1.reduce((acc, f) => acc + f.hp, 0);
            const hp2 = e.team2.reduce((acc, f) => acc + f.hp, 0);
            finishMatch(hp1 >= hp2, hp1 >= hp2 ? 'ХУГАЦАА ДУУСЛАА — БАГ 1 ЯЛЛАА!' : 'ХУГАЦАА ДУУСЛАА — ӨРСӨЛДӨГЧ ЯЛЛАА!');
          }
        }

        const f1 = e.team1[e.active1];
        const f2 = e.team2[e.active2];

        if (f1 && f2 && f1.hp > 0 && f2.hp > 0) {
          // Face each other when idle/walking
          if (['idle', 'walk', 'block'].includes(f1.state)) {
            f1.facing = f1.x <= f2.x ? 1 : -1;
          }
          if (['idle', 'walk', 'block'].includes(f2.state)) {
            f2.facing = f2.x >= f1.x ? -1 : 1;
          }

          // P1 Controls (WASD + J/K/L + Q tag)
          const k = keysRef.current;
          const t = touchRef.current;
          const p1Left = k['KeyA'] || (opponentType === 'ai' && k['ArrowLeft']) || t.left;
          const p1Right = k['KeyD'] || (opponentType === 'ai' && k['ArrowRight']) || t.right;
          const p1Jump = k['KeyW'] || (opponentType === 'ai' && k['ArrowUp']) || t.up;
          const p1Block = k['KeyS'] || (opponentType === 'ai' && k['ArrowDown']) || t.block;
          const p1Punch = k['KeyJ'] || k['KeyZ'] || t.punch;
          const p1Kick = k['KeyK'] || k['KeyX'] || t.kick;
          const p1Special = k['KeyL'] || k['KeyC'] || t.special;
          const p1Tag = k['KeyQ'] || t.tag;

          // Tag switch in 2v2
          if (p1Tag && e.team1.length > 1 && e.tagCooldown1 <= 0 && f1.y + 96 >= FLOOR_Y) {
            const nextIdx = e.active1 === 0 ? 1 : 0;
            if (e.team1[nextIdx].hp > 0) {
              e.team1[nextIdx].x = f1.x;
              e.team1[nextIdx].y = f1.y;
              e.active1 = nextIdx;
              e.tagCooldown1 = 1.6;
              sound.playJump();
              e.texts.push({ x: f1.x + 26, y: f1.y - 20, text: 'TAG!', color: '#38bdf8', life: 0.7 });
            }
          }

          const canAct1 = ['idle', 'walk', 'jump', 'block'].includes(f1.state);
          if (canAct1) {
            if (p1Special && f1.energy >= 50) {
              f1.energy -= 50;
              f1.state = 'special';
              f1.stateTimer = 0.34;
              sound.playBossRoar();
              e.projectiles.push({
                x: f1.x + (f1.facing === 1 ? 56 : -8),
                y: f1.y + 38,
                vx: f1.facing * 9.5,
                ownerTeam: 1,
                color: f1.spec.energyColor,
                damage: 20,
                radius: 14,
              });
            } else if (p1Punch) {
              f1.state = 'punch';
              f1.stateTimer = 0.22;
              f1.hasHitThisAttack = false;
              sound.playJump();
            } else if (p1Kick) {
              f1.state = 'kick';
              f1.stateTimer = 0.28;
              f1.hasHitThisAttack = false;
              sound.playJump();
            } else if (p1Block) {
              f1.state = 'block';
              f1.vx = 0;
            } else {
              if (p1Left) {
                f1.vx = -f1.spec.speed;
                if (f1.y + 96 >= FLOOR_Y) f1.state = 'walk';
              } else if (p1Right) {
                f1.vx = f1.spec.speed;
                if (f1.y + 96 >= FLOOR_Y) f1.state = 'walk';
              } else if (f1.state === 'block' || f1.state === 'walk') {
                f1.state = 'idle';
              }
              if (p1Jump && f1.y + 96 >= FLOOR_Y) {
                f1.vy = -15.5;
                f1.state = 'jump';
                sound.playJump();
              }
            }
          }

          // P2 Controls (AI or Local 2P)
          const canAct2 = ['idle', 'walk', 'jump', 'block'].includes(f2.state);
          if (opponentType === 'pvp') {
            const p2Left = k['ArrowLeft'];
            const p2Right = k['ArrowRight'];
            const p2Jump = k['ArrowUp'];
            const p2Block = k['ArrowDown'];
            const p2Punch = k['Digit1'] || k['Numpad1'] || k['KeyN'];
            const p2Kick = k['Digit2'] || k['Numpad2'] || k['KeyM'];
            const p2Special = k['Digit3'] || k['Numpad3'] || k['Comma'];
            const p2Tag = k['ShiftRight'] || k['Slash'];

            if (p2Tag && e.team2.length > 1 && e.tagCooldown2 <= 0 && f2.y + 96 >= FLOOR_Y) {
              const nextIdx = e.active2 === 0 ? 1 : 0;
              if (e.team2[nextIdx].hp > 0) {
                e.team2[nextIdx].x = f2.x;
                e.team2[nextIdx].y = f2.y;
                e.active2 = nextIdx;
                e.tagCooldown2 = 1.6;
                sound.playJump();
              }
            }

            if (canAct2) {
              if (p2Special && f2.energy >= 50) {
                f2.energy -= 50;
                f2.state = 'special';
                f2.stateTimer = 0.34;
                sound.playBossRoar();
                e.projectiles.push({
                  x: f2.x + (f2.facing === 1 ? 56 : -8),
                  y: f2.y + 38,
                  vx: f2.facing * 9.5,
                  ownerTeam: 2,
                  color: f2.spec.energyColor,
                  damage: 20,
                  radius: 14,
                });
              } else if (p2Punch) {
                f2.state = 'punch';
                f2.stateTimer = 0.22;
                f2.hasHitThisAttack = false;
                sound.playJump();
              } else if (p2Kick) {
                f2.state = 'kick';
                f2.stateTimer = 0.28;
                f2.hasHitThisAttack = false;
                sound.playJump();
              } else if (p2Block) {
                f2.state = 'block';
                f2.vx = 0;
              } else {
                if (p2Left) {
                  f2.vx = -f2.spec.speed;
                  if (f2.y + 96 >= FLOOR_Y) f2.state = 'walk';
                } else if (p2Right) {
                  f2.vx = f2.spec.speed;
                  if (f2.y + 96 >= FLOOR_Y) f2.state = 'walk';
                } else if (f2.state === 'block' || f2.state === 'walk') {
                  f2.state = 'idle';
                }
                if (p2Jump && f2.y + 96 >= FLOOR_Y) {
                  f2.vy = -15.5;
                  f2.state = 'jump';
                  sound.playJump();
                }
              }
            }
          } else {
            // Smart responsive AI
            e.aiThinkTimer -= dt;
            const dist = Math.abs(f1.x - f2.x);
            if (e.aiThinkTimer <= 0) {
              e.aiThinkTimer = 0.22 + Math.random() * 0.2;
              if (dist > 95) {
                e.aiAction = Math.random() > 0.15 ? 'approach' : 'idle';
              } else if (['punch', 'kick', 'special'].includes(f1.state) && Math.random() > 0.45) {
                e.aiAction = 'block';
              } else if (Math.random() > 0.72) {
                e.aiAction = 'retreat';
              } else {
                e.aiAction = 'idle';
              }
            }

            if (canAct2) {
              if (f2.energy >= 50 && dist > 160 && Math.random() < 0.03) {
                f2.energy -= 50;
                f2.state = 'special';
                f2.stateTimer = 0.34;
                sound.playBossRoar();
                e.projectiles.push({
                  x: f2.x + (f2.facing === 1 ? 56 : -8),
                  y: f2.y + 38,
                  vx: f2.facing * 9.5,
                  ownerTeam: 2,
                  color: f2.spec.energyColor,
                  damage: 20,
                  radius: 14,
                });
              } else if (dist < 82 && Math.random() < 0.065) {
                f2.state = Math.random() > 0.45 ? 'kick' : 'punch';
                f2.stateTimer = f2.state === 'kick' ? 0.28 : 0.22;
                f2.hasHitThisAttack = false;
              } else if (e.aiAction === 'block') {
                f2.state = 'block';
                f2.vx = 0;
              } else if (e.aiAction === 'approach') {
                f2.vx = f2.facing * (f2.spec.speed * 0.85);
                if (f2.y + 96 >= FLOOR_Y) f2.state = 'walk';
              } else if (e.aiAction === 'retreat') {
                f2.vx = -f2.facing * (f2.spec.speed * 0.7);
                if (f2.y + 96 >= FLOOR_Y) f2.state = 'walk';
              } else if (f2.state === 'block' || f2.state === 'walk') {
                f2.state = 'idle';
              }
            }
          }

          // Melee hit detection
          const distX = Math.abs(f1.x - f2.x);
          const distY = Math.abs(f1.y - f2.y);
          if ((f1.state === 'punch' || f1.state === 'kick') && !f1.hasHitThisAttack && distX < 84 && distY < 75) {
            if ((f1.facing === 1 && f2.x >= f1.x - 12) || (f1.facing === -1 && f2.x <= f1.x + 12)) {
              f1.hasHitThisAttack = true;
              applyHit(f1, f2, 1, f1.state === 'kick' ? 14 : 9, f1.state === 'kick' ? 8 : 5, f1.state === 'kick' ? 'KICK' : 'HIT');
            }
          }
          if ((f2.state === 'punch' || f2.state === 'kick') && !f2.hasHitThisAttack && distX < 84 && distY < 75) {
            if ((f2.facing === 1 && f1.x >= f2.x - 12) || (f2.facing === -1 && f1.x <= f2.x + 12)) {
              f2.hasHitThisAttack = true;
              applyHit(f2, f1, 2, f2.state === 'kick' ? 14 : 9, f2.state === 'kick' ? 8 : 5, f2.state === 'kick' ? 'KICK' : 'HIT');
            }
          }
        }

        // Update physics & check KO / auto-tag in 2v2
        if (f1) updateFighterPhysics(f1, dt);
        if (f2) updateFighterPhysics(f2, dt);

        if (f1 && f1.hp <= 0) {
          const aliveIdx = e.team1.findIndex((f) => f.hp > 0);
          if (aliveIdx !== -1 && e.koBannerTimer <= 0) {
            e.active1 = aliveIdx;
            e.team1[aliveIdx].x = 160;
            e.texts.push({ x: 200, y: 200, text: `${e.team1[aliveIdx].spec.name} IN!`, color: '#38bdf8', life: 1.0 });
          } else if (aliveIdx === -1) {
            finishMatch(false, 'ӨРСӨЛДӨГЧ ЯЛАЛТ БАЙГУУЛЛАА!');
          }
        }

        if (f2 && f2.hp <= 0) {
          const aliveIdx = e.team2.findIndex((f) => f.hp > 0);
          if (aliveIdx !== -1 && e.koBannerTimer <= 0) {
            e.active2 = aliveIdx;
            e.team2[aliveIdx].x = ARENA_W - 220;
            e.texts.push({ x: ARENA_W - 220, y: 200, text: `${e.team2[aliveIdx].spec.name} IN!`, color: '#ef4444', life: 1.0 });
          } else if (aliveIdx === -1) {
            finishMatch(true, 'K.O.! ТА ЯЛАЛТ БАЙГУУЛЛАА!');
          }
        }

        // Projectiles update
        for (let i = e.projectiles.length - 1; i >= 0; i--) {
          const p = e.projectiles[i];
          p.x += p.vx;
          const target = p.ownerTeam === 1 ? e.team2[e.active2] : e.team1[e.active1];
          const attacker = p.ownerTeam === 1 ? e.team1[e.active1] : e.team2[e.active2];
          if (
            target &&
            attacker &&
            target.hp > 0 &&
            p.x > target.x &&
            p.x < target.x + 52 &&
            p.y > target.y - 36 &&
            p.y < target.y + 48
          ) {
            applyHit(attacker, target, p.ownerTeam, p.damage, 10, 'SUPER');
            e.projectiles.splice(i, 1);
            continue;
          }
          if (p.x < -30 || p.x > ARENA_W + 30) {
            e.projectiles.splice(i, 1);
          }
        }

        // Sparks & floating texts
        for (let i = e.sparks.length - 1; i >= 0; i--) {
          const sp = e.sparks[i];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.life -= dt;
          if (sp.life <= 0) e.sparks.splice(i, 1);
        }
        for (let i = e.texts.length - 1; i >= 0; i--) {
          const tx = e.texts[i];
          tx.y -= dt * 28;
          tx.life -= dt;
          if (tx.life <= 0) e.texts.splice(i, 1);
        }
      }

      // Draw frame
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (e.shake > 0) {
        ctx.translate((Math.random() - 0.5) * e.shake, (Math.random() - 0.5) * e.shake);
      }

      drawArena();

      const f1 = e.team1[e.active1];
      const f2 = e.team2[e.active2];
      if (f1) drawPixelFighter(f1, 1);
      if (f2) drawPixelFighter(f2, 2);

      // Energy balls
      e.projectiles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - p.radius * 0.5, p.y - p.radius * 0.5, p.radius, p.radius);
      });

      // Sparks
      e.sparks.forEach((sp) => {
        ctx.fillStyle = sp.color;
        ctx.fillRect(sp.x, sp.y, sp.size, sp.size);
      });

      // Floating texts
      e.texts.forEach((tx) => {
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.fillStyle = tx.color;
        ctx.textAlign = 'center';
        ctx.fillText(tx.text, tx.x, tx.y);
      });

      drawHud();
      ctx.restore();

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [phase, matchMode, opponentType]);

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (scoreSaved || finalScore <= 0) return;
    sound.playCollect();
    addLeaderboardEntry({
      playerName: playerName.trim() || 'Тоглогч',
      game: 'vibe-fighter',
      score: finalScore,
      detail: `${matchMode.toUpperCase()} · ${ROSTER[p1LeadIdx].name}`,
    });
    setScoreSaved(true);
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
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-white/10 bg-black/85 shrink-0">
        <div className="flex items-center gap-2 text-xs text-neutral-300">
          <Swords className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="font-semibold text-white">Vibe Fighter</span>
          <span className="text-neutral-600 hidden sm:inline">·</span>
          <span className="text-neutral-400 hidden sm:inline">16-bit Pixel Art 2D</span>
        </div>

        <div className="flex items-center gap-2">
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost h-8 px-3 text-xs font-medium flex items-center gap-1.5 border-white/15"
              title="Анхны холбоосыг шинэ таб дээр нээх"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Гаднах хувилбар</span>
            </a>
          )}

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

      {/* 16:9 (~640px height on desktop) Viewport */}
      <div
        className={`relative w-full bg-black ${
          isFullscreen ? 'flex-1 h-full' : 'aspect-video min-h-[320px] max-h-[640px]'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={ARENA_W}
          height={ARENA_H}
          className="w-full h-full object-contain block bg-black select-none"
        />

        {/* MENU OVERLAY */}
        {phase === 'MENU' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm p-4 sm:p-8 flex flex-col items-center justify-center overflow-y-auto">
            {showLeaderboard ? (
              <div className="w-full max-w-xl space-y-3">
                <button
                  type="button"
                  onClick={() => setShowLeaderboard(false)}
                  className="btn btn-ghost h-9 px-4 text-xs font-semibold"
                >
                  ← Буцах
                </button>
                <LeaderboardCard compact defaultGameFilter="vibe-fighter" />
              </div>
            ) : (
              <div className="w-full max-w-2xl space-y-5 text-center">
                <div>
                  <h3 className="text-xl sm:text-3xl font-bold text-white tracking-tight mb-1">
                    VIBE FIGHTER
                  </h3>
                  <p className="text-xs text-neutral-400">
                    16-bit Pixel Art тулааны тоглоом — горим болон тулаанчаа сонгоно уу
                  </p>
                </div>

                {/* Mode & Opponent Selector */}
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
                          onClick={() => {
                            sound.playClick();
                            setMatchMode(m);
                          }}
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
                          onClick={() => {
                            sound.playClick();
                            setOpponentType(op.id);
                          }}
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

                {/* Fighter Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ROSTER.map((fighter, idx) => {
                    const isP1 = p1LeadIdx === idx;
                    const isP2 = p2LeadIdx === idx;
                    return (
                      <button
                        key={fighter.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setP1LeadIdx(idx);
                          if (p2LeadIdx === idx) {
                            setP2LeadIdx((idx + 1) % ROSTER.length);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isP1
                            ? 'bg-white/15 border-sky-400'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{fighter.name}</span>
                          {isP1 && <span className="text-[10px] font-mono text-sky-400">P1</span>}
                          {isP2 && <span className="text-[10px] font-mono text-rose-400">CPU</span>}
                        </div>
                        <div className="text-[11px] text-neutral-400">{fighter.title}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => startMatch(matchMode, opponentType)}
                    className="btn btn-solid h-11 px-7 text-sm font-semibold"
                  >
                    Тулаан эхлүүлэх ({matchMode.toUpperCase()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLeaderboard(true)}
                    className="btn btn-ghost h-11 px-5 text-xs font-semibold gap-2"
                  >
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>Лидерборд</span>
                  </button>
                </div>

                <p className="text-[11px] text-neutral-500">
                  Удирдлага (P1): [A / D] алхах · [W] үсрэх · [S] хамгаалах · [J] цохилт · [K] өшиглөлт · [L] супер (50%+) · [Q] 2v2 солих
                </p>
              </div>
            )}
          </div>
        )}

        {/* MATCH OVER OVERLAY */}
        {phase === 'MATCH_OVER' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-md vesper-card p-6 text-center space-y-4">
              <Trophy className="w-10 h-10 text-amber-300 mx-auto" />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{winnerText}</h3>
                <p className="text-sm text-neutral-300 font-mono">
                  Оноо: <span className="text-white font-bold">{finalScore}</span>
                </p>
              </div>

              {finalScore > 0 && (
                <div>
                  {!scoreSaved ? (
                    <form onSubmit={handleSaveScore} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        maxLength={24}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Таны нэр (Лидерборд)"
                        className="flex-1 h-9 px-3 rounded-lg bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-white/40"
                      />
                      <button type="submit" className="btn btn-ghost h-9 px-3 text-xs font-semibold">
                        Хадгалах
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <Check className="w-4 h-4" />
                      <span>Лидерборд-д хадгалагдлаа!</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => startMatch(matchMode, opponentType)}
                  className="flex-1 btn btn-solid h-10 text-xs font-semibold gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Дахин тоглох</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('MENU')}
                  className="flex-1 btn btn-ghost h-10 text-xs font-semibold"
                >
                  Горим солих
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile / Touch Arcade Controls during FIGHTING */}
      {phase === 'FIGHTING' && (
        <div className="p-3 bg-black/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 md:hidden select-none">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onPointerDown={() => (touchRef.current.left = true)}
              onPointerUp={() => (touchRef.current.left = false)}
              onPointerLeave={() => (touchRef.current.left = false)}
              className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-bold active:bg-white/25"
            >
              ←
            </button>
            <button
              type="button"
              onPointerDown={() => (touchRef.current.up = true)}
              onPointerUp={() => (touchRef.current.up = false)}
              onPointerLeave={() => (touchRef.current.up = false)}
              className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-bold active:bg-white/25"
            >
              ↑
            </button>
            <button
              type="button"
              onPointerDown={() => (touchRef.current.right = true)}
              onPointerUp={() => (touchRef.current.right = false)}
              onPointerLeave={() => (touchRef.current.right = false)}
              className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-bold active:bg-white/25"
            >
              →
            </button>
            <button
              type="button"
              onPointerDown={() => (touchRef.current.block = true)}
              onPointerUp={() => (touchRef.current.block = false)}
              onPointerLeave={() => (touchRef.current.block = false)}
              className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 text-white flex items-center justify-center active:bg-white/25"
              aria-label="Хамгаалах"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onPointerDown={() => (touchRef.current.punch = true)}
              onPointerUp={() => (touchRef.current.punch = false)}
              onPointerLeave={() => (touchRef.current.punch = false)}
              className="px-3 h-11 rounded-lg bg-sky-500/20 border border-sky-400/50 text-white text-xs font-bold active:bg-sky-500/40"
            >
              J
            </button>
            <button
              type="button"
              onPointerDown={() => (touchRef.current.kick = true)}
              onPointerUp={() => (touchRef.current.kick = false)}
              onPointerLeave={() => (touchRef.current.kick = false)}
              className="px-3 h-11 rounded-lg bg-rose-500/20 border border-rose-400/50 text-white text-xs font-bold active:bg-rose-500/40"
            >
              K
            </button>
            <button
              type="button"
              onPointerDown={() => (touchRef.current.special = true)}
              onPointerUp={() => (touchRef.current.special = false)}
              onPointerLeave={() => (touchRef.current.special = false)}
              className="px-3 h-11 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-200 flex items-center justify-center active:bg-amber-500/40"
              aria-label="Супер довтолгоо"
            >
              <Zap className="w-4 h-4" />
            </button>
            {matchMode === '2v2' && (
              <button
                type="button"
                onPointerDown={() => (touchRef.current.tag = true)}
                onPointerUp={() => (touchRef.current.tag = false)}
                onPointerLeave={() => (touchRef.current.tag = false)}
                className="px-3 h-11 rounded-lg bg-white/15 border border-white/30 text-white text-xs font-bold"
              >
                TAG
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
