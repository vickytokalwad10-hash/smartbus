import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  customer: '/teacher/dashboard', // alias
  driver: '/driver/dashboard',
  admin: '/admin/dashboard',
};

// Protects a route — checks auth + optional role restriction
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
          <p className="text-sm text-on-surface-variant">Loading JD College Bus Pass System...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const effectiveRole = user.role === 'customer' ? 'teacher' : user.role;

  if (allowedRoles && !allowedRoles.includes(effectiveRole) && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DASHBOARDS[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
