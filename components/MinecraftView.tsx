
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const WORLD_SIZE = 30; 

type GameMode = 'creative' | 'survival' | 'hardcore';
type Difficulty = 'easy' | 'normal' | 'hard';

interface MinecraftViewProps {
  onEarnPoints?: (amount: number, reason: string) => void;
}

const MinecraftView: React.FC<MinecraftViewProps> = ({ onEarnPoints }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'launcher' | 'connecting' | 'playing' | 'gameover'>('launcher');
  const [gameMode, setGameMode] = useState<GameMode>('survival');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(0);
  const [fps, setFps] = useState(60);
  const [health, setHealth] = useState(100);
  const [brokenBlocksCount, setBrokenBlocksCount] = useState(0);

  const worldRef = useRef<Map<string, number>>(new Map());
  const meshesRef = useRef<THREE.InstancedMesh[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const gameLoopId = useRef<number | null>(null);

  const blockTypes = [
    { name: 'Çimen', color: 0x3d5a35, roughness: 0.8 },
    { name: 'Toprak', color: 0x5d4037, roughness: 0.9 },
    { name: 'Taş', color: 0x757575, roughness: 0.6 },
    { name: 'Kum', color: 0xc2b280, roughness: 1.0 },
    { name: 'Odun', color: 0x3e2723, roughness: 0.7 },
    { name: 'Yaprak', color: 0x1b5e20, roughness: 0.8 },
    { name: 'Elmas', color: 0x00e5ff, roughness: 0.2, emmissive: 0x00e5ff },
    { name: 'Lav', color: 0xff4500, roughness: 0.1, emmissive: 0xff4500 },
  ];

  const getPosKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

  const updateMeshes = () => {
    if (meshesRef.current.length === 0) return;
    const counts = new Array(blockTypes.length).fill(0);
    const dummy = new THREE.Object3D();

    worldRef.current.forEach((typeIdx, key) => {
      const [x, y, z] = key.split(',').map(Number);
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      if (meshesRef.current[typeIdx]) {
        meshesRef.current[typeIdx].setMatrixAt(counts[typeIdx]++, dummy.matrix);
      }
    });

    meshesRef.current.forEach((m, i) => {
      m.count = counts[i];
      m.instanceMatrix.needsUpdate = true;
    });
  };

  useEffect(() => {
    if (status === 'connecting') {
      const timer = setTimeout(() => {
        const noise = (x: number, z: number) => Math.sin(x * 0.1) * Math.cos(z * 0.1) * 4 + Math.sin(x * 0.04 + z * 0.03) * 6;
        const newWorld = new Map<string, number>();
        for (let x = -WORLD_SIZE; x < WORLD_SIZE; x++) {
          for (let z = -WORLD_SIZE; z < WORLD_SIZE; z++) {
            const h = Math.floor(noise(x, z));
            for (let y = -8; y <= h; y++) {
              let typeIdx = 2; 
              if (y === h) typeIdx = h < 0 ? 3 : 0;
              else if (y > h - 3) typeIdx = 1;
              newWorld.set(getPosKey(x, y, z), typeIdx);
            }
          }
        }
        worldRef.current = newWorld;
        setHealth(100);
        setStatus('playing');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'playing' || !containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(gameMode === 'hardcore' ? 0x0f0a0a : 0x7da4ff);
    scene.fog = new THREE.FogExp2(scene.background, 0.015);

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, gameMode === 'hardcore' ? 0.3 : 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    const meshes: THREE.InstancedMesh[] = blockTypes.map(bt => {
      const mat = new THREE.MeshStandardMaterial({ 
        color: bt.color, 
        roughness: bt.roughness,
        emissive: bt.emmissive || 0x000000,
        emissiveIntensity: bt.emmissive ? 0.5 : 0
      });
      const im = new THREE.InstancedMesh(blockGeo, mat, 25000);
      im.castShadow = true;
      im.receiveShadow = true;
      scene.add(im);
      return im;
    });
    meshesRef.current = meshes;
    updateMeshes();

    camera.position.set(0, 15, 0);

    const keys: Record<string, boolean> = {};
    let pitch = 0, yaw = 0;
    const playerVel = new THREE.Vector3();
    let canJump = false;
    let lastY = 15;

    const onKeyDown = (e: KeyboardEvent) => keys[e.code] = true;
    const onKeyUp = (e: KeyboardEvent) => keys[e.code] = false;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0, 0);

    const handleInteraction = (type: 'break' | 'place') => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(meshesRef.current);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        if (intersect.distance > 6) return;

        const targetPos = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(intersect.object.matrixWorld).multiply(new THREE.Matrix4().setPosition(intersect.point)));
        const snap = (v: THREE.Vector3) => new THREE.Vector3(Math.round(v.x), Math.round(v.y), Math.round(v.z));
        const normal = intersect.face!.normal.clone().applyQuaternion(intersect.object.quaternion);
        const snappedPos = snap(intersect.point.clone().sub(normal.clone().multiplyScalar(0.5)));

        if (type === 'break') {
          const key = getPosKey(snappedPos.x, snappedPos.y, snappedPos.z);
          if (worldRef.current.has(key)) {
            worldRef.current.delete(key);
            setBrokenBlocksCount(prev => prev + 1);
            updateMeshes();
          }
        } else {
          const newPos = snappedPos.clone().add(normal);
          const key = getPosKey(newPos.x, newPos.y, newPos.z);
          if (!worldRef.current.has(key)) {
            worldRef.current.set(key, selectedBlockIdx);
            updateMeshes();
          }
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== containerRef.current) return;
      if (e.button === 0) handleInteraction('break');
      if (e.button === 2) handleInteraction('place');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === containerRef.current) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitch));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);

    let lastTime = performance.now();
    const animate = () => {
      if (status !== 'playing') return;
      gameLoopId.current = requestAnimationFrame(animate);
      const time = performance.now();
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (document.pointerLockElement === containerRef.current) {
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
        const moveVec = new THREE.Vector3();
        if (keys['KeyW']) moveVec.z -= 1;
        if (keys['KeyS']) moveVec.z += 1;
        if (keys['KeyA']) moveVec.x -= 1;
        if (keys['KeyD']) moveVec.x += 1;
        
        let speedMult = gameMode === 'creative' ? 0.4 : 0.15;
        if (keys['ShiftLeft']) speedMult *= 1.5;
        
        moveVec.normalize().multiplyScalar(speedMult).applyQuaternion(camera.quaternion);
        if (gameMode !== 'creative') moveVec.y = 0;
        camera.position.add(moveVec);

        if (gameMode !== 'creative') {
          playerVel.y -= 0.015;
          camera.position.y += playerVel.y;

          const px = Math.round(camera.position.x);
          const pz = Math.round(camera.position.z);
          let groundY = -20;
          for (let y = 15; y > -20; y--) {
              if (worldRef.current.has(getPosKey(px, y, pz))) {
                  groundY = y;
                  break;
              }
          }

          if (camera.position.y < groundY + 1.8) {
            // Check fall damage
            const fallDist = lastY - camera.position.y;
            if (fallDist > 4 && gameMode !== 'creative') {
              const damage = Math.floor((fallDist - 4) * (difficulty === 'hard' ? 20 : 10));
              setHealth(prev => {
                const newHealth = prev - damage;
                if (newHealth <= 0) setStatus('gameover');
                return Math.max(0, newHealth);
              });
            }
            camera.position.y = groundY + 1.8;
            playerVel.y = 0;
            canJump = true;
            lastY = camera.position.y;
          }

          if (keys['Space'] && canJump) {
            playerVel.y = 0.25;
            canJump = false;
            lastY = camera.position.y;
          }

          // Void damage
          if (camera.position.y < -15) {
            setHealth(prev => {
              const newH = prev - 5;
              if (newH <= 0) setStatus('gameover');
              return Math.max(0, newH);
            });
          }
        }
      }

      renderer.render(scene, camera);
      if (Math.random() < 0.01) setFps(Math.round(1 / delta));
    };

    animate();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [status, gameMode, difficulty, selectedBlockIdx]);

  if (status === 'launcher') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050608] p-10 text-center animate-fade-in relative overflow-hidden">
        {/* Animated Background Blocks */}
        <div className="absolute inset-0 opacity-10 pointer-events-none grid grid-cols-12 gap-2 scale-150 rotate-12">
           {Array.from({length: 144}).map((_, i) => (
             <div key={i} className="aspect-square bg-emerald-500/20 border border-emerald-500/10 rounded"></div>
           ))}
        </div>

        <div className="relative z-10 mb-12">
            <h1 className="text-8xl font-black mb-2 tracking-tighter text-white drop-shadow-[0_8px_0_#065f46]">MEGA CRAFT</h1>
            <p className="text-emerald-400 font-bold tracking-[0.5em] uppercase text-xs mb-10 italic">Intelligence Sandbox v5.0</p>
            
            <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
              {/* Mode Selection */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'creative', name: 'Yaratıcı', desc: 'Sınırsız Blok', color: 'bg-emerald-600', icon: 'fa-wand-magic-sparkles' },
                  { id: 'survival', name: 'Hayatta Kalma', desc: 'Sınırlı Kaynak', color: 'bg-blue-600', icon: 'fa-heart' },
                  { id: 'hardcore', name: 'HARDCORE', desc: 'Tek Can', color: 'bg-red-700', icon: 'fa-skull-crossbones' },
                ].map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setGameMode(m.id as GameMode)}
                    className={`p-6 rounded-3xl border-2 transition-all text-center group ${gameMode === m.id ? 'border-white scale-105 shadow-2xl ' + m.color : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <i className={`fa-solid ${m.icon} text-2xl mb-2 ${gameMode === m.id ? 'text-white' : 'text-gray-500'}`}></i>
                    <h4 className="font-black text-sm uppercase">{m.name}</h4>
                    <p className="text-[9px] opacity-60 uppercase">{m.desc}</p>
                  </button>
                ))}
              </div>

              {/* Difficulty Selection */}
              <div className="flex justify-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                 {['easy', 'normal', 'hard'].map(d => (
                   <button 
                     key={d}
                     onClick={() => setDifficulty(d as Difficulty)}
                     className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${difficulty === d ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                   >
                     {d === 'easy' ? 'Kolay' : d === 'normal' ? 'Normal' : 'Zor'}
                   </button>
                 ))}
              </div>

              <button 
                onClick={() => setStatus('connecting')}
                className="mt-6 w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl rounded-[2rem] shadow-2xl shadow-emerald-900/40 transition-all active:scale-95 group"
              >
                DÜNYAYI BAŞLAT <i className="fa-solid fa-play ml-3 group-hover:translate-x-2 transition-transform"></i>
              </button>
            </div>
        </div>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050608] text-center">
        <div className="w-80 h-3 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/10 relative">
            <div className="h-full bg-emerald-500 w-1/3 animate-[loading_2s_infinite_linear]"></div>
        </div>
        <h3 className="text-xl font-bold text-gray-500 tracking-[0.5em] uppercase italic animate-pulse">Protokol Senkronize Ediliyor...</h3>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'gameover') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-950 text-center animate-fade-in p-10">
         <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-white text-5xl mb-8 animate-bounce">
            <i className="fa-solid fa-skull"></i>
         </div>
         <h1 className="text-7xl font-black text-white mb-2 tracking-tighter uppercase">ÖLDÜNÜZ!</h1>
         <p className="text-xl text-red-300 font-bold mb-10 tracking-widest uppercase italic">
            {gameMode === 'hardcore' ? 'HARDCORE DÜNYASI SİLİNDİ' : 'Macera Sona Erdi'}
         </p>
         <div className="flex gap-4">
            <button 
              onClick={() => setStatus('launcher')}
              className="px-12 py-5 bg-white text-black rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all"
            >
              ANA MENÜYE DÖN
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden font-sans">
      <div ref={containerRef} onClick={() => containerRef.current?.requestPointerLock()} onContextMenu={(e) => e.preventDefault()} className="w-full h-full cursor-crosshair" />
      
      {/* GAME HUD */}
      <div className="absolute top-8 left-8 pointer-events-none space-y-4">
          <div className="glass-panel px-6 py-4 rounded-2xl border-white/10 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] mb-1">Nexus Mega Sandbox</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white font-bold">{fps} FPS</span>
              <span className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-black text-gray-400 uppercase tracking-widest">{gameMode} | {difficulty}</span>
            </div>
          </div>

          {gameMode !== 'creative' && (
            <div className="glass-panel px-6 py-4 rounded-2xl border-white/10 backdrop-blur-md w-64">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Sağlık</span>
                  <span className="text-xs font-black text-white">{health}%</span>
               </div>
               <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.5)]" style={{ width: `${health}%` }}></div>
               </div>
            </div>
          )}

          <div className="glass-panel px-4 py-2 rounded-xl border-white/5 bg-black/20 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
             BLOK: {brokenBlocksCount}
          </div>
      </div>

      <div className="absolute top-8 right-8 flex gap-3">
         <button className="bg-white/5 hover:bg-white/10 text-white w-12 h-12 flex items-center justify-center rounded-xl transition-all border border-white/10" title="Uçuş (Sadece Creative)">
            <i className={`fa-solid fa-plane-up ${gameMode === 'creative' ? 'text-emerald-400' : 'text-gray-600'}`}></i>
         </button>
         <button className="bg-white/5 hover:bg-red-500/20 text-white px-6 py-3 rounded-xl font-black text-xs transition-all border border-white/10 uppercase tracking-widest" onClick={() => setStatus('launcher')}>
            Çıkış
         </button>
      </div>

      {/* CROSSHAIR */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-8 h-8 flex items-center justify-center opacity-40 text-white text-3xl font-light">+</div>
      </div>

      {/* HOTBAR */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center p-2 glass-panel rounded-3xl border-white/10 backdrop-blur-3xl shadow-2xl">
        {blockTypes.slice(0, 8).map((b, i) => (
          <button 
            key={i} 
            onClick={() => setSelectedBlockIdx(i)} 
            className={`w-14 h-14 transition-all relative group flex items-center justify-center ${selectedBlockIdx === i ? 'scale-115 ring-4 ring-emerald-500 z-10 -translate-y-2' : 'opacity-60 hover:opacity-100'}`}
          >
            <div className="w-10 h-10 shadow-2xl" style={{ backgroundColor: `#${b.color.toString(16).padStart(6, '0')}` }}></div>
            <div className="absolute inset-0 flex items-end justify-center pb-0.5">
                <span className="text-[7px] font-black uppercase text-white/50 tracking-tighter">{b.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* VIGNETTE EFFECT FOR HARDCORE/LOW HEALTH */}
      {health < 30 && gameMode !== 'creative' && (
        <div className="absolute inset-0 pointer-events-none border-[60px] border-red-900/10 blur-[50px] animate-pulse"></div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default MinecraftView;
