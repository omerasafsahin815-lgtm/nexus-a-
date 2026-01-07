
import React, { useEffect, useRef, useState } from 'react';

const SurfGameView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'over'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Refs for high-performance updates
  const playerRef = useRef({ x: 0, y: 0, targetX: 0, w: 30, h: 50, speed: 5 });
  const obstaclesRef = useRef<{x: number, y: number, w: number, h: number, type: 'rock' | 'buoy' | 'kraken'}[]>([]);
  const wavesRef = useRef<{y: number, speed: number}[]>([]);
  const frameRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const speedRef = useRef(3);

  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    playerRef.current = { 
      x: canvas.width / 2, 
      y: 150, 
      targetX: canvas.width / 2,
      w: 30, 
      h: 50, 
      speed: 5 
    };
    obstaclesRef.current = [];
    wavesRef.current = Array.from({ length: 5 }, (_, i) => ({
      y: (canvas.height / 5) * i,
      speed: 2
    }));
    speedRef.current = 3;
    setScore(0);
    spawnTimerRef.current = 0;
  };

  useEffect(() => {
    const saved = localStorage.getItem('nexus_surf_highscore');
    if (saved) setHighScore(parseInt(saved));

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing' || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      playerRef.current.targetX = e.clientX - rect.left;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState !== 'playing' || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      playerRef.current.targetX = e.touches[0].clientX - rect.left;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft') playerRef.current.targetX -= 40;
      if (e.key === 'ArrowRight') playerRef.current.targetX += 40;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('keydown', handleKeyDown);

    let animationId: number;
    const loop = () => {
      if (gameState === 'playing') {
        update();
        draw();
        animationId = requestAnimationFrame(loop);
      }
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, [gameState]);

  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Smooth movement
    playerRef.current.x += (playerRef.current.targetX - playerRef.current.x) * 0.15;
    playerRef.current.x = Math.max(20, Math.min(canvas.width - 20, playerRef.current.x));

    // Increase speed over time
    speedRef.current += 0.0005;
    setScore(prev => prev + 1);

    // Update waves (background)
    wavesRef.current.forEach(w => {
      w.y -= speedRef.current;
      if (w.y < -50) w.y = canvas.height + 50;
    });

    // Spawn obstacles
    spawnTimerRef.current++;
    if (spawnTimerRef.current > 40) {
      const types: ('rock' | 'buoy' | 'kraken')[] = ['rock', 'buoy', 'kraken'];
      obstaclesRef.current.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: canvas.height + 50,
        w: 30,
        h: 30,
        type: types[Math.floor(Math.random() * types.length)]
      });
      spawnTimerRef.current = 0;
    }

    // Move obstacles
    obstaclesRef.current.forEach(obs => {
      obs.y -= speedRef.current;
    });

    // Cleanup off-screen obstacles
    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.y > -100);

    // Collisions
    const p = playerRef.current;
    for (const obs of obstaclesRef.current) {
      const dx = Math.abs(p.x - obs.x);
      const dy = Math.abs(p.y - obs.y);
      if (dx < (p.w + obs.w) / 2 - 5 && dy < (p.h + obs.h) / 2 - 5) {
        setGameState('over');
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('nexus_surf_highscore', score.toString());
        }
      }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Fix: Defined 'p' inside the draw function scope
    const p = playerRef.current;

    // Ocean Background
    ctx.fillStyle = '#0891b2'; // Cyan-700
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Waves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    wavesRef.current.forEach(w => {
      ctx.beginPath();
      ctx.moveTo(0, w.y);
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.lineTo(x, w.y + Math.sin(x * 0.05 + w.y * 0.01) * 5);
      }
      ctx.stroke();
    });

    // Player (Surfer)
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    // Board
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.w/2, p.h/2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Surfer silhouette
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(p.x - 5, p.y - 10, 10, 15);
    ctx.beginPath();
    ctx.arc(p.x, p.y - 15, 5, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.shadowBlur = 0;
      if (obs.type === 'rock') {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(obs.x - 15, obs.y + 15);
        ctx.lineTo(obs.x, obs.y - 15);
        ctx.lineTo(obs.x + 15, obs.y + 15);
        ctx.fill();
      } else if (obs.type === 'buoy') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x - 10, obs.y - 10, 20, 20);
        ctx.fillStyle = '#fff';
        ctx.fillRect(obs.x - 10, obs.y, 20, 5);
      } else {
        // Kraken/Monster
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 15, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(obs.x - 2, obs.y - 25, 4, 15);
      }
    });

    ctx.shadowBlur = 0;
  };

  return (
    <div className="flex flex-col h-full bg-[#0891b2] items-center justify-center p-6 overflow-hidden">
      <div className="mb-6 flex justify-between w-full max-w-[600px] items-end">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-white">MEGA SURF</h2>
          <p className="text-[10px] uppercase font-bold text-cyan-200 tracking-[0.3em]">Extreme Wave Protocol</p>
        </div>
        <div className="flex gap-8 text-right">
          <div>
            <p className="text-[10px] font-bold text-cyan-200 uppercase">En Yüksek</p>
            <p className="text-xl font-black text-white">{highScore}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-cyan-200 uppercase">Mesafe</p>
            <p className="text-3xl font-black text-white">{Math.floor(score / 10)}m</p>
          </div>
        </div>
      </div>

      <div className="relative glass-panel rounded-[2.5rem] overflow-hidden border-white/20 shadow-2xl">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={800} 
          className="max-w-full h-auto bg-cyan-800"
        />
        
        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-cyan-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-10 z-10">
            {gameState === 'start' ? (
              <>
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 animate-bounce">
                    <i className="fa-solid fa-water text-5xl text-white"></i>
                </div>
                <h3 className="text-5xl font-black mb-4 text-white">DALGALARA HAZIRLAN</h3>
                <p className="text-cyan-200 mb-10 max-w-xs text-lg italic">Engellerden kaç, en uzun mesafeyi kat et. Nexus Surf Protokolü Başlatılıyor.</p>
                <button 
                  onClick={() => { initGame(); setGameState('playing'); }}
                  className="bg-white text-cyan-900 px-16 py-5 rounded-2xl font-black text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  SURF YAP
                </button>
              </>
            ) : (
              <>
                <h3 className="text-7xl font-black text-white mb-2">DALGA ÇAPTI</h3>
                <p className="text-2xl font-bold mb-8 text-cyan-200 uppercase tracking-widest">MESAFE: {Math.floor(score / 10)}m</p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => { initGame(); setGameState('playing'); }}
                        className="bg-white text-cyan-900 px-12 py-4 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95"
                    >
                        YENİDEN DENE
                    </button>
                    <button 
                        onClick={() => setGameState('start')}
                        className="bg-cyan-800 text-white px-12 py-4 rounded-2xl font-black text-xl transition-all border border-white/10"
                    >
                        MENÜ
                    </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-10 opacity-60 text-[10px] font-bold uppercase tracking-widest text-white">
         <span className="flex items-center gap-2"><i className="fa-solid fa-mouse"></i> Fare/Touch ile Yönlendir</span>
         <span className="flex items-center gap-2"><i className="fa-solid fa-keyboard"></i> Ok Tuşları</span>
      </div>
    </div>
  );
};

export default SurfGameView;
