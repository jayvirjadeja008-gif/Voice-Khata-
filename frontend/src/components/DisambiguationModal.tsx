import React from 'react';
import { Customer } from '../types/khata';

interface DisambiguationModalProps {
  isOpen: boolean;
  options: Customer[];
  amount: number;
  txType: 'UDHAAR' | 'JAMA';
  onResolve: (chosenCustomer: Customer) => void;
  onCancel: () => void;
}

export const DisambiguationModal: React.FC<DisambiguationModalProps> = ({
  isOpen,
  options,
  amount,
  txType,
  onResolve,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl border-2 border-[#C88A2B] bg-[#141413] shadow-2xl p-6 text-[#F4F1EA]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#2B2B26] font-mono-tech text-sm">
          <div className="flex items-center gap-2.5">
            <span className="mech-led active-brass" />
            <span className="text-[#C88A2B] font-bold">
              [HOMONYM_DISAMBIGUATION_STATE // INTERRUPT]
            </span>
          </div>
          <span className="text-[#8E8A82] text-xs">LOCK: PENDING_VOICE_RESOLUTION</span>
        </div>

        {/* Audio TTS Alert Box */}
        <div className="p-4 mb-4 bg-[#1F1C16] border border-[#3E3420] text-sm font-mono-tech">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="tech-badge tech-badge-brass">[TTS_DISPATCH: 180ms]</span>
            <span className="text-[#C88A2B] font-bold text-xs">VOICE PROMPT PLAYED:</span>
          </div>
          <p className="text-base text-[#F4F1EA] font-bold">
            "Kaunsa Ramesh? Dairy wala ya Auto wala?"
          </p>
          <span className="text-xs text-[#A8A49C] block mt-1.5 leading-relaxed">
            Transaction held in volatile memory: {txType} of ₹{amount.toFixed(2)}. Speak descriptor into mic or select account below.
          </span>
        </div>

        {/* Candidate Customer Cards */}
        <div className="space-y-3.5 mb-5 font-mono-tech">
          {options.map((customer, idx) => (
            <div
              key={customer.id}
              className="p-4 border border-[#2D2D2A] bg-[#1B1B19] hover:border-[#C88A2B] transition-colors flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 text-xs bg-[#2E2E2A] text-[#C88A2B] font-bold">
                    OPT_{idx + 1}
                  </span>
                  <span className="font-bold text-base text-[#F4F1EA]">{customer.name}</span>
                  <span className="text-sm text-[#C88A2B] font-bold">
                    ({customer.descriptor})
                  </span>
                </div>
                <div className="text-xs text-[#8E8A82] mt-1.5">
                  Phone: {customer.phone} | Khata Balance: ₹{customer.currentBalance}
                </div>
                <div className="text-[11px] text-[#575550] mt-0.5">
                  ID: {customer.id}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onResolve(customer)}
                className="mech-btn mech-btn-brass text-xs font-bold"
              >
                SELECT [{customer.descriptor.toUpperCase()}]
              </button>
            </div>
          ))}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3.5 border-t border-[#232320]">
          <span className="text-xs text-[#575550] font-mono-tech">
            Awaiting speech token: "dairy" or "auto"
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="mech-btn mech-btn-ghost text-xs text-[#A8A49C]"
          >
            [ABORT_ENTRY]
          </button>
        </div>
      </div>
    </div>
  );
};
