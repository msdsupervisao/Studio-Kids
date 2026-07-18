import { Sparkles, Star, Heart } from "lucide-react";

const SPARKLES = [
  { Icon: Sparkles, top: "18%", left: "8%", size: 22, delay: "0s", spin: true, color: "text-primary" },
  { Icon: Star, top: "60%", left: "18%", size: 16, delay: "0.6s", spin: false, color: "text-accent" },
  { Icon: Heart, top: "22%", left: "88%", size: 18, delay: "1.2s", spin: false, color: "text-destructive/70" },
  { Icon: Star, top: "70%", left: "78%", size: 16, delay: "1.8s", spin: false, color: "text-success" },
  { Icon: Sparkles, top: "55%", left: "52%", size: 18, delay: "0.9s", spin: true, color: "text-primary/80" },
];

/** Faixa decorativa animada no topo do Inicio — bolhas coloridas + brilhos flutuando. */
export function PlayfulBackground() {
  return (
    <div
      aria-hidden
      className="relative -mt-2 mb-2 h-36 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-accent/15 to-success/15 md:h-44"
    >
      <div className="animate-float-a absolute -top-14 -left-10 h-56 w-56 rounded-full bg-primary/40 blur-2xl" />
      <div className="animate-float-b absolute -top-10 right-[-4rem] h-64 w-64 rounded-full bg-accent/45 blur-2xl" />
      <div className="animate-float-c absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-success/40 blur-2xl" />

      {SPARKLES.map(({ Icon, top, left, size, delay, spin, color }, i) => (
        <div key={i} className={`animate-twinkle absolute ${color}`} style={{ top, left, animationDelay: delay }}>
          <Icon className={spin ? "animate-spin-slow" : ""} style={{ width: size, height: size }} strokeWidth={2.5} />
        </div>
      ))}
    </div>
  );
}
