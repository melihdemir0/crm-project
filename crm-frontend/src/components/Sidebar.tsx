import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupIcon from "@mui/icons-material/Group";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PeopleIcon from "@mui/icons-material/People";
import { NavLink } from "react-router-dom";
import BrandLogo from "./BrandLogo";

export const drawerWidth = 240;

export default function Sidebar() {
  return (
    <Box
      sx={{
        width: drawerWidth,
        height: "100vh",
        backgroundColor: "#0e2239",
        color: "#fff",
        position: "fixed",
        left: 0,
        top: 0,
        paddingTop: 2,
      }}
    >
      <Box sx={{ px: 2, py: 2 }}>
        <BrandLogo size={100} showText text="CRM" />
      </Box>
      <Box sx={{ px: 2, pb: 2, fontSize: 26, fontWeight: 700 }}>CRM</Box>

      <List>
        <ListItemButton component={NavLink} to="/dashboard">
          <ListItemIcon sx={{ color: "#fff" }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <ListItemButton component={NavLink} to="/leads">
          <ListItemIcon sx={{ color: "#fff" }}>
            <PersonAddIcon />
          </ListItemIcon>
          <ListItemText primary="Leads" />
        </ListItemButton>

        <ListItemButton component={NavLink} to="/customers">
          <ListItemIcon sx={{ color: "#fff" }}>
            <GroupIcon />
          </ListItemIcon>
          <ListItemText primary="Customers" />
        </ListItemButton>

        <ListItemButton component={NavLink} to="/activities">
          <ListItemIcon sx={{ color: "#fff" }}>
            <ChecklistIcon />
          </ListItemIcon>
          <ListItemText primary="Activities" />
        </ListItemButton>

        <ListItemButton component={NavLink} to="/users">
          <ListItemIcon sx={{ color: "#fff" }}>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Users" />
        </ListItemButton>
      </List>
    </Box>
  );
}
