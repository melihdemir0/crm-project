// src/types/activity.ts

/** Backend'den gelen type (BÜYÜK HARF) */
export type ActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "NOTE"
  | "CONVERTED"
  | "LOST"
  | "STATUS_CHANGED";

/** UI'da kullandığımız type (küçük harf) */
export type ActivityTypeUi =
  | "call"
  | "email"
  | "meeting"
  | "note"
  | "converted"
  | "lost"
  | "status_changed";

/** Backend response shape (DTO) */
export type ActivityDTO = {
  id: number;
  type: ActivityType;

  note?: string | null;
  when?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  leadId?: number | null;
  customerId?: number | null;

  ownerId?: number | null;
  owner?: { id: number; email: string } | null;

  // eager dönerse opsiyonel
  lead?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null;
};

/** UI'da kullandığımız Activity shape (Dialog/Table ile uyumlu) */
export type Activity = {
  id: number;
  type: ActivityTypeUi; // UI küçük harf

  note?: string | null;
  when?: string | null;

  leadId?: number | null;
  customerId?: number | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  ownerId?: number | null;
  owner?: { id: number; email: string } | null;
};

export function toUiType(t: ActivityType): ActivityTypeUi {
  switch (t) {
    case "CALL":
      return "call";
    case "EMAIL":
      return "email";
    case "MEETING":
      return "meeting";
    case "NOTE":
      return "note";
    case "CONVERTED":
      return "converted";
    case "LOST":
      return "lost";
    case "STATUS_CHANGED":
      return "status_changed";
  }
}

export function toBackendType(t: ActivityTypeUi): ActivityType {
  switch (t) {
    case "call":
      return "CALL";
    case "email":
      return "EMAIL";
    case "meeting":
      return "MEETING";
    case "note":
      return "NOTE";
    case "converted":
      return "CONVERTED";
    case "lost":
      return "LOST";
    case "status_changed":
      return "STATUS_CHANGED";
  }
}
