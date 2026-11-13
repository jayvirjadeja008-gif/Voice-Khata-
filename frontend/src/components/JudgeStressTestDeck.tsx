import React, { useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VoiceLatencyMetrics } from '../types/khata';

export interface TestCase {
  id: string;
  title: string;
  tag: string;
  spokenPhrase: string;
  expectedBehavior: string;
  category: 'SPLIT' | 'CORRECTION' | 'HOMONYM' | 'QUERY' | 'INDIC_NUM' | 'MIXED_LANG';
}

const TEST_CASES: TestCase[] = [
  {
    id: 'test-1-multiclause',
    title: 'Multi-Clause Atomic Transaction Splitting',
    tag: '[MULTI_CLAUSE]',
    spokenPhrase: 'Ramesh ka 340 udhaar, kal 200 diya tha',
    expectedBehavior:
      'Splits automatically into two atomic ledger entries: 1. Ramesh | UDHAAR | +₹340 (Today), 2. Ramesh | JAMA | -₹200 (Yesterday -1d)',
    category: 'SPLIT'
  },
  {
    id: 'test-2-selfcorrect',
    title: 'Spoken Self-Correction State Machine',
    tag: '[IN_STREAM_CORRECTION]',
    spokenPhrase: 'Suresh ka 500 udhaar... nahi, 430',
    expectedBehavior:
      'Mutates uncommitted buffer in real time: strikes through 500 and commits 430 with audit flag [CORRECTED_IN_STREAM]',
    category: 'CORRECTION'
  },
  {
    id: 'test-3-homonym',
    title: 'Homonym Disambiguation Spoken Interruption',
    tag: '[HOMONYM_DISAMBIGUATION]',
    spokenPhrase: 'Ramesh ka 340 udhaar',
    expectedBehavior:
      'Detects 2 pre-populated Ramesh entries (Dairy vs Auto). Fires instant spoken TTS response within 400ms: "Kaunsa Ramesh? Dairy wala ya Auto wala?" and locks in [PENDING_DISAMBIGUATION]',
    category: 'HOMONYM'
  },
  {
    id: 'test-4-query',
    title: 'Sub-2-Second Spoken Query Responder',
    tag: '[SUB_2S_QUERY]',
    spokenPhrase: 'Aaj kitna udhaar gaya?',
    expectedBehavior:
      'Calculates today total credit outstanding and responds via Web Speech Synthesis with live millisecond latency stopwatch ([TTFA: ~380ms])',
    category: 'QUERY'
  },
  {
    id: 'test-5-indicnum',
    title: 'Pure Indic Verbal Number Normalization',
    tag: '[INDIC_PHONETIC_NORMALIZATION]',
    spokenPhrase: 'Pooja ka teen sau chaalis udhaar',
    expectedBehavior:
      'Phonetically normalizes Hindi compound verbal numbers "teen sau chaalis" into exact currency token ₹340.00',
    category: 'INDIC_NUM'
  },
  {
    id: 'test-6-mixedlang',
    title: 'South Indic / English Mixed Counter Transaction',
    tag: '[CODE_MIXED_INDIC]',
    spokenPhrase: 'Anand ka two hundred fifty jama, kal ka baaki',
    expectedBehavior:
      'Parses mixed English/Indic amount ("two hundred fifty") into ₹250.00, classifies JAMA (payment), and anchors relative date',
    category: 'MIXED_LANG'
  }
];

interface JudgeStressTestDeckProps {
  onInjectPhrase: (phrase: string) => void;
  latencyMetrics: VoiceLatencyMetrics;
  isNoiseActive: boolean;
  onToggleNoise: (enable?: boolean, snrDb?: number) => void;
  dspActive: boolean;
  onToggleDsp: (active: boolean) => void;
}

