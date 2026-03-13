import { readFileSync, existsSync } from "fs";
import { expandPath } from "./denote";

export interface BibEntry {
  key: string;
  type: string;
  title: string;
  author: string;
  year: string;
  journal?: string;
  booktitle?: string;
  file?: string;
  doi?: string;
  url?: string;
}

/** Parse a BibTeX file into entries. Lightweight regex-based parser. */
export function parseBibFile(bibPath: string): BibEntry[] {
  const expanded = expandPath(bibPath);
  if (!existsSync(expanded)) return [];

  const content = readFileSync(expanded, "utf-8");
  const entries: BibEntry[] = [];

  // Match each @type{key, ... } block
  const entryRegex = /@(\w+)\{([^,]+),([^@]*?)(?=\n@|\n*$)/gs;
  let match;

  while ((match = entryRegex.exec(content)) !== null) {
    const [, type, key, body] = match;
    if (type.toLowerCase() === "comment" || type.toLowerCase() === "preamble")
      continue;

    const getField = (name: string): string => {
      const fieldRegex = new RegExp(`${name}\\s*=\\s*[{"](.+?)[}"]`, "si");
      const m = body.match(fieldRegex);
      return m ? m[1].replace(/[{}]/g, "").trim() : "";
    };

    entries.push({
      key: key.trim(),
      type: type.toLowerCase(),
      title: getField("title"),
      author: getField("author"),
      year: getField("year") || getField("date")?.slice(0, 4) || "",
      journal: getField("journal") || undefined,
      booktitle: getField("booktitle") || undefined,
      file: getField("file") || undefined,
      doi: getField("doi") || undefined,
      url: getField("url") || undefined,
    });
  }

  return entries;
}

/** Extract PDF path from bib file field. Handles Zotero-style and plain paths. */
export function extractPdfPath(fileField: string | undefined): string | null {
  if (!fileField) return null;
  // Zotero format: "Description:path/to/file.pdf:application/pdf"
  const parts = fileField.split(":");
  if (parts.length >= 2) {
    // Handle absolute paths with colons (e.g., /Users/kaypark/...)
    const fullPath = fileField
      .replace(/^[^:]*:/, "")
      .replace(/:application\/pdf$/, "");
    if (fullPath.endsWith(".pdf")) return expandPath(fullPath);
  }
  // Plain path
  if (fileField.endsWith(".pdf")) return expandPath(fileField);
  return null;
}

/** Format author names for display: "Last1, Last2 & Last3" */
export function formatAuthors(author: string, maxAuthors: number = 3): string {
  if (!author) return "Unknown";
  const authors = author.split(" and ").map((a) => a.trim());
  const lastNames = authors.map((a) => {
    const parts = a.split(",");
    return parts[0].trim();
  });
  if (lastNames.length <= maxAuthors) return lastNames.join(", ");
  return `${lastNames.slice(0, maxAuthors).join(", ")} et al.`;
}

/** Get venue string (journal or conference) */
export function getVenue(entry: BibEntry): string {
  return entry.journal || entry.booktitle || entry.type || "";
}
