import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPhone from "./pages/Auth/PhoneEntry";
import AuthOtp from "./pages/Auth/OtpVerify";
import Onboarding from "./pages/Onboarding";
import Log from "./pages/Log";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";

import Layout from "./components/Layout";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("gf_token");
  return token ? <Layout>{children}</Layout> : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPhone />} />
        <Route path="/auth/verify" element={<AuthOtp />} />
        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
        <Route path="/log" element={<PrivateRoute><Log /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/resources" element={<PrivateRoute><Resources /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="*" element={<Navigate to={localStorage.getItem("gf_token") ? "/dashboard" : "/auth"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
