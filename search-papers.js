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
  const child = (0, import_child_process.spawn)("/bin/sh", ["-c", `${resolved} "${filepath}"`], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, PATH }
  });
  child.unref();
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy9zZWFyY2gtcGFwZXJzLnRzeCIsICIuLi8uLi8uLi8uLi8uZG90ZmlsZXMvLmNvbmZpZy9yYXljYXN0L2V4dGVuc2lvbnMvcmF5Y2FzdC1kZW5vdGUvc3JjL3V0aWxzL2JpYnRleC50cyIsICIuLi8uLi8uLi8uLi8uZG90ZmlsZXMvLmNvbmZpZy9yYXljYXN0L2V4dGVuc2lvbnMvcmF5Y2FzdC1kZW5vdGUvc3JjL3V0aWxzL2Rlbm90ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQWN0aW9uLCBBY3Rpb25QYW5lbCwgTGlzdCwgZ2V0UHJlZmVyZW5jZVZhbHVlcywgc2hvd1RvYXN0LCBUb2FzdCwgSWNvbiB9IGZyb20gXCJAcmF5Y2FzdC9hcGlcIjtcbmltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZUNhbGxiYWNrIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBwYXJzZUJpYkZpbGUsIGV4dHJhY3RQZGZQYXRoLCBmb3JtYXRBdXRob3JzLCBnZXRWZW51ZSwgQmliRW50cnkgfSBmcm9tIFwiLi91dGlscy9iaWJ0ZXhcIjtcbmltcG9ydCB7IGNyZWF0ZU5vdGUsIHNjYW5Ob3Rlcywgb3BlbkluRWRpdG9yLCBEZW5vdGVGaWxlIH0gZnJvbSBcIi4vdXRpbHMvZGVub3RlXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIHBhcGVyc0Rpcjogc3RyaW5nO1xuICBiaWJGaWxlOiBzdHJpbmc7XG4gIGVkaXRvckNtZDogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTZWFyY2hQYXBlcnMoKSB7XG4gIGNvbnN0IHByZWZzID0gZ2V0UHJlZmVyZW5jZVZhbHVlczxQcmVmZXJlbmNlcz4oKTtcbiAgY29uc3QgW3F1ZXJ5LCBzZXRRdWVyeV0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW2VudHJpZXMsIHNldEVudHJpZXNdID0gdXNlU3RhdGU8QmliRW50cnlbXT4oW10pO1xuICBjb25zdCBbcGFwZXJOb3Rlcywgc2V0UGFwZXJOb3Rlc10gPSB1c2VTdGF0ZTxNYXA8c3RyaW5nLCBEZW5vdGVGaWxlPj4obmV3IE1hcCgpKTtcbiAgY29uc3QgW2lzTG9hZGluZywgc2V0SXNMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYmliID0gcGFyc2VCaWJGaWxlKHByZWZzLmJpYkZpbGUpO1xuICAgIHNldEVudHJpZXMoYmliKTtcblxuICAgIGNvbnN0IG5vdGVzID0gc2Nhbk5vdGVzKGAke3ByZWZzLnBhcGVyc0Rpcn0vbm90ZXNgKTtcbiAgICBjb25zdCBub3RlTWFwID0gbmV3IE1hcDxzdHJpbmcsIERlbm90ZUZpbGU+KCk7XG4gICAgZm9yIChjb25zdCBub3RlIG9mIG5vdGVzKSB7XG4gICAgICBub3RlTWFwLnNldChub3RlLnRpdGxlLnRvTG93ZXJDYXNlKCksIG5vdGUpO1xuICAgIH1cbiAgICBzZXRQYXBlck5vdGVzKG5vdGVNYXApO1xuICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBzb3J0ZWQgPSBbLi4uZW50cmllc10uc29ydCgoYSwgYikgPT4gYi55ZWFyLmxvY2FsZUNvbXBhcmUoYS55ZWFyKSB8fCBiLmtleS5sb2NhbGVDb21wYXJlKGEua2V5KSk7XG4gIGNvbnN0IGZpbHRlcmVkID0gcXVlcnkudHJpbSgpXG4gICAgPyBzb3J0ZWQuZmlsdGVyKChlKSA9PiB7XG4gICAgICAgIGNvbnN0IHEgPSBxdWVyeS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIGUudGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKSB8fFxuICAgICAgICAgIGUuYXV0aG9yLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkgfHxcbiAgICAgICAgICBlLnllYXIuaW5jbHVkZXMocSkgfHxcbiAgICAgICAgICBlLmtleS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpXG4gICAgICAgICk7XG4gICAgICB9KVxuICAgIDogc29ydGVkLnNsaWNlKDAsIDUwKTtcblxuICBjb25zdCBvcGVuUGRmID0gdXNlQ2FsbGJhY2soKGVudHJ5OiBCaWJFbnRyeSkgPT4ge1xuICAgIGNvbnN0IHBkZlBhdGggPSBleHRyYWN0UGRmUGF0aChlbnRyeS5maWxlKTtcbiAgICBpZiAocGRmUGF0aCAmJiBleGlzdHNTeW5jKHBkZlBhdGgpKSB7XG4gICAgICBleGVjU3luYyhgb3BlbiBcIiR7cGRmUGF0aH1cImAsIHsgdGltZW91dDogNTAwMCB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIlBERiBub3QgZm91bmRcIiwgbWVzc2FnZTogZW50cnkuZmlsZSB8fCBcIk5vIGZpbGUgZmllbGRcIiB9KTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICBjb25zdCBvcGVuTm90ZSA9IHVzZUNhbGxiYWNrKFxuICAgIChub3RlOiBEZW5vdGVGaWxlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBvcGVuSW5FZGl0b3IocHJlZnMuZWRpdG9yQ21kLCBub3RlLnBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIkZhaWxlZCB0byBvcGVuXCIsIG1lc3NhZ2U6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kXSxcbiAgKTtcblxuICBjb25zdCBjcmVhdGVQYXBlck5vdGUgPSB1c2VDYWxsYmFjayhcbiAgICAoZW50cnk6IEJpYkVudHJ5KSA9PiB7XG4gICAgICBjb25zdCB0YWdzID0gW1wicGFwZXJcIl07XG4gICAgICBjb25zdCBjb250ZW50ID0gYCogJHtlbnRyeS50aXRsZX1cXG5cXG4tIEF1dGhvciA6OiAke2VudHJ5LmF1dGhvcn1cXG4tIFllYXIgOjogJHtlbnRyeS55ZWFyfVxcbi0gS2V5IDo6ICR7ZW50cnkua2V5fVxcbmA7XG4gICAgICBjb25zdCBmaWxlcGF0aCA9IGNyZWF0ZU5vdGUoYCR7cHJlZnMucGFwZXJzRGlyfS9ub3Rlc2AsIGVudHJ5LnRpdGxlLCB0YWdzLCBjb250ZW50KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wZW5JbkVkaXRvcihwcmVmcy5lZGl0b3JDbWQsIGZpbGVwYXRoKTtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsIHRpdGxlOiBcIlBhcGVyIG5vdGUgY3JlYXRlZFwiIH0pO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHNob3dUb2FzdCh7IHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLCB0aXRsZTogXCJOb3RlIGNyZWF0ZWQgYnV0IGZhaWxlZCB0byBvcGVuXCIgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kLCBwcmVmcy5wYXBlcnNEaXJdLFxuICApO1xuXG4gIC8vIEZpbmQgbWF0Y2hpbmcgbm90ZSBmb3IgYSBiaWIgZW50cnlcbiAgY29uc3QgZmluZE5vdGUgPSAoZW50cnk6IEJpYkVudHJ5KTogRGVub3RlRmlsZSB8IHVuZGVmaW5lZCA9PiB7XG4gICAgY29uc3Qgd29yZHMgPSBlbnRyeS50aXRsZVxuICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgIC5yZXBsYWNlKC9bXmEtejAtOVxcc10vZywgXCJcIilcbiAgICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgICAuZmlsdGVyKCh3KSA9PiB3Lmxlbmd0aCA+IDMpXG4gICAgICAuc2xpY2UoMCwgNCk7XG4gICAgZm9yIChjb25zdCBba2V5LCBub3RlXSBvZiBwYXBlck5vdGVzKSB7XG4gICAgICBpZiAod29yZHMuZXZlcnkoKHcpID0+IGtleS5pbmNsdWRlcyh3KSkpIHJldHVybiBub3RlO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPExpc3QgaXNMb2FkaW5nPXtpc0xvYWRpbmd9IHNlYXJjaEJhclBsYWNlaG9sZGVyPVwiU2VhcmNoIHBhcGVycy4uLlwiIG9uU2VhcmNoVGV4dENoYW5nZT17c2V0UXVlcnl9IHRocm90dGxlPlxuICAgICAge2ZpbHRlcmVkLm1hcCgoZW50cnkpID0+IHtcbiAgICAgICAgY29uc3QgcGRmUGF0aCA9IGV4dHJhY3RQZGZQYXRoKGVudHJ5LmZpbGUpO1xuICAgICAgICBjb25zdCBoYXNQZGYgPSBwZGZQYXRoID8gZXhpc3RzU3luYyhwZGZQYXRoKSA6IGZhbHNlO1xuICAgICAgICBjb25zdCBtYXRjaGVkTm90ZSA9IGZpbmROb3RlKGVudHJ5KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxMaXN0Lkl0ZW1cbiAgICAgICAgICAgIGtleT17ZW50cnkua2V5fVxuICAgICAgICAgICAgdGl0bGU9e2VudHJ5LnRpdGxlIHx8IGVudHJ5LmtleX1cbiAgICAgICAgICAgIHN1YnRpdGxlPXtgJHtmb3JtYXRBdXRob3JzKGVudHJ5LmF1dGhvcil9ICgke2VudHJ5LnllYXJ9KWB9XG4gICAgICAgICAgICBhY2Nlc3Nvcmllcz17W1xuICAgICAgICAgICAgICB7IHRleHQ6IGdldFZlbnVlKGVudHJ5KSB9LFxuICAgICAgICAgICAgICAuLi4oaGFzUGRmID8gW3sgaWNvbjogSWNvbi5Eb2N1bWVudCwgdG9vbHRpcDogXCJQREYgYXZhaWxhYmxlXCIgfV0gOiBbXSksXG4gICAgICAgICAgICAgIC4uLihtYXRjaGVkTm90ZSA/IFt7IGljb246IEljb24uVGV4dCwgdG9vbHRpcDogXCJIYXMgbm90ZVwiIH1dIDogW10pLFxuICAgICAgICAgICAgXX1cbiAgICAgICAgICAgIGFjdGlvbnM9e1xuICAgICAgICAgICAgICA8QWN0aW9uUGFuZWw+XG4gICAgICAgICAgICAgICAge2hhc1BkZiAmJiA8QWN0aW9uIHRpdGxlPVwiT3BlbiBQREZcIiBpY29uPXtJY29uLkRvY3VtZW50fSBvbkFjdGlvbj17KCkgPT4gb3BlblBkZihlbnRyeSl9IC8+fVxuICAgICAgICAgICAgICAgIHttYXRjaGVkTm90ZSAmJiAoXG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiT3BlbiBOb3RlIGluIEVtYWNzXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5UZXh0fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gb3Blbk5vdGUobWF0Y2hlZE5vdGUpfVxuICAgICAgICAgICAgICAgICAgICBzaG9ydGN1dD17eyBtb2RpZmllcnM6IFtcImNtZFwiXSwga2V5OiBcInJldHVyblwiIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDcmVhdGUgUGFwZXIgTm90ZVwiXG4gICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlBsdXN9XG4gICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gY3JlYXRlUGFwZXJOb3RlKGVudHJ5KX1cbiAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY21kXCJdLCBrZXk6IFwiblwiIH19XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICB7ZW50cnkuZG9pICYmIChcbiAgICAgICAgICAgICAgICAgIDxBY3Rpb24uT3BlbkluQnJvd3NlclxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIk9wZW4gRE9JXCJcbiAgICAgICAgICAgICAgICAgICAgdXJsPXtgaHR0cHM6Ly9kb2kub3JnLyR7ZW50cnkuZG9pfWB9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY21kXCJdLCBrZXk6IFwiZFwiIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvQWN0aW9uUGFuZWw+XG4gICAgICAgICAgICB9XG4gICAgICAgICAgLz5cbiAgICAgICAgKTtcbiAgICAgIH0pfVxuICAgIDwvTGlzdD5cbiAgKTtcbn1cbiIsICJpbXBvcnQgeyByZWFkRmlsZVN5bmMsIGV4aXN0c1N5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGV4cGFuZFBhdGggfSBmcm9tIFwiLi9kZW5vdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBCaWJFbnRyeSB7XG4gIGtleTogc3RyaW5nO1xuICB0eXBlOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGF1dGhvcjogc3RyaW5nO1xuICB5ZWFyOiBzdHJpbmc7XG4gIGpvdXJuYWw/OiBzdHJpbmc7XG4gIGJvb2t0aXRsZT86IHN0cmluZztcbiAgZmlsZT86IHN0cmluZztcbiAgZG9pPzogc3RyaW5nO1xuICB1cmw/OiBzdHJpbmc7XG59XG5cbi8qKiBQYXJzZSBhIEJpYlRlWCBmaWxlIGludG8gZW50cmllcy4gTGlnaHR3ZWlnaHQgcmVnZXgtYmFzZWQgcGFyc2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQmliRmlsZShiaWJQYXRoOiBzdHJpbmcpOiBCaWJFbnRyeVtdIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGJpYlBhdGgpO1xuICBpZiAoIWV4aXN0c1N5bmMoZXhwYW5kZWQpKSByZXR1cm4gW107XG5cbiAgY29uc3QgY29udGVudCA9IHJlYWRGaWxlU3luYyhleHBhbmRlZCwgXCJ1dGYtOFwiKTtcbiAgY29uc3QgZW50cmllczogQmliRW50cnlbXSA9IFtdO1xuXG4gIC8vIE1hdGNoIGVhY2ggQHR5cGV7a2V5LCAuLi4gfSBibG9ja1xuICBjb25zdCBlbnRyeVJlZ2V4ID0gL0AoXFx3KylcXHsoW14sXSspLChbXkBdKj8pKD89XFxuQHxcXG4qJCkvZ3M7XG4gIGxldCBtYXRjaDtcblxuICB3aGlsZSAoKG1hdGNoID0gZW50cnlSZWdleC5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IFssIHR5cGUsIGtleSwgYm9keV0gPSBtYXRjaDtcbiAgICBpZiAodHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImNvbW1lbnRcIiB8fCB0eXBlLnRvTG93ZXJDYXNlKCkgPT09IFwicHJlYW1ibGVcIikgY29udGludWU7XG5cbiAgICBjb25zdCBnZXRGaWVsZCA9IChuYW1lOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgZmllbGRSZWdleCA9IG5ldyBSZWdFeHAoYCR7bmFtZX1cXFxccyo9XFxcXHMqW3tcIl0oLis/KVt9XCJdYCwgXCJzaVwiKTtcbiAgICAgIGNvbnN0IG0gPSBib2R5Lm1hdGNoKGZpZWxkUmVnZXgpO1xuICAgICAgcmV0dXJuIG0gPyBtWzFdLnJlcGxhY2UoL1t7fV0vZywgXCJcIikudHJpbSgpIDogXCJcIjtcbiAgICB9O1xuXG4gICAgZW50cmllcy5wdXNoKHtcbiAgICAgIGtleToga2V5LnRyaW0oKSxcbiAgICAgIHR5cGU6IHR5cGUudG9Mb3dlckNhc2UoKSxcbiAgICAgIHRpdGxlOiBnZXRGaWVsZChcInRpdGxlXCIpLFxuICAgICAgYXV0aG9yOiBnZXRGaWVsZChcImF1dGhvclwiKSxcbiAgICAgIHllYXI6IGdldEZpZWxkKFwieWVhclwiKSB8fCBnZXRGaWVsZChcImRhdGVcIik/LnNsaWNlKDAsIDQpIHx8IFwiXCIsXG4gICAgICBqb3VybmFsOiBnZXRGaWVsZChcImpvdXJuYWxcIikgfHwgdW5kZWZpbmVkLFxuICAgICAgYm9va3RpdGxlOiBnZXRGaWVsZChcImJvb2t0aXRsZVwiKSB8fCB1bmRlZmluZWQsXG4gICAgICBmaWxlOiBnZXRGaWVsZChcImZpbGVcIikgfHwgdW5kZWZpbmVkLFxuICAgICAgZG9pOiBnZXRGaWVsZChcImRvaVwiKSB8fCB1bmRlZmluZWQsXG4gICAgICB1cmw6IGdldEZpZWxkKFwidXJsXCIpIHx8IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG4vKiogRXh0cmFjdCBQREYgcGF0aCBmcm9tIGJpYiBmaWxlIGZpZWxkLiBIYW5kbGVzIFpvdGVyby1zdHlsZSBhbmQgcGxhaW4gcGF0aHMuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFBkZlBhdGgoZmlsZUZpZWxkOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFmaWxlRmllbGQpIHJldHVybiBudWxsO1xuICAvLyBab3Rlcm8gZm9ybWF0OiBcIkRlc2NyaXB0aW9uOnBhdGgvdG8vZmlsZS5wZGY6YXBwbGljYXRpb24vcGRmXCJcbiAgY29uc3QgcGFydHMgPSBmaWxlRmllbGQuc3BsaXQoXCI6XCIpO1xuICBpZiAocGFydHMubGVuZ3RoID49IDIpIHtcbiAgICAvLyBIYW5kbGUgYWJzb2x1dGUgcGF0aHMgd2l0aCBjb2xvbnMgKGUuZy4sIC9Vc2Vycy9rYXlwYXJrLy4uLilcbiAgICBjb25zdCBmdWxsUGF0aCA9IGZpbGVGaWVsZC5yZXBsYWNlKC9eW146XSo6LywgXCJcIikucmVwbGFjZSgvOmFwcGxpY2F0aW9uXFwvcGRmJC8sIFwiXCIpO1xuICAgIGlmIChmdWxsUGF0aC5lbmRzV2l0aChcIi5wZGZcIikpIHJldHVybiBleHBhbmRQYXRoKGZ1bGxQYXRoKTtcbiAgfVxuICAvLyBQbGFpbiBwYXRoXG4gIGlmIChmaWxlRmllbGQuZW5kc1dpdGgoXCIucGRmXCIpKSByZXR1cm4gZXhwYW5kUGF0aChmaWxlRmllbGQpO1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIEZvcm1hdCBhdXRob3IgbmFtZXMgZm9yIGRpc3BsYXk6IFwiTGFzdDEsIExhc3QyICYgTGFzdDNcIiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEF1dGhvcnMoYXV0aG9yOiBzdHJpbmcsIG1heEF1dGhvcnM6IG51bWJlciA9IDMpOiBzdHJpbmcge1xuICBpZiAoIWF1dGhvcikgcmV0dXJuIFwiVW5rbm93blwiO1xuICBjb25zdCBhdXRob3JzID0gYXV0aG9yLnNwbGl0KFwiIGFuZCBcIikubWFwKChhKSA9PiBhLnRyaW0oKSk7XG4gIGNvbnN0IGxhc3ROYW1lcyA9IGF1dGhvcnMubWFwKChhKSA9PiB7XG4gICAgY29uc3QgcGFydHMgPSBhLnNwbGl0KFwiLFwiKTtcbiAgICByZXR1cm4gcGFydHNbMF0udHJpbSgpO1xuICB9KTtcbiAgaWYgKGxhc3ROYW1lcy5sZW5ndGggPD0gbWF4QXV0aG9ycykgcmV0dXJuIGxhc3ROYW1lcy5qb2luKFwiLCBcIik7XG4gIHJldHVybiBgJHtsYXN0TmFtZXMuc2xpY2UoMCwgbWF4QXV0aG9ycykuam9pbihcIiwgXCIpfSBldCBhbC5gO1xufVxuXG4vKiogR2V0IHZlbnVlIHN0cmluZyAoam91cm5hbCBvciBjb25mZXJlbmNlKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFZlbnVlKGVudHJ5OiBCaWJFbnRyeSk6IHN0cmluZyB7XG4gIHJldHVybiBlbnRyeS5qb3VybmFsIHx8IGVudHJ5LmJvb2t0aXRsZSB8fCBlbnRyeS50eXBlIHx8IFwiXCI7XG59XG4iLCAiaW1wb3J0IHsgZXhlY1N5bmMsIHNwYXduIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHJlYWRkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMsIG1rZGlyU3luYywgZXhpc3RzU3luYyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgam9pbiwgYmFzZW5hbWUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgaG9tZWRpciB9IGZyb20gXCJvc1wiO1xuXG4vKiogRXhwYW5kIH4gdG8gaG9tZSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRQYXRoKHA6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwLnN0YXJ0c1dpdGgoXCJ+XCIpID8gcC5yZXBsYWNlKFwiflwiLCBob21lZGlyKCkpIDogcDtcbn1cblxuLyoqIEdlbmVyYXRlIGRlbm90ZSBpZGVudGlmaWVyOiBZWVlZTU1ERFRISE1NU1MgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUlkZW50aWZpZXIoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gKFxuICAgIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0ke3BhZChkYXRlLmdldE1vbnRoKCkgKyAxKX0ke3BhZChkYXRlLmdldERhdGUoKSl9YCArXG4gICAgYFQke3BhZChkYXRlLmdldEhvdXJzKCkpfSR7cGFkKGRhdGUuZ2V0TWludXRlcygpKX0ke3BhZChkYXRlLmdldFNlY29uZHMoKSl9YFxuICApO1xufVxuXG4vKiogU2x1Z2lmeSB0aXRsZSBmb3IgZGVub3RlIGZpbGVuYW1lOiBsb3dlcmNhc2UsIHNwYWNlcyB0byBoeXBoZW5zLCBzdHJpcCBzcGVjaWFsIGNoYXJzICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeSh0aXRsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRpdGxlXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHMtXS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC8tKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi18LSQvZywgXCJcIik7XG59XG5cbi8qKiBGb3JtYXQgZGF0ZSBmb3Igb3JnIGZyb250IG1hdHRlcjogW1lZWVktTU0tREQgRGF5XSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE9yZ0RhdGUoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBkYXlzID0gW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdO1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gYFske2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQoZGF0ZS5nZXRNb250aCgpICsgMSl9LSR7cGFkKGRhdGUuZ2V0RGF0ZSgpKX0gJHtkYXlzW2RhdGUuZ2V0RGF5KCldfV1gO1xufVxuXG4vKiogQnVpbGQgZGVub3RlIGZpbGVuYW1lICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGaWxlbmFtZSh0aXRsZTogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSwgZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBpZCA9IGdlbmVyYXRlSWRlbnRpZmllcihkYXRlKTtcbiAgY29uc3Qgc2x1ZyA9IHNsdWdpZnkodGl0bGUpO1xuICBjb25zdCB0YWdTdWZmaXggPSB0YWdzLmxlbmd0aCA+IDAgPyBgX18ke3RhZ3Muam9pbihcIl9cIil9YCA6IFwiXCI7XG4gIHJldHVybiBgJHtpZH0tLSR7c2x1Z30ke3RhZ1N1ZmZpeH0ub3JnYDtcbn1cblxuLyoqIEJ1aWxkIG9yZyBmcm9udCBtYXR0ZXIgKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZyb250TWF0dGVyKHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3QgaWQgPSBnZW5lcmF0ZUlkZW50aWZpZXIobm93KTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IHRleHQgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIHRleHQgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgdGV4dCArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSB0ZXh0ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICB0ZXh0ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgdGV4dCArPSBgJHtjb250ZW50fVxcbmA7XG4gIHJldHVybiB0ZXh0O1xufVxuXG4vKiogQ3JlYXRlIGEgZGVub3RlIG5vdGUgZmlsZSwgcmV0dXJuIGZ1bGwgcGF0aCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vdGUoZGlyOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gIGlmICghZXhpc3RzU3luYyhleHBhbmRlZCkpIG1rZGlyU3luYyhleHBhbmRlZCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGlkID0gZ2VuZXJhdGVJZGVudGlmaWVyKG5vdyk7XG4gIGNvbnN0IHNsdWcgPSBzbHVnaWZ5KHRpdGxlKTtcbiAgY29uc3QgdGFnU3VmZml4ID0gdGFncy5sZW5ndGggPiAwID8gYF9fJHt0YWdzLmpvaW4oXCJfXCIpfWAgOiBcIlwiO1xuICBjb25zdCBmaWxlbmFtZSA9IGAke2lkfS0tJHtzbHVnfSR7dGFnU3VmZml4fS5vcmdgO1xuICBjb25zdCBmaWxlcGF0aCA9IGpvaW4oZXhwYW5kZWQsIGZpbGVuYW1lKTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IGJvZHkgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIGJvZHkgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgYm9keSArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSBib2R5ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICBib2R5ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgYm9keSArPSBgJHtjb250ZW50fVxcbmA7XG4gIHdyaXRlRmlsZVN5bmMoZmlsZXBhdGgsIGJvZHksIFwidXRmLThcIik7XG4gIHJldHVybiBmaWxlcGF0aDtcbn1cblxuLyoqIFBhcnNlIGRlbm90ZSBmaWxlbmFtZSBpbnRvIGNvbXBvbmVudHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVub3RlRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgaWRlbnRpZmllcjogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgZGF0ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGaWxlbmFtZShmaWxlcGF0aDogc3RyaW5nKTogRGVub3RlRmlsZSB8IG51bGwge1xuICBjb25zdCBuYW1lID0gYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbiAgY29uc3QgbWF0Y2ggPSBuYW1lLm1hdGNoKC9eKFxcZHs4fVRcXGR7Nn0pLS0oLis/KSg/Ol9fKC4rKSk/JC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgWywgaWRlbnRpZmllciwgc2x1ZywgdGFnU3RyXSA9IG1hdGNoO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGZpbGVwYXRoLFxuICAgIGlkZW50aWZpZXIsXG4gICAgdGl0bGU6IHNsdWcucmVwbGFjZSgvLS9nLCBcIiBcIiksXG4gICAgdGFnczogdGFnU3RyID8gdGFnU3RyLnNwbGl0KFwiX1wiKSA6IFtdLFxuICAgIGRhdGU6IGAke2lkZW50aWZpZXIuc2xpY2UoMCwgNCl9LSR7aWRlbnRpZmllci5zbGljZSg0LCA2KX0tJHtpZGVudGlmaWVyLnNsaWNlKDYsIDgpfWAsXG4gIH07XG59XG5cbi8qKiBTY2FuIGFsbCBkZW5vdGUgZmlsZXMgaW4gYSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuTm90ZXMoZGlyOiBzdHJpbmcpOiBEZW5vdGVGaWxlW10ge1xuICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgcmV0dXJuIFtdO1xuICByZXR1cm4gcmVhZGRpclN5bmMoZXhwYW5kZWQpXG4gICAgLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aChcIi5vcmdcIikgJiYgL15cXGR7OH1UXFxkezZ9LS0vLnRlc3QoZikpXG4gICAgLm1hcCgoZikgPT4gcGFyc2VGaWxlbmFtZShqb2luKGV4cGFuZGVkLCBmKSkpXG4gICAgLmZpbHRlcigoZik6IGYgaXMgRGVub3RlRmlsZSA9PiBmICE9PSBudWxsKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbn1cblxuLyoqIFNjYW4gYWxsIHVuaXF1ZSB0YWdzIGZyb20gZmlsZXRhZ3MgaGVhZGVycyBhY3Jvc3MgZGlyZWN0b3JpZXMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuVGFncyhkaXJzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgdGFncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IGRpciBvZiBkaXJzKSB7XG4gICAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gICAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNTeW5jKFxuICAgICAgICBgcmcgLS1uby1maWxlbmFtZSAtLW5vLWxpbmUtbnVtYmVyIC1vUCAnXiNcXFxcK2ZpbGV0YWdzOlxcXFxzKlxcXFxLLisnIC1nICcqLm9yZycgXCIke2V4cGFuZGVkfVwiYCxcbiAgICAgICAgeyBlbmNvZGluZzogXCJ1dGYtOFwiLCB0aW1lb3V0OiA1MDAwIH0sXG4gICAgICApO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIG91dHB1dC5zcGxpdChcIlxcblwiKSkge1xuICAgICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XG4gICAgICAgIC8vIGZpbGV0YWdzIGZvcm1hdDogOnRhZzE6dGFnMjp0YWczOlxuICAgICAgICBmb3IgKGNvbnN0IHQgb2YgdHJpbW1lZC5zcGxpdChcIjpcIikpIHtcbiAgICAgICAgICBjb25zdCB0YWcgPSB0LnRyaW0oKTtcbiAgICAgICAgICBpZiAodGFnKSB0YWdzLmFkZCh0YWcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyByZyByZXR1cm5zIGV4aXQgMSBpZiBubyBtYXRjaGVzXG4gICAgfVxuICB9XG4gIHJldHVybiBbLi4udGFnc10uc29ydCgpO1xufVxuXG4vKiogU2VhcmNoIG5vdGVzIHdpdGggcmlwZ3JlcCwgcmV0dXJuIG1hdGNoaW5nIGZpbGUgcGF0aHMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWFyY2hOb3RlcyhkaXJzOiBzdHJpbmdbXSwgcXVlcnk6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgaWYgKCFxdWVyeS50cmltKCkpIHJldHVybiBbXTtcbiAgY29uc3QgcGF0aHMgPSBkaXJzLm1hcChleHBhbmRQYXRoKS5maWx0ZXIoZXhpc3RzU3luYyk7XG4gIGlmIChwYXRocy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgdHJ5IHtcbiAgICBjb25zdCBlc2NhcGVkUXVlcnkgPSBxdWVyeS5yZXBsYWNlKC9bJ1wiXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gICAgY29uc3Qgb3V0cHV0ID0gZXhlY1N5bmMoXG4gICAgICBgcmcgLWwgLWkgLS1nbG9iICcqLm9yZycgXCIke2VzY2FwZWRRdWVyeX1cIiAke3BhdGhzLm1hcCgocCkgPT4gYFwiJHtwfVwiYCkuam9pbihcIiBcIil9YCxcbiAgICAgIHsgZW5jb2Rpbmc6IFwidXRmLThcIiwgdGltZW91dDogMTAwMDAgfSxcbiAgICApO1xuICAgIHJldHVybiBvdXRwdXQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKEJvb2xlYW4pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuLyoqIFJlYWQgdGhlIHRpdGxlIGZyb20gIyt0aXRsZTogaGVhZGVyLCBmYWxsaW5nIGJhY2sgdG8gZmlsZW5hbWUgc2x1ZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRUaXRsZShmaWxlcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkID0gcmVhZEZpbGVTeW5jKGZpbGVwYXRoLCBcInV0Zi04XCIpLnNsaWNlKDAsIDUwMCk7XG4gICAgY29uc3QgbWF0Y2ggPSBoZWFkLm1hdGNoKC9eI1xcK3RpdGxlOlxccyooLispJC9tKTtcbiAgICBpZiAobWF0Y2gpIHJldHVybiBtYXRjaFsxXS50cmltKCk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIGZhbGwgdGhyb3VnaFxuICB9XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRmlsZW5hbWUoZmlsZXBhdGgpO1xuICByZXR1cm4gcGFyc2VkID8gcGFyc2VkLnRpdGxlIDogYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbn1cblxuLyoqIFNlYXJjaCBjb21tb24gZW1hY3NjbGllbnQgbG9jYXRpb25zIChNYWNQb3J0cywgSG9tZWJyZXcsIEVtYWNzLmFwcCwgTGludXgpICovXG5mdW5jdGlvbiBmaW5kRW1hY3NjbGllbnQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgXCIvQXBwbGljYXRpb25zL01hY1BvcnRzL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW4vZW1hY3NjbGllbnRcIiwgIC8vIE1hY1BvcnRzXG4gICAgXCIvQXBwbGljYXRpb25zL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgIC8vIEVtYWNzIGZvciBNYWMgT1MgWFxuICAgIFwiL29wdC9ob21lYnJldy9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG9tZWJyZXcgQVJNXG4gICAgXCIvdXNyL2xvY2FsL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIb21lYnJldyBJbnRlbCAvIExpbnV4XG4gICAgXCIvb3B0L2xvY2FsL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYWNQb3J0cyBDTElcbiAgICBcIi91c3IvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbnV4IHN5c3RlbVxuICAgIFwiL3NuYXAvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU25hcFxuICBdO1xuICByZXR1cm4gY2FuZGlkYXRlcy5maW5kKChwKSA9PiBleGlzdHNTeW5jKHApKSB8fCBudWxsO1xufVxuXG4vKiogRmluZCBFbWFjcyBzZXJ2ZXIgc29ja2V0IGluIGNvbW1vbiBsb2NhdGlvbnMgKi9cbmZ1bmN0aW9uIGZpbmRTb2NrZXQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgam9pbihob21lZGlyKCksIFwiLmNvbmZpZ1wiLCBcImVtYWNzXCIsIFwic2VydmVyXCIsIFwic2VydmVyXCIpLCAgICAgICAgICAgICAvLyBYREcgY3VzdG9tXG4gICAgam9pbihob21lZGlyKCksIFwiLmVtYWNzLmRcIiwgXCJzZXJ2ZXJcIiwgXCJzZXJ2ZXJcIiksICAgICAgICAgICAgICAgICAgICAgLy8gVHJhZGl0aW9uYWxcbiAgICBgL3RtcC9lbWFjcyR7cHJvY2Vzcy5nZXR1aWQ/LigpID8/IDUwMX0vc2VydmVyYCwgICAgICAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IChtYWNPUy9MaW51eClcbiAgXTtcbiAgcmV0dXJuIGNhbmRpZGF0ZXMuZmluZCgocCkgPT4gZXhpc3RzU3luYyhwKSkgfHwgbnVsbDtcbn1cblxuLyoqIFJlc29sdmUgZW1hY3NjbGllbnQ6IGZpbmQgZnVsbCBwYXRoICsgYWRkIHNvY2tldC1uYW1lIGlmIG5lZWRlZCAqL1xuZnVuY3Rpb24gcmVzb2x2ZUVkaXRvckNtZChlZGl0b3JDbWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBjbWQgPSBlZGl0b3JDbWQ7XG4gIC8vIElmIGJhcmUgXCJlbWFjc2NsaWVudFwiLCByZXNvbHZlIHRvIGZ1bGwgcGF0aFxuICBpZiAoY21kLnN0YXJ0c1dpdGgoXCJlbWFjc2NsaWVudCBcIikgfHwgY21kID09PSBcImVtYWNzY2xpZW50XCIpIHtcbiAgICBjb25zdCBmdWxsUGF0aCA9IGZpbmRFbWFjc2NsaWVudCgpO1xuICAgIGlmIChmdWxsUGF0aCkgY21kID0gY21kLnJlcGxhY2UoL15lbWFjc2NsaWVudC8sIGZ1bGxQYXRoKTtcbiAgfVxuICAvLyBBZGQgLS1zb2NrZXQtbmFtZSBpZiBlbWFjc2NsaWVudCBpcyB1c2VkIGJ1dCBzb2NrZXQgaXNuJ3Qgc3BlY2lmaWVkXG4gIGlmIChjbWQuaW5jbHVkZXMoXCJlbWFjc2NsaWVudFwiKSAmJiAhY21kLmluY2x1ZGVzKFwiLS1zb2NrZXQtbmFtZVwiKSkge1xuICAgIGNvbnN0IHNvY2tldFBhdGggPSBmaW5kU29ja2V0KCk7XG4gICAgaWYgKHNvY2tldFBhdGgpIGNtZCArPSBgIC0tc29ja2V0LW5hbWU9JHtzb2NrZXRQYXRofWA7XG4gIH1cbiAgcmV0dXJuIGNtZDtcbn1cblxuLyoqIE9wZW4gYSBmaWxlIGluIHRoZSBjb25maWd1cmVkIGVkaXRvciAoZmlyZS1hbmQtZm9yZ2V0LCBuZXZlciBibG9ja3MpICovXG5leHBvcnQgZnVuY3Rpb24gb3BlbkluRWRpdG9yKGVkaXRvckNtZDogc3RyaW5nLCBmaWxlcGF0aDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IFBBVEggPSBbXG4gICAgXCIvQXBwbGljYXRpb25zL01hY1BvcnRzL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW5cIixcbiAgICBcIi9BcHBsaWNhdGlvbnMvRW1hY3MuYXBwL0NvbnRlbnRzL01hY09TL2JpblwiLFxuICAgIFwiL29wdC9ob21lYnJldy9iaW5cIixcbiAgICBcIi9vcHQvbG9jYWwvYmluXCIsXG4gICAgXCIvdXNyL2xvY2FsL2JpblwiLFxuICAgIHByb2Nlc3MuZW52LlBBVEggfHwgXCJcIixcbiAgXS5qb2luKFwiOlwiKTtcbiAgY29uc3QgcmVzb2x2ZWQgPSByZXNvbHZlRWRpdG9yQ21kKGVkaXRvckNtZCk7XG4gIGNvbnN0IGNoaWxkID0gc3Bhd24oXCIvYmluL3NoXCIsIFtcIi1jXCIsIGAke3Jlc29sdmVkfSBcIiR7ZmlsZXBhdGh9XCJgXSwge1xuICAgIGRldGFjaGVkOiB0cnVlLFxuICAgIHN0ZGlvOiBcImlnbm9yZVwiLFxuICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgUEFUSCB9LFxuICB9KTtcbiAgY2hpbGQudW5yZWYoKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUF1RjtBQUN2RixtQkFBaUQ7QUFDakQsSUFBQUEsd0JBQXlCO0FBQ3pCLElBQUFDLGFBQTJCOzs7QUNIM0IsSUFBQUMsYUFBeUM7OztBQ0F6QywyQkFBZ0M7QUFDaEMsZ0JBQWdGO0FBQ2hGLGtCQUErQjtBQUMvQixnQkFBd0I7QUFHakIsU0FBUyxXQUFXLEdBQW1CO0FBQzVDLFNBQU8sRUFBRSxXQUFXLEdBQUcsSUFBSSxFQUFFLFFBQVEsU0FBSyxtQkFBUSxDQUFDLElBQUk7QUFDekQ7QUFHTyxTQUFTLG1CQUFtQixPQUFhLG9CQUFJLEtBQUssR0FBVztBQUNsRSxRQUFNLE1BQU0sQ0FBQyxNQUFjLE9BQU8sQ0FBQyxFQUFFLFNBQVMsR0FBRyxHQUFH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LElBQUksQ0FBQztBQUFBLFFBQ2xFO0FBQUEsUUFDQSxTQUNFLDZDQUFDLDBCQUNFO0FBQUEsb0JBQVUsNENBQUMscUJBQU8sT0FBTSxZQUFXLE1BQU0sZ0JBQUssVUFBVSxVQUFVLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFBQSxVQUN4RixlQUNDO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxPQUFNO0FBQUEsY0FDTixNQUFNLGdCQUFLO0FBQUEsY0FDWCxVQUFVLE1BQU0sU0FBUyxXQUFXO0FBQUEsY0FDcEMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxTQUFTO0FBQUE7QUFBQSxVQUNoRDtBQUFBLFVBRUY7QUFBQSxZQUFDO0FBQUE7QUFBQSxjQUNDLE9BQU07QUFBQSxjQUNOLE1BQU0sZ0JBQUs7QUFBQSxjQUNYLFVBQVUsTUFBTSxnQkFBZ0IsS0FBSztBQUFBLGNBQ3JDLFVBQVUsRUFBRSxXQUFXLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSTtBQUFBO0FBQUEsVUFDM0M7QUFBQSxVQUNDLE1BQU0sT0FDTDtBQUFBLFlBQUMsa0JBQU87QUFBQSxZQUFQO0FBQUEsY0FDQyxPQUFNO0FBQUEsY0FDTixLQUFLLG1CQUFtQixNQUFNLEdBQUc7QUFBQSxjQUNqQyxVQUFVLEVBQUUsV0FBVyxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUk7QUFBQTtBQUFBLFVBQzNDO0FBQUEsV0FFSjtBQUFBO0FBQUEsTUFoQ0csTUFBTTtBQUFBLElBa0NiO0FBQUEsRUFFSixDQUFDLEdBQ0g7QUFFSjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2NoaWxkX3Byb2Nlc3MiLCAiaW1wb3J0X2ZzIiwgImltcG9ydF9mcyJdCn0K
