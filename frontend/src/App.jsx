import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import SPPGManagement from './pages/SPPGManagement';
import KelompokManagement from './pages/KelompokManagement';
import AuditLogs from './pages/AuditLogs';
import UserManagement from './pages/UserManagement';
import StatsOverview from './pages/StatsOverview';

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ProtectedRoute useEffect triggered');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session fetched:', session ? 'User logged in' : 'No session');
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold">
        Loading Session...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<StatsOverview />} />
          <Route path="map" element={<MapView />} />
          <Route path="sppg" element={<SPPGManagement />} />
          <Route path="kelompok" element={<KelompokManagement />} />
          <Route path="logs" element={<AuditLogs />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
