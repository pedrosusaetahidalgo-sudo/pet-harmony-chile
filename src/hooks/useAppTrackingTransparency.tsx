import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/lib/logger';

type ATTStatus = 'authorized' | 'denied' | 'not-determined' | 'restricted' | 'unavailable';

/**
 * Hook to request App Tracking Transparency (ATT) permission on iOS.
 * Required by Apple when using IDFA for tracking (Meta Pixel, Facebook SDK, etc.)
 * On Android/web this is a no-op that returns 'authorized'.
 */
export const useAppTrackingTransparency = () => {
  const [status, setStatus] = useState<ATTStatus>('not-determined');

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
      setStatus('authorized');
      return;
    }

    requestATT();
  }, []);

  const requestATT = async () => {
    try {
      const module = await import('capacitor-plugin-app-tracking-transparency');
      const { AppTrackingTransparency } = module;

      // Check current status first
      const { status: currentStatus } = await AppTrackingTransparency.getStatus();

      if (currentStatus === 'notDetermined') {
        // Request permission — shows the system dialog
        const { status: newStatus } = await AppTrackingTransparency.requestPermission();
        setStatus(mapStatus(newStatus));
        logger.debug('[ATT] Permission result:', newStatus);
      } else {
        setStatus(mapStatus(currentStatus));
        logger.debug('[ATT] Already determined:', currentStatus);
      }
    } catch (error) {
      logger.debug('[ATT] Plugin not available:', error);
      setStatus('unavailable');
    }
  };

  return { attStatus: status, isTrackingAuthorized: status === 'authorized' };
};

function mapStatus(status: string): ATTStatus {
  switch (status) {
    case 'authorized':
      return 'authorized';
    case 'denied':
      return 'denied';
    case 'notDetermined':
      return 'not-determined';
    case 'restricted':
      return 'restricted';
    default:
      return 'unavailable';
  }
}
