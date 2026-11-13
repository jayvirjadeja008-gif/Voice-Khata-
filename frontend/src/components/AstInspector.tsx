import React from 'react';
import { ParsedTransactionClause } from '../types/khata';

interface AstInspectorProps {
  clauses: ParsedTransactionClause[];
  rawTranscript: string;
}

export const AstInspector: React.FC<AstInspectorProps> = ({ clauses, rawTranscript }) => {
  return (
    <div className="border border-[#2D2D2A] bg-[#141413] p-4 text-[#F4F1EA]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#232320] text-xs font-mono-tech">
        <span className="text-[#C88A2B] font-bold text-sm">[AST_PARSER_OUTPUT // CODE_MIXED_NLP]</span>
        <span className="text-[#8E8A82] text-xs">CLAUSES_RESOLVED: {clauses.length}</span>
      </div>

      {/* Spoken Raw Utterance */}
      <div className="mb-3.5 p-3 bg-[#1B1B19] border border-[#262624] text-sm font-mono-tech">
        <span className="text-[#8E8A82] block text-[11px] mb-1 font-bold">RAW_SPOKEN_STREAM:</span>
        <span className="text-[#F4F1EA] font-semibold text-base">
          {rawTranscript || 'Waiting for voice acquisition across counter...'}
        </span>
      </div>

      {clauses.length === 0 ? (
        <div className="py-6 text-center text-sm text-[#575550] font-mono-tech">
          NO AST TOKENS GENERATED YET. PRESS PUSH-TO-TALK OR SELECT TEST DECK.
        </div>
      ) : (
        <div className="space-y-3.5">
          {clauses.map((clause, idx) => (
            <div
              key={idx}
              className={`p-3.5 border ${
                clause.requiresDisambiguation
                  ? 'border-[#C88A2B] bg-[#1E1C16]'
                  : clause.isSelfCorrection
                  ? 'border-[#D9381E] bg-[#1F1816]'
                  : 'border-[#2D2D2A] bg-[#181816]'
              }`}
            >
              {/* Clause Header */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#292926] text-xs font-mono-tech">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 bg-[#262622] text-[#C88A2B] font-bold text-xs">
                    CLAUSE_{idx + 1}
                  </span>
                  <span className="text-[#8E8A82] text-xs font-semibold">"{clause.originalClause}"</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-[#A8A49C]">
                    CONFIDENCE: {(clause.confidence * 100).toFixed(1)}%
                  </span>
                  {clause.isSelfCorrection && (
                    <span className="tech-badge tech-badge-red">[CORRECTED_IN_STREAM]</span>
                  )}
                  {clause.requiresDisambiguation && (
                    <span className="tech-badge tech-badge-brass">[PENDING_DISAMBIGUATION]</span>
                  )}
                </div>
              </div>

              {/* AST Token Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-mono-tech mb-3">
                {/* Entity */}
                <div className="p-2 bg-[#121211] border border-[#242422]">
                  <span className="text-[11px] text-[#8E8A82] block mb-0.5">ENTITY_NODE</span>
                  <span className="font-bold text-sm md:text-base text-[#F4F1EA]">
                    {clause.matchedCustomerName || clause.entityRaw || 'UNKNOWN'}
                  </span>
                  {clause.requiresDisambiguation && (
                    <span className="text-[11px] text-[#C88A2B] block mt-1">
                      Dairy wala vs Auto wala
                    </span>
                  )}
                </div>

                {/* Amount */}
                <div className="p-2 bg-[#121211] border border-[#242422]">
                  <span className="text-[11px] text-[#8E8A82] block mb-0.5">NORMALIZED_VAL</span>
                  <div className="flex items-center gap-2">
                    {clause.correctedFromAmount && (
                      <span className="token-strikethrough text-[#D9381E] text-sm">
                        ₹{clause.correctedFromAmount}
                      </span>
                    )}
                    <span className="font-bold text-base md:text-lg text-[#2DB84D]">
                      ₹{clause.normalizedAmount.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#575550] block mt-0.5">
                    RAW: "{clause.rawAmount}"
                  </span>
                </div>

                {/* Transaction Type */}
                <div className="p-2 bg-[#121211] border border-[#242422]">
                  <span className="text-[11px] text-[#8E8A82] block mb-0.5">LEDGER_STATE_TYPE</span>
                  <span
                    className={`font-bold text-sm md:text-base ${
                      clause.txType === 'UDHAAR'
                        ? 'text-[#D9381E]'
                        : clause.txType === 'JAMA'
                        ? 'text-[#2DB84D]'
                        : 'text-[#C88A2B]'
                    }`}
                  >
                    [{clause.txType}]
                  </span>
                  <span className="text-[11px] text-[#8E8A82] block mt-0.5">
                    {clause.txType === 'UDHAAR'
                      ? 'DEBIT / CREDIT_GIVEN'
                      : clause.txType === 'JAMA'
                      ? 'CREDIT / PAYMENT_RECEIVED'
                      : 'BALANCE_INQUIRY'}
                  </span>
                </div>

                {/* Temporal Anchor */}
                <div className="p-2 bg-[#121211] border border-[#242422]">
                  <span className="text-[11px] text-[#8E8A82] block mb-0.5">TEMPORAL_ANCHOR</span>
                  <span className="font-bold text-sm md:text-base text-[#F4F1EA]">
                    {clause.relativeDateLabel}
                  </span>
                  <span className="text-[11px] text-[#575550] block mt-0.5">
                    {clause.dateString.slice(0, 10)}
                  </span>
                </div>
              </div>

              {/* Linear Token Stream Representation */}
              <div className="pt-2 border-t border-[#232320]">
                <span className="text-[11px] text-[#736F66] block font-mono-tech mb-1.5 font-bold">
                  LEXICAL_TOKEN_STREAM:
                </span>
                <div className="flex flex-wrap gap-2">
                  {clause.tokens.map((tok) => (
                    <span
                      key={tok.id}
                      className={`px-2 py-1 text-xs font-mono-tech border ${
                        tok.strikeThrough
                          ? 'border-[#D9381E] bg-[#2E1410] token-strikethrough text-[#D9381E]'
                          : tok.type === 'CORRECTION'
                          ? 'border-[#D9381E] bg-[#3B1713] text-[#F4F1EA]'
                          : tok.type === 'ENTITY'
                          ? 'border-[#C88A2B] bg-[#231A0F] text-[#F4F1EA]'
                          : tok.type === 'AMOUNT_NORMALIZED'
                          ? 'border-[#2DB84D] bg-[#122416] text-[#2DB84D]'
                          : 'border-[#33322E] bg-[#1C1C1A] text-[#A8A49C]'
                      }`}
                    >
                      {tok.type}: "{String(tok.raw)}"
                      {tok.strikeThrough ? ' [STRUCK]' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
