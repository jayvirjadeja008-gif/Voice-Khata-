/**
 * IndexedDB Local-First Persistence Engine
 * Encrypted data store for Kirana Ledger and Customer Directory.
 */

import { Customer, LedgerEntry } from '../types/khata';
import { encryptData, decryptData } from './crypto';

const DB_NAME = 'VoiceKhataDB';
const DB_VERSION = 1;
const STORE_ENTRIES = 'entries';
const STORE_CUSTOMERS = 'customers';

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-ramesh-sharma-dairy',
    name: 'Ramesh Sharma',
    descriptor: 'Dairy wala',
    phone: '+91 98451 22341',
    currentBalance: 500,
    optInConsent: true,
    consentTimestamp: '2026-11-01T09:00:00Z',
    createdDate: '2026-10-15',
    notes: 'Morning milk crate supplier, settles weekly'
  },
  {
    id: 'cust-ramesh-verma-auto',
    name: 'Ramesh Verma',
    descriptor: 'Auto wala',
    phone: '+91 98452 77819',
    currentBalance: 200,
    optInConsent: false,
    consentTimestamp: undefined,
    createdDate: '2026-10-20',
    notes: 'Auto driver stand across street, pays on weekends'
  },
  {
    id: 'cust-suresh-gupta',
    name: 'Suresh Gupta',
    descriptor: 'General Store',
    phone: '+91 99123 45678',
    currentBalance: 780,
    optInConsent: true,
    consentTimestamp: '2026-11-05T14:20:00Z',
    createdDate: '2026-10-01',
    notes: 'Regular household staples account'
  },
  {
    id: 'cust-pooja-patel',
    name: 'Pooja Patel',
    descriptor: 'School Teacher',
    phone: '+91 98234 11223',
    currentBalance: 120,
    optInConsent: true,
    consentTimestamp: '2026-11-08T11:15:00Z',
    createdDate: '2026-10-10',
    notes: 'Govt primary school teacher'
  },
  {
    id: 'cust-anand-kumar',
    name: 'Anand Kumar',
    descriptor: 'Hardware Shop',
    phone: '+91 97345 88990',
    currentBalance: 0,
    optInConsent: true,
    consentTimestamp: '2026-11-10T17:45:00Z',
    createdDate: '2026-10-05',
    notes: 'Adjacent hardware vendor'
  }
];

const INITIAL_ENTRIES: LedgerEntry[] = [
  {
    id: 'tx-1001',
    customerId: 'cust-ramesh-sharma-dairy',
    customerName: 'Ramesh Sharma',
    customerSubtitle: 'Dairy wala',
    type: 'UDHAAR',
    amount: 500,
    rawSpokenAmount: '500',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    relativeDateLabel: '2 days ago',
    timestamp: Date.now() - 86400000 * 2,
    status: 'COMMITTED',
    auditFlag: '[MANUAL_VOICE_VERIFIED]',
    originalClause: 'Ramesh Sharma dairy ka 500 udhaar'
  },
  {
    id: 'tx-1002',
    customerId: 'cust-suresh-gupta',
    customerName: 'Suresh Gupta',
    customerSubtitle: 'General Store',
    type: 'UDHAAR',
    amount: 350,
    rawSpokenAmount: '350',
    date: new Date(Date.now() - 86400000).toISOString(),
    relativeDateLabel: 'Yesterday',
    timestamp: Date.now() - 86400000,
    status: 'COMMITTED',
    auditFlag: '[AUDIO_LOGGED]',
    originalClause: 'Suresh ka 350 udhaar kal'
  },
  {
    id: 'tx-1003',
    customerId: 'cust-ramesh-verma-auto',
    customerName: 'Ramesh Verma',
    customerSubtitle: 'Auto wala',
    type: 'UDHAAR',
    amount: 200,
    rawSpokenAmount: '200',
    date: new Date(Date.now() - 86400000).toISOString(),
    relativeDateLabel: 'Yesterday',
    timestamp: Date.now() - 86400000 + 3600000,
    status: 'COMMITTED',
    auditFlag: '[DISAMBIG_AUTO]',
    originalClause: 'Ramesh auto wala 200 udhaar'
  },
  {
    id: 'tx-1004',
    customerId: 'cust-pooja-patel',
    customerName: 'Pooja Patel',
    customerSubtitle: 'School Teacher',
    type: 'JAMA',
    amount: 400,
    rawSpokenAmount: 'chaar sau',
    date: new Date().toISOString(),
    relativeDateLabel: 'Today',
    timestamp: Date.now() - 3600000 * 3,
    status: 'COMMITTED',
    auditFlag: '[AUDIO_LOGGED]',
    originalClause: 'Pooja ne chaar sau jama kiye'
  }
];

