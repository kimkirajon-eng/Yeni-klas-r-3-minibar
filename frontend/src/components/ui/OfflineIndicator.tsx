import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    const sw = navigator.serviceWorker;
    if (sw) {
      sw.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_DONE') {
          setSyncing(false);
          setPendingCount(0);
        }
      });
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (online && pendingCount > 0) {
      setSyncing(true);
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
      }
    }
  }, [online, pendingCount]);

  useEffect(() => {
    const checkPending = () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'GET_PENDING' });
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 10000);
    return () => clearInterval(interval);
  }, []);

  if (online && pendingCount === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
      padding: '8px 16px', borderRadius: 'var(--radius)',
      background: online ? 'var(--warning)' : '#d93025',
      color: '#fff', display: 'flex', alignItems: 'center', gap: 8,
      fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      cursor: syncing ? 'wait' : 'pointer',
    }}>
      {online ? (
        <><RefreshCw size={16} className={syncing ? 'spinner' : ''} /> {syncing ? 'Senkronize ediliyor...' : `${pendingCount} bekleyen işlem`}</>
      ) : (
        <><WifiOff size={16} /> Çevrimdışı mod - İşlemler kuyruğa alındı</>
      )}
    </div>
  );
};

export default OfflineIndicator;