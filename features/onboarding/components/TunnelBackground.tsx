// Paleta vibrante para os paineis do tunel — mais variada que o
// PlayfulBackground de proposito, para reproduzir o efeito de referencia
// (varias cores fortes passando pelas "paredes"), nao so o roxo da marca.
const PANEL_COLORS = ["#fb7185", "#f59e0b", "#a3e635", "#22d3ee", "#818cf8", "#e879f9"];

// Cada anel cresce do centro para fora em loop (ver @keyframes tunnel-ring em
// globals.css), com atraso negativo para ja comecar em pontos diferentes do
// ciclo — sem isso, todos os aneis pulsariam em sincronia em vez de dar a
// sensacao continua de "voar por um tunel". Poucos aneis + paineis pequenos
// deixam a grade (a estrutura do tunel) ser o elemento principal, com a cor
// como destaque — nao o contrario.
const RING_COUNT = 5;
const CYCLE_SECONDS = 8;

// PANEL_COLORS.length nunca e 0 — indexacao sempre em faixa, o "as string"
// so contorna o noUncheckedIndexedAccess do tsconfig.
function colorAt(n: number): string {
  return PANEL_COLORS[n % PANEL_COLORS.length] as string;
}

const RINGS = Array.from({ length: RING_COUNT }, (_, i) => ({
  colors: [colorAt(i * 2), colorAt(i * 2 + 3), colorAt(i * 2 + 1), colorAt(i * 2 + 4)] as const,
  delay: -(i * (CYCLE_SECONDS / RING_COUNT)),
}));

/** Pequeno bloco colorido colado numa borda do anel, simulando um painel na "parede" do tunel. */
function EdgePanel({ color, side }: { color: string; side: "top" | "bottom" | "left" | "right" }) {
  const positions = {
    top: "left-[34%] top-0 h-[4%] w-[14%] -translate-y-1/2",
    bottom: "bottom-0 left-[52%] h-[4%] w-[14%] translate-y-1/2",
    left: "left-0 top-[34%] h-[14%] w-[4%] -translate-x-1/2",
    right: "right-0 top-[52%] h-[14%] w-[4%] translate-x-1/2",
  } as const;
  return <div className={`absolute rounded-sm ${positions[side]}`} style={{ backgroundColor: color }} />;
}

/**
 * Fundo animado em tela cheia para a tela de boas-vindas (onboarding) —
 * grade em perspectiva com aneis retangulares crescendo do centro e
 * paineis coloridos nas "paredes", como voar por um tunel. Inspirado no
 * componente Gallery Tunnel (originkit.dev), recriado em CSS puro (sem
 * nova dependencia) para caber no bundle atual do app. Puramente visual:
 * aria-hidden, pointer-events-none, atras do conteudo (-z-10). Respeita
 * prefers-reduced-motion (regra global em globals.css trava a duracao de
 * qualquer animacao da pagina).
 */
export function TunnelBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#0a0714]">
      <div
        className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
      />

      {/* Duas diagonais de canto a canto, cruzando no centro — a "linha de fuga" classica de perspectiva de 1 ponto. */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeOpacity="0.18" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="white" strokeOpacity="0.18" vectorEffect="non-scaling-stroke" />
      </svg>

      {RINGS.map((ring, i) => (
        <div
          key={i}
          className="animate-tunnel-ring absolute left-1/2 top-1/2 h-[85%] w-[85%] border border-white/40"
          style={{ animationDuration: `${CYCLE_SECONDS}s`, animationDelay: `${ring.delay}s` }}
        >
          <EdgePanel color={ring.colors[0]} side="top" />
          <EdgePanel color={ring.colors[1]} side="right" />
          <EdgePanel color={ring.colors[2]} side="bottom" />
          <EdgePanel color={ring.colors[3]} side="left" />
        </div>
      ))}
    </div>
  );
}
