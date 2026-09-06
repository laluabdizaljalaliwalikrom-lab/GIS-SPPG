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
import Settings from './pages/Settings';
import StatsOverview from './pages/StatsOverview';
import LandingPage from './pages/LandingPage';
import LandingPageEditor from './pages/LandingPageEditor';
import AuditCenter from './pages/AuditCenter';
import RaportPage from './pages/RaportPage';
import KomoditasHarga from './pages/KomoditasHarga';
import ServerWakeOverlay from './components/ServerWakeOverlay';

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
      <ServerWakeOverlay />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<StatsOverview />} />
          <Route path="mapping" element={<MapView />} />
          <Route path="sppg" element={<SPPGManagement />} />
          <Route path="kelompok" element={<KelompokManagement />} />
          <Route path="landing-editor" element={<LandingPageEditor />} />
          <Route path="logs" element={<AuditLogs />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="audit" element={<AuditCenter />} />
          <Route path="komoditas-harga" element={<KomoditasHarga />} />
          <Route path="raport" element={<RaportPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<div className="animate-in fade-in duration-500"><h1 className="text-3xl font-black text-slate-800 tracking-tight">Profil Pengguna</h1><p className="text-slate-500 font-medium mt-1">Pengaturan akun dan preferensi sistem.</p><div className="mt-8 p-12 border-2 border-dashed border-blue-100 rounded-[3rem] text-center"><p className="text-blue-400 font-bold">Fitur ini akan segera hadir.</p></div></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
