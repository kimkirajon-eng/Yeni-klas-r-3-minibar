import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useI18n } from '../../store/I18nContext';
import { Users, Activity, DollarSign, CheckCircle, RefreshCw, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformancePage: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/performance', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const totalActions = data.reduce((s, p) => s + p.totalActions, 0);
  const todayActions = data.reduce((s, p) => s + p.todayActions, 0);
  const totalRevenue = data.reduce((s, p) => s + p.totalRevenue, 0);

  const actionChartData = data.map((p: any) => ({ name: p.name.split(' ')[0], total: p.totalActions, today: p.todayActions }));
  const revenueChartData = data.map((p: any) => ({ name: p.name.split(' ')[0], revenue: p.totalRevenue }));

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={24} />Performans Raporları
        </h1>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={16} />{t('common.refresh')}</button>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="label">Toplam İşlem</div>
          <div className="value" style={{ color: '#1a73e8' }}>{totalActions}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Bugünkü İşlem</div>
          <div className="value" style={{ color: '#0f9d58' }}>{todayActions}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Toplam Ciro</div>
          <div className="value" style={{ color: '#f57f17' }}>{totalRevenue.toFixed(2)} TL</div>
        </div>
        <div className="card stat-card">
          <div className="label">Aktif Personel</div>
          <div className="value" style={{ color: '#5f6368' }}>{data.length}</div>
        </div>
      </div>

      {data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={18} />İşlem Karşılaştırması
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={actionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#1a73e8" name="Toplam İşlem" />
                <Bar dataKey="today" radius={[6, 6, 0, 0]} fill="#0f9d58" name="Bugün" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={18} />Ciro Karşılaştırması (TL)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} TL`} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#f57f17" name="Ciro" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Personel</th>
              <th>Toplam İşlem</th>
              <th>Bugün</th>
              <th>Tamamlanan Oda</th>
              <th>Toplam Ciro (TL)</th>
              <th>Son İşlem</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p: any) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>{p.totalActions}</td>
                <td><span className="badge badge-completed">{p.todayActions}</span></td>
                <td>{p.completedRooms}</td>
                <td>{p.totalRevenue.toFixed(2)}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {p.lastAction ? new Date(p.lastAction).toLocaleString('tr-TR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformancePage;
