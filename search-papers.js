"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/search-papers.tsx
var search_papers_exports = {};
__export(search_papers_exports, {
  default: () => SearchPapers
});
module.exports = __toCommonJS(search_papers_exports);
var import_api = require("@raycast/api");
var import_react = require("react");
var import_child_process2 = require("child_process");
var import_fs3 = require("fs");

// src/utils/bibtex.ts
var import_fs2 = require("fs");

// src/utils/denote.ts
var import_child_process = require("child_process");
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
function expandPath(p) {
  return p.startsWith("~") ? p.replace("~", (0, import_os.homedir)()) : p;
}
function generateIdentifier(date = /* @__PURE__ */ new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function formatOrgDate(date = /* @__PURE__ */ new Date()) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pad = (n) => String(n).padStart(2, "0");
  return `[${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${days[date.getDay()]}]`;
}
function createNote(dir, title, tags, content = "") {
  const expanded = expandPath(dir);
  if (!(0, import_fs.existsSync)(expanded)) (0, import_fs.mkdirSync)(expanded, { recursive: true });
  const now = /* @__PURE__ */ new Date();
  const id = generateIdentifier(now);
  const slug = slugify(title);
  const tagSuffix = tags.length > 0 ? `__${tags.join("_")}` : "";
  const filename = `${id}--${slug}${tagSuffix}.org`;
  const filepath = (0, import_path.join)(expanded, filename);
  const tagLine = tags.length > 0 ? `:${tags.join(":")}:` : "";
  let body = `#+title:      ${title}
`;
  body += `#+date:       ${formatOrgDate(now)}
`;
  body += `#+identifier: ${id}
`;
  if (tagLine) body += `#+filetags:   ${tagLine}
`;
  body += `
`;
  if (content) body += `${content}
`;
  (0, import_fs.writeFileSync)(filepath, body, "utf-8");
  return filepath;
}
function parseFilename(filepath) {
  const name = (0, import_path.basename)(filepath, ".org");
  const match = name.match(/^(\d{8}T\d{6})--(.+?)(?:__(.+))?$/);
  if (!match) return null;
  const [, identifier, slug, tagStr] = match;
  return {
    path: filepath,
    identifier,
    title: slug.replace(/-/g, " "),
    tags: tagStr ? tagStr.split("_") : [],
    date: `${identifier.slice(0, 4)}-${identifier.slice(4, 6)}-${identifier.slice(6, 8)}`
  };
}
function scanNotes(dir) {
  const expanded = expandPath(dir);
  if (!(0, import_fs.existsSync)(expanded)) return [];
  return (0, import_fs.readdirSync)(expanded).filter((f) => f.endsWith(".org") && /^\d{8}T\d{6}--/.test(f)).map((f) => parseFilename((0, import_path.join)(expanded, f))).filter((f) => f !== null).sort((a, b) => b.identifier.localeCompare(a.identifier));
}
function openInEditor(editorCmd, filepath) {
  (0, import_child_process.execSync)(`${editorCmd} "${filepath}"`, { timeout: 5e3 });
}

// src/utils/bibtex.ts
function parseBibFile(bibPath) {
  const expanded = expandPath(bibPath);
  if (!(0, import_fs2.existsSync)(expanded)) return [];
  const content = (0, import_fs2.readFileSync)(expanded, "utf-8");
  const entries = [];
  const entryRegex = /@(\w+)\{([^,]+),([^@]*?)(?=\n@|\n*$)/gs;
  let match;
  while ((match = entryRegex.exec(content)) !== null) {
    const [, type, key, body] = match;
    if (type.toLowerCase() === "comment" || type.toLowerCase() === "preamble") continue;
    const getField = (name) => {
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
      journal: getField("journal") || void 0,
      booktitle: getField("booktitle") || void 0,
      file: getField("file") || void 0,
      doi: getField("doi") || void 0,
      url: getField("url") || void 0
    });
  }
  return entries;
}
function extractPdfPath(fileField) {
  if (!fileField) return null;
  const parts = fileField.split(":");
  if (parts.length >= 2) {
    const fullPath = fileField.replace(/^[^:]*:/, "").replace(/:application\/pdf$/, "");
    if (fullPath.endsWith(".pdf")) return expandPath(fullPath);
  }
  if (fileField.endsWith(".pdf")) return expandPath(fileField);
  return null;
}
function formatAuthors(author, maxAuthors = 3) {
  if (!author) return "Unknown";
  const authors = author.split(" and ").map((a) => a.trim());
  const lastNames = authors.map((a) => {
    const parts = a.split(",");
    return parts[0].trim();
  });
  if (lastNames.length <= maxAuthors) return lastNames.join(", ");
  return `${lastNames.slice(0, maxAuthors).join(", ")} et al.`;
}
function getVenue(entry) {
  return entry.journal || entry.booktitle || entry.type || "";
}

