import { useEffect, useRef, useState } from 'react';
import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useGame } from './game/useGame';
import { GameStage } from './game/GameStage';
import { GameControls } from './game/GameControls';
import { GiftOverlay, GiftAlert } from './live/GiftOverlay';
import { sfx } from './sfx';

export default function App() {
  const game = useGame();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [giftAlert, setGiftAlert] = useState<GiftAlert | null>(null);

  useEffect(() => {
    if (!IS_STAGE) return;

    // Lắng nghe sự kiện SSE từ server để kích hoạt Gift & SFX
    const es = new EventSource('/api/tiktok/events');
    
    es.addEventListener('gift', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.diamondCount >= 1) {
          setGiftAlert({
            id: `${Date.now()}_${Math.random()}`,
            nickname: data.nickname || data.username,
            giftName: data.giftName,
            diamondCount: data.diamondCount,
            repeatCount: data.repeatCount || 1,
          });
        }
      } catch {}
    });

    return () => es.close();
  }, []);

  useEffect(() => {
    if (!IS_STAGE) return;

    const unlockAudio = () => {
      sfx.playBell();
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.volume = 0.25;
        audioRef.current.play().catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    return () => window.removeEventListener('click', unlockAudio);
  }, []);

  if (IS_STAGE) {
    return (
      <div 
        className="relative flex h-screen w-screen items-center justify-center bg-black cursor-pointer select-none"
        onClick={() => {
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
        }}
      >
        <audio 
          ref={audioRef} 
          src="/assets/nhac.mp3" 
          loop 
          preload="auto"
        />
        <StageFrame>
          <GameStage game={game} />
          <GiftOverlay alert={giftAlert} />
        </StageFrame>
      </div>
    );
  }

  return (
    <Dashboard
      status={game.status}
      channelName={game.channelName}
      preview={
        <StageFrame maxHeight={window.innerHeight - 40}>
          <GameStage game={game} />
        </StageFrame>
      }
      extra={<GameControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}