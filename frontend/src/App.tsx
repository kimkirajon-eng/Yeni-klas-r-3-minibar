import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import PersonnelLayout from './components/layout/PersonnelLayout';
import DashboardPage from './pages/admin/DashboardPage';
import BlocksPage from './pages/admin/BlocksPage';
import RoomsPage from './pages/admin/RoomsPage';
import UsersPage from './pages/admin/UsersPage';
import ProductsPage from './pages/admin/ProductsPage';
import OccupancyPage from './pages/admin/OccupancyPage';
import ReportsPage from './pages/admin/ReportsPage';
import StockPage from './pages/admin/StockPage';
import ShiftsPage from './pages/admin/ShiftsPage';
import FloorPlanPage from './pages/admin/FloorPlanPage';
import CostSummaryPage from './pages/admin/CostSummaryPage';
import PerformancePage from './pages/admin/PerformancePage';
import ProductReportPage from './pages/admin/ProductReportPage';
import RoomConsumptionPage from './pages/admin/RoomConsumptionPage';
import SnapshotsPage from './pages/admin/SnapshotsPage';
import RoomHistoryPage from './pages/admin/RoomHistoryPage';
import BackupPage from './pages/admin/BackupPage';
import PersonnelDashboard from './pages/personnel/PersonnelDashboard';
import PersonelRoomDetail from './pages/personnel/PersonelRoomDetail';
import { UserRole } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={user.role === UserRole.ADMIN ? '/admin' : '/personnel'} replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (isAuthenticated) {
    return <Navigate to={user?.role === UserRole.ADMIN ? '/admin' : '/personnel'} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="blocks" element={<BlocksPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="occupancy" element={<OccupancyPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="floor-plan" element={<FloorPlanPage />} />
        <Route path="cost" element={<CostSummaryPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="product-report" element={<ProductReportPage />} />
        <Route path="room-consumption" element={<RoomConsumptionPage />} />
        <Route path="snapshots" element={<SnapshotsPage />} />
        <Route path="room-history" element={<RoomHistoryPage />} />
        <Route path="backup" element={<BackupPage />} />
      </Route>

      <Route path="/personnel" element={<ProtectedRoute roles={[UserRole.PERSONNEL]}><PersonnelLayout /></ProtectedRoute>}>
        <Route index element={<PersonnelDashboard />} />
        <Route path="room/:roomId" element={<PersonelRoomDetail />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
