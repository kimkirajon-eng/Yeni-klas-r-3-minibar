import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useI18n } from '../../store/I18nContext';
import { Calendar, Clock, Plus, RefreshCw, Trash2 } from 'lucide-react';

const ShiftsPage: React.FC = () => {
  const { t } = useI18n();
  const [shifts, setShifts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', date: '', startTime: '', endTime: '', note: '' });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        api.shifts.getByDate(selectedDate),
        api.users.getAll(),
      ]);
      setShifts(s);
      setUsers(u.filter((u: any) => u.role === 'PERSONNEL' && u.isActive));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  const handleCreate = async () => {
    if (!form.userId || !form.date || !form.startTime || !form.endTime) return;
    try {
      await api.shifts.create(form);
      setShowForm(false);
      setForm({ userId: '', date: '', startTime: '', endTime: '', note: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm'))) return;
    try {
      await api.shifts.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={24} />{t('shift.title', 'Vardiya Yönetimi')}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 'auto' }} />
          <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={16} /></button>
          <button className="btn btn-primary" onClick={() => {
            setForm({ ...form, date: selectedDate });
            setShowForm(true);
          }}><Plus size={16} />{t('shift.newShift', 'Yeni Vardiya')}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        {shifts.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
            {selectedDate} tarihinde vardiya bulunmuyor
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('shift.personnel', 'Personel')}</th>
                <th>{t('shift.startTime', 'Başlangıç')}</th>
                <th>{t('shift.endTime', 'Bitiş')}</th>
                <th>{t('shift.note', 'Not')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.user?.firstName} {s.user?.lastName}</strong></td>
                  <td><Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{s.startTime}</td>
                  <td><Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{s.endTime}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.note || '-'}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('shift.newShift', 'Yeni Vardiya')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('shift.personnel', 'Personel')}</label>
                <select className="form-select" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Seçiniz</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('shift.date', 'Tarih')}</label>
                <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">{t('shift.startTime', 'Başlangıç')}</label>
                  <input className="form-input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('shift.endTime', 'Bitiş')}</label>
                  <input className="form-input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('shift.note', 'Not')}</label>
                <input className="form-input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleCreate}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftsPage;
