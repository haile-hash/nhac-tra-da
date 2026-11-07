class SoundEffects {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  // Tiếng ting-ting khi trả lời đúng
  playCorrect() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Tiếng khi trả lời sai / hết giờ
  playWrong() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Tiếng chuông reo vào lớp / hết tiết
  playBell() {
    this.init();
    if (!this.ctx) return;
    [0, 0.2, 0.4].forEach((delay, idx) => {
      const now = this.ctx!.currentTime + delay;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx % 2 === 0 ? 880 : 659.25, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  // Âm thanh vỗ tay / chúc mừng
  playFanfare() {
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }
}

export const sfx = new SoundEffects();