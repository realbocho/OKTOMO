'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const BEADS = [
  { glyph: '疑', han: '知強當疑，樂讀求之。', eum: '지강당의, 낙독구지.', mean: '내가 아는 강함일지라도 마땅히 의심하며, 사색하고 읽고 살피는 가운데 더 나은 강함을 끊임없이 구한다.' },
  { glyph: '行', han: '知而力行，強而無懈。', eum: '지이력행, 강이무해.', mean: '배운 강함을 힘써 행하고, 매순간 강함을 추구하여 그것이 삶의 모습과 결과로 드러나게 한다.' },
  { glyph: '問', han: '行有所礙，反問其強。', eum: '행유소애, 반문의강.', mean: '강하게 살아가다 막히는 순간에는 멈추어, 내가 그 상황에서 강함을 무엇이라 정의하고 있었는지 되묻는다.' },
  { glyph: '新', han: '讀思更新，改而更強。', eum: '독사갱신, 개이갱강.', mean: '독서와 사유를 통해 내가 몰랐던 다른 강함을 발견하고, 그것을 내 기준에 더하거나 고쳐 더욱 강해진다.' },
  { glyph: '疑', han: '知強當疑，樂讀求之。', eum: '지강당의, 낙독구지.', mean: '내가 아는 강함일지라도 마땅히 의심하며, 사색하고 읽고 살피는 가운데 더 나은 강함을 끊임없이 구한다.' },
  { glyph: '行', han: '知而力行，強而無懈。', eum: '지이력행, 강이무해.', mean: '배운 강함을 힘써 행하고, 매순간 강함을 추구하여 그것이 삶의 모습과 결과로 드러나게 한다.' },
  { glyph: '問', han: '行有所礙，反問其強。', eum: '행유소애, 반문의강.', mean: '강하게 살아가다 막히는 순간에는 멈추어, 내가 그 상황에서 강함을 무엇이라 정의하고 있었는지 되묻는다.' },
  { glyph: '新', han: '讀思更新，改而更強。', eum: '독사갱신, 개이갱강.', mean: '독서와 사유를 통해 내가 몰랐던 다른 강함을 발견하고, 그것을 내 기준에 더하거나 고쳐 더욱 강해진다.' },
];

const N = BEADS.length;
const mod = (k: number) => ((k % N) + N) % N;

