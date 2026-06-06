import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', price: '' });

  const fetchProducts = async () => {
    try { setProducts(await api.products.getAll(true)); } finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);

  const save = async () => {
    try {
      const data = { name: form.name, price: parseFloat(form.price) };
      if (isNaN(data.price) || data.price < 0) return alert('Geçerli bir fiyat girin');
      if (editing) {
        await api.products.update(editing.id, data);
      } else {
        await api.products.create(data);
      }
      setModal(false);
      setEditing(null);
      setForm({ name: '', price: '' });
      fetchProducts();
    } catch (err: any) { alert(err.message); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Ürünü silmek istediğinize emin misiniz?')) return;
    try { await api.products.delete(id); fetchProducts(); } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Minibar Ürünleri</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', price: '' }); setModal(true); }}>
          <Plus size={16} />Yeni Ürün
        </button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Ürün Adı</th>
              <th>Fiyat (TL)</th>
              <th>Durum</th>
              <th style={{ width: 80 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>{Number(p.price).toFixed(2)} TL</td>
                <td><span className={`badge ${p.isActive ? 'badge-completed' : 'badge-dnd'}`}>{p.isActive ? 'Aktif' : 'Pasif'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-icon btn-ghost" onClick={() => { setEditing(p); setForm({ name: p.name, price: String(p.price) }); setModal(true); }}><Edit2 size={14} /></button>
                    <button className="btn btn-icon btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => remove(p.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Ürün Adı</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: Kola" />
              </div>
              <div className="form-group">
                <label className="form-label">Fiyat (TL)</label>
                <input className="form-input" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Örn: 15.00" />
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

export default ProductsPage;
