const REGISTERED_ACCOUNTS_KEY = 'nexus_gaming_cafe_v1_registeredAccounts';
const REFRESH_TOKEN_KEY = 'nexus_gaming_cafe_v1_refreshToken';
const LEGACY_REFRESH_KEYS = ['refreshToken', 'nexus_refresh_token', 'auth_refresh_token'];

const ARRAY_STATE_KEYS = ['systems','activeSessions','bookings','pricingRules','priceHistory','tournaments','tournamentTeams','tournamentMatches','fnbProducts','invoices','walletTransactions','waitlist','auditLogs','registeredAccounts','employees'];
const PREFIX = 'nexus_gaming_cafe_v1_';

/** Normalize legacy browser state before any React component can consume it. */
export function scrubLegacyCredentialStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(REGISTERED_ACCOUNTS_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    for (const key of LEGACY_REFRESH_KEYS) window.localStorage.removeItem(key);

    // Every collection consumed as an array must either contain a real JSON array or be removed.
    // Removing invalid state makes CafeContext use its typed INITIAL_* fallback instead of
    // allowing undefined/null/object values to reach .filter(), .map(), .find(), etc.
    for (const stateKey of ARRAY_STATE_KEYS) {
      const key = PREFIX + stateKey;
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
    // Storage access must never prevent the application from booting.
  }
}

scrubLegacyCredentialStorage();
