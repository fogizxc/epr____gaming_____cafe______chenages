const REGISTERED_ACCOUNTS_KEY = 'nexus_gaming_cafe_v1_registeredAccounts';
const REFRESH_TOKEN_KEY = 'nexus_gaming_cafe_v1_refreshToken';
const LEGACY_REFRESH_KEYS = ['refreshToken', 'nexus_refresh_token', 'auth_refresh_token'];

/**
 * One-time migration for legacy browser storage.
 * Older builds could persist plaintext passwords and refresh tokens in localStorage.
 * Production authentication is server-side, so browser storage must never retain them.
 */
export function scrubLegacyCredentialStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.map((account) => {
          if (!account || typeof account !== 'object') return account;
          const copy = { ...(account as Record<string, unknown>) };
          delete copy.password;
          delete copy.passwordHash;
          delete copy.passwordSalt;
          return copy;
        });
        window.localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(sanitized));
      }
    }

    // Remove only known legacy refresh-token locations. The current server flow uses
    // an HttpOnly cookie, so there is no reason for a browser-readable refresh token.
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    for (const key of LEGACY_REFRESH_KEYS) window.localStorage.removeItem(key);
  } catch {
    // Never block application startup because of malformed legacy storage.
  }
}

scrubLegacyCredentialStorage();
