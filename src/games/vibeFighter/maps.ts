/**
 * Dedicated Maps / Arenas module for Vibe Fighter.
 * Provides 4 distinct 16-bit pixel-art combat stages and renders them cleanly
 * both in the main 960x540 battle canvas and in map preview thumbnails.
 */
import { ARENA_H, ARENA_W, FLOOR_Y } from './fighters';

export type ArenaMapId = 'cyber-dojo' | 'neon-metro' | 'volcano-shrine' | 'frozen-peak';

export interface ArenaMapSpec {
  id: ArenaMapId;
  name: string;
  subtitle: string;
  atmosphere: string;
  accentColor: string;
}

export const ARENA_MAPS: ArenaMapSpec[] = [
  {
    id: 'cyber-dojo',
    name: 'Кибер Дожо',
    subtitle: 'Сартай дээврийн дэвжээ',
    atmosphere: 'Шөнийн хот · Дэнлүү',
    accentColor: '#38bdf8',
  },
  {
    id: 'neon-metro',
    name: 'Неон Метро',
    subtitle: 'Киберпанк гудамж',
    atmosphere: 'Шиврээ бороо · Неон',
    accentColor: '#e879f9',
  },
  {
    id: 'volcano-shrine',
    name: 'Галт Сүм',
    subtitle: 'Лаавын улаан тавцан',
    atmosphere: 'Галт оч · Тории хаалга',
    accentColor: '#f97316',
  },
  {
    id: 'frozen-peak',
    name: 'Мөсөн Оргил',
    subtitle: 'Туйлын туяат цайз',
    atmosphere: 'Цасан ширхэг · Кристал',
    accentColor: '#22d3ee',
  },
];

export function drawArenaMap(
  ctx: CanvasRenderingContext2D,
  mapId: ArenaMapId,
  nowMs: number
) {
  if (mapId === 'neon-metro') {
    drawNeonMetro(ctx, nowMs);
  } else if (mapId === 'volcano-shrine') {
    drawVolcanoShrine(ctx, nowMs);
  } else if (mapId === 'frozen-peak') {
    drawFrozenPeak(ctx, nowMs);
  } else {
    drawCyberDojo(ctx);
  }
}

function drawCyberDojo(ctx: CanvasRenderingContext2D) {
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

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 28; i++) {
    ctx.fillRect((i * 137) % ARENA_W, (i * 59) % 240, 2, 2);
  }

  // City skyline
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

  // Pagoda Frame
  ctx.fillStyle = '#18181b';
  ctx.fillRect(250, FLOOR_Y - 190, 460, 14);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(240, FLOOR_Y - 194, 480, 4);
  ctx.fillStyle = '#27272a';
  ctx.fillRect(275, FLOOR_Y - 176, 18, 176);
  ctx.fillRect(667, FLOOR_Y - 176, 18, 176);

  // Lanterns
  [284, 676].forEach((lx) => {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(lx - 10, FLOOR_Y - 150, 20, 28);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(lx - 6, FLOOR_Y - 144, 12, 16);
  });

  // Wooden floor
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
}

function drawNeonMetro(ctx: CanvasRenderingContext2D, nowMs: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, ARENA_H);
  sky.addColorStop(0, '#090314');
  sky.addColorStop(0.6, '#1e0b36');
  sky.addColorStop(1, '#30104a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);

  // Cyber towers + neon signs
  const towers = [
    { x: 10, w: 120, h: 320, sign: '#e879f9' },
    { x: 150, w: 110, h: 250, sign: '#22d3ee' },
    { x: 310, w: 140, h: 290, sign: '#f43f5e' },
    { x: 520, w: 125, h: 260, sign: '#38bdf8' },
    { x: 680, w: 115, h: 310, sign: '#a855f7' },
    { x: 820, w: 130, h: 270, sign: '#ec4899' },
  ];
  towers.forEach((t, idx) => {
    ctx.fillStyle = '#090914';
    ctx.fillRect(t.x, FLOOR_Y - t.h, t.w, t.h);
    ctx.fillStyle = t.sign;
    ctx.fillRect(t.x + 14, FLOOR_Y - t.h + 26 + idx * 8, t.w - 28, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let ry = FLOOR_Y - t.h + 60; ry < FLOOR_Y - 40; ry += 24) {
      ctx.fillRect(t.x + 16, ry, t.w - 32, 6);
    }
  });

  // Elevated Metro Track & Moving Pixel Train
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 290, ARENA_W, 18);
  ctx.fillStyle = '#e879f9';
  ctx.fillRect(0, 306, ARENA_W, 3);

  const trainX = ((nowMs * 0.25) % (ARENA_W + 320)) - 260;
  ctx.fillStyle = '#334155';
  ctx.fillRect(trainX, 260, 220, 30);
  ctx.fillStyle = '#38bdf8';
  for (let wx = 12; wx < 200; wx += 28) {
    ctx.fillRect(trainX + wx, 267, 18, 12);
  }

  // Animated Pixel Rain
  ctx.fillStyle = 'rgba(186, 230, 253, 0.25)';
  for (let i = 0; i < 45; i++) {
    const rx = (i * 89 + Math.floor(nowMs * 0.08)) % ARENA_W;
    const ry = (i * 53 + Math.floor(nowMs * 0.45)) % FLOOR_Y;
    ctx.fillRect(rx, ry, 2, 12);
  }

  // Wet Asphalt & Neon Reflections
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, FLOOR_Y, ARENA_W, ARENA_H - FLOOR_Y);
  ctx.fillStyle = '#e879f9';
  ctx.fillRect(0, FLOOR_Y, ARENA_W, 5);
  ctx.fillStyle = 'rgba(232, 121, 249, 0.14)';
  ctx.fillRect(100, FLOOR_Y + 14, 180, 12);
  ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
  ctx.fillRect(580, FLOOR_Y + 24, 210, 14);
}

