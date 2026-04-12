import { QRCodeSVG } from 'qrcode.react';
import pawIcon from '@/assets/paw_friend_icon.svg';

interface PawCardQRProps {
  pawCardId: string;
  size?: number;
}

export function PawCardQR({ pawCardId, size = 140 }: PawCardQRProps) {
  const url = `https://pawfriend.cl/paw-card/${pawCardId}`;

  return (
    <div className="paw-qr-frame inline-flex flex-col items-center">
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        fgColor="#7C3AED"
        bgColor="transparent"
        imageSettings={{
          src: pawIcon,
          height: Math.round(size * 0.2),
          width: Math.round(size * 0.2),
          excavate: true,
        }}
      />
    </div>
  );
}
