import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useI18n } from '../../store/I18nContext';
import { useTheme } from '../../store/ThemeContext';
import { useNotification } from '../../hooks/useNotification';
import SkipLink from '../ui/SkipLink';
import OfflineIndicator from '../ui/OfflineIndicator';
import { LayoutDashboard, Building2, DoorOpen, Users, Package, CalendarCheck, Calendar, FileText, LogOut, Hotel, Globe, Sun, Moon, ClipboardList, Map as MapIcon, Box, DollarSign, TrendingUp, History, Shield, BarChart3 } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useNotification();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <SkipLink />
      <div className="sidebar">
        <div className="sidebar-header">
          <h1><Hotel size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Hotel Minibar</h1>
          <p>Yönetim Paneli</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard"><LayoutDashboard size={16} />Dashboard</NavLink>
          <NavLink to="/admin/blocks"><Building2 size={16} />Blok & Kat</NavLink>
          <NavLink to="/admin/rooms"><DoorOpen size={16} />Odalar</NavLink>
          <NavLink to="/admin/occupancy"><CalendarCheck size={16} />Konaklama</NavLink>
          <NavLink to="/admin/products"><Package size={16} />Ürünler</NavLink>
          <NavLink to="/admin/stock"><Box size={16} />Stok Yönetimi</NavLink>
          <NavLink to="/admin/cost"><DollarSign size={16} />Maliyet Özeti</NavLink>
          <NavLink to="/admin/users"><Users size={16} />Kullanıcılar</NavLink>
          <NavLink to="/admin/shifts"><ClipboardList size={16} />Vardiyalar</NavLink>
          <NavLink to="/admin/floor-plan"><MapIcon size={16} />Kat Planı</NavLink>
          <NavLink to="/admin/performance"><TrendingUp size={16} />Performans</NavLink>
          <NavLink to="/admin/product-report"><BarChart3 size={16} />Satış Raporu</NavLink>
          <NavLink to="/admin/room-consumption"><Building2 size={16} />Oda Tüketim</NavLink>
          <NavLink to="/admin/room-history"><History size={16} />Oda Geçmişi</NavLink>
          <NavLink to="/admin/reports"><FileText size={16} />Raporlar</NavLink>
          <NavLink to="/admin/backup"><Shield size={16} />Yedekleme</NavLink>
          <NavLink to="/admin/snapshots"><Calendar size={16} />Gün Sonu</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Admin</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost" style={{ color: '#fff', padding: 4 }} onClick={toggleTheme} title={theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button className="btn btn-ghost" style={{ color: '#fff', padding: 4 }} onClick={toggleLang} title={lang === 'tr' ? 'English' : 'Türkçe'}>
                <Globe size={16} /><span style={{ fontSize: '0.7rem', marginLeft: 2 }}>{lang.toUpperCase()}</span>
              </button>
              <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={handleLogout} title="Çıkış">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <main className="main-content" id="main-content" role="main">
        <Outlet />
      </main>
      <OfflineIndicator />
    </div>
  );
};

export default AdminLayout;
