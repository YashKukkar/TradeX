import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Referrals from "./Referrals";
import SupportTickets from "./SupportTickets";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/support" element={<SupportTickets />} />
        <Route path="/admin/users" element={<Navigate to="/dashboard?tab=users" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;
