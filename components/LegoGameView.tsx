
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface LegoGameViewProps {
  onEarnPoints: (amount: number, reason: string) => void;
}

const LegoGameView: React.FC<LegoGameViewProps> = ({ onEarnPoints }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState(0xFF0000);
  const [brickType, setBrickType] = useState<'1x1' | '2x2' | '2x4'>('1x1');
  const [bricksCount, setBricksCount] = useState(0);

  const colors = [
    { name: 'Kırmızı', hex: 0xFF0000 },
    { name: 'Mavi', hex: 0x0055FF },
    { name: 'Sarı', hex: 0xFFD700 },
    { name: 'Yeşil', hex: 0x00AA00 },
    { name: 'Turuncu', hex: 0xFF8C00 },
    { name: 'Siyah', hex: 0x222222 },
    { name: 'Beyaz', hex: 0xFFFFFF },
    { name: 'Gri', hex: 0x888888 },
  ];

  const bricksRef = useRef<THREE.Group[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const pointerRef = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());
  const ghostBrickRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Grid Plane
    const geometry = new THREE.PlaneGeometry(50, 50);
    const material = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);
    planeRef.current = plane;

    const grid = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
    scene.add(grid);

    updateGhostBrick();

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  const createLegoBrick = (color: number, type: '1x1' | '2x2' | '2x4', isGhost: boolean = false) => {
    const group = new THREE.Group();
    let w = 1, d = 1, h = 1;
    if (type === '2x2') { w = 2; d = 2; }
    if (type === '2x4') { w = 4; d = 2; }

    const bodyGeo = new THREE.BoxGeometry(w - 0.05, h, d - 0.05);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color, 
      roughness: 0.4, 
      transparent: isGhost, 
      opacity: isGhost ? 0.5 : 1 
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = h / 2;
    body.castShadow = !isGhost;
    body.receiveShadow = !isGhost;
    group.add(body);

    const studGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const studMat = bodyMat;
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        const stud = new THREE.Mesh(studGeo, studMat);
        stud.position.set(x - w / 2 + 0.5, h + 0.1, z - d / 2 + 0.5);
        stud.castShadow = !isGhost;
        group.add(stud);
      }
    }

    return group;
  };

  const updateGhostBrick = () => {
    if (ghostBrickRef.current && sceneRef.current) {
      sceneRef.current.remove(ghostBrickRef.current);
    }
    const ghost = createLegoBrick(selectedColor, brickType, true);
    sceneRef.current?.add(ghost);
    ghostBrickRef.current = ghost;
  };

  useEffect(() => {
    updateGhostBrick();
  }, [selectedColor, brickType]);

  const onPointerMove = (event: React.PointerEvent) => {
    if (!containerRef.current || !cameraRef.current || !planeRef.current || !ghostBrickRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects([planeRef.current, ...bricksRef.current.map(g => g.children[0])]);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const point = intersect.point;
      
      ghostBrickRef.current.position.set(
        Math.round(point.x),
        Math.round(point.y),
        Math.round(point.z)
      );
    }
  };

  const placeBrick = () => {
    if (!ghostBrickRef.current || !sceneRef.current) return;
    const brick = createLegoBrick(selectedColor, brickType);
    brick.position.copy(ghostBrickRef.current.position);
    sceneRef.current.add(brick);
    bricksRef.current.push(brick);
    const newCount = bricksRef.current.length;
    setBricksCount(newCount);

    // Rewards: 5, 20, 50, 100 bricks
    if (newCount === 5) onEarnPoints(100, 'Lego Çırağı');
    if (newCount === 20) onEarnPoints(500, 'Lego Mimarı');
    if (newCount === 50) onEarnPoints(1500, 'Lego Üstadı');
    if (newCount === 100) onEarnPoints(5000, 'LEGO MEGA BUILDER!');
  };

  const clearAll = () => {
    bricksRef.current.forEach(b => sceneRef.current?.remove(b));
    bricksRef.current = [];
    setBricksCount(0);
  };

  return (
    <div className="h-full flex flex-col bg-[#111] overflow-hidden font-sans">
      <div className="p-6 bg-yellow-500 flex items-center justify-between shadow-xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-yellow-600 text-2xl shadow-lg border-2 border-yellow-400">
            <i className="fa-solid fa-shapes"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-black uppercase">LEGO MEGA BUILDER</h2>
            <p className="text-[10px] font-bold text-black/50 tracking-widest uppercase">Nexus Creative Protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-2 rounded-xl border-black/10 bg-black/5 text-black font-bold text-sm">
            <span className="opacity-50 mr-2">BLOCKS:</span> {bricksCount}
          </div>
          <button 
            onClick={clearAll}
            className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95"
          >
            TEMİZLE
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative">
        <div 
          ref={containerRef} 
          className="flex-1 cursor-crosshair"
          onPointerMove={onPointerMove}
          onPointerDown={placeBrick}
        />

        <div className="absolute left-8 top-8 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-[2rem] border-white/10 shadow-2xl backdrop-blur-3xl w-48">
             <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">Renk Seçimi</h3>
             <div className="grid grid-cols-4 gap-2">
                {colors.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setSelectedColor(c.hex)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${selectedColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: `#${c.hex.toString(16).padStart(6, '0')}` }}
                  />
                ))}
             </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none text-center">
            <div className="glass-panel px-6 py-3 rounded-2xl border-white/5 backdrop-blur-md">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">GÖREV: 20 BLOK YERLEŞTİR - 500 NEXUS KAZAN!</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LegoGameView;
