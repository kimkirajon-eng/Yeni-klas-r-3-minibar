import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useI18n } from '../../store/I18nContext';
import { TrendingUp, RefreshCw, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#1a73e8', '#0f9d58', '#f57f17', '#d93025', '#6a1b9a', '#4285f4', '#f9ab00', '#5f6368', '#00acc1', '#e91e63'];

const ProductReportPage: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const result = await api.reports.productRevenue(start || undefined, end || undefined);
      setData(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const pieData = (data?.products || []).slice(0, 6).map((p: any) => ({
    name: p.productName,
    value: p.totalRevenue,
  }));

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={24} />Ürün Bazlı Satış & Kâr Raporu
        </h1>
        <button className="btn btn-outline" onClick={() => fetchData(startDate, endDate)}><RefreshCw size={16} />Yenile</button>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
          Başlangıç:
          <input type="date" className="form-select" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
          Bitiş:
          <input type="date" className="form-select" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button className="btn btn-primary" onClick={() => fetchData(startDate, endDate)}>Filtrele</button>
        {(startDate || endDate) && (
          <button className="btn btn-outline" onClick={() => { setStartDate(''); setEndDate(''); fetchData(); }}>Temizle</button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="label">Toplam Ürün Çeşidi</div>
          <div className="value" style={{ color: '#1a73e8' }}>{data?.products?.length || 0}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Toplam Satılan Adet</div>
          <div className="value" style={{ color: '#0f9d58' }}>{data?.totalQuantity || 0}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Toplam Ciro (TL)</div>
          <div className="value" style={{ color: '#f57f17' }}>{(data?.totalRevenue || 0).toFixed(2)}</div>
        </div>
        <div className="card stat-card">
          <div className="label">İşlem Sayısı</div>
          <div className="value" style={{ color: '#5f6368' }}>
            {data?.products?.reduce((s: number, p: any) => s + p.transactionCount, 0) || 0}
          </div>
        </div>
      </div>

      {data?.products?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={18} />Ürün Bazında Satış Miktarı
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.products.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis type="number" />
                <YAxis dataKey="productName" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => value.toFixed(0)} />
                <Bar dataKey="totalQuantity" radius={[0, 6, 6, 0]} fill="#1a73e8" name="Adet" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={18} />Ciro Dağılımı (İlk 6)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }: any) => `${name} %${(percent * 100).toFixed(0)}`}>
                  {pieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} TL`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Birim Fiyat (TL)</th>
              <th>Satılan Adet</th>
              <th>İşlem Sayısı</th>
              <th>Toplam Ciro (TL)</th>
              <th>Ciro %</th>
            </tr>
          </thead>
          <tbody>
            {data?.products?.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Henüz veri bulunmuyor</td></tr>
            ) : (
              data?.products?.map((p: any) => {
                const pct = data.totalRevenue > 0 ? ((p.totalRevenue / data.totalRevenue) * 100).toFixed(1) : 0;
                return (
                  <tr key={p.productName}>
                    <td><strong>{p.productName}</strong></td>
                    <td>{p.unitPrice.toFixed(2)}</td>
                    <td><span className="badge badge-completed">{p.totalQuantity}</span></td>
                    <td>{p.transactionCount}</td>
                    <td style={{ fontWeight: 600 }}>{p.totalRevenue.toFixed(2)}</td>
                    <td>{pct}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductReportPage;