// src/types/user.ts
export type UserRole = "admin" | "user";

export type User = {
  id: number;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
};
