import React from 'react';

export const TermsConditionsView: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto text-[#141413] bg-[#EFECE3] border border-[#D4CEBF] p-6 md:p-10 font-sans">
      {/* Document Header */}
      <div className="pb-5 mb-7 border-b-2 border-[#141413]">
        <div className="flex items-center justify-between font-mono-tech text-xs sm:text-sm text-[#575550] mb-2.5">
          <span>LEGAL DOCUMENT REF: VK-TERMS-2026-V1</span>
          <span>JURISDICTION: NEW DELHI, INDIA</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-mono-tech uppercase text-[#141413]">
          Voice Khata Terms &amp; Conditions
        </h1>
        <p className="text-xs sm:text-sm font-mono-tech text-[#8B2011] mt-1.5 font-bold">
          OPERATIONAL SCOPE, ANTI-COERCION GUARDRAILS, AND MERCHANT RESPONSIBILITIES
        </p>
      </div>

      {/* Body Sections */}
      <div className="space-y-6 text-sm md:text-base leading-relaxed text-[#2D2D2A]">
        {/* Section 1 */}
        <section className="p-5 bg-[#F9F7F1] border border-[#D8D2BC]">
          <h2 className="text-base md:text-lg font-bold font-mono-tech text-[#141413] uppercase mb-2.5">
            1. Bookkeeping Utility Scope
          </h2>
          <p className="mb-2.5">
            Voice Khata is an assistive, hands-free speech-to-text bookkeeping software utility designed specifically for high-noise retail environments.
          </p>
          <p>
            The software does not provide banking facilities, financial underwriting, credit scoring, legal recovery services, or loan disbursements. All financial relationships and credit agreements exist strictly between the retail merchant and their respective customers.
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-5 bg-[#F9F7F1] border border-[#D8D2BC]">
          <h2 className="text-base md:text-lg font-bold font-mono-tech text-[#141413] uppercase mb-2.5">
            2. Absolute Anti-Coercion Guardrails
          </h2>
          <p className="mb-2.5">
            Voice Khata enforces a zero-tolerance policy against coercive or predatory debt collection practices. Merchants agree not to modify, generate, or transmit reminders that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Employ threatening, abusive, or profane language.</li>
            <li>Threaten unverified legal consequences or social embarrassment.</li>
            <li>Contact customers outside reasonable business hours (09:00 to 19:00 IST).</li>
            <li>Violate Reserve Bank of India (RBI) Fair Practices Codes for retail transactions.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="p-5 bg-[#F9F7F1] border border-[#D8D2BC]">
          <h2 className="text-base md:text-lg font-bold font-mono-tech text-[#141413] uppercase mb-2.5">
            3. Mandatory Customer Opt-In for Communication
          </h2>
          <p>
            Merchants may only dispatch WhatsApp or SMS balance summaries to customers who have affirmatively provided consent. Sending unsolicited communications via external messaging integrations without customer authorization is a material breach of these terms and applicable Indian telecom regulations (TCCCPR).
          </p>
        </section>

        {/* Section 4 */}
        <section className="p-5 bg-[#F9F7F1] border border-[#D8D2BC]">
          <h2 className="text-base md:text-lg font-bold font-mono-tech text-[#141413] uppercase mb-2.5">
            4. Merchant Verification and Countertop Acoustic Duty
          </h2>
          <p className="mb-2.5">
            While Voice Khata utilizes multi-layered acoustic noise cancellation, DSP filters, and deterministic syntax parsers, high-decibel shop environments may introduce acoustic anomalies.
          </p>
          <p>
            The merchant retains sole responsibility to visually inspect the Abstract Syntax Tree (AST) output and verify that customer names, credit amounts, and payment entries match counter transactions accurately.
          </p>
        </section>

        {/* Section 5 */}
        <section className="p-5 bg-[#F9F7F1] border border-[#D8D2BC]">
          <h2 className="text-base md:text-lg font-bold font-mono-tech text-[#141413] uppercase mb-2.5">
            5. Device Security and Local Data Backups
          </h2>
          <p>
            Because Voice Khata stores encrypted data locally on the merchant's device (IndexedDB with AES-GCM-256), the merchant is responsible for safeguarding their physical device and maintaining browser data retention. Voice Khata assumes no liability for hardware loss or accidental local browser cache deletion.
          </p>
        </section>
      </div>

      {/* Footer Legal Stamp */}
      <div className="mt-9 pt-5 border-t border-[#C8C2AA] flex flex-col sm:flex-row items-center justify-between text-xs font-mono-tech text-[#575550]">
        <span>ENFORCEMENT: COMMERCIAL CONTRACT LAW (INDIA)</span>
        <span>VERSION: 2.4.0 // PRODUCTION RELEASE</span>
      </div>
    </div>
  );
};