// src/search-papers.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function SearchPapers() {
  const prefs = (0, import_api.getPreferenceValues)();
  const [query, setQuery] = (0, import_react.useState)("");
  const [entries, setEntries] = (0, import_react.useState)([]);
  const [paperNotes, setPaperNotes] = (0, import_react.useState)(/* @__PURE__ */ new Map());
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    const bib = parseBibFile(prefs.bibFile);
    setEntries(bib);
    const notes = scanNotes(`${prefs.papersDir}/notes`);
    const noteMap = /* @__PURE__ */ new Map();
    for (const note of notes) {
      noteMap.set(note.title.toLowerCase(), note);
    }
    setPaperNotes(noteMap);
    setIsLoading(false);
  }, []);
  const filtered = query.trim() ? entries.filter((e) => {
    const q = query.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.author.toLowerCase().includes(q) || e.year.includes(q) || e.key.toLowerCase().includes(q);
  }) : entries.slice(0, 50);
  const openPdf = (0, import_react.useCallback)((entry) => {
    const pdfPath = extractPdfPath(entry.file);
    if (pdfPath && (0, import_fs3.existsSync)(pdfPath)) {
      (0, import_child_process2.execSync)(`open "${pdfPath}"`, { timeout: 5e3 });
    } else {
      (0, import_api.showToast)({ style: import_api.Toast.Style.Failure, title: "PDF not found", message: entry.file || "No file field" });
    }
  }, []);
  const openNote = (0, import_react.useCallback)(
    (note) => {
      try {
        openInEditor(prefs.editorCmd, note.path);
      } catch (error) {
        (0, import_api.showToast)({ style: import_api.Toast.Style.Failure, title: "Failed to open", message: String(error) });
      }
    },
    [prefs.editorCmd]
  );
  const createPaperNote = (0, import_react.useCallback)(
    (entry) => {
      const tags = ["paper"];
      const content = `* ${entry.title}

- Author :: ${entry.author}
- Year :: ${entry.year}
- Key :: ${entry.key}
`;
      const filepath = createNote(`${prefs.papersDir}/notes`, entry.title, tags, content);
      try {
        openInEditor(prefs.editorCmd, filepath);
        (0, import_api.showToast)({ style: import_api.Toast.Style.Success, title: "Paper note created" });
      } catch {
        (0, import_api.showToast)({ style: import_api.Toast.Style.Failure, title: "Note created but failed to open" });
      }
    },
    [prefs.editorCmd, prefs.papersDir]
  );
  const findNote = (entry) => {
    const words = entry.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3).slice(0, 4);
    for (const [key, note] of paperNotes) {
      if (words.every((w) => key.includes(w))) return note;
    }
    return void 0;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List, { isLoading, searchBarPlaceholder: "Search papers...", onSearchTextChange: setQuery, throttle: true, children: filtered.map((entry) => {
    const pdfPath = extractPdfPath(entry.file);
    const hasPdf = pdfPath ? (0, import_fs3.existsSync)(pdfPath) : false;
    const matchedNote = findNote(entry);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_api.List.Item,
      {
        title: entry.title || entry.key,
        subtitle: `${formatAuthors(entry.author)} (${entry.year})`,
        accessories: [
          { text: getVenue(entry) },
          ...hasPdf ? [{ icon: import_api.Icon.Document, tooltip: "PDF available" }] : [],
          ...matchedNote ? [{ icon: import_api.Icon.TextDocument, tooltip: "Has note" }] : []
        ],
        actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api.ActionPanel, { children: [
          hasPdf && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Action, { title: "Open PDF", icon: import_api.Icon.Document, onAction: () => openPdf(entry) }),
          matchedNote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_api.Action,
            {
              title: "Open Note in Emacs",
              icon: import_api.Icon.TextDocument,
              onAction: () => openNote(matchedNote),
              shortcut: { modifiers: ["cmd"], key: "return" }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_api.Action,
            {
              title: "Create Paper Note",
              icon: import_api.Icon.Plus,
              onAction: () => createPaperNote(entry),
              shortcut: { modifiers: ["cmd"], key: "n" }
            }
          ),
          entry.doi && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_api.Action.OpenInBrowser,
            {
              title: "Open DOI",
              url: `https://doi.org/${entry.doi}`,
              shortcut: { modifiers: ["cmd"], key: "d" }
            }
          )
        ] })
      },
      entry.key
    );
  }) });
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy9zZWFyY2gtcGFwZXJzLnRzeCIsICIuLi8uLi8uLi8uLi8uZG90ZmlsZXMvLmNvbmZpZy9yYXljYXN0L2V4dGVuc2lvbnMvcmF5Y2FzdC1kZW5vdGUvc3JjL3V0aWxzL2JpYnRleC50cyIsICIuLi8uLi8uLi8uLi8uZG90ZmlsZXMvLmNvbmZpZy9yYXljYXN0L2V4dGVuc2lvbnMvcmF5Y2FzdC1kZW5vdGUvc3JjL3V0aWxzL2Rlbm90ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQWN0aW9uLCBBY3Rpb25QYW5lbCwgTGlzdCwgZ2V0UHJlZmVyZW5jZVZhbHVlcywgc2hvd1RvYXN0LCBUb2FzdCwgSWNvbiB9IGZyb20gXCJAcmF5Y2FzdC9hcGlcIjtcbmltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZUNhbGxiYWNrIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBwYXJzZUJpYkZpbGUsIGV4dHJhY3RQZGZQYXRoLCBmb3JtYXRBdXRob3JzLCBnZXRWZW51ZSwgQmliRW50cnkgfSBmcm9tIFwiLi91dGlscy9iaWJ0ZXhcIjtcbmltcG9ydCB7IGNyZWF0ZU5vdGUsIGV4cGFuZFBhdGgsIHNjYW5Ob3Rlcywgb3BlbkluRWRpdG9yLCBEZW5vdGVGaWxlIH0gZnJvbSBcIi4vdXRpbHMvZGVub3RlXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIHBhcGVyc0Rpcjogc3RyaW5nO1xuICBiaWJGaWxlOiBzdHJpbmc7XG4gIGVkaXRvckNtZDogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTZWFyY2hQYXBlcnMoKSB7XG4gIGNvbnN0IHByZWZzID0gZ2V0UHJlZmVyZW5jZVZhbHVlczxQcmVmZXJlbmNlcz4oKTtcbiAgY29uc3QgW3F1ZXJ5LCBzZXRRdWVyeV0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW2VudHJpZXMsIHNldEVudHJpZXNdID0gdXNlU3RhdGU8QmliRW50cnlbXT4oW10pO1xuICBjb25zdCBbcGFwZXJOb3Rlcywgc2V0UGFwZXJOb3Rlc10gPSB1c2VTdGF0ZTxNYXA8c3RyaW5nLCBEZW5vdGVGaWxlPj4obmV3IE1hcCgpKTtcbiAgY29uc3QgW2lzTG9hZGluZywgc2V0SXNMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYmliID0gcGFyc2VCaWJGaWxlKHByZWZzLmJpYkZpbGUpO1xuICAgIHNldEVudHJpZXMoYmliKTtcblxuICAgIGNvbnN0IG5vdGVzID0gc2Nhbk5vdGVzKGAke3ByZWZzLnBhcGVyc0Rpcn0vbm90ZXNgKTtcbiAgICBjb25zdCBub3RlTWFwID0gbmV3IE1hcDxzdHJpbmcsIERlbm90ZUZpbGU+KCk7XG4gICAgZm9yIChjb25zdCBub3RlIG9mIG5vdGVzKSB7XG4gICAgICBub3RlTWFwLnNldChub3RlLnRpdGxlLnRvTG93ZXJDYXNlKCksIG5vdGUpO1xuICAgIH1cbiAgICBzZXRQYXBlck5vdGVzKG5vdGVNYXApO1xuICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBmaWx0ZXJlZCA9IHF1ZXJ5LnRyaW0oKVxuICAgID8gZW50cmllcy5maWx0ZXIoKGUpID0+IHtcbiAgICAgICAgY29uc3QgcSA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgZS50aXRsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpIHx8XG4gICAgICAgICAgZS5hdXRob3IudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKSB8fFxuICAgICAgICAgIGUueWVhci5pbmNsdWRlcyhxKSB8fFxuICAgICAgICAgIGUua2V5LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSlcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgOiBlbnRyaWVzLnNsaWNlKDAsIDUwKTtcblxuICBjb25zdCBvcGVuUGRmID0gdXNlQ2FsbGJhY2soKGVudHJ5OiBCaWJFbnRyeSkgPT4ge1xuICAgIGNvbnN0IHBkZlBhdGggPSBleHRyYWN0UGRmUGF0aChlbnRyeS5maWxlKTtcbiAgICBpZiAocGRmUGF0aCAmJiBleGlzdHNTeW5jKHBkZlBhdGgpKSB7XG4gICAgICBleGVjU3luYyhgb3BlbiBcIiR7cGRmUGF0aH1cImAsIHsgdGltZW91dDogNTAwMCB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIlBERiBub3QgZm91bmRcIiwgbWVzc2FnZTogZW50cnkuZmlsZSB8fCBcIk5vIGZpbGUgZmllbGRcIiB9KTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICBjb25zdCBvcGVuTm90ZSA9IHVzZUNhbGxiYWNrKFxuICAgIChub3RlOiBEZW5vdGVGaWxlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBvcGVuSW5FZGl0b3IocHJlZnMuZWRpdG9yQ21kLCBub3RlLnBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIkZhaWxlZCB0byBvcGVuXCIsIG1lc3NhZ2U6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kXSxcbiAgKTtcblxuICBjb25zdCBjcmVhdGVQYXBlck5vdGUgPSB1c2VDYWxsYmFjayhcbiAgICAoZW50cnk6IEJpYkVudHJ5KSA9PiB7XG4gICAgICBjb25zdCB0YWdzID0gW1wicGFwZXJcIl07XG4gICAgICBjb25zdCBjb250ZW50ID0gYCogJHtlbnRyeS50aXRsZX1cXG5cXG4tIEF1dGhvciA6OiAke2VudHJ5LmF1dGhvcn1cXG4tIFllYXIgOjogJHtlbnRyeS55ZWFyfVxcbi0gS2V5IDo6ICR7ZW50cnkua2V5fVxcbmA7XG4gICAgICBjb25zdCBmaWxlcGF0aCA9IGNyZWF0ZU5vdGUoYCR7cHJlZnMucGFwZXJzRGlyfS9ub3Rlc2AsIGVudHJ5LnRpdGxlLCB0YWdzLCBjb250ZW50KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wZW5JbkVkaXRvcihwcmVmcy5lZGl0b3JDbWQsIGZpbGVwYXRoKTtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsIHRpdGxlOiBcIlBhcGVyIG5vdGUgY3JlYXRlZFwiIH0pO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHNob3dUb2FzdCh7IHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLCB0aXRsZTogXCJOb3RlIGNyZWF0ZWQgYnV0IGZhaWxlZCB0byBvcGVuXCIgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kLCBwcmVmcy5wYXBlcnNEaXJdLFxuICApO1xuXG4gIC8vIEZpbmQgbWF0Y2hpbmcgbm90ZSBmb3IgYSBiaWIgZW50cnlcbiAgY29uc3QgZmluZE5vdGUgPSAoZW50cnk6IEJpYkVudHJ5KTogRGVub3RlRmlsZSB8IHVuZGVmaW5lZCA9PiB7XG4gICAgY29uc3Qgd29yZHMgPSBlbnRyeS50aXRsZVxuICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgIC5yZXBsYWNlKC9bXmEtejAtOVxcc10vZywgXCJcIilcbiAgICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgICAuZmlsdGVyKCh3KSA9PiB3Lmxlbmd0aCA+IDMpXG4gICAgICAuc2xpY2UoMCwgNCk7XG4gICAgZm9yIChjb25zdCBba2V5LCBub3RlXSBvZiBwYXBlck5vdGVzKSB7XG4gICAgICBpZiAod29yZHMuZXZlcnkoKHcpID0+IGtleS5pbmNsdWRlcyh3KSkpIHJldHVybiBub3RlO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPExpc3QgaXNMb2FkaW5nPXtpc0xvYWRpbmd9IHNlYXJjaEJhclBsYWNlaG9sZGVyPVwiU2VhcmNoIHBhcGVycy4uLlwiIG9uU2VhcmNoVGV4dENoYW5nZT17c2V0UXVlcnl9IHRocm90dGxlPlxuICAgICAge2ZpbHRlcmVkLm1hcCgoZW50cnkpID0+IHtcbiAgICAgICAgY29uc3QgcGRmUGF0aCA9IGV4dHJhY3RQZGZQYXRoKGVudHJ5LmZpbGUpO1xuICAgICAgICBjb25zdCBoYXNQZGYgPSBwZGZQYXRoID8gZXhpc3RzU3luYyhwZGZQYXRoKSA6IGZhbHNlO1xuICAgICAgICBjb25zdCBtYXRjaGVkTm90ZSA9IGZpbmROb3RlKGVudHJ5KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxMaXN0Lkl0ZW1cbiAgICAgICAgICAgIGtleT17ZW50cnkua2V5fVxuICAgICAgICAgICAgdGl0bGU9e2VudHJ5LnRpdGxlIHx8IGVudHJ5LmtleX1cbiAgICAgICAgICAgIHN1YnRpdGxlPXtgJHtmb3JtYXRBdXRob3JzKGVudHJ5LmF1dGhvcil9ICgke2VudHJ5LnllYXJ9KWB9XG4gICAgICAgICAgICBhY2Nlc3Nvcmllcz17W1xuICAgICAgICAgICAgICB7IHRleHQ6IGdldFZlbnVlKGVudHJ5KSB9LFxuICAgICAgICAgICAgICAuLi4oaGFzUGRmID8gW3sgaWNvbjogSWNvbi5Eb2N1bWVudCwgdG9vbHRpcDogXCJQREYgYXZhaWxhYmxlXCIgfV0gOiBbXSksXG4gICAgICAgICAgICAgIC4uLihtYXRjaGVkTm90ZSA/IFt7IGljb246IEljb24uVGV4dERvY3VtZW50LCB0b29sdGlwOiBcIkhhcyBub3RlXCIgfV0gOiBbXSksXG4gICAgICAgICAgICBdfVxuICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgIDxBY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgICB7aGFzUGRmICYmIDxBY3Rpb24gdGl0bGU9XCJPcGVuIFBERlwiIGljb249e0ljb24uRG9jdW1lbnR9IG9uQWN0aW9uPXsoKSA9PiBvcGVuUGRmKGVudHJ5KX0gLz59XG4gICAgICAgICAgICAgICAge21hdGNoZWROb3RlICYmIChcbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJPcGVuIE5vdGUgaW4gRW1hY3NcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlRleHREb2N1bWVudH1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IG9wZW5Ob3RlKG1hdGNoZWROb3RlKX1cbiAgICAgICAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjbWRcIl0sIGtleTogXCJyZXR1cm5cIiB9fVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ3JlYXRlIFBhcGVyIE5vdGVcIlxuICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5QbHVzfVxuICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGNyZWF0ZVBhcGVyTm90ZShlbnRyeSl9XG4gICAgICAgICAgICAgICAgICBzaG9ydGN1dD17eyBtb2RpZmllcnM6IFtcImNtZFwiXSwga2V5OiBcIm5cIiB9fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAge2VudHJ5LmRvaSAmJiAoXG4gICAgICAgICAgICAgICAgICA8QWN0aW9uLk9wZW5JbkJyb3dzZXJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJPcGVuIERPSVwiXG4gICAgICAgICAgICAgICAgICAgIHVybD17YGh0dHBzOi8vZG9pLm9yZy8ke2VudHJ5LmRvaX1gfVxuICAgICAgICAgICAgICAgICAgICBzaG9ydGN1dD17eyBtb2RpZmllcnM6IFtcImNtZFwiXSwga2V5OiBcImRcIiB9fVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L0FjdGlvblBhbmVsPlxuICAgICAgICAgICAgfVxuICAgICAgICAgIC8+XG4gICAgICAgICk7XG4gICAgICB9KX1cbiAgICA8L0xpc3Q+XG4gICk7XG59XG4iLCAiaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBleHBhbmRQYXRoIH0gZnJvbSBcIi4vZGVub3RlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmliRW50cnkge1xuICBrZXk6IHN0cmluZztcbiAgdHlwZTogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBhdXRob3I6IHN0cmluZztcbiAgeWVhcjogc3RyaW5nO1xuICBqb3VybmFsPzogc3RyaW5nO1xuICBib29rdGl0bGU/OiBzdHJpbmc7XG4gIGZpbGU/OiBzdHJpbmc7XG4gIGRvaT86IHN0cmluZztcbiAgdXJsPzogc3RyaW5nO1xufVxuXG4vKiogUGFyc2UgYSBCaWJUZVggZmlsZSBpbnRvIGVudHJpZXMuIExpZ2h0d2VpZ2h0IHJlZ2V4LWJhc2VkIHBhcnNlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUJpYkZpbGUoYmliUGF0aDogc3RyaW5nKTogQmliRW50cnlbXSB7XG4gIGNvbnN0IGV4cGFuZGVkID0gZXhwYW5kUGF0aChiaWJQYXRoKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IGNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZXhwYW5kZWQsIFwidXRmLThcIik7XG4gIGNvbnN0IGVudHJpZXM6IEJpYkVudHJ5W10gPSBbXTtcblxuICAvLyBNYXRjaCBlYWNoIEB0eXBle2tleSwgLi4uIH0gYmxvY2tcbiAgY29uc3QgZW50cnlSZWdleCA9IC9AKFxcdyspXFx7KFteLF0rKSwoW15AXSo/KSg/PVxcbkB8XFxuKiQpL2dzO1xuICBsZXQgbWF0Y2g7XG5cbiAgd2hpbGUgKChtYXRjaCA9IGVudHJ5UmVnZXguZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcbiAgICBjb25zdCBbLCB0eXBlLCBrZXksIGJvZHldID0gbWF0Y2g7XG4gICAgaWYgKHR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJjb21tZW50XCIgfHwgdHlwZS50b0xvd2VyQ2FzZSgpID09PSBcInByZWFtYmxlXCIpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgZ2V0RmllbGQgPSAobmFtZTogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkUmVnZXggPSBuZXcgUmVnRXhwKGAke25hbWV9XFxcXHMqPVxcXFxzKlt7XCJdKC4rPylbfVwiXWAsIFwic2lcIik7XG4gICAgICBjb25zdCBtID0gYm9keS5tYXRjaChmaWVsZFJlZ2V4KTtcbiAgICAgIHJldHVybiBtID8gbVsxXS5yZXBsYWNlKC9be31dL2csIFwiXCIpLnRyaW0oKSA6IFwiXCI7XG4gICAgfTtcblxuICAgIGVudHJpZXMucHVzaCh7XG4gICAgICBrZXk6IGtleS50cmltKCksXG4gICAgICB0eXBlOiB0eXBlLnRvTG93ZXJDYXNlKCksXG4gICAgICB0aXRsZTogZ2V0RmllbGQoXCJ0aXRsZVwiKSxcbiAgICAgIGF1dGhvcjogZ2V0RmllbGQoXCJhdXRob3JcIiksXG4gICAgICB5ZWFyOiBnZXRGaWVsZChcInllYXJcIikgfHwgZ2V0RmllbGQoXCJkYXRlXCIpPy5zbGljZSgwLCA0KSB8fCBcIlwiLFxuICAgICAgam91cm5hbDogZ2V0RmllbGQoXCJqb3VybmFsXCIpIHx8IHVuZGVmaW5lZCxcbiAgICAgIGJvb2t0aXRsZTogZ2V0RmllbGQoXCJib29rdGl0bGVcIikgfHwgdW5kZWZpbmVkLFxuICAgICAgZmlsZTogZ2V0RmllbGQoXCJmaWxlXCIpIHx8IHVuZGVmaW5lZCxcbiAgICAgIGRvaTogZ2V0RmllbGQoXCJkb2lcIikgfHwgdW5kZWZpbmVkLFxuICAgICAgdXJsOiBnZXRGaWVsZChcInVybFwiKSB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZW50cmllcztcbn1cblxuLyoqIEV4dHJhY3QgUERGIHBhdGggZnJvbSBiaWIgZmlsZSBmaWVsZC4gSGFuZGxlcyBab3Rlcm8tc3R5bGUgYW5kIHBsYWluIHBhdGhzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RQZGZQYXRoKGZpbGVGaWVsZDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghZmlsZUZpZWxkKSByZXR1cm4gbnVsbDtcbiAgLy8gWm90ZXJvIGZvcm1hdDogXCJEZXNjcmlwdGlvbjpwYXRoL3RvL2ZpbGUucGRmOmFwcGxpY2F0aW9uL3BkZlwiXG4gIGNvbnN0IHBhcnRzID0gZmlsZUZpZWxkLnNwbGl0KFwiOlwiKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA+PSAyKSB7XG4gICAgLy8gSGFuZGxlIGFic29sdXRlIHBhdGhzIHdpdGggY29sb25zIChlLmcuLCAvVXNlcnMva2F5cGFyay8uLi4pXG4gICAgY29uc3QgZnVsbFBhdGggPSBmaWxlRmllbGQucmVwbGFjZSgvXlteOl0qOi8sIFwiXCIpLnJlcGxhY2UoLzphcHBsaWNhdGlvblxcL3BkZiQvLCBcIlwiKTtcbiAgICBpZiAoZnVsbFBhdGguZW5kc1dpdGgoXCIucGRmXCIpKSByZXR1cm4gZXhwYW5kUGF0aChmdWxsUGF0aCk7XG4gIH1cbiAgLy8gUGxhaW4gcGF0aFxuICBpZiAoZmlsZUZpZWxkLmVuZHNXaXRoKFwiLnBkZlwiKSkgcmV0dXJuIGV4cGFuZFBhdGgoZmlsZUZpZWxkKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBGb3JtYXQgYXV0aG9yIG5hbWVzIGZvciBkaXNwbGF5OiBcIkxhc3QxLCBMYXN0MiAmIExhc3QzXCIgKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRBdXRob3JzKGF1dGhvcjogc3RyaW5nLCBtYXhBdXRob3JzOiBudW1iZXIgPSAzKTogc3RyaW5nIHtcbiAgaWYgKCFhdXRob3IpIHJldHVybiBcIlVua25vd25cIjtcbiAgY29uc3QgYXV0aG9ycyA9IGF1dGhvci5zcGxpdChcIiBhbmQgXCIpLm1hcCgoYSkgPT4gYS50cmltKCkpO1xuICBjb25zdCBsYXN0TmFtZXMgPSBhdXRob3JzLm1hcCgoYSkgPT4ge1xuICAgIGNvbnN0IHBhcnRzID0gYS5zcGxpdChcIixcIik7XG4gICAgcmV0dXJuIHBhcnRzWzBdLnRyaW0oKTtcbiAgfSk7XG4gIGlmIChsYXN0TmFtZXMubGVuZ3RoIDw9IG1heEF1dGhvcnMpIHJldHVybiBsYXN0TmFtZXMuam9pbihcIiwgXCIpO1xuICByZXR1cm4gYCR7bGFzdE5hbWVzLnNsaWNlKDAsIG1heEF1dGhvcnMpLmpvaW4oXCIsIFwiKX0gZXQgYWwuYDtcbn1cblxuLyoqIEdldCB2ZW51ZSBzdHJpbmcgKGpvdXJuYWwgb3IgY29uZmVyZW5jZSkgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRWZW51ZShlbnRyeTogQmliRW50cnkpOiBzdHJpbmcge1xuICByZXR1cm4gZW50cnkuam91cm5hbCB8fCBlbnRyeS5ib29rdGl0bGUgfHwgZW50cnkudHlwZSB8fCBcIlwiO1xufVxuIiwgImltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHJlYWRkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMsIG1rZGlyU3luYywgZXhpc3RzU3luYyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgam9pbiwgYmFzZW5hbWUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgaG9tZWRpciB9IGZyb20gXCJvc1wiO1xuXG4vKiogRXhwYW5kIH4gdG8gaG9tZSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRQYXRoKHA6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwLnN0YXJ0c1dpdGgoXCJ+XCIpID8gcC5yZXBsYWNlKFwiflwiLCBob21lZGlyKCkpIDogcDtcbn1cblxuLyoqIEdlbmVyYXRlIGRlbm90ZSBpZGVudGlmaWVyOiBZWVlZTU1ERFRISE1NU1MgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUlkZW50aWZpZXIoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gKFxuICAgIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0ke3BhZChkYXRlLmdldE1vbnRoKCkgKyAxKX0ke3BhZChkYXRlLmdldERhdGUoKSl9YCArXG4gICAgYFQke3BhZChkYXRlLmdldEhvdXJzKCkpfSR7cGFkKGRhdGUuZ2V0TWludXRlcygpKX0ke3BhZChkYXRlLmdldFNlY29uZHMoKSl9YFxuICApO1xufVxuXG4vKiogU2x1Z2lmeSB0aXRsZSBmb3IgZGVub3RlIGZpbGVuYW1lOiBsb3dlcmNhc2UsIHNwYWNlcyB0byBoeXBoZW5zLCBzdHJpcCBzcGVjaWFsIGNoYXJzICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeSh0aXRsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRpdGxlXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHMtXS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC8tKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi18LSQvZywgXCJcIik7XG59XG5cbi8qKiBGb3JtYXQgZGF0ZSBmb3Igb3JnIGZyb250IG1hdHRlcjogW1lZWVktTU0tREQgRGF5XSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE9yZ0RhdGUoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBkYXlzID0gW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdO1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gYFske2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQoZGF0ZS5nZXRNb250aCgpICsgMSl9LSR7cGFkKGRhdGUuZ2V0RGF0ZSgpKX0gJHtkYXlzW2RhdGUuZ2V0RGF5KCldfV1gO1xufVxuXG4vKiogQnVpbGQgZGVub3RlIGZpbGVuYW1lICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGaWxlbmFtZSh0aXRsZTogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSwgZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBpZCA9IGdlbmVyYXRlSWRlbnRpZmllcihkYXRlKTtcbiAgY29uc3Qgc2x1ZyA9IHNsdWdpZnkodGl0bGUpO1xuICBjb25zdCB0YWdTdWZmaXggPSB0YWdzLmxlbmd0aCA+IDAgPyBgX18ke3RhZ3Muam9pbihcIl9cIil9YCA6IFwiXCI7XG4gIHJldHVybiBgJHtpZH0tLSR7c2x1Z30ke3RhZ1N1ZmZpeH0ub3JnYDtcbn1cblxuLyoqIEJ1aWxkIG9yZyBmcm9udCBtYXR0ZXIgKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZyb250TWF0dGVyKHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3QgaWQgPSBnZW5lcmF0ZUlkZW50aWZpZXIobm93KTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IHRleHQgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIHRleHQgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgdGV4dCArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSB0ZXh0ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICB0ZXh0ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgdGV4dCArPSBgJHtjb250ZW50fVxcbmA7XG4gIHJldHVybiB0ZXh0O1xufVxuXG4vKiogQ3JlYXRlIGEgZGVub3RlIG5vdGUgZmlsZSwgcmV0dXJuIGZ1bGwgcGF0aCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vdGUoZGlyOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gIGlmICghZXhpc3RzU3luYyhleHBhbmRlZCkpIG1rZGlyU3luYyhleHBhbmRlZCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGlkID0gZ2VuZXJhdGVJZGVudGlmaWVyKG5vdyk7XG4gIGNvbnN0IHNsdWcgPSBzbHVnaWZ5KHRpdGxlKTtcbiAgY29uc3QgdGFnU3VmZml4ID0gdGFncy5sZW5ndGggPiAwID8gYF9fJHt0YWdzLmpvaW4oXCJfXCIpfWAgOiBcIlwiO1xuICBjb25zdCBmaWxlbmFtZSA9IGAke2lkfS0tJHtzbHVnfSR7dGFnU3VmZml4fS5vcmdgO1xuICBjb25zdCBmaWxlcGF0aCA9IGpvaW4oZXhwYW5kZWQsIGZpbGVuYW1lKTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IGJvZHkgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIGJvZHkgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgYm9keSArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSBib2R5ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICBib2R5ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgYm9keSArPSBgJHtjb250ZW50fVxcbmA7XG4gIHdyaXRlRmlsZVN5bmMoZmlsZXBhdGgsIGJvZHksIFwidXRmLThcIik7XG4gIHJldHVybiBmaWxlcGF0aDtcbn1cblxuLyoqIFBhcnNlIGRlbm90ZSBmaWxlbmFtZSBpbnRvIGNvbXBvbmVudHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVub3RlRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgaWRlbnRpZmllcjogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgZGF0ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGaWxlbmFtZShmaWxlcGF0aDogc3RyaW5nKTogRGVub3RlRmlsZSB8IG51bGwge1xuICBjb25zdCBuYW1lID0gYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbiAgY29uc3QgbWF0Y2ggPSBuYW1lLm1hdGNoKC9eKFxcZHs4fVRcXGR7Nn0pLS0oLis/KSg/Ol9fKC4rKSk/JC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgWywgaWRlbnRpZmllciwgc2x1ZywgdGFnU3RyXSA9IG1hdGNoO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGZpbGVwYXRoLFxuICAgIGlkZW50aWZpZXIsXG4gICAgdGl0bGU6IHNsdWcucmVwbGFjZSgvLS9nLCBcIiBcIiksXG4gICAgdGFnczogdGFnU3RyID8gdGFnU3RyLnNwbGl0KFwiX1wiKSA6IFtdLFxuICAgIGRhdGU6IGAke2lkZW50aWZpZXIuc2xpY2UoMCwgNCl9LSR7aWRlbnRpZmllci5zbGljZSg0LCA2KX0tJHtpZGVudGlmaWVyLnNsaWNlKDYsIDgpfWAsXG4gIH07XG59XG5cbi8qKiBTY2FuIGFsbCBkZW5vdGUgZmlsZXMgaW4gYSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuTm90ZXMoZGlyOiBzdHJpbmcpOiBEZW5vdGVGaWxlW10ge1xuICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgcmV0dXJuIFtdO1xuICByZXR1cm4gcmVhZGRpclN5bmMoZXhwYW5kZWQpXG4gICAgLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aChcIi5vcmdcIikgJiYgL15cXGR7OH1UXFxkezZ9LS0vLnRlc3QoZikpXG4gICAgLm1hcCgoZikgPT4gcGFyc2VGaWxlbmFtZShqb2luKGV4cGFuZGVkLCBmKSkpXG4gICAgLmZpbHRlcigoZik6IGYgaXMgRGVub3RlRmlsZSA9PiBmICE9PSBudWxsKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbn1cblxuLyoqIFNjYW4gYWxsIHVuaXF1ZSB0YWdzIGZyb20gZmlsZXRhZ3MgaGVhZGVycyBhY3Jvc3MgZGlyZWN0b3JpZXMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuVGFncyhkaXJzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgdGFncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IGRpciBvZiBkaXJzKSB7XG4gICAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gICAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNTeW5jKGByZyAtLW5vLWZpbGVuYW1lIC1vUCAnKD88PTopW146XSsoPz06KScgLWcgJyoub3JnJyAtLW5vLWxpbmUtbnVtYmVyIFwiJHtleHBhbmRlZH1cImAsIHtcbiAgICAgICAgZW5jb2Rpbmc6IFwidXRmLThcIixcbiAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgIH0pO1xuICAgICAgb3V0cHV0XG4gICAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5mb3JFYWNoKCh0KSA9PiB0YWdzLmFkZCh0LnRyaW0oKSkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gcmcgcmV0dXJucyBleGl0IDEgaWYgbm8gbWF0Y2hlc1xuICAgIH1cbiAgfVxuICByZXR1cm4gWy4uLnRhZ3NdLnNvcnQoKTtcbn1cblxuLyoqIFNlYXJjaCBub3RlcyB3aXRoIHJpcGdyZXAsIHJldHVybiBtYXRjaGluZyBmaWxlIHBhdGhzICovXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoTm90ZXMoZGlyczogc3RyaW5nW10sIHF1ZXJ5OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGlmICghcXVlcnkudHJpbSgpKSByZXR1cm4gW107XG4gIGNvbnN0IHBhdGhzID0gZGlycy5tYXAoZXhwYW5kUGF0aCkuZmlsdGVyKGV4aXN0c1N5bmMpO1xuICBpZiAocGF0aHMubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG4gIHRyeSB7XG4gICAgY29uc3QgZXNjYXBlZFF1ZXJ5ID0gcXVlcnkucmVwbGFjZSgvWydcIlxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNTeW5jKFxuICAgICAgYHJnIC1sIC1pIC0tZ2xvYiAnKi5vcmcnIFwiJHtlc2NhcGVkUXVlcnl9XCIgJHtwYXRocy5tYXAoKHApID0+IGBcIiR7cH1cImApLmpvaW4oXCIgXCIpfWAsXG4gICAgICB7IGVuY29kaW5nOiBcInV0Zi04XCIsIHRpbWVvdXQ6IDEwMDAwIH0sXG4gICAgKTtcbiAgICByZXR1cm4gb3V0cHV0LnNwbGl0KFwiXFxuXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cbi8qKiBSZWFkIHRoZSB0aXRsZSBmcm9tICMrdGl0bGU6IGhlYWRlciwgZmFsbGluZyBiYWNrIHRvIGZpbGVuYW1lIHNsdWcgKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkVGl0bGUoZmlsZXBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgY29uc3QgaGVhZCA9IHJlYWRGaWxlU3luYyhmaWxlcGF0aCwgXCJ1dGYtOFwiKS5zbGljZSgwLCA1MDApO1xuICAgIGNvbnN0IG1hdGNoID0gaGVhZC5tYXRjaCgvXiNcXCt0aXRsZTpcXHMqKC4rKSQvbSk7XG4gICAgaWYgKG1hdGNoKSByZXR1cm4gbWF0Y2hbMV0udHJpbSgpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBmYWxsIHRocm91Z2hcbiAgfVxuICBjb25zdCBwYXJzZWQgPSBwYXJzZUZpbGVuYW1lKGZpbGVwYXRoKTtcbiAgcmV0dXJuIHBhcnNlZCA/IHBhcnNlZC50aXRsZSA6IGJhc2VuYW1lKGZpbGVwYXRoLCBcIi5vcmdcIik7XG59XG5cbi8qKiBPcGVuIGEgZmlsZSBpbiB0aGUgY29uZmlndXJlZCBlZGl0b3IgKi9cbmV4cG9ydCBmdW5jdGlvbiBvcGVuSW5FZGl0b3IoZWRpdG9yQ21kOiBzdHJpbmcsIGZpbGVwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgZXhlY1N5bmMoYCR7ZWRpdG9yQ21kfSBcIiR7ZmlsZXBhdGh9XCJgLCB7IHRpbWVvdXQ6IDUwMDAgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBdUY7QUFDdkYsbUJBQWlEO0FBQ2pELElBQUFBLHdCQUF5QjtBQUN6QixJQUFBQyxhQUEyQjs7O0FDSDNCLElBQUFDLGFBQXlDOzs7QUNBekMsMkJBQXlCO0FBQ3pCLGdCQUFnRjtBQUNoRixrQkFBK0I7QUFDL0IsZ0JBQXdCO0FBR2pCLFNBQVMsV0FBVyxHQUFtQjtBQUM1QyxTQUFPLEVBQUUsV0FBVyxHQUFHLElBQUksRUFBRSxRQUFRLFNBQUssbUJBQVEsQ0FBQyxJQUFJO0FBQ3pEO0FBR08sU0FBUyxtQkFBbUIsT0FBYSxvQkFBSSxLQUFLLEdBQVc7QUFDbEUsUUFBTSxNQUFNLENBQUMsTUFBYyxPQUFPLENBQUMsRUFBRSxTQUFTLEdBQUcsR0FBRztBQUNwRCxTQUNFLEdBQUcsS0FBSyxZQUFZLENBQUMsR0FBRyxJQUFJLEtBQUssU0FBUyxJ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QUssU0FBUztBQUFBO0FBQUEsVUFDaEQ7QUFBQSxVQUVGO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxPQUFNO0FBQUEsY0FDTixNQUFNLGdCQUFLO0FBQUEsY0FDWCxVQUFVLE1BQU0sZ0JBQWdCLEtBQUs7QUFBQSxjQUNyQyxVQUFVLEVBQUUsV0FBVyxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUk7QUFBQTtBQUFBLFVBQzNDO0FBQUEsVUFDQyxNQUFNLE9BQ0w7QUFBQSxZQUFDLGtCQUFPO0FBQUEsWUFBUDtBQUFBLGNBQ0MsT0FBTTtBQUFBLGNBQ04sS0FBSyxtQkFBbUIsTUFBTSxHQUFHO0FBQUEsY0FDakMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJO0FBQUE7QUFBQSxVQUMzQztBQUFBLFdBRUo7QUFBQTtBQUFBLE1BaENHLE1BQU07QUFBQSxJQWtDYjtBQUFBLEVBRUosQ0FBQyxHQUNIO0FBRUo7IiwKICAibmFtZXMiOiBbImltcG9ydF9jaGlsZF9wcm9jZXNzIiwgImltcG9ydF9mcyIsICJpbXBvcnRfZnMiXQp9Cg==
