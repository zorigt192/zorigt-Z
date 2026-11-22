import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Home,
  Maximize2,
  Minimize2,
  RotateCcw,
  Shield,
  Swords,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/audio';
import {
  ARENA_H,
  ARENA_W,
  FIGHTER_ROSTER,
  FLOOR_Y,
  FighterState,
  createFighter,
  drawPixelFighter,
} from '../games/vibeFighter/fighters';
import { ARENA_MAPS, ArenaMapId, drawArenaMap } from '../games/vibeFighter/maps';
import { vibeMusic } from '../games/vibeFighter/music';
import {
  ControlOpponent,
  MainMenuScreen,
  MatchMode,
} from '../games/vibeFighter/MainMenuScreen';
import { CharacterSelectScreen } from '../games/vibeFighter/CharacterSelectScreen';
import { MapSelectScreen } from '../games/vibeFighter/MapSelectScreen';

interface VibeFighterGameProps {
  externalUrl?: string;
}

type ScreenPhase =
  | 'MAIN_MENU'
  | 'CHARACTER_SELECT'
  | 'MAP_SELECT'
  | 'FIGHTING'
  | 'MATCH_OVER';

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

const GRAVITY = 0.72;

export const VibeFighterGame: React.FC<VibeFighterGameProps> = ({ externalUrl }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [phase, setPhase] = useState<ScreenPhase>('MAIN_MENU');
  const [matchMode, setMatchMode] = useState<MatchMode>('1v1');
  const [opponentType, setOpponentType] = useState<ControlOpponent>('ai');

  // 8-fighter roster selections (both 1v1 leads and 2v2 partners)
  const [p1LeadIdx, setP1LeadIdx] = useState<number>(0);
  const [p1PartnerIdx, setP1PartnerIdx] = useState<number>(3);
  const [p2LeadIdx, setP2LeadIdx] = useState<number>(1);
  const [p2PartnerIdx, setP2PartnerIdx] = useState<number>(4);

  // 4-stage map selection
  const [selectedMapId, setSelectedMapId] = useState<ArenaMapId>('cyber-dojo');

  const [isMuted, setIsMuted] = useState<boolean>(() => vibeMusic.isMuted());
  const [matchResult, setMatchResult] = useState<{
    headline: string;
    winner: string;
    team1Won: boolean;
    fighterName: string;
    maxCombo: number;
  }>({
    headline: 'K.O.',
    winner: 'P1 WIN!',
    team1Won: true,
    fighterName: FIGHTER_ROSTER[0].name,
    maxCombo: 0,
  });

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
    team1: [createFighter(FIGHTER_ROSTER[0], 220, 1)],
    team2: [createFighter(FIGHTER_ROSTER[1], ARENA_W - 220 - 52, -1)],
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

  // Switch BGM track smoothly per screen:
  // Main Menu -> 'menu', Character/Map Select -> 'select', Fighting -> 'battle'
  useEffect(() => {
    if (phase === 'MAIN_MENU') {
      vibeMusic.playTrack('menu');
    } else if (phase === 'CHARACTER_SELECT' || phase === 'MAP_SELECT') {
      vibeMusic.playTrack('select');
    } else if (phase === 'FIGHTING') {
      vibeMusic.playTrack('battle');
    } else if (phase === 'MATCH_OVER') {
      vibeMusic.stop();
    }
  }, [phase]);

  // Stop music when closing modal / unmounting
  useEffect(() => {
    return () => {
      vibeMusic.stop();
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const unlockAudio = () => {
    vibeMusic.unlock();
  };

  const toggleMute = () => {
    unlockAudio();
    const nextMuted = !isMuted;
    vibeMusic.setMuted(nextMuted);
    sound.enabled = !nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      if (phase === 'MAIN_MENU') vibeMusic.playTrack('menu');
      else if (phase === 'CHARACTER_SELECT' || phase === 'MAP_SELECT') vibeMusic.playTrack('select');
      else if (phase === 'FIGHTING') vibeMusic.playTrack('battle');
    }
  };

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
      // Ignore fullscreen denial
    }
  };

  const handleSelectFighter = (
    slot: 'p1Lead' | 'p1Partner' | 'p2Lead' | 'p2Partner',
    rosterIdx: number
  ) => {
    if (slot === 'p1Lead') setP1LeadIdx(rosterIdx);
    else if (slot === 'p1Partner') setP1PartnerIdx(rosterIdx);
    else if (slot === 'p2Lead') setP2LeadIdx(rosterIdx);
    else setP2PartnerIdx(rosterIdx);
  };

  const startMatch = useCallback(
    (selectedMode: MatchMode = matchMode, selectedOpponent: ControlOpponent = opponentType) => {
      unlockAudio();
      sound.playLevelUp();

      const p1First = FIGHTER_ROSTER[p1LeadIdx];
      const p1Second = FIGHTER_ROSTER[p1PartnerIdx === p1LeadIdx ? (p1LeadIdx + 1) % FIGHTER_ROSTER.length : p1PartnerIdx];
      const p2First = FIGHTER_ROSTER[p2LeadIdx];
      const p2Second = FIGHTER_ROSTER[p2PartnerIdx === p2LeadIdx ? (p2LeadIdx + 1) % FIGHTER_ROSTER.length : p2PartnerIdx];

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
      setPhase('FIGHTING');
    },
    [matchMode, opponentType, p1LeadIdx, p1PartnerIdx, p2LeadIdx, p2PartnerIdx]
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
      const baseDmg = (isBlocked ? rawDamage * 0.25 : rawDamage) * attacker.spec.power;
      const dmg = Math.max(2, Math.round(baseDmg / defender.spec.defense));

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

    const drawHud = () => {
      const e = engineRef.current;
      const f1 = e.team1[e.active1];
      const f2 = e.team2[e.active2];
      if (!f1 || !f2) return;

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

      // Names & Energy
      ctx.font = 'bold 13px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(f1.spec.name, 38, 68);
      ctx.textAlign = 'right';
      ctx.fillText(f2.spec.name, ARENA_W - 38, 68);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(38, 76, 170, 8);
      ctx.fillStyle = f1.energy >= 50 ? '#fbbf24' : '#38bdf8';
      ctx.fillRect(38, 76, (170 * f1.energy) / 100, 8);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(ARENA_W - 208, 76, 170, 8);
      ctx.fillStyle = f2.energy >= 50 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(
        ARENA_W - 208 + (170 * (100 - f2.energy)) / 100,
        76,
        (170 * f2.energy) / 100,
        8
      );

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

    const finishMatch = (team1Won: boolean, headline: string, winner: string) => {
      const e = engineRef.current;
      const winTeam = team1Won ? e.team1[e.active1] : e.team2[e.active2];
      setMatchResult({
        headline,
        winner,
        team1Won,
        fighterName: winTeam ? winTeam.spec.name : '',
        maxCombo: e.maxCombo1,
      });
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

        e.timerAcc += dt;
        if (e.timerAcc >= 1) {
          e.timerAcc -= 1;
          e.timer = Math.max(0, e.timer - 1);
          if (e.timer === 0) {
            const hp1 = e.team1.reduce((acc, f) => acc + f.hp, 0);
            const hp2 = e.team2.reduce((acc, f) => acc + f.hp, 0);
            finishMatch(
              hp1 >= hp2,
              'TIME OVER',
              hp1 >= hp2 ? 'P1 WIN!' : opponentType === 'ai' ? 'CPU WIN!' : 'P2 WIN!'
            );
          }
        }

        const f1 = e.team1[e.active1];
        const f2 = e.team2[e.active2];

        if (f1 && f2 && f1.hp > 0 && f2.hp > 0) {
          if (['idle', 'walk', 'block'].includes(f1.state)) {
            f1.facing = f1.x <= f2.x ? 1 : -1;
          }
          if (['idle', 'walk', 'block'].includes(f2.state)) {
            f2.facing = f2.x >= f1.x ? -1 : 1;
          }

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

          if (p1Tag && e.team1.length > 1 && e.tagCooldown1 <= 0 && f1.y + 96 >= FLOOR_Y) {
            const nextIdx = e.active1 === 0 ? 1 : 0;
            if (e.team1[nextIdx].hp > 0) {
              e.team1[nextIdx].x = f1.x;
              e.team1[nextIdx].y = f1.y;
              e.active1 = nextIdx;
              e.tagCooldown1 = 1.6;
              sound.playJump();
              e.texts.push({
                x: f1.x + 26,
                y: f1.y - 20,
                text: 'TAG!',
                color: '#38bdf8',
                life: 0.7,
              });
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

          const distX = Math.abs(f1.x - f2.x);
          const distY = Math.abs(f1.y - f2.y);
          if (
            (f1.state === 'punch' || f1.state === 'kick') &&
            !f1.hasHitThisAttack &&
            distX < 84 &&
            distY < 75
          ) {
            if ((f1.facing === 1 && f2.x >= f1.x - 12) || (f1.facing === -1 && f2.x <= f1.x + 12)) {
              f1.hasHitThisAttack = true;
              applyHit(
                f1,
                f2,
                1,
                f1.state === 'kick' ? 14 : 9,
                f1.state === 'kick' ? 8 : 5,
                f1.state === 'kick' ? 'KICK' : 'HIT'
              );
            }
          }
          if (
            (f2.state === 'punch' || f2.state === 'kick') &&
            !f2.hasHitThisAttack &&
            distX < 84 &&
            distY < 75
          ) {
            if ((f2.facing === 1 && f1.x >= f2.x - 12) || (f2.facing === -1 && f1.x <= f2.x + 12)) {
              f2.hasHitThisAttack = true;
              applyHit(
                f2,
                f1,
                2,
                f2.state === 'kick' ? 14 : 9,
                f2.state === 'kick' ? 8 : 5,
                f2.state === 'kick' ? 'KICK' : 'HIT'
              );
            }
          }
        }

        if (f1) updateFighterPhysics(f1, dt);
        if (f2) updateFighterPhysics(f2, dt);

        if (f1 && f1.hp <= 0) {
          const aliveIdx = e.team1.findIndex((f) => f.hp > 0);
          if (aliveIdx !== -1 && e.koBannerTimer <= 0) {
            e.active1 = aliveIdx;
            e.team1[aliveIdx].x = 160;
            e.texts.push({
              x: 200,
              y: 200,
              text: `${e.team1[aliveIdx].spec.name} IN!`,
              color: '#38bdf8',
              life: 1.0,
            });
          } else if (aliveIdx === -1) {
            finishMatch(false, 'K.O.', opponentType === 'ai' ? 'CPU WIN!' : 'P2 WIN!');
          }
        }

        if (f2 && f2.hp <= 0) {
          const aliveIdx = e.team2.findIndex((f) => f.hp > 0);
          if (aliveIdx !== -1 && e.koBannerTimer <= 0) {
            e.active2 = aliveIdx;
            e.team2[aliveIdx].x = ARENA_W - 220;
            e.texts.push({
              x: ARENA_W - 220,
              y: 200,
              text: `${e.team2[aliveIdx].spec.name} IN!`,
              color: '#ef4444',
              life: 1.0,
            });
          } else if (aliveIdx === -1) {
            finishMatch(true, 'K.O.', 'P1 WIN!');
          }
        }

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

      // Render Arena + Fighters
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (e.shake > 0) {
        ctx.translate((Math.random() - 0.5) * e.shake, (Math.random() - 0.5) * e.shake);
      }

      drawArenaMap(ctx, selectedMapId, now);

      const f1 = e.team1[e.active1];
      const f2 = e.team2[e.active2];
      if (f1) drawPixelFighter(ctx, f1, 1, now);
      if (f2) drawPixelFighter(ctx, f2, 2, now);

      e.projectiles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - p.radius * 0.5, p.y - p.radius * 0.5, p.radius, p.radius);
      });

      e.sparks.forEach((sp) => {
        ctx.fillStyle = sp.color;
        ctx.fillRect(sp.x, sp.y, sp.size, sp.size);
      });

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
  }, [phase, matchMode, opponentType, selectedMapId]);

  const activeStage = ARENA_MAPS.find((m) => m.id === selectedMapId);

  return (
    <div
      ref={containerRef}
      onPointerDown={unlockAudio}
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
          <span className="text-neutral-400 hidden sm:inline">
            {phase === 'FIGHTING' && activeStage ? activeStage.name : '16-bit Pixel Art 2D'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {phase === 'FIGHTING' && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setPhase('MAIN_MENU');
              }}
              className="btn btn-ghost h-8 px-3 text-xs font-medium flex items-center gap-1.5 border-white/15"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Гол цэс</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleMute}
            className="btn btn-ghost h-8 px-3 text-xs font-medium flex items-center gap-1.5 border-white/15"
            title={isMuted ? 'Хөгжим асаах' : 'Хөгжим унтраах'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span className="hidden sm:inline">{isMuted ? 'Дуугүй' : 'Ая'}</span>
          </button>

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
          isFullscreen ? 'flex-1 h-full' : 'aspect-video min-h-[380px] max-h-[640px]'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={ARENA_W}
          height={ARENA_H}
          className="w-full h-full object-contain block bg-black select-none"
        />

        {/* 1. DEDICATED MAIN MENU SCREEN */}
        {phase === 'MAIN_MENU' && (
          <MainMenuScreen
            matchMode={matchMode}
            opponentType={opponentType}
            isMuted={isMuted}
            onChangeMode={(m) => {
              unlockAudio();
              sound.playClick();
              setMatchMode(m);
            }}
            onChangeOpponent={(op) => {
              unlockAudio();
              sound.playClick();
              setOpponentType(op);
            }}
            onGoToCharacterSelect={() => {
              unlockAudio();
              sound.playClick();
              setPhase('CHARACTER_SELECT');
            }}
            onToggleMute={toggleMute}
          />
        )}

        {/* 2. DEDICATED CHARACTER SELECT SCREEN */}
        {phase === 'CHARACTER_SELECT' && (
          <CharacterSelectScreen
            matchMode={matchMode}
            opponentType={opponentType}
            p1LeadIdx={p1LeadIdx}
            p1PartnerIdx={p1PartnerIdx}
            p2LeadIdx={p2LeadIdx}
            p2PartnerIdx={p2PartnerIdx}
            onSelectFighter={handleSelectFighter}
            onBackToMenu={() => {
              sound.playClick();
              setPhase('MAIN_MENU');
            }}
            onGoToMapSelect={() => {
              sound.playClick();
              setPhase('MAP_SELECT');
            }}
          />
        )}

        {/* 3. DEDICATED MAP SELECT SCREEN */}
        {phase === 'MAP_SELECT' && (
          <MapSelectScreen
            selectedMapId={selectedMapId}
            onSelectMap={(id) => setSelectedMapId(id)}
            onBackToCharacters={() => {
              sound.playClick();
              setPhase('CHARACTER_SELECT');
            }}
            onStartFight={() => startMatch(matchMode, opponentType)}
          />
        )}

        {/* 4. MATCH OVER OVERLAY — KO · P1 WIN! */}
        {phase === 'MATCH_OVER' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-md vesper-card p-6 sm:p-8 text-center space-y-5">
              <div className="space-y-1.5">
                <div className="text-4xl sm:text-5xl font-black tracking-widest text-amber-400 font-mono">
                  {matchResult.headline}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold tracking-wider font-mono ${
                    matchResult.team1Won ? 'text-sky-400' : 'text-rose-400'
                  }`}
                >
                  {matchResult.winner}
                </div>
                <p className="text-xs text-neutral-400 font-mono pt-1">
                  Ялагч: <span className="text-white font-semibold">{matchResult.fighterName}</span>
                  {matchResult.maxCombo > 0 && ` · Max Combo: ${matchResult.maxCombo}`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startMatch(matchMode, opponentType)}
                  className="btn btn-solid h-10 text-xs font-semibold gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Дахин</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('CHARACTER_SELECT')}
                  className="btn btn-ghost h-10 text-xs font-semibold"
                >
                  Дүр солих
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('MAIN_MENU')}
                  className="btn btn-ghost h-10 text-xs font-semibold"
                >
                  Гол цэс
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
