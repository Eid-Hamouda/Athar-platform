/**
 * Types for the Athar Express backend contract (backend/src).
 * Kept separate from types/index.ts, which models the existing Supabase
 * tables still used by the beneficiary/needs/matching flow.
 */

export type ExpressUserRole = "donor" | "charity" | "volunteer" | "admin";

export interface ExpressUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: ExpressUserRole;
  avatar?: { url: string; publicId: string };
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: ExpressUserRole;
}

export interface AuthResponse {
  user: ExpressUser;
  accessToken: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  location?: string;
}

export interface ExpressCategory {
  _id: string;
  name: string;
  nameAr?: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface ExpressLocation {
  _id: string;
  city: string;
  area?: string;
  address?: string;
}

export type DonationCondition = "new" | "used";
export type DonationStatus = "available" | "reserved" | "donated" | "removed";

export interface ExpressDonation {
  _id: string;
  donor: { _id: string; fullName: string; avatar?: { url: string } } | string;
  title: string;
  description: string;
  category: ExpressCategory | string;
  quantity: number;
  condition: DonationCondition;
  images: { url: string; publicId: string }[];
  location: ExpressLocation | string;
  status: DonationStatus;
  reservedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonationListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: DonationStatus;
  condition?: DonationCondition;
}
