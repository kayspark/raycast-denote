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
  const sorted = [...entries].sort((a, b) => b.year.localeCompare(a.year) || b.key.localeCompare(a.key));
  const filtered = query.trim() ? sorted.filter((e) => {
    const q = query.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.author.toLowerCase().includes(q) || e.year.includes(q) || e.key.toLowerCase().includes(q);
  }) : sorted.slice(0, 50);
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
          ...matchedNote ? [{ icon: import_api.Icon.Text, tooltip: "Has note" }] : []
        ],
        actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api.ActionPanel, { children: [
          hasPdf && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Action, { title: "Open PDF", icon: import_api.Icon.Document, onAction: () => openPdf(entry) }),
          matchedNote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_api.Action,
            {
              title: "Open Note in Emacs",
              icon: import_api.Icon.Text,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy9zZWFyY2gtcGFwZXJzLnRzeCIsICIuLi8uLi8uLi8uLi8uZG90ZmlsZXMvLmNvbmZpZy9yYXljYXN0L2V4dGVuc2lvbnMvcmF5Y2FzdC1kZW5vdGUvc3JjL3V0aWxzL2JpYnRleC50cyIsICIuLi8uLi8uLi8uLi8uZG90ZmlsZXMvLmNvbmZpZy9yYXljYXN0L2V4dGVuc2lvbnMvcmF5Y2FzdC1kZW5vdGUvc3JjL3V0aWxzL2Rlbm90ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQWN0aW9uLCBBY3Rpb25QYW5lbCwgTGlzdCwgZ2V0UHJlZmVyZW5jZVZhbHVlcywgc2hvd1RvYXN0LCBUb2FzdCwgSWNvbiB9IGZyb20gXCJAcmF5Y2FzdC9hcGlcIjtcbmltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZUNhbGxiYWNrIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBwYXJzZUJpYkZpbGUsIGV4dHJhY3RQZGZQYXRoLCBmb3JtYXRBdXRob3JzLCBnZXRWZW51ZSwgQmliRW50cnkgfSBmcm9tIFwiLi91dGlscy9iaWJ0ZXhcIjtcbmltcG9ydCB7IGNyZWF0ZU5vdGUsIHNjYW5Ob3Rlcywgb3BlbkluRWRpdG9yLCBEZW5vdGVGaWxlIH0gZnJvbSBcIi4vdXRpbHMvZGVub3RlXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIHBhcGVyc0Rpcjogc3RyaW5nO1xuICBiaWJGaWxlOiBzdHJpbmc7XG4gIGVkaXRvckNtZDogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTZWFyY2hQYXBlcnMoKSB7XG4gIGNvbnN0IHByZWZzID0gZ2V0UHJlZmVyZW5jZVZhbHVlczxQcmVmZXJlbmNlcz4oKTtcbiAgY29uc3QgW3F1ZXJ5LCBzZXRRdWVyeV0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW2VudHJpZXMsIHNldEVudHJpZXNdID0gdXNlU3RhdGU8QmliRW50cnlbXT4oW10pO1xuICBjb25zdCBbcGFwZXJOb3Rlcywgc2V0UGFwZXJOb3Rlc10gPSB1c2VTdGF0ZTxNYXA8c3RyaW5nLCBEZW5vdGVGaWxlPj4obmV3IE1hcCgpKTtcbiAgY29uc3QgW2lzTG9hZGluZywgc2V0SXNMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYmliID0gcGFyc2VCaWJGaWxlKHByZWZzLmJpYkZpbGUpO1xuICAgIHNldEVudHJpZXMoYmliKTtcblxuICAgIGNvbnN0IG5vdGVzID0gc2Nhbk5vdGVzKGAke3ByZWZzLnBhcGVyc0Rpcn0vbm90ZXNgKTtcbiAgICBjb25zdCBub3RlTWFwID0gbmV3IE1hcDxzdHJpbmcsIERlbm90ZUZpbGU+KCk7XG4gICAgZm9yIChjb25zdCBub3RlIG9mIG5vdGVzKSB7XG4gICAgICBub3RlTWFwLnNldChub3RlLnRpdGxlLnRvTG93ZXJDYXNlKCksIG5vdGUpO1xuICAgIH1cbiAgICBzZXRQYXBlck5vdGVzKG5vdGVNYXApO1xuICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBzb3J0ZWQgPSBbLi4uZW50cmllc10uc29ydCgoYSwgYikgPT4gYi55ZWFyLmxvY2FsZUNvbXBhcmUoYS55ZWFyKSB8fCBiLmtleS5sb2NhbGVDb21wYXJlKGEua2V5KSk7XG4gIGNvbnN0IGZpbHRlcmVkID0gcXVlcnkudHJpbSgpXG4gICAgPyBzb3J0ZWQuZmlsdGVyKChlKSA9PiB7XG4gICAgICAgIGNvbnN0IHEgPSBxdWVyeS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIGUudGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKSB8fFxuICAgICAgICAgIGUuYXV0aG9yLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkgfHxcbiAgICAgICAgICBlLnllYXIuaW5jbHVkZXMocSkgfHxcbiAgICAgICAgICBlLmtleS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpXG4gICAgICAgICk7XG4gICAgICB9KVxuICAgIDogc29ydGVkLnNsaWNlKDAsIDUwKTtcblxuICBjb25zdCBvcGVuUGRmID0gdXNlQ2FsbGJhY2soKGVudHJ5OiBCaWJFbnRyeSkgPT4ge1xuICAgIGNvbnN0IHBkZlBhdGggPSBleHRyYWN0UGRmUGF0aChlbnRyeS5maWxlKTtcbiAgICBpZiAocGRmUGF0aCAmJiBleGlzdHNTeW5jKHBkZlBhdGgpKSB7XG4gICAgICBleGVjU3luYyhgb3BlbiBcIiR7cGRmUGF0aH1cImAsIHsgdGltZW91dDogNTAwMCB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIlBERiBub3QgZm91bmRcIiwgbWVzc2FnZTogZW50cnkuZmlsZSB8fCBcIk5vIGZpbGUgZmllbGRcIiB9KTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICBjb25zdCBvcGVuTm90ZSA9IHVzZUNhbGxiYWNrKFxuICAgIChub3RlOiBEZW5vdGVGaWxlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBvcGVuSW5FZGl0b3IocHJlZnMuZWRpdG9yQ21kLCBub3RlLnBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIkZhaWxlZCB0byBvcGVuXCIsIG1lc3NhZ2U6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kXSxcbiAgKTtcblxuICBjb25zdCBjcmVhdGVQYXBlck5vdGUgPSB1c2VDYWxsYmFjayhcbiAgICAoZW50cnk6IEJpYkVudHJ5KSA9PiB7XG4gICAgICBjb25zdCB0YWdzID0gW1wicGFwZXJcIl07XG4gICAgICBjb25zdCBjb250ZW50ID0gYCogJHtlbnRyeS50aXRsZX1cXG5cXG4tIEF1dGhvciA6OiAke2VudHJ5LmF1dGhvcn1cXG4tIFllYXIgOjogJHtlbnRyeS55ZWFyfVxcbi0gS2V5IDo6ICR7ZW50cnkua2V5fVxcbmA7XG4gICAgICBjb25zdCBmaWxlcGF0aCA9IGNyZWF0ZU5vdGUoYCR7cHJlZnMucGFwZXJzRGlyfS9ub3Rlc2AsIGVudHJ5LnRpdGxlLCB0YWdzLCBjb250ZW50KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wZW5JbkVkaXRvcihwcmVmcy5lZGl0b3JDbWQsIGZpbGVwYXRoKTtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsIHRpdGxlOiBcIlBhcGVyIG5vdGUgY3JlYXRlZFwiIH0pO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHNob3dUb2FzdCh7IHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLCB0aXRsZTogXCJOb3RlIGNyZWF0ZWQgYnV0IGZhaWxlZCB0byBvcGVuXCIgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kLCBwcmVmcy5wYXBlcnNEaXJdLFxuICApO1xuXG4gIC8vIEZpbmQgbWF0Y2hpbmcgbm90ZSBmb3IgYSBiaWIgZW50cnlcbiAgY29uc3QgZmluZE5vdGUgPSAoZW50cnk6IEJpYkVudHJ5KTogRGVub3RlRmlsZSB8IHVuZGVmaW5lZCA9PiB7XG4gICAgY29uc3Qgd29yZHMgPSBlbnRyeS50aXRsZVxuICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgIC5yZXBsYWNlKC9bXmEtejAtOVxcc10vZywgXCJcIilcbiAgICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgICAuZmlsdGVyKCh3KSA9PiB3Lmxlbmd0aCA+IDMpXG4gICAgICAuc2xpY2UoMCwgNCk7XG4gICAgZm9yIChjb25zdCBba2V5LCBub3RlXSBvZiBwYXBlck5vdGVzKSB7XG4gICAgICBpZiAod29yZHMuZXZlcnkoKHcpID0+IGtleS5pbmNsdWRlcyh3KSkpIHJldHVybiBub3RlO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPExpc3QgaXNMb2FkaW5nPXtpc0xvYWRpbmd9IHNlYXJjaEJhclBsYWNlaG9sZGVyPVwiU2VhcmNoIHBhcGVycy4uLlwiIG9uU2VhcmNoVGV4dENoYW5nZT17c2V0UXVlcnl9IHRocm90dGxlPlxuICAgICAge2ZpbHRlcmVkLm1hcCgoZW50cnkpID0+IHtcbiAgICAgICAgY29uc3QgcGRmUGF0aCA9IGV4dHJhY3RQZGZQYXRoKGVudHJ5LmZpbGUpO1xuICAgICAgICBjb25zdCBoYXNQZGYgPSBwZGZQYXRoID8gZXhpc3RzU3luYyhwZGZQYXRoKSA6IGZhbHNlO1xuICAgICAgICBjb25zdCBtYXRjaGVkTm90ZSA9IGZpbmROb3RlKGVudHJ5KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxMaXN0Lkl0ZW1cbiAgICAgICAgICAgIGtleT17ZW50cnkua2V5fVxuICAgICAgICAgICAgdGl0bGU9e2VudHJ5LnRpdGxlIHx8IGVudHJ5LmtleX1cbiAgICAgICAgICAgIHN1YnRpdGxlPXtgJHtmb3JtYXRBdXRob3JzKGVudHJ5LmF1dGhvcil9ICgke2VudHJ5LnllYXJ9KWB9XG4gICAgICAgICAgICBhY2Nlc3Nvcmllcz17W1xuICAgICAgICAgICAgICB7IHRleHQ6IGdldFZlbnVlKGVudHJ5KSB9LFxuICAgICAgICAgICAgICAuLi4oaGFzUGRmID8gW3sgaWNvbjogSWNvbi5Eb2N1bWVudCwgdG9vbHRpcDogXCJQREYgYXZhaWxhYmxlXCIgfV0gOiBbXSksXG4gICAgICAgICAgICAgIC4uLihtYXRjaGVkTm90ZSA/IFt7IGljb246IEljb24uVGV4dCwgdG9vbHRpcDogXCJIYXMgbm90ZVwiIH1dIDogW10pLFxuICAgICAgICAgICAgXX1cbiAgICAgICAgICAgIGFjdGlvbnM9e1xuICAgICAgICAgICAgICA8QWN0aW9uUGFuZWw+XG4gICAgICAgICAgICAgICAge2hhc1BkZiAmJiA8QWN0aW9uIHRpdGxlPVwiT3BlbiBQREZcIiBpY29uPXtJY29uLkRvY3VtZW50fSBvbkFjdGlvbj17KCkgPT4gb3BlblBkZihlbnRyeSl9IC8+fVxuICAgICAgICAgICAgICAgIHttYXRjaGVkTm90ZSAmJiAoXG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiT3BlbiBOb3RlIGluIEVtYWNzXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5UZXh0fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gb3Blbk5vdGUobWF0Y2hlZE5vdGUpfVxuICAgICAgICAgICAgICAgICAgICBzaG9ydGN1dD17eyBtb2RpZmllcnM6IFtcImNtZFwiXSwga2V5OiBcInJldHVyblwiIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDcmVhdGUgUGFwZXIgTm90ZVwiXG4gICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlBsdXN9XG4gICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gY3JlYXRlUGFwZXJOb3RlKGVudHJ5KX1cbiAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY21kXCJdLCBrZXk6IFwiblwiIH19XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICB7ZW50cnkuZG9pICYmIChcbiAgICAgICAgICAgICAgICAgIDxBY3Rpb24uT3BlbkluQnJvd3NlclxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIk9wZW4gRE9JXCJcbiAgICAgICAgICAgICAgICAgICAgdXJsPXtgaHR0cHM6Ly9kb2kub3JnLyR7ZW50cnkuZG9pfWB9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY21kXCJdLCBrZXk6IFwiZFwiIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvQWN0aW9uUGFuZWw+XG4gICAgICAgICAgICB9XG4gICAgICAgICAgLz5cbiAgICAgICAgKTtcbiAgICAgIH0pfVxuICAgIDwvTGlzdD5cbiAgKTtcbn1cbiIsICJpbXBvcnQgeyByZWFkRmlsZVN5bmMsIGV4aXN0c1N5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGV4cGFuZFBhdGggfSBmcm9tIFwiLi9kZW5vdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBCaWJFbnRyeSB7XG4gIGtleTogc3RyaW5nO1xuICB0eXBlOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGF1dGhvcjogc3RyaW5nO1xuICB5ZWFyOiBzdHJpbmc7XG4gIGpvdXJuYWw/OiBzdHJpbmc7XG4gIGJvb2t0aXRsZT86IHN0cmluZztcbiAgZmlsZT86IHN0cmluZztcbiAgZG9pPzogc3RyaW5nO1xuICB1cmw/OiBzdHJpbmc7XG59XG5cbi8qKiBQYXJzZSBhIEJpYlRlWCBmaWxlIGludG8gZW50cmllcy4gTGlnaHR3ZWlnaHQgcmVnZXgtYmFzZWQgcGFyc2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQmliRmlsZShiaWJQYXRoOiBzdHJpbmcpOiBCaWJFbnRyeVtdIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGJpYlBhdGgpO1xuICBpZiAoIWV4aXN0c1N5bmMoZXhwYW5kZWQpKSByZXR1cm4gW107XG5cbiAgY29uc3QgY29udGVudCA9IHJlYWRGaWxlU3luYyhleHBhbmRlZCwgXCJ1dGYtOFwiKTtcbiAgY29uc3QgZW50cmllczogQmliRW50cnlbXSA9IFtdO1xuXG4gIC8vIE1hdGNoIGVhY2ggQHR5cGV7a2V5LCAuLi4gfSBibG9ja1xuICBjb25zdCBlbnRyeVJlZ2V4ID0gL0AoXFx3KylcXHsoW14sXSspLChbXkBdKj8pKD89XFxuQHxcXG4qJCkvZ3M7XG4gIGxldCBtYXRjaDtcblxuICB3aGlsZSAoKG1hdGNoID0gZW50cnlSZWdleC5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IFssIHR5cGUsIGtleSwgYm9keV0gPSBtYXRjaDtcbiAgICBpZiAodHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImNvbW1lbnRcIiB8fCB0eXBlLnRvTG93ZXJDYXNlKCkgPT09IFwicHJlYW1ibGVcIikgY29udGludWU7XG5cbiAgICBjb25zdCBnZXRGaWVsZCA9IChuYW1lOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgZmllbGRSZWdleCA9IG5ldyBSZWdFeHAoYCR7bmFtZX1cXFxccyo9XFxcXHMqW3tcIl0oLis/KVt9XCJdYCwgXCJzaVwiKTtcbiAgICAgIGNvbnN0IG0gPSBib2R5Lm1hdGNoKGZpZWxkUmVnZXgpO1xuICAgICAgcmV0dXJuIG0gPyBtWzFdLnJlcGxhY2UoL1t7fV0vZywgXCJcIikudHJpbSgpIDogXCJcIjtcbiAgICB9O1xuXG4gICAgZW50cmllcy5wdXNoKHtcbiAgICAgIGtleToga2V5LnRyaW0oKSxcbiAgICAgIHR5cGU6IHR5cGUudG9Mb3dlckNhc2UoKSxcbiAgICAgIHRpdGxlOiBnZXRGaWVsZChcInRpdGxlXCIpLFxuICAgICAgYXV0aG9yOiBnZXRGaWVsZChcImF1dGhvclwiKSxcbiAgICAgIHllYXI6IGdldEZpZWxkKFwieWVhclwiKSB8fCBnZXRGaWVsZChcImRhdGVcIik/LnNsaWNlKDAsIDQpIHx8IFwiXCIsXG4gICAgICBqb3VybmFsOiBnZXRGaWVsZChcImpvdXJuYWxcIikgfHwgdW5kZWZpbmVkLFxuICAgICAgYm9va3RpdGxlOiBnZXRGaWVsZChcImJvb2t0aXRsZVwiKSB8fCB1bmRlZmluZWQsXG4gICAgICBmaWxlOiBnZXRGaWVsZChcImZpbGVcIikgfHwgdW5kZWZpbmVkLFxuICAgICAgZG9pOiBnZXRGaWVsZChcImRvaVwiKSB8fCB1bmRlZmluZWQsXG4gICAgICB1cmw6IGdldEZpZWxkKFwidXJsXCIpIHx8IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG4vKiogRXh0cmFjdCBQREYgcGF0aCBmcm9tIGJpYiBmaWxlIGZpZWxkLiBIYW5kbGVzIFpvdGVyby1zdHlsZSBhbmQgcGxhaW4gcGF0aHMuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFBkZlBhdGgoZmlsZUZpZWxkOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFmaWxlRmllbGQpIHJldHVybiBudWxsO1xuICAvLyBab3Rlcm8gZm9ybWF0OiBcIkRlc2NyaXB0aW9uOnBhdGgvdG8vZmlsZS5wZGY6YXBwbGljYXRpb24vcGRmXCJcbiAgY29uc3QgcGFydHMgPSBmaWxlRmllbGQuc3BsaXQoXCI6XCIpO1xuICBpZiAocGFydHMubGVuZ3RoID49IDIpIHtcbiAgICAvLyBIYW5kbGUgYWJzb2x1dGUgcGF0aHMgd2l0aCBjb2xvbnMgKGUuZy4sIC9Vc2Vycy9rYXlwYXJrLy4uLilcbiAgICBjb25zdCBmdWxsUGF0aCA9IGZpbGVGaWVsZC5yZXBsYWNlKC9eW146XSo6LywgXCJcIikucmVwbGFjZSgvOmFwcGxpY2F0aW9uXFwvcGRmJC8sIFwiXCIpO1xuICAgIGlmIChmdWxsUGF0aC5lbmRzV2l0aChcIi5wZGZcIikpIHJldHVybiBleHBhbmRQYXRoKGZ1bGxQYXRoKTtcbiAgfVxuICAvLyBQbGFpbiBwYXRoXG4gIGlmIChmaWxlRmllbGQuZW5kc1dpdGgoXCIucGRmXCIpKSByZXR1cm4gZXhwYW5kUGF0aChmaWxlRmllbGQpO1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIEZvcm1hdCBhdXRob3IgbmFtZXMgZm9yIGRpc3BsYXk6IFwiTGFzdDEsIExhc3QyICYgTGFzdDNcIiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEF1dGhvcnMoYXV0aG9yOiBzdHJpbmcsIG1heEF1dGhvcnM6IG51bWJlciA9IDMpOiBzdHJpbmcge1xuICBpZiAoIWF1dGhvcikgcmV0dXJuIFwiVW5rbm93blwiO1xuICBjb25zdCBhdXRob3JzID0gYXV0aG9yLnNwbGl0KFwiIGFuZCBcIikubWFwKChhKSA9PiBhLnRyaW0oKSk7XG4gIGNvbnN0IGxhc3ROYW1lcyA9IGF1dGhvcnMubWFwKChhKSA9PiB7XG4gICAgY29uc3QgcGFydHMgPSBhLnNwbGl0KFwiLFwiKTtcbiAgICByZXR1cm4gcGFydHNbMF0udHJpbSgpO1xuICB9KTtcbiAgaWYgKGxhc3ROYW1lcy5sZW5ndGggPD0gbWF4QXV0aG9ycykgcmV0dXJuIGxhc3ROYW1lcy5qb2luKFwiLCBcIik7XG4gIHJldHVybiBgJHtsYXN0TmFtZXMuc2xpY2UoMCwgbWF4QXV0aG9ycykuam9pbihcIiwgXCIpfSBldCBhbC5gO1xufVxuXG4vKiogR2V0IHZlbnVlIHN0cmluZyAoam91cm5hbCBvciBjb25mZXJlbmNlKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFZlbnVlKGVudHJ5OiBCaWJFbnRyeSk6IHN0cmluZyB7XG4gIHJldHVybiBlbnRyeS5qb3VybmFsIHx8IGVudHJ5LmJvb2t0aXRsZSB8fCBlbnRyeS50eXBlIHx8IFwiXCI7XG59XG4iLCAiaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHsgcmVhZGRpclN5bmMsIHJlYWRGaWxlU3luYywgd3JpdGVGaWxlU3luYywgbWtkaXJTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBqb2luLCBiYXNlbmFtZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBob21lZGlyIH0gZnJvbSBcIm9zXCI7XG5cbi8qKiBFeHBhbmQgfiB0byBob21lIGRpcmVjdG9yeSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZFBhdGgocDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHAuc3RhcnRzV2l0aChcIn5cIikgPyBwLnJlcGxhY2UoXCJ+XCIsIGhvbWVkaXIoKSkgOiBwO1xufVxuXG4vKiogR2VuZXJhdGUgZGVub3RlIGlkZW50aWZpZXI6IFlZWVlNTUREVEhITU1TUyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlSWRlbnRpZmllcihkYXRlOiBEYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIGNvbnN0IHBhZCA9IChuOiBudW1iZXIpID0+IFN0cmluZyhuKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIHJldHVybiAoXG4gICAgYCR7ZGF0ZS5nZXRGdWxsWWVhcigpfSR7cGFkKGRhdGUuZ2V0TW9udGgoKSArIDEpfSR7cGFkKGRhdGUuZ2V0RGF0ZSgpKX1gICtcbiAgICBgVCR7cGFkKGRhdGUuZ2V0SG91cnMoKSl9JHtwYWQoZGF0ZS5nZXRNaW51dGVzKCkpfSR7cGFkKGRhdGUuZ2V0U2Vjb25kcygpKX1gXG4gICk7XG59XG5cbi8qKiBTbHVnaWZ5IHRpdGxlIGZvciBkZW5vdGUgZmlsZW5hbWU6IGxvd2VyY2FzZSwgc3BhY2VzIHRvIGh5cGhlbnMsIHN0cmlwIHNwZWNpYWwgY2hhcnMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzbHVnaWZ5KHRpdGxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGl0bGVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOVxccy1dL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoL1xccysvZywgXCItXCIpXG4gICAgLnJlcGxhY2UoLy0rL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC9eLXwtJC9nLCBcIlwiKTtcbn1cblxuLyoqIEZvcm1hdCBkYXRlIGZvciBvcmcgZnJvbnQgbWF0dGVyOiBbWVlZWS1NTS1ERCBEYXldICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0T3JnRGF0ZShkYXRlOiBEYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIGNvbnN0IGRheXMgPSBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIl07XG4gIGNvbnN0IHBhZCA9IChuOiBudW1iZXIpID0+IFN0cmluZyhuKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIHJldHVybiBgWyR7ZGF0ZS5nZXRGdWxsWWVhcigpfS0ke3BhZChkYXRlLmdldE1vbnRoKCkgKyAxKX0tJHtwYWQoZGF0ZS5nZXREYXRlKCkpfSAke2RheXNbZGF0ZS5nZXREYXkoKV19XWA7XG59XG5cbi8qKiBCdWlsZCBkZW5vdGUgZmlsZW5hbWUgKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZpbGVuYW1lKHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBkYXRlOiBEYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIGNvbnN0IGlkID0gZ2VuZXJhdGVJZGVudGlmaWVyKGRhdGUpO1xuICBjb25zdCBzbHVnID0gc2x1Z2lmeSh0aXRsZSk7XG4gIGNvbnN0IHRhZ1N1ZmZpeCA9IHRhZ3MubGVuZ3RoID4gMCA/IGBfXyR7dGFncy5qb2luKFwiX1wiKX1gIDogXCJcIjtcbiAgcmV0dXJuIGAke2lkfS0tJHtzbHVnfSR7dGFnU3VmZml4fS5vcmdgO1xufVxuXG4vKiogQnVpbGQgb3JnIGZyb250IG1hdHRlciAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRnJvbnRNYXR0ZXIodGl0bGU6IHN0cmluZywgdGFnczogc3RyaW5nW10sIGNvbnRlbnQ6IHN0cmluZyA9IFwiXCIpOiBzdHJpbmcge1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBpZCA9IGdlbmVyYXRlSWRlbnRpZmllcihub3cpO1xuICBjb25zdCB0YWdMaW5lID0gdGFncy5sZW5ndGggPiAwID8gYDoke3RhZ3Muam9pbihcIjpcIil9OmAgOiBcIlwiO1xuICBsZXQgdGV4dCA9IGAjK3RpdGxlOiAgICAgICR7dGl0bGV9XFxuYDtcbiAgdGV4dCArPSBgIytkYXRlOiAgICAgICAke2Zvcm1hdE9yZ0RhdGUobm93KX1cXG5gO1xuICB0ZXh0ICs9IGAjK2lkZW50aWZpZXI6ICR7aWR9XFxuYDtcbiAgaWYgKHRhZ0xpbmUpIHRleHQgKz0gYCMrZmlsZXRhZ3M6ICAgJHt0YWdMaW5lfVxcbmA7XG4gIHRleHQgKz0gYFxcbmA7XG4gIGlmIChjb250ZW50KSB0ZXh0ICs9IGAke2NvbnRlbnR9XFxuYDtcbiAgcmV0dXJuIHRleHQ7XG59XG5cbi8qKiBDcmVhdGUgYSBkZW5vdGUgbm90ZSBmaWxlLCByZXR1cm4gZnVsbCBwYXRoICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm90ZShkaXI6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdGFnczogc3RyaW5nW10sIGNvbnRlbnQ6IHN0cmluZyA9IFwiXCIpOiBzdHJpbmcge1xuICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgbWtkaXJTeW5jKGV4cGFuZGVkLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3QgaWQgPSBnZW5lcmF0ZUlkZW50aWZpZXIobm93KTtcbiAgY29uc3Qgc2x1ZyA9IHNsdWdpZnkodGl0bGUpO1xuICBjb25zdCB0YWdTdWZmaXggPSB0YWdzLmxlbmd0aCA+IDAgPyBgX18ke3RhZ3Muam9pbihcIl9cIil9YCA6IFwiXCI7XG4gIGNvbnN0IGZpbGVuYW1lID0gYCR7aWR9LS0ke3NsdWd9JHt0YWdTdWZmaXh9Lm9yZ2A7XG4gIGNvbnN0IGZpbGVwYXRoID0gam9pbihleHBhbmRlZCwgZmlsZW5hbWUpO1xuICBjb25zdCB0YWdMaW5lID0gdGFncy5sZW5ndGggPiAwID8gYDoke3RhZ3Muam9pbihcIjpcIil9OmAgOiBcIlwiO1xuICBsZXQgYm9keSA9IGAjK3RpdGxlOiAgICAgICR7dGl0bGV9XFxuYDtcbiAgYm9keSArPSBgIytkYXRlOiAgICAgICAke2Zvcm1hdE9yZ0RhdGUobm93KX1cXG5gO1xuICBib2R5ICs9IGAjK2lkZW50aWZpZXI6ICR7aWR9XFxuYDtcbiAgaWYgKHRhZ0xpbmUpIGJvZHkgKz0gYCMrZmlsZXRhZ3M6ICAgJHt0YWdMaW5lfVxcbmA7XG4gIGJvZHkgKz0gYFxcbmA7XG4gIGlmIChjb250ZW50KSBib2R5ICs9IGAke2NvbnRlbnR9XFxuYDtcbiAgd3JpdGVGaWxlU3luYyhmaWxlcGF0aCwgYm9keSwgXCJ1dGYtOFwiKTtcbiAgcmV0dXJuIGZpbGVwYXRoO1xufVxuXG4vKiogUGFyc2UgZGVub3RlIGZpbGVuYW1lIGludG8gY29tcG9uZW50cyAqL1xuZXhwb3J0IGludGVyZmFjZSBEZW5vdGVGaWxlIHtcbiAgcGF0aDogc3RyaW5nO1xuICBpZGVudGlmaWVyOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBkYXRlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZpbGVuYW1lKGZpbGVwYXRoOiBzdHJpbmcpOiBEZW5vdGVGaWxlIHwgbnVsbCB7XG4gIGNvbnN0IG5hbWUgPSBiYXNlbmFtZShmaWxlcGF0aCwgXCIub3JnXCIpO1xuICBjb25zdCBtYXRjaCA9IG5hbWUubWF0Y2goL14oXFxkezh9VFxcZHs2fSktLSguKz8pKD86X18oLispKT8kLyk7XG4gIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuICBjb25zdCBbLCBpZGVudGlmaWVyLCBzbHVnLCB0YWdTdHJdID0gbWF0Y2g7XG4gIHJldHVybiB7XG4gICAgcGF0aDogZmlsZXBhdGgsXG4gICAgaWRlbnRpZmllcixcbiAgICB0aXRsZTogc2x1Zy5yZXBsYWNlKC8tL2csIFwiIFwiKSxcbiAgICB0YWdzOiB0YWdTdHIgPyB0YWdTdHIuc3BsaXQoXCJfXCIpIDogW10sXG4gICAgZGF0ZTogYCR7aWRlbnRpZmllci5zbGljZSgwLCA0KX0tJHtpZGVudGlmaWVyLnNsaWNlKDQsIDYpfS0ke2lkZW50aWZpZXIuc2xpY2UoNiwgOCl9YCxcbiAgfTtcbn1cblxuLyoqIFNjYW4gYWxsIGRlbm90ZSBmaWxlcyBpbiBhIGRpcmVjdG9yeSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjYW5Ob3RlcyhkaXI6IHN0cmluZyk6IERlbm90ZUZpbGVbXSB7XG4gIGNvbnN0IGV4cGFuZGVkID0gZXhwYW5kUGF0aChkaXIpO1xuICBpZiAoIWV4aXN0c1N5bmMoZXhwYW5kZWQpKSByZXR1cm4gW107XG4gIHJldHVybiByZWFkZGlyU3luYyhleHBhbmRlZClcbiAgICAuZmlsdGVyKChmKSA9PiBmLmVuZHNXaXRoKFwiLm9yZ1wiKSAmJiAvXlxcZHs4fVRcXGR7Nn0tLS8udGVzdChmKSlcbiAgICAubWFwKChmKSA9PiBwYXJzZUZpbGVuYW1lKGpvaW4oZXhwYW5kZWQsIGYpKSlcbiAgICAuZmlsdGVyKChmKTogZiBpcyBEZW5vdGVGaWxlID0+IGYgIT09IG51bGwpXG4gICAgLnNvcnQoKGEsIGIpID0+IGIuaWRlbnRpZmllci5sb2NhbGVDb21wYXJlKGEuaWRlbnRpZmllcikpO1xufVxuXG4vKiogU2NhbiBhbGwgdW5pcXVlIHRhZ3MgZnJvbSBmaWxldGFncyBoZWFkZXJzIGFjcm9zcyBkaXJlY3RvcmllcyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjYW5UYWdzKGRpcnM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICBjb25zdCB0YWdzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgZGlyIG9mIGRpcnMpIHtcbiAgICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgICBpZiAoIWV4aXN0c1N5bmMoZXhwYW5kZWQpKSBjb250aW51ZTtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgb3V0cHV0ID0gZXhlY1N5bmMoXG4gICAgICAgIGByZyAtLW5vLWZpbGVuYW1lIC0tbm8tbGluZS1udW1iZXIgLW9QICdeI1xcXFwrZmlsZXRhZ3M6XFxcXHMqXFxcXEsuKycgLWcgJyoub3JnJyBcIiR7ZXhwYW5kZWR9XCJgLFxuICAgICAgICB7IGVuY29kaW5nOiBcInV0Zi04XCIsIHRpbWVvdXQ6IDUwMDAgfSxcbiAgICAgICk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2Ygb3V0cHV0LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgICAgIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcbiAgICAgICAgaWYgKCF0cmltbWVkKSBjb250aW51ZTtcbiAgICAgICAgLy8gZmlsZXRhZ3MgZm9ybWF0OiA6dGFnMTp0YWcyOnRhZzM6XG4gICAgICAgIGZvciAoY29uc3QgdCBvZiB0cmltbWVkLnNwbGl0KFwiOlwiKSkge1xuICAgICAgICAgIGNvbnN0IHRhZyA9IHQudHJpbSgpO1xuICAgICAgICAgIGlmICh0YWcpIHRhZ3MuYWRkKHRhZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIHJnIHJldHVybnMgZXhpdCAxIGlmIG5vIG1hdGNoZXNcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFsuLi50YWdzXS5zb3J0KCk7XG59XG5cbi8qKiBTZWFyY2ggbm90ZXMgd2l0aCByaXBncmVwLCByZXR1cm4gbWF0Y2hpbmcgZmlsZSBwYXRocyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlYXJjaE5vdGVzKGRpcnM6IHN0cmluZ1tdLCBxdWVyeTogc3RyaW5nKTogc3RyaW5nW10ge1xuICBpZiAoIXF1ZXJ5LnRyaW0oKSkgcmV0dXJuIFtdO1xuICBjb25zdCBwYXRocyA9IGRpcnMubWFwKGV4cGFuZFBhdGgpLmZpbHRlcihleGlzdHNTeW5jKTtcbiAgaWYgKHBhdGhzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdO1xuICB0cnkge1xuICAgIGNvbnN0IGVzY2FwZWRRdWVyeSA9IHF1ZXJ5LnJlcGxhY2UoL1snXCJcXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgICBjb25zdCBvdXRwdXQgPSBleGVjU3luYyhcbiAgICAgIGByZyAtbCAtaSAtLWdsb2IgJyoub3JnJyBcIiR7ZXNjYXBlZFF1ZXJ5fVwiICR7cGF0aHMubWFwKChwKSA9PiBgXCIke3B9XCJgKS5qb2luKFwiIFwiKX1gLFxuICAgICAgeyBlbmNvZGluZzogXCJ1dGYtOFwiLCB0aW1lb3V0OiAxMDAwMCB9LFxuICAgICk7XG4gICAgcmV0dXJuIG91dHB1dC5zcGxpdChcIlxcblwiKS5maWx0ZXIoQm9vbGVhbik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG4vKiogUmVhZCB0aGUgdGl0bGUgZnJvbSAjK3RpdGxlOiBoZWFkZXIsIGZhbGxpbmcgYmFjayB0byBmaWxlbmFtZSBzbHVnICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFRpdGxlKGZpbGVwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIGNvbnN0IGhlYWQgPSByZWFkRmlsZVN5bmMoZmlsZXBhdGgsIFwidXRmLThcIikuc2xpY2UoMCwgNTAwKTtcbiAgICBjb25zdCBtYXRjaCA9IGhlYWQubWF0Y2goL14jXFwrdGl0bGU6XFxzKiguKykkL20pO1xuICAgIGlmIChtYXRjaCkgcmV0dXJuIG1hdGNoWzFdLnRyaW0oKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gZmFsbCB0aHJvdWdoXG4gIH1cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VGaWxlbmFtZShmaWxlcGF0aCk7XG4gIHJldHVybiBwYXJzZWQgPyBwYXJzZWQudGl0bGUgOiBiYXNlbmFtZShmaWxlcGF0aCwgXCIub3JnXCIpO1xufVxuXG4vKiogU2VhcmNoIGNvbW1vbiBlbWFjc2NsaWVudCBsb2NhdGlvbnMgKE1hY1BvcnRzLCBIb21lYnJldywgRW1hY3MuYXBwLCBMaW51eCkgKi9cbmZ1bmN0aW9uIGZpbmRFbWFjc2NsaWVudCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgY2FuZGlkYXRlcyA9IFtcbiAgICBcIi9BcHBsaWNhdGlvbnMvTWFjUG9ydHMvRW1hY3MuYXBwL0NvbnRlbnRzL01hY09TL2Jpbi9lbWFjc2NsaWVudFwiLCAgLy8gTWFjUG9ydHNcbiAgICBcIi9BcHBsaWNhdGlvbnMvRW1hY3MuYXBwL0NvbnRlbnRzL01hY09TL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgLy8gRW1hY3MgZm9yIE1hYyBPUyBYXG4gICAgXCIvb3B0L2hvbWVicmV3L2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIb21lYnJldyBBUk1cbiAgICBcIi91c3IvbG9jYWwvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhvbWVicmV3IEludGVsIC8gTGludXhcbiAgICBcIi9vcHQvbG9jYWwvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hY1BvcnRzIENMSVxuICAgIFwiL3Vzci9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGludXggc3lzdGVtXG4gICAgXCIvc25hcC9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTbmFwXG4gIF07XG4gIHJldHVybiBjYW5kaWRhdGVzLmZpbmQoKHApID0+IGV4aXN0c1N5bmMocCkpIHx8IG51bGw7XG59XG5cbi8qKiBGaW5kIEVtYWNzIHNlcnZlciBzb2NrZXQgaW4gY29tbW9uIGxvY2F0aW9ucyAqL1xuZnVuY3Rpb24gZmluZFNvY2tldCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgY2FuZGlkYXRlcyA9IFtcbiAgICBqb2luKGhvbWVkaXIoKSwgXCIuY29uZmlnXCIsIFwiZW1hY3NcIiwgXCJzZXJ2ZXJcIiwgXCJzZXJ2ZXJcIiksICAgICAgICAgICAgIC8vIFhERyBjdXN0b21cbiAgICBqb2luKGhvbWVkaXIoKSwgXCIuZW1hY3MuZFwiLCBcInNlcnZlclwiLCBcInNlcnZlclwiKSwgICAgICAgICAgICAgICAgICAgICAvLyBUcmFkaXRpb25hbFxuICAgIGAvdG1wL2VtYWNzJHtwcm9jZXNzLmdldHVpZD8uKCkgPz8gNTAxfS9zZXJ2ZXJgLCAgICAgICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgKG1hY09TL0xpbnV4KVxuICBdO1xuICByZXR1cm4gY2FuZGlkYXRlcy5maW5kKChwKSA9PiBleGlzdHNTeW5jKHApKSB8fCBudWxsO1xufVxuXG4vKiogUmVzb2x2ZSBlbWFjc2NsaWVudDogZmluZCBmdWxsIHBhdGggKyBhZGQgc29ja2V0LW5hbWUgaWYgbmVlZGVkICovXG5mdW5jdGlvbiByZXNvbHZlRWRpdG9yQ21kKGVkaXRvckNtZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGNtZCA9IGVkaXRvckNtZDtcbiAgLy8gSWYgYmFyZSBcImVtYWNzY2xpZW50XCIsIHJlc29sdmUgdG8gZnVsbCBwYXRoXG4gIGlmIChjbWQuc3RhcnRzV2l0aChcImVtYWNzY2xpZW50IFwiKSB8fCBjbWQgPT09IFwiZW1hY3NjbGllbnRcIikge1xuICAgIGNvbnN0IGZ1bGxQYXRoID0gZmluZEVtYWNzY2xpZW50KCk7XG4gICAgaWYgKGZ1bGxQYXRoKSBjbWQgPSBjbWQucmVwbGFjZSgvXmVtYWNzY2xpZW50LywgZnVsbFBhdGgpO1xuICB9XG4gIC8vIEFkZCAtLXNvY2tldC1uYW1lIGlmIGVtYWNzY2xpZW50IGlzIHVzZWQgYnV0IHNvY2tldCBpc24ndCBzcGVjaWZpZWRcbiAgaWYgKGNtZC5pbmNsdWRlcyhcImVtYWNzY2xpZW50XCIpICYmICFjbWQuaW5jbHVkZXMoXCItLXNvY2tldC1uYW1lXCIpKSB7XG4gICAgY29uc3Qgc29ja2V0UGF0aCA9IGZpbmRTb2NrZXQoKTtcbiAgICBpZiAoc29ja2V0UGF0aCkgY21kICs9IGAgLS1zb2NrZXQtbmFtZT0ke3NvY2tldFBhdGh9YDtcbiAgfVxuICByZXR1cm4gY21kO1xufVxuXG4vKiogT3BlbiBhIGZpbGUgaW4gdGhlIGNvbmZpZ3VyZWQgZWRpdG9yICovXG5leHBvcnQgZnVuY3Rpb24gb3BlbkluRWRpdG9yKGVkaXRvckNtZDogc3RyaW5nLCBmaWxlcGF0aDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IFBBVEggPSBbXG4gICAgXCIvQXBwbGljYXRpb25zL01hY1BvcnRzL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW5cIixcbiAgICBcIi9BcHBsaWNhdGlvbnMvRW1hY3MuYXBwL0NvbnRlbnRzL01hY09TL2JpblwiLFxuICAgIFwiL29wdC9ob21lYnJldy9iaW5cIixcbiAgICBcIi9vcHQvbG9jYWwvYmluXCIsXG4gICAgXCIvdXNyL2xvY2FsL2JpblwiLFxuICAgIHByb2Nlc3MuZW52LlBBVEggfHwgXCJcIixcbiAgXS5qb2luKFwiOlwiKTtcbiAgY29uc3QgcmVzb2x2ZWQgPSByZXNvbHZlRWRpdG9yQ21kKGVkaXRvckNtZCk7XG4gIGV4ZWNTeW5jKGAke3Jlc29sdmVkfSBcIiR7ZmlsZXBhdGh9XCJgLCB7IHRpbWVvdXQ6IDUwMDAsIGVudjogeyAuLi5wcm9jZXNzLmVudiwgUEFUSCB9IH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQXVGO0FBQ3ZGLG1CQUFpRDtBQUNqRCxJQUFBQSx3QkFBeUI7QUFDekIsSUFBQUMsYUFBMkI7OztBQ0gzQixJQUFBQyxhQUF5Qzs7O0FDQXpDLDJCQUF5QjtBQUN6QixnQkFBZ0Y7QUFDaEYsa0JBQStCO0FBQy9CLGdCQUF3QjtBQUdqQixTQUFTLFdBQVcsR0FBbUI7QUFDNUMsU0FBTyxFQUFFLFdBQVcsR0FBRyxJQUFJLEVBQUUsUUFBUSxTQUFLLG1CQUFRLENBQUMsSUFBSTtBQUN6RDtBQUdPLFNBQVMsbUJBQW1CLE9BQWEsb0JBQUksS0FBSyxHQUFXO0FBQ2xFLFFBQU0sTUFBTSxDQUFDLE1BQWMsT0FBTyxDQUFDLEVBQUUsU0FBUyxHQUFHLEdBQUc7QUFDcEQsU0FDRSxHQUFHLEtBQUssWUFBWSxDQUFDLEdBQUcsSUFBSSxLQUFLLFNBQVMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsSUFDbEUsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLEdB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QUFNLFNBQVMsV0FBVztBQUFBLGNBQ3BDLFVBQVUsRUFBRSxXQUFXLENBQUMsS0FBSyxHQUFHLEtBQUssU0FBUztBQUFBO0FBQUEsVUFDaEQ7QUFBQSxVQUVGO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxPQUFNO0FBQUEsY0FDTixNQUFNLGdCQUFLO0FBQUEsY0FDWCxVQUFVLE1BQU0sZ0JBQWdCLEtBQUs7QUFBQSxjQUNyQyxVQUFVLEVBQUUsV0FBVyxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUk7QUFBQTtBQUFBLFVBQzNDO0FBQUEsVUFDQyxNQUFNLE9BQ0w7QUFBQSxZQUFDLGtCQUFPO0FBQUEsWUFBUDtBQUFBLGNBQ0MsT0FBTTtBQUFBLGNBQ04sS0FBSyxtQkFBbUIsTUFBTSxHQUFHO0FBQUEsY0FDakMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJO0FBQUE7QUFBQSxVQUMzQztBQUFBLFdBRUo7QUFBQTtBQUFBLE1BaENHLE1BQU07QUFBQSxJQWtDYjtBQUFBLEVBRUosQ0FBQyxHQUNIO0FBRUo7IiwKICAibmFtZXMiOiBbImltcG9ydF9jaGlsZF9wcm9jZXNzIiwgImltcG9ydF9mcyIsICJpbXBvcnRfZnMiXQp9Cg==
