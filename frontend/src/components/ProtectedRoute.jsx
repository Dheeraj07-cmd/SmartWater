import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRole }) {
  const token = localStorage.getItem('jwt_token');
  const userRole = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    // If a Resident tries to access an Admin route, boot them to their own dashboard
    return <Navigate to={userRole === 'ROLE_ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return <Outlet />;
}