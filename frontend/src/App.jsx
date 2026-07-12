import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppShell from "./layout/AppShell";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Placeholder from "./pages/Placeholder";
import Maintenance from "./pages/Maintenance";
import Booking from "./pages/Booking";
import Notifications from "./pages/Notifications";
import Dashboard from "./pages/Dashboard";
import { AssetRegistryPage, OrgSetupPage, ReportsPage } from "./pages/index";
import Allocation from "./pages/Allocation";

// Public routes redirect to the app if already signed in.
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

          <Route
            element={
              <ProtectedRoute>
                <AppDataProvider>
                  <AppShell />
                </AppDataProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<AssetRegistryPage />} />
            <Route path="/allocation" element={<Allocation />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/audit" element={<Placeholder title="Audit" owner="A" />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/org" element={<OrgSetupPage />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
