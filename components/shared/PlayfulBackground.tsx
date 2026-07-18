import { Sparkles, Star, Heart } from "lucide-react";

const SPARKLES = [
  { Icon: Sparkles, top: "2%", left: "10%", size: 20, delay: "0s", spin: true, color: "text-primary/70" },
  { Icon: Star, top: "6%", left: "45%", size: 14, delay: "0.6s", spin: false, color: "text-accent/80" },
  { Icon: Heart, top: "1%", left: "78%", size: 16, delay: "1.2s", spin: false, color: "text-destructive/60" },
  { Icon: Star, top: "30%", left: "92%", size: 14, delay: "1.8s", spin: false, color: "text-success/70" },
  { Icon: Sparkles, top: "45%", left: "3%", size: 18, delay: "0.9s", spin: true, color: "text-primary/60" },
  { Icon: Heart, top: "70%", left: "94%", size: 16, delay: "2.4s", spin: false, color: "text-accent/70" },
  { Icon: Star, top: "85%", left: "8%", size: 14, delay: "0.3s", spin: false, color: "text-success/60" },
];

/**
 * Fundo decorativo animado — absolute/atras de tudo (-z-10, pointer-events-none),
 * nao ocupa espaco no layout nem desloca nenhum outro elemento da pagina.
 */
export function PlayfulBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="animate-float-a absolute -top-20 -left-20 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
      <div className="animate-float-b absolute top-[-4rem] right-[-5rem] h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
      <div className="animate-float-c absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-success/20 blur-3xl" />
      <div className="animate-float-b absolute bottom-[-6rem] left-[-4rem] h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      <div className="animate-float-a absolute right-[-3rem] bottom-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      {SPARKLES.map(({ Icon, top, left, size, delay, spin, color }, i) => (
        <div key={i} className={`animate-twinkle absolute ${color}`} style={{ top, left, animationDelay: delay }}>
          <Icon className={spin ? "animate-spin-slow" : ""} style={{ width: size, height: size }} strokeWidth={2.5} />
        </div>
      ))}
    </div>
  );
}
