/**
 * Dedicated 16-bit retro chiptune BGM engine for Vibe Fighter.
 * Synthesizes 3 distinct looping tracks via Web Audio API:
 * - 'menu': Atmospheric heroic arcade title theme
 * - 'select': Energetic character & map select groove
 * - 'battle': Fast-paced combat & boss arena theme
 */

export type VibeMusicTrack = 'menu' | 'select' | 'battle';

interface TrackStep {
  lead: number | null;
  bass: number | null;
  arp?: number | null;
  kick?: boolean;
  snare?: boolean;
}

interface TrackDefinition {
  stepMs: number;
  leadType: OscillatorType;
  bassType: OscillatorType;
  steps: TrackStep[];
}

// MIDI note helper -> frequency in Hz
const n = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

// Note constants
const A2 = n(45), C3 = n(48), D3 = n(50), E3 = n(52), F3 = n(53), G3 = n(55), A3 = n(57), B3 = n(59);
const C4 = n(60), D4 = n(62), E4 = n(64), F4 = n(65), G4 = n(67), Ab4 = n(68), A4 = n(69), Bb4 = n(70), B4 = n(71);
const C5 = n(72), D5 = n(74), E5 = n(76), F5 = n(77), G5 = n(79), A5 = n(81);

const TRACKS: Record<VibeMusicTrack, TrackDefinition> = {
  // 1. Main Menu Theme — Heroic synthwave arcade pulse (~112 BPM 8th notes)
  menu: {
    stepMs: 260,
    leadType: 'triangle',
    bassType: 'sawtooth',
    steps: [
      { lead: A4, bass: A2, arp: E4, kick: true },
      { lead: null, bass: A2, arp: A4 },
      { lead: E5, bass: A2, arp: C5 },
      { lead: D5, bass: A2, arp: E4, snare: true },
      { lead: C5, bass: F3, arp: A4, kick: true },
      { lead: null, bass: F3, arp: C5 },
      { lead: B4, bass: G3, arp: D5 },
      { lead: C5, bass: G3, arp: G4, snare: true },
      { lead: A4, bass: F3, arp: C5, kick: true },
      { lead: G4, bass: F3, arp: A4 },
      { lead: E4, bass: C3, arp: G4 },
      { lead: G4, bass: C3, arp: E4, snare: true },
      { lead: A4, bass: D3, arp: F4, kick: true },
      { lead: B4, bass: D3, arp: A4 },
      { lead: C5, bass: E3, arp: Ab4 },
      { lead: E5, bass: E3, arp: B4, snare: true },
    ],
  },

  // 2. Character & Map Select Theme — Crisp upbeat arcade groove (~136 BPM 16th-feel)
  select: {
    stepMs: 185,
    leadType: 'square',
    bassType: 'triangle',
    steps: [
      { lead: C5, bass: C3, arp: G4, kick: true },
      { lead: null, bass: null, arp: E4 },
      { lead: E5, bass: C3, arp: G4, snare: true },
      { lead: G5, bass: G3, arp: C5 },
      { lead: E5, bass: A2, arp: A4, kick: true },
      { lead: D5, bass: null, arp: E4 },
      { lead: C5, bass: F3, arp: A4, snare: true },
      { lead: D5, bass: G3, arp: B4 },
      { lead: E5, bass: C3, arp: C5, kick: true },
      { lead: G5, bass: null, arp: G4 },
      { lead: A5, bass: F3, arp: C5, snare: true },
      { lead: G5, bass: G3, arp: B4 },
      { lead: E5, bass: A2, arp: C5, kick: true },
      { lead: C5, bass: G3, arp: G4 },
      { lead: D5, bass: F3, arp: A4, snare: true },
      { lead: B4, bass: G3, arp: D4 },
    ],
  },

  // 3. Battle Combat Theme — High-energy 16-bit fighting anthem (~152 BPM)
  battle: {
    stepMs: 145,
    leadType: 'square',
    bassType: 'sawtooth',
    steps: [
      { lead: E5, bass: E3, arp: B4, kick: true },
      { lead: E5, bass: E3, arp: G4 },
      { lead: G5, bass: E3, arp: B4, snare: true },
      { lead: E5, bass: E3, arp: E4 },
      { lead: D5, bass: D3, arp: A4, kick: true },
      { lead: C5, bass: D3, arp: F4 },
      { lead: D5, bass: G3, arp: B4, snare: true },
      { lead: B4, bass: G3, arp: G4 },
      { lead: C5, bass: C3, arp: G4, kick: true },
      { lead: D5, bass: C3, arp: E4 },
      { lead: E5, bass: A2, arp: C5, snare: true },
      { lead: G5, bass: A2, arp: E5 },
      { lead: F5, bass: F3, arp: C5, kick: true },
      { lead: E5, bass: F3, arp: A4 },
      { lead: D5, bass: B3, arp: Bb4, snare: true },
      { lead: B4, bass: B3, arp: F4 },
    ],
  },
};

class VibeMusicPlayer {
  private ctx: AudioContext | null = null;
  private timerId: number | null = null;
  private currentTrack: VibeMusicTrack | null = null;
  private stepIdx: number = 0;
  private muted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.noiseBuffer) {
      const length = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureCtx();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    if (mute) {
      this.clearTimer();
    } else if (this.currentTrack) {
      const track = this.currentTrack;
      this.currentTrack = null;
      this.playTrack(track);
    }
  }

  private clearTimer() {
    if (this.timerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public stop() {
    this.clearTimer();
    this.currentTrack = null;
    this.stepIdx = 0;
  }

  public playTrack(track: VibeMusicTrack) {
    if (this.currentTrack === track && this.timerId !== null) {
      this.ensureCtx();
      return;
    }

    this.clearTimer();
    this.currentTrack = track;
    this.stepIdx = 0;

    if (this.muted) return;

    const def = TRACKS[track];
    const playStep = () => {
      if (this.muted || this.currentTrack !== track) return;
      const ctx = this.ensureCtx();
      if (!ctx || ctx.state !== 'running') return;

      const step = def.steps[this.stepIdx % def.steps.length];
      this.stepIdx = (this.stepIdx + 1) % def.steps.length;

      const now = ctx.currentTime;
      const dur = (def.stepMs / 1000) * 0.85;

      // Lead voice
      if (step.lead) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = def.leadType;
        osc.frequency.setValueAtTime(step.lead, now);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.002, now + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.01);
      }

      // Bass voice
      if (step.bass) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = def.bassType;
        osc.frequency.setValueAtTime(step.bass, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.002, now + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.01);
      }

      // Arpeggio shimmer
      if (step.arp) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(step.arp, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur * 0.72);
      }

      // Retro Kick
      if (step.kick) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(125, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.08);
        gain.gain.setValueAtTime(0.085, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }

      // Retro Snare noise
      if (step.snare && this.noiseBuffer) {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(now);
      }
    };

    playStep();
    this.timerId = window.setInterval(playStep, def.stepMs);
  }
}

export const vibeMusic = new VibeMusicPlayer();
