/**
 * Web Speech Recognition & Wake-Phrase Engine
 * Supports Indic code-mixed inputs (hi-IN, en-IN), real-time streaming,
 * wake-phrase detection ("Suno Khata", "Voice Khata"), and simulated test injection.
 */

type SpeechRecognitionCallback = (transcript: string, isFinal: boolean) => void;
type StatusCallback = (isListening: boolean, error?: string) => void;

interface IWindow extends Window {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onend: () => void;
  onerror: (e: { error: string }) => void;
  onresult: (e: {
    resultIndex: number;
    results: Array<{
      isFinal: boolean;
      [index: number]: { transcript: string };
    }>;
  }) => void;
}

class SpeechRecognitionEngine {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private lang = 'hi-IN';
  private onTranscript: SpeechRecognitionCallback | null = null;
  private onStatus: StatusCallback | null = null;
  private simulationTimer: number | null = null;

  constructor() {
    this.initNativeEngine();
  }

  private initNativeEngine(): void {
    const win = window as unknown as IWindow;
    const SpeechRec = (win.SpeechRecognition || win.webkitSpeechRecognition) as {
      new (): SpeechRecognitionInstance;
    } | undefined;

    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.lang;

        this.recognition.onstart = () => {
          this.isListening = true;
          if (this.onStatus) this.onStatus(true);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onStatus) this.onStatus(false);
        };

        this.recognition.onerror = (e) => {
          this.isListening = false;
          if (this.onStatus) this.onStatus(false, e.error);
        };

        this.recognition.onresult = (e) => {
          let interim = '';
          let final = '';

          for (let i = e.resultIndex; i < e.results.length; ++i) {
            const res = e.results[i];
            if (res.isFinal) {
              final += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }
          }

          const rawText = (final || interim).trim();
          // Filter wake phrase if spoken as prefix
          const cleanedText = this.stripWakePhrase(rawText);

          if (this.onTranscript && cleanedText) {
            this.onTranscript(cleanedText, Boolean(final));
          }
        };
      } catch {
        this.recognition = null;
      }
    }
  }

  public setLanguage(lang: 'hi-IN' | 'en-IN' | 'kn-IN' | 'ta-IN'): void {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public getLanguage(): string {
    return this.lang;
  }

  public isAvailable(): boolean {
    return Boolean(this.recognition);
  }

  public isActivelyListening(): boolean {
    return this.isListening;
  }

  public subscribe(onTranscript: SpeechRecognitionCallback, onStatus: StatusCallback): void {
    this.onTranscript = onTranscript;
    this.onStatus = onStatus;
  }

  public startListening(): boolean {
    if (this.simulationTimer) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.start();
        return true;
      } catch {
        // May already be active
        return false;
      }
    } else {
      if (this.onStatus) this.onStatus(false, 'Speech recognition not supported in this browser.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop error
      }
    }
    this.isListening = false;
    if (this.onStatus) this.onStatus(false);
  }

  private stripWakePhrase(text: string): string {
    const wakePhrases = [
      /^suno\s+khata\b/i,
      /^voice\s+khata\b/i,
      /^khata\b/i,
      /^hey\s+khata\b/i
    ];
    let cleaned = text;
    for (const wp of wakePhrases) {
      cleaned = cleaned.replace(wp, '').trim();
    }
    return cleaned || text;
  }

  // --- Simulated Audio Stream for Judge Quick-Deck ---
  public injectSimulatedStream(fullText: string, onProgress?: (partial: string) => void): Promise<string> {
    return new Promise((resolve) => {
      this.stopListening();
      if (this.onStatus) this.onStatus(true);

      const words = fullText.split(' ');
      let currentWordIdx = 0;
      let accumulated = '';

      const stepInterval = Math.max(90, Math.min(220, 1400 / words.length));

      const streamWord = () => {
        if (currentWordIdx < words.length) {
          accumulated += (currentWordIdx > 0 ? ' ' : '') + words[currentWordIdx];
          currentWordIdx++;

          if (this.onTranscript) {
            this.onTranscript(accumulated, currentWordIdx === words.length);
          }
          if (onProgress) {
            onProgress(accumulated);
          }

          this.simulationTimer = window.setTimeout(streamWord, stepInterval);
        } else {
          if (this.onStatus) this.onStatus(false);
          this.simulationTimer = null;
          resolve(accumulated);
        }
      };

      streamWord();
    });
  }
}

export const speechRecognitionEngine = new SpeechRecognitionEngine();

