// Procedural Web Audio API Sound Synthesizer for Hill Climb Racing v5
// Realistic Combustion Engine Rumble, 4-Stroke Idle Throb, Authentic Coin & Diamond Chimes

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.isEngineRunning = false;
    this.lastLowFuelBeep = 0;
    this.lastSquealTime = 0;

    // Engine audio nodes
    this.engineGain = null;
    this.engineFilter = null;
    this.oscLow = null;      // Deep sub-bass rumble
    this.oscPiston = null;   // Piston stroke harmonic
    this.oscThrob = null;    // 4-stroke cylinder pulse LFO
    this.throbGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(this.muted ? 0 : 0.14, this.ctx.currentTime);
    }
    return this.muted;
  }

  startEngine() {
    if (!this.ctx || this.isEngineRunning) return;
    try {
      const now = this.ctx.currentTime;

      // 1. Oscillators
      this.oscLow = this.ctx.createOscillator();
      this.oscLow.type = 'triangle';
      this.oscLow.frequency.setValueAtTime(38, now); // Idle fundamental ~38Hz

      this.oscPiston = this.ctx.createOscillator();
      this.oscPiston.type = 'sawtooth';
      this.oscPiston.frequency.setValueAtTime(76, now); // 2nd harmonic

      // 2. 4-Stroke Combustion Pulse LFO
      this.oscThrob = this.ctx.createOscillator();
      this.oscThrob.type = 'sine';
      this.oscThrob.frequency.setValueAtTime(9.5, now); // Idle cylinder firing rhythm ~9.5Hz

      this.throbGain = this.ctx.createGain();
      this.throbGain.gain.setValueAtTime(0.08, now);

      // 3. Resonant Engine Filter (lowpass with punchy Q)
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(320, now);
      this.engineFilter.Q.setValueAtTime(4.2, now);

      // 4. Master Engine Gain
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.muted ? 0 : 0.13, now);

      // Connect LFO to filter frequency for realistic idling throb
      this.oscThrob.connect(this.throbGain);
      this.throbGain.connect(this.engineGain.gain);

      // Routing: Oscillators -> Filter -> EngineGain -> Master Destination
      this.oscLow.connect(this.engineFilter);
      this.oscPiston.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.oscLow.start(now);
      this.oscPiston.start(now);
      this.oscThrob.start(now);
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Audio engine start failed:', e);
    }
  }

  updateEngine(throttle, rpmRatio, speed = 0) {
    if (!this.isEngineRunning || !this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const clampedRpm = Math.min(1.0, Math.max(0, rpmRatio));

      // Realistic engine RPM frequency curve: Idle 38Hz -> Redline 175Hz
      const targetBaseFreq = 38 + clampedRpm * 135;
      const targetPistonFreq = targetBaseFreq * 2.0;
      const throbFreq = 9.5 + clampedRpm * 32.0;

      this.oscLow.frequency.setTargetAtTime(targetBaseFreq, now, 0.06);
      this.oscPiston.frequency.setTargetAtTime(targetPistonFreq, now, 0.06);
      this.oscThrob.frequency.setTargetAtTime(throbFreq, now, 0.06);

      // Filter opens up wide on throttle for throatier exhaust roar
      const filterCutoff = 260 + clampedRpm * 980 + (throttle ? 350 : 0);
      this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.05);

      // Volume dynamics: louder when under throttle load
      const targetVol = throttle ? (0.16 + clampedRpm * 0.06) : (0.09 + clampedRpm * 0.04);
      this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
    } catch (e) {}
  }

  stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.oscLow) { this.oscLow.stop(); this.oscLow.disconnect(); }
      if (this.oscPiston) { this.oscPiston.stop(); this.oscPiston.disconnect(); }
      if (this.oscThrob) { this.oscThrob.stop(); this.oscThrob.disconnect(); }
      if (this.engineFilter) this.engineFilter.disconnect();
      if (this.engineGain) this.engineGain.disconnect();
    } catch (e) {}
    this.isEngineRunning = false;
  }

  // Realistic Arcade Double-Chime Coin Pickup (B5 -> E6)
  playCoin() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;

      // Note 1: B5 (987.77 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now);
      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Note 2: E6 (1318.51 Hz) sharp bright chime
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.06);
      gain2.gain.setValueAtTime(0.24, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.28);
    } catch (e) {}
  }

  // Sparkling Crystal Bell Arpeggio for Diamonds
  playDiamond() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      // C6, E6, G6, C7 crystalline notes
      const notes = [1046.50, 1318.51, 1567.98, 2093.00];

      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {}
  }

  // Realistic Liquid Fuel Tank Gulp ("Glug-glug-glug" + Full Chime)
  playFuel() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;

      // 3 Liquid Gulp Pulses
      const glugs = [
        { freq1: 580, freq2: 360, time: 0 },
        { freq1: 540, freq2: 340, time: 0.08 },
        { freq1: 500, freq2: 320, time: 0.16 }
      ];

      glugs.forEach(g => {
        const t = now + g.time;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(g.freq1, t);
        osc.frequency.exponentialRampToValueAtTime(g.freq2, t + 0.07);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.09);
      });

      // Ascending "Tank Full!" chime
      const chimeStart = now + 0.24;
      const oscChime = this.ctx.createOscillator();
      const gainChime = this.ctx.createGain();

      oscChime.type = 'triangle';
      oscChime.frequency.setValueAtTime(659.25, chimeStart); // E5
      oscChime.frequency.exponentialRampToValueAtTime(1046.50, chimeStart + 0.15); // C6

      gainChime.gain.setValueAtTime(0.22, chimeStart);
      gainChime.gain.exponentialRampToValueAtTime(0.001, chimeStart + 0.35);

      oscChime.connect(gainChime);
      gainChime.connect(this.ctx.destination);

      oscChime.start(chimeStart);
      oscChime.stop(chimeStart + 0.36);
    } catch (e) {}
  }

  // Tire Squeal when braking at speed
  playTireSqueal() {
    if (this.muted || !this.ctx) return;
    const nowMs = Date.now();
    if (nowMs - this.lastSquealTime < 350) return;
    this.lastSquealTime = nowMs;

    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(5.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.19);
    } catch (e) {}
  }

  // Low Fuel Alarm Beep
  playLowFuelWarning() {
    if (this.muted || !this.ctx) return;
    const nowMs = Date.now();
    if (nowMs - this.lastLowFuelBeep < 700) return;
    this.lastLowFuelBeep = nowMs;

    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(750, now);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Suspension Impact / Landing Punch
  playLand(intensity = 0.5) {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;

      // Low punch triangle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.14);

      const vol = Math.min(0.35, 0.14 + intensity * 0.22);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  // Crash Crunch (Metal Impact + White Noise Crunch)
  playCrash() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(550, now);
      filter.frequency.exponentialRampToValueAtTime(70, now + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.45);
    } catch (e) {}
  }

  // Stunt Fanfare (Backflip / Frontflip)
  playStuntFanfare() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      const chordNotes = [523.25, 659.25, 783.99, 1046.50]; // C Major chord
      chordNotes.forEach((freq, idx) => {
        const t = now + idx * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.20, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.32);
      });
    } catch (e) {}
  }
}

window.soundSystem = new SoundSystem();
