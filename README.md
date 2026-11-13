# Voice Khata: Hands-Free Indic Audio Ledger for High-Noise Counters

PS2: Gnani Voice Hackathon Evaluation Platform & Zero-Touch Credit Journal.

Voice Khata is an Indic speech-driven double-entry bookkeeping engine designed specifically for the acoustic challenges of Indian kirana counters during rush hour. It parses code-mixed Hindi, Kannada, Tamil, and English utterances, normalizes Indic number phrases, handles in-stream verbal corrections, resolves customer homonyms, and commits encrypted transactions in under 2000 milliseconds without requiring manual touch input.

---

## 1. Architectural Overview

```
[Acoustic Audio Ingest]
          |
          v
[Web Audio API DSP] ---> High-Pass Filter (140Hz) + Low-Pass Filter (3600Hz) + 50Hz Notch Filter
          |
          v
[Speech Recognition Engine] ---> Interim & Final Token Streams (hi-IN, en-IN, kn-IN, ta-IN)
          |
          v
[Indic Code-Mixed Parser] ---> AST Tokenizer + Indic Number Normalizer + Multi-Clause Splitter
          |
    +-----+---------------------------------+
    |                                       |
    v                                       v
[Spoken Self-Correction]           [Homonym Disambiguation Engine]
Mutates uncommitted buffer,        Triggers sub-400ms TTS voice prompt:
strikes discarded tokens,         "Kaunsa Ramesh? Dairy wala ya Auto wala?"
commits final currency node.       Locks transaction in [PENDING_DISAMBIGUATION].
    |                                       |
    +------------------+--------------------+
                       |
                       v
[Double-Entry Ledger State Machine]
                       |
                       v
[WebCrypto AES-GCM-256 Engine] ---> SHA-256 Digest Computation
                       |
                       v
[Local-First IndexedDB Store] ---> Hardware-Bound Persistence (Zero Cloud Retention)
```

---

## 2. Core Modules & PS2 Hackathon Deliverables

### A. Direct Hero & Live Voice Console
- Push-to-Talk mechanical switch with spacebar hotkey binding.
- 60fps Web Audio API Canvas spectrum analyzer and time-domain oscillograph (512-point FFT, Hanning window).
- Low-poly 3D Three.js countertop hardware module reacting in real time to microphone frequency bands.
- Wake-phrase recognition: detects "Khata", "Suno Khata", and "Voice Khata" prefixes.

### B. Acoustic Shop-Noise Simulator (Live Judging Evaluation)
- Built-in noise mixer generating realistic counter noise conditions:
  - Low-frequency vehicular street rumble (brownian low-pass filtered noise).
  - Periodic scooter and auto horn clusters (dual-tone 430Hz and 540Hz sawtooth oscillators).
  - Multi-talker crowd murmur (band-pass filtered 850Hz chatter).
- SNR selector: 0dB, -3dB, and -6dB SNR.
- DSP Noise Gate and Voice Clarity toggle: 140Hz high-pass filter, 3600Hz speech envelope low-pass filter, and 50Hz AC hum notch filter.

### C. Indic Code-Mixed NLP & Entity Parser
- **Multi-Format Number Normalization:**
  - Converts compound Hindi verbal numbers ("teen sau chaalis", "pachees sau", "dedh hazaar", "dhai sau") into exact currency values (e.g. ₹340.00, ₹2,500.00).
  - Normalizes Kannada and Tamil numerals ("eradu nooru", "aivooru", "irunooru", "ayiram").
  - Handles mixed English numbers ("three forty", "two hundred fifty", "5 sau").
- **Multi-Clause Transaction Splitting:**
  - Utterance: `"Ramesh ka 340 udhaar, kal 200 diya tha"`
  - Automatically splits into two atomic records:
    1. Customer: Ramesh | Type: UDHAAR | Amount: +₹340.00 | Date: Today
    2. Customer: Ramesh | Type: JAMA | Amount: -₹200.00 | Date: Yesterday (-1d)
- **Spoken Self-Correction State Machine:**
  - Utterance: `"Suresh ka 500 udhaar... nahi, 430"`
  - Detects correction barrier ("nahi"), strikes through 500 in the AST token stream, and commits ₹430.00 with audit tag `[CORRECTED_IN_STREAM]`.
- **Homonym Disambiguation Prompt:**
  - Detects duplicate first names in pre-populated customer directory (Ramesh Sharma: Dairy vs Ramesh Verma: Auto).
  - Dispatches sub-400ms spoken voice prompt: `"Kaunsa Ramesh? Dairy wala ya Auto wala?"`.
  - Transaction enters volatile `[PENDING_DISAMBIGUATION]` lock until answered verbally or selected on screen.
