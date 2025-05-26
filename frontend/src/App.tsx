import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TemaProvider } from './contexts/TemaContext';
import { NotificacionesProvider } from './contexts/NotificacionesContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Páginas
import Dashboard from './pages/Dashboard';
import Passwords from './pages/Passwords';
import Favorites from './pages/Favorites';
import Generator from './pages/Generator';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

const App: React.FC = () => (
  <TemaProvider>
    <AuthProvider>
      <NotificacionesProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Rutas protegidas con layout moderno */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/passwords" element={<Passwords />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/generator" element={<Generator />} />
              <Route path="/profile" element={<Profile />} />
              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificacionesProvider>
    </AuthProvider>
  </TemaProvider>
);

export default App;