function makeTexture(glyph: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const x = c.getContext('2d')!;

  const g = x.createRadialGradient(180, 150, 20, 256, 256, 300);
  g.addColorStop(0, '#604a34');
  g.addColorStop(0.55, '#34261a');
  g.addColorStop(1, '#120d08');
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 180; i++) {
    x.strokeStyle = `rgba(255,235,200,${Math.random() * 0.045})`;
    const px = Math.random() * 512;
    x.beginPath();
    x.moveTo(px, 0);
    x.lineTo(px + (Math.random() - 0.5) * 35, 512);
    x.stroke();
  }

  x.fillStyle = 'rgba(235,210,165,.9)';
  x.font = '145px "Noto Serif KR","Songti SC",serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(glyph, 256, 256);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function Page() {
  const [pos, setPos] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(0);

  const go = useCallback((d: 1 | -1) => {
    navigator.vibrate?.(8);
    setPos((p) => p + d);
  }, []);

  useEffect(() => {
    target.current = pos;
  }, [pos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffe2b0, 2.8);
    key.position.set(-3, 4, 7);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8a7a63, 1.4);
    rim.position.set(4, -3, -5);
    scene.add(rim);

    // 진짜 원형 염주: 구슬들이 하나의 고리를 이루고,
    // 한 칸 넘길 때 고리 전체가 한 구슬만큼 회전한다.
    const ring = new THREE.Group();
    scene.add(ring);

    const string = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.018, 8, 128),
      new THREE.MeshStandardMaterial({ color: 0x51483b, roughness: 0.95 })
    );
    ring.add(string);

    const textures = BEADS.map((b) => makeTexture(b.glyph));
    const geo = new THREE.SphereGeometry(0.48, 48, 32);
    const beadMeshes = BEADS.map((_, i) => {
      const mat = new THREE.MeshStandardMaterial({
        map: textures[i],
        roughness: 0.34,
        metalness: 0.05,
      });
      const bead = new THREE.Mesh(geo, mat);
      const a = -Math.PI / 2 + i * (Math.PI * 2 / N);
      bead.position.set(Math.cos(a) * 2.15, Math.sin(a) * 2.15, 0);
      // 캔버스 텍스처의 글자가 카메라를 정면으로 보도록 고정
      bead.rotation.set(0, 0, 0);
      ring.add(bead);
      return bead;
    });

    // 사용자가 드래그해서 카메라 시점을 자유롭게 돌려 옆면/뒷면까지 볼 수 있게 한다.
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.7;

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let down: { x: number; y: number } | null = null;
    let dragging = false;

    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
      dragging = false;
    };

    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 24) {
        dragging = true;
        // 좌우 스와이프 한 번 = 염주 한 알.
        go(dx < 0 ? 1 : -1);
      } else if (!dragging) {
        const rect = renderer.domElement.getBoundingClientRect();
        go(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
      }

      down = null;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointerup', onUp);

    let current = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      current += (target.current - current) * (1 - Math.exp(-dt * 5.5));

      // 현재 구슬(0번)을 화면 아래 정면에 두고,
      // pos가 증가할수록 고리가 한 칸씩 시계방향으로 넘어간다.
      // 링을 세워서 회전축(Y축)으로 돌린다. 구슬이 좌우로만 미끄러지지 않고
      // 앞뒤 깊이를 오가며 실제 3D 염주처럼 돌아온다.
      ring.rotation.set(Math.PI / 2, current * (Math.PI * 2 / N), 0);

      beadMeshes.forEach((bead, i) => {
        // 구슬 자체는 정면을 유지하고, 고리만 회전시킨다.
        bead.rotation.set(0, 0, 0);
        const active = mod(i - Math.round(current)) === 0;
        const scale = active ? 1.08 : 0.9;
        bead.scale.setScalar(scale);

        const material = bead.material as THREE.MeshStandardMaterial;
        material.opacity = active ? 1 : 0.82;
        material.transparent = true;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointerup', onUp);
      geo.dispose();
      textures.forEach((t) => t.dispose());
      beadMeshes.forEach((b) => (b.material as THREE.Material).dispose());
      string.geometry.dispose();
      (string.material as THREE.Material).dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [go]);

  const cur = BEADS[mod(pos)];

  return (
    <main className="stage">
      <div className="title">求強</div>
      <div className="canvas" ref={host} />

      <section className="text" key={mod(pos)} aria-live="polite">
        <p className="han">{cur.han}</p>
        <p className="eum">{cur.eum}</p>
        <p className="mean">{cur.mean}</p>
      </section>

      <nav className="dots" aria-hidden>
        {BEADS.map((_, i) => <i key={i} className={i === mod(pos) ? 'on' : ''} />)}
      </nav>

      <div className="hint">좌우로 넘겨 한 알씩</div>

      <style>{css}</style>
    </main>
  );
}

const css = `
html,body{
  margin:0;
  width:100%;
  height:100%;
  background:#070707;
  overscroll-behavior:none;
}
.stage{
  width:100%;
  height:100dvh;
  box-sizing:border-box;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:
    max(env(safe-area-inset-top),18px)
    20px
    max(env(safe-area-inset-bottom),16px);
  background:radial-gradient(ellipse at 50% 28%,#171717 0%,#070707 72%);
  color:#cfc9bd;
  font-family:'Noto Serif KR','Nanum Myeongjo','Songti SC',serif;
  user-select:none;
  -webkit-user-select:none;
  -webkit-tap-highlight-color:transparent;
  touch-action:none;
}
.title{
  flex:0 0 auto;
  margin-top:2px;
  color:#e4ded2;
  font-size:18px;
  letter-spacing:.34em;
  text-indent:.34em;
}
.canvas{
  width:min(92vw,520px);
  flex:1 1 auto;
  min-height:260px;
  max-height:58dvh;
}
.canvas canvas{
  display:block;
  width:100%;
  height:100%;
}
.text{
  flex:0 0 auto;
  width:min(92vw,620px);
  text-align:center;
  animation:appear .7s ease both;
}
.han{
  margin:0;
  color:#e7e0d3;
  font-size:clamp(18px,4.5vw,25px);
  line-height:1.6;
  letter-spacing:.2em;
}
.eum{
  margin:12px 0 0;
  color:#938b7d;
  font-size:13px;
  letter-spacing:.1em;
}
.mean{
  margin:12px auto 0;
  max-width:560px;
  min-height:4em;
  color:#70695e;
  font-size:13px;
  line-height:1.85;
  word-break:keep-all;
}
.dots{
  flex:0 0 auto;
  display:flex;
  gap:12px;
  margin-top:12px;
}
.dots i{
  width:4px;
  height:4px;
  border-radius:50%;
  background:#302c27;
  transition:all .45s ease;
}
.dots i.on{
  background:#b39a70;
  transform:scale(1.5);
}
.hint{
  flex:0 0 auto;
  margin-top:13px;
  color:#49443b;
  font-size:10px;
  letter-spacing:.12em;
}
@keyframes appear{
  from{opacity:0;transform:translateY(7px)}
  to{opacity:1;transform:none}
}
@media (min-width:700px){
  .stage{padding-top:28px}
  .canvas{max-height:62dvh}
  .text{margin-top:-4px}
  .hint{margin-top:16px}
}
@media (max-height:700px){
  .canvas{max-height:49dvh}
  .mean{margin-top:8px;min-height:3.7em}
  .hint{margin-top:8px}
}
@media (prefers-reduced-motion:reduce){
  .text{animation:none}
}
`;
