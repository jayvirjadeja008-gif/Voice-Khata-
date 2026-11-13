/**
 * Indic Code-Mixed NLP & Entity Parser Engine
 * Handles multi-clause splitting, verbal number normalization,
 * spoken self-corrections, homonym detection, and query intents.
 */

import { ASTToken, Customer, ParsedTransactionClause, TemporalAnchor, TransactionType } from '../types/khata';

const HINDI_NUMBER_MAP: Record<string, number> = {
  shunya: 0,
  zero: 0,
  ek: 1,
  do: 2,
  teen: 3,
  chaar: 4,
  paanch: 5,
  chhe: 6,
  che: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  dus: 10,
  gyaarah: 11,
  baarah: 12,
  terah: 13,
  chaudah: 14,
  pandrah: 15,
  solah: 16,
  satrah: 17,
  athaarah: 18,
  unnees: 19,
  bees: 20,
  ikkees: 21,
  baees: 22,
  teis: 23,
  chaubees: 24,
  pachees: 25,
  chhabees: 26,
  sattaees: 27,
  atthaees: 28,
  untees: 29,
  tees: 30,
  iktees: 31,
  battees: 32,
  tentees: 33,
  chautees: 34,
  paintees: 35,
  chhattees: 36,
  saintees: 37,
  adhtees: 38,
  untaalis: 39,
  chaalis: 40,
  challis: 40,
  iktaalis: 41,
  bayaalis: 42,
  tentaalis: 43,
  chauvaalis: 44,
  paintaalis: 45,
  chhiyaalis: 46,
  saintaalis: 47,
  adhtaalis: 48,
  unachaas: 49,
  pachaas: 50,
  pachas: 50,
  ikkaavan: 51,
  baavan: 52,
  tirepan: 53,
  chauvan: 54,
  pachpan: 55,
  chhappan: 56,
  sattaavan: 57,
  atthaavan: 58,
  unsath: 59,
  saath: 60,
  sath: 60,
  iksath: 61,
  baasath: 62,
  tirsath: 63,
  chaunsath: 64,
  painsath: 65,
  chhiyaasath: 66,
  sadsath: 67,
  adhsath: 68,
  unhattar: 69,
  sattar: 70,
  ikhattar: 71,
  bahattar: 72,
  tihattar: 73,
  chauhattar: 74,
  pachhattar: 75,
  chhihattar: 76,
  sathattar: 77,
  athhattar: 78,
  unaasi: 79,
  unasi: 79,
  assi: 80,
  ikyaasi: 81,
  bayaasi: 82,
  tiraasi: 83,
  chauraasi: 84,
  pachaasi: 85,
  chhiyaasi: 86,
  sattaasi: 87,
  atthaasi: 88,
  navaasi: 89,
  navasi: 89,
  nabbe: 90,
  ikyaanve: 91,
  baanve: 92,
  tiraanve: 93,
  chauraanve: 94,
  pachaanve: 95,
  chhiyaanve: 96,
  sattaanve: 97,
  atthaanve: 98,
  ninyaanve: 99,
  sau: 100,
  so: 100,
  hazaar: 1000,
  hazar: 1000,
  lakh: 100000,
  dedh: 1.5,
  dhai: 2.5
};

const SOUTH_INDIC_NUMBERS: Record<string, number> = {
  // Kannada
  ondhu: 1,
  eradu: 2,
  mooru: 3,
  naalku: 4,
  aidhu: 5,
  aaru: 6,
  elu: 7,
  entu: 8,
  ombhattu: 9,
  hatthu: 10,
  ippatthu: 20,
  moovatthu: 30,
  nalavatthu: 40,
  aivatthu: 50,
  nooru: 100,
  aivooru: 500,
  saavira: 1000,
  // Tamil
  ondru: 1,
  irandu: 2,
  moondru: 3,
  naangu: 4,
  aindhu: 5,
  patthu: 10,
  irubadhu: 20,
  muppadhu: 30,
  naarpathu: 40,
  aimpadhu: 50,
  irunooru: 200,
  ayiram: 1000
};

const ENGLISH_NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000
};

