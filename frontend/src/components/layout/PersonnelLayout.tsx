import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../store/ThemeContext';
import { api } from '../../services/api';
import { useI18n } from '../../store/I18nContext';
import OfflineIndicator from '../ui/OfflineIndicator';
import { LogOut, Hotel, RefreshCw, Globe, Sun, Moon } from 'lucide-react';

const PersonnelLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { on } = useSocket();
  const [stats, setStats] = useState({ total: 0, completed: 0, dnd: 0, later: 0, pending: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const rooms = await api.rooms.getAll();
      setStats({
        total: rooms.length,
        completed: rooms.filter((r: any) => r.minibarStatus === 'COMPLETED').length,
        dnd: rooms.filter((r: any) => r.minibarStatus === 'DND').length,
        later: rooms.filter((r: any) => r.minibarStatus === 'LATER').length,
        pending: rooms.filter((r: any) => r.minibarStatus === 'PENDING').length,
      });
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    const u1 = on('room:status-changed', () => fetchStats());
    const u2 = on('room:consumption-recorded', () => fetchStats());
    return () => { u1(); u2(); };
  }, [on, fetchStats]);

  const isDetail = location.pathname.includes('/personnel/room/');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--personnel-bg)' }}>
      <header style={{
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border)',
        padding: '0 16px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#1a1f36', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hotel size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Minibar</span>
            {stats.total > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {stats.completed}/{stats.total}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem' }}>
              <span style={{ color: '#d93025', fontWeight: 600 }}>DND {stats.dnd}</span>
              <span style={{ color: '#f57f17', fontWeight: 600 }}>S {stats.later}</span>
              <span style={{ color: '#5f6368', fontWeight: 600 }}>B {stats.pending}</span>
              <span style={{ color: '#0f9d58', fontWeight: 600 }}>T {stats.completed}</span>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={fetchStats} style={{ width: 28, height: 28 }} title="Yenile">
              <RefreshCw size={13} />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={toggleTheme} style={{ width: 28, height: 28 }}>
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button className="btn btn-ghost btn-icon" onClick={toggleLang} style={{ width: 28, height: 28, fontSize: '0.65rem', fontWeight: 600 }}>
              <Globe size={13} /><span style={{ marginLeft: 1 }}>{lang.toUpperCase()}</span>
            </button>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{user?.firstName}</div>
            <button className="btn btn-ghost btn-icon" onClick={() => { logout(); navigate('/login'); }} style={{ width: 28, height: 28 }} title="Çıkış">
              <LogOut size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>
      </header>
      <main style={{ padding: 12, maxWidth: 1280, margin: '0 auto' }}>
        <Outlet />
      </main>
      <OfflineIndicator />
    </div>
  );
};

export default PersonnelLayout;
