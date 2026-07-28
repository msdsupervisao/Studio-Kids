// Mesma paleta "divertida" do PlayfulBackground (components/shared), para
// manter os dois fundos decorativos do app consistentes entre si.
const RING_COLORS = ["#d946ef", "#8b5cf6", "#06b6d4", "#6366f1"];

// Cada anel cresce do centro para fora em loop (ver @keyframes tunnel-ring em
// globals.css), com atraso negativo para ja comecar em pontos diferentes do
// ciclo — sem isso, todos os aneis pulsariam em sincronia em vez de dar a
// sensacao continua de "voar por um tunel".
const RINGS = Array.from({ length: 7 }, (_, i) => ({
  color: RING_COLORS[i % RING_COLORS.length],
  delay: -(i * (5.6 / 7)),
}));

/**
 * Fundo decorativo animado para a tela de boas-vindas (onboarding) —
 * aneis coloridos crescendo do centro, como voar por um tunel em
 * perspectiva. Puramente visual: aria-hidden, pointer-events-none, atras
 * do conteudo (-z-10). Respeita prefers-reduced-motion (regra global em
 * globals.css trava a duracao de toda animacao da pagina).
 */
export function TunnelBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-2xl"
        style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 65%)" }}
      />
      {RINGS.map((ring, i) => (
        <div
          key={i}
          className="animate-tunnel-ring absolute left-1/2 top-1/2 aspect-square w-[55%] rounded-[18%] border-[3px]"
          style={{
            borderColor: ring.color,
            boxShadow: `0 0 24px 0 ${ring.color}`,
            animationDuration: "5.6s",
            animationDelay: `${ring.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
