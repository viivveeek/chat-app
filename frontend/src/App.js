import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Typography, Container } from "@mui/material";
import AuthContextProvider, { useAuth } from "./contexts/AuthContext";
import SocketContextProvider from "./contexts/SocketContext";
import Login from "./components/Login";
import Register from "./components/Register";
import ChatDashboard from "./components/ChatDashboard";
import "./App.css";

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <Typography>Loading...</Typography>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Routes>
        <Route path="/" element={<ChatDashboard />} />
      </Routes>
    </Container>
  );
}

function App() {
  return (
    <AuthContextProvider>
      <SocketContextProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </Router>
      </SocketContextProvider>
    </AuthContextProvider>
  );
}

export default App;
