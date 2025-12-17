import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Sidebar, { drawerWidth } from "./components/Sidebar";
import Topbar from "./components/Topbar";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import DashboardPage from "./pages/DashboardPage";
import LeadsPage from "./pages/LeadsPage";
import CustomersPage from "./pages/CustomerPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  const { isAuthed } = useAuth();

  // Login değilse sadece login/register açık
  if (!isAuthed) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Sidebar />
      <Topbar />

      <div
        style={{
          marginLeft: drawerWidth,
          marginTop: 64,
          padding: 24,
        }}
      >
        <Routes>
          {/* Authed iken login/register'a gidilmesin */}
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/register"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/users" element={<UsersPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
}
