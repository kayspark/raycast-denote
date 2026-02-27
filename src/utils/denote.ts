import { execSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";

/** Expand ~ to home directory */
export function expandPath(p: string): string {
  return p.startsWith("~") ? p.replace("~", homedir()) : p;
}

/** Generate denote identifier: YYYYMMDDTHHMMSS */
export function generateIdentifier(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

/** Slugify title for denote filename: lowercase, spaces to hyphens, strip special chars */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Format date for org front matter: [YYYY-MM-DD Day] */
export function formatOrgDate(date: Date = new Date()): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `[${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${days[date.getDay()]}]`;
}

/** Build denote filename */
export function buildFilename(title: string, tags: string[], date: Date = new Date()): string {
  const id = generateIdentifier(date);
  const slug = slugify(title);
  const tagSuffix = tags.length > 0 ? `__${tags.join("_")}` : "";
  return `${id}--${slug}${tagSuffix}.org`;
}

/** Build org front matter */
export function buildFrontMatter(title: string, tags: string[], content: string = ""): string {
  const now = new Date();
  const id = generateIdentifier(now);
  const tagLine = tags.length > 0 ? `:${tags.join(":")}:` : "";
  let text = `#+title:      ${title}\n`;
  text += `#+date:       ${formatOrgDate(now)}\n`;
  text += `#+identifier: ${id}\n`;
  if (tagLine) text += `#+filetags:   ${tagLine}\n`;
  text += `\n`;
  if (content) text += `${content}\n`;
  return text;
}

/** Create a denote note file, return full path */
export function createNote(dir: string, title: string, tags: string[], content: string = ""): string {
  const expanded = expandPath(dir);
  if (!existsSync(expanded)) mkdirSync(expanded, { recursive: true });
  const now = new Date();
  const id = generateIdentifier(now);
  const slug = slugify(title);
  const tagSuffix = tags.length > 0 ? `__${tags.join("_")}` : "";
  const filename = `${id}--${slug}${tagSuffix}.org`;
  const filepath = join(expanded, filename);
  const tagLine = tags.length > 0 ? `:${tags.join(":")}:` : "";
  let body = `#+title:      ${title}\n`;
  body += `#+date:       ${formatOrgDate(now)}\n`;
  body += `#+identifier: ${id}\n`;
  if (tagLine) body += `#+filetags:   ${tagLine}\n`;
  body += `\n`;
  if (content) body += `${content}\n`;
  writeFileSync(filepath, body, "utf-8");
  return filepath;
}

/** Parse denote filename into components */
export interface DenoteFile {
  path: string;
  identifier: string;
  title: string;
  tags: string[];
  date: string;
}

export function parseFilename(filepath: string): DenoteFile | null {
  const name = basename(filepath, ".org");
  const match = name.match(/^(\d{8}T\d{6})--(.+?)(?:__(.+))?$/);
  if (!match) return null;
  const [, identifier, slug, tagStr] = match;
  return {
    path: filepath,
    identifier,
    title: slug.replace(/-/g, " "),
    tags: tagStr ? tagStr.split("_") : [],
    date: `${identifier.slice(0, 4)}-${identifier.slice(4, 6)}-${identifier.slice(6, 8)}`,
  };
}

/** Scan all denote files in a directory */
export function scanNotes(dir: string): DenoteFile[] {
  const expanded = expandPath(dir);
  if (!existsSync(expanded)) return [];
  return readdirSync(expanded)
    .filter((f) => f.endsWith(".org") && /^\d{8}T\d{6}--/.test(f))
    .map((f) => parseFilename(join(expanded, f)))
    .filter((f): f is DenoteFile => f !== null)
    .sort((a, b) => b.identifier.localeCompare(a.identifier));
}

/** Scan all unique tags from filetags headers across directories */
export function scanTags(dirs: string[]): string[] {
  const tags = new Set<string>();
  for (const dir of dirs) {
    const expanded = expandPath(dir);
    if (!existsSync(expanded)) continue;
    try {
      const output = execSync(`rg --no-filename -oP '(?<=:)[^:]+(?=:)' -g '*.org' --no-line-number "${expanded}"`, {
        encoding: "utf-8",
        timeout: 5000,
      });
      output
        .split("\n")
        .filter(Boolean)
        .forEach((t) => tags.add(t.trim()));
    } catch {
      // rg returns exit 1 if no matches
    }
  }
  return [...tags].sort();
}

/** Search notes with ripgrep, return matching file paths */
export function searchNotes(dirs: string[], query: string): string[] {
  if (!query.trim()) return [];
  const paths = dirs.map(expandPath).filter(existsSync);
  if (paths.length === 0) return [];
  try {
    const escapedQuery = query.replace(/['"\\]/g, "\\$&");
    const output = execSync(
      `rg -l -i --glob '*.org' "${escapedQuery}" ${paths.map((p) => `"${p}"`).join(" ")}`,
      { encoding: "utf-8", timeout: 10000 },
    );
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/** Read the title from #+title: header, falling back to filename slug */
export function readTitle(filepath: string): string {
  try {
    const head = readFileSync(filepath, "utf-8").slice(0, 500);
    const match = head.match(/^#\+title:\s*(.+)$/m);
    if (match) return match[1].trim();
  } catch {
    // fall through
  }
  const parsed = parseFilename(filepath);
  return parsed ? parsed.title : basename(filepath, ".org");
}

/** Open a file in the configured editor */
export function openInEditor(editorCmd: string, filepath: string): void {
  execSync(`${editorCmd} "${filepath}"`, { timeout: 5000 });
}
