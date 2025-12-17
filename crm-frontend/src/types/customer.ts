export type Customer = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  isDeleted?: boolean; // soft delete için
  createdAt?: string;
  updatedAt?: string;
};
