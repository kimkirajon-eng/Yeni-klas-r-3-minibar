import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Calendar, Download, Trash2, FileText, RefreshCw } from 'lucide-react';

const SnapshotsPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetch = async () => {
    setLoading(true);
    try { setSnapshots(await api.snapshots.list()); } catch { }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const createNewDay = async () => {
    if (!window.confirm('Yeni gün başlatılacak. Tüm odalar BOŞ duruma geçecek ve ürün girişleri sıfırlanacak. Mevcut durum kaydedilecek. Devam etmek istiyor musunuz?')) return;
    try {
      const result = await api.snapshots.create();
      alert(`Gün sonu kaydedildi: ${result.label}`);
      fetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const viewDetails = async (id: string) => {
    try { setSelected(await api.snapshots.get(id)); } catch { }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={24} />Gün Sonu Kayıtları
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={fetch}><RefreshCw size={16} /> Yenile</button>
          <button className="btn btn-danger" onClick={createNewDay} style={{ background: '#d93025', color: '#fff', border: 'none' }}>
            <FileText size={16} /> Yeni Gün
          </button>
        </div>
      </div>

      {snapshots.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Henüz gün sonu kaydı bulunmuyor. "Yeni Gün" butonu ile kayıt oluşturabilirsiniz.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Tarih</th>
                <th>Oluşturulma</th>
                <th style={{ width: 140 }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.label}</strong></td>
                  <td>{new Date(s.date).toLocaleDateString('tr-TR')}</td>
                  <td>{new Date(s.createdAt).toLocaleString('tr-TR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => viewDetails(s.id)}>Detay</button>
                      <button className="btn btn-sm btn-success" onClick={() => window.open(api.snapshots.pdf(s.id), '_blank')}>
                        <Download size={12} /> PDF
                      </button>
                      <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={async () => {
                        if (window.confirm('Sil?')) { await api.snapshots.delete(s.id); fetch(); }
                      }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>{selected.label}</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <span><strong>Tarih:</strong> {new Date(selected.date).toLocaleDateString('tr-TR')}</span>
                <span><strong>Toplam Oda:</strong> {selected.data?.rooms?.length || 0}</span>
                <span><strong>Toplam Adet:</strong> {selected.data?.totalQuantity || 0}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}><strong>Ciro:</strong> {(selected.data?.totalRevenue || 0).toFixed(2)} TL</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Oda</th>
                    <th>Blok</th>
                    <th>Kat</th>
                    <th>Durum</th>
                    <th>Ürünler</th>
                    <th style={{ textAlign: 'right' }}>Adet</th>
                    <th style={{ textAlign: 'right' }}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.data?.rooms?.map((room: any) => (
                    <tr key={room.id}>
                      <td><strong>{room.name}</strong></td>
                      <td>{room.blockName}</td>
                      <td>{room.floorName}</td>
                      <td>
                        <span className={`badge badge-${room.minibarStatus?.toLowerCase()}`}>
                          {room.minibarStatus === 'COMPLETED' ? 'Tamam' : room.minibarStatus === 'PENDING' ? 'Bekliyor' : room.minibarStatus === 'DND' ? 'DND' : 'Boş'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>
                        {(room.products || []).map((p: any) => (
                          <span key={p.name} style={{ background: '#e8f0fe', padding: '1px 6px', borderRadius: 3, margin: '1px', whiteSpace: 'nowrap' }}>
                            {p.name}: <strong>{p.quantity}</strong>
                          </span>
                        ))}
                      </td>
                      <td style={{ textAlign: 'right' }}>{room.totalQuantity}</td>
                      <td style={{ textAlign: 'right' }}>{room.totalRevenue?.toFixed(2)} TL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Kapat</button>
              <button className="btn btn-success" onClick={() => window.open(api.snapshots.pdf(selected.id), '_blank')}>
                <Download size={14} /> PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnapshotsPage;
