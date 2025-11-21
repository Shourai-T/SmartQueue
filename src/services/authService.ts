import { apiFetch } from './api';
import type { StaffAccount, AuthUser } from '../types/auth';

interface UserResponse {
  _id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface UserListResponse {
  message: string;
  data: UserResponse[];
}

function decodeJwt<T = any>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export const authService = {
  async signIn(username: string, password: string): Promise<{ error: Error | null }> {
    try {
      const data = await apiFetch<{ access_token: string }>(
        '/auth/login',
        'POST',
        { username, password },
        { auth: false }
      );

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('auth_username', username);

      window.dispatchEvent(new CustomEvent('auth-changed'));
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async signOut() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_username');
    window.dispatchEvent(new CustomEvent('auth-changed'));
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = localStorage.getItem('access_token');
    const storedUsername = localStorage.getItem('auth_username');
    if (!token) return null;

    // Prefer JWT claims when available
    const claims = decodeJwt<{ sub?: string; username?: string; email?: string; role?: string; _id?: string }>(token);
    const username = claims?.username || claims?.email || storedUsername;
    const roleClaim = claims?.role;

    if (username && roleClaim) {
      return {
        id: claims?._id || claims?.sub || username,
        email: username,
        role: roleClaim === 'admin' ? 'admin' : 'staff',
      };
    }

    // No claims: cannot resolve role without backend; avoid calling stub /user
    return null;
  },

  async createStaffAccount(username: string, password: string, role: 'staff' | 'admin' = 'staff'): Promise<StaffAccount> {
    const apiRole = role === 'admin' ? 'admin' : 'user';
    
    const user = await apiFetch<UserResponse>(
      '/user',
      'POST',
      { username, password, role: apiRole }
    );

    return {
      id: user._id,
      email: user.username,
      role: user.role === 'admin' ? 'admin' : 'staff',
      is_active: true,
      created_at: user.createdAt || new Date().toISOString(),
    };
  },

  async getAllStaffAccounts(): Promise<StaffAccount[]> {
    try {
      const response = await apiFetch<UserListResponse>('/user', 'GET');
      
      // Extract data array from wrapped response
      const users = response?.data || [];
      
      // Validate response is an array
      if (!Array.isArray(users)) {
        console.warn('GET /user data is not an array:', users);
        return [];
      }
      
      return users.map(user => ({
        id: user._id,
        email: user.username,
        role: user.role === 'admin' ? 'admin' : 'staff',
        is_active: true,
        created_at: user.createdAt || new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Failed to load staff accounts:', e);
      return [];
    }
  },

  async updateStaffAccount(id: string, updates: Partial<StaffAccount>) {
    // Backend API doesn't have update endpoint yet, using PATCH
    const data = await apiFetch<UserResponse>(
      `/user/${id}`,
      'PATCH',
      updates
    );

    return {
      id: data._id,
      email: data.username,
      role: data.role === 'admin' ? 'admin' : 'staff',
      is_active: true,
      created_at: data.createdAt || new Date().toISOString(),
    };
  },

  async deleteStaffAccount(id: string) {
    try {
      await apiFetch<void>(`/user/${id}`, 'DELETE');
    } catch (e) {
      // DELETE might return text stub; if error mentions non-JSON, treat as success
      const errMsg = e instanceof Error ? e.message : '';
      if (errMsg.includes('Expected JSON but got non-JSON')) {
        console.warn('DELETE returned non-JSON (stub), treating as success');
        return;
      }
      throw e;
    }
  },
};
