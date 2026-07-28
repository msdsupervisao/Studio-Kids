"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { ROUTES } from "@/lib/constants";
import { formatViews } from "@/utils/format";
import type { VideoCardData } from "@/types/video.types";

/**
 * Carrossel "coverflow" para os vídeos em destaque da home — o item ativo é
 * um card grande centralizado, os demais viram fatias finas dos lados.
 * Adaptado do componente Coverflow Carousel (originkit.dev, feito para
 * Framer): removido o stub de RenderTarget/export-thumbnail (nesta app
 * sempre está "ao vivo", nunca em canvas de export), e a navegação por
 * clique agora leva pro vídeo de verdade em vez de so trocar o item ativo.
 *
 * Mantém a mecânica original do autor: um unico MotionValue `pos` dirigido
 * por requestAnimationFrame comanda posição E tamanho de cada card (cresce
 * exatamente ao chegar no centro), sem re-render do React a cada frame.
 */

const RENDER_RANGE = 6;
const SIZING = { activeWidth: 640, activeHeight: 360, restWidth: 130, restHeight: 360 };
const GAP = 20;
const RADIUS = 2;
const MOVE_DURATION_SECONDS = 0.5;
const AUTOPLAY_DWELL_SECONDS = 3.5;

function relOf(index: number, pos: number, count: number): number {
  let rel = (((index - pos) % count) + count) % count;
  if (rel > count / 2) rel -= count;
  return rel;
}

function xForRel(rel: number, gap: number): number {
  const ar = Math.abs(rel);
  const c1 = SIZING.activeWidth / 2 + gap + SIZING.restWidth / 2;
  const pitch = SIZING.restWidth + gap;
  const mag = ar <= 1 ? ar * c1 : c1 + (ar - 1) * pitch;
  return (rel < 0 ? -1 : 1) * mag;
}

function blendForRel(rel: number): number {
  return Math.min(Math.abs(rel), 1);
}

function VideoCoverCard({
  video,
  index,
  pos,
  count,
  R,
  onSelect,
}: {
  video: VideoCardData;
  index: number;
  pos: MotionValue<number>;
  count: number;
  R: number;
  onSelect: (index: number) => void;
}) {
  const x = useTransform(pos, (p: number) => xForRel(relOf(index, p, count), GAP));
  const opacity = useTransform(pos, (p: number) => {
    const ar = Math.abs(relOf(index, p, count));
    return ar <= R ? 1 : ar >= R + 1 ? 0 : 1 - (ar - R);
  });
  const zIndex = useTransform(pos, (p: number) => Math.round(1000 - Math.abs(relOf(index, p, count)) * 100));
  const width = useTransform(pos, (p: number) => {
    const a = blendForRel(relOf(index, p, count));
    return SIZING.activeWidth + (SIZING.restWidth - SIZING.activeWidth) * a;
  });
  const height = useTransform(pos, (p: number) => {
    const a = blendForRel(relOf(index, p, count));
    return SIZING.activeHeight + (SIZING.restHeight - SIZING.activeHeight) * a;
  });
  const borderRadius = useTransform(pos, (p: number) => {
    const a = blendForRel(relOf(index, p, count));
    const w = SIZING.activeWidth + (SIZING.restWidth - SIZING.activeWidth) * a;
    const h = SIZING.activeHeight + (SIZING.restHeight - SIZING.activeHeight) * a;
    return (Math.max(0, Math.min(20, RADIUS)) / 20 + 0.6) * (Math.min(w, h) / 2);
  });
  const detailsOpacity = useTransform(pos, (p: number) => (Math.abs(relOf(index, p, count)) < 0.15 ? 1 : 0));

  return (
    <motion.div
      onClick={() => onSelect(index)}
      style={{ position: "absolute", left: "50%", top: "50%", x, zIndex, opacity, cursor: "pointer" }}
    >
      <motion.div
        style={{
          x: "-50%",
          y: "-50%",
          width,
          height,
          borderRadius,
          overflow: "hidden",
          background: "var(--color-secondary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
        className="relative"
      >
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- tamanho dirigido por MotionValue, incompativel com next/image
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
            Sem miniatura
          </div>
        )}
        <motion.div
          style={{ opacity: detailsOpacity }}
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-10"
        >
          <p className="line-clamp-1 text-sm font-semibold text-white">{video.title}</p>
          <p className="text-xs text-white/80">
            {video.channel.name} · {formatViews(video.viewsCount)}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function VideoCoverflow({ videos }: { videos: VideoCardData[] }) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const count = videos.length;

  const R = Math.max(1, Math.min(RENDER_RANGE, Math.floor(count / 2) - 1 || 1));

  const pos = useMotionValue(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number | null>(null);
  const autoplayingRef = useRef(true);
  const dwellAccRef = useRef(0);
  const hoveredRef = useRef(false);
  const reducedRef = useRef(prefersReducedMotion);
  reducedRef.current = prefersReducedMotion;

  const tick = useCallback(
    (t: number) => {
      const last = lastTRef.current ?? t;
      const dt = Math.min((t - last) / 1000, 1 / 30);
      lastTRef.current = t;

      const cur = pos.get();
      const diff = targetRef.current - cur;
      const step = (1 / MOVE_DURATION_SECONDS) * dt;
      const arriving = reducedRef.current || Math.abs(diff) <= step;

      if (arriving) {
        pos.set(targetRef.current);
        if (autoplayingRef.current && !hoveredRef.current) {
          dwellAccRef.current += dt;
          if (dwellAccRef.current >= AUTOPLAY_DWELL_SECONDS) {
            dwellAccRef.current = 0;
            targetRef.current += 1;
          }
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      pos.set(cur + Math.sign(diff) * step);
      rafRef.current = requestAnimationFrame(tick);
    },
    [pos]
  );

  const ensureRunning = useCallback(() => {
    if (rafRef.current == null) {
      lastTRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  useEffect(() => {
    if (count > 1) ensureRunning();
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [ensureRunning, count]);

  const goTo = useCallback(
    (index: number) => {
      const activeIndex = ((Math.round(pos.get()) % count) + count) % count;
      if (index === activeIndex) {
        const video = videos[index];
        if (video) router.push(ROUTES.video(video.id));
        return;
      }
      const cur = targetRef.current;
      let d = index - cur;
      d = ((d % count) + count) % count;
      if (d > count / 2) d -= count;
      targetRef.current = cur + d;
      dwellAccRef.current = 0;
      ensureRunning();
    },
    [pos, count, videos, router, ensureRunning]
  );

  const cards = useMemo(
    () =>
      videos.map((video, i) => (
        <VideoCoverCard key={video.id} video={video} index={i} pos={pos} count={count} R={R} onSelect={goTo} />
      )),
    [videos, pos, count, R, goTo]
  );

  if (count === 0) return null;

  return (
    <div
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
      className="relative h-[380px] w-full overflow-hidden"
    >
      <div style={{ position: "absolute", inset: 0, isolation: "isolate" }}>{cards}</div>
    </div>
  );
}
