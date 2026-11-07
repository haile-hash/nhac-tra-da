import { IS_STAGE } from './page';
import { containsBanned } from './bannedWords';

interface Line {
  text: string;
  at: number;
  done?: () => void;
  start?: () => void;
  valid?: () => boolean;
  keep?: boolean;
}

type Who = 'M' | 'F' | 'E';

const MAX_WAIT_MS = 60_000;
const MAX_QUEUE = 30;

class Voice {
  private normal: Line[] = [];
  private priority: Line[] = [];
  private playing = false;
  private current: HTMLAudioElement | null = null;
  private lastSpokeAt = Date.now();
  rate = readRate();
  volume = 1;
  enabled = IS_STAGE;
  teacher: 'f' | 'm' = 'f';
  onSpeaker?: (who: 'M' | 'F' | null) => void;

  say(text: string, priority = false, done?: () => void, keep = false, start?: () => void, valid?: () => boolean) {
    if (!this.enabled || !text.trim()) {
      if (start) setTimeout(start, 0);
      if (done) setTimeout(done, 0);
      return;
    }
    const q = priority ? this.priority : this.normal;
    q.push({ text: text.trim(), at: Date.now(), done, keep, start, valid });
    if (priority) for (const p of this.parts(text)) fetch(this.urlOf(p)).catch(() => {});
    if (q.length > MAX_QUEUE) q.shift()?.done?.();
    void this.next();
  }

  stop() {
    for (const l of [...this.normal, ...this.priority]) l.done?.();
    this.normal = [];
    this.priority = [];
    this.current?.pause();
    this.current = null;
    this.playing = false;
  }

  get busy() {
    return this.playing || this.normal.length + this.priority.length > 0;
  }

  get waiting() {
    return this.normal.length;
  }

  get waitingPriority() {
    return this.priority.length;
  }

  quietForMs(now = Date.now()) {
    return this.busy ? 0 : now - this.lastSpokeAt;
  }

  private parts(text: string) {
    let who: Who = 'F';
    const out: { who: Who; hype: boolean; text: string }[] = [];
    for (let raw of text.split('|')) {
      raw = raw.trim();
      const sp = /^(M|F|E):\s*/.exec(raw);
      if (sp) {
        who = sp[1] as Who;
        raw = raw.slice(sp[0].length);
      }
      const t = raw.replace(/^\^+/, '');
      if (t) out.push({ who, hype: raw.startsWith('^'), text: t });
    }
    return out;
  }

  private urlOf(p: { who: Who; hype: boolean; text: string }) {
    const v = p.who === 'F' ? `&v=${this.teacher}` : p.who === 'E' ? '&v=en' : '';
    return `/api/tts?rate=${this.rate}${p.hype ? '&hype=1' : ''}${v}&text=${encodeURIComponent(p.text)}`;
  }

  private async next() {
    if (this.playing) return;
    const now = Date.now();
    let line: Line | undefined;
    while ((line = this.priority.shift() ?? this.normal.shift())) {
      if (line.valid && !line.valid()) {
        line.done?.();
        continue;
      }
      if (line.keep || now - line.at < MAX_WAIT_MS) break;
      line.done?.();
    }
    if (!line) return;
    this.playing = true;
    line.start?.();
    try {
      for (const part of this.parts(line.text)) {
        this.onSpeaker?.(part.who === 'E' ? 'F' : part.who);
        const audio = new Audio(this.urlOf(part));
        audio.volume = this.volume;
        this.current = audio;
        await new Promise<void>((resolve) => {
          let over = false;
          let guard = setTimeout(finish, 8000);
          function finish() {
            if (over) return;
            over = true;
            clearTimeout(guard);
            audio.pause();
            if (!audio.ended) {
              audio.removeAttribute('src');
              audio.load();
            }
            resolve();
          }

          const updateGuard = () => {
            if (over) return;
            clearTimeout(guard);
            const d = audio.duration;
            const ms = (Number.isFinite(d) && d > 0.1) ? d * 1000 + 4000 : 40_000;
            guard = setTimeout(finish, ms);
          };

          audio.onplaying = updateGuard;
          audio.ondurationchange = updateGuard;
          audio.onended = finish;
          audio.onerror = finish;

          const tryPlay = (left: number) => {
            if (over) return;
            audio.play().catch(() => (left > 0 && !over ? setTimeout(() => tryPlay(left - 1), 1500) : finish()));
          };
          tryPlay(4);
        });
        if (this.current !== audio) break;
      }
    } finally {
      this.onSpeaker?.(null);
      line.done?.();
      this.current = null;
      this.playing = false;
      this.lastSpokeAt = Date.now();
      void this.next();
    }
  }
}

function readRate() {
  try {
    const r = Number(localStorage.getItem('voice-rate'));
    return r >= 0.5 && r <= 1.5 ? r : 1.0;
  } catch {
    return 1.0;
  }
}

export const voice = new Voice();
export { speakableName } from './live/names';