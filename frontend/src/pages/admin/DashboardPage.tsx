import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useI18n } from '../../store/I18nContext';
import { DashboardStats, RoomStatusHistory } from '../../types';
import { RefreshCw, Bell, BarChart3, TrendingUp, Package, Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0f9d58', '#d93025', '#f57f17', '#4285f4', '#5f6368', '#6a1b9a'];

const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [histories, setHistories] = useState<RoomStatusHistory[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [filterBlock, setFilterBlock] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [floors, setFloors] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { on } = useSocket();

  const fetchData = useCallback(async () => {
    try {
      const [s, h, l] = await Promise.all([
        api.minibar.getDashboard(),
        api.minibar.getStatusHistories(),
        api.minibar.getTodayLogs(),
      ]);
      setStats(s);
      setHistories(h);
      setTodayLogs(l);
    } catch (err) {
      console.error('Dashboard verisi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { api.blocks.getAll().then(setBlocks); fetchData(); }, [fetchData]);

  useEffect(() => {
    const unsub1 = on('room:status-changed', () => fetchData());
    const unsub2 = on('room:consumption-recorded', () => fetchData());
    return () => { unsub1(); unsub2(); };
  }, [on, fetchData]);

  useEffect(() => {
    if (filterBlock) api.floors.getByBlock(filterBlock).then(setFloors).catch(() => {});
    else setFloors([]);
  }, [filterBlock]);

  const handleExportExcel = (filtered = false) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filtered && filterBlock) params.set('blockId', filterBlock);
    if (filtered && filterFloor) params.set('floorId', filterFloor);
    const qs = params.toString();
    window.open(`/api/reports/excel?token=${token}${qs ? `&${qs}` : ''}`, '_blank');
  };

  const handleExportPdf = (filtered = false) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filtered && filterBlock) params.set('blockId', filterBlock);
    if (filtered && filterFloor) params.set('floorId', filterFloor);
    const qs = params.toString();
    window.open(`/api/reports/pdf?token=${token}${qs ? `&${qs}` : ''}`, '_blank');
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const occupancyData = [
    { name: 'Boş', value: stats?.vacant ?? 0, color: '#9e9e9e' },
    { name: 'Inhouse', value: stats?.inhouse ?? 0, color: '#0f9d58' },
    { name: 'Arrival', value: stats?.arrival ?? 0, color: '#4285f4' },
    { name: 'Departure', value: stats?.departure ?? 0, color: '#f9ab00' },
  ];

  const minibarData = [
    { name: 'Tamamlandı', value: stats?.completed ?? 0, color: '#0f9d58' },
    { name: 'DND', value: stats?.dnd ?? 0, color: '#d93025' },
    { name: 'Sonra', value: stats?.later ?? 0, color: '#f57f17' },
    { name: 'Beklemede', value: stats?.pending ?? 0, color: '#5f6368' },
  ];

  const productSummary: Record<string, number> = {};
  todayLogs.forEach((log: any) => {
    const name = log.product?.name || 'Bilinmeyen';
    productSummary[name] = (productSummary[name] || 0) + log.quantity;
  });
  const productChartData = Object.entries(productSummary)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const hourlyData: Record<string, number> = {};
  todayLogs.forEach((log: any) => {
    const hour = new Date(log.performedAt).getHours().toString().padStart(2, '0') + ':00';
    hourlyData[hour] = (hourlyData[hour] || 0) + log.quantity;
  });
  const hourlyChartData = Object.entries(hourlyData)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const statCards = [
    { label: 'Toplam Oda', value: stats?.totalRooms ?? 0, color: '#1a73e8' },
    { label: 'Boş Oda', value: stats?.vacant ?? 0, color: '#9e9e9e' },
    { label: 'Inhouse', value: stats?.inhouse ?? 0, color: '#0f9d58' },
    { label: 'Arrival', value: stats?.arrival ?? 0, color: '#4285f4' },
    { label: 'Departure', value: stats?.departure ?? 0, color: '#f9ab00' },
    { label: 'DND', value: stats?.dnd ?? 0, color: '#d93025' },
    { label: 'Tamamlandı', value: stats?.completed ?? 0, color: '#0f9d58' },
    { label: 'Bekleyen', value: stats?.pending ?? 0, color: '#5f6368' },
    { label: 'Sonra', value: stats?.later ?? 0, color: '#f57f17' },
    { label: 'Bugün Tüketim', value: stats?.todayConsumptions ?? 0, color: '#6a1b9a' },
    { label: 'Aktif Personel', value: stats?.activePersonnel ?? 0, color: '#1a73e8' },
  ];

  const getStatusBadge = (status: string) => {
    const cls = status.toLowerCase();
    const labels: Record<string, string> = {
      vacant: 'Boş', inhouse: 'Inhouse', arrival: 'Giriş', departure: 'Çıkış', departure_arrival: 'Çıkış+Giriş',
      dnd: 'DND', later: 'Sonra', completed: 'Tamamlandı', pending: 'Beklemede',
    };
    return <span className={`badge badge-${cls}`}>{labels[cls] || status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={24} />Dashboard
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} />{showFilters ? 'Gizle' : 'Filtrele'}
          </button>
          <button className="btn btn-success" onClick={() => handleExportExcel(showFilters)}>
            <FileSpreadsheet size={16} />{t('dashboard.exportExcel', 'Excel')}
          </button>
          <button className="btn btn-danger" onClick={() => handleExportPdf(showFilters)}>
            <FileText size={16} />{t('dashboard.exportPdf', 'PDF')}
          </button>
          <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={16} />Yenile</button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-bar" style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16 }}>
          <select className="form-select" value={filterBlock} onChange={(e) => { setFilterBlock(e.target.value); setFilterFloor(''); }}>
            <option value="">Tüm Bloklar</option>
            {blocks.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {filterBlock && (
            <select className="form-select" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
              <option value="">Tüm Katlar</option>
              {floors.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Rapor indirme butonları seçili filtreye göre çalışır
          </span>
        </div>
      )}

      <div className="stats-grid">
        {statCards.map((card) => (
          <div className="card stat-card" key={card.label}>
            <div className="label">{card.label}</div>
            <div className="value" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={18} />Konaklama Durumu Dağılımı
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={occupancyData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} %${(percent * 100).toFixed(0)}`}>
                {occupancyData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={18} />Minibar Durumu
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={minibarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {minibarData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {productChartData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={18} />Bugünkü Ürün Tüketimi
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={productChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#1a73e8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {hourlyChartData.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={18} />Saatlik Tüketim Trendi
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1a73e8" strokeWidth={2} dot={{ fill: '#1a73e8', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Bell size={18} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Canlı Aktivite Akışı</h2>
        </div>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {histories.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>Henüz aktivite bulunmuyor</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Saat</th>
                  <th>Oda</th>
                  <th>Blok/Kat</th>
                  <th>Eski Durum</th>
                  <th>Yeni Durum</th>
                  <th>Personel</th>
                </tr>
              </thead>
              <tbody>
                {histories.slice(0, 100).map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><strong>{h.room?.name}</strong></td>
                    <td>{h.room?.block?.name} / {h.room?.floor?.name}</td>
                    <td>{h.oldStatus ? getStatusBadge(h.oldStatus) : <span style={{ color: 'var(--text-secondary)' }}>-</span>}</td>
                    <td>{getStatusBadge(h.newStatus)}</td>
                    <td>{h.changedBy?.firstName} {h.changedBy?.lastName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
