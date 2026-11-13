export type TransactionType = 'UDHAAR' | 'JAMA' | 'QUERY' | 'UNKNOWN';

export type TemporalAnchor = 'TODAY' | 'YESTERDAY' | 'TWO_DAYS_AGO' | 'SPECIFIC_DATE';

export interface LedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  customerSubtitle: string;
  type: 'UDHAAR' | 'JAMA';
  amount: number;
  rawSpokenAmount: string;
  date: string;
  relativeDateLabel: string;
  timestamp: number;
  status: 'COMMITTED' | 'CORRECTED_IN_STREAM' | 'PENDING_DISAMBIGUATION';
  auditFlag?: string;
  encryptedDigest?: string;
  originalClause?: string;
}

export interface Customer {
  id: string;
  name: string;
  descriptor: string; // e.g. "Dairy wala", "Auto wala"
  phone: string;
  currentBalance: number; // positive = udhaar (customer owes store), negative = jama credit
  optInConsent: boolean;
  consentTimestamp?: string;
  createdDate: string;
  notes?: string;
}

export interface ASTToken {
  id: string;
  type:
    | 'ENTITY'
    | 'AMOUNT_RAW'
    | 'AMOUNT_NORMALIZED'
    | 'TX_TYPE'
    | 'TEMPORAL'
    | 'CORRECTION'
    | 'CONJUNCTION'
    | 'QUERY_INTENT';
  raw: string;
  normalized: string | number;
  confidence: number;
  strikeThrough?: boolean;
  meta?: string;
}

export interface ParsedTransactionClause {
  entityRaw: string;
  matchedCustomerName?: string;
  matchedCustomerId?: string;
  requiresDisambiguation: boolean;
  disambiguationOptions?: Customer[];
  txType: TransactionType;
  rawAmount: string;
  normalizedAmount: number;
  temporalAnchor: TemporalAnchor;
  dateString: string;
  relativeDateLabel: string;
  isSelfCorrection: boolean;
  correctedFromAmount?: number;
  tokens: ASTToken[];
  confidence: number;
  originalClause: string;
  isQuery?: boolean;
  queryType?: 'BALANCE_CHECK' | 'TODAY_TOTAL' | 'CUSTOMER_TOTAL';
}

export interface ShopNoiseProfile {
  enabled: boolean;
  snrDb: number; // e.g. 0, -3, -6
  trafficVolume: number;
  hornVolume: number;
  chatterVolume: number;
  dspFilterActive: boolean;
}

export interface VoiceLatencyMetrics {
  ttfaMs: number; // Time to First Audio
  sttMs: number;
  nlpMs: number;
  ttsMs: number;
  e2eMs: number;
  lastQuery: string;
}

export type ViewState = 'console' | 'ledger' | 'judge' | 'privacy' | 'terms';

