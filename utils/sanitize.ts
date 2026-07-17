/**
 * Todo conteudo gerado por usuario (comentarios, descricoes, bio) e
 * renderizado como texto puro pelo React, que ja escapa HTML por
 * padrao - por isso o unico risco real aqui e "sujeira" no dado
 * (espacos redundantes, caracteres de controle invisiveis, whitespace
 * do tipo zero-width usado para burlar filtros de palavra).
 *
 * Se um editor rich-text (dangerouslySetInnerHTML) for adicionado no
 * futuro, o HTML resultante DEVE passar por um sanitizer real (ex:
 * DOMPurify) antes de ser injetado - este util nao e suficiente para
 * esse caso.
 *
 * O regex de caracteres invisiveis e montado a partir de code points
 * numericos (nao literais no arquivo-fonte) para garantir que nenhum
 * byte de controle real acabe commitado neste arquivo.
 */
const INVISIBLE_CODE_POINT_RANGES: Array<[number, number]> = [
  [0x00, 0x08], // C0 controls (antes do tab)
  [0x0b, 0x0c], // vertical tab, form feed
  [0x0e, 0x1f], // resto dos C0 controls
  [0x7f, 0x9f], // DEL + C1 controls
  [0x200b, 0x200f], // zero-width space/joiner/non-joiner + LRM/RLM
  [0xfeff, 0xfeff], // BOM / zero-width no-break space
];

function buildInvisibleCharsRegex(): RegExp {
  const alternation = INVISIBLE_CODE_POINT_RANGES.map(([start, end]) =>
    start === end
      ? `\\u{${start.toString(16)}}`
      : `\\u{${start.toString(16)}}-\\u{${end.toString(16)}}`
  ).join("");
  return new RegExp(`[${alternation}]`, "gu");
}

const INVISIBLE_CHARS_REGEX = buildInvisibleCharsRegex();

export function sanitizePlainText(input: string): string {
  return input
    .replace(INVISIBLE_CHARS_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeMultilineText(input: string): string {
  return input
    .replace(INVISIBLE_CHARS_REGEX, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .trim();
}
