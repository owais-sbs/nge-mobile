import { jwtDecode } from 'jwt-decode';

export interface JWTPayload {
  userId?: number;
  UserId?: number;
  id?: number;
  Id?: number;
  sub?: string;
  email?: string;
  [key: string]: any;
}

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const getUserIdFromToken = (token: string): number | null => {
  const payload = decodeToken(token);
  if (!payload) return null;
  
  // Try different possible field names for user ID
  return payload.userId || payload.UserId || payload.id || payload.Id || null;
};

