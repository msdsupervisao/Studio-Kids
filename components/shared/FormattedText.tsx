import { Fragment } from "react";

/**
 * Suporte minimo a **negrito** e linhas de lista ("* item") em texto
 * gerado por usuario (bio de canal, descricao de video) - o bastante
 * pra texto colado de IA nao aparecer com asteriscos crus na tela.
 * Nao usa dangerouslySetInnerHTML (sem risco de HTML injetado); nao e
 * um parser de markdown completo de proposito.
 */
function renderInline(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

export function FormattedText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n").map((line) => line.replace(/^\s*[*-]\s+/, "• "));

  return (
    <p className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderInline(line, String(i))}
        </Fragment>
      ))}
    </p>
  );
}
