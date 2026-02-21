export interface MarkdownSection {
  heading: string;
  content: string;
}

/**
 * Build a structured markdown document with a title, metadata block, sections,
 * and an optional footer.
 *
 * Produces the format used by the finding and asset documentation tools:
 *
 * ```
 * # Title
 *
 * **Key:** Value
 * **Key:** Value
 *
 * ## Section Heading
 *
 * Section content...
 *
 * ---
 *
 * *Footer text*
 * ```
 */
export function buildMarkdownDocument(
  title: string,
  metadata: Record<string, string>,
  sections: MarkdownSection[],
  footer?: string,
): string {
  const parts: string[] = [];

  // Title
  parts.push(`# ${title}`);

  // Metadata block — each line has trailing double-space for markdown line
  // breaks, except the last line which has none.
  const metaEntries = Object.entries(metadata);
  if (metaEntries.length > 0) {
    const metaLines = metaEntries.map(([key, value], i) => {
      const trailing = i < metaEntries.length - 1 ? "  " : "";
      return `**${key}:** ${value}${trailing}`;
    });
    parts.push(metaLines.join("\n"));
  }

  // Sections
  for (const section of sections) {
    parts.push(`## ${section.heading}\n\n${section.content}`);
  }

  // Footer
  if (footer) {
    parts.push(`---\n\n${footer}`);
  }

  return parts.join("\n\n") + "\n";
}
