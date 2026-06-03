import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { DashboardPage } from "./pages/DashboardPage";
import { PivotExplorerPage } from "./pages/PivotExplorerPage";
import { LoginPage } from "./pages/LoginPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DataProvider>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/pivot" element={<PivotExplorerPage />} />
                    <Route path="/data" element={<Navigate to="/pivot" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DataProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
