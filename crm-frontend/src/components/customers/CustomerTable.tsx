// src/components/customers/CustomerTable.tsx
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Toolbar,
  Typography,
  TextField,
  Button,
  Pagination,
} from "@mui/material";

import { Edit, Delete, Undo2 } from "lucide-react";
import type { Customer } from "../../types/customer";

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "ASC" | "DESC";
};

type Props = {
  rows: Customer[];
  meta: Meta;
  q: string;
  onChangeQ: (v: string) => void;
  onPageChange: (p: number) => void;
  onAdd: () => void;
  onEdit: (c: Customer) => void;
  onDelete: (c: Customer) => void;
  onRestore: (c: Customer) => void;
};

export default function CustomerTable({
  rows,
  meta,
  q,
  onChangeQ,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
  onRestore,
}: Props) {
  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      {/* Üst Toolbar */}
      <Toolbar sx={{ p: 2, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Customers
        </Typography>

        <TextField
          size="small"
          placeholder="Search..."
          value={q}
          onChange={(e) => onChangeQ(e.target.value)}
        />

        <Button variant="contained" onClick={onAdd}>
          Add New
        </Button>
      </Toolbar>

      {/* Tablo */}
      <TableContainer sx={{ maxHeight: 560 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={56}>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right" width={140}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((c) => (
              <TableRow hover key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email || "-"}</TableCell>
                <TableCell>{c.phone || "-"}</TableCell>

                <TableCell>
                  {c.isDeleted ? (
                    <Chip label="Deleted" color="warning" size="small" />
                  ) : (
                    <Chip label="Active" color="success" size="small" />
                  )}
                </TableCell>

                <TableCell>
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}
                </TableCell>

                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {!c.isDeleted && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(c)}>
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                    )}

                    {c.isDeleted ? (
                      <Tooltip title="Restore">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onRestore(c)}
                        >
                          <Undo2 size={18} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Soft Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(c)}
                        >
                          <Delete size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box
                    sx={{
                      p: 4,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    No data found.
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
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
  );
}
