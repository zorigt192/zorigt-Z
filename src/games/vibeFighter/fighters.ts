/**
 * Dedicated Fighters / Heroes module for Vibe Fighter.
 * Contains the expanded 8-character retro roster, fighter stats,
 * state initializer, and 16-bit pixel-art fighter renderer.
 */

export type HeadgearStyle =
  | 'headband'
  | 'hood'
  | 'visor'
  | 'crown'
  | 'kabuto'
  | 'mask'
  | 'horns'
  | 'tiara';

export interface FighterSpec {
  id: string;
  name: string;
  title: string;
  specialName: string;
  giColor: string;
  accentColor: string;
  skinColor: string;
  hairColor: string;
  energyColor: string;
  headgear: HeadgearStyle;
  speed: number;
  power: number;
  defense: number; // Damage reduction multiplier (1.0 = normal, 1.15 = tanky)
}

export interface FighterState {
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

export const ARENA_W = 960;
export const ARENA_H = 540;
export const FLOOR_Y = 456;

export const FIGHTER_ROSTER: FighterSpec[] = [
  {
    id: 'kazu',
    name: 'KAZU',
    title: 'Кибер Карате',
    specialName: 'Кибер Давалгаа',
    giColor: '#f8fafc',
    accentColor: '#38bdf8',
    skinColor: '#f5cba7',
    hairColor: '#1e293b',
    energyColor: '#38bdf8',
    headgear: 'headband',
    speed: 4.6,
    power: 1.0,
    defense: 1.0,
  },
  {
    id: 'ryuken',
    name: 'RYUKEN',
    title: 'Сүүдрийн Нинжа',
    specialName: 'Сүүдрийн Сүрикен',
    giColor: '#18181b',
    accentColor: '#ef4444',
    skinColor: '#f3d2b3',
    hairColor: '#09090b',
    energyColor: '#fb7185',
    headgear: 'hood',
    speed: 5.4,
    power: 0.94,
    defense: 0.95,
  },
  {
    id: 'titan',
    name: 'TITAN',
    title: 'Меха Тулаанч',
    specialName: 'Плазм Их Буу',
    giColor: '#27272a',
    accentColor: '#f59e0b',
    skinColor: '#d4a373',
    hairColor: '#78350f',
    energyColor: '#fbbf24',
    headgear: 'visor',
    speed: 3.9,
    power: 1.18,
    defense: 1.15,
  },
  {
    id: 'nova',
    name: 'NOVA',
    title: 'Плазм Довтлогч',
    specialName: 'Галактик Тэсрэлт',
    giColor: '#312e81',
    accentColor: '#c084fc',
    skinColor: '#fbdcc4',
    hairColor: '#e879f9',
    energyColor: '#c084fc',
    headgear: 'crown',
    speed: 4.9,
    power: 1.04,
    defense: 0.98,
  },
  {
    id: 'raiden',
    name: 'RAIDEN-X',
    title: 'Аянга Самурай',
    specialName: 'Аянгын Илд',
    giColor: '#0f172a',
    accentColor: '#facc15',
    skinColor: '#f1c27d',
    hairColor: '#cbd5e1',
    energyColor: '#fde047',
    headgear: 'kabuto',
    speed: 4.8,
    power: 1.08,
    defense: 1.04,
  },
  {
    id: 'viper',
    name: 'VIPER',
    title: 'Неон Хорт Нинжа',
    specialName: 'Хорт Соёо',
    giColor: '#064e3b',
    accentColor: '#34d399',
    skinColor: '#f5cba7',
    hairColor: '#052e16',
    energyColor: '#10b981',
    headgear: 'mask',
    speed: 5.5,
    power: 0.96,
    defense: 0.94,
  },
  {
    id: 'inferno',
    name: 'INFERNO',
    title: 'Галт Чөтгөр',
    specialName: 'Тамын Галт Бөмбөлөг',
    giColor: '#450a0a',
    accentColor: '#f97316',
    skinColor: '#dc2626',
    hairColor: '#fb923c',
    energyColor: '#fb923c',
    headgear: 'horns',
    speed: 4.4,
    power: 1.16,
    defense: 1.06,
  },
  {
    id: 'frost',
    name: 'FROST',
    title: 'Мөсөн Хатан',
    specialName: 'Мөсөн Жад',
    giColor: '#0c4a6e',
    accentColor: '#67e8f9',
    skinColor: '#fde8d7',
    hairColor: '#e0f2fe',
    energyColor: '#22d3ee',
    headgear: 'tiara',
    speed: 4.7,
    power: 1.05,
    defense: 1.02,
  },
];

export function createFighter(spec: FighterSpec, x: number, facing: 1 | -1): FighterState {
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

export function drawPixelFighter(
  ctx: CanvasRenderingContext2D,
  f: FighterState,
  teamNum: 1 | 2,
  nowMs: number,
  options?: { hideShadow?: boolean; floorY?: number }
) {
  const px = Math.round(f.x);
  const py = Math.round(f.y);
  const s = f.spec;
  const isKO = f.state === 'ko';
  const bob = f.state === 'idle' ? Math.round(Math.sin(nowMs / 160) * 2) : 0;
  const baseFloor = options?.floorY ?? FLOOR_Y;

  ctx.save();
  ctx.translate(px + 26, py + 48);
  ctx.scale(f.facing, 1);

  if (isKO) {
    ctx.rotate(-Math.PI / 2);
    ctx.translate(-18, 12);
  }

  // Ground shadow
  if (!isKO && !options?.hideShadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-22, 42 - (py - (baseFloor - 96)) * 0.2, 44, 8);
    ctx.fillStyle = teamNum === 1 ? 'rgba(56,189,248,0.28)' : 'rgba(239,68,68,0.28)';
    ctx.fillRect(-20, 44, 40, 4);
  }

  const hitFlash = f.state === 'hit' && Math.floor(nowMs / 50) % 2 === 0;

  // Legs
  const stride = f.state === 'walk' ? Math.round(Math.sin(nowMs / 80) * 7) : 0;
  ctx.fillStyle = hitFlash ? '#ffffff' : '#18181b';
  ctx.fillRect(-14 - stride, 16, 12, 30);
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

  // Hair base
  ctx.fillStyle = s.hairColor;
  ctx.fillRect(-14, -48 + bob, 28, 10);
  ctx.fillRect(-14, -42 + bob, 6, 10);

  // Unique Headgear per hero
  if (s.headgear === 'headband') {
    ctx.fillStyle = s.accentColor;
    ctx.fillRect(-13, -38 + bob, 26, 5);
    ctx.fillRect(-22, -37 + bob, 9, 4);
  } else if (s.headgear === 'hood') {
    ctx.fillStyle = s.giColor;
    ctx.fillRect(-15, -48 + bob, 30, 14);
    ctx.fillStyle = s.accentColor;
    ctx.fillRect(-12, -26 + bob, 24, 6);
  } else if (s.headgear === 'visor') {
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(-14, -46 + bob, 28, 12);
    ctx.fillStyle = s.accentColor;
    ctx.fillRect(0, -35 + bob, 14, 6);
  } else if (s.headgear === 'crown') {
    ctx.fillStyle = s.accentColor;
    ctx.fillRect(-12, -52 + bob, 4, 6);
    ctx.fillRect(-2, -54 + bob, 4, 8);
    ctx.fillRect(8, -52 + bob, 4, 6);
  } else if (s.headgear === 'kabuto') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, -46 + bob, 32, 10);
    ctx.fillStyle = s.accentColor;
    ctx.fillRect(2, -54 + bob, 4, 10);
    ctx.fillRect(8, -52 + bob, 4, 8);
  } else if (s.headgear === 'mask') {
    ctx.fillStyle = s.accentColor;
    ctx.fillRect(-12, -28 + bob, 24, 10);
  } else if (s.headgear === 'horns') {
    ctx.fillStyle = s.accentColor;
    ctx.fillRect(-14, -56 + bob, 5, 12);
    ctx.fillRect(7, -56 + bob, 5, 12);
  } else if (s.headgear === 'tiara') {
    ctx.fillStyle = s.accentColor;
    ctx.fillRect(-10, -45 + bob, 20, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -49 + bob, 4, 6);
  }

  // Pixel Eye (unless visor covers it)
  if (s.headgear !== 'visor') {
    ctx.fillStyle = s.id === 'inferno' ? '#fde047' : '#09090b';
    ctx.fillRect(4, -32 + bob, 5, 5);
  }

  // Arms
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
}
