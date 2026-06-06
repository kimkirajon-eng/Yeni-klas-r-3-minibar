import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { OccupancyStatus } from '../../types';
import { Save } from 'lucide-react';

const OccupancyPage: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBlock, setFilterBlock] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OccupancyStatus>(OccupancyStatus.INHOUSE);

  const fetchData = async () => {
    try {
      const [r, b] = await Promise.all([
        api.rooms.getAll(filterBlock ? { blockId: filterBlock } : {}),
        api.blocks.getAll(),
      ]);
      setRooms(r);
      setBlocks(b);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterBlock]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === rooms.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rooms.map((r) => r.id)));
    }
  };

  const applyBulk = async () => {
    if (selectedIds.size === 0) return alert('Lütfen en az bir oda seçin');
    if (!window.confirm(`${selectedIds.size} oda için konaklama durumu güncellenecek. Devam etmek istiyor musunuz?`)) return;
    try {
      await api.rooms.batchOccupancy({ roomIds: Array.from(selectedIds), occupancyStatus: bulkStatus });
      setSelectedIds(new Set());
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const getOccBadge = (s: string) => {
    const map: Record<string, string> = { VACANT: 'Boş', INHOUSE: 'Inhouse', ARRIVAL: 'Arrival', DEPARTURE: 'Departure', DEPARTURE_ARRIVAL: 'Çıkış+Giriş' };
    return <span className={`badge badge-${s.toLowerCase()}`}>{map[s] || s}</span>;
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Konaklama Durumu Yönetimi</h1>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Blok Filtre</label>
            <select className="form-select" value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)}>
              <option value="">Tüm Bloklar</option>
              {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Toplu Durum</label>
            <select className="form-select" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as OccupancyStatus)}>
              <option value="VACANT">Boş</option>
              <option value="INHOUSE">Inhouse</option>
              <option value="ARRIVAL">Arrival</option>
              <option value="DEPARTURE">Departure</option>
              <option value="DEPARTURE_ARRIVAL">Çıkış+Giriş</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={applyBulk} disabled={selectedIds.size === 0}>
            <Save size={16} />Seçili {selectedIds.size > 0 ? `(${selectedIds.size})` : ''} Kaydet
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', alignSelf: 'center' }}>{rooms.length} oda</span>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={selectedIds.size === rooms.length && rooms.length > 0} onChange={selectAll} />
              </th>
              <th>Oda</th>
              <th>Blok</th>
              <th>Kat</th>
              <th>Mevcut Durum</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id} style={{ background: selectedIds.has(r.id) ? 'var(--primary-light)' : undefined }}>
                <td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                <td><strong>{r.name}</strong></td>
                <td>{r.block?.name}</td>
                <td>{r.floor?.name}</td>
                <td>{getOccBadge(r.occupancyStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OccupancyPage;
