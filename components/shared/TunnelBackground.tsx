"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Fundo animado em tela cheia para a tela de boas-vindas (onboarding) —
 * tunel 3D em perspectiva com grade e paineis coloridos/fotos passando
 * pelas "paredes", como voar por um corredor infinito. Adaptado do
 * componente Gallery Tunnel (originkit.dev — codigo original usa Three.js
 * real, nao CSS): removida a interacao por cursor/label ("Press to
 * Start") e o carregamento de imagens externas do CDN deles, trocado por
 * fotos proprias em /public/images/tunnel. Puramente visual: aria-hidden,
 * pointer-events-none, atras do conteudo (-z-10).
 */

const IMAGE_URLS = [
  "/images/tunnel/tunnel-banner-msd.jpg",
  "/images/tunnel/tunnel-mascote-equipe.jpg",
  "/images/tunnel/tunnel-mascote-robotica.jpg",
  "/images/tunnel/tunnel-mascote-palco.jpg",
  "/images/tunnel/tunnel-professor-ia.jpg",
  "/images/tunnel/tunnel-photo-1.jpg",
  "/images/tunnel/tunnel-photo-2.jpg",
  "/images/tunnel/tunnel-photo-3.jpg",
  "/images/tunnel/tunnel-photo-4.jpg",
  "/images/tunnel/tunnel-photo-gato.jpg",
];

// Valores exatos do preset "Gallery Tunnel" de referencia.
const BACKGROUND = "#000000";
const LINE_COLOR = "#B0B0B0";
const LINE_OPACITY = 50;
const PANEL_COLORS = ["#FF6A00", "#AB54F7", "#EA3737", "#0072E3", "#00AA3C", "#FFB200"];
const GRID = 4;
const SPEED = 100;
const FADE = 100;

const TUNNEL_WIDTH = 2;
const TUNNEL_HEIGHT = 1.8;
const SEGMENT_DEPTH = 1;
const NUM_SEGMENTS = 15;
const LINE_RADIUS = 0.003;
const SCROLL_TO_Z = 0.05;
const CAMERA_CHASE = 0.1;
const FADE_IN = 1;
const FOG_FAR = NUM_SEGMENTS * SEGMENT_DEPTH * 0.95;

// prefers-reduced-motion: em vez de remover a animacao (a regra global em
// globals.css so cobre @keyframes CSS, nao o loop requestAnimationFrame
// daqui), reduz drasticamente a velocidade — ainda mostra o efeito, sem o
// movimento continuo que incomoda quem tem sensibilidade vestibular.
const REDUCED_MOTION_FACTOR = 0.06;

export function TunnelBackground() {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    // Painel temporario de diagnostico — so aparece com ?tunnel_debug=1 na
    // URL, pra investigar lentidao relatada num aparelho que nao consigo
    // testar diretamente. Remover depois de confirmado o problema real.
    // Mutacao direta de estilo (nao React state) pra nao arriscar
    // divergencia entre a renderizacao no servidor e no cliente.
    const debugEnabled = new URLSearchParams(window.location.search).has("tunnel_debug");
    const debugEl = debugEnabled ? debugRef.current : null;
    if (debugEl) debugEl.style.display = "block";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speedFactor = (Math.max(0, SPEED) / 100) * (reducedMotion ? REDUCED_MOTION_FACTOR : 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUND);

    const fogNear = Math.min(FOG_FAR * (1 - Math.min(100, Math.max(0, FADE)) / 100), FOG_FAR - 0.01);
    scene.fog = new THREE.Fog(new THREE.Color(BACKGROUND), fogNear, FOG_FAR);

    const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
    camera.position.set(0, 0, 0);

    // Sem antialias: agora que o tunel ocupa a coluna inteira (bem mais
    // pixels que o box menor de antes), MSAA passou a ter custo real de
    // GPU — as bordas dos paineis em movimento nao ficam visivelmente
    // serrilhadas mesmo assim, o efeito de velocidade ja borra os contornos.
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Sem aceleracao real de GPU (driver bloqueado, maquina virtual sem
    // passthrough, etc.) o navegador cai pro renderizador por software —
    // nesse caso QUALQUER cena 3D fica pesada, nao importa quanto se
    // simplifique a geometria. Em vez de arriscar travar a pagina, desiste
    // cedo e mostra so o fundo escuro estatico (sem o efeito de tunel).
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const rendererName = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : "";
    const isSoftwareRenderer = /swiftshader|llvmpipe|software|basic render driver/i.test(rendererName);
    if (debugEl) {
      debugEl.textContent = `renderer: ${rendererName || "(sem info)"}\nsoftware: ${isSoftwareRenderer}`;
    }

    if (isSoftwareRenderer) {
      canvas.style.display = "none";
      frame.style.backgroundColor = BACKGROUND;
      renderer.dispose();
      return;
    }

    const lineMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(LINE_COLOR),
      transparent: true,
      opacity: Math.min(100, Math.max(0, LINE_OPACITY)) / 100,
    });

    const loader = new THREE.TextureLoader();
    const fading: THREE.MeshBasicMaterial[] = [];

    let imageIndex = 0;
    let colorIndex = 0;
    let populateIndex = 0;
    let scrollPos = 0;
    let raf = 0;
    let last = 0;
    let alive = true;

    const hw = TUNNEL_WIDTH / 2;
    const hh = TUNNEL_HEIGHT / 2;

    const cols = Math.max(1, Math.round(GRID));
    const rows = Math.max(1, Math.round(GRID));
    const colW = TUNNEL_WIDTH / cols;
    const rowH = TUNNEL_HEIGHT / rows;

    const geoFloor = new THREE.PlaneGeometry(colW, SEGMENT_DEPTH);
    const geoWall = new THREE.PlaneGeometry(SEGMENT_DEPTH, rowH);

    const geoTubeZ = new THREE.TubeGeometry(
      new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -SEGMENT_DEPTH)),
      1,
      LINE_RADIUS,
      8
    );
    const geoTubeX = new THREE.TubeGeometry(
      new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(TUNNEL_WIDTH, 0, 0)),
      1,
      LINE_RADIUS,
      8
    );
    const geoTubeY = new THREE.TubeGeometry(
      new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, TUNNEL_HEIGHT, 0)),
      1,
      LINE_RADIUS,
      8
    );

    const colorMats = PANEL_COLORS.map(
      (hex) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex), side: THREE.DoubleSide })
    );

    const imageMats = IMAGE_URLS.map((url) => {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
      loader.load(
        url,
        (tex) => {
          if (!alive) {
            tex.dispose();
            return;
          }
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          tex.colorSpace = THREE.SRGBColorSpace;
          mat.map = tex;
          mat.needsUpdate = true;
          fading.push(mat);
        },
        undefined,
        () => {
          // Uma URL quebrada custa um painel em branco, nao o tunel inteiro.
        }
      );
      return mat;
    });

    const tube = (geo: THREE.BufferGeometry, x: number, y: number, z = 0) => {
      const m = new THREE.Mesh(geo, lineMaterial);
      m.position.set(x, y, z);
      return m;
    };

    const SLOTS: Array<{ geo: THREE.BufferGeometry; pos: THREE.Vector3; rot: THREE.Euler }> = [];
    {
      const z = -SEGMENT_DEPTH / 2;
      for (let i = 0; i < cols; i++) {
        const x = -hw + i * colW + colW / 2;
        SLOTS.push({ geo: geoFloor, pos: new THREE.Vector3(x, -hh, z), rot: new THREE.Euler(-Math.PI / 2, 0, 0) });
        SLOTS.push({ geo: geoFloor, pos: new THREE.Vector3(x, hh, z), rot: new THREE.Euler(Math.PI / 2, 0, 0) });
      }
      for (let i = 0; i < rows; i++) {
        const y = -hh + i * rowH + rowH / 2;
        SLOTS.push({ geo: geoWall, pos: new THREE.Vector3(-hw, y, z), rot: new THREE.Euler(0, Math.PI / 2, 0) });
        SLOTS.push({ geo: geoWall, pos: new THREE.Vector3(hw, y, z), rot: new THREE.Euler(0, -Math.PI / 2, 0) });
      }
    }

    function populate(group: THREE.Group) {
      const takesSlabs = populateIndex % 2 === 0;
      populateIndex++;
      const slabs = group.userData.slabs as THREE.Mesh[];

      for (const slab of slabs) {
        if (!takesSlabs || Math.random() > 0.5) {
          slab.visible = false;
          continue;
        }
        slab.visible = true;
        if (Math.random() > 0.5) {
          // Modulo por .length garante indice sempre valido — noUncheckedIndexedAccess
          // e quem exige o "as", nao ha risco real de leitura fora da faixa.
          slab.material = colorMats[(5 * colorIndex) % colorMats.length] as THREE.MeshBasicMaterial;
          colorIndex++;
        } else {
          slab.material = imageMats[(3 * imageIndex) % imageMats.length] as THREE.MeshBasicMaterial;
          imageIndex++;
        }
      }
    }

    function createSegment(z: number) {
      const group = new THREE.Group();
      group.position.z = z;

      for (let i = 0; i <= cols; i++) {
        const x = -hw + i * colW;
        group.add(tube(geoTubeZ, x, -hh));
        group.add(tube(geoTubeZ, x, hh));
      }
      for (let i = 1; i < rows; i++) {
        const y = -hh + i * rowH;
        group.add(tube(geoTubeZ, -hw, y));
        group.add(tube(geoTubeZ, hw, y));
      }
      group.add(tube(geoTubeX, -hw, -hh));
      group.add(tube(geoTubeX, -hw, hh));
      group.add(tube(geoTubeY, -hw, -hh));
      group.add(tube(geoTubeY, hw, -hh));

      const slabs: THREE.Mesh[] = SLOTS.map((slot) => {
        const m = new THREE.Mesh(slot.geo, colorMats[0]);
        m.position.copy(slot.pos);
        m.rotation.copy(slot.rot);
        m.visible = false;
        group.add(m);
        return m;
      });
      group.userData.slabs = slabs;

      populate(group);
      return group;
    }

    const segments: THREE.Group[] = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const g = createSegment(-i * SEGMENT_DEPTH);
      scene.add(g);
      segments.push(g);
    }

    const resize = () => {
      const w = Math.max(1, frame.clientWidth);
      const h = Math.max(1, frame.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(frame);
    resize();

    // Reduzir poligonos/desligar antialias so ajuda ate certo ponto — numa
    // GPU integrada antiga (ex: Intel HD 4600, ~2013) mesmo a cena
    // simplificada pode nao rodar liso, e o problema pode so aparecer
    // depois de alguns segundos (outros apps disputando CPU/GPU, por
    // exemplo). Por isso o monitoramento roda por toda a vida do
    // componente, nao so no arranque: janela deslizante das ultimas
    // FRAME_WINDOW amostras, reavaliada a cada frame.
    const FRAME_WINDOW = 30;
    const SLOW_FRAME_MS_THRESHOLD = 45; // ~22fps medio
    const CATASTROPHIC_FRAME_MS = 350; // um unico frame assim ja indica trava real
    const frameDurations: number[] = [];
    let frameDurationSum = 0;

    const fallBackToStatic = (reason: string) => {
      alive = false;
      cancelAnimationFrame(raf);
      // O buffer do canvas fica opaco com o ultimo frame desenhado (alpha:
      // false) — esconder o canvas e pintar o fundo escuro solido no
      // wrapper (nao no canvas: um background-color de canvas so aparece
      // atras de pixels transparentes, e nao ha nenhum aqui) da o visual
      // limpo de "sem tunel" em vez de deixar o ultimo frame congelado.
      canvas.style.display = "none";
      frame.style.backgroundColor = BACKGROUND;
      if (debugEl) debugEl.textContent += `\nFALLBACK: ${reason}`;
      ro.disconnect();
      geoFloor.dispose();
      geoWall.dispose();
      geoTubeZ.dispose();
      geoTubeX.dispose();
      geoTubeY.dispose();
      for (const m of colorMats) m.dispose();
      for (const m of imageMats) {
        m.map?.dispose();
        m.dispose();
      }
      lineMaterial.dispose();
      renderer.dispose();
    };

    const animate = (now: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(animate);
      const isFirstFrame = !last;
      const rawMs = last ? now - last : 16;
      const dt = last ? Math.min(rawMs / 1000, 1 / 30) : 1 / 60;
      last = now;

      if (!isFirstFrame && !document.hidden) {
        if (rawMs > CATASTROPHIC_FRAME_MS) {
          fallBackToStatic(`frame unico de ${rawMs.toFixed(0)}ms`);
          return;
        }
        frameDurations.push(rawMs);
        frameDurationSum += rawMs;
        if (frameDurations.length > FRAME_WINDOW) {
          frameDurationSum -= frameDurations.shift() as number;
        }
        if (frameDurations.length === FRAME_WINDOW && frameDurationSum / FRAME_WINDOW > SLOW_FRAME_MS_THRESHOLD) {
          fallBackToStatic(`media de ${(frameDurationSum / FRAME_WINDOW).toFixed(0)}ms/frame`);
          return;
        }
      }

      if (debugEl && !isFirstFrame) {
        const avg = frameDurations.length ? frameDurationSum / frameDurations.length : 0;
        debugEl.textContent = `renderer: ${rendererName || "(sem info)"}\nhidden: ${document.hidden}\nrawMs: ${rawMs.toFixed(0)}\navgMs(${frameDurations.length}): ${avg.toFixed(1)}\nfps~: ${(1000 / Math.max(1, avg)).toFixed(0)}`;
      }

      scrollPos += speedFactor;

      const want = -SCROLL_TO_Z * scrollPos;
      camera.position.z += CAMERA_CHASE * (want - camera.position.z);

      const span = NUM_SEGMENTS * SEGMENT_DEPTH;
      const z = camera.position.z;
      for (const seg of segments) {
        if (seg.position.z > z + SEGMENT_DEPTH) {
          let min = 0;
          for (const s of segments) min = Math.min(min, s.position.z);
          seg.position.z = min - SEGMENT_DEPTH;
          populate(seg);
        } else if (seg.position.z < z - span - SEGMENT_DEPTH) {
          let max = -999999;
          for (const s of segments) max = Math.max(max, s.position.z);
          seg.position.z = max + SEGMENT_DEPTH;
          populate(seg);
        }
      }

      for (let i = fading.length - 1; i >= 0; i--) {
        const m = fading[i] as THREE.MeshBasicMaterial;
        m.opacity = Math.min(1, m.opacity + dt / FADE_IN);
        if (m.opacity >= 1) fading.splice(i, 1);
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    // Aba oculta (troca de aba, minimizado) faz o navegador suspender o
    // rAF por conta propria — o que e o comportamento certo (economiza
    // bateria/CPU), mas sem isso o PRIMEIRO frame ao voltar veria um
    // intervalo gigante (minutos, quem sabe) e seria lido erroneamente
    // como travamento real, desligando o tunel a toa. Zera a referencia
    // de tempo ao voltar para nao confundir uma pausa legitima com
    // renderizacao lenta.
    const onVisibilityChange = () => {
      if (!document.hidden) last = 0;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);

      geoFloor.dispose();
      geoWall.dispose();
      geoTubeZ.dispose();
      geoTubeX.dispose();
      geoTubeY.dispose();
      for (const m of colorMats) m.dispose();
      for (const m of imageMats) {
        m.map?.dispose();
        m.dispose();
      }
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div ref={frameRef} className="h-full w-full">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <pre
        ref={debugRef}
        style={{ display: "none" }}
        className="pointer-events-none absolute bottom-2 left-2 z-50 whitespace-pre-wrap rounded bg-black/80 p-2 font-mono text-[10px] leading-tight text-lime-400"
      />
    </div>
  );
}
