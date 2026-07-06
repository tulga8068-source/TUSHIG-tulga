'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Compass, 
  History, 
  CheckCircle2, 
  XCircle, 
  Gauge, 
  Clock, 
  Keyboard, 
  Volume2, 
  VolumeX,
  Languages,
  Zap,
  Award
} from 'lucide-react';

// Vehicle types
type VehicleType = 'car' | 'rocket' | 'horse';

interface GameHistoryItem {
  id: string;
  date: string;
  wpm: number;
  accuracy: number;
  time: number;
  vehicle: VehicleType;
  language: 'mn' | 'en';
  sentenceSnippet: string;
}

// Preset sentences
const SENTENCES = {
  mn: [
    "Эрдэм сурахыг багаас нь хичээвэл, эрдэнэ олохтой адил хэмээн өвгөд сургадаг байжээ.",
    "Монгол хүн бүр хурдан морины туурай, уудам талын салхи, уудам хөх тэнгэрийн уудамд төрдөг.",
    "Шивэх хурдаа нэмэгдүүлснээр та өөрийн цагийг хэмнэж, бүтээмжээ үлэмж хэмжээгээр дээшлүүлэх боломжтой болно.",
    "Амжилтын нууц бол өдөр бүр зогсолтгүй бага багаар урагшлах явдал бөгөөд шантрахгүй байх нь хамгийн чухал юм.",
    "Технологийн эрин зуунд компьютер дээр хурдан, зөв бичих нь хүн бүрийн эзэмших ёстой чухал чадваруудын нэг билээ.",
    "Зориг байвал арга олдоно, зүтгэл байвал амжилт ирнэ гэдэг шиг өөрийгөө өдөр бүр дасгалжуулж хөгжүүлээрэй.",
    "Эх орныхоо үзэсгэлэнт байгаль, уул усыг хайрлан хамгаалах нь иргэн бүрийн ариун журамт үүрэг мөн.",
    "Сайн санааны үзүүрт тос гэдэг шиг бусдад туслах сэтгэлтэй явахад амьдрал үргэлж сайхан бэлгээр дүүрэн байдаг.",
    "Эрдэм мэдлэг бол хамгийн найдвартай баялаг бөгөөд түүнийг хэн ч танаас булаан авч чадахгүй юм.",
    "Аяганы хариу өдөртөө, агтны хариу жилдээ гэж Монгол ардын зүйр цэцэн үгэнд сургамжлан өгүүлдэг."
  ],
  en: [
    "The quick brown fox jumps over the lazy dog in a spectacular display of agility and speed.",
    "Continuous practice and absolute dedication are the ultimate keys to unlocking master-level typing skills.",
    "Programming is not just about writing code; it is about solving complex problems and building creative solutions.",
    "The starry night sky stretched infinitely above the silent mountain range, whispering secrets of the cosmos.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts in the long run.",
    "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    "Innovation distinguishes between a leader and a follower, bringing transformation to the world we live in.",
    "Believe you can and you are halfway there, as your mindset determines the heights of your future success."
  ]
};

const VEHICLE_DATA = {
  car: {
    emoji: '🏎️',
    name: 'Спорт Машин',
    enName: 'Sports Car',
    color: 'from-red-500 to-orange-500',
    trackBg: 'bg-neutral-800 border-neutral-700',
    trackLine: 'border-dashed border-yellow-400',
    sound: 'vroom',
    bgTheme: 'bg-gradient-to-r from-red-500/10 via-orange-500/5 to-transparent'
  },
  rocket: {
    emoji: '🚀',
    name: 'Сансрын Хөлөг',
    enName: 'Space Rocket',
    color: 'from-cyan-500 to-blue-600',
    trackBg: 'bg-slate-950 border-slate-900',
    trackLine: 'border-dotted border-cyan-500/30',
    sound: 'swoosh',
    bgTheme: 'bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent'
  },
  horse: {
    emoji: '🐎',
    name: 'Хурдан Хүлэг',
    enName: 'Fast Horse',
    color: 'from-emerald-500 to-teal-600',
    trackBg: 'bg-amber-950/20 border-emerald-900/30',
    trackLine: 'border-dashed border-emerald-500/20',
    sound: 'gallop',
    bgTheme: 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent'
  }
};

