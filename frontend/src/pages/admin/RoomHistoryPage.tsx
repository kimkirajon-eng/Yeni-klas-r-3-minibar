import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useI18n } from '../../store/I18nContext';
import { Clock, User, Package, ArrowLeft, History } from 'lucide-react';

const RoomHistoryPage: React.FC = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('roomId');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) { setLoading(false); return; }
    api.rooms.getById(roomId).then((room) => {
      Promise.all([
        api.minibar.getRoomHistory(roomId),
      ]).then(([hist]) => {
        setData({ room, statusHistories: hist, consumptions: room.minibarLogs || [] });
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }, [roomId]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!roomId) return <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Oda seçilmedi</div>;

  const allEvents = [
    ...(data?.statusHistories || []).map((h: any) => ({ type: 'status', ...h, time: h.createdAt })),
    ...(data?.consumptions || []).map((c: any) => ({ type: 'consumption', ...c, time: c.performedAt })),
  ].sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = { DND: 'DND', LATER: 'Sonra', COMPLETED: 'Tamamlandı', PENDING: 'Beklemede' };
    return map[s] || s;
  };
  const occLabel = (s?: string) => {
    const map: Record<string, string> = { VACANT: 'Boş', INHOUSE: 'Inhouse', ARRIVAL: 'Giriş', DEPARTURE: 'Çıkış', DEPARTURE_ARRIVAL: 'Çıkış+Giriş' };
    return s ? (map[s] || s) : '';
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={24} />{t('room.detail')} — {data?.room?.name}
        </h1>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />{t('common.back')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>{t('room.status')}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge badge-${data?.room?.occupancyStatus?.toLowerCase()}`}>{occLabel(data?.room?.occupancyStatus)}</span>
            <span className={`badge badge-${data?.room?.minibarStatus?.toLowerCase()}`}>{getStatusLabel(data?.room?.minibarStatus)}</span>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>{t('room.note')}</div>
          <div>{data?.room?.note || '-'}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={18} />Aktivite Geçmişi
        </h3>
        <div style={{ maxHeight: 500, overflow: 'auto' }}>
          {allEvents.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Henüz aktivite yok</p>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
              {allEvents.slice(0, 100).map((event: any, i: number) => (
                <div key={`${event.type}-${event.id}`} style={{ position: 'relative', paddingBottom: 16 }}>
                  <div style={{
                    position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%',
                    background: event.type === 'status' ? 'var(--primary)' : 'var(--success)',
                    border: '2px solid var(--bg-card)',
                  }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                    {new Date(event.time).toLocaleString('tr-TR')}
                  </div>
                  {event.type === 'status' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
                      <User size={14} style={{ color: 'var(--primary)' }} />
                      <span>Durum değişikliği: <strong>{getStatusLabel(event.oldStatus) || '-'}</strong> → <strong>{getStatusLabel(event.newStatus)}</strong></span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {event.changedBy?.firstName} {event.changedBy?.lastName}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
                      <Package size={14} style={{ color: 'var(--success)' }} />
                      <span>Tüketim: <strong>{event.product?.name}</strong> x{event.quantity}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {event.personnel?.firstName} {event.personnel?.lastName}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomHistoryPage;
