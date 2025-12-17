// src/components/users/UserTable.tsx
import {
  Box,
  Paper,
  Stack,
  Toolbar,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { Save, Trash2 } from "lucide-react";
import type { User, UserRole } from "../../types/user";

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "ASC" | "DESC";
};

type Row = User & { _roleDraft?: UserRole; _dirty?: boolean };

type Props = {
  rows: Row[];
  meta: Meta;
  q: string;
  onChangeQ: (v: string) => void;
  onPageChange: (p: number) => void;

  // ✅ yeni: yönetim yetkisi
  canManage?: boolean;

  // ✅ sadece canManage=true iken kullanılacak
  onDraftRoleChange?: (id: number, role: UserRole) => void;
  onSaveRole?: (u: Row) => void;
  onDelete?: (u: Row) => void;
  onAddUser?: () => void;
};

export default function UserTable({
  rows,
  meta,
  q,
  onChangeQ,
  onPageChange,
  canManage = false,
  onDraftRoleChange,
  onSaveRole,
  onDelete,
  onAddUser,
}: Props) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Users
      </Typography>

      <Toolbar
        disableGutters
        sx={{ p: 0, gap: 1.5, flexWrap: "wrap", alignItems: "center" }}
      >
        <TextField
          value={q}
          onChange={(e) => onChangeQ(e.target.value)}
          placeholder="Search by email"
          size="small"
          sx={{
            flex: "1 1 420px",
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        />
        <Button variant="outlined" sx={{ borderRadius: 2 }}>
          Filter
        </Button>

        {canManage && onAddUser && (
          <Button
            variant="contained"
            color="warning"
            onClick={onAddUser}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Add User
          </Button>
        )}
      </Toolbar>

      <Paper
        sx={{
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 10px 20px rgba(0,0,0,0.05)",
        }}
      >
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    bgcolor: "grey.100",
                    color: "text.secondary",
                    fontWeight: 600,
                    fontSize: 13,
                  },
                }}
              >
                <TableCell width={56}>ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created</TableCell>

                {canManage && (
                  <TableCell align="right" width={140}>
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((u) => {
                const draft = u._roleDraft ?? u.role;
                const dirty = u._dirty ?? false;

                return (
                  <TableRow hover key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.email}</TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {canManage ? (
                          <Select
                            size="small"
                            value={draft}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const newRole = e.target.value as UserRole;
                              onDraftRoleChange?.(u.id, newRole);
                            }}
                            sx={{ minWidth: 120 }}
                          >
                            <MenuItem value="user">user</MenuItem>
                            <MenuItem value="admin">admin</MenuItem>
                          </Select>
                        ) : (
                          <Chip
                            size="small"
                            label={String(u.role || "user").toUpperCase()}
                            variant="outlined"
                          />
                        )}

                        {u.role === "admin" && (
                          <Chip size="small" label="ADMIN" color="primary" />
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Tooltip title={dirty ? "Save role" : "No changes"}>
                          <span>
                            <IconButton
                              size="small"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (dirty && onSaveRole) onSaveRole(u as Row);
                              }}
                              disabled={!dirty || !onSaveRole}
                            >
                              <Save size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {onDelete && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete(u as Row);
                              }}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4}>
                    <Box
                      sx={{
                        p: 4,
                        textAlign: "center",
                        color: "text.secondary",
                      }}
                    >
                      No users
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Pagination
            page={meta.page || 1}
            count={meta.totalPages || 1}
            onChange={(_, p) => onPageChange(p)}
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>
    </Stack>
  );
}
