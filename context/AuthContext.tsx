import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
    currentUser: User | null;
    login: (userId: string) => void;
    // FIX: Added logout to the context type to match its usage in the Header component.
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { users } = useData();
    const [currentUser, setCurrentUser] = useState<User | null>(users[0] || null);

    useEffect(() => {
        // If the current user's data gets updated (e.g., from the settings page),
        // find the latest version of that user from the context and update the state.
        if (currentUser) {
            const updatedUser = users.find(u => u.id === currentUser.id);
            setCurrentUser(updatedUser || null);
        }
        // If no user is selected, default to the first one.
        if (!currentUser && users.length > 0) {
            setCurrentUser(users[0]);
        }
    }, [users]);


    const login = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user && user.status === 'Blocked') {
            alert('This account is blocked. Please contact an administrator.');
            return;
        }
        setCurrentUser(user || null);
    };

    // FIX: Implemented the logout function to clear the current user session.
    const logout = () => {
        setCurrentUser(null);
    };


    return (
        // FIX: Provided the logout function through the context.
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};