export default function TypeRacerPage() {
  const [lang, setLang] = useState<'mn' | 'en'>('mn');
  
  const selectRandomSentence = (currentLang: 'mn' | 'en') => {
    const list = SENTENCES[currentLang];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  };

  const [sentence, setSentence] = useState<string>(() => {
    return selectRandomSentence('mn');
  });
  const [inputVal, setInputVal] = useState('');
  const [vehicle, setVehicle] = useState<VehicleType>('car');
  
  // Game states
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'playing' | 'completed' | 'failed'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [errors, setErrors] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // High scores / history
  const [history, setHistory] = useState<GameHistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('typeracer_history');
      if (savedHistory) {
        try {
          return JSON.parse(savedHistory);
        } catch (e) {
          console.error('Failed to parse history', e);
        }
      }
    }
    return [];
  });
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundContextRef = useRef<AudioContext | null>(null);

  const [, startTransition] = useTransition();

  // Update sentence when language changes
  const handleLangChange = (newLang: 'mn' | 'en') => {
    startTransition(() => {
      setLang(newLang);
      setSentence(selectRandomSentence(newLang));
      resetGame();
    });
  };

  // Sound generator
  const playBeep = (type: 'correct' | 'error' | 'countdown' | 'go' | 'finish') => {
    if (!soundEnabled) return;
    try {
      if (!soundContextRef.current) {
        soundContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = soundContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'correct') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'error') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'countdown') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'go') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'finish') {
        // Simple arpeggio
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start();
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Audio context error:', e);
    }
  };

  // Timer interval
  useEffect(() => {
    if (gameState === 'playing' && startTime !== null) {
      intervalRef.current = setInterval(() => {
        const secs = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        setElapsedTime(secs);
        if (secs >= 75) {
          setGameState('failed');
          playBeep('error');
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, startTime]);

  // Countdown handler
  const startCountdown = () => {
    setInputVal('');
    setElapsedTime(0);
    setErrors(0);
    setTotalKeystrokes(0);
    setCountdown(3);
    setGameState('countdown');
    playBeep('countdown');
    
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setGameState('playing');
          setStartTime(Date.now());
          playBeep('go');
          setTimeout(() => {
            inputRef.current?.focus();
          }, 50);
          return 0;
        }
        playBeep('countdown');
        return prev - 1;
      });
    }, 1000);
  };

  const resetGame = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setInputVal('');
    setElapsedTime(0);
    setErrors(0);
    setTotalKeystrokes(0);
    setGameState('idle');
    setStartTime(null);
    setShowConfetti(false);
  };

  // Process keystrokes & validate input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;
    
    const value = e.target.value;
    const oldLength = inputVal.length;
    const newLength = value.length;
    
    // Character added
    if (newLength > oldLength) {
      setTotalKeystrokes((prev) => prev + (newLength - oldLength));
      
      const newlyTypedChar = value[newLength - 1];
      const targetChar = sentence[newLength - 1];
      
      // Check if correct
      if (newlyTypedChar === targetChar) {
        playBeep('correct');
      } else {
        setErrors((prev) => prev + 1);
        playBeep('error');
      }
    }
    
    setInputVal(value);

    // Check game completion
    if (value === sentence) {
      handleGameCompleted(value);
    }
  };

  const handleGameCompleted = (finalVal: string) => {
    const end = Date.now();
    const start = startTime || Date.now();
    const durationSeconds = Math.max(1, (end - start) / 1000);
    
    setGameState('completed');
    playBeep('finish');
    setShowConfetti(true);
    
    // Calculate final metrics
    const finalWPM = Math.round((finalVal.length / 5) / (durationSeconds / 60));
    const finalAccuracy = Math.round((sentence.length / Math.max(sentence.length, sentence.length + errors)) * 100);
    
    // Add to history
    const newItem: GameHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleDateString('mn-MN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      wpm: finalWPM,
      accuracy: finalAccuracy,
      time: Math.round(durationSeconds),
      vehicle: vehicle,
      language: lang,
      sentenceSnippet: sentence.length > 30 ? sentence.substring(0, 30) + "..." : sentence
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('typeracer_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('typeracer_history');
  };

  // Calculate live statistics
  const currentWPM = elapsedTime > 0 
    ? Math.round((inputVal.length / 5) / (elapsedTime / 60)) 
    : 0;

  const currentAccuracy = totalKeystrokes > 0 
    ? Math.round(((totalKeystrokes - errors) / totalKeystrokes) * 100) 
    : 100;

  // Track progress fraction (0 to 1)
  // Standard Typeracer tracks progress of how much of the target sentence matches the input.
  let correctLength = 0;
  for (let i = 0; i < inputVal.length; i++) {
    if (inputVal[i] === sentence[i]) {
      correctLength++;
    } else {
      break;
    }
  }
  const progressFraction = sentence.length > 0 ? correctLength / sentence.length : 0;

  // Determine performance feedback
  const getFeedbackMessage = (wpmValue: number) => {
    if (lang === 'mn') {
      if (wpmValue >= 80) return { title: "🚀 Сансрын хурдтай шивэгч!", desc: "Та бол үнэхээр гайхалтай хурдан юм! Гар утас эсвэл компьютер таны хуруунд арай ядан гүйцэж байна.", color: "text-cyan-500" };
      if (wpmValue >= 55) return { title: "🏎️ Хурдны манлай!", desc: "Маш сайн! Таны бичих чадвар мэргэжлийн түвшинд хүрчээ. Зогсолтгүй дасгал хийгээрэй.", color: "text-amber-500" };
      if (wpmValue >= 35) return { title: "🐎 Шандас хүлэг!", desc: "Сайн байна! Хурдан бөгөөд итгэлтэй байна. Танд өсөх асар их боломж байна.", color: "text-emerald-500" };
      return { title: "🚶 Явган зорчигч!", desc: "Дажгүй шүү! Анхаарлаа төвлөрүүлж, өдөр бүр хэдэн минут давтвал таны хурд хурдан нэмэгдэнэ.", color: "text-neutral-500" };
    } else {
      if (wpmValue >= 80) return { title: "🚀 Galactic Typist!", desc: "Absolute legendary typing speed! You fly past like a rocket ship.", color: "text-cyan-500" };
      if (wpmValue >= 55) return { title: "🏎️ High Velocity!", desc: "Spectacular! Your fingers are dancing on the keys. Keep up the rhythm.", color: "text-amber-500" };
      if (wpmValue >= 35) return { title: "🐎 Swift Galloper!", desc: "Great job! Your typing is consistent and accurate. A solid performance.", color: "text-emerald-500" };
      return { title: "🚶 Steady Walker!", desc: "Good effort! Keep practicing, focus on accuracy first, and the speed will naturally follow.", color: "text-neutral-500" };
    }
  };

  const feedback = getFeedbackMessage(gameState === 'completed' && history[0] ? history[0].wpm : currentWPM);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-white flex flex-col justify-between">
      
      {/* 1. Sleek utility toolbar at the very top */}
      <div className="border-b border-slate-900 bg-slate-950/80 px-6 sm:px-12 py-3 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono tracking-wider text-[10px]">SERVER: UB-CENTRAL-01 | LIVE SYSTEM</span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Language toggle */}
          <div className="flex bg-slate-900 p-0.5 rounded border border-slate-800">
            <button 
              onClick={() => handleLangChange('mn')}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${lang === 'mn' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              id="lang-mn-btn"
            >
              MN
            </button>
            <button 
              onClick={() => handleLangChange('en')}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${lang === 'en' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              id="lang-en-btn"
            >
              EN
            </button>
          </div>

          {/* Sound toggle */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 font-mono text-[10px]"
            id="sound-toggle-btn"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5 text-rose-500" />}
            {soundEnabled ? 'SOUND ON' : 'SOUND OFF'}
          </button>
        </div>
      </div>

      {/* 2. Main Header Section matching "Geometric Balance" */}
      <header className="max-w-5xl w-full mx-auto px-6 sm:px-12 pt-12 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-emerald-500 italic">
            TYPERACER<span className="text-slate-500">.MN</span>
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Typing Performance System v2.0</p>
        </div>

        {/* Real-time high-contrast stats side by side */}
        <div className="flex gap-8 items-end" id="performance-counters">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{lang === 'mn' ? 'Үг/мин (WPM)' : 'Speed (WPM)'}</p>
            <p className="text-5xl font-mono font-bold leading-none text-emerald-400">
              {gameState === 'completed' && history[0] ? history[0].wpm : currentWPM}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{lang === 'mn' ? 'Алдаа' : 'Errors'}</p>
            <p className="text-5xl font-mono font-bold leading-none text-rose-500">
              {errors}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{lang === 'mn' ? 'Нарийвчлал' : 'Accuracy'}</p>
            <p className="text-5xl font-mono font-bold leading-none text-indigo-400">
              {gameState === 'completed' && history[0] ? history[0].accuracy : currentAccuracy}%
            </p>
          </div>
        </div>
      </header>

      {/* 3. Main interactive content area */}
      <main className="max-w-5xl w-full mx-auto px-6 sm:px-12 py-8 flex flex-col gap-8 flex-1">
        
        {/* Vehicle Selection Header & Racing Track */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="text-xs font-mono text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-emerald-500" />
              {lang === 'mn' ? 'Хүлэг сонгох:' : 'SELECT MACHINE:'}
            </div>
            
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800" id="vehicle-selector">
              {(Object.keys(VEHICLE_DATA) as VehicleType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setVehicle(v);
                    playBeep('correct');
                  }}
                  disabled={gameState === 'countdown' || gameState === 'playing'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    vehicle === v
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 disabled:opacity-50'
                  }`}
                  id={`vehicle-btn-${v}`}
                >
                  <span className="text-sm">{VEHICLE_DATA[v].emoji}</span>
                  <span className="hidden sm:inline">{lang === 'mn' ? VEHICLE_DATA[v].name : VEHICLE_DATA[v].enName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Geometric Racing Track Card */}
          <div className="relative h-32 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col justify-center px-12 overflow-hidden" id="racing-track-container">
            {/* Horizontal track axis */}
            <div className="absolute left-0 right-0 h-[2px] bg-slate-800"></div>
            
            {/* Emerald ambient progress background */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-300"
              style={{ width: `${progressFraction * 100}%` }}
            />

            <div className="relative flex items-center h-full w-full">
              {/* Silhouette opponent tracks for depth */}
              <div className="absolute left-[20%] -translate-x-1/2 opacity-10 flex flex-col items-center select-none pointer-events-none">
                <div className="text-3xl grayscale filter blur-[0.5px]">🏎️</div>
              </div>
              <div className="absolute left-[50%] -translate-x-1/2 opacity-15 flex flex-col items-center select-none pointer-events-none">
                <div className="text-3xl grayscale">🐎</div>
              </div>
              <div className="absolute left-[80%] -translate-x-1/2 opacity-10 flex flex-col items-center select-none pointer-events-none">
                <div className="text-3xl grayscale filter blur-[0.5px]">🚀</div>
              </div>

              {/* Dynamic Player Vehicle with shadow glow */}
              <motion.div
                className="absolute flex flex-col items-center"
                animate={{
                  left: `${progressFraction * 100}%`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 70,
                  damping: 15,
                  mass: 0.8
                }}
                style={{
                  transform: 'translateX(-50%)',
                }}
                id="racing-vehicle"
              >
                <div className="text-5xl filter drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300 select-none">
                  {VEHICLE_DATA[vehicle].emoji}
                </div>
                <div className="mt-1 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-bold rounded uppercase tracking-tighter">
                  {lang === 'mn' ? 'Та' : 'You'}
                </div>
              </motion.div>
            </div>

            <div className="absolute right-4 bottom-2 text-[10px] font-mono text-slate-600 tracking-wider uppercase">FINISH LINE</div>
          </div>
        </div>

        {/* 4. Target Sentence Display & Input Panel */}
        <div className="relative" id="play-container">
          
          {/* Countdown overlay */}
          <AnimatePresence>
            {gameState === 'countdown' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6 rounded-3xl border border-slate-800"
                id="countdown-overlay"
              >
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-8xl font-black text-emerald-500 font-mono"
                >
                  {countdown === 0 ? 'GO!' : countdown}
                </motion.div>
                <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mt-4">
                  {lang === 'mn' ? 'ХУРГАНААСАА ХҮЛЭГ СУУДЛААРАЙ!' : 'PREPARE YOUR FINGERS'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completed results overlay */}
          <AnimatePresence>
            {gameState === 'completed' && history[0] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 rounded-3xl border border-slate-800"
                id="completed-overlay"
              >
                <div className="flex flex-col items-center max-w-md text-center">
                  
                  <motion.div
                    initial={{ y: -20, scale: 0.8 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full border border-emerald-500/30 mb-4"
                  >
                    <Trophy className="h-10 w-10 animate-bounce" />
                  </motion.div>

                  <h3 className={`text-2xl font-black tracking-tight ${feedback.color}`}>
                    {feedback.title}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    {feedback.desc}
                  </p>

                  <div className="grid grid-cols-2 gap-3 w-full my-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{lang === 'mn' ? 'Шивэх Хурд' : 'Typing Speed'}</span>
                      <span className="text-xl font-extrabold font-mono text-emerald-400">{history[0].wpm} WPM</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{lang === 'mn' ? 'Нарийвчлал' : 'Accuracy'}</span>
                      <span className="text-xl font-extrabold font-mono text-white">{history[0].accuracy}%</span>
                    </div>
                    <div className="text-left border-t border-slate-800/40 pt-2 mt-2">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{lang === 'mn' ? 'Алдааны тоо' : 'Errors Count'}</span>
                      <span className="text-xl font-extrabold font-mono text-rose-500">{errors}</span>
                    </div>
                    <div className="text-left border-t border-slate-800/40 pt-2 mt-2">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{lang === 'mn' ? 'Нийт хугацаа' : 'Total Time'}</span>
                      <span className="text-xl font-extrabold font-mono text-indigo-400">{history[0].time}s</span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full justify-center">
                    <button
                      onClick={startCountdown}
                      className="px-6 py-3 bg-slate-100 text-slate-950 font-bold rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer text-xs"
                      id="replay-btn"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {lang === 'mn' ? 'ДАХИН ТОГЛОХ' : 'PLAY AGAIN'}
                    </button>
                    <button
                      onClick={() => {
                        setSentence(selectRandomSentence(lang));
                        resetGame();
                      }}
                      className="px-6 py-3 border border-slate-700 font-bold rounded-lg hover:bg-slate-800 text-slate-200 transition-colors uppercase tracking-tight active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs"
                      id="new-sentence-completed-btn"
                    >
                      <ChevronRight className="h-4 w-4" />
                      {lang === 'mn' ? 'ӨӨР ӨГҮҮЛБЭР' : 'NEXT TEXT'}
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Failed results overlay */}
          <AnimatePresence>
            {gameState === 'failed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 rounded-3xl border border-rose-500/30"
                id="failed-overlay"
              >
                <div className="flex flex-col items-center max-w-md text-center">
                  
                  <motion.div
                    initial={{ y: -20, scale: 0.8 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="bg-rose-500/10 text-rose-500 p-4 rounded-full border border-rose-500/30 mb-4"
                  >
                    <XCircle className="h-10 w-10 animate-pulse" />
                  </motion.div>

                  <h3 className="text-2xl font-black tracking-tight text-rose-500 uppercase">
                    {lang === 'mn' ? 'Тоглоом дууслаа!' : 'GAME OVER!'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    {lang === 'mn' ? 'Харамсалтай нь та 1 минут 15 секундын дотор амжиж бичиж дуусгасангүй.' : 'Unfortunately, you did not finish typing within the 1 minute 15 seconds limit.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 w-full my-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{lang === 'mn' ? 'Шивсэн хувь' : 'Completion'}</span>
                      <span className="text-xl font-extrabold font-mono text-rose-400">
                        {Math.round((inputVal.length / sentence.length) * 100)}%
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{lang === 'mn' ? 'Үлдсэн тэмдэгт' : 'Remaining Chars'}</span>
                      <span className="text-xl font-extrabold font-mono text-white">
                        {sentence.length - inputVal.length}
                      </span>
                    </div>
                    <div className="text-left border-t border-slate-800/40 pt-2 mt-2">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{lang === 'mn' ? 'Алдааны тоо' : 'Errors Count'}</span>
                      <span className="text-xl font-extrabold font-mono text-rose-500">{errors}</span>
                    </div>
                    <div className="text-left border-t border-slate-800/40 pt-2 mt-2">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{lang === 'mn' ? 'Бичих Хурд' : 'Speed'}</span>
                      <span className="text-xl font-extrabold font-mono text-amber-500">{currentWPM} WPM</span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full justify-center">
                    <button
                      onClick={startCountdown}
                      className="px-6 py-3 bg-rose-500 text-slate-950 hover:bg-rose-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer text-xs uppercase"
                      id="failed-replay-btn"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {lang === 'mn' ? 'ДАХИН ТОГЛОХ' : 'PLAY AGAIN'}
                    </button>
                    <button
                      onClick={() => {
                        setSentence(selectRandomSentence(lang));
                        resetGame();
                      }}
                      className="px-6 py-3 border border-slate-700 font-bold rounded-lg hover:bg-slate-800 text-slate-200 transition-colors uppercase tracking-tight active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs"
                      id="failed-new-sentence-btn"
                    >
                      <ChevronRight className="h-4 w-4" />
                      {lang === 'mn' ? 'ӨӨР ӨГҮҮЛБЭР' : 'NEXT TEXT'}
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Text Input Box area */}
          <div className="bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative" id="sentence-display-window">
            
            <div className="absolute top-4 left-5 flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest">
              {gameState === 'playing' ? (
                <span className={`px-2 py-0.5 rounded font-bold ${75 - elapsedTime <= 15 ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {lang === 'mn' ? 'ҮЛДСЭН ХУГАЦАА' : 'TIME REMAINING'}: {Math.floor((75 - elapsedTime) / 60)}:{(75 - elapsedTime) % 60 < 10 ? '0' : ''}{(75 - elapsedTime) % 60}
                </span>
              ) : (
                <span className="text-slate-600">
                  {lang === 'mn' ? 'ХУГАЦААНЫ ХЯЗГААР: 01:15' : 'TIME LIMIT: 01:15'}
                </span>
              )}
            </div>

            <div className="absolute top-4 right-5 flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-600 tracking-widest">
              <Keyboard className="h-3.5 w-3.5" />
              {lang === 'mn' ? 'ТАЛБАРТ ШИВНЭ ҮҮ' : 'INPUT TARGET'}
            </div>

            {/* Target text highlighting letter by letter */}
            <div className="text-2xl sm:text-3xl leading-relaxed font-medium mb-12 flex flex-wrap gap-x-2 text-slate-400 break-words font-sans mt-3" id="target-sentence">
              {sentence.split(' ').map((word, wordIdx, wordArr) => {
                let prevCharsCount = wordArr.slice(0, wordIdx).join(' ').length + (wordIdx > 0 ? 1 : 0);

                return (
                  <span key={wordIdx} className="inline-block">
                    {word.split('').map((char, charIdx) => {
                      const globalIdx = prevCharsCount + charIdx;
                      let colorClass = 'text-slate-400';
                      let isCurrent = globalIdx === inputVal.length;
                      let bgClass = '';

                      if (globalIdx < inputVal.length) {
                        const typedChar = inputVal[globalIdx];
                        if (typedChar === char) {
                          colorClass = 'text-emerald-500 font-semibold';
                        } else {
                          colorClass = 'text-rose-500 border-b-2 border-rose-500';
                        }
                      }

                      return (
                        <span 
                          key={charIdx} 
                          className={`${colorClass} ${bgClass} relative rounded-[1px] transition-all`}
                          id={`char-${globalIdx}`}
                        >
                          {isCurrent && gameState === 'playing' && (
                            <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-emerald-400 animate-pulse" />
                          )}
                          {char}
                        </span>
                      );
                    })}
                    {/* Word space character */}
                    {wordIdx < wordArr.length - 1 && (
                      <span 
                        className={`${
                          prevCharsCount + word.length < inputVal.length 
                            ? (inputVal[prevCharsCount + word.length] === ' ' ? 'text-emerald-500' : 'text-rose-500 underline decoration-rose-500') 
                            : 'text-slate-400'
                        } relative`}
                      >
                        {prevCharsCount + word.length === inputVal.length && gameState === 'playing' && (
                          <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-emerald-400 animate-pulse" />
                        )}
                        &nbsp;
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Main responsive input field */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                disabled={gameState === 'countdown' || gameState === 'completed' || gameState === 'failed'}
                placeholder={
                  gameState === 'idle'
                    ? (lang === 'mn' ? "Уралдааныг эхлүүлээд энд бичиж эхэлнэ үү..." : "Start the race to begin typing here...")
                    : (lang === 'mn' ? "Алдаагүй хурдан шивнэ үү..." : "Type the sentence exactly as shown...")
                }
                className={`w-full bg-slate-950 border-2 rounded-xl px-6 py-5 text-2xl font-mono text-emerald-400 outline-none transition-all placeholder:text-slate-700 ${
                  gameState === 'playing'
                    ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] focus:border-emerald-400'
                    : 'border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                id="typing-input-field"
              />
              
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-4 items-center">
                {gameState === 'playing' ? (
                  <>
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-emerald-500/60 uppercase tracking-widest select-none">Recording...</span>
                  </>
                ) : gameState === 'countdown' ? (
                  <>
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping"></div>
                    <span className="text-xs font-mono text-amber-500/60 uppercase tracking-widest select-none">Starting...</span>
                  </>
                ) : null}
              </div>
            </div>

          </div>
        </div>

        {/* 5. Informative Stats & Keyboard Tips & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="secondary-content">
          
          {/* History Leaderboard */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6" id="history-leaderboard-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-500" />
                {lang === 'mn' ? 'СҮҮЛИЙН УРАЛДААНУУД' : 'RECENT RACES'}
              </h3>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-mono text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest cursor-pointer"
                  id="clear-history-btn"
                >
                  {lang === 'mn' ? 'ТҮҮХ ЦЭВЭРЛЭХ' : 'CLEAR LOGS'}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-center p-4">
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                  {lang === 'mn' ? 'Уралдааны түүх одоогоор байхгүй байна' : 'NO RECORDED RACES'}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">
                  {lang === 'mn' ? 'Тоглож эхлэн өөрийн статистикийг хадгална уу.' : 'Begin playing to record statistics here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto" id="history-table-container">
                <table className="w-full text-left text-xs text-slate-400 font-mono">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-600 font-bold uppercase tracking-wider pb-2">
                      <th className="pb-2 text-[10px]">{lang === 'mn' ? 'УНАА' : 'RIDE'}</th>
                      <th className="pb-2 text-[10px]">{lang === 'mn' ? 'ОГНОО' : 'DATE'}</th>
                      <th className="pb-2 text-right text-[10px]">WPM</th>
                      <th className="pb-2 text-right text-[10px]">{lang === 'mn' ? 'ЗӨВ%' : 'ACC%'}</th>
                      <th className="pb-2 text-right text-[10px]">{lang === 'mn' ? 'ХУГАЦАА' : 'TIME'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-2 flex items-center gap-2">
                          <span className="text-base">{VEHICLE_DATA[item.vehicle]?.emoji || '🏎️'}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-slate-950 text-slate-500 font-bold">
                            {item.language === 'mn' ? 'MN' : 'EN'}
                          </span>
                        </td>
                        <td className="py-2 text-slate-500">{item.date}</td>
                        <td className="py-2 text-right font-bold text-emerald-400">{item.wpm}</td>
                        <td className="py-2 text-right font-bold text-indigo-400">{item.accuracy}%</td>
                        <td className="py-2 text-right text-slate-500">{item.time}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pro Tips Panel */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between" id="typing-tips-card">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                <Keyboard className="h-4 w-4 text-emerald-500" />
                {lang === 'mn' ? 'СИСТЕМИЙН ЗӨВЛӨМЖ' : 'PRO TIPS'}
              </h3>
              <ul className="text-xs text-slate-500 space-y-3 leading-relaxed font-mono">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{lang === 'mn' ? 'Шивэх үедээ дэлгэц рүү харж, гараа цэгцтэй байрлуулаарай.' : 'Keep your focus strictly on the screen target text.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{lang === 'mn' ? 'Хурднаас илүү зөв шивэхэд анхаарвал хурд аяндаа нэмэгдэнэ.' : 'Accuracy triggers steady momentum and speed increments.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{lang === 'mn' ? 'Алдаа гаргавал ухрах (Backspace) товчийг ашиглан засч үргэлжлүүлнэ үү.' : 'Correct highlighted errors to resume vehicle movement.'}</span>
                </li>
              </ul>
            </div>
            
            <div className="border-t border-slate-800/80 pt-4 mt-4 text-[9px] font-mono text-slate-600 tracking-wider uppercase">
              {lang === 'mn' ? 'СИСТЕМ ХҮЛЭЭЖ БАЙНА...' : 'SYSTEM STANDBY...'}
            </div>
          </div>

        </div>

      </main>

      {/* 6. Footer Controls and Metadata */}
      <footer className="max-w-5xl w-full mx-auto px-6 sm:px-12 py-8 flex flex-col sm:flex-row justify-between items-center bg-slate-900/30 border-t border-slate-800/80 gap-6 mt-8">
        <div className="flex gap-4">
          {gameState === 'idle' ? (
            <button
              onClick={startCountdown}
              className="px-6 py-3 bg-slate-100 text-slate-950 font-bold rounded-lg hover:bg-white transition-colors flex items-center gap-2 shadow-lg cursor-pointer text-xs uppercase"
              id="start-challenge-btn"
            >
              <Flame className="h-4 w-4 text-emerald-500 animate-pulse" />
              {lang === 'mn' ? 'УРАЛДААНЫГ ЭХЛҮҮЛЭХ' : 'START RACING'}
            </button>
          ) : (
            <button
              onClick={resetGame}
              className="px-6 py-3 border border-slate-700 font-bold rounded-lg hover:bg-slate-800 transition-colors uppercase text-slate-300 text-xs flex items-center gap-2 cursor-pointer"
              id="reset-challenge-btn"
            >
              <RotateCcw className="h-4 w-4 text-rose-500" />
              {lang === 'mn' ? 'ЦУЦЛАХ' : 'CANCEL'}
            </button>
          )}

          <button
            onClick={() => {
              setSentence(selectRandomSentence(lang));
              resetGame();
            }}
            disabled={gameState === 'countdown'}
            className="px-6 py-3 border border-slate-700 font-bold rounded-lg hover:bg-slate-800 transition-colors uppercase text-slate-300 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            id="get-new-sentence-btn"
          >
            <ChevronRight className="h-4 w-4" />
            {lang === 'mn' ? 'ӨӨР ӨГҮҮЛБЭР' : 'NEW TEXT'}
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-600 tracking-widest uppercase">
          LATENCY: 24MS | REGION: ASIA-EAST
        </div>
      </footer>

    </div>
  );
}
