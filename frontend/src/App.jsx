import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Unauthorized from './components/auth/Unauthorized';
import TeamLeadDashboard from './components/dashboard/TeamLeadDashboard';
import DeveloperDashboard from './components/dashboard/DeveloperDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes - Team Lead */}
          <Route
            path="/dashboard/teamlead"
            element={
              <ProtectedRoute allowedRoles={['teamlead']}>
                <TeamLeadDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Developer */}
          <Route
            path="/dashboard/developer"
            element={
              <ProtectedRoute allowedRoles={['developer']}>
                <DeveloperDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404</h1>
                  <p className="text-gray-600">Page not found</p>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