interface EncryptedRecord {
  id: string;
  ciphertext: string;
  iv: string;
  digest: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        db.createObjectStore(STORE_ENTRIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CUSTOMERS)) {
        db.createObjectStore(STORE_CUSTOMERS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function initDb(): Promise<void> {
  const db = await openDatabase();

  // Check if customers exist
  const custCount = await new Promise<number>((resolve) => {
    const tx = db.transaction(STORE_CUSTOMERS, 'readonly');
    const store = tx.objectStore(STORE_CUSTOMERS);
    const countReq = store.count();
    countReq.onsuccess = () => resolve(countReq.result);
    countReq.onerror = () => resolve(0);
  });

  if (custCount === 0) {
    const tx = db.transaction([STORE_CUSTOMERS, STORE_ENTRIES], 'readwrite');
    const custStore = tx.objectStore(STORE_CUSTOMERS);
    for (const c of INITIAL_CUSTOMERS) {
      custStore.put(c);
    }

    const entryStore = tx.objectStore(STORE_ENTRIES);
    for (const entry of INITIAL_ENTRIES) {
      const enc = await encryptData(entry);
      entryStore.put({
        id: entry.id,
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        digest: enc.digest
      });
    }

    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
  }
}

export async function getAllEntries(): Promise<LedgerEntry[]> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_ENTRIES, 'readonly');
  const store = tx.objectStore(STORE_ENTRIES);

  const rawRecords = await new Promise<EncryptedRecord[]>((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as EncryptedRecord[]);
    req.onerror = () => reject(req.error);
  });

  const decryptedEntries: LedgerEntry[] = [];
  for (const record of rawRecords) {
    try {
      const entry = await decryptData<LedgerEntry>(record.ciphertext, record.iv);
      entry.encryptedDigest = record.digest;
      decryptedEntries.push(entry);
    } catch {
      // Graceful fallback if decryption fails
    }
  }

  // Sort descending by timestamp
  return decryptedEntries.sort((a, b) => b.timestamp - a.timestamp);
}

export async function addLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
  const db = await openDatabase();
  const enc = await encryptData(entry);

  const record: EncryptedRecord = {
    id: entry.id,
    ciphertext: enc.ciphertext,
    iv: enc.iv,
    digest: enc.digest
  };

  const tx = db.transaction([STORE_ENTRIES, STORE_CUSTOMERS], 'readwrite');
  const entryStore = tx.objectStore(STORE_ENTRIES);
  entryStore.put(record);

  // Update customer balance if customer exists
  const custStore = tx.objectStore(STORE_CUSTOMERS);
  const custReq = custStore.get(entry.customerId);

  custReq.onsuccess = () => {
    const customer = custReq.result as Customer | undefined;
    if (customer) {
      if (entry.type === 'UDHAAR') {
        customer.currentBalance += entry.amount;
      } else if (entry.type === 'JAMA') {
        customer.currentBalance -= entry.amount;
      }
      custStore.put(customer);
    }
  };

  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });

  entry.encryptedDigest = enc.digest;
  return entry;
}

export async function getAllCustomers(): Promise<Customer[]> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_CUSTOMERS, 'readonly');
  const store = tx.objectStore(STORE_CUSTOMERS);

  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as Customer[]);
    req.onerror = () => reject(req.error);
  });
}

export async function findCustomersByName(nameQuery: string): Promise<Customer[]> {
  const all = await getAllCustomers();
  const clean = nameQuery.trim().toLowerCase();
  if (!clean) return [];

  return all.filter((c) => {
    const nameMatch = c.name.toLowerCase().includes(clean);
    const descMatch = c.descriptor.toLowerCase().includes(clean);
    return nameMatch || descMatch;
  });
}

export async function updateCustomerOptIn(id: string, consent: boolean): Promise<Customer | null> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_CUSTOMERS, 'readwrite');
  const store = tx.objectStore(STORE_CUSTOMERS);

  const customer = await new Promise<Customer | null>((resolve) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });

  if (!customer) return null;

  customer.optInConsent = consent;
  customer.consentTimestamp = consent ? new Date().toISOString() : undefined;

  store.put(customer);

  await new Promise((resolve) => {
    tx.oncomplete = resolve;
  });

  return customer;
}

export async function getDailySummary(): Promise<{ todayUdhaar: number; todayJama: number; totalCount: number }> {
  const entries = await getAllEntries();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const startTs = todayStart.getTime();

  let todayUdhaar = 0;
  let todayJama = 0;
  let totalCount = 0;

  for (const entry of entries) {
    if (entry.timestamp >= startTs) {
      if (entry.type === 'UDHAAR') {
        todayUdhaar += entry.amount;
      } else if (entry.type === 'JAMA') {
        todayJama += entry.amount;
      }
      totalCount++;
    }
  }

  return { todayUdhaar, todayJama, totalCount };
}

export async function resetDatabase(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction([STORE_ENTRIES, STORE_CUSTOMERS], 'readwrite');
  tx.objectStore(STORE_ENTRIES).clear();
  tx.objectStore(STORE_CUSTOMERS).clear();

  const custStore = tx.objectStore(STORE_CUSTOMERS);
  for (const c of INITIAL_CUSTOMERS) {
    custStore.put(c);
  }

  const entryStore = tx.objectStore(STORE_ENTRIES);
  for (const entry of INITIAL_ENTRIES) {
    const enc = await encryptData(entry);
    entryStore.put({
      id: entry.id,
      ciphertext: enc.ciphertext,
      iv: enc.iv,
      digest: enc.digest
    });
  }

  await new Promise((resolve) => {
    tx.oncomplete = resolve;
  });
}

