import { useEffect, useState } from 'react';

export function GameStage({ game }: { game: any }) {
  const {
    currentQuestion, revealedLetters, countdown, winner, view,
    likesTarget, seatedStudents, topStudents
  } = game;

  // Lấy trang phục lưu ở local (nếu bạn đã làm tính năng đổi trang phục)
  const currentOutfit = localStorage.getItem('teacher-outfit') || 'co-giao-ao-dai-trang';

  // Hiển thị màn hình nghỉ giải lao
  if (view === 'break') {
    return (
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-50">
        <h1 className="text-6xl font-black text-yellow-400 animate-pulse">GIỜ RA CHƠI</h1>
        <p className="mt-4 text-2xl">Mọi người nghỉ ngơi uống nước nhé!</p>
        <div className="mt-8 grid grid-cols-2 gap-8 text-center">
          <div className="bg-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-pink-400 mb-4">🏆 ĐẠI GIA ĐÓNG GÓP</h2>
            {topStudents.slice(0, 5).map((s: any, idx: number) => (
              <div key={idx} className="text-lg">{idx + 1}. {s.name} - {s.score}đ</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Chia từ thành các khối vuông (Bảng ô chữ)
  const answerChars = currentQuestion.answer.split('');
  const renderWordBox = () => {
    return answerChars.map((char: string, i: number) => {
      if (char === ' ') return <div key={i} className="w-4 h-12" />;
      const isRevealed = revealedLetters.includes(char) || winner;
      return (
        <div key={i} className="flex h-12 w-10 sm:h-14 sm:w-12 items-center justify-center rounded bg-amber-100 font-bold text-slate-800 text-2xl shadow-inner border-b-4 border-amber-300 mx-1">
          {isRevealed ? char : ''}
        </div>
      );
    });
  };

  return (
    <div className="stage-bg absolute inset-0 overflow-hidden">
      {/* 1. BẢNG ĐEN CHÍNH */}
      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[85%] rounded-xl border-[10px] border-amber-900 bg-emerald-900 p-6 shadow-2xl">
        <div className="text-center text-xl font-medium text-emerald-100 mb-4 h-14">
          {currentQuestion.hint}
        </div>
        <div className="flex flex-wrap justify-center mt-2">
          {renderWordBox()}
        </div>
        
        {/* THANH ĐẾM TIM TRỢ GIÚP */}
        <div className="mt-8 w-full bg-slate-800/80 rounded-full h-5 border border-slate-500 overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-300"
            style={{ width: `${Math.min((likesTarget / 500) * 100, 100)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
            ❤️ Đủ 500 tim cô giáo mở thêm 1 chữ: {likesTarget}/500
          </div>
        </div>
        
        {/* ĐẾM NGƯỢC */}
        <div className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 font-black text-white text-xl shadow-lg border-2 border-white">
          {countdown}
        </div>
      </div>

      {/* 2. THÔNG BÁO NGƯỜI CHIẾN THẮNG */}
      {winner && (
        <div className="absolute top-64 w-full flex justify-center z-40 animate-bounce">
          <div className="bg-yellow-400 text-red-700 px-6 py-2 rounded-full font-bold text-2xl border-4 border-white shadow-xl">
            🎉 Chúc mừng {winner} đã trả lời đúng!
          </div>
        </div>
      )}

      {/* 3. BẢNG VÀNG TOP ĐẠI GIA ĐÓNG GÓP (Góc Phải) */}
      <div className="absolute right-4 top-56 w-52 bg-amber-100/95 rounded-xl border-4 border-amber-700 p-3 shadow-lg z-30">
        <h3 className="text-center font-black text-amber-900 border-b-2 border-amber-400 pb-1 mb-2 text-sm tracking-wide">🏆 BẢNG VÀNG</h3>
        {topStudents.length === 0 ? (
          <div className="text-xs text-center text-amber-700 italic py-2">Chưa có ai đóng góp</div>
        ) : (
          topStudents.slice(0, 5).map((s: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-sm font-semibold mb-1 border-b border-amber-200/50 pb-1">
              <span className="truncate w-[100px] text-slate-800">{idx + 1}. {s.name}</span>
              <span className="text-red-600">{s.score}đ</span>
            </div>
          ))
        )}
      </div>

      {/* 4. CÔ GIÁO ĐỨNG GIẢNG (Góc Trái) */}
      <div className="absolute bottom-40 left-10 z-20">
        <img 
          src={`/assets/nhan-vat/${currentOutfit}/02-noi.png`} 
          alt="Cô giáo" 
          className="w-48 drop-shadow-2xl"
        />
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-pink-500 px-4 py-1 text-sm font-bold text-white border-2 border-white shadow-md w-max">
          🌸 Cô Ngân
        </div>
      </div>

      {/* 5. KHU VỰC BÀN GHẾ & HỌC SINH TƯƠNG TÁC THỰC */}
      <div className="absolute bottom-5 left-0 right-0 h-[380px] z-10 px-8 flex flex-col justify-end gap-6">
        {/* Render 3 dãy bàn ngang */}
        {[0, 1, 2].map((rowIndex) => (
          <div key={rowIndex} className="relative w-full h-16 bg-amber-800/90 rounded-t-lg border-t-8 border-amber-900 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-end justify-center px-4 gap-6">
            
            {/* Lọc 10 học sinh cho mỗi dãy bàn */}
            {seatedStudents.slice(rowIndex * 10, (rowIndex + 1) * 10).map((student: any, idx: number) => (
              <div key={idx} className="relative flex flex-col items-center animate-bounce-short -mb-4 w-12 sm:w-16">
                <img 
                  src={student.avatar || '/assets/default-avatar.png'} 
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-[3px] border-white shadow-lg bg-white object-cover" 
                  alt="Học sinh"
                />
                <span className="bg-black/70 text-white text-[9px] sm:text-[11px] px-1.5 py-0.5 rounded mt-1 truncate w-full text-center shadow">
                  {student.nickname}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}