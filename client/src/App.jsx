import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import StudentPass from './pages/student/StudentPass';
import StudentRenew from './pages/student/StudentRenew';
import StudentPayments from './pages/student/StudentPayments';

// Teacher / Faculty
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import RouteSearch from './pages/teacher/RouteSearch';
import BuyPass from './pages/teacher/BuyPass';
import TeacherProfile from './pages/teacher/TeacherProfile';

// Driver
import DriverDashboard from './pages/driver/DriverDashboard';
import TripInProgress from './pages/driver/TripInProgress';
import PassScanner from './pages/driver/PassScanner';
import TripSummary from './pages/driver/TripSummary';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import RouteManagement from './pages/admin/RouteManagement';
import FleetDrivers from './pages/admin/FleetDrivers';
import AdminPasses from './pages/admin/AdminPasses';
import AIPredictions from './pages/admin/AIPredictions';
import Reports from './pages/admin/Reports';
import Complaints from './pages/admin/Complaints';

// Shared
import LiveTracking from './pages/shared/LiveTracking';
import BackButtonHandler from './components/BackButtonHandler';

const App = () => (
  <Router>
    <BackButtonHandler />
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Shared Live Tracking */}
        <Route path="/track" element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'customer', 'driver', 'admin']}>
            <LiveTracking />
          </ProtectedRoute>
        } />

        {/* Student Portal */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/pass" element={<ProtectedRoute allowedRoles={['student']}><StudentPass /></ProtectedRoute>} />
        <Route path="/student/renew" element={<ProtectedRoute allowedRoles={['student']}><StudentRenew /></ProtectedRoute>} />
        <Route path="/student/payments" element={<ProtectedRoute allowedRoles={['student']}><StudentPayments /></ProtectedRoute>} />

        {/* Teacher / Faculty Portal */}
        <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher', 'customer']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/routes" element={<ProtectedRoute allowedRoles={['teacher', 'customer']}><RouteSearch /></ProtectedRoute>} />
        <Route path="/teacher/buy-pass" element={<ProtectedRoute allowedRoles={['teacher', 'customer']}><BuyPass /></ProtectedRoute>} />
        <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['teacher', 'customer']}><TeacherProfile /></ProtectedRoute>} />

        {/* Legacy customer routes redirects */}
        <Route path="/customer/dashboard" element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="/customer/routes" element={<Navigate to="/teacher/routes" replace />} />
        <Route path="/customer/buy-pass" element={<Navigate to="/teacher/buy-pass" replace />} />
        <Route path="/customer/profile" element={<Navigate to="/teacher/profile" replace />} />

        {/* Driver Portal */}
        <Route path="/driver/dashboard" element={<ProtectedRoute allowedRoles={['driver']}><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/trip" element={<ProtectedRoute allowedRoles={['driver']}><TripInProgress /></ProtectedRoute>} />
        <Route path="/driver/scanner" element={<ProtectedRoute allowedRoles={['driver']}><PassScanner /></ProtectedRoute>} />
        <Route path="/driver/summary" element={<ProtectedRoute allowedRoles={['driver']}><TripSummary /></ProtectedRoute>} />

        {/* Admin Portal */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/routes" element={<ProtectedRoute allowedRoles={['admin']}><RouteManagement /></ProtectedRoute>} />
        <Route path="/admin/fleet" element={<ProtectedRoute allowedRoles={['admin']}><FleetDrivers /></ProtectedRoute>} />
        <Route path="/admin/drivers" element={<ProtectedRoute allowedRoles={['admin']}><FleetDrivers /></ProtectedRoute>} />
        <Route path="/admin/passes" element={<ProtectedRoute allowedRoles={['admin']}><AdminPasses /></ProtectedRoute>} />
        <Route path="/admin/predictions" element={<ProtectedRoute allowedRoles={['admin']}><AIPredictions /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
        <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={['admin']}><Complaints /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </Router>
);

export default App;
