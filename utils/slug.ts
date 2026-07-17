/** Remove acentos/diacriticos preservando o restante da string. */
function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** "Introducao a React Hooks!" -> "introducao-a-react-hooks" */
export function slugify(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Garante slug unico anexando um sufixo curto quando ja existe. */
export function slugifyWithSuffix(input: string, suffix: string): string {
  const base = slugify(input);
  return `${base}-${suffix.toLowerCase()}`;
}
