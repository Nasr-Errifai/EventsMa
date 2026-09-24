import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import RoleGuard from "./components/RoleGuard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import MyTickets from "./pages/MyTickets";
import EventDetail from "./pages/EventDetail";
import Scanner from "./pages/Scanner";
import SyncScans from "./pages/SyncScans";
import AdminDashboard from "./pages/AdminDashboard";
import AgentDashboard from "./pages/AgentDashboard";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/events/create" element={
            <RoleGuard allowedRoles={["ADMIN"]}>
              <CreateEvent />
            </RoleGuard>
          } />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/scanner" element={
            <RoleGuard allowedRoles={["AGENT", "ADMIN"]}>
              <Scanner />
            </RoleGuard>
          } />
          <Route path="/sync-scans" element={
            <RoleGuard allowedRoles={["AGENT", "ADMIN"]}>
              <SyncScans />
            </RoleGuard>
          } />
          <Route path="/dashboard/admin" element={
            <RoleGuard allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </RoleGuard>
          } />
          <Route path="/dashboard/agent" element={
            <RoleGuard allowedRoles={["AGENT", "ADMIN"]}>
              <AgentDashboard />
            </RoleGuard>
          } />
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
