export function normalizeStoryText(text: string): string {
  return text
    .normalize("NFC")
    .replace(
      /(?<![\p{L}])`[^`\r\n]+`(?![\p{L}])|([\p{L}]*[aeiouyăâêôơư])`(?=[\p{L}]|[^\p{L}`]|$)/giu,
      (match, prefix: string | undefined) => {
        // A stray grave after an untoned Vietnamese vowel is a misplaced huyền.
        if (!prefix || !/[ăâêôơưđ]/iu.test(prefix) || /[\u0300\u0301\u0303\u0309\u0323]/u.test(prefix.normalize("NFD"))) {
          return match;
        }
        return (prefix + "\u0300").normalize("NFC");
      }
    );
}

export function normalizeStoryFields<T extends { title: string; author?: string; description?: string; content?: string }>(entry: T): T {
  return {
    ...entry,
    title: normalizeStoryText(entry.title),
    ...(typeof entry.author === "string" && { author: normalizeStoryText(entry.author) }),
    ...(typeof entry.description === "string" && { description: normalizeStoryText(entry.description) }),
    ...(typeof entry.content === "string" && { content: normalizeStoryText(entry.content) }),
  };
}
