export type Role = 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  name: string;
  emailOrPhone?: string;
  role: Role;
  avatar?: string;
  gamerTag?: string;
}

/**
 * Non-sensitive customer profile used by legacy admin-directory UI.
 *
 * Authentication credentials deliberately do not belong in this type.
 * Passwords are handled exclusively by the server authentication service
 * and must never be persisted in browser state, exported, or synced to
 * Google Sheets.
 *
 * `password?: never` is retained temporarily as a compile-time guard for
 * legacy UI code while the old account-directory controls are retired. It
 * prevents a real password value from being assigned to this model.
 */
export interface RegisteredAccount {
  id: string;
  name: string;
  gamerTag: string;
  email: string;
  phone: string;
  password?: never;
  role: Role;
  createdAt: string;
  isWhatsappVerified: boolean;
  isEmailVerified: boolean;
  avatar?: string;
  syncedToGoogleSheet?: boolean;
}

export type GamingServiceCategory =
  | 'PS5'
  | 'Xbox'
  | 'PS4'
  | 'Gaming PC'
  | 'VIP Room'
  | 'VR'
  | 'Pool Table'
  | 'Sim Racing'
  | 'PlayStation';

