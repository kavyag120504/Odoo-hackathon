import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppShell from "./layout/AppShell";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Placeholder from "./pages/Placeholder";
import Maintenance from "./pages/Maintenance";

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
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Placeholder title="Dashboard" owner="C" />} />
            <Route path="/assets" element={<Placeholder title="Asset Registry" owner="C" />} />
            <Route path="/allocation" element={<Placeholder title="Allocation & Transfer" owner="A" />} />
            <Route path="/booking" element={<Placeholder title="Resource Booking" owner="B" />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/audit" element={<Placeholder title="Audit" owner="A" />} />
            <Route path="/reports" element={<Placeholder title="Reports" owner="C" />} />
            <Route path="/org" element={<Placeholder title="Org Setup" owner="C" />} />
            <Route path="/notifications" element={<Placeholder title="Notifications" owner="D" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
