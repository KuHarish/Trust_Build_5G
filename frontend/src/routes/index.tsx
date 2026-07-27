import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout } from '@/layouts';
import {
  Login,
  ForgotPassword,
  ResetPassword,
  Dashboard,
  Network,
  Nodes,
  Traffic,
  Attacks,
  TrustEngine,
  MachineLearning,
  FederatedLearning,
  Blockchain,
  SecurityController,
  Analytics,
  Settings,
} from '@/pages';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect to Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Authentication Route Tree (Mock Auth Foundation) */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route index element={<Navigate to="login" replace />} />
      </Route>

      {/* Main Command & Control Dashboard Layout Tree */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/network" element={<Network />} />
        <Route path="/network/nodes" element={<Nodes />} />
        <Route path="/nodes" element={<Nodes />} />
        <Route path="/traffic" element={<Traffic />} />
        <Route path="/attacks" element={<Attacks />} />
        <Route path="/trust" element={<TrustEngine />} />
        <Route path="/ml" element={<MachineLearning />} />
        <Route path="/federated" element={<FederatedLearning />} />
        <Route path="/blockchain" element={<Blockchain />} />
        <Route path="/security" element={<SecurityController />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all fallback to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
