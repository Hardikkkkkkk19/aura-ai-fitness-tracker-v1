import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import { SplashScreen } from './components/SplashScreen';

// Import Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { Dashboard } from './pages/Dashboard';
import { Workouts } from './pages/Workouts';
import { Nutrition } from './pages/Nutrition';
import { Coach } from './pages/Coach';
import { Scanner } from './pages/Scanner';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { EmailCenter } from './pages/EmailCenter';

function AppContent() {
  const { loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen isLoadingAuth={loading} onComplete={() => setSplashDone(true)} />;
  }

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Authentication Routes (Protected from Authenticated Users) */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } 
      />

      {/* Protected Workspace Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/workouts" 
        element={
          <ProtectedRoute>
            <Workouts />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/nutrition" 
        element={
          <ProtectedRoute>
            <Nutrition />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/coach" 
        element={
          <ProtectedRoute>
            <Coach />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scanner" 
        element={
          <ProtectedRoute>
            <Scanner />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/email-center" 
        element={
          <ProtectedRoute>
            <EmailCenter />
          </ProtectedRoute>
        } 
      />

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
