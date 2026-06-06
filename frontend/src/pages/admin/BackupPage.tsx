import React, { useState } from 'react';
import { useI18n } from '../../store/I18nContext';
import { Download, Database, FileCode, Shield } from 'lucide-react';

const BackupPage: React.FC = () => {
  const { t } = useI18n();
  const [exporting, setExporting] = useState<'json' | 'sqlite' | null>(null);

  const handleExport = async (type: 'json' | 'sqlite') => {
    setExporting(type);
    const token = localStorage.getItem('token');
    const url = `/api/backup/${type}?token=${token}`;
    window.open(url, '_blank');
    setTimeout(() => setExporting(null), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={24} />Yedekleme / Veritabanı Export
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#e8f0fe', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <FileCode size={28} color="#1a73e8" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>JSON Export</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
            Tüm veritabanını JSON formatında dışa aktarır. Blok, kat, oda, ürün, kullanıcı, tüketim kayıtları ve vardiyaları içerir.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => handleExport('json')} disabled={exporting !== null}>
            <Download size={18} />{exporting === 'json' ? 'Aktarılıyor...' : 'JSON İndir'}
          </button>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#f3e8ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Database size={28} color="#7c3aed" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>SQLite Database Export</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
            Ham SQLite veritabanı dosyasını (.db) dışa aktarır. Tam veri taşıma veya manuel yedekleme için idealdir.
          </p>
          <button className="btn btn-success btn-lg" onClick={() => handleExport('sqlite')} disabled={exporting !== null}>
            <Download size={18} />{exporting === 'sqlite' ? 'Aktarılıyor...' : 'SQLite İndir'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 16, borderLeft: '4px solid var(--warning)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong>Not:</strong> Yedekleme işlemi sırasında veritabanı kilitlenebilir. Yoğun kullanım saatlerinde yedekleme yapmaktan kaçının.
        </p>
      </div>
    </div>
  );
};

export default BackupPage;
