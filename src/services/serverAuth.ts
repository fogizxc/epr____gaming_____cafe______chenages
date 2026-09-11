const ACCESS_TOKEN_KEY = 'nexus_gaming_cafe_v1_accessToken';
const REFRESH_TOKEN_KEY = 'nexus_gaming_cafe_v1_refreshToken';

export type ServerAuthUser = {
  id: string;
  email: string;
  name: string;
  gamerTag?: string;
  phone?: string;
  role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN';
  permissions: string[];
  avatar?: string;
};

export type AuthResult = { success: boolean; error?: string; user?: ServerAuthUser };

function persist(payload: any) {
  if (payload.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  if (payload.user) {
    localStorage.setItem('nexus_gaming_cafe_v1_currentUser', JSON.stringify(payload.user));
    localStorage.setItem('nexus_gaming_cafe_v1_isLoggedIn', 'true');
    localStorage.setItem('nexus_gaming_cafe_v1_currentRole', payload.user.role);
  }
}

export async function serverLogin(identifier: string, password: string): Promise<AuthResult> {
  const response = await fetch('/api/auth/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idOrUsername: identifier, password }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) return { success: false, error: payload?.error || 'Invalid credentials' };
  persist(payload);
  return { success: true, user: payload.user };
}

export async function serverRegister(params: { name: string; gamerTag?: string; email: string; phone?: string; password: string }): Promise<AuthResult> {
  const response = await fetch('/api/auth/register', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) return { success: false, error: payload?.error || 'Unable to create account' };
  persist(payload);
  return { success: true, user: payload.user };
}

export function clearServerAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('nexus_gaming_cafe_v1_currentUser');
  localStorage.removeItem('nexus_gaming_cafe_v1_isLoggedIn');
  localStorage.removeItem('nexus_gaming_cafe_v1_currentRole');
}
