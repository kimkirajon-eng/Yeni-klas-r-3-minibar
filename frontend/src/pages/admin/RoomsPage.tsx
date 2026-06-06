import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { usePagination } from '../../components/ui/Pagination';
import { Pagination } from '../../components/ui/Pagination';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

const RoomsPage: React.FC = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBlock, setFilterBlock] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [floors, setFloors] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', blockId: '', floorId: '' });
  const PAGE_SIZE = 15;

  const fetchRooms = async () => {
    try {
      const params: any = {};
      if (filterBlock) params.blockId = filterBlock;
      if (filterFloor) params.floorId = filterFloor;
      const data = await api.rooms.getAll(params);
      setRooms(data);
    } finally { setLoading(false); }
  };

  const fetchBlocks = async () => {
    const data = await api.blocks.getAll();
    setBlocks(data);
  };

  useEffect(() => { fetchBlocks(); }, []);

  useEffect(() => { fetchRooms(); }, [filterBlock, filterFloor]);

  useEffect(() => {
    if (form.blockId) {
      api.floors.getByBlock(form.blockId).then(setFloors).catch(() => {});
    } else {
      setFloors([]);
    }
  }, [form.blockId]);

  const save = async () => {
    try {
      if (editing) {
        await api.rooms.update(editing.id, form);
      } else {
        await api.rooms.create(form);
      }
      setModal(false);
      setEditing(null);
      setForm({ name: '', blockId: '', floorId: '' });
      fetchRooms();
    } catch (err: any) { toast('error', err.message); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Odayı silmek istediğinize emin misiniz?')) return;
    try {
      await api.rooms.delete(id);
      fetchRooms();
      toast('success', 'Oda silindi');
    } catch (err: any) { toast('error', err.message); }
  };

  const openModal = (room?: any) => {
    if (room) {
      setEditing(room);
      setForm({ name: room.name, blockId: room.blockId, floorId: room.floorId });
    } else {
      setEditing(null);
      setForm({ name: '', blockId: blocks[0]?.id || '', floorId: '' });
    }
    setModal(true);
  };

  const pagination = usePagination(rooms, PAGE_SIZE);

  const getOccBadge = (s: string) => {
    const map: Record<string, string> = { VACANT: 'Boş', INHOUSE: 'Inhouse', ARRIVAL: 'Arrival', DEPARTURE: 'Departure', DEPARTURE_ARRIVAL: 'Çıkış+Giriş' };
    return <span className={`badge badge-${s.toLowerCase()}`}>{map[s] || s}</span>;
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Odalar</h1>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={16} />Yeni Oda</button>
      </div>

      <div className="filter-bar">
        <select className="form-select" value={filterBlock} onChange={(e) => { setFilterBlock(e.target.value); setFilterFloor(''); }}>
          <option value="">Tüm Bloklar</option>
          {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {filterBlock && (
          <select className="form-select" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
            <option value="">Tüm Katlar</option>
            {floors.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{rooms.length} oda bulundu</span>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Oda</th>
              <th>Blok</th>
              <th>Kat</th>
              <th>Konaklama</th>
              <th>Minibar</th>
              <th>Not</th>
              <th style={{ width: 80 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paginatedItems.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong></td>
                <td>{r.block?.name}</td>
                <td>{r.floor?.name}</td>
                <td>{getOccBadge(r.occupancyStatus)}</td>
                <td><span className={`badge badge-${r.minibarStatus.toLowerCase()}`}>{r.minibarStatus}</span></td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-icon btn-ghost" onClick={() => openModal(r)}><Edit2 size={14} /></button>
                    <button className="btn btn-icon btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => remove(r.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '0 16px' }}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={pagination.setCurrentPage}
          />
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Oda Düzenle' : 'Yeni Oda'}</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Blok</label>
                <select className="form-select" value={form.blockId} onChange={(e) => setForm({ ...form, blockId: e.target.value, floorId: '' })}>
                  <option value="">Seçin</option>
                  {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kat</label>
                <select className="form-select" value={form.floorId} onChange={(e) => setForm({ ...form, floorId: e.target.value })}>
                  <option value="">Seçin</option>
                  {floors.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Oda Numarası</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: 101" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={save}>{editing ? 'Güncelle' : 'Oluştur'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
