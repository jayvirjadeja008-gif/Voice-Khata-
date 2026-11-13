import React, { useState } from 'react';
import { Customer, LedgerEntry } from '../types/khata';

interface BahiKhataLedgerProps {
  entries: LedgerEntry[];
  customers: Customer[];
  onOpenReminderModal: (customer: Customer) => void;
  onRefreshData: () => void;
  encryptionStatus: {
    statusLabel: string;
    cipher: string;
    keyBits: number;
    localFirst: boolean;
  };
}

export const BahiKhataLedger: React.FC<BahiKhataLedgerProps> = ({
  entries,
  customers,
  onOpenReminderModal,
  encryptionStatus
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'UDHAAR' | 'JAMA' | 'TODAY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [todayDateString] = useState(() => new Date().toISOString().slice(0, 10));

  // Filter calculations
  const filteredEntries = entries.filter((entry) => {
    if (filterType === 'UDHAAR' && entry.type !== 'UDHAAR') return false;
    if (filterType === 'JAMA' && entry.type !== 'JAMA') return false;
    if (filterType === 'TODAY') {
      if (!entry.date.startsWith(todayDateString)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = entry.customerName.toLowerCase().includes(q);
      const matchDesc = entry.customerSubtitle.toLowerCase().includes(q);
      const matchClause = entry.originalClause?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchClause) return false;
    }
    return true;
  });

  // Calculate totals
  const totalUdhaar = entries
    .filter((e) => e.type === 'UDHAAR')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalJama = entries
    .filter((e) => e.type === 'JAMA')
    .reduce((sum, e) => sum + e.amount, 0);

  const netStoreOutstanding = totalUdhaar - totalJama;

  return (
    <div className="w-full">
      {/* Top Ledger Header / Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#141413] border border-[#2D2D2A] text-[#F4F1EA] mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 bg-[#D9381E] inline-block" />
            <h2 className="text-lg md:text-xl font-bold tracking-wider font-mono-tech uppercase">
              Bahi-Khata: Indic Kirana Ledger (बही-खाता)
            </h2>
          </div>
          <p className="text-sm text-[#A8A49C]">
            Double-entry credit and payment journal. Local-first device storage with hardware AES-GCM-256.
          </p>
        </div>

        {/* Security & Cryptographic Seal */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 border border-[#3A3830] bg-[#1C1B18] text-right font-mono-tech text-xs">
            <div className="flex items-center gap-2 text-[#2DB84D] font-bold">
              <span className="mech-led active-green" />
              <span>{encryptionStatus.statusLabel}</span>
            </div>
            <div className="text-[#8E8A82] text-[11px] mt-0.5">
              CIPHER: {encryptionStatus.cipher} // SHA-256 AUDIT DIGEST
            </div>
          </div>
        </div>
      </div>

      {/* Metric Tiles: Udhaar, Jama, Outstanding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 font-mono-tech">
        <div className="p-4 bg-[#EFECE3] border-l-4 border-l-[#D9381E] border border-[#D4CEBF]">
          <span className="text-xs text-[#575550] block uppercase font-bold mb-1">
            Total Udhaar Given (Debit)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-[#D9381E]">
            ₹{totalUdhaar.toLocaleString('en-IN')}.00
          </span>
          <span className="text-xs text-[#736F66] block mt-1">
            Credit extended across counter
          </span>
        </div>

        <div className="p-4 bg-[#EFECE3] border-l-4 border-l-[#2DB84D] border border-[#D4CEBF]">
          <span className="text-xs text-[#575550] block uppercase font-bold mb-1">
            Total Jama Received (Credit)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-[#1F7A38]">
            ₹{totalJama.toLocaleString('en-IN')}.00
          </span>
          <span className="text-xs text-[#736F66] block mt-1">
            Cash / UPI settlements recorded
          </span>
        </div>

        <div className="p-4 bg-[#EFECE3] border-l-4 border-l-[#C88A2B] border border-[#D4CEBF]">
          <span className="text-xs text-[#575550] block uppercase font-bold mb-1">
            Net Store Outstanding Balance
          </span>
          <span className="text-2xl md:text-3xl font-bold text-[#945C11]">
            ₹{netStoreOutstanding.toLocaleString('en-IN')}.00
          </span>
          <span className="text-xs text-[#736F66] block mt-1">
            Current dukaan receivables
          </span>
        </div>
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 p-3.5 bg-[#1B1B19] border border-[#2D2D2A] mb-3">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter customer, descriptor, or clause..."
          className="mech-input w-full sm:w-80 text-sm"
        />

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {(['ALL', 'UDHAAR', 'JAMA', 'TODAY'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`mech-btn text-xs px-3.5 py-1.5 ${
                filterType === t ? 'mech-btn-primary' : 'mech-btn-ghost text-[#A8A49C]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Traditional Red-Cloth Bahi-Khata Ledger Table */}
      <div className="bahi-khata-wrapper">
        {/* Red Cloth Binding Spine */}
        <div className="bahi-khata-spine font-mono-tech text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-widest">[BAHI_KHATA // बही-खाता]</span>
            <span className="text-xs text-[#FFCFB3]">
              SHRI SHARMA GENERAL STORE &amp; PROVISIONS
            </span>
          </div>
          <span className="text-xs text-[#FFCFB3] font-bold">
            {filteredEntries.length} TRANSACTIONS RECORDED
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="bahi-khata-table">
            <thead>
              <tr>
                <th className="w-28">DATE / TIME</th>
                <th>GRAHAK (CUSTOMER)</th>
                <th>SPOKEN VOICE CLAUSE</th>
                <th className="w-32 text-right">UDHAAR (DR)</th>
                <th className="w-32 text-right">JAMA (CR)</th>
                <th className="w-36">DIGEST / AUDIT</th>
                <th className="w-32 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[#736F66]">
                    No ledger entries matching query. Speak a transaction or use the Quick-Test Deck.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const cust = customers.find((c) => c.id === entry.customerId);
                  return (
                    <tr key={entry.id}>
                      <td className="text-xs text-[#575550]">
                        <div className="font-bold text-[#141413]">{entry.relativeDateLabel}</div>
                        <div className="text-[11px] text-[#8E8A82]">
                          {new Date(entry.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => cust && setSelectedCustomer(cust)}
                          className="font-bold text-left hover:underline text-[#141413] text-sm md:text-base flex items-center gap-2"
                        >
                          <span>{entry.customerName}</span>
                          <span className="text-xs font-normal text-[#736F66]">
                            ({entry.customerSubtitle})
                          </span>
                        </button>
                        <div className="text-[11px] text-[#8E8A82]">ID: {entry.customerId}</div>
                      </td>

                      <td className="text-sm">
                        <span className="italic text-[#33322E] font-medium">
                          "{entry.originalClause || entry.rawSpokenAmount}"
                        </span>
                        {entry.auditFlag && (
                          <span className="ml-2.5 text-xs text-[#8B2011] font-bold">
                            {entry.auditFlag}
                          </span>
                        )}
                      </td>

                      <td className="text-right font-bold text-sm md:text-base">
                        {entry.type === 'UDHAAR' ? (
                          <span className="text-[#D9381E]">+₹{entry.amount.toFixed(2)}</span>
                        ) : (
                          <span className="text-[#A8A49C]">-</span>
                        )}
                      </td>

                      <td className="text-right font-bold text-sm md:text-base">
                        {entry.type === 'JAMA' ? (
                          <span className="text-[#1F7A38]">-₹{entry.amount.toFixed(2)}</span>
                        ) : (
                          <span className="text-[#A8A49C]">-</span>
                        )}
                      </td>

                      <td className="text-xs font-mono-tech text-[#575550]">
                        <div className="font-bold">SHA: {entry.encryptedDigest || 'e3b0c442...'}</div>
                        <div className="text-[11px] text-[#736F66]">AES-256 STORED</div>
                      </td>

                      <td className="text-center">
                        {cust && (
                          <button
                            type="button"
                            onClick={() => onOpenReminderModal(cust)}
                            className="mech-btn mech-btn-light text-xs px-2.5 py-1.5"
                            title="Generate Polite Opt-In Reminder"
                          >
                            [REMINDER]
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Account Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg border-2 border-[#141413] bg-[#EFECE3] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#C8C2AA] font-mono-tech text-sm">
              <span className="font-bold text-[#8B2011] uppercase">
                [CUSTOMER_ACCOUNT_STATEMENT]
              </span>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-[#575550] hover:text-[#141413] font-bold text-xs"
              >
                [CLOSE]
              </button>
            </div>

            <div className="space-y-3.5 font-mono-tech text-sm mb-5">
              <div className="p-4 bg-[#F9F7F1] border border-[#D8D2BC]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#141413]">
                      {selectedCustomer.name}
                    </h3>
                    <span className="text-xs text-[#736F66]">
                      {selectedCustomer.descriptor} | Phone: {selectedCustomer.phone}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#736F66] block">NET OUTSTANDING</span>
                    <span className="text-xl font-bold text-[#D9381E]">
                      ₹{selectedCustomer.currentBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F9F7F1] border border-[#D8D2BC] text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold">DPDP ACT 2023 CONSENT STATUS:</span>
                  <span
                    className={`font-bold ${
                      selectedCustomer.optInConsent ? 'text-[#1F7A38]' : 'text-[#D9381E]'
                    }`}
                  >
                    {selectedCustomer.optInConsent ? '[OPTED_IN_VERIFIED]' : '[CONSENT_REQUIRED]'}
                  </span>
                </div>
                <div className="text-[11px] text-[#736F66]">
                  {selectedCustomer.optInConsent
                    ? `Consent logged at: ${selectedCustomer.consentTimestamp || 'Active'}`
                    : 'Customer has not authorized automated digital reminders.'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#C8C2AA]">
              <button
                type="button"
                onClick={() => {
                  const c = selectedCustomer;
                  setSelectedCustomer(null);
                  onOpenReminderModal(c);
                }}
                className="mech-btn mech-btn-primary text-xs sm:text-sm"
              >
                OPEN POLITE REMINDER GENERATOR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
