import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        // In a real app, you would redirect to a login page
        return <Navigate to="/" replace />;
    }

    const hasRequiredRole = currentUser.roles.some(role => allowedRoles.includes(role));

    return hasRequiredRole ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;