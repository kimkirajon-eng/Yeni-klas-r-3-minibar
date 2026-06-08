import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { FileText, Download, Filter, FileSpreadsheet } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [blockId, setBlockId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [floors, setFloors] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { api.blocks.getAll().then(setBlocks); }, []);
  useEffect(() => { if (blockId) api.floors.getByBlock(blockId).then(setFloors); else setFloors([]); }, [blockId]);

  const download = (ext: string) => {
    const block = showFilters ? blockId : undefined;
    const floor = showFilters ? floorId : undefined;
    window.open(ext === 'excel' ? api.reports.excelUrl(block, floor) : api.reports.pdfUrl(block, floor), '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Raporlar</h1>
        <button className="btn btn-outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} />{showFilters ? 'Filtreleri Gizle' : 'Filtrele'}
        </button>
      </div>

      {showFilters && (
        <div className="filter-bar" style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16 }}>
          <select className="form-select" value={blockId} onChange={(e) => { setBlockId(e.target.value); setFloorId(''); }}>
            <option value="">Tüm Bloklar</option>
            {blocks.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {blockId && (
            <select className="form-select" value={floorId} onChange={(e) => setFloorId(e.target.value)}>
              <option value="">Tüm Katlar</option>
              {floors.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#e8f5e9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <FileSpreadsheet size={28} color="#0f9d58" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>Excel Raporu</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
            Tüm günlük minibar hareketlerini, ürün bazlı tüketim detaylarını ve oda durumlarını içeren detaylı Excel raporu.
            {blockId && <><br/><strong>(Seçili filtreye göre)</strong></>}
          </p>
          <button className="btn btn-success btn-lg" onClick={() => download('excel')}>
            <Download size={18} />Excel İndir (.xlsx)
          </button>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#ffebee', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <FileText size={28} color="#d93025" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>PDF Raporu</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
            Kurumsal tasarıma sahip, yazdırılmaya hazır, özet istatistikler ve detaylı tüketim bilgilerini içeren PDF raporu.
            {blockId && <><br/><strong>(Seçili filtreye göre)</strong></>}
          </p>
          <button className="btn btn-danger btn-lg" onClick={() => download('pdf')}>
            <Download size={18} />PDF İndir (.pdf)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
