export type UserRole = 'staff' | 'admin';

export interface StaffAccount {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