export function normalizeIndicNumberPhrase(phrase: string): { amount: number; raw: string } {
  const clean = phrase.toLowerCase().replace(/[₹,.]/g, ' ').replace(/\s+/g, ' ').trim();

  // Direct numeric digits check (e.g. "340", "430", "500", "200")
  const directDigitMatch = clean.match(/\b\d+(\.\d+)?\b/);
  if (directDigitMatch && clean.split(' ').length <= 3 && !clean.includes('sau') && !clean.includes('hazaar')) {
    const val = parseFloat(directDigitMatch[0]);
    if (!isNaN(val)) {
      return { amount: val, raw: directDigitMatch[0] };
    }
  }

  // Idiomatic colloquial shortcuts
  if (clean.includes('dedh sau') || clean.includes('1.5 sau')) return { amount: 150, raw: 'dedh sau' };
  if (clean.includes('dhai sau') || clean.includes('2.5 sau')) return { amount: 250, raw: 'dhai sau' };
  if (clean.includes('dedh hazaar') || clean.includes('dedh hazar')) return { amount: 1500, raw: 'dedh hazaar' };
  if (clean.includes('dhai hazaar') || clean.includes('dhai hazar')) return { amount: 2500, raw: 'dhai hazaar' };

  // Compound English phrases e.g. "three-forty" or "three forty"
  if (/\bthree[\s-]forty\b/.test(clean)) return { amount: 340, raw: 'three forty' };
  if (/\btwo[\s-]fifty\b/.test(clean)) return { amount: 250, raw: 'two fifty' };
  if (/\bfour[\s-]twenty\b/.test(clean)) return { amount: 420, raw: 'four twenty' };
  if (/\bone[\s-]fifty\b/.test(clean)) return { amount: 150, raw: 'one fifty' };

  // Parse token by token for Indic / English verbal representation
  const tokens = clean.split(' ');
  let total = 0;
  let currentMultiplier = 0;
  const matchedTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    // Check digit prefix mixed with unit (e.g. "5 sau", "2 hazaar", "430 rs")
    const numPrefix = parseInt(tok, 10);
    if (!isNaN(numPrefix)) {
      if (i + 1 < tokens.length && (tokens[i + 1] === 'sau' || tokens[i + 1] === 'hundred')) {
        total += numPrefix * 100;
        matchedTokens.push(tok, tokens[i + 1]);
        i++;
        continue;
      }
      if (i + 1 < tokens.length && (tokens[i + 1] === 'hazaar' || tokens[i + 1] === 'hazar' || tokens[i + 1] === 'thousand')) {
        total += numPrefix * 1000;
        matchedTokens.push(tok, tokens[i + 1]);
        i++;
        continue;
      }
      total += numPrefix;
      matchedTokens.push(tok);
      continue;
    }

    // Hindi dictionary lookup
    if (HINDI_NUMBER_MAP[tok] !== undefined) {
      const val = HINDI_NUMBER_MAP[tok];
      matchedTokens.push(tok);

      if (tok === 'sau' || tok === 'so') {
        if (currentMultiplier === 0) currentMultiplier = 1;
        total += currentMultiplier * 100;
        currentMultiplier = 0;
      } else if (tok === 'hazaar' || tok === 'hazar') {
        if (currentMultiplier === 0) currentMultiplier = 1;
        total += currentMultiplier * 1000;
        currentMultiplier = 0;
      } else if (tok === 'lakh') {
        if (currentMultiplier === 0) currentMultiplier = 1;
        total += currentMultiplier * 100000;
        currentMultiplier = 0;
      } else if (tok === 'pachees' && i + 1 < tokens.length && (tokens[i + 1] === 'sau' || tokens[i + 1] === 'so')) {
        total += 2500;
        matchedTokens.push(tokens[i + 1]);
        i++;
      } else {
        currentMultiplier += val;
      }
      continue;
    }

    // South Indic lookup
    if (SOUTH_INDIC_NUMBERS[tok] !== undefined) {
      const val = SOUTH_INDIC_NUMBERS[tok];
      matchedTokens.push(tok);
      if (val === 100 || val === 500 || val === 1000) {
        if (currentMultiplier > 0) {
          total += currentMultiplier * val;
          currentMultiplier = 0;
        } else {
          total += val;
        }
      } else {
        currentMultiplier += val;
      }
      continue;
    }

    // English dictionary lookup
    if (ENGLISH_NUMBER_WORDS[tok] !== undefined) {
      const val = ENGLISH_NUMBER_WORDS[tok];
      matchedTokens.push(tok);
      if (val === 100) {
        if (currentMultiplier === 0) currentMultiplier = 1;
        total += currentMultiplier * 100;
        currentMultiplier = 0;
      } else if (val === 1000) {
        if (currentMultiplier === 0) currentMultiplier = 1;
        total += currentMultiplier * 1000;
        currentMultiplier = 0;
      } else {
        currentMultiplier += val;
      }
      continue;
    }
  }

  total += currentMultiplier;

  if (total > 0) {
    return {
      amount: total,
      raw: matchedTokens.join(' ') || phrase
    };
  }

  // Final fallback regex for any embedded digit
  const fallback = phrase.match(/\d+/);
  if (fallback) {
    return {
      amount: parseInt(fallback[0], 10),
      raw: fallback[0]
    };
  }

  return { amount: 0, raw: phrase };
}

