import * as React from "react";
import { Box, Toolbar } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import drawerWidth from "../components/Sidebar";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f6f8fb" }}>
      <Topbar />
      <Sidebar />

      {/* içerik alanı */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: "64px", // Topbar yüksekliği
          ml: `${drawerWidth}px`, // Sidebar genişliği
        }}
      >
        {/* Topbar ile hizalamak için boş toolbar */}
        <Toolbar sx={{ display: "none" }} />
        {children}
      </Box>
    </Box>
  );
}
