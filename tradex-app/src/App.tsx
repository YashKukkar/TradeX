import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import React, { Suspense, lazy } from "react";
import LoadingState from "./components/LoadingState";
import { safeStorage } from "./utils/api";

// Login stays in the main bundle (first paint); every other screen loads on demand.
const Dashboard = lazy(() => import("./Dashboard"));
const Referrals = lazy(() => import("./Referrals"));
const SupportTickets = lazy(() => import("./SupportTickets"));
const Settings = lazy(() => import("./Settings"));

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
      <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportTickets /></ProtectedRoute>} />
        <Route path="/admin/users" element={<Navigate to="/dashboard?tab=users" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
