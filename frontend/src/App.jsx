import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ResidentInvoices from './pages/resident/ResidentInvoices';
import AdminBilling from './pages/admin/AdminBilling';
import AdminMeterReadings from './pages/admin/AdminMeterReadings';
import ResidentConservation from './pages/resident/ResidentConservation';
import ResidentAlerts from './pages/resident/ResidentAlerts';
import ResidentSupport from './pages/resident/ResidentSupport';
import AdminSupport from './pages/admin/AdminSupport';
import AdminLeakDetection from './pages/admin/AdminLeakDetection';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResidentProfile from './pages/resident/ResidentProfile';
import ResetPassword from './pages/auth/ResetPassword';
import AdminSettings from './pages/admin/AdminSettings';
import AdminHouseholds from './pages/admin/AdminHouseholds';

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Resident Routes */}
            <Route element={<ProtectedRoute allowedRole="ROLE_RESIDENT" />}>
              <Route element={<DashboardLayout role="ROLE_RESIDENT" />}>
                <Route path="/dashboard" element={<ResidentDashboard />} />
                <Route path="/invoices" element={<ResidentInvoices />} />
                <Route path="/conservation" element={<ResidentConservation />} />
                <Route path="/alerts" element={<ResidentAlerts />} />
                <Route path="/support" element={<ResidentSupport />} />
                <Route path="/profile" element={<ResidentProfile />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRole="ROLE_ADMIN" />}>
              <Route element={<DashboardLayout role="ROLE_ADMIN" />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/households" element={<AdminHouseholds />} />
                <Route path="/admin/data-ingestion" element={<AdminMeterReadings />} />
                <Route path="/admin/billing" element={<AdminBilling />} />
                <Route path="/admin/leaks" element={<AdminLeakDetection />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>

          </Routes>
        </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;