import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useI18n } from '../../store/I18nContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { Building2, Map as MapIcon, RefreshCw, Thermometer } from 'lucide-react';

const minibarColors: Record<string, string> = {
  COMPLETED: '#e8f5e9',
  DND: '#ffebee',
  LATER: '#fff8e1',
  PENDING: '#f5f5f5',
};

const minibarBorderColors: Record<string, string> = {
  COMPLETED: '#0f9d58',
  DND: '#d93025',
  LATER: '#f57f17',
  PENDING: '#9e9e9e',
};

function getHeatColor(value: number, max: number): string {
  if (max === 0) return '#f5f5f5';
  const ratio = value / max;
  const r = Math.min(255, Math.round(255 * ratio));
  const g = Math.min(255, Math.round(255 * (1 - ratio)));
  return `rgb(${r}, ${g}, 100)`;
}

const FloorPlanPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { on } = useSocket();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState<'status' | 'consumption'>('status');
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const statusTextColors: Record<string, string> = {
    VACANT: '#9e9e9e',
    INHOUSE: '#2e7d32',
    ARRIVAL: '#1565c0',
    DEPARTURE: '#e65100',
    DEPARTURE_ARRIVAL: '#c62828',
  };

  const fetchRooms = useCallback(() => {
    if (!selectedFloor) { setRooms([]); setLoading(false); return; }
    setLoading(true);
    api.rooms.getAll({ floorId: selectedFloor }).then((r) => {
      setRooms(r);
      setLoading(false);
    });
  }, [selectedFloor]);

  const fetchHeatmap = useCallback(() => {
    if (!selectedFloor || heatmapMode !== 'consumption') return;
    api.reports.roomHeatmap(selectedBlock || undefined, selectedFloor || undefined).then(setHeatmapData);
  }, [selectedBlock, selectedFloor, heatmapMode]);

  useEffect(() => {
    api.blocks.getAll().then((b) => {
      setBlocks(b);
      if (b.length > 0) setSelectedBlock(b[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedBlock) return;
    api.floors.getByBlock(selectedBlock).then((f) => {
      setFloors(f);
      if (f.length > 0) setSelectedFloor(f[0].id);
      else setSelectedFloor('');
    });
  }, [selectedBlock]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);
  useEffect(() => { fetchHeatmap(); }, [fetchHeatmap]);

  useEffect(() => {
    const u1 = on('room:status-changed', () => { fetchRooms(); fetchHeatmap(); });
    const u2 = on('room:consumption-recorded', () => { fetchRooms(); fetchHeatmap(); });
    return () => { u1(); u2(); };
  }, [on, fetchRooms, fetchHeatmap]);

  const getMinibarLabel = (status: string) => {
    const labels: Record<string, string> = {
      DND: 'DND', LATER: 'Sonra', COMPLETED: 'Tamam', PENDING: 'Bek.',
    };
    return labels[status] || status;
  };

  const getRoomStyle = (room: any) => {
    if (heatmapMode === 'status') {
      return {
        background: minibarColors[room.minibarStatus] || '#f5f5f5',
        borderColor: minibarBorderColors[room.minibarStatus] || '#ddd',
      };
    }
    const hm = heatmapData?.heatmap?.find((h: any) => h.roomId === room.id);
    const consumption = hm?.totalConsumption || 0;
    const maxVal = heatmapData?.maxConsumption || 1;
    return {
      background: getHeatColor(consumption, maxVal),
      borderColor: consumption > 0 ? '#e65100' : '#ddd',
    };
  };

  const getRoomTitle = (room: any) => {
    if (heatmapMode === 'consumption') {
      const hm = heatmapData?.heatmap?.find((h: any) => h.roomId === room.id);
      return `${room.name} - Tüketim: ${hm?.totalConsumption || 0} adet, ${hm?.totalRevenue?.toFixed(2) || '0'} TL`;
    }
    return `${room.name} - ${room.occupancyStatus} - ${room.minibarStatus}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapIcon size={24} />{t('floorPlan.title', 'Kat Planı')}
        </h1>
      </div>

      <div className="filter-bar">
        <select className="form-select" value={selectedBlock} onChange={(e) => setSelectedBlock(e.target.value)}>
          {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="form-select" value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value)}>
          {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {rooms.length} oda
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${heatmapMode === 'status' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setHeatmapMode('status')}
          >
            <MapIcon size={14} /> Durum
          </button>
          <button
            className={`btn btn-sm ${heatmapMode === 'consumption' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setHeatmapMode('consumption'); }}
          >
            <Thermometer size={14} /> Isı Haritası
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : rooms.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {t('common.noData')}
        </div>
      ) : (
        <div className="card" style={{ padding: 20 }}>
          <div className="floor-plan">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="floor-plan-room"
                style={getRoomStyle(room)}
                onClick={() => navigate(`/admin/rooms?roomId=${room.id}`)}
                title={getRoomTitle(room)}
              >
                <span className="fp-name" style={{ fontWeight: 700 }}>{room.name}</span>
                <span className="fp-status" style={{ color: statusTextColors[room.occupancyStatus] || '#666', fontSize: '0.65rem' }}>
                  {heatmapMode === 'consumption'
                    ? `${heatmapData?.heatmap?.find((h: any) => h.roomId === room.id)?.totalConsumption || 0} adet`
                    : getMinibarLabel(room.minibarStatus)}
                </span>
                {room.note && <span style={{ fontSize: '0.6rem', color: '#f57f17', display: 'block' }}>📝</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {heatmapMode === 'status' ? (
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', fontSize: '0.75rem' }}>
          <span><span className="status-dot completed" /> Tamamlandı</span>
          <span><span className="status-dot dnd" /> DND</span>
          <span><span className="status-dot later" /> Sonra</span>
          <span><span className="status-dot pending" /> Beklemede</span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', fontSize: '0.75rem', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 16, borderRadius: 2, background: 'rgb(0, 255, 100)' }} /> Az Tüketim
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 16, borderRadius: 2, background: 'rgb(255, 128, 100)' }} /> Orta
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 16, borderRadius: 2, background: 'rgb(255, 0, 100)' }} /> Çok Tüketim
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            (Bugünkü tüketim adedine göre renklendirilmiştir)
          </span>
        </div>
      )}
    </div>
  );
};

export default FloorPlanPage;
