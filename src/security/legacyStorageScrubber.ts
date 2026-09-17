const REGISTERED_ACCOUNTS_KEY = 'nexus_gaming_cafe_v1_registeredAccounts';
const REFRESH_TOKEN_KEY = 'nexus_gaming_cafe_v1_refreshToken';
const LEGACY_REFRESH_KEYS = ['refreshToken', 'nexus_refresh_token', 'auth_refresh_token'];

const ARRAY_STATE_KEYS = [
  'systems',
  'activeSessions',
  'bookings',
  'pricingRules',
  'priceHistory',
  'tournaments',
  'tournamentTeams',
  'tournamentMatches',
  'fnbProducts',
  'invoices',
  'walletTransactions',
  'waitlist',
  'auditLogs',
  'registeredAccounts',
  'employees',
];

/**
 * One-time/browser-state migration. Production authentication is server-side.
 * Reset the legacy station state on startup because older builds could persist
 * an incompatible value and cause GameOverviewScreen to call .filter() on it.
 */
export function scrubLegacyCredentialStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(REGISTERED_ACCOUNTS_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    for (const key of LEGACY_REFRESH_KEYS) window.localStorage.removeItem(key);

    // The station list is currently the known crash source. Remove the
    // persisted copy so CafeContext falls back to INITIAL_SYSTEMS.
    window.localStorage.removeItem('nexus_gaming_cafe_v1_systems');

    // Validate the remaining persisted collections without deleting valid data.
    for (const stateKey of ARRAY_STATE_KEYS) {
      if (stateKey === 'systems') continue;
      const key = `nexus_gaming_cafe_v1_${stateKey}`;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) window.localStorage.removeItem(key);
      } catch {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Never block application startup because of storage access/migration failures.
  }
}

scrubLegacyCredentialStorage();
