import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useI18n } from '../../store/I18nContext';
import { DollarSign, TrendingUp, RefreshCw, Filter } from 'lucide-react';

const CostSummaryPage: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [blockId, setBlockId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [floors, setFloors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (blockId) params.blockId = blockId;
      if (floorId) params.floorId = floorId;
      const qs = new URLSearchParams(params).toString();
      const endpoint = `/api/rooms/cost-summary${qs ? `?${qs}` : ''}`;
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { api.blocks.getAll().then(setBlocks); }, []);
  useEffect(() => { if (blockId) api.floors.getByBlock(blockId).then(setFloors); else setFloors([]); }, [blockId]);
  useEffect(() => { fetchData(); }, []);

  const totalCost = data.reduce((s, r) => s + r.totalCost, 0);
  const todayCost = data.reduce((s, r) => s + r.todayCost, 0);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={24} />Maliyet / Hesap Özeti
        </h1>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={16} />{t('common.refresh')}</button>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="label">Toplam Maliyet (Tüm Zamanlar)</div>
          <div className="value" style={{ color: '#1a73e8' }}>{totalCost.toFixed(2)} TL</div>
        </div>
        <div className="card stat-card">
          <div className="label">Bugünkü Maliyet</div>
          <div className="value" style={{ color: '#0f9d58' }}>{todayCost.toFixed(2)} TL</div>
        </div>
        <div className="card stat-card">
          <div className="label">Oda Sayısı</div>
          <div className="value" style={{ color: '#5f6368' }}>{data.length}</div>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-select" value={blockId} onChange={(e) => { setBlockId(e.target.value); setFloorId(''); }}>
          <option value="">Tüm Bloklar</option>
          {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {blockId && (
          <select className="form-select" value={floorId} onChange={(e) => setFloorId(e.target.value)}>
            <option value="">Tüm Katlar</option>
            {floors.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
        <button className="btn btn-outline" onClick={fetchData}><Filter size={14} />Filtrele</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Oda</th>
              <th>Blok/Kat</th>
              <th>Durum</th>
              <th>Toplam Tüketim</th>
              <th>Toplam Maliyet</th>
              <th>Bugünkü Maliyet</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r: any) => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong></td>
                <td>{r.block} / {r.floor}</td>
                <td>
                  <span className={`badge badge-${r.minibarStatus?.toLowerCase()}`}>{r.minibarStatus}</span>
                </td>
                <td>{r.totalConsumptions} ürün</td>
                <td><strong>{r.totalCost.toFixed(2)} TL</strong></td>
                <td>{r.todayCost.toFixed(2)} TL</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostSummaryPage;
