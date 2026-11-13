import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { SpatialStage } from './components/SpatialStage';
import { LiveVoiceConsole } from './components/LiveVoiceConsole';
import { BahiKhataLedger } from './components/BahiKhataLedger';
import { JudgeStressTestDeck } from './components/JudgeStressTestDeck';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { TermsConditionsView } from './components/TermsConditionsView';
import { DisambiguationModal } from './components/DisambiguationModal';
import { PoliteReminderModal } from './components/PoliteReminderModal';
import { CustomDomainModal } from './components/CustomDomainModal';

import {
  Customer,
  LedgerEntry,
  ParsedTransactionClause,
  ViewState,
  VoiceLatencyMetrics
} from './types/khata';
import {
  addLedgerEntry,
  getAllCustomers,
  getAllEntries,
  getDailySummary,
  initDb,
  resetDatabase,
  updateCustomerOptIn
} from './services/db';
import { parseUtterance } from './services/parser';
import { audioEngine } from './services/audioEngine';
import { speechRecognitionEngine } from './services/speechRecognition';
import { speechSynthesisEngine } from './services/speechSynthesis';
import { getSecurityStatus } from './services/crypto';

export const App: React.FC = () => {
  // Navigation & View
  const [currentView, setCurrentView] = useState<ViewState>('console');

  // Khata Data
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Speech & Parsing State
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN' | 'kn-IN' | 'ta-IN'>('hi-IN');
  const [rawTranscript, setRawTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [clauses, setClauses] = useState<ParsedTransactionClause[]>([]);

  // Acoustic Noise & DSP
  const [isNoiseActive, setIsNoiseActive] = useState(false);
  const [snrDb, setSnrDb] = useState(-3);
  const [dspActive, setDspActive] = useState(true);

  // Latency & Metrics
  const [latencyMetrics, setLatencyMetrics] = useState<VoiceLatencyMetrics>({
    ttfaMs: 0,
    sttMs: 0,
    nlpMs: 0,
    ttsMs: 0,
    e2eMs: 0,
    lastQuery: ''
  });

  // Modals
  const [disambiguationState, setDisambiguationState] = useState<{
    isOpen: boolean;
    options: Customer[];
    amount: number;
    txType: 'UDHAAR' | 'JAMA';
    clause: ParsedTransactionClause;
  } | null>(null);

  const [reminderCustomer, setReminderCustomer] = useState<Customer | null>(null);
  const [customDomainOpen, setCustomDomainOpen] = useState(false);

  // Timers & Refs
  const recognitionStartTimeRef = useRef<number>(0);
  const customersRef = useRef<Customer[]>([]);
  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  // Sync hash routing e.g. #privacy, #terms, #ledger, #judge, #console
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as ViewState;
      if (['console', 'ledger', 'judge', 'privacy', 'terms'].includes(hash)) {
        setCurrentView(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectView = (view: ViewState) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  // Load Database on Mount
  const refreshDbData = useCallback(async () => {
    try {
      await initDb();
      const allC = await getAllCustomers();
      const allE = await getAllEntries();
      setCustomers(allC);
      setEntries(allE);
    } catch {
      // IndexedDB loading handled
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await initDb();
      if (!active) return;
      const allC = await getAllCustomers();
      const allE = await getAllEntries();
      if (!active) return;
      setCustomers(allC);
      setEntries(allE);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  // Subscribe to voice synthesis latency updates
  useEffect(() => {
    speechSynthesisEngine.subscribeMetrics((metrics) => {
      setLatencyMetrics(metrics);
    });
  }, []);

  // Handle Query Intent (e.g., "Aaj kitna udhaar gaya?", "Ramesh ka total?")
  const handleQueryExecution = useCallback(
    async (clause: ParsedTransactionClause, sttDurationMs: number) => {
      const nlpStart = performance.now();

      if (clause.queryType === 'TODAY_TOTAL') {
        const summary = await getDailySummary();
        const nlpMs = Math.round(performance.now() - nlpStart);
        const replyText = `Aaj kul ${summary.todayUdhaar} rupaye ka udhaar gaya hai.`;
        speechSynthesisEngine.speakPrompt(replyText, 'hi-IN', {
          sttDurationMs,
          nlpDurationMs: nlpMs,
          query: clause.originalClause
        });
      } else if (clause.queryType === 'CUSTOMER_TOTAL' && clause.matchedCustomerName) {
        const cust = customersRef.current.find((c) => c.name === clause.matchedCustomerName);
        const bal = cust ? cust.currentBalance : 0;
        const nlpMs = Math.round(performance.now() - nlpStart);
        const replyText = `${clause.matchedCustomerName} ka kul baaki balance ${bal} rupaye hai.`;
        speechSynthesisEngine.speakPrompt(replyText, 'hi-IN', {
          sttDurationMs,
          nlpDurationMs: nlpMs,
          query: clause.originalClause
        });
      } else {
        const summary = await getDailySummary();
        const nlpMs = Math.round(performance.now() - nlpStart);
        const replyText = `Aaj dukaan par kul ${summary.todayJama} rupaye ki jama aayi hai.`;
        speechSynthesisEngine.speakPrompt(replyText, 'hi-IN', {
          sttDurationMs,
          nlpDurationMs: nlpMs,
          query: clause.originalClause
        });
      }
    },
    []
  );

  // Commit Parsed Clauses to Ledger
  const commitParsedClauses = useCallback(
    async (parsedClauses: ParsedTransactionClause[]) => {
      for (const clause of parsedClauses) {
        // Query check
        if (clause.isQuery) {
          continue;
        }

        // Homonym check
        if (clause.requiresDisambiguation && clause.disambiguationOptions) {
          audioEngine.playDisambiguationBeep();
          setDisambiguationState({
            isOpen: true,
            options: clause.disambiguationOptions,
            amount: clause.normalizedAmount,
            txType: clause.txType === 'JAMA' ? 'JAMA' : 'UDHAAR',
            clause
          });

          // Disambiguation spoken interrupt within 400ms
          speechSynthesisEngine.speakPrompt(
            'Kaunsa Ramesh? Dairy wala ya Auto wala?',
            'hi-IN',
            { sttDurationMs: 220, nlpDurationMs: 40, query: clause.originalClause }
          );
          return; // pause commit until resolved
        }

        // Normal atomic commit
        if (clause.normalizedAmount > 0) {
          const entryId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const cust = customersRef.current.find(
            (c) => c.name === clause.matchedCustomerName || c.name === clause.entityRaw
          );

          const newEntry: LedgerEntry = {
            id: entryId,
            customerId: cust ? cust.id : `cust-gen-${Date.now()}`,
            customerName: cust ? cust.name : clause.entityRaw || 'Grahak',
            customerSubtitle: cust ? cust.descriptor : 'Counter Customer',
            type: clause.txType === 'JAMA' ? 'JAMA' : 'UDHAAR',
            amount: clause.normalizedAmount,
            rawSpokenAmount: clause.rawAmount,
            date: clause.dateString,
            relativeDateLabel: clause.relativeDateLabel,
            timestamp: Date.now(),
            status: clause.isSelfCorrection ? 'CORRECTED_IN_STREAM' : 'COMMITTED',
            auditFlag: clause.isSelfCorrection
              ? '[CORRECTED_IN_STREAM]'
              : '[VOICE_AUTO_COMMITTED]',
            originalClause: clause.originalClause
          };

          await addLedgerEntry(newEntry);
          audioEngine.playCommitPip();
        }
      }

      await refreshDbData();
    },
    [refreshDbData]
  );

  // Speech Recognition Stream Ingestion Callback
  const handleTranscriptStream = useCallback(
    (text: string, isFinal: boolean) => {
      setRawTranscript(text);
      if (!isFinal) {
        setInterimTranscript(text);
      } else {
        setInterimTranscript('');
      }

      // Live Parse AST
      const parsed = parseUtterance(text, customersRef.current);
      setClauses(parsed);

      if (isFinal) {
        const sttDuration = Math.round(performance.now() - recognitionStartTimeRef.current);
        const queryClause = parsed.find((p) => p.isQuery);
        if (queryClause) {
          handleQueryExecution(queryClause, sttDuration);
        } else {
          commitParsedClauses(parsed);
        }
      }
    },
    [commitParsedClauses, handleQueryExecution]
  );

  // Initialize Speech Recognition Hook
  useEffect(() => {
    speechRecognitionEngine.subscribe(
      handleTranscriptStream,
      (listening) => {
        setIsListening(listening);
      }
    );
  }, [handleTranscriptStream]);

  // Toggle Listening
  const handleToggleListening = useCallback(async () => {
    audioEngine.playMechanicalClick();
    if (isListening) {
      speechRecognitionEngine.stopListening();
      setIsListening(false);
    } else {
      await audioEngine.initContext();
      await audioEngine.startMicrophone();
      recognitionStartTimeRef.current = performance.now();
      speechRecognitionEngine.setLanguage(language);
      speechRecognitionEngine.startListening();
      setIsListening(true);
    }
  }, [isListening, language]);

  // Keyboard Spacebar Push-to-Talk Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        if (!isListening) {
          handleToggleListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, handleToggleListening]);

  // Shop-Noise Simulator Toggle
  const handleToggleNoise = (enable?: boolean, snr?: number) => {
    audioEngine.playMechanicalClick();
    const effectiveSnr = snr !== undefined ? snr : snrDb;
    setSnrDb(effectiveSnr);
    const active = audioEngine.toggleShopNoise(enable, effectiveSnr);
    setIsNoiseActive(active);
  };

  // Voice Clarity DSP Toggle
  const handleToggleDsp = (active: boolean) => {
    audioEngine.playMechanicalClick();
    audioEngine.setDspActive(active);
    setDspActive(active);
  };

  // Language Change
  const handleLanguageChange = (lang: 'hi-IN' | 'en-IN' | 'kn-IN' | 'ta-IN') => {
    audioEngine.playMechanicalClick();
    setLanguage(lang);
    speechRecognitionEngine.setLanguage(lang);
  };

  // Quick Test Deck Phrase Injection
  const handleInjectTestPhrase = async (phrase: string) => {
    await audioEngine.initContext();
    recognitionStartTimeRef.current = performance.now();
    setRawTranscript(phrase);
    setInterimTranscript('');

    const parsed = parseUtterance(phrase, customersRef.current);
    setClauses(parsed);

    // Stream word by word into simulation
    await speechRecognitionEngine.injectSimulatedStream(phrase, (partial) => {
      setRawTranscript(partial);
    });

    const sttDuration = Math.round(performance.now() - recognitionStartTimeRef.current);
    const queryClause = parsed.find((p) => p.isQuery);
    if (queryClause) {
      await handleQueryExecution(queryClause, sttDuration);
    } else {
      await commitParsedClauses(parsed);
    }
  };

  // Homonym Disambiguation Resolution
  const handleResolveDisambiguation = async (chosenCustomer: Customer) => {
    if (!disambiguationState) return;
    audioEngine.playMechanicalClick();

    const { clause, amount, txType } = disambiguationState;
    const entryId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newEntry: LedgerEntry = {
      id: entryId,
      customerId: chosenCustomer.id,
      customerName: chosenCustomer.name,
      customerSubtitle: chosenCustomer.descriptor,
      type: txType,
      amount,
      rawSpokenAmount: clause.rawAmount,
      date: clause.dateString,
      relativeDateLabel: clause.relativeDateLabel,
      timestamp: Date.now(),
      status: 'COMMITTED',
      auditFlag: `[DISAMBIGUATED: ${chosenCustomer.descriptor.toUpperCase()}]`,
      originalClause: clause.originalClause
    };

    await addLedgerEntry(newEntry);
    audioEngine.playCommitPip();
    setDisambiguationState(null);
    await refreshDbData();
  };

  // Customer Opt-In Consent Toggle (DPDP Act 2023)
  const handleToggleCustomerConsent = async (customerId: string, consent: boolean) => {
    audioEngine.playMechanicalClick();
    await updateCustomerOptIn(customerId, consent);
    await refreshDbData();
    if (reminderCustomer && reminderCustomer.id === customerId) {
      setReminderCustomer({
        ...reminderCustomer,
        optInConsent: consent,
        consentTimestamp: consent ? new Date().toISOString() : undefined
      });
    }
  };

  // Re-seed database
  const handleResetDb = async () => {
    audioEngine.playMechanicalClick();
    if (window.confirm('Reset local encrypted IndexedDB store to initial Kirana accounts?')) {
      await resetDatabase();
      await refreshDbData();
    }
  };

  const securityStatus = getSecurityStatus();

  return (
    <div className="min-h-screen bg-[#141413] text-[#F4F1EA] flex flex-col font-sans">
      {/* Top Industrial Header */}
      <Header
        currentView={currentView}
        onSelectView={handleSelectView}
        isListening={isListening}
        dspActive={dspActive}
        onOpenCustomDomain={() => setCustomDomainOpen(true)}
        onResetDb={handleResetDb}
      />

      {/* 3D Spatial Hardware Workspace */}
      <main className="flex-1 w-full bg-[#141413]">
        <SpatialStage currentView={currentView}>
          {currentView === 'console' && (
            <LiveVoiceConsole
              isListening={isListening}
              onToggleListening={handleToggleListening}
              rawTranscript={rawTranscript}
              interimTranscript={interimTranscript}
              clauses={clauses}
              isNoiseActive={isNoiseActive}
              onToggleNoise={handleToggleNoise}
              snrDb={snrDb}
              dspActive={dspActive}
              onToggleDsp={handleToggleDsp}
              language={language}
              onLanguageChange={handleLanguageChange}
              latencyMetrics={latencyMetrics}
              onManualTextSubmit={handleInjectTestPhrase}
            />
          )}

          {currentView === 'ledger' && (
            <BahiKhataLedger
              entries={entries}
              customers={customers}
              onOpenReminderModal={(cust) => setReminderCustomer(cust)}
              onRefreshData={refreshDbData}
              encryptionStatus={securityStatus}
            />
          )}

          {currentView === 'judge' && (
            <JudgeStressTestDeck
              onInjectPhrase={handleInjectTestPhrase}
              latencyMetrics={latencyMetrics}
              isNoiseActive={isNoiseActive}
              onToggleNoise={handleToggleNoise}
              dspActive={dspActive}
              onToggleDsp={handleToggleDsp}
            />
          )}

          {currentView === 'privacy' && <PrivacyPolicyView />}

          {currentView === 'terms' && <TermsConditionsView />}
        </SpatialStage>
      </main>

      {/* Industrial Hardware Footer */}
      <footer className="bg-[#0E0E0D] border-t border-[#2D2D2A] text-[#8E8A82] py-4 px-4 sm:px-6 lg:px-8 text-xs font-mono-tech select-none w-full">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[#C88A2B] font-bold">VOICE KHATA // PS2</span>
            <span>ZERO-TOUCH INDIC AUDIO LEDGER</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => handleSelectView('privacy')}
              className="hover:text-[#F4F1EA]"
            >
              [PRIVACY_POLICY // DPDP_ACT_2023]
            </button>
            <button
              type="button"
              onClick={() => handleSelectView('terms')}
              className="hover:text-[#F4F1EA]"
            >
              [TERMS_AND_CONDITIONS]
            </button>
            <span className="text-[#575550]">LOCAL_FIRST // AES_GCM_256</span>
          </div>
        </div>
      </footer>

      {/* Disambiguation Modal */}
      {disambiguationState && (
        <DisambiguationModal
          isOpen={disambiguationState.isOpen}
          options={disambiguationState.options}
          amount={disambiguationState.amount}
          txType={disambiguationState.txType}
          onResolve={handleResolveDisambiguation}
          onCancel={() => setDisambiguationState(null)}
        />
      )}

      {/* Polite Opt-In Reminder Modal */}
      <PoliteReminderModal
        isOpen={Boolean(reminderCustomer)}
        customer={reminderCustomer}
        onClose={() => setReminderCustomer(null)}
        onToggleConsent={handleToggleCustomerConsent}
      />

      {/* Custom Domain Modal */}
      <CustomDomainModal
        isOpen={customDomainOpen}
        onClose={() => setCustomDomainOpen(false)}
      />
    </div>
  );
};

export default App;