function drawVolcanoShrine(ctx: CanvasRenderingContext2D, nowMs: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, ARENA_H);
  sky.addColorStop(0, '#140505');
  sky.addColorStop(0.55, '#3b0b0b');
  sky.addColorStop(1, '#7c2d12');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);

  // Volcanic Mountains
  ctx.fillStyle = '#1c0a0a';
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(190, 210);
  ctx.lineTo(390, FLOOR_Y);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(520, FLOOR_Y);
  ctx.lineTo(750, 180);
  ctx.lineTo(960, FLOOR_Y);
  ctx.closePath();
  ctx.fill();

  // Central Torii Shrine Gate
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(360, FLOOR_Y - 190, 20, 190);
  ctx.fillRect(580, FLOOR_Y - 190, 20, 190);
  ctx.fillRect(330, FLOOR_Y - 196, 300, 18);
  ctx.fillRect(348, FLOOR_Y - 156, 264, 12);
  ctx.fillStyle = '#18181b';
  ctx.fillRect(322, FLOOR_Y - 204, 316, 10);

  // Rising Fire Embers
  for (let i = 0; i < 32; i++) {
    const ex = (i * 113 + Math.sin(nowMs / 400 + i) * 18) % ARENA_W;
    const ey = FLOOR_Y - ((Math.floor(nowMs * 0.09) + i * 37) % 360);
    ctx.fillStyle = i % 2 === 0 ? '#fb923c' : '#fde047';
    ctx.fillRect(ex, ey, 4, 4);
  }

  // Basalt Stone Floor + Lava Seams
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, FLOOR_Y, ARENA_W, ARENA_H - FLOOR_Y);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(0, FLOOR_Y, ARENA_W, 5);
  ctx.fillStyle = '#ea580c';
  for (let fx = 40; fx < ARENA_W; fx += 96) {
    ctx.fillRect(fx, FLOOR_Y + 18, 42, 6);
  }
}

function drawFrozenPeak(ctx: CanvasRenderingContext2D, nowMs: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, ARENA_H);
  sky.addColorStop(0, '#020617');
  sky.addColorStop(0.5, '#082f49');
  sky.addColorStop(1, '#164e63');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);

  // Aurora Borealis Ribbons
  const pulse = Math.sin(nowMs / 700) * 12;
  ctx.fillStyle = 'rgba(34, 211, 238, 0.18)';
  ctx.fillRect(80, 60 + pulse, 360, 32);
  ctx.fillStyle = 'rgba(52, 211, 153, 0.16)';
  ctx.fillRect(320, 90 - pulse, 440, 28);

  // Ice Crystal Spires
  const spires = [
    { x: 40, w: 60, h: 210 },
    { x: 130, w: 48, h: 150 },
    { x: 740, w: 64, h: 230 },
    { x: 840, w: 56, h: 170 },
  ];
  spires.forEach((sp) => {
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(sp.x, FLOOR_Y - sp.h, sp.w, sp.h);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(sp.x, FLOOR_Y - sp.h, 10, sp.h);
  });

  // Falling Snowflakes
  ctx.fillStyle = 'rgba(224, 242, 254, 0.8)';
  for (let i = 0; i < 40; i++) {
    const sx = (i * 97 + Math.sin(nowMs / 600 + i) * 20) % ARENA_W;
    const sy = (i * 41 + Math.floor(nowMs * 0.06)) % FLOOR_Y;
    ctx.fillRect(sx, sy, 3, 3);
  }

  // Ice Arena Floor
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, FLOOR_Y, ARENA_W, ARENA_H - FLOOR_Y);
  ctx.fillStyle = '#67e8f9';
  ctx.fillRect(0, FLOOR_Y, ARENA_W, 6);
  ctx.fillStyle = 'rgba(103, 232, 249, 0.22)';
  ctx.fillRect(80, FLOOR_Y + 18, 220, 8);
  ctx.fillRect(580, FLOOR_Y + 26, 260, 8);
}
