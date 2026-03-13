import { describe, it, expect } from "vitest";
import { join } from "path";
import { parseBibFile, extractPdfPath, formatAuthors, getVenue } from "../utils/bibtex";

const FIXTURE_BIB = join(__dirname, "fixtures", "sample.bib");

describe("parseBibFile", () => {
  it("parses all non-comment entries", () => {
    const entries = parseBibFile(FIXTURE_BIB);
    expect(entries).toHaveLength(3);
  });

  it("parses article entry fields", () => {
    const entries = parseBibFile(FIXTURE_BIB);
    const article = entries.find((e) => e.key === "kim2024wafer");
    expect(article).toBeDefined();
    expect(article!.type).toBe("article");
    expect(article!.title).toBe("Wafer Defect Detection Using Deep Learning");
    expect(article!.author).toContain("Kim, Seonghyun");
    expect(article!.year).toBe("2024");
    expect(article!.journal).toBe("IEEE Transactions on Semiconductor Manufacturing");
    expect(article!.doi).toBe("10.1109/TSM.2024.1234567");
    expect(article!.file).toContain("kim2024wafer.pdf");
  });

  it("parses inproceedings entry", () => {
    const entries = parseBibFile(FIXTURE_BIB);
    const conf = entries.find((e) => e.key === "zhang2023fault");
    expect(conf).toBeDefined();
    expect(conf!.type).toBe("inproceedings");
    expect(conf!.booktitle).toBe("Proceedings of ICML 2023");
    expect(conf!.url).toBe("https://example.com/zhang2023");
  });

  it("handles entry with minimal fields", () => {
    const entries = parseBibFile(FIXTURE_BIB);
    const misc = entries.find((e) => e.key === "doe2022notes");
    expect(misc).toBeDefined();
    expect(misc!.type).toBe("misc");
    expect(misc!.journal).toBeUndefined();
    expect(misc!.file).toBeUndefined();
  });

  it("skips @comment entries", () => {
    const entries = parseBibFile(FIXTURE_BIB);
    expect(entries.every((e) => e.type !== "comment")).toBe(true);
  });

  it("returns empty array for nonexistent file", () => {
    expect(parseBibFile("/tmp/nonexistent.bib")).toEqual([]);
  });
});

describe("extractPdfPath", () => {
  it("extracts from Zotero-style file field", () => {
    const result = extractPdfPath("Full Text:/Users/test/papers/kim2024.pdf:application/pdf");
    expect(result).toBe("/Users/test/papers/kim2024.pdf");
  });

  it("extracts plain PDF path", () => {
    const result = extractPdfPath("/Users/test/paper.pdf");
    expect(result).toBe("/Users/test/paper.pdf");
  });

  it("returns null for undefined", () => {
    expect(extractPdfPath(undefined)).toBeNull();
  });

  it("returns null for non-PDF file", () => {
    expect(extractPdfPath("notes.txt")).toBeNull();
  });
});

describe("formatAuthors", () => {
  it("formats single author", () => {
    expect(formatAuthors("Kim, Seonghyun")).toBe("Kim");
  });

  it("formats multiple authors", () => {
    expect(formatAuthors("Kim, S and Park, J and Lee, M")).toBe("Kim, Park, Lee");
  });

  it("truncates with et al. beyond maxAuthors", () => {
    expect(formatAuthors("A, 1 and B, 2 and C, 3 and D, 4", 2)).toBe("A, B et al.");
  });

  it("returns Unknown for empty string", () => {
    expect(formatAuthors("")).toBe("Unknown");
  });
});

describe("getVenue", () => {
  it("returns journal if available", () => {
    expect(getVenue({ journal: "Nature", booktitle: "Conf", key: "", type: "", title: "", author: "", year: "" })).toBe(
      "Nature",
    );
  });

  it("falls back to booktitle", () => {
    expect(getVenue({ booktitle: "ICML", key: "", type: "inproceedings", title: "", author: "", year: "" })).toBe(
      "ICML",
    );
  });

  it("falls back to type", () => {
    expect(getVenue({ key: "", type: "misc", title: "", author: "", year: "" })).toBe("misc");
  });
});
