import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CariRapat from './pages/CariRapat';
import TVDisplay from './pages/TVDisplay';
import TambahJadwal from './pages/TambahJadwal';
import Departemen from './pages/Departemen';
import KelolaUser from './pages/KelolaUser';
import LogAktivitas from './pages/LogAktivitas';
import BackupDatabase from './pages/BackupDatabase';
import ResetPermintaan from './pages/ResetPermintaan';
import LupaPassword from './pages/LupaPassword';
import Profil from './pages/Profil';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-on-surface-variant text-[14px]">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-surface-bg text-on-surface font-body-md h-screen flex overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col md:ml-64 w-full h-full relative">
        <div className="absolute inset-0 grid-bg -z-10 pointer-events-none"></div>
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/lupa-password" element={<LupaPassword />} />
          <Route path="/tv" element={<TVDisplay />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cari-rapat" element={<CariRapat />} />
            <Route path="/tambah" element={<TambahJadwal />} />
            <Route path="/departemen" element={<Departemen />} />
            <Route path="/user" element={<KelolaUser />} />
            <Route path="/log" element={<LogAktivitas />} />
            <Route path="/backup" element={<BackupDatabase />} />
            <Route path="/reset-password" element={<ResetPermintaan />} />
            <Route path="/profil" element={<Profil />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
