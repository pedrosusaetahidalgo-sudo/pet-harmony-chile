import { Browser } from '@capacitor/browser';
import { isNative } from './platform';

export async function openExternalUrl(url: string) {
  if (isNative()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export async function openInAppUrl(url: string) {
  if (isNative()) {
    await Browser.open({ url, presentationStyle: 'popover' });
  } else {
    window.open(url, '_blank');
  }
}
