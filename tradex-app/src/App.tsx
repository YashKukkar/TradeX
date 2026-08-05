import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Referrals from "./Referrals";
import SupportTickets from "./SupportTickets";
import Settings from "./Settings";
import React from "react";
import { safeStorage } from "./utils/api";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("token");
  if (urlToken) {
    safeStorage.setItem("token", urlToken);
    urlParams.delete("token");
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
    window.history.replaceState({}, "", newUrl);
  }

  const token = safeStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportTickets /></ProtectedRoute>} />
        <Route path="/admin/users" element={<Navigate to="/dashboard?tab=users" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
