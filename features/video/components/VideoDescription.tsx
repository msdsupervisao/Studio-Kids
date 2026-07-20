"use client";

import { useState } from "react";
import { formatCompactNumber, formatRelativeDate } from "@/utils/format";

export function VideoDescription({
  description,
  viewsCount,
  publishedAt,
}: {
  description: string;
  viewsCount: number;
  publishedAt: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className="focus-ring w-full rounded-xl bg-secondary p-4 text-left text-sm text-secondary-foreground"
      aria-expanded={expanded}
    >
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {formatCompactNumber(viewsCount)} visualizacoes
        {publishedAt && <> · {formatRelativeDate(publishedAt)}</>}
      </p>
      <p className={expanded ? "whitespace-pre-wrap" : "line-clamp-2 whitespace-pre-wrap"}>{description}</p>
      <span className="mt-2 inline-block text-xs font-semibold text-foreground">
        {expanded ? "Mostrar menos" : "Mostrar mais"}
      </span>
    </button>
  );
}
