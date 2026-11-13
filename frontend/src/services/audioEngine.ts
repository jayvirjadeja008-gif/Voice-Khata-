/**
 * Web Audio API Acoustic Engine & Shop-Noise Simulator
 * Provides real-time frequency spectrum analysis, DSP noise cancellation,
 * synthetic street rumble/horns for live judging, and tactile audio feedback.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dspHighPass: BiquadFilterNode | null = null;
  private dspLowPass: BiquadFilterNode | null = null;
  private dspNotch: BiquadFilterNode | null = null;

  // Noise Simulator Nodes
  private noiseGainNode: GainNode | null = null;
  private trafficSource: AudioBufferSourceNode | null = null;
  private chatterSource: AudioBufferSourceNode | null = null;
  private hornIntervalTimer: number | null = null;

  private isNoiseActive = false;
  private isDspActive = true;
  private currentSnrDb = -3;

  private freqDataArray: Uint8Array<ArrayBuffer> | null = null;
  private timeDataArray: Uint8Array<ArrayBuffer> | null = null;

  public async initContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      const ctx = await this.initContext();
      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false, // keep raw to demonstrate our DSP in hackathon
            autoGainControl: true
          }
        });
      }

      this.micSource = ctx.createMediaStreamSource(this.micStream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      // DSP Filter Chain (120Hz High-pass, 3800Hz Low-pass, 50Hz Notch)
      this.dspHighPass = ctx.createBiquadFilter();
      this.dspHighPass.type = 'highpass';
      this.dspHighPass.frequency.value = 140;

      this.dspLowPass = ctx.createBiquadFilter();
      this.dspLowPass.type = 'lowpass';
      this.dspLowPass.frequency.value = 3600;

      this.dspNotch = ctx.createBiquadFilter();
      this.dspNotch.type = 'notch';
      this.dspNotch.frequency.value = 50;

      this.reconnectChain();

      const bufferLength = this.analyser.frequencyBinCount;
      this.freqDataArray = new Uint8Array(bufferLength);
      this.timeDataArray = new Uint8Array(bufferLength);

      return true;
    } catch {
      // Return false if mic permission denied
      return false;
    }
  }

  private reconnectChain(): void {
    if (!this.ctx || !this.micSource || !this.analyser) return;

    try {
      this.micSource.disconnect();
      if (this.dspHighPass) this.dspHighPass.disconnect();
      if (this.dspLowPass) this.dspLowPass.disconnect();
      if (this.dspNotch) this.dspNotch.disconnect();

      if (this.isDspActive && this.dspHighPass && this.dspLowPass && this.dspNotch) {
        // Microphone -> HighPass -> LowPass -> Notch -> Analyser
        this.micSource.connect(this.dspHighPass);
        this.dspHighPass.connect(this.dspLowPass);
        this.dspLowPass.connect(this.dspNotch);
        this.dspNotch.connect(this.analyser);
      } else {
        // Direct bypass
        this.micSource.connect(this.analyser);
      }
    } catch {
      // Ignore disconnect errors
    }
  }

  public setDspActive(active: boolean): void {
    this.isDspActive = active;
    this.reconnectChain();
  }

  public isDspEnabled(): boolean {
    return this.isDspActive;
  }

  // --- Synthetic Shop-Noise Generator (Live Judging Simulator) ---
  public toggleShopNoise(enable?: boolean, snrDb = -3): boolean {
    const shouldEnable = enable !== undefined ? enable : !this.isNoiseActive;
    this.currentSnrDb = snrDb;

    if (shouldEnable) {
      this.startShopNoise(snrDb);
    } else {
      this.stopShopNoise();
    }

    return this.isNoiseActive;
  }

  public isNoiseRunning(): boolean {
    return this.isNoiseActive;
  }

  public getSnrDb(): number {
    return this.currentSnrDb;
  }

  private startShopNoise(snrDb: number): void {
    if (!this.ctx) return;
    this.stopShopNoise();

    this.isNoiseActive = true;
    const ctx = this.ctx;

    // Convert SNR to linear gain: -6dB = louder noise, 0dB = moderate noise
    const gainVal = snrDb <= -6 ? 0.28 : snrDb <= -3 ? 0.16 : 0.08;

    this.noiseGainNode = ctx.createGain();
    this.noiseGainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
    this.noiseGainNode.connect(ctx.destination);

    // If analyser is running, also connect noise to analyser so judges see acoustic clutter
    if (this.analyser) {
      this.noiseGainNode.connect(this.analyser);
    }

    // 1. Procedural Traffic Low-frequency Rumble (Brown Noise)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    this.trafficSource = ctx.createBufferSource();
    this.trafficSource.buffer = noiseBuffer;
    this.trafficSource.loop = true;

    const trafficFilter = ctx.createBiquadFilter();
    trafficFilter.type = 'lowpass';
    trafficFilter.frequency.value = 240;

    this.trafficSource.connect(trafficFilter);
    trafficFilter.connect(this.noiseGainNode);
    this.trafficSource.start();

    // 2. Crowd Chatter Murmur
    const chatterBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const chatterData = chatterBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      chatterData[i] = (Math.random() * 2 - 1) * 0.4;
    }
    this.chatterSource = ctx.createBufferSource();
    this.chatterSource.buffer = chatterBuffer;
    this.chatterSource.loop = true;

    const chatterFilter = ctx.createBiquadFilter();
    chatterFilter.type = 'bandpass';
    chatterFilter.frequency.value = 850;
    chatterFilter.Q.value = 1.2;

    this.chatterSource.connect(chatterFilter);
    chatterFilter.connect(this.noiseGainNode);
    this.chatterSource.start();

    // 3. Periodic Auto / Scooter Horn Bursts
    this.scheduleNextHorn();
  }

  private scheduleNextHorn(): void {
    if (!this.isNoiseActive || !this.ctx) return;

    const delayMs = 3000 + Math.random() * 4000;
    this.hornIntervalTimer = window.setTimeout(() => {
      this.playHornBurst();
      this.scheduleNextHorn();
    }, delayMs);
  }

  private playHornBurst(): void {
    if (!this.ctx || !this.isNoiseActive || !this.noiseGainNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const hornGain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(430, now);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(540, now);

    hornGain.gain.setValueAtTime(0, now);
    hornGain.gain.linearRampToValueAtTime(0.09, now + 0.05);
    hornGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(hornGain);
    osc2.connect(hornGain);
    hornGain.connect(this.noiseGainNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  }

  public stopShopNoise(): void {
    this.isNoiseActive = false;
    if (this.hornIntervalTimer) {
      clearTimeout(this.hornIntervalTimer);
      this.hornIntervalTimer = null;
    }
    try {
      if (this.trafficSource) {
        this.trafficSource.stop();
        this.trafficSource.disconnect();
        this.trafficSource = null;
      }
      if (this.chatterSource) {
        this.chatterSource.stop();
        this.chatterSource.disconnect();
        this.chatterSource = null;
      }
      if (this.noiseGainNode) {
        this.noiseGainNode.disconnect();
        this.noiseGainNode = null;
      }
    } catch {
      // Ignore audio stop errors
    }
  }

  // Frequency spectrum reading for 60fps canvas & 3D WebGL
  public getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.freqDataArray) {
      return new Uint8Array(256);
    }
    this.analyser.getByteFrequencyData(this.freqDataArray);
    return this.freqDataArray;
  }

  public getTimeDomainData(): Uint8Array {
    if (!this.analyser || !this.timeDataArray) {
      return new Uint8Array(256).fill(128);
    }
    this.analyser.getByteTimeDomainData(this.timeDataArray);
    return this.timeDataArray;
  }

  // --- Tactile Hardware Audio Cues ---
  public playMechanicalClick(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.015);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  public playCommitPip(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1760, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playDisambiguationBeep(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }
}

export const audioEngine = new AudioEngine();

