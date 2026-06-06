import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { MinibarStatus } from '../../types';
import {
  Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock,
  MessageSquare, RefreshCw, ShoppingCart, Save, X, Plus, Minus
} from 'lucide-react';

const TABS = [
  { key: 'ALL', label: 'Tümü', icon: null },
  { key: 'PENDING', label: 'Bekleyen', icon: <Clock size={13} />, color: '#5f6368' },
  { key: 'COMPLETED', label: 'Tamamlanan', icon: <CheckCircle size={13} />, color: '#0f9d58' },
  { key: 'DND', label: 'Rahatsız Etmeyin', icon: <XCircle size={13} />, color: '#d93025' },
  { key: 'LATER', label: 'Sonra', icon: <Clock size={13} />, color: '#f57f17' },
];

const PersonnelDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { on } = useSocket();
  const searchRef = useRef<HTMLInputElement>(null);

  const [blocks, setBlocks] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const readParams = () => {
    const s = sessionStorage.getItem('personnel_filters');
    if (s) { try { return JSON.parse(s); } catch {} }
    return {};
  };
  const saved = readParams();
  const activeTab = searchParams.get('tab') || saved.tab || 'PENDING';
  const selectedBlock = searchParams.get('block') || saved.block || 'ALL';
  const selectedFloor = searchParams.get('floor') || saved.floor || 'ALL';
  const searchQuery = searchParams.get('q') || saved.q || '';

  const saveParams = (tab: string, block: string, floor: string, q: string) => {
    sessionStorage.setItem('personnel_filters', JSON.stringify({ tab, block, floor, q }));
  };
  const setActiveTab = (v: string) => { saveParams(v, selectedBlock, selectedFloor, searchQuery); setSearchParams((p) => { p.set('tab', v); return p; }, { replace: true }); };
  const setSelectedBlock = (v: string) => { saveParams(activeTab, v, v === 'ALL' ? 'ALL' : selectedFloor, searchQuery); setSearchParams((p) => { p.set('block', v); if (v === 'ALL') p.delete('floor'); else if (!p.has('floor')) p.set('floor', 'ALL'); return p; }, { replace: true }); };
  const setSelectedFloor = (v: string) => { saveParams(activeTab, selectedBlock, v, searchQuery); setSearchParams((p) => { if (v === 'ALL') p.delete('floor'); else p.set('floor', v); return p; }, { replace: true }); };
  const setSearchQuery = (v: string) => { saveParams(activeTab, selectedBlock, selectedFloor, v); setSearchParams((p) => { if (!v) p.delete('q'); else p.set('q', v); return p; }, { replace: true }); };
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Inline consumption modal
  const [modalRoom, setModalRoom] = useState<any>(null);
  const [consumptionItems, setConsumptionItems] = useState<Record<string, number>>({});
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [r, b, p] = await Promise.all([api.rooms.getAll(), api.blocks.getAll(), api.products.getAll()]);
      setAllRooms(r);
      setBlocks(b);
      setProducts(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { searchRef.current?.focus(); }, []);

  useEffect(() => {
    const u1 = on('room:status-changed', () => fetchData());
    const u2 = on('room:consumption-recorded', () => fetchData());
    const u3 = on('room:note-updated', () => fetchData());
    return () => { u1(); u2(); u3(); };
  }, [on, fetchData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const idx = TABS.findIndex((t) => t.key === activeTab);
      if (e.key === 'ArrowRight') setActiveTab(TABS[Math.min(TABS.length - 1, idx + 1)].key);
      if (e.key === 'ArrowLeft') setActiveTab(TABS[Math.max(0, idx - 1)].key);
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) setActiveTab(TABS[num - 1].key);
      if (e.key === 'Escape') setModalRoom(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab]);

  // Remove focus first input — no keyboard popup on mobile
  useEffect(() => {
    if (modalRoom) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [modalRoom]);
  const floors = selectedBlock === 'ALL' ? [] : (blocks.find((b) => b.id === selectedBlock)?.floors || []);

  const filteredRooms = allRooms.filter((r) => {
    if (activeTab !== 'ALL' && r.minibarStatus !== activeTab) return false;
    if (activeTab === 'PENDING' && r.occupancyStatus === 'VACANT') return false;
    if (selectedBlock !== 'ALL' && r.blockId !== selectedBlock) return false;
    if (selectedFloor !== 'ALL' && r.floorId !== selectedFloor) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Quick DND/Sonra - instant, no modal
  const handleQuick = async (roomId: string, status: MinibarStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavingId(roomId);
    try { await api.minibar.updateStatus({ roomId, status }); await fetchData(); }
    catch { /* ignore */ }
    finally { setSavingId(null); }
  };

  // Open consumption modal directly on dashboard
  const openConsumptionModal = (room: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalRoom(room);
    setConsumptionItems({});
    setModalError('');
  };

  // Submit consumption from modal
  const handleModalSave = async () => {
    const items = Object.entries(consumptionItems)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    setModalSaving(true);
    setModalError('');
    try {
      if (items.length > 0) {
        await api.minibar.recordConsumption({ roomId: modalRoom.id, items });
      } else {
        await api.minibar.updateStatus({ roomId: modalRoom.id, status: MinibarStatus.COMPLETED });
      }
      setModalRoom(null);
      setConsumptionItems({});
      await fetchData();
      setSuccessMsg(items.length > 0 ? `✓ ${modalRoom.name} — ${totalItems} ürün kaydedildi` : `✓ ${modalRoom.name} — Minibar tamamlandı`);
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err: any) {
      setModalError(err.message || 'Hata');
    } finally { setModalSaving(false); }
  };

  const handleQty = (productId: string, val: number) => {
    const v = Math.max(0, Math.min(99, val));
    setConsumptionItems((prev) => {
      if (v === 0) { const c = { ...prev }; delete c[productId]; return c; }
      return { ...prev, [productId]: v };
    });
  };

  const totalItems = Object.values(consumptionItems).reduce((a, b) => a + b, 0);

  const badge = (s: string) => {
    const m: Record<string, { l: string; c: string; b: string }> = {
      DND: { l: 'DND', c: '#d93025', b: '#ffebee' },
      LATER: { l: 'Sonra', c: '#f57f17', b: '#fff8e1' },
      COMPLETED: { l: 'Tamam', c: '#0f9d58', b: '#e8f5e9' },
      PENDING: { l: 'Bekliyor', c: '#5f6368', b: '#f5f5f5' },
    };
    return m[s] || { l: s, c: '#5f6368', b: '#f5f5f5' };
  };

  const occBadge = (s: string) => {
    const m: Record<string, string> = {
      VACANT: 'Boş', INHOUSE: 'Inhouse', ARRIVAL: 'Giriş', DEPARTURE: 'Çıkış', DEPARTURE_ARRIVAL: 'Çıkış+Giriş',
    };
    return m[s] || s;
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const activeIdx = TABS.findIndex((t) => t.key === activeTab);

  return (
    <div>
      {/* Success Toast */}
      {successMsg && (
        <div style={{
          position: 'fixed', top: 60, right: 16, zIndex: 999,
          background: '#0f9d58', color: '#fff', padding: '10px 18px', borderRadius: 8,
          fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease',
        }}>{successMsg}</div>
      )}
      {/* Tab Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
        <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28, flexShrink: 0 }}
          onClick={() => setActiveTab(TABS[Math.max(0, activeIdx - 1)].key)}
          disabled={activeIdx === 0} title="Önceki sekme (←)">
          <ChevronLeft size={16} />
        </button>
        <div style={{ display: 'flex', gap: 2, flex: 1, overflow: 'auto' }}>
          {TABS.map((tab, i) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, whiteSpace: 'nowrap', padding: '6px 8px', borderRadius: 8,
                border: 'none', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: activeTab === tab.key ? 700 : 500,
                background: activeTab === tab.key ? (tab.color || '#1a73e8') : 'var(--card-bg)',
                color: activeTab === tab.key ? '#fff' : 'var(--text)',
                cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
              title={`${i + 1}. sekme`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28, flexShrink: 0 }}
          onClick={() => setActiveTab(TABS[Math.min(TABS.length - 1, activeIdx + 1)].key)}
          disabled={activeIdx === TABS.length - 1} title="Sonraki sekme (→)">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input ref={searchRef} className="form-input"
            style={{ paddingLeft: 28, fontSize: '0.8rem', height: 32 }}
            placeholder="Oda ara..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="form-input" style={{ fontSize: '0.75rem', height: 32, width: 'auto' }}
          value={selectedBlock} onChange={(e) => { setSelectedBlock(e.target.value); setSelectedFloor('ALL'); }}>
          <option value="ALL">Tüm Bloklar</option>
          {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {selectedBlock !== 'ALL' && (
          <select className="form-input" style={{ fontSize: '0.75rem', height: 32, width: 'auto' }}
            value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value)}>
            <option value="ALL">Tüm Katlar</option>
            {floors.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
        <button className="btn btn-ghost btn-icon" onClick={fetchData} style={{ width: 32, height: 32 }} title="Yenile">
          <RefreshCw size={14} />
        </button>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {filteredRooms.length} oda
        </span>
      </div>

      {/* Room List */}
      {filteredRooms.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Search size={28} style={{ opacity: 0.3, marginBottom: 6 }} />
          <div style={{ fontSize: '0.85rem' }}>Bu grupta oda bulunamadı</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
          {filteredRooms.map((room) => {
            const bdg = badge(room.minibarStatus);
            const isSaving = savingId === room.id;
            return (
              <div key={room.id} className="card"
                onClick={() => navigate(`/personnel/room/${room.id}`)}
                style={{
                  padding: 0, cursor: 'pointer', opacity: isSaving ? 0.6 : 1,
                  border: `1px solid ${room.minibarStatus === 'COMPLETED' ? '#c8e6c9' : room.minibarStatus === 'DND' ? '#ffcdd2' : room.minibarStatus === 'LATER' ? '#ffe082' : 'var(--border)'}`,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.2 }}>{room.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: 6 }}>
                        {room.block?.name}/{room.floor?.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {room.note && <MessageSquare size={12} color="#f9ab00" />}
                      <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, color: bdg.c, background: bdg.b }}>{bdg.l}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 3, background: '#e3f2fd', color: '#1565c0', fontWeight: 500 }}>
                      {occBadge(room.occupancyStatus)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                    <button className="btn btn-sm" onClick={(e) => handleQuick(room.id, MinibarStatus.DND, e)} disabled={isSaving}
                      style={{
                        flex: 1, fontSize: '0.6rem', padding: '3px 2px', fontFamily: 'inherit',
                        background: room.minibarStatus === 'DND' ? '#d93025' : '#ffebee',
                        color: room.minibarStatus === 'DND' ? '#fff' : '#d93025',
                        border: 'none', borderRadius: 4, cursor: 'pointer', transition: 'all 0.1s', fontWeight: 600,
                      }}>
                      DND
                    </button>
                    <button className="btn btn-sm" onClick={(e) => handleQuick(room.id, MinibarStatus.LATER, e)} disabled={isSaving}
                      style={{
                        flex: 1, fontSize: '0.6rem', padding: '3px 2px', fontFamily: 'inherit',
                        background: room.minibarStatus === 'LATER' ? '#f57f17' : '#fff8e1',
                        color: room.minibarStatus === 'LATER' ? '#fff' : '#f57f17',
                        border: 'none', borderRadius: 4, cursor: 'pointer', transition: 'all 0.1s', fontWeight: 600,
                      }}>
                      Sonra
                    </button>
                    <button className="btn btn-sm" onClick={(e) => openConsumptionModal(room, e)} disabled={isSaving}
                      style={{
                        flex: 1.5, fontSize: '0.6rem', padding: '3px 2px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                        background: room.minibarStatus === 'COMPLETED' ? '#0f9d58' : '#e8f5e9',
                        color: room.minibarStatus === 'COMPLETED' ? '#fff' : '#0f9d58',
                        border: 'none', borderRadius: 4, cursor: 'pointer', transition: 'all 0.1s', fontWeight: 600,
                      }}>
                      <ShoppingCart size={10} />Hazır
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Consumption Modal */}
      {modalRoom && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }} onClick={() => { setModalRoom(null); setModalError(''); }}>
          <div className="card" style={{
            width: '100%', maxWidth: 400, maxHeight: '90vh', overflow: 'auto',
            padding: 0, animation: 'fadeIn 0.15s ease',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{modalRoom.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{modalRoom.block?.name} / {modalRoom.floor?.name}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => { setModalRoom(null); setModalError(''); }} style={{ width: 28, height: 28 }}>
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div style={{
                margin: '0 16px', padding: '8px 12px', borderRadius: 6,
                background: '#ffebee', color: '#d93025', fontSize: '0.8rem', fontWeight: 500,
              }}>{modalError}</div>
            )}
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}><ShoppingCart size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />Ürün Girişi</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Eksilen ürün adetlerini gir</div>
                </div>
                <div style={{ background: totalItems > 0 ? '#e8f5e9' : '#f5f5f5', padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', color: totalItems > 0 ? '#2e7d32' : '#5f6368' }}>
                  {totalItems} ürün
                </div>
              </div>

              <div style={{ maxHeight: 320, overflow: 'auto' }}>
                {products.map((p, idx) => {
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
                        <button className="btn btn-icon btn-outline" style={{ width: 24, height: 24 }}
                          onClick={() => handleQty(p.id, (consumptionItems[p.id] || 0) - 1)}>
                          <Minus size={12} />
                        </button>
                        <span style={{ width: 28, textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', userSelect: 'none' }}>{qty}</span>
                        <button className="btn btn-icon btn-outline" style={{ width: 24, height: 24 }}
                          onClick={() => handleQty(p.id, (consumptionItems[p.id] || 0) + 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => { setModalRoom(null); setConsumptionItems({}); setModalError(''); }}>
                İptal (Esc)
              </button>
              <button className="btn btn-success btn-sm" onClick={handleModalSave} disabled={modalSaving}>
                <Save size={13} />{modalSaving ? 'Kaydediliyor...' : totalItems === 0 ? 'Minibar Tamam' : `Tamamla (${totalItems})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelDashboard;
