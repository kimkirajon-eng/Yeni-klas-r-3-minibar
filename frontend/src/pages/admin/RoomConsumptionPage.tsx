import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Building2, RefreshCw, Calendar, FileText } from 'lucide-react';

const RoomConsumptionPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const result = await api.reports.roomConsumption(start || undefined, end || undefined);
      setData(result);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilter = () => fetchData(startDate || undefined, endDate || undefined);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={24} />Oda Bazlı Tüketim Raporu
        </h1>
        <button className="btn btn-outline" onClick={() => fetchData()}><RefreshCw size={16} /> Yenile</button>
        <button className="btn btn-success" onClick={() => window.open(api.reports.roomConsumptionPdf(startDate || undefined, endDate || undefined), '_blank')}><FileText size={16} /> PDF İndir</button>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 160 }} />
        <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 160 }} />
        <button className="btn btn-primary" onClick={handleFilter}><Calendar size={14} /> Filtrele</button>
      </div>

      {data?.rooms?.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Tüketim bulunamadı</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Oda</th>
                <th>Blok</th>
                <th>Kat</th>
                <th>Durum</th>
                <th>Ürünler</th>
                <th style={{ textAlign: 'right' }}>Toplam Adet</th>
                <th style={{ textAlign: 'right' }}>Toplam Tutar</th>
              </tr>
            </thead>
            <tbody>
              {data?.rooms?.map((room: any) => (
                <tr key={room.roomId}>
                  <td><strong>{room.roomName}</strong></td>
                  <td>{room.blockName}</td>
                  <td>{room.floorName}</td>
                  <td>
                    <span className={`badge badge-${room.minibarStatus?.toLowerCase()}`}>
                      {room.minibarStatus === 'COMPLETED' ? 'Tamam' : room.minibarStatus === 'PENDING' ? 'Bekliyor' : room.minibarStatus === 'DND' ? 'DND' : room.minibarStatus === 'LATER' ? 'Sonra' : room.minibarStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {room.products?.map((p: any) => (
                      <span key={p.name} style={{ display: 'inline-block', background: '#e8f0fe', padding: '2px 8px', borderRadius: 4, margin: '1px 2px', whiteSpace: 'nowrap' }}>
                        {p.name}: <strong>{p.quantity}</strong>
                      </span>
                    ))}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{room.totalQuantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{room.totalRevenue?.toFixed(2)} TL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.rooms?.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 16, fontSize: '0.9rem' }}>
          <span><strong>Genel Toplam:</strong> {data.rooms.reduce((s: number, r: any) => s + r.totalQuantity, 0)} adet</span>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{data.grandTotal?.toFixed(2)} TL</span>
        </div>
      )}
    </div>
  );
};

export default RoomConsumptionPage;
