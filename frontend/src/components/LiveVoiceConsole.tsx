import React from 'react';
import { HardwareCountertop3D } from './HardwareCountertop3D';
import { AudioOscilloscope } from './AudioOscilloscope';
import { AstInspector } from './AstInspector';
import { ParsedTransactionClause, VoiceLatencyMetrics } from '../types/khata';

interface LiveVoiceConsoleProps {
  isListening: boolean;
  onToggleListening: () => void;
  rawTranscript: string;
  interimTranscript: string;
  clauses: ParsedTransactionClause[];
  isNoiseActive: boolean;
  onToggleNoise: (enable?: boolean, snrDb?: number) => void;
  snrDb: number;
  dspActive: boolean;
  onToggleDsp: (active: boolean) => void;
  language: 'hi-IN' | 'en-IN' | 'kn-IN' | 'ta-IN';
  onLanguageChange: (lang: 'hi-IN' | 'en-IN' | 'kn-IN' | 'ta-IN') => void;
  latencyMetrics: VoiceLatencyMetrics;
  onManualTextSubmit?: (text: string) => void;
}

export const LiveVoiceConsole: React.FC<LiveVoiceConsoleProps> = ({
  isListening,
  onToggleListening,
  rawTranscript,
  interimTranscript,
  clauses,
  isNoiseActive,
  onToggleNoise,
  snrDb,
  dspActive,
  onToggleDsp,
  language,
  onLanguageChange,
  latencyMetrics,
  onManualTextSubmit
}) => {
  const [manualInput, setManualInput] = React.useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim() && onManualTextSubmit) {
      onManualTextSubmit(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className="w-full text-[#F4F1EA]">
      {/* Direct Hero Header (Strictly Anti-Slop, No Em Dashes) */}
      <div className="p-6 bg-[#141413] border border-[#2D2D2A] mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#232320]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 bg-[#D9381E] inline-block" />
              <span className="font-mono-tech text-xs text-[#C88A2B] font-bold">
                [PS2: GNANI VOICE HACKATHON // DUAL-ENTRY INDIC LEDGER]
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F4F1EA] mb-2 font-mono-tech leading-snug">
              Voice Khata: Hands-Free Indic Audio Ledger for High-Noise Counters.
            </h1>
            <p className="text-sm md:text-base text-[#A8A49C] max-w-4xl leading-relaxed">
              Speak code-mixed Hindi, Kannada, Tamil, or English mid-sale. Parses customer entities, relative dates, and spoken corrections in under 2000ms without touching the glass.
            </p>
          </div>

          {/* Quick Hardware Telemetry Badges */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 font-mono-tech text-xs shrink-0">
            <div className="px-3 py-2 border border-[#33322E] bg-[#1A1A18] flex items-center justify-between gap-4">
              <span className="text-[#8E8A82]">STT RESPONSE TIME:</span>
              <span className="text-[#C88A2B] font-bold text-sm">
                {latencyMetrics.ttfaMs ? `[TTFA: ${latencyMetrics.ttfaMs}ms]` : '[READY]'}
              </span>
            </div>
            <div className="px-3 py-2 border border-[#33322E] bg-[#1A1A18] flex items-center justify-between gap-4">
              <span className="text-[#8E8A82]">SECURITY AT REST:</span>
              <span className="text-[#2DB84D] font-bold text-sm">[AES-GCM-256]</span>
            </div>
          </div>
        </div>

        {/* Tactical Control Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 font-mono-tech text-xs sm:text-sm">
          {/* Language Selector */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#8E8A82]">LOCALE:</span>
            {(
              [
                { id: 'hi-IN', label: 'HINDI (हिन्दी)' },
                { id: 'en-IN', label: 'ENGLISH (INDIC)' },
                { id: 'kn-IN', label: 'KANNADA (ಕನ್ನಡ)' },
                { id: 'ta-IN', label: 'TAMIL (தமிழ்)' }
              ] as const
            ).map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => onLanguageChange(lang.id)}
                className={`px-2.5 py-1 text-xs border ${
                  language === lang.id
                    ? 'border-[#C88A2B] bg-[#292215] text-[#C88A2B] font-bold'
                    : 'border-[#2D2D2A] bg-[#1A1A18] text-[#8E8A82] hover:text-[#F4F1EA]'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Shop-Noise Simulator Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8E8A82]">NOISE SIMULATOR:</span>
            <button
              type="button"
              onClick={() => onToggleNoise(!isNoiseActive, snrDb)}
              className={`mech-btn text-xs px-3 py-1.5 ${
                isNoiseActive ? 'mech-btn-primary' : 'mech-btn-ghost text-[#A8A49C]'
              }`}
            >
              {isNoiseActive ? `[NOISE ON: ${snrDb}dB SNR]` : '[TEST NOISE]'}
            </button>
            <button
              type="button"
              onClick={() => onToggleDsp(!dspActive)}
              className={`mech-btn text-xs px-3 py-1.5 ${
                dspActive ? 'mech-btn-brass' : 'mech-btn-ghost text-[#8E8A82]'
              }`}
            >
              {dspActive ? '[DSP ACTIVE]' : '[DSP BYPASS]'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Hardware Grid: 3D Countertop + 60fps Oscilloscope */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Left Column: 3D Hardware Countertop Unit */}
        <div className="lg:col-span-7">
          <HardwareCountertop3D
            isListening={isListening}
            onToggleListening={onToggleListening}
            dspActive={dspActive}
            isNoiseActive={isNoiseActive}
          />
        </div>

        {/* Right Column: 60fps Audio Oscilloscope & Live Transcript */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Oscilloscope */}
          <AudioOscilloscope
            isListening={isListening}
            isNoiseActive={isNoiseActive}
            snrDb={snrDb}
            dspActive={dspActive}
          />

          {/* Push-to-Talk Big Tactile Banner */}
          <div className="p-4 bg-[#1B1B19] border border-[#2D2D2A]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono-tech text-[#8E8A82]">
                PUSH_TO_TALK_CONTROL // SPACEBAR_HOTKEY
              </span>
              <span className="text-xs font-mono-tech text-[#C88A2B] font-bold">
                {isListening ? '[ACQUIRING AUDIO...]' : '[READY]'}
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleListening}
              className={`mech-btn w-full py-3.5 text-sm font-bold tracking-wider ${
                isListening ? 'mech-btn-primary animate-pulse' : 'mech-btn-brass'
              }`}
            >
              {isListening ? '[CLICK TO STOP / COMMIT BUFFER]' : '[PUSH TO TALK / PRESS SPACEBAR]'}
            </button>

            {/* Quick manual transcription submit fallback */}
            <form onSubmit={handleManualSubmit} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Type or paste noisy counter phrase to test parser..."
                className="mech-input flex-1 text-sm py-2"
              />
              <button type="submit" className="mech-btn mech-btn-light text-xs py-2 px-4">
                [TEST]
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Real-time Voice Transcript Streaming Ribbon */}
      <div className="p-4 bg-[#161614] border border-[#2B2B28] mb-4 font-mono-tech">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#232320] text-xs text-[#8E8A82]">
          <div className="flex items-center gap-2">
            <span className={`mech-led ${isListening ? 'active-red' : ''}`} />
            <span className="font-bold">LIVE_AUDIO_INGESTION_BUFFER</span>
          </div>
          <span>WAKE PHRASES: "Khata", "Suno Khata", "Voice Khata"</span>
        </div>
        <div className="text-base md:text-lg min-h-[46px] flex items-center">
          {rawTranscript || interimTranscript ? (
            <div className="text-[#F4F1EA] font-semibold">
              <span>{rawTranscript}</span>
              {interimTranscript && (
                <span className="text-[#C88A2B] ml-2 italic">{interimTranscript}</span>
              )}
              {isListening && <span className="inline-block w-2.5 h-5 bg-[#D9381E] ml-2 animate-ping" />}
            </div>
          ) : (
            <span className="text-sm text-[#575550]">
              Say e.g.: "Ramesh ka 340 udhaar, kal 200 diya tha" or "Suresh ka 500 udhaar... nahi, 430"
            </span>
          )}
        </div>
      </div>

      {/* Real-Time Abstract Syntax Tree Inspector */}
      <AstInspector clauses={clauses} rawTranscript={rawTranscript || interimTranscript} />
    </div>
  );
};
