// src/pages/CustomersPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import CustomerTable from "../components/customers/CustomerTable";
import CustomerFormDialog from "../components/customers/CustomerFormDialog";

import { Customers } from "../lib/api";
import type { Paginated } from "../lib/api";
import type { Customer } from "../types/customer";

type Meta = Paginated<Customer>["meta"];

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<Meta>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    sort: "createdAt",
    order: "DESC",
  });
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    severity: "success" | "error";
  }>({
    open: false,
    msg: "",
    severity: "success",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(meta.page || 1));
    p.set("limit", String(meta.limit || 10));
    p.set("sort", meta.sort || "createdAt");
    p.set("order", meta.order || "DESC");
    if (q.trim()) p.set("q", q.trim());
    return `?${p.toString()}`;
  }, [meta.page, meta.limit, meta.sort, meta.order, q]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = (await Customers.list(query)) as Paginated<Customer>;
      setRows(resp.data);
      setMeta(resp.meta);
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Load error",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const handleEdit = (c: Customer) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: Partial<Customer>) => {
    try {
      // ❗ Backend’te whitelist açık: sadece izinli alanları gönder
      const body = {
        name: payload.name,
        email: payload.email ?? undefined,
        phone: payload.phone ?? undefined,
      };

      if (payload.id) {
        await Customers.update(payload.id, body);
        setToast({ open: true, msg: "Customer updated", severity: "success" });
      } else {
        await Customers.create(body);
        setToast({ open: true, msg: "Customer created", severity: "success" });
      }
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Save error",
        severity: "error",
      });
    }
  };

  const handleDelete = async (c: Customer) => {
    try {
      await Customers.remove(c.id);
      setToast({
        open: true,
        msg: "Customer deleted (soft)",
        severity: "success",
      });
      await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Delete error",
        severity: "error",
      });
    }
  };

  const handleRestore = async (c: Customer) => {
    try {
      await Customers.restore(c.id);
      setToast({ open: true, msg: "Customer restored", severity: "success" });
      await load();
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.message || "Restore error",
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

      <CustomerTable
        rows={rows}
        meta={meta}
        q={q}
        onChangeQ={(val) => {
          setQ(val);
          setMeta((m: Meta) => ({ ...m, page: 1 }));
        }}
        onPageChange={(p) => setMeta((m: Meta) => ({ ...m, page: p }))}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />

      <CustomerFormDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
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
