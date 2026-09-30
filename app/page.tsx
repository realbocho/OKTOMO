'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const BEADS = [
  { glyph: '疑', han: '知強當疑，樂讀求之。', eum: '지강당의, 낙독구지.', mean: '내가 아는 강함일지라도 마땅히 의심하며, 오직 강함을 구하기 위해 끊임없이 책을 읽어 살핀다.' },
  { glyph: '行', han: '知而力行，強而無懈。', eum: '지이력행, 강이무해.', mean: '매순간 강함을 추구하여 그것이 삶의 모습과 결과로 드러나게 한다.' },
  { glyph: '問', han: '行有所礙，反問其強。', eum: '행유소애, 반문의강.', mean: '강하게 살아가다 막히는 순간에는 멈추어, 내가 그 상황에서 강함을 무엇이라 정의하고 있었는지 되묻는다.' },
  { glyph: '新', han: '讀思更新，改而更強。', eum: '독사갱신, 개이갱강.', mean: '독서와 사유를 통해 내가 몰랐던 다른 강함을 발견하고, 그것을 더하거나 고쳐 더욱 강해진다.' },
];
const N = BEADS.length;
const mod = (k: number) => ((k % N) + N) % N;

// 원근감 테이블: 중심에서 멀어질수록 작고 흐리고 촘촘하게
const SCALE = [1, 0.5, 0.3, 0.18];
const ALPHA = [1, 0.55, 0.28, 0];
const XPOS = [0, 1, 1.55, 1.9];
const GAP = 2.4;
const interp = (t: number[], a: number) => {
  a = Math.min(a, 3);
  const i = Math.min(Math.floor(a), 2);
  return t[i] + (t[i + 1] - t[i]) * (a - i);
};

