import React, { useState } from 'react';
import { Customer } from '../types/khata';

interface PoliteReminderModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onToggleConsent: (customerId: string, consent: boolean) => void;
}

export const PoliteReminderModal: React.FC<PoliteReminderModalProps> = ({
  isOpen,
  customer,
  onClose,
  onToggleConsent
}) => {
  const [language, setLanguage] = useState<'HI' | 'EN'>('HI');
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!isOpen || !customer) return null;

  const hindiText = `Namaste ${customer.name} ji, Sharma General Store se nivedan. Aapka kul baaki hisaab ₹${customer.currentBalance.toFixed(
    2
  )} hai. Jab bhi suvidha ho, dukaan par ya UPI se bhugtan kar sakte hain. Shubh din.`;

  const englishText = `Greetings ${customer.name} ji, Sharma General Store. A gentle note regarding your current ledger balance of ₹${customer.currentBalance.toFixed(
    2
  )}. You may settle at the counter or via UPI at your convenience. Have a pleasant day.`;

  const activeMessage = language === 'HI' ? hindiText : englishText;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(activeMessage);
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl border border-[#2D2D2A] bg-[#141413] shadow-2xl p-6 text-[#F4F1EA]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#232320] font-mono-tech text-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#2DB84D] inline-block" />
            <span className="font-bold text-[#F4F1EA]">
              [POLITE_REMINDER_GENERATOR // DPDP_GUARDED]
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8E8A82] hover:text-[#F4F1EA] text-xs font-bold"
          >
            [CLOSE]
          </button>
        </div>

        {/* Customer Header */}
        <div className="p-4 bg-[#1B1B19] border border-[#292926] mb-4 font-mono-tech">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-[#F4F1EA]">{customer.name}</span>
              <span className="text-xs text-[#8E8A82] ml-2 font-semibold">({customer.descriptor})</span>
            </div>
            <span className="text-base font-bold text-[#D9381E]">
              ₹{customer.currentBalance.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-[#736F66] mt-1">
            Phone: {customer.phone}
          </div>
        </div>

        {/* DPDP Consent Verification Guard */}
        <div
          className={`p-4 border mb-4 font-mono-tech text-xs sm:text-sm ${
            customer.optInConsent
              ? 'border-[#1F7A38] bg-[#112416]'
              : 'border-[#D9381E] bg-[#241311]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`mech-led ${customer.optInConsent ? 'active-green' : 'active-red'}`}
              />
              <span className="font-bold">
                {customer.optInConsent
                  ? 'OPT_IN_CONSENT: VERIFIED [DPDP ACT 2023]'
                  : 'OPT_IN_CONSENT: MISSING [COMMUNICATION BLOCKED]'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggleConsent(customer.id, !customer.optInConsent)}
              className="text-xs text-[#C88A2B] underline hover:text-[#F4F1EA] font-bold"
            >
              {customer.optInConsent ? '[REVOKE_CONSENT]' : '[GRANT_EXPLICIT_CONSENT]'}
            </button>
          </div>
          <p className="text-xs text-[#A8A49C] mt-2 leading-relaxed">
            {customer.optInConsent
              ? `Customer granted opt-in at: ${customer.consentTimestamp || 'Active Record'}. Strictly polite, non-coercive reminders permitted.`
              : 'Digital Personal Data Protection Act requires verified customer consent before dispatching ledger summaries. Enable consent above once confirmed verbally at counter.'}
          </p>
        </div>

        {/* Reminder Preview (Only if consented) */}
        {customer.optInConsent ? (
          <div>
            {/* Language Switcher */}
            <div className="flex items-center justify-between mb-2.5 font-mono-tech text-xs">
              <span className="text-[#8E8A82] font-semibold">NON-COERCIVE MESSAGE DRAFT:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('HI')}
                  className={`px-2.5 py-1 text-xs border ${
                    language === 'HI'
                      ? 'border-[#C88A2B] bg-[#241E14] text-[#C88A2B] font-bold'
                      : 'border-[#2D2D2A] text-[#8E8A82]'
                  }`}
                >
                  HINDI (POLITE)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('EN')}
                  className={`px-2.5 py-1 text-xs border ${
                    language === 'EN'
                      ? 'border-[#C88A2B] bg-[#241E14] text-[#C88A2B] font-bold'
                      : 'border-[#2D2D2A] text-[#8E8A82]'
                  }`}
                >
                  ENGLISH (RESPECTFUL)
                </button>
              </div>
            </div>

            {/* Message Preview Box */}
            <div className="p-4 bg-[#111110] border border-[#262624] text-sm font-mono-tech text-[#F4F1EA] mb-4 whitespace-pre-wrap leading-relaxed">
              {activeMessage}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#232320]">
              <span className="text-xs text-[#736F66] font-mono-tech">
                AUDIT_FLAG: [POLITE_NON_COERCIVE]
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="mech-btn mech-btn-light text-xs"
                >
                  {copyFeedback ? '[COPIED_TO_CLIPBOARD]' : '[COPY_TEXT]'}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="mech-btn mech-btn-primary text-xs"
                >
                  [DISPATCH_WHATSAPP]
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-[#141413] border border-[#2D2D2A] text-center text-sm text-[#8E8A82] font-mono-tech leading-relaxed">
            Dispatches disabled until merchant confirms customer's explicit verbal or written opt-in.
          </div>
        )}
      </div>
    </div>
  );
};
