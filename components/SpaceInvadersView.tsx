
import React, { useEffect, useRef, useState } from 'react';

const SpaceInvadersView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'over'>('start');
  const [score, setScore] = useState(0);
  
  // Game state refs
  const playerRef = useRef({ x: 0, y: 0, w: 40, h: 20 });
  const bulletsRef = useRef<{x: number, y: number}[]>([]);
  const enemiesRef = useRef<{x: number, y: number, type: number}[]>([]);
  const enemyDirRef = useRef(1);
  const enemyStepRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});

  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    playerRef.current = { x: canvas.width / 2 - 20, y: canvas.height - 60, w: 40, h: 20 };
    bulletsRef.current = [];
    enemiesRef.current = [];
    enemyDirRef.current = 1;
    enemyStepRef.current = 0;
    setScore(0);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 10; c++) {
        enemiesRef.current.push({
          x: 50 + c * 60,
          y: 50 + r * 50,
          type: r
        });
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current[e.code] = true;
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let frame: number;
    const loop = () => {
      if (gameState === 'playing') {
        update();
        draw();
      }
      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(frame);
    };
  }, [gameState]);

  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Move player
    if (keysRef.current['ArrowLeft'] && playerRef.current.x > 0) playerRef.current.x -= 5;
    if (keysRef.current['ArrowRight'] && playerRef.current.x < canvas.width - playerRef.current.w) playerRef.current.x += 5;
    
    // Shoot
    if (keysRef.current['Space'] && bulletsRef.current.length < 3) {
      bulletsRef.current.push({ x: playerRef.current.x + playerRef.current.w / 2, y: playerRef.current.y });
      keysRef.current['Space'] = false; // Prevents spamming
    }

    // Move bullets
    bulletsRef.current = bulletsRef.current.filter(b => b.y > 0);
    bulletsRef.current.forEach(b => b.y -= 7);

    // Move enemies
    enemyStepRef.current++;
    if (enemyStepRef.current > 30) {
      let hitEdge = false;
      enemiesRef.current.forEach(e => {
        e.x += 10 * enemyDirRef.current;
        if (e.x < 20 || e.x > canvas.width - 50) hitEdge = true;
      });

      if (hitEdge) {
        enemyDirRef.current *= -1;
        enemiesRef.current.forEach(e => e.y += 20);
      }
      enemyStepRef.current = 0;
    }

    // Collisions
    bulletsRef.current.forEach((b, bIdx) => {
      enemiesRef.current.forEach((e, eIdx) => {
        if (b.x > e.x && b.x < e.x + 40 && b.y > e.y && b.y < e.y + 30) {
          enemiesRef.current.splice(eIdx, 1);
          bulletsRef.current.splice(bIdx, 1);
          setScore(s => s + 100);
        }
      });
    });

    if (enemiesRef.current.length === 0) setGameState('over');
    if (enemiesRef.current.some(e => e.y > playerRef.current.y)) setGameState('over');
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // BG
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = '#6366f1';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#6366f1';
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.w, playerRef.current.h);

    // Bullets
    ctx.fillStyle = '#fff';
    bulletsRef.current.forEach(b => ctx.fillRect(b.x - 2, b.y, 4, 10));

    // Enemies
    enemiesRef.current.forEach(e => {
      ctx.fillStyle = e.type === 0 ? '#f43f5e' : (e.type === 1 ? '#ec4899' : '#a855f7');
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(e.x, e.y, 40, 30);
    });

    ctx.shadowBlur = 0;
  };

  return (
    <div className="flex flex-col h-full bg-[#050608] items-center justify-center p-6 overflow-hidden">
      <div className="mb-6 flex justify-between w-full max-w-[800px] items-end">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-indigo-500">SPACE QUEST</h2>
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.3em]">Nexus Retro Protocol</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Skor</p>
          <p className="text-3xl font-black text-white">{score.toString().padStart(6, '0')}</p>
        </div>
      </div>

      <div className="relative glass-panel rounded-3xl overflow-hidden border-white/10 crt shadow-[0_0_50px_rgba(99,102,241,0.1)]">
        <canvas ref={canvasRef} width={800} height={500} className="max-w-full" />
        
        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-10 z-10">
            {gameState === 'start' ? (
              <>
                <i className="fa-solid fa-shuttle-space text-6xl text-indigo-500 mb-6 animate-bounce"></i>
                <h3 className="text-4xl font-black mb-4">HAZIR MISIN?</h3>
                <p className="text-gray-400 mb-10 max-w-xs">Galaksiyi Nexus istilasından korumak senin elinde. Ok tuşlarıyla hareket et, Boşluk ile ateşle.</p>
                <button 
                  onClick={() => { initGame(); setGameState('playing'); }}
                  className="bg-indigo-600 hover:bg-indigo-500 px-12 py-4 rounded-2xl font-black text-xl shadow-xl shadow-indigo-900/40 transition-all active:scale-95"
                >
                  GÖREVE BAŞLA
                </button>
              </>
            ) : (
              <>
                <h3 className="text-6xl font-black text-red-500 mb-4">GÖREV SONLANDI</h3>
                <p className="text-2xl font-bold mb-8">SKOR: {score}</p>
                <button 
                  onClick={() => { initGame(); setGameState('playing'); }}
                  className="bg-white text-black px-12 py-4 rounded-2xl font-black text-xl transition-all active:scale-95"
                >
                  YENİDEN DENE
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-10 opacity-30 text-[10px] font-bold uppercase tracking-widest">
         <span className="flex items-center gap-2"><i className="fa-solid fa-arrows-left-right"></i> Hareket</span>
         <span className="flex items-center gap-2"><i className="fa-solid fa-keyboard"></i> SPACE - Ateş</span>
      </div>
    </div>
  );
};

export default SpaceInvadersView;
