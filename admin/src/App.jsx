import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';
import { SosEventsPage } from './pages/SosEventsPage';
import { UsersPage } from './pages/UsersPage';
import { TripsPage } from './pages/TripsPage';
import { PilotPage } from './pages/PilotPage';
import { WaitlistPage } from './pages/WaitlistPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/vehiculos" replace />} />
              <Route path="vehiculos" element={<VehiclesPage />} />
              <Route path="vehiculos/:id" element={<VehicleDetailPage />} />
              <Route path="alertas-sos" element={<SosEventsPage />} />
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="viajes" element={<TripsPage />} />
              <Route path="piloto" element={<PilotPage />} />
              <Route path="lista-espera" element={<WaitlistPage />} />
              <Route path="viajes-pagos" element={<Navigate to="/viajes" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/vehiculos" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
