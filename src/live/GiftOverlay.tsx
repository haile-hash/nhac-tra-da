import { useEffect, useState } from 'react';
import { sfx } from '../sfx';

export interface GiftAlert {
  id: string;
  nickname: string;
  giftName: string;
  diamondCount: number;
  repeatCount: number;
}

export function GiftOverlay({ alert }: { alert: GiftAlert | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!alert) return;
    setVisible(true);
    sfx.playFanfare();

    const timer = setTimeout(() => {
      setVisible(false);
    }, 4500);

    return () => clearTimeout(timer);
  }, [alert]);

  if (!visible || !alert) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Pháo hoa nổ xung quanh */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" />

      {/* Tia sáng hào quang */}
      <div className="absolute h-96 w-96 animate-spin rounded-full bg-gradient-to-r from-amber-400/30 via-yellow-200/20 to-transparent blur-2xl" />

      {/* Banner thông báo */}
      <div className="relative z-10 flex scale-100 flex-col items-center rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-amber-500 via-orange-600 to-red-600 px-10 py-6 text-center text-white shadow-[0_0_50px_rgba(245,158,11,0.8)] animate-bounce">
        <div className="text-3xl">🎉 🎁 🎉</div>
        <div className="mt-2 text-xl font-bold tracking-wide text-yellow-200">
          TRI ÂN ĐẠI GIA LỚP HỌC!
        </div>
        <div className="mt-1 text-2xl font-black text-white drop-shadow-md">
          {alert.nickname}
        </div>
        <div className="mt-2 rounded-full bg-white/20 px-5 py-1 text-base font-semibold text-amber-100 backdrop-blur-md">
          Tặng {alert.repeatCount}x {alert.giftName} ({alert.diamondCount * alert.repeatCount} 💎)
        </div>
      </div>
    </div>
  );
}