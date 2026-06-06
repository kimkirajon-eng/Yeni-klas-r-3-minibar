import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { UserRole } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', password: '', role: UserRole.PERSONNEL });

  const fetchUsers = async () => {
    try { setUsers(await api.users.getAll()); } finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);

  const save = async () => {
    try {
      if (editing) {
        const data: any = { firstName: form.firstName, lastName: form.lastName, username: form.username, role: form.role };
        if (form.password) data.password = form.password;
        await api.users.update(editing.id, data);
      } else {
        await api.users.create(form);
      }
      setModal(false);
      setEditing(null);
      setForm({ firstName: '', lastName: '', username: '', password: '', role: UserRole.PERSONNEL });
      fetchUsers();
    } catch (err: any) { alert(err.message); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try { await api.users.delete(id); fetchUsers(); } catch (err: any) { alert(err.message); }
  };

  const openModal = (user?: any) => {
    if (user) {
      setEditing(user);
      setForm({ firstName: user.firstName, lastName: user.lastName, username: user.username, password: '', role: user.role });
    } else {
      setEditing(null);
      setForm({ firstName: '', lastName: '', username: '', password: '', role: UserRole.PERSONNEL });
    }
    setModal(true);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Kullanıcı Yönetimi</h1>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={16} />Yeni Kullanıcı</button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Kullanıcı Adı</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Oluşturulma</th>
              <th style={{ width: 80 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.firstName} {u.lastName}</strong></td>
                <td>{u.username}</td>
                <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-dnd' : 'badge-later'}`}>{u.role}</span></td>
                <td><span className={`badge ${u.isActive ? 'badge-completed' : 'badge-dnd'}`}>{u.isActive ? 'Aktif' : 'Pasif'}</span></td>
                <td>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-icon btn-ghost" onClick={() => openModal(u)}><Edit2 size={14} /></button>
                    <button className="btn btn-icon btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => remove(u.id)}><Trash2 size={14} /></button>
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
              <h2>{editing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Ad</label>
                  <input className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Soyad</label>
                  <input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Kullanıcı Adı</label>
                <input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{editing ? 'Yeni Şifre (boş bırakılırsa değişmez)' : 'Şifre'}</label>
                <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                  <option value="PERSONNEL">Personel</option>
                  <option value="ADMIN">Admin</option>
                </select>
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

export default UsersPage;
