import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Heart,
  Sparkles,
  Terminal,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Skull,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Player extends Entity {
  vx: number;
  vy: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  invulnerableTime: number;
}

interface Item extends Entity {
  type: 'html' | 'css' | 'js' | 'ts' | 'engine';
  label: string;
  color: string;
  points: number;
  collected: boolean;
}

interface Bug extends Entity {
  direction: number;
  defeated: boolean;
}

interface Boss extends Entity {
  maxHp: number;
  hp: number;
  vx: number;
  vy: number;
  hoverBaseY: number;
  hoverAngle: number;
  isHit: number;
  attackCooldown: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const MiniGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('zorigt_game_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState<number>(5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [devTitle, setDevTitle] = useState<string>('🌱 Эхлэн суралцагч');
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [bossHp, setBossHp] = useState<number>(100);
  const [bossMaxHp, setBossMaxHp] = useState<number>(100);

  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false,
  });

  const stateRef = useRef<{
    player: Player;
    items: Item[];
    bugs: Bug[];
    boss: Boss | null;
    projectiles: Projectile[];
    lastSpawn: number;
    particles: { x: number; y: number; vx: number; vy: number; color: string; life: number }[];
    animationFrameId: number;
    score: number;
    lives: number;
    gravity: number;
    floorY: number;
    warningTimer: number;
    victoryTimer: number;
    screenShake: number;
    bossSpawnedThisRun: boolean;
  }>({
    player: {
      x: 100,
      y: 200,
      width: 28,
      height: 38,
      speed: 4.8,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
      invulnerableTime: 0,
    },
    items: [],
    bugs: [],
    boss: null,
    projectiles: [],
    lastSpawn: 0,
    particles: [],
    animationFrameId: 0,
    score: 0,
    lives: 5,
    gravity: 0.55,
    floorY: 260,
    warningTimer: 0,
    victoryTimer: 0,
    screenShake: 0,
    bossSpawnedThisRun: false,
  });

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setIsMuted(!sound.enabled);
  };

  const getRank = (sc: number, bossDefeated = false): string => {
    if (bossDefeated) return '👑 Босс ялагч: Домогт хөгжүүлэгч';
    if (sc < 60) return '🌱 Эхлэн суралцагч (HTML/CSS)';
    if (sc < 160) return '⚡ Junior Dev (JavaScript)';
    if (sc < 300) return '🔷 TypeScript Инженер';
    if (sc < 500) return '🎮 Game Designer (Горим зохиогч)';
    return '👑 Мэргэжлийн Тоглоом Хөгжүүлэгч!';
  };

  const startGame = () => {
    const s = stateRef.current;
    s.player.x = 100;
    s.player.y = 150;
    s.player.vx = 0;
    s.player.vy = 0;
    s.player.invulnerableTime = 0;
    s.items = [];
    s.bugs = [];
    s.boss = null;
    s.projectiles = [];
    s.particles = [];
    s.score = 0;
    s.lives = 5;
    s.warningTimer = 0;
    s.victoryTimer = 0;
    s.screenShake = 0;
    s.bossSpawnedThisRun = false;
    setScore(0);
    setLives(5);
    setBossActive(false);
    setBossHp(0);
    setDevTitle(getRank(0));
    setGameOver(false);
    setIsPlaying(true);
    sound.playLevelUp();
  };

  const triggerBoss = (force = false) => {
    const s = stateRef.current;
    if (s.boss && !force) return;

    if (!isPlaying || gameOver) {
      startGame();
    }

    s.warningTimer = 2.4;
    s.screenShake = 14;
    sound.playBossRoar();

    const canvasWidth = canvasRef.current?.width || 780;
    s.boss = {
      x: canvasWidth / 2 - 48,
      y: -90,
      width: 96,
      height: 72,
      speed: 2.2,
      vx: 2.2,
      vy: 1.5,
      maxHp: 100,
      hp: 100,
      hoverBaseY: 65,
      hoverAngle: 0,
      isHit: 0,
      attackCooldown: 1.8,
    };
    s.bossSpawnedThisRun = true;
    setBossActive(true);
    setBossHp(100);
    setBossMaxHp(100);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        keysRef.current.left = true;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        keysRef.current.right = true;
      }
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        keysRef.current.jump = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        keysRef.current.left = false;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        keysRef.current.right = false;
      }
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        keysRef.current.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;
      s.floorY = height - 42;

      // Timers & Screen Shake
      if (s.screenShake > 0) {
        s.screenShake = Math.max(0, s.screenShake - dt * 25);
      }
      if (s.warningTimer > 0) {
        s.warningTimer = Math.max(0, s.warningTimer - dt);
      }
      if (s.victoryTimer > 0) {
        s.victoryTimer = Math.max(0, s.victoryTimer - dt);
      }

      if (isPlaying && !gameOver) {
        // Auto-summon boss at score >= 150
        if (s.score >= 150 && !s.boss && !s.bossSpawnedThisRun) {
          triggerBoss(true);
        }

        // Player physics
        if (keysRef.current.left) {
          s.player.vx = -s.player.speed;
          s.player.facing = 'left';
        } else if (keysRef.current.right) {
          s.player.vx = s.player.speed;
          s.player.facing = 'right';
        } else {
          s.player.vx *= 0.78;
        }

        if (keysRef.current.jump && s.player.isGrounded) {
          s.player.vy = -12;
          s.player.isGrounded = false;
          sound.playJump();
        }

        s.player.vy += s.gravity;
        s.player.x += s.player.vx;
        s.player.y += s.player.vy;

        if (s.player.x < 10) s.player.x = 10;
        if (s.player.x + s.player.width > width - 10) s.player.x = width - 10 - s.player.width;

        if (s.player.y + s.player.height >= s.floorY) {
          s.player.y = s.floorY - s.player.height;
          s.player.vy = 0;
          s.player.isGrounded = true;
        }

        if (s.player.invulnerableTime > 0) {
          s.player.invulnerableTime -= dt;
        }

        // Spawn items and regular bugs
        if (now - s.lastSpawn > (s.boss ? 1800 : 1300)) {
          s.lastSpawn = now;
          const spawnType = Math.random();

          if (spawnType > 0.35) {
            const itemTypes: Array<{ type: Item['type']; label: string; color: string; points: number }> = [
              { type: 'html', label: 'HTML', color: '#e44d26', points: 10 },
              { type: 'css', label: 'CSS', color: '#264de4', points: 15 },
              { type: 'js', label: 'JS', color: '#f7df1e', points: 20 },
              { type: 'ts', label: 'TS', color: '#38bdf8', points: 30 },
              { type: 'engine', label: 'GAME', color: '#c084fc', points: 40 },
            ];
            const chosen = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            s.items.push({
              x: Math.random() * (width - 80) + 40,
              y: -30,
              width: 40,
              height: 24,
              speed: 1.6 + Math.random() * 1.6,
              type: chosen.type,
              label: chosen.label,
              color: chosen.color,
              points: chosen.points,
              collected: false,
            });
          } else if (!s.boss || s.bugs.length < 2) {
            const fromLeft = Math.random() > 0.5;
            s.bugs.push({
              x: fromLeft ? -25 : width + 10,
              y: s.floorY - 24,
              width: 26,
              height: 24,
              speed: 1.8 + Math.random() * 1.5,
              direction: fromLeft ? 1 : -1,
              defeated: false,
            });
          }
        }

        // Items collision
        for (let i = s.items.length - 1; i >= 0; i--) {
          const item = s.items[i];
          item.y += item.speed;

          if (
            s.player.x < item.x + item.width &&
            s.player.x + s.player.width > item.x &&
            s.player.y < item.y + item.height &&
            s.player.y + s.player.height > item.y
          ) {
            sound.playCollect();
            s.score += item.points;
            setScore(s.score);
            setDevTitle(getRank(s.score));

            if (s.score > highScore) {
              setHighScore(s.score);
              try {
                localStorage.setItem('zorigt_game_highscore', s.score.toString());
              } catch {}
            }

            for (let p = 0; p < 8; p++) {
              s.particles.push({
                x: item.x + item.width / 2,
                y: item.y + item.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: item.color,
                life: 0.45,
              });
            }
            s.items.splice(i, 1);
            continue;
          }

          if (item.y > height + 20) {
            s.items.splice(i, 1);
          }
        }

        // Bugs collision
        for (let b = s.bugs.length - 1; b >= 0; b--) {
          const bug = s.bugs[b];
          bug.x += bug.speed * bug.direction;

          if (
            s.player.x < bug.x + bug.width &&
            s.player.x + s.player.width > bug.x &&
            s.player.y < bug.y + bug.height &&
            s.player.y + s.player.height > bug.y
          ) {
            if (s.player.vy > 1 && s.player.y + s.player.height - bug.y < 16) {
              sound.playJump();
              s.player.vy = -9;
              s.score += 25;
              setScore(s.score);
              setDevTitle(getRank(s.score));

              for (let p = 0; p < 10; p++) {
                s.particles.push({
                  x: bug.x + bug.width / 2,
                  y: bug.y,
                  vx: (Math.random() - 0.5) * 7,
                  vy: (Math.random() - 0.5) * 7,
                  color: '#ef4444',
                  life: 0.5,
                });
              }
              s.bugs.splice(b, 1);
              continue;
            } else if (s.player.invulnerableTime <= 0) {
              sound.playHit();
              s.lives -= 1;
              setLives(s.lives);
              s.player.invulnerableTime = 1.2;

              if (s.lives <= 0) {
                setGameOver(true);
                setIsPlaying(false);
              }
            }
          }

          if (bug.x < -60 || bug.x > width + 60) {
            s.bugs.splice(b, 1);
          }
        }

        // ================= BOSS FIGHT LOGIC =================
        if (s.boss) {
          const b = s.boss;
          if (b.isHit > 0) b.isHit -= dt;

          // Float in or hover
          if (b.y < b.hoverBaseY) {
            b.y += 2.2;
          } else {
            b.hoverAngle += dt * 2.2;
            b.y = b.hoverBaseY + Math.sin(b.hoverAngle) * 20;

            b.x += b.vx;
            if (b.x < 30) {
              b.x = 30;
              b.vx = Math.abs(b.vx);
            } else if (b.x + b.width > width - 30) {
              b.x = width - 30 - b.width;
              b.vx = -Math.abs(b.vx);
            }
          }

          // Attacks
          b.attackCooldown -= dt;
          if (b.attackCooldown <= 0) {
            b.attackCooldown = 2.0 - Math.min(0.9, (1 - b.hp / b.maxHp) * 0.8);

            // Fire 2 neon glitch projectiles downwards
            s.projectiles.push({
              x: b.x + 18,
              y: b.y + b.height - 10,
              vx: (s.player.x - (b.x + 18)) * 0.012,
              vy: 2.8,
              radius: 6,
              color: '#ef4444',
            });
            s.projectiles.push({
              x: b.x + b.width - 18,
              y: b.y + b.height - 10,
              vx: (s.player.x - (b.x + b.width - 18)) * 0.012,
              vy: 2.8,
              radius: 6,
              color: '#c084fc',
            });

            // Occasionally spawn a mini virus minion
            if (Math.random() > 0.4 && s.bugs.length < 3) {
              s.bugs.push({
                x: b.x + b.width / 2 - 13,
                y: b.y + b.height,
                width: 26,
                height: 24,
                speed: 2.0,
                direction: Math.random() > 0.5 ? 1 : -1,
                defeated: false,
              });
            }

            sound.playHit();
          }

          // Player vs Boss Collision
          const px = s.player.x;
          const py = s.player.y;
          const pw = s.player.width;
          const ph = s.player.height;

          if (px < b.x + b.width && px + pw > b.x && py < b.y + b.height && py + ph > b.y) {
            // Check stomp on top of boss's head
            const isStomp = s.player.vy > 0 && (py + ph - b.y) < 28;

            if (isStomp) {
              b.hp -= 25;
              b.isHit = 0.35;
              s.player.vy = -12; // High bounce
              sound.playBossHit();
              s.screenShake = 10;
              setBossHp(Math.max(0, b.hp));

              for (let p = 0; p < 16; p++) {
                s.particles.push({
                  x: px + pw / 2,
                  y: b.y + 10,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  color: p % 2 === 0 ? '#ef4444' : '#a855f7',
                  life: 0.5,
                });
              }

              if (b.hp <= 0) {
                // Boss Defeated!
                sound.playBossDefeated();
                s.score += 300;
                setScore(s.score);
                if (s.score > highScore) {
                  setHighScore(s.score);
                  try {
                    localStorage.setItem('zorigt_game_highscore', s.score.toString());
                  } catch {}
                }
                setDevTitle(getRank(s.score, true));
                s.boss = null;
                setBossActive(false);
                s.victoryTimer = 3.5;
                s.screenShake = 16;

                for (let p = 0; p < 45; p++) {
                  s.particles.push({
                    x: b.x + b.width / 2,
                    y: b.y + b.height / 2,
                    vx: (Math.random() - 0.5) * 12,
                    vy: (Math.random() - 0.5) * 12,
                    color: ['#ef4444', '#a855f7', '#fbbf24', '#38bdf8'][Math.floor(Math.random() * 4)],
                    life: 0.9,
                  });
                }
              }
            } else if (s.player.invulnerableTime <= 0) {
              // Body collision hurt
              sound.playHit();
              s.lives -= 1;
              setLives(s.lives);
              s.player.invulnerableTime = 1.3;
              s.player.vx = px < b.x ? -6 : 6;
              s.screenShake = 8;
              if (s.lives <= 0) {
                setGameOver(true);
                setIsPlaying(false);
              }
            }
          }
        }

        // Projectiles update & player collision
        for (let pIdx = s.projectiles.length - 1; pIdx >= 0; pIdx--) {
          const pr = s.projectiles[pIdx];
          pr.x += pr.vx;
          pr.y += pr.vy;

          const dist = Math.hypot(
            s.player.x + s.player.width / 2 - pr.x,
            s.player.y + s.player.height / 2 - pr.y
          );

          if (dist < pr.radius + 14) {
            if (s.player.invulnerableTime <= 0) {
              sound.playHit();
              s.lives -= 1;
              setLives(s.lives);
              s.player.invulnerableTime = 1.2;
              s.screenShake = 8;
              if (s.lives <= 0) {
                setGameOver(true);
                setIsPlaying(false);
              }
            }
            s.projectiles.splice(pIdx, 1);
            continue;
          }

          if (pr.y > height + 20 || pr.x < -20 || pr.x > width + 20) {
            s.projectiles.splice(pIdx, 1);
          }
        }

        // Particles
        for (let p = s.particles.length - 1; p >= 0; p--) {
          const part = s.particles[p];
          part.x += part.vx;
          part.y += part.vy;
          part.life -= dt;
          if (part.life <= 0) {
            s.particles.splice(p, 1);
          }
        }
      }

      // ================= DRAW CANVAS =================
      ctx.save();

      // Screen shake translation
      if (s.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * s.screenShake;
        const shakeY = (Math.random() - 0.5) * s.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      ctx.clearRect(0, 0, width, height);

      // Deep dark background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (s.boss) {
        bgGrad.addColorStop(0, '#100508');
        bgGrad.addColorStop(0.6, '#180812');
        bgGrad.addColorStop(1, '#200818');
      } else {
        bgGrad.addColorStop(0, '#020204');
        bgGrad.addColorStop(0.6, '#08080f');
        bgGrad.addColorStop(1, '#0f0f18');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Cyber grid
      ctx.strokeStyle = s.boss ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let star = 0; star < 16; star++) {
        const sx = (star * 53) % width;
        const sy = (star * 31) % (height - 90);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Floor
      ctx.fillStyle = s.boss ? '#120508' : '#050508';
      ctx.fillRect(0, s.floorY, width, height - s.floorY);

      // Floor hairline border
      ctx.strokeStyle = s.boss ? 'rgba(239, 68, 68, 0.45)' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, s.floorY);
      ctx.lineTo(width, s.floorY);
      ctx.stroke();

      // Floor grid floor projection
      ctx.strokeStyle = s.boss ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.08)';
      for (let gx = 0; gx < width; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, s.floorY);
        ctx.lineTo(gx - 20, height);
        ctx.stroke();
      }

      // Items
      s.items.forEach((item) => {
        ctx.save();
        ctx.fillStyle = item.color;
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(item.x, item.y, item.width, item.height, 5);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, item.x + item.width / 2, item.y + item.height / 2 + 1);
        ctx.restore();
      });

      // Regular Bugs
      s.bugs.forEach((bug) => {
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(bug.x, bug.y, bug.width, bug.height, 6);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        const eyeOffset = bug.direction > 0 ? 16 : 4;
        ctx.fillRect(bug.x + eyeOffset, bug.y + 5, 4, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(bug.x + eyeOffset + (bug.direction > 0 ? 2 : 0), bug.y + 6, 2, 2);

        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bug.x + 5, bug.y);
        ctx.lineTo(bug.x + 1, bug.y - 6);
        ctx.moveTo(bug.x + bug.width - 5, bug.y);
        ctx.lineTo(bug.x + bug.width - 1, bug.y - 6);
        ctx.stroke();
        ctx.restore();
      });

      // ================= DRAW BOSS MONSTER =================
      if (s.boss) {
        const b = s.boss;
        const isFlashing = b.isHit > 0 && Math.floor(now / 60) % 2 === 0;

        ctx.save();
        ctx.shadowColor = isFlashing ? '#ffffff' : '#ef4444';
        ctx.shadowBlur = 20;

        // Boss Body Base (Obsidian cyber armor)
        ctx.fillStyle = isFlashing ? '#ffffff' : '#18181b';
        ctx.beginPath();
        ctx.roundRect(b.x + 8, b.y + 12, b.width - 16, b.height - 20, 12);
        ctx.fill();

        // Spikes / Horns (Left and right)
        ctx.fillStyle = isFlashing ? '#fecaca' : '#dc2626';
        // Left horn
        ctx.beginPath();
        ctx.moveTo(b.x + 12, b.y + 20);
        ctx.lineTo(b.x - 12, b.y - 10);
        ctx.lineTo(b.x + 30, b.y + 12);
        ctx.fill();
        // Right horn
        ctx.beginPath();
        ctx.moveTo(b.x + b.width - 12, b.y + 20);
        ctx.lineTo(b.x + b.width + 12, b.y - 10);
        ctx.lineTo(b.x + b.width - 30, b.y + 12);
        ctx.fill();

        // Top spikes
        ctx.beginPath();
        ctx.moveTo(b.x + 36, b.y + 12);
        ctx.lineTo(b.x + b.width / 2, b.y - 6);
        ctx.lineTo(b.x + b.width - 36, b.y + 12);
        ctx.fill();

        // Cyber plates and glowing lines
        ctx.fillStyle = isFlashing ? '#ffffff' : '#7f1d1d';
        ctx.fillRect(b.x + 18, b.y + 20, b.width - 36, 14);

        // Eyes (Menacing glowing demonic eyes)
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(b.x + 22, b.y + 22, 14, 10);
        ctx.fillRect(b.x + b.width - 36, b.y + 22, 14, 10);

        ctx.fillStyle = '#fde047'; // yellow inner
        ctx.fillRect(b.x + 25, b.y + 24, 8, 6);
        ctx.fillRect(b.x + b.width - 33, b.y + 24, 8, 6);

        ctx.fillStyle = '#000000'; // black slit pupil
        ctx.fillRect(b.x + 28, b.y + 24, 3, 6);
        ctx.fillRect(b.x + b.width - 30, b.y + 24, 3, 6);

        // Jagged Mouth with teeth
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(b.x + 24, b.y + 42, b.width - 48, 14);

        // Sharp Teeth
        ctx.fillStyle = '#ffffff';
        for (let t = 0; t < 5; t++) {
          ctx.fillRect(b.x + 28 + t * 8, b.y + 42, 4, 5);
          ctx.fillRect(b.x + 32 + t * 8, b.y + 51, 4, 5);
        }

        // Glitch Energy Core in center of mouth
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(b.x + b.width / 2 - 6, b.y + 46, 12, 6);

        // Floating Cyber Claws / Tendrils underneath
        const clawWiggle = Math.sin(now / 120) * 4;
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(b.x + 16, b.y + b.height - 10 + clawWiggle, 8, 12);
        ctx.fillRect(b.x + b.width - 24, b.y + b.height - 10 - clawWiggle, 8, 12);
        ctx.fillRect(b.x + b.width / 2 - 4, b.y + b.height - 8 + clawWiggle * 0.5, 8, 10);

        ctx.restore();

        // Draw Boss HP Bar at Top of Canvas
        const barW = Math.min(340, width - 40);
        const barH = 14;
        const barX = (width - barW) / 2;
        const barY = 16;
        const hpPct = Math.max(0, b.hp / b.maxHp);

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(barX - 6, barY - 4, barW + 12, barH + 20);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX, barY + 12, barW, barH);

        const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        hpGrad.addColorStop(0, '#ef4444');
        hpGrad.addColorStop(1, '#a855f7');
        ctx.fillStyle = hpGrad;
        ctx.fillRect(barX + 1, barY + 13, (barW - 2) * hpPct, barH - 2);

        ctx.font = 'bold 11px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`👹 АВАРГА ВИРУС МАНГАС: ${b.hp} / ${b.maxHp} HP`, width / 2, barY + 8);
        ctx.restore();
      }

      // Projectiles
      s.projectiles.forEach((pr) => {
        ctx.save();
        ctx.fillStyle = pr.color;
        ctx.shadowColor = pr.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Particles
      s.particles.forEach((part) => {
        ctx.fillStyle = part.color;
        ctx.fillRect(part.x, part.y, 3, 3);
      });

      // Player
      const p = s.player;
      ctx.save();
      if (p.invulnerableTime > 0 && Math.floor(now / 100) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x + 4, p.y + 14, p.width - 8, 16);

      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(p.x + 6, p.y + 4, p.width - 12, 11);

      ctx.fillStyle = '#1c1917';
      ctx.fillRect(p.x + 4, p.y + 1, p.width - 8, 5);
      ctx.fillRect(p.x + (p.facing === 'right' ? 4 : p.width - 9), p.y + 6, 5, 4);

      ctx.fillStyle = '#09090b';
      const eyeX = p.facing === 'right' ? p.x + 16 : p.x + 8;
      ctx.fillRect(eyeX, p.y + 7, 3, 3);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(p.x + 3, p.y + 6, 3, 7);
      ctx.fillRect(p.x + p.width - 6, p.y + 6, 3, 7);
      ctx.fillRect(p.x + 5, p.y + 1, p.width - 10, 2);

      ctx.fillStyle = '#27272a';
      ctx.fillRect(p.x + 6, p.y + 30, 6, 8);
      ctx.fillRect(p.x + p.width - 12, p.y + 30, 6, 8);

      ctx.fillStyle = '#71717a';
      const laptopX = p.facing === 'right' ? p.x + p.width - 6 : p.x - 2;
      ctx.fillRect(laptopX, p.y + 18, 8, 7);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(laptopX + 1, p.y + 19, 6, 4);

      ctx.restore();

      // ================= OVERLAYS =================
      if (s.warningTimer > 0) {
        const flash = Math.floor(now / 150) % 2 === 0;
        ctx.save();
        ctx.fillStyle = flash ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, height / 2 - 38, width, 76);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, height / 2 - 38, width, 76);

        ctx.font = 'bold 15px "Press Start 2P", monospace, sans-serif';
        ctx.fillStyle = flash ? '#ffffff' : '#fca5a5';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ АНХААР! АВАРГА МАНГАС! ⚠️', width / 2, height / 2 - 6);

        ctx.font = '12px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Толгой дээр нь үсэрч 25 HP гэмтээ! Сумнуудаас зайлсхий!', width / 2, height / 2 + 18);
        ctx.restore();
      }

      if (s.victoryTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.fillRect(0, height / 2 - 38, width, 76);

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, height / 2 - 38, width, 76);

        ctx.font = 'bold 15px "Press Start 2P", monospace, sans-serif';
        ctx.fillStyle = '#34d399';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 АВАРГА МАНГАСЫГ ЯЛЛАА! 🎉', width / 2, height / 2 - 6);

        ctx.font = '12px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('+300 БОНУС ОНОО! Зоригт домогт түвшинд хүрлээ!', width / 2, height / 2 + 18);
        ctx.restore();
      }

      if (!isPlaying && !gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 18px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ТОГЛООМ СТАРТ', width / 2, height / 2 - 20);
        ctx.font = '13px "Inter", sans-serif';
        ctx.fillStyle = '#9a9a9a';
        ctx.fillText('Сум товч [← →] гүйх, [W] эсвэл [Space / Дээшээ] үсрэх', width / 2, height / 2 + 15);
        ctx.fillText('Код (HTML, CSS, JS, TS) цуглуулж оноо ав!', width / 2, height / 2 + 38);
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(5, 5, 8, 0.88)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 20px "Press Start 2P", monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ТОГЛООМ ДУУСЛАА!', width / 2, height / 2 - 25);

        ctx.fillStyle = '#ffffff';
        ctx.font = '500 15px "Inter", sans-serif';
        ctx.fillText(`Цуглуулсан оноо: ${s.score}`, width / 2, height / 2 + 10);
        ctx.fillStyle = '#d8d8d8';
        ctx.fillText(`Зоригтын цол: ${devTitle}`, width / 2, height / 2 + 35);
      }

      ctx.restore();
      s.animationFrameId = requestAnimationFrame(loop);
    };

    stateRef.current.animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(stateRef.current.animationFrameId);
    };
  }, [isPlaying, gameOver, highScore, devTitle]);

  return (
    <div className="vesper-card p-4 sm:p-6 my-6 sm:my-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2 m-0">
              Зоригтын Мини Тоглоом
              <span className="text-[10px] sm:text-[11px] bg-white/10 text-white font-mono px-1.5 py-0.5 rounded border border-white/15">
                v1.1 TS • Boss Fight
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-400 m-0">
              Код цуглуулж оноо ав, Аварга мангасыг толгой дээр нь үсэрч ял!
            </p>
          </div>
        </div>

        {/* Dashboard stats */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-white/10 self-stretch sm:self-auto">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] sm:text-xs text-neutral-400">Оноо:</span>
            <span className="font-mono font-bold text-white text-xs sm:text-sm">{score}</span>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs text-neutral-400">Дээд:</span>
            <span className="font-mono font-bold text-neutral-200 text-[11px] sm:text-xs">{highScore}</span>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 transition-all ${
                  i < lives ? 'fill-rose-500 text-rose-500' : 'text-neutral-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={toggleSound}
            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-auto sm:ml-0"
            title={isMuted ? 'Дуу асаах' : 'Дуу хаах'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      <div className="mt-2.5 mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">Одоогийн цол:</span>
          <span className="font-medium text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
            {devTitle}
          </span>
        </div>

        {/* Boss Fight Trigger Button */}
        <button
          onClick={() => triggerBoss(true)}
          className={`btn btn-ghost text-xs px-3 py-1 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all ${
            bossActive
              ? 'border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse'
              : 'border-rose-500/40 text-rose-300 hover:text-white hover:border-rose-400'
          }`}
          title="Аварга вирус мангасыг шууд дуудах"
        >
          <Skull className="w-3.5 h-3.5 text-rose-400" />
          <span>{bossActive ? `👹 Босс тулаан: ${bossHp}/${bossMaxHp} HP` : '👹 Босс дуудах (Boss Fight)'}</span>
        </button>
      </div>

      {/* Canvas viewport */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black flex justify-center mt-2 w-full">
        <canvas
          ref={canvasRef}
          width={780}
          height={320}
          className="w-full max-w-full block select-none touch-none aspect-[16/9] sm:aspect-[19/8]"
        />

        {(!isPlaying || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 gap-3">
            <button
              onClick={startGame}
              className="btn btn-solid text-xs sm:text-sm font-semibold px-5 py-2.5 sm:px-6 sm:py-3 cursor-pointer shadow-xl flex items-center"
            >
              {gameOver ? <RotateCcw className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
              {gameOver ? 'Дахин тоглох (Restart)' : 'Тоглож эхлэх (Start Game)'}
            </button>

            <button
              onClick={() => triggerBoss(true)}
              className="btn btn-ghost text-xs px-4 py-2 flex items-center gap-1.5 border-rose-500/50 text-rose-300 hover:text-white hover:bg-rose-500/20 cursor-pointer"
            >
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span>Шууд Босс тулаан эхлүүлэх</span>
            </button>
          </div>
        )}
      </div>

      {/* Touch controls for mobile */}
      <div className="mt-3 flex items-center justify-between gap-3 md:hidden select-none">
        <div className="flex gap-2">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              keysRef.current.left = true;
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.left = false;
            }}
            onPointerLeave={() => {
              keysRef.current.left = false;
            }}
            className="w-14 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center active:bg-white/30 text-white shadow-md active:scale-95 transition-all touch-manipulation"
            aria-label="Зүүн тийш"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              keysRef.current.right = true;
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.right = false;
            }}
            onPointerLeave={() => {
              keysRef.current.right = false;
            }}
            className="w-14 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center active:bg-white/30 text-white shadow-md active:scale-95 transition-all touch-manipulation"
            aria-label="Баруун тийш"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        <button
          onPointerDown={(e) => {
            e.preventDefault();
            keysRef.current.jump = true;
            if (stateRef.current.player.isGrounded) {
              stateRef.current.player.vy = -12;
              stateRef.current.player.isGrounded = false;
              sound.playJump();
            }
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            keysRef.current.jump = false;
          }}
          onPointerLeave={() => {
            keysRef.current.jump = false;
          }}
          className="flex-1 h-12 btn btn-solid text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all touch-manipulation"
          aria-label="Үсрэх"
        >
          <ArrowUp className="w-5 h-5" /> Үсрэх (Jump)
        </button>
      </div>

      {/* Bottom info bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-neutral-400 w-full">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span>⌨️ [A / D] гүйх, [Space / W] үсрэх</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-rose-300 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" /> 150+ оноо эсвэл [Босс дуудах]-аар Аварга мангас ирнэ!
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="text-neutral-300">Мангасын толгой дээр үсэрч устга (-25 HP)</span>
        </div>

        <button
          onClick={() => setShowCode(!showCode)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-neutral-200 transition-colors border border-white/15 text-xs font-mono cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          {showCode ? 'Код нуух' : 'TypeScript код харах'}
        </button>
      </div>

      {showCode && (
        <div className="mt-4 p-4 bg-black/90 rounded-xl border border-white/15 font-mono text-xs text-neutral-300 overflow-x-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-neutral-400">
            <span>gameEngine.ts — Босс ба мангасын TypeScript архитектур:</span>
            <span className="text-white">Strict TypeScript</span>
          </div>
          <pre>{`interface Boss extends Entity {
  maxHp: number;        // Аварга мангасын нийт HP (100)
  hp: number;           // Одоогийн HP
  vx: number; vy: number;
  attackCooldown: number; // Цэнэглэх хугацаа
}

// Боссын толгой дээр үсрэх мөргөлдөөний алгоритм:
function handleBossStomp(player: Player, boss: Boss): boolean {
  if (player.vy > 0 && (player.y + player.height - boss.y) < 28) {
    boss.hp -= 25; // -25 HP гэмтэл
    player.vy = -12; // Өндөрт ойх үсрэлт
    return true;
  }
  return false;
}`}</pre>
        </div>
      )}
    </div>
  );
};