export const JudgeStressTestDeck: React.FC<JudgeStressTestDeckProps> = ({
  onInjectPhrase,
  latencyMetrics,
  isNoiseActive,
  onToggleNoise,
  dspActive,
  onToggleDsp
}) => {
  const [selectedSnr, setSelectedSnr] = useState<-3 | -6 | 0>(-3);
  const [executingTestId, setExecutingTestId] = useState<string | null>(null);

  const handleRunTest = async (testCase: TestCase) => {
    setExecutingTestId(testCase.id);
    audioEngine.playMechanicalClick();
    onInjectPhrase(testCase.spokenPhrase);
    setTimeout(() => {
      setExecutingTestId(null);
    }, 1800);
  };

  const handleSnrChange = (snr: -3 | -6 | 0) => {
    setSelectedSnr(snr);
    if (isNoiseActive) {
      onToggleNoise(true, snr);
    }
  };

  return (
    <div className="w-full text-[#F4F1EA]">
      {/* Top Banner */}
      <div className="p-5 bg-[#141413] border border-[#2D2D2A] mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#232320]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-3 h-3 bg-[#C88A2B] inline-block" />
              <h2 className="text-lg md:text-xl font-bold tracking-wider font-mono-tech uppercase">
                Judge Stress-Test Deck (PS2 - Gnani Voice Evaluation Suite)
              </h2>
            </div>
            <p className="text-sm text-[#A8A49C]">
              Deterministic evaluation suite for live judging. Test multi-clause splitting, spoken self-correction, homonym disambiguation, and acoustic noise resilience.
            </p>
          </div>

          {/* Live Latency Telemetry */}
          <div className="flex items-center gap-3 font-mono-tech text-xs">
            <div className="p-2.5 border border-[#33322E] bg-[#1A1A18] text-right">
              <span className="text-[#8E8A82] block text-[11px]">TIME TO FIRST AUDIO (TTFA)</span>
              <span className="text-base font-bold text-[#C88A2B]">
                {latencyMetrics.ttfaMs ? `[TTFA: ${latencyMetrics.ttfaMs}ms]` : '[READY]'}
              </span>
            </div>
            <div className="p-2.5 border border-[#33322E] bg-[#1A1A18] text-right">
              <span className="text-[#8E8A82] block text-[11px]">END-TO-END LATENCY</span>
              <span className="text-base font-bold text-[#2DB84D]">
                {latencyMetrics.e2eMs ? `[E2E: ${latencyMetrics.e2eMs}ms]` : '< 2000ms'}
              </span>
            </div>
          </div>
        </div>

        {/* Acoustic Shop-Noise Simulator Controls */}
        <div className="mt-4 p-3.5 bg-[#1A1A18] border border-[#282824] flex flex-col sm:flex-row items-center justify-between gap-3.5 font-mono-tech text-xs sm:text-sm">
          <div className="flex items-center gap-3.5">
            <span className="text-[#C88A2B] font-bold">[NOISE_SIMULATOR]:</span>
            <button
              type="button"
              onClick={() => onToggleNoise(!isNoiseActive, selectedSnr)}
              className={`mech-btn text-xs px-3.5 py-1.5 ${
                isNoiseActive ? 'mech-btn-primary' : 'mech-btn-ghost text-[#A8A49C]'
              }`}
            >
              {isNoiseActive ? '[NOISE_RUNNING: ACTIVE]' : '[INJECT_SHOP_NOISE]'}
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#8E8A82]">SNR:</span>
              {([0, -3, -6] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleSnrChange(lvl)}
                  className={`px-2 py-0.5 text-xs border ${
                    selectedSnr === lvl
                      ? 'border-[#C88A2B] bg-[#292215] text-[#C88A2B] font-bold'
                      : 'border-[#2D2D2A] text-[#8E8A82]'
                  }`}
                >
                  {lvl}dB
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#8E8A82]">VOICE CLARITY DSP:</span>
            <button
              type="button"
              onClick={() => onToggleDsp(!dspActive)}
              className={`mech-btn text-xs px-3.5 py-1.5 ${
                dspActive ? 'mech-btn-brass' : 'mech-btn-ghost text-[#A8A49C]'
              }`}
            >
              {dspActive ? '[DSP: 120Hz HPF + NOTCH ON]' : '[DSP: BYPASSED]'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Deck Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEST_CASES.map((tc, idx) => (
          <div
            key={tc.id}
            className={`p-5 border transition-colors ${
              executingTestId === tc.id
                ? 'border-[#C88A2B] bg-[#1E1C15]'
                : 'border-[#2D2D2A] bg-[#141413] hover:border-[#3E3E3A]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#232320] font-mono-tech text-xs">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 text-xs bg-[#232320] text-[#C88A2B] font-bold">
                  TEST_0{idx + 1}
                </span>
                <span className="text-xs text-[#A8A49C]">{tc.tag}</span>
              </div>
              <span className="text-[11px] text-[#575550]">ID: {tc.id}</span>
            </div>

            {/* Test Case Title */}
            <h3 className="text-base font-bold text-[#F4F1EA] mb-2.5">{tc.title}</h3>

            {/* Spoken Utterance Box */}
            <div className="p-3 bg-[#1B1B19] border border-[#2B2B28] mb-3.5 font-mono-tech">
              <span className="text-[11px] text-[#8E8A82] block mb-1 font-bold">SPOKEN_PHRASE:</span>
              <p className="text-sm md:text-base font-bold text-[#D9381E]">
                "{tc.spokenPhrase}"
              </p>
            </div>

            {/* Expected Behavior */}
            <div className="mb-4 text-xs sm:text-sm text-[#A8A49C] font-mono-tech leading-relaxed">
              <span className="text-[11px] text-[#575550] block mb-1 font-bold">EXPECTED_BEHAVIOR:</span>
              {tc.expectedBehavior}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-[#232320]">
              <span className="text-xs text-[#575550] font-mono-tech">
                {executingTestId === tc.id ? '[INJECTING_STREAM...]' : '[READY_FOR_EXEC]'}
              </span>
              <button
                type="button"
                onClick={() => handleRunTest(tc)}
                disabled={executingTestId === tc.id}
                className="mech-btn mech-btn-primary text-xs sm:text-sm"
              >
                {executingTestId === tc.id ? '[PROCESSING...]' : '[INJECT_AUDIO_STREAM]'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