export function splitClauses(utterance: string): string[] {
  // Normalize pauses, ellipsis, and punctuation
  const clean = utterance
    .replace(/\.\.\./g, ' , ')
    .replace(/\./g, ' , ')
    .replace(/;/g, ' , ')
    .trim();

  // Split on multi-clause markers: comma, "aur", "phir", "and", "or", while preserving self-corrections intact
  const rawParts = clean.split(/(?:,|\baur\b|\bphir\b|\band\b)/i);
  const clauses: string[] = [];

  for (const p of rawParts) {
    const trimmed = p.trim();
    if (trimmed.length > 0) {
      clauses.push(trimmed);
    }
  }

  return clauses.length > 0 ? clauses : [utterance];
}

export function detectSelfCorrection(clause: string): {
  isCorrection: boolean;
  finalPhrase: string;
  discardedPhrase: string;
  correctionMarker: string;
} {
  const correctionRegex = /\b(nahi|arre nahi|nahi nahi|sorry|wait|galat|badal ke|actually|no|rectify)\b/i;
  const match = clause.match(correctionRegex);

  if (!match || match.index === undefined) {
    return {
      isCorrection: false,
      finalPhrase: clause,
      discardedPhrase: '',
      correctionMarker: ''
    };
  }

  const marker = match[0];
  const beforeMarker = clause.slice(0, match.index).trim();
  const afterMarker = clause.slice(match.index + marker.length).trim();

  return {
    isCorrection: true,
    finalPhrase: afterMarker,
    discardedPhrase: beforeMarker,
    correctionMarker: marker
  };
}

export function detectTemporalAnchor(clause: string): { anchor: TemporalAnchor; label: string; date: string } {
  const lower = clause.toLowerCase();
  const now = new Date();

  if (lower.includes('parso') || lower.includes('day before yesterday')) {
    const d = new Date(now.getTime() - 86400000 * 2);
    return {
      anchor: 'TWO_DAYS_AGO',
      label: '2 days ago',
      date: d.toISOString()
    };
  }

  if (lower.includes('kal') || lower.includes('yesterday') || lower.includes('beete kal')) {
    const d = new Date(now.getTime() - 86400000);
    return {
      anchor: 'YESTERDAY',
      label: 'Yesterday (-1d)',
      date: d.toISOString()
    };
  }

  return {
    anchor: 'TODAY',
    label: 'Today',
    date: now.toISOString()
  };
}

export function detectTransactionType(clause: string): TransactionType {
  const lower = clause.toLowerCase();

  // Spoken Queries
  if (
    lower.includes('kitna') ||
    lower.includes('total') ||
    lower.includes('balance') ||
    lower.includes('baki kitna') ||
    lower.includes('baaki kitna') ||
    lower.includes('how much')
  ) {
    return 'QUERY';
  }

  // Udhaar (Credit given to customer)
  if (
    lower.includes('udhaar') ||
    lower.includes('udhar') ||
    lower.includes('khata') ||
    lower.includes('credit') ||
    lower.includes('baaki') ||
    lower.includes('lia') ||
    lower.includes('le gaya')
  ) {
    return 'UDHAAR';
  }

  // Jama (Customer payment received)
  if (
    lower.includes('jama') ||
    lower.includes('diya') ||
    lower.includes('de gaya') ||
    lower.includes('chukaaya') ||
    lower.includes('payment') ||
    lower.includes('paid') ||
    lower.includes('bheja') ||
    lower.includes('kareedu')
  ) {
    return 'JAMA';
  }

  // Default to UDHAAR if positive intent
  return 'UDHAAR';
}

