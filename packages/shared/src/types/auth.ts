// Auth & session types

export interface User {
  id: string;
  email: string;
  authId: string;
  createdAt: Date;
}

export interface Session {
  token: string;
  refreshToken: string;
  expiresAt: Date;
  userId: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}
