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
function findEmacsclient() {
  const candidates = [
    "/Applications/MacPorts/Emacs.app/Contents/MacOS/bin/emacsclient",
    // MacPorts
    "/Applications/Emacs.app/Contents/MacOS/bin/emacsclient",
    // Emacs for Mac OS X
    "/opt/homebrew/bin/emacsclient",
    // Homebrew ARM
    "/usr/local/bin/emacsclient",
    // Homebrew Intel / Linux
    "/opt/local/bin/emacsclient",
    // MacPorts CLI
    "/usr/bin/emacsclient",
    // Linux system
    "/snap/bin/emacsclient"
    // Snap
  ];
  return candidates.find((p) => (0, import_fs.existsSync)(p)) || null;
}
function findSocket() {
  const candidates = [
    (0, import_path.join)((0, import_os.homedir)(), ".config", "emacs", "server", "server"),
    // XDG custom
    (0, import_path.join)((0, import_os.homedir)(), ".emacs.d", "server", "server"),
    // Traditional
    `/tmp/emacs${process.getuid?.() ?? 501}/server`
    // Default (macOS/Linux)
  ];
  return candidates.find((p) => (0, import_fs.existsSync)(p)) || null;
}
function resolveEditorCmd(editorCmd) {
  let cmd = editorCmd;
  if (cmd.startsWith("emacsclient ") || cmd === "emacsclient") {
    const fullPath = findEmacsclient();
    if (fullPath) cmd = cmd.replace(/^emacsclient/, fullPath);
  }
  if (cmd.includes("emacsclient") && !cmd.includes("--socket-name")) {
    const socketPath = findSocket();
    if (socketPath) cmd += ` --socket-name=${socketPath}`;
  }
  return cmd;
}
function openInEditor(editorCmd, filepath) {
  const PATH = [
    "/Applications/MacPorts/Emacs.app/Contents/MacOS/bin",
    "/Applications/Emacs.app/Contents/MacOS/bin",
    "/opt/homebrew/bin",
    "/opt/local/bin",
    "/usr/local/bin",
    process.env.PATH || ""
  ].join(":");
  const resolved = resolveEditorCmd(editorCmd);
  (0, import_child_process.execSync)(`${resolved} "${filepath}"`, { timeout: 5e3, env: { ...process.env, PATH } });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy9zZWFyY2gtcGFwZXJzLnRzeCIsICIuLi8uLi8uLi8uLi8uZG90ZmlsZXMvLmNvbmZpZy9yYXljYXN0L2V4dGVuc2lvbnMvcmF5Y2FzdC1kZW5vdGUvc3JjL3V0aWxzL2JpYnRleC50cyIsICIuLi8uLi8uLi8uLi8uZG90ZmlsZXMvLmNvbmZpZy9yYXljYXN0L2V4dGVuc2lvbnMvcmF5Y2FzdC1kZW5vdGUvc3JjL3V0aWxzL2Rlbm90ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQWN0aW9uLCBBY3Rpb25QYW5lbCwgTGlzdCwgZ2V0UHJlZmVyZW5jZVZhbHVlcywgc2hvd1RvYXN0LCBUb2FzdCwgSWNvbiB9IGZyb20gXCJAcmF5Y2FzdC9hcGlcIjtcbmltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZUNhbGxiYWNrIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBwYXJzZUJpYkZpbGUsIGV4dHJhY3RQZGZQYXRoLCBmb3JtYXRBdXRob3JzLCBnZXRWZW51ZSwgQmliRW50cnkgfSBmcm9tIFwiLi91dGlscy9iaWJ0ZXhcIjtcbmltcG9ydCB7IGNyZWF0ZU5vdGUsIGV4cGFuZFBhdGgsIHNjYW5Ob3Rlcywgb3BlbkluRWRpdG9yLCBEZW5vdGVGaWxlIH0gZnJvbSBcIi4vdXRpbHMvZGVub3RlXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIHBhcGVyc0Rpcjogc3RyaW5nO1xuICBiaWJGaWxlOiBzdHJpbmc7XG4gIGVkaXRvckNtZDogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTZWFyY2hQYXBlcnMoKSB7XG4gIGNvbnN0IHByZWZzID0gZ2V0UHJlZmVyZW5jZVZhbHVlczxQcmVmZXJlbmNlcz4oKTtcbiAgY29uc3QgW3F1ZXJ5LCBzZXRRdWVyeV0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW2VudHJpZXMsIHNldEVudHJpZXNdID0gdXNlU3RhdGU8QmliRW50cnlbXT4oW10pO1xuICBjb25zdCBbcGFwZXJOb3Rlcywgc2V0UGFwZXJOb3Rlc10gPSB1c2VTdGF0ZTxNYXA8c3RyaW5nLCBEZW5vdGVGaWxlPj4obmV3IE1hcCgpKTtcbiAgY29uc3QgW2lzTG9hZGluZywgc2V0SXNMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYmliID0gcGFyc2VCaWJGaWxlKHByZWZzLmJpYkZpbGUpO1xuICAgIHNldEVudHJpZXMoYmliKTtcblxuICAgIGNvbnN0IG5vdGVzID0gc2Nhbk5vdGVzKGAke3ByZWZzLnBhcGVyc0Rpcn0vbm90ZXNgKTtcbiAgICBjb25zdCBub3RlTWFwID0gbmV3IE1hcDxzdHJpbmcsIERlbm90ZUZpbGU+KCk7XG4gICAgZm9yIChjb25zdCBub3RlIG9mIG5vdGVzKSB7XG4gICAgICBub3RlTWFwLnNldChub3RlLnRpdGxlLnRvTG93ZXJDYXNlKCksIG5vdGUpO1xuICAgIH1cbiAgICBzZXRQYXBlck5vdGVzKG5vdGVNYXApO1xuICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBmaWx0ZXJlZCA9IHF1ZXJ5LnRyaW0oKVxuICAgID8gZW50cmllcy5maWx0ZXIoKGUpID0+IHtcbiAgICAgICAgY29uc3QgcSA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgZS50aXRsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpIHx8XG4gICAgICAgICAgZS5hdXRob3IudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKSB8fFxuICAgICAgICAgIGUueWVhci5pbmNsdWRlcyhxKSB8fFxuICAgICAgICAgIGUua2V5LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSlcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgOiBlbnRyaWVzLnNsaWNlKDAsIDUwKTtcblxuICBjb25zdCBvcGVuUGRmID0gdXNlQ2FsbGJhY2soKGVudHJ5OiBCaWJFbnRyeSkgPT4ge1xuICAgIGNvbnN0IHBkZlBhdGggPSBleHRyYWN0UGRmUGF0aChlbnRyeS5maWxlKTtcbiAgICBpZiAocGRmUGF0aCAmJiBleGlzdHNTeW5jKHBkZlBhdGgpKSB7XG4gICAgICBleGVjU3luYyhgb3BlbiBcIiR7cGRmUGF0aH1cImAsIHsgdGltZW91dDogNTAwMCB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIlBERiBub3QgZm91bmRcIiwgbWVzc2FnZTogZW50cnkuZmlsZSB8fCBcIk5vIGZpbGUgZmllbGRcIiB9KTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICBjb25zdCBvcGVuTm90ZSA9IHVzZUNhbGxiYWNrKFxuICAgIChub3RlOiBEZW5vdGVGaWxlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBvcGVuSW5FZGl0b3IocHJlZnMuZWRpdG9yQ21kLCBub3RlLnBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIkZhaWxlZCB0byBvcGVuXCIsIG1lc3NhZ2U6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kXSxcbiAgKTtcblxuICBjb25zdCBjcmVhdGVQYXBlck5vdGUgPSB1c2VDYWxsYmFjayhcbiAgICAoZW50cnk6IEJpYkVudHJ5KSA9PiB7XG4gICAgICBjb25zdCB0YWdzID0gW1wicGFwZXJcIl07XG4gICAgICBjb25zdCBjb250ZW50ID0gYCogJHtlbnRyeS50aXRsZX1cXG5cXG4tIEF1dGhvciA6OiAke2VudHJ5LmF1dGhvcn1cXG4tIFllYXIgOjogJHtlbnRyeS55ZWFyfVxcbi0gS2V5IDo6ICR7ZW50cnkua2V5fVxcbmA7XG4gICAgICBjb25zdCBmaWxlcGF0aCA9IGNyZWF0ZU5vdGUoYCR7cHJlZnMucGFwZXJzRGlyfS9ub3Rlc2AsIGVudHJ5LnRpdGxlLCB0YWdzLCBjb250ZW50KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wZW5JbkVkaXRvcihwcmVmcy5lZGl0b3JDbWQsIGZpbGVwYXRoKTtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsIHRpdGxlOiBcIlBhcGVyIG5vdGUgY3JlYXRlZFwiIH0pO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHNob3dUb2FzdCh7IHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLCB0aXRsZTogXCJOb3RlIGNyZWF0ZWQgYnV0IGZhaWxlZCB0byBvcGVuXCIgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kLCBwcmVmcy5wYXBlcnNEaXJdLFxuICApO1xuXG4gIC8vIEZpbmQgbWF0Y2hpbmcgbm90ZSBmb3IgYSBiaWIgZW50cnlcbiAgY29uc3QgZmluZE5vdGUgPSAoZW50cnk6IEJpYkVudHJ5KTogRGVub3RlRmlsZSB8IHVuZGVmaW5lZCA9PiB7XG4gICAgY29uc3Qgd29yZHMgPSBlbnRyeS50aXRsZVxuICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgIC5yZXBsYWNlKC9bXmEtejAtOVxcc10vZywgXCJcIilcbiAgICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgICAuZmlsdGVyKCh3KSA9PiB3Lmxlbmd0aCA+IDMpXG4gICAgICAuc2xpY2UoMCwgNCk7XG4gICAgZm9yIChjb25zdCBba2V5LCBub3RlXSBvZiBwYXBlck5vdGVzKSB7XG4gICAgICBpZiAod29yZHMuZXZlcnkoKHcpID0+IGtleS5pbmNsdWRlcyh3KSkpIHJldHVybiBub3RlO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPExpc3QgaXNMb2FkaW5nPXtpc0xvYWRpbmd9IHNlYXJjaEJhclBsYWNlaG9sZGVyPVwiU2VhcmNoIHBhcGVycy4uLlwiIG9uU2VhcmNoVGV4dENoYW5nZT17c2V0UXVlcnl9IHRocm90dGxlPlxuICAgICAge2ZpbHRlcmVkLm1hcCgoZW50cnkpID0+IHtcbiAgICAgICAgY29uc3QgcGRmUGF0aCA9IGV4dHJhY3RQZGZQYXRoKGVudHJ5LmZpbGUpO1xuICAgICAgICBjb25zdCBoYXNQZGYgPSBwZGZQYXRoID8gZXhpc3RzU3luYyhwZGZQYXRoKSA6IGZhbHNlO1xuICAgICAgICBjb25zdCBtYXRjaGVkTm90ZSA9IGZpbmROb3RlKGVudHJ5KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxMaXN0Lkl0ZW1cbiAgICAgICAgICAgIGtleT17ZW50cnkua2V5fVxuICAgICAgICAgICAgdGl0bGU9e2VudHJ5LnRpdGxlIHx8IGVudHJ5LmtleX1cbiAgICAgICAgICAgIHN1YnRpdGxlPXtgJHtmb3JtYXRBdXRob3JzKGVudHJ5LmF1dGhvcil9ICgke2VudHJ5LnllYXJ9KWB9XG4gICAgICAgICAgICBhY2Nlc3Nvcmllcz17W1xuICAgICAgICAgICAgICB7IHRleHQ6IGdldFZlbnVlKGVudHJ5KSB9LFxuICAgICAgICAgICAgICAuLi4oaGFzUGRmID8gW3sgaWNvbjogSWNvbi5Eb2N1bWVudCwgdG9vbHRpcDogXCJQREYgYXZhaWxhYmxlXCIgfV0gOiBbXSksXG4gICAgICAgICAgICAgIC4uLihtYXRjaGVkTm90ZSA/IFt7IGljb246IEljb24uVGV4dERvY3VtZW50LCB0b29sdGlwOiBcIkhhcyBub3RlXCIgfV0gOiBbXSksXG4gICAgICAgICAgICBdfVxuICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgIDxBY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgICB7aGFzUGRmICYmIDxBY3Rpb24gdGl0bGU9XCJPcGVuIFBERlwiIGljb249e0ljb24uRG9jdW1lbnR9IG9uQWN0aW9uPXsoKSA9PiBvcGVuUGRmKGVudHJ5KX0gLz59XG4gICAgICAgICAgICAgICAge21hdGNoZWROb3RlICYmIChcbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJPcGVuIE5vdGUgaW4gRW1hY3NcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlRleHREb2N1bWVudH1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IG9wZW5Ob3RlKG1hdGNoZWROb3RlKX1cbiAgICAgICAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjbWRcIl0sIGtleTogXCJyZXR1cm5cIiB9fVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ3JlYXRlIFBhcGVyIE5vdGVcIlxuICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5QbHVzfVxuICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGNyZWF0ZVBhcGVyTm90ZShlbnRyeSl9XG4gICAgICAgICAgICAgICAgICBzaG9ydGN1dD17eyBtb2RpZmllcnM6IFtcImNtZFwiXSwga2V5OiBcIm5cIiB9fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAge2VudHJ5LmRvaSAmJiAoXG4gICAgICAgICAgICAgICAgICA8QWN0aW9uLk9wZW5JbkJyb3dzZXJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJPcGVuIERPSVwiXG4gICAgICAgICAgICAgICAgICAgIHVybD17YGh0dHBzOi8vZG9pLm9yZy8ke2VudHJ5LmRvaX1gfVxuICAgICAgICAgICAgICAgICAgICBzaG9ydGN1dD17eyBtb2RpZmllcnM6IFtcImNtZFwiXSwga2V5OiBcImRcIiB9fVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L0FjdGlvblBhbmVsPlxuICAgICAgICAgICAgfVxuICAgICAgICAgIC8+XG4gICAgICAgICk7XG4gICAgICB9KX1cbiAgICA8L0xpc3Q+XG4gICk7XG59XG4iLCAiaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBleHBhbmRQYXRoIH0gZnJvbSBcIi4vZGVub3RlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmliRW50cnkge1xuICBrZXk6IHN0cmluZztcbiAgdHlwZTogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBhdXRob3I6IHN0cmluZztcbiAgeWVhcjogc3RyaW5nO1xuICBqb3VybmFsPzogc3RyaW5nO1xuICBib29rdGl0bGU/OiBzdHJpbmc7XG4gIGZpbGU/OiBzdHJpbmc7XG4gIGRvaT86IHN0cmluZztcbiAgdXJsPzogc3RyaW5nO1xufVxuXG4vKiogUGFyc2UgYSBCaWJUZVggZmlsZSBpbnRvIGVudHJpZXMuIExpZ2h0d2VpZ2h0IHJlZ2V4LWJhc2VkIHBhcnNlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUJpYkZpbGUoYmliUGF0aDogc3RyaW5nKTogQmliRW50cnlbXSB7XG4gIGNvbnN0IGV4cGFuZGVkID0gZXhwYW5kUGF0aChiaWJQYXRoKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IGNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZXhwYW5kZWQsIFwidXRmLThcIik7XG4gIGNvbnN0IGVudHJpZXM6IEJpYkVudHJ5W10gPSBbXTtcblxuICAvLyBNYXRjaCBlYWNoIEB0eXBle2tleSwgLi4uIH0gYmxvY2tcbiAgY29uc3QgZW50cnlSZWdleCA9IC9AKFxcdyspXFx7KFteLF0rKSwoW15AXSo/KSg/PVxcbkB8XFxuKiQpL2dzO1xuICBsZXQgbWF0Y2g7XG5cbiAgd2hpbGUgKChtYXRjaCA9IGVudHJ5UmVnZXguZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcbiAgICBjb25zdCBbLCB0eXBlLCBrZXksIGJvZHldID0gbWF0Y2g7XG4gICAgaWYgKHR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJjb21tZW50XCIgfHwgdHlwZS50b0xvd2VyQ2FzZSgpID09PSBcInByZWFtYmxlXCIpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgZ2V0RmllbGQgPSAobmFtZTogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkUmVnZXggPSBuZXcgUmVnRXhwKGAke25hbWV9XFxcXHMqPVxcXFxzKlt7XCJdKC4rPylbfVwiXWAsIFwic2lcIik7XG4gICAgICBjb25zdCBtID0gYm9keS5tYXRjaChmaWVsZFJlZ2V4KTtcbiAgICAgIHJldHVybiBtID8gbVsxXS5yZXBsYWNlKC9be31dL2csIFwiXCIpLnRyaW0oKSA6IFwiXCI7XG4gICAgfTtcblxuICAgIGVudHJpZXMucHVzaCh7XG4gICAgICBrZXk6IGtleS50cmltKCksXG4gICAgICB0eXBlOiB0eXBlLnRvTG93ZXJDYXNlKCksXG4gICAgICB0aXRsZTogZ2V0RmllbGQoXCJ0aXRsZVwiKSxcbiAgICAgIGF1dGhvcjogZ2V0RmllbGQoXCJhdXRob3JcIiksXG4gICAgICB5ZWFyOiBnZXRGaWVsZChcInllYXJcIikgfHwgZ2V0RmllbGQoXCJkYXRlXCIpPy5zbGljZSgwLCA0KSB8fCBcIlwiLFxuICAgICAgam91cm5hbDogZ2V0RmllbGQoXCJqb3VybmFsXCIpIHx8IHVuZGVmaW5lZCxcbiAgICAgIGJvb2t0aXRsZTogZ2V0RmllbGQoXCJib29rdGl0bGVcIikgfHwgdW5kZWZpbmVkLFxuICAgICAgZmlsZTogZ2V0RmllbGQoXCJmaWxlXCIpIHx8IHVuZGVmaW5lZCxcbiAgICAgIGRvaTogZ2V0RmllbGQoXCJkb2lcIikgfHwgdW5kZWZpbmVkLFxuICAgICAgdXJsOiBnZXRGaWVsZChcInVybFwiKSB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZW50cmllcztcbn1cblxuLyoqIEV4dHJhY3QgUERGIHBhdGggZnJvbSBiaWIgZmlsZSBmaWVsZC4gSGFuZGxlcyBab3Rlcm8tc3R5bGUgYW5kIHBsYWluIHBhdGhzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RQZGZQYXRoKGZpbGVGaWVsZDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghZmlsZUZpZWxkKSByZXR1cm4gbnVsbDtcbiAgLy8gWm90ZXJvIGZvcm1hdDogXCJEZXNjcmlwdGlvbjpwYXRoL3RvL2ZpbGUucGRmOmFwcGxpY2F0aW9uL3BkZlwiXG4gIGNvbnN0IHBhcnRzID0gZmlsZUZpZWxkLnNwbGl0KFwiOlwiKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA+PSAyKSB7XG4gICAgLy8gSGFuZGxlIGFic29sdXRlIHBhdGhzIHdpdGggY29sb25zIChlLmcuLCAvVXNlcnMva2F5cGFyay8uLi4pXG4gICAgY29uc3QgZnVsbFBhdGggPSBmaWxlRmllbGQucmVwbGFjZSgvXlteOl0qOi8sIFwiXCIpLnJlcGxhY2UoLzphcHBsaWNhdGlvblxcL3BkZiQvLCBcIlwiKTtcbiAgICBpZiAoZnVsbFBhdGguZW5kc1dpdGgoXCIucGRmXCIpKSByZXR1cm4gZXhwYW5kUGF0aChmdWxsUGF0aCk7XG4gIH1cbiAgLy8gUGxhaW4gcGF0aFxuICBpZiAoZmlsZUZpZWxkLmVuZHNXaXRoKFwiLnBkZlwiKSkgcmV0dXJuIGV4cGFuZFBhdGgoZmlsZUZpZWxkKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBGb3JtYXQgYXV0aG9yIG5hbWVzIGZvciBkaXNwbGF5OiBcIkxhc3QxLCBMYXN0MiAmIExhc3QzXCIgKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRBdXRob3JzKGF1dGhvcjogc3RyaW5nLCBtYXhBdXRob3JzOiBudW1iZXIgPSAzKTogc3RyaW5nIHtcbiAgaWYgKCFhdXRob3IpIHJldHVybiBcIlVua25vd25cIjtcbiAgY29uc3QgYXV0aG9ycyA9IGF1dGhvci5zcGxpdChcIiBhbmQgXCIpLm1hcCgoYSkgPT4gYS50cmltKCkpO1xuICBjb25zdCBsYXN0TmFtZXMgPSBhdXRob3JzLm1hcCgoYSkgPT4ge1xuICAgIGNvbnN0IHBhcnRzID0gYS5zcGxpdChcIixcIik7XG4gICAgcmV0dXJuIHBhcnRzWzBdLnRyaW0oKTtcbiAgfSk7XG4gIGlmIChsYXN0TmFtZXMubGVuZ3RoIDw9IG1heEF1dGhvcnMpIHJldHVybiBsYXN0TmFtZXMuam9pbihcIiwgXCIpO1xuICByZXR1cm4gYCR7bGFzdE5hbWVzLnNsaWNlKDAsIG1heEF1dGhvcnMpLmpvaW4oXCIsIFwiKX0gZXQgYWwuYDtcbn1cblxuLyoqIEdldCB2ZW51ZSBzdHJpbmcgKGpvdXJuYWwgb3IgY29uZmVyZW5jZSkgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRWZW51ZShlbnRyeTogQmliRW50cnkpOiBzdHJpbmcge1xuICByZXR1cm4gZW50cnkuam91cm5hbCB8fCBlbnRyeS5ib29rdGl0bGUgfHwgZW50cnkudHlwZSB8fCBcIlwiO1xufVxuIiwgImltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHJlYWRkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMsIG1rZGlyU3luYywgZXhpc3RzU3luYyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgam9pbiwgYmFzZW5hbWUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgaG9tZWRpciB9IGZyb20gXCJvc1wiO1xuXG4vKiogRXhwYW5kIH4gdG8gaG9tZSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRQYXRoKHA6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwLnN0YXJ0c1dpdGgoXCJ+XCIpID8gcC5yZXBsYWNlKFwiflwiLCBob21lZGlyKCkpIDogcDtcbn1cblxuLyoqIEdlbmVyYXRlIGRlbm90ZSBpZGVudGlmaWVyOiBZWVlZTU1ERFRISE1NU1MgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUlkZW50aWZpZXIoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gKFxuICAgIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0ke3BhZChkYXRlLmdldE1vbnRoKCkgKyAxKX0ke3BhZChkYXRlLmdldERhdGUoKSl9YCArXG4gICAgYFQke3BhZChkYXRlLmdldEhvdXJzKCkpfSR7cGFkKGRhdGUuZ2V0TWludXRlcygpKX0ke3BhZChkYXRlLmdldFNlY29uZHMoKSl9YFxuICApO1xufVxuXG4vKiogU2x1Z2lmeSB0aXRsZSBmb3IgZGVub3RlIGZpbGVuYW1lOiBsb3dlcmNhc2UsIHNwYWNlcyB0byBoeXBoZW5zLCBzdHJpcCBzcGVjaWFsIGNoYXJzICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeSh0aXRsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRpdGxlXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHMtXS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC8tKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi18LSQvZywgXCJcIik7XG59XG5cbi8qKiBGb3JtYXQgZGF0ZSBmb3Igb3JnIGZyb250IG1hdHRlcjogW1lZWVktTU0tREQgRGF5XSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE9yZ0RhdGUoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBkYXlzID0gW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdO1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gYFske2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQoZGF0ZS5nZXRNb250aCgpICsgMSl9LSR7cGFkKGRhdGUuZ2V0RGF0ZSgpKX0gJHtkYXlzW2RhdGUuZ2V0RGF5KCldfV1gO1xufVxuXG4vKiogQnVpbGQgZGVub3RlIGZpbGVuYW1lICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGaWxlbmFtZSh0aXRsZTogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSwgZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBpZCA9IGdlbmVyYXRlSWRlbnRpZmllcihkYXRlKTtcbiAgY29uc3Qgc2x1ZyA9IHNsdWdpZnkodGl0bGUpO1xuICBjb25zdCB0YWdTdWZmaXggPSB0YWdzLmxlbmd0aCA+IDAgPyBgX18ke3RhZ3Muam9pbihcIl9cIil9YCA6IFwiXCI7XG4gIHJldHVybiBgJHtpZH0tLSR7c2x1Z30ke3RhZ1N1ZmZpeH0ub3JnYDtcbn1cblxuLyoqIEJ1aWxkIG9yZyBmcm9udCBtYXR0ZXIgKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZyb250TWF0dGVyKHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3QgaWQgPSBnZW5lcmF0ZUlkZW50aWZpZXIobm93KTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IHRleHQgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIHRleHQgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgdGV4dCArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSB0ZXh0ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICB0ZXh0ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgdGV4dCArPSBgJHtjb250ZW50fVxcbmA7XG4gIHJldHVybiB0ZXh0O1xufVxuXG4vKiogQ3JlYXRlIGEgZGVub3RlIG5vdGUgZmlsZSwgcmV0dXJuIGZ1bGwgcGF0aCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vdGUoZGlyOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gIGlmICghZXhpc3RzU3luYyhleHBhbmRlZCkpIG1rZGlyU3luYyhleHBhbmRlZCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGlkID0gZ2VuZXJhdGVJZGVudGlmaWVyKG5vdyk7XG4gIGNvbnN0IHNsdWcgPSBzbHVnaWZ5KHRpdGxlKTtcbiAgY29uc3QgdGFnU3VmZml4ID0gdGFncy5sZW5ndGggPiAwID8gYF9fJHt0YWdzLmpvaW4oXCJfXCIpfWAgOiBcIlwiO1xuICBjb25zdCBmaWxlbmFtZSA9IGAke2lkfS0tJHtzbHVnfSR7dGFnU3VmZml4fS5vcmdgO1xuICBjb25zdCBmaWxlcGF0aCA9IGpvaW4oZXhwYW5kZWQsIGZpbGVuYW1lKTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IGJvZHkgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIGJvZHkgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgYm9keSArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSBib2R5ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICBib2R5ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgYm9keSArPSBgJHtjb250ZW50fVxcbmA7XG4gIHdyaXRlRmlsZVN5bmMoZmlsZXBhdGgsIGJvZHksIFwidXRmLThcIik7XG4gIHJldHVybiBmaWxlcGF0aDtcbn1cblxuLyoqIFBhcnNlIGRlbm90ZSBmaWxlbmFtZSBpbnRvIGNvbXBvbmVudHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVub3RlRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgaWRlbnRpZmllcjogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgZGF0ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGaWxlbmFtZShmaWxlcGF0aDogc3RyaW5nKTogRGVub3RlRmlsZSB8IG51bGwge1xuICBjb25zdCBuYW1lID0gYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbiAgY29uc3QgbWF0Y2ggPSBuYW1lLm1hdGNoKC9eKFxcZHs4fVRcXGR7Nn0pLS0oLis/KSg/Ol9fKC4rKSk/JC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgWywgaWRlbnRpZmllciwgc2x1ZywgdGFnU3RyXSA9IG1hdGNoO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGZpbGVwYXRoLFxuICAgIGlkZW50aWZpZXIsXG4gICAgdGl0bGU6IHNsdWcucmVwbGFjZSgvLS9nLCBcIiBcIiksXG4gICAgdGFnczogdGFnU3RyID8gdGFnU3RyLnNwbGl0KFwiX1wiKSA6IFtdLFxuICAgIGRhdGU6IGAke2lkZW50aWZpZXIuc2xpY2UoMCwgNCl9LSR7aWRlbnRpZmllci5zbGljZSg0LCA2KX0tJHtpZGVudGlmaWVyLnNsaWNlKDYsIDgpfWAsXG4gIH07XG59XG5cbi8qKiBTY2FuIGFsbCBkZW5vdGUgZmlsZXMgaW4gYSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuTm90ZXMoZGlyOiBzdHJpbmcpOiBEZW5vdGVGaWxlW10ge1xuICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgcmV0dXJuIFtdO1xuICByZXR1cm4gcmVhZGRpclN5bmMoZXhwYW5kZWQpXG4gICAgLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aChcIi5vcmdcIikgJiYgL15cXGR7OH1UXFxkezZ9LS0vLnRlc3QoZikpXG4gICAgLm1hcCgoZikgPT4gcGFyc2VGaWxlbmFtZShqb2luKGV4cGFuZGVkLCBmKSkpXG4gICAgLmZpbHRlcigoZik6IGYgaXMgRGVub3RlRmlsZSA9PiBmICE9PSBudWxsKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbn1cblxuLyoqIFNjYW4gYWxsIHVuaXF1ZSB0YWdzIGZyb20gZmlsZXRhZ3MgaGVhZGVycyBhY3Jvc3MgZGlyZWN0b3JpZXMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuVGFncyhkaXJzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgdGFncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IGRpciBvZiBkaXJzKSB7XG4gICAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gICAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNTeW5jKFxuICAgICAgICBgcmcgLS1uby1maWxlbmFtZSAtLW5vLWxpbmUtbnVtYmVyIC1vUCAnXiNcXFxcK2ZpbGV0YWdzOlxcXFxzKlxcXFxLLisnIC1nICcqLm9yZycgXCIke2V4cGFuZGVkfVwiYCxcbiAgICAgICAgeyBlbmNvZGluZzogXCJ1dGYtOFwiLCB0aW1lb3V0OiA1MDAwIH0sXG4gICAgICApO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIG91dHB1dC5zcGxpdChcIlxcblwiKSkge1xuICAgICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XG4gICAgICAgIC8vIGZpbGV0YWdzIGZvcm1hdDogOnRhZzE6dGFnMjp0YWczOlxuICAgICAgICBmb3IgKGNvbnN0IHQgb2YgdHJpbW1lZC5zcGxpdChcIjpcIikpIHtcbiAgICAgICAgICBjb25zdCB0YWcgPSB0LnRyaW0oKTtcbiAgICAgICAgICBpZiAodGFnKSB0YWdzLmFkZCh0YWcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyByZyByZXR1cm5zIGV4aXQgMSBpZiBubyBtYXRjaGVzXG4gICAgfVxuICB9XG4gIHJldHVybiBbLi4udGFnc10uc29ydCgpO1xufVxuXG4vKiogU2VhcmNoIG5vdGVzIHdpdGggcmlwZ3JlcCwgcmV0dXJuIG1hdGNoaW5nIGZpbGUgcGF0aHMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWFyY2hOb3RlcyhkaXJzOiBzdHJpbmdbXSwgcXVlcnk6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgaWYgKCFxdWVyeS50cmltKCkpIHJldHVybiBbXTtcbiAgY29uc3QgcGF0aHMgPSBkaXJzLm1hcChleHBhbmRQYXRoKS5maWx0ZXIoZXhpc3RzU3luYyk7XG4gIGlmIChwYXRocy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgdHJ5IHtcbiAgICBjb25zdCBlc2NhcGVkUXVlcnkgPSBxdWVyeS5yZXBsYWNlKC9bJ1wiXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gICAgY29uc3Qgb3V0cHV0ID0gZXhlY1N5bmMoXG4gICAgICBgcmcgLWwgLWkgLS1nbG9iICcqLm9yZycgXCIke2VzY2FwZWRRdWVyeX1cIiAke3BhdGhzLm1hcCgocCkgPT4gYFwiJHtwfVwiYCkuam9pbihcIiBcIil9YCxcbiAgICAgIHsgZW5jb2Rpbmc6IFwidXRmLThcIiwgdGltZW91dDogMTAwMDAgfSxcbiAgICApO1xuICAgIHJldHVybiBvdXRwdXQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKEJvb2xlYW4pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuLyoqIFJlYWQgdGhlIHRpdGxlIGZyb20gIyt0aXRsZTogaGVhZGVyLCBmYWxsaW5nIGJhY2sgdG8gZmlsZW5hbWUgc2x1ZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRUaXRsZShmaWxlcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkID0gcmVhZEZpbGVTeW5jKGZpbGVwYXRoLCBcInV0Zi04XCIpLnNsaWNlKDAsIDUwMCk7XG4gICAgY29uc3QgbWF0Y2ggPSBoZWFkLm1hdGNoKC9eI1xcK3RpdGxlOlxccyooLispJC9tKTtcbiAgICBpZiAobWF0Y2gpIHJldHVybiBtYXRjaFsxXS50cmltKCk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIGZhbGwgdGhyb3VnaFxuICB9XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRmlsZW5hbWUoZmlsZXBhdGgpO1xuICByZXR1cm4gcGFyc2VkID8gcGFyc2VkLnRpdGxlIDogYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbn1cblxuLyoqIFNlYXJjaCBjb21tb24gZW1hY3NjbGllbnQgbG9jYXRpb25zIChNYWNQb3J0cywgSG9tZWJyZXcsIEVtYWNzLmFwcCwgTGludXgpICovXG5mdW5jdGlvbiBmaW5kRW1hY3NjbGllbnQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgXCIvQXBwbGljYXRpb25zL01hY1BvcnRzL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW4vZW1hY3NjbGllbnRcIiwgIC8vIE1hY1BvcnRzXG4gICAgXCIvQXBwbGljYXRpb25zL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgIC8vIEVtYWNzIGZvciBNYWMgT1MgWFxuICAgIFwiL29wdC9ob21lYnJldy9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG9tZWJyZXcgQVJNXG4gICAgXCIvdXNyL2xvY2FsL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIb21lYnJldyBJbnRlbCAvIExpbnV4XG4gICAgXCIvb3B0L2xvY2FsL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYWNQb3J0cyBDTElcbiAgICBcIi91c3IvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbnV4IHN5c3RlbVxuICAgIFwiL3NuYXAvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU25hcFxuICBdO1xuICByZXR1cm4gY2FuZGlkYXRlcy5maW5kKChwKSA9PiBleGlzdHNTeW5jKHApKSB8fCBudWxsO1xufVxuXG4vKiogRmluZCBFbWFjcyBzZXJ2ZXIgc29ja2V0IGluIGNvbW1vbiBsb2NhdGlvbnMgKi9cbmZ1bmN0aW9uIGZpbmRTb2NrZXQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgam9pbihob21lZGlyKCksIFwiLmNvbmZpZ1wiLCBcImVtYWNzXCIsIFwic2VydmVyXCIsIFwic2VydmVyXCIpLCAgICAgICAgICAgICAvLyBYREcgY3VzdG9tXG4gICAgam9pbihob21lZGlyKCksIFwiLmVtYWNzLmRcIiwgXCJzZXJ2ZXJcIiwgXCJzZXJ2ZXJcIiksICAgICAgICAgICAgICAgICAgICAgLy8gVHJhZGl0aW9uYWxcbiAgICBgL3RtcC9lbWFjcyR7cHJvY2Vzcy5nZXR1aWQ/LigpID8/IDUwMX0vc2VydmVyYCwgICAgICAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IChtYWNPUy9MaW51eClcbiAgXTtcbiAgcmV0dXJuIGNhbmRpZGF0ZXMuZmluZCgocCkgPT4gZXhpc3RzU3luYyhwKSkgfHwgbnVsbDtcbn1cblxuLyoqIFJlc29sdmUgZW1hY3NjbGllbnQ6IGZpbmQgZnVsbCBwYXRoICsgYWRkIHNvY2tldC1uYW1lIGlmIG5lZWRlZCAqL1xuZnVuY3Rpb24gcmVzb2x2ZUVkaXRvckNtZChlZGl0b3JDbWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBjbWQgPSBlZGl0b3JDbWQ7XG4gIC8vIElmIGJhcmUgXCJlbWFjc2NsaWVudFwiLCByZXNvbHZlIHRvIGZ1bGwgcGF0aFxuICBpZiAoY21kLnN0YXJ0c1dpdGgoXCJlbWFjc2NsaWVudCBcIikgfHwgY21kID09PSBcImVtYWNzY2xpZW50XCIpIHtcbiAgICBjb25zdCBmdWxsUGF0aCA9IGZpbmRFbWFjc2NsaWVudCgpO1xuICAgIGlmIChmdWxsUGF0aCkgY21kID0gY21kLnJlcGxhY2UoL15lbWFjc2NsaWVudC8sIGZ1bGxQYXRoKTtcbiAgfVxuICAvLyBBZGQgLS1zb2NrZXQtbmFtZSBpZiBlbWFjc2NsaWVudCBpcyB1c2VkIGJ1dCBzb2NrZXQgaXNuJ3Qgc3BlY2lmaWVkXG4gIGlmIChjbWQuaW5jbHVkZXMoXCJlbWFjc2NsaWVudFwiKSAmJiAhY21kLmluY2x1ZGVzKFwiLS1zb2NrZXQtbmFtZVwiKSkge1xuICAgIGNvbnN0IHNvY2tldFBhdGggPSBmaW5kU29ja2V0KCk7XG4gICAgaWYgKHNvY2tldFBhdGgpIGNtZCArPSBgIC0tc29ja2V0LW5hbWU9JHtzb2NrZXRQYXRofWA7XG4gIH1cbiAgcmV0dXJuIGNtZDtcbn1cblxuLyoqIE9wZW4gYSBmaWxlIGluIHRoZSBjb25maWd1cmVkIGVkaXRvciAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5JbkVkaXRvcihlZGl0b3JDbWQ6IHN0cmluZywgZmlsZXBhdGg6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBQQVRIID0gW1xuICAgIFwiL0FwcGxpY2F0aW9ucy9NYWNQb3J0cy9FbWFjcy5hcHAvQ29udGVudHMvTWFjT1MvYmluXCIsXG4gICAgXCIvQXBwbGljYXRpb25zL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW5cIixcbiAgICBcIi9vcHQvaG9tZWJyZXcvYmluXCIsXG4gICAgXCIvb3B0L2xvY2FsL2JpblwiLFxuICAgIFwiL3Vzci9sb2NhbC9iaW5cIixcbiAgICBwcm9jZXNzLmVudi5QQVRIIHx8IFwiXCIsXG4gIF0uam9pbihcIjpcIik7XG4gIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZUVkaXRvckNtZChlZGl0b3JDbWQpO1xuICBleGVjU3luYyhgJHtyZXNvbHZlZH0gXCIke2ZpbGVwYXRofVwiYCwgeyB0aW1lb3V0OiA1MDAwLCBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIFBBVEggfSB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUF1RjtBQUN2RixtQkFBaUQ7QUFDakQsSUFBQUEsd0JBQXlCO0FBQ3pCLElBQUFDLGFBQTJCOzs7QUNIM0IsSUFBQUMsYUFBeUM7OztBQ0F6QywyQkFBeUI7QUFDekIsZ0JBQWdGO0FBQ2hGLGtCQUErQjtBQUMvQixnQkFBd0I7QUFHakIsU0FBUyxXQUFXLEdBQW1CO0FBQzVDLFNBQU8sRUFBRSxXQUFXLEdBQUcsSUFBSSxFQUFFLFFBQVEsU0FBSyxtQkFBUSxDQUFDLElBQUk7QUFDekQ7QUFHTyxTQUFTLG1CQUFtQixPQUFhLG9CQUFJLEtBQUssR0FBVztBQUNsRSxRQUFNLE1BQU0sQ0FBQyxNQUFjLE9BQU8sQ0FBQyxFQUFFLFNBQVMsR0FBRyxHQUFHO0FBQ3BELFNBQ0UsR0FBRyxLQUFLLFlBQVksQ0FBQyxHQUFHLElBQUksS0FBSyxTQUFTLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLElBQ2xFLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksS0FBSyxXQUFXLENBQUMsQ0FBQyxHQUFHLElBQUksS0FBSyxXQUFXLENBQUMsQ0FBQztBQUU5RTtBQUdPLFNBQVMsUUFB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TztBQUFBLEVBQ1Q7QUFFQSxTQUNFLDRDQUFDLG1CQUFLLFdBQXNCLHNCQUFxQixvQkFBbUIsb0JBQW9CLFVBQVUsVUFBUSxNQUN2RyxtQkFBUyxJQUFJLENBQUMsVUFBVTtBQUN2QixVQUFNLFVBQVUsZUFBZSxNQUFNLElBQUk7QUFDekMsVUFBTSxTQUFTLGNBQVUsdUJBQVcsT0FBTyxJQUFJO0FBQy9DLFVBQU0sY0FBYyxTQUFTLEtBQUs7QUFFbEMsV0FDRTtBQUFBLE1BQUMsZ0JBQUs7QUFBQSxNQUFMO0FBQUEsUUFFQyxPQUFPLE1BQU0sU0FBUyxNQUFNO0FBQUEsUUFDNUIsVUFBVSxHQUFHLGNBQWMsTUFBTSxNQUFNLENBQUMsS0FBSyxNQUFNLElBQUk7QUFBQSxRQUN2RCxhQUFhO0FBQUEsVUFDWCxFQUFFLE1BQU0sU0FBUyxLQUFLLEVBQUU7QUFBQSxVQUN4QixHQUFJLFNBQVMsQ0FBQyxFQUFFLE1BQU0sZ0JBQUssVUFBVSxTQUFTLGdCQUFnQixDQUFDLElBQUksQ0FBQztBQUFBLFVBQ3BFLEdBQUksY0FBYyxDQUFDLEVBQUUsTUFBTSxnQkFBSyxjQUFjLFNBQVMsV0FBVyxDQUFDLElBQUksQ0FBQztBQUFBLFFBQzFFO0FBQUEsUUFDQSxTQUNFLDZDQUFDLDBCQUNFO0FBQUEsb0JBQVUsNENBQUMscUJBQU8sT0FBTSxZQUFXLE1BQU0sZ0JBQUssVUFBVSxVQUFVLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFBQSxVQUN4RixlQUNDO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxPQUFNO0FBQUEsY0FDTixNQUFNLGdCQUFLO0FBQUEsY0FDWCxVQUFVLE1BQU0sU0FBUyxXQUFXO0FBQUEsY0FDcEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxTQUFTO0FBQUE7QUFBQSxVQUNoRDtBQUFBLFVBRUY7QUFBQSxZQUFDO0FBQUE7QUFBQSxjQUNDLE9BQU07QUFBQSxjQUNOLE1BQU0sZ0JBQUs7QUFBQSxjQUNYLFVBQVUsTUFBTSxnQkFBZ0IsS0FBSztBQUFBLGNBQ3JDLFVBQVUsRUFBRSxXQUFXLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSTtBQUFBO0FBQUEsVUFDM0M7QUFBQSxVQUNDLE1BQU0sT0FDTDtBQUFBLFlBQUMsa0JBQU87QUFBQSxZQUFQO0FBQUEsY0FDQyxPQUFNO0FBQUEsY0FDTixLQUFLLG1CQUFtQixNQUFNLEdBQUc7QUFBQSxjQUNqQyxVQUFVLEVBQUUsV0FBVyxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUk7QUFBQTtBQUFBLFVBQzNDO0FBQUEsV0FFSjtBQUFBO0FBQUEsTUFoQ0csTUFBTTtBQUFBLElBa0NiO0FBQUEsRUFFSixDQUFDLEdBQ0g7QUFFSjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2NoaWxkX3Byb2Nlc3MiLCAiaW1wb3J0X2ZzIiwgImltcG9ydF9mcyJdCn0K