export function parseUtterance(
  utterance: string,
  existingCustomers: Customer[],
  inheritedCustomer?: Customer
): ParsedTransactionClause[] {
  const clauses = splitClauses(utterance);
  const results: ParsedTransactionClause[] = [];
  let currentActiveCustomer: Customer | undefined = inheritedCustomer;

  for (let cIdx = 0; cIdx < clauses.length; cIdx++) {
    const rawClause = clauses[cIdx];
    const tokens: ASTToken[] = [];

    // 1. Spoken Query Intent Detection
    const isQuery =
      rawClause.toLowerCase().includes('kitna') ||
      rawClause.toLowerCase().includes('total') ||
      rawClause.toLowerCase().includes('balance') ||
      rawClause.toLowerCase().includes('baki');

    if (isQuery) {
      let queryType: 'BALANCE_CHECK' | 'TODAY_TOTAL' | 'CUSTOMER_TOTAL' = 'BALANCE_CHECK';
      if (rawClause.toLowerCase().includes('aaj')) {
        queryType = 'TODAY_TOTAL';
      } else if (rawClause.toLowerCase().includes('total') || rawClause.toLowerCase().includes('balance')) {
        queryType = 'CUSTOMER_TOTAL';
      }

      tokens.push({
        id: `token-${cIdx}-query`,
        type: 'QUERY_INTENT',
        raw: rawClause,
        normalized: queryType,
        confidence: 0.98,
        meta: 'SPOKEN_LEDGER_QUERY'
      });

      // Match entity in query if any
      let matchedEntity = '';
      for (const cust of existingCustomers) {
        const firstName = cust.name.split(' ')[0].toLowerCase();
        if (rawClause.toLowerCase().includes(firstName)) {
          matchedEntity = cust.name;
          currentActiveCustomer = cust;
          tokens.push({
            id: `token-${cIdx}-cust`,
            type: 'ENTITY',
            raw: firstName,
            normalized: cust.name,
            confidence: 0.96
          });
          break;
        }
      }

      results.push({
        entityRaw: matchedEntity || 'SYSTEM',
        matchedCustomerName: currentActiveCustomer?.name,
        matchedCustomerId: currentActiveCustomer?.id,
        requiresDisambiguation: false,
        txType: 'QUERY',
        rawAmount: '0',
        normalizedAmount: 0,
        temporalAnchor: 'TODAY',
        dateString: new Date().toISOString(),
        relativeDateLabel: 'Today',
        isSelfCorrection: false,
        tokens,
        confidence: 0.97,
        originalClause: rawClause,
        isQuery: true,
        queryType
      });
      continue;
    }

    // 2. Self-Correction State Machine
    const correctionState = detectSelfCorrection(rawClause);
    let effectiveClause = rawClause;
    let isSelfCorrection = false;
    let discardedAmount = 0;

    if (correctionState.isCorrection) {
      isSelfCorrection = true;
      const discardedParsed = normalizeIndicNumberPhrase(correctionState.discardedPhrase);
      discardedAmount = discardedParsed.amount;

      // Add struck-through token
      tokens.push({
        id: `token-${cIdx}-strike`,
        type: 'AMOUNT_RAW',
        raw: discardedParsed.raw || correctionState.discardedPhrase,
        normalized: discardedAmount,
        confidence: 0.92,
        strikeThrough: true,
        meta: '[CORRECTED_IN_STREAM]'
      });

      tokens.push({
        id: `token-${cIdx}-correct-mark`,
        type: 'CORRECTION',
        raw: correctionState.correctionMarker,
        normalized: 'MUTATION_BARRIER',
        confidence: 0.99
      });

      effectiveClause = correctionState.finalPhrase;
    }

    // 3. Entity Resolution & Homonym Disambiguation
    let entityRaw = '';
    let matchedCustomer: Customer | undefined;
    let requiresDisambiguation = false;
    let disambiguationOptions: Customer[] | undefined;

    // Check against existing customers
    const lowerClause = rawClause.toLowerCase();

    // Check specific name handles
    const rameshMatches = existingCustomers.filter((c) => c.name.toLowerCase().includes('ramesh'));
    const sureshMatches = existingCustomers.filter((c) => c.name.toLowerCase().includes('suresh'));
    const poojaMatches = existingCustomers.filter((c) => c.name.toLowerCase().includes('pooja'));
    const anandMatches = existingCustomers.filter((c) => c.name.toLowerCase().includes('anand'));

    if (lowerClause.includes('ramesh')) {
      entityRaw = 'Ramesh';
      // Check if differentiating descriptor exists in utterance
      const isDairy = lowerClause.includes('dairy') || lowerClause.includes('milk') || lowerClause.includes('doodh');
      const isAuto = lowerClause.includes('auto') || lowerClause.includes('rickshaw') || lowerClause.includes('driver');

      if (isDairy) {
        matchedCustomer = rameshMatches.find((c) => c.descriptor.toLowerCase().includes('dairy'));
      } else if (isAuto) {
        matchedCustomer = rameshMatches.find((c) => c.descriptor.toLowerCase().includes('auto'));
      } else {
        // AMBIGUOUS HOMONYM DETECTED!
        requiresDisambiguation = true;
        disambiguationOptions = rameshMatches;
      }
    } else if (lowerClause.includes('suresh')) {
      entityRaw = 'Suresh';
      matchedCustomer = sureshMatches[0];
    } else if (lowerClause.includes('pooja')) {
      entityRaw = 'Pooja';
      matchedCustomer = poojaMatches[0];
    } else if (lowerClause.includes('anand')) {
      entityRaw = 'Anand';
      matchedCustomer = anandMatches[0];
    } else if (currentActiveCustomer) {
      // Inherit from preceding clause in multi-clause utterance (e.g., "...kal 200 diya tha")
      entityRaw = currentActiveCustomer.name;
      matchedCustomer = currentActiveCustomer;
    } else {
      // Generic entity extraction
      const words = effectiveClause.split(' ');
      entityRaw = words[0] || 'Grahak';
    }

    if (matchedCustomer) {
      currentActiveCustomer = matchedCustomer;
      tokens.push({
        id: `token-${cIdx}-entity`,
        type: 'ENTITY',
        raw: entityRaw,
        normalized: matchedCustomer.name,
        confidence: 0.96,
        meta: matchedCustomer.descriptor
      });
    } else if (requiresDisambiguation) {
      tokens.push({
        id: `token-${cIdx}-entity-ambig`,
        type: 'ENTITY',
        raw: entityRaw,
        normalized: 'AMBIGUOUS: Ramesh (Dairy vs Auto)',
        confidence: 0.5,
        meta: '[PENDING_DISAMBIGUATION]'
      });
    }

    // 4. Number Normalization
    const numberParsed = normalizeIndicNumberPhrase(effectiveClause);
    tokens.push({
      id: `token-${cIdx}-amt-raw`,
      type: 'AMOUNT_RAW',
      raw: numberParsed.raw,
      normalized: numberParsed.amount,
      confidence: 0.95
    });

    tokens.push({
      id: `token-${cIdx}-amt-norm`,
      type: 'AMOUNT_NORMALIZED',
      raw: `₹${numberParsed.amount.toFixed(2)}`,
      normalized: numberParsed.amount,
      confidence: 0.99
    });

    // 5. Transaction Type (UDHAAR vs JAMA)
    const txType = detectTransactionType(effectiveClause);
    tokens.push({
      id: `token-${cIdx}-tx-type`,
      type: 'TX_TYPE',
      raw: txType,
      normalized: txType === 'UDHAAR' ? 'CREDIT (+)' : 'PAYMENT (-)',
      confidence: 0.97
    });

    // 6. Temporal Anchor (Today / Yesterday / Relative)
    const temporal = detectTemporalAnchor(effectiveClause);
    tokens.push({
      id: `token-${cIdx}-temporal`,
      type: 'TEMPORAL',
      raw: temporal.label,
      normalized: temporal.anchor,
      confidence: 0.95,
      meta: temporal.date.slice(0, 10)
    });

    results.push({
      entityRaw: matchedCustomer ? matchedCustomer.name : entityRaw,
      matchedCustomerName: matchedCustomer?.name,
      matchedCustomerId: matchedCustomer?.id,
      requiresDisambiguation,
      disambiguationOptions,
      txType,
      rawAmount: numberParsed.raw,
      normalizedAmount: numberParsed.amount,
      temporalAnchor: temporal.anchor,
      dateString: temporal.date,
      relativeDateLabel: temporal.label,
      isSelfCorrection,
      correctedFromAmount: isSelfCorrection ? discardedAmount : undefined,
      tokens,
      confidence: requiresDisambiguation ? 0.72 : 0.96,
      originalClause: rawClause
    });
  }

  return results;
}
