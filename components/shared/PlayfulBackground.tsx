const PARTICLE_COLORS = ["#d946ef", "#8b5cf6", "#06b6d4", "#6366f1"];
const PARTICLE_COUNT = 40;

/** PRNG determinístico (mesma sequência sempre) — evita mismatch de hidratação entre servidor e cliente. */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(42);
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const size = 2 + random() * 4;
  return {
    left: random() * 100,
    top: random() * 100,
    size,
    opacity: 0.3 + random() * 0.6,
    duration: 6 + random() * 10,
    delay: -random() * 12,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  };
});

/**
 * Fundo decorativo com particulas flutuando — absolute/atras de tudo
 * (-z-10, pointer-events-none), nao ocupa espaco no layout.
 */
export function PlayfulBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="animate-particle-float absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
