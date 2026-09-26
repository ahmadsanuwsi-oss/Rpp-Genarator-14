import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import RppEditor from "@/pages/RppEditor";
import Generator from "@/pages/Generator";
import Viewer from "@/pages/Viewer";
import Profile from "@/pages/Profile";
import UserManagement from "@/pages/UserManagement";

const Shell = ({ children }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />

            <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
            <Route path="/users" element={<Shell><UserManagement /></Shell>} />
            <Route path="/profile" element={<Shell><Profile /></Shell>} />
            <Route path="/rpp/new" element={<Shell><RppEditor /></Shell>} />
            <Route path="/rpp/:id" element={<Shell><RppEditor /></Shell>} />
            <Route path="/generate/:type" element={<Shell><Generator /></Shell>} />
            <Route path="/generate/:type/:id" element={<Shell><Generator /></Shell>} />

            {/* Viewer without sidebar for clean printing */}
            <Route path="/view/:id" element={<ProtectedRoute><Viewer /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
