import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  expandPath,
  generateIdentifier,
  slugify,
  formatOrgDate,
  buildFilename,
  createNote,
  parseFilename,
  scanNotes,
  readTitle,
} from "../utils/denote";

describe("expandPath", () => {
  it("expands ~ to home directory", () => {
    const result = expandPath("~/org/notes");
    expect(result).not.toContain("~");
    expect(result).toMatch(/^\/Users\//);
    expect(result.endsWith("/org/notes")).toBe(true);
  });

  it("returns absolute paths unchanged", () => {
    expect(expandPath("/tmp/foo")).toBe("/tmp/foo");
  });
});

describe("generateIdentifier", () => {
  it("generates YYYYMMDDTHHMMSS format", () => {
    const date = new Date(2026, 2, 13, 14, 30, 45); // 2026-03-13 14:30:45
    expect(generateIdentifier(date)).toBe("20260313T143045");
  });

  it("zero-pads single-digit months and days", () => {
    const date = new Date(2026, 0, 5, 9, 5, 3); // 2026-01-05 09:05:03
    expect(generateIdentifier(date)).toBe("20260105T090503");
  });
});

describe("slugify", () => {
  it("converts to lowercase hyphenated slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips special characters", () => {
    expect(slugify("What's New? (v2.0)")).toBe("whats-new-v20");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("foo - bar -- baz")).toBe("foo-bar-baz");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("formatOrgDate", () => {
  it("formats as [YYYY-MM-DD Day]", () => {
    const date = new Date(2026, 2, 13); // Friday
    expect(formatOrgDate(date)).toBe("[2026-03-13 Fri]");
  });

  it("formats Sunday correctly", () => {
    const date = new Date(2026, 2, 15); // Sunday
    expect(formatOrgDate(date)).toBe("[2026-03-15 Sun]");
  });
});

describe("buildFilename", () => {
  it("builds filename with tags", () => {
    const date = new Date(2026, 2, 13, 10, 0, 0);
    const result = buildFilename("My Note", ["emacs", "org"], date);
    expect(result).toBe("20260313T100000--my-note__emacs_org.org");
  });

  it("builds filename without tags", () => {
    const date = new Date(2026, 2, 13, 10, 0, 0);
    const result = buildFilename("My Note", [], date);
    expect(result).toBe("20260313T100000--my-note.org");
  });
});

describe("parseFilename", () => {
  it("parses denote filename with tags", () => {
    const result = parseFilename("/tmp/20260313T100000--my-note__emacs_org.org");
    expect(result).toEqual({
      path: "/tmp/20260313T100000--my-note__emacs_org.org",
      identifier: "20260313T100000",
      title: "my note",
      tags: ["emacs", "org"],
      date: "2026-03-13",
    });
  });

  it("parses denote filename without tags", () => {
    const result = parseFilename("/tmp/20260313T100000--my-note.org");
    expect(result).toEqual({
      path: "/tmp/20260313T100000--my-note.org",
      identifier: "20260313T100000",
      title: "my note",
      tags: [],
      date: "2026-03-13",
    });
  });

  it("returns null for non-denote filenames", () => {
    expect(parseFilename("/tmp/random-file.org")).toBeNull();
  });
});

describe("createNote + scanNotes + readTitle", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `denote-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates a note file with correct front matter", () => {
    const filepath = createNote(tempDir, "Test Note", ["test", "vitest"], "Some content here");
    expect(existsSync(filepath)).toBe(true);

    const content = readFileSync(filepath, "utf-8");
    expect(content).toContain("#+title:      Test Note");
    expect(content).toContain("#+filetags:   :test:vitest:");
    expect(content).toContain("#+identifier:");
    expect(content).toContain("#+date:");
    expect(content).toContain("Some content here");
  });

  it("creates a note without tags", () => {
    const filepath = createNote(tempDir, "No Tags", [], "");
    const content = readFileSync(filepath, "utf-8");
    expect(content).not.toContain("#+filetags:");
  });

  it("creates directory if it does not exist", () => {
    const subDir = join(tempDir, "sub", "dir");
    const filepath = createNote(subDir, "Deep Note", [], "");
    expect(existsSync(filepath)).toBe(true);
  });

  it("scanNotes finds created notes sorted by identifier desc", () => {
    // Create notes with slight delay to get different identifiers
    writeFileSync(join(tempDir, "20260101T000000--older-note.org"), "#+title: Older\n");
    writeFileSync(join(tempDir, "20260313T120000--newer-note__test.org"), "#+title: Newer\n");
    writeFileSync(join(tempDir, "not-denote.org"), "random file\n");

    const notes = scanNotes(tempDir);
    expect(notes).toHaveLength(2);
    expect(notes[0].identifier).toBe("20260313T120000");
    expect(notes[1].identifier).toBe("20260101T000000");
    expect(notes[0].tags).toEqual(["test"]);
  });

  it("scanNotes returns empty for nonexistent dir", () => {
    expect(scanNotes("/tmp/nonexistent-dir-xyz")).toEqual([]);
  });

  it("readTitle reads #+title: header", () => {
    const filepath = createNote(tempDir, "My Title", [], "");
    expect(readTitle(filepath)).toBe("My Title");
  });

  it("readTitle falls back to slug from filename", () => {
    const filepath = join(tempDir, "20260313T100000--fallback-title.org");
    writeFileSync(filepath, "no title header here\n");
    expect(readTitle(filepath)).toBe("fallback title");
  });
});
