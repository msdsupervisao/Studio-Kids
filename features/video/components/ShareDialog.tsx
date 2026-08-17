"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Facebook, Mail, MessageCircle, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function shareTargets(url: string, text: string) {
  return [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      className: "bg-[#25D366]",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      className: "bg-[#1877F2]",
    },
    {
      name: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      className: "bg-black",
    },
    {
      name: "E-mail",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      className: "bg-muted-foreground",
    },
  ];
}

export function ShareDialog({ url, title, trigger }: { url: string; title: string; trigger: ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponivel (permissao negada); sem feedback de erro por ser baixo risco.
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Compartilhar</DialogTitle>
        </DialogHeader>
        <div className="flex justify-between gap-2">
          {shareTargets(url, title).map(({ name, icon: Icon, href, className }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring flex flex-col items-center gap-1.5 rounded-lg text-xs text-muted-foreground"
            >
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-full text-white", className)}>
                <Icon className="h-5 w-5" />
              </span>
              {name}
            </a>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-input bg-secondary/50 px-3 py-2">
          <input
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="flex-1 truncate bg-transparent text-xs text-foreground outline-none"
          />
          <Button type="button" size="sm" variant="secondary" onClick={copyLink} className="shrink-0 gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
