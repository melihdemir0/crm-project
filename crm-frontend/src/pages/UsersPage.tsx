// src/pages/UsersPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import type { Paginated } from "../lib/api";
import { Users } from "../lib/api";
import type { User, UserRole } from "../types/user";
import UserTable from "../components/users/UserTable";
import { useAuth } from "../context/AuthContext";

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "ASC" | "DESC";
};

const DEFAULT_META: Meta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  sort: "createdAt",
  order: "DESC",
};

type Row = User & { _roleDraft?: UserRole; _dirty?: boolean };

function toRows(data: any[]): Row[] {
  return (data ?? []).map((u: any) => ({
    id: u.id,
    email: u.email,
    role: String(u.role || "user").toLowerCase() as UserRole,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    _roleDraft: undefined,
    _dirty: false,
  }));
}

export default function UsersPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta>(DEFAULT_META);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    severity: "success" | "error";
  }>({ open: false, msg: "", severity: "success" });

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(meta?.page ?? 1));
    p.set("limit", String(meta?.limit ?? 10));
    p.set("sort", meta?.sort || "createdAt");
    p.set("order", (meta?.order as "ASC" | "DESC") || "DESC");
    if (q.trim()) p.set("q", q.trim());
    return `?${p.toString()}`;
  }, [meta?.page, meta?.limit, meta?.sort, meta?.order, q]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = (await Users.list(query as any, meta.page, meta.limit)) as
        | Paginated<any>
        | any[];

      if (Array.isArray(resp)) {
        const data = toRows(resp);
        setRows(data);
        setMeta({
          ...DEFAULT_META,
          total: data.length,
          totalPages: 1,
          page: 1,
          limit: data.length || 10,
        });
      } else {
        const data = toRows(resp.data ?? []);
        setRows(data);

        const incomingMeta = resp.meta;
        setMeta({
          page: Number(incomingMeta?.page ?? DEFAULT_META.page),
          limit: Number(incomingMeta?.limit ?? DEFAULT_META.limit),
          total: Number(incomingMeta?.total ?? data.length ?? 0),
          totalPages: Number(
            incomingMeta?.totalPages ??
              Math.max(
                1,
                Math.ceil(
                  (incomingMeta?.total ?? data.length ?? 0) /
                    (incomingMeta?.limit ?? DEFAULT_META.limit)
                )
              )
          ),
          sort: String(incomingMeta?.sort ?? DEFAULT_META.sort),
          order:
            (String(incomingMeta?.order ?? DEFAULT_META.order).toUpperCase() as
              | "ASC"
              | "DESC") ?? "DESC",
        });
      }
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Load error",
        severity: "error",
      });
      setMeta((m) => m ?? DEFAULT_META);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ✅ Role dropdown değişince draft+dirty state’i burada yönetiyoruz (IMMUTABLE)
  const handleDraftRoleChange = (id: number, newRole: UserRole) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              _roleDraft: newRole,
              _dirty: newRole !== r.role,
            }
          : r
      )
    );
  };

  const handleSaveRole = async (u: Row) => {
    if (!isAdmin) {
      setToast({
        open: true,
        msg: "You don't have permission.",
        severity: "error",
      });
      return;
    }
    try {
      const next = (u._roleDraft ?? u.role) as UserRole;
      await Users.updateRole(u.id, next);

      // UI anında düzelsin diye local update (load beklemeden)
      setRows((prev) =>
        prev.map((r) =>
          r.id === u.id
            ? { ...r, role: next, _roleDraft: undefined, _dirty: false }
            : r
        )
      );

      setToast({ open: true, msg: "Role updated", severity: "success" });
      // istersen load() bırakabiliriz; ama local update daha iyi
      // await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Update error",
        severity: "error",
      });
    }
  };

  const handleDelete = async (u: Row) => {
    if (!isAdmin) {
      setToast({
        open: true,
        msg: "You don't have permission.",
        severity: "error",
      });
      return;
    }
    try {
      await Users.remove(u.id);

      // UI’dan anında kaldır
      setRows((prev) => prev.filter((r) => r.id !== u.id));

      setToast({ open: true, msg: "User deleted", severity: "success" });
      // await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Delete error",
        severity: "error",
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3, position: "relative" }}>
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <UserTable
        rows={rows}
        meta={meta}
        q={q}
        onChangeQ={(val) => {
          setQ(val);
          setMeta((m) => ({ ...m, page: 1 }));
        }}
        onPageChange={(p) => setMeta((m) => ({ ...m, page: p }))}
        canManage={isAdmin}
        onDraftRoleChange={isAdmin ? handleDraftRoleChange : undefined}
        onSaveRole={isAdmin ? handleSaveRole : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
