export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: 'ADMIN' | 'SALES_MANAGER' | 'RM' | 'MARKETING';
  tenantId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}