- **Sub-2-Second Spoken Query Responder:**
  - Spoken query: `"Aaj kitna udhaar gaya?"`
  - Calculates daily total credit from IndexedDB and responds via Web Speech Synthesis: `"Aaj kul 1,280 rupaye ka udhaar gaya hai."`
  - Displays live millisecond latency telemetry: `[TTFA: 380ms]`, `[E2E: 520ms]`.

### D. Traditional Bahi-Khata Tabular Ledger
- Styled after an authentic Indian red-cloth Bahi-Khata combined with Swiss tabular typography.
- JetBrains Mono for figures, Space Grotesk for headers.
- Real-time client-side encryption via WebCrypto AES-GCM-256 with SHA-256 tamper-evident digest.
- Customer balance drawer and running statement audit trails.

### E. Polite Opt-In Reminder Generator (DPDP Act 2023)
- Preview modal displaying non-threatening, respectful payment reminders in Hindi and English.
- Hard guardrail: generation is locked unless `OPT_IN_CONSENT === true`.
- Verifies compliance with Section 6 of India's Digital Personal Data Protection Act, 2023.

---

## 3. Judge Quick-Test Deck

The application includes a pre-loaded deck of 6 deterministic evaluation cases for immediate one-click testing:

| Test ID | Spoken Phrase | Expected Pipeline Output |
| :--- | :--- | :--- |
| **TEST_01** | `"Ramesh ka 340 udhaar, kal 200 diya tha"` | Splits into two atomic entries: +₹340 Udhaar (Today) and -₹200 Jama (Yesterday). |
| **TEST_02** | `"Suresh ka 500 udhaar... nahi, 430"` | Striking 500, commits 430 with `[CORRECTED_IN_STREAM]` audit tag. |
| **TEST_03** | `"Ramesh ka 340 udhaar"` | Homonym detected. Fires voice prompt: "Kaunsa Ramesh? Dairy wala ya Auto wala?". |
| **TEST_04** | `"Aaj kitna udhaar gaya?"` | Spoken balance query responder. Fires TTS answer with `[TTFA: ~380ms]`. |
| **TEST_05** | `"Pooja ka teen sau chaalis udhaar"` | Indic verbal number normalization: "teen sau chaalis" -> ₹340.00. |
| **TEST_06** | `"Anand ka two hundred fifty jama, kal ka baaki"` | Code-mixed Kannada/English: ₹250.00 Jama, anchored to yesterday. |

Judges can either click `[INJECT_AUDIO_STREAM]` to feed the phrase through the streaming recognizer or use their own microphone with the `[INJECT_SHOP_NOISE]` simulator active.

---

## 4. Hardware Design System & Constraints

- **Color Palette:**
  - Warm Paper: `#F4F1EA`
  - Carbon Black: `#141413`
  - Kirana Ledger Red: `#D9381E`
  - Brass Accent: `#C88A2B`
  - Thermal Receipt Grey: `#E2DFD7`
- **Architectural Edges:** Sharp 0px or 2px corner radii with 1px solid structural borders.
- **Tactile Depression:** Mechanical button depression on click (`transform: translateY(2px)` with shadow collapse).
- **Typography:** Space Grotesk (headers) and JetBrains Mono (numerical tabular figures and technical labels).
- **Spatial 3D Transitions:** Perspective transforms (`perspective: 1400px`, `transform-style: preserve-3d`) shifting across a physical countertop stage over 450ms (`cubic-bezier(0.22, 1, 0.36, 1)`).
- **Prohibitions Enforced:** Zero purple/magenta gradients, zero pill buttons, zero fake reviews/metrics, zero em dashes, zero emojis, zero stock photos, and zero cursor hijacking.

---

## 5. Development & Production Deployment

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Setup
```bash
cd frontend
npm install
npm run dev
```

### Production Build
```bash
cd frontend
npm run build
```

### Production Custom Domain (CNAME)
A production `CNAME` file configured for `khata.yourdomain.in` is placed in `frontend/public/CNAME`. The Custom Domain Configuration modal in the UI displays real-time DNS verification and BIND zone record formats.

---

## 6. Privacy & Legal Compliance

- **Storage Boundary:** Local-first device persistence. No remote customer database sync without merchant opt-in.
- **Audio Stream:** 100% ephemeral in volatile RAM. Zero raw voice recording saved to disk.
- **Regulatory Compliance:** Designed in adherence to India DPDP Act 2023, Information Technology Act 2000, and Reserve Bank of India (RBI) Fair Practices Code for retail operations.
