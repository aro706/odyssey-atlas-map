import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx'; // Corrected import path

import SidebarNav from './components/SidebarNav';
import ScoutsPortalView from './components/ScoutsPortalView';
import PlaceholderView from './components/PlaceholderView';
import TourMapView from './components/TourMapView';
import Login from './pages/Login';
import Register from './pages/Register';
import Achievements from './pages/Achievements';
import ProtectedRoute from './components/ProtectedRoute';

// A layout component for protected pages that include the sidebar
const MainLayout = ({ children }) => {
    const { user } = useAuth();
    // This is a placeholder for the activeView logic, which might need rethinking with routing
    // For now, we can derive it from the path or manage it differently.
    const location = useLocation();
    const activeView = location.pathname.replace('/', '');

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {user && <SidebarNav activeView={activeView} />}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};

export default function App() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading Application...</div>;
    }

    return (
        <div className="bg-gray-100 text-gray-800 font-sans">
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes within the main layout */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Routes>
                                    <Route path="/scouts-portal" element={<ScoutsPortalView />} />
                                    <Route path="/tour-maps" element={<TourMapView />} />
                                    <Route path="/achievements" element={<Achievements />} />
                                    <Route path="/ringmasters-drills" element={<PlaceholderView title="Ringmaster's Drills" />} />
                                    <Route path="/top-scout-board" element={<PlaceholderView title="Top Scout Board" />} />
                                    <Route path="/logbook" element={<PlaceholderView title="Performer's Logbook" />} />
                                    {/* Default redirect for logged-in users */}
                                    <Route path="/" element={<ScoutsPortalView />} />
                                </Routes>
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
}