function makeTexture(glyph: string) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#1a120c'); g.addColorStop(0.5, '#4d3c2b'); g.addColorStop(1, '#1a120c');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 260; i++) {
    x.strokeStyle = `rgba(255,235,200,${Math.random() * 0.05})`;
    const px = Math.random() * 1024;
    x.beginPath(); x.moveTo(px, 0); x.lineTo(px + (Math.random() - 0.5) * 30, 512); x.stroke();
  }
  x.fillStyle = 'rgba(235,210,165,.85)';
  x.font = '150px "Noto Serif KR","Songti SC",serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(glyph, 256, 256); // u=0.25 → 구슬의 정면(+Z)
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export default function Page() {
  const [pos, setPos] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const reset = useRef<() => void>(() => {});

  const go = useCallback((d: 1 | -1) => {
    navigator.vibrate?.(8);
    setPos((p) => p + d);
  }, []);

  // 글 영역 좌우 스와이프 = 넘기기 (캔버스 드래그는 시점 회전)
  const sw = useRef<number | null>(null);
  const swDown = (e: React.PointerEvent) => { sw.current = e.clientX; };
  const swUp = (e: React.PointerEvent) => {
    if (sw.current === null) return;
    const dx = e.clientX - sw.current; sw.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };
  useEffect(() => { target.current = pos; }, [pos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'r' || e.key === 'R') reset.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const home = new THREE.Vector3(0, 0.6, 9);
    camera.position.copy(home);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffe2b0, 2.4); key.position.set(-3, 4, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8a7a63, 1.4); rim.position.set(4, -2, -5); scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false; controls.enableDamping = true; controls.rotateSpeed = 0.8;
    controls.minDistance = 5; controls.maxDistance = 24;
    reset.current = () => { camera.position.copy(home); controls.target.set(0, 0, 0); controls.update(); };

    // 염주 줄 (구슬 축 = X)
    const string = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 16, 8).rotateZ(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x4a4236, roughness: 0.9 })
    );
    scene.add(string);

    const textures = BEADS.map((b) => makeTexture(b.glyph));
    const geo = new THREE.SphereGeometry(1, 64, 48).rotateZ(Math.PI / 2); // 구멍 축을 X로
    const M = 7;
    const beads = Array.from({ length: M }, () => {
      const mat = new THREE.MeshStandardMaterial({ map: textures[0], roughness: 0.3, metalness: 0.1, transparent: true });
      const m = new THREE.Mesh(geo, mat); scene.add(m); return m;
    });

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      // 세로 화면: 중앙 알 + 양옆 알이 폭에 들어오도록 거리 조정
      home.z = Math.min(Math.max(9, 3.2 / (Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.aspect)), 18);
      reset.current();
    };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    // 탭 = 좌/우 넘기기, 드래그 = 시점 회전
    let down: { x: number; y: number } | null = null;
    const dom = renderer.domElement;
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved < 6) {
        const r = dom.getBoundingClientRect();
        go(e.clientX - r.left < r.width / 2 ? -1 : 1);
      }
    };
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointerup', onUp);

    let cur = 0, last = performance.now(), raf = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      cur += (target.current - cur) * (1 - Math.exp(-dt * 4.2)); // 부드럽게 굴러감

      beads.forEach((m, i) => {
        let d = (((i - cur) % M) + M) % M;
        if (d >= M / 2) d -= M;               // [-3.5, 3.5)
        const k = Math.round(cur + d);          // 가상 인덱스
        const mat = m.material as THREE.MeshStandardMaterial;
        const tex = textures[mod(k)];
        if (mat.map !== tex) { mat.map = tex; mat.needsUpdate = true; }

        const a = Math.abs(d);
        m.position.x = Math.sign(d) * interp(XPOS, a) * GAP;
        m.scale.setScalar(interp(SCALE, a));
        mat.opacity = interp(ALPHA, a);
        m.visible = mat.opacity > 0.01;
        m.rotation.x = d * Math.PI * 2;         // 한 알 이동 = 한 바퀴 굴러감
      });

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointerup', onUp);
      controls.dispose(); geo.dispose(); textures.forEach((t) => t.dispose());
      beads.forEach((b) => (b.material as THREE.Material).dispose());
      renderer.dispose(); el.removeChild(renderer.domElement);
    };
  }, [go]);

  const cur = BEADS[mod(pos)];
  return (
    <main className="stage">
      <style>{css}</style>
      <div className="canvas" ref={host} />
      <div className="zone" onPointerDown={swDown} onPointerUp={swUp}>
        <section className="text" key={mod(pos)} aria-live="polite">
          <p className="han">{cur.han}</p>
          <p className="eum">{cur.eum}</p>
          <p className="mean">{cur.mean}</p>
        </section>
        <nav className="dots" aria-hidden>
          {BEADS.map((_, i) => <i key={i} className={i === mod(pos) ? 'on' : ''} />)}
        </nav>
      </div>
      <button className="reset" onClick={() => reset.current()} aria-label="시점 되돌리기">↺</button>
    </main>
  );
}

const css = `
html,body{margin:0;background:#070707;height:100%;overscroll-behavior:none}
.stage{height:100dvh;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;overflow:hidden;position:relative;
  padding:max(env(safe-area-inset-top),20px) 24px max(env(safe-area-inset-bottom),24px);
  background:radial-gradient(ellipse at 50% 30%,#141414 0%,#070707 72%);color:#cfc9bd;
  font-family:'Noto Serif KR','Nanum Myeongjo','Songti SC',serif;
  user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none}
.canvas{flex:1;min-height:0;width:100%}
.canvas canvas{width:100%;height:100%;display:block;touch-action:none}
.zone{width:100%;padding-top:8px;display:flex;flex-direction:column;align-items:center;gap:28px}
.text{text-align:center;animation:in 1s ease both}
.han{margin:0;font-size:22px;letter-spacing:.24em;color:#e6e0d3;font-weight:300}
.eum{margin:1.4em 0 0;font-size:14px;letter-spacing:.12em;color:#8f887a}
.mean{margin:1.2em 0 0;font-size:13.5px;line-height:1.95;color:#6f695e;word-break:keep-all;min-height:5.9em}
.dots{display:flex;gap:14px}
.dots i{width:4px;height:4px;border-radius:50%;background:#2c2924;transition:background .6s,transform .6s}
.dots i.on{background:#b39a70;transform:scale(1.5)}
.reset{position:absolute;right:8px;top:max(env(safe-area-inset-top),8px);width:44px;height:44px;background:none;border:0;color:#4a443a;font-size:20px}
@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.text{animation:none}}
`;
