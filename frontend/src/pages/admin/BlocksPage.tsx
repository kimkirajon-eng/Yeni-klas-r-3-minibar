import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Building2 } from 'lucide-react';

const BlocksPage: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [blockModal, setBlockModal] = useState(false);
  const [floorModal, setFloorModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [editingFloor, setEditingFloor] = useState<any>(null);
  const [blockName, setBlockName] = useState('');
  const [floorName, setFloorName] = useState('');
  const [floorBlockId, setFloorBlockId] = useState('');
  const [expandedFloors, setExpandedFloors] = useState<Record<string, any[]>>({});

  const fetchBlocks = async () => {
    try {
      const data = await api.blocks.getAll();
      setBlocks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlocks(); }, []);

  const toggleBlock = async (blockId: string) => {
    if (expandedBlock === blockId) {
      setExpandedBlock(null);
      return;
    }
    setExpandedBlock(blockId);
    if (!expandedFloors[blockId]) {
      try {
        const floors = await api.floors.getByBlock(blockId);
        setExpandedFloors((prev) => ({ ...prev, [blockId]: floors }));
      } catch {}
    }
  };

  const saveBlock = async () => {
    try {
      if (editingBlock) {
        await api.blocks.update(editingBlock.id, { name: blockName });
      } else {
        await api.blocks.create({ name: blockName });
      }
      setBlockModal(false);
      setEditingBlock(null);
      setBlockName('');
      fetchBlocks();
    } catch (err: any) { alert(err.message); }
  };

  const deleteBlock = async (id: string) => {
    if (!window.confirm('Bu bloğu silmek istediğinize emin misiniz?')) return;
    try {
      await api.blocks.delete(id);
      fetchBlocks();
    } catch (err: any) { alert(err.message); }
  };

  const saveFloor = async () => {
    try {
      if (editingFloor) {
        await api.floors.update(editingFloor.id, { name: floorName });
      } else {
        await api.floors.create({ name: floorName, blockId: floorBlockId });
      }
      setFloorModal(false);
      setEditingFloor(null);
      setFloorName('');
      if (floorBlockId) {
        const floors = await api.floors.getByBlock(floorBlockId);
        setExpandedFloors((prev) => ({ ...prev, [floorBlockId]: floors }));
      }
      fetchBlocks();
    } catch (err: any) { alert(err.message); }
  };

  const deleteFloor = async (id: string, blockId: string) => {
    if (!window.confirm('Bu katı silmek istediğinize emin misiniz?')) return;
    try {
      await api.floors.delete(id);
      const floors = await api.floors.getByBlock(blockId);
      setExpandedFloors((prev) => ({ ...prev, [blockId]: floors }));
      fetchBlocks();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Blok & Kat Yönetimi</h1>
        <button className="btn btn-primary" onClick={() => { setEditingBlock(null); setBlockName(''); setBlockModal(true); }}>
          <Plus size={16} />Yeni Blok
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        {blocks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Henüz blok eklenmemiş</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Blok Adı</th>
                <th>Kat Sayısı</th>
                <th>Oda Sayısı</th>
                <th style={{ width: 120 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <React.Fragment key={block.id}>
                  <tr>
                    <td>
                      <button className="btn btn-icon btn-ghost" onClick={() => toggleBlock(block.id)}>
                        {expandedBlock === block.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td><strong><Building2 size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />{block.name}</strong></td>
                    <td>{block.floors?.length || 0}</td>
                    <td>{block._count?.rooms || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-icon btn-ghost" onClick={() => { setEditingFloor(null); setFloorName(''); setFloorBlockId(block.id); setFloorModal(true); }} title="Kat Ekle"><Plus size={16} /></button>
                        <button className="btn btn-icon btn-ghost" onClick={() => { setEditingBlock(block); setBlockName(block.name); setBlockModal(true); }} title="Düzenle"><Edit2 size={16} /></button>
                        <button className="btn btn-icon btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteBlock(block.id)} title="Sil"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                  {expandedBlock === block.id && expandedFloors[block.id]?.map((floor: any) => (
                    <tr key={floor.id} style={{ background: 'var(--bg)' }}>
                      <td></td>
                      <td style={{ paddingLeft: 48 }}>└ {floor.name}</td>
                      <td colSpan={2}>{floor.rooms?.length || 0} oda</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-icon btn-ghost" onClick={() => { setEditingFloor(floor); setFloorName(floor.name); setFloorBlockId(floor.blockId); setFloorModal(true); }}><Edit2 size={16} /></button>
                          <button className="btn btn-icon btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteFloor(floor.id, block.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {blockModal && (
        <div className="modal-overlay" onClick={() => setBlockModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBlock ? 'Blok Düzenle' : 'Yeni Blok'}</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setBlockModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Blok Adı</label>
                <input className="form-input" value={blockName} onChange={(e) => setBlockName(e.target.value)} placeholder="Örn: A Blok" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setBlockModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={saveBlock}>{editingBlock ? 'Güncelle' : 'Oluştur'}</button>
            </div>
          </div>
        </div>
      )}

      {floorModal && (
        <div className="modal-overlay" onClick={() => setFloorModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFloor ? 'Kat Düzenle' : 'Yeni Kat'}</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setFloorModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Kat Adı</label>
                <input className="form-input" value={floorName} onChange={(e) => setFloorName(e.target.value)} placeholder="Örn: 1. Kat" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setFloorModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={saveFloor}>{editingFloor ? 'Güncelle' : 'Oluştur'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlocksPage;
