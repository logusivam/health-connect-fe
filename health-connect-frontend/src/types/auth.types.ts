export type Role = "PATIENT" | "DOCTOR";

export interface LoginPayload {
  email: string;
  password: string;
  role: Role;
  otp?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
}

export interface ResetPasswordPayload {
  email: string;
  password: string;
  otp: string;
  role: Role;
}