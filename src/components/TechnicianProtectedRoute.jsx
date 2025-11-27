import { Navigate } from 'react-router-dom';
import { useTechnicianAuth } from '../context/TechnicianAuthContext';

const TechnicianProtectedRoute = ({ children }) => {
  const { user, token, isLoading } = useTechnicianAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/technician/login" replace />;
  }

  if (user.role !== 'technician') {
    return <Navigate to="/technician/login" replace />;
  }

  return children;
};

export default TechnicianProtectedRoute;



