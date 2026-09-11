const REGISTERED_ACCOUNTS_KEY = 'nexus_gaming_cafe_v1_registeredAccounts';
const REFRESH_TOKEN_KEY = 'nexus_gaming_cafe_v1_refreshToken';
const LEGACY_REFRESH_KEYS = ['refreshToken', 'nexus_refresh_token', 'auth_refresh_token'];

/**
 * One-time migration for legacy browser storage.
 * Older builds could persist plaintext passwords and refresh tokens in localStorage.
 * Production authentication is server-side, so browser storage must never retain
 * the legacy account database or any refresh credential.
 */
export function scrubLegacyCredentialStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    // The legacy account database could contain passwords. Do not migrate or rewrite
    // it: delete the entire browser-side database so no credential-bearing record can
    // survive a production upgrade.
    window.localStorage.removeItem(REGISTERED_ACCOUNTS_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    for (const key of LEGACY_REFRESH_KEYS) window.localStorage.removeItem(key);
  } catch {
    // Never block application startup because of storage access/migration failures.
  }
}

scrubLegacyCredentialStorage();
