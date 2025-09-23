

import React from 'react';
import { HashRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';
import { FontSizeProvider } from './context/FontSizeContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import PurchasesPage from './pages/PurchasesPage';
import WarehousePage from './pages/WarehousePage';
import FulfillmentPage from './pages/FulfillmentPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuditPage from './pages/AuditPage';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import MaterialsPage from './pages/MaterialsPage';
import VendorsPage from './pages/VendorsPage';
import SalesRecordPage from './pages/SalesRecordPage';
import PurchaseRecordPage from './pages/PurchaseRecordPage';

const AuthenticatedRoutes: React.FC = () => {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them along to that page after they
        // log in, which is a nicer user experience than dropping them off on the home page.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return (
         <Layout>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/vendors" element={<VendorsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales-record" element={<SalesRecordPage />} />
                <Route path="/purchases" element={<PurchasesPage />} />
                <Route path="/purchase-record" element={<PurchaseRecordPage />} />
                <Route path="/warehouses" element={<WarehousePage />} />
                <Route path="/fulfillment" element={<FulfillmentPage />} />
                
                {/* Protected Routes for Admin only */}
                <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/audit" element={<AuditPage />} />
                </Route>

                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                {/* Redirect any other paths to dashboard */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <FontSizeProvider>
                <SettingsProvider>
                    <DataProvider>
                        <AuthProvider>
                            <HashRouter>
                                <Routes>
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/*" element={<AuthenticatedRoutes />} />
                                </Routes>
                            </HashRouter>
                        </AuthProvider>
                    </DataProvider>
                </SettingsProvider>
            </FontSizeProvider>
        </ThemeProvider>
    );
};

export default App;