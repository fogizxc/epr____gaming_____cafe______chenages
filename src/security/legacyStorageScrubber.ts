const REGISTERED_ACCOUNTS_KEY = 'nexus_gaming_cafe_v1_registeredAccounts';

/**
 * One-time migration for legacy browser storage.
 * Older builds could persist plaintext passwords in registeredAccounts.
 * Production authentication is server-side, so browser storage must never retain them.
 */
export function scrubLegacyCredentialStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) return;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const sanitized = parsed.map((account) => {
      if (!account || typeof account !== 'object') return account;
      const copy = { ...(account as Record<string, unknown>) };
      delete copy.password;
      delete copy.passwordHash;
      delete copy.passwordSalt;
      return copy;
    });

    window.localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(sanitized));
  } catch {
    // Never block application startup because of a malformed legacy value.
  }
}

scrubLegacyCredentialStorage();
