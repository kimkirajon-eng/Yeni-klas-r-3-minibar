import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useI18n } from '../../store/I18nContext';
import { Package, AlertTriangle, TrendingDown, RefreshCw } from 'lucide-react';

const StockPage: React.FC = () => {
  const { t } = useI18n();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<{ id: string; name: string } | null>(null);
  const [stockQty, setStockQty] = useState(0);
  const { on } = useSocket();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.products.getStockSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const u1 = on('room:consumption-recorded', () => fetchData());
    return () => { u1(); };
  }, [on, fetchData]);

  const handleUpdateStock = async () => {
    if (!editingStock || stockQty === 0) return;
    try {
      await api.products.updateStock(editingStock.id, stockQty);
      setEditingStock(null);
      setStockQty(0);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const statCards = summary ? [
    { label: t('stock.totalProducts', 'Toplam Ürün'), value: summary.totalProducts, color: '#1a73e8' },
    { label: t('stock.totalStock', 'Toplam Stok'), value: summary.totalStock, color: '#0f9d58' },
    { label: t('stock.lowStockCount', 'Düşük Stoklu Ürün'), value: summary.lowStockCount, color: '#d93025' },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={24} />{t('stock.title', 'Stok Yönetimi')}
        </h1>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={16} />{t('common.refresh')}</button>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <div className="card stat-card" key={card.label}>
            <div className="label">{card.label}</div>
            <div className="value" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {summary?.lowStockProducts?.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16, borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <strong>{t('stock.lowStock', 'Düşük Stok Uyarısı')}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {summary.lowStockProducts.map((p: any) => (
              <span className="badge badge-lowstock" key={p.id}>
                {p.name} ({p.stock}/{p.minStockLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="stock-grid">
        {summary?.products?.map((product: any) => {
          const isLow = product.stock <= product.minStockLevel;
          const pct = Math.min(100, (product.stock / Math.max(product.minStockLevel, 1)) * 100);
          return (
            <div className="card stock-card" key={product.id}>
              <div className="stock-header">
                <span className="stock-name">{product.name}</span>
                <span className={`badge ${isLow ? 'badge-lowstock' : 'badge-okstock'}`}>
                  {isLow ? <TrendingDown size={12} /> : null}
                  {product.stock} / {product.minStockLevel}
                </span>
              </div>
              <div className="stock-bar">
                <div className="stock-bar-fill" style={{ width: `${pct}%`, background: isLow ? 'var(--danger)' : 'var(--success)' }} />
              </div>
              <div className="stock-info">
                <span>{t('stock.stockLevel', 'Stok Seviyesi')}: {product.stock}</span>
                <span>{t('stock.minLevel', 'Min. Stok')}: {product.minStockLevel}</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                <button className="btn btn-sm btn-outline" onClick={() => { setEditingStock({ id: product.id, name: product.name }); setStockQty(1); }}>
                  {t('stock.addStock', 'Stok Ekle')}
                </button>
                <button className="btn btn-sm btn-outline" onClick={() => { setEditingStock({ id: product.id, name: product.name }); setStockQty(-1); }}>
                  {t('stock.removeStock', 'Stok Çıkar')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingStock && (
        <div className="modal-overlay" onClick={() => setEditingStock(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('stock.updateStock', 'Stok Güncelle')} — {editingStock.name}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditingStock(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('stock.quantity', 'Miktar')}</label>
                <input className="form-input" type="number" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} />
                <small style={{ color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                  {stockQty > 0 ? `+${stockQty} eklenecek` : `${Math.abs(stockQty)} çıkarılacak`}
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditingStock(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleUpdateStock}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPage;
