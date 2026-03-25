export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  plan: 'FREE' | 'CREATOR' | null;
  analysesThisMonth: number;
  googleId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  platform: string | null;
  niche: string | null;
  audienceAgeRange: string | null;
  audienceRegion: string | null;
  audienceLanguage: string | null;
  averageViewCount: string | null;
  biggestFrustration: string | null;
  onboardingCompleted: boolean;
  analysesLimit: number;
  hasPassword: boolean;
  subscriptionStatus: 'active' | 'canceling' | null;
  subscriptionEndDate: string | null;
}

export interface BillingHistoryEntry {
  type: 'payment' | 'event';
  id: string;
  event: string;
  amount: number | null;
  currency: string | null;
  status: string | null;
  details: Record<string, unknown> | null;
  date: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  mustChangeCredentials: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ApiSuccessResponse<T> {
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  error: string;
  message: string[];
  statusCode: number;
}
