import { useState, useEffect, useRef, useCallback } from 'react';
import { voice } from '../voice';
import { sfx } from '../sfx';

export interface Student {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  group: number; 
}

export interface Question {
  answer: string;
  hint: string;
}

export function useGame() {
  const [status, setStatus] = useState<'idle' | 'running' | 'break'>('idle');
  const [channelName, setChannelName] = useState<string>('');
  const [view, setView] = useState<'playing' | 'break'>('playing');
  const [stageCount, setStageCount] = useState<number>(1);
  const [questionIndex, setQuestionIndex] = useState<number>(1);

  // Dữ liệu Game đố chữ
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    answer: 'TIẾNG VIỆT',
    hint: 'Ngôn ngữ chính thức của đất nước Việt Nam',
  });
  const [revealedLetters, setRevealedLetters] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(20);
  const [winner, setWinner] = useState<string | null>(null);

  // Dữ liệu Tương tác thực (Mới thêm)
  const [likesTarget, setLikesTarget] = useState(0); 
  const [seatedStudents, setSeatedStudents] = useState<any[]>([]); 
  const [topStudents, setTopStudents] = useState<Student[]>([]); 

  const askedQuestionsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const normalize = (str: string) => str.trim().toUpperCase().replace(/\s+/g, ' ');

  const revealOneLetter = useCallback(() => {
    const rawAnswer = currentQuestion.answer.toUpperCase();
    const chars = rawAnswer.split('').filter((c) => c !== ' ' && !revealedLetters.includes(c));
    if (chars.length > 0) {
      const pick = chars[Math.floor(Math.random() * chars.length)];
      setRevealedLetters((prev) => [...prev, pick]);
    }
  }, [currentQuestion.answer, revealedLetters]);

  const nextQuestion = useCallback(async () => {
    if (questionIndex >= 15) {
      setStatus('break');
      setView('break');
      sfx.playBell();
      voice.speak('Hết tiết học rồi! Cả lớp nghỉ giải lao 30 giây nhé!');
      setTimeout(() => {
        setStageCount((prev) => prev + 1);
        setQuestionIndex(1);
        setStatus('running');
        setView('playing');
        sfx.playBell();
        voice.speak('Hết giờ ra chơi, chúng ta bắt đầu tiết học mới!');
        void fetchNewQuestion();
      }, 30000);
      return;
    }
    await fetchNewQuestion();
  }, [questionIndex]);

  const fetchNewQuestion = async () => {
    try {
      const res = await fetch('/api/questions/random');
      if (res.ok) {
        const q: Question = await res.json();
        if (askedQuestionsRef.current.has(q.answer)) {
          void fetchNewQuestion();
          return;
        }
        askedQuestionsRef.current.add(q.answer);
        setCurrentQuestion(q);
      }
    } catch {
      setCurrentQuestion({ answer: 'QUANG HỢP', hint: 'Quá trình cây xanh tổng hợp dinh dưỡng từ ánh sáng mặt trời' });
    }
    setRevealedLetters([]);
    setWinner(null);
    setCountdown(20);
    setQuestionIndex((prev) => prev + 1);
    voice.speak(`Câu hỏi số ${questionIndex}: ${currentQuestion.hint}`);
  };

  useEffect(() => {
    if (status !== 'running' || view === 'break') return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          sfx.playWrong();
          voice.speak(`Đã hết thời gian! Đáp án đúng là: ${currentQuestion.answer}`);
          setTimeout(() => void nextQuestion(), 3500);
          return 0;
        }
        if (prev === 10) revealOneLetter();
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, view, currentQuestion, revealOneLetter, nextQuestion]);

  const handleComment = useCallback((user: string, comment: string) => {
    if (status !== 'running' || countdown <= 0 || winner) return;
    const normComment = normalize(comment);
    const normAnswer = normalize(currentQuestion.answer);

    if (normComment === normAnswer) {
      setWinner(user);
      sfx.playCorrect();
      if (timerRef.current) clearInterval(timerRef.current);

      setTopStudents((prev) => {
        const found = prev.find((s) => s.name === user);
        if (found) {
          return prev.map((s) => (s.name === user ? { ...s, score: s.score + 10 } : s)).sort((a,b) => b.score - a.score);
        }
        return [...prev, { id: `${Date.now()}`, name: user, score: 10, group: 1 }].sort((a,b) => b.score - a.score);
      });

      voice.speak(`Chúc mừng bạn ${user} đã xuất sắc đoán đúng đáp án: ${currentQuestion.answer}!`);
      setTimeout(() => void nextQuestion(), 4000);
    }
  }, [status, countdown, winner, currentQuestion, nextQuestion]);

  useEffect(() => {
    const es = new EventSource('/api/tiktok/events');

    es.addEventListener('chat', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleComment(data.nickname || data.uniqueId, data.comment);
      } catch {}
    });

    es.addEventListener('like', (e) => {
      try {
        const data = JSON.parse(e.data);
        setLikesTarget(prev => {
          const currentLikes = prev + data.addLikes;
          if (currentLikes >= 500) {
            revealOneLetter();
            sfx.playFanfare();
            voice.speak('Cảm ơn cả lớp đã thả tim! Cô mở thêm một chữ cái nhé.');
            return currentLikes - 500;
          }
          return currentLikes;
        });
      } catch {}
    });

    es.addEventListener('joinClass', (e) => {
      try {
        const data = JSON.parse(e.data);
        setSeatedStudents(prev => {
          if (prev.length >= 30) return prev; 
          if (prev.some(s => s.nickname === data.nickname)) return prev;
          voice.speak(`Chào mừng ${data.nickname} đã vào lớp!`);
          return [...prev, data];
        });
      } catch {}
    });

    es.addEventListener('gift', (e) => {
      try {
        const data = JSON.parse(e.data);
        const points = data.diamondCount * data.repeatCount * 10;
        if (points > 0) {
          setTopStudents(prev => {
            const existing = prev.find(s => s.name === data.nickname);
            if (existing) {
              return prev.map(s => s.name === data.nickname ? { ...s, score: s.score + points } : s).sort((a,b) => b.score - a.score);
            }
            return [...prev, { id: data.nickname, name: data.nickname, score: points, group: 1 }].sort((a,b) => b.score - a.score);
          });
        }
      } catch {}
    });

    es.addEventListener('status', (e) => {
      try {
        const data = JSON.parse(e.data);
        setChannelName(data.channelName || '');
        setStatus(data.connected ? 'running' : 'idle');
      } catch {}
    });

    return () => es.close();
  }, [handleComment, revealOneLetter]);

  return {
    status, channelName, view, stageCount, questionIndex,
    currentQuestion, revealedLetters, countdown, winner,
    likesTarget, seatedStudents, topStudents, // Xuất biến cho UI sử dụng
    nextQuestion, revealOneLetter,
  };
}