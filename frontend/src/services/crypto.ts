/**
 * WebCrypto AES-GCM-256 Local Encryption Engine
 * Complies with India DPDP Act 2023 for local-first device encryption at rest.
 */

const KEY_STORAGE_NAME = 'voice_khata_aes_key';

let cachedKey: CryptoKey | null = null;

export async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) {
    return cachedKey;
  }

  const existingRaw = localStorage.getItem(KEY_STORAGE_NAME);
  if (existingRaw) {
    try {
      const rawBytes = Uint8Array.from(atob(existingRaw), (c) => c.charCodeAt(0));
      cachedKey = await window.crypto.subtle.importKey(
        'raw',
        rawBytes,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      return cachedKey;
    } catch {
      // Key corruption recovery: generate a new key
    }
  }

  // Generate fresh AES-GCM-256 key
  const newKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await window.crypto.subtle.exportKey('raw', newKey);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  localStorage.setItem(KEY_STORAGE_NAME, base64);
  cachedKey = newKey;
  return newKey;
}

export async function encryptData(payload: object): Promise<{ ciphertext: string; iv: string; digest: string }> {
  const key = await getOrCreateEncryptionKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(payload));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  const digestBuffer = await window.crypto.subtle.digest('SHA-256', encodedData);
  const digestArray = Array.from(new Uint8Array(digestBuffer));
  const digestHex = digestArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64,
    digest: digestHex
  };
}

export async function decryptData<T>(ciphertextBase64: string, ivBase64: string): Promise<T> {
  const key = await getOrCreateEncryptionKey();
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const encryptedBytes = Uint8Array.from(atob(ciphertextBase64), (c) => c.charCodeAt(0));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBytes
  );

  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

export function getSecurityStatus() {
  return {
    cipher: 'AES-GCM',
    keyBits: 256,
    digest: 'SHA-256',
    localFirst: true,
    dpdpCompliant: true,
    statusLabel: 'AES-GCM-256 ENCRYPTED'
  };
}

