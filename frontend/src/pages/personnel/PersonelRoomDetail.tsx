import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { MinibarStatus } from '../../types';
import {
  ShieldBan, Clock, CheckCircle, Save, ShoppingCart, MessageSquare,
  History, Info, Plus, Minus, ChevronLeft, ChevronRight, ArrowLeft
} from 'lucide-react';

const TABS = [
  { key: 'status', label: 'Durum', icon: <Info size={15} /> },
  { key: 'consumption', label: 'Tüketim', icon: <ShoppingCart size={15} /> },
  { key: 'note', label: 'Not', icon: <MessageSquare size={15} /> },
  { key: 'history', label: 'Geçmiş', icon: <History size={15} /> },
];

const PersonelRoomDetail: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');
  const [selectedStatus, setSelectedStatus] = useState<MinibarStatus | null>(null);
  const [consumptionItems, setConsumptionItems] = useState<Record<string, number>>({});
  const [noteText, setNoteText] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { on } = useSocket();

  const show = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [r, p, h] = await Promise.all([
        api.rooms.getById(roomId!),
        api.products.getAll(),
        api.minibar.getRoomHistory(roomId!),
      ]);
      setRoom(r);
      setNoteText(r.note || '');
      setNoteDraft(r.note || '');
      setProducts(p);
      setHistory(h);
    } catch {
      const saved = sessionStorage.getItem('personnel_filters');
      const params = saved ? `?${new URLSearchParams(JSON.parse(saved)).toString()}` : '';
      navigate('/personnel' + params);
    }
    finally { setLoading(false); }
  }, [roomId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const unsub = on('room:status-changed', (data: any) => {
      if (data.roomId === roomId) fetchData();
    });
    return () => unsub();
  }, [on, roomId, fetchData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') setActiveTab((p) => TABS[Math.min(TABS.length - 1, TABS.findIndex((t) => t.key === p) + 1)].key);
      if (e.key === 'ArrowLeft') setActiveTab((p) => TABS[Math.max(0, TABS.findIndex((t) => t.key === p) - 1)].key);
      if (e.key === 'Escape') {
        const saved = sessionStorage.getItem('personnel_filters');
        const params = saved ? `?${new URLSearchParams(JSON.parse(saved)).toString()}` : '';
        navigate('/personnel' + params);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const handleStatus = async (status: MinibarStatus) => {
    if (status === MinibarStatus.COMPLETED) { setSelectedStatus(status); setActiveTab('consumption'); return; }
    setSaving(true);
    try {
      await api.minibar.updateStatus({ roomId: roomId!, status, note: noteText || undefined });
      fetchData();
      show('success', status === MinibarStatus.DND ? 'DND olarak işaretlendi' : 'Sonra olarak işaretlendi');
    } catch (err: any) { show('error', err.message || 'Hata'); }
    finally { setSaving(false); }
  };

  const handleConsumption = async () => {
    const items = Object.entries(consumptionItems)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) { show('error', 'En az bir ürün seçin'); return; }
    setSaving(true);
    try {
      await api.minibar.recordConsumption({ roomId: roomId!, items, note: noteText || undefined });
      show('success', 'Tüketim kaydedildi ✓');
      setTimeout(() => {
        const saved = sessionStorage.getItem('personnel_filters');
        const params = saved ? `?${new URLSearchParams(JSON.parse(saved)).toString()}` : '';
        navigate('/personnel' + params);
      }, 800);
    } catch (err: any) { show('error', err.message || 'Hata'); }
    finally { setSaving(false); }
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      await api.minibar.updateNote(roomId!, noteDraft || null);
      setNoteText(noteDraft || '');
      show('success', 'Not kaydedildi');
      setTimeout(() => {
        const saved = sessionStorage.getItem('personnel_filters');
        const params = saved ? `?${new URLSearchParams(JSON.parse(saved)).toString()}` : '';
        navigate('/personnel' + params);
      }, 800);
    } catch (err: any) { show('error', err.message || 'Hata'); }
    finally { setSaving(false); }
  };

  const handleQty = (productId: string, delta: number) => {
    setConsumptionItems((prev) => {
      const cur = prev[productId] || 0;
      const next = Math.max(0, Math.min(99, cur + delta));
      if (next === 0) { const c = { ...prev }; delete c[productId]; return c; }
      return { ...prev, [productId]: next };
    });
  };

  const totalItems = Object.values(consumptionItems).reduce((a, b) => a + b, 0);
  const activeIdx = TABS.findIndex((t) => t.key === activeTab);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!room) return null;

  const cfg: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    DND: { icon: <ShieldBan size={20} />, label: 'Rahatsız Etmeyin', color: '#d93025' },
    LATER: { icon: <Clock size={20} />, label: 'Sonra', color: '#f57f17' },
    COMPLETED: { icon: <CheckCircle size={20} />, label: 'Tamamlandı', color: '#0f9d58' },
    PENDING: { icon: <Clock size={20} />, label: 'Beklemede', color: '#5f6368' },
  };
  const cur = cfg[room.minibarStatus] || cfg.PENDING;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => {
            const saved = sessionStorage.getItem('personnel_filters');
            const params = saved ? `?${new URLSearchParams(JSON.parse(saved)).toString()}` : '';
            navigate('/personnel' + params);
          }} style={{ width: 30, height: 30 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.2 }}>{room.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{room.block?.name} / {room.floor?.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 4, background: cur.color + '18', color: cur.color, fontWeight: 600 }}>
            {cur.label}
          </span>
          <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 4, background: '#e3f2fd', color: '#1565c0', fontWeight: 500 }}>
            {room.occupancyStatus === 'VACANT' ? 'Boş' : room.occupancyStatus === 'INHOUSE' ? 'Inhouse' : room.occupancyStatus === 'ARRIVAL' ? 'Giriş' : room.occupancyStatus === 'DEPARTURE' ? 'Çıkış' : 'Çıkış+Giriş'}
          </span>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div style={{
          padding: '8px 14px', borderRadius: 6, marginBottom: 10,
          background: msg.type === 'success' ? '#e8f5e9' : '#ffebee',
          color: msg.type === 'success' ? '#2e7d32' : '#d93025',
          fontWeight: 500, fontSize: '0.8rem',
        }}>{msg.text}</div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 12 }}>
        <button className="btn btn-ghost btn-icon" style={{ width: 26, height: 26 }}
          onClick={() => setActiveTab(TABS[Math.max(0, activeIdx - 1)].key)}
          disabled={activeIdx === 0}><ChevronLeft size={14} /></button>
        {TABS.map((tab, i) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600,
              background: activeTab === tab.key ? cur.color : 'var(--card-bg)',
              color: activeTab === tab.key ? '#fff' : 'var(--text)',
              cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
            {tab.icon}{tab.label}
          </button>
        ))}
        <button className="btn btn-ghost btn-icon" style={{ width: 26, height: 26 }}
          onClick={() => setActiveTab(TABS[Math.min(TABS.length - 1, activeIdx + 1)].key)}
          disabled={activeIdx === TABS.length - 1}><ChevronRight size={14} /></button>
      </div>

      {/* Tab Content */}
      {activeTab === 'status' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { status: MinibarStatus.DND, icon: <ShieldBan size={18} />, label: 'Rahatsız Etmeyin', color: '#d93025', bg: '#ffebee' },
              { status: MinibarStatus.LATER, icon: <Clock size={18} />, label: 'Sonra', color: '#f57f17', bg: '#fff8e1' },
              { status: MinibarStatus.COMPLETED, icon: <CheckCircle size={18} />, label: 'Tamamlandı', color: '#0f9d58', bg: '#e8f5e9' },
            ].map((btn) => (
              <button key={btn.status} className="card" onClick={() => handleStatus(btn.status)} disabled={saving}
                style={{
                  padding: '14px 10px', textAlign: 'center', fontFamily: 'inherit', cursor: 'pointer',
                  border: room.minibarStatus === btn.status ? `2px solid ${btn.color}` : '1px solid var(--border)',
                  background: selectedStatus === btn.status ? btn.bg : '#fff',
                  opacity: saving ? 0.6 : 1, transition: 'all 0.12s',
                }}>
                <div style={{ color: btn.color, marginBottom: 4 }}>{btn.icon}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: btn.color }}>{btn.label}</div>
              </button>
            ))}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={14} />Oda Bilgileri
            </div>
            {[
              { l: 'Blok', v: room.block?.name }, { l: 'Kat', v: room.floor?.name },
              { l: 'Konaklama', v: occLabel(room.occupancyStatus) },
              { l: 'Minibar', v: cur.label },
              { l: 'Not', v: noteText || '—' },
            ].map((i) => (
              <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.8rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{i.l}</span>
                <span style={{ fontWeight: 500 }}>{i.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'consumption' && (
        <div className="card" style={{ padding: 16, border: selectedStatus === MinibarStatus.COMPLETED ? '2px solid var(--success)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}><ShoppingCart size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />Ürün Girişi</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Eksilen ürün adetlerini gir</div>
            </div>
            <div style={{ background: totalItems > 0 ? '#e8f5e9' : '#f5f5f5', padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', color: totalItems > 0 ? '#2e7d32' : '#5f6368' }}>
              {totalItems} ürün
            </div>
          </div>

          <div style={{ maxHeight: 320, overflow: 'auto', marginBottom: 12 }}>
            {products.map((p) => {
              const qty = consumptionItems[p.id] || 0;
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 8px', marginBottom: 3,
                  background: qty > 0 ? '#f0f9f0' : '#f8f9fa',
                  borderRadius: 6, border: qty > 0 ? '1px solid #c8e6c9' : '1px solid transparent',
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.6rem', color: p.stock <= p.minStockLevel ? '#d93025' : 'var(--text-secondary)' }}>
                      {Number(p.price).toFixed(2)} TL · Stok: {p.stock}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button className="btn btn-icon btn-outline" style={{ width: 24, height: 24 }} onClick={() => handleQty(p.id, -1)}>
                      <Minus size={12} />
                    </button>
                    <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>{qty}</span>
                    <button className="btn btn-icon btn-outline" style={{ width: 24, height: 24 }} onClick={() => handleQty(p.id, 1)}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <button className="btn btn-outline btn-sm" onClick={() => { setSelectedStatus(null); setConsumptionItems({}); }}>
              İptal
            </button>
            <button className="btn btn-success btn-sm" onClick={handleConsumption} disabled={saving || totalItems === 0}>
              <Save size={13} />{saving ? 'Kaydediliyor...' : `Tamamla (${totalItems})`}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'note' && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={16} />Oda Notu
          </div>
          <textarea className="form-textarea" value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Oda ile ilgili notlar..." rows={4}
            style={{ fontSize: '0.85rem' }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setNoteDraft(noteText)}>Sıfırla</button>
            <button className="btn btn-primary btn-sm" onClick={saveNote} disabled={saving}>
              <Save size={13} />Kaydet
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={16} />İşlem Geçmişi
          </div>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
              Henüz işlem yok
            </p>
          ) : (
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {history.map((h: any) => (
                <div key={h.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
                  borderBottom: '1px solid var(--border)', fontSize: '0.78rem',
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: h.newStatus === 'COMPLETED' ? '#0f9d58' : h.newStatus === 'DND' ? '#d93025' : h.newStatus === 'LATER' ? '#f57f17' : '#9e9e9e',
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 500 }}>{h.changedBy?.firstName}</span>
                    {' → '}
                    <span style={{ color: h.newStatus === 'COMPLETED' ? '#0f9d58' : h.newStatus === 'DND' ? '#d93025' : h.newStatus === 'LATER' ? '#f57f17' : '#9e9e9e', fontWeight: 500 }}>
                      {h.newStatus === 'COMPLETED' ? 'Tamamlandı' : h.newStatus === 'DND' ? 'DND' : h.newStatus === 'LATER' ? 'Sonra' : h.newStatus}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    {new Date(h.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation Hint */}
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
        ← → sekmeler · Esc çıkış
      </div>
    </div>
  );
};

const occLabel = (s: string) => {
  const m: Record<string, string> = {
    INHOUSE: 'Inhouse', ARRIVAL: 'Giriş', DEPARTURE: 'Çıkış', DEPARTURE_ARRIVAL: 'Çıkış+Giriş', VACANT: 'Boş',
  };
  return m[s] || s;
};

export default PersonelRoomDetail;
