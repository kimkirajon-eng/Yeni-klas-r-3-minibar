import { useCallback, useEffect } from 'react';
import { useSocket } from './useSocket';

export const useNotification = () => {
  const { on } = useSocket();

  const showNotification = useCallback((title: string, body: string, icon = '/icons/icon-192.svg') => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') new Notification(title, { body, icon });
      });
    }
  }, []);

  useEffect(() => {
    const unsub1 = on('room:status-changed', (data: any) => {
      const statusMap: Record<string, string> = {
        DND: 'Rahatsız Etmeyin',
        LATER: 'Sonra',
        COMPLETED: 'Tamamlandı',
        PENDING: 'Beklemede',
      };
      showNotification(
        'Oda Durumu Değişti',
        `${data.room?.name}: ${statusMap[data.newStatus] || data.newStatus}`
      );
    });

    const unsub2 = on('room:consumption-recorded', (data: any) => {
      showNotification(
        'Tüketim Kaydedildi',
        `${data.room?.name} - ${data.items?.length || 0} ürün`
      );
    });

    return () => { unsub1(); unsub2(); };
  }, [on, showNotification]);
};
